import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalLogicalTradeService } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-service";
import type { SharedAnalyzerAvailability, SharedAnalyzerSelectionOutcome } from "../contracts/shared-analyzer-beta-contracts";
import { dailyTradeFirstResultCoverageEnd, newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import type { TrendMomentumHistoryRepository } from "./trend-momentum-history-repository";
import { hasCurrentTradeIndicatorContext } from "@/src/lib/trade-candle-analysis/trend-momentum-version";

export class LogicalTradeAnalyzerSelectionService {
  constructor(
    private readonly logicalTrades: JournalLogicalTradeService,
    private readonly analyzer: LogicalTradeAnalyzerRepository,
    private readonly allowances: SharedAnalyzerAllowanceRepository,
    private readonly indicatorHistory?: TrendMomentumHistoryRepository,
  ) {}

  availability(scope: AccountScope, now: Date = new Date()): SharedAnalyzerAvailability | null {
    return this.allowances.isDemo(scope) ? null : this.allowances.availability(scope.userId, now);
  }

  materialize(scope: AccountScope, roundTripId: string, now: Date = new Date()): void {
    this.logicalTrades.ensureMaterialized(scope, roundTripId, now);
  }

  select(
    scope: AccountScope,
    roundTripId: string,
    now: Date = new Date(),
    options: Readonly<{ refreshIndicators?: boolean }> = {},
  ): SharedAnalyzerSelectionOutcome {
    if (this.allowances.isDemo(scope)) return "demo_unavailable";
    return this.allowances.immediate(() => {
      const trade = this.logicalTrades.ensureMaterialized(scope, roundTripId, now);
      const target = this.analyzer.target(scope, trade);
      if (!target) return "not_eligible";
      const saved = options.refreshIndicators
        ? this.analyzer.readCurrentByRoundTrip(scope, roundTripId) : null;
      const refreshCompleted = Boolean(saved?.status === "ready" &&
        saved.analyzed && !hasCurrentTradeIndicatorContext(saved.analyzed.trendMomentum));
      if (this.analyzer.alreadyRequested(scope, target.logicalTradeVersionId, refreshCompleted)) return "already_requested";
      const availability = this.allowances.availability(scope.userId, now);
      if (!availability.enabled) return "disabled";
      const session = newYorkExtendedSession(target.tradingDateNewYork);
      const desiredEnd = session
        ? dailyTradeFirstResultCoverageEnd(session, target.finalExitAtUtc)
        : null;
      if (desiredEnd === null) return "not_eligible";
      const savedCoverage = this.analyzer.hasSavedCoverage(target, new Date(desiredEnd * 1000).toISOString());
      const retry = this.analyzer.hasPriorAnalysis(scope, target.logicalTradeId);
      const savedIndicators = savedCoverage && (!this.indicatorHistory ||
        this.indicatorHistory.hasSufficientEvidence(scope, target.providerSymbol, target.tradingDateNewYork,
          Math.min(...target.events.map((event) => Date.parse(event.executedAtUtc) / 1000)), desiredEnd));
      if (!savedCoverage && !retry && availability.selectableAvailable <= 0) return "usage_exhausted";
      if (retry && !savedIndicators && !this.allowances.manualRetryAvailable(scope, target.logicalTradeId, now)) return "retry_limit_reached";
      const queued = this.analyzer.queue({
        scope,
        target,
        desiredCoverageEndUtc: new Date(desiredEnd * 1000).toISOString(),
        now,
        retryTerminal: true,
        refreshCompleted,
      });
      if (!queued.created) return "already_requested";
      // Core-only cached recomputation remains usable when no allowance is left.
      // An explicit Analyze with available allowance can acquire missing history.
      if (savedIndicators || (!retry && savedCoverage && availability.selectableAvailable <= 0)) return "queued";
      if (retry) {
        if (!this.allowances.recordManualRetry(scope, queued.jobId, now)) throw new Error("manual_retry_reservation_failed");
        return "queued";
      }
      const reservation = this.allowances.reserve({ userId: scope.userId, jobId: queued.jobId, now });
      if (!reservation) {
        if (savedCoverage) return "queued";
        this.analyzer.expireUnreservedJob(queued.jobId, now);
        return "usage_exhausted";
      }
      return "queued";
    });
  }

  afterJournalRebuild(
    scope: AccountScope,
    affectedRoundTripIds: readonly string[],
    now: Date = new Date(),
  ): readonly string[] {
    if (this.allowances.isDemo(scope)) return Object.freeze([]);
    return this.allowances.immediate(() => {
      const refresh = this.logicalTrades.refreshAfterJournalRebuild(scope, affectedRoundTripIds, now);
      const queued: string[] = [];
      for (const trade of refresh.refreshed) {
        if (!trade.logicalTradeId) continue;
        const target = this.analyzer.target(scope, trade);
        if (!target || this.analyzer.alreadyRequested(scope, target.logicalTradeVersionId)) continue;
        if (!this.analyzer.hasPriorAnalysis(scope, trade.logicalTradeId)) continue;
        // A corrected version follows the same stable-trade retry cap as Analyze.
        // Preserve old correction-opportunity evidence without minting waiver chains.
        if (this.select(scope, target.representativeRoundTripId, now) === "queued") queued.push(trade.logicalTradeId);
      }
      return Object.freeze(queued);
    });
  }
}
