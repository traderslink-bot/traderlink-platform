import type {
  LevelAnalysisAdapterLimitation,
  LevelAnalysisAdapterValidationError,
  LevelAnalysisExtensionMetadata,
  LevelAnalysisFinalLevelZone,
  LevelAnalysisNearestLevel,
  LevelAnalysisProducer,
  LevelAnalysisSnapshotSchemaVersion,
} from "./level-analysis-snapshot-contract";
import type {
  LevelAnalysisSnapshotAttachment,
  QuarantinedLevelAnalysisSnapshotAttachment,
} from "./level-analysis-snapshot-attachment";
import {
  retrieveNearestAsOfLevelAnalysisSnapshot,
  type LevelAnalysisSnapshotRetrievalQuery,
  type LevelAnalysisSnapshotStorageIndex,
  type LevelAnalysisSnapshotStorageKey,
  type LevelAnalysisSnapshotStorageQuarantineRecord,
  type LevelAnalysisSnapshotStorageRecord,
  type LevelAnalysisSnapshotStoredRecord,
} from "./level-analysis-snapshot-storage";

export interface ExecutionAnalysisNearestLevelContext {
  levelId: string;
  kind: "support" | "resistance";
  bucket: string;
  representativePrice: number;
  zoneLow: number;
  zoneHigh: number;
  strengthScore: number;
  strengthLabel: string;
  distanceFromReferencePct: number;
  isExtension: boolean;
}

export interface ExecutionAnalysisLevelBucketCounts {
  majorSupport: number;
  majorResistance: number;
  intermediateSupport: number;
  intermediateResistance: number;
  intradaySupport: number;
  intradayResistance: number;
}

export interface ExecutionAnalysisExtensionCounts {
  support: number;
  resistance: number;
  total: number;
  synthetic: number;
}

export interface ExecutionAnalysisLevelContextSafety {
  noLookaheadApplied: boolean;
  syntheticExtensionsClearlyMarked: boolean;
  levelOutputUnchanged: boolean;
  factsOnlyVWAP: boolean;
  shelvesAreFactsOnly: boolean;
  noRuntimeBehaviorChange: boolean;
}

export interface ExecutionAnalysisLevelContextDiagnostics {
  snapshotDiagnosticsCount: number;
  qualityDiagnosticsCount: number;
  snapshotDiagnostics: string[];
  qualityDiagnostics: string[];
  validationErrors: LevelAnalysisAdapterValidationError[];
}

export interface ExecutionAnalysisLevelContextLimitations {
  count: number;
  items: LevelAnalysisAdapterLimitation[];
  messages: string[];
}

export interface ExecutionAnalysisLevelContextQuality {
  hasLevelQualityAudit: boolean;
  hasExtensionCoverage: boolean;
  hasSummary: boolean;
  qualityDiagnosticsCount: number;
  extensionCoverageWarnings: string[];
}

export interface ExecutionAnalysisSyntheticExtensionLevelContext {
  levelId: string;
  kind: "support" | "resistance";
  representativePrice: number;
  zoneLow: number;
  zoneHigh: number;
  extensionSource: "synthetic_continuation_map";
  generationMethod?: string;
  targetCoveragePct?: number;
  maxCoveragePct?: number;
  syntheticIndex?: number;
  evidenceLimitations: string[];
}

export interface ExecutionAnalysisSyntheticExtensionContext {
  count: number;
  supportCount: number;
  resistanceCount: number;
  levels: ExecutionAnalysisSyntheticExtensionLevelContext[];
}

export interface ExecutionAnalysisLevelContextFactPresence {
  hasSessionFacts: boolean;
  hasVolumeFacts: boolean;
  volumeShelfCount: number;
  hasMarketContext: boolean;
  hasFactsBundle: boolean;
}

export interface ExecutionAnalysisLevelContextInput {
  contract: {
    schemaVersion: LevelAnalysisSnapshotSchemaVersion;
    producer: LevelAnalysisProducer;
    sourceType: "level-analysis-snapshot-v1";
  };
  source: {
    attachmentKey: string;
    storageKey?: LevelAnalysisSnapshotStorageKey;
  };
  owner: {
    ownerId?: string;
    ownerType?: string;
  };
  identity: {
    symbol: string;
    asOfTimestamp: number;
    referencePrice: number;
  };
  nearestSupport: ExecutionAnalysisNearestLevelContext | null;
  nearestResistance: ExecutionAnalysisNearestLevelContext | null;
  levelBucketCounts: ExecutionAnalysisLevelBucketCounts;
  extensionCounts: ExecutionAnalysisExtensionCounts;
  syntheticContinuationMap: ExecutionAnalysisSyntheticExtensionContext;
  factPresence: ExecutionAnalysisLevelContextFactPresence;
  diagnostics: ExecutionAnalysisLevelContextDiagnostics;
  limitations: ExecutionAnalysisLevelContextLimitations;
  safety: ExecutionAnalysisLevelContextSafety;
  quality: ExecutionAnalysisLevelContextQuality;
  compatibility: {
    schemaMajor: "v1";
    factualContextOnly: true;
  };
}

export type ExecutionAnalysisLevelContextUnavailableReason =
  | "quarantined_snapshot"
  | "quarantined_storage_record"
  | "unsafe_no_lookahead"
  | "synthetic_marking_inconsistent"
  | "no_matching_snapshot";

export type ExecutionAnalysisLevelContextBuildResult =
  | {
      status: "available";
      input: ExecutionAnalysisLevelContextInput;
      sourceRecord?: LevelAnalysisSnapshotStorageRecord;
      sourceAttachment: LevelAnalysisSnapshotAttachment;
    }
  | {
      status: "unavailable";
      reason: ExecutionAnalysisLevelContextUnavailableReason;
      message: string;
      sourceRecord?: LevelAnalysisSnapshotStoredRecord;
      sourceAttachment?: LevelAnalysisSnapshotAttachment | QuarantinedLevelAnalysisSnapshotAttachment;
      limitations: LevelAnalysisAdapterLimitation[];
      validationErrors: LevelAnalysisAdapterValidationError[];
    };

export interface ExecutionAnalysisLevelContextAvailabilitySummary {
  available: boolean;
  replaySafe: boolean;
  symbol: string | null;
  asOfTimestamp: number | null;
  syntheticContinuationMapCount: number;
  limitationCount: number;
  diagnosticCount: number;
  reason?: ExecutionAnalysisLevelContextUnavailableReason;
}

function toNearestLevelContext(
  level: LevelAnalysisNearestLevel | null,
): ExecutionAnalysisNearestLevelContext | null {
  if (level === null) {
    return null;
  }

  return {
    levelId: level.levelId,
    kind: level.kind,
    bucket: level.bucket,
    representativePrice: level.representativePrice,
    zoneLow: level.zoneLow,
    zoneHigh: level.zoneHigh,
    strengthScore: level.strengthScore,
    strengthLabel: level.strengthLabel,
    distanceFromReferencePct: level.distanceFromReferencePct,
    isExtension: level.isExtension,
  };
}

function stringValues(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function extensionCoverageWarnings(value: unknown): string[] {
  if (typeof value !== "object" || value === null || !("warnings" in value)) {
    return [];
  }

  return stringValues((value as { warnings?: unknown }).warnings);
}

function syntheticLevelContext(
  level: LevelAnalysisFinalLevelZone,
): ExecutionAnalysisSyntheticExtensionLevelContext {
  const metadata = level.extensionMetadata as LevelAnalysisExtensionMetadata | undefined;

  return {
    levelId: level.id,
    kind: level.kind,
    representativePrice: level.representativePrice,
    zoneLow: level.zoneLow,
    zoneHigh: level.zoneHigh,
    extensionSource: "synthetic_continuation_map",
    generationMethod: metadata?.generationMethod,
    targetCoveragePct: metadata?.targetCoveragePct,
    maxCoveragePct: metadata?.maxCoveragePct,
    syntheticIndex: metadata?.syntheticIndex,
    evidenceLimitations: metadata?.evidenceLimitations ?? [],
  };
}

function hasInconsistentSyntheticMarking(
  attachment: LevelAnalysisSnapshotAttachment,
): boolean {
  return (
    attachment.connectorView.syntheticExtensions.count > 0 &&
    attachment.connectorView.safety.syntheticExtensionsClearlyMarked !== true
  );
}

function unavailableFromQuarantine(
  sourceAttachment: QuarantinedLevelAnalysisSnapshotAttachment,
): Extract<ExecutionAnalysisLevelContextBuildResult, { status: "unavailable" }> {
  return {
    status: "unavailable",
    reason: "quarantined_snapshot",
    message:
      "LevelAnalysisSnapshot attachment is quarantined and cannot produce execution level context input.",
    sourceAttachment,
    limitations: sourceAttachment.limitations,
    validationErrors: sourceAttachment.diagnostics.validationErrors,
  };
}

function unavailableFromAcceptedAttachment(args: {
  reason: ExecutionAnalysisLevelContextUnavailableReason;
  message: string;
  attachment: LevelAnalysisSnapshotAttachment;
  sourceRecord?: LevelAnalysisSnapshotStorageRecord;
}): Extract<ExecutionAnalysisLevelContextBuildResult, { status: "unavailable" }> {
  return {
    status: "unavailable",
    reason: args.reason,
    message: args.message,
    sourceAttachment: args.attachment,
    sourceRecord: args.sourceRecord,
    limitations: args.attachment.limitations,
    validationErrors: args.attachment.diagnostics.validationErrors,
  };
}

function buildInputFromAcceptedAttachment(args: {
  attachment: LevelAnalysisSnapshotAttachment;
  storageKey?: LevelAnalysisSnapshotStorageKey;
}): ExecutionAnalysisLevelContextInput {
  const { attachment } = args;
  const view = attachment.connectorView;
  const qualityAudit = attachment.rawSnapshot.levelQualityAudit;
  const syntheticLevels = view.syntheticExtensions.levels.map(syntheticLevelContext);

  return {
    contract: {
      schemaVersion: attachment.schemaVersion,
      producer: attachment.producer,
      sourceType: attachment.sourceType,
    },
    source: {
      attachmentKey: attachment.attachmentKey,
      storageKey: args.storageKey,
    },
    owner: {
      ownerId: attachment.owner.ownerId,
      ownerType: attachment.owner.ownerType,
    },
    identity: {
      symbol: attachment.symbol,
      asOfTimestamp: attachment.asOfTimestamp,
      referencePrice: view.identity.referencePrice,
    },
    nearestSupport: toNearestLevelContext(view.nearest.support),
    nearestResistance: toNearestLevelContext(view.nearest.resistance),
    levelBucketCounts: view.levelMap.bucketCounts,
    extensionCounts: {
      support: view.levelMap.extensionCounts.support,
      resistance: view.levelMap.extensionCounts.resistance,
      total: view.levelMap.extensionCounts.total,
      synthetic: view.syntheticExtensions.count,
    },
    syntheticContinuationMap: {
      count: view.syntheticExtensions.count,
      supportCount: view.syntheticExtensions.supportCount,
      resistanceCount: view.syntheticExtensions.resistanceCount,
      levels: syntheticLevels,
    },
    factPresence: view.facts,
    diagnostics: {
      snapshotDiagnosticsCount: attachment.diagnostics.snapshotDiagnosticsCount,
      qualityDiagnosticsCount: attachment.diagnostics.qualityDiagnosticsCount,
      snapshotDiagnostics: stringValues(attachment.rawSnapshot.diagnostics),
      qualityDiagnostics: stringValues(qualityAudit.diagnostics),
      validationErrors: attachment.diagnostics.validationErrors,
    },
    limitations: {
      count: attachment.limitations.length,
      items: attachment.limitations,
      messages: attachment.limitations.map((limitation) => limitation.message),
    },
    safety: {
      noLookaheadApplied: view.safety.noLookaheadApplied,
      syntheticExtensionsClearlyMarked: view.safety.syntheticExtensionsClearlyMarked,
      levelOutputUnchanged: view.safety.levelOutputUnchanged,
      factsOnlyVWAP: view.safety.factsOnlyVWAP,
      shelvesAreFactsOnly: view.safety.shelvesAreFactsOnly,
      noRuntimeBehaviorChange: view.safety.noRuntimeBehaviorChange,
    },
    quality: {
      hasLevelQualityAudit: view.quality.hasLevelQualityAudit,
      hasExtensionCoverage: view.quality.hasExtensionCoverage,
      hasSummary: view.quality.hasSummary,
      qualityDiagnosticsCount: view.diagnostics.qualityDiagnosticsCount,
      extensionCoverageWarnings: extensionCoverageWarnings(qualityAudit.extensionCoverage),
    },
    compatibility: {
      schemaMajor: "v1",
      factualContextOnly: true,
    },
  };
}

export function isExecutionAnalysisLevelContextReplaySafe(
  input: ExecutionAnalysisLevelContextInput,
): boolean {
  return (
    input.safety.noLookaheadApplied === true &&
    input.safety.syntheticExtensionsClearlyMarked === true
  );
}

export function buildExecutionAnalysisLevelContextInputFromAttachment(
  attachment: LevelAnalysisSnapshotAttachment | QuarantinedLevelAnalysisSnapshotAttachment,
): ExecutionAnalysisLevelContextBuildResult {
  if (attachment.validationStatus === "quarantined") {
    return unavailableFromQuarantine(attachment);
  }

  if (attachment.connectorView.safety.noLookaheadApplied !== true) {
    return unavailableFromAcceptedAttachment({
      reason: "unsafe_no_lookahead",
      message:
        "Execution level context input requires noLookaheadApplied to be true.",
      attachment,
    });
  }

  if (hasInconsistentSyntheticMarking(attachment)) {
    return unavailableFromAcceptedAttachment({
      reason: "synthetic_marking_inconsistent",
      message:
        "Synthetic continuation-map rows are present but safety marking is false.",
      attachment,
    });
  }

  return {
    status: "available",
    sourceAttachment: attachment,
    input: buildInputFromAcceptedAttachment({ attachment }),
  };
}

export function buildExecutionAnalysisLevelContextInputFromStorageRecord(
  record: LevelAnalysisSnapshotStoredRecord,
): ExecutionAnalysisLevelContextBuildResult {
  if (record.validationStatus === "quarantined") {
    return {
      status: "unavailable",
      reason: "quarantined_storage_record",
      message:
        "LevelAnalysisSnapshot storage record is quarantined and cannot produce execution level context input.",
      sourceRecord: record,
      sourceAttachment: record.attachment,
      limitations: record.limitations,
      validationErrors: record.quarantineReasons,
    };
  }

  const result = buildExecutionAnalysisLevelContextInputFromAttachment(record.attachment);

  if (result.status === "unavailable") {
    return {
      ...result,
      sourceRecord: record,
    };
  }

  return {
    status: "available",
    sourceRecord: record,
    sourceAttachment: record.attachment,
    input: buildInputFromAcceptedAttachment({
      attachment: record.attachment,
      storageKey: record.storageKey,
    }),
  };
}

export function buildExecutionAnalysisLevelContextInputFromStoredSnapshots(
  records: LevelAnalysisSnapshotStorageIndex,
  query: LevelAnalysisSnapshotRetrievalQuery,
): ExecutionAnalysisLevelContextBuildResult {
  const retrieval = retrieveNearestAsOfLevelAnalysisSnapshot(records, {
    ...query,
    status: "accepted",
  });

  if (retrieval.status === "not_found") {
    return {
      status: "unavailable",
      reason: "no_matching_snapshot",
      message: retrieval.reason,
      limitations: [],
      validationErrors: [],
    };
  }

  return buildExecutionAnalysisLevelContextInputFromStorageRecord(retrieval.record);
}

export function summarizeExecutionAnalysisLevelContextAvailability(
  input: ExecutionAnalysisLevelContextInput | ExecutionAnalysisLevelContextBuildResult,
): ExecutionAnalysisLevelContextAvailabilitySummary {
  if ("status" in input) {
    if (input.status === "unavailable") {
      return {
        available: false,
        replaySafe: false,
        symbol: null,
        asOfTimestamp: null,
        syntheticContinuationMapCount: 0,
        limitationCount: input.limitations.length,
        diagnosticCount: input.validationErrors.length,
        reason: input.reason,
      };
    }

    return summarizeExecutionAnalysisLevelContextAvailability(input.input);
  }

  return {
    available: true,
    replaySafe: isExecutionAnalysisLevelContextReplaySafe(input),
    symbol: input.identity.symbol,
    asOfTimestamp: input.identity.asOfTimestamp,
    syntheticContinuationMapCount: input.syntheticContinuationMap.count,
    limitationCount: input.limitations.count,
    diagnosticCount:
      input.diagnostics.snapshotDiagnosticsCount +
      input.diagnostics.qualityDiagnosticsCount,
  };
}
