import { withReadonlyJournalIntegrityRuntime, withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
import { parseJournalLogicalTradeMergeSelection, parseJournalLogicalTradeUnmergeRevision } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-input";
import { requireJournalMutationRequest } from "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function errorResponse(error: unknown): Response {
  const code = isTraderLinkPlatformError(error)
    ? error.code
    : "TRADERLINK_LOGICAL_TRADE_INVALID";
  const status = code.includes("CONFLICT") ? 409
    : code.includes("ACCESS_DENIED") ? 401 : 400;
  return Response.json({ status: "unavailable", code }, { status });
}

export async function GET(
  request: Request,
  context: { params: Promise<{ tradeDeleteRef: string }> },
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const { tradeDeleteRef } = await context.params;
    const view = withReadonlyJournalIntegrityRuntime(scope, (journal) =>
      journal.logicalTrades.mergeView(journal.tradeStyles.accountScope(scope), tradeDeleteRef));
    return Response.json({ status: "ready", view });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tradeDeleteRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const { tradeDeleteRef } = await context.params;
    const body: unknown = await request.json();
    const action = body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>).action
      : null;
    const view = withWritableJournalIntegrityRuntime(scope, (journal) => {
      const account = journal.tradeStyles.accountScope(scope);
      if (action === "merge") {
        return journal.logicalTrades.mergeSelection(
          account,
          tradeDeleteRef,
          parseJournalLogicalTradeMergeSelection(body),
        );
      }
      if (action === "unmerge") {
        return journal.logicalTrades.unmergeSelection(
          account,
          tradeDeleteRef,
          parseJournalLogicalTradeUnmergeRevision(body),
        );
      }
      platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "action_invalid" });
    });
    return Response.json({ status: "committed", view });
  } catch (error) {
    return errorResponse(error);
  }
}
