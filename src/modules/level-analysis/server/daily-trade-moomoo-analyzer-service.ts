import "server-only";

import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";

import {
  DailyTradeAnalyzerRepository,
  type DailyTradeMarketDataProviderIdentity,
} from "./daily-trade-analyzer-repository";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";

const ONE_MINUTE_RETENTION_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
const FINAL_EXIT_FOLLOW_UP_SECONDS = 60 * 60;
const MOOMOO_DAILY_TRADE_PROVIDER: DailyTradeMarketDataProviderIdentity = Object.freeze({
  key: "moomoo_history_kline",
  adapterVersion: "moomoo_history_kline_v1",
});

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
    const connection = this.connections.find(workspaceScope(scope));
    if (
      !connection || connection.state !== "active" ||
      !connection.authorizedScopes.includes("quote:read")
    ) return Object.freeze([]);
    const now = this.now();
    const queued: string[] = [];
    for (const roundTripId of [...new Set(roundTripIds)]) {
      const target = this.repository.findEligibleTarget(scope, roundTripId);
      if (!target) continue;
      const finalExitMilliseconds = Date.parse(target.finalExitAtUtc);
      if (!Number.isFinite(finalExitMilliseconds) || now.getTime() - finalExitMilliseconds >= ONE_MINUTE_RETENTION_MILLISECONDS) {
        continue;
      }
      const session = newYorkExtendedSession(target.tradingDateNewYork);
      if (!session) continue;
      const desiredCoverageEndUtc = new Date(Math.min(
        session.endTime,
        Math.floor(finalExitMilliseconds / 1000) + FINAL_EXIT_FOLLOW_UP_SECONDS,
      ) * 1000).toISOString();
      this.repository.queueTarget({
        scope,
        target,
        provider: MOOMOO_DAILY_TRADE_PROVIDER,
        desiredCoverageEndUtc,
        now,
      });
      queued.push(target.roundTripId);
    }
    return Object.freeze(queued);
  }
}
