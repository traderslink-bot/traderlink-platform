import { chartJournalAccountHeader, type ChartJournalSession } from "@/src/modules/journal/contracts/journal-chart-contracts";
import { chartJournalDay, chartJournalSymbol, readChartJournal, readChartJournalPlot, saveChartJournalItem } from "@/src/modules/journal/server/chart/journal-chart-service";
import { createJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { currentPlatformOfflineScopeRef } from "@/src/modules/platform/server/authentication/platform-offline-scope-authorization";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { membershipFeatureDeniedResponse } from "@/src/modules/platform/server/membership/platform-membership-access";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const headers = { "Cache-Control": "private, no-store" };

function requestScope(request: Request) {
  const scope = requireTraderLinkPlatformRequestScope(request.headers, { membershipFeatures: ["journal.access"] });
  requireExpectedJournalAccountSelection(scope, request.headers.get(chartJournalAccountHeader));
  if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  return { scope, account: narrowWorkspaceAccessToAccount(scope, scope.activeAccountId) };
}

function failure(error: unknown) {
  const denial = membershipFeatureDeniedResponse(error);
  if (denial) return denial;
  const code = isTraderLinkPlatformError(error) ? error.code : "CHART_JOURNAL_UNAVAILABLE";
  const status = code.includes("CONFLICT") ? 409 : code.includes("DENIED") ? 403 :
    code === "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED" ? 400 : 503;
  return Response.json({ status: "unavailable" }, { status, headers });
}

export async function GET(request: Request) {
  try {
    const { scope, account } = requestScope(request);
    const query = new URL(request.url).searchParams;
    const symbol = chartJournalSymbol(query.get("symbol"));
    const { day } = chartJournalDay(query.get("day"));
    const mode = query.get("plot");
    if (mode !== null) {
      if (mode !== "fills" && mode !== "notes" && mode !== "both") {
        platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "plot" });
      }
      const plot = withReadonlyPlatformDatabase({}, database => readChartJournalPlot(database, account, { symbol, day, mode }));
      return Response.json({ status: "ready", plot }, { headers });
    }
    const page = Number(query.get("page") ?? 0);
    if (!Number.isSafeInteger(page) || page < 0 || page > Math.floor(Number.MAX_SAFE_INTEGER / 250)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "page" });
    }
    const session = withReadonlyPlatformDatabase({}, (database): ChartJournalSession => {
      const configuration = database.prepare(`SELECT display_name, base_currency, trading_timezone
        FROM journal_accounts WHERE workspace_id = ? AND account_id = ? AND status = 'active'`)
        .get(account.workspaceId, account.accountId) as { display_name: string; base_currency: string; trading_timezone: string } | undefined;
      if (!configuration) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      const runtime = createJournalIntegrityRuntime(database);
      return {
        ...readChartJournal(database, account, { symbol, day, page }, (target) => runtime.manualTradePreviews.positionRefForTarget(scope, target)),
        accountName: configuration.display_name, accountCurrency: configuration.base_currency,
        accountTimezone: configuration.trading_timezone, offlineScopeRef: currentPlatformOfflineScopeRef(scope),
        dayReview: runtime.tradingDayReviews.read(account, day),
      };
    });
    return Response.json({ status: "ready", session }, { headers });
  } catch (error) {
    return failure(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireJournalMutationRequest(request);
    const { account } = requestScope(request);
    const input: unknown = await request.json();
    const item = withPlatformDatabase({ mode: "runtime" }, (database) => saveChartJournalItem(database, account, input));
    return Response.json({ status: "ready", item }, { headers });
  } catch (error) {
    return failure(error);
  }
}
