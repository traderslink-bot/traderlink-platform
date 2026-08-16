import type { JournalRuleReviewRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
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

function reviewView(review: JournalRuleReviewRecord) {
  return {
    note: review.note,
    revision: String(review.revision),
    status: review.status === "not_reviewed" ? "not-reviewed" : review.status,
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
    const data = withWritableJournalAnnotations(scope, (service, account) => {
      if (typeof body.ruleId !== "string" || typeof body.ruleVersion !== "string") {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
      }
      const rangeStart = `${sessionDate}T00:00:00.000Z`;
      const rangeEndDate = new Date(rangeStart);
      rangeEndDate.setUTCDate(rangeEndDate.getUTCDate() + 2);
      const rule = service.listRulesForEvaluation(account, rangeStart, rangeEndDate.toISOString()).find((candidate) =>
        candidate.ruleId === body.ruleId &&
        candidate.versionId === body.ruleVersion);
      if (
        !rule ||
        rule.sourceKind !== "custom" ||
        (body.applicability !== "day" && body.applicability !== "trade")
      ) {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      }
      const allowed = body.applicability === "day"
        ? rule.reviewScope === "day" || rule.reviewScope === "both"
        : rule.reviewScope === "trade" || rule.reviewScope === "both";
      if (!allowed) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      if (body.status !== "not-reviewed" && body.status !== "followed" && body.status !== "broken") {
        platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID");
      }
      const expectedRevision = nullableRevision(body.expectedRevision);
      const targetId = body.applicability === "day"
        ? service.ensureTradingDayId(account, sessionDate)
        : typeof body.targetRoundTripKey === "string"
          ? body.targetRoundTripKey
          : null;
      if (!targetId) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
      return reviewView(service.saveRuleReview(account, {
        expectedRevision,
        ruleId: rule.ruleId,
        ruleVersionId: rule.versionId,
        status: body.status === "not-reviewed" ? "not_reviewed" : body.status,
        note: body.note,
        targetId,
        targetKind: body.applicability === "day" ? "trading_day" : "round_trip",
      }));
    });
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
          ? "This review, rule, trade, or Journal account changed. Refresh and try again."
          : "The rule review was not accepted.",
      },
    }, { status: conflict ? 409 : 400 });
  }
}
