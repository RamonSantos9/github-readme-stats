import { renderStatsCard } from "../src/cards/stats.js";
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
import {
  parseArray,
  parseBoolean,
  parseNumber,
  parseString,
} from "../src/common/ops.js";
import { renderError } from "../src/common/render.js";
import { fetchStats } from "../src/fetchers/stats.js";
import { isLocaleAvailable } from "../src/translations.js";

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    username,
    hide,
    hide_title,
    hide_border,
    card_width,
    hide_rank,
    show_icons,
    include_all_commits,
    commits_year,
    line_height,
    title_color,
    ring_color,
    icon_color,
    text_color,
    text_bold,
    bg_color,
    theme,
    cache_seconds,
    exclude_repo,
    custom_title,
    locale,
    disable_animations,
    border_radius,
    number_format,
    number_precision,
    border_color,
    rank_icon,
    show,
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
    const showStats = parseArray(parseString(show));
    const stats = await fetchStats(
      usernameStr,
      parseBoolean(include_all_commits),
      parseArray(parseString(exclude_repo)),
      showStats.includes("prs_merged") ||
        showStats.includes("prs_merged_percentage"),
      showStats.includes("discussions_started"),
      showStats.includes("discussions_answered"),
      parseNumber(commits_year),
    );
    const cacheSeconds = resolveCacheSeconds({
      requested: parseNumber(cache_seconds)!,
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderStatsCard(stats, {
        hide: parseArray(parseString(hide)),
        show_icons: parseBoolean(show_icons),
        hide_title: parseBoolean(hide_title),
        hide_border: parseBoolean(hide_border),
        card_width: parseNumber(card_width),
        hide_rank: parseBoolean(hide_rank),
        include_all_commits: parseBoolean(include_all_commits),
        commits_year: parseNumber(commits_year),
        line_height: parseNumber(line_height),
        title_color,
        ring_color,
        icon_color,
        text_color,
        text_bold: parseBoolean(text_bold),
        bg_color,
        theme,
        custom_title: parseString(custom_title),
        border_radius: parseNumber(border_radius),
        border_color: parseString(border_color),
        number_format: parseString(number_format),
        number_precision: parseNumber(number_precision),
        locale: localeStr ? localeStr.toLowerCase() : undefined,
        disable_animations: parseBoolean(disable_animations),
        rank_icon,
        show: showStats,
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
}
