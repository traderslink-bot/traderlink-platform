import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { LiveWatchlistSymbolState } from "@/src/lib/live-watchlist/live-watchlist-types";
import { parseTradersLinkAiRead } from "@/src/lib/live-watchlist/traderslink-ai-read";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

type CandidateRow = Readonly<{
  lifecycle_state: "active" | "removed";
  candidate_id: string;
  high_accepted_price_text: string;
  high_accepted_at_ms: number;
  low_accepted_price_text: string;
  low_accepted_at_ms: number;
}>;

const NEW_YORK = "America/New_York";

function newYorkDate(timestamp: number): string {
  const values = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone: NEW_YORK,
    year: "numeric",
  }).formatToParts(new Date(timestamp));
  const part = (type: string) => values.find((value) => value.type === type)?.value;
  const year = part("year");
  const month = part("month");
  const day = part("day");
  if (!year || !month || !day) throw new Error("watchlist_daily_recap_new_york_date_unavailable");
  return `${year}-${month}-${day}`;
}

function validPrice(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function validTimestamp(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function decimal(value: number): string {
  // Persist a stable decimal string rather than binary floating-point text.
  return value.toFixed(8).replace(/(?:\.0+|(?:(\.[0-9]*?)0+))$/u, "$1");
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function evidenceJson(state: LiveWatchlistSymbolState, price: number, observedAt: number): string {
  return JSON.stringify({
    latestPrice: price,
    latestPriceObservedAt: observedAt,
    potentialGain: state.potentialGain ?? null,
    symbol: state.symbol,
  });
}

function insertEvidence(
  database: Database.Database,
  candidateId: string,
  kind: "activation" | "price_snapshot" | "ai_read" | "potential_path" | "removal_freeze",
  observedAt: number,
  evidence: unknown,
): void {
  const json = JSON.stringify(evidence);
  database.prepare(`INSERT INTO platform_watchlist_recap_evidence_revisions (
  evidence_revision_id, candidate_id, evidence_kind, observed_at_ms,
  schema_version, evidence_json, evidence_sha256, created_at_ms
) VALUES (?, ?, ?, ?, 1, ?, ?, ?)
ON CONFLICT(candidate_id, evidence_kind, observed_at_ms, evidence_sha256) DO NOTHING`).run(
    createCanonicalUuidV4(),
    candidateId,
    kind,
    observedAt,
    json,
    sha256(json),
    observedAt,
  );
}

function statePostedPrice(state: LiveWatchlistSymbolState): number | null {
  const potential = state.potentialGain?.startingPrice;
  return validPrice(potential) ? potential : null;
}

/**
 * Captures factual Watchlist observations for the optional owner-reviewed
 * recap workflow. It never sends Discord, changes Watchlist state, or blocks
 * the publisher if recap storage is unavailable.
 */
export function recordWatchlistDailyRecapEvidence(state: LiveWatchlistSymbolState): void {
  if (!state.firstPostedAt || !validTimestamp(state.firstPostedAt)) return;
  const firstPostedAt = state.firstPostedAt;
  const postedPrice = statePostedPrice(state);
  const observedPrice = state.latestPrice;
  const observedAt = state.latestPriceObservedAt ?? state.updatedAt;
  if (!validPrice(observedPrice) || !validTimestamp(observedAt)) return;

  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      let candidate = database.prepare<[string, number], CandidateRow>(`SELECT
  candidate_id, lifecycle_state, high_accepted_price_text, high_accepted_at_ms,
  low_accepted_price_text, low_accepted_at_ms
FROM platform_watchlist_recap_candidates
WHERE symbol = ? AND first_posted_at_ms = ?`).get(state.symbol, firstPostedAt);
      if (candidate?.lifecycle_state === "removed") return;
      if (!candidate) {
        // A later quote is never substituted for the original publication price.
        if (!postedPrice) return;
        const candidateId = createCanonicalUuidV4();
        const initialObservedAt = Math.max(firstPostedAt, observedAt);
        database.prepare(`INSERT INTO platform_watchlist_recap_candidates (
  candidate_id, symbol, new_york_date, first_posted_at_ms,
  first_posted_price_text, first_accepted_price_text, first_accepted_at_ms,
  latest_accepted_price_text, latest_accepted_at_ms,
  high_accepted_price_text, high_accepted_at_ms,
  low_accepted_price_text, low_accepted_at_ms,
  high_after_low_price_text, high_after_low_at_ms,
  lifecycle_state, frozen_at_ms, removed_at_ms, created_at_ms, updated_at_ms
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, 'active', NULL, NULL, ?, ?)`)
          .run(candidateId, state.symbol, newYorkDate(firstPostedAt), firstPostedAt,
            decimal(postedPrice), decimal(observedPrice), initialObservedAt,
            decimal(observedPrice), initialObservedAt,
            decimal(observedPrice), initialObservedAt,
            decimal(observedPrice), initialObservedAt,
            initialObservedAt, initialObservedAt);
        candidate = {
          lifecycle_state: "active",
          candidate_id: candidateId,
          high_accepted_at_ms: initialObservedAt,
          high_accepted_price_text: decimal(observedPrice),
          low_accepted_at_ms: initialObservedAt,
          low_accepted_price_text: decimal(observedPrice),
        };
        insertEvidence(database, candidateId, "activation", initialObservedAt, {
          firstPostedAt: state.firstPostedAt,
          firstPostedPrice: postedPrice,
          symbol: state.symbol,
        });
      }

      const high = Number(candidate.high_accepted_price_text);
      const low = Number(candidate.low_accepted_price_text);
      const nextHigh = observedPrice > high ? observedPrice : high;
      const nextHighAt = observedPrice > high ? observedAt : candidate.high_accepted_at_ms;
      const nextLow = observedPrice < low ? observedPrice : low;
      const nextLowAt = observedPrice < low ? observedAt : candidate.low_accepted_at_ms;
      const highAfterLow = observedAt >= nextLowAt && observedPrice > nextLow
        ? observedPrice
        : null;
      database.prepare(`UPDATE platform_watchlist_recap_candidates SET
  latest_accepted_price_text = ?, latest_accepted_at_ms = ?,
  high_accepted_price_text = ?, high_accepted_at_ms = ?,
  low_accepted_price_text = ?, low_accepted_at_ms = ?,
  high_after_low_price_text = CASE WHEN ? THEN NULL WHEN ? IS NULL THEN high_after_low_price_text ELSE ? END,
  high_after_low_at_ms = CASE WHEN ? THEN NULL WHEN ? IS NULL THEN high_after_low_at_ms ELSE ? END,
  updated_at_ms = ?
WHERE candidate_id = ? AND lifecycle_state = 'active'`).run(
        decimal(observedPrice), observedAt, decimal(nextHigh), nextHighAt,
        decimal(nextLow), nextLowAt,
        observedPrice < low ? 1 : 0, highAfterLow, highAfterLow === null ? null : decimal(highAfterLow),
        observedPrice < low ? 1 : 0, highAfterLow, highAfterLow === null ? null : observedAt,
        observedAt, candidate.candidate_id,
      );
      insertEvidence(database, candidate.candidate_id, "price_snapshot", observedAt,
        JSON.parse(evidenceJson(state, observedPrice, observedAt)));

      const aiRead = state.cards.tradersLinkAiRead;
      if (aiRead) {
        const parsedAiRead = parseTradersLinkAiRead(aiRead.body);
        insertEvidence(database, candidate.candidate_id, "ai_read", aiRead.updatedAt, {
          publishedAtMs: aiRead.updatedAt,
          read: parsedAiRead ?? aiRead,
          symbol: state.symbol,
        });
      }
      const potentialPath = state.cards.levelMap ?? state.levelMap;
      if (potentialPath) insertEvidence(database, candidate.candidate_id, "potential_path", state.updatedAt, potentialPath);

      if (state.status === "deactivated") {
        database.prepare(`UPDATE platform_watchlist_recap_candidates SET
  lifecycle_state = 'removed', frozen_at_ms = ?, removed_at_ms = ?, updated_at_ms = ?
WHERE candidate_id = ? AND lifecycle_state = 'active'`).run(observedAt, observedAt, observedAt, candidate.candidate_id);
        insertEvidence(database, candidate.candidate_id, "removal_freeze", observedAt, {
          latestPrice: observedPrice,
          symbol: state.symbol,
        });
      }
    })();
  } finally {
    database.close();
  }
}
