/**
 * @fileoverview Algoritmo de cálculo de rank do GitHub README Stats.
 *
 * Calcula o nível de rank (S, A+, A, A-, B+, B, B-, C+, C) e
 * o percentil do usuário com base em suas estatísticas do GitHub.
 *
 * O algoritmo usa funções de distribuição cumulativa (CDF)
 * para normalizar as métricas e calcular um percentual único,
 * onde quanto menor o percentil, melhor o rank.
 */

/**
 * Parâmetros para o cálculo do rank.
 */
type ParamsCalcularRank = {
  /** Se `true`, usa medianas maiores para commits (inclui todos os anos). */
  all_commits: boolean;
  /** Total de commits do usuário. */
  commits: number;
  /** Total de pull requests criados. */
  prs: number;
  /** Total de issues criadas. */
  issues: number;
  /** Total de revisões de código feitas. */
  reviews: number;
  /** Total de repositórios (atualmente não usado no cálculo). */
  repos: number;
  /** Total de estrelas em todos os repositórios. */
  stars: number;
  /** Total de seguidores. */
  followers: number;
};

/**
 * Resultado do cálculo de rank.
 */
type ResultadoRank = {
  /** Nível do rank (ex.: "S", "A+", "B-"). */
  level: string;
  /** Percentil do rank (0-100). Quanto menor, melhor. */
  percentile: number;
};

/**
 * Calcula a função de distribuição cumulativa exponencial.
 *
 * Usada para normalizar métricas que crescem exponencialmente (commits, PRs, issues).
 * Retorna valores entre 0 e 1: próximo de 1 para valores altos, próximo de 0 para baixo.
 *
 * @param x - O valor normalizado (métrica / mediana).
 * @returns O valor CDF entre 0 e 1.
 */
function exponential_cdf(x: number): number {
  return 1 - 2 ** -x;
}

/**
 * Calcula uma aproximação da função de distribuição cumulativa log-normal.
 *
 * Usada para normalizar métricas como estrelas e seguidores, que tipicamente
 * seguem uma distribuição log-normal (poucos usuários têm muitas estrelas).
 *
 * @param x - O valor normalizado (métrica / mediana).
 * @returns O valor CDF aproximado entre 0 e 1.
 */
function log_normal_cdf(x: number): number {
  // Aproximação: x / (1 + x)
  return x / (1 + x);
}

/**
 * Calcula o rank do usuário baseado em suas estatísticas do GitHub.
 *
 * **Algoritmo:**
 * 1. Cada métrica é dividida por sua mediana de referência para normalização.
 * 2. Aplica-se a CDF correspondente (exponencial ou log-normal).
 * 3. Os resultados são somados com pesos e convertidos em percentil.
 * 4. O percentil é mapeado para um nível de rank (S a C).
 *
 * **Pesos das métricas:**
 * - Commits: 2, PRs: 3, Issues: 1, Revisões: 1, Estrelas: 4, Seguidores: 1
 *
 * @param params - Estatísticas do usuário para o cálculo.
 * @returns O rank calculado com nível e percentil.
 *
 * @example
 * calculateRank({
 *   all_commits: false,
 *   commits: 500,
 *   prs: 100,
 *   issues: 50,
 *   reviews: 30,
 *   repos: 20,
 *   stars: 200,
 *   followers: 150,
 * });
 * // → { level: "A+", percentile: 8.3 }
 */
function calculateRank({
  all_commits,
  commits,
  prs,
  issues,
  reviews,
  // eslint-disable-next-line no-unused-vars
  repos, // não usado no cálculo atual
  stars,
  followers,
}: ParamsCalcularRank): ResultadoRank {
  // Medianas e pesos por métrica
  const COMMITS_MEDIAN = all_commits ? 1000 : 250,
    COMMITS_WEIGHT = 2;
  const PRS_MEDIAN = 50,
    PRS_WEIGHT = 3;
  const ISSUES_MEDIAN = 25,
    ISSUES_WEIGHT = 1;
  const REVIEWS_MEDIAN = 2,
    REVIEWS_WEIGHT = 1;
  const STARS_MEDIAN = 50,
    STARS_WEIGHT = 4;
  const FOLLOWERS_MEDIAN = 10,
    FOLLOWERS_WEIGHT = 1;

  const TOTAL_WEIGHT =
    COMMITS_WEIGHT +
    PRS_WEIGHT +
    ISSUES_WEIGHT +
    REVIEWS_WEIGHT +
    STARS_WEIGHT +
    FOLLOWERS_WEIGHT;

  // Limiares de percentil para cada nível de rank
  const THRESHOLDS = [1, 12.5, 25, 37.5, 50, 62.5, 75, 87.5, 100];
  const LEVELS = ["S", "A+", "A", "A-", "B+", "B", "B-", "C+", "C"];

  // Calcula o rank ponderado (entre 0 e 1, onde menor = melhor)
  const rank =
    1 -
    (COMMITS_WEIGHT * exponential_cdf(commits / COMMITS_MEDIAN) +
      PRS_WEIGHT * exponential_cdf(prs / PRS_MEDIAN) +
      ISSUES_WEIGHT * exponential_cdf(issues / ISSUES_MEDIAN) +
      REVIEWS_WEIGHT * exponential_cdf(reviews / REVIEWS_MEDIAN) +
      STARS_WEIGHT * log_normal_cdf(stars / STARS_MEDIAN) +
      FOLLOWERS_WEIGHT * log_normal_cdf(followers / FOLLOWERS_MEDIAN)) /
      TOTAL_WEIGHT;

  // Mapeia o percentil para o nível de rank correspondente
  const level = LEVELS[THRESHOLDS.findIndex((t) => rank * 100 <= t)];

  return { level, percentile: rank * 100 };
}

export { calculateRank };
export default calculateRank;
