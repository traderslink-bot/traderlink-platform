import { analyzeDailyTrade } from "./daily-trade-analyzer";
import { UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS } from "./daily-trade-green-to-red-analyzer";
import { validateDailyTradeExecutionCandles } from "./daily-trade-execution-candle-validation";
import {
  type ClaimedDailyTradeAnalyzerJob,
  DailyTradeAnalyzerRepository,
} from "./daily-trade-analyzer-repository";
import { DailyTradeAnalyzerNotificationService } from "./daily-trade-analyzer-notification-service";
import {
  availableSessionEnd,
  dailyTradeFirstResultCoverageEnd,
  newYorkExtendedSession,
  postSessionReconciliationAt,
} from "./daily-trade-analyzer-session";
import type { MarketDataProvider } from "../contracts/candle-review-contracts";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

type ScopedMarketDataProviderFactory = (scope: AccountScope) => MarketDataProvider;

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
    private readonly notifications?: DailyTradeAnalyzerNotificationService,
  ) {}

  async runOne(): Promise<boolean> {
    const now = this.now();
    const job = this.repository.claimNextJob(now);
    if (!job) return false;
    try {
      return await this.runClaimedJob(job, now);
    } catch {
      return this.retryOrFinish(job, this.now());
    }
  }

  private finishUnavailable(
    job: ClaimedDailyTradeAnalyzerJob,
    status: "expired" | "no_coverage" | "provider_unavailable",
    now: Date,
    marketSessionSetVersionId: string | null,
  ): void {
    this.repository.persistAnalysis({
      analyzed: { eventSnapshots: [], finalExitPaths: [], greenToRed: UNAVAILABLE_DAILY_TRADE_GREEN_TO_RED_ANALYSIS },
      marketSessionSetVersionId,
      scope: job.scope,
      status,
      target: job.target,
      now,
    });
    this.repository.finishJob(job.jobId, status, now);
    this.notifyFailure(job, now);
  }

  private notifyFailure(job: ClaimedDailyTradeAnalyzerJob, occurredAt: Date): void {
    try {
      this.notifications?.notifyFailure({ occurredAt, scope: job.scope, target: job.target });
    } catch (error) {
      console.error("Trade Analyzer owner alert could not be queued.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  private notifyReady(job: ClaimedDailyTradeAnalyzerJob, occurredAt: Date): void {
    try {
      this.notifications?.notifyReady({ occurredAt, scope: job.scope, target: job.target });
    } catch (error) {
      console.error("Trade Analyzer ready notification could not be queued.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  private notifyNeedsCorrection(job: ClaimedDailyTradeAnalyzerJob, occurredAt: Date): void {
    try {
      this.notifications?.notifyNeedsCorrection({
        occurredAt,
        scope: job.scope,
        target: job.target,
      });
    } catch (error) {
      console.error("Trade Analyzer correction notification could not be queued.", {
        errorName: error instanceof Error ? error.name : "UnknownError",
      });
    }
  }

  private retryOrFinish(job: ClaimedDailyTradeAnalyzerJob, now: Date): boolean {
    if (job.attemptCount >= 3) {
      this.finishUnavailable(job, "provider_unavailable", now, null);
      return true;
    }
    this.repository.rescheduleJob(job.jobId, new Date(now.getTime() + 60_000), now);
    return true;
  }

  private async runClaimedJob(
    job: ClaimedDailyTradeAnalyzerJob,
    now: Date,
  ): Promise<boolean> {
    if (job.attemptCount > 3) {
      this.finishUnavailable(job, "provider_unavailable", now, null);
      return true;
    }
    const session = newYorkExtendedSession(job.target.tradingDateNewYork);
    const storedDesiredEndSeconds = Math.floor(Date.parse(job.desiredCoverageEndUtc) / 1000);
    const currentPolicyEndSeconds = session
      ? dailyTradeFirstResultCoverageEnd(session, job.target.finalExitAtUtc)
      : null;
    // Jobs queued before the 30-minute policy can retain their old 60-minute
    // target. Honor the current policy without rewriting historical job facts.
    const desiredEndSeconds = currentPolicyEndSeconds !== null
      ? Math.min(storedDesiredEndSeconds, currentPolicyEndSeconds)
      : storedDesiredEndSeconds;
    const availableEnd = session ? availableSessionEnd(session, now) : null;
    if (!session || availableEnd === null || !Number.isFinite(desiredEndSeconds)) {
      this.finishUnavailable(job, "expired", now, null);
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
        if (result.code === "provider_unavailable" && !isPostSessionReconciliation) {
          return this.retryOrFinish(job, completedAt);
        }
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
          this.notifyFailure(job, completedAt);
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
        this.finishUnavailable(
          job,
          result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage",
          completedAt,
          sessionVersionId,
        );
        return true;
      }
      if (
        isPostSessionReconciliation &&
        candles.length > 0 &&
        sessionVersionId &&
        validateDailyTradeExecutionCandles({
          candles: result.candles,
          direction: job.target.direction,
          events: job.target.events,
        }).some((mismatch) => mismatch.kind === "execution_minute_unavailable") &&
        validateDailyTradeExecutionCandles({
          candles,
          direction: job.target.direction,
          events: job.target.events,
        }).length === 0
      ) {
        // Keep a valid same-day analysis when finalized provider history
        // unexpectedly omits an execution candle that was previously present.
        this.repository.finishJob(job.jobId, "completed", completedAt);
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
    let mismatches = validateDailyTradeExecutionCandles({
      candles,
      direction: job.target.direction,
      events: job.target.events,
    });
    if (mismatches.length > 0) {
      // One direct provider refresh protects the trader from a stale or recently
      // revised candle before a correction outcome becomes durable.
      const refreshedAt = this.now();
      const refreshed = await this.providerFor(job.scope).fetch({
        symbol: job.target.providerSymbol,
        interval: "1m",
        startTime: session.startTime,
        endTime: requestEnd,
        includeExtendedHours: true,
      });
      if (!refreshed.ok && refreshed.code === "provider_unavailable") {
        return this.retryOrFinish(job, refreshedAt);
      }
      if (refreshed.ok) {
        candles = isPostSessionReconciliation
          ? refreshed.candles
          : mergeCandles(candles, refreshed.candles);
        sessionVersionId = this.repository.persistMarketSession({
          candles,
          completedAtUtc: refreshedAt.toISOString(),
          coverageEndUtc: new Date(requestEnd * 1000).toISOString(),
          failureReasonCode: null,
          marketSessionSetId: job.marketSessionSetId,
          outcome: "ready",
          providerExchangeTimezone: refreshed.exchangeTimezone,
          providerUtcOffsetSeconds: refreshed.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(requestEnd * 1000).toISOString(),
          sha256: refreshed.normalizedCandleSha256,
        });
        mismatches = validateDailyTradeExecutionCandles({
          candles,
          direction: job.target.direction,
          events: job.target.events,
        });
      }
      if (mismatches.length > 0) {
        this.repository.persistExecutionMismatches({
          jobId: job.jobId,
          marketSessionSetVersionId: sessionVersionId,
          mismatches,
          now: refreshedAt,
          scope: job.scope,
          target: job.target,
        });
        this.repository.finishJob(job.jobId, "completed", refreshedAt);
        this.notifyNeedsCorrection(job, refreshedAt);
        return true;
      }
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
    if (requestEnd >= desiredEndSeconds) {
      this.notifyReady(job, analyzedAt);
    }
    if (isPostSessionReconciliation) {
      this.repository.finishJob(job.jobId, "completed", analyzedAt);
    } else if (requestEnd >= desiredEndSeconds) {
      this.repository.rescheduleJob(job.jobId, reconciliationAt, analyzedAt, {
        resetAttempts: true,
      });
    } else {
      this.repository.rescheduleJob(job.jobId, new Date(desiredEndSeconds * 1000), analyzedAt, {
        resetAttempts: true,
      });
    }
    return true;
  }
}
