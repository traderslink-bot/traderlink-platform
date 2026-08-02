import type Database from "better-sqlite3";

import {
  isJournalLevelAnalysisDuplicatePayload,
  validateJournalLevelAnalysisDeliveryRecord,
  validateJournalLevelAnalysisDeliverySymbolSummary,
  type JournalLevelAnalysisDeliveryRecord,
  type JournalLevelAnalysisDeliverySymbolSummary,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-persistence-contract";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import {
  createLevelAnalysisJsonEvidence,
  parseLevelAnalysisJsonEvidence,
} from "./level-analysis-json-evidence";

type DeliveryRow = Readonly<{
  delivery_id: string;
  raw_payload_sha256: string;
  validation_status: "accepted" | "quarantined";
  record_json: string;
  record_sha256: string;
  raw_payload_json: string;
  raw_payload_json_sha256: string;
}>;

type SymbolRow = Readonly<{
  delivery_id: string;
  normalized_symbol: string;
  summary_json: string;
  summary_sha256: string;
}>;

export type SaveLevelAnalysisDeliveryResult = Readonly<{
  status: "stored" | "duplicate";
  record: JournalLevelAnalysisDeliveryRecord;
}>;

function normalizeSymbol(value: string): string {
  return value.trim().toUpperCase();
}

function assertRecord(record: JournalLevelAnalysisDeliveryRecord): void {
  if (validateJournalLevelAnalysisDeliveryRecord(record).status !== "valid") {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
  }
  if (!/^(?:lad|laq)_[0-9a-f]{16}$/u.test(record.id)) {
    platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID", { field: "deliveryId" });
  }
}

function readRecord(row: DeliveryRow): JournalLevelAnalysisDeliveryRecord {
  const record = parseLevelAnalysisJsonEvidence<JournalLevelAnalysisDeliveryRecord>(
    row.record_json,
    row.record_sha256,
    "level_analysis_deliveries.record_json",
  );
  const rawPayload = parseLevelAnalysisJsonEvidence<unknown>(
    row.raw_payload_json,
    row.raw_payload_json_sha256,
    "level_analysis_deliveries.raw_payload_json",
  );
  assertRecord(record);
  if (
    record.id !== row.delivery_id || record.rawPayloadHash !== row.raw_payload_sha256 ||
    record.validationStatus !== row.validation_status ||
    JSON.stringify(record.rawPayload) !== JSON.stringify(rawPayload)
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      field: "level_analysis_deliveries",
    });
  }
  return Object.freeze(record);
}

function readSummary(row: SymbolRow): JournalLevelAnalysisDeliverySymbolSummary {
  const summary = parseLevelAnalysisJsonEvidence<JournalLevelAnalysisDeliverySymbolSummary>(
    row.summary_json,
    row.summary_sha256,
    "level_analysis_delivery_symbol_facts.summary_json",
  );
  if (
    validateJournalLevelAnalysisDeliverySymbolSummary(summary).status !== "valid" ||
    summary.deliveryId !== row.delivery_id ||
    normalizeSymbol(summary.symbol) !== row.normalized_symbol
  ) {
    platformFailure("TRADERLINK_PLATFORM_INTEGRITY_FAILED", {
      field: "level_analysis_delivery_symbol_facts",
    });
  }
  return Object.freeze(summary);
}

export class LevelAnalysisDeliveryRepository {
  constructor(private readonly database: Database.Database) {}

  save(record: JournalLevelAnalysisDeliveryRecord): SaveLevelAnalysisDeliveryResult {
    assertRecord(record);
    return this.database.transaction(() => {
      const byHash = this.getByRawPayloadHash(record.rawPayloadHash);
      if (byHash) {
        if (!isJournalLevelAnalysisDuplicatePayload({
          existingRawPayloadHash: byHash.rawPayloadHash,
          incomingRawPayloadHash: record.rawPayloadHash,
        })) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_CONFLICT");
        return Object.freeze({ status: "duplicate" as const, record: byHash });
      }
      if (this.get(record.id)) platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_CONFLICT");
      this.insert(record);
      return Object.freeze({ status: "stored" as const, record });
    }).immediate();
  }

  get(deliveryId: string): JournalLevelAnalysisDeliveryRecord | null {
    const row = this.database.prepare<[string], DeliveryRow>(`
SELECT delivery_id, raw_payload_sha256, validation_status, record_json,
       record_sha256, raw_payload_json, raw_payload_json_sha256
FROM level_analysis_deliveries WHERE delivery_id = ?`).get(deliveryId);
    return row ? readRecord(row) : null;
  }

  getByRawPayloadHash(rawPayloadHash: string): JournalLevelAnalysisDeliveryRecord | null {
    const row = this.database.prepare<[string], DeliveryRow>(`
SELECT delivery_id, raw_payload_sha256, validation_status, record_json,
       record_sha256, raw_payload_json, raw_payload_json_sha256
FROM level_analysis_deliveries WHERE raw_payload_sha256 = ?`).get(rawPayloadHash);
    return row ? readRecord(row) : null;
  }

  latestAccepted(provider?: string): JournalLevelAnalysisDeliveryRecord | null {
    const row = provider
      ? this.database.prepare<[string], DeliveryRow>(`
SELECT delivery_id, raw_payload_sha256, validation_status, record_json,
       record_sha256, raw_payload_json, raw_payload_json_sha256
FROM level_analysis_deliveries
WHERE validation_status = 'accepted' AND provider = ?
ORDER BY received_at_utc DESC, delivery_id DESC LIMIT 1`).get(provider)
      : this.database.prepare<[], DeliveryRow>(`
SELECT delivery_id, raw_payload_sha256, validation_status, record_json,
       record_sha256, raw_payload_json, raw_payload_json_sha256
FROM level_analysis_deliveries
WHERE validation_status = 'accepted'
ORDER BY received_at_utc DESC, delivery_id DESC LIMIT 1`).get();
    return row ? readRecord(row) : null;
  }

  latestAcceptedSymbol(
    symbol: string,
    provider?: string,
    atOrBefore?: number,
  ): JournalLevelAnalysisDeliverySymbolSummary | null {
    const conditions = [
      "delivery.validation_status = 'accepted'",
      "fact.normalized_symbol = ?",
    ];
    const parameters: Array<string | number> = [normalizeSymbol(symbol)];
    if (provider !== undefined) {
      conditions.push("fact.provider = ?");
      parameters.push(provider);
    }
    if (atOrBefore !== undefined) {
      conditions.push("fact.as_of_timestamp <= ?");
      parameters.push(atOrBefore);
    }
    const row = this.database.prepare<unknown[], SymbolRow>(`
SELECT fact.delivery_id, fact.normalized_symbol, fact.summary_json, fact.summary_sha256
FROM level_analysis_delivery_symbol_facts fact
JOIN level_analysis_deliveries delivery ON delivery.delivery_id = fact.delivery_id
WHERE ${conditions.join(" AND ")}
ORDER BY fact.as_of_timestamp DESC, delivery.received_at_utc DESC, fact.delivery_id DESC
LIMIT 1`).get(...parameters);
    return row ? readSummary(row) : null;
  }

  symbolForDelivery(
    deliveryId: string,
    symbol: string,
  ): JournalLevelAnalysisDeliverySymbolSummary | null {
    const row = this.database.prepare<[string, string], SymbolRow>(`
SELECT delivery_id, normalized_symbol, summary_json, summary_sha256
FROM level_analysis_delivery_symbol_facts
WHERE delivery_id = ? AND normalized_symbol = ?`).get(deliveryId, normalizeSymbol(symbol));
    return row ? readSummary(row) : null;
  }

  private insert(record: JournalLevelAnalysisDeliveryRecord): void {
    const reviewedSymbols = createLevelAnalysisJsonEvidence(record.reviewedSymbols);
    const rawPayload = createLevelAnalysisJsonEvidence(record.rawPayload);
    const compact = record.compactSummary === null
      ? null
      : createLevelAnalysisJsonEvidence(record.compactSummary);
    const safety = createLevelAnalysisJsonEvidence(record.safetyFlags);
    const limitations = createLevelAnalysisJsonEvidence(record.limitations);
    const quarantine = createLevelAnalysisJsonEvidence(record.quarantineReasons);
    const audit = createLevelAnalysisJsonEvidence(record.auditTrail);
    const complete = createLevelAnalysisJsonEvidence(record);
    this.database.prepare(`
INSERT INTO level_analysis_deliveries (
  delivery_id, contract_version, raw_payload_sha256, source_system, source_kind,
  source_schema_version, source_artifact_path, source_artifact_commit, source_commit,
  provider, generated_at_utc, received_at_utc, reviewed_symbol_count,
  reviewed_symbols_json, reviewed_symbols_sha256, baseline_mismatch_count,
  validation_status, prohibited_language_status, raw_payload_json,
  raw_payload_json_sha256, compact_summary_json, compact_summary_sha256,
  safety_flags_json, safety_flags_sha256, limitations_json, limitations_sha256,
  quarantine_reasons_json, quarantine_reasons_sha256, audit_trail_json,
  audit_trail_sha256, record_json, record_sha256
) VALUES (
  @deliveryId, @contractVersion, @rawPayloadSha256, @sourceSystem, @sourceKind,
  @sourceSchemaVersion, @sourceArtifactPath, @sourceArtifactCommit, @sourceCommit,
  @provider, @generatedAtUtc, @receivedAtUtc, @reviewedSymbolCount,
  @reviewedSymbolsJson, @reviewedSymbolsSha256, @baselineMismatchCount,
  @validationStatus, @prohibitedLanguageStatus, @rawPayloadJson,
  @rawPayloadJsonSha256, @compactSummaryJson, @compactSummarySha256,
  @safetyFlagsJson, @safetyFlagsSha256, @limitationsJson, @limitationsSha256,
  @quarantineReasonsJson, @quarantineReasonsSha256, @auditTrailJson,
  @auditTrailSha256, @recordJson, @recordSha256
)`).run({
      deliveryId: record.id,
      contractVersion: record.contractVersion,
      rawPayloadSha256: record.rawPayloadHash,
      sourceSystem: record.sourceSystem,
      sourceKind: record.sourceKind,
      sourceSchemaVersion: record.sourceSchemaVersion,
      sourceArtifactPath: record.sourceArtifactPath ?? null,
      sourceArtifactCommit: record.sourceArtifactCommit ?? null,
      sourceCommit: record.sourceCommit ?? null,
      provider: record.provider ?? null,
      generatedAtUtc: record.generatedAt ?? null,
      receivedAtUtc: record.createdAt,
      reviewedSymbolCount: record.reviewedSymbols.length,
      reviewedSymbolsJson: reviewedSymbols.json,
      reviewedSymbolsSha256: reviewedSymbols.sha256,
      baselineMismatchCount: record.baselineMismatchCount,
      validationStatus: record.validationStatus,
      prohibitedLanguageStatus: record.prohibitedLanguageStatus,
      rawPayloadJson: rawPayload.json,
      rawPayloadJsonSha256: rawPayload.sha256,
      compactSummaryJson: compact?.json ?? null,
      compactSummarySha256: compact?.sha256 ?? null,
      safetyFlagsJson: safety.json,
      safetyFlagsSha256: safety.sha256,
      limitationsJson: limitations.json,
      limitationsSha256: limitations.sha256,
      quarantineReasonsJson: quarantine.json,
      quarantineReasonsSha256: quarantine.sha256,
      auditTrailJson: audit.json,
      auditTrailSha256: audit.sha256,
      recordJson: complete.json,
      recordSha256: complete.sha256,
    });

    if (record.validationStatus !== "accepted") return;
    for (const summary of record.perSymbolSummary) {
      const validation = validateJournalLevelAnalysisDeliverySymbolSummary(summary);
      if (validation.status !== "valid" || summary.deliveryId !== record.id) {
        platformFailure("TRADERLINK_LEVEL_ANALYSIS_DELIVERY_INVALID");
      }
      const evidence = createLevelAnalysisJsonEvidence(summary);
      this.database.prepare(`
INSERT INTO level_analysis_delivery_symbol_facts (
  delivery_id, normalized_symbol, provider, as_of_timestamp, as_of_utc,
  fifteen_minute_context_only_status, summary_json, summary_sha256, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(
        record.id,
        normalizeSymbol(summary.symbol),
        summary.provider ?? null,
        summary.asOfTimestamp,
        summary.asOfIso ?? null,
        summary.fifteenMinuteContextOnlyStatus,
        evidence.json,
        evidence.sha256,
        record.createdAt,
      );
    }
  }
}
