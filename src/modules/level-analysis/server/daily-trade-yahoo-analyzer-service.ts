import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";

import {
  DailyTradeAnalyzerRepository,
  type DailyTradeMarketDataProviderIdentity,
} from "./daily-trade-analyzer-repository";
import { newYorkExtendedSession } from "./daily-trade-analyzer-session";
import { dailyTradeYahooAnalyzerEnabled } from "./daily-trade-analyzer-feature";

const ONE_MINUTE_RETENTION_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;
const FINAL_EXIT_FOLLOW_UP_SECONDS = 60 * 60;
const YAHOO_DAILY_TRADE_PROVIDER: DailyTradeMarketDataProviderIdentity = Object.freeze({
  key: "yahoo_chart",
  adapterVersion: "yahoo_chart_v1",
});

/**
 * Creates durable work only. It deliberately does not request Yahoo while a
 * Journal execution transaction is open, so a provider delay or outage can
 * never make a trader's execution save fail.
 */
export class DailyTradeYahooAnalyzerService {
  constructor(
    private readonly repository: DailyTradeAnalyzerRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  queueAfterJournalRebuild(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): readonly string[] {
    if (!dailyTradeYahooAnalyzerEnabled()) return Object.freeze([]);
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
        provider: YAHOO_DAILY_TRADE_PROVIDER,
        desiredCoverageEndUtc,
        now,
      });
      queued.push(target.roundTripId);
    }
    return Object.freeze(queued);
  }
}
