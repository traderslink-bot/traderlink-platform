import type Database from "better-sqlite3";

import type { MarketHaltSourceStatus } from "./market-halt-feed";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type MarketHaltAlertServiceState = "limited" | "ready" | "unavailable";

type SchedulerRunRow = Readonly<{
  finalized_at_utc: string;
  source_statuses_json: string | null;
  state: "completed" | "failed";
}>;

const HEALTH_FRESHNESS_MS = 3 * 60_000;

function sourceStates(value: string | null): readonly MarketHaltSourceStatus[] | null {
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return null;
    const result = parsed.flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const source = "source" in item ? item.source : null;
      const available = "available" in item ? item.available : null;
      const httpStatus = "httpStatus" in item ? item.httpStatus : null;
      if ((source !== "nasdaq" && source !== "nyse") || typeof available !== "boolean" ||
        !(typeof httpStatus === "number" || httpStatus === null)) return [];
      return [Object.freeze({ source, available, httpStatus })] as const;
    });
    if (result.length !== 2 || new Set(result.map((item) => item.source)).size !== 2) return null;
    return Object.freeze(result);
  } catch {
    return null;
  }
}

export class MarketHaltSchedulerHealthRepository {
  constructor(private readonly database: Database.Database) {}

  begin(now = new Date()): string {
    const runId = createCanonicalUuidV4();
    this.database.prepare(`INSERT INTO news_market_halt_scheduler_runs (
  market_halt_scheduler_run_id, state, started_at_utc, finalized_at_utc,
  source_statuses_json, failure_code
) VALUES (?, 'running', ?, NULL, NULL, NULL)`).run(runId, createCanonicalUtcTimestamp(now));
    return runId;
  }

  complete(input: Readonly<{
    runId: string;
    sources: readonly MarketHaltSourceStatus[];
    now?: Date;
  }>): void {
    this.database.prepare(`UPDATE news_market_halt_scheduler_runs
SET state = 'completed', finalized_at_utc = ?, source_statuses_json = ?
WHERE market_halt_scheduler_run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(input.now),
      JSON.stringify(input.sources),
      input.runId,
    );
  }

  fail(input: Readonly<{
    runId: string;
    sources?: readonly MarketHaltSourceStatus[];
    now?: Date;
  }>): void {
    this.database.prepare(`UPDATE news_market_halt_scheduler_runs
SET state = 'failed', finalized_at_utc = ?, source_statuses_json = ?,
  failure_code = 'MARKET_HALT_CRON_FAILED'
WHERE market_halt_scheduler_run_id = ? AND state = 'running'`).run(
      createCanonicalUtcTimestamp(input.now),
      input.sources ? JSON.stringify(input.sources) : null,
      input.runId,
    );
  }

  readState(now = new Date()): MarketHaltAlertServiceState {
    const run = this.database.prepare<[], SchedulerRunRow>(`SELECT
  state, finalized_at_utc, source_statuses_json
FROM news_market_halt_scheduler_runs
WHERE finalized_at_utc IS NOT NULL
ORDER BY finalized_at_utc DESC
LIMIT 1`).get();
    if (!run || run.state !== "completed") return "unavailable";
    const finalizedAt = Date.parse(run.finalized_at_utc);
    if (!Number.isFinite(finalizedAt) || now.getTime() - finalizedAt > HEALTH_FRESHNESS_MS) {
      return "unavailable";
    }
    const sources = sourceStates(run.source_statuses_json);
    if (!sources) return "unavailable";
    if (sources.every((source) => source.available)) return "ready";
    return sources.some((source) => source.available) ? "limited" : "unavailable";
  }
}
