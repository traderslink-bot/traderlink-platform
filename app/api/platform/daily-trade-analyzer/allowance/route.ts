import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const availability = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.logicalTradeAnalyzer.availability(journal.tradeStyles.accountScope(scope)));
    return Response.json({ status: "ready", availability });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED";
    return Response.json({ status: "unavailable", code }, { status: 400 });
  }
}
