/**
 * @fileoverview Gerenciamento de cache HTTP para os cards do GitHub README Stats.
 *
 * Define as durações padrão de TTL (Time To Live) e as funções para
 * configurar os headers de Cache-Control nas respostas HTTP.
 *
 * O cache é essencial para evitar exceder os limites de taxa da API do GitHub.
 */

import { clampValue } from "./ops.js";

/** Segundos em um minuto. */
const MIN = 60;
/** Segundos em uma hora. */
const HORA = 60 * MIN;
/** Segundos em um dia. */
const DIA = 24 * HORA;

/**
 * Constantes de duração de tempo em segundos.
 *
 * Usadas para definir os TTLs de cache de forma legível e sem "números mágicos".
 */
const DURATIONS = {
  ONE_MINUTE: MIN,
  FIVE_MINUTES: 5 * MIN,
  TEN_MINUTES: 10 * MIN,
  FIFTEEN_MINUTES: 15 * MIN,
  THIRTY_MINUTES: 30 * MIN,

  TWO_HOURS: 2 * HORA,
  FOUR_HOURS: 4 * HORA,
  SIX_HOURS: 6 * HORA,
  EIGHT_HOURS: 8 * HORA,
  TWELVE_HOURS: 12 * HORA,

  ONE_DAY: DIA,
  TWO_DAY: 2 * DIA,
  SIX_DAY: 6 * DIA,
  TEN_DAY: 10 * DIA,
};

/**
 * Tipo do objeto de configuração de TTL de cache para cada tipo de card.
 */
type ConfigTTL = {
  DEFAULT: number;
  MIN: number;
  MAX: number;
};

/**
 * Valores de TTL de cache (em segundos) para cada tipo de card.
 *
 * - `DEFAULT`: TTL padrão quando não especificado pelo usuário.
 * - `MIN`: TTL mínimo permitido (abaixo disso, o padrão é usado).
 * - `MAX`: TTL máximo permitido (acima disso, o máximo é usado).
 */
const CACHE_TTL: {
  STATS_CARD: ConfigTTL;
  TOP_LANGS_CARD: ConfigTTL;
  PIN_CARD: ConfigTTL;
  GIST_CARD: ConfigTTL;
  WAKATIME_CARD: ConfigTTL;
  ERROR: number;
} = {
  STATS_CARD: {
    DEFAULT: DURATIONS.ONE_DAY,
    MIN: DURATIONS.TWELVE_HOURS,
    MAX: DURATIONS.TWO_DAY,
  },
  TOP_LANGS_CARD: {
    DEFAULT: DURATIONS.SIX_DAY,
    MIN: DURATIONS.TWO_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  PIN_CARD: {
    DEFAULT: DURATIONS.TEN_DAY,
    MIN: DURATIONS.ONE_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  GIST_CARD: {
    DEFAULT: DURATIONS.TWO_DAY,
    MIN: DURATIONS.ONE_DAY,
    MAX: DURATIONS.TEN_DAY,
  },
  WAKATIME_CARD: {
    DEFAULT: DURATIONS.ONE_DAY,
    MIN: DURATIONS.TWELVE_HOURS,
    MAX: DURATIONS.TWO_DAY,
  },
  ERROR: DURATIONS.TEN_MINUTES,
};

/**
 * Parâmetros para `resolveCacheSeconds`.
 */
type ParamsResolveCacheSeconds = {
  /** Tempo de cache solicitado pelo usuário (pode ser NaN). */
  requested: number;
  /** Tempo de cache padrão para este tipo de card. */
  def: number;
  /** Tempo de cache mínimo permitido. */
  min: number;
  /** Tempo de cache máximo permitido. */
  max: number;
};

/**
 * Resolve o número de segundos de cache a aplicar.
 *
 * Considera: valor solicitado pelo usuário → limitado ao intervalo [min, max].
 * Se a variável de ambiente `CACHE_SECONDS` estiver definida, ela sobrescreve tudo.
 *
 * @param args - Parâmetros de resolução do cache.
 * @returns O número de segundos de cache a ser utilizado.
 *
 * @example
 * resolveCacheSeconds({ requested: 7200, def: 86400, min: 43200, max: 172800 });
 * // → 43200 (o solicitado é menor que o mínimo, então usa o mínimo)
 */
const resolveCacheSeconds = ({
  requested,
  def,
  min,
  max,
}: ParamsResolveCacheSeconds): number => {
  let cacheSeconds = clampValue(isNaN(requested) ? def : requested, min, max);

  if (process.env.CACHE_SECONDS) {
    const envCacheSeconds = parseInt(process.env.CACHE_SECONDS, 10);
    if (!isNaN(envCacheSeconds)) {
      cacheSeconds = envCacheSeconds;
    }
  }

  return cacheSeconds;
};

/**
 * Desativa o cache configurando os headers apropriados na resposta.
 *
 * Usado em modo de desenvolvimento e quando `cache_seconds < 1`.
 * Instrui navegadores, CDNs e o proxy GitHub Camo a não armazenar em cache.
 *
 * @param res - O objeto de resposta HTTP.
 */
const disableCaching = (res: any): void => {
  res.setHeader(
    "Cache-Control",
    "no-cache, no-store, must-revalidate, max-age=0, s-maxage=0",
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
};

/**
 * Define os headers de Cache-Control na resposta HTTP.
 *
 * Configura o cache para navegadores, CDNs e o proxy GitHub Camo.
 * Em modo de desenvolvimento, desativa o cache completamente.
 *
 * @param res - O objeto de resposta HTTP.
 * @param cacheSeconds - O número de segundos para manter o cache.
 */
const setCacheHeaders = (res: any, cacheSeconds: number): void => {
  if (cacheSeconds < 1 || process.env.NODE_ENV === "development") {
    disableCaching(res);
    return;
  }

  res.setHeader(
    "Cache-Control",
    `max-age=${cacheSeconds}, ` +
      `s-maxage=${cacheSeconds}, ` +
      `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
  );
};

/**
 * Define os headers de Cache-Control para respostas de erro.
 *
 * Usa um TTL menor para erros, garantindo que usuários tentem novamente em breve.
 * Em modo de desenvolvimento, desativa o cache completamente.
 *
 * @param res - O objeto de resposta HTTP.
 */
const setErrorCacheHeaders = (res: any): void => {
  const envCacheSeconds = process.env.CACHE_SECONDS
    ? parseInt(process.env.CACHE_SECONDS, 10)
    : NaN;
  if (
    (!isNaN(envCacheSeconds) && envCacheSeconds < 1) ||
    process.env.NODE_ENV === "development"
  ) {
    disableCaching(res);
    return;
  }

  res.setHeader(
    "Cache-Control",
    `max-age=${CACHE_TTL.ERROR}, ` +
      `s-maxage=${CACHE_TTL.ERROR}, ` +
      `stale-while-revalidate=${DURATIONS.ONE_DAY}`,
  );
};

export {
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
  DURATIONS,
  CACHE_TTL,
};
