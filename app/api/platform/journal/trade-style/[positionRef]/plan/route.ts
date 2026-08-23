import type { JournalSwingPositionPlanChange } from "@/src/modules/journal/contracts/journal-trade-style-contracts";
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
    platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string") platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
  return value;
}

function nullableText(value: unknown): string | null {
  if (value === null) return null;
  return text(value);
}

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("CONFLICT")) return 409;
  return 400;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ positionRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { positionRef } = await context.params;
    if (!Number.isSafeInteger(body.expectedRevision) || !Number.isSafeInteger(body.plannedHoldTradingDays)) {
      platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
    }
    const input: JournalSwingPositionPlanChange = Object.freeze({
      positionRef,
      expectedRevision: Number(body.expectedRevision),
      entryReason: text(body.entryReason),
      hasUpcomingCatalyst: body.hasUpcomingCatalyst === true,
      catalystDetails: nullableText(body.catalystDetails),
      plannedHoldTradingDays: Number(body.plannedHoldTradingDays),
      sourceUi: text(body.sourceUi) as JournalSwingPositionPlanChange["sourceUi"],
      idempotencyKey: text(body.idempotencyKey),
    });
    if (![
      "day_trade_tracker",
      "swing_trade_tracker",
    ].includes(input.sourceUi)) platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.tradeStyles.saveSwingPlan(journal.tradeStyles.accountScope(scope), input));
    return Response.json({ status: "ready", result });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_TRADE_STYLE_INVALID";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
