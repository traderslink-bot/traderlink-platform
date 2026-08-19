import {
  acceptedRsi14,
  isAcceptedRsi14CalculationVersion,
  RSI_14_CALCULATION_VERSION,
} from
  "@/src/lib/trade-candle-analysis/indicator-context";
import type { CoachAiReviewTradeAnalysisV2 } from
  "../contracts/weekly-ai-review-input-contracts";

const INTERNAL_COVERAGE_FIELDS = new Set([
  "accountNeedsDecisionCount",
  "accountPendingDataDecisionCount",
]);

const HISTORICAL_REVIEW_CONTEXT_KEYS = new Set([
  "priorIssuedReview",
  "priorMonthlyReview",
  "reviewNarrativeContextEntry",
]);

const EXCLUDED_PENDING_RECORD_LIMITATION =
  "Unresolved account records were excluded from the review facts.";

const PUBLIC_LIMITATIONS: Readonly<Record<string, string>> = Object.freeze({
  detailed_execution_facts_unavailable:
    "Detailed execution facts were unavailable for some included trade records.",
  incomplete_daily_review_coverage:
    "Some Trade Tracker reviews were not marked complete when this review began.",
  incomplete_daily_reflection_coverage:
    "Some Trade Tracker reflections were not marked complete when this review began.",
  legitimate_open_positions_excluded:
    "Open positions were excluded from realized results.",
  no_trade_review_signal_unavailable:
    "No-trade review coverage was unavailable for at least one market date.",
  pre_enable_reflection_excluded:
    "Reflections saved before AI Reviews were enabled were excluded.",
});

function publicText(value: string): string {
  return value
    .replace(/data[-_ ]decisions?/giu, "unresolved records");
}

type ProviderRuleDefinition = Readonly<{
  category: string;
  statement: string;
  title: string;
}>;

function ruleDefinitionKey(value: ProviderRuleDefinition): string {
  return JSON.stringify([value.category, value.statement, value.title]);
}

function collectRuleDefinitions(value: unknown, result: Map<string, ProviderRuleDefinition>): void {
  if (Array.isArray(value)) {
    for (const item of value) collectRuleDefinitions(item, result);
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "ruleOutcomes" && Array.isArray(item)) {
      for (const outcome of item) {
        if (!outcome || typeof outcome !== "object") continue;
        const candidate = outcome as Partial<ProviderRuleDefinition>;
        if (typeof candidate.category !== "string" ||
            typeof candidate.statement !== "string" ||
            typeof candidate.title !== "string") continue;
        const definition = Object.freeze({
          category: candidate.category,
          statement: candidate.statement,
          title: candidate.title,
        });
        result.set(ruleDefinitionKey(definition), definition);
      }
    }
    collectRuleDefinitions(item, result);
  }
}

/**
 * The immutable input retains the complete deterministic analyzer result. The
 * provider only needs the decision-relevant observations; raw volume/turnover
 * magnitudes and duplicate partial-candle fields made a 100-trade week exceed
 * the real issuance boundary without improving the narrative.
 */
function compactTradeAnalysis(value: CoachAiReviewTradeAnalysisV2): unknown {
  return Object.freeze({
    availability: value.availability,
    unavailableReason: value.unavailableReason,
    analyzerContractVersion: value.analyzerContractVersion,
    events: Object.freeze(value.events.map((event) => Object.freeze({
      kind: event.kind,
      sequence: event.sequence,
      executedAtUtc: event.executedAtUtc,
      oneMinute: Object.freeze({
        relativeVolume: event.oneMinute.relativeVolume,
        rsi14: acceptedRsi14(
          event.oneMinute.rsi14,
          event.oneMinute.rsi14CalculationVersion,
        ),
        rsi14CalculationVersion: isAcceptedRsi14CalculationVersion(
          event.oneMinute.rsi14CalculationVersion,
        ) ? RSI_14_CALCULATION_VERSION : null,
        ema9DistancePercent: event.oneMinute.ema9DistancePercent,
        vwapDistancePercent: event.oneMinute.vwapDistancePercent,
        favorableMoveUntilFlatDecimal: event.oneMinute.favorableMoveUntilFlatDecimal,
        adverseMoveUntilFlatDecimal: event.oneMinute.adverseMoveUntilFlatDecimal,
        givebackFromPriorFavorableExtremeDecimal:
          event.oneMinute.givebackFromPriorFavorableExtremeDecimal,
      }),
      fiveMinuteCompletedBeforeExecution: event.fiveMinute.completedBeforeExecution
        ? Object.freeze({
            ema9DistancePercent:
              event.fiveMinute.completedBeforeExecution.ema9DistancePercent,
            relativeVolume: event.fiveMinute.completedBeforeExecution.relativeVolume,
          })
        : null,
    }))),
    greenToRed: value.greenToRed,
    finalExitPaths: value.finalExitPaths,
  });
}

function providerValue(
  value: unknown,
  ruleRefs: ReadonlyMap<string, string>,
  key = "",
): unknown {
  if (typeof value === "string") {
    if (key === "incompleteRecord" &&
        value.trim().toLocaleLowerCase() ===
          EXCLUDED_PENDING_RECORD_LIMITATION.toLocaleLowerCase()) {
      return null;
    }
    return publicText(value);
  }
  if (Array.isArray(value)) {
    if (key === "limitationReasonCodes") {
      return value
        .filter((reason) => reason !== "pending_data_decisions_excluded")
        .map((reason) => typeof reason === "string"
          ? PUBLIC_LIMITATIONS[reason] ?? publicText(reason.replaceAll("_", " "))
          : reason);
    }
    if (key === "ruleOutcomes") {
      return value.map((outcome) => {
        if (!outcome || typeof outcome !== "object") return outcome;
        const candidate = outcome as Partial<ProviderRuleDefinition> &
          Readonly<{ status?: unknown }>;
        if (typeof candidate.category !== "string" ||
            typeof candidate.statement !== "string" ||
            typeof candidate.title !== "string") return providerValue(outcome, ruleRefs);
        const ruleRef = ruleRefs.get(ruleDefinitionKey({
          category: candidate.category,
          statement: candidate.statement,
          title: candidate.title,
        }));
        if (!ruleRef) throw new Error("TRADERLINK_COACH_RULE_REFERENCE_MISSING");
        return Object.freeze({ ruleRef, status: candidate.status });
      });
    }
    const itemKey = key === "reviewNarrativeContext"
      ? "reviewNarrativeContextEntry"
      : "";
    return value.map((item) => providerValue(item, ruleRefs, itemKey));
  }
  if (!value || typeof value !== "object") return value;
  if (key === "analysis") {
    return providerValue(compactTradeAnalysis(value as CoachAiReviewTradeAnalysisV2), ruleRefs);
  }
  const transformed = Object.fromEntries(Object.entries(value)
    .filter(([entryKey]) =>
      !INTERNAL_COVERAGE_FIELDS.has(entryKey) &&
      !(HISTORICAL_REVIEW_CONTEXT_KEYS.has(key) && entryKey === "focusFollowThrough"))
    .map(([entryKey, item]) => [entryKey, providerValue(item, ruleRefs, entryKey)]));
  if (key === "coverageNotice" && Array.isArray(transformed.limitationReasonCodes)) {
    return Object.freeze({
      ...transformed,
      incompleteRecordRequired: transformed.limitationReasonCodes.length > 0,
    });
  }
  return transformed;
}

/**
 * Serializes the immutable review snapshot into the smaller public-language
 * package sent to the provider. Internal workflow labels and their counters
 * stay in TraderLink storage for coverage/audit purposes and never cross the
 * provider boundary. Historical follow-through prose is also withheld because
 * it can quote an older focus; the exact next-focus arrays remain authoritative.
 */
export function serializeCoachAiReviewProviderPackage(input: unknown): string {
  if (!input || Array.isArray(input) || typeof input !== "object") {
    throw new Error("TRADERLINK_COACH_PROVIDER_PACKAGE_INVALID");
  }
  const definitions = new Map<string, ProviderRuleDefinition>();
  collectRuleDefinitions(input, definitions);
  const sortedDefinitions = [...definitions.entries()]
    .sort(([left], [right]) => left.localeCompare(right));
  const ruleRefs = new Map(sortedDefinitions.map(([key], index) =>
    [key, `rule_${String(index + 1).padStart(3, "0")}`] as const));
  const transformed = providerValue(input, ruleRefs) as Record<string, unknown>;
  const serialized = JSON.stringify({
    ...transformed,
    ...(sortedDefinitions.length > 0 ? {
      ruleDefinitions: sortedDefinitions.map(([key, definition]) => Object.freeze({
        ruleRef: ruleRefs.get(key),
        ...definition,
      })),
    } : {}),
  });
  if (/data[-_ ]decisions?/iu.test(serialized)) {
    throw new Error("TRADERLINK_COACH_INTERNAL_TERM_IN_PROVIDER_PACKAGE");
  }
  return serialized;
}

/** Coverage limitations are deterministic input facts, not generated advice. */
export function incompleteRecordFromCoachAiReviewProviderPackage(
  serialized: string,
): string | null {
  const parsed = JSON.parse(serialized) as Readonly<{
    coverageNotice?: Readonly<{
      incompleteRecordRequired?: unknown;
      limitationReasonCodes?: unknown;
    }>;
  }>;
  const notice = parsed.coverageNotice;
  if (notice?.incompleteRecordRequired !== true) return null;
  if (!Array.isArray(notice.limitationReasonCodes)) {
    throw new Error("TRADERLINK_COACH_PROVIDER_COVERAGE_INVALID");
  }
  const reasons = notice.limitationReasonCodes.filter((reason): reason is string =>
    typeof reason === "string" && reason.trim().length > 0,
  );
  if (reasons.length === 0) {
    throw new Error("TRADERLINK_COACH_PROVIDER_COVERAGE_INVALID");
  }
  return reasons.join(" ");
}
