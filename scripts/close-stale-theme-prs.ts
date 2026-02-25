/**
 * @fileoverview Script para fechar PRs de temas estagnados que possuem o selo `invalid`.
 */
import * as dotenv from "dotenv";
dotenv.config();

import { debug, setFailed } from "@actions/core";
import github from "@actions/github";
import { RequestError } from "@octokit/request-error";
import { getGithubToken, getRepoInfo } from "./helpers.js";

const CLOSING_COMMENT = `
	\rEste PR de tema foi fechado automaticamente devido à inatividade. Sinta-se à vontade para reabri-lo se desejar continuar trabalhando nele.\
	\rObrigado por suas contribuições.
`;
const REVIEWER = "github-actions[bot]";

/**
 * Recupera o usuário revisor.
 * @returns Nome do revisor.
 */
const getReviewer = (): string => {
  return process.env.REVIEWER ? process.env.REVIEWER : REVIEWER;
};

/**
 * Busca PRs abertos de um repositório específico.
 *
 * @param octokit Instância do cliente Octokit.
 * @param user Nome do proprietário do repositório.
 * @param repo Nome do repositório.
 * @param reviewer Revisor para filtrar.
 * @returns Lista de PRs abertos.
 */
export const fetchOpenPRs = async (
  octokit: any,
  user: string,
  repo: string,
  reviewer: string,
): Promise<any[]> => {
  const openPRs: any[] = [];
  let hasNextPage = true;
  let endCursor: string | undefined;

  while (hasNextPage) {
    try {
      const { repository }: any = await octokit.graphql(
        `
            {
              repository(owner: "${user}", name: "${repo}") {
                open_prs: pullRequests(${
                  endCursor ? `after: "${endCursor}", ` : ""
                }
                  first: 100, states: OPEN, orderBy: {field: CREATED_AT, direction: DESC}) {
                  nodes {
                    number
										commits(last:1){
											nodes{
												commit{
													pushedDate
												}
											}
										}
                    labels(first: 100, orderBy:{field: CREATED_AT, direction: DESC}) {
                      nodes {
												name
                      }
                    }
                    reviews(first: 100, states: CHANGES_REQUESTED, author: "${reviewer}") {
											nodes {
                        submittedAt
											}
                    }
                  }
                  pageInfo {
                    endCursor
                    hasNextPage
                  }
                }
              }
            }
          `,
      );
      openPRs.push(...repository.open_prs.nodes);
      hasNextPage = repository.open_prs.pageInfo.hasNextPage;
      endCursor = repository.open_prs.pageInfo.endCursor;
    } catch (error) {
      if (error instanceof RequestError) {
        setFailed(
          `Não foi possível recuperar os PRs usando GraphQl: ${error.message}`,
        );
      }
      throw error;
    }
  }
  return openPRs;
};

/**
 * Filtra pull requests que possuem uma determinada etiqueta.
 *
 * @param pulls Lista de pull requests.
 * @param label Etiqueta para filtrar.
 * @returns PRs que possuem a etiqueta.
 */
export const pullsWithLabel = (pulls: any[], label: string): any[] => {
  return pulls.filter((pr) => {
    return pr.labels.nodes.some((lab: any) => lab.name === label);
  });
};

/**
 * Verifica se um PR está estagnado (sem atualizações há algum tempo).
 *
 * @param pullRequest Objeto do pull request.
 * @param staleDays Número de dias de inatividade.
 * @returns True se estiver estagnado.
 */
const isStale = (pullRequest: any, staleDays: number): boolean => {
  const lastCommitDate = new Date(
    pullRequest.commits.nodes[0].commit.pushedDate,
  );
  if (pullRequest.reviews.nodes[0]) {
    const lastReviewDate = new Date(
      pullRequest.reviews.nodes.sort((a: any, b: any) => (a < b ? 1 : -1))[0]
        .submittedAt,
    );
    const lastUpdateDate =
      lastCommitDate >= lastReviewDate ? lastCommitDate : lastReviewDate;
    const now = new Date();
    return (
      (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24) >=
      staleDays
    );
  } else {
    return false;
  }
};

/**
 * Função principal para execução do script.
 */
const run = async (): Promise<void> => {
  try {
    const dryRun = process.env.DRY_RUN === "true";
    const staleDays = parseInt(process.env.STALE_DAYS || "20", 10);
    debug("Criando cliente Octokit...");
    const octokit = github.getOctokit(getGithubToken());
    const { owner, repo } = getRepoInfo(github.context);
    const reviewer = getReviewer();

    debug("Buscando todos os pull requests de temas...");
    const prs = await fetchOpenPRs(octokit, owner, repo, reviewer);
    const themePRs = pullsWithLabel(prs, "themes");
    const invalidThemePRs = pullsWithLabel(themePRs, "invalid");
    debug("Identificando PRs de temas estagnados...");
    const staleThemePRs = invalidThemePRs.filter((pr) =>
      isStale(pr, staleDays),
    );
    const staleThemePRsNumbers = staleThemePRs.map((pr) => pr.number);
    debug(`Encontrados ${staleThemePRs.length} PRs de temas estagnados`);

    // Itera por todos os PRs estagnados e os fecha.
    for (const prNumber of staleThemePRsNumbers) {
      debug(`Fechando #${prNumber} por estar estagnado...`);
      if (dryRun) {
        debug("Modo de simulação (dry-run) ativado, pulando...");
      } else {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: prNumber,
          body: CLOSING_COMMENT,
        });
        await octokit.rest.pulls.update({
          owner,
          repo,
          pull_number: prNumber,
          state: "closed",
        });
      }
    }
  } catch (error: any) {
    setFailed(error.message);
  }
};

run();
