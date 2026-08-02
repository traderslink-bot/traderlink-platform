import type { JournalTagRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
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

type Context = { params: Promise<{ tagId: string }> };

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
}

function revision(value: unknown): number {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (!Number.isSafeInteger(parsed) || Number(parsed) <= 0) {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
  }
  return Number(parsed);
}

function tagView(tag: JournalTagRecord) {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

function errorResponse(error: unknown): Response {
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
        ? "This tag or Journal account changed. Refresh and try again."
        : "The tag change was not accepted.",
    },
  }, { status: conflict ? 409 : 400 });
}

export async function PATCH(request: Request, context: Context): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { tagId } = await context.params;
    const data = withWritableJournalAnnotations(scope, (service, account) =>
      tagView(service.renameTag(account, {
        tagId,
        expectedRevision: revision(body.expectedRevision),
        name: body.name,
      })));
    return Response.json({ ok: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(request: Request, context: Context): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const { tagId } = await context.params;
    const data = withWritableJournalAnnotations(scope, (service, account) => {
      const current = service.listTags(account).find((tag) => tag.tagId === tagId);
      if (!current) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      if (current.assignmentCount > 0 && body.confirmAssignedDeletion !== true) {
        return { confirmationRequired: true, assignmentCount: current.assignmentCount } as const;
      }
      const retired = service.retireTag(account, {
        tagId,
        expectedRevision: revision(body.expectedRevision),
      });
      return { confirmationRequired: false, removedAssignmentCount: retired.assignmentCount } as const;
    });
    if (data.confirmationRequired) {
      return Response.json({
        ok: false,
        error: {
          code: "TRADERLINK_JOURNAL_TAG_RETIRE_CONFIRMATION_REQUIRED",
          message: "This tag is used by trades. Confirm retirement to hide it from current trade views while preserving its history.",
          assignmentCount: data.assignmentCount,
        },
      }, { status: 409 });
    }
    return Response.json({ ok: true, data: {
      removedAssignmentCount: data.removedAssignmentCount,
    } });
  } catch (error) {
    return errorResponse(error);
  }
}
