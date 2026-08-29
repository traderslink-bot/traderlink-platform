import { withWritableJournalIntegrityRuntime } from
  "@/src/modules/journal/server/journal-integrity-runtime";
import { DailyTradeAnalyzerRepository } from
  "@/src/modules/level-analysis/server/daily-trade-analyzer-repository";
import {
  requireExpectedJournalAccountSelection,
  requireTraderLinkPlatformRequestScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { requireJournalMutationRequest } from
  "@/src/modules/platform/server/authentication/journal-mutation-request-security";
import { notifyJournalOwnerOfDailyTradeMarketDataDiscrepancy } from
  "@/src/modules/platform/server/notifications/platform-journal-owner-alert-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ mismatchSetId: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as { expectedAccountSelectionRef?: unknown };
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { mismatchSetId } = await context.params;
    const result = withWritableJournalIntegrityRuntime(scope, (journal, database) => {
      const accountScope = journal.tradeStyles.accountScope(scope);
      const confirmation = new DailyTradeAnalyzerRepository(database)
        .confirmExecutionMismatch({ mismatchSetId, now: new Date(), scope: accountScope });
      notifyJournalOwnerOfDailyTradeMarketDataDiscrepancy({
        database,
        occurredAt: new Date(),
        sourceEventKey: `daily_trade_market_data_discrepancy_${confirmation.roundTripVersionId}`,
      });
      return confirmation;
    });
    return Response.json({ data: { status: "confirmed", roundTripId: result.roundTripId } });
  } catch {
    return Response.json({ error: { message: "The broker confirmation could not be saved." } }, { status: 400 });
  }
}
