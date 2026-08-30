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
    platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
  }
  return value as Record<string, unknown>;
}

function text(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== "string") {
    platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID", { field });
  }
  return value;
}

function responseStatus(code: string): number {
  if (code === "TRADERLINK_WORKSPACE_ACCESS_DENIED") return 401;
  if (code.includes("CONFLICT") || code.includes("REQUIRES_DECISION")) return 409;
  return 400;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ executionRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const { executionRef } = await context.params;
    const side = text(body, "side");
    const feesValue = body.feesDecimal;
    if (
      !["buy", "sell"].includes(side) ||
      !(feesValue === null || typeof feesValue === "string")
    ) {
      platformFailure("TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID");
    }
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.manualExecutionEdits.correct(
        journal.tradeStyles.accountScope(scope),
        executionRef,
        {
          idempotencyKey: text(body, "idempotencyKey"),
          localDate: text(body, "localDate"),
          localTime: text(body, "localTime"),
          sourceTimezone: text(body, "sourceTimezone"),
          normalizedSymbol: text(body, "normalizedSymbol"),
          tradeCurrency: text(body, "tradeCurrency"),
          side: side as "buy" | "sell",
          quantityDecimal: text(body, "quantityDecimal"),
          priceDecimal: text(body, "priceDecimal"),
          feesDecimal: feesValue as string | null,
        },
      ));
    return Response.json({
      status: "ready",
      result: {
        pendingDecisionCount: result.openedFollowupDecisionIds.length,
        rebuildCount: result.rebuildCount,
        analysisRefresh: result.analysisRefresh,
      },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ executionRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const { executionRef } = await context.params;
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.manualExecutionEdits.remove(
        journal.tradeStyles.accountScope(scope),
        executionRef,
        { idempotencyKey: text(body, "idempotencyKey") },
      ));
    return Response.json({
      status: "ready",
      result: {
        pendingDecisionCount: result.openedFollowupDecisionIds.length,
        rebuildCount: result.rebuildCount,
        analysisRefresh: result.analysisRefresh,
      },
    });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_MANUAL_EXECUTION_EDIT_INVALID";
    return Response.json(
      { status: "unavailable", code },
      { status: responseStatus(code) },
    );
  }
}
