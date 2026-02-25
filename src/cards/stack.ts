/**
 * @fileoverview Card de Tech Stack SVG personalizado.
 */

import Card from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { flexLayout, measureText } from "../common/render.js";
import type { StackCardOptions } from "./types.js";

/**
 * Renderiza um badge (pill) para um item de tecnologia.
 *
 * @param text - Nome da tecnologia.
 * @param color - Cor do texto.
 * @param bgColor - Cor de fundo (opcional).
 * @returns String SVG do badge.
 */
const renderPill = (text: string, color: string): string => {
  const paddingX = 10;
  const fontSize = 12;
  const width = measureText(text, fontSize) + paddingX * 2;
  const height = 22;

  return `
    <g>
      <rect rx="11" ry="11" width="${width}" height="${height}" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-opacity="0.2" />
      <text x="${width / 2}" y="${height / 2 + 4}" fill="${color}" font-family="'Bricolage Grotesque', sans-serif" font-size="${fontSize}" font-weight="600" text-anchor="middle">${text}</text>
    </g>
  `;
};

/**
 * Renderiza um grupo de badges com quebra de linha e alinhamento.
 *
 * @param items - Lista de nomes de tecnologia.
 * @param color - Cor dos badges.
 * @param maxWidth - Largura máxima disponível.
 * @param align - Alinhamento ("left" ou "right").
 * @returns String SVG com os badges posicionados.
 */
const renderPills = (
  items: string[],
  color: string,
  maxWidth: number,
  align: "left" | "right" = "left",
): string => {
  const gapX = 8;
  const gapY = 10;
  const lines: { width: number; pills: { x: number; svg: string }[] }[] = [];
  let currentLine = { width: 0, pills: [] as { x: number; svg: string }[] };

  items.forEach((item) => {
    const pillText = item.trim();
    if (!pillText) return;

    const width = measureText(pillText, 12) + 20;
    if (currentLine.width + width > maxWidth && currentLine.pills.length > 0) {
      lines.push(currentLine);
      currentLine = { width: 0, pills: [] as { x: number; svg: string }[] };
    }

    currentLine.pills.push({
      x: currentLine.width,
      svg: renderPill(pillText, color),
    });
    currentLine.width += width + gapX;
  });
  if (currentLine.pills.length > 0) lines.push(currentLine);

  return lines
    .map((line, lineIdx) => {
      const lineY = lineIdx * (22 + gapY);
      const offsetX = align === "right" ? maxWidth - line.width + gapX : 0;
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
 *
 * @param options - Opções de personalização.
 * @returns String SVG do card.
 */
const renderStackCard = (options: Partial<StackCardOptions> = {}): string => {
  const {
    title = "Tech Stack",
    left_title = "Front-end",
    left_items = "",
    right_title = "Back-end",
    right_items = "",
    card_width = 495,
    title_color,
    bg_color = "00000000",
    theme,
    border_radius,
    border_color,
    hide_border = true,
    hide_title = false,
  } = options;

  const { titleColor, bgColor, borderColor } = getCardColors({
    title_color,
    bg_color,
    border_color,
    theme,
    icon_color: "",
  });

  const paddingX = 25;
  const columnWidth = (card_width - paddingX * 2.5) / 2;

  const leftItemsList = left_items.split(",").filter(Boolean);
  const rightItemsList = right_items.split(",").filter(Boolean);

  const estimateHeight = (items: string[]) => {
    if (items.length === 0) return 0;
    let x = 0;
    let lines = 1;
    items.forEach((item) => {
      const w = measureText(item.trim(), 12) + 20;
      if (x + w > columnWidth) {
        x = 0;
        lines++;
      }
      x += w + 8;
    });
    return lines * 32;
  };

  const leftHeight = estimateHeight(leftItemsList);
  const rightHeight = estimateHeight(rightItemsList);
  const innerHeight = Math.max(leftHeight, rightHeight) + 40;
  const height = (hide_title ? 0 : 40) + innerHeight + 40;

  const card = new Card({
    width: card_width,
    height,
    border_radius,
    colors: {
      titleColor,
      bgColor,
      borderColor,
      font_family: "Bricolage Grotesque",
    },
    customTitle: title,
  });

  card.setHideBorder(hide_border);
  if (hide_title) card.setHideTitle(true);

  const body = `
    <g transform="translate(${paddingX}, 10)">
      <!-- Coluna Esquerda -->
      <g>
        <text y="0" fill="${titleColor}" font-family="'Bricolage Grotesque', sans-serif" font-size="18" font-weight="700">${left_title}</text>
        <g transform="translate(0, 15)">
          ${renderPills(leftItemsList, titleColor, columnWidth, "left")}
        </g>
      </g>

      <!-- Coluna Direita (Pinned to far right) -->
      <g transform="translate(${card_width - paddingX * 2}, 0)">
        <text y="0" fill="${titleColor}" font-family="'Bricolage Grotesque', sans-serif" font-size="18" font-weight="700" text-anchor="end">${right_title}</text>
        <g transform="translate(${-columnWidth}, 15)">
          ${renderPills(rightItemsList, titleColor, columnWidth, "right")}
        </g>
      </g>
    </g>
  `;

  return card.render(body);
};

export { renderStackCard };
export default renderStackCard;
