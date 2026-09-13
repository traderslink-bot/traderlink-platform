import type Database from "better-sqlite3";
import { AnalyzerOwnerExemptionRepository } from "./analyzer-owner-exemption-repository";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";

export const MANUAL_ANALYZER_RETRIES_PER_DAY = 3;
export function analyzerRetryDate(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
export type ManualAnalyzerRetry = Readonly<{ retry_request_id: string; user_id: string; created_at_utc: string }>;

export class ManualAnalyzerRetryRepository {
  constructor(private readonly database: Database.Database) {}

  available(scope: AccountScope, tradeId: string, now: Date): boolean {
    return Boolean(new AnalyzerOwnerExemptionRepository(this.database).activeEventId(scope.userId)) ||
      this.count(scope, tradeId, now) < MANUAL_ANALYZER_RETRIES_PER_DAY;
  }

  private count(scope: AccountScope, tradeId: string, now: Date): number {
    const row = this.database.prepare(`SELECT count(*) AS n FROM level_analysis_manual_retry_requests
WHERE workspace_id=? AND account_id=? AND logical_trade_id=? AND new_york_date=?`).get(
      scope.workspaceId, scope.accountId, tradeId, analyzerRetryDate(now)) as { n: number };
    return row.n;
  }

  /** Call inside the same immediate transaction that queues/requeues the job. */
  record(scope: AccountScope, jobId: string, now: Date): string | null {
    const operation = () => {
      const job = this.database.prepare(`SELECT logical_trade_id, logical_trade_version_id FROM level_analysis_logical_trade_jobs
WHERE logical_trade_job_id=? AND user_id=? AND workspace_id=? AND account_id=? AND status='queued'`).get(
        jobId, scope.userId, scope.workspaceId, scope.accountId) as { logical_trade_id: string; logical_trade_version_id: string } | undefined;
      if (!job) return null;
      const count = this.count(scope, job.logical_trade_id, now);
      if (count >= MANUAL_ANALYZER_RETRIES_PER_DAY &&
          !new AnalyzerOwnerExemptionRepository(this.database).activeEventId(scope.userId)) return null;
      const id = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO level_analysis_manual_retry_requests
(retry_request_id,logical_trade_job_id,user_id,workspace_id,account_id,logical_trade_id,logical_trade_version_id,new_york_date,daily_ordinal,created_at_utc)
VALUES(?,?,?,?,?,?,?,?,?,?)`).run(id, jobId, scope.userId, scope.workspaceId, scope.accountId,
        job.logical_trade_id, job.logical_trade_version_id, analyzerRetryDate(now), count + 1, createCanonicalUtcTimestamp(now));
      return id;
    };
    return this.database.inTransaction ? operation() : this.database.transaction(operation).immediate();
  }

  latest(jobId: string): ManualAnalyzerRetry | null {
    return this.database.prepare(`SELECT retry_request_id,user_id,created_at_utc FROM level_analysis_manual_retry_requests
WHERE logical_trade_job_id=? ORDER BY created_at_utc DESC,rowid DESC LIMIT 1`).get(jobId) as ManualAnalyzerRetry | undefined ?? null;
  }

  active(jobId: string, now: Date): ManualAnalyzerRetry | null {
    const retry = this.latest(jobId);
    if (!retry || Date.parse(retry.created_at_utc) > now.getTime() || now.getTime() - Date.parse(retry.created_at_utc) >= 86400000) return null;
    const job = this.database.prepare("SELECT user_id,status FROM level_analysis_logical_trade_jobs WHERE logical_trade_job_id=?").get(jobId) as { user_id: string; status: string } | undefined;
    return job?.user_id === retry.user_id && (job.status === "queued" || job.status === "leased") ? retry : null;
  }

  acquisitions(requestId: string): number {
    return (this.database.prepare("SELECT count(*) AS n FROM level_analysis_manual_retry_acquisitions WHERE retry_request_id=?").get(requestId) as { n: number }).n;
  }
}
