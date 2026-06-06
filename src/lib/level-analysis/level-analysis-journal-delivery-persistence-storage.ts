import type Database from "better-sqlite3";
import {
  getTraderIntelligenceDatabase,
  runTraderIntelligenceMigrations,
} from "../trader-analytics/product/import-commit/sqlite-import-commit-repository";
import {
  isJournalLevelAnalysisDuplicatePayload,
  validateJournalLevelAnalysisDeliveryRecord,
  type JournalLevelAnalysisDeliveryRecord,
  type JournalLevelAnalysisDeliverySymbolSummary,
} from "./level-analysis-journal-delivery-persistence-contract";

type SqliteDatabase = Database.Database;

export const LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_DELIVERY_API_ENABLED";
export const LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG =
  "LEVEL_ANALYSIS_JOURNAL_DELIVERY_RAW_DEBUG_ENABLED";

export interface SaveJournalLevelAnalysisDeliveryRecordResult {
  status: "stored" | "duplicate";
  record: JournalLevelAnalysisDeliveryRecord;
}

export interface GetLatestDeliveryQuery {
  provider?: string;
}

export interface GetLatestSymbolSummaryQuery {
  symbol: string;
  provider?: string;
}

export interface GetLatestSymbolSummaryAtOrBeforeQuery
  extends GetLatestSymbolSummaryQuery {
  asOfTimestamp: number;
}

export interface JournalLevelAnalysisDeliveryRepository {
  saveDeliveryRecord(
    record: JournalLevelAnalysisDeliveryRecord,
  ): SaveJournalLevelAnalysisDeliveryRecordResult;
  getDeliveryRecord(id: string): JournalLevelAnalysisDeliveryRecord | null;
  getDeliveryRecordByRawPayloadHash(
    rawPayloadHash: string,
  ): JournalLevelAnalysisDeliveryRecord | null;
  getLatestAcceptedDelivery(
    query?: GetLatestDeliveryQuery,
  ): JournalLevelAnalysisDeliveryRecord | null;
  getLatestAcceptedSymbolSummary(
    query: GetLatestSymbolSummaryQuery,
  ): JournalLevelAnalysisDeliverySymbolSummary | null;
  getLatestAcceptedSymbolSummaryAtOrBefore(
    query: GetLatestSymbolSummaryAtOrBeforeQuery,
  ): JournalLevelAnalysisDeliverySymbolSummary | null;
}

function envEnabled(value: string | undefined): boolean {
  return value === "1" || value?.toLowerCase() === "true";
}

export function isLevelAnalysisDeliveryApiEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_DELIVERY_API_FEATURE_FLAG]);
}

export function isLevelAnalysisDeliveryRawDebugEnabled(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return envEnabled(env[LEVEL_ANALYSIS_DELIVERY_RAW_DEBUG_FEATURE_FLAG]);
}

function json<T>(value: T): string {
  return JSON.stringify(value);
}

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function rowJson<T>(row: unknown): T {
  return parseJson<T>((row as { record_json: string }).record_json);
}

export function runJournalLevelAnalysisDeliveryMigrations(
  db: SqliteDatabase,
): void {
  runTraderIntelligenceMigrations(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS level_analysis_delivery_records (
      id TEXT PRIMARY KEY,
      raw_payload_hash TEXT NOT NULL UNIQUE,
      source_system TEXT NOT NULL,
      source_kind TEXT NOT NULL,
      source_schema_version TEXT NOT NULL,
      source_artifact_path TEXT,
      source_artifact_commit TEXT,
      source_commit TEXT,
      provider TEXT,
      generated_at TEXT,
      created_at TEXT NOT NULL,
      reviewed_symbols_json TEXT NOT NULL,
      baseline_mismatch_count REAL,
      validation_status TEXT NOT NULL,
      prohibited_language_status TEXT NOT NULL,
      raw_payload_json TEXT NOT NULL,
      compact_summary_json TEXT,
      safety_flags_json TEXT,
      limitations_json TEXT NOT NULL,
      quarantine_reasons_json TEXT NOT NULL,
      audit_trail_json TEXT NOT NULL,
      record_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS level_analysis_delivery_records_latest
      ON level_analysis_delivery_records(validation_status, provider, generated_at DESC, created_at DESC);

    CREATE TABLE IF NOT EXISTS level_analysis_delivery_symbol_summaries (
      id TEXT PRIMARY KEY,
      delivery_id TEXT NOT NULL,
      symbol TEXT NOT NULL,
      provider TEXT,
      as_of_timestamp INTEGER NOT NULL,
      as_of_iso TEXT,
      validation_status TEXT NOT NULL,
      summary_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS level_analysis_delivery_symbol_latest
      ON level_analysis_delivery_symbol_summaries(symbol, provider, as_of_timestamp DESC, delivery_id);

    CREATE INDEX IF NOT EXISTS level_analysis_delivery_symbol_by_delivery
      ON level_analysis_delivery_symbol_summaries(delivery_id);
  `);

  db.prepare(
    "INSERT OR IGNORE INTO schema_migrations (id, applied_at) VALUES (?, ?)",
  ).run("004_level_analysis_delivery_persistence", new Date().toISOString());
}

export class SqliteJournalLevelAnalysisDeliveryRepository
  implements JournalLevelAnalysisDeliveryRepository
{
  constructor(private readonly db: SqliteDatabase = getTraderIntelligenceDatabase()) {
    runJournalLevelAnalysisDeliveryMigrations(this.db);
  }

  saveDeliveryRecord(
    record: JournalLevelAnalysisDeliveryRecord,
  ): SaveJournalLevelAnalysisDeliveryRecordResult {
    const validation = validateJournalLevelAnalysisDeliveryRecord(record);
    if (validation.status === "invalid") {
      throw new Error(
        `Invalid journal level analysis delivery record: ${validation.issues
          .map((issue) => `${issue.field}:${issue.code}`)
          .join(", ")}`,
      );
    }

    const existing = this.getDeliveryRecordByRawPayloadHash(record.rawPayloadHash);
    if (
      existing &&
      isJournalLevelAnalysisDuplicatePayload({
        existingRawPayloadHash: existing.rawPayloadHash,
        incomingRawPayloadHash: record.rawPayloadHash,
      })
    ) {
      return { status: "duplicate", record: existing };
    }

    const transaction = this.db.transaction(() => {
      this.insertRecord(record);
      this.replaceSymbolSummaries(record);
    });

    transaction();
    return { status: "stored", record };
  }

  getDeliveryRecord(id: string): JournalLevelAnalysisDeliveryRecord | null {
    const row = this.db
      .prepare("SELECT record_json FROM level_analysis_delivery_records WHERE id = ?")
      .get(id);
    return row ? rowJson<JournalLevelAnalysisDeliveryRecord>(row) : null;
  }

  getDeliveryRecordByRawPayloadHash(
    rawPayloadHash: string,
  ): JournalLevelAnalysisDeliveryRecord | null {
    const row = this.db
      .prepare(
        "SELECT record_json FROM level_analysis_delivery_records WHERE raw_payload_hash = ?",
      )
      .get(rawPayloadHash);
    return row ? rowJson<JournalLevelAnalysisDeliveryRecord>(row) : null;
  }

  getLatestAcceptedDelivery(
    query: GetLatestDeliveryQuery = {},
  ): JournalLevelAnalysisDeliveryRecord | null {
    const row = query.provider
      ? this.db
          .prepare(
            `SELECT record_json
             FROM level_analysis_delivery_records
             WHERE validation_status = 'accepted' AND provider = ?
             ORDER BY generated_at DESC, created_at DESC, id DESC
             LIMIT 1`,
          )
          .get(query.provider)
      : this.db
          .prepare(
            `SELECT record_json
             FROM level_analysis_delivery_records
             WHERE validation_status = 'accepted'
             ORDER BY generated_at DESC, created_at DESC, id DESC
             LIMIT 1`,
          )
          .get();

    return row ? rowJson<JournalLevelAnalysisDeliveryRecord>(row) : null;
  }

  getLatestAcceptedSymbolSummary(
    query: GetLatestSymbolSummaryQuery,
  ): JournalLevelAnalysisDeliverySymbolSummary | null {
    const symbol = query.symbol.toUpperCase();
    const row = query.provider
      ? this.db
          .prepare(
            `SELECT summary_json
             FROM level_analysis_delivery_symbol_summaries
             WHERE validation_status = 'accepted' AND symbol = ? AND provider = ?
             ORDER BY as_of_timestamp DESC, delivery_id DESC
             LIMIT 1`,
          )
          .get(symbol, query.provider)
      : this.db
          .prepare(
            `SELECT summary_json
             FROM level_analysis_delivery_symbol_summaries
             WHERE validation_status = 'accepted' AND symbol = ?
             ORDER BY as_of_timestamp DESC, delivery_id DESC
             LIMIT 1`,
          )
          .get(symbol);

    return row ? parseJson<JournalLevelAnalysisDeliverySymbolSummary>((row as { summary_json: string }).summary_json) : null;
  }

  getLatestAcceptedSymbolSummaryAtOrBefore(
    query: GetLatestSymbolSummaryAtOrBeforeQuery,
  ): JournalLevelAnalysisDeliverySymbolSummary | null {
    const symbol = query.symbol.toUpperCase();
    const row = query.provider
      ? this.db
          .prepare(
            `SELECT summary_json
             FROM level_analysis_delivery_symbol_summaries
             WHERE validation_status = 'accepted'
               AND symbol = ?
               AND provider = ?
               AND as_of_timestamp <= ?
             ORDER BY as_of_timestamp DESC, delivery_id DESC
             LIMIT 1`,
          )
          .get(symbol, query.provider, query.asOfTimestamp)
      : this.db
          .prepare(
            `SELECT summary_json
             FROM level_analysis_delivery_symbol_summaries
             WHERE validation_status = 'accepted'
               AND symbol = ?
               AND as_of_timestamp <= ?
             ORDER BY as_of_timestamp DESC, delivery_id DESC
             LIMIT 1`,
          )
          .get(symbol, query.asOfTimestamp);

    return row ? parseJson<JournalLevelAnalysisDeliverySymbolSummary>((row as { summary_json: string }).summary_json) : null;
  }

  private insertRecord(record: JournalLevelAnalysisDeliveryRecord): void {
    this.db
      .prepare(
        `INSERT INTO level_analysis_delivery_records (
          id, raw_payload_hash, source_system, source_kind, source_schema_version,
          source_artifact_path, source_artifact_commit, source_commit, provider,
          generated_at, created_at, reviewed_symbols_json, baseline_mismatch_count,
          validation_status, prohibited_language_status, raw_payload_json,
          compact_summary_json, safety_flags_json, limitations_json,
          quarantine_reasons_json, audit_trail_json, record_json
        ) VALUES (
          @id, @rawPayloadHash, @sourceSystem, @sourceKind, @sourceSchemaVersion,
          @sourceArtifactPath, @sourceArtifactCommit, @sourceCommit, @provider,
          @generatedAt, @createdAt, @reviewedSymbolsJson, @baselineMismatchCount,
          @validationStatus, @prohibitedLanguageStatus, @rawPayloadJson,
          @compactSummaryJson, @safetyFlagsJson, @limitationsJson,
          @quarantineReasonsJson, @auditTrailJson, @recordJson
        )`,
      )
      .run({
        id: record.id,
        rawPayloadHash: record.rawPayloadHash,
        sourceSystem: record.sourceSystem,
        sourceKind: record.sourceKind,
        sourceSchemaVersion: record.sourceSchemaVersion,
        sourceArtifactPath: record.sourceArtifactPath ?? null,
        sourceArtifactCommit: record.sourceArtifactCommit ?? null,
        sourceCommit: record.sourceCommit ?? null,
        provider: record.provider ?? null,
        generatedAt: record.generatedAt ?? null,
        createdAt: record.createdAt,
        reviewedSymbolsJson: json(record.reviewedSymbols),
        baselineMismatchCount: record.baselineMismatchCount,
        validationStatus: record.validationStatus,
        prohibitedLanguageStatus: record.prohibitedLanguageStatus,
        rawPayloadJson: json(record.rawPayload),
        compactSummaryJson: record.compactSummary ? json(record.compactSummary) : null,
        safetyFlagsJson: json(record.safetyFlags),
        limitationsJson: json(record.limitations),
        quarantineReasonsJson: json(record.quarantineReasons),
        auditTrailJson: json(record.auditTrail),
        recordJson: json(record),
      });
  }

  private replaceSymbolSummaries(
    record: JournalLevelAnalysisDeliveryRecord,
  ): void {
    this.db
      .prepare("DELETE FROM level_analysis_delivery_symbol_summaries WHERE delivery_id = ?")
      .run(record.id);

    for (const summary of record.perSymbolSummary) {
      this.db
        .prepare(
          `INSERT INTO level_analysis_delivery_symbol_summaries (
            id, delivery_id, symbol, provider, as_of_timestamp, as_of_iso,
            validation_status, summary_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          `${record.id}:${summary.symbol}`,
          record.id,
          summary.symbol.toUpperCase(),
          summary.provider ?? null,
          summary.asOfTimestamp,
          summary.asOfIso ?? null,
          record.validationStatus,
          json(summary),
        );
    }
  }
}
