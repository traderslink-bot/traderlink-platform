import "server-only";

import { MoomooConnectionAccessService } from "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service";
import { MoomooConnectionRepository } from "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";

import { DailyTradeAnalyzerRepository } from "./daily-trade-analyzer-repository";
import { MoomooDailyTradeKlineMarketDataProvider } from "./providers/moomoo-daily-trade-kline-market-data-provider";
import { LogicalTradeAnalyzerRepository } from "./logical-trade-analyzer-repository";
import { LogicalTradeMoomooAnalyzerWorker } from "./logical-trade-moomoo-analyzer-worker";
import { SharedAnalyzerAllowanceRepository } from "./shared-analyzer-allowance-repository";
import { LogicalTradeAnalyzerNotificationService } from "./logical-trade-analyzer-notification-service";

/** Runs one account-isolated Trade Analyzer job inside the sole Platform process. */
export async function runDailyTradeAnalyzerOnce(): Promise<boolean> {
  const database = openPlatformDatabase({ mode: "runtime" });
  try {
    const connections = new MoomooConnectionRepository(database);
    const allowances = new SharedAnalyzerAllowanceRepository(database);
    const providerFor = async (scope: import("@/src/modules/platform/contracts/workspace-access-scope").AccountScope) => {
      const accessToken = await new MoomooConnectionAccessService(connections).accessToken({
        ...scope,
        allowedAccountIds: [scope.accountId],
        activeAccountId: scope.accountId,
      });
      return new MoomooDailyTradeKlineMarketDataProvider(() => Promise.resolve(accessToken));
    };
    const dailyRepository = new DailyTradeAnalyzerRepository(database);
    const logicalRan = await new LogicalTradeMoomooAnalyzerWorker(
      new LogicalTradeAnalyzerRepository(database), dailyRepository, allowances, providerFor,
      new LogicalTradeAnalyzerNotificationService(database),
    ).runOne();
    return logicalRan;
  } finally {
    database.close();
  }
}
