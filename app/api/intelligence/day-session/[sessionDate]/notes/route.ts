import type { JournalDailyNoteRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import { withWritableJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import {
  requireTraderLinkPlatformRequestScope,
  requireExpectedJournalAccountSelection,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {
  isTraderLinkPlatformError,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

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

function noteView(note: JournalDailyNoteRecord) {
  return {
    anythingElse: note.anythingElse,
    revision: String(note.revision),
    technicalRecap: note.technicalRecap,
    tomorrowsFocus: note.tomorrowsFocus,
    whatNeedsWork: note.whatNeedsWork,
    whatWorked: note.whatWorked,
  };
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ sessionDate: string }> },
): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { sessionDate } = await context.params;
    const data = withWritableJournalAnnotations(scope, (service, account) =>
      noteView(service.saveDailyNote(account, {
        anythingElse: body.anythingElse,
        expectedRevision: nullableRevision(body.expectedRevision),
        technicalRecap: body.technicalRecap,
        tomorrowsFocus: body.tomorrowsFocus,
        tradingDate: sessionDate,
        whatNeedsWork: body.whatNeedsWork,
        whatWorked: body.whatWorked,
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
          ? "These notes or the Journal account changed. Refresh and try again."
          : "The daily notes were not accepted.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
