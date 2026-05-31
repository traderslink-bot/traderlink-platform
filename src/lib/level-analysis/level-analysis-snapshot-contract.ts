export type LevelAnalysisSnapshotSchemaVersion = `level-analysis-snapshot/v1${string}`;

export type LevelAnalysisProducer = "levels-system";

export type LevelAnalysisSide = "support" | "resistance";

export type LevelAnalysisTimeframeKey = "5m" | "15m" | "4h" | "daily";

export interface LevelAnalysisTimeframeSummary {
  provided: boolean;
  candleCount: number;
  filteredCandleCount: number;
  excludedFutureCandleCount: number;
  excludedPartialCandleCount: number;
}

export interface LevelAnalysisInputSummary {
  timeframesPresent: LevelAnalysisTimeframeKey[];
  candleCounts: Record<LevelAnalysisTimeframeKey, number>;
  filteredCandleCounts: Record<LevelAnalysisTimeframeKey, number>;
  excludedFutureCandleCounts: Record<LevelAnalysisTimeframeKey, number>;
  excludedPartialCandleCounts: Record<LevelAnalysisTimeframeKey, number>;
  timeframes: Record<LevelAnalysisTimeframeKey, LevelAnalysisTimeframeSummary>;
  previousCloseProvided: boolean;
}

export interface LevelAnalysisNearestLevel {
  levelId: string;
  kind: LevelAnalysisSide;
  bucket: string;
  representativePrice: number;
  zoneLow: number;
  zoneHigh: number;
  strengthScore: number;
  strengthLabel: string;
  distanceFromReferencePct: number;
  isExtension: boolean;
}

export interface LevelAnalysisExtensionMetadata {
  extensionSource?: "historical_candidate" | "synthetic_continuation_map" | string;
  generationMethod?: string;
  referencePrice?: number;
  targetCoveragePct?: number;
  maxCoveragePct?: number;
  syntheticIndex?: number;
  evidenceLimitations?: string[];
  [key: string]: unknown;
}

export interface LevelAnalysisFinalLevelZone {
  id: string;
  symbol: string;
  kind: LevelAnalysisSide;
  timeframeBias?: string;
  zoneLow: number;
  zoneHigh: number;
  representativePrice: number;
  strengthScore: number;
  strengthLabel: string;
  touchCount: number;
  confluenceCount: number;
  sourceTypes: string[];
  timeframeSources: string[];
  reactionQualityScore?: number;
  rejectionScore?: number;
  displacementScore?: number;
  sessionSignificanceScore?: number;
  followThroughScore?: number;
  sourceEvidenceCount?: number;
  firstTimestamp?: number;
  lastTimestamp?: number;
  sessionDate?: string;
  isExtension: boolean;
  freshness?: string;
  notes: string[];
  extensionMetadata?: LevelAnalysisExtensionMetadata;
  [key: string]: unknown;
}

export interface LevelAnalysisLevelEngineOutput {
  symbol: string;
  generatedAt?: number;
  metadata?: Record<string, unknown>;
  majorSupport: LevelAnalysisFinalLevelZone[];
  majorResistance: LevelAnalysisFinalLevelZone[];
  intermediateSupport: LevelAnalysisFinalLevelZone[];
  intermediateResistance: LevelAnalysisFinalLevelZone[];
  intradaySupport: LevelAnalysisFinalLevelZone[];
  intradayResistance: LevelAnalysisFinalLevelZone[];
  extensionLevels: {
    support: LevelAnalysisFinalLevelZone[];
    resistance: LevelAnalysisFinalLevelZone[];
  };
  specialLevels?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LevelAnalysisSafetyFlags {
  noLookaheadApplied: boolean;
  levelOutputUnchanged: boolean;
  factsOnlyVWAP: boolean;
  shelvesAreFactsOnly: boolean;
  syntheticExtensionsClearlyMarked: boolean;
  noRuntimeBehaviorChange: boolean;
  [key: string]: unknown;
}

export interface LevelAnalysisSnapshotV1 {
  schemaVersion: LevelAnalysisSnapshotSchemaVersion;
  producer: LevelAnalysisProducer;
  symbol: string;
  asOfTimestamp: number;
  referencePrice: number;
  inputSummary: LevelAnalysisInputSummary;
  nearestSupport: LevelAnalysisNearestLevel | null;
  nearestResistance: LevelAnalysisNearestLevel | null;
  levelEngineOutput: LevelAnalysisLevelEngineOutput;
  sessionFacts?: Record<string, unknown>;
  volumeFacts?: Record<string, unknown>;
  volumeShelves?: unknown[];
  marketContext?: Record<string, unknown>;
  factsBundle?: Record<string, unknown>;
  levelIntelligenceReport: Record<string, unknown>;
  levelQualityAudit: Record<string, unknown>;
  diagnostics: unknown[];
  safety: LevelAnalysisSafetyFlags;
  [key: string]: unknown;
}

export type LevelAnalysisAdapterValidationCode =
  | "invalid_json"
  | "payload_not_object"
  | "missing_required_field"
  | "unsupported_schema_version"
  | "wrong_producer"
  | "invalid_field_shape"
  | "unsafe_for_replay"
  | "synthetic_marking_inconsistent";

export interface LevelAnalysisAdapterValidationError {
  code: LevelAnalysisAdapterValidationCode;
  field: string;
  message: string;
}

export type LevelAnalysisAdapterLimitationCode =
  | "nearest_support_unavailable"
  | "nearest_resistance_unavailable"
  | "session_facts_unavailable"
  | "volume_facts_unavailable"
  | "volume_shelves_unavailable"
  | "market_context_unavailable"
  | "facts_bundle_unavailable"
  | "extension_levels_empty";

export interface LevelAnalysisAdapterLimitation {
  code: LevelAnalysisAdapterLimitationCode;
  field: string;
  message: string;
}

export interface LevelAnalysisConnectorView {
  contract: {
    schemaVersion: LevelAnalysisSnapshotSchemaVersion;
    producer: LevelAnalysisProducer;
  };
  identity: {
    symbol: string;
    asOfTimestamp: number;
    referencePrice: number;
  };
  sourceSnapshot: {
    schemaVersion: LevelAnalysisSnapshotSchemaVersion;
    producer: LevelAnalysisProducer;
    symbol: string;
    asOfTimestamp: number;
  };
  inputSummary: LevelAnalysisInputSummary;
  nearest: {
    support: LevelAnalysisNearestLevel | null;
    resistance: LevelAnalysisNearestLevel | null;
  };
  levelMap: {
    bucketCounts: {
      majorSupport: number;
      majorResistance: number;
      intermediateSupport: number;
      intermediateResistance: number;
      intradaySupport: number;
      intradayResistance: number;
    };
    extensionCounts: {
      support: number;
      resistance: number;
      total: number;
    };
  };
  facts: {
    hasSessionFacts: boolean;
    hasVolumeFacts: boolean;
    volumeShelfCount: number;
    hasMarketContext: boolean;
    hasFactsBundle: boolean;
  };
  diagnostics: {
    snapshotDiagnosticsCount: number;
    qualityDiagnosticsCount: number;
  };
  safety: LevelAnalysisSafetyFlags;
  quality: {
    hasLevelQualityAudit: boolean;
    hasExtensionCoverage: boolean;
    hasSummary: boolean;
  };
  syntheticExtensions: {
    count: number;
    supportCount: number;
    resistanceCount: number;
    levels: LevelAnalysisFinalLevelZone[];
  };
  limitations: LevelAnalysisAdapterLimitation[];
  compatibility: {
    schemaMajor: "v1";
    acceptsAdditiveFields: true;
    preservesUnknownFields: true;
  };
}

export type LevelAnalysisAdapterResult =
  | {
      status: "accepted";
      sourceSnapshot: LevelAnalysisSnapshotV1;
      snapshot: LevelAnalysisSnapshotV1;
      view: LevelAnalysisConnectorView;
      limitations: LevelAnalysisAdapterLimitation[];
      errors: [];
    }
  | {
      status: "quarantined";
      sourceSnapshot?: unknown;
      errors: LevelAnalysisAdapterValidationError[];
      limitations: LevelAnalysisAdapterLimitation[];
    };
