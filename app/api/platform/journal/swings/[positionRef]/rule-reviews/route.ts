import { withWritableJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { withReadonlyJournalIntegrityRuntime } from "@/src/modules/journal/server/journal-integrity-runtime";
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

export async function PUT(
  request: Request,
  context: { params: Promise<{ positionRef: string }> },
): Promise<Response> {
  try {
    requireJournalMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = record(await request.json());
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    if (typeof body.ruleId !== "string" ||
        typeof body.ruleVersion !== "string" ||
        !["not-reviewed", "followed", "broken"].includes(String(body.status))) {
      platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
    }
    const { positionRef } = await context.params;
    const roundTripId = withReadonlyJournalIntegrityRuntime(scope, (journal) => {
      const account = journal.tradeStyles.accountScope(scope);
      return journal.tradeStyles.resolvePosition(account, positionRef).roundTripId;
    });
    const data = withWritableJournalAnnotations(scope, (service, account) => {
      const rule = service.listRules(account).find((candidate) =>
        candidate.ruleId === body.ruleId &&
        candidate.versionId === body.ruleVersion &&
        candidate.lifecycleState === "active" &&
        (candidate.reviewScope === "trade" || candidate.reviewScope === "both"));
      if (!rule) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      const review = service.saveRuleReview(account, {
        expectedRevision: nullableRevision(body.expectedRevision),
        ruleId: rule.ruleId,
        ruleVersionId: rule.versionId,
        status: body.status === "not-reviewed" ? "not_reviewed" : body.status,
        targetId: roundTripId,
        targetKind: "round_trip",
      });
      return {
        revision: String(review.revision),
        status: review.status === "not_reviewed" ? "not-reviewed" : review.status,
      };
    });
    return Response.json({ ok: true, data });
  } catch (error) {
    const code = isTraderLinkPlatformError(error)
      ? error.code
      : "TRADERLINK_JOURNAL_ANNOTATION_INVALID";
    const conflict = code.includes("CONFLICT") ||
      code === "TRADERLINK_ACCOUNT_SELECTION_CONFLICT";
    return Response.json({
      ok: false,
      error: {
        code,
        message: conflict
          ? "This rule review, trade, or Journal account changed. Refresh and try again."
          : "The rule review could not be saved.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
