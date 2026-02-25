/**
 * @fileoverview Busca de dados de atividade (calendário de contribuições) do GitHub.
 */

import { retryer } from "../common/retryer.js";
import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import type { ActivityData, ContributionDay } from "./types.js";

/**
 * Query GraphQL para buscar o calendário de contribuições do usuário.
 */
const GRAPHQL_ACTIVITY_QUERY = `
  query activityInfo($login: String!) {
    user(login: $login) {
      name
      login
      contributionsCollection {
        contributionCalendar {
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }
`;

/**
 * Fetcher base usado pelo retryer para buscar dados de atividade via GraphQL.
 *
 * @param variables - Variáveis da query GraphQL (login).
 * @param token - Token PAT do GitHub.
 * @returns Promise da resposta Axios.
 */
const fetcher = (variables: { login: string }, token: string) => {
  return request(
    { query: GRAPHQL_ACTIVITY_QUERY, variables },
    { Authorization: `bearer ${token}` },
  );
};

/**
 * Busca e retorna o calendário de contribuições de um usuário do GitHub.
 *
 * @param username - Nome de usuário do GitHub.
 * @returns Promise com os dados de atividade.
 * @throws {MissingParamError} Se username não for fornecido.
 */
const fetchActivity = async (username: string): Promise<ActivityData> => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  const res = await retryer(fetcher, { login: username });

  if (res.data.errors) {
    throw new Error(
      res.data.errors[0].message || "Erro ao buscar dados de atividade.",
    );
  }

  const user = res.data.data.user;
  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  const contributionDays: ContributionDay[] = [];
  user.contributionsCollection.contributionCalendar.weeks.forEach(
    (week: any) => {
      week.contributionDays.forEach((day: any) => {
        contributionDays.push({
          contributionCount: day.contributionCount,
          date: day.date,
        });
      });
    },
  );

  return {
    name: user.name || user.login,
    contributions: contributionDays,
  };
};

export { fetchActivity };
export default fetchActivity;
