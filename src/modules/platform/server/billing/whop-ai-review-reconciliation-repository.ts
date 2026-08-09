import type Database from "better-sqlite3";

import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "../database/platform-migration-contract";

export type WhopReconciliationCounts = Readonly<{
  pageCount: number;
  fetchedCount: number;
  appliedCount: number;
  duplicateCount: number;
  staleCount: number;
  conflictCount: number;
  ignoredCount: number;
}>;

export type WhopReconciliationRunSummary = WhopReconciliationCounts & Readonly<{
  runId: string;
  state: "running" | "completed" | "failed";
  startedAtUtc: string;
  finalizedAtUtc: string | null;
  failureCode: string | null;
}>;

type RunRow = Readonly<{
  run_id: string;
  state: "running" | "completed" | "failed";
  started_at_utc: string;
  finalized_at_utc: string | null;
  page_count: number;
  fetched_count: number;
  applied_count: number;
  duplicate_count: number;
  stale_count: number;
  conflict_count: number;
  ignored_count: number;
  failure_code: string | null;
}>;

const EMPTY_COUNTS: WhopReconciliationCounts = Object.freeze({
  pageCount: 0,
  fetchedCount: 0,
  appliedCount: 0,
  duplicateCount: 0,
  staleCount: 0,
  conflictCount: 0,
  ignoredCount: 0,
});

function summary(row: RunRow): WhopReconciliationRunSummary {
  return Object.freeze({
    runId: row.run_id,
    state: row.state,
    startedAtUtc: row.started_at_utc,
    finalizedAtUtc: row.finalized_at_utc,
    pageCount: row.page_count,
    fetchedCount: row.fetched_count,
    appliedCount: row.applied_count,
    duplicateCount: row.duplicate_count,
    staleCount: row.stale_count,
    conflictCount: row.conflict_count,
    ignoredCount: row.ignored_count,
    failureCode: row.failure_code,
  });
}

export function isWhopAiReviewReconciliationSchemaAvailable(
  database: Database.Database,
): boolean {
  return Boolean(database.prepare<[], Readonly<{ found: number }>>(
    "SELECT 1 AS found FROM sqlite_schema WHERE type = 'table' AND name = 'platform_whop_reconciliation_runs'",
  ).get());
}

export class WhopAiReviewReconciliationRepository {
  constructor(private readonly database: Database.Database) {}

  begin(now = new Date()): WhopReconciliationRunSummary {
    return this.database.transaction(() => {
      const running = this.database.prepare<[], RunRow>(`SELECT *
FROM platform_whop_reconciliation_runs
WHERE state = 'running' ORDER BY started_at_utc DESC LIMIT 1`).get();
      if (running) {
        const ageMilliseconds = now.getTime() - Date.parse(running.started_at_utc);
        if (!Number.isFinite(ageMilliseconds) || ageMilliseconds < 15 * 60 * 1_000) {
          throw new Error("TRADERLINK_WHOP_RECONCILIATION_IN_PROGRESS");
        }
        this.database.prepare(`UPDATE platform_whop_reconciliation_runs SET
  state = 'failed', finalized_at_utc = ?, failure_code =
  'TRADERLINK_WHOP_RECONCILIATION_ABANDONED'
WHERE run_id = ? AND state = 'running'`).run(
          createCanonicalUtcTimestamp(now), running.run_id,
        );
      }
      const runId = createCanonicalUuidV4();
      const startedAtUtc = createCanonicalUtcTimestamp(now);
      this.database.prepare(`INSERT INTO platform_whop_reconciliation_runs (
  run_id, state, started_at_utc
) VALUES (?, 'running', ?)`).run(runId, startedAtUtc);
      return Object.freeze({
        runId,
        state: "running" as const,
        startedAtUtc,
        finalizedAtUtc: null,
        failureCode: null,
        ...EMPTY_COUNTS,
      });
    }).immediate();
  }

  complete(
    runId: string,
    counts: WhopReconciliationCounts,
    now = new Date(),
  ): WhopReconciliationRunSummary {
    this.database.prepare(`UPDATE platform_whop_reconciliation_runs SET
  state = 'completed', finalized_at_utc = ?, page_count = ?, fetched_count = ?,
  applied_count = ?, duplicate_count = ?, stale_count = ?, conflict_count = ?,
  ignored_count = ?, failure_code = NULL
WHERE run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(now), counts.pageCount, counts.fetchedCount,
      counts.appliedCount, counts.duplicateCount, counts.staleCount,
      counts.conflictCount, counts.ignoredCount, runId,
    );
    return this.require(runId);
  }

  fail(
    runId: string,
    failureCode: string,
    counts: WhopReconciliationCounts = EMPTY_COUNTS,
    now = new Date(),
  ): WhopReconciliationRunSummary {
    this.database.prepare(`UPDATE platform_whop_reconciliation_runs SET
  state = 'failed', finalized_at_utc = ?, page_count = ?, fetched_count = ?,
  applied_count = ?, duplicate_count = ?, stale_count = ?, conflict_count = ?,
  ignored_count = ?, failure_code = ?
WHERE run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(now), counts.pageCount, counts.fetchedCount,
      counts.appliedCount, counts.duplicateCount, counts.staleCount,
      counts.conflictCount, counts.ignoredCount, failureCode, runId,
    );
    return this.require(runId);
  }

  readLatest(): WhopReconciliationRunSummary | null {
    const row = this.database.prepare<[], RunRow>(`SELECT *
FROM platform_whop_reconciliation_runs
ORDER BY started_at_utc DESC, run_id DESC LIMIT 1`).get();
    return row ? summary(row) : null;
  }

  private require(runId: string): WhopReconciliationRunSummary {
    const row = this.database.prepare<[string], RunRow>(
      "SELECT * FROM platform_whop_reconciliation_runs WHERE run_id = ?",
    ).get(runId);
    if (!row) throw new Error("TRADERLINK_WHOP_RECONCILIATION_RUN_MISSING");
    return summary(row);
  }
}
