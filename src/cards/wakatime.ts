/**
 * @fileoverview Card SVG do WakaTime para GitHub README Stats.
 *
 * Renderiza um card SVG com as estatísticas de tempo de codificação
 * do WakaTime: linguagens usadas, tempo total e barras de progresso.
 * Suporta layouts "normal" (com barras) e "compact" (barra única multi-cor).
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { I18n } from "../common/I18n.js";
import { clampValue, lowercaseTrim } from "../common/ops.js";
import { createProgressNode, flexLayout } from "../common/render.js";
import { wakatimeCardLocales } from "../translations.js";
import type { WakaTimeData, WakaTimeLang } from "../fetchers/types.js";
import type { WakaTimeOptions } from "./types.js";

// Importa cores das linguagens (workaround para vercel v16.14.0)
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const languageColors: Record<
  string,
  string
> = require("../common/languageColors.json");

// ─── Constantes de layout ─────────────────────────────────────────────────────
/** Largura padrão do card em pixels. */
const DEFAULT_CARD_WIDTH = 495;
/** Largura mínima do card em pixels (layout normal). */
const MIN_CARD_WIDTH = 250;
/** Largura mínima do layout compact. */
const COMPACT_LAYOUT_MIN_WIDTH = 400;
/** Altura padrão de linha em pixels. */
const DEFAULT_LINE_HEIGHT = 25;
/** Padding da barra de progresso (layout normal com barra). */
const PROGRESSBAR_PADDING = 130;
/** Padding da barra de progresso (layout normal sem barra). */
const HIDDEN_PROGRESSBAR_PADDING = 170;
/** Padding da barra de progresso compact. */
const COMPACT_LAYOUT_PROGRESSBAR_PADDING = 25;
/** Largura total de texto disponível. */
const TOTAL_TEXT_WIDTH = 275;

// ─── Helpers de renderização SVG ─────────────────────────────────────────────

/**
 * Cria o nó SVG para quando não há atividade de codificação.
 *
 * @param props - Objeto com cor e texto.
 * @returns String SVG da mensagem de sem atividade.
 */
const noCodingActivityNode = ({
  color,
  text,
}: {
  color: string;
  text: string;
}): string => {
  return `
    <text x="25" y="11" class="stat bold" fill="${color}">${text}</text>
  `;
};

/**
 * Formata o valor de uma linguagem de acordo com o formato de exibição.
 *
 * @param args - Objeto com `lang` e `display_format`.
 * @returns String formatada (ex.: "1 hr 30 mins" ou "45.32 %").
 */
const formatLanguageValue = ({
  display_format,
  lang,
}: {
  display_format: "time" | "percent";
  lang: WakaTimeLang;
}): string => {
  return display_format === "percent"
    ? `${lang.percent.toFixed(2).toString()} %`
    : lang.text;
};

/**
 * Cria um nó de linguagem no layout compact (bolinhas coloridas com texto).
 *
 * @param args - Parâmetros do nó.
 * @returns String SVG do nó compact.
 */
const createCompactLangNode = ({
  lang,
  x,
  y,
  display_format,
}: {
  lang: WakaTimeLang;
  x: number;
  y: number;
  display_format: "time" | "percent";
}): string => {
  const color = languageColors[lang.name] || "#858585";
  const value = formatLanguageValue({ display_format, lang });

  return `
    <g transform="translate(${x}, ${y})">
      <circle cx="5" cy="6" r="5" fill="${color}" />
      <text data-testid="lang-name" x="15" y="10" class='lang-name'>
        ${lang.name} - ${value}
      </text>
    </g>
  `;
};

/**
 * Cria os nós de texto de linguagem para o layout compact (duas colunas).
 *
 * @param args - Parâmetros de layout.
 * @returns Array de strings SVG de nós de linguagem.
 */
const createLanguageTextNode = ({
  langs,
  y,
  display_format,
  card_width,
}: {
  langs: WakaTimeLang[];
  y: number;
  display_format: "time" | "percent";
  card_width: number;
}): string[] => {
  const LEFT_X = 25;
  const RIGHT_X_BASE = 230;
  const rightOffset = (card_width - DEFAULT_CARD_WIDTH) / 2;
  const RIGHT_X = RIGHT_X_BASE + rightOffset;

  return langs.map((lang, index) => {
    const isLeft = index % 2 === 0;
    return createCompactLangNode({
      lang,
      x: isLeft ? LEFT_X : RIGHT_X,
      y: y + DEFAULT_LINE_HEIGHT * Math.floor(index / 2),
      display_format,
    });
  });
};

/**
 * Parâmetros do nó de texto de estatística individual.
 */
type ParamsCreateTextNode = {
  id: string;
  label: string;
  value: string;
  index: number;
  percent: number;
  hideProgress?: boolean;
  progressBarColor: string;
  progressBarBackgroundColor: string;
  progressBarWidth: number;
};

/**
 * Cria um item de texto de estatística de linguagem com barra de progresso opcional.
 *
 * @param params - Parâmetros do item.
 * @returns String SVG do item de estatística.
 */
const createTextNode = ({
  id,
  label,
  value,
  index,
  percent,
  hideProgress,
  progressBarColor,
  progressBarBackgroundColor,
  progressBarWidth,
}: ParamsCreateTextNode): string => {
  const staggerDelay = (index + 3) * 150;
  const cardProgress = hideProgress
    ? null
    : createProgressNode({
        x: 110,
        y: 4,
        progress: percent,
        color: progressBarColor,
        width: progressBarWidth,
        progressBarBackgroundColor,
        delay: staggerDelay + 300,
      });

  return `
    <g class="stagger" style="animation-delay: ${staggerDelay}ms" transform="translate(25, 0)">
      <text class="stat bold" y="12.5" data-testid="${id}">${label}:</text>
      <text
        class="stat"
        x="${hideProgress ? HIDDEN_PROGRESSBAR_PADDING : PROGRESSBAR_PADDING + progressBarWidth}"
        y="12.5"
      >${value}</text>
      ${cardProgress}
    </g>
  `;
};

/**
 * Recalcula os percentuais das linguagens após filtros para que somem 100%.
 *
 * Necessário quando linguagens são ocultadas, para que a barra de progresso
 * do layout compact não quebre visualmente.
 *
 * @param languages - Array de linguagens a recalcular.
 */
const recalculatePercentages = (languages: WakaTimeLang[]): void => {
  const totalSum = languages.reduce(
    (totalSum, language) => totalSum + language.percent,
    0,
  );
  const weight = +(100 / totalSum).toFixed(2);
  languages.forEach((language) => {
    language.percent = +(language.percent * weight).toFixed(2);
  });
};

/**
 * Gera os estilos CSS do card WakaTime.
 *
 * @param colors - Cores do card.
 * @returns String CSS com os estilos do card.
 */
const getStyles = ({
  textColor,
  fontFamily,
}: {
  textColor: string;
  fontFamily: string;
}): string => {
  return `
    .stat {
      font: 600 14px "${fontFamily}"; fill: ${textColor};
    }
    @supports(-moz-appearance: auto) {
      /* Seletor detecta Firefox */
      .stat { font-size:12px; }
    }
    .stagger {
      opacity: 0;
      animation: fadeInAnimation 0.3s ease-in-out forwards;
    }
    .not_bold { font-weight: 400 }
    .bold { font-weight: 700 }
  `;
};

/**
 * Normaliza a largura do card para um valor válido.
 *
 * @param args - Parâmetros de normalização.
 * @returns Largura normalizada em pixels.
 */
const normalizeCardWidth = ({
  value,
  layout,
}: {
  value: number | undefined;
  layout: WakaTimeOptions["layout"] | undefined;
}): number => {
  if (value === undefined || value === null || isNaN(value)) {
    return DEFAULT_CARD_WIDTH;
  }
  return Math.max(
    layout === "compact" ? COMPACT_LAYOUT_MIN_WIDTH : MIN_CARD_WIDTH,
    value,
  );
};

// ─── Função principal ─────────────────────────────────────────────────────────

/**
 * Renderiza o card SVG do WakaTime.
 *
 * Exibe as linguagens de programação mais usadas pelo usuário no WakaTime,
 * com barras de progresso animadas, tempo total e suporte a múltiplos layouts.
 *
 * **Layouts disponíveis:**
 * - `normal`: Lista vertical com barras de progresso individuais.
 * - `compact`: Lista em duas colunas com barra de progresso única multi-cor.
 *
 * @param stats - Dados do WakaTime retornados por `fetchWakatimeStats`.
 * @param options - Opções de personalização visual do card.
 * @returns String SVG do card WakaTime pronto para uso no README.
 *
 * @example
 * const svg = renderWakatimeCard(dadosWakatime, { theme: "dark", layout: "compact" });
 */
const renderWakatimeCard = (
  stats: Partial<WakaTimeData> = {},
  options: Partial<WakaTimeOptions> = { hide: [] },
): string => {
  let { languages = [] } = stats;
  const {
    hide_title = false,
    hide_border = false,
    card_width,
    hide,
    line_height = DEFAULT_LINE_HEIGHT,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme = "default" as any,
    hide_progress,
    custom_title,
    locale,
    layout,
    langs_count = languages.length,
    border_radius,
    border_color,
    display_format = "time",
    disable_animations,
    font_family,
  } = options;

  const normalizedWidth = normalizeCardWidth({ value: card_width, layout });

  const shouldHideLangs = Array.isArray(hide) && hide.length > 0;
  if (shouldHideLangs) {
    const languagesToHide = new Set(hide!.map((lang) => lowercaseTrim(lang)));
    languages = languages.filter(
      (lang) => !languagesToHide.has(lowercaseTrim(lang.name)),
    );
  }

  languages = languages.slice(0, langs_count);
  recalculatePercentages(languages);

  const i18n = new I18n({
    locale,
    translations: wakatimeCardLocales,
  });

  const lheight = parseInt(String(line_height), 10);
  const langsCount = clampValue(langs_count, 1, langs_count);

  // Resolve as cores do tema com os overrides fornecidos pelo usuário
  const { titleColor, textColor, iconColor, bgColor, borderColor } =
    getCardColors({
      title_color,
      icon_color,
      text_color,
      bg_color,
      border_color,
      theme,
    });

  const filteredLanguages = languages
    .filter((language) => (language as any).hours || (language as any).minutes)
    .slice(0, langsCount);

  let height = Math.max(45 + (filteredLanguages.length + 1) * lheight, 150);

  const cssStyles = getStyles({
    textColor,
    fontFamily: font_family || "'Segoe UI', Ubuntu, Sans-Serif",
  });

  let finalLayout = "";

  // ── Layout compact ────────────────────────────────────────────────────────
  if (layout === "compact") {
    const width = normalizedWidth - 5;
    height =
      90 + Math.round(filteredLanguages.length / 2) * DEFAULT_LINE_HEIGHT;

    let progressOffset = 0;
    const compactProgressBar = filteredLanguages
      .map((language) => {
        const progress =
          ((width - COMPACT_LAYOUT_PROGRESSBAR_PADDING) * language.percent) /
          100;

        const languageColor = languageColors[language.name] || "#858585";

        const output = `
          <rect
            mask="url(#rect-mask)"
            data-testid="lang-progress"
            x="${progressOffset}"
            y="0"
            width="${progress}"
            height="8"
            fill="${languageColor}"
          />
        `;
        progressOffset += progress;
        return output;
      })
      .join("");

    finalLayout = `
      <mask id="rect-mask">
      <rect x="${COMPACT_LAYOUT_PROGRESSBAR_PADDING}" y="0" width="${width - 2 * COMPACT_LAYOUT_PROGRESSBAR_PADDING}" height="8" fill="white" rx="5" />
      </mask>
      ${compactProgressBar}
      ${
        filteredLanguages.length
          ? createLanguageTextNode({
              y: 25,
              langs: filteredLanguages,
              display_format: display_format as "time" | "percent",
              card_width: normalizedWidth,
            }).join("")
          : noCodingActivityNode({
              color: textColor,
              text: stats.is_coding_activity_visible
                ? stats.is_other_usage_visible
                  ? i18n.t("wakatimecard.nocodingactivity")
                  : i18n.t("wakatimecard.nocodedetails")
                : i18n.t("wakatimecard.notpublic"),
            })
      }
    `;
  } else {
    // ── Layout normal ─────────────────────────────────────────────────────
    finalLayout = flexLayout({
      items: filteredLanguages.length
        ? filteredLanguages.map((language, index) => {
            return createTextNode({
              id: language.name,
              label: language.name,
              value: formatLanguageValue({
                display_format: display_format as "time" | "percent",
                lang: language,
              }),
              index,
              percent: language.percent,
              progressBarColor: titleColor,
              progressBarBackgroundColor: textColor,
              hideProgress: hide_progress,
              progressBarWidth: normalizedWidth - TOTAL_TEXT_WIDTH,
            });
          })
        : [
            noCodingActivityNode({
              color: textColor,
              text: stats.is_coding_activity_visible
                ? stats.is_other_usage_visible
                  ? i18n.t("wakatimecard.nocodingactivity")
                  : i18n.t("wakatimecard.nocodedetails")
                : i18n.t("wakatimecard.notpublic"),
            }),
          ],
      gap: lheight,
      direction: "column",
    }).join("");
  }

  // Determina o título com o período de análise
  let titleText = i18n.t("wakatimecard.title");
  switch (stats.range) {
    case "last_7_days":
      titleText += ` (${i18n.t("wakatimecard.last7days")})`;
      break;
    case "last_year":
      titleText += ` (${i18n.t("wakatimecard.lastyear")})`;
      break;
  }

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: titleText,
    width: normalizedWidth,
    height,
    border_radius,
    colors: {
      titleColor,
      textColor,
      iconColor,
      bgColor,
      borderColor,
      font_family,
    },
  });

  if (disable_animations) {
    card.disableAnimations();
  }

  card.setHideBorder(hide_border);
  card.setHideTitle(hide_title);
  card.setCSS(
    `
    ${cssStyles}
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
    .lang-name { font: 400 11px "${card.font_family}"; fill: ${textColor} }
    #rect-mask rect{
      animation: slideInAnimation 1s ease-in-out forwards;
    }
    .lang-progress{
      animation: growWidthAnimation 0.6s ease-in-out forwards;
    }
    `,
  );

  return card.render(`
    <svg x="0" y="0" width="100%">
      ${finalLayout}
    </svg>
  `);
};

export { renderWakatimeCard };
export default renderWakatimeCard;
