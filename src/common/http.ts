/**
 * @fileoverview Cliente HTTP para requisições à API GraphQL do GitHub.
 *
 * Abstrai as chamadas Axios para a API do GitHub, centralizando
 * a URL base e o formato padrão das requisições.
 */

import axios, { type AxiosResponse } from "axios";

/**
 * Envia uma requisição POST para a API GraphQL do GitHub.
 *
 * @param data - Dados da requisição (query GraphQL e variáveis).
 * @param headers - Headers HTTP da requisição (ex.: Authorization com token PAT).
 * @returns Promise com a resposta Axios da API do GitHub.
 *
 * @example
 * const resposta = await request(
 *   { query: GRAPHQL_STATS_QUERY, variables: { login: "usuario" } },
 *   { Authorization: `bearer ${token}` }
 * );
 */
const request = (
  data: Record<string, unknown>,
  headers: Record<string, string>,
): Promise<AxiosResponse> => {
  return axios({
    url: "https://api.github.com/graphql",
    method: "post",
    headers,
    data,
  });
};

export { request };
