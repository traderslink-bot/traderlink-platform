import Decimal from "decimal.js";

const ExactDecimal = Decimal.clone({
  precision: 80,
  toExpNeg: -1000,
  toExpPos: 1000,
});

// Above this size, a byte-for-token reservation becomes needlessly punitive
// for JSON evidence packets. Obtain the provider's exact count instead.
export const COACH_AI_REVIEW_LARGE_INPUT_THRESHOLD_BYTES = 65_536;
export const COACH_AI_REVIEW_MAX_SERIALIZED_INPUT_BYTES = 8_000_000;
export const COACH_AI_REVIEW_INPUT_TOKEN_HEADROOM = 8_192;
export const COACH_AI_REVIEW_CONTEXT_SAFETY_TOKENS = 8_192;
export const COACH_AI_REVIEW_LONG_CONTEXT_THRESHOLD_TOKENS = 272_000;

const GPT_5_6_CONTEXT_TOKENS = 1_050_000;
const GPT_5_6_MODEL_PATTERN = /^gpt-5\.6(?:-(?:sol|terra|luna))?$/u;

export function coachAiReviewModelContextTokens(modelId: string): number | null {
  return GPT_5_6_MODEL_PATTERN.test(modelId) ? GPT_5_6_CONTEXT_TOKENS : null;
}

export function coachAiReviewLongContextMultipliers(
  modelId: string,
  inputTokens: number,
): Readonly<{ input: Decimal; output: Decimal }> {
  const longContext = GPT_5_6_MODEL_PATTERN.test(modelId) &&
    inputTokens > COACH_AI_REVIEW_LONG_CONTEXT_THRESHOLD_TOKENS;
  return Object.freeze({
    input: new ExactDecimal(longContext ? 2 : 1),
    output: new ExactDecimal(longContext ? "1.5" : 1),
  });
}
