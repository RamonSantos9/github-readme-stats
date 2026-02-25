/**
 * @fileoverview Card de Tech Stack SVG personalizado.
 */

import Card from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { measureText } from "../common/render.js";
import { brandIcons } from "../common/brand-icons.js";
import type { StackCardOptions } from "./types.js";

const PILL_HEIGHT = 28;
const GAP_Y = 10;
const LINE_HEIGHT = PILL_HEIGHT + GAP_Y;

/**
 * Renderiza um badge (pill) para um item de tecnologia com ícone opcional.
 *
 * @param text - Nome da tecnologia.
 * @param color - Cor do texto.
 * @returns String SVG do badge.
 */
const renderPill = (text: string, color: string): string => {
  const normText = text.trim().toLowerCase().replace(/\s+/g, "");
  const icon = brandIcons[normText] || brandIcons[text.toLowerCase()];

  const paddingX = 12;
  const fontSize = 12;
  const hasIcon = !!icon;
  const iconSize = 14;
  const iconGap = 6;

  const textWidth = measureText(text, fontSize);
  const width = textWidth + paddingX * 2 + (hasIcon ? iconSize + iconGap : 0);
  const height = PILL_HEIGHT;

  let iconSvg = "";
  if (icon) {
    iconSvg = `<svg x="${paddingX}" y="${
      (height - iconSize) / 2
    }" width="${iconSize}" height="${iconSize}" viewBox="0 0 16 16"><path fill="${
      icon.color || color
    }" d="${icon.path}" /></svg>`;
  }

  return `
    <g>
      <rect rx="6" ry="6" width="${width}" height="${height}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-opacity="0.2" />
      ${iconSvg}
      <text x="${
        paddingX + (hasIcon ? iconSize + iconGap : 0)
      }" y="${height / 2 + 4.5}" fill="${color}" font-family="'Bricolage Grotesque', sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="start">${text}</text>
    </g>
  `;
};

/**
 * Renderiza um grupo de badges com quebra de linha e alinhamento.
 */
const renderPills = (
  items: string[],
  color: string,
  maxWidth: number,
  align: "left" | "right" = "left",
): string => {
  const gapX = 8;
  const lines: {
    width: number;
    pills: { x: number; width: number; svg: string }[];
  }[] = [];
  let currentLine = {
    width: 0,
    pills: [] as { x: number; width: number; svg: string }[],
  };

  items.forEach((item) => {
    const pillText = item.trim();
    if (!pillText) return;

    const normText = pillText.toLowerCase().replace(/\s+/g, "");
    const hasIcon = !!(
      brandIcons[normText] || brandIcons[pillText.toLowerCase()]
    );
    const width = measureText(pillText, 12) + 24 + (hasIcon ? 20 : 0);

    if (currentLine.width + width > maxWidth && currentLine.pills.length > 0) {
      lines.push(currentLine);
      currentLine = {
        width: 0,
        pills: [] as { x: number; width: number; svg: string }[],
      };
    }

    currentLine.pills.push({
      x: currentLine.width,
      width,
      svg: renderPill(pillText, color),
    });
    currentLine.width += width + gapX;
  });
  if (currentLine.pills.length > 0) lines.push(currentLine);

  return lines
    .map((line, lineIdx) => {
      const lineY = lineIdx * LINE_HEIGHT;
      const offsetX = align === "right" ? maxWidth - (line.width - gapX) : 0;
      return line.pills
        .map(
          (pill) =>
            `<g transform="translate(${pill.x + offsetX}, ${lineY})">${
              pill.svg
            }</g>`,
        )
        .join("");
    })
    .join("");
};

/**
 * Renderiza um card de Tech Stack com duas colunas.
 */
const renderStackCard = (options: Partial<StackCardOptions> = {}): string => {
  const {
    title = "",
    left_title = "Front-end",
    left_items = "",
    right_title = "Back-end",
    right_items = "",
    card_width = 495,
    title_color = "ffffff",
    bg_color = "00000000",
    theme,
    border_radius,
    border_color,
    hide_border = true,
    hide_title = true,
  } = options;

  // Limpa a cor se tiver caracteres extras
  let resolvedTitleColor = title_color;
  if (resolvedTitleColor.length > 6 && !resolvedTitleColor.startsWith("#")) {
    resolvedTitleColor = resolvedTitleColor.substring(0, 6);
  }

  const { titleColor, bgColor, borderColor } = getCardColors({
    title_color: resolvedTitleColor,
    bg_color,
    border_color,
    theme,
    icon_color: "",
  });

  const paddingX = 25;
  const columnWidth = (card_width - paddingX * 4) / 2;

  const leftItemsList = left_items.split(",").filter(Boolean);
  const rightItemsList = right_items.split(",").filter(Boolean);

  const estimateHeight = (items: string[]) => {
    if (items.length === 0) return 30; // Altura do título da coluna
    let x = 0;
    let lines = 1;
    items.forEach((item) => {
      const pillText = item.trim();
      const normText = pillText.toLowerCase().replace(/\s+/g, "");
      const hasIcon = !!(
        brandIcons[normText] || brandIcons[pillText.toLowerCase()]
      );
      const w = measureText(pillText, 12) + 24 + (hasIcon ? 20 : 0);

      if (x + w > columnWidth) {
        x = 0;
        lines++;
      }
      x += w + 8;
    });
    return 30 + lines * LINE_HEIGHT;
  };

  const leftHeight = estimateHeight(leftItemsList);
  const rightHeight = estimateHeight(rightItemsList);
  const innerHeight = Math.max(leftHeight, rightHeight) + 20;
  const topOffset = hide_title ? 15 : 45;
  const height = topOffset + innerHeight + 20;

  const card = new Card({
    width: card_width,
    height,
    border_radius,
    colors: {
      titleColor: titleColor,
      bgColor,
      borderColor,
      font_family: "Bricolage Grotesque",
    },
    customTitle: title,
  });

  card.setHideBorder(hide_border);
  if (hide_title || !title) card.setHideTitle(true);

  const body = `
    <g transform="translate(${paddingX}, ${topOffset})">
      <!-- Coluna Esquerda -->
      <g>
        <text y="0" fill="${titleColor}" font-family="'Bricolage Grotesque', sans-serif" font-size="20" font-weight="700">${left_title}</text>
        <g transform="translate(0, 25)">
          ${renderPills(leftItemsList, titleColor, columnWidth, "left")}
        </g>
      </g>

      <!-- Coluna Direita (Pinned to far right) -->
      <g transform="translate(${card_width - paddingX * 2}, 0)">
        <text y="0" fill="${titleColor}" font-family="'Bricolage Grotesque', sans-serif" font-size="20" font-weight="700" text-anchor="end">${right_title}</text>
        <g transform="translate(${-columnWidth}, 25)">
          ${renderPills(rightItemsList, titleColor, columnWidth, "right")}
        </g>
      </g>
    </g>
  `;

  return card.render(body);
};

export { renderStackCard };
export default renderStackCard;
