import type {
  ExecutionAnalysisLevelContextBuildResult,
  ExecutionAnalysisLevelContextInput,
  ExecutionAnalysisLevelContextUnavailableReason,
  ExecutionAnalysisNearestLevelContext,
} from "./execution-level-context-input";
import {
  buildExecutionLevelContextObservations,
  buildUnavailableExecutionLevelContextObservations,
  summarizeExecutionLevelContextObservations,
  type BuildExecutionLevelContextObservationsResult,
  type ExecutionLevelContextObservationSet,
  type ExecutionLevelContextObservationSeverity,
  type ExecutionLevelContextObservationKind,
} from "./execution-level-context-observations";

export type ExecutionLevelContextObservationReadModelStatus =
  | "available"
  | "unavailable"
  | "not_replay_safe"
  | "limited";

export interface ExecutionLevelContextObservationReadModelSection {
  available: boolean;
  label: string;
  detail: string;
}

export interface ExecutionLevelContextNearestLevelReadModel {
  present: boolean;
  levelId: string | null;
  kind: "support" | "resistance";
  bucket: string | null;
  representativePrice: number | null;
  zoneLow: number | null;
  zoneHigh: number | null;
  distanceFromReferencePct: number | null;
  strengthScore: number | null;
  strengthLabel: string | null;
  isExtension: boolean | null;
}

export interface ExecutionLevelContextNearestLevelsReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  support: ExecutionLevelContextNearestLevelReadModel;
  resistance: ExecutionLevelContextNearestLevelReadModel;
}

export interface ExecutionLevelContextExtensionReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  support: number;
  resistance: number;
  total: number;
}

export interface ExecutionLevelContextSyntheticReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  count: number;
  supportCount: number;
  resistanceCount: number;
  marked: boolean;
  contextType: "synthetic_forward_planning";
  historicalEvidence: false;
  limitations: string[];
}

export interface ExecutionLevelContextQualityReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  warningCount: number;
  warnings: string[];
  hasLevelQualityAudit: boolean;
  hasExtensionCoverage: boolean;
}

export interface ExecutionLevelContextDiagnosticsReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  count: number;
  snapshotDiagnostics: string[];
  qualityDiagnostics: string[];
  validationErrorCount: number;
}

export interface ExecutionLevelContextLimitationsReadModel
  extends ExecutionLevelContextObservationReadModelSection {
  count: number;
  messages: string[];
}

export interface ExecutionLevelContextObservationReadModel {
  contractVersion: "execution_level_context_observation_read_model_v1";
  factualOnly: true;
  status: ExecutionLevelContextObservationReadModelStatus;
  statusReason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context" | null;
  source: {
    attachmentKey?: string;
    storageKey?: string;
    schemaVersion?: string;
    producer?: string;
  };
  identity: {
    symbol: string | null;
    asOfTimestamp: number | null;
    referencePrice: number | null;
  };
  nearestLevels: ExecutionLevelContextNearestLevelsReadModel;
  levelMap: {
    bucketCounts: ExecutionAnalysisLevelContextInput["levelBucketCounts"] | null;
    extensionCounts: ExecutionAnalysisLevelContextInput["extensionCounts"] | null;
  };
  synthetic: ExecutionLevelContextSyntheticReadModel;
  quality: ExecutionLevelContextQualityReadModel;
  diagnostics: ExecutionLevelContextDiagnosticsReadModel;
  limitations: ExecutionLevelContextLimitationsReadModel;
  safety: {
    noLookaheadApplied: boolean;
    syntheticExtensionsClearlyMarked: boolean;
    factualContextOnly: boolean;
  };
  factPresence: ExecutionAnalysisLevelContextInput["factPresence"] | null;
  observationSummary: {
    total: number;
    byKind: Partial<Record<ExecutionLevelContextObservationKind, number>>;
    bySeverity: Partial<Record<ExecutionLevelContextObservationSeverity, number>>;
    hasUnavailableContext: boolean;
    hasNotReplaySafe: boolean;
    syntheticContinuationMapCount: number;
    limitationCount: number;
    diagnosticCount: number;
    qualityWarningCount: number;
  };
}

export interface ExecutionLevelContextObservationReadModelSummary {
  status: ExecutionLevelContextObservationReadModelStatus;
  symbol: string | null;
  asOfTimestamp: number | null;
  nearestSupportPresent: boolean;
  nearestResistancePresent: boolean;
  syntheticContinuationMapCount: number;
  diagnosticCount: number;
  limitationCount: number;
  qualityWarningCount: number;
  replaySafe: boolean;
}

export type BuildExecutionLevelContextObservationReadModelResult = {
  status: "built";
  readModel: ExecutionLevelContextObservationReadModel;
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
  value:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | BuildExecutionLevelContextObservationsResult
    | null
    | undefined,
): value is ExecutionAnalysisLevelContextBuildResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    ((value as { status?: unknown }).status === "available" ||
      (value as { status?: unknown }).status === "unavailable") &&
    ("input" in value || "reason" in value)
  );
}

function isObservationResult(
  value:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | BuildExecutionLevelContextObservationsResult
    | null
    | undefined,
): value is BuildExecutionLevelContextObservationsResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "observationSet" in value &&
    "status" in value
  );
}

function blankNearestLevel(
  kind: "support" | "resistance",
): ExecutionLevelContextNearestLevelReadModel {
  return {
    present: false,
    levelId: null,
    kind,
    bucket: null,
    representativePrice: null,
    zoneLow: null,
    zoneHigh: null,
    distanceFromReferencePct: null,
    strengthScore: null,
    strengthLabel: null,
    isExtension: null,
  };
}

function nearestLevelReadModel(
  kind: "support" | "resistance",
  level: ExecutionAnalysisNearestLevelContext | null,
): ExecutionLevelContextNearestLevelReadModel {
  if (!level) {
    return blankNearestLevel(kind);
  }

  return {
    present: true,
    levelId: level.levelId,
    kind: level.kind,
    bucket: level.bucket,
    representativePrice: level.representativePrice,
    zoneLow: level.zoneLow,
    zoneHigh: level.zoneHigh,
    distanceFromReferencePct: level.distanceFromReferencePct,
    strengthScore: level.strengthScore,
    strengthLabel: level.strengthLabel,
    isExtension: level.isExtension,
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

function readModelStatus(args: {
  context: ExecutionAnalysisLevelContextInput | null;
  observations: ExecutionLevelContextObservationSet;
}): ExecutionLevelContextObservationReadModelStatus {
  if (!args.context) {
    return "unavailable";
  }

  if (!args.context.safety.noLookaheadApplied || args.observations.summary.hasNotReplaySafe) {
    return "not_replay_safe";
  }

  if (args.observations.summary.hasUnavailableContext) {
    return "unavailable";
  }

  if (
    args.context.limitations.count > 0 ||
    args.observations.summary.limitationCount > 0 ||
    (args.observations.summary.byKind.optional_facts_missing ?? 0) > 0
  ) {
    return "limited";
  }

  return "available";
}

function unavailableObservationSet(
  reason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context",
): ExecutionLevelContextObservationSet {
  return buildUnavailableExecutionLevelContextObservations(reason).observationSet;
}

function makeReadModel(args: {
  context: ExecutionAnalysisLevelContextInput | null;
  observations: ExecutionLevelContextObservationSet;
  statusReason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context" | null;
}): ExecutionLevelContextObservationReadModel {
  const { context, observations } = args;
  const observationSummary = summarizeExecutionLevelContextObservations(observations);
  const syntheticLimitations = Array.from(
    new Set(
      context?.syntheticContinuationMap.levels.flatMap(
        (level) => level.evidenceLimitations,
      ) ?? [],
    ),
  );
  const status = readModelStatus({ context, observations });
  const extensionCounts = context?.extensionCounts ?? null;
  const support = nearestLevelReadModel("support", context?.nearestSupport ?? null);
  const resistance = nearestLevelReadModel(
    "resistance",
    context?.nearestResistance ?? null,
  );
  const diagnosticsCount = context
    ? context.diagnostics.snapshotDiagnostics.length +
      context.diagnostics.qualityDiagnostics.length +
      context.diagnostics.validationErrors.length
    : observationSummary.diagnosticCount;

  const readModel: ExecutionLevelContextObservationReadModel = {
    contractVersion: "execution_level_context_observation_read_model_v1",
    factualOnly: true,
    status,
    statusReason: status === "unavailable" ? args.statusReason : null,
    source: {
      attachmentKey: context?.source.attachmentKey,
      storageKey: context?.source.storageKey,
      schemaVersion: context?.contract.schemaVersion,
      producer: context?.contract.producer,
    },
    identity: {
      symbol: context?.identity.symbol ?? null,
      asOfTimestamp: context?.identity.asOfTimestamp ?? null,
      referencePrice: context?.identity.referencePrice ?? null,
    },
    nearestLevels: {
      available: support.present || resistance.present,
      label: "Nearest levels",
      detail: "Nearest factual support and resistance context.",
      support,
      resistance,
    },
    levelMap: {
      bucketCounts: context?.levelBucketCounts ?? null,
      extensionCounts,
    },
    synthetic: {
      available: (context?.syntheticContinuationMap.count ?? 0) > 0,
      label: "Synthetic continuation-map",
      detail: "Synthetic forward-planning level context only.",
      count: context?.syntheticContinuationMap.count ?? 0,
      supportCount: context?.syntheticContinuationMap.supportCount ?? 0,
      resistanceCount: context?.syntheticContinuationMap.resistanceCount ?? 0,
      marked: context?.safety.syntheticExtensionsClearlyMarked ?? false,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: syntheticLimitations,
    },
    quality: {
      available: (context?.quality.extensionCoverageWarnings.length ?? 0) > 0,
      label: "Quality context",
      detail: "LevelQualityAudit coverage context.",
      warningCount: context?.quality.extensionCoverageWarnings.length ?? 0,
      warnings: [...(context?.quality.extensionCoverageWarnings ?? [])],
      hasLevelQualityAudit: context?.quality.hasLevelQualityAudit ?? false,
      hasExtensionCoverage: context?.quality.hasExtensionCoverage ?? false,
    },
    diagnostics: {
      available: diagnosticsCount > 0,
      label: "Diagnostics",
      detail: "Snapshot and quality diagnostics.",
      count: diagnosticsCount,
      snapshotDiagnostics: [...(context?.diagnostics.snapshotDiagnostics ?? [])],
      qualityDiagnostics: [...(context?.diagnostics.qualityDiagnostics ?? [])],
      validationErrorCount: context?.diagnostics.validationErrors.length ?? 0,
    },
    limitations: {
      available: (context?.limitations.count ?? observationSummary.limitationCount) > 0,
      label: "Limitations",
      detail: "Factual context limitations.",
      count: context?.limitations.count ?? observationSummary.limitationCount,
      messages: [...(context?.limitations.messages ?? [])],
    },
    safety: {
      noLookaheadApplied: context?.safety.noLookaheadApplied ?? false,
      syntheticExtensionsClearlyMarked:
        context?.safety.syntheticExtensionsClearlyMarked ?? false,
      factualContextOnly: context?.compatibility.factualContextOnly ?? false,
    },
    factPresence: context?.factPresence ?? null,
    observationSummary,
  };

  assertExecutionLevelContextObservationReadModelIsFactualOnly(readModel);
  return readModel;
}

export function buildExecutionLevelContextObservationReadModelFromObservations(
  context: ExecutionAnalysisLevelContextInput | null,
  observations: ExecutionLevelContextObservationSet,
): BuildExecutionLevelContextObservationReadModelResult {
  return {
    status: "built",
    readModel: makeReadModel({
      context,
      observations,
      statusReason: context ? null : "missing_context",
    }),
  };
}

export function buildUnavailableExecutionLevelContextObservationReadModel(
  reason: ExecutionAnalysisLevelContextUnavailableReason | "missing_context",
): BuildExecutionLevelContextObservationReadModelResult {
  return {
    status: "built",
    readModel: makeReadModel({
      context: null,
      observations: unavailableObservationSet(reason),
      statusReason: reason,
    }),
  };
}

export function buildExecutionLevelContextObservationReadModel(
  input:
    | ExecutionAnalysisLevelContextInput
    | ExecutionAnalysisLevelContextBuildResult
    | BuildExecutionLevelContextObservationsResult
    | null
    | undefined,
): BuildExecutionLevelContextObservationReadModelResult {
  if (!input) {
    return buildUnavailableExecutionLevelContextObservationReadModel(
      "missing_context",
    );
  }

  if (isObservationResult(input)) {
    return {
      status: "built",
      readModel: makeReadModel({
        context: null,
        observations: input.observationSet,
        statusReason: input.status === "unavailable" ? input.reason : null,
      }),
    };
  }

  if (isBuildResult(input)) {
    if (input.status === "unavailable") {
      return buildUnavailableExecutionLevelContextObservationReadModel(
        input.reason,
      );
    }

    return buildExecutionLevelContextObservationReadModel(input.input);
  }

  const observations = buildExecutionLevelContextObservations(input).observationSet;

  return buildExecutionLevelContextObservationReadModelFromObservations(
    input,
    observations,
  );
}

export function summarizeExecutionLevelContextObservationReadModel(
  readModel: ExecutionLevelContextObservationReadModel,
): ExecutionLevelContextObservationReadModelSummary {
  return {
    status: readModel.status,
    symbol: readModel.identity.symbol,
    asOfTimestamp: readModel.identity.asOfTimestamp,
    nearestSupportPresent: readModel.nearestLevels.support.present,
    nearestResistancePresent: readModel.nearestLevels.resistance.present,
    syntheticContinuationMapCount: readModel.synthetic.count,
    diagnosticCount: readModel.diagnostics.count,
    limitationCount: readModel.limitations.count,
    qualityWarningCount: readModel.quality.warningCount,
    replaySafe: readModel.safety.noLookaheadApplied,
  };
}

export function assertExecutionLevelContextObservationReadModelIsFactualOnly(
  readModel: unknown,
): void {
  const prohibitedKeys = collectObjectKeys(readModel).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(readModel).join("\n");
  const prohibitedLanguageCount = PROHIBITED_LANGUAGE_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).length;

  if (prohibitedKeys.length > 0 || prohibitedLanguageCount > 0) {
    throw new Error(
      `Execution level context observation read model must remain factual-only. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}
