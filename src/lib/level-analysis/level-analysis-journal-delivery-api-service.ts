import {
  validateLevelAnalysisJournalPayload,
  type LevelAnalysisJournalDeliveryOptions,
} from "./level-analysis-journal-delivery-adapter";
import {
  createJournalLevelAnalysisDeliveryRecordFromIngestion,
  hashJournalLevelAnalysisRawPayload,
  LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_RAW_ADMIN_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
  type JournalLevelAnalysisDeliveryIngestApiResponse,
  type JournalLevelAnalysisDeliveryLatestApiResponse,
  type JournalLevelAnalysisDeliveryRawAdminApiResponse,
  type JournalLevelAnalysisDeliverySymbolLatestApiResponse,
  type JournalLevelAnalysisDeliveryValidateApiResponse,
} from "./level-analysis-journal-delivery-persistence-contract";
import {
  SqliteJournalLevelAnalysisDeliveryRepository,
  type JournalLevelAnalysisDeliveryRepository,
} from "./level-analysis-journal-delivery-persistence-storage";

type JsonRecord = Record<string, unknown>;

export interface JournalLevelAnalysisDeliveryApiRequest {
  payload: unknown;
  allowedPackagedProviders?: string[];
  sourceArtifactCommit?: string;
  sourceCommit?: string;
  sourceArtifactPath?: string;
  createdAt?: string;
}

export interface JournalLevelAnalysisDeliveryServiceOptions {
  repository?: JournalLevelAnalysisDeliveryRepository;
  now?: () => Date;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function readOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function sourceArtifactPathFromPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const metadata = payload.fixtureMetadata;
  return (
    readOptionalString(payload.sourceArtifactPath) ??
    readOptionalString(payload.baselinePath) ??
    (isRecord(metadata) ? readOptionalString(metadata.sourceArtifactPath) : undefined)
  );
}

function sourceCommitFromPayload(payload: unknown): string | undefined {
  if (!isRecord(payload)) {
    return undefined;
  }

  const metadata = payload.fixtureMetadata;
  return (
    readOptionalString(payload.sourceCommit) ??
    (isRecord(metadata) ? readOptionalString(metadata.sourceCommit) : undefined)
  );
}

export async function readJournalLevelAnalysisDeliveryApiRequest(
  request: Request,
): Promise<JournalLevelAnalysisDeliveryApiRequest> {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    throw new Error(
      `Invalid JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const payload = isRecord(body) && "payload" in body ? body.payload : body;

  return {
    payload,
    allowedPackagedProviders:
      isRecord(body) && isStringArray(body.allowedPackagedProviders)
        ? body.allowedPackagedProviders
        : undefined,
    sourceArtifactCommit:
      isRecord(body) ? readOptionalString(body.sourceArtifactCommit) : undefined,
    sourceCommit: isRecord(body) ? readOptionalString(body.sourceCommit) : undefined,
    sourceArtifactPath:
      isRecord(body) ? readOptionalString(body.sourceArtifactPath) : undefined,
    createdAt: isRecord(body) ? readOptionalString(body.createdAt) : undefined,
  };
}

function repositoryFromOptions(
  options: JournalLevelAnalysisDeliveryServiceOptions,
): JournalLevelAnalysisDeliveryRepository {
  return options.repository ?? new SqliteJournalLevelAnalysisDeliveryRepository();
}

function deliveryIdFor(args: {
  status: "accepted" | "quarantined";
  rawPayloadHash: string;
}): string {
  const prefix = args.status === "accepted" ? "lad" : "laq";
  return `${prefix}_${args.rawPayloadHash.slice("sha256:".length, "sha256:".length + 16)}`;
}

function ingestionOptions(
  request: JournalLevelAnalysisDeliveryApiRequest,
): LevelAnalysisJournalDeliveryOptions {
  return request.allowedPackagedProviders
    ? { allowedPackagedProviders: request.allowedPackagedProviders }
    : {};
}

export function validateJournalLevelAnalysisDeliveryForApi(
  request: JournalLevelAnalysisDeliveryApiRequest,
  options: JournalLevelAnalysisDeliveryServiceOptions = {},
): JournalLevelAnalysisDeliveryValidateApiResponse {
  const ingestionResult = validateLevelAnalysisJournalPayload(
    request.payload,
    ingestionOptions(request),
  );
  const createdAt = request.createdAt ?? (options.now ?? (() => new Date()))().toISOString();
  const rawPayload =
    ingestionResult.sourcePayload === undefined ? null : ingestionResult.sourcePayload;
  const rawPayloadHash = hashJournalLevelAnalysisRawPayload(rawPayload);
  const record = createJournalLevelAnalysisDeliveryRecordFromIngestion({
    id: deliveryIdFor({ status: ingestionResult.status, rawPayloadHash }),
    createdAt,
    ingestionResult,
    sourceArtifactCommit:
      request.sourceArtifactCommit ?? sourceCommitFromPayload(request.payload),
    sourceCommit: request.sourceCommit ?? sourceCommitFromPayload(request.payload),
    sourceArtifactPath:
      request.sourceArtifactPath ?? sourceArtifactPathFromPayload(request.payload),
  });

  if (record.validationStatus === "quarantined") {
    return {
      contractVersion: LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
      status: "quarantined",
      sourceKind: ingestionResult.sourceKind,
      errors: record.quarantineReasons,
    };
  }

  return {
    contractVersion: LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
    status: "accepted",
    sourceKind: record.sourceKind,
    compactSummary: record.compactSummary,
    perSymbolSummary: record.perSymbolSummary,
  };
}

export function ingestJournalLevelAnalysisDeliveryForApi(
  request: JournalLevelAnalysisDeliveryApiRequest,
  options: JournalLevelAnalysisDeliveryServiceOptions = {},
): JournalLevelAnalysisDeliveryIngestApiResponse {
  const repository = repositoryFromOptions(options);
  const ingestionResult = validateLevelAnalysisJournalPayload(
    request.payload,
    ingestionOptions(request),
  );
  const createdAt = request.createdAt ?? (options.now ?? (() => new Date()))().toISOString();
  const rawPayload =
    ingestionResult.sourcePayload === undefined ? null : ingestionResult.sourcePayload;
  const rawPayloadHash = hashJournalLevelAnalysisRawPayload(rawPayload);
  const record = createJournalLevelAnalysisDeliveryRecordFromIngestion({
    id: deliveryIdFor({ status: ingestionResult.status, rawPayloadHash }),
    createdAt,
    ingestionResult,
    sourceArtifactCommit:
      request.sourceArtifactCommit ?? sourceCommitFromPayload(request.payload),
    sourceCommit: request.sourceCommit ?? sourceCommitFromPayload(request.payload),
    sourceArtifactPath:
      request.sourceArtifactPath ?? sourceArtifactPathFromPayload(request.payload),
  });
  const saveResult = repository.saveDeliveryRecord(record);
  const persisted = saveResult.record;

  if (persisted.validationStatus === "quarantined") {
    return {
      contractVersion: LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
      status: "quarantined",
      deliveryId: persisted.id,
      rawPayloadHash: persisted.rawPayloadHash,
      errors: persisted.quarantineReasons,
    };
  }

  return {
    contractVersion: LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
    status: "accepted",
    deliveryId: persisted.id,
    duplicate: saveResult.status === "duplicate",
    rawPayloadHash: persisted.rawPayloadHash,
    compactSummary: persisted.compactSummary,
    perSymbolSummary: persisted.perSymbolSummary,
  };
}

export function getLatestJournalLevelAnalysisDeliveryForApi(
  args: {
    provider?: string;
  } = {},
  options: JournalLevelAnalysisDeliveryServiceOptions = {},
): JournalLevelAnalysisDeliveryLatestApiResponse {
  const record = repositoryFromOptions(options).getLatestAcceptedDelivery({
    provider: args.provider,
  });

  if (!record || record.validationStatus !== "accepted") {
    return {
      contractVersion: LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
      status: "not_found",
    };
  }

  return {
    contractVersion: LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
    status: "found",
    deliveryId: record.id,
    sourceKind: record.sourceKind,
    compactSummary: record.compactSummary,
    symbols: record.reviewedSymbols,
  };
}

export function getLatestJournalLevelAnalysisSymbolSummaryForApi(
  args: {
    symbol: string;
    provider?: string;
  },
  options: JournalLevelAnalysisDeliveryServiceOptions = {},
): JournalLevelAnalysisDeliverySymbolLatestApiResponse {
  const summary = repositoryFromOptions(options).getLatestAcceptedSymbolSummary({
    symbol: args.symbol,
    provider: args.provider,
  });

  if (!summary) {
    return {
      contractVersion: LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
      status: "not_found",
      symbol: args.symbol.toUpperCase(),
    };
  }

  return {
    contractVersion: LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
    status: "found",
    deliveryId: summary.deliveryId,
    symbol: summary.symbol,
    summary,
  };
}

export function getJournalLevelAnalysisRawPayloadForAdminApi(
  args: {
    deliveryId: string;
  },
  options: JournalLevelAnalysisDeliveryServiceOptions = {},
): JournalLevelAnalysisDeliveryRawAdminApiResponse {
  const record = repositoryFromOptions(options).getDeliveryRecord(args.deliveryId);

  if (!record) {
    return {
      contractVersion: LEVEL_ANALYSIS_DELIVERY_RAW_ADMIN_API_CONTRACT_VERSION,
      status: "not_found",
    };
  }

  return {
    contractVersion: LEVEL_ANALYSIS_DELIVERY_RAW_ADMIN_API_CONTRACT_VERSION,
    status: "found",
    deliveryId: record.id,
    rawPayloadHash: record.rawPayloadHash,
    sourceKind: record.sourceKind,
    validationStatus: record.validationStatus,
    rawPayload: record.rawPayload,
  };
}

export function journalLevelAnalysisDeliveryErrorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return Response.json({ ok: false, code, message }, { status });
}
