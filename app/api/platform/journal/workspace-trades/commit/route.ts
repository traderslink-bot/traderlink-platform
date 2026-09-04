import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
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
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  readWorkspaceTradeLibrarySavedTrade,
  readWorkspaceTradeLibrarySavedTrades,
} from "@/app/(dashboard)/workspace/workspace-trade-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  let scope: WorkspaceAccessScope | null = null;
  let commitRequest: JournalManualTradeCommitRequest | null = null;
  try {
    requireJournalMutationRequest(request);
    const requestScope = requireTraderLinkPlatformRequestScope(request.headers);
    scope = requestScope;
    const parsed = parseJournalManualTradeCommitRequest(await request.json());
    if (parsed.tracker !== "workspace" || parsed.workspaceStyle === undefined) {
      platformFailure("TRADERLINK_MANUAL_TRADE_PREVIEW_INVALID");
    }
    commitRequest = parsed;
    const accountSelectionRef = requireExpectedJournalAccountSelection(
      requestScope,
      parsed.expectedAccountSelectionRef,
    );
    const result = withWritableJournalIntegrityRuntime(requestScope, (journal) =>
      journal.manualTrades.commit(requestScope, accountSelectionRef, parsed));
    const affectedTradeRefs = result.affectedPositionRefs;
    const savedTrade = result.affectedTradeTargets.length === 1
      ? withReadonlyPlatformDatabase({}, (database) =>
        readWorkspaceTradeLibrarySavedTrade(
          database,
          requestScope,
          result.affectedTradeTargets[0]!,
        ))
      : null;
    const savedTrades = withReadonlyPlatformDatabase({}, (database) =>
      readWorkspaceTradeLibrarySavedTrades(database, requestScope, result.affectedTradeTargets));
    return Response.json({
      status: "ready",
      result: {
        acceptedExecutionCount: result.executionIds.length,
        affectedDates: result.affectedDates,
        affectedTradeIds: result.affectedTradeTargets.map((target) => target.roundTripId),
        affectedTradeRefs,
        analyzerQueueOutcome: result.analyzerQueueOutcome,
        analyzerSelectionOutcomes: result.analyzerSelectionOutcomes,
        pendingDecisionCount: result.relatedDecisionIds.length,
        savedTrade,
        savedTrades,
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
        // Keep the original failure response when private issue logging is unavailable.
      }
    }
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_TRADE_COMMIT_CONFLICT";
    return Response.json({ status: "unavailable", code }, { status: 400 });
  }
}
