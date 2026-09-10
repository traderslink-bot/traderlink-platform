export type DailyWatchlistRecapReviewState =
  | "unreviewed"
  | "add_to_recap"
  | "dont_use"
  | "needs_correction"
  | "posted";

export type DailyWatchlistRecapCorrectionReason =
  | "incorrect_posted_fact"
  | "incorrect_price_sequence"
  | "incorrect_pullback_or_level"
  | "misleading_wording"
  | "other";

export type DailyWatchlistRecapCompositionItem = Readonly<{
  candidateId: string;
  draftRevisionId: string;
  position: number;
  recapText: string;
}>;

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function assertUuid(value: string, field: string): void {
  if (!UUID_V4.test(value)) throw new Error(`watchlist_daily_recap_invalid_${field}`);
}

function normalizedRecapText(value: string): string {
  const text = value.trim();
  if (!text || text.length > 4_000) throw new Error("watchlist_daily_recap_invalid_recap_text");
  if (/@everyone|@here|<@&|<@\d+>/i.test(text)) {
    throw new Error("watchlist_daily_recap_recap_text_contains_mention");
  }
  return text;
}

/**
 * Produces the editable trade-recap body only. The browser never supplies a
 * Discord destination or mention footer; the authorized runtime owns that
 * fixed server-only addition at the final explicit post step.
 */
export function buildDailyWatchlistRecapComposition(
  items: readonly DailyWatchlistRecapCompositionItem[],
): string {
  if (items.length === 0) throw new Error("watchlist_daily_recap_empty_composition");
  const seenCandidates = new Set<string>();
  const seenPositions = new Set<number>();
  const ordered = items.map((item) => {
    assertUuid(item.candidateId, "candidate_id");
    assertUuid(item.draftRevisionId, "draft_revision_id");
    if (!Number.isSafeInteger(item.position) || item.position < 0) {
      throw new Error("watchlist_daily_recap_invalid_composition_position");
    }
    if (seenCandidates.has(item.candidateId) || seenPositions.has(item.position)) {
      throw new Error("watchlist_daily_recap_duplicate_composition_item");
    }
    seenCandidates.add(item.candidateId);
    seenPositions.add(item.position);
    return Object.freeze({ position: item.position, recapText: normalizedRecapText(item.recapText) });
  }).sort((left, right) => left.position - right.position);

  for (let position = 0; position < ordered.length; position += 1) {
    if (ordered[position]?.position !== position) {
      throw new Error("watchlist_daily_recap_non_contiguous_composition_order");
    }
  }
  return ordered.map((item) => item.recapText).join("\n\n");
}
