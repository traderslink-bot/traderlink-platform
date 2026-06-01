import type {
  ExecutionAnalysisLevelBucketCounts,
  ExecutionAnalysisLevelContextFactPresence,
  ExecutionAnalysisLevelContextInput,
  ExecutionAnalysisNearestLevelContext,
} from "./execution-level-context-input";
import {
  assessExecutionLevelContextConsumptionReadiness,
  assertExecutionLevelContextConsumptionIsFactualOnly,
  listAllowedExecutionLevelContextFacts,
  type ExecutionLevelContextAllowedFactId,
  type ExecutionLevelContextConsumptionAssessment,
  type ExecutionLevelContextConsumptionReadiness,
  type ExecutionLevelContextConsumptionViolation,
} from "./execution-level-context-consumption-rules";
import type {
  ExecutionLevelContextNearestLevelReadModel,
  ExecutionLevelContextObservationReadModel,
  ExecutionLevelContextObservationReadModelStatus,
} from "./execution-level-context-observation-read-model";
import type {
  ExecutionLevelContextReadModelStorageKey,
  ExecutionLevelContextReadModelStorageRecord,
  ExecutionLevelContextReadModelStorageStatus,
  ExecutionLevelContextReadModelStoredRecord,
} from "./execution-level-context-read-model-storage";

export const EXECUTION_LEVEL_CONTEXT_ALLOWED_CONSUMPTION_VIEW_SOURCE_TYPE =
  "execution-level-context-allowed-consumption-view/v1" as const;

export type ExecutionLevelContextConsumptionUnavailableReason =
  | "missing_input"
  | "non_consumable_context"
  | "read_model_unavailable"
  | "not_replay_safe"
  | "synthetic_marking_inconsistent"
  | "quarantined_read_model_record";

export type ExecutionLevelContextAllowedConsumptionStatus =
  | "available"
  | "available_with_limitations";

export interface ExecutionLevelContextConsumptionAdapterDiagnostics {
  readiness: ExecutionLevelContextConsumptionReadiness | "read_model_status";
  checkedRuleIds: string[];
  violations: ExecutionLevelContextConsumptionViolation[];
  messages: string[];
}

export interface ExecutionLevelContextAllowedConsumptionFact {
  id: ExecutionLevelContextAllowedFactId;
  fieldPaths: string[];
  available: boolean;
}

export interface ExecutionLevelContextAllowedConsumptionNearestLevel {
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

export interface ExecutionLevelContextAllowedConsumptionView {
  sourceType: typeof EXECUTION_LEVEL_CONTEXT_ALLOWED_CONSUMPTION_VIEW_SOURCE_TYPE;
  factualOnly: true;
  availability: {
    status: ExecutionLevelContextAllowedConsumptionStatus;
    readiness: ExecutionLevelContextConsumptionReadiness | "read_model_status";
    allowedFactIds: ExecutionLevelContextAllowedFactId[];
    limitationCount: number;
    diagnosticCount: number;
  };
  source: {
    attachmentKey?: string;
    snapshotStorageKey?: string;
    readModelStorageKey?: ExecutionLevelContextReadModelStorageKey;
    ownerId?: string;
    ownerType?: string;
    schemaVersion?: string;
    producer?: string;
    readModelStatus?: ExecutionLevelContextObservationReadModelStatus;
    storageStatus?: ExecutionLevelContextReadModelStorageStatus;
  };
  identity: {
    symbol: string;
    asOfTimestamp: number;
    referencePrice: number | null;
  };
  nearestLevels: {
    support: ExecutionLevelContextAllowedConsumptionNearestLevel | null;
    resistance: ExecutionLevelContextAllowedConsumptionNearestLevel | null;
  };
  levelMap: {
    bucketCounts: ExecutionAnalysisLevelBucketCounts | null;
    extensionCounts: ExecutionAnalysisLevelContextInput["extensionCounts"] | null;
  };
  synthetic: {
    count: number;
    supportCount: number;
    resistanceCount: number;
    marked: boolean;
    contextType: "synthetic_forward_planning";
    historicalEvidence: false;
    limitations: string[];
  };
  diagnostics: {
    count: number;
    snapshotDiagnostics: string[];
    qualityDiagnostics: string[];
    validationErrorCount: number;
  };
  limitations: {
    count: number;
    messages: string[];
  };
  safety: {
    noLookaheadApplied: boolean;
    syntheticExtensionsClearlyMarked: boolean;
    factualContextOnly: boolean;
  };
  quality: {
    warningCount: number;
    warnings: string[];
    hasLevelQualityAudit: boolean;
    hasExtensionCoverage: boolean;
  };
  factPresence: ExecutionAnalysisLevelContextFactPresence | null;
  observationReadModel: {
    status?: ExecutionLevelContextObservationReadModelStatus;
    observationSummary?: ExecutionLevelContextObservationReadModel["observationSummary"];
  };
  allowedFacts: ExecutionLevelContextAllowedConsumptionFact[];
}

export type ExecutionLevelContextConsumptionAdapterResult =
  | {
      status: "available";
      view: ExecutionLevelContextAllowedConsumptionView;
      diagnostics: ExecutionLevelContextConsumptionAdapterDiagnostics;
    }
  | {
      status: "unavailable";
      reason: ExecutionLevelContextConsumptionUnavailableReason;
      message: string;
      diagnostics: ExecutionLevelContextConsumptionAdapterDiagnostics;
    };

export type ExecutionLevelContextConsumptionAdapterInput =
  | {
      sourceType: "context_input";
      context: ExecutionAnalysisLevelContextInput | null | undefined;
    }
  | {
      sourceType: "read_model";
      readModel: ExecutionLevelContextObservationReadModel | null | undefined;
    }
  | {
      sourceType: "read_model_storage_record";
      record: ExecutionLevelContextReadModelStoredRecord | null | undefined;
    };

const PROHIBITED_FIELD_NAMES = new Set([
  "rawSnapshot",
  "levelEngineOutput",
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

function allowedFactIds(): ExecutionLevelContextAllowedFactId[] {
  return listAllowedExecutionLevelContextFacts().map((fact) => fact.id);
}

function diagnosticsFromAssessment(
  assessment: ExecutionLevelContextConsumptionAssessment,
): ExecutionLevelContextConsumptionAdapterDiagnostics {
  return {
    readiness: assessment.readiness,
    checkedRuleIds: assessment.checkedRuleIds,
    violations: assessment.violations,
    messages: assessment.violations.map((violation) => violation.message),
  };
}

function unavailable(args: {
  reason: ExecutionLevelContextConsumptionUnavailableReason;
  message: string;
  diagnostics?: Partial<ExecutionLevelContextConsumptionAdapterDiagnostics>;
}): ExecutionLevelContextConsumptionAdapterResult {
  return {
    status: "unavailable",
    reason: args.reason,
    message: args.message,
    diagnostics: {
      readiness: args.diagnostics?.readiness ?? "read_model_status",
      checkedRuleIds: args.diagnostics?.checkedRuleIds ?? [],
      violations: args.diagnostics?.violations ?? [],
      messages: args.diagnostics?.messages ?? [args.message],
    },
  };
}

function nearestFromContext(
  level: ExecutionAnalysisNearestLevelContext | null,
): ExecutionLevelContextAllowedConsumptionNearestLevel | null {
  if (!level) {
    return null;
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

function nearestFromReadModel(
  level: ExecutionLevelContextNearestLevelReadModel,
): ExecutionLevelContextAllowedConsumptionNearestLevel | null {
  if (!level.present) {
    return null;
  }

  return {
    present: level.present,
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

function allowedFactsFromSections(args: {
  symbol: string | null;
  asOfTimestamp: number | null;
  referencePrice: number | null;
  nearestSupport: unknown;
  nearestResistance: unknown;
  bucketCounts: unknown;
  extensionCounts: unknown;
  syntheticCount: number;
  diagnosticsCount: number;
  limitationCount: number;
  qualityWarningCount: number;
  factPresence: unknown;
}): ExecutionLevelContextAllowedConsumptionFact[] {
  const availableById: Partial<Record<ExecutionLevelContextAllowedFactId, boolean>> = {
    symbol: args.symbol !== null,
    as_of_timestamp: args.asOfTimestamp !== null,
    reference_price: args.referencePrice !== null,
    nearest_support: args.nearestSupport !== null,
    nearest_resistance: args.nearestResistance !== null,
    nearest_level_distance:
      args.nearestSupport !== null || args.nearestResistance !== null,
    level_bucket_counts: args.bucketCounts !== null,
    extension_counts: args.extensionCounts !== null,
    synthetic_continuation_map: args.syntheticCount > 0,
    diagnostics: args.diagnosticsCount > 0,
    limitations: args.limitationCount > 0,
    safety_flags: true,
    quality_audit_warnings: args.qualityWarningCount > 0,
    fact_presence_summary: args.factPresence !== null,
  };

  return listAllowedExecutionLevelContextFacts().map((fact) => ({
    id: fact.id,
    fieldPaths: [...fact.fieldPaths],
    available: availableById[fact.id] ?? false,
  }));
}

function resultFromView(args: {
  view: ExecutionLevelContextAllowedConsumptionView;
  diagnostics: ExecutionLevelContextConsumptionAdapterDiagnostics;
}): ExecutionLevelContextConsumptionAdapterResult {
  assertExecutionLevelContextConsumptionViewIsAllowed(args.view);

  return {
    status: "available",
    view: args.view,
    diagnostics: args.diagnostics,
  };
}

function limitedStatus(
  limitationCount: number,
): ExecutionLevelContextAllowedConsumptionStatus {
  return limitationCount > 0 ? "available_with_limitations" : "available";
}

function diagnosticCountFromContext(context: ExecutionAnalysisLevelContextInput): number {
  return (
    context.diagnostics.snapshotDiagnostics.length +
    context.diagnostics.qualityDiagnostics.length +
    context.diagnostics.validationErrors.length
  );
}

export function buildExecutionLevelContextAllowedConsumptionViewFromContextInput(
  context: ExecutionAnalysisLevelContextInput | null | undefined,
): ExecutionLevelContextConsumptionAdapterResult {
  if (!context) {
    return unavailable({
      reason: "missing_input",
      message: "Execution level context input is required for consumption.",
    });
  }

  const assessment = assessExecutionLevelContextConsumptionReadiness(context);
  const diagnostics = diagnosticsFromAssessment(assessment);

  if (!assessment.consumable) {
    return unavailable({
      reason:
        assessment.readiness === "unsafe_context"
          ? "not_replay_safe"
          : assessment.readiness === "synthetic_marking_inconsistent"
            ? "synthetic_marking_inconsistent"
            : "non_consumable_context",
      message: "Execution level context input is not allowed for consumption.",
      diagnostics,
    });
  }

  const nearestSupport = nearestFromContext(context.nearestSupport);
  const nearestResistance = nearestFromContext(context.nearestResistance);
  const diagnosticCount = diagnosticCountFromContext(context);
  const view: ExecutionLevelContextAllowedConsumptionView = {
    sourceType: EXECUTION_LEVEL_CONTEXT_ALLOWED_CONSUMPTION_VIEW_SOURCE_TYPE,
    factualOnly: true,
    availability: {
      status: limitedStatus(context.limitations.count),
      readiness: assessment.readiness,
      allowedFactIds: assessment.allowedFactIds,
      limitationCount: context.limitations.count,
      diagnosticCount,
    },
    source: {
      attachmentKey: context.source.attachmentKey,
      snapshotStorageKey: context.source.storageKey,
      ownerId: context.owner.ownerId,
      ownerType: context.owner.ownerType,
      schemaVersion: context.contract.schemaVersion,
      producer: context.contract.producer,
    },
    identity: {
      symbol: context.identity.symbol,
      asOfTimestamp: context.identity.asOfTimestamp,
      referencePrice: context.identity.referencePrice,
    },
    nearestLevels: {
      support: nearestSupport,
      resistance: nearestResistance,
    },
    levelMap: {
      bucketCounts: context.levelBucketCounts,
      extensionCounts: context.extensionCounts,
    },
    synthetic: {
      count: context.syntheticContinuationMap.count,
      supportCount: context.syntheticContinuationMap.supportCount,
      resistanceCount: context.syntheticContinuationMap.resistanceCount,
      marked: context.safety.syntheticExtensionsClearlyMarked,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: Array.from(
        new Set(
          context.syntheticContinuationMap.levels.flatMap(
            (level) => level.evidenceLimitations,
          ),
        ),
      ),
    },
    diagnostics: {
      count: diagnosticCount,
      snapshotDiagnostics: [...context.diagnostics.snapshotDiagnostics],
      qualityDiagnostics: [...context.diagnostics.qualityDiagnostics],
      validationErrorCount: context.diagnostics.validationErrors.length,
    },
    limitations: {
      count: context.limitations.count,
      messages: [...context.limitations.messages],
    },
    safety: {
      noLookaheadApplied: context.safety.noLookaheadApplied,
      syntheticExtensionsClearlyMarked:
        context.safety.syntheticExtensionsClearlyMarked,
      factualContextOnly: context.compatibility.factualContextOnly,
    },
    quality: {
      warningCount: context.quality.extensionCoverageWarnings.length,
      warnings: [...context.quality.extensionCoverageWarnings],
      hasLevelQualityAudit: context.quality.hasLevelQualityAudit,
      hasExtensionCoverage: context.quality.hasExtensionCoverage,
    },
    factPresence: context.factPresence,
    observationReadModel: {},
    allowedFacts: allowedFactsFromSections({
      symbol: context.identity.symbol,
      asOfTimestamp: context.identity.asOfTimestamp,
      referencePrice: context.identity.referencePrice,
      nearestSupport,
      nearestResistance,
      bucketCounts: context.levelBucketCounts,
      extensionCounts: context.extensionCounts,
      syntheticCount: context.syntheticContinuationMap.count,
      diagnosticsCount: diagnosticCount,
      limitationCount: context.limitations.count,
      qualityWarningCount: context.quality.extensionCoverageWarnings.length,
      factPresence: context.factPresence,
    }),
  };

  return resultFromView({ view, diagnostics });
}

export function buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
  readModel: ExecutionLevelContextObservationReadModel | null | undefined,
): ExecutionLevelContextConsumptionAdapterResult {
  if (!readModel) {
    return unavailable({
      reason: "missing_input",
      message: "Execution level context observation read model is required.",
    });
  }

  if (readModel.status === "unavailable") {
    return unavailable({
      reason: "read_model_unavailable",
      message: "Unavailable read models are not allowed for consumption.",
    });
  }

  if (readModel.status === "not_replay_safe" || !readModel.safety.noLookaheadApplied) {
    return unavailable({
      reason: "not_replay_safe",
      message: "Read model is not replay safe and cannot be consumed.",
    });
  }

  if (
    readModel.synthetic.count > 0 &&
    (!readModel.synthetic.marked || !readModel.safety.syntheticExtensionsClearlyMarked)
  ) {
    return unavailable({
      reason: "synthetic_marking_inconsistent",
      message:
        "Synthetic continuation-map context is present without clear safety marking.",
    });
  }

  const nearestSupport = nearestFromReadModel(readModel.nearestLevels.support);
  const nearestResistance = nearestFromReadModel(readModel.nearestLevels.resistance);
  const symbol = readModel.identity.symbol ?? "UNKNOWN";
  const asOfTimestamp = readModel.identity.asOfTimestamp ?? 0;
  const view: ExecutionLevelContextAllowedConsumptionView = {
    sourceType: EXECUTION_LEVEL_CONTEXT_ALLOWED_CONSUMPTION_VIEW_SOURCE_TYPE,
    factualOnly: true,
    availability: {
      status:
        readModel.status === "limited" || readModel.limitations.count > 0
          ? "available_with_limitations"
          : "available",
      readiness: "read_model_status",
      allowedFactIds: allowedFactIds(),
      limitationCount: readModel.limitations.count,
      diagnosticCount: readModel.diagnostics.count,
    },
    source: {
      attachmentKey: readModel.source.attachmentKey,
      snapshotStorageKey: readModel.source.storageKey,
      schemaVersion: readModel.source.schemaVersion,
      producer: readModel.source.producer,
      readModelStatus: readModel.status,
    },
    identity: {
      symbol,
      asOfTimestamp,
      referencePrice: readModel.identity.referencePrice,
    },
    nearestLevels: {
      support: nearestSupport,
      resistance: nearestResistance,
    },
    levelMap: {
      bucketCounts: readModel.levelMap.bucketCounts,
      extensionCounts: readModel.levelMap.extensionCounts,
    },
    synthetic: {
      count: readModel.synthetic.count,
      supportCount: readModel.synthetic.supportCount,
      resistanceCount: readModel.synthetic.resistanceCount,
      marked: readModel.synthetic.marked,
      contextType: "synthetic_forward_planning",
      historicalEvidence: false,
      limitations: [...readModel.synthetic.limitations],
    },
    diagnostics: {
      count: readModel.diagnostics.count,
      snapshotDiagnostics: [...readModel.diagnostics.snapshotDiagnostics],
      qualityDiagnostics: [...readModel.diagnostics.qualityDiagnostics],
      validationErrorCount: readModel.diagnostics.validationErrorCount,
    },
    limitations: {
      count: readModel.limitations.count,
      messages: [...readModel.limitations.messages],
    },
    safety: {
      noLookaheadApplied: readModel.safety.noLookaheadApplied,
      syntheticExtensionsClearlyMarked:
        readModel.safety.syntheticExtensionsClearlyMarked,
      factualContextOnly: readModel.safety.factualContextOnly,
    },
    quality: {
      warningCount: readModel.quality.warningCount,
      warnings: [...readModel.quality.warnings],
      hasLevelQualityAudit: readModel.quality.hasLevelQualityAudit,
      hasExtensionCoverage: readModel.quality.hasExtensionCoverage,
    },
    factPresence: readModel.factPresence,
    observationReadModel: {
      status: readModel.status,
      observationSummary: readModel.observationSummary,
    },
    allowedFacts: allowedFactsFromSections({
      symbol,
      asOfTimestamp,
      referencePrice: readModel.identity.referencePrice,
      nearestSupport,
      nearestResistance,
      bucketCounts: readModel.levelMap.bucketCounts,
      extensionCounts: readModel.levelMap.extensionCounts,
      syntheticCount: readModel.synthetic.count,
      diagnosticsCount: readModel.diagnostics.count,
      limitationCount: readModel.limitations.count,
      qualityWarningCount: readModel.quality.warningCount,
      factPresence: readModel.factPresence,
    }),
  };

  return resultFromView({
    view,
    diagnostics: {
      readiness: "read_model_status",
      checkedRuleIds: [],
      violations: [],
      messages: [],
    },
  });
}

export function buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
  record: ExecutionLevelContextReadModelStoredRecord | null | undefined,
): ExecutionLevelContextConsumptionAdapterResult {
  if (!record) {
    return unavailable({
      reason: "missing_input",
      message: "Execution level context read model storage record is required.",
    });
  }

  if (record.storageStatus === "quarantined") {
    return unavailable({
      reason: "quarantined_read_model_record",
      message: "Quarantined read model storage records are not allowed for consumption.",
      diagnostics: {
        messages: record.quarantineReasons.map((reason) => reason.message),
      },
    });
  }

  const result = buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
    record.readModel,
  );

  if (result.status === "unavailable") {
    return result;
  }

  return resultFromView({
    view: {
      ...result.view,
      source: {
        ...result.view.source,
        readModelStorageKey: record.storageKey,
        ownerId: record.ownerId,
        ownerType: record.ownerType,
        storageStatus: record.storageStatus,
      },
    },
    diagnostics: result.diagnostics,
  });
}

export function buildExecutionLevelContextAllowedConsumptionView(
  input: ExecutionLevelContextConsumptionAdapterInput,
): ExecutionLevelContextConsumptionAdapterResult {
  if (input.sourceType === "context_input") {
    return buildExecutionLevelContextAllowedConsumptionViewFromContextInput(
      input.context,
    );
  }

  if (input.sourceType === "read_model") {
    return buildExecutionLevelContextAllowedConsumptionViewFromReadModel(
      input.readModel,
    );
  }

  return buildExecutionLevelContextAllowedConsumptionViewFromStorageRecord(
    input.record,
  );
}

export function isExecutionLevelContextConsumptionViewAvailable(
  view:
    | ExecutionLevelContextAllowedConsumptionView
    | ExecutionLevelContextConsumptionAdapterResult,
): boolean {
  if ("status" in view && (view.status === "available" || view.status === "unavailable")) {
    return view.status === "available";
  }

  return (
    view.availability.status === "available" ||
    view.availability.status === "available_with_limitations"
  );
}

export function assertExecutionLevelContextConsumptionViewIsAllowed(
  view: unknown,
): void {
  assertExecutionLevelContextConsumptionIsFactualOnly(view);

  const prohibitedKeys = collectObjectKeys(view).filter((key) =>
    PROHIBITED_FIELD_NAMES.has(key),
  );
  const text = collectStringValues(view).join("\n");
  const prohibitedLanguageCount = PROHIBITED_LANGUAGE_PATTERNS.filter((pattern) =>
    pattern.test(text),
  ).length;

  if (prohibitedKeys.length > 0 || prohibitedLanguageCount > 0) {
    throw new Error(
      `Execution level context consumption view must contain only allowed facts. Prohibited key count: ${prohibitedKeys.length}. Prohibited text count: ${prohibitedLanguageCount}.`,
    );
  }
}
