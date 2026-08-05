import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { parseJournalManualTradeCommitRequest } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-input";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import {
  isTraderLinkPlatformError,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("CONFLICT")) return 409;
  return 400;
}

export async function POST(request: Request): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const commitRequest = parseJournalManualTradeCommitRequest(await request.json());
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      scope,
      commitRequest.expectedAccountSelectionRef,
    );
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.manualTrades.commit(scope, accountSelectionRef, commitRequest));
    return Response.json({
      status: "ready",
      result: {
        importStatus: result.status,
        acceptedExecutionCount: result.executionIds.length,
        createdExecutionCount: result.createdExecutionCount,
        matchedExecutionCount: result.matchedExecutionCount,
        pendingDecisionCount: result.relatedDecisionIds.length,
        rebuildCount: result.rebuilds.length,
        styledTradeCount: result.styledTradeCount,
        affectedDates: result.affectedDates,
        affectedPositionRefs: result.affectedPositionRefs,
      },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
