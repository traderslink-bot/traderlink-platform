import type { LiveWatchlistCardContent } from "./live-watchlist-types";

export function readAnalysisReviewPreview(value: unknown): {
  card: LiveWatchlistCardContent; dipBuyPlanVisible: boolean;
} | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  if (message.source !== "traderslink-watchlist-admin" || message.type !== "preview-analysis" ||
      !message.card || typeof message.card !== "object") return null;
  const card = message.card as Partial<LiveWatchlistCardContent>;
  if (typeof card.body !== "string" || card.body.length > 2 * 1024 * 1024 ||
      typeof card.title !== "string" || typeof card.source !== "string" ||
      typeof card.updatedAt !== "number" || !Number.isFinite(card.updatedAt) ||
      !(card.priceWhenPosted === null || (typeof card.priceWhenPosted === "number" && Number.isFinite(card.priceWhenPosted)))) return null;
  return { card: card as LiveWatchlistCardContent, dipBuyPlanVisible: message.dipBuyPlanVisible !== false };
}
