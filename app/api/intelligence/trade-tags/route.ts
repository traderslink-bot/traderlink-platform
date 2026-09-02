import type { JournalTagRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import {
  withReadonlyJournalAnnotations,
  withWritableJournalAnnotations,
} from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
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

function tagView(tag: JournalTagRecord) {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
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
        : "Enter a unique tag name between 1 and 40 characters.",
    },
  }, { status: conflict ? 409 : 400 });
}

export async function GET(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const data = withReadonlyJournalAnnotations(scope, (service, account) =>
      service.listTags(account).map(tagView));
    return Response.json({ ok: true, data });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(
      scope,
      body.expectedAccountSelectionRef,
    );
    const data = withWritableJournalAnnotations(scope, (service, account) =>
      tagView(service.createTag(account, { name: body.name })), { allowDemoAccountAnnotations: true });
    return Response.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
