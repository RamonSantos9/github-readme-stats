/**
 * @fileoverview Funções auxiliares utilizadas nos scripts de automação.
 */

import { getInput } from "@actions/core";

const OWNER = "ramonsantos9";
const REPO = "github-readme-stats";

/**
 * Recupera informações sobre o repositório que executou a ação.
 *
 * @param ctx Contexto da ação (GitHub context).
 * @returns Informações do repositório (owner e repo).
 */
export const getRepoInfo = (ctx: any): { owner: string; repo: string } => {
  try {
    return {
      owner: ctx.repo.owner,
      repo: ctx.repo.repo,
    };
  } catch (error) {
    // Silencia o erro de variável não utilizada
    void error;

    return {
      owner: OWNER,
      repo: REPO,
    };
  }
};

/**
 * Recupera o token do GitHub e lança um erro se não for encontrado.
 *
 * @returns Token do GitHub.
 * @throws {Error} Se o token não for encontrado nas inputs ou variáveis de ambiente.
 */
export const getGithubToken = (): string => {
  const token = getInput("github_token") || process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error("Não foi possível encontrar o token do GitHub");
  }
  return token;
};
