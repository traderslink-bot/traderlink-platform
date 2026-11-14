import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { MarketDataProvider } from "../contracts/candle-review-contracts";
import { analyzeDailyTrade } from "./daily-trade-analyzer";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { availableSessionEnd, dailyTradeFirstResultCoverageEnd, newYorkExtendedSession, postSessionReconciliationAt } from "./daily-trade-analyzer-session";
import { validateDailyTradeExecutionCandles } from "./daily-trade-execution-candle-validation";
import { LogicalTradeAnalyzerRepository, type ClaimedLogicalTradeAnalyzerJob } from "./logical-trade-analyzer-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import type { LogicalTradeAnalyzerNotificationService } from "./logical-trade-analyzer-notification-service";
import type { TrendMomentumHistoryService } from "./trend-momentum-history-service";

type ProviderFactory = (scope: AccountScope) => Promise<MarketDataProvider>;

const SHARED_CACHE_ACTIVATION_DATE = "2026-09-04";

function retainSharedSession(tradingDate: string, submittedAtUtc: string, now: Date): boolean {
  if (submittedAtUtc.slice(0, 10) >= SHARED_CACHE_ACTIVATION_DATE) return true;
  const cutoff = new Date(now);
  cutoff.setUTCDate(cutoff.getUTCDate() - 9);
  return tradingDate >= cutoff.toISOString().slice(0, 10);
}

/** Processes the logical-trade FIFO using raw Alpaca candles. */
export class LogicalTradeAlpacaAnalyzerWorker {
  constructor(
    private readonly logical: LogicalTradeAnalyzerRepository,
    private readonly candles: DailyTradeAnalyzerRepository,
    private readonly allowances: SharedAnalyzerAllowanceRepository,
    private readonly providerFor: ProviderFactory,
    private readonly notifications?: LogicalTradeAnalyzerNotificationService,
    private readonly now: () => Date = () => new Date(),
    private readonly trendMomentum?: TrendMomentumHistoryService,
    private readonly onClaimTiming?: (timing: Readonly<{
      startEpochMs: number; endEpochMs: number; durationMs: number;
    }>) => void,
  ) {}

  async runOne(): Promise<boolean> {
    const claimedAt = this.now();
    const claimStartedEpochMs = Date.now();
    const claimStarted = performance.now();
    let job: ClaimedLogicalTradeAnalyzerJob | null = null;
    try { job = this.logical.claimNext(claimedAt); }
    finally {
      try {
        this.onClaimTiming?.({
          startEpochMs: claimStartedEpochMs,
          endEpochMs: Date.now(),
          durationMs: performance.now() - claimStarted,
        });
      } catch { /* A timing callback cannot affect a job claim. */ }
    }
    if (!job) return false;
    let diagnosticStage = "process_start";
    try {
      return await this.process(job, claimedAt, (stage) => {
        diagnosticStage = stage;
      });
    } catch (error) {
      console.error("TraderLink Trade Analyzer worker attempt failed.", {
        diagnosticStage,
        errorCode: error && typeof error === "object" && "code" in error
          ? String(error.code)
          : null,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
        errorName: error instanceof Error ? error.name : "UnknownError",
        logicalTradeVersionId: job.target.logicalTradeVersionId,
        requestedEndUtc: job.desiredCoverageEndUtc,
        symbol: job.target.providerSymbol,
      });
      if (job.attemptCount >= 3) {
        if (job.postSessionRefresh) {
          this.logical.finish(job.jobId, "provider_unavailable", this.now());
          return true;
        }
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

  private async process(
    job: ClaimedLogicalTradeAnalyzerJob,
    startedAt: Date,
    setDiagnosticStage: (stage: string) => void,
  ): Promise<boolean> {
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
    if (job.postSessionRefresh) {
      const due = postSessionReconciliationAt(session);
      if (startedAt < due) {
        this.logical.reschedule(job.jobId, due, startedAt);
        return true;
      }
      setDiagnosticStage("reconcile_alpaca_candles");
      const setId = job.marketSessionSetId;
      const retrievedAt = this.candles.currentSessionRetrievedAt(setId);
      let versionId = this.candles.currentSessionVersionId(setId);
      let bars = this.candles.readCurrentCandles(setId);
      const coverageEnd = this.candles.currentSessionCoverageEnd(setId);
      const fullEnd = new Date(session.endTime * 1000).toISOString();
      const needsDownload = !versionId || !retrievedAt || Date.parse(retrievedAt) < due.getTime() ||
        !coverageEnd || coverageEnd < fullEnd || bars.length === 0;
      let refreshed: Extract<Awaited<ReturnType<MarketDataProvider["fetch"]>>, { ok: true }> | undefined;
      if (needsDownload) {
        const provider = await this.providerFor(job.scope);
        const result = await provider.fetch({ symbol: job.target.providerSymbol, interval: "1m",
          startTime: session.startTime, endTime: session.endTime, includeExtendedHours: true });
        if (!result.ok) {
          if (result.code === "provider_unavailable") throw new Error(result.failureReasonCode);
          this.logical.finish(job.jobId, "no_coverage", this.now());
          return true;
        }
        refreshed = result;
        bars = result.candles;
      }
      // Keep the previous analysis and cache if revised evidence loses a fill.
      if (validateDailyTradeExecutionCandles({
        candles: bars, direction: job.target.direction, events: job.target.events,
      }).length) {
        this.logical.finish(job.jobId, "no_coverage", this.now());
        return true;
      }
      if (refreshed) {
        versionId = this.candles.persistMarketSession({
          candles: bars, completedAtUtc: this.now().toISOString(), coverageEndUtc: fullEnd,
          failureReasonCode: null, marketSessionSetId: setId, outcome: "ready",
          providerExchangeTimezone: refreshed.exchangeTimezone, providerUtcOffsetSeconds: refreshed.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: fullEnd, sha256: refreshed.normalizedCandleSha256,
        });
      }
      const trend = await this.trendMomentum?.prepare(job, policyEnd, bars);
      this.logical.persistResult({
        analyzed: analyzeDailyTrade({ candles: bars, dailyRanges: [], direction: job.target.direction,
          events: job.target.events,
          ...(trend && !trend.pending ? { trendMomentum: { ...trend.input, historyOutcome: trend.outcome } } : {}) }),
        evidenceCandles: bars, marketSessionSetVersionId: versionId, now: this.now(), scope: job.scope,
        status: "ready", target: job.target,
      });
      this.logical.finish(job.jobId, "completed", this.now());
      return true;
    }
    if (availableEnd < policyEnd) {
      this.logical.reschedule(job.jobId, new Date(policyEnd * 1000), startedAt);
      return true;
    }
    const desiredEnd = policyEnd;
    // Readiness and measurement endpoints are separate from reusable download
    // coverage. Fetch the available session only when saved coverage is lacking.
    const downloadEnd = availableEnd;
    setDiagnosticStage("read_current_candles");
    let current = this.candles.readCurrentCandles(job.marketSessionSetId);
    setDiagnosticStage("read_current_session_version");
    let sessionVersionId = this.candles.currentSessionVersionId(job.marketSessionSetId);
    setDiagnosticStage("read_current_session_coverage");
    const storedCoverageEnd = this.candles.currentSessionCoverageEnd(job.marketSessionSetId);
    const hasDesiredCoverage = current.length > 0 && storedCoverageEnd !== null &&
      Math.floor(Date.parse(storedCoverageEnd) / 1000) >= desiredEnd;
    let chargedAcquisitionId: string | null = null;
    const recordFailure = (failureReasonCode: string,
      outcome: "no_coverage" | "provider_unavailable", completedAt: Date): string =>
      this.candles.persistMarketSession({ candles: [], completedAtUtc: completedAt.toISOString(),
        coverageEndUtc: new Date(downloadEnd * 1000).toISOString(), failureReasonCode,
        marketSessionSetId: job.marketSessionSetId, outcome,
        promoteCurrent: current.length === 0,
        providerExchangeTimezone: "America/New_York", providerUtcOffsetSeconds: null,
        requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
        requestedEndUtc: new Date(downloadEnd * 1000).toISOString(), sha256: null });
    if (!hasDesiredCoverage) {
      setDiagnosticStage("create_market_data_provider");
      const provider = await this.providerFor(job.scope);
      setDiagnosticStage("begin_market_data_acquisition");
      const acquisition = this.allowances.beginAcquisition({
        jobId: job.jobId, marketSessionSetId: job.marketSessionSetId, now: startedAt,
        historyContinuation: Boolean(this.trendMomentum),
      });
      if (!acquisition) {
        // A missing provider or the single-acquisition/global guard is not a
        // reason to spin the hosted worker. The next normal worker pass will
        // retry this FIFO item without exposing queue mechanics to the user.
        this.logical.reschedule(job.jobId, new Date(startedAt.getTime() + 60_000), startedAt);
        return true;
      }
      chargedAcquisitionId = acquisition.acquisitionId;
      const historyRequest = this.trendMomentum?.beginSession(job, acquisition.acquisitionId, session.startTime, downloadEnd);
      setDiagnosticStage("fetch_alpaca_candles");
      const result = await provider.fetch({
        symbol: job.target.providerSymbol, interval: "1m", startTime: session.startTime,
        endTime: downloadEnd, includeExtendedHours: true,
      });
      const completedAt = this.now();
      if (historyRequest) this.trendMomentum?.finishSession(job, historyRequest, result);
      if (!result.ok) {
        const outcome = result.code === "provider_unavailable" ? "provider_unavailable" : "no_coverage";
        sessionVersionId = recordFailure(result.failureReasonCode, outcome, completedAt);
        console.error("TraderLink Trade Analyzer market-data acquisition failed.", {
          adapter: "alpaca_sip_raw_v1", failureReasonCode: result.failureReasonCode,
          requestedEndUtc: new Date(downloadEnd * 1000).toISOString(),
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          symbol: job.target.providerSymbol,
        });
        this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now: completedAt, outcome });
        if (outcome === "provider_unavailable" && job.attemptCount < 3) {
          this.logical.reschedule(job.jobId, new Date(completedAt.getTime() + 60_000), completedAt);
          return true;
        }
        this.allowances.release(job.jobId, completedAt);
        this.logical.persistResult({ analyzed: null, marketSessionSetVersionId: sessionVersionId,
          now: completedAt, scope: job.scope, status: outcome, target: job.target });
        this.logical.finish(job.jobId, outcome, completedAt);
        this.notifications?.notifyFailure({ occurredAt: completedAt, scope: job.scope, target: job.target, failureReason: outcome });
        return true;
      }
      current = result.candles;
      if (retainSharedSession(job.target.tradingDateNewYork, job.createdAtUtc, completedAt)) {
        sessionVersionId = this.candles.persistMarketSession({
          candles: current, completedAtUtc: completedAt.toISOString(),
          coverageEndUtc: new Date(downloadEnd * 1000).toISOString(), failureReasonCode: null,
          marketSessionSetId: job.marketSessionSetId, outcome: "ready",
          providerExchangeTimezone: result.exchangeTimezone,
          providerUtcOffsetSeconds: result.utcOffsetSeconds,
          requestedStartUtc: new Date(session.startTime * 1000).toISOString(),
          requestedEndUtc: new Date(downloadEnd * 1000).toISOString(),
          sha256: result.normalizedCandleSha256,
        });
      } else sessionVersionId = null;
      this.allowances.completeAcquisition({ acquisitionId: acquisition.acquisitionId, now: completedAt, outcome: "ready" });
    } else if (!this.trendMomentum) {
      this.allowances.release(job.jobId, startedAt);
    }
    current = current.filter((bar) => bar.time >= session.startTime && bar.time + 60 <= downloadEnd);
    setDiagnosticStage("validate_execution_candles");
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
    let trend: Awaited<ReturnType<TrendMomentumHistoryService["prepare"]>> | null = null;
    let trendFailed = false;
    if (this.trendMomentum && desiredEnd >= policyEnd) {
      try { trend = await this.trendMomentum.prepare(job, desiredEnd); }
      catch {
        trendFailed = true;
        console.error("Trade Analyzer indicator history unavailable; retaining core trade analysis.");
      }
    }
    if (trend?.pending) {
      this.logical.reschedule(job.jobId, new Date(this.now().getTime() + 60_000), this.now());
      return true;
    }
    this.allowances.release(job.jobId, this.now());
    this.logical.persistResult({
      analyzed: { ...analyzeDailyTrade({ candles: current, dailyRanges: [],
        direction: job.target.direction, events: job.target.events,
        ...(trend && !trend.pending ? { trendMomentum: { ...trend.input, historyOutcome: trend.outcome } } : {}) }),
        ...(trendFailed ? { trendMomentumUnavailableReason: "history_unavailable" as const } : {}) },
      evidenceCandles: current,
      marketSessionSetVersionId: sessionVersionId, now: completedAt, scope: job.scope,
      status: "ready", target: job.target,
    });
    const refreshAt = postSessionReconciliationAt(session);
    if (startedAt < refreshAt) {
      this.logical.schedulePostSessionRefresh(job.jobId, refreshAt, this.now());
    } else {
      this.logical.finish(job.jobId, "completed", completedAt);
    }
    this.notifications?.notifyReady({ occurredAt: completedAt, scope: job.scope, target: job.target });
    return true;
  }
}
