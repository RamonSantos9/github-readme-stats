/**
 * @fileoverview Tipos de opções dos cards do GitHub README Stats.
 *
 * Define as interfaces TypeScript para as opções de configuração
 * de cada tipo de card suportado pela API.
 */

import { themes } from "../../themes/index.js";
export type ThemeNames = keyof typeof themes;
type RankIcon = "default" | "github" | "percentile";

/**
 * Opções comuns a todos os cards.
 * Todos os parâmetros são configuráveis via query string na URL da API.
 */
export type CommonOptions = {
  /** Cor hexadecimal do título (sem o #). Ex.: `title_color=2f80ed` */
  title_color: string;
  /** Cor hexadecimal dos ícones (sem o #). */
  icon_color: string;
  /** Cor hexadecimal do texto (sem o #). */
  text_color: string;
  /** Cor hexadecimal do fundo ou gradiente. Ex.: `bg_color=45,2f80ed,e96c4c` */
  bg_color: string;
  /** Nome do tema a ser aplicado. Ex.: `theme=dark` */
  theme: ThemeNames;
  /** Raio das bordas em pixels. Ex.: `border_radius=10` */
  border_radius: number;
  /** Cor hexadecimal da borda (sem o #). */
  border_color: string;
  /** Locale do idioma. Ex.: `locale=pt-br` */
  locale: string;
  /** Se `true`, oculta a borda do card. */
  hide_border: boolean;
  /** Família de fontes personalizada. Ex.: `font_family=Bricolage Grotesque` */
  font_family: string;
  /** Cor hexadecimal do anel de rank. */
  ring_color: string;
};

/**
 * Opções específicas do card de estatísticas do usuário.
 */
export type StatCardOptions = CommonOptions & {
  /** Lista de estatísticas a ocultar. Ex.: `hide=stars,commits` */
  hide: string[];
  /** Se `true`, exibe ícones ao lado de cada estatística. */
  show_icons: boolean;
  /** Se `true`, oculta o título do card. */
  hide_title: boolean;
  /** Largura do card em pixels. */
  card_width: number;
  /** Se `true`, oculta o círculo de rank. */
  hide_rank: boolean;
  /** Se `true`, exibe todos os commits de todos os anos. */
  include_all_commits: boolean;
  /** Ano específico para contar commits (ex.: `commits_year=2023`). */
  commits_year: number;
  /** Altura das linhas em pixels. */
  line_height: number | string;
  /** Título personalizado. */
  custom_title: string;
  /** Se `true`, desativa todas as animações CSS. */
  disable_animations: boolean;
  /** Formato dos números: "short" (ex.: "1.2k") ou "long" (ex.: "1200"). */
  number_format: string;
  /** Casas decimais para os números (0-2). */
  number_precision: number;
  /** Cor do anel de rank. */
  ring_color: string;
  /** Se `true`, exibe os valores em negrito. */
  text_bold: boolean;
  /** Tipo do ícone de rank: "default", "github" ou "percentile". */
  rank_icon: RankIcon;
  /** Estatísticas adicionais a exibir. Ex.: `show=prs_merged,reviews` */
  show: string[];
};

/**
 * Opções específicas do card de repositório.
 */
export type RepoCardOptions = CommonOptions & {
  /** Se `true`, exibe o nome do dono junto ao nome do repositório. */
  show_owner: boolean;
  /** Número máximo de linhas da descrição. */
  description_lines_count: number;
  /** Largura do card em pixels. */
  card_width: number;
};

/**
 * Opções específicas do card de linguagens mais usadas.
 */
export type TopLangOptions = CommonOptions & {
  /** Se `true`, oculta o título do card. */
  hide_title: boolean;
  /** Largura do card em pixels. */
  card_width: number;
  /** Linguagens a ocultar. Ex.: `hide=html,css` */
  hide: string[];
  /** Layout do card: "compact", "normal", "donut", "donut-vertical" ou "pie". */
  layout: "compact" | "normal" | "donut" | "donut-vertical" | "pie";
  /** Título personalizado. */
  custom_title: string;
  /** Número máximo de linguagens a exibir. */
  langs_count: number;
  /** Se `true`, desativa todas as animações CSS. */
  disable_animations: boolean;
  /** Se `true`, oculta as barras de progresso. */
  hide_progress: boolean;
  /** Formato das estatísticas: "percentages" ou "bytes". */
  stats_format: "percentages" | "bytes";
};

/**
 * Opções específicas do card do WakaTime.
 */
export type WakaTimeOptions = CommonOptions & {
  /** Se `true`, oculta o título do card. */
  hide_title: boolean;
  /** Linguagens a ocultar. */
  hide: string[];
  /** Largura do card em pixels. */
  card_width: number;
  /** Altura das linhas. */
  line_height: string;
  /** Se `true`, oculta as barras de progresso. */
  hide_progress: boolean;
  /** Título personalizado. */
  custom_title: string;
  /** Layout do card: "compact" ou "normal". */
  layout: "compact" | "normal";
  /** Número máximo de linguagens. */
  langs_count: number;
  /** Formato de exibição: "time" ou "percent". */
  display_format: "time" | "percent";
  /** Se `true`, desativa todas as animações CSS. */
  disable_animations: boolean;
};

/**
 * Opções específicas do card de Gist.
 */
export type GistCardOptions = CommonOptions & {
  /** Se `true`, exibe o nome do dono junto ao nome do gist. */
  show_owner: boolean;
  /** Largura do card em pixels. */
  card_width: number;
};
/**
 * Opções específicas do card de gráfico de atividade.
 */
export type ActivityGraphOptions = CommonOptions & {
  /** Se `true`, oculta o título do card. */
  hide_title: boolean;
  /** Título personalizado. */
  custom_title: string;
  /** Largura do card em pixels. */
  card_width: number;
  /** Cor hexadecimal da linha do gráfico. */
  line_color: string;
  /** Cor hexadecimal dos pontos do gráfico. */
  point_color: string;
  /** Cor hexadecimal da área sob a linha. */
  area_color: string;
  /** Se `true`, oculta a área sob a linha. */
  hide_area: boolean;
  /** Se `true`, desativa as animações. */
  disable_animations: boolean;
};

/**
 * Opções para o card de sequência de contribuições (streaks).
 */
export type StreakCardOptions = CommonOptions & {
  /** Se `true`, oculta a borda do card. */
  hide_border: boolean;
  /** Largura do card em pixels. */
  card_width: number;
  /** Cor do fogo (flame). */
  fire_color: string;
};
