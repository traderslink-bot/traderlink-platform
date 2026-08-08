import { analyzeDailyTrade } from "./daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import {
  availableSessionEnd,
  newYorkExtendedSession,
  postSessionReconciliationAt,
} from "./daily-trade-analyzer-session";
import type { MarketDataProvider } from "../contracts/candle-review-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type ScopedMarketDataProviderFactory = (scope: AccountScope) => MarketDataProvider;

function containsEveryExecutionMinute(
  candles: readonly { time: number }[],
  executedAtUtc: readonly { executedAtUtc: string }[],
): boolean {
  const candleTimes = new Set(candles.map((candle) => candle.time));
  return executedAtUtc.every((event) => {
    const milliseconds = Date.parse(event.executedAtUtc);
    return Number.isFinite(milliseconds) && candleTimes.has(Math.floor(milliseconds / 60_000) * 60);
  });
}

function mergeCandles(
  current: readonly import("../contracts/candle-review-contracts").NormalizedMarketCandle[],
  incoming: readonly import("../contracts/candle-review-contracts").NormalizedMarketCandle[],
): readonly import("../contracts/candle-review-contracts").NormalizedMarketCandle[] {
  const merged = new Map(current.map((candle) => [candle.time, candle]));
  for (const candle of incoming) {
    // Moomoo can revise a recently formed candle. The next immutable session
    // version records the newer broker-supplied values without changing any Journal fact.
    merged.set(candle.time, candle);
  }
  return Object.freeze([...merged.values()].sort((left, right) => left.time - right.time));
}

export class DailyTradeMoomooAnalyzerWorker {
  constructor(
    private readonly repository: DailyTradeAnalyzerRepository,
    private readonly providerFor: ScopedMarketDataProviderFactory,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async runOne(): Promise<boolean> {
    const now = this.now();
    const job = this.repository.claimNextJob(now);
    if (!job) return false;
    const session = newYorkExtendedSession(job.target.tradingDateNewYork);
    const desiredEndSeconds = Math.floor(Date.parse(job.desiredCoverageEndUtc) / 1000);
    const availableEnd = session ? availableSessionEnd(session, now) : null;
    if (!session || availableEnd === null || !Number.isFinite(desiredEndSeconds)) {
      this.repository.finishJob(job.jobId, "expired", now);
      return true;
    }
    const reconciliationAt = postSessionReconciliationAt(session);
    const isPostSessionReconciliation = now >= reconciliationAt;
    const requestEnd = isPostSessionReconciliation
      ? session.endTime
      : Math.min(availableEnd, desiredEndSeconds);
    const currentCoverage = this.repository.currentSessionCoverageEnd(job.marketSessionSetId);
    const currentRetrievedAt = this.repository.currentSessionRetrievedAt(job.marketSessionSetId);
    const sharedSessionAlreadyReconciled = currentRetrievedAt !== null &&
      Date.parse(currentRetrievedAt) >= reconciliationAt.getTime();
    let candles = this.repository.readCurrentCandles(job.marketSessionSetId);
    let sessionVersionId = this.repository.currentSessionVersionId(job.marketSessionSetId);
    if (
      !currentCoverage ||
      Date.parse(currentCoverage) / 1000 < requestEnd ||
      (isPostSessionReconciliation && !sharedSessionAlreadyReconciled)
    ) {
      const completedAt = this.now();
      const result = await this.providerFor(job.scope).fetch({
        symbol: job.target.providerSymbol,
        interval: "1m",
        startTime: session.startTime,
        endTime: requestEnd,
        includeExtendedHours: true,
      });
      if (!result.ok) {
        if (isPostSessionReconciliation && candles.length > 0 && sessionVersionId) {
          // The immediate analysis remains the factual current revision when
          // the one allowed finalized-history attempt cannot be completed.
          this.repository.finishJob(job.jobId, "completed", completedAt);
          return true;
        }
        if (candles.length > 0 && sessionVersionId) {
          this.repository.persistAnalysis({
            analyzed: analyzeDailyTrade({ candles, dailyRanges: [], direction: job.target.direction, events: job.target.events }),
            marketSessionSetVersionId: sessionVersionId,
            scope: job.scope,
            status: "provider_unavailable",
            target: job.target,
            now: completedAt,
          });
          this.repository.finishJob(job.jobId, "provider_unavailable", completedAt);
          return true;
        }
        sessionVersionId = this.repository.persistMarketSession({
          candles: [],
          completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
          failureReasonCode: result.failureReasonCode,
          marketSessionSetId: job.marketSessionSetId,
          outcome: result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
          sha256: null,
        });
        this.repository.persistAnalysis({ analyzed: { eventSnapshots: [], finalExitPaths: [] }, marketSessionSetVersionId: sessionVersionId,
          scope: job.scope, status: result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage", target: job.target, now: completedAt });
        this.repository.finishJob(job.jobId, result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage", completedAt);
        return true;
      }
      if (!containsEveryExecutionMinute(result.candles, job.target.events)) {
        if (isPostSessionReconciliation && candles.length > 0 && sessionVersionId) {
          // Do not replace a usable same-day analysis with a finalized response
          // that unexpectedly omits one of its execution minutes.
          this.repository.finishJob(job.jobId, "completed", completedAt);
          return true;
        }
        sessionVersionId = this.repository.persistMarketSession({
          candles: result.candles,
          completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
          failureReasonCode: null,
          marketSessionSetId: job.marketSessionSetId,
          outcome: "ready",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
          sha256: result.normalizedCandleSha256,
        });
        this.repository.persistAnalysis({
          analyzed: { eventSnapshots: [], finalExitPaths: [] },
          marketSessionSetVersionId: sessionVersionId,
          scope: job.scope,
          status: "no_coverage",
          target: job.target,
          now: completedAt,
        });
        this.repository.finishJob(job.jobId, "no_coverage", completedAt);
        return true;
      }
      candles = isPostSessionReconciliation
        ? result.candles
        : mergeCandles(candles, result.candles);
      sessionVersionId = this.repository.persistMarketSession({
        candles,
        completedAtUtc: completedAt.toISOString(),
        coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
        failureReasonCode: null,
        marketSessionSetId: job.marketSessionSetId,
        outcome: "ready",
        providerExchangeTimezone: result.exchangeTimezone,
        providerUtcOffsetSeconds: result.utcOffsetSeconds,
        requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
        requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
        sha256: result.normalizedCandleSha256,
      });
    }
    if (!containsEveryExecutionMinute(candles, job.target.events)) {
      const completedAt = this.now();
      this.repository.persistAnalysis({
        analyzed: { eventSnapshots: [], finalExitPaths: [] },
        marketSessionSetVersionId: sessionVersionId,
        scope: job.scope,
        status: "no_coverage",
        target: job.target,
        now: completedAt,
      });
      this.repository.finishJob(job.jobId, "no_coverage", completedAt);
      return true;
    }
    const analyzedAt = this.now();
    this.repository.persistAnalysis({
      analyzed: analyzeDailyTrade({ candles, dailyRanges: [], direction: job.target.direction, events: job.target.events }),
      marketSessionSetVersionId: sessionVersionId,
      scope: job.scope,
      status: requestEnd >= desiredEndSeconds ? "ready" : "pending",
      target: job.target,
      now: analyzedAt,
    });
    if (isPostSessionReconciliation) {
      this.repository.finishJob(job.jobId, "completed", analyzedAt);
    } else if (requestEnd >= desiredEndSeconds) {
      this.repository.rescheduleJob(job.jobId, reconciliationAt, analyzedAt);
    } else {
      this.repository.rescheduleJob(job.jobId, new Date(desiredEndSeconds * 1000), analyzedAt);
    }
    return true;
  }
}
