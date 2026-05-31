import type {
  ExecutionAnalysisLevelContextBuildResult,
  ExecutionAnalysisLevelContextInput,
} from "./execution-level-context-input";
import { isExecutionAnalysisLevelContextReplaySafe } from "./execution-level-context-input";

export type ExecutionLevelContextConsumptionRuleId =
  | "context_required"
  | "available_context_required"
  | "replay_safe_required"
  | "synthetic_marking_required"
  | "limitations_must_surface"
  | "diagnostics_must_surface"
  | "factual_contract_required";

export interface ExecutionLevelContextConsumptionRule {
  id: ExecutionLevelContextConsumptionRuleId;
  severity: "required";
  summary: string;
}

export type ExecutionLevelContextAllowedFactId =
  | "symbol"
  | "as_of_timestamp"
  | "reference_price"
  | "nearest_support"
  | "nearest_resistance"
  | "nearest_level_distance"
  | "level_bucket_counts"
  | "extension_counts"
  | "synthetic_continuation_map"
  | "diagnostics"
  | "limitations"
  | "safety_flags"
  | "quality_audit_warnings"
  | "fact_presence_summary";

export interface ExecutionLevelContextAllowedFact {
  id: ExecutionLevelContextAllowedFactId;
  fieldPaths: string[];
  summary: string;
}

export type ExecutionLevelContextForbiddenInferenceId =
  | "trade_grade"
  | "mistake_label"
  | "discipline_label"
  | "coaching_message"
  | "profit_loss"
  | "giveback_analysis"
  | "behavior_score"
  | "recommendation"
  | "buy_sell_hold"
  | "entry_decision"
  | "exit_decision"
  | "trade_advice"
  | "good_bad_trade"
  | "should_have_bought_sold";

export interface ExecutionLevelContextForbiddenInference {
  id: ExecutionLevelContextForbiddenInferenceId;
  category: string;
  examples: string[];
  boundary: string;
}

export type ExecutionLevelContextConsumptionReadiness =
  | "consumable"
  | "missing_context"
  | "unavailable_context"
  | "unsafe_context"
  | "synthetic_marking_inconsistent"
  | "non_factual_contract";

export interface ExecutionLevelContextConsumptionViolation {
  ruleId: ExecutionLevelContextConsumptionRuleId;
  code:
    | "missing_context"
    | "unavailable_context"
    | "unsafe_no_lookahead"
    | "synthetic_marking_inconsistent"
    | "hidden_limitations"
    | "hidden_diagnostics"
    | "non_factual_contract";
  message: string;
}

export interface ExecutionLevelContextConsumptionAssessment {
  consumable: boolean;
  readiness: ExecutionLevelContextConsumptionReadiness;
  checkedRuleIds: ExecutionLevelContextConsumptionRuleId[];
  violations: ExecutionLevelContextConsumptionViolation[];
  allowedFactIds: ExecutionLevelContextAllowedFactId[];
  safety: {
    noLookaheadApplied: boolean;
    syntheticExtensionsClearlyMarked: boolean;
    factualContextOnly: boolean;
  };
  diagnostics: {
    snapshotDiagnostics: string[];
    qualityDiagnostics: string[];
    validationErrorCount: number;
  };
  limitations: {
    count: number;
    messages: string[];
  };
  syntheticContinuationMap: {
    count: number;
    clearlyMarked: boolean;
  };
}

const CONSUMPTION_RULES: ExecutionLevelContextConsumptionRule[] = [
  {
    id: "context_required",
    severity: "required",
    summary: "A factual level context input must be present before consumption.",
  },
  {
    id: "available_context_required",
    severity: "required",
    summary: "Unavailable or quarantined build results are not consumable.",
  },
  {
    id: "replay_safe_required",
    severity: "required",
    summary: "Replay and journal usage requires no-lookahead safety.",
  },
  {
    id: "synthetic_marking_required",
    severity: "required",
    summary: "Synthetic continuation-map rows must remain clearly marked.",
  },
  {
    id: "limitations_must_surface",
    severity: "required",
    summary: "Known limitations must be carried forward by consumers.",
  },
  {
    id: "diagnostics_must_surface",
    severity: "required",
    summary: "Diagnostics must be carried forward by consumers.",
  },
  {
    id: "factual_contract_required",
    severity: "required",
    summary: "The context contract must remain factual-only.",
  },
];

const ALLOWED_FACTS: ExecutionLevelContextAllowedFact[] = [
  {
    id: "symbol",
    fieldPaths: ["identity.symbol"],
    summary: "Ticker identity from the accepted snapshot context.",
  },
  {
    id: "as_of_timestamp",
    fieldPaths: ["identity.asOfTimestamp"],
    summary: "Snapshot time boundary used for replay-safe context.",
  },
  {
    id: "reference_price",
    fieldPaths: ["identity.referencePrice"],
    summary: "Reference price used by the snapshot.",
  },
  {
    id: "nearest_support",
    fieldPaths: ["nearestSupport"],
    summary: "Nearest support level, or null when unavailable.",
  },
  {
    id: "nearest_resistance",
    fieldPaths: ["nearestResistance"],
    summary: "Nearest resistance level, or null when unavailable.",
  },
  {
    id: "nearest_level_distance",
    fieldPaths: [
      "nearestSupport.distanceFromReferencePct",
      "nearestResistance.distanceFromReferencePct",
    ],
    summary: "Factual distance from reference price to nearest levels.",
  },
  {
    id: "level_bucket_counts",
    fieldPaths: ["levelBucketCounts"],
    summary: "Canonical support and resistance bucket counts.",
  },
  {
    id: "extension_counts",
    fieldPaths: ["extensionCounts"],
    summary: "Extension level counts by side and source family.",
  },
  {
    id: "synthetic_continuation_map",
    fieldPaths: ["syntheticContinuationMap"],
    summary: "Marked synthetic continuation-map count and metadata.",
  },
  {
    id: "diagnostics",
    fieldPaths: ["diagnostics"],
    summary: "Snapshot and quality diagnostic context.",
  },
  {
    id: "limitations",
    fieldPaths: ["limitations"],
    summary: "Known data-completeness limitations.",
  },
  {
    id: "safety_flags",
    fieldPaths: ["safety"],
    summary: "No-lookahead and factual-snapshot safety flags.",
  },
  {
    id: "quality_audit_warnings",
    fieldPaths: ["quality.extensionCoverageWarnings"],
    summary: "LevelQualityAudit warnings as quality context.",
  },
  {
    id: "fact_presence_summary",
    fieldPaths: ["factPresence"],
    summary: "Presence summary for session, volume, shelf, and market facts.",
  },
];

const FORBIDDEN_INFERENCES: ExecutionLevelContextForbiddenInference[] = [
  {
    id: "trade_grade",
    category: "trade grading",
    examples: ["grade", "good trade", "bad trade"],
    boundary: "Level context does not assign trade quality.",
  },
  {
    id: "mistake_label",
    category: "mistake labeling",
    examples: ["mistake label", "trader was wrong because price was near a level"],
    boundary: "Level proximity is not a mistake finding by itself.",
  },
  {
    id: "discipline_label",
    category: "discipline labeling",
    examples: ["discipline issue"],
    boundary: "Level context does not assess discipline.",
  },
  {
    id: "coaching_message",
    category: "coaching",
    examples: ["coaching message"],
    boundary: "Level context does not generate coaching output.",
  },
  {
    id: "profit_loss",
    category: "P/L",
    examples: ["P/L", "pnl"],
    boundary: "Level context does not calculate outcome dollars.",
  },
  {
    id: "giveback_analysis",
    category: "giveback",
    examples: ["giveback"],
    boundary: "Level context does not evaluate retained or surrendered move.",
  },
  {
    id: "behavior_score",
    category: "behavior scoring",
    examples: ["behavior score"],
    boundary: "Level context does not score trader behavior.",
  },
  {
    id: "recommendation",
    category: "recommendation",
    examples: ["recommendation"],
    boundary: "Level context does not direct action.",
  },
  {
    id: "buy_sell_hold",
    category: "buy/sell/hold",
    examples: ["buy", "sell", "hold"],
    boundary: "Level context does not produce market-action decisions.",
  },
  {
    id: "entry_decision",
    category: "entry decision",
    examples: ["entry decision"],
    boundary: "Level context does not approve or reject entries.",
  },
  {
    id: "exit_decision",
    category: "exit decision",
    examples: ["exit decision"],
    boundary: "Level context does not approve or reject exits.",
  },
  {
    id: "trade_advice",
    category: "trade advice",
    examples: ["trade advice"],
    boundary: "Level context is not advice.",
  },
  {
    id: "good_bad_trade",
    category: "good trade / bad trade",
    examples: ["good trade", "bad trade"],
    boundary: "Level context is factual context, not a trade verdict.",
  },
  {
    id: "should_have_bought_sold",
    category: "should-have action",
    examples: ["should have bought", "should have sold"],
    boundary: "Level context does not create hindsight instructions.",
  },
];

const PROHIBITED_FIELD_NAMES = new Set([
  "grade",
  "tradeGrade",
  "coaching",
  "coach",
  "pnl",
  "pAndL",
  "giveback",
  "behaviorScore",
  "behaviorScoring",
  "recommendation",
  "entryDecision",
  "exitDecision",
  "tradeAdvice",
  "mistake",
  "discipline",
]);

const PROHIBITED_LANGUAGE_PATTERNS: RegExp[] = [
  /\bgrading\b/i,
  /\bcoaching\b/i,
  /\bcoach\b/i,
  /\bp\/l\b|\bpnl\b/i,
  /\bgiveback\b/i,
  /\bbehavior score\b|\bbehavior scoring\b/i,
  /\brecommendation\b/i,
  /\bbuy\b|\bsell\b|\bhold\b/i,
  /\bentry decision\b/i,
  /\bexit decision\b/i,
  /\btrade advice\b/i,
  /\bmistake\b/i,
  /\bdiscipline\b/i,
  /\bgood trade\b|\bbad trade\b/i,
  /\bshould have bought\b|\bshould have sold\b/i,
];

function isBuildResult(
  value: ExecutionAnalysisLevelContextInput | ExecutionAnalysisLevelContextBuildResult | null | undefined,
): value is ExecutionAnalysisLevelContextBuildResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    ((value as { status?: unknown }).status === "available" ||
      (value as { status?: unknown }).status === "unavailable")
  );
}

function emptyAssessment(
  readiness: Exclude<ExecutionLevelContextConsumptionReadiness, "consumable">,
  violation: ExecutionLevelContextConsumptionViolation,
): ExecutionLevelContextConsumptionAssessment {
  return {
    consumable: false,
    readiness,
    checkedRuleIds: CONSUMPTION_RULES.map((rule) => rule.id),
    violations: [violation],
    allowedFactIds: ALLOWED_FACTS.map((fact) => fact.id),
    safety: {
      noLookaheadApplied: false,
      syntheticExtensionsClearlyMarked: false,
      factualContextOnly: false,
    },
    diagnostics: {
      snapshotDiagnostics: [],
      qualityDiagnostics: [],
      validationErrorCount: 0,
    },
    limitations: {
      count: 0,
      messages: [],
    },
    syntheticContinuationMap: {
      count: 0,
      clearlyMarked: false,
    },
  };
}

function collectObjectKeys(value: unknown, out: string[] = []): string[] {
  if (Array.isArray(value)) {
    for (const item of value) {
      collectObjectKeys(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const [key, item] of Object.entries(value)) {
      out.push(key);
      collectObjectKeys(item, out);
    }
  }

  return out;
}

function collectStringValues(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") {
    out.push(value);
    return out;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectStringValues(item, out);
    }
    return out;
  }

  if (typeof value === "object" && value !== null) {
    for (const item of Object.values(value)) {
      collectStringValues(item, out);
    }
  }

  return out;
}

function factIds(): ExecutionLevelContextAllowedFactId[] {
  return ALLOWED_FACTS.map((fact) => fact.id);
}

function ruleIds(): ExecutionLevelContextConsumptionRuleId[] {
  return CONSUMPTION_RULES.map((rule) => rule.id);
}

export function listAllowedExecutionLevelContextFacts(): ExecutionLevelContextAllowedFact[] {
  return ALLOWED_FACTS.map((fact) => ({
    ...fact,
    fieldPaths: [...fact.fieldPaths],
  }));
}

export function listForbiddenExecutionLevelContextInferences(): ExecutionLevelContextForbiddenInference[] {
  return FORBIDDEN_INFERENCES.map((inference) => ({
    ...inference,
    examples: [...inference.examples],
  }));
}

export function describeExecutionLevelContextConsumptionBoundary(): {
  ruleIds: ExecutionLevelContextConsumptionRuleId[];
  allowedFactIds: ExecutionLevelContextAllowedFactId[];
  forbiddenInferenceCount: number;
  scoringImplementationIncluded: false;
} {
  return {
    ruleIds: ruleIds(),
    allowedFactIds: factIds(),
    forbiddenInferenceCount: FORBIDDEN_INFERENCES.length,
    scoringImplementationIncluded: false,
  };
}

export function assertExecutionLevelContextConsumptionIsFactualOnly(
  payload: unknown,
): void {
  const prohibitedKeys = collectObjectKeys(payload).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(payload).join("\n");
  const prohibitedLanguageCount = PROHIBITED_LANGUAGE_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).length;

  if (prohibitedKeys.length > 0 || prohibitedLanguageCount > 0) {
    throw new Error(
      `Execution level context consumption payload must remain factual-only. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}

export function assessExecutionLevelContextConsumptionReadiness(
  context:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | null
    | undefined,
): ExecutionLevelContextConsumptionAssessment {
  if (!context) {
    return emptyAssessment("missing_context", {
      ruleId: "context_required",
      code: "missing_context",
      message: "A factual level context input is required.",
    });
  }

  if (isBuildResult(context)) {
    if (context.status === "unavailable") {
      return {
        ...emptyAssessment("unavailable_context", {
          ruleId: "available_context_required",
          code: "unavailable_context",
          message: "The supplied level context build result is unavailable.",
        }),
        limitations: {
          count: context.limitations.length,
          messages: context.limitations.map((limitation) => limitation.message),
        },
        diagnostics: {
          snapshotDiagnostics: [],
          qualityDiagnostics: [],
          validationErrorCount: context.validationErrors.length,
        },
      };
    }

    return assessExecutionLevelContextConsumptionReadiness(context.input);
  }

  assertExecutionLevelContextConsumptionIsFactualOnly(context);

  const violations: ExecutionLevelContextConsumptionViolation[] = [];

  if (!isExecutionAnalysisLevelContextReplaySafe(context)) {
    violations.push({
      ruleId: "replay_safe_required",
      code: "unsafe_no_lookahead",
      message: "The factual level context is not replay safe.",
    });
  }

  if (
    context.syntheticContinuationMap.count > 0 &&
    context.safety.syntheticExtensionsClearlyMarked !== true
  ) {
    violations.push({
      ruleId: "synthetic_marking_required",
      code: "synthetic_marking_inconsistent",
      message:
        "Synthetic continuation-map rows are present without a clear safety mark.",
    });
  }

  if (
    context.limitations.count > 0 &&
    context.limitations.messages.length === 0 &&
    context.limitations.items.length === 0
  ) {
    violations.push({
      ruleId: "limitations_must_surface",
      code: "hidden_limitations",
      message: "Known limitations must be visible to future consumers.",
    });
  }

  if (
    context.diagnostics.snapshotDiagnosticsCount > 0 &&
    context.diagnostics.snapshotDiagnostics.length === 0
  ) {
    violations.push({
      ruleId: "diagnostics_must_surface",
      code: "hidden_diagnostics",
      message: "Snapshot diagnostics must be visible to future consumers.",
    });
  }

  if (context.compatibility.factualContextOnly !== true) {
    violations.push({
      ruleId: "factual_contract_required",
      code: "non_factual_contract",
      message: "The level context contract must be factual-only.",
    });
  }

  const readiness: ExecutionLevelContextConsumptionReadiness =
    violations.length === 0
      ? "consumable"
      : violations.some((violation) => violation.code === "synthetic_marking_inconsistent")
        ? "synthetic_marking_inconsistent"
        : violations.some((violation) => violation.code === "unsafe_no_lookahead")
          ? "unsafe_context"
          : "non_factual_contract";

  return {
    consumable: violations.length === 0,
    readiness,
    checkedRuleIds: ruleIds(),
    violations,
    allowedFactIds: factIds(),
    safety: {
      noLookaheadApplied: context.safety.noLookaheadApplied,
      syntheticExtensionsClearlyMarked:
        context.safety.syntheticExtensionsClearlyMarked,
      factualContextOnly: context.compatibility.factualContextOnly,
    },
    diagnostics: {
      snapshotDiagnostics: [...context.diagnostics.snapshotDiagnostics],
      qualityDiagnostics: [...context.diagnostics.qualityDiagnostics],
      validationErrorCount: context.diagnostics.validationErrors.length,
    },
    limitations: {
      count: context.limitations.count,
      messages: [...context.limitations.messages],
    },
    syntheticContinuationMap: {
      count: context.syntheticContinuationMap.count,
      clearlyMarked: context.safety.syntheticExtensionsClearlyMarked,
    },
  };
}

export function isExecutionLevelContextConsumable(
  context:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | null
    | undefined,
): boolean {
  return assessExecutionLevelContextConsumptionReadiness(context).consumable;
}
