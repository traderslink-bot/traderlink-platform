import { JournalDemoAccountRepository } from "@/src/modules/journal/server/demo/journal-demo-account-repository";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("REQUIRES_DECISION") || code.includes("CONFLICT")) return 409;
  return 400;
}

export async function GET(request: Request, context: { params: Promise<{ tradeDeleteRef: string }> }): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    if (withReadonlyPlatformDatabase({}, (database) =>
      new JournalDemoAccountRepository(database).findActiveAccount(scope) !== null)) {
      return Response.json({ code: "TRADERLINK_DEMO_ACCOUNT_READ_ONLY", status: "unavailable" }, { status: 403 });
    }
    const { tradeDeleteRef: roundTripId } = await context.params;
    const snapshot = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.workspaceTradeEdits.snapshot(journal.tradeStyles.accountScope(scope), roundTripId));
    return Response.json({ status: "ready", snapshot });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID";
    return Response.json({ status: "unavailable", code }, { status: responseStatus(code) });
  }
}
