import "server-only";

import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

import { DailyTradeAnalyzerNotificationService } from "./daily-trade-analyzer-notification-service";
import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { DailyTradeMoomooAnalyzerWorker } from "./daily-trade-yahoo-analyzer-worker";
import { MoomooDailyTradeKlineMarketDataProvider } from "./providers/moomoo-daily-trade-kline-market-data-provider";

/** Runs one account-isolated Trade Analyzer job inside the sole Platform process. */
export async function runDailyTradeAnalyzerOnce(): Promise<boolean> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const connections = new MoomooConnectionRepository(database);
    return await new DailyTradeMoomooAnalyzerWorker(
      new DailyTradeAnalyzerRepository(database),
      (scope) => new MoomooDailyTradeKlineMarketDataProvider(
        () => new MoomooConnectionAccessService(connections).accessToken({
          ...scope,
          allowedAccountIds: [scope.accountId],
          activeAccountId: scope.accountId,
        }),
      ),
      undefined,
      new DailyTradeAnalyzerNotificationService(database),
    ).runOne();
  } finally {
    database.close();
  }
}
