import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { TradeExecutionIndicatorInput } from "@/src/lib/trade-candle-analysis/trend-momentum-executions";
import { inspectIndicatorWarmup, hasCompletedIndicatorCoverage } from "@/src/lib/trade-candle-analysis/trend-momentum-history";
import type { MarketDataProvider, MarketDataProviderResult } from "../contracts/candle-review-contracts";
import type { ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";
import { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { priorIndicatorHistoryRanges } from "./trend-momentum-history-ranges";
import { buildTradeIndicatorInput } from "./trend-momentum-input";

export class TrendMomentumHistoryService {
  constructor(private readonly history: TrendMomentumHistoryRepository,
    private readonly allowances: SharedAnalyzerAllowanceRepository,
    private readonly providerFor: (scope: AccountScope) => Promise<MarketDataProvider>,
    private readonly now: () => Date = () => new Date()) {}

  beginSession(job: ClaimedLogicalTradeAnalyzerJob, acquisitionId: string, start: number, endExclusive: number) {
    return this.history.begin({ scope: job.scope, jobId: job.jobId, acquisitionId,
      range: { start, endExclusive }, now: this.now() });
  }
  finishSession(job: ClaimedLogicalTradeAnalyzerJob, requestId: string, result: MarketDataProviderResult) {
    this.history.finish({ scope: job.scope, jobId: job.jobId, requestId, result, now: this.now() });
  }

  async prepare(job: ClaimedLogicalTradeAnalyzerJob, asOf: number): Promise<
    { pending: true } | { pending: false; input: TradeExecutionIndicatorInput; outcome: string }> {
    const now = this.now();
    this.history.recoverInterrupted(job.scope, job.jobId, now);
    const session = newYorkExtendedSession(job.target.tradingDateNewYork);
    if (!session) throw new Error("indicator_history_session_invalid");
    const prior = priorIndicatorHistoryRanges(job.target.tradingDateNewYork);
    const evidence = this.history.compatibleEvidence(job.scope, job.target.providerSymbol, prior.at(-1)!.start, asOf);
    const history = { asOf, completedRanges: evidence.ranges,
      candles: evidence.candles.map((bar) => ({ time: bar.time, open: Number(bar.openDecimal),
        high: Number(bar.highDecimal), low: Number(bar.lowDecimal), close: Number(bar.closeDecimal),
        volume: Number(bar.volumeDecimal), turnover: bar.turnoverDecimal == null ? null : Number(bar.turnoverDecimal) })) };
    const input = buildTradeIndicatorInput(job.target.tradingDateNewYork, history);
    const earliest = Math.min(...job.target.events.map((e) => Date.parse(e.executedAtUtc) / 1000));
    const enough = inspectIndicatorWarmup({ ...history, asOf: Math.floor(earliest) },
      [{ interval: "1m", requiredBars: 200 }, { interval: "5m", requiredBars: 200 }])
      .every((frame) => frame.missingBars === 0);
    const currentCovered = hasCompletedIndicatorCoverage(evidence.ranges, session.startTime, asOf);
    if (enough && currentCovered) return { pending: false, input, outcome: "complete" };
    // One range per pass. Completed sparse/empty windows are never retried.
    const candidates = [...(!currentCovered ? [{ start: session.startTime, endExclusive: asOf }] : []), ...(!enough ? prior : [])];
    const rows = this.history.read(job.scope, job.jobId);
    let exhaustedByFailure = false;
    for (const range of candidates) {
      if (hasCompletedIndicatorCoverage(evidence.ranges, range.start, range.endExclusive)) continue;
      const attempts = rows.filter((r) => r.requested_start_seconds === range.start && r.requested_end_seconds === range.endExclusive);
      if (attempts.some((r) => r.status === "requested")) return { pending: true };
      if (attempts.length >= 3) { exhaustedByFailure = true; continue; }
      const last = attempts.at(-1);
      if (last?.completed_at_utc && Date.parse(last.completed_at_utc) + 60_000 > now.getTime()) return { pending: true };
      const requestStartedAt = this.allowances.historyRequestStartedAt(job.jobId, job.createdAtUtc, now);
      if (now.getTime() - Date.parse(requestStartedAt) >= 24 * 3600_000) { exhaustedByFailure = true; break; }
      const scope = this.allowances.designatedScope();
      if (!scope || !this.allowances.hasHistoryReservation(job.jobId, now)) {
        return { pending: false, input, outcome: "provider_unavailable" };
      }
      const acquisition = this.allowances.beginAcquisition({ jobId: job.jobId,
        marketSessionSetId: job.marketSessionSetId, now, historyContinuation: true });
      if (!acquisition) return { pending: true };
      const requestId = this.history.begin({ scope: job.scope, jobId: job.jobId,
        acquisitionId: acquisition.acquisitionId, range, now });
      if (!requestId) {
        this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now, outcome: "provider_unavailable" });
        return { pending: true };
      }
      let result: MarketDataProviderResult;
      try {
        result = await (await this.providerFor(scope)).fetch({ symbol: job.target.providerSymbol,
          interval: "1m", includeExtendedHours: true, startTime: range.start, endTime: range.endExclusive });
      } catch {
        result = { ok: false, code: "provider_unavailable", failureReasonCode: "history_request_failed",
          requestCoverage: "partial", exchangeTimezone: null, utcOffsetSeconds: null };
      }
      const completedAt = this.now();
      this.history.finish({ scope: job.scope, jobId: job.jobId, requestId, result, now: completedAt });
      this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now: completedAt,
        outcome: result.ok ? "ready" : result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage" });
      return { pending: true };
    }
    return { pending: false, input, outcome: exhaustedByFailure ? "provider_unavailable" : "history_exhausted" };
  }
}
