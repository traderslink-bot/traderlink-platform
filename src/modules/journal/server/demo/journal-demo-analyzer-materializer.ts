import type Database from "better-sqlite3";

import { analyzeDailyTrade } from "@/src/modules/level-analysis/server/daily-trade-analyzer";
import {
  DailyTradeAnalyzerRepository,
  type DailyTradeAnalyzerTarget,
} from "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import { newYorkExtendedSession } from "@/src/modules/level-analysis/server/daily-trade-analyzer-session";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { JournalDemoFinancialPackSource, JournalDemoVerifiedMarketDaysInput } from "./journal-demo-financial-pack-source";

const MOOMOO_DAILY_TRADE_PROVIDER = Object.freeze({
  adapterVersion: "moomoo_history_kline_v1",
  key: "moomoo_history_kline",
});

function failure(field: string): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

/** Creates normal immutable Analyzer revisions with no provider, queue, or job. */
export function materializeJournalDemoAnalyzerFacts(input: Readonly<{
  accountId: string;
  createdForUserId: string;
  database: Database.Database;
  source: JournalDemoFinancialPackSource;
  verifiedMarketDays: JournalDemoVerifiedMarketDaysInput;
  workspaceId: string;
}>): void {
  const scope: AccountScope = Object.freeze({
    accountId: input.accountId,
    userId: input.createdForUserId,
    workspaceId: input.workspaceId,
    workspaceRole: "owner",
  });
  const sessions = new Map(input.verifiedMarketDays.sessions.map((session) => [
    `${session.date}:${session.symbol}`, session,
  ]));
  const repository = new DailyTradeAnalyzerRepository(input.database);
  const now = new Date();
  const sessionVersions = new Map<string, string>();
  for (const trade of input.source.trades) {
    const sessionKey = `${trade.tradingDateNewYork}:${trade.symbol}`;
    const session = sessions.get(sessionKey);
    const schedule = newYorkExtendedSession(trade.tradingDateNewYork);
    if (!session || !schedule) failure("demoAnalyzerMarketSession");
    const rows = input.database.prepare<[string, string, string], { round_trip_id: string }>(`SELECT round_trip.round_trip_id
FROM journal_round_trips round_trip
JOIN journal_round_trip_versions version ON version.round_trip_version_id = round_trip.current_version_id
WHERE round_trip.workspace_id = ? AND round_trip.account_id = ? AND version.opened_at_utc = ?
  AND version.projection_state = 'ready_closed'
ORDER BY round_trip.round_trip_id`).all(
      input.workspaceId, input.accountId, trade.executions[0]?.executedAtUtc ?? "",
    );
    if (rows.length !== 1 || !rows[0]) failure("demoAnalyzerRoundTrip");
    const target: DailyTradeAnalyzerTarget | null = repository.findEligibleTarget(scope, rows[0].round_trip_id);
    if (!target || target.direction !== "long" || target.providerSymbol !== trade.symbol ||
      target.tradingDateNewYork !== trade.tradingDateNewYork) failure("demoAnalyzerTarget");
    let sessionVersionId = sessionVersions.get(sessionKey);
    if (!sessionVersionId) {
      sessionVersionId = repository.materializeVerifiedSession({
        candles: session.bars,
        completedAtUtc: now.toISOString(),
        coverageEndUtc: new Date(schedule.endTime * 1000).toISOString(),
        provider: MOOMOO_DAILY_TRADE_PROVIDER,
        providerExchangeTimezone: "America/New_York",
        providerUtcOffsetSeconds: -14_400,
        requestedEndUtc: new Date(schedule.endTime * 1000).toISOString(),
        requestedStartUtc: new Date(schedule.startTime * 1000).toISOString(),
        sha256: session.normalizedBarsSha256,
        target,
      });
      sessionVersions.set(sessionKey, sessionVersionId);
    }
    repository.persistAnalysis({
      analyzed: analyzeDailyTrade({ candles: session.bars, dailyRanges: [], direction: target.direction, events: target.events }),
      marketSessionSetVersionId: sessionVersionId,
      now,
      scope,
      status: "ready",
      target,
    });
  }
}
