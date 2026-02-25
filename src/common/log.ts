/**
 * @fileoverview Módulo de registro de logs do sistema.
 *
 * Retorna o console real em produção/desenvolvimento e
 * funções nulas (noop) durante os testes, para não poluir a saída.
 */

/** Função vazia que não faz nada — usada durante testes para suprimir logs. */
const noop = (): void => {};

/**
 * Instância de logger baseada no ambiente de execução.
 *
 * - Em ambiente de **teste** (`NODE_ENV === "test"`), usa funções vazias.
 * - Em qualquer outro ambiente, usa o `console` nativo do Node.js.
 *
 * @example
 * import { logger } from "./log.js";
 * logger.log("Busca iniciada:", username);
 * logger.error("Erro na API do GitHub:", erro);
 */
const logger: Console | { log: () => void; error: () => void } =
  process.env.NODE_ENV === "test" ? { log: noop, error: noop } : console;

export { logger };
export default logger;
