import {
  parseJournalManualTradeEntries,
  parseJournalManualTrackerKind,
  parseJournalManualWorkspaceStyle,
  requireJsonRecord,
} from "@/src/modules/journal/server/manual-trades/journal-manual-trade-input";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
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
    const body = requireJsonRecord(await request.json(), "workspaceTradePreview");
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    if (parseJournalManualTrackerKind(body.tracker) !== "workspace") {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }
    const entries = parseJournalManualTradeEntries(body.entries);
    const workspaceStyle = parseJournalManualWorkspaceStyle(body.workspaceStyle);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const preview = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.manualTradePreviews.preview(scope, {
        accountSelectionRef,
        entries,
        tracker: "workspace",
        workspaceStyle,
      }));
    return Response.json({ status: "ready", preview });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID";
    return Response.json({ status: "unavailable", code }, { status: 400 });
  }
}
