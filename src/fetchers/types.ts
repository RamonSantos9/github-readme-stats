/**
 * @fileoverview Tipos de dados dos fetchers do GitHub README Stats.
 *
 * Define as interfaces TypeScript para todos os dados retornados
 * pelas funções de busca (fetchers) que se comunicam com as APIs
 * do GitHub e do WakaTime.
 */

/**
 * Dados de um Gist do GitHub.
 */
export type GistData = {
  /** Nome do gist. */
  name: string;
  /** Nome completo do gist com o dono (formato: "usuario/id"). */
  nameWithOwner: string;
  /** Descrição do gist (pode ser nula). */
  description: string | null;
  /** Linguagem principal do gist (pode ser nula). */
  language: string | null;
  /** Número de estrelas do gist. */
  starsCount: number;
  /** Número de forks do gist. */
  forksCount: number;
};

/**
 * Dados de um repositório do GitHub.
 */
export type RepositoryData = {
  /** Nome do repositório. */
  name: string;
  /** Nome completo com o dono (ex.: "usuario/repositorio"). */
  nameWithOwner: string;
  /** Se o repositório é privado. */
  isPrivate: boolean;
  /** Se o repositório está arquivado. */
  isArchived: boolean;
  /** Se o repositório é um template. */
  isTemplate: boolean;
  /** Informações de estrelas do repositório. */
  stargazers: { totalCount: number };
  /** Descrição do repositório. */
  description: string;
  /** Linguagem de programação principal. */
  primaryLanguage: {
    /** Cor hexadecimal da linguagem. */
    color: string;
    /** ID da linguagem. */
    id: string;
    /** Nome da linguagem. */
    name: string;
  };
  /** Número de forks. */
  forkCount: number;
  /** Número de estrelas. */
  starCount: number;
};

/**
 * Dados de estatísticas do perfil do GitHub.
 * Retornados por `fetchStats` e usados por `renderStatsCard`.
 */
export type StatsData = {
  /** Nome de exibição do usuário. */
  name: string;
  /** Total de pull requests criados. */
  totalPRs: number;
  /** Total de pull requests mesclados. */
  totalPRsMerged: number;
  /** Percentual de pull requests mesclados em relação ao total. */
  mergedPRsPercentage: number;
  /** Total de revisões de código feitas. */
  totalReviews: number;
  /** Total de commits. */
  totalCommits: number;
  /** Total de issues abertas e fechadas. */
  totalIssues: number;
  /** Total de estrelas em todos os repositórios. */
  totalStars: number;
  /** Total de discussões iniciadas. */
  totalDiscussionsStarted: number;
  /** Total de discussões respondidas. */
  totalDiscussionsAnswered: number;
  /** Total de repositórios para os quais o usuário contribuiu. */
  contributedTo: number;
  /** Rank calculado do usuário. */
  rank: {
    /** Nível do rank (ex.: "S", "A+", "B-"). */
    level: string;
    /** Percentil do rank (0-100, quanto menor, melhor). */
    percentile: number;
  };
};

/**
 * Dados de uma linguagem de programação para o card de top-langs.
 */
export type Lang = {
  /** Nome da linguagem (ex.: "TypeScript"). */
  name: string;
  /** Cor hexadecimal da linguagem (ex.: "#3178c6"). */
  color: string;
  /** Tamanho total em bytes de código nesta linguagem. */
  size: number;
};

/**
 * Mapa de todas as linguagens de um usuário.
 * A chave é o nome da linguagem (ex.: "TypeScript").
 */
export type TopLangData = Record<string, Lang>;

/**
 * Tipo de uma entrada de tempo no WakaTime (linguagem, editor, SO, etc.).
 */
type WakaTimeEntry = {
  /** Tempo no formato digital (ex.: "8:30"). */
  digital: string;
  /** Horas de uso. */
  hours: number;
  /** Minutos de uso. */
  minutes: number;
  /** Nome da entrada (ex.: "TypeScript", "VSCode"). */
  name: string;
  /** Percentual de uso em relação ao total. */
  percent: number;
  /** Tempo no formato legível (ex.: "8 hrs 30 mins"). */
  text: string;
  /** Total de segundos de uso. */
  total_seconds: number;
};

/**
 * Dados completos do WakaTime de um usuário.
 * Retornados pela API pública do WakaTime.
 */
export type WakaTimeData = {
  /** Lista de categorias de atividade (ex.: Coding, Browsing). */
  categories: WakaTimeEntry[];
  /** Média diária em segundos (excluindo dias sem atividade). */
  daily_average: number;
  /** Média diária em segundos (incluindo outros idiomas). */
  daily_average_including_other_language: number;
  /** Dias totais incluindo feriados. */
  days_including_holidays: number;
  /** Dias totais excluindo feriados. */
  days_minus_holidays: number;
  /** Lista de editores usados. */
  editors: WakaTimeEntry[];
  /** Número de feriados no período. */
  holidays: number;
  /** Média diária legível. */
  human_readable_daily_average: string;
  /** Média diária legível com outros idiomas. */
  human_readable_daily_average_including_other_language: string;
  /** Total legível. */
  human_readable_total: string;
  /** Total legível com outros idiomas. */
  human_readable_total_including_other_language: string;
  /** ID único do registro. */
  id: string;
  /** Se o perfil está sendo atualizado. */
  is_already_updating: boolean;
  /** Se a atividade de código é visível. */
  is_coding_activity_visible: boolean;
  /** Se o dia atual está incluído. */
  is_including_today: boolean;
  /** Se outro uso é visível. */
  is_other_usage_visible: boolean;
  /** Se o registro está travado. */
  is_stuck: boolean;
  /** Se os dados estão atualizados. */
  is_up_to_date: boolean;
  /** Lista de linguagens usadas. */
  languages: WakaTimeEntry[];
  /** Lista de sistemas operacionais usados. */
  operating_systems: WakaTimeEntry[];
  /** Percentual calculado. */
  percent_calculated: number;
  /** Período do relatório. */
  range: string;
  /** Status do cálculo. */
  status: string;
  /** Tempo limite em segundos. */
  timeout: number;
  /** Total de segundos de atividade. */
  total_seconds: number;
  /** Total de segundos incluindo outros idiomas. */
  total_seconds_including_other_language: number;
  /** ID do usuário. */
  user_id: string;
  /** Nome de usuário no WakaTime. */
  username: string;
  /** Se apenas escritas são contadas. */
  writes_only: boolean;
};

/**
 * Dados de uma linguagem no card do WakaTime.
 */
export type WakaTimeLang = {
  /** Nome da linguagem. */
  name: string;
  /** Tempo formatado (ex.: "4 hrs 20 mins"). */
  text: string;
  /** Percentual de uso (0-100). */
  percent: number;
};
