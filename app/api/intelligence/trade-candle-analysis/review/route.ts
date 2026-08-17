import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import type { CandleReviewRecord } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import { CandleReviewRepository } from "@/src/modules/level-analysis/server/candle-review-repository";
import { CandleReviewService } from "@/src/modules/level-analysis/server/candle-review-service";
import { YahooChartMarketDataProvider } from "@/src/modules/level-analysis/server/providers/yahoo-chart-market-data-provider";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isCanonicalUuidV4,
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { reportCandleReviewRecord } from
  "@/src/modules/level-analysis/server/candle-review-reporting";
import { withJournalAnalyticsReportingDashboardRuntime } from
  "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function unavailable(message: string, status = 422): Response {
  return Response.json({ ok: false, message }, { status });
}

function responseFor(
  record: CandleReviewRecord,
  currency: string,
  reused: boolean,
): Response {
  return Response.json({ currency, ok: true, record, reused });
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return unavailable("Choose a completed trade to analyze.", 400);
  }
  const value = body && typeof body === "object" && !Array.isArray(body)
    ? body as Record<string, unknown>
    : {};
  const roundTripId = value.roundTripId;
  const expectedAccountSelectionRef = value.expectedAccountSelectionRef;
  if (
    typeof roundTripId !== "string" || !isCanonicalUuidV4(roundTripId) ||
    typeof expectedAccountSelectionRef !== "string"
  ) {
    return unavailable("Choose a completed trade to analyze.", 400);
  }

  let database: ReturnType<typeof openPlatformDatabase> | null = null;
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    requireExpectedJournalAccountSelection(scope, expectedAccountSelectionRef);
    if (!scope.activeAccountId) return unavailable("Select a Journal account.", 409);
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    database = openPlatformDatabase({ mode: "runtime" });
    const result = await new CandleReviewService(
      new CandleReviewRepository(database),
      new YahooChartMarketDataProvider(),
    ).run(accountScope, roundTripId);
    database.close();
    database = null;
    const reported = await withJournalAnalyticsReportingDashboardRuntime(
      scope,
      ({ reportingContext, reportingCurrency }) => Object.freeze({
        currency: reportingCurrency,
        record: reportCandleReviewRecord(result.record, reportingContext),
      }),
    );
    return responseFor(reported.record, reported.currency, result.reused);
  } catch (error) {
    if (isTraderLinkPlatformError(error)) {
      if (error.code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT") {
        return unavailable("The selected Journal account changed. Refresh before analyzing.", 409);
      }
      if (error.code === "TRADERLINK_CANDLE_REVIEW_INVALID") {
        return unavailable("That completed trade is not available for candle review.", 404);
      }
      if (error.code === "TRADERLINK_CANDLE_REVIEW_CONFLICT") {
        return unavailable("The trade changed while the candles were requested. Refresh and try again.", 409);
      }
    }
    return unavailable("The candle review could not be completed or saved. Try again shortly.", 503);
  } finally {
    database?.close();
  }
}
