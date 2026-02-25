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
import { parseBoolean } from "../src/common/ops.js";
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

  const access = guardAccess({
    res,
    id: username,
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

  if (locale && !isLocaleAvailable(locale)) {
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
          font_family,
        },
      }),
    );
  }

  try {
    const activityData = await fetchActivity(username);
    const cacheSeconds = resolveCacheSeconds({
      requested: parseInt(cache_seconds, 10),
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderActivityGraph(activityData, {
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseInt(card_width, 10),
        card_height: parseInt(card_height, 10),
        title_color,
        icon_color,
        text_color,
        bg_color,
        theme,
        custom_title,
        border_radius,
        border_color,
        locale: locale ? locale.toLowerCase() : null,
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
