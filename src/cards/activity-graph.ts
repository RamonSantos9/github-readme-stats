/**
 * @fileoverview Card SVG do Gráfico de Atividade do GitHub.
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { I18n } from "../common/I18n.js";
import { activityGraphLocales } from "../translations.js";
import type { ActivityData } from "../fetchers/types.js";
import type { ActivityGraphOptions } from "./types.js";

const DEFAULT_WIDTH = 880;
const DEFAULT_HEIGHT = 300;

/**
 * Retorna o nome curto do mês.
 */
const getMonthName = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleString("en-US", { month: "short" });
};

/**
 * Renderiza o card SVG de gráfico de atividade.
 *
 * @param data - Dados de atividade (calendário de contribuições).
 * @param options - Opções de personalização.
 * @returns String SVG do card.
 */
const renderActivityGraph = (data: ActivityData, options: any = {}): string => {
  const { name, contributions } = data;
  const {
    hide_title = false,
    hide_border = false,
    card_width,
    card_height,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme = "default" as any,
    custom_title,
    border_radius,
    border_color,
    locale,
    disable_animations = false,
    font_family,
    line_color,
    point_color,
    area_color,
    hide_area = false,
  } = options;

  const width = parseInt(card_width, 10) || DEFAULT_WIDTH;
  const height = parseInt(card_height, 10) || DEFAULT_HEIGHT;

  const paddingX = 50;
  const paddingY = 80;
  const graphWidth = width - paddingX * 2;
  const graphHeight = height - paddingY * 2;

  const { titleColor, iconColor, textColor, bgColor, borderColor } =
    getCardColors({
      title_color,
      text_color,
      icon_color,
      bg_color,
      border_color,
      theme,
    });

  const i18n = new I18n({
    locale,
    translations: {
      ...activityGraphLocales({
        name,
        apostrophe: name.endsWith("s") ? "" : "s",
      }),
    },
  });

  // Mostra apenas os últimos 31 dias
  const recentContributions = contributions.slice(-31);
  const totalContributions = recentContributions.reduce(
    (acc, curr) => acc + curr.contributionCount,
    0,
  );
  const maxContributions = Math.max(
    ...recentContributions.map((d) => d.contributionCount),
    1,
  );

  const points = recentContributions.map((day, i) => {
    const x = (i / (recentContributions.length - 1)) * graphWidth;
    const y =
      graphHeight - (day.contributionCount / maxContributions) * graphHeight;
    return { x, y };
  });

  const polylinePoints = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const areaPoints = [
    { x: 0, y: graphHeight },
    ...points,
    { x: graphWidth, y: graphHeight },
  ]
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");

  const lineColorVal = line_color ? `#${line_color}` : titleColor;
  const pointColorVal = point_color ? `#${point_color}` : textColor;
  const areaColorVal = area_color ? `#${area_color}` : `${lineColorVal}33`;

  // Grid Horizontal (Y-axis)
  const yAxisLevels = [0, 0.25, 0.5, 0.75, 1];
  const horizontalGrids = yAxisLevels
    .map((level) => {
      const y = graphHeight - level * graphHeight;
      const count = Math.round(level * maxContributions);
      return `
      <g class="grid-line">
        <line x1="0" y1="${y}" x2="${graphWidth}" y2="${y}" stroke="${textColor}" stroke-opacity="0.1" stroke-dasharray="4" />
        <text x="-10" y="${y + 4}" text-anchor="end" fill="${textColor}" fill-opacity="0.4" font-size="10">${count}</text>
      </g>
    `;
    })
    .join("");

  // Grid Vertical (X-axis) e Labels de Mês
  const monthLabels: string[] = [];
  let lastMonth = "";
  const verticalGrids = recentContributions
    .map((day, i) => {
      const x = (i / (recentContributions.length - 1)) * graphWidth;
      const currentMonth = getMonthName(day.date);
      let monthLabel = "";
      if (currentMonth !== lastMonth) {
        monthLabel = `<text x="${x}" y="${graphHeight + 20}" text-anchor="middle" fill="${textColor}" fill-opacity="0.6" font-size="11">${currentMonth}</text>`;
        lastMonth = currentMonth;
      }

      // Mostra grid vertical apenas no início de cada semana (a cada 7 dias) ou no início do mês
      if (i % 7 === 0 || monthLabel) {
        return `
        <g class="grid-line">
          <line x1="${x}" y1="0" x2="${x}" y2="${graphHeight}" stroke="${textColor}" stroke-opacity="0.1" stroke-dasharray="4" />
          ${monthLabel}
        </g>
      `;
      }
      return "";
    })
    .join("");

  const styles = `
    .activity-line {
      fill: none;
      stroke: ${lineColorVal};
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
      ${disable_animations ? "" : "animation: drawLine 1.5s ease-out forwards;"}
    }
    .activity-area {
      fill: ${areaColorVal};
      stroke: none;
      opacity: ${hide_area ? 0 : 0.3};
    }
    .activity-point {
      fill: ${pointColorVal};
      stroke: ${bgColor};
      stroke-width: 1.5;
      opacity: 0;
      ${disable_animations ? "opacity: 1;" : "animation: fadeIn 0.5s ease-out forwards 1.2s;"}
    }
    @keyframes drawLine {
      from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    text { font-family: ${font_family || "Segoe UI, Ubuntu, sans-serif"}; }
  `;

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t("activitygraph.title"),
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
  card.setHideTitle(hide_title);
  card.setCSS(styles);

  if (disable_animations) {
    card.disableAnimations();
  }

  const svgContent = `
    <g transform="translate(${paddingX}, ${paddingY})">
      <!-- Grids and Axis Labels -->
      ${horizontalGrids}
      ${verticalGrids}

      <!-- Graph -->
      ${!hide_area ? `<polyline class="activity-area" points="${areaPoints}" />` : ""}
      <polyline class="activity-line" points="${polylinePoints}" stroke-dasharray="2000" stroke-dashoffset="2000" />
      ${points
        .map(
          (p, i) => `
        <circle class="activity-point" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4.5">
          <title>${recentContributions[i].date}: ${recentContributions[i].contributionCount} contributions</title>
        </circle>
      `,
        )
        .join("")}

      <!-- Bottom Stats Summary -->
      <g transform="translate(0, ${graphHeight + 50})">
        <text x="0" y="0" fill="${textColor}" fill-opacity="0.6" font-size="12" font-weight="600">Total Contributions: ${totalContributions}</text>
        <text x="${graphWidth / 2}" y="0" text-anchor="middle" fill="${textColor}" fill-opacity="0.6" font-size="12" font-weight="600">Max Contributions: ${maxContributions}</text>
        <text x="${graphWidth}" y="0" text-anchor="end" fill="${textColor}" fill-opacity="0.6" font-size="12" font-weight="600">Period: Last 31 Days</text>
      </g>
    </g>
  `;

  return card.render(svgContent);
};

export { renderActivityGraph };
export default renderActivityGraph;
