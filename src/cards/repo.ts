/**
 * @fileoverview Card SVG de repositório do GitHub.
 *
 * Renderiza um card SVG com as informações de um repositório do GitHub:
 * nome, descrição, linguagem principal, estrelas e forks.
 * Suporta badges de "Template" e "Arquivado".
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { kFormatter, wrapTextMultiline } from "../common/fmt.js";
import { encodeHTML } from "../common/html.js";
import { I18n } from "../common/I18n.js";
import { icons } from "../common/icons.js";
import { clampValue, parseEmojis } from "../common/ops.js";
import {
  flexLayout,
  measureText,
  iconWithLabel,
  createLanguageNode,
} from "../common/render.js";
import { repoCardLocales } from "../translations.js";
import type { RepositoryData } from "../fetchers/types.js";
import type { RepoCardOptions } from "./types.js";

/** Tamanho dos ícones em pixels. */
const ICON_SIZE = 16;
/** Largura máxima de cada linha da descrição (em caracteres). */
const DESCRIPTION_LINE_WIDTH = 59;
/** Número máximo de linhas da descrição. */
const DESCRIPTION_MAX_LINES = 3;

/**
 * Cria o SVG do badge (Template ou Arquivado) exibido no canto do card.
 *
 * @param label - Texto do badge (ex.: "Template" ou "Arquivado").
 * @param textColor - Cor do texto e borda do badge.
 * @returns String SVG do badge.
 */
const getBadgeSVG = (label: string, textColor: string): string => `
  <g data-testid="badge" class="badge" transform="translate(320, -18)">
    <rect stroke="${textColor}" stroke-width="1" width="70" height="20" x="-12" y="-14" ry="10" rx="10"></rect>
    <text
      x="23" y="-5"
      alignment-baseline="central"
      dominant-baseline="central"
      text-anchor="middle"
      fill="${textColor}"
    >
      ${label}
    </text>
  </g>
`;

/**
 * Renderiza o card SVG de um repositório do GitHub.
 *
 * Exibe o nome do repositório, descrição, linguagem principal,
 * total de estrelas e total de forks. Suporta badges para
 * repositórios template e arquivados.
 *
 * @param repo - Dados do repositório retornados por `fetchRepo`.
 * @param options - Opções de personalização visual do card.
 * @returns String SVG do card do repositório pronto para uso no README.
 *
 * @example
 * const svg = renderRepoCard(dadosDoRepo, { theme: "dark", show_owner: true });
 */
const renderRepoCard = (
  repo: RepositoryData,
  options: Partial<RepoCardOptions> = {},
): string => {
  const {
    name,
    nameWithOwner,
    description,
    primaryLanguage,
    isArchived,
    isTemplate,
    starCount,
    forkCount,
  } = repo;

  const {
    hide_border = false,
    title_color,
    icon_color,
    text_color,
    bg_color,
    show_owner = false,
    theme = "default_repocard" as any,
    border_radius,
    border_color,
    locale,
    description_lines_count,
    font_family,
  } = options;

  const lineHeight = 10;
  const header = show_owner ? nameWithOwner : name;
  const langName =
    (primaryLanguage && primaryLanguage.name) || "Não especificado";
  const langColor = (primaryLanguage && primaryLanguage.color) || "#333";
  const descriptionMaxLines = description_lines_count
    ? clampValue(description_lines_count, 1, DESCRIPTION_MAX_LINES)
    : DESCRIPTION_MAX_LINES;

  const desc = parseEmojis(description || "Sem descrição");
  const multiLineDescription = wrapTextMultiline(
    desc,
    DESCRIPTION_LINE_WIDTH,
    descriptionMaxLines,
  );
  const descriptionLinesCount = description_lines_count
    ? clampValue(description_lines_count, 1, DESCRIPTION_MAX_LINES)
    : multiLineDescription.length;

  const descriptionSvg = multiLineDescription
    .map((line) => `<tspan dy="1.2em" x="25">${encodeHTML(line)}</tspan>`)
    .join("");

  const height =
    (descriptionLinesCount > 1 ? 120 : 110) +
    descriptionLinesCount * lineHeight;

  const i18n = new I18n({
    locale,
    translations: repoCardLocales,
  });

  // Resolve as cores do tema com os overrides fornecidos pelo usuário
  const colors = getCardColors({
    title_color,
    icon_color,
    text_color,
    bg_color,
    border_color,
    theme,
  });

  const svgLanguage = primaryLanguage
    ? createLanguageNode(langName, langColor)
    : "";

  const totalStars = kFormatter(starCount);
  const totalForks = kFormatter(forkCount);
  const svgStars = iconWithLabel(
    icons.star,
    totalStars,
    "stargazers",
    ICON_SIZE,
  );
  const svgForks = iconWithLabel(
    icons.fork,
    totalForks,
    "forkcount",
    ICON_SIZE,
  );

  const starAndForkCount = flexLayout({
    items: [svgLanguage, svgStars, svgForks],
    sizes: [
      measureText(langName, 12),
      ICON_SIZE + measureText(`${totalStars}`, 12),
      ICON_SIZE + measureText(`${totalForks}`, 12),
    ],
    gap: 25,
  }).join("");

  const card = new Card({
    defaultTitle: header.length > 35 ? `${header.slice(0, 35)}...` : header,
    titlePrefixIcon: icons.contribs,
    width: 400,
    height,
    border_radius,
    colors: {
      titleColor: colors.titleColor,
      textColor: colors.textColor,
      iconColor: colors.iconColor,
      bgColor: colors.bgColor,
      borderColor: colors.borderColor,
      font_family,
    },
  });

  card.disableAnimations();
  card.setHideBorder(hide_border);
  card.setHideTitle(false);
  card.setCSS(`
    .description { font: 400 13px "${card.font_family}"; fill: ${colors.textColor} }
    .gray { font: 400 12px "${card.font_family}"; fill: ${colors.textColor} }
    .icon { fill: ${colors.iconColor} }
    .badge { font: 600 11px "${card.font_family}"; }
    .badge rect { opacity: 0.2 }
  `);

  return card.render(`
    ${
      isTemplate
        ? getBadgeSVG(i18n.t("repocard.template"), colors.textColor)
        : isArchived
          ? getBadgeSVG(i18n.t("repocard.archived"), colors.textColor)
          : ""
    }

    <text class="description" x="25" y="-5">
      ${descriptionSvg}
    </text>

    <g transform="translate(30, ${height - 75})">
      ${starAndForkCount}
    </g>
  `);
};

export { renderRepoCard };
export default renderRepoCard;
