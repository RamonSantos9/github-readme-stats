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
 * Renderiza um grupo de badges com quebra de linha simples.
 *
 * @param items - Lista de nomes de tecnologia.
 * @param color - Cor dos badges.
 * @param maxWidth - Largura máxima disponível.
 * @returns String SVG com os badges posicionados.
 */
const renderPills = (
  items: string[],
  color: string,
  maxWidth: number,
): string => {
  let x = 0;
  let y = 0;
  const gapX = 8;
  const gapY = 10;
  const pills: string[] = [];

  items.forEach((item) => {
    const pillText = item.trim();
    if (!pillText) return;

    const width = measureText(pillText, 12) + 20;
    if (x + width > maxWidth) {
      x = 0;
      y += 22 + gapY;
    }

    pills.push(
      `<g transform="translate(${x}, ${y})">${renderPill(pillText, color)}</g>`,
    );
    x += width + gapX;
  });

  return pills.join("");
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

  const { titleColor, bgColor, borderColor, textColor } = getCardColors({
    title_color,
    bg_color,
    border_color,
    theme,
    icon_color: "",
  });

  const paddingX = 25;
  const columnWidth = (card_width - paddingX * 3) / 2;

  const leftItemsList = left_items.split(",").filter(Boolean);
  const rightItemsList = right_items.split(",").filter(Boolean);

  // Calcula altura dinâmica
  // Estima linhas: (itens * largura_media) / largura_coluna
  const estimateHeight = (items: string[]) => {
    if (items.length === 0) return 0;
    let x = 0;
    let lines = 1;
    items.forEach((item) => {
      const w = measureText(item.trim(), 12) + 28;
      if (x + w > columnWidth) {
        x = 0;
        lines++;
      }
      x += w;
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
          ${renderPills(leftItemsList, titleColor, columnWidth)}
        </g>
      </g>

      <!-- Coluna Direita -->
      <g transform="translate(${columnWidth + paddingX}, 0)">
        <text y="0" fill="${titleColor}" font-family="'Bricolage Grotesque', sans-serif" font-size="18" font-weight="700" text-anchor="start">${right_title}</text>
        <g transform="translate(0, 15)">
          ${renderPills(rightItemsList, titleColor, columnWidth)}
        </g>
      </g>
    </g>
  `;

  return card.render(body);
};

export { renderStackCard };
export default renderStackCard;
