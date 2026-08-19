import {
  COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
  type CoachAiReviewCalculationSourceSnapshot,
  type CoachAiReviewInsightCandidate,
} from "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import {
  COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
  COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION,
  type CoachAiReviewFrozenProviderPlanPackage,
  type CoachAiReviewPrivatePlanChoice,
  type CoachAiReviewProviderPlanPackage,
} from "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import {
  COACH_AI_REVIEW_PLAN_CATALOG_VERSION,
  COACH_AI_REVIEW_RENDERER_VERSION,
  type CoachAiReviewRenderedPlanCatalog,
} from "@/src/modules/coach/contracts/coach-ai-review-rendered-plan-contracts";
import type {
  CoachAiReviewOpenAiInvocationManifest,
  CoachAiReviewOpenAiSelectionEnvelope,
} from "./coach-ai-review-openai-plan-selector";
import {
  COACH_AI_REVIEW_OPENAI_INVOCATION_MANIFEST_VERSION,
  COACH_AI_REVIEW_OPENAI_PROVIDER_KEY,
  COACH_AI_REVIEW_OPENAI_SELECTOR_ADAPTER_VERSION,
  COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS,
} from "./coach-ai-review-openai-plan-selector";
import type { CoachAiReviewBalancedShortlist } from
  "./coach-ai-review-insight-shortlist";
import {
  canonicalCoachAiReviewInsightBytes,
  deepFreezeCoachAiReviewInsight,
  digestCanonicalCoachAiReviewInsight,
} from "./coach-ai-review-insight-canonical";
import { CoachAiReviewInsightInvariantError } from
  "./coach-ai-review-insight-normalizer";

export const COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION =
  "traderlink_coach_ai_review_insight_snapshot_v1" as const;
export const COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3 =
  "insight_selection_v3" as const;

type FrozenProviderPackageArtifact = Readonly<{
  canonicalProviderPackage: string;
  canonicalProviderPackageByteLength: number;
  providerPackageDigestSha256: string;
  selectionPayloadDigestSha256: string;
  privateChoices: readonly CoachAiReviewPrivatePlanChoice[];
}>;

type FrozenSelectionEnvelopeArtifact = Readonly<{
  system: CoachAiReviewOpenAiSelectionEnvelope["system"];
  maximumOutputTokens: CoachAiReviewOpenAiSelectionEnvelope["maximumOutputTokens"];
  selectionSchema: unknown;
  selectionSchemaDigestSha256: string;
  invocationManifest: CoachAiReviewOpenAiInvocationManifest;
  invocationManifestDigestSha256: string;
  reservationTextByteLength: number;
  reservationTextDigestSha256: string;
}>;

export type CoachAiReviewInsightSnapshotArtifact = Readonly<{
  snapshotContractVersion: typeof COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION;
  generationContractVersion: typeof COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3;
  createdAtUtc: string;
  request: Readonly<{
    requestId: string;
    reviewKind: "weekly" | "two_week" | "monthly";
    periodStartDate: string;
    periodEndDate: string;
    inputContractVersion:
      | "traderlink_coach_periodic_ai_review_input_v2"
      | "traderlink_coach_monthly_ai_review_input_v2";
    inputDigestSha256: string;
    evidenceManifestDigestSha256: string;
  }>;
  sourceSnapshot: CoachAiReviewCalculationSourceSnapshot;
  candidates: readonly CoachAiReviewInsightCandidate[];
  shortlist: CoachAiReviewBalancedShortlist;
  catalog: CoachAiReviewRenderedPlanCatalog;
  providerPackage: FrozenProviderPackageArtifact;
  selectionEnvelope: FrozenSelectionEnvelopeArtifact;
  digests: Readonly<{
    sourceDigestSha256: string;
    candidatesDigestSha256: string;
    shortlistDigestSha256: string;
    catalogDigestSha256: string;
  }>;
}>;

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function exactKeys(value: object, expected: readonly string[], code: string): void {
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  invariant(actual.length === wanted.length && actual.every((key, index) =>
    key === wanted[index]), code);
}

function parseCanonicalProviderPackage(
  value: FrozenProviderPackageArtifact,
): CoachAiReviewProviderPlanPackage {
  invariant(value !== null && typeof value === "object",
    "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_INVALID");
  invariant(Buffer.byteLength(value.canonicalProviderPackage, "utf8") ===
    value.canonicalProviderPackageByteLength,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_LENGTH_MISMATCH");
  let parsed: unknown;
  try {
    parsed = JSON.parse(value.canonicalProviderPackage);
  } catch {
    throw new CoachAiReviewInsightInvariantError(
      "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_JSON_INVALID",
    );
  }
  invariant(parsed !== null && !Array.isArray(parsed) && typeof parsed === "object",
    "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_INVALID");
  invariant(canonicalCoachAiReviewInsightBytes(parsed).toString("utf8") ===
    value.canonicalProviderPackage,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_NOT_CANONICAL");
  invariant(digestCanonicalCoachAiReviewInsight(parsed).digestSha256 ===
    value.providerPackageDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_DIGEST_MISMATCH");
  const record = parsed as Record<string, unknown>;
  exactKeys(record, [
    "packageVersion",
    "selectionContractVersion",
    "packageKey",
    "period",
    "instruction",
    "choices",
  ], "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_FIELDS_INVALID");
  invariant(record.packageVersion === COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION &&
    record.selectionContractVersion === COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_VERSION_INVALID");
  invariant(typeof record.packageKey === "string" &&
    /^[A-Za-z0-9_-]{22}$/u.test(record.packageKey),
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_PACKAGE_KEY_INVALID");
  invariant(Array.isArray(record.choices) && record.choices.length >= 1 &&
    record.choices.length <= 6,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_CHOICES_INVALID");
  const selectionPayload = Object.fromEntries(Object.entries(record)
    .filter(([key]) => key !== "packageKey"));
  invariant(digestCanonicalCoachAiReviewInsight(selectionPayload).digestSha256 ===
    value.selectionPayloadDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_SELECTION_PAYLOAD_DIGEST_MISMATCH");
  return deepFreezeCoachAiReviewInsight(parsed as CoachAiReviewProviderPlanPackage);
}

function reservationText(artifact: CoachAiReviewInsightSnapshotArtifact): string {
  return canonicalCoachAiReviewInsightBytes(Object.freeze({
    system: artifact.selectionEnvelope.system,
    prompt: artifact.providerPackage.canonicalProviderPackage,
    schema: artifact.selectionEnvelope.selectionSchema,
  })).toString("utf8");
}

export function buildCoachAiReviewInsightSnapshotArtifact(input: Readonly<{
  createdAtUtc: string;
  request: CoachAiReviewInsightSnapshotArtifact["request"];
  sourceSnapshot: CoachAiReviewCalculationSourceSnapshot;
  candidates: readonly CoachAiReviewInsightCandidate[];
  shortlist: CoachAiReviewBalancedShortlist;
  catalog: CoachAiReviewRenderedPlanCatalog;
  frozenPackage: CoachAiReviewFrozenProviderPlanPackage;
  selectionEnvelope: CoachAiReviewOpenAiSelectionEnvelope;
}>): CoachAiReviewInsightSnapshotArtifact {
  const artifact: CoachAiReviewInsightSnapshotArtifact = {
    snapshotContractVersion: COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION,
    generationContractVersion: COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3,
    createdAtUtc: input.createdAtUtc,
    request: input.request,
    sourceSnapshot: input.sourceSnapshot,
    candidates: input.candidates,
    shortlist: input.shortlist,
    catalog: input.catalog,
    providerPackage: Object.freeze({
      canonicalProviderPackage: input.frozenPackage.canonicalProviderPackage,
      canonicalProviderPackageByteLength:
        input.frozenPackage.canonicalProviderPackageByteLength,
      providerPackageDigestSha256: input.frozenPackage.providerPackageDigestSha256,
      selectionPayloadDigestSha256: input.frozenPackage.selectionPayloadDigestSha256,
      privateChoices: input.frozenPackage.privateChoices,
    }),
    selectionEnvelope: Object.freeze({
      system: input.selectionEnvelope.system,
      maximumOutputTokens: input.selectionEnvelope.maximumOutputTokens,
      selectionSchema: input.selectionEnvelope.selectionSchema,
      selectionSchemaDigestSha256: input.selectionEnvelope.selectionSchemaDigestSha256,
      invocationManifest: input.selectionEnvelope.invocationManifest,
      invocationManifestDigestSha256:
        input.selectionEnvelope.invocationManifestDigestSha256,
      reservationTextByteLength: Buffer.byteLength(
        input.selectionEnvelope.reservationText,
        "utf8",
      ),
      reservationTextDigestSha256: digestCanonicalCoachAiReviewInsight(
        JSON.parse(input.selectionEnvelope.reservationText),
      ).digestSha256,
    }),
    digests: Object.freeze({
      sourceDigestSha256: input.sourceSnapshot.sourceDigestSha256,
      candidatesDigestSha256:
        digestCanonicalCoachAiReviewInsight(input.candidates).digestSha256,
      shortlistDigestSha256:
        digestCanonicalCoachAiReviewInsight(input.shortlist).digestSha256,
      catalogDigestSha256:
        digestCanonicalCoachAiReviewInsight(input.catalog).digestSha256,
    }),
  };
  return validateCoachAiReviewInsightSnapshotArtifact(artifact);
}

export function validateCoachAiReviewInsightSnapshotArtifact(
  value: CoachAiReviewInsightSnapshotArtifact,
): CoachAiReviewInsightSnapshotArtifact {
  invariant(value !== null && typeof value === "object",
    "TRADERLINK_AI_REVIEW_SNAPSHOT_INVALID");
  exactKeys(value, [
    "snapshotContractVersion",
    "generationContractVersion",
    "createdAtUtc",
    "request",
    "sourceSnapshot",
    "candidates",
    "shortlist",
    "catalog",
    "providerPackage",
    "selectionEnvelope",
    "digests",
  ], "TRADERLINK_AI_REVIEW_SNAPSHOT_FIELDS_INVALID");
  invariant(value.snapshotContractVersion ===
    COACH_AI_REVIEW_INSIGHT_SNAPSHOT_CONTRACT_VERSION &&
    value.generationContractVersion === COACH_AI_REVIEW_GENERATION_CONTRACT_VERSION_V3,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_VERSION_INVALID");
  invariant(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(value.createdAtUtc),
    "TRADERLINK_AI_REVIEW_SNAPSHOT_TIMESTAMP_INVALID");
  invariant(value.request !== null && typeof value.request === "object",
    "TRADERLINK_AI_REVIEW_SNAPSHOT_REQUEST_INVALID");
  exactKeys(value.request, [
    "requestId",
    "reviewKind",
    "periodStartDate",
    "periodEndDate",
    "inputContractVersion",
    "inputDigestSha256",
    "evidenceManifestDigestSha256",
  ], "TRADERLINK_AI_REVIEW_SNAPSHOT_REQUEST_FIELDS_INVALID");
  invariant(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u
    .test(value.request.requestId) &&
    /^[0-9a-f]{64}$/u.test(value.request.inputDigestSha256) &&
    /^[0-9a-f]{64}$/u.test(value.request.evidenceManifestDigestSha256),
  "TRADERLINK_AI_REVIEW_SNAPSHOT_REQUEST_IDENTITY_INVALID");
  invariant(value.request.reviewKind === value.sourceSnapshot.source.period.cadence &&
    value.request.periodStartDate === value.sourceSnapshot.source.period.startDate &&
    value.request.periodEndDate === value.sourceSnapshot.source.period.endDate &&
    value.sourceSnapshot.source.period.coverageStartDate >=
      value.sourceSnapshot.source.period.startDate &&
    value.sourceSnapshot.source.period.coverageEndDate ===
      value.sourceSnapshot.source.period.endDate &&
    value.sourceSnapshot.source.period.coverageStartDate <=
      value.sourceSnapshot.source.period.coverageEndDate &&
    ((value.request.reviewKind === "monthly" &&
      value.request.inputContractVersion ===
        "traderlink_coach_monthly_ai_review_input_v2") ||
      (value.request.reviewKind !== "monthly" &&
        value.request.inputContractVersion ===
          "traderlink_coach_periodic_ai_review_input_v2")),
  "TRADERLINK_AI_REVIEW_SNAPSHOT_REQUEST_PERIOD_INVALID");
  invariant(value.sourceSnapshot.source.engineVersion ===
    COACH_AI_REVIEW_INSIGHT_ENGINE_VERSION,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_ENGINE_VERSION_INVALID");
  const sourceDigest = digestCanonicalCoachAiReviewInsight(value.sourceSnapshot.source);
  invariant(sourceDigest.byteLength === value.sourceSnapshot.canonicalSourceByteLength &&
    sourceDigest.digestSha256 === value.sourceSnapshot.sourceDigestSha256 &&
    value.digests.sourceDigestSha256 === value.sourceSnapshot.sourceDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_SOURCE_DIGEST_MISMATCH");
  invariant(digestCanonicalCoachAiReviewInsight(value.candidates).digestSha256 ===
    value.digests.candidatesDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_CANDIDATES_DIGEST_MISMATCH");
  invariant(digestCanonicalCoachAiReviewInsight(value.shortlist).digestSha256 ===
    value.digests.shortlistDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_SHORTLIST_DIGEST_MISMATCH");
  invariant(value.catalog.catalogVersion === COACH_AI_REVIEW_PLAN_CATALOG_VERSION &&
    value.catalog.rendererVersion === COACH_AI_REVIEW_RENDERER_VERSION &&
    digestCanonicalCoachAiReviewInsight(value.catalog).digestSha256 ===
      value.digests.catalogDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_CATALOG_DIGEST_MISMATCH");
  invariant(value.catalog.completePlans.length >= 1 &&
    value.catalog.completePlans.length <= 6,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PLAN_COUNT_INVALID");

  const providerPackage = parseCanonicalProviderPackage(value.providerPackage);
  const packageChoices = providerPackage.choices.map((choice) => choice.choiceKey);
  invariant(value.providerPackage.privateChoices.length === packageChoices.length &&
    value.providerPackage.privateChoices.every((choice, index) =>
      choice.choiceKey === packageChoices[index] &&
      value.catalog.completePlans.some((plan) =>
        plan.reviewPlanRef === choice.reviewPlanRef)),
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PRIVATE_CHOICES_INVALID");
  invariant(new Set(value.providerPackage.privateChoices.map((choice) =>
    choice.reviewPlanRef)).size === value.providerPackage.privateChoices.length,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_PRIVATE_CHOICES_DUPLICATE");
  invariant(providerPackage.choices.every((choice, index) => {
    const privateChoice = value.providerPackage.privateChoices[index];
    const plan = value.catalog.completePlans.find((candidate) =>
      candidate.reviewPlanRef === privateChoice?.reviewPlanRef);
    return privateChoice?.choiceKey === choice.choiceKey && plan !== undefined &&
      canonicalCoachAiReviewInsightBytes(choice.review).equals(
        canonicalCoachAiReviewInsightBytes(plan.output),
      );
  }), "TRADERLINK_AI_REVIEW_SNAPSHOT_PROVIDER_REVIEW_MISMATCH");

  invariant(value.selectionEnvelope.maximumOutputTokens ===
    COACH_AI_REVIEW_PLAN_SELECTION_MAX_OUTPUT_TOKENS &&
    digestCanonicalCoachAiReviewInsight(value.selectionEnvelope.selectionSchema)
      .digestSha256 === value.selectionEnvelope.selectionSchemaDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_SELECTION_SCHEMA_MISMATCH");
  const manifest = value.selectionEnvelope.invocationManifest;
  invariant(manifest.manifestVersion ===
    COACH_AI_REVIEW_OPENAI_INVOCATION_MANIFEST_VERSION &&
    manifest.adapterVersion === COACH_AI_REVIEW_OPENAI_SELECTOR_ADAPTER_VERSION &&
    manifest.providerKey === COACH_AI_REVIEW_OPENAI_PROVIDER_KEY &&
    manifest.maximumOutputTokens ===
      value.selectionEnvelope.maximumOutputTokens &&
    manifest.providerPackageDigestSha256 ===
      value.providerPackage.providerPackageDigestSha256 &&
    manifest.selectionInstructionDigestSha256 ===
      digestCanonicalCoachAiReviewInsight(value.selectionEnvelope.system).digestSha256 &&
    manifest.selectionSchemaDigestSha256 ===
      value.selectionEnvelope.selectionSchemaDigestSha256 &&
    digestCanonicalCoachAiReviewInsight(manifest).digestSha256 ===
      value.selectionEnvelope.invocationManifestDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_INVOCATION_MANIFEST_MISMATCH");
  const reservation = reservationText(value);
  invariant(Buffer.byteLength(reservation, "utf8") ===
    value.selectionEnvelope.reservationTextByteLength &&
    digestCanonicalCoachAiReviewInsight(JSON.parse(reservation)).digestSha256 ===
      value.selectionEnvelope.reservationTextDigestSha256,
  "TRADERLINK_AI_REVIEW_SNAPSHOT_RESERVATION_TEXT_MISMATCH");
  return deepFreezeCoachAiReviewInsight(value) as CoachAiReviewInsightSnapshotArtifact;
}

export function restoreCoachAiReviewFrozenProviderPackage(
  artifact: CoachAiReviewInsightSnapshotArtifact,
): CoachAiReviewFrozenProviderPlanPackage {
  const validated = validateCoachAiReviewInsightSnapshotArtifact(artifact);
  return deepFreezeCoachAiReviewInsight({
    providerPackage: parseCanonicalProviderPackage(validated.providerPackage),
    canonicalProviderPackage: validated.providerPackage.canonicalProviderPackage,
    canonicalProviderPackageByteLength:
      validated.providerPackage.canonicalProviderPackageByteLength,
    providerPackageDigestSha256:
      validated.providerPackage.providerPackageDigestSha256,
    selectionPayloadDigestSha256:
      validated.providerPackage.selectionPayloadDigestSha256,
    privateChoices: validated.providerPackage.privateChoices,
    catalog: validated.catalog,
  });
}

export function restoreCoachAiReviewOpenAiSelectionEnvelope(
  artifact: CoachAiReviewInsightSnapshotArtifact,
): CoachAiReviewOpenAiSelectionEnvelope {
  const validated = validateCoachAiReviewInsightSnapshotArtifact(artifact);
  return deepFreezeCoachAiReviewInsight({
    system: validated.selectionEnvelope.system,
    prompt: validated.providerPackage.canonicalProviderPackage,
    maximumOutputTokens: validated.selectionEnvelope.maximumOutputTokens,
    selectionSchema: validated.selectionEnvelope.selectionSchema,
    selectionSchemaDigestSha256:
      validated.selectionEnvelope.selectionSchemaDigestSha256,
    invocationManifest: validated.selectionEnvelope.invocationManifest,
    invocationManifestDigestSha256:
      validated.selectionEnvelope.invocationManifestDigestSha256,
    reservationText: reservationText(validated),
  });
}
