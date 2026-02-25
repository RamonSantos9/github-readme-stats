/**
 * @fileoverview Card SVG do Gráfico de Atividade do GitHub.
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { I18n } from "../common/I18n.js";
import { activityGraphLocales } from "../translations.js";
import type { ActivityData } from "../fetchers/types.js";

const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 300;

/**
 * Gera um caminho SVG suavizado usando curvas de Bézier cúbicas.
 */
const getSmoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x},${points[0].y}`;

  let d = `M ${points[0].x},${points[0].y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    // Ponto de controle: no meio do caminho horizontalmente
    const cp1x = p0.x + (p1.x - p0.x) / 2;
    const cp1y = p0.y;
    const cp2x = p0.x + (p1.x - p0.x) / 2;
    const cp2y = p1.y;

    d += ` C ${cp1x.toFixed(2)},${cp1y.toFixed(2)} ${cp2x.toFixed(2)},${cp2y.toFixed(2)} ${p1.x.toFixed(2)},${p1.y.toFixed(2)}`;
  }

  return d;
};

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

  const width = Math.max(600, parseInt(card_width, 10) || DEFAULT_WIDTH);
  const height = Math.max(200, parseInt(card_height, 10) || DEFAULT_HEIGHT);

  // Ajuste de paddings para evitar cortes
  const paddingLeft = 70;
  const paddingRight = 40;
  const paddingTop = 70; // Espaço para o título
  const paddingBottom = 60; // Espaço para o rótulo "Days"

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

  // Escala o Y para ter um topo limpo (múltiplo de 2)
  const yMax = Math.ceil(maxContributions / 2) * 2 || 2;

  const points = recentContributions.map((day, i) => {
    const x = (i / (recentContributions.length - 1)) * graphWidth;
    const y = graphHeight - (day.contributionCount / yMax) * graphHeight;
    return { x, y };
  });

  const polylinePoints = points
    .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
    .join(" ");
  const linePath = getSmoothPath(points);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x.toFixed(2)},${graphHeight} L 0,${graphHeight} Z`
      : "";

  const classicOrange = "#ff7a00";
  const defaultLineColor = theme === "default" ? classicOrange : titleColor;
  const lineColorVal = line_color ? `#${line_color}` : defaultLineColor;
  const pointColorVal = point_color ? `#${point_color}` : lineColorVal;
  const areaColorVal = area_color ? `#${area_color}` : lineColorVal;

  // Grid Horizontal (Y-axis) e Labels
  const yAxisSteps = 5;
  const yAxisLabels = [];
  for (let i = 0; i <= yAxisSteps; i++) {
    const level = i / yAxisSteps;
    const y = graphHeight - level * graphHeight;
    const count = Math.round(level * yMax);
    yAxisLabels.push(`
      <g class="grid-line">
        <line x1="0" y1="${y}" x2="${graphWidth}" y2="${y}" stroke="${textColor}" stroke-opacity="0.1" stroke-dasharray="2,2" />
        <text x="-12" y="${y + 4}" text-anchor="end" fill="${textColor}" fill-opacity="0.6" font-size="10">${count}</text>
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
          <text x="${x}" y="${graphHeight + 18}" text-anchor="middle" fill="${textColor}" fill-opacity="0.8" font-size="10">${dayNum}</text>
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
      opacity: ${hide_area ? 0 : 0.2};
    }
    .activity-point {
      fill: ${pointColorVal};
      stroke: ${bgColor};
      stroke-width: 2;
      opacity: 0;
      ${disable_animations ? "opacity: 1;" : "animation: fadeIn 0.5s ease-out forwards 1.2s;"}
    }
    .axis-label {
      fill: ${textColor};
      fill-opacity: 0.9;
      font-size: 13px;
      font-weight: 700;
    }
    @keyframes drawLine {
      from { stroke-dasharray: 2000; stroke-dashoffset: 2000; }
      to { stroke-dashoffset: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    text { font-family: ${font_family || "'Segoe UI', Ubuntu, sans-serif"}; }
    .header-centered {
      font: 700 20px "${font_family || "'Segoe UI', Ubuntu, sans-serif"}";
      fill: ${titleColor};
      text-anchor: middle;
    }
  `;

  const card = new Card({
    customTitle: custom_title,
    defaultTitle: i18n.t("activitygraph.title"),
    width,
    // Compensamos os 30px que a classe Card remove ao setHideTitle(true)
    height: height + 30,
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
  card.setCSS(styles);

  if (disable_animations) {
    card.disableAnimations();
  }

  // Com hideTitle=true, o corpo começa em translate(0, 25)
  // Ajustamos as posições internas para compensar
  const svgContent = `
    <!-- Título Centralizado -->
    <text x="${width / 2}" y="15" class="header-centered">${custom_title || i18n.t("activitygraph.title")}</text>

    <!-- Rótulo Eixo Y (Vertical) -->
    <text transform="translate(15, ${paddingTop + graphHeight / 2 - 25}) rotate(-90)" text-anchor="middle" class="axis-label">${i18n.t("activitygraph.contributions")}</text>

    <g transform="translate(${paddingLeft}, ${paddingTop - 25})">
      <!-- Grids and Axis Labels -->
      ${yAxisLabels.join("")}
      ${verticalGrids}

      <!-- Graph -->
      ${!hide_area ? `<path class="activity-area" d="${areaPath}" />` : ""}
      <path class="activity-line" d="${linePath}" stroke-dasharray="2000" stroke-dashoffset="2000" />
      
      <!-- Points -->
      ${points
        .map(
          (p, i) => `
        <circle class="activity-point" cx="${p.x.toFixed(2)}" cy="${p.y.toFixed(2)}" r="4.5">
          <title>${recentContributions[i].date}: ${recentContributions[i].contributionCount} contributions</title>
        </circle>
      `,
        )
        .join("")}

      <!-- Rótulo Eixo X (Dias) -->
      <text x="${graphWidth / 2}" y="${graphHeight + 45}" text-anchor="middle" class="axis-label">${i18n.t("activitygraph.days")}</text>
    </g>
  `;

  return card.render(svgContent);
};

export { renderActivityGraph };
export default renderActivityGraph;
