import type {
  LevelAnalysisAdapterLimitation,
  LevelAnalysisAdapterResult,
  LevelAnalysisAdapterValidationError,
  LevelAnalysisConnectorView,
  LevelAnalysisFinalLevelZone,
  LevelAnalysisInputSummary,
  LevelAnalysisLevelEngineOutput,
  LevelAnalysisNearestLevel,
  LevelAnalysisSafetyFlags,
  LevelAnalysisSnapshotV1,
  LevelAnalysisTimeframeKey,
} from "./level-analysis-snapshot-contract";

const TIMEFRAME_KEYS: LevelAnalysisTimeframeKey[] = ["5m", "15m", "4h", "daily"];

const LEVEL_BUCKET_KEYS = [
  "majorSupport",
  "majorResistance",
  "intermediateSupport",
  "intermediateResistance",
  "intradaySupport",
  "intradayResistance",
] as const;

type LevelBucketKey = (typeof LEVEL_BUCKET_KEYS)[number];

type ValidationOptions = {
  requireReplaySafe?: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === "boolean";
}

function validationError(
  code: LevelAnalysisAdapterValidationError["code"],
  field: string,
  message: string,
): LevelAnalysisAdapterValidationError {
  return { code, field, message };
}

function limitation(
  code: LevelAnalysisAdapterLimitation["code"],
  field: string,
  message: string,
): LevelAnalysisAdapterLimitation {
  return { code, field, message };
}

function requireField(
  payload: Record<string, unknown>,
  field: string,
  errors: LevelAnalysisAdapterValidationError[],
): boolean {
  if (!(field in payload)) {
    errors.push(
      validationError("missing_required_field", field, `Missing required field ${field}.`),
    );
    return false;
  }

  return true;
}

function isNumberRecord(value: unknown): value is Record<LevelAnalysisTimeframeKey, number> {
  if (!isRecord(value)) {
    return false;
  }

  return TIMEFRAME_KEYS.every((key) => isFiniteNumber(value[key]));
}

function isInputSummary(value: unknown): value is LevelAnalysisInputSummary {
  if (!isRecord(value)) {
    return false;
  }

  if (!Array.isArray(value.timeframesPresent)) {
    return false;
  }

  if (
    !isNumberRecord(value.candleCounts) ||
    !isNumberRecord(value.filteredCandleCounts) ||
    !isNumberRecord(value.excludedFutureCandleCounts) ||
    !isNumberRecord(value.excludedPartialCandleCounts)
  ) {
    return false;
  }

  if (!isRecord(value.timeframes) || !isBoolean(value.previousCloseProvided)) {
    return false;
  }

  const timeframes = value.timeframes;

  return TIMEFRAME_KEYS.every((key) => {
    const timeframe = timeframes[key];
    return (
      isRecord(timeframe) &&
      isBoolean(timeframe.provided) &&
      isFiniteNumber(timeframe.candleCount) &&
      isFiniteNumber(timeframe.filteredCandleCount) &&
      isFiniteNumber(timeframe.excludedFutureCandleCount) &&
      isFiniteNumber(timeframe.excludedPartialCandleCount)
    );
  });
}

function isNearestLevel(value: unknown): value is LevelAnalysisNearestLevel {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.levelId) &&
    (value.kind === "support" || value.kind === "resistance") &&
    isNonEmptyString(value.bucket) &&
    isFiniteNumber(value.representativePrice) &&
    isFiniteNumber(value.zoneLow) &&
    isFiniteNumber(value.zoneHigh) &&
    isFiniteNumber(value.strengthScore) &&
    isNonEmptyString(value.strengthLabel) &&
    isFiniteNumber(value.distanceFromReferencePct) &&
    isBoolean(value.isExtension)
  );
}

function isLevelZone(value: unknown): value is LevelAnalysisFinalLevelZone {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value.id) &&
    isNonEmptyString(value.symbol) &&
    (value.kind === "support" || value.kind === "resistance") &&
    isFiniteNumber(value.zoneLow) &&
    isFiniteNumber(value.zoneHigh) &&
    isFiniteNumber(value.representativePrice) &&
    isFiniteNumber(value.strengthScore) &&
    isNonEmptyString(value.strengthLabel) &&
    isFiniteNumber(value.touchCount) &&
    isFiniteNumber(value.confluenceCount) &&
    Array.isArray(value.sourceTypes) &&
    Array.isArray(value.timeframeSources) &&
    isBoolean(value.isExtension) &&
    Array.isArray(value.notes)
  );
}

function isLevelZoneArray(value: unknown): value is LevelAnalysisFinalLevelZone[] {
  return Array.isArray(value) && value.every(isLevelZone);
}

function getLevelBucket(
  output: LevelAnalysisLevelEngineOutput,
  key: LevelBucketKey,
): LevelAnalysisFinalLevelZone[] {
  return output[key];
}

function isLevelEngineOutput(value: unknown): value is LevelAnalysisLevelEngineOutput {
  if (!isRecord(value) || !isNonEmptyString(value.symbol)) {
    return false;
  }

  for (const key of LEVEL_BUCKET_KEYS) {
    if (!isLevelZoneArray(value[key])) {
      return false;
    }
  }

  const extensionLevels = value.extensionLevels;
  return (
    isRecord(extensionLevels) &&
    isLevelZoneArray(extensionLevels.support) &&
    isLevelZoneArray(extensionLevels.resistance)
  );
}

function isSafetyFlags(value: unknown): value is LevelAnalysisSafetyFlags {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoolean(value.noLookaheadApplied) &&
    isBoolean(value.levelOutputUnchanged) &&
    isBoolean(value.factsOnlyVWAP) &&
    isBoolean(value.shelvesAreFactsOnly) &&
    isBoolean(value.syntheticExtensionsClearlyMarked) &&
    isBoolean(value.noRuntimeBehaviorChange)
  );
}

function validateNearestField(
  payload: Record<string, unknown>,
  field: "nearestSupport" | "nearestResistance",
  errors: LevelAnalysisAdapterValidationError[],
): void {
  if (!requireField(payload, field, errors)) {
    return;
  }

  const value = payload[field];
  if (value !== null && !isNearestLevel(value)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        field,
        `${field} must be null or a valid nearest-level object.`,
      ),
    );
  }
}

function getQualityDiagnosticsCount(snapshot: LevelAnalysisSnapshotV1): number {
  const diagnostics = snapshot.levelQualityAudit.diagnostics;
  return Array.isArray(diagnostics) ? diagnostics.length : 0;
}

function hasSyntheticContinuationRows(snapshot: LevelAnalysisSnapshotV1): boolean {
  return findSyntheticContinuationMapLevels(snapshot).length > 0;
}

function buildLimitations(snapshot: LevelAnalysisSnapshotV1): LevelAnalysisAdapterLimitation[] {
  const limitations: LevelAnalysisAdapterLimitation[] = [];

  if (snapshot.nearestSupport === null) {
    limitations.push(
      limitation(
        "nearest_support_unavailable",
        "nearestSupport",
        "Nearest support is unavailable in this as-of snapshot.",
      ),
    );
  }

  if (snapshot.nearestResistance === null) {
    limitations.push(
      limitation(
        "nearest_resistance_unavailable",
        "nearestResistance",
        "Nearest resistance is unavailable in this as-of snapshot.",
      ),
    );
  }

  if (!snapshot.sessionFacts) {
    limitations.push(
      limitation("session_facts_unavailable", "sessionFacts", "Session facts are absent."),
    );
  }

  if (!snapshot.volumeFacts) {
    limitations.push(
      limitation("volume_facts_unavailable", "volumeFacts", "Volume facts are absent."),
    );
  }

  if (!Array.isArray(snapshot.volumeShelves) || snapshot.volumeShelves.length === 0) {
    limitations.push(
      limitation(
        "volume_shelves_unavailable",
        "volumeShelves",
        "No volume shelves are available in this snapshot.",
      ),
    );
  }

  if (!snapshot.marketContext) {
    limitations.push(
      limitation("market_context_unavailable", "marketContext", "Market context is absent."),
    );
  }

  if (!snapshot.factsBundle) {
    limitations.push(
      limitation("facts_bundle_unavailable", "factsBundle", "Market context facts bundle is absent."),
    );
  }

  const extensionLevels = snapshot.levelEngineOutput.extensionLevels;
  if (extensionLevels.support.length === 0 && extensionLevels.resistance.length === 0) {
    limitations.push(
      limitation(
        "extension_levels_empty",
        "levelEngineOutput.extensionLevels",
        "No extension levels are available in this snapshot.",
      ),
    );
  }

  return limitations;
}

export function parseLevelAnalysisSnapshotJson(rawJson: string): unknown {
  return JSON.parse(rawJson);
}

export function findSyntheticContinuationMapLevels(
  snapshot: LevelAnalysisSnapshotV1,
): LevelAnalysisFinalLevelZone[] {
  return [
    ...snapshot.levelEngineOutput.extensionLevels.support,
    ...snapshot.levelEngineOutput.extensionLevels.resistance,
  ].filter(
    (level) => level.extensionMetadata?.extensionSource === "synthetic_continuation_map",
  );
}

export function collectLevelAnalysisLimitations(
  snapshot: LevelAnalysisSnapshotV1,
): LevelAnalysisAdapterLimitation[] {
  return buildLimitations(snapshot);
}

export function deriveLevelAnalysisConnectorView(
  snapshot: LevelAnalysisSnapshotV1,
): LevelAnalysisConnectorView {
  const syntheticLevels = findSyntheticContinuationMapLevels(snapshot);
  const extensionSupportCount = snapshot.levelEngineOutput.extensionLevels.support.length;
  const extensionResistanceCount = snapshot.levelEngineOutput.extensionLevels.resistance.length;

  return {
    contract: {
      schemaVersion: snapshot.schemaVersion,
      producer: snapshot.producer,
    },
    identity: {
      symbol: snapshot.symbol,
      asOfTimestamp: snapshot.asOfTimestamp,
      referencePrice: snapshot.referencePrice,
    },
    sourceSnapshot: {
      schemaVersion: snapshot.schemaVersion,
      producer: snapshot.producer,
      symbol: snapshot.symbol,
      asOfTimestamp: snapshot.asOfTimestamp,
    },
    inputSummary: snapshot.inputSummary,
    nearest: {
      support: snapshot.nearestSupport,
      resistance: snapshot.nearestResistance,
    },
    levelMap: {
      bucketCounts: {
        majorSupport: getLevelBucket(snapshot.levelEngineOutput, "majorSupport").length,
        majorResistance: getLevelBucket(snapshot.levelEngineOutput, "majorResistance").length,
        intermediateSupport: getLevelBucket(snapshot.levelEngineOutput, "intermediateSupport").length,
        intermediateResistance: getLevelBucket(snapshot.levelEngineOutput, "intermediateResistance").length,
        intradaySupport: getLevelBucket(snapshot.levelEngineOutput, "intradaySupport").length,
        intradayResistance: getLevelBucket(snapshot.levelEngineOutput, "intradayResistance").length,
      },
      extensionCounts: {
        support: extensionSupportCount,
        resistance: extensionResistanceCount,
        total: extensionSupportCount + extensionResistanceCount,
      },
    },
    facts: {
      hasSessionFacts: Boolean(snapshot.sessionFacts),
      hasVolumeFacts: Boolean(snapshot.volumeFacts),
      volumeShelfCount: Array.isArray(snapshot.volumeShelves) ? snapshot.volumeShelves.length : 0,
      hasMarketContext: Boolean(snapshot.marketContext),
      hasFactsBundle: Boolean(snapshot.factsBundle),
    },
    diagnostics: {
      snapshotDiagnosticsCount: snapshot.diagnostics.length,
      qualityDiagnosticsCount: getQualityDiagnosticsCount(snapshot),
    },
    safety: snapshot.safety,
    quality: {
      hasLevelQualityAudit: true,
      hasExtensionCoverage: "extensionCoverage" in snapshot.levelQualityAudit,
      hasSummary: "summary" in snapshot.levelQualityAudit,
    },
    syntheticExtensions: {
      count: syntheticLevels.length,
      supportCount: syntheticLevels.filter((level) => level.kind === "support").length,
      resistanceCount: syntheticLevels.filter((level) => level.kind === "resistance").length,
      levels: syntheticLevels,
    },
    limitations: collectLevelAnalysisLimitations(snapshot),
    compatibility: {
      schemaMajor: "v1",
      acceptsAdditiveFields: true,
      preservesUnknownFields: true,
    },
  };
}

export function validateLevelAnalysisSnapshotV1(
  payload: unknown,
  options: ValidationOptions = {},
): LevelAnalysisAdapterResult {
  const errors: LevelAnalysisAdapterValidationError[] = [];

  if (!isRecord(payload)) {
    return {
      status: "quarantined",
      sourceSnapshot: payload,
      errors: [
        validationError(
          "payload_not_object",
          "$",
          "LevelAnalysisSnapshot payload must be an object.",
        ),
      ],
      limitations: [],
    };
  }

  for (const field of [
    "schemaVersion",
    "producer",
    "symbol",
    "asOfTimestamp",
    "referencePrice",
    "inputSummary",
    "levelEngineOutput",
    "levelIntelligenceReport",
    "levelQualityAudit",
    "diagnostics",
    "safety",
  ]) {
    requireField(payload, field, errors);
  }

  if (
    "schemaVersion" in payload &&
    (!isNonEmptyString(payload.schemaVersion) ||
      !payload.schemaVersion.startsWith("level-analysis-snapshot/v1"))
  ) {
    errors.push(
      validationError(
        "unsupported_schema_version",
        "schemaVersion",
        "Only level-analysis-snapshot/v1 payloads are supported.",
      ),
    );
  }

  if ("producer" in payload && payload.producer !== "levels-system") {
    errors.push(
      validationError("wrong_producer", "producer", "Producer must be levels-system."),
    );
  }

  if ("symbol" in payload && !isNonEmptyString(payload.symbol)) {
    errors.push(validationError("invalid_field_shape", "symbol", "Symbol must be present."));
  }

  if ("asOfTimestamp" in payload && !isFiniteNumber(payload.asOfTimestamp)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "asOfTimestamp",
        "asOfTimestamp must be a finite millisecond timestamp.",
      ),
    );
  }

  if ("referencePrice" in payload && !isFiniteNumber(payload.referencePrice)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "referencePrice",
        "referencePrice must be a finite number.",
      ),
    );
  }

  if ("inputSummary" in payload && !isInputSummary(payload.inputSummary)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "inputSummary",
        "inputSummary must contain locked v1 candle and timeframe summary fields.",
      ),
    );
  }

  validateNearestField(payload, "nearestSupport", errors);
  validateNearestField(payload, "nearestResistance", errors);

  if ("levelEngineOutput" in payload && !isLevelEngineOutput(payload.levelEngineOutput)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "levelEngineOutput",
        "levelEngineOutput must include canonical support/resistance buckets and extension levels.",
      ),
    );
  }

  if ("levelIntelligenceReport" in payload && !isRecord(payload.levelIntelligenceReport)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "levelIntelligenceReport",
        "levelIntelligenceReport must be an object.",
      ),
    );
  }

  if ("levelQualityAudit" in payload && !isRecord(payload.levelQualityAudit)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "levelQualityAudit",
        "levelQualityAudit must be an object.",
      ),
    );
  }

  if ("diagnostics" in payload && !Array.isArray(payload.diagnostics)) {
    errors.push(
      validationError("invalid_field_shape", "diagnostics", "diagnostics must be an array."),
    );
  }

  if ("safety" in payload && !isSafetyFlags(payload.safety)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "safety",
        "safety must include locked v1 boolean safety flags.",
      ),
    );
  }

  if (
    options.requireReplaySafe &&
    isSafetyFlags(payload.safety) &&
    payload.safety.noLookaheadApplied !== true
  ) {
    errors.push(
      validationError(
        "unsafe_for_replay",
        "safety.noLookaheadApplied",
        "Replay and journal use requires noLookaheadApplied to be true.",
      ),
    );
  }

  if (
    isLevelEngineOutput(payload.levelEngineOutput) &&
    isSafetyFlags(payload.safety) &&
    payload.safety.syntheticExtensionsClearlyMarked !== true
  ) {
    const provisional = payload as LevelAnalysisSnapshotV1;
    if (hasSyntheticContinuationRows(provisional)) {
      errors.push(
        validationError(
          "synthetic_marking_inconsistent",
          "safety.syntheticExtensionsClearlyMarked",
          "Synthetic continuation-map rows are present but safety marking is false.",
        ),
      );
    }
  }

  if (errors.length > 0) {
    return {
      status: "quarantined",
      sourceSnapshot: payload,
      errors,
      limitations: [],
    };
  }

  const snapshot = payload as LevelAnalysisSnapshotV1;
  const limitations = collectLevelAnalysisLimitations(snapshot);

  return {
    status: "accepted",
    sourceSnapshot: snapshot,
    snapshot,
    view: deriveLevelAnalysisConnectorView(snapshot),
    limitations,
    errors: [],
  };
}

export function loadLevelAnalysisSnapshotForJournal(
  rawJson: string,
): LevelAnalysisAdapterResult {
  try {
    return validateLevelAnalysisSnapshotV1(parseLevelAnalysisSnapshotJson(rawJson), {
      requireReplaySafe: true,
    });
  } catch (error) {
    return {
      status: "quarantined",
      errors: [
        validationError(
          "invalid_json",
          "$",
          error instanceof Error ? error.message : "Invalid LevelAnalysisSnapshot JSON.",
        ),
      ],
      limitations: [],
    };
  }
}
