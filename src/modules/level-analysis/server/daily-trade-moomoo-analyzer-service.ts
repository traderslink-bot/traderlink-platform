import "server-only";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import type { DailyTradeAnalyzerQueueOutcome } from "../contracts/daily-trade-analyzer-contracts";

import {
  DailyTradeAnalyzerRepository,
  type DailyTradeMarketDataProviderIdentity,
} from "./daily-trade-analyzer-repository";
import {
  dailyTradeFirstResultCoverageEnd,
  newYorkExtendedSession,
} from "./daily-trade-analyzer-session";
import { isMoomooMarketDataReady } from "./moomoo-market-data-access";

const ONE_MINUTE_RETENTION_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
const MOOMOO_DAILY_TRADE_PROVIDER: DailyTradeMarketDataProviderIdentity = Object.freeze({
  key: "moomoo_history_kline",
  adapterVersion: "moomoo_history_kline_v1",
});

export type DailyTradeAnalyzerQueueResult = Readonly<{
  outcome: DailyTradeAnalyzerQueueOutcome;
  queuedRoundTripIds: readonly string[];
}>;

function workspaceScope(scope: AccountScope): WorkspaceAccessScope {
  return Object.freeze({
    userId: scope.userId,
    workspaceId: scope.workspaceId,
    workspaceRole: scope.workspaceRole,
    allowedAccountIds: Object.freeze([scope.accountId]),
    activeAccountId: scope.accountId,
  });
}

/** Queues market-data work only after a closed Journal round trip is committed. */
export class DailyTradeMoomooAnalyzerService {
  constructor(
    private readonly repository: DailyTradeAnalyzerRepository,
    private readonly connections: MoomooConnectionRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  queueAfterJournalRebuild(scope: AccountScope, roundTripIds: readonly string[]): readonly string[] {
    return this.queueAfterJournalRebuildWithOutcome(scope, roundTripIds).queuedRoundTripIds;
  }

  queueAfterJournalRebuildWithOutcome(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): DailyTradeAnalyzerQueueResult {
    const now = this.now();
    const eligibleTargets: Array<Readonly<{
      desiredCoverageEndUtc: string;
      target: NonNullable<ReturnType<DailyTradeAnalyzerRepository["findEligibleTarget"]>>;
    }>> = [];
    for (const roundTripId of [...new Set(roundTripIds)]) {
      if (this.repository.currentAnalysisMatchesProjection(scope, roundTripId)) {
        continue;
      }
      const target = this.repository.findEligibleTarget(scope, roundTripId);
      if (!target) continue;
      const finalExitMilliseconds = Date.parse(target.finalExitAtUtc);
      if (!Number.isFinite(finalExitMilliseconds) || now.getTime() - finalExitMilliseconds >= ONE_MINUTE_RETENTION_MILLISECONDS) {
        continue;
      }
      const session = newYorkExtendedSession(target.tradingDateNewYork);
      if (!session) continue;
      const desiredCoverageEnd = dailyTradeFirstResultCoverageEnd(session, target.finalExitAtUtc);
      if (desiredCoverageEnd === null) continue;
      const desiredCoverageEndUtc = new Date(desiredCoverageEnd * 1000).toISOString();
      eligibleTargets.push(Object.freeze({ desiredCoverageEndUtc, target }));
    }
    if (eligibleTargets.length === 0) {
      return Object.freeze({
        outcome: "not_eligible",
        queuedRoundTripIds: Object.freeze([]),
      });
    }
    const connection = this.connections.find(workspaceScope(scope));
    if (!isMoomooMarketDataReady(connection)) {
      return Object.freeze({
        outcome: "connection_required",
        queuedRoundTripIds: Object.freeze([]),
      });
    }
    const queued: string[] = [];
    for (const { desiredCoverageEndUtc, target } of eligibleTargets) {
      this.repository.queueTarget({
        scope,
        target,
        provider: MOOMOO_DAILY_TRADE_PROVIDER,
        desiredCoverageEndUtc,
        now,
      });
      queued.push(target.roundTripId);
    }
    const queuedRoundTripIds = Object.freeze(queued);
    return Object.freeze({
      outcome: "queued",
      queuedRoundTripIds,
    });
  }
}
