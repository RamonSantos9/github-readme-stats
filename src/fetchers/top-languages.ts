/**
 * @fileoverview Busca das linguagens de programação mais usadas no GitHub.
 *
 * Fornece a função `fetchTopLanguages` que busca as linguagens de programação
 * de todos os repositórios do usuário via API GraphQL do GitHub,
 * calculando o uso total em bytes com suporte a pesos configuráveis.
 */

import { retryer } from "../common/retryer.js";
import { logger } from "../common/log.js";
import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { wrapTextMultiline } from "../common/fmt.js";
import { request } from "../common/http.js";
import type { TopLangData } from "./types.js";

/**
 * Fetcher base para buscar as linguagens dos repositórios do usuário.
 *
 * @param variables - Variáveis GraphQL (deve conter `login`).
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios.
 */
const fetcher = (variables: Record<string, unknown>, token: string) => {
  return request(
    {
      query: `
      query userInfo($login: String!) {
        user(login: $login) {
          # Busca apenas repositórios do próprio usuário, sem forks
          repositories(ownerAffiliations: OWNER, isFork: false, first: 100) {
            nodes {
              name
              languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
                edges {
                  size
                  node {
                    color
                    name
                  }
                }
              }
            }
          }
        }
      }
      `,
      variables,
    },
    {
      Authorization: `token ${token}`,
    },
  );
};

/**
 * Busca e processa as linguagens mais usadas do perfil de um usuário do GitHub.
 *
 * **Algoritmo:**
 * 1. Busca todos os repositórios do usuário (não-forks) com suas linguagens.
 * 2. Agrega o total de bytes por linguagem de todos os repositórios.
 * 3. Aplica pesos de tamanho (`size_weight`) e contagem (`count_weight`).
 * 4. Ordena as linguagens pelo índice ponderado (maior = mais usada).
 *
 * @param username - Nome de usuário do GitHub.
 * @param exclude_repo - Repositórios a excluir da análise.
 * @param size_weight - Peso para o tamanho em bytes (padrão: 1).
 * @param count_weight - Peso para a quantidade de repositórios (padrão: 0).
 * @returns Promise com o mapa de linguagens ordenado por uso.
 * @throws {MissingParamError} Se `username` não for fornecido.
 * @throws {CustomError} Em caso de erros da API do GitHub.
 *
 * @example
 * // Usar apenas tamanho em bytes para ordenação
 * const langs = await fetchTopLanguages("ramonsantos9");
 *
 * // Ponderar também pela quantidade de repositórios
 * const langs = await fetchTopLanguages("ramonsantos9", [], 1, 1);
 */
const fetchTopLanguages = async (
  username: string,
  exclude_repo: string[] = [],
  size_weight: number = 1,
  count_weight: number = 0,
): Promise<TopLangData> => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const res = await retryer(fetcher, { login: username });

  if (res.data.errors) {
    logger.error(res.data.errors);
    if (res.data.errors[0].type === "NOT_FOUND") {
      throw new CustomError(
        res.data.errors[0].message || "Não foi possível buscar o usuário.",
        CustomError.USER_NOT_FOUND,
      );
    }
    if (res.data.errors[0].message) {
      throw new CustomError(
        wrapTextMultiline(res.data.errors[0].message, 90, 1)[0],
        res.statusText,
      );
    }
    throw new CustomError(
      "Ocorreu um erro ao buscar os dados de linguagens via GraphQL.",
      CustomError.GRAPHQL_ERROR,
    );
  }

  // Tipo de um nó de repositório retornado pela API
  type RepoNode = {
    name: string;
    size?: number;
    languages: {
      edges: {
        size: number;
        node: { color: string; name: string };
      }[];
    };
  };

  // Tipo de uma entrada de linguagem durante o processamento
  type LangEntry = {
    name: string;
    color: string;
    size: number;
    count: number;
  };

  let repoNodes: RepoNode[] = res.data.data.user.repositories.nodes;
  const repoToHide: Record<string, boolean> = {};
  const allExcludedRepos = [...exclude_repo, ...excludeRepositories];

  // Monta um mapa de repositórios a ocultar para busca O(1)
  if (allExcludedRepos.length) {
    allExcludedRepos.forEach((repoName) => {
      repoToHide[repoName] = true;
    });
  }

  // Filtra os repositórios a ocultar, ordenando por tamanho
  repoNodes = repoNodes
    .sort((a, b) => (b.size ?? 0) - (a.size ?? 0))
    .filter((node) => !repoToHide[node.name]);

  let repoCount = 0;

  // Agrega as linguagens de todos os repositórios
  const langNodes: Record<string, LangEntry> = repoNodes
    .filter((node) => node.languages.edges.length > 0)
    .reduce(
      (acc: RepoNode["languages"]["edges"], curr: RepoNode) =>
        curr.languages.edges.concat(acc),
      [] as RepoNode["languages"]["edges"],
    )
    .reduce(
      (
        acc: Record<string, LangEntry>,
        prev: { size: number; node: { color: string; name: string } },
      ) => {
        let langSize = prev.size;

        if (
          acc[prev.node.name] &&
          prev.node.name === acc[prev.node.name].name
        ) {
          langSize = prev.size + acc[prev.node.name].size;
          repoCount += 1;
        } else {
          repoCount = 1;
        }

        return {
          ...acc,
          [prev.node.name]: {
            name: prev.node.name,
            color: prev.node.color,
            size: langSize,
            count: repoCount,
          },
        };
      },
      {},
    );

  // Aplica os pesos configuráveis (tamanho e contagem de repositórios)
  Object.keys(langNodes).forEach((name) => {
    langNodes[name].size =
      Math.pow(langNodes[name].size, size_weight) *
      Math.pow(langNodes[name].count, count_weight);
  });

  // Ordena por índice ponderado e converte para TopLangData
  const topLangs: TopLangData = Object.keys(langNodes)
    .sort((a, b) => langNodes[b].size - langNodes[a].size)
    .reduce((result: TopLangData, key) => {
      result[key] = {
        name: langNodes[key].name,
        color: langNodes[key].color,
        size: langNodes[key].size,
      };
      return result;
    }, {});

  return topLangs;
};

export { fetchTopLanguages };
export default fetchTopLanguages;
