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

export type CoachAiReviewGroundingInput = Readonly<{
  providerPackage: string;
  priorFocuses: readonly string[];
  previouslyIssuedFocuses: readonly string[];
  focusFollowThroughMayBeUnavailable: boolean;
  reviewSummary: string;
  whatImproved: string;
  whatHeldYouBack: string;
  focusFollowThrough: string;
  nextFocuses: readonly string[];
  incompleteRecord: string | null;
}>;

const INTERNAL_LANGUAGE_PATTERN =
  /\b(?:OpenAI|language model|prompt|tokens?|database|data[- ]decisions?|internal systems?)\b/iu;

const DIRECT_ADVICE_PATTERN =
  /\b(?:price target|you should buy|you should sell|guaranteed|diagnosis|(?:you should|you must|always|never|next time|going forward).{0,80}(?:buy|sell|enter|exit|reduce|increase|move|tighten|widen|take profits?|cut|hold|add))\b/iu;

const FORWARD_TRADING_COMMAND_PATTERN =
  /(?:\b(?:before each entry|entry checklist|level hold|volume confirmation|stop[- ]trading|if .{0,80} missing.{0,40} pass)\b|(?:^|[.!?]\s+)(?:reduce|increase|move|tighten|widen|take|cut|enter|exit|buy|sell|hold|add)\b.{0,80}(?:size|shares?|position|profits?|stop|entry|exit|trade))/imu;

const RECORDKEEPING_PRAISE_PATTERN =
  /\b(?:improvement|improved|strength|positive|discipline|disciplined|good process)\b.{0,100}\b(?:recorded|documented|tagged|completed (?:the )?review|reviewed (?:the )?(?:trade|day)|saved (?:the )?(?:plan|notes?))\b|\b(?:recorded|documented|tagged|completed (?:the )?review|reviewed (?:the )?(?:trade|day)|saved (?:the )?(?:plan|notes?))\b.{0,100}\b(?:improvement|improved|strength|positive|discipline|disciplined|good process)\b/iu;

const OUTCOME_AS_PROCESS_PATTERN =
  /\b(?:profit(?:able)?|positive P\/?L|green|win rate|loss|losing|negative P\/?L|red)\b.{0,100}\b(?:strong|disciplined|quality|improved|poor|weak|bad)\s+(?:execution|performance|process|discipline)\b/giu;

const OUTCOME_PROCESS_NEGATION_PATTERN =
  /\b(?:not|cannot|can't|does not|doesn't|did not|didn't|never|without treating|rather than)\b/iu;

const MISSING_RECORD_AS_FRICTION_PATTERN =
  /\b(?:missing|absent|incomplete|not (?:recorded|reviewed)|lack of)\b.{0,80}\b(?:notes?|tags?|reflections?|daily reviews?|rule reviews?)\b/iu;

const IMPROVEMENT_CLAIM_PATTERN =
  /\b(?:improv(?:e[sd]?|ement)|better|more consistent|less frequent|reduced|increased)\b/iu;

const NO_IMPROVEMENT_ESTABLISHED_PATTERN =
  /\b(?:no clear|not enough|did not|could not|was not|wasn't|insufficient)\b.{0,100}\bimprov(?:e[sd]?|ement)\b/iu;

const COMPARATIVE_IMPROVEMENT_PATTERN =
  /\b(?:compared (?:with|to)|relative to|earlier|later|prior|previous|from .{1,80} to|than (?:the )?(?:first|earlier|prior|previous))\b/iu;

const FOCUS_UNAVAILABLE_PATTERN =
  /\b(?:could not be assessed|could not assess|not enough later|no later[- ]dated|no eligible earlier focus|no earlier issued focus)\b/iu;

const EXPLICIT_TICKER_REFERENCE_PATTERN =
  /(?:\b(?:ticker|symbol|traded?|trade in|position in|shares? of|stock)\s+\$?([A-Z][A-Z0-9.-]{1,9})\b|(?:^|\s)\$([A-Z][A-Z0-9.-]{1,9})\b)/gu;

class CoachAiReviewUnsafeOutputError extends Error {
  readonly usage: CoachAiReviewOutputSafetyUsage;

  constructor(message: string, usage: CoachAiReviewOutputSafetyUsage) {
    super(message);
    this.name = "CoachAiReviewUnsafeOutputError";
    this.usage = usage;
  }
}

function normalizedDecimal(value: string): string | null {
  const match = value.trim().replaceAll(",", "").match(/^(-?)(\d+)(?:\.(\d+))?$/u);
  if (!match) return null;
  const integer = (match[2] ?? "0").replace(/^0+(?=\d)/u, "");
  const fraction = (match[3] ?? "").replace(/0+$/u, "");
  const sign = match[1] === "-" && (integer !== "0" || fraction !== "") ? "-" : "";
  return `${sign}${integer}${fraction ? `.${fraction}` : ""}`;
}

type ProviderFacts = Readonly<{
  coverageIncompleteRequired: boolean;
  dates: ReadonlySet<string>;
  money: ReadonlySet<string>;
  percentages: ReadonlySet<string>;
  tickers: ReadonlySet<string>;
}>;

function providerFacts(serialized: string): ProviderFacts {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new Error("TRADERLINK_COACH_PROVIDER_PACKAGE_INVALID");
  }
  const dates = new Set<string>();
  const money = new Set<string>();
  const percentages = new Set<string>();
  const tickers = new Set<string>();
  const visit = (value: unknown, key = ""): void => {
    if (typeof value === "string") {
      for (const match of value.matchAll(/\b\d{4}-\d{2}-\d{2}\b/gu)) dates.add(match[0]);
      if (key === "ticker") tickers.add(value.toLocaleUpperCase());
      const decimal = normalizedDecimal(value);
      if (decimal !== null && /(?:Pnl|Price|Move|Reversal|Edge|Fee|Turnover|Decimal)/u.test(key)) {
        money.add(decimal);
      }
      if (decimal !== null && /Percent/u.test(key)) percentages.add(decimal);
      return;
    }
    if (Array.isArray(value)) {
      for (const item of value) visit(item, key);
      return;
    }
    if (!value || typeof value !== "object") return;
    for (const [childKey, child] of Object.entries(value)) visit(child, childKey);
  };
  visit(parsed);
  const coverageNotice = parsed && typeof parsed === "object" &&
      "coverageNotice" in parsed && parsed.coverageNotice &&
      typeof parsed.coverageNotice === "object"
    ? parsed.coverageNotice as Readonly<{ incompleteRecordRequired?: unknown }>
    : null;
  return Object.freeze({
    coverageIncompleteRequired: coverageNotice?.incompleteRecordRequired === true,
    dates,
    money,
    percentages,
    tickers,
  });
}

function significantWords(value: string): ReadonlySet<string> {
  const stop = new Set(["a", "an", "and", "for", "in", "of", "on", "the", "to", "with", "your"]);
  return new Set(value.toLocaleLowerCase().match(/[a-z0-9]+/gu)?.filter((word) =>
    word.length > 2 && !stop.has(word)) ?? []);
}

function focusSimilarity(left: string, right: string): number {
  const a = significantWords(left);
  const b = significantWords(right);
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) if (b.has(word)) intersection += 1;
  return intersection / new Set([...a, ...b]).size;
}

function hasUnsupportedOutcomeProcessClaim(value: string): boolean {
  for (const match of value.matchAll(OUTCOME_AS_PROCESS_PATTERN)) {
    if (!OUTCOME_PROCESS_NEGATION_PATTERN.test(match[0])) return true;
  }
  return false;
}

function throwUnsafe(message: string, usage?: CoachAiReviewOutputSafetyUsage): never {
  throw new CoachAiReviewUnsafeOutputError(message, usage ?? Object.freeze({
    inputTokens: null,
    cachedInputTokens: null,
    cacheWriteInputTokens: null,
    outputTokens: null,
    totalTokens: null,
  }));
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
    FORWARD_TRADING_COMMAND_PATTERN.test(allText)) {
    throw new CoachAiReviewUnsafeOutputError(
      "TRADERLINK_COACH_OPENAI_UNSAFE_TRADING_DIRECTION",
      usage,
    );
  }
}

/**
 * Rejects structurally valid provider prose that contradicts facts the server
 * can verify without interpreting trading behavior. This does not attempt to
 * replace human-quality evaluation; it prevents known classes of unsupported
 * output from becoming immutable review history.
 */
export function assertCoachAiReviewOutputGrounded(
  input: CoachAiReviewGroundingInput,
  usage?: CoachAiReviewOutputSafetyUsage,
): void {
  const facts = providerFacts(input.providerPackage);
  if (facts.coverageIncompleteRequired !== (input.incompleteRecord !== null)) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_COVERAGE_CLAIM", usage);
  }
  if ((input.priorFocuses.length === 0 &&
      !FOCUS_UNAVAILABLE_PATTERN.test(input.focusFollowThrough)) ||
      (input.priorFocuses.length > 0 &&
      !input.priorFocuses.some((focus) => input.focusFollowThrough.includes(focus)) &&
      !(input.focusFollowThroughMayBeUnavailable &&
        FOCUS_UNAVAILABLE_PATTERN.test(input.focusFollowThrough)))) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_FOCUS_REFERENCE", usage);
  }
  if (RECORDKEEPING_PRAISE_PATTERN.test(input.whatImproved)) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_RECORDKEEPING_PRAISE", usage);
  }
  if (IMPROVEMENT_CLAIM_PATTERN.test(input.whatImproved) &&
      !NO_IMPROVEMENT_ESTABLISHED_PATTERN.test(input.whatImproved) &&
      !COMPARATIVE_IMPROVEMENT_PATTERN.test(input.whatImproved)) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_IMPROVEMENT", usage);
  }
  if (hasUnsupportedOutcomeProcessClaim([
    input.reviewSummary,
    input.whatImproved,
    input.whatHeldYouBack,
    input.focusFollowThrough,
  ].join("\n"))) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_OUTCOME_PROCESS_CLAIM", usage);
  }
  if (MISSING_RECORD_AS_FRICTION_PATTERN.test(input.whatHeldYouBack)) {
    throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_RECORDKEEPING_FRICTION", usage);
  }
  for (let left = 0; left < input.nextFocuses.length; left += 1) {
    for (let right = left + 1; right < input.nextFocuses.length; right += 1) {
      if (focusSimilarity(input.nextFocuses[left]!, input.nextFocuses[right]!) >= 0.72) {
        throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_DUPLICATE_FOCUSES", usage);
      }
    }
    if (input.previouslyIssuedFocuses.some((focus) =>
      focusSimilarity(input.nextFocuses[left]!, focus) >= 0.82)) {
      throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_REPEATED_FOCUS", usage);
    }
  }

  const allText = [
    input.reviewSummary,
    input.whatImproved,
    input.whatHeldYouBack,
    input.focusFollowThrough,
    ...input.nextFocuses,
    input.incompleteRecord ?? "",
  ].join("\n");
  for (const match of allText.matchAll(/\b\d{4}-\d{2}-\d{2}\b/gu)) {
    if (!facts.dates.has(match[0])) {
      throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_DATE", usage);
    }
  }
  for (const match of allText.matchAll(/([+-]?)[$€£]\s*(\d[\d,]*(?:\.\d+)?)/gu)) {
    const value = normalizedDecimal(`${match[1] === "-" ? "-" : ""}${match[2]}`);
    if (value === null || !facts.money.has(value)) {
      throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_MONEY", usage);
    }
  }
  for (const match of allText.matchAll(/\b(-?\d+(?:\.\d+)?)%/gu)) {
    const value = normalizedDecimal(match[1]!);
    if (value === null || !facts.percentages.has(value)) {
      throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_PERCENTAGE", usage);
    }
  }
  for (const match of allText.matchAll(EXPLICIT_TICKER_REFERENCE_PATTERN)) {
    const candidate = match[1] ?? match[2];
    if (!candidate || !facts.tickers.has(candidate)) {
      throwUnsafe("TRADERLINK_COACH_OPENAI_UNSAFE_UNSUPPORTED_TICKER", usage);
    }
  }
}
