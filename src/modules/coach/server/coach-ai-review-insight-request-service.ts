import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  createCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  loadJournalPrivacyHmacConfiguration,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { buildCoachAiReviewInsightCandidatesFromSource } from
  "./ai-review-insights/coach-ai-review-insight-source-adapters";
import { buildCoachAiReviewBalancedShortlist } from
  "./ai-review-insights/coach-ai-review-insight-shortlist";
import { buildCoachAiReviewRenderedPlanCatalog } from
  "./ai-review-insights/coach-ai-review-factual-renderer";
import { buildCoachAiReviewProviderPlanPackage } from
  "./ai-review-insights/coach-ai-review-plan-selection-package";
import {
  buildCoachAiReviewOpenAiSelectionEnvelope,
} from "./ai-review-insights/coach-ai-review-openai-plan-selector";
import { buildCoachAiReviewInsightSnapshotArtifact } from
  "./ai-review-insights/coach-ai-review-insight-snapshot-artifact";
import { CoachAiProviderSettingsRepository } from
  "./coach-ai-provider-settings-repository";
import { CoachAiReviewGenerationCompatibilityRepository } from
  "./coach-ai-review-generation-compatibility";
import {
  CoachAiReviewInsightPersistenceRepository,
  type CoachAiReviewInsightRequestCreation,
  type CoachAiReviewInsightRequestPersistenceInput,
} from "./coach-ai-review-insight-persistence-repository";
import {
  CoachAiReviewInsightRepository,
  createCoachAiReviewPromptSafeReferenceAuthority,
} from "./coach-ai-review-insight-repository";
import type { CoachMonthlyReviewPlanV2 } from "./coach-monthly-ai-review-runner";
import type { CoachPeriodicReviewPlanV2 } from "./coach-weekly-ai-review-runner";

const PROVIDER_TIMEOUT_MILLISECONDS = 60_000;

type EligiblePlan = CoachPeriodicReviewPlanV2 | CoachMonthlyReviewPlanV2;

function canonicalizeLegacy(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeLegacy);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalizeLegacy(item)]));
  }
  return value;
}

function immutableLegacySnapshot(value: unknown): Readonly<{
  json: string;
  sha256: string;
}> {
  const json = JSON.stringify(canonicalizeLegacy(value));
  return Object.freeze({
    json,
    sha256: createHash("sha256").update(`${json}\n`, "utf8").digest("hex"),
  });
}

function isMonthlyPlan(plan: EligiblePlan): plan is CoachMonthlyReviewPlanV2 {
  return "calendarMonthStartDate" in plan.period;
}

export class CoachAiReviewInsightRequestService {
  constructor(private readonly database: Database.Database) {}

  createFromEligiblePlan(
    plan: EligiblePlan,
    requestOrigin: "automatic" | "manual",
    now = new Date(),
  ): CoachAiReviewInsightRequestCreation {
    if (!plan.snapshot ||
        (plan.state !== "automatic_ready" && plan.state !== "manual_available")) {
      throw new Error("TRADERLINK_COACH_INSIGHT_REQUEST_PLAN_NOT_ELIGIBLE");
    }
    const createdAtUtc = createCanonicalUtcTimestamp(now);
    const requestId = createCanonicalUuidV4();
    const monthly = isMonthlyPlan(plan);
    const reviewKind = monthly ? "monthly" as const : plan.period.cadence;
    const periodStartDate = monthly
      ? plan.period.calendarMonthStartDate
      : plan.period.startDate;
    const periodEndDate = monthly
      ? plan.period.calendarMonthEndDate
      : plan.period.endDate;
    const input = plan.snapshot.input;
    const inputSnapshot = immutableLegacySnapshot(input);
    const manifestSnapshot = immutableLegacySnapshot(plan.snapshot.evidenceManifest);
    const privacy = loadJournalPrivacyHmacConfiguration();
    const keyBase64 = privacy.keysBase64[privacy.activeKeyVersion];
    if (!keyBase64) throw new Error(
      "TRADERLINK_COACH_INSIGHT_REFERENCE_CONFIGURATION_INVALID",
    );
    const references = createCoachAiReviewPromptSafeReferenceAuthority({
      keyVersion: privacy.activeKeyVersion,
      keyBase64,
    });
    const sourceSnapshot = new CoachAiReviewInsightRepository(
      this.database,
      references,
      () => new Date(createdAtUtc),
    ).readCalculationSourceSnapshot(plan.scope, {
      cadence: reviewKind,
      startDate: periodStartDate,
      endDate: periodEndDate,
      coverageStartDate: monthly
        ? plan.period.coverageStartDate
        : periodStartDate,
      coverageEndDate: monthly
        ? plan.period.coverageEndDate
        : periodEndDate,
    });
    const candidateResult = buildCoachAiReviewInsightCandidatesFromSource(
      sourceSnapshot.source,
      { rsiReferenceVectorsAccepted: false },
    );
    const shortlist = buildCoachAiReviewBalancedShortlist(candidateResult.candidates);
    const catalog = buildCoachAiReviewRenderedPlanCatalog({
      source: sourceSnapshot.source,
      candidates: candidateResult.candidates,
      shortlist,
    });
    const frozenPackage = buildCoachAiReviewProviderPlanPackage({
      requestRef: requestId,
      packageKeySecret: Buffer.from(keyBase64, "base64"),
      sourceSnapshot,
      catalog,
    });
    const settings = new CoachAiProviderSettingsRepository(this.database).read();
    const selectionEnvelope = buildCoachAiReviewOpenAiSelectionEnvelope({
      frozenPackage,
      modelId: settings.modelId,
      timeoutMs: PROVIDER_TIMEOUT_MILLISECONDS,
    });
    const artifact = buildCoachAiReviewInsightSnapshotArtifact({
      createdAtUtc,
      request: Object.freeze({
        requestId,
        reviewKind,
        periodStartDate,
        periodEndDate,
        inputContractVersion: input.contractVersion,
        inputDigestSha256: inputSnapshot.sha256,
        evidenceManifestDigestSha256: manifestSnapshot.sha256,
      }),
      sourceSnapshot,
      candidates: candidateResult.candidates,
      shortlist,
      catalog,
      frozenPackage,
      selectionEnvelope,
    });
    const priorIssuedReviewId = this.priorIssuedReviewId(
      plan.scope,
      reviewKind,
      periodStartDate,
    );
    let requestInput: CoachAiReviewInsightRequestPersistenceInput;
    if (monthly) {
      if (input.contractVersion !== "traderlink_coach_monthly_ai_review_input_v2") {
        throw new Error("TRADERLINK_COACH_INSIGHT_MONTHLY_INPUT_MISMATCH");
      }
      requestInput = {
        reviewKind,
        periodStartDate,
        periodEndDate,
        coverageStartDate: plan.period.coverageStartDate,
        coverageEndDate: plan.period.coverageEndDate,
        narrativeOwnerMonth: periodEndDate.slice(0, 7),
        calendarId: plan.period.calendarId,
        calendarEvidenceDigestSha256: plan.period.calendarEvidenceDigestSha256,
        eligibleAtUtc: input.calendarMonth.scheduledAtUtc,
        requestOrigin,
        inputContractVersion: input.contractVersion,
        inputSha256: inputSnapshot.sha256,
        inputJson: inputSnapshot.json,
        evidenceManifestSha256: manifestSnapshot.sha256,
        evidenceManifestJson: manifestSnapshot.json,
        priorIssuedReviewId,
      };
    } else {
      if (input.contractVersion !== "traderlink_coach_periodic_ai_review_input_v2") {
        throw new Error("TRADERLINK_COACH_INSIGHT_PERIODIC_INPUT_MISMATCH");
      }
      requestInput = {
        reviewKind,
        periodStartDate,
        periodEndDate,
        coverageStartDate: periodStartDate,
        coverageEndDate: periodEndDate,
        narrativeOwnerMonth: periodEndDate.slice(0, 7),
        calendarId: plan.period.calendarId,
        calendarEvidenceDigestSha256: plan.period.calendarEvidenceDigestSha256,
        eligibleAtUtc: input.period.cohorts.at(-1)?.sealedAtUtc ?? "",
        requestOrigin,
        inputContractVersion: input.contractVersion,
        inputSha256: inputSnapshot.sha256,
        inputJson: inputSnapshot.json,
        evidenceManifestSha256: manifestSnapshot.sha256,
        evidenceManifestJson: manifestSnapshot.json,
        priorIssuedReviewId,
      };
    }
    return new CoachAiReviewInsightPersistenceRepository(this.database)
      .createOrReadRequestWithSnapshot(plan.scope, requestInput, artifact);
  }

  private priorIssuedReviewId(
    scope: WorkspaceAccessScope,
    reviewKind: "weekly" | "two_week" | "monthly",
    beforePeriodStartDate: string,
  ): string | null {
    return new CoachAiReviewGenerationCompatibilityRepository(this.database)
      .listIssuedReviews(scope, {
        beforePeriodEndDate: beforePeriodStartDate,
        reviewKinds: reviewKind === "monthly"
          ? ["monthly"]
          : ["weekly", "two_week"],
        limit: 1,
      }).at(0)?.issuedReviewId ?? null;
  }
}
