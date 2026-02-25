/**
 * @fileoverview API do Card de Streak do GitHub.
 */

import { renderStreakCard } from "../src/cards/streak.js";
import { guardAccess } from "../src/common/access.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import { parseBoolean, parseNumber, parseString } from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchStreak } from "../src/fetchers/streak.js";
import { isLocaleAvailable } from "../src/translations.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    username,
    hide_border,
    card_width,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    locale,
    border_radius,
    border_color,
    font_family,
    fire_color,
  } = req.query as any;

  res.setHeader("Content-Type", "image/svg+xml");

  const usernameStr = parseString(username);
  if (!usernameStr) {
    throw new MissingParamError(["username"]);
  }

  const access = guardAccess({
    res,
    id: usernameStr,
    type: "username",
    colors: {
      title_color,
      text_color,
      bg_color,
      border_color,
      theme,
    },
  });
  if (!access.isPassed) {
    return access.result;
  }

  const localeStr = parseString(locale) || "pt-br";
  if (localeStr && !isLocaleAvailable(localeStr)) {
    return res.send(
      renderError({
        message: "Algo deu errado",
        secondaryMessage: "Idioma não encontrado",
        renderOptions: {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
          font_family: parseString(font_family),
        },
      }),
    );
  }

  try {
    const streakData = await fetchStreak(usernameStr);
    const cacheSeconds = resolveCacheSeconds({
      requested: parseNumber(cache_seconds)!,
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderStreakCard(streakData, {
        hide_border: parseBoolean(hide_border),
        card_width: parseNumber(card_width),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        border_radius: parseNumber(border_radius),
        border_color: parseString(border_color),
        locale: localeStr ? localeStr.toLowerCase() : undefined,
        font_family,
        fire_color: parseString(fire_color),
      }),
    );
  } catch (err) {
    setErrorCacheHeaders(res);
    if (err instanceof Error) {
      return res.send(
        renderError({
          message: err.message,
          secondaryMessage: retrieveSecondaryMessage(err),
          renderOptions: {
            title_color,
            text_color,
            bg_color,
            border_color,
            theme,
            show_repo_link: !(err instanceof MissingParamError),
            font_family,
          },
        }),
      );
    }
    return res.send(
      renderError({
        message: "Ocorreu um erro desconhecido",
        renderOptions: {
          title_color,
          text_color,
          bg_color,
          border_color,
          theme,
          font_family,
        },
      }),
    );
  }
};
