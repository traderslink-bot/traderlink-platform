const INTERNAL_COVERAGE_FIELDS = new Set([
  "accountNeedsDecisionCount",
  "accountPendingDataDecisionCount",
]);

const PUBLIC_LIMITATIONS: Readonly<Record<string, string>> = Object.freeze({
  detailed_execution_facts_unavailable:
    "Detailed execution facts were unavailable for some included trade records.",
  incomplete_daily_review_coverage:
    "Some Trade Tracker reviews were not marked complete when this review began.",
  legitimate_open_positions_excluded:
    "Open positions were excluded from realized results.",
  no_trade_review_signal_unavailable:
    "No-trade review coverage was unavailable for at least one market date.",
  pending_data_decisions_excluded:
    "Unresolved account records were excluded from the review facts.",
  pre_enable_reflection_excluded:
    "Reflections saved before AI Reviews were enabled were excluded.",
});

function publicText(value: string): string {
  return value
    .replace(/pending_data_decisions_excluded/giu,
      "unresolved account records were excluded")
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

function providerValue(
  value: unknown,
  ruleRefs: ReadonlyMap<string, string>,
  key = "",
): unknown {
  if (typeof value === "string") return publicText(value);
  if (Array.isArray(value)) {
    if (key === "limitationReasonCodes") {
      return value.map((reason) => typeof reason === "string"
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
    return value.map((item) => providerValue(item, ruleRefs));
  }
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([entryKey]) => !INTERNAL_COVERAGE_FIELDS.has(entryKey))
    .map(([entryKey, item]) => [entryKey, providerValue(item, ruleRefs, entryKey)]));
}

/**
 * Serializes the immutable review snapshot into the smaller public-language
 * package sent to the provider. Internal workflow labels and their counters
 * stay in TraderLink storage for coverage/audit purposes and never cross the
 * provider boundary.
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
