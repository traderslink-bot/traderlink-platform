import { SharedAnalyzerAllowanceRepository } from "@/src/modules/level-analysis/server/shared-analyzer-allowance-repository";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const availability = withReadonlyPlatformDatabase({}, (database) => {
      const allowances = new SharedAnalyzerAllowanceRepository(database);
      return allowances.isDemo(account) ? null : allowances.availability(scope.userId);
    });
    return Response.json({ status: "ready", availability });
  } catch (error) {
    console.error("[daily-trade-analyzer/allowance] Failed to read Analyzer availability.", error);
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Response.json({ status: "unavailable", code }, {
      status: 400,
      headers: { "cache-control": "no-store" },
    });
  }
}
