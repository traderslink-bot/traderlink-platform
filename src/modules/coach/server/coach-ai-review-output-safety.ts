type CoachAiReviewOutputSafetyInput = Readonly<{
  textFields: readonly string[];
  nextFocuses: readonly string[];
}>;

type CoachAiReviewOutputSafetyUsage = Readonly<{
  inputTokens: number | null;
  cachedInputTokens?: number | null;
  cacheWriteInputTokens?: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
}>;

const INTERNAL_LANGUAGE_PATTERN =
  /\b(?:OpenAI|language model|prompt|tokens?|database|data[- ]decisions?|internal systems?)\b/iu;

const DIRECT_ADVICE_PATTERN =
  /\b(?:price target|you should buy|you should sell|guaranteed|diagnosis)\b/iu;

const FORWARD_TRADING_COMMAND_PATTERN =
  /\b(?:before each entry|entry checklist|level hold|volume confirmation|stop[- ]trading|if .{0,80} missing.{0,40} pass)\b/iu;

class CoachAiReviewUnsafeOutputError extends Error {
  readonly usage: CoachAiReviewOutputSafetyUsage;

  constructor(message: string, usage: CoachAiReviewOutputSafetyUsage) {
    super(message);
    this.name = "CoachAiReviewUnsafeOutputError";
    this.usage = usage;
  }
}

/**
 * Treat prompt compliance as untrusted provider output. A response that exposes
 * internal product language or turns a review focus into a trading instruction
 * must fail before the runner can persist it. The existing retry path can then
 * request a fresh response from the immutable evidence snapshot.
 */
export function assertCoachAiReviewOutputSafe(
  input: CoachAiReviewOutputSafetyInput,
  usage: CoachAiReviewOutputSafetyUsage = Object.freeze({
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteInputTokens: null,
    outputTokens: null,
    totalTokens: null,
  }),
): void {
  const allText = [...input.textFields, ...input.nextFocuses].join("\n");
  if (INTERNAL_LANGUAGE_PATTERN.test(allText)) {
    throw new CoachAiReviewUnsafeOutputError(
      "TRADERLINK_COACH_OPENAI_UNSAFE_INTERNAL_LANGUAGE",
      usage,
    );
  }
  if (DIRECT_ADVICE_PATTERN.test(allText) ||
    FORWARD_TRADING_COMMAND_PATTERN.test(input.nextFocuses.join("\n"))) {
    throw new CoachAiReviewUnsafeOutputError(
      "TRADERLINK_COACH_OPENAI_UNSAFE_TRADING_DIRECTION",
      usage,
    );
  }
}
