import { existsSync, statfsSync, statSync } from "node:fs";
import { dirname } from "node:path";

import type {
  JournalAdminOperationSummary,
  JournalAdminSystemStatus,
} from "@/src/modules/journal/contracts/journal-administration-contracts";
import {
  journalAdminCoverage,
  journalAdminReference,
  parseSafeCountObject,
  type JournalAdminReadContext,
} from "@/src/modules/journal/server/administration/journal-admin-read-helpers";
import { readAppliedPlatformMigrations } from "../database/platform-migration-registry";

type ProcessingRow = Readonly<{
  machine_processing_count: number;
  user_waiting_count: number;
  oldest_machine_processing_at_utc: string | null;
}>;
type DurationRow = Readonly<{ duration_ms: number }>;
type OperationRow = Readonly<{
  operational_event_id: string;
  operation_kind: string;
  state: string;
  outcome_code: string;
  application_version: string | null;
  safe_counts_json: string;
  started_at_utc: string;
  completed_at_utc: string | null;
}>;

function percentile(values: readonly number[], percentileValue: number): number | null {
  if (values.length === 0) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const index = Math.min(
    ordered.length - 1,
    Math.max(0, Math.ceil((percentileValue / 100) * ordered.length) - 1),
  );
  return ordered[index] ?? null;
}

function safeApplicationVersion(environment: NodeJS.ProcessEnv): string | null {
  const candidate = environment.VERCEL_GIT_COMMIT_SHA ??
    environment.TRADERLINK_APPLICATION_VERSION ??
    environment.npm_package_version ?? null;
  return candidate && candidate.length <= 120 &&
      !/[\u0000-\u001f\u007f]/u.test(candidate)
    ? candidate
    : null;
}

function environmentLabel(
  environment: NodeJS.ProcessEnv,
): "local" | "preview" | "production" {
  if (environment.VERCEL_ENV === "production" ||
    (environment.NODE_ENV === "production" && !environment.VERCEL_ENV)) {
    return "production";
  }
  if (environment.VERCEL_ENV === "preview") return "preview";
  return "local";
}

export class PlatformAdminSystemService {
  constructor(
    private readonly context: JournalAdminReadContext,
    private readonly environment: NodeJS.ProcessEnv = process.env,
  ) {}

  read(): JournalAdminSystemStatus {
    const migrations = readAppliedPlatformMigrations(this.context.database);
    let databaseBytes: number | null = null;
    let walBytes: number | null = null;
    let volumeTotalBytes: number | null = null;
    let volumeFreeBytes: number | null = null;
    let storageNote: string | null = null;
    try {
      const databasePath = this.context.database.name;
      databaseBytes = statSync(databasePath).size;
      const walPath = `${databasePath}-wal`;
      walBytes = existsSync(walPath) ? statSync(walPath).size : 0;
      const volume = statfsSync(dirname(databasePath));
      volumeTotalBytes = Number(volume.blocks) * Number(volume.bsize);
      volumeFreeBytes = Number(volume.bavail) * Number(volume.bsize);
      if (!Number.isSafeInteger(volumeTotalBytes) || !Number.isSafeInteger(volumeFreeBytes)) {
        volumeTotalBytes = null;
        volumeFreeBytes = null;
        storageNote = "Volume capacity is unavailable on this runtime.";
      }
    } catch {
      storageNote = "Storage measurements are unavailable on this runtime.";
    }
    const processing = this.context.database.prepare<[], ProcessingRow>(`SELECT
  COALESCE(SUM(CASE WHEN current_state IN ('received', 'inspecting', 'committing') THEN 1 ELSE 0 END), 0)
    AS machine_processing_count,
  COALESCE(SUM(CASE WHEN current_state IN ('awaiting_mapping', 'preview_ready') THEN 1 ELSE 0 END), 0)
    AS user_waiting_count,
  MIN(CASE WHEN current_state IN ('received', 'inspecting', 'committing')
    THEN admitted_at_utc END) AS oldest_machine_processing_at_utc
FROM journal_import_attempts`).get()!;
    const durations = this.context.database.prepare<[], DurationRow>(`SELECT
  CAST((julianday(terminal_at_utc) - julianday(admitted_at_utc)) * 86400000 AS INTEGER) AS duration_ms
FROM journal_import_attempts
WHERE terminal_at_utc IS NOT NULL
ORDER BY terminal_at_utc DESC, import_attempt_id DESC LIMIT 1000`).all()
      .map((row) => Math.max(0, row.duration_ms));
    const operations = this.context.database.prepare<[], OperationRow>(`SELECT
  operational_event_id, operation_kind, state, outcome_code,
  application_version, safe_counts_json, started_at_utc, completed_at_utc
FROM platform_operational_events
ORDER BY created_at_utc DESC, operational_event_id DESC LIMIT 50`).all()
      .map((row): JournalAdminOperationSummary => Object.freeze({
        operationRef: journalAdminReference(
          this.context,
          "operational_event",
          row.operational_event_id,
        ),
        kind: row.operation_kind,
        state: row.state,
        outcomeCode: row.outcome_code,
        applicationVersion: row.application_version,
        safeCounts: parseSafeCountObject(row.safe_counts_json),
        startedAtUtc: row.started_at_utc,
        completedAtUtc: row.completed_at_utc,
      }));
    const unresolvedFailures = this.context.database.prepare<[], { count: number }>(`SELECT
  (SELECT COUNT(*) FROM journal_import_attempts WHERE current_state = 'system_failed') +
  (SELECT COUNT(*) FROM platform_operational_events event
    WHERE event.state = 'failed' AND NOT EXISTS (
      SELECT 1 FROM platform_operational_events later
      WHERE later.operation_kind = event.operation_kind
        AND later.operation_ref_sha256 = event.operation_ref_sha256
        AND later.created_at_utc > event.created_at_utc)) AS count`).get()!.count;
    const discord = Object.freeze({
      guildConfigured: Boolean(this.environment.DISCORD_GUILD_ID),
      applicationConfigured: Boolean(this.environment.DISCORD_CLIENT_ID),
      clientSecretConfigured: Boolean(this.environment.DISCORD_CLIENT_SECRET),
      publicLoginReady: Boolean(
        this.environment.DISCORD_GUILD_ID &&
        this.environment.DISCORD_CLIENT_ID &&
        this.environment.DISCORD_CLIENT_SECRET,
      ),
    });
    return Object.freeze({
      coverage: journalAdminCoverage(this.context, storageNote),
      application: Object.freeze({
        environment: environmentLabel(this.environment),
        version: safeApplicationVersion(this.environment),
      }),
      schema: Object.freeze({
        migrationCount: migrations.length,
        latestMigrationId: migrations.at(-1)?.migration_id ?? null,
        schemaDigest: migrations.at(-1)?.post_schema_sha256 ?? null,
        driftState: "verified_at_open" as const,
      }),
      storage: Object.freeze({
        databaseBytes,
        walBytes,
        volumeTotalBytes,
        volumeFreeBytes,
        note: storageNote,
      }),
      processing: Object.freeze({
        machineProcessingCount: processing.machine_processing_count,
        userWaitingCount: processing.user_waiting_count,
        oldestMachineProcessingAtUtc: processing.oldest_machine_processing_at_utc,
        completedDurationP50Ms: percentile(durations, 50),
        completedDurationP95Ms: percentile(durations, 95),
      }),
      discord,
      unresolvedOperationalFailureCount: unresolvedFailures,
      latestOperations: Object.freeze(operations),
    });
  }
}
