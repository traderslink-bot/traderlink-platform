import type {
  JournalOpenPositionStatus,
  JournalTradeStyle,
  JournalTradeStyleChange,
} from "@/src/modules/journal/contracts/journal-trade-style-contracts";
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

function bodyRecord(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== "string") platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
  return value;
}

function expectedRevision(value: unknown): number | null {
  if (value === null) return null;
  if (!Number.isSafeInteger(value) || Number(value) <= 0) {
    platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
  }
  return Number(value);
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
    const body = bodyRecord(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { positionRef } = await context.params;
    const requestedOpenStatus = text(body.openStatus);
    const requestedSourceUi = text(body.sourceUi);
    const requestedExpectedRevision = expectedRevision(body.expectedRevision);
    if (requestedOpenStatus === "closed") {
      if (requestedSourceUi !== "open_positions" || body.confirmFlat !== true) {
        platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
      }
      const result = withWritableJournalIntegrityRuntime(scope, (journal) => {
        const accountScope = journal.tradeStyles.accountScope(scope);
        const position = journal.tradeStyles.resolvePosition(accountScope, positionRef);
        if ((position.styleRevision ?? null) !== requestedExpectedRevision) {
          platformFailure("TRADERLINK_TRADE_STYLE_CONFLICT");
        }
        return journal.command.confirmPositionFlat(scope, { position });
      });
      return Response.json({ status: "ready", result });
    }
    const input: JournalTradeStyleChange = Object.freeze({
      positionRef,
      expectedRevision: requestedExpectedRevision,
      tradeStyle: text(body.tradeStyle) as JournalTradeStyle,
      openStatus: requestedOpenStatus as Exclude<JournalOpenPositionStatus, "closed">,
      plannedFromEntry: body.plannedFromEntry === true,
      claimedEffectiveAtUtc: text(body.claimedEffectiveAtUtc),
      reason: text(body.reason) as JournalTradeStyleChange["reason"],
      sourceUi: requestedSourceUi as JournalTradeStyleChange["sourceUi"],
      idempotencyKey: text(body.idempotencyKey),
    });
    if (
      !["day_trade", "swing", "other"].includes(input.tradeStyle) ||
      !["day_trade_still_open", "swing", "unplanned_hold", "other", "unclassified"].includes(input.openStatus) ||
      !["planned_from_entry", "reclassified", "unplanned_hold", "other"].includes(input.reason) ||
      !["data_decisions", "day_trade_tracker", "swing_trade_tracker", "open_positions"].includes(input.sourceUi) ||
      typeof body.plannedFromEntry !== "boolean"
    ) platformFailure("TRADERLINK_TRADE_STYLE_INVALID");
    const result = withWritableJournalIntegrityRuntime(scope, (journal) =>
      journal.tradeStyles.change(journal.tradeStyles.accountScope(scope), input));
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
