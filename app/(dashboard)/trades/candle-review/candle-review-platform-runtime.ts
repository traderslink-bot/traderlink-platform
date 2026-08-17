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
import { reportCandleReviewPageModel } from "@/src/modules/level-analysis/server/candle-review-reporting";
import { withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

export async function readCandleReviewPageModel(
  scope: WorkspaceAccessScope,
  roundTripId: string,
): Promise<(CandleReviewPageModel & Readonly<{ currency: string }>) | null> {
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
  return withJournalAnalyticsReportingDashboardRuntime(
    scope,
    ({ reportingContext, reportingCurrency }) => {
      const model = withReadonlyPlatformDatabase({}, (database) =>
        new CandleReviewService(
          new CandleReviewRepository(database),
          new YahooChartMarketDataProvider(),
        ).pageModel(accountScope, roundTripId,
          currentJournalAccountSelectionRef(scope)));
      return model
        ? Object.freeze({
            ...reportCandleReviewPageModel(model, reportingContext),
            currency: reportingCurrency,
          })
        : null;
    },
  );
}
