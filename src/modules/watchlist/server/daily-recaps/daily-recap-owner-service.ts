import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import { parseTradersLinkAiRead } from "@/src/lib/live-watchlist/traderslink-ai-read";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";

import { buildDailyWatchlistAnalysisRecap } from "./daily-analysis-recap-builder";
import { requestWatchlistRuntimeRaw } from "../runtime/watchlist-runtime-admin-client";

type CandidateRow = Readonly<{
  candidate_id: string; symbol: string; new_york_date: string; first_posted_at_ms: number;
  first_posted_price_text: string; lifecycle_state: "active" | "removed";
}>;
type EvidenceRow = Readonly<{
  evidence_revision_id: string; evidence_kind: string; observed_at_ms: number; evidence_json: string;
}>;

export type DailyRecapOwnerCandidate = Readonly<{
  candidateId: string; draftRevisionId: string | null; lifecycleState: "active" | "removed";
  postedAtMs: number; postedPrice: number; recapText: string | null;
  reviewState: "unreviewed" | "add_to_recap" | "dont_use" | "needs_correction" | "posted";
  symbol: string; auditFlagNote: string | null;
}>;

export type DailyRecapStorageSummary = Readonly<{
  cleanupRecommended: boolean; correctionCount: number; draftCount: number;
  oldestDate: string | null; postedCount: number; storedBytes: number;
}>;

export type DailyRecapPostHistory = Readonly<{
  compositionId: string; state: "pending" | "posted" | "failed"; bodyText: string;
}>;

export type DailyRecapBodyItem = { candidateId: string; draftRevisionId: string };

export function readDailyRecapFinalItems(date: string, userId: string): DailyRecapBodyItem[] {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare<[string, string], DailyRecapBodyItem>(`SELECT i.candidate_id AS candidateId, i.draft_revision_id AS draftRevisionId
FROM platform_watchlist_recap_composition_items i WHERE i.composition_id = (
SELECT c.composition_id FROM platform_watchlist_recap_compositions c
JOIN platform_watchlist_recap_composition_revisions r ON r.composition_revision_id = c.current_revision_id
WHERE c.new_york_date = ? AND c.created_by_user_id = ? ORDER BY r.created_at_ms DESC, c.composition_id DESC LIMIT 1)
ORDER BY i.display_position`).all(date, userId);
  } finally { database.close(); }
}

function bodyItems(database: Database.Database, date: string, items?: readonly DailyRecapBodyItem[]): DailyRecapBodyItem[] {
  if (items === undefined) return database.prepare<[string], DailyRecapBodyItem>(`SELECT r.candidate_id AS candidateId, r.current_draft_revision_id AS draftRevisionId
FROM platform_watchlist_recap_reviews r JOIN platform_watchlist_recap_candidates c ON c.candidate_id = r.candidate_id
WHERE c.new_york_date = ? AND r.review_state = 'add_to_recap' ORDER BY c.first_posted_at_ms, c.candidate_id`).all(date);
  if (!Array.isArray(items) || new Set(items.map((item) => item?.candidateId)).size !== items.length) throw new Error("invalid_recap_items");
  for (const item of items) {
    if (!item || typeof item.candidateId !== "string" || typeof item.draftRevisionId !== "string"
      || !database.prepare(`SELECT 1 FROM platform_watchlist_recap_draft_revisions d
JOIN platform_watchlist_recap_candidates c ON c.candidate_id = d.candidate_id
WHERE d.candidate_id = ? AND d.draft_revision_id = ? AND c.new_york_date = ?`).get(item.candidateId, item.draftRevisionId, date)) throw new Error("invalid_recap_items");
  }
  return [...items];
}

function saveBodyItems(database: Database.Database, compositionId: string, items: readonly DailyRecapBodyItem[]): void {
  items.forEach((item, position) => database.prepare(`INSERT INTO platform_watchlist_recap_composition_items
(composition_id, candidate_id, draft_revision_id, display_position) VALUES (?, ?, ?, ?)`)
    .run(compositionId, item.candidateId, item.draftRevisionId, position));
}

export function readDailyRecapFinalDraft(date: string, userId: string): string | null {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare<[string, string], { body_text: string }>(`SELECT r.body_text
FROM platform_watchlist_recap_compositions c
JOIN platform_watchlist_recap_composition_revisions r ON r.composition_revision_id = c.current_revision_id
WHERE c.new_york_date = ? AND c.created_by_user_id = ?
ORDER BY r.created_at_ms DESC, c.composition_id DESC LIMIT 1`).get(date, userId)?.body_text ?? null;
  } finally { database.close(); }
}

/** Save the owner body without selecting candidates or creating a delivery attempt. */
export function saveDailyRecapFinalDraft(input: { newYorkDate: string; userId: string; bodyText: string; items?: readonly DailyRecapBodyItem[] }): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(input.newYorkDate) || !input.bodyText.trim() || input.bodyText.length > 4000) {
    throw new Error("watchlist_daily_recap_invalid_draft");
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      const items = bodyItems(database, input.newYorkDate, input.items);
      const compositionId = createCanonicalUuidV4();
      const revisionId = createCanonicalUuidV4();
      const now = nextCompositionTimestamp(database);
      database.prepare(`INSERT INTO platform_watchlist_recap_compositions
(composition_id, new_york_date, composition_state, current_revision_id, created_by_user_id, created_at_ms, updated_at_ms)
VALUES (?, ?, 'draft', ?, ?, ?, ?)`).run(compositionId, input.newYorkDate, revisionId, input.userId, now, now);
      database.prepare(`INSERT INTO platform_watchlist_recap_composition_revisions
(composition_revision_id, composition_id, parent_composition_revision_id, authored_by, body_text, body_sha256, created_at_ms)
VALUES (?, ?, ?, 'owner', ?, ?, ?)`).run(revisionId, compositionId, null,
        input.bodyText, createHash("sha256").update(input.bodyText).digest("hex"), now);
      saveBodyItems(database, compositionId, items);
      database.prepare("UPDATE platform_watchlist_recap_compositions SET current_revision_id = ?, updated_at_ms = ? WHERE composition_id = ?")
        .run(revisionId, now, compositionId);
    })();
  } finally { database.close(); }
}

export function readDailyRecapPostHistory(date: string, userId: string): DailyRecapPostHistory[] {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare<[string, string], DailyRecapPostHistory>(`SELECT
 c.composition_id AS compositionId, a.attempt_state AS state, r.body_text AS bodyText
FROM platform_watchlist_recap_compositions c
JOIN platform_watchlist_recap_post_attempts a ON a.composition_id = c.composition_id
JOIN platform_watchlist_recap_composition_revisions r ON r.composition_revision_id = a.composition_revision_id
WHERE c.new_york_date = ? AND c.created_by_user_id = ? ORDER BY c.created_at_ms DESC`).all(date, userId);
  } finally { database.close(); }
}

function nextCompositionTimestamp(database: Database.Database): number {
  const previous = database.prepare<[], { latest: number | null }>("SELECT MAX(created_at_ms) AS latest FROM platform_watchlist_recap_composition_revisions").get();
  return Math.max(Date.now(), (previous?.latest ?? 0) + 1);
}

export async function retryDailyRecapPost(input: Readonly<{
  compositionId: string; userId: string;
  resolution?: { outcome: "not_posted" | "posted"; messageId?: string; channelId?: string };
}>) {
  const database = openPlatformDatabase({ mode: "runtime" });
  let stored: { body_text: string; new_york_date: string } | undefined;
  try {
    stored = database.prepare<[string, string], { body_text: string; new_york_date: string }>(`SELECT r.body_text, c.new_york_date
FROM platform_watchlist_recap_compositions c JOIN platform_watchlist_recap_composition_revisions r ON r.composition_revision_id = c.current_revision_id
WHERE c.composition_id = ? AND c.created_by_user_id = ?`).get(input.compositionId, input.userId);
  } finally { database.close(); }
  if (!stored) throw new Error("watchlist_daily_recap_post_not_found");
  return postDailyRecapComposition({ bodyText: stored.body_text, newYorkDate: stored.new_york_date, userId: input.userId, deliveryResolution: input.resolution });
}

function evidence(database: Database.Database, candidateId: string): readonly EvidenceRow[] {
  return database.prepare<[string], EvidenceRow>(`SELECT evidence_revision_id, evidence_kind,
  observed_at_ms, evidence_json FROM platform_watchlist_recap_evidence_revisions
WHERE candidate_id = ? ORDER BY observed_at_ms, evidence_revision_id`).all(candidateId);
}

function generationInput(database: Database.Database, candidate: CandidateRow) {
  const rows = evidence(database, candidate.candidate_id);
  const observations = rows.filter((row) => row.evidence_kind === "price_snapshot").flatMap((row) => {
    try {
      const value = JSON.parse(row.evidence_json) as { latestPrice?: unknown; latestPriceObservedAt?: unknown; potentialGain?: { highPrice?: number; highPriceAt?: number } };
      const prices = typeof value.latestPrice === "number" && typeof value.latestPriceObservedAt === "number"
        ? [{ price: value.latestPrice, observedAtMs: value.latestPriceObservedAt }]
        : [];
      const high = value.potentialGain;
      if (high && Number.isFinite(high.highPrice) && Number.isSafeInteger(high.highPriceAt)
        && high.highPrice! > 0 && high.highPriceAt! >= candidate.first_posted_at_ms && high.highPriceAt! <= row.observed_at_ms) {
        prices.push({ price: high.highPrice!, observedAtMs: high.highPriceAt! });
      }
      return prices;
    } catch { return []; }
  });
  const aiRead = rows.filter((row) => row.evidence_kind === "ai_read").find((row) => {
    try {
      const value = JSON.parse(row.evidence_json) as { read?: unknown };
      return Boolean(value.read && parseTradersLinkAiRead(JSON.stringify(value.read)));
    } catch { return false; }
  });
  let parsedAiRead = null;
  if (aiRead) {
    const value = JSON.parse(aiRead.evidence_json) as { read: unknown };
    parsedAiRead = parseTradersLinkAiRead(JSON.stringify(value.read));
  }
  if (observations.length === 0) throw new Error("watchlist_daily_recap_missing_observations");
  return {
    aiRead: parsedAiRead && aiRead ? { publishedAtMs: aiRead.observed_at_ms, read: parsedAiRead } : undefined,
    observations,
    postedAtMs: candidate.first_posted_at_ms,
    postedPrice: Number(candidate.first_posted_price_text),
    symbol: candidate.symbol,
  };
}

export function generateDailyRecapCandidate(candidateId: string, userId: string): void {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      const candidate = database.prepare<[string], CandidateRow>(`SELECT candidate_id, symbol,
 new_york_date, first_posted_at_ms, first_posted_price_text, lifecycle_state
FROM platform_watchlist_recap_candidates WHERE candidate_id = ?`).get(candidateId);
      if (!candidate) throw new Error("watchlist_daily_recap_candidate_not_found");
      const existingReview = database.prepare<[string], { review_state: string }>(
        "SELECT review_state FROM platform_watchlist_recap_reviews WHERE candidate_id = ?",
      ).get(candidateId);
      if (existingReview?.review_state === "posted") {
        throw new Error("watchlist_daily_recap_already_posted");
      }
      const input = generationInput(database, candidate);
      const recapText = buildDailyWatchlistAnalysisRecap(input);
      const latestEvidence = evidence(database, candidateId).at(-1);
      if (!latestEvidence) throw new Error("watchlist_daily_recap_missing_evidence");
      const draftId = createCanonicalUuidV4();
      database.prepare(`INSERT INTO platform_watchlist_recap_draft_revisions (
 draft_revision_id, candidate_id, evidence_revision_id, parent_draft_revision_id,
 authored_by, generator_version, scenario, recap_text, facts_json, created_at_ms
) VALUES (?, ?, ?, NULL, 'generator', 'daily-recap-v1', 'follow_through', ?, ?, ?)`)
        .run(draftId, candidateId, latestEvidence.evidence_revision_id, recapText, JSON.stringify(input), Date.now());
      database.prepare(`INSERT INTO platform_watchlist_recap_reviews (
 candidate_id, current_draft_revision_id, review_state, updated_by_user_id, updated_at_ms
) VALUES (?, ?, 'unreviewed', ?, ?)
ON CONFLICT(candidate_id) DO UPDATE SET current_draft_revision_id = excluded.current_draft_revision_id,
 review_state = CASE WHEN review_state = 'posted' THEN review_state ELSE 'unreviewed' END,
 updated_by_user_id = excluded.updated_by_user_id, updated_at_ms = excluded.updated_at_ms`)
        .run(candidateId, draftId, userId, Date.now());
    })();
  } finally { database.close(); }
}

export function editDailyRecapCandidate(input: Readonly<{
  candidateId: string; recapText: string; userId: string;
}>): void {
  const text = input.recapText.trim();
  if (!text || text.length > 4_000) throw new Error("watchlist_daily_recap_invalid_recap_text");
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      const current = database.prepare<[string], { current_draft_revision_id: string; review_state: string }>(`SELECT current_draft_revision_id, review_state
FROM platform_watchlist_recap_reviews WHERE candidate_id = ?`).get(input.candidateId);
      if (!current?.current_draft_revision_id) throw new Error("watchlist_daily_recap_draft_not_found");
      if (current.review_state === "posted") throw new Error("watchlist_daily_recap_already_posted");
      const draft = database.prepare<[string], { evidence_revision_id: string; facts_json: string }>(`SELECT evidence_revision_id, facts_json
FROM platform_watchlist_recap_draft_revisions WHERE draft_revision_id = ?`).get(current.current_draft_revision_id);
      if (!draft) throw new Error("watchlist_daily_recap_draft_not_found");
      const nextId = createCanonicalUuidV4();
      database.prepare(`INSERT INTO platform_watchlist_recap_draft_revisions (
 draft_revision_id, candidate_id, evidence_revision_id, parent_draft_revision_id,
 authored_by, generator_version, scenario, recap_text, facts_json, created_at_ms
) VALUES (?, ?, ?, ?, 'owner', NULL, 'follow_through', ?, ?, ?)`)
        .run(nextId, input.candidateId, draft.evidence_revision_id, current.current_draft_revision_id, text, draft.facts_json, Date.now());
      database.prepare(`UPDATE platform_watchlist_recap_reviews SET current_draft_revision_id = ?,
 updated_by_user_id = ?, updated_at_ms = ? WHERE candidate_id = ? AND review_state <> 'posted'`)
        .run(nextId, input.userId, Date.now(), input.candidateId);
    })();
  } finally { database.close(); }
}

export function setDailyRecapSelection(input: Readonly<{
  candidateId: string; selected: boolean; userId: string;
}>): void {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.prepare(`UPDATE platform_watchlist_recap_reviews SET review_state = ?,
 updated_by_user_id = ?, updated_at_ms = ? WHERE candidate_id = ? AND review_state <> 'posted'`)
      .run(input.selected ? "add_to_recap" : "dont_use", input.userId, Date.now(), input.candidateId);
  } finally { database.close(); }
}

export function markDailyRecapNeedsCorrection(input: Readonly<{
  candidateId: string; note: string;
}>): void {
  const note = input.note.trim();
  if (!note || note.length > 4_000) throw new Error("watchlist_daily_recap_invalid_correction");
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      const review = database.prepare<[string], { current_draft_revision_id: string | null }>(
        "SELECT current_draft_revision_id FROM platform_watchlist_recap_reviews WHERE candidate_id = ?",
      ).get(input.candidateId);
      if (!review?.current_draft_revision_id) {
        throw new Error("watchlist_daily_recap_correction_unavailable");
      }
      const now = Date.now();
      database.prepare(`INSERT INTO platform_watchlist_recap_corrections (
 correction_id, candidate_id, draft_revision_id, reason, owner_note, correction_state, marked_at_ms, resolved_at_ms
) VALUES (?, ?, ?, 'other', ?, 'open', ?, NULL)`).run(
        createCanonicalUuidV4(), input.candidateId, review.current_draft_revision_id, note, now,
      );
    })();
  } finally { database.close(); }
}

export function resolveDailyRecapCorrection(input: Readonly<{
  candidateId: string;
}>): void {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    database.transaction(() => {
      const now = Date.now();
      database.prepare(`UPDATE platform_watchlist_recap_corrections SET correction_state = 'resolved', resolved_at_ms = ?
WHERE candidate_id = ? AND correction_state = 'open'`).run(now, input.candidateId);
    })();
  } finally { database.close(); }
}

export function readDailyRecapStorageSummary(now = Date.now()): DailyRecapStorageSummary {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const row = database.prepare<[], { correction_count: number; draft_count: number; oldest_date: string | null; posted_count: number; stored_bytes: number }>(`SELECT
 (SELECT COUNT(*) FROM platform_watchlist_recap_corrections WHERE correction_state = 'open') correction_count,
 (SELECT COUNT(*) FROM platform_watchlist_recap_draft_revisions) draft_count,
 (SELECT MIN(new_york_date) FROM platform_watchlist_recap_candidates) oldest_date,
 (SELECT COUNT(*) FROM platform_watchlist_recap_compositions WHERE composition_state = 'posted') posted_count,
 COALESCE((SELECT SUM(length(evidence_json)) FROM platform_watchlist_recap_evidence_revisions), 0)
 + COALESCE((SELECT SUM(length(recap_text) + length(facts_json)) FROM platform_watchlist_recap_draft_revisions), 0)
 + COALESCE((SELECT SUM(length(body_text)) FROM platform_watchlist_recap_composition_revisions), 0) stored_bytes`).get();
    if (!row) throw new Error("watchlist_daily_recap_summary_unavailable");
    const cutoff = new Date(now - 30 * 86_400_000).toISOString().slice(0, 10);
    return Object.freeze({
      cleanupRecommended: Boolean(row.oldest_date && row.oldest_date < cutoff),
      correctionCount: row.correction_count, draftCount: row.draft_count,
      oldestDate: row.oldest_date, postedCount: row.posted_count, storedBytes: row.stored_bytes,
    });
  } finally { database.close(); }
}

export function cleanupDailyRecapEvidence(now = Date.now()): number {
  const cutoff = new Date(now - 30 * 86_400_000).toISOString().slice(0, 10);
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare(`DELETE FROM platform_watchlist_recap_evidence_revisions
WHERE candidate_id IN (
 SELECT c.candidate_id FROM platform_watchlist_recap_candidates c
 JOIN platform_watchlist_recap_reviews r ON r.candidate_id = c.candidate_id
 WHERE c.new_york_date < ? AND r.review_state = 'posted'
 AND NOT EXISTS (SELECT 1 FROM platform_watchlist_recap_corrections x WHERE x.candidate_id = c.candidate_id AND x.correction_state = 'open')
) AND evidence_revision_id NOT IN (SELECT evidence_revision_id FROM platform_watchlist_recap_draft_revisions)`).run(cutoff).changes;
  } finally { database.close(); }
}

export function readDailyRecapOwnerCandidates(newYorkDate: string): readonly DailyRecapOwnerCandidate[] {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    return database.prepare<[string], CandidateRow & { audit_flag_note: string | null; draft_revision_id: string | null; recap_text: string | null; review_state: DailyRecapOwnerCandidate["reviewState"] | null }>(`SELECT
 c.candidate_id, c.symbol, c.new_york_date, c.first_posted_at_ms, c.first_posted_price_text,
 c.lifecycle_state, r.current_draft_revision_id AS draft_revision_id, d.recap_text, r.review_state,
 (SELECT owner_note FROM platform_watchlist_recap_corrections x WHERE x.candidate_id = c.candidate_id AND x.correction_state = 'open' ORDER BY x.marked_at_ms DESC LIMIT 1) audit_flag_note
FROM platform_watchlist_recap_candidates c
LEFT JOIN platform_watchlist_recap_reviews r ON r.candidate_id = c.candidate_id
LEFT JOIN platform_watchlist_recap_draft_revisions d ON d.draft_revision_id = r.current_draft_revision_id
WHERE c.new_york_date = ? ORDER BY c.first_posted_at_ms, c.candidate_id`).all(newYorkDate).map((row) => Object.freeze({
      candidateId: row.candidate_id, draftRevisionId: row.draft_revision_id,
      lifecycleState: row.lifecycle_state, postedAtMs: row.first_posted_at_ms,
      postedPrice: Number(row.first_posted_price_text), recapText: row.recap_text,
      reviewState: row.review_state ?? "unreviewed", symbol: row.symbol,
      auditFlagNote: row.audit_flag_note,
    }));
  } finally { database.close(); }
}

export async function postDailyRecapComposition(input: Readonly<{
  bodyText: string; newYorkDate: string; userId: string;
  items?: readonly DailyRecapBodyItem[];
  deliveryResolution?: { outcome: "not_posted" | "posted"; messageId?: string; channelId?: string };
}>): Promise<Readonly<{ compositionId: string; posted: boolean }>> {
  const bodyText = input.bodyText.trim();
  if (!bodyText || bodyText.length > 4_000 || /@everyone|@here|<@/iu.test(bodyText)) {
    throw new Error("watchlist_daily_recap_invalid_post_body");
  }
  const database = openPlatformDatabase({ mode: "runtime" });
  let compositionId = createCanonicalUuidV4();
  let revisionId = createCanonicalUuidV4();
  let attemptId = createCanonicalUuidV4();
  const digest = createHash("sha256").update(JSON.stringify([input.userId, input.newYorkDate, bodyText])).digest("hex");
  const idempotencyKey = `${digest.slice(0, 8)}-${digest.slice(8, 12)}-4${digest.slice(13, 16)}-8${digest.slice(17, 20)}-${digest.slice(20, 32)}`;
  let alreadyPosted = false;
  try {
    database.transaction(() => {
      const previous = database.prepare<[string], { composition_id: string; composition_revision_id: string; post_attempt_id: string; attempt_state: string }>(
        "SELECT composition_id, composition_revision_id, post_attempt_id, attempt_state FROM platform_watchlist_recap_post_attempts WHERE idempotency_key = ?",
      ).get(idempotencyKey);
      if (previous) {
        compositionId = previous.composition_id;
        revisionId = previous.composition_revision_id;
        attemptId = previous.post_attempt_id;
        alreadyPosted = previous.attempt_state === "posted";
        return;
      }
      const selected = bodyItems(database, input.newYorkDate, input.items);
      if (selected.length === 0) throw new Error("watchlist_daily_recap_empty_composition");
      const now = nextCompositionTimestamp(database);
      database.prepare(`INSERT INTO platform_watchlist_recap_compositions (composition_id, new_york_date, composition_state, current_revision_id, created_by_user_id, created_at_ms, updated_at_ms)
VALUES (?, ?, 'draft', ?, ?, ?, ?)`).run(compositionId, input.newYorkDate, revisionId, input.userId, now, now);
      saveBodyItems(database, compositionId, selected);
      database.prepare(`INSERT INTO platform_watchlist_recap_composition_revisions (composition_revision_id, composition_id, parent_composition_revision_id, authored_by, body_text, body_sha256, created_at_ms)
VALUES (?, ?, NULL, 'owner', ?, ?, ?)`).run(revisionId, compositionId, bodyText, createHash("sha256").update(bodyText).digest("hex"), now);
      database.prepare(`INSERT INTO platform_watchlist_recap_post_attempts (post_attempt_id, composition_id, composition_revision_id, idempotency_key, attempt_state, receipt_json, posted_at_ms, created_at_ms, updated_at_ms)
VALUES (?, ?, ?, ?, 'pending', NULL, NULL, ?, ?)`).run(attemptId, compositionId, revisionId, idempotencyKey, now, now);
    })();
    if (alreadyPosted) return Object.freeze({ compositionId, posted: true });
    const result = await requestWatchlistRuntimeRaw({ method: "POST", path: "/api/watchlist/daily-recaps/post-reviewed", body: JSON.stringify({ bodyText, idempotencyKey, deliveryResolution: input.deliveryResolution }), contentType: "application/json" });
    const now = nextCompositionTimestamp(database);
    if (!result.ok) {
      database.prepare(`UPDATE platform_watchlist_recap_post_attempts SET attempt_state = 'failed', receipt_json = ?, updated_at_ms = ? WHERE post_attempt_id = ? AND attempt_state <> 'posted'`)
        .run(JSON.stringify({ status: result.status }), now, attemptId);
      return Object.freeze({ compositionId, posted: false });
    }
    const receipt = JSON.parse(result.body) as { posted?: boolean; receipt?: { idempotencyKey?: string; discordMessageId?: string; discordChannelId?: string } };
    if (receipt.posted !== true || receipt.receipt?.idempotencyKey !== idempotencyKey
      || !receipt.receipt.discordMessageId || !receipt.receipt.discordChannelId) {
      throw new Error("watchlist_daily_recap_invalid_post_receipt");
    }
    database.transaction(() => {
      database.prepare(`UPDATE platform_watchlist_recap_post_attempts SET attempt_state = 'posted', receipt_json = ?, posted_at_ms = ?, updated_at_ms = ? WHERE post_attempt_id = ?`)
        .run(JSON.stringify(receipt), now, now, attemptId);
      database.prepare(`UPDATE platform_watchlist_recap_compositions SET composition_state = 'posted', updated_at_ms = ? WHERE composition_id = ?`).run(now, compositionId);
      database.prepare(`UPDATE platform_watchlist_recap_reviews SET review_state = 'posted', updated_at_ms = ?
WHERE EXISTS (SELECT 1 FROM platform_watchlist_recap_composition_items i
WHERE i.composition_id = ? AND i.candidate_id = platform_watchlist_recap_reviews.candidate_id
AND i.draft_revision_id = platform_watchlist_recap_reviews.current_draft_revision_id)`)
        .run(now, compositionId);
    })();
    return Object.freeze({ compositionId, posted: true });
  } finally { database.close(); }
}
