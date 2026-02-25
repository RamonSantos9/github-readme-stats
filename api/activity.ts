import { renderActivityGraph } from "../src/cards/activity-graph.js";
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
import { fetchActivity } from "../src/fetchers/activity.js";
import { isLocaleAvailable } from "../src/translations.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    username,
    hide_title,
    hide_border,
    card_width,
    card_height,
    title_color,
    icon_color,
    text_color,
    bg_color,
    theme,
    cache_seconds,
    custom_title,
    locale,
    disable_animations,
    border_radius,
    border_color,
    font_family,
    line_color,
    point_color,
    area_color,
    hide_area,
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
    const activityData = await fetchActivity(usernameStr);
    const cacheSeconds = resolveCacheSeconds({
      requested: parseNumber(cache_seconds)!,
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderActivityGraph(activityData, {
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseNumber(card_width),
        card_height: parseNumber(card_height),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        custom_title: parseString(custom_title),
        border_radius: parseNumber(border_radius),
        border_color: parseString(border_color),
        locale: localeStr ? localeStr.toLowerCase() : undefined,
        disable_animations: parseBoolean(disable_animations),
        font_family,
        line_color,
        point_color,
        area_color,
        hide_area: parseBoolean(hide_area),
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
