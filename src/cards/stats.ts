/**
 * @fileoverview Card SVG de Estatísticas do GitHub.
 *
 * Renderiza um card SVG com as estatísticas do perfil de um usuário do GitHub:
 * estrelas, commits, PRs, issues, reviews, discussões, contribuições e rank.
 * Suporta o ícone de rank animado e múltiplos layouts configuráveis.
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { CustomError } from "../common/error.js";
import { kFormatter } from "../common/fmt.js";
import { I18n } from "../common/I18n.js";
import { icons, rankIcon } from "../common/icons.js";
import { clampValue } from "../common/ops.js";
import { flexLayout, measureText } from "../common/render.js";
import { statCardLocales, wakatimeCardLocales } from "../translations.js";
import type { StatsData } from "../fetchers/types.js";
import type { StatCardOptions } from "./types.js";

// ─── Constantes de dimensionamento ───────────────────────────────────────────
const CARD_MIN_WIDTH = 287;
const CARD_DEFAULT_WIDTH = 287;
const RANK_CARD_MIN_WIDTH = 420;
const RANK_CARD_DEFAULT_WIDTH = 450;
const RANK_ONLY_CARD_MIN_WIDTH = 290;
const RANK_ONLY_CARD_DEFAULT_WIDTH = 290;

/**
 * Locales que precisam de mais espaço para o texto (mantidos em inglês por compatibilidade com as chaves de tradução).
 */
const LONG_LOCALES: string[] = [
  "az",
  "bg",
  "cs",
  "de",
  "el",
  "es",
  "fil",
  "fi",
  "fr",
  "hu",
  "id",
  "ja",
  "ml",
  "my",
  "nl",
  "pl",
  "pt-br",
  "pt-pt",
  "ru",
  "sr",
  "sr-latn",
  "sw",
  "ta",
  "uk-ua",
  "uz",
  "zh-tw",
];

// ─── Tipos auxiliares ─────────────────────────────────────────────────────────

/**
 * Item de estatística para o card.
 */
type StatItem = {
  icon: string;
  label: string;
  value: number | string;
  id: string;
  unitSymbol?: string;
};

/**
 * Parâmetros do nó de texto de estatística.
 */
type ParamsCreateTextNode = {
  icon: string;
  label: string;
  value: number | string;
  id: string;
  unitSymbol?: string;
  index: number;
  showIcons: boolean;
  shiftValuePos: number;
  bold: boolean;
  numberFormat: string;
  numberPrecision?: number;
};

// ─── Helpers de renderização ──────────────────────────────────────────────────

/**
 * Cria um item de texto SVG para uma estatística do card.
 *
 * @param params - Parâmetros do item.
 * @returns String SVG do item de estatística.
 */
const createTextNode = ({
  icon,
  label,
  value,
  id,
  unitSymbol,
  index,
  showIcons,
  shiftValuePos,
  bold,
  numberFormat,
  numberPrecision,
}: ParamsCreateTextNode): string => {
  const precision =
    typeof numberPrecision === "number" && !isNaN(numberPrecision)
      ? clampValue(numberPrecision, 0, 2)
      : undefined;
  const kValue =
    numberFormat.toLowerCase() === "long" || id === "prs_merged_percentage"
      ? value
      : kFormatter(value as number, precision);
  const staggerDelay = (index + 3) * 150;

  const labelOffset = showIcons ? `x="25"` : "";
  const iconSvg = showIcons
    ? `
    <svg data-testid="icon" class="icon" viewBox="0 0 16 16" version="1.1" width="16" height="16">
      ${icon}
    </svg>
  `
    : "";

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      ${iconSvg}
      <text class="stat ${bold ? " bold" : "not_bold"}" ${labelOffset} y="12.5">${label}:</text>
      <text
        class="stat ${bold ? " bold" : "not_bold"}"
        x="${(showIcons ? 140 : 120) + shiftValuePos}"
        y="12.5"
        data-testid="${id}"
      >${kValue}${unitSymbol ? ` ${unitSymbol}` : ""}</text>
    </g>
  `;
};

/**
 * Calcula o deslocamento ao longo da circunferência do anel de rank.
 *
 * @param value - Percentil do rank (0-100).
 * @returns Deslocamento do stroke-dashoffset.
 */
const calculateCircleProgress = (value: number): number => {
  const radius = 40;
  const c = Math.PI * (radius * 2);

  if (value < 0) value = 0;
  if (value > 100) value = 100;

  return ((100 - value) / 100) * c;
};

/**
 * Gera o CSS de animação do progresso do anel de rank.
 *
 * @param params - Objeto com o valor de progresso (percentil invertido).
 * @returns String CSS da animação `rankAnimation`.
 */
const getProgressAnimation = ({ progress }: { progress: number }): string => {
  return `
    @keyframes rankAnimation {
      from {
        stroke-dashoffset: ${calculateCircleProgress(0)};
      }
      to {
        stroke-dashoffset: ${calculateCircleProgress(progress)};
      }
    }
  `;
};

/**
 * Gera o CSS completo do card de estatísticas.
 */
const getStyles = ({
  titleColor,
  textColor,
  iconColor,
  ringColor,
  show_icons,
  progress,
  font_family,
}: {
  titleColor: string;
  textColor: string;
  iconColor: string;
  ringColor: string;
  show_icons: boolean;
  progress: number;
  font_family?: string;
}): string => {
  return `
    .stat {
      font: 600 14px "${font_family || "'Segoe UI', Ubuntu, \"Helvetica Neue\", Sans-Serif"}"; fill: ${textColor};
    }
    @supports(-moz-appearance: auto) {
      /* Seletor detecta Firefox */
      .stat { font-size:12px; }
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .rank-text {
      font: 800 24px "${font_family || "'Segoe UI', Ubuntu, Sans-Serif"}"; fill: ${textColor};
      animation: scaleInAnimation 0.3s ease-in-out forwards;
    }
    .rank-percentile-header {
      font-size: 14px;
    }
    .rank-percentile-text {
      font-size: 16px;
    }
    
    .not_bold { font-weight: 400 }
    .bold { font-weight: 700 }
    .icon {
      fill: ${iconColor};
      display: ${show_icons ? "block" : "none"};
    }

    .rank-circle-rim {
      stroke: ${ringColor};
      fill: none;
      stroke-width: 6;
      opacity: 0.2;
    }
    .rank-circle {
      stroke: ${ringColor};
      stroke-dasharray: 250;
      fill: none;
      stroke-width: 6;
      stroke-linecap: round;
      opacity: 0.8;
      transform-origin: -10px 8px;
      transform: rotate(-90deg);
      animation: rankAnimation 1s forwards ease-in-out;
    }
    ${process.env.NODE_ENV === "test" ? "" : getProgressAnimation({ progress })}
  `;
};

/**
 * Retorna o sufixo do label de commits de acordo com as opções selecionadas.
 *
 * @param include_all_commits - Se inclui todos os commits históricos.
 * @param commits_year - Ano específico de commits (opcional).
 * @param i18n - Instância do I18n para tradução.
 */
const getTotalCommitsYearLabel = (
  include_all_commits: boolean,
  commits_year: number | undefined,
  i18n: I18n,
): string =>
  include_all_commits
    ? ""
    : commits_year
      ? ` (${commits_year})`
      : ` (${i18n.t("wakatimecard.lastyear")})`;

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Renderiza o card SVG de estatísticas do GitHub.
 *
 * Exibe as principais métricas do perfil do usuário: estrelas, commits, PRs,
 * issues, reviews, discussões, contribuições e rank com anel animado.
 *
 * @param stats - Dados de estatísticas retornados por `fetchStats`.
 * @param options - Opções de personalização visual do card.
 * @returns String SVG do card de estatísticas pronto para uso no README.
 *
 * @example
 * const svg = renderStatsCard(stats, { theme: "dark", hide_rank: false, show_icons: true });
 */
const renderStatsCard = (
  stats: StatsData,
  options: Partial<StatCardOptions> = {},
): string => {
  const {
    name,
    totalStars,
    totalCommits,
    totalIssues,
    totalPRs,
    totalPRsMerged,
    mergedPRsPercentage,
    totalReviews,
    totalDiscussionsStarted,
    totalDiscussionsAnswered,
    contributedTo,
    rank,
  } = stats;

  const {
    hide = [],
    show_icons = false,
    hide_title = false,
    hide_border = false,
    card_width,
    hide_rank = false,
    include_all_commits = false,
    commits_year,
    line_height = 25,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold = true,
    bg_color,
    theme = "default" as any,
    custom_title,
    border_radius,
    border_color,
    number_format = "short",
    number_precision,
    locale,
    disable_animations = false,
    rank_icon = "default",
    show = [],
    font_family,
  } = options;

  const lheight = parseInt(String(line_height), 10);

  // Resolve as cores do tema com os overrides fornecidos pelo usuário
  const { titleColor, iconColor, textColor, bgColor, borderColor, ringColor } =
    getCardColors({
      title_color,
      text_color,
      icon_color,
      bg_color,
      border_color,
      ring_color,
      theme,
    });

  const colors = {
    titleColor,
    ringColor,
    textColor,
    iconColor,
    bgColor,
    borderColor,
    font_family,
  };

  const apostrophe = /s$/i.test(name.trim()) ? "" : "s";
  const i18n = new I18n({
    locale,
    translations: {
      ...statCardLocales({ name, apostrophe }),
      ...wakatimeCardLocales,
    },
  });

  // Mapa de estatísticas disponíveis para o card
  const STATS: Record<string, StatItem> = {};

  STATS.stars = {
    icon: icons.star,
    label: i18n.t("statcard.totalstars"),
    value: totalStars,
    id: "stars",
  };
  STATS.commits = {
    icon: icons.commits,
    label: `${i18n.t("statcard.commits")}${getTotalCommitsYearLabel(
      include_all_commits,
      commits_year,
      i18n,
    )}`,
    value: totalCommits,
    id: "commits",
  };
  STATS.prs = {
    icon: icons.prs,
    label: i18n.t("statcard.prs"),
    value: totalPRs,
    id: "prs",
  };

  if (show.includes("prs_merged")) {
    STATS.prs_merged = {
      icon: icons.prs_merged,
      label: i18n.t("statcard.prs-merged"),
      value: totalPRsMerged,
      id: "prs_merged",
    };
  }

  if (show.includes("prs_merged_percentage")) {
    STATS.prs_merged_percentage = {
      icon: icons.prs_merged_percentage,
      label: i18n.t("statcard.prs-merged-percentage"),
      value: mergedPRsPercentage.toFixed(
        typeof number_precision === "number" && !isNaN(number_precision)
          ? clampValue(number_precision, 0, 2)
          : 2,
      ),
      id: "prs_merged_percentage",
      unitSymbol: "%",
    };
  }

  if (show.includes("reviews")) {
    STATS.reviews = {
      icon: icons.reviews,
      label: i18n.t("statcard.reviews"),
      value: totalReviews,
      id: "reviews",
    };
  }

  STATS.issues = {
    icon: icons.issues,
    label: i18n.t("statcard.issues"),
    value: totalIssues,
    id: "issues",
  };

  if (show.includes("discussions_started")) {
    STATS.discussions_started = {
      icon: icons.discussions_started,
      label: i18n.t("statcard.discussions-started"),
      value: totalDiscussionsStarted,
      id: "discussions_started",
    };
  }

  if (show.includes("discussions_answered")) {
    STATS.discussions_answered = {
      icon: icons.discussions_answered,
      label: i18n.t("statcard.discussions-answered"),
      value: totalDiscussionsAnswered,
      id: "discussions_answered",
    };
  }

  STATS.contribs = {
    icon: icons.contribs,
    label: i18n.t("statcard.contribs"),
    value: contributedTo,
    id: "contribs",
  };

  const isLongLocale = locale ? LONG_LOCALES.includes(locale) : false;

  // Filtra as estatísticas ocultas e cria os nós SVG
  const statItems = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key, index) => {
      const stat = STATS[key];

      return createTextNode({
        icon: stat.icon,
        label: stat.label,
        value: stat.value,
        id: stat.id,
        unitSymbol: stat.unitSymbol,
        index,
        showIcons: show_icons,
        shiftValuePos: 79.01 + (isLongLocale ? 50 : 0),
        bold: text_bold,
        numberFormat: number_format,
        numberPrecision: number_precision,
      });
    });

  if (statItems.length === 0 && hide_rank) {
    throw new CustomError(
      "Não foi possível renderizar o card de estatísticas.",
      "Pelo menos as estatísticas ou o rank são obrigatórios.",
    );
  }

  // Calcula a altura do card com base na quantidade de itens
  let height = Math.max(
    45 + (statItems.length + 1) * lheight,
    hide_rank ? 0 : statItems.length ? 150 : 180,
  );

  // Quanto menor o percentil do usuário, melhor o progresso (invertido)
  const progress = 100 - rank.percentile;
  const cssStyles = getStyles({
    titleColor: colors.titleColor,
    ringColor: colors.ringColor,
    textColor: colors.textColor,
    iconColor: colors.iconColor,
    show_icons,
    progress,
    font_family: colors.font_family,
  });

  const calculateTextWidth = () => {
    return measureText(
      custom_title
        ? custom_title
        : statItems.length
          ? i18n.t("statcard.title")
          : i18n.t("statcard.ranktitle"),
    );
  };

  /*
    Quando hide_rank=true: largura mínima = 270px + título e padding.
    Quando hide_rank=false: largura mínima = 340px + largura do ícone (se show_icons=true).
  */
  const iconWidth = show_icons && statItems.length ? 16 + /* padding */ 1 : 0;
  const minCardWidth =
    (hide_rank
      ? clampValue(
          50 /* padding */ + calculateTextWidth() * 2,
          CARD_MIN_WIDTH,
          Infinity,
        )
      : statItems.length
        ? RANK_CARD_MIN_WIDTH
        : RANK_ONLY_CARD_MIN_WIDTH) + iconWidth;
  const defaultCardWidth =
    (hide_rank
      ? CARD_DEFAULT_WIDTH
      : statItems.length
        ? RANK_CARD_DEFAULT_WIDTH
        : RANK_ONLY_CARD_DEFAULT_WIDTH) + iconWidth;

  let width = card_width
    ? isNaN(card_width)
      ? defaultCardWidth
      : card_width
    : defaultCardWidth;

  if (width < minCardWidth) {
    width = minCardWidth;
  }

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: statItems.length
      ? i18n.t("statcard.title")
      : i18n.t("statcard.ranktitle"),
    width,
    height,
    border_radius,
    colors: {
      ...colors,
      font_family: colors.font_family,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(cssStyles);

  if (disable_animations) {
    card.disableAnimations();
  }

  /**
   * Calcula a translação X do anel de rank para manter o padding correto.
   *
   * Para cards maiores que `RANK_CARD_DEFAULT_WIDTH`, usa o padding padrão de 70px.
   * Para cards menores, expande o padding proporcionalmente.
   */
  const calculateRankXTranslation = (): number => {
    if (statItems.length) {
      const minXTranslation = RANK_CARD_MIN_WIDTH + iconWidth - 70;
      if (width > RANK_CARD_DEFAULT_WIDTH) {
        const xMaxExpansion = minXTranslation + (450 - minCardWidth) / 2;
        return xMaxExpansion + width - RANK_CARD_DEFAULT_WIDTH;
      } else {
        return minXTranslation + (width - minCardWidth) / 2;
      }
    } else {
      return width / 2 + 20 - 10;
    }
  };

  // Anel de rank (condicional)
  const rankCircle = hide_rank
    ? ""
    : `<g data-testid="rank-circle"
          transform="translate(${calculateRankXTranslation()}, ${
            height / 2 - 50
          })">
        <circle class="rank-circle-rim" cx="-10" cy="8" r="40" />
        <circle class="rank-circle" cx="-10" cy="8" r="40" />
        <g class="rank-text">
          ${rankIcon(rank_icon as any, rank?.level, rank?.percentile)}
        </g>
      </g>`;

  // Labels de acessibilidade
  const labels = Object.keys(STATS)
    .filter((key) => !hide.includes(key))
    .map((key) => {
      const stat = STATS[key];
      if (key === "commits") {
        return `${i18n.t("statcard.commits")} ${getTotalCommitsYearLabel(
          include_all_commits,
          commits_year,
          i18n,
        )} : ${stat.value}`;
      }
      return `${stat.label}: ${stat.value}`;
    })
    .join(", ");

  card.setAccessibilityLabel({
    title: `${card.title}, Rank: ${rank.level}`,
    desc: labels,
  });

  return card.render(`
    ${rankCircle}
    <svg x="0" y="0">
      ${flexLayout({
        items: statItems,
        gap: lheight,
        direction: "column",
      }).join("")}
    </svg>
  `);
};

export { renderStatsCard };
export default renderStatsCard;
