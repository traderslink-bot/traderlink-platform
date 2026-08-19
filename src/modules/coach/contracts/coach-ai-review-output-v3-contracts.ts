export const COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3 =
  "traderlink_coach_periodic_ai_review_output_v3" as const;
export const COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3 =
  "traderlink_coach_monthly_ai_review_output_v3" as const;
export const COACH_PERIODIC_AI_REVIEW_PROMPT_RENDERER_VERSION_V3 =
  "periodic_insight_v1_renderer_v1" as const;
export const COACH_MONTHLY_AI_REVIEW_PROMPT_RENDERER_VERSION_V3 =
  "monthly_insight_v1_renderer_v1" as const;

export type CoachAiReviewOutputV3 = Readonly<{
  contractVersion:
    | typeof COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3
    | typeof COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3;
  promptRendererVersion:
    | typeof COACH_PERIODIC_AI_REVIEW_PROMPT_RENDERER_VERSION_V3
    | typeof COACH_MONTHLY_AI_REVIEW_PROMPT_RENDERER_VERSION_V3;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextPeriodFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

type CoachAiReviewVisibleOutput = Omit<
  CoachAiReviewOutputV3,
  "contractVersion" | "promptRendererVersion"
>;

function invalidOutput(): never {
  throw new Error("TRADERLINK_COACH_AI_REVIEW_OUTPUT_V3_INVALID");
}

export function buildCoachAiReviewOutputV3(
  reviewKind: "weekly" | "two_week" | "monthly",
  visible: CoachAiReviewVisibleOutput,
): CoachAiReviewOutputV3 {
  return parseCoachAiReviewOutputV3(reviewKind, {
    contractVersion: reviewKind === "monthly"
      ? COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3
      : COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3,
    promptRendererVersion: reviewKind === "monthly"
      ? COACH_MONTHLY_AI_REVIEW_PROMPT_RENDERER_VERSION_V3
      : COACH_PERIODIC_AI_REVIEW_PROMPT_RENDERER_VERSION_V3,
    ...visible,
  });
}

export function parseCoachAiReviewOutputV3(
  reviewKind: "weekly" | "two_week" | "monthly",
  input: string | unknown,
): CoachAiReviewOutputV3 {
  let value: unknown;
  try {
    value = typeof input === "string" ? JSON.parse(input) : input;
  } catch {
    return invalidOutput();
  }
  if (!value || Array.isArray(value) || typeof value !== "object") {
    return invalidOutput();
  }
  const record = value as Record<string, unknown>;
  const expectedKeys = [
    "contractVersion",
    "promptRendererVersion",
    "reviewSummary",
    "whatImproved",
    "whatHeldYouBack",
    "focusFollowThrough",
    "nextPeriodFocuses",
    "incompleteRecord",
  ].sort();
  const keys = Object.keys(record).sort();
  if (keys.length !== expectedKeys.length ||
      !keys.every((key, index) => key === expectedKeys[index])) {
    return invalidOutput();
  }
  const expectedContract = reviewKind === "monthly"
    ? COACH_MONTHLY_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3
    : COACH_PERIODIC_AI_REVIEW_OUTPUT_CONTRACT_VERSION_V3;
  const expectedRenderer = reviewKind === "monthly"
    ? COACH_MONTHLY_AI_REVIEW_PROMPT_RENDERER_VERSION_V3
    : COACH_PERIODIC_AI_REVIEW_PROMPT_RENDERER_VERSION_V3;
  const prose = [
    record.reviewSummary,
    record.whatImproved,
    record.whatHeldYouBack,
    record.focusFollowThrough,
  ];
  if (record.contractVersion !== expectedContract ||
      record.promptRendererVersion !== expectedRenderer ||
      !prose.every((item) => typeof item === "string" &&
        item.trim().length > 0 && item.length <= 8_000) ||
      !Array.isArray(record.nextPeriodFocuses) ||
      record.nextPeriodFocuses.length < 1 ||
      record.nextPeriodFocuses.length > 3 ||
      !record.nextPeriodFocuses.every((item) => typeof item === "string" &&
        item.trim().length > 0 && item.length <= 2_000) ||
      new Set(record.nextPeriodFocuses).size !== record.nextPeriodFocuses.length ||
      (record.incompleteRecord !== null &&
        (typeof record.incompleteRecord !== "string" ||
          record.incompleteRecord.trim().length === 0 ||
          record.incompleteRecord.length > 8_000))) {
    return invalidOutput();
  }
  return Object.freeze({
    contractVersion: expectedContract,
    promptRendererVersion: expectedRenderer,
    reviewSummary: record.reviewSummary as string,
    whatImproved: record.whatImproved as string,
    whatHeldYouBack: record.whatHeldYouBack as string,
    focusFollowThrough: record.focusFollowThrough as string,
    nextPeriodFocuses: Object.freeze([...(record.nextPeriodFocuses as string[])]),
    incompleteRecord: record.incompleteRecord as string | null,
  });
}
