import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { MarketDataProvider, NormalizedMarketCandle } from "../contracts/candle-review-contracts";
import { analyzeDailyTrade } from "./daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { availableSessionEnd, dailyTradeFirstResultCoverageEnd, newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { validateDailyTradeExecutionCandles } from "./daily-trade-execution-candle-validation";
import { LogicalTradeAnalyzerRepository, type ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import type { LogicalTradeAnalyzerNotificationService } from "./logical-trade-analyzer-notification-service";

type ProviderFactory = (scope: AccountScope) => Promise<MarketDataProvider>;

function completeCoverage(
  candles: readonly NormalizedMarketCandle[],
  startSeconds: number,
  endSeconds: number,
): boolean {
  return (candles[0]?.time ?? Number.POSITIVE_INFINITY) <= startSeconds + 60 &&
    (candles.at(-1)?.time ?? 0) >= endSeconds - 60;
}

const SHARED_CACHE_ACTIVATION_DATE = "2026-09-04";

function retainSharedSession(tradingDate: string, submittedAtUtc: string, now: Date): boolean {
  if (submittedAtUtc.slice(0, 10) >= SHARED_CACHE_ACTIVATION_DATE) return true;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 9);
  return tradingDate >= cutoff.toISOString().slice(0, 10);
}

/** Processes the logical-trade FIFO through only the configured shared Moomoo scope. */
export class LogicalTradeMoomooAnalyzerWorker {
  constructor(
    private readonly logical: LogicalTradeAnalyzerRepository,
    private readonly candles: DailyTradeAnalyzerRepository,
    private readonly allowances: SharedAnalyzerAllowanceRepository,
    private readonly providerFor: ProviderFactory,
    private readonly notifications?: LogicalTradeAnalyzerNotificationService,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async runOne(): Promise<boolean> {
    const claimedAt = this.now();
    const job = this.logical.claimNext(claimedAt);
    if (!job) return false;
    try {
      return await this.process(job, claimedAt);
    } catch {
      if (job.attemptCount >= 3) {
        this.allowances.release(job.jobId, this.now());
        this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: null,
          now: this.now(), scope: job.scope, status: "provider_unavailable", target: job.target });
        this.logical.finish(job.jobId, "provider_unavailable", this.now());
        this.notifications?.notifyFailure({ occurredAt: this.now(), scope: job.scope, target: job.target });
      } else {
        this.logical.reschedule(job.jobId, new Date(this.now().getTime() + 60_000), this.now());
      }
      return true;
    }
  }

  private async process(job: ClaimedLogicalTradeAnalyzerJob, startedAt: Date): Promise<boolean> {
    const session = newYorkExtendedSession(job.target.tradingDateNewYork);
    const policyEnd = session ? dailyTradeFirstResultCoverageEnd(session, job.target.finalExitAtUtc) : null;
    const availableEnd = session ? availableSessionEnd(session, startedAt) : null;
    if (!session || policyEnd === null || availableEnd === null) {
      this.allowances.release(job.jobId, startedAt);
      this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: null,
        now: startedAt, scope: job.scope, status: "expired", target: job.target });
      this.logical.finish(job.jobId, "expired", startedAt);
      return true;
    }
    const desiredEnd = Math.min(policyEnd, availableEnd);
    let current = this.candles.readCurrentCandles(job.marketSessionSetId);
    let sessionVersionId = this.candles.currentSessionVersionId(job.marketSessionSetId);
    let chargedAcquisitionId: string | null = null;
    if (!completeCoverage(current, session.startTime, desiredEnd)) {
      const providerScope = this.allowances.designatedScope();
      if (!providerScope) {
        this.allowances.release(job.jobId, startedAt);
        this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: null,
          now: startedAt, scope: job.scope, status: "provider_unavailable", target: job.target });
        this.logical.finish(job.jobId, "provider_unavailable", startedAt);
        this.notifications?.notifyFailure({ occurredAt: startedAt, scope: job.scope, target: job.target });
        return true;
      }
      let provider: MarketDataProvider;
      try {
        provider = await this.providerFor(providerScope);
      } catch {
        this.allowances.release(job.jobId, startedAt);
        this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: null,
          now: startedAt, scope: job.scope, status: "provider_unavailable", target: job.target });
        this.logical.finish(job.jobId, "provider_unavailable", startedAt);
        this.notifications?.notifyFailure({ occurredAt: startedAt, scope: job.scope, target: job.target });
        return true;
      }
      const acquisition = this.allowances.beginAcquisition({
        jobId: job.jobId, marketSessionSetId: job.marketSessionSetId, now: startedAt,
      });
      if (!acquisition) {
        // A missing provider or the single-acquisition/global guard is not a
        // reason to spin the hosted worker. The next normal worker pass will
        // retry this FIFO item without exposing queue mechanics to the user.
        this.logical.reschedule(job.jobId, new Date(startedAt.getTime() + 60_000), startedAt);
        return true;
      }
      chargedAcquisitionId = acquisition.acquisitionId;
      const result = await provider.fetch({
        symbol: job.target.providerSymbol, interval: "1m", startTime: session.startTime,
        endTime: desiredEnd, includeExtendedHours: true,
      });
      const completedAt = this.now();
      if (!result.ok) {
        const outcome = result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage";
        this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now: completedAt, outcome });
        this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: null,
          now: completedAt, scope: job.scope, status: outcome, target: job.target });
        this.logical.finish(job.jobId, outcome, completedAt);
        this.notifications?.notifyFailure({ occurredAt: completedAt, scope: job.scope, target: job.target });
        return true;
      }
      current = result.candles;
      if (retainSharedSession(job.target.tradingDateNewYork, job.createdAtUtc, completedAt)) {
        sessionVersionId = this.candles.persistMarketSession({
          candles: current, completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(desiredEnd * 1000).toISOString(), failureReasonCode: null,
          marketSessionSetId: job.marketSessionSetId, outcome: "ready",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(desiredEnd * 1000).toISOString(),
          sha256: result.normalizedCandleSha256,
        });
      } else sessionVersionId = null;
      this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now: completedAt, outcome: "ready" });
    } else {
      this.allowances.release(job.jobId, startedAt);
    }
    const mismatches = validateDailyTradeExecutionCandles({
      candles: current, direction: job.target.direction, events: job.target.events,
    });
    const completedAt = this.now();
    if (mismatches.length > 0) {
      if (chargedAcquisitionId) {
        this.allowances.grantCorrection({
          acquisitionId: chargedAcquisitionId,
          logicalTradeId: job.target.logicalTradeId,
          logicalTradeVersionId: job.target.logicalTradeVersionId,
          now: completedAt,
        });
      }
      this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: sessionVersionId,
        evidenceCandles: current, executionMismatches: mismatches,
        now: completedAt, scope: job.scope, status: "correction_required", target: job.target });
      this.logical.finish(job.jobId, "completed", completedAt);
      this.notifications?.notifyNeedsCorrection({ occurredAt: completedAt, scope: job.scope, target: job.target });
      return true;
    }
    this.logical.persistResult({
      analyzed: analyzeDailyTrade({ candles: current, dailyRanges: [],
        direction: job.target.direction, events: job.target.events }),
      evidenceCandles: current,
      marketSessionSetVersionId: sessionVersionId, now: completedAt, scope: job.scope,
      status: completeCoverage(current, session.startTime, policyEnd) ? "ready" : "pending", target: job.target,
    });
    if (completeCoverage(current, session.startTime, policyEnd)) {
      this.logical.finish(job.jobId, "completed", completedAt);
      this.notifications?.notifyReady({ occurredAt: completedAt, scope: job.scope, target: job.target });
    }
    else this.logical.reschedule(job.jobId, new Date(policyEnd * 1000), completedAt);
    return true;
  }
}
