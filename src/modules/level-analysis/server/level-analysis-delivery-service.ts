import {
  validateLevelAnalysisJournalPayload,
  type LevelAnalysisJournalDeliveryIngestionResult,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-adapter";
import {
  createJournalLevelAnalysisDeliveryRecordFromIngestion,
  hashJournalLevelAnalysisRawPayload,
  LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
  LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
  type JournalLevelAnalysisDeliveryIngestApiResponse,
  type JournalLevelAnalysisDeliveryLatestApiResponse,
  type JournalLevelAnalysisDeliveryRecord,
  type JournalLevelAnalysisDeliverySymbolLatestApiResponse,
  type JournalLevelAnalysisDeliveryValidateApiResponse,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-persistence-contract";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import { LevelAnalysisDeliveryRepository } from "./level-analysis-delivery-repository";

function deliveryId(status: "accepted" | "quarantined", digest: string): string {
  return `${status === "accepted" ? "lad" : "laq"}_${digest.slice(7, 23)}`;
}

function providersFromAccepted(result: Extract<
  LevelAnalysisJournalDeliveryIngestionResult,
  { status: "accepted" }
>): readonly string[] {
  return Object.freeze([...new Set(result.views
    .map((view) => view.identity.provider)
    .filter((provider): provider is string => typeof provider === "string"))]);
}

function enforceProviderAllowlist(
  result: LevelAnalysisJournalDeliveryIngestionResult,
  allowedProviders: readonly string[],
): LevelAnalysisJournalDeliveryIngestionResult {
  if (allowedProviders.length === 0) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_CONFIGURATION_INVALID");
  }
  if (result.status !== "accepted") return result;
  const providers = providersFromAccepted(result);
  if (providers.length > 0 && providers.every((provider) => allowedProviders.includes(provider))) {
    return result;
  }
  return Object.freeze({
    status: "quarantined" as const,
    sourceKind: result.sourceKind,
    sourcePayload: result.sourcePayload,
    views: [] as [],
    limitations: [] as [],
    errors: [{
      code: "wrong_provider" as const,
      field: "provider",
      message: "Delivery provider is not enabled by the server configuration.",
    }],
  });
}

export class LevelAnalysisDeliveryService {
  constructor(
    private readonly repository: LevelAnalysisDeliveryRepository | null,
    private readonly allowedProviders: readonly string[],
    private readonly now: () => Date = () => new Date(),
  ) {}

  prepare(payload: unknown): JournalLevelAnalysisDeliveryRecord {
    const initial = validateLevelAnalysisJournalPayload(payload, {
      allowedPackagedProviders: [...this.allowedProviders],
    });
    const ingestion = enforceProviderAllowlist(initial, this.allowedProviders);
    const rawPayload = ingestion.sourcePayload === undefined ? null : ingestion.sourcePayload;
    const digest = hashJournalLevelAnalysisRawPayload(rawPayload);
    return createJournalLevelAnalysisDeliveryRecordFromIngestion({
      id: deliveryId(ingestion.status, digest),
      createdAt: this.now().toISOString(),
      ingestionResult: ingestion,
    });
  }

  validate(payload: unknown): JournalLevelAnalysisDeliveryValidateApiResponse {
    const record = this.prepare(payload);
    if (record.validationStatus === "quarantined") {
      return Object.freeze({
        contractVersion: LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
        status: "quarantined" as const,
        sourceKind: record.sourceKind,
        errors: record.quarantineReasons,
      });
    }
    return Object.freeze({
      contractVersion: LEVEL_ANALYSIS_DELIVERY_VALIDATE_API_CONTRACT_VERSION,
      status: "accepted" as const,
      sourceKind: record.sourceKind,
      compactSummary: record.compactSummary,
      perSymbolSummary: record.perSymbolSummary,
    });
  }

  ingest(payload: unknown): JournalLevelAnalysisDeliveryIngestApiResponse {
    if (!this.repository) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
    const result = this.repository.save(this.prepare(payload));
    const record = result.record;
    if (record.validationStatus === "quarantined") {
      return Object.freeze({
        contractVersion: LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
        status: "quarantined" as const,
        deliveryId: record.id,
        rawPayloadHash: record.rawPayloadHash,
        errors: record.quarantineReasons,
      });
    }
    return Object.freeze({
      contractVersion: LEVEL_ANALYSIS_DELIVERY_INGEST_API_CONTRACT_VERSION,
      status: "accepted" as const,
      deliveryId: record.id,
      duplicate: result.status === "duplicate",
      rawPayloadHash: record.rawPayloadHash,
      compactSummary: record.compactSummary,
      perSymbolSummary: record.perSymbolSummary,
    });
  }

  latest(provider?: string): JournalLevelAnalysisDeliveryLatestApiResponse {
    if (!this.repository) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
    if (provider !== undefined && !this.allowedProviders.includes(provider)) {
      platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
    }
    const record = provider
      ? this.repository.latestAccepted(provider)
      : this.allowedProviders
        .map((allowed) => this.repository?.latestAccepted(allowed) ?? null)
        .filter((item): item is JournalLevelAnalysisDeliveryRecord => item !== null)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0] ?? null;
    if (!record || record.validationStatus !== "accepted") {
      return Object.freeze({
        contractVersion: LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
        status: "not_found" as const,
      });
    }
    return Object.freeze({
      contractVersion: LEVEL_ANALYSIS_DELIVERY_LATEST_API_CONTRACT_VERSION,
      status: "found" as const,
      deliveryId: record.id,
      sourceKind: record.sourceKind,
      compactSummary: record.compactSummary,
      symbols: record.reviewedSymbols,
    });
  }

  latestSymbol(
    symbol: string,
    provider?: string,
  ): JournalLevelAnalysisDeliverySymbolLatestApiResponse {
    if (!this.repository) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
    if (provider !== undefined && !this.allowedProviders.includes(provider)) {
      platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
    }
    const summary = provider
      ? this.repository.latestAcceptedSymbol(symbol, provider)
      : this.allowedProviders
        .map((allowed) => this.repository?.latestAcceptedSymbol(symbol, allowed) ?? null)
        .filter((item): item is NonNullable<typeof item> => item !== null)
        .sort((left, right) => right.asOfTimestamp - left.asOfTimestamp)[0] ?? null;
    if (!summary) {
      return Object.freeze({
        contractVersion: LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
        status: "not_found" as const,
        symbol: symbol.toUpperCase(),
      });
    }
    return Object.freeze({
      contractVersion: LEVEL_ANALYSIS_DELIVERY_SYMBOL_LATEST_API_CONTRACT_VERSION,
      status: "found" as const,
      deliveryId: summary.deliveryId,
      symbol: summary.symbol,
      summary,
    });
  }
}
