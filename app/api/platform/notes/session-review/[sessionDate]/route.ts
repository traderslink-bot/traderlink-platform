import { createJournalAnnotationService, withScopedJournalAnnotations } from "@/src/modules/journal/server/annotations/journal-annotation-runtime";
import { journalTagPresetByKey, journalTagPresetForName } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { requirePlatformMutationRequest } from "@/src/modules/platform/server/authentication/platform-mutation-request-security";
import { requireExpectedJournalAccountSelection, requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4, isTraderLinkPlatformError, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const HEADERS = { "cache-control": "private, no-store, max-age=0" };

function invalid(field: string): never { return platformFailure("TRADERLINK_JOURNAL_ANNOTATION_INVALID", { field }); }
function sessionDate(value: string): string { if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) invalid("sessionDate"); return value; }
function isStringArray(value: unknown): value is readonly string[] { return Array.isArray(value) && value.every((item): item is string => typeof item === "string"); }
type RuleReviewInput = Readonly<{
  expectedRevision: number | null;
  ruleId: string;
  ruleVersion: string;
  status: "followed" | "broken" | "not-reviewed";
}>;
function ruleReviews(value: unknown): readonly RuleReviewInput[] {
  if (!Array.isArray(value)) invalid("ruleReviews");
  const seen = new Set<string>();
  return value.map((item): RuleReviewInput => {
    if (!item || typeof item !== "object" || Array.isArray(item)) invalid("ruleReviews");
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.ruleId !== "string" || typeof candidate.ruleVersion !== "string" ||
      (candidate.status !== "followed" && candidate.status !== "broken" && candidate.status !== "not-reviewed") ||
      (candidate.expectedRevision !== null && (!Number.isSafeInteger(candidate.expectedRevision) || Number(candidate.expectedRevision) <= 0))) {
      invalid("ruleReviews");
    }
    if (seen.has(candidate.ruleId)) invalid("ruleReviews");
    seen.add(candidate.ruleId);
    return { expectedRevision: candidate.expectedRevision as number | null, ruleId: candidate.ruleId, ruleVersion: candidate.ruleVersion, status: candidate.status };
  });
}
function tags(database: Parameters<typeof createJournalAnnotationService>[0], scope: AccountScope, dayId: string | null) {
  return database.prepare(`SELECT tag_id FROM journal_trading_day_tag_assignments
WHERE workspace_id = ? AND account_id = ? AND trading_day_id = ? AND assignment_state = 'assigned'
ORDER BY tag_id`).all(scope.workspaceId, scope.accountId, dayId ?? "") as { tag_id: string }[];
}
function data(database: Parameters<typeof createJournalAnnotationService>[0], scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>, date: string) {
  return withScopedJournalAnnotations(database, scope, (service, account) => {
    const dayId = service.resolveTradingDayId(account, date);
    const reviews = dayId ? service.listRuleReviews(account, { tradingDayId: dayId, roundTripIds: [] }) : [];
    return {
      rules: service.listRulesForEvaluation(account, `${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`).filter((rule) => rule.sourceKind === "custom" && (rule.reviewScope === "day" || rule.reviewScope === "both")).map((rule) => ({ ruleId: rule.ruleId, ruleVersion: rule.versionId, statement: rule.statement, title: rule.title })),
      reviews: reviews.filter((review) => review.targetKind === "trading_day").map((review) => ({ revision: review.revision, ruleId: review.ruleId, ruleVersion: review.ruleVersionId, status: review.status === "not_reviewed" ? "not-reviewed" : review.status })),
      selectedTagIds: tags(database, account, dayId).map((row) => row.tag_id),
      tags: service.listTags(account).map((tag) => ({ assignmentCount: tag.assignmentCount, name: tag.name, revision: String(tag.revision), tagId: tag.tagId })),
    };
  });
}
function saveSessionReview(database: Parameters<typeof createJournalAnnotationService>[0], scope: ReturnType<typeof requireTraderLinkPlatformRequestScope>, date: string, tagIds: readonly string[], presetKeys: readonly string[], reviewInputs: readonly RuleReviewInput[]) {
  return withScopedJournalAnnotations(database, scope, (service, account) => {
    const activeTags = [...service.listTags(account)];
    const active = new Set(activeTags.map((tag) => tag.tagId));
    if (tagIds.some((tagId) => !active.has(tagId))) invalid("tagIds");
    const selectedTagIds = new Set(tagIds);
    for (const presetKey of presetKeys) {
      const preset = journalTagPresetByKey(presetKey);
      if (!preset) invalid("presetKeys");
      const existing = activeTags.find((tag) => journalTagPresetForName(tag.name)?.presetKey === presetKey);
      const tag = existing ?? service.createTag(account, { name: preset.name });
      if (!existing) activeTags.push(tag);
      selectedTagIds.add(tag.tagId);
    }
    if (selectedTagIds.size > 10) invalid("tagIds");
    const dayId = service.ensureTradingDayId(account, date);
    const at = createCanonicalUtcTimestamp();
    const rows = database.prepare(`SELECT trading_day_tag_assignment_id, tag_id, assignment_state, revision
FROM journal_trading_day_tag_assignments WHERE workspace_id = ? AND account_id = ? AND trading_day_id = ?`).all(
      account.workspaceId, account.accountId, dayId,
    ) as { trading_day_tag_assignment_id: string; tag_id: string; assignment_state: "assigned" | "removed"; revision: number }[];
    const selected = selectedTagIds; const byTag = new Map(rows.map((row) => [row.tag_id, row]));
    for (const row of rows) {
      const next = selected.has(row.tag_id) ? "assigned" : "removed";
      if (next === row.assignment_state) continue;
      const eventId = createCanonicalUuidV4();
      database.prepare(`INSERT INTO journal_trading_day_tag_assignment_events (
  assignment_event_id, workspace_id, account_id, trading_day_tag_assignment_id, version_number, event_kind, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(eventId, account.workspaceId, account.accountId, row.trading_day_tag_assignment_id, row.revision + 1, next, account.userId, at);
      if (database.prepare(`UPDATE journal_trading_day_tag_assignments SET assignment_state = ?, current_event_id = ?, revision = ?, updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND trading_day_tag_assignment_id = ? AND revision = ?`).run(next, eventId, row.revision + 1, at, account.workspaceId, account.accountId, row.trading_day_tag_assignment_id, row.revision).changes !== 1) platformFailure("TRADERLINK_JOURNAL_ANNOTATION_CONFLICT");
    }
    for (const tagId of selected) {
      if (byTag.has(tagId)) continue;
      const assignmentId = createCanonicalUuidV4(); const eventId = createCanonicalUuidV4();
      database.prepare(`INSERT INTO journal_trading_day_tag_assignments (
  trading_day_tag_assignment_id, workspace_id, account_id, trading_day_id, tag_id, assignment_state, current_event_id, revision, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, 'assigned', ?, 1, ?, ?)`).run(assignmentId, account.workspaceId, account.accountId, dayId, tagId, eventId, at, at);
      database.prepare(`INSERT INTO journal_trading_day_tag_assignment_events (
  assignment_event_id, workspace_id, account_id, trading_day_tag_assignment_id, version_number, event_kind, authored_by_user_id, created_at_utc
) VALUES (?, ?, ?, ?, 1, 'assigned', ?, ?)`).run(eventId, account.workspaceId, account.accountId, assignmentId, account.userId, at);
    }
    if (reviewInputs.length === 0) return;
    const availableRules = new Set(service.listRulesForEvaluation(account, `${date}T00:00:00.000Z`, `${date}T23:59:59.999Z`)
      .filter((rule) => rule.sourceKind === "custom" && (rule.reviewScope === "day" || rule.reviewScope === "both"))
      .map((rule) => `${rule.ruleId}:${rule.versionId}`));
    for (const review of reviewInputs) {
      if (!availableRules.has(`${review.ruleId}:${review.ruleVersion}`)) invalid("ruleReviews");
      service.saveRuleReview(account, {
        expectedRevision: review.expectedRevision,
        ruleId: review.ruleId,
        ruleVersionId: review.ruleVersion,
        status: review.status === "not-reviewed" ? "not_reviewed" : review.status,
        targetId: dayId,
        targetKind: "trading_day",
      });
    }
  });
}
export async function GET(request: Request, context: { params: Promise<{ sessionDate: string }> }): Promise<Response> {
  try { const scope = requireTraderLinkPlatformRequestScope(request.headers); const { sessionDate: raw } = await context.params; return Response.json({ data: withReadonlyPlatformDatabase({}, (database) => data(database, scope, sessionDate(raw))), status: "ready" }, { headers: HEADERS }); } catch (error) { return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 }); }
}
export async function PUT(request: Request, context: { params: Promise<{ sessionDate: string }> }): Promise<Response> {
  try {
    requirePlatformMutationRequest(request);
    const scope = requireTraderLinkPlatformRequestScope(request.headers);
    const body = await request.json() as { expectedAccountSelectionRef?: unknown; presetKeys?: unknown; ruleReviews?: unknown; tagIds?: unknown };
    requireExpectedJournalAccountSelection(scope, body.expectedAccountSelectionRef);
    const tagIds = body.tagIds;
    if (!isStringArray(tagIds)) invalid("tagIds");
    const presetKeys = body.presetKeys === undefined ? [] : body.presetKeys;
    if (!isStringArray(presetKeys)) invalid("presetKeys");
    const reviewInputs = body.ruleReviews === undefined ? [] : ruleReviews(body.ruleReviews);
    const { sessionDate: raw } = await context.params;
    const date = sessionDate(raw);
    withPlatformDatabase({ mode: "runtime" }, (database) => database.transaction(() => {
      saveSessionReview(database, scope, date, tagIds, presetKeys, reviewInputs);
    }).immediate());
    return Response.json({ status: "ready" }, { headers: HEADERS });
  } catch (error) {
    return Response.json({ status: "unavailable" }, { headers: HEADERS, status: isTraderLinkPlatformError(error) ? 400 : 500 });
  }
}
