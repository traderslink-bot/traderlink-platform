import {
  findSyntheticContinuationMapLevels,
  validateLevelAnalysisSnapshotV1,
} from "./level-analysis-snapshot-adapter";
import type {
  LevelAnalysisAdapterLimitation,
  LevelAnalysisAdapterValidationError,
  LevelAnalysisLevelEngineOutput,
  LevelAnalysisSnapshotV1,
} from "./level-analysis-snapshot-contract";

const SNAPSHOT_V1_SCHEMA_PREFIX = "level-analysis-snapshot/v1";
const PACKAGED_REVIEW_SCHEMA_PREFIX = "level-quality-review-process/v1";
const DEFAULT_ALLOWED_PACKAGED_PROVIDERS = ["ibkr"];

const LEVEL_BUCKET_KEYS = [
  "majorSupport",
  "majorResistance",
  "intermediateSupport",
  "intermediateResistance",
  "intradaySupport",
  "intradayResistance",
  "extensionSupport",
  "extensionResistance",
  "total",
] as const;

const REQUIRED_PACKAGED_FIELDS = [
  "schemaVersion",
  "generatedAt",
  "provider",
  "reviewedSymbols",
  "supplied15mSymbols",
  "summary",
  "cacheFingerprintSet",
  "cacheFingerprintSummary",
  "entries",
  "prohibitedLanguageHits",
  "safety",
] as const;

const REQUIRED_ENTRY_FIELDS = [
  "symbol",
  "provider",
  "asOfTimestamp",
  "asOfIso",
  "referencePrice",
  "previousClose",
  "sourceFiles",
  "nearestLevels",
  "bucketCounts",
  "extensionCoverage",
  "syntheticContinuationMap",
  "qualityAudit",
  "diagnosticSemantics",
  "fifteenMinuteContext",
  "candidateInventoryVisibility",
  "candidateVolumeSessionContext",
  "parity",
  "mismatches",
  "safety",
] as const;

const REQUIRED_PARITY_FIELDS = [
  "nearestSupport",
  "nearestResistance",
  "bucketCounts",
  "extensionCounts",
  "syntheticContinuationMapCount",
  "syntheticContinuationMapMarking",
  "diagnosticsUnchanged",
  "diagnosticSemanticsUnchanged",
  "enrichmentBreakdown",
  "extensionCoverageWarnings",
  "clusteredDensityDiagnostics",
  "fifteenMinuteStillContextOnly",
] as const;

type JsonRecord = Record<string, unknown>;

export type LevelAnalysisJournalSourceKind =
  | "single_snapshot_v1"
  | "packaged_review_delivery";

export type LevelAnalysisJournalDeliveryValidationCode =
  | LevelAnalysisAdapterValidationError["code"]
  | "unsupported_schema_or_package_shape"
  | "wrong_provider"
  | "missing_entries"
  | "nonzero_mismatch_count"
  | "package_mismatch"
  | "prohibited_language_hits"
  | "missing_safety_flags"
  | "unsafe_for_journal_delivery"
  | "fifteen_minute_not_context_only"
  | "cache_fingerprint_not_context_only"
  | "candidate_inventory_invalid"
  | "candidate_volume_session_invalid";

export interface LevelAnalysisJournalDeliveryValidationError {
  code: LevelAnalysisJournalDeliveryValidationCode;
  field: string;
  message: string;
}

export interface LevelAnalysisJournalDeliveryLimitation {
  code: string;
  field: string;
  message: string;
}

export interface LevelAnalysisJournalDeliveryOptions {
  allowedPackagedProviders?: string[];
}

export interface LevelAnalysisCacheFingerprint {
  schemaVersion: string;
  relativePath: string;
  provider: string;
  symbol: string;
  timeframe: string;
  sha256: string;
  wrapperCandleCount?: number;
  requestLookbackBars?: number;
  requestEndTimestamp?: number;
  actualBarsReturned?: number;
  validationIssueCount?: number;
  firstCandleTimestamp?: number;
  lastCandleTimestamp?: number;
  asOfTimestamp?: number;
  includedInLevelEngine: boolean;
  contextOnly: boolean;
  safety: JsonRecord;
  [key: string]: unknown;
}

export interface LevelAnalysisCacheFingerprintSet {
  schemaVersion: string;
  generatedAt: string;
  provider: string;
  fingerprints: LevelAnalysisCacheFingerprint[];
  [key: string]: unknown;
}

export interface LevelAnalysisPackagedReviewEntry {
  symbol: string;
  provider: string;
  asOfTimestamp: number;
  asOfIso: string;
  referencePrice: number;
  previousClose: number;
  sourceFiles: JsonRecord;
  nearestLevels: JsonRecord;
  bucketCounts: Record<string, number>;
  extensionCoverage: JsonRecord;
  syntheticContinuationMap: JsonRecord;
  qualityAudit: JsonRecord;
  diagnosticSemantics: JsonRecord;
  fifteenMinuteContext: JsonRecord;
  candidateInventoryVisibility: JsonRecord;
  candidateVolumeSessionContext: JsonRecord;
  parity: JsonRecord;
  mismatches: unknown[];
  safety: JsonRecord;
  [key: string]: unknown;
}

export interface LevelAnalysisPackagedReviewDeliveryPackage {
  schemaVersion: string;
  generatedAt: string;
  provider: string;
  reviewedSymbols: string[];
  supplied15mSymbols: string[];
  summary: JsonRecord;
  cacheFingerprintSet: LevelAnalysisCacheFingerprintSet;
  cacheFingerprintSummary: JsonRecord;
  entries: LevelAnalysisPackagedReviewEntry[];
  prohibitedLanguageHits: unknown[];
  safety: JsonRecord;
  [key: string]: unknown;
}

export interface LevelAnalysisJournalPackageMetadata {
  schemaVersion: string;
  generatedAt: string;
  provider: string;
  reviewedSymbols: string[];
  supplied15mSymbols: string[];
  summary: JsonRecord;
  cacheFingerprintSummary: JsonRecord;
}

export interface LevelAnalysisJournalChartContextView {
  sourceKind: LevelAnalysisJournalSourceKind;
  packageMetadata?: LevelAnalysisJournalPackageMetadata;
  source: {
    schemaVersion: string;
    producer: "levels-system";
    sourceArtifact?: string;
  };
  identity: {
    symbol: string;
    asOfTimestamp: number;
    asOfIso?: string;
    provider?: string;
    referencePrice?: number;
    previousClose?: number;
  };
  nearestLevels: {
    support: unknown;
    resistance: unknown;
  };
  bucketCounts: Record<string, number>;
  extensionCoverage?: unknown;
  syntheticContinuationMap: {
    count: number;
    supportCount?: number;
    resistanceCount?: number;
    clearlyMarkedCount?: number;
    entries?: unknown[];
    levels?: unknown[];
  };
  qualityDiagnostics: {
    diagnostics: string[];
    diagnosticSemantics?: unknown;
    densityMetric?: unknown;
  };
  candidateInventory?: {
    present: boolean;
    gapSummary?: unknown;
    unsurfacedCloser?: unknown;
    diagnostics: string[];
    limitations: string[];
  };
  volumeSessionContext?: {
    present: boolean;
    contextCount?: number;
    comparisonSummary?: unknown;
    diagnostics: string[];
    safety?: unknown;
    factSummary?: {
      hasSessionFacts: boolean;
      hasVolumeFacts: boolean;
      volumeShelfCount: number;
    };
  };
  sourceFiles?: JsonRecord;
  sourceIntegrity?: {
    cacheFingerprintSummary?: JsonRecord;
    cacheFingerprintCounts?: {
      totalFingerprints: number;
      levelEngineInputCount: number;
      contextOnlyCount: number;
      fifteenMinuteContextOnlyCount: number;
      validationIssueCount: number;
    };
    fifteenMinuteCacheFingerprintsContextOnly?: boolean;
    mismatchCount?: number;
    prohibitedLanguageHitCount?: number;
  };
  fifteenMinuteContext: {
    inputProvided: boolean;
    stillContextOnly: boolean | null;
    status: "context_only" | "not_supplied" | "not_declared_by_single_snapshot_v1";
    filteredCandleCount?: number;
  };
  parity?: unknown;
  mismatches?: unknown[];
  limitations: LevelAnalysisJournalDeliveryLimitation[];
  safetyFlags: unknown;
}

export type LevelAnalysisJournalDeliveryIngestionResult =
  | {
      status: "accepted";
      sourceKind: LevelAnalysisJournalSourceKind;
      sourcePayload: LevelAnalysisSnapshotV1 | LevelAnalysisPackagedReviewDeliveryPackage;
      views: LevelAnalysisJournalChartContextView[];
      packageMetadata?: LevelAnalysisJournalPackageMetadata;
      limitations: LevelAnalysisJournalDeliveryLimitation[];
      errors: [];
    }
  | {
      status: "quarantined";
      sourceKind?: LevelAnalysisJournalSourceKind;
      sourcePayload?: unknown;
      views: [];
      limitations: [];
      errors: LevelAnalysisJournalDeliveryValidationError[];
    };

function isRecord(value: unknown): value is JsonRecord {
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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function cloneJson<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function validationError(
  code: LevelAnalysisJournalDeliveryValidationCode,
  field: string,
  message: string,
): LevelAnalysisJournalDeliveryValidationError {
  return { code, field, message };
}

function limitation(
  code: string,
  field: string,
  message: string,
): LevelAnalysisJournalDeliveryLimitation {
  return { code, field, message };
}

function mapSnapshotValidationError(
  error: LevelAnalysisAdapterValidationError,
): LevelAnalysisJournalDeliveryValidationError {
  return {
    code: error.code,
    field: error.field,
    message: error.message,
  };
}

function mapSnapshotLimitation(
  item: LevelAnalysisAdapterLimitation,
): LevelAnalysisJournalDeliveryLimitation {
  return {
    code: item.code,
    field: item.field,
    message: item.message,
  };
}

function requireField(
  payload: JsonRecord,
  field: string,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  if (!(field in payload)) {
    errors.push(
      validationError("missing_required_field", path, `Missing required field ${path}.`),
    );
  }
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === "string")
    : [];
}

function numberValue(value: unknown, fallback = 0): number {
  return isFiniteNumber(value) ? value : fallback;
}

function validateObjectField(
  payload: JsonRecord,
  field: string,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): JsonRecord | null {
  if (!(field in payload)) {
    errors.push(
      validationError("missing_required_field", path, `Missing required field ${path}.`),
    );
    return null;
  }

  if (!isRecord(payload[field])) {
    errors.push(
      validationError("invalid_field_shape", path, `${path} must be an object.`),
    );
    return null;
  }

  return payload[field] as JsonRecord;
}

function validateStringArrayField(
  payload: JsonRecord,
  field: string,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): string[] | null {
  if (!(field in payload)) {
    errors.push(
      validationError("missing_required_field", path, `Missing required field ${path}.`),
    );
    return null;
  }

  if (!isStringArray(payload[field])) {
    errors.push(
      validationError(
        "invalid_field_shape",
        path,
        `${path} must be an array of non-empty strings.`,
      ),
    );
    return null;
  }

  return payload[field] as string[];
}

function validateSafetyBooleans(
  safety: JsonRecord | null,
  path: string,
  expectedTrue: string[],
  expectedFalse: string[],
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  if (!safety) {
    errors.push(
      validationError("missing_safety_flags", path, `${path} safety flags are required.`),
    );
    return;
  }

  for (const field of expectedTrue) {
    if (safety[field] !== true) {
      errors.push(
        validationError(
          "unsafe_for_journal_delivery",
          `${path}.${field}`,
          `${path}.${field} must be true.`,
        ),
      );
    }
  }

  for (const field of expectedFalse) {
    if (safety[field] !== false) {
      errors.push(
        validationError(
          "unsafe_for_journal_delivery",
          `${path}.${field}`,
          `${path}.${field} must be false.`,
        ),
      );
    }
  }
}

function validateNoProhibitedHits(
  hits: unknown,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  if (!Array.isArray(hits)) {
    errors.push(
      validationError("invalid_field_shape", path, `${path} must be an array.`),
    );
    return;
  }

  if (hits.length > 0) {
    errors.push(
      validationError(
        "prohibited_language_hits",
        path,
        `${path} must be empty for journal ingestion.`,
      ),
    );
  }
}

function validateCacheFingerprint(
  value: unknown,
  path: string,
  expectedProvider: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): LevelAnalysisCacheFingerprint | null {
  if (!isRecord(value)) {
    errors.push(
      validationError("invalid_field_shape", path, `${path} must be an object.`),
    );
    return null;
  }

  for (const field of ["schemaVersion", "relativePath", "provider", "symbol", "timeframe", "sha256"]) {
    if (!isNonEmptyString(value[field])) {
      errors.push(
        validationError("invalid_field_shape", `${path}.${field}`, `${path}.${field} is required.`),
      );
    }
  }

  if (value.provider !== expectedProvider) {
    errors.push(
      validationError(
        "wrong_provider",
        `${path}.provider`,
        `${path}.provider must match the package provider.`,
      ),
    );
  }

  if (!isBoolean(value.includedInLevelEngine)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        `${path}.includedInLevelEngine`,
        `${path}.includedInLevelEngine must be boolean.`,
      ),
    );
  }

  if (!isBoolean(value.contextOnly)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        `${path}.contextOnly`,
        `${path}.contextOnly must be boolean.`,
      ),
    );
  }

  const safety = validateObjectField(value, "safety", `${path}.safety`, errors);
  validateSafetyBooleans(
    safety,
    `${path}.safety`,
    [],
    [
      "rawCandlesIncluded",
      "rawCacheWrapperPayloadsIncluded",
      "fullSnapshotsIncluded",
      "providerCallsMade",
      "cacheFilesWritten",
      "fifteenMinuteFedIntoLevelEngine",
    ],
    errors,
  );

  if (value.timeframe === "15m") {
    if (value.contextOnly !== true || value.includedInLevelEngine !== false) {
      errors.push(
        validationError(
          "cache_fingerprint_not_context_only",
          path,
          "15m cache fingerprints must be context-only and excluded from LevelEngine input.",
        ),
      );
    }
  }

  return value as unknown as LevelAnalysisCacheFingerprint;
}

function validateCacheFingerprintSet(
  payload: JsonRecord,
  provider: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): LevelAnalysisCacheFingerprintSet | null {
  const set = validateObjectField(payload, "cacheFingerprintSet", "cacheFingerprintSet", errors);
  if (!set) {
    return null;
  }

  if (!isNonEmptyString(set.schemaVersion)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "cacheFingerprintSet.schemaVersion",
        "cacheFingerprintSet.schemaVersion is required.",
      ),
    );
  }

  if (set.provider !== provider) {
    errors.push(
      validationError(
        "wrong_provider",
        "cacheFingerprintSet.provider",
        "cacheFingerprintSet.provider must match the package provider.",
      ),
    );
  }

  if (!Array.isArray(set.fingerprints) || set.fingerprints.length === 0) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "cacheFingerprintSet.fingerprints",
        "cacheFingerprintSet.fingerprints must be a non-empty array.",
      ),
    );
    return null;
  }

  const fingerprints = set.fingerprints
    .map((fingerprint, index) =>
      validateCacheFingerprint(
        fingerprint,
        `cacheFingerprintSet.fingerprints[${index}]`,
        provider,
        errors,
      ),
    )
    .filter((fingerprint): fingerprint is LevelAnalysisCacheFingerprint => Boolean(fingerprint));

  return {
    ...set,
    fingerprints,
  } as LevelAnalysisCacheFingerprintSet;
}

function validateCacheFingerprintSummary(
  payload: JsonRecord,
  fingerprints: LevelAnalysisCacheFingerprint[],
  errors: LevelAnalysisJournalDeliveryValidationError[],
): JsonRecord | null {
  const summary = validateObjectField(
    payload,
    "cacheFingerprintSummary",
    "cacheFingerprintSummary",
    errors,
  );

  if (!summary) {
    return null;
  }

  const totalFingerprints = numberValue(summary.totalFingerprints, fingerprints.length);
  if (totalFingerprints !== fingerprints.length) {
    errors.push(
      validationError(
        "invalid_field_shape",
        "cacheFingerprintSummary.totalFingerprints",
        "cacheFingerprintSummary.totalFingerprints must match cacheFingerprintSet.fingerprints length.",
      ),
    );
  }

  const fifteenMinuteFingerprints = fingerprints.filter((fingerprint) => fingerprint.timeframe === "15m");
  const fifteenMinuteContextOnlyCount = numberValue(
    summary.fifteenMinuteContextOnlyCount,
    fifteenMinuteFingerprints.length,
  );
  if (fifteenMinuteContextOnlyCount !== fifteenMinuteFingerprints.length) {
    errors.push(
      validationError(
        "cache_fingerprint_not_context_only",
        "cacheFingerprintSummary.fifteenMinuteContextOnlyCount",
        "All 15m fingerprints must be counted as context-only.",
      ),
    );
  }

  return summary;
}

function validateCandidateInventoryVisibility(
  entry: JsonRecord,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  const wrapper = validateObjectField(
    entry,
    "candidateInventoryVisibility",
    `${path}.candidateInventoryVisibility`,
    errors,
  );
  if (!wrapper) {
    return;
  }

  if (wrapper.present !== true) {
    errors.push(
      validationError(
        "candidate_inventory_invalid",
        `${path}.candidateInventoryVisibility.present`,
        "candidateInventoryVisibility.present must be true.",
      ),
    );
  }

  const visibility = validateObjectField(
    wrapper,
    "visibility",
    `${path}.candidateInventoryVisibility.visibility`,
    errors,
  );
  const gapSummary = validateObjectField(
    wrapper,
    "gapSummary",
    `${path}.candidateInventoryVisibility.gapSummary`,
    errors,
  );

  if (!visibility || !gapSummary) {
    return;
  }

  for (const field of ["gapClassification", "unsurfacedCloser", "safety"]) {
    if (!isRecord(visibility[field])) {
      errors.push(
        validationError(
          "candidate_inventory_invalid",
          `${path}.candidateInventoryVisibility.visibility.${field}`,
          `${field} is required for candidate inventory visibility.`,
        ),
      );
    }
  }

  if (!Array.isArray(visibility.diagnostics) || !Array.isArray(visibility.limitations)) {
    errors.push(
      validationError(
        "candidate_inventory_invalid",
        `${path}.candidateInventoryVisibility.visibility`,
        "candidate inventory visibility requires diagnostics and limitations arrays.",
      ),
    );
  }

  validateSafetyBooleans(
    isRecord(visibility.safety) ? visibility.safety : null,
    `${path}.candidateInventoryVisibility.visibility.safety`,
    ["readOnly", "auditOnly"],
    [
      "providerCallsMade",
      "cacheFilesWritten",
      "rawCandlesIncluded",
      "fullSnapshotsIncluded",
      "supportResistanceDetectionChanged",
      "levelEngineScoringRankingClusteringChanged",
      "surfacedLevelsChanged",
      "extensionGenerationChanged",
      "fifteenMinuteFedIntoLevelEngine",
    ],
    errors,
  );
}

function validateCandidateVolumeSessionContext(
  entry: JsonRecord,
  path: string,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  const context = validateObjectField(
    entry,
    "candidateVolumeSessionContext",
    `${path}.candidateVolumeSessionContext`,
    errors,
  );
  if (!context) {
    return;
  }

  if (
    !isNonEmptyString(context.schemaVersion) ||
    !context.schemaVersion.startsWith("level-candidate-volume-session-context/v1")
  ) {
    errors.push(
      validationError(
        "candidate_volume_session_invalid",
        `${path}.candidateVolumeSessionContext.schemaVersion`,
        "candidateVolumeSessionContext schemaVersion must be v1.",
      ),
    );
  }

  if (context.symbol !== entry.symbol) {
    errors.push(
      validationError(
        "candidate_volume_session_invalid",
        `${path}.candidateVolumeSessionContext.symbol`,
        "candidateVolumeSessionContext.symbol must match entry.symbol.",
      ),
    );
  }

  if (context.provider !== entry.provider) {
    errors.push(
      validationError(
        "candidate_volume_session_invalid",
        `${path}.candidateVolumeSessionContext.provider`,
        "candidateVolumeSessionContext.provider must match entry.provider.",
      ),
    );
  }

  if (!Array.isArray(context.contexts) || context.contexts.length === 0) {
    errors.push(
      validationError(
        "candidate_volume_session_invalid",
        `${path}.candidateVolumeSessionContext.contexts`,
        "candidateVolumeSessionContext.contexts must be a non-empty array.",
      ),
    );
  }

  if (!isRecord(context.comparisonSummary) || !Array.isArray(context.diagnostics)) {
    errors.push(
      validationError(
        "candidate_volume_session_invalid",
        `${path}.candidateVolumeSessionContext`,
        "candidateVolumeSessionContext requires comparisonSummary and diagnostics.",
      ),
    );
  }

  validateSafetyBooleans(
    isRecord(context.safety) ? context.safety : null,
    `${path}.candidateVolumeSessionContext.safety`,
    [
      "factsOnly",
      "noLevelSelectionChange",
      "noRankingChange",
      "noRuntimeBehaviorChange",
      "vwapFactsOnly",
      "shelvesAreFactsOnly",
    ],
    [
      "fifteenMinuteFedIntoLevelEngine",
      "volumeSessionFactsUsedForScoringOrSurfacedSelection",
      "supportResistanceDetectionChanged",
      "levelEngineScoringRankingClusteringChanged",
      "surfacedLevelsChanged",
      "extensionGenerationChanged",
      "providerCallsMade",
      "cacheFilesWritten",
      "rawCandlesIncluded",
      "fullSnapshotsIncluded",
    ],
    errors,
  );
}

function validatePackagedEntry(
  entry: unknown,
  index: number,
  packageProvider: string,
  reviewedSymbols: Set<string>,
  supplied15mSymbols: Set<string>,
  errors: LevelAnalysisJournalDeliveryValidationError[],
): void {
  const path = `entries[${index}]`;
  if (!isRecord(entry)) {
    errors.push(
      validationError("invalid_field_shape", path, `${path} must be an object.`),
    );
    return;
  }

  for (const field of REQUIRED_ENTRY_FIELDS) {
    requireField(entry, field, `${path}.${field}`, errors);
  }

  if (!isNonEmptyString(entry.symbol)) {
    errors.push(
      validationError("invalid_field_shape", `${path}.symbol`, "Entry symbol is required."),
    );
  } else if (!reviewedSymbols.has(entry.symbol)) {
    errors.push(
      validationError(
        "package_mismatch",
        `${path}.symbol`,
        "Entry symbol must be listed in reviewedSymbols.",
      ),
    );
  }

  if (entry.provider !== packageProvider) {
    errors.push(
      validationError(
        "wrong_provider",
        `${path}.provider`,
        "Entry provider must match package provider.",
      ),
    );
  }

  if (!isFiniteNumber(entry.asOfTimestamp)) {
    errors.push(
      validationError(
        "invalid_field_shape",
        `${path}.asOfTimestamp`,
        "Entry asOfTimestamp must be a finite timestamp.",
      ),
    );
  }

  if (!isNonEmptyString(entry.asOfIso) || Number.isNaN(Date.parse(entry.asOfIso))) {
    errors.push(
      validationError("invalid_field_shape", `${path}.asOfIso`, "Entry asOfIso must be ISO-like."),
    );
  }

  for (const field of ["referencePrice", "previousClose"]) {
    if (!isFiniteNumber(entry[field])) {
      errors.push(
        validationError(
          "invalid_field_shape",
          `${path}.${field}`,
          `${path}.${field} must be a finite number.`,
        ),
      );
    }
  }

  for (const field of [
    "sourceFiles",
    "nearestLevels",
    "bucketCounts",
    "extensionCoverage",
    "syntheticContinuationMap",
    "qualityAudit",
    "diagnosticSemantics",
    "fifteenMinuteContext",
    "parity",
    "safety",
  ]) {
    if (!isRecord(entry[field])) {
      errors.push(
        validationError("invalid_field_shape", `${path}.${field}`, `${path}.${field} must be an object.`),
      );
    }
  }

  if (isRecord(entry.bucketCounts)) {
    for (const key of LEVEL_BUCKET_KEYS) {
      if (!isFiniteNumber(entry.bucketCounts[key])) {
        errors.push(
          validationError(
            "invalid_field_shape",
            `${path}.bucketCounts.${key}`,
            `${path}.bucketCounts.${key} must be a finite number.`,
          ),
        );
      }
    }
  }

  if (!Array.isArray(entry.mismatches)) {
    errors.push(
      validationError("invalid_field_shape", `${path}.mismatches`, "mismatches must be an array."),
    );
  } else if (entry.mismatches.length > 0) {
    errors.push(
      validationError(
        "package_mismatch",
        `${path}.mismatches`,
        "Per-entry mismatches must be empty.",
      ),
    );
  }

  if (isRecord(entry.parity)) {
    for (const field of REQUIRED_PARITY_FIELDS) {
      if (entry.parity[field] !== true) {
        errors.push(
          validationError(
            "package_mismatch",
            `${path}.parity.${field}`,
            `${path}.parity.${field} must be true.`,
          ),
        );
      }
    }
  }

  if (isRecord(entry.fifteenMinuteContext)) {
    if (entry.fifteenMinuteContext.stillContextOnly !== true) {
      errors.push(
        validationError(
          "fifteen_minute_not_context_only",
          `${path}.fifteenMinuteContext.stillContextOnly`,
          "15m context must remain context-only for journal ingestion.",
        ),
      );
    }

    if (supplied15mSymbols.has(String(entry.symbol)) && entry.fifteenMinuteContext.inputProvided !== true) {
      errors.push(
        validationError(
          "fifteen_minute_not_context_only",
          `${path}.fifteenMinuteContext.inputProvided`,
          "Symbols listed in supplied15mSymbols must have 15m context marked as provided.",
        ),
      );
    }
  }

  if (isRecord(entry.qualityAudit)) {
    const densityMetric = entry.qualityAudit.densityMetric;
    if (!isRecord(densityMetric) || densityMetric.present !== true) {
      errors.push(
        validationError(
          "invalid_field_shape",
          `${path}.qualityAudit.densityMetric`,
          "qualityAudit.densityMetric must be present and marked present.",
        ),
      );
    }
  }

  if (isRecord(entry.diagnosticSemantics)) {
    if (entry.diagnosticSemantics.allFactualOnly !== true) {
      errors.push(
        validationError(
          "unsafe_for_journal_delivery",
          `${path}.diagnosticSemantics.allFactualOnly`,
          "diagnosticSemantics must be factual-only.",
        ),
      );
    }
    validateNoProhibitedHits(
      entry.diagnosticSemantics.prohibitedLanguageHits,
      `${path}.diagnosticSemantics.prohibitedLanguageHits`,
      errors,
    );
  }

  validateSafetyBooleans(
    isRecord(entry.safety) ? entry.safety : null,
    `${path}.safety`,
    [
      "noLookaheadApplied",
      "levelOutputUnchanged",
      "noRuntimeBehaviorChange",
      "syntheticExtensionsClearlyMarked",
    ],
    [],
    errors,
  );

  validateCandidateInventoryVisibility(entry, path, errors);
  validateCandidateVolumeSessionContext(entry, path, errors);
}

function validatePackagedReviewDelivery(
  payload: JsonRecord,
  options: LevelAnalysisJournalDeliveryOptions,
): LevelAnalysisJournalDeliveryIngestionResult {
  const errors: LevelAnalysisJournalDeliveryValidationError[] = [];
  const allowedProviders = options.allowedPackagedProviders ?? DEFAULT_ALLOWED_PACKAGED_PROVIDERS;

  for (const field of REQUIRED_PACKAGED_FIELDS) {
    requireField(payload, field, field, errors);
  }

  if (
    !isNonEmptyString(payload.schemaVersion) ||
    !payload.schemaVersion.startsWith(PACKAGED_REVIEW_SCHEMA_PREFIX)
  ) {
    errors.push(
      validationError(
        "unsupported_schema_or_package_shape",
        "schemaVersion",
        "Packaged review delivery schema must be level-quality-review-process/v1.",
      ),
    );
  }

  if (!isNonEmptyString(payload.generatedAt)) {
    errors.push(
      validationError("invalid_field_shape", "generatedAt", "generatedAt is required."),
    );
  }

  if (!isNonEmptyString(payload.provider) || !allowedProviders.includes(payload.provider)) {
    errors.push(
      validationError(
        "wrong_provider",
        "provider",
        `Provider must be one of: ${allowedProviders.join(", ")}.`,
      ),
    );
  }

  const provider = isNonEmptyString(payload.provider) ? payload.provider : "";
  const reviewedSymbols = validateStringArrayField(
    payload,
    "reviewedSymbols",
    "reviewedSymbols",
    errors,
  );
  const supplied15mSymbols = validateStringArrayField(
    payload,
    "supplied15mSymbols",
    "supplied15mSymbols",
    errors,
  );
  const summary = validateObjectField(payload, "summary", "summary", errors);
  const fingerprintSet = validateCacheFingerprintSet(payload, provider, errors);
  if (fingerprintSet) {
    validateCacheFingerprintSummary(payload, fingerprintSet.fingerprints, errors);
  } else {
    validateObjectField(payload, "cacheFingerprintSummary", "cacheFingerprintSummary", errors);
  }

  validateNoProhibitedHits(payload.prohibitedLanguageHits, "prohibitedLanguageHits", errors);

  validateSafetyBooleans(
    isRecord(payload.safety) ? payload.safety : null,
    "safety",
    ["readOnlyCacheReview"],
    [
      "rawCandlesWritten",
      "fullSnapshotsWritten",
      "cacheFilesWritten",
      "providerCallsMade",
      "supportResistanceDetectionChanged",
      "levelEngineScoringRankingClusteringChanged",
      "surfacedLevelsChanged",
      "extensionGenerationChanged",
      "fifteenMinuteFedIntoLevelEngine",
    ],
    errors,
  );

  if (summary) {
    if (summary.mismatchCount !== 0) {
      errors.push(
        validationError(
          "nonzero_mismatch_count",
          "summary.mismatchCount",
          "Packaged review delivery requires summary.mismatchCount to be 0.",
        ),
      );
    }

    if (summary.prohibitedLanguageHitCount !== 0) {
      errors.push(
        validationError(
          "prohibited_language_hits",
          "summary.prohibitedLanguageHitCount",
          "Packaged review delivery requires prohibitedLanguageHitCount to be 0.",
        ),
      );
    }

    if (
      fingerprintSet &&
      isFiniteNumber(summary.cacheFingerprintCount) &&
      summary.cacheFingerprintCount !== fingerprintSet.fingerprints.length
    ) {
      errors.push(
        validationError(
          "invalid_field_shape",
          "summary.cacheFingerprintCount",
          "summary.cacheFingerprintCount must match cacheFingerprintSet.fingerprints length.",
        ),
      );
    }
  }

  if (!Array.isArray(payload.entries) || payload.entries.length === 0) {
    errors.push(
      validationError(
        "missing_entries",
        "entries",
        "Packaged review delivery requires a non-empty entries array.",
      ),
    );
  } else if (reviewedSymbols && supplied15mSymbols) {
    const reviewedSet = new Set(reviewedSymbols);
    const supplied15mSet = new Set(supplied15mSymbols);
    const entrySymbols = new Set<string>();
    payload.entries.forEach((entry, index) => {
      if (isRecord(entry) && isNonEmptyString(entry.symbol)) {
        entrySymbols.add(entry.symbol);
      }
      validatePackagedEntry(
        entry,
        index,
        provider,
        reviewedSet,
        supplied15mSet,
        errors,
      );
    });

    for (const symbol of reviewedSymbols) {
      if (!entrySymbols.has(symbol)) {
        errors.push(
          validationError(
            "package_mismatch",
            "entries",
            `Missing entry for reviewed symbol ${symbol}.`,
          ),
        );
      }
    }
  }

  if (errors.length > 0) {
    return {
      status: "quarantined",
      sourceKind: "packaged_review_delivery",
      sourcePayload: payload,
      views: [],
      limitations: [],
      errors,
    };
  }

  const packagePayload = payload as unknown as LevelAnalysisPackagedReviewDeliveryPackage;
  const packageMetadata = derivePackageMetadata(packagePayload);
  const views = packagePayload.entries.map((entry) =>
    derivePackagedReviewChartContextView(packagePayload, entry, packageMetadata),
  );
  const limitations = views.flatMap((view) => view.limitations);

  return {
    status: "accepted",
    sourceKind: "packaged_review_delivery",
    sourcePayload: packagePayload,
    views,
    packageMetadata,
    limitations,
    errors: [],
  };
}

function getLevelBucket(
  output: LevelAnalysisLevelEngineOutput,
  key:
    | "majorSupport"
    | "majorResistance"
    | "intermediateSupport"
    | "intermediateResistance"
    | "intradaySupport"
    | "intradayResistance",
): unknown[] {
  return Array.isArray(output[key]) ? output[key] : [];
}

function deriveSnapshotProvider(snapshot: LevelAnalysisSnapshotV1): string | undefined {
  const metadata = snapshot.levelEngineOutput.metadata;
  const providerByTimeframe = isRecord(metadata?.providerByTimeframe)
    ? metadata.providerByTimeframe
    : null;

  if (!providerByTimeframe) {
    return snapshot.producer;
  }

  const providers = Array.from(
    new Set(
      Object.values(providerByTimeframe).filter((provider): provider is string =>
        typeof provider === "string",
      ),
    ),
  );

  if (providers.length === 1) {
    return providers[0];
  }

  return providers.length > 1 ? "mixed" : snapshot.producer;
}

function deriveSnapshotFifteenMinuteContext(snapshot: LevelAnalysisSnapshotV1): {
  inputProvided: boolean;
  stillContextOnly: null;
  status: "not_supplied" | "not_declared_by_single_snapshot_v1";
  filteredCandleCount?: number;
} {
  const fifteenMinute = snapshot.inputSummary.timeframes["15m"];
  return {
    inputProvided: fifteenMinute.provided,
    stillContextOnly: null,
    status: fifteenMinute.provided ? "not_declared_by_single_snapshot_v1" : "not_supplied",
    filteredCandleCount: fifteenMinute.filteredCandleCount,
  };
}

function deriveSnapshotQualityDiagnostics(snapshot: LevelAnalysisSnapshotV1): string[] {
  const diagnostics = snapshot.levelQualityAudit.diagnostics;
  return stringArray(diagnostics);
}

function deriveJournalChartContextViewFromSnapshot(
  snapshot: LevelAnalysisSnapshotV1,
  limitations: LevelAnalysisJournalDeliveryLimitation[],
): LevelAnalysisJournalChartContextView {
  const extensionSupport = snapshot.levelEngineOutput.extensionLevels.support.length;
  const extensionResistance = snapshot.levelEngineOutput.extensionLevels.resistance.length;
  const syntheticLevels = findSyntheticContinuationMapLevels(snapshot);
  const qualityAudit = snapshot.levelQualityAudit;
  const bucketCounts = {
    majorSupport: getLevelBucket(snapshot.levelEngineOutput, "majorSupport").length,
    majorResistance: getLevelBucket(snapshot.levelEngineOutput, "majorResistance").length,
    intermediateSupport: getLevelBucket(snapshot.levelEngineOutput, "intermediateSupport").length,
    intermediateResistance: getLevelBucket(snapshot.levelEngineOutput, "intermediateResistance").length,
    intradaySupport: getLevelBucket(snapshot.levelEngineOutput, "intradaySupport").length,
    intradayResistance: getLevelBucket(snapshot.levelEngineOutput, "intradayResistance").length,
    extensionSupport,
    extensionResistance,
    total:
      getLevelBucket(snapshot.levelEngineOutput, "majorSupport").length +
      getLevelBucket(snapshot.levelEngineOutput, "majorResistance").length +
      getLevelBucket(snapshot.levelEngineOutput, "intermediateSupport").length +
      getLevelBucket(snapshot.levelEngineOutput, "intermediateResistance").length +
      getLevelBucket(snapshot.levelEngineOutput, "intradaySupport").length +
      getLevelBucket(snapshot.levelEngineOutput, "intradayResistance").length +
      extensionSupport +
      extensionResistance,
  };

  return {
    sourceKind: "single_snapshot_v1",
    source: {
      schemaVersion: snapshot.schemaVersion,
      producer: "levels-system",
    },
    identity: {
      symbol: snapshot.symbol,
      asOfTimestamp: snapshot.asOfTimestamp,
      asOfIso: new Date(snapshot.asOfTimestamp).toISOString(),
      provider: deriveSnapshotProvider(snapshot),
      referencePrice: snapshot.referencePrice,
    },
    nearestLevels: {
      support: cloneJson(snapshot.nearestSupport),
      resistance: cloneJson(snapshot.nearestResistance),
    },
    bucketCounts,
    extensionCoverage: cloneJson(qualityAudit.extensionCoverage),
    syntheticContinuationMap: {
      count: syntheticLevels.length,
      supportCount: syntheticLevels.filter((level) => level.kind === "support").length,
      resistanceCount: syntheticLevels.filter((level) => level.kind === "resistance").length,
      levels: cloneJson(syntheticLevels),
    },
    qualityDiagnostics: {
      diagnostics: deriveSnapshotQualityDiagnostics(snapshot),
      diagnosticSemantics: cloneJson(qualityAudit.diagnosticSemantics),
      densityMetric: cloneJson(qualityAudit.densityMetric),
    },
    volumeSessionContext: {
      present: Boolean(snapshot.sessionFacts || snapshot.volumeFacts || snapshot.volumeShelves),
      diagnostics: [
        ...stringArray(isRecord(snapshot.sessionFacts) ? snapshot.sessionFacts.diagnostics : []),
        ...stringArray(isRecord(snapshot.volumeFacts) ? snapshot.volumeFacts.diagnostics : []),
      ],
      factSummary: {
        hasSessionFacts: Boolean(snapshot.sessionFacts),
        hasVolumeFacts: Boolean(snapshot.volumeFacts),
        volumeShelfCount: Array.isArray(snapshot.volumeShelves) ? snapshot.volumeShelves.length : 0,
      },
    },
    fifteenMinuteContext: deriveSnapshotFifteenMinuteContext(snapshot),
    limitations,
    safetyFlags: cloneJson(snapshot.safety),
  };
}

function derivePackageMetadata(
  payload: LevelAnalysisPackagedReviewDeliveryPackage,
): LevelAnalysisJournalPackageMetadata {
  return {
    schemaVersion: payload.schemaVersion,
    generatedAt: payload.generatedAt,
    provider: payload.provider,
    reviewedSymbols: [...payload.reviewedSymbols],
    supplied15mSymbols: [...payload.supplied15mSymbols],
    summary: cloneJson(payload.summary),
    cacheFingerprintSummary: cloneJson(payload.cacheFingerprintSummary),
  };
}

function cacheFingerprintCounts(summary: JsonRecord): {
  totalFingerprints: number;
  levelEngineInputCount: number;
  contextOnlyCount: number;
  fifteenMinuteContextOnlyCount: number;
  validationIssueCount: number;
} {
  return {
    totalFingerprints: numberValue(summary.totalFingerprints ?? summary.cacheFingerprintCount),
    levelEngineInputCount: numberValue(summary.levelEngineInputCount ?? summary.cacheFingerprintLevelEngineInputCount),
    contextOnlyCount: numberValue(summary.contextOnlyCount ?? summary.cacheFingerprintContextOnlyCount),
    fifteenMinuteContextOnlyCount: numberValue(
      summary.fifteenMinuteContextOnlyCount ?? summary.cacheFingerprintFifteenMinuteContextOnlyCount,
    ),
    validationIssueCount: numberValue(summary.validationIssueCount ?? summary.cacheFingerprintValidationIssueCount),
  };
}

function derivePackageLimitations(
  payload: LevelAnalysisPackagedReviewDeliveryPackage,
  entry: LevelAnalysisPackagedReviewEntry,
): LevelAnalysisJournalDeliveryLimitation[] {
  const limitations: LevelAnalysisJournalDeliveryLimitation[] = [];
  const extensionWarnings = stringArray(entry.extensionCoverage.warnings);
  const candidateVisibility = isRecord(entry.candidateInventoryVisibility.visibility)
    ? entry.candidateInventoryVisibility.visibility
    : {};
  const candidateLimitations = stringArray(candidateVisibility.limitations);
  const volumeSummary = isRecord(entry.candidateVolumeSessionContext.comparisonSummary)
    ? entry.candidateVolumeSessionContext.comparisonSummary
    : {};

  for (const warning of extensionWarnings) {
    limitations.push(
      limitation(
        "extension_coverage_warning",
        `${entry.symbol}.extensionCoverage.warnings`,
        warning,
      ),
    );
  }

  for (const candidateLimitation of candidateLimitations) {
    limitations.push(
      limitation(
        "candidate_inventory_limitation",
        `${entry.symbol}.candidateInventoryVisibility.visibility.limitations`,
        candidateLimitation,
      ),
    );
  }

  if (volumeSummary.outcome === "candidate_identifier_unavailable") {
    limitations.push(
      limitation(
        "candidate_identifier_unavailable",
        `${entry.symbol}.candidateVolumeSessionContext.comparisonSummary.outcome`,
        "Candidate identifiers are unavailable for at least one compared row.",
      ),
    );
  }

  if (numberValue(payload.cacheFingerprintSummary.validationIssueCount) > 0) {
    limitations.push(
      limitation(
        "cache_fingerprint_validation_issues",
        "cacheFingerprintSummary.validationIssueCount",
        "Cache fingerprint validation issues are source-integrity facts, not generation changes.",
      ),
    );
  }

  return limitations;
}

function derivePackagedReviewChartContextView(
  payload: LevelAnalysisPackagedReviewDeliveryPackage,
  entry: LevelAnalysisPackagedReviewEntry,
  packageMetadata: LevelAnalysisJournalPackageMetadata,
): LevelAnalysisJournalChartContextView {
  const candidateVisibility = isRecord(entry.candidateInventoryVisibility.visibility)
    ? entry.candidateInventoryVisibility.visibility
    : {};
  const candidateVolumeSessionContext = entry.candidateVolumeSessionContext;
  const fingerprintSummary = payload.cacheFingerprintSummary;
  const fifteenMinuteFingerprints = payload.cacheFingerprintSet.fingerprints.filter(
    (fingerprint) => fingerprint.timeframe === "15m",
  );
  const limitations = derivePackageLimitations(payload, entry);

  return {
    sourceKind: "packaged_review_delivery",
    packageMetadata,
    source: {
      schemaVersion: payload.schemaVersion,
      producer: "levels-system",
      sourceArtifact: typeof payload.baselinePath === "string" ? payload.baselinePath : undefined,
    },
    identity: {
      symbol: entry.symbol,
      asOfTimestamp: entry.asOfTimestamp,
      asOfIso: entry.asOfIso,
      provider: entry.provider,
      referencePrice: entry.referencePrice,
      previousClose: entry.previousClose,
    },
    nearestLevels: {
      support: cloneJson(entry.nearestLevels.support),
      resistance: cloneJson(entry.nearestLevels.resistance),
    },
    bucketCounts: { ...entry.bucketCounts },
    extensionCoverage: cloneJson(entry.extensionCoverage),
    syntheticContinuationMap: {
      count: numberValue(entry.syntheticContinuationMap.count),
      clearlyMarkedCount: numberValue(entry.syntheticContinuationMap.clearlyMarkedCount),
      entries: cloneJson(
        Array.isArray(entry.syntheticContinuationMap.entries)
          ? entry.syntheticContinuationMap.entries
          : [],
      ),
    },
    qualityDiagnostics: {
      diagnostics: stringArray(entry.qualityAudit.diagnostics),
      diagnosticSemantics: cloneJson(entry.diagnosticSemantics),
      densityMetric: cloneJson(entry.qualityAudit.densityMetric),
    },
    candidateInventory: {
      present: entry.candidateInventoryVisibility.present === true,
      gapSummary: cloneJson(entry.candidateInventoryVisibility.gapSummary),
      unsurfacedCloser: cloneJson(candidateVisibility.unsurfacedCloser),
      diagnostics: stringArray(candidateVisibility.diagnostics),
      limitations: stringArray(candidateVisibility.limitations),
    },
    volumeSessionContext: {
      present: true,
      contextCount: Array.isArray(candidateVolumeSessionContext.contexts)
        ? candidateVolumeSessionContext.contexts.length
        : 0,
      comparisonSummary: cloneJson(candidateVolumeSessionContext.comparisonSummary),
      diagnostics: stringArray(candidateVolumeSessionContext.diagnostics),
      safety: cloneJson(candidateVolumeSessionContext.safety),
    },
    sourceFiles: cloneJson(entry.sourceFiles),
    sourceIntegrity: {
      cacheFingerprintSummary: cloneJson(fingerprintSummary),
      cacheFingerprintCounts: cacheFingerprintCounts(fingerprintSummary),
      fifteenMinuteCacheFingerprintsContextOnly: fifteenMinuteFingerprints.every(
        (fingerprint) =>
          fingerprint.contextOnly === true && fingerprint.includedInLevelEngine === false,
      ),
      mismatchCount: numberValue(payload.summary.mismatchCount),
      prohibitedLanguageHitCount: numberValue(payload.summary.prohibitedLanguageHitCount),
    },
    fifteenMinuteContext: {
      inputProvided: entry.fifteenMinuteContext.inputProvided === true,
      stillContextOnly: entry.fifteenMinuteContext.stillContextOnly === true,
      status: entry.fifteenMinuteContext.stillContextOnly === true ? "context_only" : "not_supplied",
      filteredCandleCount: numberValue(entry.fifteenMinuteContext.filteredCandleCount),
    },
    parity: cloneJson(entry.parity),
    mismatches: cloneJson(entry.mismatches),
    limitations,
    safetyFlags: cloneJson(entry.safety),
  };
}

function validateSnapshotPayload(
  payload: unknown,
): LevelAnalysisJournalDeliveryIngestionResult {
  const snapshotResult = validateLevelAnalysisSnapshotV1(payload, {
    requireReplaySafe: true,
  });

  if (snapshotResult.status === "quarantined") {
    return {
      status: "quarantined",
      sourceKind: "single_snapshot_v1",
      sourcePayload: snapshotResult.sourceSnapshot,
      views: [],
      limitations: [],
      errors: snapshotResult.errors.map(mapSnapshotValidationError),
    };
  }

  const limitations = snapshotResult.limitations.map(mapSnapshotLimitation);

  return {
    status: "accepted",
    sourceKind: "single_snapshot_v1",
    sourcePayload: snapshotResult.sourceSnapshot,
    views: [deriveJournalChartContextViewFromSnapshot(snapshotResult.snapshot, limitations)],
    limitations,
    errors: [],
  };
}

export function parseLevelAnalysisJournalPayloadJson(rawJson: string): unknown {
  return JSON.parse(rawJson);
}

export function validateLevelAnalysisJournalPayload(
  payload: unknown,
  options: LevelAnalysisJournalDeliveryOptions = {},
): LevelAnalysisJournalDeliveryIngestionResult {
  if (!isRecord(payload)) {
    return {
      status: "quarantined",
      sourcePayload: payload,
      views: [],
      limitations: [],
      errors: [
        validationError(
          "payload_not_object",
          "$",
          "Level-analysis journal payload must be an object.",
        ),
      ],
    };
  }

  if (
    isNonEmptyString(payload.schemaVersion) &&
    payload.schemaVersion.startsWith(SNAPSHOT_V1_SCHEMA_PREFIX)
  ) {
    return validateSnapshotPayload(payload);
  }

  if (
    isNonEmptyString(payload.schemaVersion) &&
    payload.schemaVersion.startsWith(PACKAGED_REVIEW_SCHEMA_PREFIX)
  ) {
    return validatePackagedReviewDelivery(payload, options);
  }

  return {
    status: "quarantined",
    sourcePayload: payload,
    views: [],
    limitations: [],
    errors: [
      validationError(
        "unsupported_schema_or_package_shape",
        "schemaVersion",
        "Expected a LevelAnalysisSnapshot v1 payload or packaged level-quality review delivery.",
      ),
    ],
  };
}

export function loadLevelAnalysisJournalPayloadForJournal(
  rawJson: string,
  options: LevelAnalysisJournalDeliveryOptions = {},
): LevelAnalysisJournalDeliveryIngestionResult {
  try {
    return validateLevelAnalysisJournalPayload(
      parseLevelAnalysisJournalPayloadJson(rawJson),
      options,
    );
  } catch (error) {
    return {
      status: "quarantined",
      views: [],
      limitations: [],
      errors: [
        validationError(
          "invalid_json",
          "$",
          error instanceof Error ? error.message : "Invalid level-analysis journal JSON.",
        ),
      ],
    };
  }
}
