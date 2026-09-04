import type { JournalRoundTripNoteRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { withWritableJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { activeLogicalTradeReviewTarget, saveLogicalTradeNote } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-review-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
}

function nullableRevision(value: unknown): number | null {
  if (value === null) return null;
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(parsed) || Number(parsed) <= 0) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  }
  return Number(parsed);
}

function noteView(note: JournalRoundTripNoteRecord) {
  return {
    revision: String(note.revision),
    technicalNote: note.technicalNote,
    tradeNote: note.tradeNote,
  };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ semanticRoundTripKey: string }> },
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { semanticRoundTripKey } = await context.params;
    if (!scope.activeAccountId || typeof body.technicalNote !== "string" || typeof body.tradeNote !== "string") {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
    }
    const account = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const logicalData = withPlatformDatabase({ mode: "runtime" }, (database) => {
      const target = activeLogicalTradeReviewTarget(database, account, semanticRoundTripKey);
      if (!target) return null;
      const saved = saveLogicalTradeNote(database, account, target, {
        expectedRevision: nullableRevision(body.expectedRevision),
        technicalNote: body.technicalNote as string,
        tradeNote: body.tradeNote as string,
      });
      return { revision: String(saved.revision), technicalNote: saved.technicalNote, tradeNote: saved.tradeNote };
    });
    const data = logicalData ?? withWritableJournalAnnotations(scope, (service, annotationAccount) =>
      noteView(service.saveRoundTripNote(annotationAccount, {
        expectedRevision: nullableRevision(body.expectedRevision), roundTripId: semanticRoundTripKey,
        technicalNote: body.technicalNote, tradeNote: body.tradeNote,
      })));
    return Response.json({ ok: true, data });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_JOURNAL_ANNOTATION_INVALID";
    const conflict = code === "TRADERLINK_JOURNAL_ANNOTATION_CONFLICT" ||
      code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Response.json({
      ok: false,
      error: {
        code,
        message: conflict
          ? "These trade notes or the Journal account changed. Refresh and try again."
          : "The trade notes were not accepted.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
