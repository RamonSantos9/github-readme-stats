/**
 * @fileoverview Busca de dados de repositório do GitHub.
 *
 * Fornece a função `fetchRepo` que busca os dados de um repositório
 * público específico via API GraphQL do GitHub.
 * Suporta tanto repositórios de usuários quanto de organizações.
 */

import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import { retryer } from "../common/retryer.js";
import type { RepositoryData } from "./types.js";

/**
 * Fetcher base para buscar dados de um repositório.
 *
 * @param variables - Variáveis GraphQL (deve conter `login` e `repo`).
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios.
 */
const fetcher = (variables: Record<string, unknown>, token: string) => {
  return request(
    {
      query: `
      fragment RepoInfo on Repository {
        name
        nameWithOwner
        isPrivate
        isArchived
        isTemplate
        stargazers {
          totalCount
        }
        description
        primaryLanguage {
          color
          id
          name
        }
        forkCount
      }
      query getRepo($login: String!, $repo: String!) {
        user(login: $login) {
          repository(name: $repo) {
            ...RepoInfo
          }
        }
        organization(login: $login) {
          repository(name: $repo) {
            ...RepoInfo
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

/** Exemplo de URL de uso da API de repositório. */
const urlExample = "/api/pin?username=USERNAME&amp;repo=REPO_NAME";

/**
 * Busca os dados de um repositório público do GitHub.
 *
 * Suporta tanto repositórios de usuários pessoais quanto de organizações.
 * Repositórios privados e arquivados são rejeitados com erro.
 *
 * @param username - Nome de usuário ou organização do GitHub.
 * @param reponame - Nome do repositório.
 * @returns Promise com os dados do repositório.
 * @throws {MissingParamError} Se `username` ou `reponame` não forem fornecidos.
 * @throws {Error} Se o repositório não for encontrado ou for privado.
 *
 * @example
 * const repo = await fetchRepo("ramonsantos9", "github-readme-stats");
 * // → { name: "github-readme-stats", starCount: 65000, ... }
 */
const fetchRepo = async (
  username: string,
  reponame: string,
): Promise<RepositoryData> => {
  if (!username && !reponame) {
    throw new MissingParamError(["username", "repo"], urlExample);
  }
  if (!username) {
    throw new MissingParamError(["username"], urlExample);
  }
  if (!reponame) {
    throw new MissingParamError(["repo"], urlExample);
  }

  const res = await retryer(fetcher, { login: username, repo: reponame });

  const data = res.data.data;

  if (!data.user && !data.organization) {
    throw new Error("Não encontrado");
  }

  const isUser = data.organization === null && data.user;
  const isOrg = data.user === null && data.organization;

  if (isUser) {
    if (!data.user.repository || data.user.repository.isPrivate) {
      throw new Error("Repositório do usuário não encontrado");
    }
    return {
      ...data.user.repository,
      starCount: data.user.repository.stargazers.totalCount,
    };
  }

  if (isOrg) {
    if (
      !data.organization.repository ||
      data.organization.repository.isPrivate
    ) {
      throw new Error("Repositório da organização não encontrado");
    }
    return {
      ...data.organization.repository,
      starCount: data.organization.repository.stargazers.totalCount,
    };
  }

  throw new Error("Comportamento inesperado");
};

export { fetchRepo };
export default fetchRepo;
