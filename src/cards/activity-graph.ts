/**
 * @fileoverview Card SVG do Gráfico de Atividade do GitHub.
 */

import { Card } from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { I18n } from "../common/I18n.js";
import { activityGraphLocales } from "../translations.js";
import type { ActivityData } from "../fetchers/types.js";
import type { ActivityGraphOptions } from "./types.js";

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 300;

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

  const graphWidth = width - 50;
  const graphHeight = height - 100;

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

  // Mostra apenas os últimos 30 dias para não sobrecarregar o gráfico
  const recentContributions = contributions.slice(-31);
  const maxCount = Math.max(
    ...recentContributions.map((d) => d.contributionCount),
    1,
  );

  const points = recentContributions.map((day, i) => {
    const x = (i / (recentContributions.length - 1)) * graphWidth;
    const y = graphHeight - (day.contributionCount / maxCount) * graphHeight;
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
  const areaColorVal = area_color ? `#${area_color}` : `${lineColorVal}33`; // 20% opacity

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
    <g transform="translate(25, 70)">
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
    </g>
  `;

  return card.render(svgContent);
};

export { renderActivityGraph };
export default renderActivityGraph;
