/**
 * @fileoverview Sistema de tentativas automáticas (retry) para chamadas à API do GitHub.
 *
 * O retryer tenta chamar a função de busca de dados com diferentes tokens PAT
 * em sequência, caso a chamada anterior falhe por rate limit ou credenciais inválidas.
 * Isso maximiza a disponibilidade do serviço quando múltiplos tokens estão configurados.
 */

import { CustomError } from "./error.js";
import { logger } from "./log.js";

// Conta quantos tokens PAT estão disponíveis nas variáveis de ambiente.
// Suporta PAT_1, PAT_2, PAT_3, etc.
const PATs = Object.keys(process.env).filter((key) =>
  /PAT_\d*$/.exec(key),
).length;

/**
 * Número máximo de tentativas.
 * Em testes, usa 7 tentativas fixas para simular múltiplos tokens.
 * Em produção, usa o número de tokens PAT configurados.
 */
const RETRIES = process.env.NODE_ENV === "test" ? 7 : PATs;

/**
 * Tipo da função de busca de dados que o retryer aceita.
 *
 * @param variables - Variáveis para a query GraphQL ou requisição REST.
 * @param token - Token PAT do GitHub a ser usado nesta tentativa.
 * @param retriesForTests - Número de tentativas atual (usado em testes para simular rate limit).
 */
export type FetcherFunction = (
  variables: any,
  token: string,
  retriesForTests?: number,
) => Promise<any>;

/**
 * Executa a função de busca com sistema de tentativas automáticas.
 *
 * Algoritmo:
 * 1. Tenta com o token `PAT_{retries+1}`.
 * 2. Se a resposta contiver rate limit, incrementa `retries` e tenta novamente.
 * 3. Se as credenciais forem inválidas ou a conta suspensa, tenta o próximo token.
 * 4. Lança `CustomError.MAX_RETRY` se todos os tokens falharem.
 *
 * @param fetcher - Função de busca de dados a ser executada.
 * @param variables - Variáveis para a função de busca.
 * @param retries - Número de tentativas já realizadas (não forneça manualmente).
 * @returns A resposta da função de busca quando bem-sucedida.
 * @throws {CustomError} Se nenhum token PAT estiver disponível (`NO_TOKENS`).
 * @throws {CustomError} Se todas as tentativas falharem (`MAX_RETRY`).
 *
 * @example
 * const dados = await retryer(fetcher, { login: "usuario" });
 */
const retryer = async (
  fetcher: FetcherFunction,
  variables: any,
  retries: number = 0,
): Promise<any> => {
  if (!RETRIES) {
    throw new CustomError(
      "Nenhum token da API do GitHub encontrado",
      CustomError.NO_TOKENS,
    );
  }

  if (retries > RETRIES) {
    throw new CustomError(
      "Serviço indisponível por limite de taxa da API do GitHub",
      CustomError.MAX_RETRY,
    );
  }

  try {
    let response = await fetcher(
      variables,
      process.env[`PAT_${retries + 1}`] as string,
      retries,
    );

    // Detecta sinais de rate limit tanto por tipo quanto por mensagem.
    // https://github.com/ramonsantos9/github-readme-stats/issues/4425
    const errors = response?.data?.errors;
    const errorType = errors?.[0]?.type;
    const errorMsg = errors?.[0]?.message || "";
    const isRateLimited =
      (errors && errorType === "RATE_LIMITED") || /rate limit/i.test(errorMsg);

    if (isRateLimited) {
      logger.log(`PAT_${retries + 1} falhou — limite de taxa atingido`);
      retries++;
      return retryer(fetcher, variables, retries);
    }

    return response;
  } catch (err) {
    const e = err as any;

    // Erros de rede ou inesperados — propaga para o chamador
    if (!e?.response) {
      throw e;
    }

    const isBadCredential = e?.response?.data?.message === "Bad credentials";
    const isAccountSuspended =
      e?.response?.data?.message === "Sorry. Your account was suspended.";

    if (isBadCredential || isAccountSuspended) {
      logger.log(
        `PAT_${retries + 1} falhou — credenciais inválidas ou conta suspensa`,
      );
      retries++;
      return retryer(fetcher, variables, retries);
    }

    // Erros HTTP com resposta — retorna para tratamento no chamador
    return e.response;
  }
};

export { retryer, RETRIES };
export default retryer;
