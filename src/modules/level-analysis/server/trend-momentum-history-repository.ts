import { createHash } from "node:crypto";
import type Database from "better-sqlite3";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4, createCanonicalUtcTimestamp } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { MarketDataProviderResult, NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import type { IndicatorHistoryRange } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import { inspectIndicatorWarmup, hasCompletedIndicatorCoverage } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import { priorIndicatorHistoryRanges } from "./trend-momentum-history-ranges";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";

type Row = Readonly<{
  history_request_id: string; requested_start_seconds: number; requested_end_seconds: number;
  attempt_number: number; status: "requested" | "complete" | "no_history" | "partial" | "provider_failure";
  failure_reason: string | null; candles_json: string | null; candle_sha256: string | null;
  created_at_utc: string; completed_at_utc: string | null;
}>;
export class TrendMomentumHistoryRepository {
  constructor(private readonly database: Database.Database) {}

  /** A late response cannot overwrite a request recovered after its lease timeout. */
  recoverInterrupted(scope: AccountScope, jobId: string, now: Date): number {
    const cutoff = new Date(now.getTime() - 5 * 60_000).toISOString();
    const timestamp = createCanonicalUtcTimestamp(now);
    return this.database.transaction(() => {
      const rows = this.read(scope, jobId).filter((row) =>
        row.status === "requested" && row.created_at_utc < cutoff);
      for (const row of rows) {
        this.database.prepare(`UPDATE level_analysis_analyzer_acquisitions
SET completed_at_utc = ?, outcome = 'provider_unavailable'
WHERE completed_at_utc IS NULL AND acquisition_id =
 (SELECT acquisition_id FROM level_analysis_indicator_history_requests WHERE history_request_id = ?)`)
          .run(timestamp, row.history_request_id);
        this.database.prepare(`UPDATE level_analysis_indicator_history_requests
SET status = 'provider_failure', failure_reason = 'request_interrupted', completed_at_utc = ?
WHERE history_request_id = ? AND status = 'requested'`).run(timestamp, row.history_request_id);
      }
      return rows.length;
    }).immediate();
  }

  read(scope: AccountScope, jobId: string): readonly Row[] {
    return this.database.prepare(`SELECT request.* FROM level_analysis_indicator_history_requests request
JOIN level_analysis_logical_trade_jobs job ON job.logical_trade_job_id = request.logical_trade_job_id
WHERE job.logical_trade_job_id = ? AND job.user_id = ? AND job.workspace_id = ? AND job.account_id = ?
ORDER BY request.requested_end_seconds DESC, request.attempt_number ASC`).all(
      jobId, scope.userId, scope.workspaceId, scope.accountId,
    ) as readonly Row[];
  }

  compatibleEvidence(scope: AccountScope, symbol: string, start: number, asOf: number) {
    const rows = this.database.prepare(`SELECT request.* FROM level_analysis_indicator_history_requests request
JOIN level_analysis_logical_trade_jobs job ON job.logical_trade_job_id = request.logical_trade_job_id
JOIN level_analysis_market_session_sets session ON session.market_session_set_id = job.market_session_set_id
WHERE job.user_id = ? AND job.workspace_id = ? AND job.account_id = ?
 AND session.provider_symbol = ? AND session.provider_key = 'moomoo_history_kline'
 AND session.provider_adapter_version = 'moomoo_history_kline_v1'
 AND request.status IN ('complete', 'no_history')
 AND request.requested_start_seconds < ? AND request.requested_end_seconds > ?
ORDER BY request.completed_at_utc DESC, request.history_request_id LIMIT 100`).all(
      scope.userId, scope.workspaceId, scope.accountId, symbol, asOf, start,
    ) as readonly Row[];
    const parsed = this.parseEvidence(rows);
    const candles = new Map<number, NormalizedMarketCandle>();
    for (const candle of parsed.candles) {
      if (candle.time >= start && candle.time + 60 <= asOf && !candles.has(candle.time)) candles.set(candle.time, candle);
    }
    return { ranges: parsed.ranges.map((range) => ({ start: Math.max(start, range.start),
      endExclusive: Math.min(asOf, range.endExclusive) })).filter((r) => r.endExclusive > r.start),
      candles: [...candles.values()].sort((a, b) => a.time - b.time) };
  }

  hasSufficientEvidence(scope: AccountScope, symbol: string, tradingDate: string, earliest: number, asOf: number): boolean {
    const session = newYorkExtendedSession(tradingDate);
    if (!session || !Number.isFinite(earliest) || earliest > asOf) return false;
    try {
      const first = priorIndicatorHistoryRanges(tradingDate).at(-1)!.start;
      const evidence = this.compatibleEvidence(scope, symbol, first, asOf);
      if (!hasCompletedIndicatorCoverage(evidence.ranges, session.startTime, asOf)) return false;
      return inspectIndicatorWarmup({ asOf: Math.floor(earliest), completedRanges: evidence.ranges,
        candles: evidence.candles.map((c) => ({ time: c.time, open: Number(c.openDecimal), high: Number(c.highDecimal),
          low: Number(c.lowDecimal), close: Number(c.closeDecimal), volume: Number(c.volumeDecimal),
          turnover: c.turnoverDecimal == null ? null : Number(c.turnoverDecimal) })) },
        [{ interval: "1m", requiredBars: 200 }, { interval: "5m", requiredBars: 200 }])
        .every((frame) => frame.missingBars === 0);
    } catch { return false; }
  }

  begin(input: Readonly<{ scope: AccountScope; jobId: string; acquisitionId: string;
    range: IndicatorHistoryRange; now: Date }>): string | null {
    const { range } = input;
    if (!Number.isSafeInteger(range.start) || range.start <= 0 || range.start % 60 !== 0 ||
        !Number.isSafeInteger(range.endExclusive) || range.endExclusive % 60 !== 0 ||
        range.endExclusive <= range.start || range.endExclusive - range.start > 86400) {
      throw new Error("indicator_history_request_range_invalid");
    }
    return this.database.transaction(() => {
      const authorized = this.database.prepare(`SELECT 1 FROM level_analysis_logical_trade_jobs job
JOIN level_analysis_analyzer_reservations reservation ON reservation.logical_trade_job_id = job.logical_trade_job_id
JOIN level_analysis_analyzer_acquisitions acquisition ON acquisition.reservation_id = reservation.reservation_id
WHERE job.logical_trade_job_id = ? AND job.user_id = ? AND job.workspace_id = ? AND job.account_id = ?
 AND job.status = 'leased' AND acquisition.acquisition_id = ? AND acquisition.completed_at_utc IS NULL
 AND acquisition.charged_user_id = job.user_id`).get(input.jobId, input.scope.userId,
        input.scope.workspaceId, input.scope.accountId, input.acquisitionId);
      if (!authorized) return null;
      const prior = this.read(input.scope, input.jobId).filter((r) =>
        r.requested_start_seconds === range.start && r.requested_end_seconds === range.endExclusive);
      if (prior.some((r) => r.status === "complete" || r.status === "no_history" || r.status === "requested") || prior.length >= 3) return null;
      const id = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO level_analysis_indicator_history_requests
 (history_request_id, logical_trade_job_id, acquisition_id, requested_start_seconds, requested_end_seconds,
 attempt_number, status, created_at_utc) VALUES (?, ?, ?, ?, ?, ?, 'requested', ?)`).run(
        id, input.jobId, input.acquisitionId, range.start, range.endExclusive,
        prior.length + 1, createCanonicalUtcTimestamp(input.now));
      return id;
    }).immediate();
  }

  finish(input: Readonly<{ scope: AccountScope; jobId: string; requestId: string;
    result: MarketDataProviderResult; now: Date }>): boolean {
    const result = input.result;
    const emptyComplete = !result.ok && result.requestCoverage === "complete" &&
      result.failureReasonCode === "moomoo_returned_no_candles";
    const complete = result.ok && result.requestCoverage === "complete";
    const candles = result.ok ? result.candles : [];
    const json = JSON.stringify(candles);
    const status = emptyComplete ? "no_history" : complete ? "complete" : result.ok ? "partial" : "provider_failure";
    const failure = complete || emptyComplete ? null : result.ok ? "provider_range_incomplete" : result.failureReasonCode;
    return this.database.prepare(`UPDATE level_analysis_indicator_history_requests
SET status = ?, failure_reason = ?, candles_json = ?, candle_sha256 = ?, completed_at_utc = ?
WHERE history_request_id = ? AND logical_trade_job_id = ? AND status = 'requested'
AND EXISTS (SELECT 1 FROM level_analysis_logical_trade_jobs job WHERE job.logical_trade_job_id = ?
 AND job.user_id = ? AND job.workspace_id = ? AND job.account_id = ?)`).run(
      status, failure?.slice(0, 100) ?? null, json, createHash("sha256").update(json).digest("hex"),
      createCanonicalUtcTimestamp(input.now), input.requestId, input.jobId, input.jobId,
      input.scope.userId, input.scope.workspaceId, input.scope.accountId,
    ).changes === 1;
  }

  completedEvidence(scope: AccountScope, jobId: string) {
    return this.parseEvidence(this.read(scope, jobId));
  }

  private parseEvidence(rows: readonly Row[]) {
    const ranges: IndicatorHistoryRange[] = [];
    const candles: NormalizedMarketCandle[] = [];
    for (const row of rows) {
      if (row.status !== "complete" && row.status !== "no_history") continue;
      const json = row.candles_json;
      if (!json || createHash("sha256").update(json).digest("hex") !== row.candle_sha256) {
        throw new Error("indicator_history_evidence_digest_mismatch");
      }
      const values: unknown = JSON.parse(json);
      if (!Array.isArray(values)) throw new Error("indicator_history_evidence_invalid");
      ranges.push({ start: row.requested_start_seconds, endExclusive: row.requested_end_seconds });
      candles.push(...values as NormalizedMarketCandle[]);
    }
    return Object.freeze({ ranges: Object.freeze(ranges), candles: Object.freeze(candles) });
  }
}
