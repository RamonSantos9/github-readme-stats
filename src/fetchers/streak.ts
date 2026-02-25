/**
 * @fileoverview Busca e cálculo de sequências (streaks) de contribuições do GitHub.
 */

import { retryer } from "../common/retryer.js";
import { MissingParamError } from "../common/error.js";
import { request } from "../common/http.js";
import type { StreakData, ContributionDay } from "./types.js";

/**
 * Query GraphQL para buscar o ano de criação da conta do usuário.
 */
const GRAPHQL_USER_CREATED_AT_QUERY = `
  query userInfo($login: String!) {
    user(login: $login) {
      createdAt
    }
  }
`;

/**
 * Query GraphQL para buscar o calendário de contribuições em um intervalo de tempo.
 */
const GRAPHQL_STREAK_QUERY = `
  query streakInfo($login: String!, $from: DateTime, $to: DateTime) {
    user(login: $login) {
      name
      login
      contributionsCollection(from: $from, to: $to) {
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

const fetcher = (variables: any, token: string) => {
  const query = variables.from
    ? GRAPHQL_STREAK_QUERY
    : GRAPHQL_USER_CREATED_AT_QUERY;
  return request({ query, variables }, { Authorization: `bearer ${token}` });
};

/**
 * Calcula as estatísticas de sequência com base nos dias de contribuição.
 *
 * @param days - Lista de dias de contribuição ordenada por data.
 * @param name - Nome do usuário.
 * @returns Dados de sequência calculados.
 */
const calculateStreaks = (
  days: ContributionDay[],
  name: string,
  firstContribution: string,
): StreakData => {
  let totalContributions = 0;
  let currentStreak = { start: "", end: "", length: 0 };
  let longestStreak = { start: "", end: "", length: 0 };

  let tempStreak = { start: "", end: "", length: 0 };

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  for (const day of days) {
    totalContributions += day.contributionCount;

    if (day.contributionCount > 0) {
      if (tempStreak.length === 0) {
        tempStreak.start = day.date;
      }
      tempStreak.end = day.date;
      tempStreak.length++;
    } else {
      if (tempStreak.length > longestStreak.length) {
        longestStreak = { ...tempStreak };
      }
      tempStreak = { start: "", end: "", length: 0 };
    }
  }

  // Verifica o último tempStreak para longest
  if (tempStreak.length > longestStreak.length) {
    longestStreak = { ...tempStreak };
  }

  // Cálculo da Current Streak
  // Só conta como atual se terminar hoje ou ontem
  let current = { start: "", end: "", length: 0 };
  for (let i = days.length - 1; i >= 0; i--) {
    const day = days[i];
    if (day.contributionCount > 0) {
      if (day.date === today || day.date === yesterday || current.length > 0) {
        if (current.length === 0) current.end = day.date;
        current.start = day.date;
        current.length++;
      } else {
        break;
      }
    } else if (day.date !== today) {
      // Se o dia sem contribuição não for hoje, a sequência quebrou
      break;
    }
  }
  currentStreak = current;

  return {
    name,
    firstContribution,
    totalContributions,
    currentStreak,
    longestStreak,
  };
};

/**
 * Busca e calcula os dados de sequência (streak) de um usuário do GitHub.
 *
 * @param username - Nome de usuário.
 * @returns Promise com os dados de sequência.
 */
const fetchStreak = async (username: string): Promise<StreakData> => {
  if (!username) {
    throw new MissingParamError(["username"]);
  }

  // 1. Busca data de criação para saber quantos anos buscar
  const userRes = await retryer(fetcher, { login: username });
  if (userRes.data.errors) {
    throw new Error(userRes.data.errors[0].message);
  }
  const createdAt = userRes.data.data.user.createdAt;
  const startYear = new Date(createdAt).getFullYear();
  const currentYear = new Date().getFullYear();

  const allDays: ContributionDay[] = [];
  let name = username;

  // 2. Busca calendários ano a ano
  // Nota: GitHub limita a busca de contributionCalendar a intervalos de 1 ano
  for (let year = startYear; year <= currentYear; year++) {
    const from = `${year}-01-01T00:00:00Z`;
    const to = `${year}-12-31T23:59:59Z`;

    const res = await retryer(fetcher, { login: username, from, to });
    const user = res.data.data.user;
    if (user) {
      name = user.name || user.login;
      user.contributionsCollection.contributionCalendar.weeks.forEach(
        (week: any) => {
          week.contributionDays.forEach((day: any) => {
            // Evita duplicatas se houver sobreposição e garante ordem
            if (!allDays.find((d) => d.date === day.date)) {
              allDays.push({
                contributionCount: day.contributionCount,
                date: day.date,
              });
            }
          });
        },
      );
    }
  }

  // Ordena por data para garantir o cálculo correto
  allDays.sort((a, b) => a.date.localeCompare(b.date));

  return calculateStreaks(allDays, name, createdAt);
};

export { fetchStreak };
export default fetchStreak;
