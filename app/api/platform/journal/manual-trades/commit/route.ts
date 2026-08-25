import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { parseJournalManualTradeCommitRequest } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-input";
import { recordJournalManualEntryFailure } from "@/src/modules/journal/server/manual-trades/journal-manual-entry-failure-service";
import type { JournalManualTradeCommitRequest } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
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
  let scope: WorkspaceAccessScope | null = null;
  let commitRequest: JournalManualTradeCommitRequest | null = null;
  try {
    requireJournalMutationRequest(request);
    const requestScope = requireTraderLinkPlatformRequestScope(request.headers);
    scope = requestScope;
    const parsedCommitRequest = parseJournalManualTradeCommitRequest(await request.json());
    commitRequest = parsedCommitRequest;
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      requestScope,
      parsedCommitRequest.expectedAccountSelectionRef,
    );
    const result = withWritableJournalIntegrityRuntime(requestScope, (journal) =>
      journal.manualTrades.commit(requestScope, accountSelectionRef, parsedCommitRequest));
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
    if (scope && commitRequest) {
      try {
        recordJournalManualEntryFailure({
          error,
          idempotencyKey: commitRequest.idempotencyKey,
          scope,
          tracker: commitRequest.tracker,
        });
      } catch {
        // Preserve the original save response if private issue logging is unavailable.
      }
    }
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
