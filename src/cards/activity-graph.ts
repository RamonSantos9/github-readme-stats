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
 * Retorna o dia do mês.
 */
const getDayOfMonth = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.getDate().toString();
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

  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 70;
  const paddingBottom = 60;

  const graphWidth = width - paddingLeft - paddingRight;
  const graphHeight = height - paddingTop - paddingBottom;

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
  const maxContributions = Math.max(
    ...recentContributions.map((d) => d.contributionCount),
    1,
  );

  // Arredonda o máximo para o próximo par para ter labels bonitos como na imagem
  const yMax =
    maxContributions % 2 === 0 ? maxContributions : maxContributions + 1;

  const points = recentContributions.map((day, i) => {
    const x = (i / (recentContributions.length - 1)) * graphWidth;
    const y = graphHeight - (day.contributionCount / yMax) * graphHeight;
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

  const lineColorVal = line_color ? `#${line_color}` : "#FB8C00"; // Laranja padrão se não especificado
  const pointColorVal = point_color ? `#${point_color}` : lineColorVal;
  const areaColorVal = area_color ? `#${area_color}` : `${lineColorVal}22`;

  // Grid Horizontal (Y-axis) e Labels
  const yAxisSteps = 5; // Número de divisões
  const yAxisLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const level = i / yAxisSteps;
    const y = graphHeight - level * graphHeight;
    const count = Math.round(level * yMax);
    yAxisLabels.push(`
      <g class="grid-line">
        <line x1="0" y1="${y}" x2="${graphWidth}" y2="${y}" stroke="${textColor}" stroke-opacity="0.1" stroke-dasharray="2,2" />
        <text x="-10" y="${y + 4}" text-anchor="end" fill="${textColor}" fill-opacity="0.6" font-size="10">${count}</text>
      </g>
    `);
  }

  // Grid Vertical (X-axis) e Labels de Dia
  const verticalGrids = recentContributions
    .map((day, i) => {
      const x = (i / (recentContributions.length - 1)) * graphWidth;
      const dayNum = getDayOfMonth(day.date);

      return `
        <g class="grid-line">
          <line x1="${x}" y1="0" x2="${x}" y2="${graphHeight}" stroke="${textColor}" stroke-opacity="0.1" stroke-dasharray="2,2" />
          <text x="${x}" y="${graphHeight + 15}" text-anchor="middle" fill="${textColor}" fill-opacity="0.8" font-size="10">${dayNum}</text>
        </g>
      `;
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
      opacity: ${hide_area ? 0 : 0.8};
    }
    .activity-point {
      fill: ${pointColorVal};
      stroke: ${bgColor};
      stroke-width: 1.5;
      opacity: 0;
      ${disable_animations ? "opacity: 1;" : "animation: fadeIn 0.5s ease-out forwards 1.2s;"}
    }
    .axis-label {
      fill: ${textColor};
      fill-opacity: 0.8;
      font-size: 12px;
      font-weight: 600;
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
    .header-centered {
      font: 600 18px "${font_family || "Segoe UI, Ubuntu, sans-serif"}";
      fill: ${titleColor};
      text-anchor: middle;
    }
  `;

  const card = new Card({
    customTitle: custom_title || `${name}'s Contribution Graph`,
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
  card.setHideTitle(true); // Ocultamos para centralizar manualmente
  card.setCSS(styles);

  if (disable_animations) {
    card.disableAnimations();
  }

  const svgContent = `
    <!-- Título Centralizado -->
    <text x="${width / 2}" y="35" class="header-centered">${custom_title || `${name}'s Contribution Graph`}</text>

    <!-- Rótulo Eixo Y (Vertical) -->
    <text transform="translate(15, ${paddingTop + graphHeight / 2}) rotate(-90)" text-anchor="middle" class="axis-label">Contributions</text>

    <g transform="translate(${paddingLeft}, ${paddingTop})">
      <!-- Grids and Axis Labels -->
      ${yAxisLabels.join("")}
      ${verticalGrids}

      <!-- Graph Area and Line -->
      ${!hide_area ? `<polyline class="activity-area" points="${areaPoints}" />` : ""}
      <polyline class="activity-line" points="${polylinePoints}" stroke-dasharray="2000" stroke-dashoffset="2000" />
      
      <!-- Points -->
      ${points
        .map(
          (p, i) => `
        <circle class="activity-point" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4">
          <title>${recentContributions[i].date}: ${recentContributions[i].contributionCount} contributions</title>
        </circle>
      `,
        )
        .join("")}

      <!-- Rótulo Eixo X (Dias) -->
      <text x="${graphWidth / 2}" y="${graphHeight + 40}" text-anchor="middle" class="axis-label">Days</text>
    </g>
  `;

  return card.render(svgContent);
};

export { renderActivityGraph };
export default renderActivityGraph;
