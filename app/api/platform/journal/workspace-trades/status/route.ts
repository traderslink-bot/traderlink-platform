import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { parseJournalManualTradeCommitStatusRequest } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-input";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const statusRequest = parseJournalManualTradeCommitStatusRequest(await request.json());
    if (statusRequest.tracker !== "workspace" || statusRequest.workspaceStyle === undefined) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      scope,
      statusRequest.expectedAccountSelectionRef,
    );
    const result = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.manualTrades.committedStatus(scope, accountSelectionRef, statusRequest));
    return Response.json({ status: "ready", result });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT";
    return Response.json({ status: "unavailable", code }, { status: 400 });
  }
}
