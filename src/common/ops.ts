/**
 * @fileoverview Funções utilitárias de propósito geral.
 *
 * Contém utilitários para parsing de valores de query string,
 * manipulação de arrays e operações matemáticas comuns usadas
 * em toda a aplicação.
 */

import toEmoji from "emoji-name-map";

/**
 * Converte uma string (ou booleano) em um valor booleano tipado.
 *
 * Útil para processar parâmetros de query string onde o valor pode
 * vir como "true" ou "false" (string) ou já como boolean.
 *
 * @param value - O valor a ser convertido.
 * @returns `true`, `false`, ou `undefined` se o valor não for reconhecido.
 *
 * @example
 * parseBoolean("true");  // → true
 * parseBoolean("false"); // → false
 * parseBoolean("outro"); // → undefined
 * parseBoolean(true);    // → true
 */
const parseBoolean = (
  value: string | boolean | undefined,
): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value.toLowerCase() === "true") {
      return true;
    } else if (value.toLowerCase() === "false") {
      return false;
    }
  }
  return undefined;
};

/**
 * Garante que o valor seja uma string única.
 * Se o valor for um array, retorna o primeiro elemento.
 *
 * @param value - O valor a ser normalizado.
 * @returns A string resultante ou undefined.
 */
const parseString = (
  value: string | string[] | undefined,
): string | undefined => {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
};

/**
 * Converte um valor de query em número, tratando arrays.
 *
 * @param value - O valor a ser convertido.
 * @returns O número resultante ou undefined se inválido.
 */
const parseNumber = (
  value: string | string[] | undefined,
): number | undefined => {
  const str = parseString(value);
  if (str === undefined) {
    return undefined;
  }
  const num = parseFloat(str);
  return Number.isNaN(num) ? undefined : num;
};

/**
 * Converte uma string separada por vírgulas em um array de strings.
 *
 * Útil para processar parâmetros de query string que aceitam múltiplos valores.
 *
 * @param str - A string a ser convertida.
 * @returns Array de strings ou array vazio se a string for falsy.
 *
 * @example
 * parseArray("stars,commits,prs"); // → ["stars", "commits", "prs"]
 * parseArray("");                  // → []
 * parseArray(undefined);           // → []
 */
const parseArray = (str: string | undefined): string[] => {
  if (!str) {
    return [];
  }
  return str.split(",");
};

/**
 * Limita um número a um intervalo definido por mínimo e máximo.
 *
 * Se o valor não for um número válido, retorna o valor mínimo como fallback.
 *
 * @param number - O número a ser limitado.
 * @param min - O valor mínimo permitido.
 * @param max - O valor máximo permitido.
 * @returns O número limitado ao intervalo [min, max].
 *
 * @example
 * clampValue(50, 0, 100);  // → 50
 * clampValue(150, 0, 100); // → 100
 * clampValue(-10, 0, 100); // → 0
 * clampValue(NaN, 5, 100); // → 5 (valor mínimo como fallback)
 */
const clampValue = (number: number, min: number, max: number): number => {
  if (Number.isNaN(parseInt(String(number), 10))) {
    return min;
  }
  return Math.max(min, Math.min(number, max));
};

/**
 * Converte uma string para minúsculas e remove espaços nas extremidades.
 *
 * @param name - A string a ser tratada.
 * @returns A string em minúsculas e sem espaços extras.
 *
 * @example
 * lowercaseTrim("  GitHub "); // → "github"
 */
const lowercaseTrim = (name: string): string => name.toLowerCase().trim();

/**
 * Divide um array em sub-arrays (chunks) de tamanho definido.
 *
 * Usado principalmente para dividir linguagens em colunas no card.
 *
 * @template T - Tipo dos elementos do array.
 * @param arr - Array a ser dividido.
 * @param perChunk - Quantidade de elementos por sub-array.
 * @returns Array de sub-arrays com o tamanho definido.
 *
 * @example
 * chunkArray(["a", "b", "c", "d", "e"], 2);
 * // → [["a", "b"], ["c", "d"], ["e"]]
 */
const chunkArray = <T>(arr: T[], perChunk: number): T[][] => {
  return arr.reduce<T[][]>((resultArray, item, index) => {
    const chunkIndex = Math.floor(index / perChunk);

    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }

    resultArray[chunkIndex].push(item);

    return resultArray;
  }, []);
};

/**
 * Substitui códigos de emoji (ex.: `:rocket:`) por seus caracteres Unicode.
 *
 * @param str - A string contendo os códigos de emoji a serem substituídos.
 * @returns A string com os emojis convertidos para Unicode.
 * @throws {Error} Se o argumento `str` não for fornecido.
 *
 * @example
 * parseEmojis("Hello :wave:");  // → "Hello 👋"
 * parseEmojis(":rocket: Deploy!"); // → "🚀 Deploy!"
 */
const parseEmojis = (str: string): string => {
  if (!str) {
    throw new Error("[parseEmoji]: argumento str não fornecido");
  }
  return str.replace(/:\w+:/gm, (emoji) => {
    return toEmoji.get(emoji) || "";
  });
};

/**
 * Calcula a diferença em minutos entre duas datas.
 *
 * @param d1 - A primeira data (mais recente).
 * @param d2 - A segunda data (mais antiga).
 * @returns A diferença em minutos entre as duas datas.
 *
 * @example
 * const agora = new Date();
 * const umHoraAtras = new Date(Date.now() - 3600000);
 * dateDiff(agora, umHoraAtras); // → 60
 */
const dateDiff = (d1: Date, d2: Date): number => {
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  const diff = date1.getTime() - date2.getTime();
  return Math.round(diff / (1000 * 60));
};

export {
  parseBoolean,
  parseString,
  parseNumber,
  parseArray,
  clampValue,
  lowercaseTrim,
  chunkArray,
  parseEmojis,
  dateDiff,
};
