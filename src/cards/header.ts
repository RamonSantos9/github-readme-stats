/**
 * @fileoverview Card de Título (Header) SVG personalizado.
 */

import Card from "../common/Card.js";
import { getCardColors } from "../common/color.js";
import { measureText } from "../common/render.js";
import type { HeaderCardOptions } from "./types.js";

/**
 * Renderiza um título SVG simples com suporte a fontes embutidas (Bricolage).
 *
 * @param options - Opções de personalização.
 * @returns String SVG do título.
 */
const renderHeaderCard = (options: Partial<HeaderCardOptions> = {}): string => {
  const {
    text = "",
    font_size = 24,
    font_weight = 700,
    font_family = "Bricolage Grotesque",
    align = "left",
    card_width,
    title_color,
    bg_color = "00000000",
    theme,
    border_radius,
    border_color,
    hide_border = true,
  } = options;

  const { titleColor, bgColor, borderColor } = getCardColors({
    title_color,
    bg_color,
    border_color,
    theme,
    icon_color: "",
  });

  // Estima a largura se não for fornecida
  // Multiplicador de 1.1 para dar uma margem de segurança na Bricolage
  const estimatedWidth = measureText(text, font_size) * 1.1 + 50;
  const width = card_width || estimatedWidth;
  const height = font_size + 40;

  const card = new Card({
    width,
    height,
    border_radius,
    colors: {
      titleColor,
      bgColor,
      borderColor,
      font_family,
    },
  });

  card.setHideBorder(hide_border);
  card.setHideTitle(true);
  card.height = height;
  card.paddingX = 0;

  let x = 25;
  let textAnchor = "start";

  if (align === "center") {
    x = width / 2;
    textAnchor = "middle";
  } else if (align === "right") {
    x = width - 25;
    textAnchor = "end";
  }

  return card.render(`
    <text
      x="${x}"
      y="${height / 2 + font_size / 3}"
      fill="${titleColor}"
      style="font-family: '${font_family}', sans-serif; font-size: ${font_size}px; font-weight: ${font_weight};"
      text-anchor="${textAnchor}"
    >
      ${text}
    </text>
  `);
};

export { renderHeaderCard };
export default renderHeaderCard;
