/**
 * @fileoverview Card SVG de linguagens de programação mais usadas (Top Languages).
 *
 * Renderiza um card SVG com as linguagens de programação mais usadas pelo usuário
 * no GitHub. Suporta múltiplos layouts: normal (barras horizontais), compact
 * (barra única multi-cor), donut (gráfico de rosca), donut-vertical e pie (pizza).
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { formatBytes } from "../common/fmt.js";
import { I18n } from "../common/I18n.js";
import { chunkArray, clampValue, lowercaseTrim } from "../common/ops.js";
import {
  createProgressNode,
  flexLayout,
  measureText,
} from "../common/render.js";
import { langCardLocales } from "../translations.js";
import type { Lang, TopLangData } from "../fetchers/types.js";
import type { TopLangOptions } from "./types.js";

// ─── Constantes de layout ─────────────────────────────────────────────────────
/** Largura padrão do card em pixels. */
const DEFAULT_CARD_WIDTH = 300;
/** Largura mínima do card em pixels. */
const MIN_CARD_WIDTH = 280;
/** Cor padrão para linguagens sem cor definida. */
const DEFAULT_LANG_COLOR = "#858585";
/** Padding interno do card. */
const CARD_PADDING = 25;
/** Altura de base do layout compact. */
const COMPACT_LAYOUT_BASE_HEIGHT = 90;
/** Máximo de linguagens exibíveis. */
const MAXIMUM_LANGS_COUNT = 20;

// Número padrão de linguagens por layout
const NORMAL_LAYOUT_DEFAULT_LANGS_COUNT = 5;
const COMPACT_LAYOUT_DEFAULT_LANGS_COUNT = 6;
const DONUT_LAYOUT_DEFAULT_LANGS_COUNT = 5;
const PIE_LAYOUT_DEFAULT_LANGS_COUNT = 6;
const DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT = 6;

// ─── Helpers matemáticos ──────────────────────────────────────────────────────

/**
 * Retorna a linguagem com o nome mais longo no array.
 *
 * @param arr - Array de linguagens.
 * @returns Linguagem com o nome mais longo.
 */
const getLongestLang = (arr: Lang[]): Lang =>
  arr.reduce(
    (savedLang, lang) =>
      lang.name.length > savedLang.name.length ? lang : savedLang,
    { name: "", size: 0, color: "" },
  );

/**
 * Converte graus para radianos.
 * @param angleInDegrees - Ângulo em graus.
 * @returns Ângulo em radianos.
 */
const degreesToRadians = (angleInDegrees: number): number =>
  angleInDegrees * (Math.PI / 180.0);

/**
 * Converte radianos para graus.
 * @param angleInRadians - Ângulo em radianos.
 * @returns Ângulo em graus.
 */
const radiansToDegrees = (angleInRadians: number): number =>
  angleInRadians / (Math.PI / 180.0);

/**
 * Converte coordenadas polares para cartesianas.
 * @param centerX - Coordenada X do centro.
 * @param centerY - Coordenada Y do centro.
 * @param radius - Raio do círculo.
 * @param angleInDegrees - Ângulo em graus.
 * @returns Objeto com coordenadas `{ x, y }`.
 */
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
): { x: number; y: number } => {
  const rads = degreesToRadians(angleInDegrees);
  return {
    x: centerX + radius * Math.cos(rads),
    y: centerY + radius * Math.sin(rads),
  };
};

/**
 * Converte coordenadas cartesianas para polares.
 * @param centerX - Coordenada X do centro.
 * @param centerY - Coordenada Y do centro.
 * @param x - Coordenada X do ponto.
 * @param y - Coordenada Y do ponto.
 * @returns `{ radius, angleInDegrees }`.
 */
const cartesianToPolar = (
  centerX: number,
  centerY: number,
  x: number,
  y: number,
): { radius: number; angleInDegrees: number } => {
  const radius = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
  let angleInDegrees = radiansToDegrees(Math.atan2(y - centerY, x - centerX));
  if (angleInDegrees < 0) {
    angleInDegrees += 360;
  }
  return { radius, angleInDegrees };
};

/**
 * Calcula o comprimento total da circunferência de um círculo.
 * @param radius - Raio do círculo.
 * @returns Comprimento da circunferência.
 */
const getCircleLength = (radius: number): number => 2 * Math.PI * radius;

// ─── Cálculos de altura de layout ────────────────────────────────────────────

/** @param totalLangs - Número de linguagens. @returns Altura do card. */
const calculateCompactLayoutHeight = (totalLangs: number): number =>
  COMPACT_LAYOUT_BASE_HEIGHT + Math.round(totalLangs / 2) * 25;

const calculateNormalLayoutHeight = (totalLangs: number): number =>
  45 + (totalLangs + 1) * 40;

const calculateDonutLayoutHeight = (totalLangs: number): number =>
  215 + Math.max(totalLangs - 5, 0) * 32;

const calculateDonutVerticalLayoutHeight = (totalLangs: number): number =>
  300 + Math.round(totalLangs / 2) * 25;

const calculatePieLayoutHeight = (totalLangs: number): number =>
  300 + Math.round(totalLangs / 2) * 25;

/**
 * Calcula a translação central para centrar o gráfico donut.
 * @param totalLangs - Número de linguagens.
 */
const donutCenterTranslation = (totalLangs: number): number =>
  -45 + Math.max(totalLangs - 5, 0) * 16;

// ─── Funções utilitárias ──────────────────────────────────────────────────────

/**
 * Filtra e ordena as linguagens para exibição.
 *
 * @param topLangs - Dados brutos das linguagens.
 * @param langs_count - Número máximo de linguagens a exibir.
 * @param hide - Nomes de linguagens a ocultar.
 * @returns Array filtrado e o total de bytes.
 */
const trimTopLanguages = (
  topLangs: TopLangData,
  langs_count: number,
  hide?: string[],
): { langs: Lang[]; totalLanguageSize: number } => {
  let langs = Object.values(topLangs) as Lang[];
  const langsToHide: Record<string, boolean> = {};
  const langsCount = clampValue(langs_count, 1, MAXIMUM_LANGS_COUNT);

  if (hide) {
    hide.forEach((langName) => {
      langsToHide[lowercaseTrim(langName)] = true;
    });
  }

  langs = langs
    .sort((a, b) => b.size - a.size)
    .filter((lang) => !langsToHide[lowercaseTrim(lang.name)])
    .slice(0, langsCount);

  const totalLanguageSize = langs.reduce((acc, curr) => acc + curr.size, 0);

  return { langs, totalLanguageSize };
};

/**
 * Retorna o valor de exibição formatado (porcentagem ou bytes).
 * @param size - Tamanho em bytes.
 * @param percentages - Porcentagem.
 * @param format - Formato de saída ("bytes" ou "percentages").
 */
const getDisplayValue = (
  size: number,
  percentages: number,
  format: string,
): string => {
  return format === "bytes" ? formatBytes(size) : `${percentages.toFixed(2)}%`;
};

// ─── Renderizadores de nós SVG individuais ────────────────────────────────────

/**
 * Cria o nó SVG de barra de progresso com texto para uma linguagem (layout normal).
 */
const createProgressTextNode = ({
  width,
  color,
  name,
  size,
  totalSize,
  statsFormat,
  index,
}: {
  width: number;
  color: string;
  name: string;
  size: number;
  totalSize: number;
  statsFormat: string;
  index: number;
}): string => {
  const staggerDelay = (index + 3) * 150;
  const paddingRight = 95;
  const progressTextX = width - paddingRight + 10;
  const progressWidth = width - paddingRight;

  const progress = (size / totalSize) * 100;
  const displayValue = getDisplayValue(size, progress, statsFormat);

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms">
      <text data-testid="lang-name" x="2" y="15" class="lang-name">${name}</text>
      <text x="${progressTextX}" y="34" class="lang-name">${displayValue}</text>
      ${createProgressNode({
        x: 0,
        y: 25,
        color,
        width: progressWidth,
        progress,
        progressBarBackgroundColor: "#ddd",
        delay: staggerDelay + 300,
      })}
    </g>
  `;
};

/**
 * Cria o nó SVG de linguagem no layout compact (bolinha colorida + texto).
 */
const createCompactLangNode = ({
  lang,
  totalSize,
  hideProgress,
  statsFormat = "percentages",
  index,
}: {
  lang: Lang;
  totalSize: number;
  hideProgress?: boolean;
  statsFormat?: string;
  index: number;
}): string => {
  const percentages = (lang.size / totalSize) * 100;
  const displayValue = getDisplayValue(lang.size, percentages, statsFormat);

  const staggerDelay = (index + 3) * 150;
  const color = lang.color || "#858585";

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms">
      <circle cx="5" cy="6" r="5" fill="${color}" />
      <text data-testid="lang-name" x="15" y="10" class='lang-name'>
        ${lang.name} ${hideProgress ? "" : displayValue}
      </text>
    </g>
  `;
};

/**
 * Cria os nós de texto de linguagens em duas colunas (layout compact/donut).
 */
const createLanguageTextNode = ({
  langs,
  totalSize,
  hideProgress,
  statsFormat,
}: {
  langs: Lang[];
  totalSize: number;
  hideProgress?: boolean;
  statsFormat?: string;
}): string => {
  const longestLang = getLongestLang(langs);
  const chunked = chunkArray(langs, langs.length / 2);
  const layouts = chunked.map((array) => {
    const items = (array as Lang[]).map((lang, index) =>
      createCompactLangNode({
        lang,
        totalSize,
        hideProgress,
        statsFormat,
        index,
      }),
    );
    return flexLayout({
      items,
      gap: 25,
      direction: "column",
    }).join("");
  });

  const percent = ((longestLang.size / totalSize) * 100).toFixed(2);
  const minGap = 150;
  const maxGap = 20 + measureText(`${longestLang.name} ${percent}%`, 11);
  return flexLayout({
    items: layouts,
    gap: maxGap < minGap ? minGap : maxGap,
  }).join("");
};

/**
 * Cria os nós de linguagem para o layout donut (lista vertical com bolinhas).
 */
const createDonutLanguagesNode = ({
  langs,
  totalSize,
  statsFormat,
}: {
  langs: Lang[];
  totalSize: number;
  statsFormat: string;
}): string => {
  return flexLayout({
    items: langs.map((lang, index) => {
      return createCompactLangNode({
        lang,
        totalSize,
        hideProgress: false,
        statsFormat,
        index,
      });
    }),
    gap: 32,
    direction: "column",
  }).join("");
};

// ─── Renderizadores de layout ─────────────────────────────────────────────────

/** Renderiza o layout normal (barras de progresso individuais). */
const renderNormalLayout = (
  langs: Lang[],
  width: number,
  totalLanguageSize: number,
  statsFormat: string,
): string => {
  return flexLayout({
    items: langs.map((lang, index) => {
      return createProgressTextNode({
        width,
        name: lang.name,
        color: lang.color || DEFAULT_LANG_COLOR,
        size: lang.size,
        totalSize: totalLanguageSize,
        statsFormat,
        index,
      });
    }),
    gap: 40,
    direction: "column",
  }).join("");
};

/** Renderiza o layout compact (barra única multi-cor + lista em duas colunas). */
const renderCompactLayout = (
  langs: Lang[],
  width: number,
  totalLanguageSize: number,
  hideProgress: boolean | undefined,
  statsFormat = "percentages",
): string => {
  const paddingRight = 50;
  const offsetWidth = width - paddingRight;
  let progressOffset = 0;

  const compactProgressBar = langs
    .map((lang) => {
      const percentage = parseFloat(
        ((lang.size / totalLanguageSize) * offsetWidth).toFixed(2),
      );
      const progress = percentage < 10 ? percentage + 10 : percentage;
      const output = `
        <rect
          mask="url(#rect-mask)"
          data-testid="lang-progress"
          x="${progressOffset}"
          y="0"
          width="${progress}"
          height="8"
          fill="${lang.color || "#858585"}"
        />
      `;
      progressOffset += percentage;
      return output;
    })
    .join("");

  return `
  ${
    hideProgress
      ? ""
      : `
      <mask id="rect-mask">
          <rect x="0" y="0" width="${offsetWidth}" height="8" fill="white" rx="5"/>
        </mask>
        ${compactProgressBar}
      `
  }
    <g transform="translate(0, ${hideProgress ? "0" : "25"})">
      ${createLanguageTextNode({
        langs,
        totalSize: totalLanguageSize,
        hideProgress,
        statsFormat,
      })}
    </g>
  `;
};

/** Renderiza o layout donut-vertical (gráfico circular vertical). */
const renderDonutVerticalLayout = (
  langs: Lang[],
  totalLanguageSize: number,
  statsFormat: string,
): string => {
  const radius = 80;
  const totalCircleLength = getCircleLength(radius);
  const circles: string[] = [];
  let indent = 0;
  let startDelayCoefficient = 1;

  for (const lang of langs) {
    const percentage = (lang.size / totalLanguageSize) * 100;
    const circleLength = totalCircleLength * (percentage / 100);
    const delay = startDelayCoefficient * 100;

    circles.push(`
      <g class="stagger" style="animation-delay: ${delay}ms">
        <circle 
          cx="150"
          cy="100"
          r="${radius}"
          fill="transparent"
          stroke="${lang.color}"
          stroke-width="25"
          stroke-dasharray="${totalCircleLength}"
          stroke-dashoffset="${indent}"
          size="${percentage}"
          data-testid="lang-donut"
        />
      </g>
    `);

    indent += circleLength;
    startDelayCoefficient += 1;
  }

  return `
    <svg data-testid="lang-items">
      <g transform="translate(0, 0)">
        <svg data-testid="donut">
          ${circles.join("")}
        </svg>
      </g>
      <g transform="translate(0, 220)">
        <svg data-testid="lang-names" x="${CARD_PADDING}">
          ${createLanguageTextNode({
            langs,
            totalSize: totalLanguageSize,
            hideProgress: false,
            statsFormat,
          })}
        </svg>
      </g>
    </svg>
  `;
};

/** Renderiza o layout de pizza (gráfico tipo pie). */
const renderPieLayout = (
  langs: Lang[],
  totalLanguageSize: number,
  statsFormat: string,
): string => {
  const radius = 90;
  const centerX = 150;
  const centerY = 100;
  let startAngle = 0;
  let startDelayCoefficient = 1;
  const paths: string[] = [];

  for (const lang of langs) {
    if (langs.length === 1) {
      paths.push(`
        <circle
          cx="${centerX}"
          cy="${centerY}"
          r="${radius}"
          stroke="none"
          fill="${lang.color}"
          data-testid="lang-pie"
          size="100"
        />
      `);
      break;
    }

    const langSizePart = lang.size / totalLanguageSize;
    const percentage = langSizePart * 100;
    const angle = langSizePart * 360;
    const endAngle = startAngle + angle;
    const startPoint = polarToCartesian(centerX, centerY, radius, startAngle);
    const endPoint = polarToCartesian(centerX, centerY, radius, endAngle);
    const largeArcFlag = angle > 180 ? 1 : 0;
    const delay = startDelayCoefficient * 100;

    paths.push(`
      <g class="stagger" style="animation-delay: ${delay}ms">
        <path
          data-testid="lang-pie"
          size="${percentage}"
          d="M ${centerX} ${centerY} L ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endPoint.x} ${endPoint.y} Z"
          fill="${lang.color}"
        />
      </g>
    `);

    startAngle = endAngle;
    startDelayCoefficient += 1;
  }

  return `
    <svg data-testid="lang-items">
      <g transform="translate(0, 0)">
        <svg data-testid="pie">
          ${paths.join("")}
        </svg>
      </g>
      <g transform="translate(0, 220)">
        <svg data-testid="lang-names" x="${CARD_PADDING}">
          ${createLanguageTextNode({
            langs,
            totalSize: totalLanguageSize,
            hideProgress: false,
            statsFormat,
          })}
        </svg>
      </g>
    </svg>
  `;
};

/**
 * Tipo de segmento do gráfico donut.
 */
type DonutPath = { d: string; percent: number };

/**
 * Calcula os caminhos SVG para cada segmento do gráfico donut.
 */
const createDonutPaths = (
  cx: number,
  cy: number,
  radius: number,
  percentages: number[],
): DonutPath[] => {
  const paths: DonutPath[] = [];
  let startAngle = 0;
  let endAngle = 0;

  const totalPercent = percentages.reduce((acc, curr) => acc + curr, 0);
  for (let i = 0; i < percentages.length; i++) {
    const tmpPath: Partial<DonutPath> = {};

    const percent = parseFloat(
      ((percentages[i] / totalPercent) * 100).toFixed(2),
    );

    endAngle = 3.6 * percent + startAngle;
    const startPoint = polarToCartesian(cx, cy, radius, endAngle - 90);
    const endPoint = polarToCartesian(cx, cy, radius, startAngle - 90);
    const largeArc = endAngle - startAngle <= 180 ? 0 : 1;

    tmpPath.percent = percent;
    tmpPath.d = `M ${startPoint.x} ${startPoint.y} A ${radius} ${radius} 0 ${largeArc} 0 ${endPoint.x} ${endPoint.y}`;

    paths.push(tmpPath as DonutPath);
    startAngle = endAngle;
  }

  return paths;
};

/** Renderiza o layout donut (gráfico de rosca com legenda). */
const renderDonutLayout = (
  langs: Lang[],
  width: number,
  totalLanguageSize: number,
  statsFormat: string,
): string => {
  const centerX = width / 3;
  const centerY = width / 3;
  const radius = centerX - 60;
  const strokeWidth = 12;

  const colors = langs.map((lang) => lang.color);
  const langsPercents = langs.map((lang) =>
    parseFloat(((lang.size / totalLanguageSize) * 100).toFixed(2)),
  );

  const langPaths = createDonutPaths(centerX, centerY, radius, langsPercents);

  const donutPaths =
    langs.length === 1
      ? `<circle cx="${centerX}" cy="${centerY}" r="${radius}" stroke="${colors[0]}" fill="none" stroke-width="${strokeWidth}" data-testid="lang-donut" size="100"/>`
      : langPaths
          .map((section, index) => {
            const staggerDelay = (index + 3) * 100;
            const delay = staggerDelay + 300;

            return `
       <g class="stagger" style="animation-delay: ${delay}ms">
        <path
          data-testid="lang-donut"
          size="${section.percent}"
          d="${section.d}"
          stroke="${colors[index]}"
          fill="none"
          stroke-width="${strokeWidth}">
        </path>
      </g>
      `;
          })
          .join("");

  const donut = `<svg width="${width}" height="${width}">${donutPaths}</svg>`;

  return `
    <g transform="translate(0, 0)">
      <g transform="translate(0, 0)">
        ${createDonutLanguagesNode({ langs, totalSize: totalLanguageSize, statsFormat })}
      </g>

      <g transform="translate(125, ${donutCenterTranslation(langs.length)})">
        ${donut}
      </g>
    </g>
  `;
};

/** Tipo de layout do card. */
type Layout = TopLangOptions["layout"];

/**
 * Cria o nó SVG para quando não há dados de linguagem.
 */
const noLanguagesDataNode = ({
  color,
  text,
  layout,
}: {
  color: string;
  text: string;
  layout?: Layout;
}): string => {
  return `
    <text x="${
      layout === "pie" || layout === "donut-vertical" ? CARD_PADDING : 0
    }" y="11" class="stat bold" fill="${color}">${text}</text>
  `;
};

/**
 * Retorna o número padrão de linguagens para o layout especificado.
 */
const getDefaultLanguagesCountByLayout = ({
  layout,
  hide_progress,
}: {
  layout?: Layout;
  hide_progress?: boolean;
}): number => {
  if (layout === "compact" || hide_progress === true) {
    return COMPACT_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "donut") {
    return DONUT_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "donut-vertical") {
    return DONUT_VERTICAL_LAYOUT_DEFAULT_LANGS_COUNT;
  } else if (layout === "pie") {
    return PIE_LAYOUT_DEFAULT_LANGS_COUNT;
  } else {
    return NORMAL_LAYOUT_DEFAULT_LANGS_COUNT;
  }
};

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Renderiza o card SVG das linguagens de programação mais usadas.
 *
 * @param topLangs - Dados das linguagens retornados por `fetchTopLanguages`.
 * @param options - Opções de personalização visual do card.
 * @returns String SVG do card pronto para uso no README.
 *
 * @example
 * const svg = renderTopLanguages(langs, { layout: "compact", langs_count: 8 });
 */
const renderTopLanguages = (
  topLangs: TopLangData,
  options: Partial<TopLangOptions> = {},
): string => {
  const {
    hide_title = false,
    hide_border = false,
    card_width,
    title_color,
    icon_color,
    text_color,
    bg_color,
    ring_color,
    hide,
    hide_progress,
    theme,
    layout,
    custom_title,
    locale,
    langs_count = getDefaultLanguagesCountByLayout({ layout, hide_progress }),
    border_radius,
    border_color,
    disable_animations,
    stats_format = "percentages",
    font_family,
  } = options;

  const i18n = new I18n({
    locale,
    translations: langCardLocales,
  });

  const { langs, totalLanguageSize } = trimTopLanguages(
    topLangs,
    langs_count,
    hide,
  );

  let width = card_width
    ? isNaN(card_width)
      ? DEFAULT_CARD_WIDTH
      : card_width < MIN_CARD_WIDTH
        ? MIN_CARD_WIDTH
        : card_width
    : DEFAULT_CARD_WIDTH;
  let height = calculateNormalLayoutHeight(langs.length);

  // Resolve as cores do tema com overrides do usuário
  const { titleColor, iconColor, textColor, bgColor, borderColor, ringColor } =
    getCardColors({
      title_color,
      text_color,
      icon_color,
      bg_color,
      border_color,
      theme,
      ring_color,
    });

  const colors = {
    titleColor,
    iconColor,
    textColor,
    bgColor,
    borderColor,
    ringColor,
    font_family,
  };

  let finalLayout = "";

  if (langs.length === 0) {
    height = COMPACT_LAYOUT_BASE_HEIGHT;
    finalLayout = noLanguagesDataNode({
      color: colors.textColor,
      text: i18n.t("langcard.nodata"),
      layout,
    });
  } else if (layout === "pie") {
    height = calculatePieLayoutHeight(langs.length);
    finalLayout = renderPieLayout(langs, totalLanguageSize, stats_format);
  } else if (layout === "donut-vertical") {
    height = calculateDonutVerticalLayoutHeight(langs.length);
    finalLayout = renderDonutVerticalLayout(
      langs,
      totalLanguageSize,
      stats_format,
    );
  } else if (layout === "compact" || hide_progress == true) {
    height =
      calculateCompactLayoutHeight(langs.length) + (hide_progress ? -25 : 0);
    finalLayout = renderCompactLayout(
      langs,
      width,
      totalLanguageSize,
      hide_progress,
      stats_format,
    );
  } else if (layout === "donut") {
    height = calculateDonutLayoutHeight(langs.length);
    width = width + 50; // padding extra
    finalLayout = renderDonutLayout(
      langs,
      width,
      totalLanguageSize,
      stats_format,
    );
  } else {
    finalLayout = renderNormalLayout(
      langs,
      width,
      totalLanguageSize,
      stats_format,
    );
  }

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t("langcard.title"),
    width,
    height,
    border_radius,
    colors,
  });

  if (disable_animations) {
    card.disableAnimations();
  }

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(
    `
    @keyframes slideInAnimation {
      from {
        width: 0;
      }
      to {
        width: calc(100%-100px);
      }
    }
    @keyframes growWidthAnimation {
      from {
        width: 0;
      }
      to {
        width: 100%;
      }
    }
    .stat {
      font: 600 14px "${colors.font_family || "'Segoe UI', Ubuntu, \"Helvetica Neue\", Sans-Serif"}"; fill: ${colors.textColor};
    }
    @supports(-moz-appearance: auto) {
      /* Seletor detecta Firefox */
      .stat { font-size:12px; }
    }
    .bold { font-weight: 700 }
    .lang-name {
      font: 400 11px "${colors.font_family || "'Segoe UI', Ubuntu, Sans-Serif"}";
      fill: ${colors.textColor};
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    #rect-mask rect{
      animation: slideInAnimation 1s ease-in-out forwards;
    }
    .lang-progress{
      animation: growWidthAnimation 0.6s ease-in-out forwards;
    }
    `,
  );

  if (layout === "pie" || layout === "donut-vertical") {
    return card.render(finalLayout);
  }

  return card.render(`
    <svg data-testid="lang-items" x="${CARD_PADDING}">
      ${finalLayout}
    </svg>
  `);
};

export {
  getLongestLang,
  degreesToRadians,
  radiansToDegrees,
  polarToCartesian,
  cartesianToPolar,
  getCircleLength,
  calculateCompactLayoutHeight,
  calculateNormalLayoutHeight,
  calculateDonutLayoutHeight,
  calculateDonutVerticalLayoutHeight,
  calculatePieLayoutHeight,
  donutCenterTranslation,
  trimTopLanguages,
  renderTopLanguages,
  MIN_CARD_WIDTH,
  getDefaultLanguagesCountByLayout,
};
