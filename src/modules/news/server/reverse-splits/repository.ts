import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { gzipSync } from "node:zlib";
import type Database from "better-sqlite3";
import { assertCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import { isoDate, type ParseResult, type ReverseSplitEvent, type SplitSource } from "./contracts";
import { sourceUrl } from "./sources";

export const REVERSE_SPLIT_PARSER_VERSION = "2026-09-25.1";
export type SourceClaim = Readonly<{ source: SplitSource; token: string; attempt: number }>;
export type RuntimeClaim = Readonly<{ key: string; token: string; state: unknown }>;

function after(now: string, milliseconds: number): string {
  return new Date(Date.parse(now) + milliseconds).toISOString();
}

export class ReverseSplitRepository {
  constructor(private readonly database: Database.Database) {}

  reserveRequest(now: string): boolean {
    const claim = this.claimRuntime("source_request_budget", now);
    if (!claim) return false;
    const state = claim.state as { nextAt?: unknown } | null;
    if (typeof state?.nextAt === "string" && state.nextAt > now) {
      this.completeRuntime(claim, claim.state, now);
      return false;
    }
    return this.completeRuntime(claim, { nextAt: after(now, 1_500) }, now);
  }

  discover(sources: readonly SplitSource[], now: string): void {
    assertCanonicalUtcTimestamp(now, "reverseSplitDiscoveredAt");
    this.database.transaction(() => {
      const insert = this.database.prepare(`INSERT INTO news_reverse_split_sources
        (source_url, source_kind, source_json, published_date, state, next_attempt_at_utc, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)
        ON CONFLICT(source_url) DO UPDATE SET source_json = excluded.source_json, published_date = excluded.published_date`);
      for (const source of sources) {
        if (!isoDate(source.publishedDate)) throw new Error("reverse_split_source_date_invalid");
        const url = sourceUrl(source.url, source.kind).toString();
        insert.run(url, source.kind, JSON.stringify({ ...source, url }), source.publishedDate, now, now, now);
      }
    }).immediate();
  }

  claimSource(now: string): SourceClaim | null {
    assertCanonicalUtcTimestamp(now, "reverseSplitClaimedAt");
    return this.database.transaction(() => {
      const row = this.database.prepare<[string, string], { source_url: string; source_json: string; attempt_count: number }>(`
        SELECT source_url, source_json, attempt_count FROM news_reverse_split_sources
        WHERE next_attempt_at_utc <= ? AND (lease_until_utc IS NULL OR lease_until_utc <= ?)
        ORDER BY published_date DESC, next_attempt_at_utc, source_url LIMIT 1`).get(now, now);
      if (!row) return null;
      const token = randomUUID();
      this.database.prepare(`UPDATE news_reverse_split_sources SET state = 'fetching', lease_token = ?, lease_until_utc = ?,
        attempt_count = attempt_count + 1, updated_at_utc = ? WHERE source_url = ?`).run(token, after(now, 45_000), now, row.source_url);
      return { source: JSON.parse(row.source_json) as SplitSource, token, attempt: row.attempt_count + 1 };
    }).immediate();
  }

  completeSource(claim: SourceClaim, body: string, result: ParseResult, now: string): boolean {
    assertCanonicalUtcTimestamp(now, "reverseSplitParsedAt");
    if (Buffer.byteLength(body, "utf8") > 2_000_000) throw new Error("reverse_split_source_too_large");
    if ((result.outcome === "parsed") !== (result.event !== null) || (result.event && result.event.source.url !== claim.source.url)) throw new Error("reverse_split_parse_result_invalid");
    const hash = createHash("sha256").update(body).digest("hex");
    const compressed = gzipSync(body);
    const retryDelay = result.outcome === "deferred" ? 60 * 60_000 : claim.source.kind === "nasdaq" ? 30 * 60_000 : 24 * 60 * 60_000;
    return this.database.transaction(() => {
      const changed = this.database.prepare(`UPDATE news_reverse_split_sources SET state = ?, content_hash = ?, body_gzip = ?,
        parser_version = ?, outcome_code = ?, fetched_at_utc = ?, next_attempt_at_utc = ?, lease_token = NULL,
        lease_until_utc = NULL, attempt_count = 0, updated_at_utc = ?
        WHERE source_url = ? AND lease_token = ? AND lease_until_utc > ?`).run(
        result.outcome, hash, compressed, REVERSE_SPLIT_PARSER_VERSION, result.reason, now, after(now, retryDelay), now,
        claim.source.url, claim.token, now,
      );
      if (changed.changes !== 1) return false;
      if (result.event) {
        const event = result.event;
        const id = createHash("sha256").update(`${claim.source.url}\n${hash}\n${REVERSE_SPLIT_PARSER_VERSION}`).digest("hex");
        this.database.prepare(`INSERT INTO news_reverse_split_events
          (observation_id, source_url, content_hash, parser_version, ticker, status, approval_date, effective_date, event_json, source_body_gzip, observed_at_utc)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(source_url, content_hash, parser_version) DO NOTHING`).run(
          id, claim.source.url, hash, REVERSE_SPLIT_PARSER_VERSION, event.ticker, event.status,
          event.approvalDate, event.effectiveDate, JSON.stringify(event), compressed, now,
        );
      }
      return true;
    }).immediate();
  }

  failSource(claim: SourceClaim, now: string): void {
    assertCanonicalUtcTimestamp(now, "reverseSplitFailedAt");
    const delay = Math.min(6 * 60 * 60_000, 60_000 * 2 ** Math.min(claim.attempt, 9));
    this.database.prepare(`UPDATE news_reverse_split_sources SET state = 'failed', outcome_code = 'source_fetch_failed',
      next_attempt_at_utc = ?, lease_token = NULL, lease_until_utc = NULL, updated_at_utc = ?
      WHERE source_url = ? AND lease_token = ? AND lease_until_utc > ?`).run(after(now, delay), now, claim.source.url, claim.token, now);
  }

  currentObservations(): ReverseSplitEvent[] {
    return this.database.prepare<[], { event_json: string }>(`SELECT e.event_json
      FROM news_reverse_split_events e JOIN news_reverse_split_sources s ON s.source_url = e.source_url
      AND s.content_hash = e.content_hash AND s.parser_version = e.parser_version
      WHERE s.state IN ('parsed', 'fetching', 'failed') AND s.outcome_code NOT IN ('conflicting_terms', 'unresolved_split_terms')
      ORDER BY e.ticker, e.observed_at_utc, e.observation_id`).all()
      .map((row) => JSON.parse(row.event_json) as ReverseSplitEvent);
  }

  sourceCoverage(): Readonly<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const row of this.database.prepare<[], { state: string; count: number }>(`
      SELECT state, COUNT(*) AS count FROM news_reverse_split_sources GROUP BY state`).all()) counts[row.state] = row.count;
    return counts;
  }

  claimRuntime(key: string, now: string): RuntimeClaim | null {
    assertCanonicalUtcTimestamp(now, "reverseSplitRuntimeClaimedAt");
    if (!/^[a-z_]{1,40}$/u.test(key)) throw new Error("reverse_split_runtime_key_invalid");
    return this.database.transaction(() => {
      this.database.prepare(`INSERT INTO news_reverse_split_runtime(runtime_key, state_json, updated_at_utc)
        VALUES (?, '{}', ?) ON CONFLICT(runtime_key) DO NOTHING`).run(key, now);
      const token = randomUUID();
      const changed = this.database.prepare(`UPDATE news_reverse_split_runtime SET lease_token = ?, lease_until_utc = ?, updated_at_utc = ?
        WHERE runtime_key = ? AND (lease_until_utc IS NULL OR lease_until_utc <= ?)`).run(token, after(now, 60_000), now, key, now);
      if (changed.changes !== 1) return null;
      const row = this.database.prepare<[string], { state_json: string }>(`SELECT state_json FROM news_reverse_split_runtime WHERE runtime_key = ?`).get(key)!;
      return { key, token, state: JSON.parse(row.state_json) as unknown };
    }).immediate();
  }

  completeRuntime(claim: RuntimeClaim, state: unknown, now: string): boolean {
    assertCanonicalUtcTimestamp(now, "reverseSplitRuntimeCompletedAt");
    const json = JSON.stringify(state);
    if (!json || json.length > 100_000) throw new Error("reverse_split_runtime_state_invalid");
    return this.database.prepare(`UPDATE news_reverse_split_runtime SET state_json = ?, lease_token = NULL,
      lease_until_utc = NULL, updated_at_utc = ? WHERE runtime_key = ? AND lease_token = ? AND lease_until_utc > ?`)
      .run(json, now, claim.key, claim.token, now).changes === 1;
  }
}
