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

type Context = { params: Promise<{ semanticRoundTripKey: string }> };

function record(value: unknown): Record<string, unknown> {
  if (!value || Array.isArray(value) || typeof value !== "object") {
    platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
  }
  return value as Record<string, unknown>;
}

function tagView(tag: JournalTagRecord) {
  return {
    assignmentCount: tag.assignmentCount,
    name: tag.name,
    revision: String(tag.revision),
    tagId: tag.tagId,
  };
}

export async function PUT(request: Request, context: Context): Promise<Response> {
  try {
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    if (!Array.isArray(body.tagIds) ||
        body.tagIds.some((tagId) => typeof tagId !== "string")) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "tagIds" });
    }
    if (!Array.isArray(body.presetKeys) ||
        body.presetKeys.some((presetKey) => typeof presetKey !== "string")) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "presetKeys" });
    }
    const { semanticRoundTripKey } = await context.params;
    const data = withWritableJournalAnnotations(scope, (service, account) =>
      service.replaceRoundTripTagsWithPresets(account, {
        roundTripId: semanticRoundTripKey,
        tagIds: body.tagIds as string[],
        presetKeys: body.presetKeys as string[],
      }).map(tagView));
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
          ? "This trade, tag catalog, or Journal account changed. Refresh and try again."
          : "Select no more than 10 tags for this trade.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
