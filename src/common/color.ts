/**
 * @fileoverview Manipulação de cores dos cards SVG.
 *
 * Fornece funções para validar cores hexadecimais, processar gradientes
 * e resolver as cores finais do card com base no tema selecionado e
 * nos parâmetros fornecidos pelo usuário.
 */

import { themes, type Theme } from "../../themes/index.js";

/**
 * Verifica se uma string é uma cor hexadecimal válida.
 *
 * Aceita formatos de 3, 4, 6 ou 8 dígitos hexadecimais (sem o `#`).
 *
 * @param hexColor - A string a ser verificada.
 * @returns `true` se for uma cor hexadecimal válida, `false` caso contrário.
 *
 * @example
 * isValidHexColor("2f80ed"); // → true
 * isValidHexColor("fff");    // → true (3 dígitos)
 * isValidHexColor("zzzzzz"); // → false
 */
const isValidHexColor = (hexColor: string): boolean => {
  return new RegExp(
    /^([A-Fa-f0-9]{8}|[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3}|[A-Fa-f0-9]{4})$/,
  ).test(hexColor);
};

/**
 * Verifica se um array de strings representa um gradiente válido.
 *
 * Um gradiente válido tem mais de 2 elementos, onde o primeiro é o ângulo
 * e os demais são cores hexadecimais válidas.
 *
 * @param colors - Array de strings representando o gradiente.
 * @returns `true` se for um gradiente válido, `false` caso contrário.
 *
 * @example
 * isValidGradient(["45", "2f80ed", "e96c4c"]); // → true
 * isValidGradient(["2f80ed"]);                  // → false
 */
const isValidGradient = (colors: string[]): boolean => {
  return (
    colors.length > 2 &&
    colors.slice(1).every((color) => isValidHexColor(color))
  );
};

/**
 * Retorna uma cor ou gradiente válido, ou o valor de fallback se inválido.
 *
 * Processa a string de cor: se contiver vírgulas, tenta parseá-la como gradiente.
 * Se for uma cor hex válida, retorna com `#` prefixado. Caso contrário, usa fallback.
 *
 * @param color - A cor fornecida pelo usuário (pode ser hex simples ou gradiente).
 * @param fallbackColor - A cor de fallback se `color` for inválida.
 * @returns A cor ou gradiente processado, ou o fallback.
 *
 * @example
 * fallbackColor("2f80ed", "#fffefe"); // → "#2f80ed"
 * fallbackColor("invalid", "#fffefe"); // → "#fffefe"
 * fallbackColor("45,2f80ed,e96c4c", "#fffefe"); // → ["45", "2f80ed", "e96c4c"]
 */
const fallbackColor = (
  color: string | undefined,
  fallbackColorValue: string | string[],
): string | string[] => {
  let gradient: string[] | null = null;

  let colors = color ? color.split(",") : [];
  if (colors.length > 1 && isValidGradient(colors)) {
    gradient = colors;
  }

  return (
    (gradient ? gradient : isValidHexColor(color || "") && `#${color}`) ||
    fallbackColorValue
  );
};

/**
 * Cores completas do card SVG.
 */
export type CardColors = {
  /** Cor do título do card. */
  titleColor: string;
  /** Cor dos ícones do card. */
  iconColor: string;
  /** Cor do texto do card. */
  textColor: string;
  /** Cor de fundo do card (pode ser gradiente). */
  bgColor: string | string[];
  /** Cor da borda do card. */
  borderColor: string;
  /** Cor do anel de rank. */
  ringColor: string;
  /** Família de fontes personalizada (opcional). */
  font_family?: string;
};

/**
 * Parâmetros para resolução das cores do card.
 */
type ParamsGetCardColors = {
  title_color?: string;
  text_color?: string;
  icon_color?: string;
  bg_color?: string;
  border_color?: string;
  ring_color?: string;
  theme?: string;
};

/**
 * Retorna as cores do card com base no tema selecionado e nos parâmetros do usuário.
 *
 * Hierarquia de resolução de cores:
 * 1. Cor fornecida pelo usuário (parâmetros de query)
 * 2. Cor do tema selecionado (`theme`)
 * 3. Cor padrão do tema "default"
 *
 * @param args - Parâmetros com cores e tema do card.
 * @returns Objeto com todas as cores resolvidas para o card.
 * @throws {Error} Se alguma das cores (exceto bgColor) não resultar em uma string.
 *
 * @example
 * const cores = getCardColors({
 *   title_color: "2f80ed",
 *   theme: "dark",
 * });
 * // → { titleColor: "#2f80ed", bgColor: "#151515", ... }
 */
const getCardColors = ({
  title_color,
  text_color,
  icon_color,
  bg_color,
  border_color,
  ring_color,
  theme,
}: ParamsGetCardColors): CardColors => {
  const themesObj = themes as Record<string, Theme>;
  const defaultTheme = themesObj["default"];
  const isThemeProvided =
    theme !== null && theme !== undefined && themesObj[theme];
  const selectedTheme = isThemeProvided ? themesObj[theme] : defaultTheme;

  const defaultBorderColor =
    "border_color" in selectedTheme
      ? selectedTheme.border_color
      : defaultTheme.border_color;

  const titleColor = fallbackColor(
    title_color || selectedTheme.title_color,
    "#" + defaultTheme.title_color,
  );

  const ringColor = fallbackColor(
    ring_color || selectedTheme.ring_color,
    titleColor,
  );
  const iconColor = fallbackColor(
    icon_color || selectedTheme.icon_color,
    "#" + defaultTheme.icon_color,
  );
  const textColor = fallbackColor(
    text_color || selectedTheme.text_color,
    "#" + defaultTheme.text_color,
  );
  const bgColor = fallbackColor(
    bg_color || selectedTheme.bg_color,
    "#" + defaultTheme.bg_color,
  );

  const borderColor = fallbackColor(
    border_color || defaultBorderColor,
    "#" + defaultBorderColor,
  );

  if (
    typeof titleColor !== "string" ||
    typeof textColor !== "string" ||
    typeof ringColor !== "string" ||
    typeof iconColor !== "string" ||
    typeof borderColor !== "string"
  ) {
    throw new Error(
      "Comportamento inesperado: todas as cores exceto o fundo devem ser strings.",
    );
  }

  return { titleColor, iconColor, textColor, bgColor, borderColor, ringColor };
};

export { isValidHexColor, isValidGradient, getCardColors };
