/**
 * @fileoverview Card SVG de Sequência (Streak) do GitHub.
 */

import Card from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { flexLayout, measureText } from "../common/render.js";
import { kFormatter } from "../common/fmt.js";
import type { StreakCardOptions } from "./types.js";
import type { StreakData } from "../fetchers/types.js";
import { streakCardLocales } from "../translations.js";

/**
 * Formata um intervalo de datas para exibição curta.
 * Ex: "Feb 10 - Feb 25" ou "Dec 19, 2021 - Mar 14, 2022"
 */
const formatDateRange = (
  startStr: string,
  endStr: string,
  locale: string = "en",
): string => {
  if (!startStr || !endStr) return "";

  const start = new Date(startStr);
  const end = new Date(endStr);
  const now = new Date();

  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  const yearOptions: Intl.DateTimeFormatOptions = {
    ...options,
    year: "numeric",
  };

  const startFormatted = start.toLocaleDateString(
    locale,
    start.getFullYear() === now.getFullYear() ? options : yearOptions,
  );
  const endFormatted = end.toLocaleDateString(
    locale,
    end.getFullYear() === now.getFullYear() ? options : yearOptions,
  );

  return `${startFormatted} - ${endFormatted}`;
};

/**
 * Renderiza o card SVG de Sequência (Streak) do GitHub.
 *
 * @param streakData - Dados de sequência retornados por `fetchStreak`.
 * @param options - Opções de personalização visual.
 * @returns String SVG do card.
 */
const renderStreakCard = (
  streakData: StreakData,
  options: Partial<StreakCardOptions> = {},
): string => {
  const {
    firstContribution,
    totalContributions,
    currentStreak,
    longestStreak,
  } = streakData;
  const {
    locale = "en",
    card_width,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    border_radius,
    border_color,
    hide_border = false,
    fire_color = "#FB8C00",
    font_family,
  } = options;

  const { titleColor, textColor, iconColor, bgColor, borderColor } =
    getCardColors({
      title_color,
      icon_color,
      text_color,
      bg_color,
      border_color,
      theme,
    });

  // Aumenta a largura padrão para 550 para evitar cortes em traduções longas (como pt-br)
  // Aceita card_width customizado se fornecido
  const width = card_width
    ? isNaN(card_width)
      ? 550
      : Math.max(card_width, 495)
    : 550;
  const height = 195;

  const card = new Card({
    defaultTitle: "",
    width,
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

  card.setHideBorder(hide_border);
  card.setHideTitle(true);
  card.height = height; // Restore height after setHideTitle(true) reduced it
  card.paddingX = 0; // Ensure no translation in Card.render

  card.setAccessibilityLabel({
    title: `GitHub Streak Stats para ${streakData.name}`,
    desc: `Mostrando sequências de contribuições de ${streakData.name}: total de ${totalContributions}, sequência atual de ${currentStreak.length} e maior sequência de ${longestStreak.length}`,
  });

  const i18n = streakCardLocales();
  const l = (key: string) => i18n[key][locale] || i18n[key].en;

  // Formata o período total
  const startDate = new Date(firstContribution);
  const startFormatted = startDate.toLocaleDateString(locale, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const totalRange = `${startFormatted} - ${l("streakcard.present")}`;

  // Cálculos de posicionamento dinâmico
  const centers = [width / 6, width / 2, (5 * width) / 6];
  const dividers = [width / 3, (2 * width) / 3];

  // Renderização manual para bater com o layout exato solicitado, mas com proporções flexíveis
  return card.render(`
    <style>
        @keyframes currstreak {
            0% { font-size: 3px; opacity: 0.2; }
            80% { font-size: 34px; opacity: 1; }
            100% { font-size: 28px; opacity: 1; }
        }
        @keyframes fadein {
            0% { opacity: 0; }
            100% { opacity: 1; }
        }
    </style>
    <defs>
        <mask id="mask_out_ring_behind_fire">
            <rect width="${width}" height="${height}" fill="white"/>
            <ellipse id="mask-ellipse" cx="${centers[1]}" cy="32" rx="13" ry="18" fill="black"/>
        </mask>
    </defs>

    <g>
        <g style="isolation: isolate">
            <line x1="${dividers[0]}" y1="28" x2="${dividers[0]}" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="${textColor}" stroke-opacity="0.2" />
            <line x1="${dividers[1]}" y1="28" x2="${dividers[1]}" y2="170" vector-effect="non-scaling-stroke" stroke-width="1" stroke="${textColor}" stroke-opacity="0.2" />
        </g>
        <g style="isolation: isolate">
            <!-- Total Contributions big number -->
            <g transform="translate(${centers[0]}, 48)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${iconColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="700" font-size="28px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.6s">
                    ${kFormatter(totalContributions)}
                </text>
            </g>

            <!-- Total Contributions label -->
            <g transform="translate(${centers[0]}, 84)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="400" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.7s">
                    ${l("streakcard.total")}
                </text>
            </g>

            <!-- Total Contributions range -->
            <g transform="translate(${centers[0]}, 114)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke-opacity="0.6" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.8s">
                    ${totalRange}
                </text>
            </g>
        </g>
        <g style="isolation: isolate">
            <!-- Current Streak label -->
            <g transform="translate(${centers[1]}, 108)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${iconColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="700" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.9s">
                    ${l("streakcard.current")}
                </text>
            </g>

            <!-- Current Streak range -->
            <g transform="translate(${centers[1]}, 145)">
                <text x="0" y="21" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke-opacity="0.6" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 0.9s">
                    ${formatDateRange(currentStreak.start, currentStreak.end, locale)}
                </text>
            </g>

            <!-- Ring around number -->
            <g mask="url(#mask_out_ring_behind_fire)">
                <circle cx="${centers[1]}" cy="71" r="40" fill="none" stroke="${iconColor}" stroke-width="5" style="opacity: 0; animation: fadein 0.5s linear forwards 0.4s"/>
            </g>
            <!-- Fire icon -->
            <g transform="translate(${centers[1]}, 19.5)" stroke-opacity="0" style="opacity: 0; animation: fadein 0.5s linear forwards 0.6s">
                <path d="M -12 -0.5 L 15 -0.5 L 15 23.5 L -12 23.5 L -12 -0.5 Z" fill="none"/>
                <path d="M 1.5 0.67 C 1.5 0.67 2.24 3.32 2.24 5.47 C 2.24 7.53 0.89 9.2 -1.17 9.2 C -3.23 9.2 -4.79 7.53 -4.79 5.47 L -4.76 5.11 C -6.78 7.51 -8 10.62 -8 13.99 C -8 18.41 -4.42 22 0 22 C 4.42 22 8 18.41 8 13.99 C 8 8.6 5.41 3.79 1.5 0.67 Z M -0.29 19 C -2.07 19 -3.51 17.6 -3.51 15.86 C -3.51 14.24 -2.46 13.1 -0.7 12.74 C 1.07 12.38 2.9 11.53 3.92 10.16 C 4.31 11.45 4.51 12.81 4.51 14.2 C 4.51 16.85 2.36 19 -0.29 19 Z" fill="${titleColor}" stroke-opacity="0"/>
            </g>

            <!-- Current Streak big number -->
            <g transform="translate(${centers[1]}, 48)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="700" font-size="28px" font-style="normal" style="animation: currstreak 0.6s linear forwards">
                    ${currentStreak.length}
                </text>
            </g>

        </g>
        <g style="isolation: isolate">
            <!-- Longest Streak big number -->
            <g transform="translate(${centers[2]}, 48)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${iconColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="700" font-size="28px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.2s">
                    ${longestStreak.length}
                </text>
            </g>

            <!-- Longest Streak label -->
            <g transform="translate(${centers[2]}, 84)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="400" font-size="14px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.3s">
                    ${l("streakcard.longest")}
                </text>
            </g>

            <!-- Longest Streak range -->
            <g transform="translate(${centers[2]}, 114)">
                <text x="0" y="32" stroke-width="0" text-anchor="middle" fill="${textColor}" stroke-opacity="0.6" stroke="none" font-family="'${card.font_family}', sans-serif" font-weight="400" font-size="12px" font-style="normal" style="opacity: 0; animation: fadein 0.5s linear forwards 1.4s">
                    ${formatDateRange(longestStreak.start, longestStreak.end, locale)}
                </text>
            </g>
        </g>
    </g>
  `);
};

export { renderStreakCard };
export default renderStreakCard;
