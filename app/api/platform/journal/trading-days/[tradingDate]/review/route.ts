import type { JournalTradingDayReviewStatus } from "@/src/modules/journal/contracts/journal-trading-day-review-contracts";
import { withWritableJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
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

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
  }
  return value as Record<string, unknown>;
}
function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("CONFLICT")) return 409;
  return 400;
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ tradingDate: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { tradingDate } = await context.params;
    const status = body.status;
    const expectedRevision = body.expectedRevision;
    if (
      (status !== "reviewed" && status !== "incomplete") ||
      (expectedRevision !== null &&
        (!Number.isSafeInteger(expectedRevision) || Number(expectedRevision) < 1)) ||
      typeof body.idempotencyKey !== "string"
    ) {
      platformFailure("TRADERLINK_TRADING_DAY_REVIEW_INVALID");
    }
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.tradingDayReviews.save(
        journal.tradeStyles.accountScope(scope),
        {
          expectedRevision: expectedRevision as number | null,
          idempotencyKey: body.idempotencyKey as string,
          status: status as JournalTradingDayReviewStatus,
          tradingDate,
          userId: scope.userId,
        },
      ));
    return Response.json({ status: "ready", result });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_TRADING_DAY_REVIEW_INVALID";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
