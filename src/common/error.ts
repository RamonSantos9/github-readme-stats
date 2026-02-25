/**
 * @fileoverview Classes de erro personalizadas do projeto.
 *
 * Define as classes de erro específicas do GitHub README Stats,
 * os tipos de erro disponíveis e mensagens secundárias de orientação.
 */

/**
 * Mensagem genérica para erros de serviços externos — orienta o usuário a tentar mais tarde.
 */
const TENTE_NOVAMENTE_MAIS_TARDE = "Por favor, tente novamente mais tarde";

/**
 * Mapa de tipos de erro para mensagens secundárias explicativas.
 *
 * Cada mensagem orienta o usuário sobre o que fazer ao encontrar o erro.
 */
const MENSAGENS_SECUNDARIAS_DE_ERRO: Record<string, string> = {
  MAX_RETRY:
    "Você pode fazer o deploy da sua própria instância ou aguardar até que a pública não esteja mais limitada",
  NO_TOKENS:
    "Por favor, adicione uma variável de ambiente chamada PAT_1 com seu token da API do GitHub no Vercel",
  USER_NOT_FOUND:
    "Certifique-se de que o nome de usuário fornecido não é uma organização",
  GRAPHQL_ERROR: TENTE_NOVAMENTE_MAIS_TARDE,
  GITHUB_REST_API_ERROR: TENTE_NOVAMENTE_MAIS_TARDE,
  WAKATIME_USER_NOT_FOUND:
    "Certifique-se de que você tem um perfil público no WakaTime",
};

/**
 * Erro personalizado para lidar com erros específicos do GitHub README Stats.
 *
 * Estende a classe `Error` nativa com um `type` para classificar o erro
 * e uma `secondaryMessage` para orientar o usuário com uma solução.
 *
 * @example
 * throw new CustomError("Usuário não encontrado.", CustomError.USER_NOT_FOUND);
 */
class CustomError extends Error {
  /** Tipo do erro (use as constantes estáticas desta classe). */
  type: string;

  /** Mensagem secundária de orientação ao usuário. */
  secondaryMessage: string;

  /** Tipo de erro: limite de taxa da API do GitHub atingido. */
  static MAX_RETRY = "MAX_RETRY";

  /** Tipo de erro: nenhum token de API do GitHub configurado. */
  static NO_TOKENS = "NO_TOKENS";

  /** Tipo de erro: usuário do GitHub não encontrado. */
  static USER_NOT_FOUND = "USER_NOT_FOUND";

  /** Tipo de erro: erro na API GraphQL do GitHub. */
  static GRAPHQL_ERROR = "GRAPHQL_ERROR";

  /** Tipo de erro: erro na API REST do GitHub. */
  static GITHUB_REST_API_ERROR = "GITHUB_REST_API_ERROR";

  /** Tipo de erro: erro na API do WakaTime. */
  static WAKATIME_ERROR = "WAKATIME_ERROR";

  /**
   * Cria um novo erro personalizado.
   *
   * @param message - Mensagem principal descrevendo o erro.
   * @param type - Tipo do erro. Use as constantes estáticas desta classe.
   */
  constructor(message: string, type: string) {
    super(message);
    this.type = type;
    this.secondaryMessage = MENSAGENS_SECUNDARIAS_DE_ERRO[type] || type;
  }
}

/**
 * Erro para parâmetros de query string obrigatórios ausentes.
 *
 * Lançado quando os parâmetros necessários não são fornecidos na URL da API.
 *
 * @example
 * throw new MissingParamError(["username"]);
 * // Mensagem: Missing params "username" make sure you pass the parameters in URL
 */
class MissingParamError extends Error {
  /** Lista dos parâmetros que estão faltando. */
  missedParams: string[];

  /** Mensagem secundária de orientação ao usuário. */
  secondaryMessage?: string;

  /**
   * Cria um erro de parâmetro ausente.
   *
   * @param missedParams - Array com os nomes dos parâmetros faltando.
   * @param secondaryMessage - Mensagem de suporte adicional opcional.
   */
  constructor(missedParams: string[], secondaryMessage?: string) {
    const msg = `Estão faltando parâmetros ${missedParams
      .map((p) => `"${p}"`)
      .join(", ")} certifique-se de passar os parâmetros na URL`;
    super(msg);
    this.missedParams = missedParams;
    this.secondaryMessage = secondaryMessage;
  }
}

/**
 * Extrai a mensagem secundária de um objeto de erro, se disponível.
 *
 * Verifica tipagem segura se a propriedade `secondaryMessage` existe e é uma string.
 *
 * @param err - O objeto de erro.
 * @returns A mensagem secundária ou `undefined` se não existir.
 *
 * @example
 * try { ... } catch (err) {
 *   const msgSecundaria = retrieveSecondaryMessage(err);
 * }
 */
const retrieveSecondaryMessage = (err: Error): string | undefined => {
  return "secondaryMessage" in err && typeof err.secondaryMessage === "string"
    ? err.secondaryMessage
    : undefined;
};

export {
  CustomError,
  MissingParamError,
  MENSAGENS_SECUNDARIAS_DE_ERRO as SECONDARY_ERROR_MESSAGES,
  TENTE_NOVAMENTE_MAIS_TARDE as TRY_AGAIN_LATER,
  retrieveSecondaryMessage,
};
