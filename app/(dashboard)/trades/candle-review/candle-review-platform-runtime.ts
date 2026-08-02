import "server-only";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { currentJournalAccountSelectionRef } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import type { CandleReviewPageModel } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { CandleReviewRepository } from "@/src/modules/level-analysis/server/candle-review-repository";
import { CandleReviewService } from "@/src/modules/level-analysis/server/candle-review-service";
import { YahooChartMarketDataProvider } from "@/src/modules/level-analysis/server/providers/yahoo-chart-market-data-provider";

export function readCandleReviewPageModel(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): CandleReviewPageModel | null {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
  return withReadonlyPlatformDatabase({}, (database) =>
    new CandleReviewService(
      new CandleReviewRepository(database),
      new YahooChartMarketDataProvider(),
    ).pageModel(accountScope, roundTripId,
      currentJournalAccountSelectionRef(scope)));
}
