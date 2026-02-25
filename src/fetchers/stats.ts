/**
 * @fileoverview Busca de estatísticas do perfil do GitHub.
 *
 * Fornece a função principal `fetchStats` que busca todas as estatísticas
 * do usuário via API GraphQL do GitHub, com suporte a paginação para
 * repositórios e busca de todos os commits via API REST.
 */

import axios from "axios";
import * as dotenv from "dotenv";
import githubUsernameRegex from "github-username-regex";
import { calculateRank } from "../calculateRank.js";
import { retryer } from "../common/retryer.js";
import { logger } from "../common/log.js";
import { excludeRepositories } from "../common/envs.js";
import { CustomError, MissingParamError } from "../common/error.js";
import { wrapTextMultiline } from "../common/fmt.js";
import { request } from "../common/http.js";
import type { StatsData } from "./types.js";

dotenv.config();

// ─── Queries GraphQL ──────────────────────────────────────────────────────────

/**
 * Campo GraphQL para buscar repositórios com paginação (usado para contar estrelas).
 */
const GRAPHQL_REPOS_FIELD = `
  repositories(first: 100, ownerAffiliations: OWNER, orderBy: {direction: DESC, field: STARGAZERS}, after: $after) {
    totalCount
    nodes {
      name
      stargazers {
        totalCount
      }
    }
    pageInfo {
      hasNextPage
      endCursor
    }
  }
`;

/**
 * Query GraphQL para buscar apenas repositórios adicionais (paginação de estrelas).
 */
const GRAPHQL_REPOS_QUERY = `
  query userInfo($login: String!, $after: String) {
    user(login: $login) {
      ${GRAPHQL_REPOS_FIELD}
    }
  }
`;

/**
 * Query GraphQL principal para buscar as estatísticas completas do usuário.
 * Inclui commits, PRs, issues, revisões, estrelas, discussões e seguidores.
 */
const GRAPHQL_STATS_QUERY = `
  query userInfo($login: String!, $after: String, $includeMergedPullRequests: Boolean!, $includeDiscussions: Boolean!, $includeDiscussionsAnswers: Boolean!, $startTime: DateTime = null) {
    user(login: $login) {
      name
      login
      commits: contributionsCollection (from: $startTime) {
        totalCommitContributions,
      }
      reviews: contributionsCollection {
        totalPullRequestReviewContributions
      }
      repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, ISSUE, PULL_REQUEST, REPOSITORY]) {
        totalCount
      }
      pullRequests(first: 1) {
        totalCount
      }
      mergedPullRequests: pullRequests(states: MERGED) @include(if: $includeMergedPullRequests) {
        totalCount
      }
      openIssues: issues(states: OPEN) {
        totalCount
      }
      closedIssues: issues(states: CLOSED) {
        totalCount
      }
      followers {
        totalCount
      }
      repositoryDiscussions @include(if: $includeDiscussions) {
        totalCount
      }
      repositoryDiscussionComments(onlyAnswers: true) @include(if: $includeDiscussionsAnswers) {
        totalCount
      }
      ${GRAPHQL_REPOS_FIELD}
    }
  }
`;

// ─── Funções de busca internas ────────────────────────────────────────────────

/**
 * Tipo das variáveis para o fetcher de stats.
 */
type VariaveisFetcher = {
  login?: string;
  after?: string | null;
  includeMergedPullRequests?: boolean;
  includeDiscussions?: boolean;
  includeDiscussionsAnswers?: boolean;
  startTime?: string | undefined;
  [key: string]: unknown;
};

/**
 * Fetcher base usado pelo retryer para buscar estatísticas via GraphQL.
 *
 * Se `after` estiver definido, busca apenas a próxima página de repositórios.
 * Caso contrário, busca todas as estatísticas do usuário.
 *
 * @param variables - Variáveis da query GraphQL.
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios.
 */
const fetcher = (variables: VariaveisFetcher, token: string) => {
  const query = variables.after ? GRAPHQL_REPOS_QUERY : GRAPHQL_STATS_QUERY;
  return request({ query, variables }, { Authorization: `bearer ${token}` });
};

/**
 * Parâmetros para `statsFetcher`.
 */
type ParamsStatsFetcher = {
  /** Nome de usuário do GitHub. */
  username: string;
  /** Se `true`, inclui estatísticas de PRs mesclados. */
  includeMergedPullRequests: boolean;
  /** Se `true`, inclui total de discussões iniciadas. */
  includeDiscussions: boolean;
  /** Se `true`, inclui total de discussões respondidas. */
  includeDiscussionsAnswers: boolean;
  /** Data de início para contagem de commits (formato ISO 8601). */
  startTime?: string;
};

/**
 * Busca as estatísticas do usuário via GraphQL com suporte a paginação de estrelas.
 *
 * Faz múltiplas requisições paginadas para obter todos os repositórios quando
 * a variável de ambiente `FETCH_MULTI_PAGE_STARS=true` está definida.
 *
 * @param params - Parâmetros da busca.
 * @returns Promise com a resposta Axios acumulada de todas as páginas.
 */
const statsFetcher = async ({
  username,
  includeMergedPullRequests,
  includeDiscussions,
  includeDiscussionsAnswers,
  startTime,
}: ParamsStatsFetcher) => {
  let stats: any;
  let hasNextPage = true;
  let endCursor: string | null = null;

  while (hasNextPage) {
    const variables: VariaveisFetcher = {
      login: username,
      first: 100,
      after: endCursor,
      includeMergedPullRequests,
      includeDiscussions,
      includeDiscussionsAnswers,
      startTime,
    };

    let res = await retryer(fetcher, variables);

    if (res.data.errors) {
      return res;
    }

    // Acumula os nós de repositório em paginação
    const repoNodes = res.data.data.user.repositories.nodes;
    if (stats) {
      stats.data.data.user.repositories.nodes.push(...repoNodes);
    } else {
      stats = res;
    }

    // Para de paginar se `FETCH_MULTI_PAGE_STARS` não estiver habilitado
    // ou se não houver mais páginas com estrelas
    const repoNodesWithStars = repoNodes.filter(
      (node: any) => node.stargazers.totalCount !== 0,
    );
    hasNextPage =
      process.env.FETCH_MULTI_PAGE_STARS === "true" &&
      repoNodes.length === repoNodesWithStars.length &&
      res.data.data.user.repositories.pageInfo.hasNextPage;
    endCursor = res.data.data.user.repositories.pageInfo.endCursor;
  }

  return stats;
};

/**
 * Fetcher de todos os commits via API REST do GitHub.
 *
 * Usado como alternativa quando `FETCH_MULTI_PAGE_STARS` não é suficiente.
 *
 * @param variables - Variáveis com o campo `login` (username).
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios da API REST.
 * @see https://developer.github.com/v3/search/#search-commits
 */
const fetchTotalCommits = (variables: VariaveisFetcher, token: string) => {
  return axios({
    method: "get",
    url: `https://api.github.com/search/commits?q=author:${variables.login}`,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/vnd.github.cloak-preview",
      Authorization: `token ${token}`,
    },
  });
};

/**
 * Busca o total de commits do usuário via API REST do GitHub.
 *
 * A API de busca do GitHub retorna o total de commits de todos os repositórios
 * do usuário, incluindo forks e repositórios privados (se autorizado).
 *
 * @param username - Nome de usuário do GitHub.
 * @returns Promise com o total de commits.
 * @throws {Error} Se o username for inválido.
 * @throws {CustomError} Se a API retornar um total inválido.
 *
 * @see https://github.com/ramonsantos9/github-readme-stats/issues/92#issuecomment-661026467
 */
const totalCommitsFetcher = async (username: string): Promise<number> => {
  if (!githubUsernameRegex.test(username)) {
    logger.log("Nome de usuário inválido.");
    throw new Error("Nome de usuário inválido.");
  }

  let res: any;
  try {
    res = await retryer(fetchTotalCommits, { login: username });
  } catch (err) {
    logger.log(err);
    throw new Error(String(err));
  }

  const totalCount = res.data.total_count;
  if (!totalCount || isNaN(totalCount)) {
    throw new CustomError(
      "Não foi possível buscar o total de commits.",
      CustomError.GITHUB_REST_API_ERROR,
    );
  }

  return totalCount;
};

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Busca e retorna as estatísticas completas de um usuário do GitHub.
 *
 * Esta é a função principal do módulo, chamada pelos endpoints da API.
 * Combina dados da API GraphQL e, quando necessário, da API REST.
 *
 * @param username - Nome de usuário do GitHub.
 * @param include_all_commits - Se `true`, usa a API REST para contar todos os commits históricos.
 * @param exclude_repo - Repositórios a excluir da contagem de estrelas.
 * @param include_merged_pull_requests - Se `true`, inclui total de PRs mesclados.
 * @param include_discussions - Se `true`, inclui total de discussões iniciadas.
 * @param include_discussions_answers - Se `true`, inclui total de discussões respondidas.
 * @param commits_year - Ano para filtrar a contagem de commits (opcional).
 * @returns Promise com os dados de estatísticas do usuário.
 * @throws {MissingParamError} Se `username` não for fornecido.
 * @throws {CustomError} Em caso de erros da API do GitHub.
 *
 * @example
 * const stats = await fetchStats("ramonsantos9", true, ["github-readme-stats"]);
 */
const fetchStats = async (
  username: string,
  include_all_commits: boolean = false,
  exclude_repo: string[] = [],
  include_merged_pull_requests: boolean = false,
  include_discussions: boolean = false,
  include_discussions_answers: boolean = false,
  commits_year?: number,
): Promise<StatsData> => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const stats: StatsData = {
    name: "",
    totalPRs: 0,
    totalPRsMerged: 0,
    mergedPRsPercentage: 0,
    totalReviews: 0,
    totalCommits: 0,
    totalIssues: 0,
    totalStars: 0,
    totalDiscussionsStarted: 0,
    totalDiscussionsAnswered: 0,
    contributedTo: 0,
    rank: { level: "C", percentile: 100 },
  };

  let res = await statsFetcher({
    username,
    includeMergedPullRequests: include_merged_pull_requests,
    includeDiscussions: include_discussions,
    includeDiscussionsAnswers: include_discussions_answers,
    startTime: commits_year ? `${commits_year}-01-01T00:00:00Z` : undefined,
  });

  // Captura erros da API GraphQL
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
      "Ocorreu um erro ao buscar os dados de estatísticas via GraphQL.",
      CustomError.GRAPHQL_ERROR,
    );
  }

  const user = res.data.data.user;

  stats.name = user.name || user.login;

  // Se include_all_commits, busca via API REST (retorna histórico completo)
  if (include_all_commits) {
    stats.totalCommits = await totalCommitsFetcher(username);
  } else {
    stats.totalCommits = user.commits.totalCommitContributions;
  }

  stats.totalPRs = user.pullRequests.totalCount;

  if (include_merged_pull_requests) {
    stats.totalPRsMerged = user.mergedPullRequests.totalCount;
    stats.mergedPRsPercentage =
      (user.mergedPullRequests.totalCount / user.pullRequests.totalCount) *
        100 || 0;
  }

  stats.totalReviews = user.reviews.totalPullRequestReviewContributions;
  stats.totalIssues = user.openIssues.totalCount + user.closedIssues.totalCount;

  if (include_discussions) {
    stats.totalDiscussionsStarted = user.repositoryDiscussions.totalCount;
  }

  if (include_discussions_answers) {
    stats.totalDiscussionsAnswered =
      user.repositoryDiscussionComments.totalCount;
  }

  stats.contributedTo = user.repositoriesContributedTo.totalCount;

  // Calcula estrelas excluindo repositórios da lista de exclusão
  const allExcludedRepos = [...exclude_repo, ...excludeRepositories];
  const repoToHide = new Set(allExcludedRepos);

  stats.totalStars = user.repositories.nodes
    .filter((data: any) => !repoToHide.has(data.name))
    .reduce((prev: number, curr: any) => prev + curr.stargazers.totalCount, 0);

  stats.rank = calculateRank({
    all_commits: include_all_commits,
    commits: stats.totalCommits,
    prs: stats.totalPRs,
    reviews: stats.totalReviews,
    issues: stats.totalIssues,
    repos: user.repositories.totalCount,
    stars: stats.totalStars,
    followers: user.followers.totalCount,
  });

  return stats;
};

export { fetchStats };
export default fetchStats;
