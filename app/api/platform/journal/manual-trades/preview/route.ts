import {
  assertJournalManualTrackerEntryDates,
  parseJournalManualTrackerKind,
  parseJournalManualTradeEntries,
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

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (
    code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT" ||
    code === "TRADERLINK_MANUAL_TRADE_RELATIONSHIP_CONFLICT"
  ) return 409;
  return 400;
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = requireJsonRecord(await request.json(), "manualTradePreview");
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const tracker = parseJournalManualTrackerKind(body.tracker);
    const entries = parseJournalManualTradeEntries(body.entries);
    assertJournalManualTrackerEntryDates(tracker, entries);
    if (!scope.activeAccountId) {
      platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    }
    const preview = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.manualTradePreviews.preview(scope, {
        accountSelectionRef,
        tracker,
        entries,
      }));
    return Response.json({ status: "ready", preview });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
