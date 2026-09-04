import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { JournalLogicalTradeService } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-service";
import type { SharedAnalyzerAvailability, SharedAnalyzerSelectionOutcome } from "../contracts/shared-analyzer-beta-contracts";
import { dailyTradeFirstResultCoverageEnd, newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";

export class LogicalTradeAnalyzerSelectionService {
  constructor(
    private readonly logicalTrades: JournalLogicalTradeService,
    private readonly analyzer: LogicalTradeAnalyzerRepository,
    private readonly allowances: SharedAnalyzerAllowanceRepository,
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
  ): SharedAnalyzerSelectionOutcome {
    if (this.allowances.isDemo(scope)) return "demo_unavailable";
    return this.allowances.immediate(() => {
      const trade = this.logicalTrades.ensureMaterialized(scope, roundTripId, now);
      const target = this.analyzer.target(scope, trade);
      if (!target) return "not_eligible";
      if (this.analyzer.alreadyRequested(scope, target.logicalTradeVersionId)) return "already_requested";
      const availability = this.allowances.availability(scope.userId, now);
      if (!availability.enabled) return "disabled";
      if (availability.selectableAvailable <= 0) return "usage_exhausted";
      const session = newYorkExtendedSession(target.tradingDateNewYork);
      const desiredEnd = session
        ? dailyTradeFirstResultCoverageEnd(session, target.finalExitAtUtc)
        : null;
      if (desiredEnd === null) return "not_eligible";
      const queued = this.analyzer.queue({
        scope,
        target,
        desiredCoverageEndUtc: new Date(desiredEnd * 1000).toISOString(),
        now,
      });
      if (!queued.created) return "already_requested";
      const reservation = this.allowances.reserve({ userId: scope.userId, jobId: queued.jobId, now });
      if (!reservation) {
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
        if (!trade.logicalTradeId || !this.allowances.hasAvailableCorrection(trade.logicalTradeId)) continue;
        const target = this.analyzer.target(scope, trade);
        if (!target || this.analyzer.alreadyRequested(scope, target.logicalTradeVersionId)) continue;
        const session = newYorkExtendedSession(target.tradingDateNewYork);
        const desiredEnd = session ? dailyTradeFirstResultCoverageEnd(session, target.finalExitAtUtc) : null;
        if (desiredEnd === null) continue;
        const job = this.analyzer.queue({
          scope,
          target,
          desiredCoverageEndUtc: new Date(desiredEnd * 1000).toISOString(),
          now,
        });
        if (!job.created) continue;
        if (!this.allowances.claimCorrection({
          logicalTradeId: trade.logicalTradeId,
          jobId: job.jobId,
          userId: scope.userId,
          now,
        })) {
          this.analyzer.expireUnreservedJob(job.jobId, now);
          continue;
        }
        queued.push(trade.logicalTradeId);
      }
      return Object.freeze(queued);
    });
  }
}
