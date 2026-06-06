import { createHash } from "node:crypto";
import type {
  LevelAnalysisJournalChartContextView,
  LevelAnalysisJournalDeliveryIngestionResult,
  LevelAnalysisJournalDeliveryLimitation,
  LevelAnalysisJournalDeliveryValidationError,
  LevelAnalysisJournalSourceKind,
} from "./level-analysis-journal-delivery-adapter";

export const JOURNAL_LEVEL_ANALYSIS_DELIVERY_PERSISTENCE_CONTRACT_VERSION =
  "journal_level_analysis_delivery_persistence_contract_v1" as const;

export const LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION =
  "level_analysis_delivery_validate_api_v1" as const;

export const LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION =
  "level_analysis_delivery_ingest_api_v1" as const;

export const LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION =
  "level_analysis_delivery_latest_api_v1" as const;

export const LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION =
  "level_analysis_delivery_symbol_latest_api_v1" as const;

export const LEVEL_ANALYSIS_DELIVERY_RAW_ADMIN_API_CONTRACT_VERSION =
  "level_analysis_delivery_raw_admin_api_v1" as const;

export type JournalLevelAnalysisDeliveryValidationStatus =
  | "accepted"
  | "quarantined";

export type JournalLevelAnalysisProhibitedLanguageStatus =
  | "clear"
  | "hits_present"
  | "unknown";

export type JournalLevelAnalysisFifteenMinuteContextOnlyStatus =
  | "context_only"
  | "not_supplied"
  | "not_declared_by_single_snapshot_v1";

export interface JournalLevelAnalysisDeliveryContractIssue {
  code: string;
  field: string;
  message: string;
}

export interface JournalLevelAnalysisDeliveryAuditEntry {
  event: "created" | "validated" | "quarantined" | "duplicate_detected";
  at: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export interface JournalLevelAnalysisSyntheticContinuationSummary {
  count: number;
  supportCount?: number;
  resistanceCount?: number;
  clearlyMarkedCount?: number;
}

export interface JournalLevelAnalysisExtensionCounts {
  support: number;
  resistance: number;
  total: number;
}

export interface JournalLevelAnalysisCacheFingerprintCounts {
  totalFingerprints: number;
  levelEngineInputCount: number;
  contextOnlyCount: number;
  fifteenMinuteContextOnlyCount: number;
  validationIssueCount: number;
}

export interface JournalLevelAnalysisDeliveryCompactSummary {
  sourceKind: LevelAnalysisJournalSourceKind;
  provider?: string;
  generatedAt?: string;
  symbolCount: number;
  cacheFingerprintSummary?: unknown;
  cacheFingerprintCounts?: JournalLevelAnalysisCacheFingerprintCounts;
  mismatchCount: number | null;
  prohibitedLanguageHitCount: number | null;
  allFifteenMinuteContextOnly: boolean | null;
  limitationCount: number;
  safetySummary: unknown;
}

export interface JournalLevelAnalysisDeliverySymbolSummary {
  deliveryId: string;
  symbol: string;
  provider?: string;
  asOfTimestamp: number;
  asOfIso?: string;
  referencePrice: number;
  previousClose?: number;
  nearestSupport: unknown;
  nearestResistance: unknown;
  bucketCounts: Record<string, number>;
  extensionCounts: JournalLevelAnalysisExtensionCounts;
  extensionCoverage?: unknown;
  syntheticContinuationMapSummary: JournalLevelAnalysisSyntheticContinuationSummary;
  diagnostics: string[];
  diagnosticSemantics?: unknown;
  densityMetricSummary?: unknown;
  candidateInventoryGapSummary?: unknown;
  volumeSessionContextSummary?: unknown;
  sourceFiles?: Record<string, unknown>;
  cacheFingerprintSourceIntegrity?: unknown;
  fifteenMinuteContextOnlyStatus: JournalLevelAnalysisFifteenMinuteContextOnlyStatus;
  missingFacts: string[];
  limitations: LevelAnalysisJournalDeliveryLimitation[];
  safetyFlags: unknown;
}

export interface JournalLevelAnalysisDeliveryRecordBase {
  contractVersion: typeof JOURNAL_LEVEL_ANALYSIS_DELIVERY_PERSISTENCE_CONTRACT_VERSION;
  id: string;
  rawPayloadHash: string;
  sourceSystem: "levels-system";
  sourceKind: LevelAnalysisJournalSourceKind;
  sourceSchemaVersion: string;
  sourceArtifactPath?: string;
  sourceArtifactCommit?: string;
  sourceCommit?: string;
  provider?: string;
  generatedAt?: string;
  createdAt: string;
  reviewedSymbols: string[];
  baselineMismatchCount: number | null;
  validationStatus: JournalLevelAnalysisDeliveryValidationStatus;
  prohibitedLanguageStatus: JournalLevelAnalysisProhibitedLanguageStatus;
  rawPayload: unknown;
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary | null;
  perSymbolSummary: JournalLevelAnalysisDeliverySymbolSummary[];
  safetyFlags: unknown;
  limitations: LevelAnalysisJournalDeliveryLimitation[];
  quarantineReasons: LevelAnalysisJournalDeliveryValidationError[];
  auditTrail: JournalLevelAnalysisDeliveryAuditEntry[];
}

export interface AcceptedJournalLevelAnalysisDeliveryRecord
  extends JournalLevelAnalysisDeliveryRecordBase {
  validationStatus: "accepted";
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary;
  perSymbolSummary: JournalLevelAnalysisDeliverySymbolSummary[];
  quarantineReasons: [];
}

export interface QuarantinedJournalLevelAnalysisDeliveryRecord
  extends JournalLevelAnalysisDeliveryRecordBase {
  validationStatus: "quarantined";
  compactSummary: null;
  perSymbolSummary: [];
  quarantineReasons: LevelAnalysisJournalDeliveryValidationError[];
}

export type JournalLevelAnalysisDeliveryRecord =
  | AcceptedJournalLevelAnalysisDeliveryRecord
  | QuarantinedJournalLevelAnalysisDeliveryRecord;

export type JournalLevelAnalysisDeliveryRecordValidationResult =
  | {
      status: "valid";
      record: JournalLevelAnalysisDeliveryRecord;
      issues: [];
    }
  | {
      status: "invalid";
      issues: JournalLevelAnalysisDeliveryContractIssue[];
    };

export type JournalLevelAnalysisDeliverySymbolValidationResult =
  | {
      status: "valid";
      summary: JournalLevelAnalysisDeliverySymbolSummary;
      issues: [];
    }
  | {
      status: "invalid";
      issues: JournalLevelAnalysisDeliveryContractIssue[];
    };

export interface JournalLevelAnalysisDeliveryValidateSuccessResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION;
  status: "accepted";
  sourceKind: LevelAnalysisJournalSourceKind;
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary;
  perSymbolSummary: JournalLevelAnalysisDeliverySymbolSummary[];
}

export interface JournalLevelAnalysisDeliveryValidateQuarantineResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION;
  status: "quarantined";
  sourceKind?: LevelAnalysisJournalSourceKind;
  errors: LevelAnalysisJournalDeliveryValidationError[];
}

export type JournalLevelAnalysisDeliveryValidateApiResponse =
  | JournalLevelAnalysisDeliveryValidateSuccessResponse
  | JournalLevelAnalysisDeliveryValidateQuarantineResponse;

export interface JournalLevelAnalysisDeliveryIngestSuccessResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION;
  status: "accepted";
  deliveryId: string;
  duplicate: boolean;
  rawPayloadHash: string;
  compactSummary: JournalLevelAnalysisDeliveryCompactSummary;
  perSymbolSummary: JournalLevelAnalysisDeliverySymbolSummary[];
}

export interface JournalLevelAnalysisDeliveryIngestQuarantineResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION;
  status: "quarantined";
  deliveryId: string;
  rawPayloadHash: string;
  errors: LevelAnalysisJournalDeliveryValidationError[];
}

export type JournalLevelAnalysisDeliveryIngestApiResponse =
  | JournalLevelAnalysisDeliveryIngestSuccessResponse
  | JournalLevelAnalysisDeliveryIngestQuarantineResponse;

export interface JournalLevelAnalysisDeliveryLatestApiResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION;
  status: "found" | "not_found";
  deliveryId?: string;
  sourceKind?: LevelAnalysisJournalSourceKind;
  compactSummary?: JournalLevelAnalysisDeliveryCompactSummary;
  symbols?: string[];
}

export interface JournalLevelAnalysisDeliverySymbolLatestApiResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION;
  status: "found" | "not_found";
  deliveryId?: string;
  symbol?: string;
  summary?: JournalLevelAnalysisDeliverySymbolSummary;
}

export interface JournalLevelAnalysisDeliveryRawAdminApiResponse {
  contractVersion: typeof LEVEL_ANALYSIS_DELIVERY_RAW_ADMIN_API_CONTRACT_VERSION;
  status: "found" | "not_found";
  deliveryId?: string;
  rawPayloadHash?: string;
  sourceKind?: LevelAnalysisJournalSourceKind;
  validationStatus?: JournalLevelAnalysisDeliveryValidationStatus;
  rawPayload?: unknown;
}

export interface CreateJournalLevelAnalysisDeliveryRecordInput {
  id: string;
  createdAt: string;
  ingestionResult: LevelAnalysisJournalDeliveryIngestionResult;
  sourceArtifactCommit?: string;
  sourceCommit?: string;
  sourceArtifactPath?: string;
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableJson(item)).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson((value as JsonRecord)[key])}`)
    .join(",")}}`;
}

function readStringPath(value: unknown, path: string[]): string | undefined {
  let cursor = value;

  for (const segment of path) {
    if (!isRecord(cursor) || !(segment in cursor)) {
      return undefined;
    }

    cursor = cursor[segment];
  }

  return typeof cursor === "string" ? cursor : undefined;
}

function readNumber(value: unknown): number | null {
  return isFiniteNumber(value) ? value : null;
}

function readNumberPath(value: unknown, path: string[]): number | null {
  let cursor = value;

  for (const segment of path) {
    if (!isRecord(cursor) || !(segment in cursor)) {
      return null;
    }

    cursor = cursor[segment];
  }

  return readNumber(cursor);
}

function cloneJson<T>(value: T): T {
  if (value === null || value === undefined) {
    return value;
  }

  return JSON.parse(JSON.stringify(value)) as T;
}

function contractIssue(
  code: string,
  field: string,
  message: string,
): JournalLevelAnalysisDeliveryContractIssue {
  return { code, field, message };
}

function extensionCountsFromView(
  view: LevelAnalysisJournalChartContextView,
): JournalLevelAnalysisExtensionCounts {
  const explicitSupport = readNumber(view.bucketCounts.extensionSupport);
  const explicitResistance = readNumber(view.bucketCounts.extensionResistance);
  const support = explicitSupport ?? view.syntheticContinuationMap.supportCount ?? 0;
  const resistance = explicitResistance ?? view.syntheticContinuationMap.resistanceCount ?? 0;

  return {
    support,
    resistance,
    total: support + resistance,
  };
}

function missingFactsFromView(view: LevelAnalysisJournalChartContextView): string[] {
  const missing: string[] = [];

  if (view.nearestLevels.support === null || view.nearestLevels.support === undefined) {
    missing.push("nearest_support");
  }

  if (view.nearestLevels.resistance === null || view.nearestLevels.resistance === undefined) {
    missing.push("nearest_resistance");
  }

  if (!view.qualityDiagnostics.densityMetric) {
    missing.push("density_metric");
  }

  if (!view.candidateInventory) {
    missing.push("candidate_inventory_gap_summary");
  }

  if (!view.volumeSessionContext) {
    missing.push("volume_session_context_summary");
  }

  if (!view.sourceIntegrity?.cacheFingerprintSummary) {
    missing.push("cache_fingerprint_summary");
  }

  return missing;
}

function sourceSchemaVersionFromResult(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): string {
  if (result.status === "accepted") {
    return result.views[0]?.source.schemaVersion ?? "unknown";
  }

  return (
    readStringPath(result.sourcePayload, ["schemaVersion"]) ??
    result.sourceKind ??
    "unknown"
  );
}

function providerFromResult(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): string | undefined {
  if (result.status === "accepted") {
    return result.packageMetadata?.provider ?? result.views[0]?.identity.provider;
  }

  return readStringPath(result.sourcePayload, ["provider"]);
}

function generatedAtFromResult(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): string | undefined {
  if (result.status === "accepted") {
    return result.packageMetadata?.generatedAt ?? result.views[0]?.identity.asOfIso;
  }

  return readStringPath(result.sourcePayload, ["generatedAt"]);
}

function reviewedSymbolsFromResult(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): string[] {
  if (result.status === "accepted") {
    return result.packageMetadata?.reviewedSymbols ?? result.views.map((view) => view.identity.symbol);
  }

  const reviewedSymbols = isRecord(result.sourcePayload)
    ? result.sourcePayload.reviewedSymbols
    : undefined;
  return isStringArray(reviewedSymbols) ? reviewedSymbols : [];
}

function sourceArtifactPathFromResult(
  result: LevelAnalysisJournalDeliveryIngestionResult,
): string | undefined {
  if (result.status === "accepted") {
    return result.views[0]?.source.sourceArtifact;
  }

  return readStringPath(result.sourcePayload, ["baselinePath"]);
}

function sourceCommitFromPayload(payload: unknown): string | undefined {
  return (
    readStringPath(payload, ["fixtureMetadata", "sourceCommit"]) ??
    readStringPath(payload, ["sourceCommit"])
  );
}

function prohibitedLanguageStatus(
  count: number | null,
  errors: LevelAnalysisJournalDeliveryValidationError[] = [],
): JournalLevelAnalysisProhibitedLanguageStatus {
  if (count !== null) {
    return count > 0 ? "hits_present" : "clear";
  }

  if (errors.some((error) => error.code === "prohibited_language_hits")) {
    return "hits_present";
  }

  return "unknown";
}

function compactSummaryFromViews(args: {
  sourceKind: LevelAnalysisJournalSourceKind;
  provider?: string;
  generatedAt?: string;
  views: LevelAnalysisJournalChartContextView[];
  safetySummary: unknown;
  limitationCount: number;
}): JournalLevelAnalysisDeliveryCompactSummary {
  const firstIntegrity = args.views.find((view) => view.sourceIntegrity)?.sourceIntegrity;
  const mismatchCount = firstIntegrity?.mismatchCount ?? null;
  const prohibitedLanguageHitCount = firstIntegrity?.prohibitedLanguageHitCount ?? null;
  const allFifteenMinuteContextOnly =
    args.views.length === 0
      ? null
      : args.views.every(
          (view) => view.fifteenMinuteContext.status === "context_only",
        );

  return {
    sourceKind: args.sourceKind,
    provider: args.provider,
    generatedAt: args.generatedAt,
    symbolCount: args.views.length,
    cacheFingerprintSummary: firstIntegrity?.cacheFingerprintSummary,
    cacheFingerprintCounts: firstIntegrity?.cacheFingerprintCounts,
    mismatchCount,
    prohibitedLanguageHitCount,
    allFifteenMinuteContextOnly,
    limitationCount: args.limitationCount,
    safetySummary: args.safetySummary,
  };
}

function symbolSummaryFromView(args: {
  deliveryId: string;
  view: LevelAnalysisJournalChartContextView;
}): JournalLevelAnalysisDeliverySymbolSummary {
  const { view } = args;

  return {
    deliveryId: args.deliveryId,
    symbol: view.identity.symbol,
    provider: view.identity.provider,
    asOfTimestamp: view.identity.asOfTimestamp,
    asOfIso: view.identity.asOfIso,
    referencePrice: view.identity.referencePrice ?? 0,
    previousClose: view.identity.previousClose,
    nearestSupport: cloneJson(view.nearestLevels.support),
    nearestResistance: cloneJson(view.nearestLevels.resistance),
    bucketCounts: cloneJson(view.bucketCounts),
    extensionCounts: extensionCountsFromView(view),
    extensionCoverage: cloneJson(view.extensionCoverage),
    syntheticContinuationMapSummary: {
      count: view.syntheticContinuationMap.count,
      supportCount: view.syntheticContinuationMap.supportCount,
      resistanceCount: view.syntheticContinuationMap.resistanceCount,
      clearlyMarkedCount: view.syntheticContinuationMap.clearlyMarkedCount,
    },
    diagnostics: [...view.qualityDiagnostics.diagnostics],
    diagnosticSemantics: cloneJson(view.qualityDiagnostics.diagnosticSemantics),
    densityMetricSummary: cloneJson(view.qualityDiagnostics.densityMetric),
    candidateInventoryGapSummary: cloneJson(view.candidateInventory?.gapSummary),
    volumeSessionContextSummary: cloneJson(
      view.volumeSessionContext?.comparisonSummary ?? view.volumeSessionContext?.factSummary,
    ),
    sourceFiles: cloneJson(view.sourceFiles),
    cacheFingerprintSourceIntegrity: cloneJson(view.sourceIntegrity),
    fifteenMinuteContextOnlyStatus: view.fifteenMinuteContext.status,
    missingFacts: missingFactsFromView(view),
    limitations: cloneJson(view.limitations),
    safetyFlags: cloneJson(view.safetyFlags),
  };
}

function sourceIntegrityNumber(
  summary: JournalLevelAnalysisDeliverySymbolSummary | undefined,
  field: string,
): number | null {
  const sourceIntegrity = summary?.cacheFingerprintSourceIntegrity;

  return isRecord(sourceIntegrity) ? readNumber(sourceIntegrity[field]) : null;
}

export function hashJournalLevelAnalysisRawPayload(rawPayload: unknown): string {
  return `sha256:${createHash("sha256").update(stableJson(rawPayload)).digest("hex")}`;
}

export function isJournalLevelAnalysisDuplicatePayload(args: {
  existingRawPayloadHash: string;
  incomingRawPayloadHash: string;
}): boolean {
  return args.existingRawPayloadHash === args.incomingRawPayloadHash;
}

export function createJournalLevelAnalysisDeliveryRecordFromIngestion(
  input: CreateJournalLevelAnalysisDeliveryRecordInput,
): JournalLevelAnalysisDeliveryRecord {
  const sourcePayload =
    input.ingestionResult.sourcePayload === undefined
      ? null
      : input.ingestionResult.sourcePayload;
  const rawPayloadHash = hashJournalLevelAnalysisRawPayload(sourcePayload);
  const sourceSchemaVersion = sourceSchemaVersionFromResult(input.ingestionResult);
  const provider = providerFromResult(input.ingestionResult);
  const generatedAt = generatedAtFromResult(input.ingestionResult);
  const reviewedSymbols = reviewedSymbolsFromResult(input.ingestionResult);
  const sourceArtifactPath =
    input.sourceArtifactPath ?? sourceArtifactPathFromResult(input.ingestionResult);
  const sourceCommit = input.sourceCommit ?? sourceCommitFromPayload(sourcePayload);
  const sourceArtifactCommit = input.sourceArtifactCommit ?? sourceCommit;

  if (input.ingestionResult.status === "quarantined") {
    return {
      contractVersion: JOURNAL_LEVEL_ANALYSIS_DELIVERY_PERSISTENCE_CONTRACT_VERSION,
      id: input.id,
      rawPayloadHash,
      sourceSystem: "levels-system",
      sourceKind: input.ingestionResult.sourceKind ?? "packaged_review_delivery",
      sourceSchemaVersion,
      sourceArtifactPath,
      sourceArtifactCommit,
      sourceCommit,
      provider,
      generatedAt,
      createdAt: input.createdAt,
      reviewedSymbols,
      baselineMismatchCount: readNumberPath(sourcePayload, ["summary", "mismatchCount"]),
      validationStatus: "quarantined",
      prohibitedLanguageStatus: prohibitedLanguageStatus(
        readNumberPath(sourcePayload, ["summary", "prohibitedLanguageHitCount"]),
        input.ingestionResult.errors,
      ),
      rawPayload: sourcePayload,
      compactSummary: null,
      perSymbolSummary: [],
      safetyFlags: isRecord(sourcePayload) ? sourcePayload.safety ?? null : null,
      limitations: [],
      quarantineReasons: input.ingestionResult.errors,
      auditTrail: [
        {
          event: "quarantined",
          at: input.createdAt,
          message: "Level analysis delivery payload quarantined by contract validation.",
        },
      ],
    };
  }

  const perSymbolSummary = input.ingestionResult.views.map((view) =>
    symbolSummaryFromView({ deliveryId: input.id, view }),
  );
  const mismatchCount =
    readNumber(input.ingestionResult.packageMetadata?.summary.mismatchCount) ??
    sourceIntegrityNumber(perSymbolSummary[0], "mismatchCount");
  const prohibitedLanguageHitCount =
    readNumber(input.ingestionResult.packageMetadata?.summary.prohibitedLanguageHitCount) ??
    sourceIntegrityNumber(perSymbolSummary[0], "prohibitedLanguageHitCount");
  const safetyFlags = isRecord(sourcePayload) ? sourcePayload.safety ?? null : null;

  return {
    contractVersion: JOURNAL_LEVEL_ANALYSIS_DELIVERY_PERSISTENCE_CONTRACT_VERSION,
    id: input.id,
    rawPayloadHash,
    sourceSystem: "levels-system",
    sourceKind: input.ingestionResult.sourceKind,
    sourceSchemaVersion,
    sourceArtifactPath,
    sourceArtifactCommit,
    sourceCommit,
    provider,
    generatedAt,
    createdAt: input.createdAt,
    reviewedSymbols,
    baselineMismatchCount: mismatchCount,
    validationStatus: "accepted",
    prohibitedLanguageStatus: prohibitedLanguageStatus(prohibitedLanguageHitCount),
    rawPayload: sourcePayload,
    compactSummary: compactSummaryFromViews({
      sourceKind: input.ingestionResult.sourceKind,
      provider,
      generatedAt,
      views: input.ingestionResult.views,
      safetySummary: safetyFlags,
      limitationCount: input.ingestionResult.limitations.length,
    }),
    perSymbolSummary,
    safetyFlags,
    limitations: cloneJson(input.ingestionResult.limitations),
    quarantineReasons: [],
    auditTrail: [
      {
        event: "created",
        at: input.createdAt,
        message: "Level analysis delivery persistence contract record created.",
      },
    ],
  };
}

export function validateJournalLevelAnalysisDeliverySymbolSummary(
  payload: unknown,
): JournalLevelAnalysisDeliverySymbolValidationResult {
  const issues: JournalLevelAnalysisDeliveryContractIssue[] = [];

  if (!isRecord(payload)) {
    return {
      status: "invalid",
      issues: [
        contractIssue(
          "payload_not_object",
          "$",
          "Journal level analysis symbol summary must be an object.",
        ),
      ],
    };
  }

  for (const field of ["deliveryId", "symbol", "fifteenMinuteContextOnlyStatus"]) {
    if (!isNonEmptyString(payload[field])) {
      issues.push(contractIssue("missing_required_field", field, `${field} is required.`));
    }
  }

  if (!isFiniteNumber(payload.asOfTimestamp)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "asOfTimestamp",
        "asOfTimestamp must be a finite number.",
      ),
    );
  }

  if (!isFiniteNumber(payload.referencePrice)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "referencePrice",
        "referencePrice must be a finite number.",
      ),
    );
  }

  if (!isRecord(payload.bucketCounts) || !isFiniteNumber(payload.bucketCounts.total)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "bucketCounts",
        "bucketCounts must include a numeric total.",
      ),
    );
  }

  if (
    !isRecord(payload.extensionCounts) ||
    !isFiniteNumber(payload.extensionCounts.support) ||
    !isFiniteNumber(payload.extensionCounts.resistance) ||
    !isFiniteNumber(payload.extensionCounts.total)
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "extensionCounts",
        "extensionCounts must include support, resistance, and total numbers.",
      ),
    );
  }

  if (!isRecord(payload.syntheticContinuationMapSummary)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "syntheticContinuationMapSummary",
        "syntheticContinuationMapSummary is required.",
      ),
    );
  }

  if (!isStringArray(payload.diagnostics)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "diagnostics",
        "diagnostics must be an array of strings.",
      ),
    );
  }

  if (!isStringArray(payload.missingFacts)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "missingFacts",
        "missingFacts must be an array of strings.",
      ),
    );
  }

  if (!Array.isArray(payload.limitations)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "limitations",
        "limitations must be an array.",
      ),
    );
  }

  if (
    payload.fifteenMinuteContextOnlyStatus !== "context_only" &&
    payload.fifteenMinuteContextOnlyStatus !== "not_supplied" &&
    payload.fifteenMinuteContextOnlyStatus !== "not_declared_by_single_snapshot_v1"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "fifteenMinuteContextOnlyStatus",
        "15m context-only status is invalid.",
      ),
    );
  }

  if (issues.length > 0) {
    return { status: "invalid", issues };
  }

  return {
    status: "valid",
    summary: payload as unknown as JournalLevelAnalysisDeliverySymbolSummary,
    issues: [],
  };
}

export function validateJournalLevelAnalysisDeliveryRecord(
  payload: unknown,
): JournalLevelAnalysisDeliveryRecordValidationResult {
  const issues: JournalLevelAnalysisDeliveryContractIssue[] = [];

  if (!isRecord(payload)) {
    return {
      status: "invalid",
      issues: [
        contractIssue(
          "payload_not_object",
          "$",
          "Journal level analysis delivery record must be an object.",
        ),
      ],
    };
  }

  for (const field of [
    "contractVersion",
    "id",
    "rawPayloadHash",
    "sourceSystem",
    "sourceKind",
    "sourceSchemaVersion",
    "createdAt",
    "validationStatus",
    "prohibitedLanguageStatus",
  ]) {
    if (!isNonEmptyString(payload[field])) {
      issues.push(contractIssue("missing_required_field", field, `${field} is required.`));
    }
  }

  if (payload.contractVersion !== JOURNAL_LEVEL_ANALYSIS_DELIVERY_PERSISTENCE_CONTRACT_VERSION) {
    issues.push(
      contractIssue(
        "unsupported_contract",
        "contractVersion",
        "Unexpected journal level analysis delivery persistence contract version.",
      ),
    );
  }

  if (!/^sha256:[a-f0-9]{64}$/.test(String(payload.rawPayloadHash))) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "rawPayloadHash",
        "rawPayloadHash must be a sha256-prefixed hex digest.",
      ),
    );
  }

  if (payload.sourceSystem !== "levels-system") {
    issues.push(
      contractIssue(
        "wrong_source_system",
        "sourceSystem",
        "sourceSystem must be levels-system.",
      ),
    );
  }

  if (
    payload.sourceKind !== "single_snapshot_v1" &&
    payload.sourceKind !== "packaged_review_delivery"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "sourceKind",
        "sourceKind must be single_snapshot_v1 or packaged_review_delivery.",
      ),
    );
  }

  if (!isStringArray(payload.reviewedSymbols)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "reviewedSymbols",
        "reviewedSymbols must be an array of strings.",
      ),
    );
  }

  if (
    payload.baselineMismatchCount !== null &&
    !isFiniteNumber(payload.baselineMismatchCount)
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "baselineMismatchCount",
        "baselineMismatchCount must be a finite number or null.",
      ),
    );
  }

  if (payload.validationStatus !== "accepted" && payload.validationStatus !== "quarantined") {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "validationStatus",
        "validationStatus must be accepted or quarantined.",
      ),
    );
  }

  if (
    payload.prohibitedLanguageStatus !== "clear" &&
    payload.prohibitedLanguageStatus !== "hits_present" &&
    payload.prohibitedLanguageStatus !== "unknown"
  ) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "prohibitedLanguageStatus",
        "prohibitedLanguageStatus is invalid.",
      ),
    );
  }

  if (!("rawPayload" in payload)) {
    issues.push(
      contractIssue(
        "missing_required_field",
        "rawPayload",
        "rawPayload must be present for audit and replay.",
      ),
    );
  } else if (payload.rawPayloadHash !== hashJournalLevelAnalysisRawPayload(payload.rawPayload)) {
    issues.push(
      contractIssue(
        "raw_payload_hash_mismatch",
        "rawPayloadHash",
        "rawPayloadHash must match the canonical rawPayload digest.",
      ),
    );
  }

  if (!Array.isArray(payload.perSymbolSummary)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "perSymbolSummary",
        "perSymbolSummary must be an array.",
      ),
    );
  }

  if (!Array.isArray(payload.limitations)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "limitations",
        "limitations must be an array.",
      ),
    );
  }

  if (!Array.isArray(payload.quarantineReasons)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "quarantineReasons",
        "quarantineReasons must be an array.",
      ),
    );
  }

  if (!Array.isArray(payload.auditTrail)) {
    issues.push(
      contractIssue(
        "invalid_field_shape",
        "auditTrail",
        "auditTrail must be an array.",
      ),
    );
  }

  if (payload.validationStatus === "accepted") {
    if (!isRecord(payload.compactSummary)) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "compactSummary",
          "Accepted records require a compactSummary object.",
        ),
      );
    }

    if (!Array.isArray(payload.perSymbolSummary) || payload.perSymbolSummary.length === 0) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "perSymbolSummary",
          "Accepted records require at least one symbol summary.",
        ),
      );
    }

    if (Array.isArray(payload.quarantineReasons) && payload.quarantineReasons.length > 0) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "quarantineReasons",
          "Accepted records cannot include quarantine reasons.",
        ),
      );
    }
  }

  if (payload.validationStatus === "quarantined") {
    if (payload.compactSummary !== null) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "compactSummary",
          "Quarantined records must not include trusted compact summaries.",
        ),
      );
    }

    if (Array.isArray(payload.perSymbolSummary) && payload.perSymbolSummary.length > 0) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "perSymbolSummary",
          "Quarantined records must not include trusted symbol summaries.",
        ),
      );
    }

    if (!Array.isArray(payload.quarantineReasons) || payload.quarantineReasons.length === 0) {
      issues.push(
        contractIssue(
          "invalid_field_shape",
          "quarantineReasons",
          "Quarantined records require quarantine reasons.",
        ),
      );
    }
  }

  if (Array.isArray(payload.perSymbolSummary)) {
    payload.perSymbolSummary.forEach((summary, index) => {
      const result = validateJournalLevelAnalysisDeliverySymbolSummary(summary);
      if (result.status === "invalid") {
        for (const issue of result.issues) {
          issues.push({
            ...issue,
            field: `perSymbolSummary[${index}].${issue.field}`,
          });
        }
      }
    });
  }

  if (issues.length > 0) {
    return { status: "invalid", issues };
  }

  return {
    status: "valid",
    record: payload as unknown as JournalLevelAnalysisDeliveryRecord,
    issues: [],
  };
}
