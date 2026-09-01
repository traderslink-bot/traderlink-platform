import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { parseJournalWorkspaceTradeEditDraft } from "@/src/modules/journal/server/manual-trades/journal-workspace-trade-edit-input";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("REQUIRES_DECISION") || code.includes("CONFLICT")) return 409;
  return 400;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ roundTripId: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const { roundTripId } = await context.params;
    const draft = parseJournalWorkspaceTradeEditDraft(await request.json());
    const preview = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.workspaceTradeEdits.preview(scope, roundTripId, draft));
    return Response.json({ status: "ready", preview });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID";
    return Response.json({ status: "unavailable", code }, { status: responseStatus(code) });
  }
}
