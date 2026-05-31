import type {
  ExecutionAnalysisLevelContextBuildResult,
  ExecutionAnalysisLevelContextInput,
  ExecutionAnalysisLevelContextUnavailableReason,
} from "./execution-level-context-input";
import {
  assessExecutionLevelContextConsumptionReadiness,
  assertExecutionLevelContextConsumptionIsFactualOnly,
} from "./execution-level-context-consumption-rules";

export type ExecutionLevelContextObservationKind =
  | "level_context_available"
  | "level_context_unavailable"
  | "nearest_support_available"
  | "nearest_resistance_available"
  | "nearest_support_missing"
  | "nearest_resistance_missing"
  | "extension_coverage_available"
  | "synthetic_continuation_map_present"
  | "quality_warnings_present"
  | "diagnostics_present"
  | "limitations_present"
  | "not_replay_safe"
  | "optional_facts_missing";

export type ExecutionLevelContextObservationSeverity =
  | "info"
  | "notice"
  | "coverage"
  | "unavailable";

export interface ExecutionLevelContextObservationSource {
  sourceType: "execution-analysis-level-context-input";
  attachmentKey?: string;
  storageKey?: string;
  schemaVersion?: string;
  producer?: string;
}

export interface ExecutionLevelContextObservation {
  id: string;
  kind: ExecutionLevelContextObservationKind;
  severity: ExecutionLevelContextObservationSeverity;
  source: ExecutionLevelContextObservationSource;
  message: string;
  facts: Record<string, unknown>;
}

export interface ExecutionLevelContextObservationSet {
  sourceType: "execution-level-context-observations";
  factualOnly: true;
  consumable: boolean;
  observations: ExecutionLevelContextObservation[];
  summary: ExecutionLevelContextObservationSummary;
}

export interface ExecutionLevelContextObservationSummary {
  total: number;
  byKind: Partial<Record<ExecutionLevelContextObservationKind, number>>;
  bySeverity: Partial<Record<ExecutionLevelContextObservationSeverity, number>>;
  hasUnavailableContext: boolean;
  hasNotReplaySafe: boolean;
  syntheticContinuationMapCount: number;
  limitationCount: number;
  diagnosticCount: number;
  qualityWarningCount: number;
}

export type BuildExecutionLevelContextObservationsResult =
  | {
      status: "observed";
      observationSet: ExecutionLevelContextObservationSet;
    }
  | {
      status: "unavailable";
      observationSet: ExecutionLevelContextObservationSet;
      reason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context";
    };

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
  /\bgrade\b|\bgrading\b/i,
  /\bcoaching\b|\bcoach\b/i,
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
  /\bshould have\b/i,
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

function observationSource(
  context?: ExecutionAnalysisLevelContextInput,
): ExecutionLevelContextObservationSource {
  return {
    sourceType: "execution-analysis-level-context-input",
    attachmentKey: context?.source.attachmentKey,
    storageKey: context?.source.storageKey,
    schemaVersion: context?.contract.schemaVersion,
    producer: context?.contract.producer,
  };
}

function makeObservation(args: {
  kind: ExecutionLevelContextObservationKind;
  severity: ExecutionLevelContextObservationSeverity;
  source: ExecutionLevelContextObservationSource;
  message: string;
  facts?: Record<string, unknown>;
}): ExecutionLevelContextObservation {
  return {
    id: args.kind,
    kind: args.kind,
    severity: args.severity,
    source: args.source,
    message: args.message,
    facts: args.facts ?? {},
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

function addCount<TKey extends string>(
  counts: Partial<Record<TKey, number>>,
  key: TKey,
): void {
  counts[key] = (counts[key] ?? 0) + 1;
}

function summarize(observations: ExecutionLevelContextObservation[]): ExecutionLevelContextObservationSummary {
  const byKind: Partial<Record<ExecutionLevelContextObservationKind, number>> = {};
  const bySeverity: Partial<Record<ExecutionLevelContextObservationSeverity, number>> = {};

  for (const observation of observations) {
    addCount(byKind, observation.kind);
    addCount(bySeverity, observation.severity);
  }

  const syntheticObservation = observations.find(
    (observation) => observation.kind === "synthetic_continuation_map_present",
  );
  const limitationObservation = observations.find(
    (observation) => observation.kind === "limitations_present",
  );
  const diagnosticObservation = observations.find(
    (observation) => observation.kind === "diagnostics_present",
  );
  const qualityObservation = observations.find(
    (observation) => observation.kind === "quality_warnings_present",
  );

  return {
    total: observations.length,
    byKind,
    bySeverity,
    hasUnavailableContext: (byKind.level_context_unavailable ?? 0) > 0,
    hasNotReplaySafe: (byKind.not_replay_safe ?? 0) > 0,
    syntheticContinuationMapCount:
      typeof syntheticObservation?.facts.count === "number"
        ? syntheticObservation.facts.count
        : 0,
    limitationCount:
      typeof limitationObservation?.facts.count === "number"
        ? limitationObservation.facts.count
        : 0,
    diagnosticCount:
      typeof diagnosticObservation?.facts.count === "number"
        ? diagnosticObservation.facts.count
        : 0,
    qualityWarningCount:
      typeof qualityObservation?.facts.count === "number"
        ? qualityObservation.facts.count
        : 0,
  };
}

function resultFromObservations(args: {
  observations: ExecutionLevelContextObservation[];
  consumable: boolean;
  reason?: ExecutionAnalysisLevelContextUnavailableReason | "missing_context";
}): BuildExecutionLevelContextObservationsResult {
  const observationSet: ExecutionLevelContextObservationSet = {
    sourceType: "execution-level-context-observations",
    factualOnly: true,
    consumable: args.consumable,
    observations: args.observations,
    summary: summarize(args.observations),
  };

  assertExecutionLevelContextObservationsAreFactualOnly(observationSet);

  if (!args.consumable) {
    return {
      status: "unavailable",
      observationSet,
      reason: args.reason ?? "missing_context",
    };
  }

  return {
    status: "observed",
    observationSet,
  };
}

function optionalFactsMissing(context: ExecutionAnalysisLevelContextInput): string[] {
  const missing: string[] = [];

  if (!context.factPresence.hasSessionFacts) {
    missing.push("sessionFacts");
  }
  if (!context.factPresence.hasVolumeFacts) {
    missing.push("volumeFacts");
  }
  if (context.factPresence.volumeShelfCount === 0) {
    missing.push("volumeShelves");
  }
  if (!context.factPresence.hasMarketContext) {
    missing.push("marketContext");
  }
  if (!context.factPresence.hasFactsBundle) {
    missing.push("factsBundle");
  }

  return missing;
}

function observationsFromContext(
  context: ExecutionAnalysisLevelContextInput,
): ExecutionLevelContextObservation[] {
  const source = observationSource(context);
  const assessment = assessExecutionLevelContextConsumptionReadiness(context);
  const observations: ExecutionLevelContextObservation[] = [];

  if (!assessment.consumable) {
    observations.push(
      makeObservation({
        kind: "level_context_unavailable",
        severity: "unavailable",
        source,
        message: "Factual level context is unavailable for observation.",
        facts: {
          readiness: assessment.readiness,
          violationCodes: assessment.violations.map((violation) => violation.code),
        },
      }),
    );
  } else {
    observations.push(
      makeObservation({
        kind: "level_context_available",
        severity: "info",
        source,
        message: "Factual level context is available for observation.",
        facts: {
          symbol: context.identity.symbol,
          asOfTimestamp: context.identity.asOfTimestamp,
          referencePrice: context.identity.referencePrice,
        },
      }),
    );
  }

  if (!context.safety.noLookaheadApplied) {
    observations.push(
      makeObservation({
        kind: "not_replay_safe",
        severity: "unavailable",
        source,
        message: "Factual level context is not replay safe.",
        facts: {
          noLookaheadApplied: context.safety.noLookaheadApplied,
        },
      }),
    );
  }

  observations.push(
    makeObservation({
      kind:
        context.nearestSupport === null
          ? "nearest_support_missing"
          : "nearest_support_available",
      severity: context.nearestSupport === null ? "notice" : "info",
      source,
      message:
        context.nearestSupport === null
          ? "Nearest support is not present in the factual context."
          : "Nearest support is present in the factual context.",
      facts:
        context.nearestSupport === null
          ? {}
          : {
              levelId: context.nearestSupport.levelId,
              representativePrice: context.nearestSupport.representativePrice,
              distanceFromReferencePct:
                context.nearestSupport.distanceFromReferencePct,
            },
    }),
  );

  observations.push(
    makeObservation({
      kind:
        context.nearestResistance === null
          ? "nearest_resistance_missing"
          : "nearest_resistance_available",
      severity: context.nearestResistance === null ? "notice" : "info",
      source,
      message:
        context.nearestResistance === null
          ? "Nearest resistance is not present in the factual context."
          : "Nearest resistance is present in the factual context.",
      facts:
        context.nearestResistance === null
          ? {}
          : {
              levelId: context.nearestResistance.levelId,
              representativePrice: context.nearestResistance.representativePrice,
              distanceFromReferencePct:
                context.nearestResistance.distanceFromReferencePct,
            },
    }),
  );

  if (context.extensionCounts.total > 0) {
    observations.push(
      makeObservation({
        kind: "extension_coverage_available",
        severity: "info",
        source,
        message: "Extension coverage is present in the factual context.",
        facts: { ...context.extensionCounts },
      }),
    );
  }

  if (context.syntheticContinuationMap.count > 0) {
    observations.push(
      makeObservation({
        kind: "synthetic_continuation_map_present",
        severity: "notice",
        source,
        message:
          "Synthetic continuation-map levels are present as factual forward-planning context only.",
        facts: {
          count: context.syntheticContinuationMap.count,
          supportCount: context.syntheticContinuationMap.supportCount,
          resistanceCount: context.syntheticContinuationMap.resistanceCount,
          source: "synthetic_continuation_map",
          evidenceLimitations: Array.from(
            new Set(
              context.syntheticContinuationMap.levels.flatMap(
                (level) => level.evidenceLimitations,
              ),
            ),
          ),
        },
      }),
    );
  }

  if (context.quality.extensionCoverageWarnings.length > 0) {
    observations.push(
      makeObservation({
        kind: "quality_warnings_present",
        severity: "coverage",
        source,
        message: "Quality audit coverage notes are present.",
        facts: {
          count: context.quality.extensionCoverageWarnings.length,
          items: [...context.quality.extensionCoverageWarnings],
        },
      }),
    );
  }

  const diagnosticCount =
    context.diagnostics.snapshotDiagnostics.length +
    context.diagnostics.qualityDiagnostics.length +
    context.diagnostics.validationErrors.length;
  if (diagnosticCount > 0) {
    observations.push(
      makeObservation({
        kind: "diagnostics_present",
        severity: "notice",
        source,
        message: "Diagnostics are present in the factual context.",
        facts: {
          count: diagnosticCount,
          snapshotDiagnostics: [...context.diagnostics.snapshotDiagnostics],
          qualityDiagnostics: [...context.diagnostics.qualityDiagnostics],
          validationErrorCount: context.diagnostics.validationErrors.length,
        },
      }),
    );
  }

  if (context.limitations.count > 0) {
    observations.push(
      makeObservation({
        kind: "limitations_present",
        severity: "notice",
        source,
        message: "Limitations are present in the factual context.",
        facts: {
          count: context.limitations.count,
          messages: [...context.limitations.messages],
        },
      }),
    );
  }

  const missingFacts = optionalFactsMissing(context);
  if (missingFacts.length > 0) {
    observations.push(
      makeObservation({
        kind: "optional_facts_missing",
        severity: "coverage",
        source,
        message: "Optional factual sections are not present.",
        facts: {
          missingFacts,
        },
      }),
    );
  }

  return observations;
}

export function buildUnavailableExecutionLevelContextObservations(
  reason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context",
): BuildExecutionLevelContextObservationsResult {
  return resultFromObservations({
    consumable: false,
    reason,
    observations: [
      makeObservation({
        kind: "level_context_unavailable",
        severity: "unavailable",
        source: observationSource(),
        message: "Factual level context is unavailable for observation.",
        facts: { reason },
      }),
    ],
  });
}

export function buildExecutionLevelContextObservations(
  contextOrResult:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | null
    | undefined,
): BuildExecutionLevelContextObservationsResult {
  if (!contextOrResult) {
    return buildUnavailableExecutionLevelContextObservations("missing_context");
  }

  if (isBuildResult(contextOrResult)) {
    if (contextOrResult.status === "unavailable") {
      return resultFromObservations({
        consumable: false,
        reason: contextOrResult.reason,
        observations: [
          makeObservation({
            kind: "level_context_unavailable",
            severity: "unavailable",
            source: observationSource(),
            message: "Factual level context is unavailable for observation.",
            facts: {
              reason: contextOrResult.reason,
              limitationCount: contextOrResult.limitations.length,
              validationErrorCount: contextOrResult.validationErrors.length,
            },
          }),
        ],
      });
    }

    return buildExecutionLevelContextObservations(contextOrResult.input);
  }

  assertExecutionLevelContextConsumptionIsFactualOnly(contextOrResult);
  const observations = observationsFromContext(contextOrResult);
  const assessment =
    assessExecutionLevelContextConsumptionReadiness(contextOrResult);

  return resultFromObservations({
    consumable: assessment.consumable,
    reason: assessment.consumable ? undefined : "unsafe_no_lookahead",
    observations,
  });
}

export function summarizeExecutionLevelContextObservations(
  observations: ExecutionLevelContextObservation[] | ExecutionLevelContextObservationSet,
): ExecutionLevelContextObservationSummary {
  if (Array.isArray(observations)) {
    return summarize(observations);
  }

  return summarize(observations.observations);
}

export function filterExecutionLevelContextObservationsByKind(
  observations: ExecutionLevelContextObservation[] | ExecutionLevelContextObservationSet,
  kind: ExecutionLevelContextObservationKind,
): ExecutionLevelContextObservation[] {
  const items = Array.isArray(observations)
    ? observations
    : observations.observations;

  return items.filter((observation) => observation.kind === kind);
}

export function hasExecutionLevelContextObservation(
  observations: ExecutionLevelContextObservation[] | ExecutionLevelContextObservationSet,
  kind: ExecutionLevelContextObservationKind,
): boolean {
  return filterExecutionLevelContextObservationsByKind(observations, kind).length > 0;
}

export function assertExecutionLevelContextObservationsAreFactualOnly(
  observations: unknown,
): void {
  const prohibitedKeys = collectObjectKeys(observations).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(observations).join("\n");
  const prohibitedLanguageCount = PROHIBITED_LANGUAGE_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).length;

  if (prohibitedKeys.length > 0 || prohibitedLanguageCount > 0) {
    throw new Error(
      `Execution level context observations must remain factual-only. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}
