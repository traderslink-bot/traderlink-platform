import "server-only";

import type Database from "better-sqlite3";

import type {
  CoachAiReviewInsightCandidate,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import type { CoachAiReviewOutputV3 } from
  "@/src/modules/coach/contracts/coach-ai-review-output-v3-contracts";
import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  canonicalCoachAiReviewInsightBytes,
  digestCanonicalCoachAiReviewInsight,
} from "./ai-review-insights/coach-ai-review-insight-canonical";
import {
  CoachAiReviewInsightIssuanceRepository,
} from "./coach-ai-review-insight-issuance-repository";
import { CoachAiReviewInsightPersistenceRepository } from
  "./coach-ai-review-insight-persistence-repository";
import {
  coachAiReviewRepresentedEvidenceRefs,
  CoachAiReviewRepository,
  type CoachAiReviewKindV2,
  type CoachAiReviewOutputV2,
} from "./coach-ai-review-repository";

export type CoachAiReviewTrackedFocusRecordV3 = Readonly<{
  ordinal: number;
  focusTargetRef: string;
  focusQuestionRef: string;
  findingRef: string;
  actionTargetKey: string;
  trackingIntent: "reduction" | "consistency" | "examination" | "strength_repetition";
  renderedQuestion: string;
  baselineCandidate: CoachAiReviewInsightCandidate;
  sourceDigestSha256: string;
  sourcePeriodFinalMarketSealUtc: string | null;
  eligibleLaterEvidenceAtUtc: string;
  baselineSourceVersionRefs: readonly string[];
}>;

export type CoachAiIssuedReviewRecord = Readonly<{
  issuedReviewId: string;
  requestId: string;
  reviewKind: CoachAiReviewKindV2;
  periodStartDate: string;
  periodEndDate: string;
  output: CoachAiReviewOutputV2 | CoachAiReviewOutputV3;
  representedEvidenceRefs: readonly string[];
  generationContractVersion: "openai_direct_v2" | "insight_selection_v3";
  generationSource: "legacy_provider" | "provider_selected" | "deterministic_default";
  modelId: string | null;
  trackedFocusAvailability: "legacy_unavailable" | "tracked_v3";
  trackedFocuses: readonly CoachAiReviewTrackedFocusRecordV3[];
  issuedAtUtc: string;
}>;

type FocusAuditItem = Readonly<{
  ordinal: number;
  focusTargetRef: string;
  focusQuestionRef: string;
  findingRef: string;
  actionTargetKey: string;
  trackingIntent: "reduction" | "consistency" | "examination" | "strength_repetition";
  renderedQuestion: string;
}>;

type V3ReadRow = Readonly<{
  input_json: string;
  selection_source: "provider_selected" | "deterministic_default";
  review_plan_ref: string;
  focus_tracking_json: string;
  focus_tracking_digest_sha256: string;
  source_digest_sha256: string;
  shortlist_digest_sha256: string;
  catalog_digest_sha256: string;
  rendered_output_digest_sha256: string;
  recorded_at_utc: string;
}>;

function accountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

function exactKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  return actual.length === wanted.length && actual.every((key, index) => key === wanted[index]);
}

function sourceVersionRefs(candidate: CoachAiReviewInsightCandidate): readonly string[] {
  return Object.freeze([...new Set([
    ...candidate.populationMemberRefs,
    ...candidate.opportunityMemberRefs,
    ...candidate.affectedMemberRefs,
    ...candidate.representativeEvidenceRefs,
    ...candidate.relatedRuleRefs,
    ...candidate.relatedFocusRefs,
    ...candidate.measurements.flatMap((measurement) => [
      ...measurement.numeratorMemberRefs,
      ...measurement.denominatorMemberRefs,
    ]),
  ])].sort((left, right) => left.localeCompare(right)));
}

export class CoachAiReviewGenerationCompatibilityRepository {
  private readonly v2: CoachAiReviewRepository;
  private readonly v3: CoachAiReviewInsightIssuanceRepository;
  private readonly snapshots: CoachAiReviewInsightPersistenceRepository;

  constructor(private readonly database: Database.Database) {
    this.v2 = new CoachAiReviewRepository(database);
    this.v3 = new CoachAiReviewInsightIssuanceRepository(database);
    this.snapshots = new CoachAiReviewInsightPersistenceRepository(database);
  }

  readIssuedReview(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachAiIssuedReviewRecord {
    assertCanonicalUuidV4(issuedReviewId, "issuedReviewId");
    const activeAccountId = accountId(scope);
    const v2 = this.database.prepare<[string, string, string, string], Readonly<{
      present: number;
    }>>(`SELECT 1 AS present
FROM coach_ai_issued_reviews_v2 review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
WHERE review.coach_ai_issued_review_id = ? AND request.user_id = ?
  AND request.workspace_id = ? AND request.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      activeAccountId,
    );
    const v3 = this.insightTablesAvailable()
      ? this.database.prepare<[string, string, string, string], Readonly<{
          present: number;
        }>>(`SELECT 1 AS present FROM coach_ai_issued_reviews_v3
WHERE coach_ai_issued_review_id = ? AND user_id = ?
  AND workspace_id = ? AND account_id = ?`).get(
          issuedReviewId,
          scope.userId,
          scope.workspaceId,
          activeAccountId,
        )
      : undefined;
    if (v2 && v3) this.integrity("issuedReviewGenerationCollision");
    if (v3) return this.readV3(scope, issuedReviewId);
    if (!v2) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const review = this.v2.readIssuedReviewV2(scope, issuedReviewId);
    return Object.freeze({
      ...review,
      generationContractVersion: "openai_direct_v2" as const,
      generationSource: "legacy_provider" as const,
      trackedFocusAvailability: "legacy_unavailable" as const,
      trackedFocuses: Object.freeze([]),
    });
  }

  listIssuedReviews(
    scope: WorkspaceAccessScope,
    input: Readonly<{
      atOrAfterPeriodEndDate?: string;
      beforePeriodEndDate?: string;
      reviewKinds?: readonly CoachAiReviewKindV2[];
      limit?: number;
    }> = {},
  ): readonly CoachAiIssuedReviewRecord[] {
    const limit = input.limit ?? 100;
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "limit" });
    }
    const reviewKinds = input.reviewKinds ?? ["weekly", "two_week", "monthly"];
    if (reviewKinds.length === 0) return Object.freeze([]);
    const allowed = new Set<CoachAiReviewKindV2>(["weekly", "two_week", "monthly"]);
    if (reviewKinds.some((kind) => !allowed.has(kind))) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "reviewKinds",
      });
    }
    const activeAccountId = accountId(scope);
    const rows = [
      ...this.listIds("coach_ai_issued_reviews_v2", scope, activeAccountId, {
        ...input,
        reviewKinds,
        limit,
      }),
      ...(this.insightTablesAvailable()
        ? this.listIds("coach_ai_issued_reviews_v3", scope, activeAccountId, {
            ...input,
            reviewKinds,
            limit,
          })
        : []),
    ];
    const requestVersions = new Map<string, string>();
    for (const row of rows) {
      const existing = requestVersions.get(row.requestId);
      if (existing && existing !== row.generationContractVersion) {
        this.integrity("requestGenerationCollision");
      }
      requestVersions.set(row.requestId, row.generationContractVersion);
    }
    return Object.freeze(rows
      .map((row) => this.readIssuedReview(scope, row.issuedReviewId))
      .sort((left, right) => right.periodEndDate.localeCompare(left.periodEndDate) ||
        right.issuedAtUtc.localeCompare(left.issuedAtUtc) ||
        left.issuedReviewId.localeCompare(right.issuedReviewId))
      .slice(0, limit));
  }

  private listIds(
    table: "coach_ai_issued_reviews_v2" | "coach_ai_issued_reviews_v3",
    scope: WorkspaceAccessScope,
    activeAccountId: string,
    input: Readonly<{
      atOrAfterPeriodEndDate?: string;
      beforePeriodEndDate?: string;
      reviewKinds: readonly CoachAiReviewKindV2[];
      limit: number;
    }>,
  ): readonly Readonly<{
    issuedReviewId: string;
    requestId: string;
    generationContractVersion: "openai_direct_v2" | "insight_selection_v3";
  }>[] {
    const lower = input.atOrAfterPeriodEndDate ? "AND request.period_end_date >= ?" : "";
    const parameters: (string | number)[] = [
      scope.userId,
      scope.workspaceId,
      activeAccountId,
      input.beforePeriodEndDate ?? "9999-12-31",
      ...(input.atOrAfterPeriodEndDate ? [input.atOrAfterPeriodEndDate] : []),
      ...input.reviewKinds,
      input.limit,
    ];
    const rows = this.database.prepare(`SELECT review.coach_ai_issued_review_id,
  request.coach_ai_review_period_request_id
FROM ${table} review
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = review.coach_ai_review_period_request_id
WHERE request.user_id = ? AND request.workspace_id = ? AND request.account_id = ?
  AND request.period_end_date < ? ${lower}
  AND request.review_kind IN (${input.reviewKinds.map(() => "?").join(", ")})
ORDER BY request.period_end_date DESC, review.issued_at_utc DESC
LIMIT ?`).all(...parameters) as readonly Readonly<{
      coach_ai_issued_review_id: string;
      coach_ai_review_period_request_id: string;
    }>[];
    return Object.freeze(rows.map((row) => Object.freeze({
      issuedReviewId: row.coach_ai_issued_review_id,
      requestId: row.coach_ai_review_period_request_id,
      generationContractVersion: table === "coach_ai_issued_reviews_v3"
        ? "insight_selection_v3" as const
        : "openai_direct_v2" as const,
    })));
  }

  private readV3(
    scope: WorkspaceAccessScope,
    issuedReviewId: string,
  ): CoachAiIssuedReviewRecord {
    const activeAccountId = accountId(scope);
    const review = this.v3.read(scope, issuedReviewId);
    const row = this.database.prepare<[string, string, string, string], V3ReadRow>(`SELECT
  request.input_json, audit.selection_source, audit.review_plan_ref,
  audit.focus_tracking_json,
  audit.focus_tracking_digest_sha256, audit.source_digest_sha256,
  audit.shortlist_digest_sha256, audit.catalog_digest_sha256,
  audit.rendered_output_digest_sha256, audit.recorded_at_utc
FROM coach_ai_issued_reviews_v3 issued
JOIN coach_ai_review_period_requests_v2 request
  ON request.coach_ai_review_period_request_id = issued.coach_ai_review_period_request_id
JOIN coach_ai_review_insight_selection_audits audit
  ON audit.coach_ai_issued_review_id = issued.coach_ai_issued_review_id
  AND audit.validation_state = 'accepted'
WHERE issued.coach_ai_issued_review_id = ? AND issued.user_id = ?
  AND issued.workspace_id = ? AND issued.account_id = ?`).get(
      issuedReviewId,
      scope.userId,
      scope.workspaceId,
      activeAccountId,
    );
    if (!row) this.integrity("acceptedSelectionAuditMissing");
    const artifact = this.snapshots.read(scope, review.requestId).artifact;
    const plan = artifact.catalog.completePlans.find((candidate) =>
      candidate.reviewPlanRef === review.reviewPlanRef);
    const outputDigest = digestCanonicalCoachAiReviewInsight(review.output).digestSha256;
    if (!plan || row.selection_source !== review.generationSource ||
        row.review_plan_ref !== review.reviewPlanRef ||
        row.source_digest_sha256 !== artifact.sourceSnapshot.sourceDigestSha256 ||
        row.shortlist_digest_sha256 !== artifact.digests.shortlistDigestSha256 ||
        row.catalog_digest_sha256 !== artifact.digests.catalogDigestSha256 ||
        row.rendered_output_digest_sha256 !== outputDigest ||
        row.recorded_at_utc !== review.issuedAtUtc) {
      this.integrity("acceptedSelectionAuditMismatch");
    }
    const focuses = this.parseFocusAudit(row.focus_tracking_json);
    if (canonicalCoachAiReviewInsightBytes(focuses).toString("utf8") !==
          row.focus_tracking_json ||
        digestCanonicalCoachAiReviewInsight(focuses).digestSha256 !==
          row.focus_tracking_digest_sha256 ||
        focuses.length !== plan.focusQuestionRefs.length ||
        focuses.length !== review.output.nextPeriodFocuses.length ||
        new Set(focuses.map((focus) => focus.focusTargetRef)).size !== focuses.length ||
        new Set(focuses.map((focus) => focus.focusQuestionRef)).size !== focuses.length ||
        new Set(focuses.map((focus) => focus.actionTargetKey)).size !== focuses.length) {
      this.integrity("focusTrackingDigest");
    }
    const sourceFinalMarketSealUtc = artifact.sourceSnapshot.source.days
      .map((day) => day.dayEndUtc)
      .sort((left, right) => right.localeCompare(left))[0] ?? null;
    const eligibleLaterEvidenceAtUtc = sourceFinalMarketSealUtc !== null &&
        sourceFinalMarketSealUtc > review.issuedAtUtc
      ? sourceFinalMarketSealUtc
      : review.issuedAtUtc;
    const trackedFocuses = focuses.map((focus, index) => {
      const catalogFocus = artifact.catalog.focusQuestions.find((candidate) =>
        candidate.focusQuestionRef === focus.focusQuestionRef);
      const candidate = artifact.candidates.find((item) => item.findingRef === focus.findingRef);
      if (!catalogFocus || !candidate || focus.ordinal !== index + 1 ||
          plan.focusQuestionRefs[index] !== focus.focusQuestionRef ||
          review.output.nextPeriodFocuses[index] !== focus.renderedQuestion ||
          catalogFocus.focusTargetRef !== focus.focusTargetRef ||
          catalogFocus.findingRef !== focus.findingRef ||
          catalogFocus.actionTargetKey !== focus.actionTargetKey ||
          catalogFocus.trackingIntent !== focus.trackingIntent ||
          catalogFocus.renderedQuestion !== focus.renderedQuestion) {
        this.integrity("focusTrackingLineage");
      }
      return Object.freeze({
        ...focus,
        baselineCandidate: candidate,
        sourceDigestSha256: artifact.sourceSnapshot.sourceDigestSha256,
        sourcePeriodFinalMarketSealUtc: sourceFinalMarketSealUtc,
        eligibleLaterEvidenceAtUtc,
        baselineSourceVersionRefs: sourceVersionRefs(candidate),
      });
    });
    return Object.freeze({
      issuedReviewId: review.issuedReviewId,
      requestId: review.requestId,
      reviewKind: review.reviewKind,
      periodStartDate: review.periodStartDate,
      periodEndDate: review.periodEndDate,
      output: review.output,
      representedEvidenceRefs: coachAiReviewRepresentedEvidenceRefs(row.input_json),
      generationContractVersion: "insight_selection_v3",
      generationSource: review.generationSource,
      modelId: review.modelId,
      trackedFocusAvailability: "tracked_v3",
      trackedFocuses: Object.freeze(trackedFocuses),
      issuedAtUtc: review.issuedAtUtc,
    });
  }

  private parseFocusAudit(value: string): readonly FocusAuditItem[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      this.integrity("focusTrackingJson");
    }
    if (!Array.isArray(parsed) || parsed.length < 1 || parsed.length > 3) {
      this.integrity("focusTrackingCount");
    }
    const intents = new Set(["reduction", "consistency", "examination", "strength_repetition"]);
    return Object.freeze(parsed.map((item, index) => {
      if (!item || Array.isArray(item) || typeof item !== "object") {
        this.integrity("focusTrackingItem");
      }
      const record = item as Record<string, unknown>;
      if (!exactKeys(record, [
        "ordinal",
        "focusTargetRef",
        "focusQuestionRef",
        "findingRef",
        "actionTargetKey",
        "trackingIntent",
        "renderedQuestion",
      ]) || record.ordinal !== index + 1 ||
          typeof record.focusTargetRef !== "string" ||
          typeof record.focusQuestionRef !== "string" ||
          typeof record.findingRef !== "string" ||
          typeof record.actionTargetKey !== "string" ||
          typeof record.trackingIntent !== "string" ||
          !intents.has(record.trackingIntent) ||
          typeof record.renderedQuestion !== "string" ||
          record.renderedQuestion.trim().length === 0) {
        this.integrity("focusTrackingFields");
      }
      return Object.freeze({
        ordinal: record.ordinal as number,
        focusTargetRef: record.focusTargetRef as string,
        focusQuestionRef: record.focusQuestionRef as string,
        findingRef: record.findingRef as string,
        actionTargetKey: record.actionTargetKey as string,
        trackingIntent: record.trackingIntent as FocusAuditItem["trackingIntent"],
        renderedQuestion: record.renderedQuestion as string,
      });
    }));
  }

  private insightTablesAvailable(): boolean {
    const names = this.database.prepare<[], Readonly<{ name: string }>>(`SELECT name
FROM sqlite_master
WHERE type = 'table' AND name IN (
  'coach_ai_issued_reviews_v3',
  'coach_ai_review_insight_selection_audits',
  'coach_ai_review_insight_snapshots'
)`).all();
    if (names.length === 0) return false;
    if (new Set(names.map((row) => row.name)).size !== 3) {
      this.integrity("partialInsightSchema");
    }
    return true;
  }

  private integrity(field: string): never {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      table: "coach_ai_review_generation_compatibility",
      field,
    });
  }
}
