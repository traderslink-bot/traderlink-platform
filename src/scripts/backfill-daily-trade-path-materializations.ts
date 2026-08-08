import { loadTraderLinkPlatformLocalDevelopmentConfiguration } from "@/src/modules/platform/server/authentication/local-development-configuration";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import {
  backfillCurrentDailyTradePathMaterializations,
  type DailyTradePathBackfillCursor,
} from "@/src/modules/level-analysis/server/daily-trade-path-backfill-service";

loadTraderLinkPlatformLocalDevelopmentConfiguration({
  repositoryRoot: process.cwd(),
});

const database = openPlatformDatabase({ mode: "runtime" });
try {
  let cursor: DailyTradePathBackfillCursor | null = null;
  let materialized = 0;
  let scanned = 0;
  let skipped = 0;
  do {
    const result = backfillCurrentDailyTradePathMaterializations(database, {
      batchSize: 100,
      cursor,
    });
    materialized += result.materialized;
    scanned += result.scanned;
    skipped += result.skipped;
    cursor = result.nextCursor;
  } while (cursor);
  process.stdout.write(`${JSON.stringify({ materialized, scanned, skipped })}\n`);
} finally {
  database.close();
}
