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
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";
import { activeLogicalTradeReviewTarget, replaceLogicalTradeTags } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-review-persistence";
import { journalTagPresetByKey, journalTagPresetForName } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

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
    if (!scope.activeAccountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const accountScope = narrowWorkspaceAccessToAccount(scope, scope.activeAccountId);
    const target = withPlatformDatabase({ mode: "runtime" }, (database) =>
      activeLogicalTradeReviewTarget(database, accountScope, semanticRoundTripKey));
    const data = target ? (() => {
      const selected = withWritableJournalAnnotations(scope, (service, account) => {
        const catalog = service.listTags(account);
        const selectedIds = new Set(body.tagIds as string[]);
        for (const presetKey of body.presetKeys as string[]) {
          const preset = journalTagPresetByKey(presetKey);
          if (!preset) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "presetKeys" });
          const tag = catalog.find((candidate) => journalTagPresetForName(candidate.name)?.presetKey === presetKey)
            ?? service.createTag(account, { name: preset.name });
          selectedIds.add(tag.tagId);
        }
        const refreshed = service.listTags(account);
        if (selectedIds.size > 10 || [...selectedIds].some((tagId) =>
          !refreshed.some((tag) => tag.tagId === tagId))) {
          platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field: "tagIds" });
        }
        return refreshed.filter((tag) => selectedIds.has(tag.tagId));
      });
      withPlatformDatabase({ mode: "runtime" }, (database) =>
        replaceLogicalTradeTags(database, accountScope, target, selected.map((tag) => tag.tagId)));
      return selected.map(tagView);
    })() : withWritableJournalAnnotations(scope, (service, account) =>
      service.replaceRoundTripTagsWithPresets(account, {
        roundTripId: semanticRoundTripKey, tagIds: body.tagIds as string[],
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
