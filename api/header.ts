import { renderHeaderCard } from "../src/cards/header.js";
import {
  setCacheHeaders,
  CACHE_TTL,
  resolveCacheSeconds,
} from "../src/common/cache.js";
import { parseBoolean, parseNumber, parseString } from "../src/common/ops.js";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async (req: VercelRequest, res: VercelResponse) => {
  const {
    text,
    font_size,
    font_weight,
    font_family,
    align,
    card_width,
    title_color,
    bg_color,
    theme,
    border_radius,
    border_color,
    hide_border,
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
      renderHeaderCard({
        text: parseString(text),
        font_size: parseNumber(font_size),
        font_weight: parseNumber(font_weight),
        font_family: parseString(font_family),
        align: parseString(align) as any,
        card_width: parseNumber(card_width),
        title_color: parseString(title_color),
        bg_color: parseString(bg_color),
        theme: parseString(theme) as any,
        border_radius: parseNumber(border_radius),
        border_color: parseString(border_color),
        hide_border: parseBoolean(hide_border),
      }),
    );
  } catch (err) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(500).send("Error rendering header card");
  }
};
