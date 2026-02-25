/**
 * @fileoverview Utilitários de formatação de dados.
 *
 * Funções para formatar números, bytes e textos
 * para exibição nos cards SVG do GitHub README Stats.
 */

import wrap from "word-wrap";
import { encodeHTML } from "./html.js";

/**
 * Formata um número para exibição compacta com sufixo "k" (milhares).
 *
 * Se `precision` for fornecido, sempre exibe com sufixo "k" e as casas decimais indicadas.
 * Se `precision` não for fornecido, exibe o número sem sufixo abaixo de 1.000.
 *
 * @param num - O número a ser formatado.
 * @param precision - Número de casas decimais (opcional). Se fornecido, força o formato "k".
 * @returns O número formatado com ou sem sufixo "k".
 *
 * @example
 * kFormatter(500);       // → 500
 * kFormatter(1500);      // → "1.5k"
 * kFormatter(1500, 2);   // → "1.50k"
 * kFormatter(-2000);     // → "-2k"
 */
const kFormatter = (num: number, precision?: number): string | number => {
  const abs = Math.abs(num);
  const sign = Math.sign(num);

  if (typeof precision === "number" && !isNaN(precision)) {
    return (sign * (abs / 1000)).toFixed(precision) + "k";
  }

  if (abs < 1000) {
    return sign * abs;
  }

  return sign * parseFloat((abs / 1000).toFixed(1)) + "k";
};

/**
 * Converte um número de bytes para uma representação legível por humanos.
 *
 * Suporta as unidades: B, KB, MB, GB, TB, PB, EB.
 *
 * @param bytes - O número de bytes a ser convertido. Deve ser não-negativo.
 * @returns A representação legível dos bytes (ex.: "1.5 MB").
 * @throws {Error} Se `bytes` for negativo ou grande demais para ser representado.
 *
 * @example
 * formatBytes(0);          // → "0 B"
 * formatBytes(1024);       // → "1.0 KB"
 * formatBytes(1572864);    // → "1.5 MB"
 */
const formatBytes = (bytes: number): string => {
  if (bytes < 0) {
    throw new Error("O número de bytes deve ser um número não-negativo");
  }

  if (bytes === 0) {
    return "0 B";
  }

  const sizes = ["B", "KB", "MB", "GB", "TB", "PB", "EB"];
  const base = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(base));

  if (i >= sizes.length) {
    throw new Error(
      "O número de bytes é grande demais para ser convertido em uma string legível",
    );
  }

  return `${(bytes / Math.pow(base, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * Quebra um texto longo em múltiplas linhas de acordo com a largura do card.
 *
 * Suporta textos em chinês (separados por vírgula fullwidth `，`)
 * e outros idiomas (usando word-wrap padrão baseado em espaços).
 *
 * @param text - Texto a ser quebrado em linhas.
 * @param width - Largura máxima de cada linha em caracteres (padrão: 59).
 * @param maxLines - Número máximo de linhas a exibir (padrão: 3).
 * @returns Array de strings, uma por linha. Linhas extras são removidas e `...` é adicionado.
 *
 * @example
 * wrapTextMultiline("Este é um texto muito longo que precisa ser quebrado", 20, 2);
 * // → ["Este é um texto", "muito longo..."]
 */
const wrapTextMultiline = (
  text: string,
  width: number = 59,
  maxLines: number = 3,
): string[] => {
  const fullWidthComma = "，";
  const encoded = encodeHTML(text);
  const isChinese = encoded.includes(fullWidthComma);

  let wrapped: string[] = [];

  if (isChinese) {
    wrapped = encoded.split(fullWidthComma); // Pontuação fullwidth chinesa
  } else {
    wrapped = wrap(encoded, {
      width,
    }).split("\n"); // Divide o texto em linhas
  }

  const lines = wrapped.map((line) => line.trim()).slice(0, maxLines);

  // Adiciona "..." à última linha se o texto exceder maxLines
  if (wrapped.length > maxLines) {
    lines[maxLines - 1] += "...";
  }

  // Remove linhas vazias
  const multiLineText = lines.filter(Boolean);
  return multiLineText;
};

export { kFormatter, formatBytes, wrapTextMultiline };
