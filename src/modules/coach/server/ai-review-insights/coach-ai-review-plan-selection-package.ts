import { createHash, createHmac } from "node:crypto";

import {
  COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
  COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION,
  type CoachAiReviewFrozenProviderPlanPackage,
  type CoachAiReviewPlanSelectionResponse,
  type CoachAiReviewPrivatePlanChoice,
  type CoachAiReviewProviderChoiceKey,
  type CoachAiReviewProviderPlanChoice,
  type CoachAiReviewProviderPlanPackage,
} from "@/src/modules/coach/contracts/coach-ai-review-plan-selection-contracts";
import type { CoachAiReviewCalculationSourceSnapshot } from
  "@/src/modules/coach/contracts/coach-ai-review-insight-contracts";
import type {
  CoachAiReviewCompletePlan,
  CoachAiReviewRenderedPlanCatalog,
} from "@/src/modules/coach/contracts/coach-ai-review-rendered-plan-contracts";
import {
  canonicalCoachAiReviewInsightBytes,
  deepFreezeCoachAiReviewInsight,
  digestCanonicalCoachAiReviewInsight,
} from "./coach-ai-review-insight-canonical";
import { CoachAiReviewInsightInvariantError } from "./coach-ai-review-insight-normalizer";

const CHOICE_KEYS = Object.freeze([
  "plan_1",
  "plan_2",
  "plan_3",
  "plan_4",
  "plan_5",
  "plan_6",
] as const);

const PACKAGE_KEY_PATTERN = /^[A-Za-z0-9_-]{22}$/u;

function invariant(condition: boolean, code: string): asserts condition {
  if (!condition) throw new CoachAiReviewInsightInvariantError(code);
}

function assertExactKeys(
  value: object,
  expected: readonly string[],
  code: string,
): void {
  const actual = Object.keys(value).sort();
  const orderedExpected = [...expected].sort();
  invariant(actual.length === orderedExpected.length && actual.every((key, index) =>
    key === orderedExpected[index]), code);
}

function rationale(
  plan: CoachAiReviewCompletePlan,
  defaultPlan: CoachAiReviewCompletePlan,
): string {
  if (plan.reviewPlanRef === defaultPlan.reviewPlanRef) {
    return "The deterministic default preserves the highest-ranked compatible evidence across all sections.";
  }
  const benefits: string[] = [];
  if (defaultPlan.overlapBurden - plan.overlapBurden >= 0.20) {
    benefits.push("uses less repeated evidence across sections");
  }
  if (plan.totalFocusConnection - defaultPlan.totalFocusConnection >= 10) {
    benefits.push("has a stronger connection to an earlier measurable focus");
  }
  if (plan.totalSpecificity - defaultPlan.totalSpecificity >= 10) {
    benefits.push("uses more specific measured evidence");
  }
  invariant(benefits.length > 0, "TRADERLINK_AI_REVIEW_PROVIDER_PLAN_WITHOUT_BENEFIT");
  return `This near-equivalent option ${benefits.join(" and ")} without changing the core period conclusions.`;
}

function publicChoice(
  choiceKey: CoachAiReviewProviderChoiceKey,
  plan: CoachAiReviewCompletePlan,
  defaultPlan: CoachAiReviewCompletePlan,
  catalog: CoachAiReviewRenderedPlanCatalog,
): CoachAiReviewProviderPlanChoice {
  const sections = Object.entries(plan.sectionPlanRefs).map(([sectionKey, sectionPlanRef]) => {
    const section = catalog.sectionPlans.find((item) => item.sectionPlanRef === sectionPlanRef);
    invariant(section !== undefined, "TRADERLINK_AI_REVIEW_PROVIDER_SECTION_MISSING");
    const facts = section.claimRefs.map((claimRef) => {
      const claim = catalog.claims.find((item) => item.claimRef === claimRef);
      invariant(claim !== undefined, "TRADERLINK_AI_REVIEW_PROVIDER_CLAIM_MISSING");
      return claim.renderedSentence;
    });
    return Object.freeze({
      sectionKey: sectionKey as keyof typeof plan.sectionPlanRefs,
      purpose: section.sectionPurpose,
      rankStability: section.rankStability,
      facts: Object.freeze(facts),
    });
  });
  return Object.freeze({
    choiceKey,
    review: plan.output,
    sections: Object.freeze(sections),
    selectionRationale: rationale(plan, defaultPlan),
  });
}

function assertPublicPackageShape(value: CoachAiReviewProviderPlanPackage): void {
  assertExactKeys(value, [
    "packageVersion",
    "selectionContractVersion",
    "packageKey",
    "period",
    "instruction",
    "choices",
  ], "TRADERLINK_AI_REVIEW_PROVIDER_PACKAGE_FIELD_INVALID");
  assertExactKeys(value.period, ["cadence", "startDate", "endDate"],
    "TRADERLINK_AI_REVIEW_PROVIDER_PERIOD_FIELD_INVALID");
  invariant(value.packageVersion === COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION,
    "TRADERLINK_AI_REVIEW_PROVIDER_PACKAGE_VERSION_INVALID");
  invariant(value.selectionContractVersion === COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
    "TRADERLINK_AI_REVIEW_PROVIDER_SELECTION_VERSION_INVALID");
  invariant(PACKAGE_KEY_PATTERN.test(value.packageKey),
    "TRADERLINK_AI_REVIEW_PROVIDER_PACKAGE_KEY_INVALID");
  invariant(value.choices.length >= 1 && value.choices.length <= 6,
    "TRADERLINK_AI_REVIEW_PROVIDER_CHOICE_COUNT_INVALID");
  invariant(new Set(value.choices.map((choice) => choice.choiceKey)).size === value.choices.length,
    "TRADERLINK_AI_REVIEW_PROVIDER_CHOICE_DUPLICATE");
  invariant(value.choices.every((choice, index) => choice.choiceKey === CHOICE_KEYS[index]),
    "TRADERLINK_AI_REVIEW_PROVIDER_CHOICE_ORDER_INVALID");
  for (const choice of value.choices) {
    assertExactKeys(choice, ["choiceKey", "review", "sections", "selectionRationale"],
      "TRADERLINK_AI_REVIEW_PROVIDER_CHOICE_FIELD_INVALID");
    assertExactKeys(choice.review, [
      "reviewSummary",
      "whatImproved",
      "whatHeldYouBack",
      "focusFollowThrough",
      "nextPeriodFocuses",
      "incompleteRecord",
    ], "TRADERLINK_AI_REVIEW_PROVIDER_REVIEW_FIELD_INVALID");
    for (const section of choice.sections) {
      assertExactKeys(section, [
        "sectionKey",
        "purpose",
        "rankStability",
        "facts",
      ], "TRADERLINK_AI_REVIEW_PROVIDER_SECTION_FIELD_INVALID");
    }
  }
}

function assertNoPrivateReferences(
  serialized: string,
  sourceSnapshot: CoachAiReviewCalculationSourceSnapshot,
  catalog: CoachAiReviewRenderedPlanCatalog,
): void {
  const privateReferences = [
    ...sourceSnapshot.source.days.map((day) => day.dayRef),
    ...sourceSnapshot.source.trades.flatMap((trade) => [
      trade.tradeRef,
      trade.trackingTradeVersionKey,
      trade.instrumentRef,
      ...trade.executionEvents.map((event) => event.eventRef),
      ...(trade.tradeStyle
        ? [trade.tradeStyle.styleRef, trade.tradeStyle.trackingStyleVersionKey]
        : []),
      ...(trade.tradeNote ? [trade.tradeNote.noteRef] : []),
      ...trade.swingNotes.map((note) => note.noteRef),
      trade.analyzer.analysisRef,
      trade.analyzer.trackingAnalysisVersionKey,
    ]),
    ...sourceSnapshot.source.rules.flatMap((rule) => [
      rule.ruleRef,
      rule.ruleVersionRef,
      rule.trackingRuleKey,
      rule.trackingRuleVersionKey,
    ]),
    ...sourceSnapshot.source.ruleReviews.flatMap((review) => [
      review.ruleReviewRef,
      review.trackingRuleReviewVersionKey,
      ...(review.noteRef ? [review.noteRef] : []),
    ]),
    ...sourceSnapshot.source.presetEvaluations.flatMap((evaluation) => [
      evaluation.evaluationRef,
      ...(evaluation.trigger ? [evaluation.trigger.evidenceEventRef] : []),
      ...evaluation.violations.map((violation) => violation.evidenceEventRef),
    ]),
    ...sourceSnapshot.source.focuses.map((focus) => focus.focusRef),
    ...sourceSnapshot.source.issuedNarrativeContext.map((review) => review.reviewRef),
    ...sourceSnapshot.source.issuedFocusTargets.flatMap((target) => [
      target.focusTargetRef,
      target.sourceReviewRef,
      target.originatingTrackingSubjectKey,
      ...target.baselineSourceVersionRefs,
    ]),
    ...sourceSnapshot.source.canonicalLineageVersionKeys,
    ...catalog.focusQuestions.flatMap((focus) => [
      focus.focusTargetRef,
      focus.focusQuestionRef,
      focus.actionTargetKey,
    ]),
    ...sourceSnapshot.source.periodEndOpenPositionRefs,
    ...sourceSnapshot.source.periodEndOpenWithInPeriodReductionRefs,
  ].filter((reference): reference is string =>
    typeof reference === "string" && reference.length > 0);
  invariant(privateReferences.every((reference) => !serialized.includes(reference)),
    "TRADERLINK_AI_REVIEW_PRIVATE_REFERENCE_IN_PROVIDER_PACKAGE");
  invariant(!serialized.includes('"tracking:') && !serialized.includes("_stable:"),
    "TRADERLINK_AI_REVIEW_STABLE_TRACKING_KEY_IN_PROVIDER_PACKAGE");
  invariant(!/["'](?:workspace|account|user|broker|statement|attachment|secret|token|password|api[_ -]?key)(?:Id|Ref|Uuid|Fingerprint)?["']/iu.test(serialized),
    "TRADERLINK_AI_REVIEW_PRIVATE_FIELD_IN_PROVIDER_PACKAGE");
}

export function buildCoachAiReviewProviderPlanPackage(input: Readonly<{
  requestRef: string;
  packageKeySecret: string | Uint8Array;
  sourceSnapshot: CoachAiReviewCalculationSourceSnapshot;
  catalog: CoachAiReviewRenderedPlanCatalog;
}>): CoachAiReviewFrozenProviderPlanPackage {
  invariant(input.requestRef.length > 0, "TRADERLINK_AI_REVIEW_REQUEST_REF_MISSING");
  invariant(input.catalog.completePlans.length >= 1 && input.catalog.completePlans.length <= 6,
    "TRADERLINK_AI_REVIEW_COMPLETE_PLAN_COUNT_INVALID");
  invariant(input.catalog.cadence === input.sourceSnapshot.source.period.cadence,
    "TRADERLINK_AI_REVIEW_PLAN_PERIOD_CADENCE_MISMATCH");
  const defaultPlan = input.catalog.completePlans[0]!;
  const publicChoices = Object.freeze(input.catalog.completePlans.map((plan, index) =>
    publicChoice(CHOICE_KEYS[index]!, plan, defaultPlan, input.catalog)));
  const selectionPayload = Object.freeze({
    packageVersion: COACH_AI_REVIEW_PROVIDER_PLAN_PACKAGE_VERSION,
    selectionContractVersion: COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
    period: Object.freeze({
      cadence: input.sourceSnapshot.source.period.cadence,
      startDate: input.sourceSnapshot.source.period.startDate,
      endDate: input.sourceSnapshot.source.period.endDate,
    }),
    instruction: "Select the single complete review that is clearest and most useful as a whole. Return only the strict selection object; do not write or edit review text.",
    choices: publicChoices,
  });
  const selectionPayloadDigest = digestCanonicalCoachAiReviewInsight(selectionPayload);
  const packageKey = createHmac("sha256", input.packageKeySecret).update(
    canonicalCoachAiReviewInsightBytes(Object.freeze({
      requestRef: input.requestRef,
      period: selectionPayload.period,
      sourceDigestSha256: input.sourceSnapshot.sourceDigestSha256,
      selectionContractVersion: COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
      selectionPayloadDigestSha256: selectionPayloadDigest.digestSha256,
    })),
  ).digest().subarray(0, 16).toString("base64url");
  invariant(PACKAGE_KEY_PATTERN.test(packageKey),
    "TRADERLINK_AI_REVIEW_PROVIDER_PACKAGE_KEY_DERIVATION_INVALID");
  const providerPackage: CoachAiReviewProviderPlanPackage = deepFreezeCoachAiReviewInsight({
    ...selectionPayload,
    packageKey,
  });
  assertPublicPackageShape(providerPackage);
  const bytes = canonicalCoachAiReviewInsightBytes(providerPackage);
  const canonicalProviderPackage = bytes.toString("utf8");
  assertNoPrivateReferences(canonicalProviderPackage, input.sourceSnapshot, input.catalog);
  const digest = createHash("sha256").update(bytes).digest("hex");
  const privateChoices: readonly CoachAiReviewPrivatePlanChoice[] = Object.freeze(
    input.catalog.completePlans.map((plan, index) => Object.freeze({
      choiceKey: CHOICE_KEYS[index]!,
      reviewPlanRef: plan.reviewPlanRef,
    })),
  );
  return deepFreezeCoachAiReviewInsight({
    providerPackage,
    canonicalProviderPackage,
    canonicalProviderPackageByteLength: bytes.byteLength,
    providerPackageDigestSha256: digest,
    selectionPayloadDigestSha256: selectionPayloadDigest.digestSha256,
    privateChoices,
    catalog: input.catalog,
  });
}

function strictSelection(value: unknown): CoachAiReviewPlanSelectionResponse {
  invariant(value !== null && !Array.isArray(value) && typeof value === "object",
    "TRADERLINK_AI_REVIEW_SELECTION_NOT_OBJECT");
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  invariant(keys.length === 3 && keys[0] === "choiceKey" && keys[1] === "contractVersion" &&
    keys[2] === "packageKey", "TRADERLINK_AI_REVIEW_SELECTION_UNKNOWN_FIELD");
  invariant(record.contractVersion === COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
    "TRADERLINK_AI_REVIEW_SELECTION_CONTRACT_INVALID");
  invariant(typeof record.packageKey === "string" && PACKAGE_KEY_PATTERN.test(record.packageKey),
    "TRADERLINK_AI_REVIEW_SELECTION_PACKAGE_KEY_INVALID");
  invariant(typeof record.choiceKey === "string" &&
    (CHOICE_KEYS as readonly string[]).includes(record.choiceKey),
  "TRADERLINK_AI_REVIEW_SELECTION_CHOICE_KEY_INVALID");
  return Object.freeze({
    contractVersion: COACH_AI_REVIEW_PLAN_SELECTION_CONTRACT_VERSION,
    packageKey: record.packageKey,
    choiceKey: record.choiceKey as CoachAiReviewProviderChoiceKey,
  });
}

export function resolveCoachAiReviewPlanSelection(input: Readonly<{
  response: unknown;
  frozenPackage: CoachAiReviewFrozenProviderPlanPackage;
}>): Readonly<{
  selection: CoachAiReviewPlanSelectionResponse;
  selectedPlan: CoachAiReviewCompletePlan;
}> {
  const selection = strictSelection(input.response);
  invariant(selection.packageKey === input.frozenPackage.providerPackage.packageKey,
    "TRADERLINK_AI_REVIEW_SELECTION_CROSS_PACKAGE_REPLAY");
  const privateChoice = input.frozenPackage.privateChoices.find((choice) =>
    choice.choiceKey === selection.choiceKey);
  invariant(privateChoice !== undefined, "TRADERLINK_AI_REVIEW_SELECTION_NOT_AUTHORIZED");
  const selectedPlan = input.frozenPackage.catalog.completePlans.find((plan) =>
    plan.reviewPlanRef === privateChoice.reviewPlanRef);
  invariant(selectedPlan !== undefined, "TRADERLINK_AI_REVIEW_SELECTED_PLAN_MISSING");
  return Object.freeze({ selection, selectedPlan });
}
