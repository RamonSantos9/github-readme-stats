import { renderWakatimeCard } from "../src/cards/wakatime.js";
import { renderError } from "../src/common/render.js";
import { fetchWakatimeStats } from "../src/fetchers/wakatime.js";
import { isLocaleAvailable } from "../src/translations.js";
import {
  CACHE_TTL,
  resolveCacheSeconds,
  setCacheHeaders,
  setErrorCacheHeaders,
} from "../src/common/cache.js";
import { guardAccess } from "../src/common/access.js";
import {
  MissingParamError,
  retrieveSecondaryMessage,
} from "../src/common/error.js";
import {
  parseArray,
  parseBoolean,
  parseNumber,
  parseString,
} from "../src/common/ops.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    username,
    title_color,
    icon_color,
    hide_border,
    card_width,
    line_height,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    hide_title,
    hide_progress,
    custom_title,
    locale,
    layout,
    langs_count,
    hide,
    api_domain,
    border_radius,
    border_color,
    display_format,
    disable_animations,
    font_family,
  } = req.query as any;

  res.setHeader("Content-Type", "image/svg+xml");

  const usernameStr = parseString(username);
  if (!usernameStr) {
    throw new MissingParamError(["username"]);
  }

  const access = guardAccess({
    res,
    id: usernameStr,
    type: "wakatime",
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
    const stats = await fetchWakatimeStats({
      username: usernameStr,
      api_domain: parseString(api_domain),
    });
    const cacheSeconds = resolveCacheSeconds({
      requested: parseNumber(cache_seconds)!,
      def: CACHE_TTL.WAKATIME_CARD.DEFAULT,
      min: CACHE_TTL.WAKATIME_CARD.MIN,
      max: CACHE_TTL.WAKATIME_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderWakatimeCard(stats, {
        custom_title: parseString(custom_title),
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseNumber(card_width),
        hide: parseArray(parseString(hide)),
        line_height: parseString(line_height),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        hide_progress: parseBoolean(hide_progress),
        border_radius: parseNumber(border_radius),
        border_color,
        locale: localeStr ? localeStr.toLowerCase() : undefined,
        layout: parseString(layout) as any,
        langs_count: parseNumber(langs_count),
        display_format: parseString(display_format) as any,
        disable_animations: parseBoolean(disable_animations),
        font_family: parseString(font_family),
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
