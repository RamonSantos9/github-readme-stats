import { renderStackCard } from "../src/cards/stack.js";
import {
  setCacheHeaders,
  CACHE_TTL,
  resolveCacheSeconds,
} from "../src/common/cache.js";
import { parseBoolean, parseNumber, parseString } from "../src/common/ops.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    title,
    left_title,
    left_items,
    right_title,
    right_items,
    card_width,
    title_color,
    bg_color,
    theme,
    border_radius,
    border_color,
    hide_border,
    hide_title,
    cache_seconds,
  } = req.query as any;

  res.setHeader("Content-Type", "image/svg+xml");

  try {
    const cacheSeconds = resolveCacheSeconds({
      requested: parseNumber(cache_seconds)!,
      def: CACHE_TTL.STATS_CARD.DEFAULT,
      min: CACHE_TTL.STATS_CARD.MIN,
      max: CACHE_TTL.STATS_CARD.MAX,
    });

    setCacheHeaders(res, cacheSeconds);

    return res.send(
      renderStackCard({
        title: parseString(title),
        left_title: parseString(left_title),
        left_items: parseString(left_items),
        right_title: parseString(right_title),
        right_items: parseString(right_items),
        card_width: parseNumber(card_width),
        title_color: parseString(title_color),
        bg_color: parseString(bg_color),
        theme: parseString(theme) as any,
        border_radius: parseNumber(border_radius),
        border_color: parseString(border_color),
        hide_border: parseBoolean(hide_border),
        hide_title: parseBoolean(hide_title),
      }),
    );
  } catch (err) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send("Error rendering stack card");
  }
};
