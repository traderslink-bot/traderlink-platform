import "server-only";

import { createHash } from "node:crypto";
import type Database from "better-sqlite3";

import type { JournalAdminSensitiveAccessReason } from "@/src/modules/journal/contracts/journal-administration-contracts";
import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { PlatformAdminAuditRepository } from "@/src/modules/platform/server/administration/platform-admin-audit-repository";
import { resolvePlatformDatabaseConfig } from "@/src/modules/platform/server/database/platform-database-config";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import {
  readVerifiedJournalEvidenceObject,
  resolveJournalEvidenceVaultBoundary,
  type JournalEvidenceNamespace,
} from "../imports/journal-evidence-vault";
import {
  readJournalSupportSource,
  resolveJournalSupportSourceVault,
} from "./journal-support-source-vault";

export type JournalAdminImportInternalKind = "import_attempt" | "import_batch";

export type JournalConsentedSourceDownloadResult = Readonly<{
  bytes: Uint8Array;
  contentType: "text/csv" | "text/plain" | "application/csv";
  filename: string;
  replayed: boolean;
}>;

type SourceRow = Readonly<{
  support_consent_id: string;
  user_id: string;
  workspace_id: string;
  account_id: string;
  source_kind: "committed_evidence" | "support_object";
  consent_state: "active" | "revoked" | "expired";
  revision: number;
  expires_at_utc: string;
  import_batch_id: string | null;
  support_object_id: string | null;
  evidence_object_key: string | null;
  source_file_sha256: string;
  source_file_size_bytes: number;
  source_mime_type: string;
  object_key: string | null;
  purge_state: string | null;
}>;

type SourceReader = (input: Readonly<{
  source: SourceRow;
  databasePath: string;
  environment: NodeJS.ProcessEnv;
}>) => Uint8Array;

const DOWNLOAD_REASONS = new Set<JournalAdminSensitiveAccessReason>([
  "owner_support_review",
  "importer_diagnostics",
  "security_review",
  "data_integrity_review",
]);
const SOURCE_MIME_TYPES = new Set([
  "text/csv",
  "text/plain",
  "application/csv",
]);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function targetDigest(kind: JournalAdminImportInternalKind, internalId: string): string {
  return sha256(`journal-admin-target-v1\u001f${kind}\u001f${internalId}`);
}

function evidenceNamespace(key: string): JournalEvidenceNamespace {
  if (key.startsWith("ibkr/")) return "ibkr";
  if (key.startsWith("mapped_csv/")) return "mapped_csv";
  platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
}

function defaultSourceReader(input: Readonly<{
  source: SourceRow;
  databasePath: string;
  environment: NodeJS.ProcessEnv;
}>): Uint8Array {
  if (input.source.source_kind === "support_object") {
    if (!input.source.object_key || input.source.purge_state !== "active") {
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
    }
    return readJournalSupportSource({
      vault: resolveJournalSupportSourceVault({
        databasePath: input.databasePath,
        environment: input.environment,
      }),
      objectKey: input.source.object_key,
      expectedSha256: input.source.source_file_sha256,
      expectedSizeBytes: input.source.source_file_size_bytes,
    });
  }
  if (!input.source.evidence_object_key) {
    platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
  }
  const namespace = evidenceNamespace(input.source.evidence_object_key);
  return readVerifiedJournalEvidenceObject(
    resolveJournalEvidenceVaultBoundary({
      sourcePath: `${input.databasePath}.admin-source-read`,
      databasePath: input.databasePath,
      environment: input.environment,
    }),
    {
      evidenceObjectKey: input.source.evidence_object_key,
      sourceFileSha256: input.source.source_file_sha256,
      sourceFileSizeBytes: input.source.source_file_size_bytes,
      evidenceNamespace: namespace,
    },
  );
}

function sourceSelect(kind: JournalAdminImportInternalKind): string {
  const targetJoin = kind === "import_attempt"
    ? `JOIN journal_import_attempts target
  ON target.workspace_id = consent.workspace_id
 AND target.account_id = consent.account_id
 AND (
   (consent.source_kind = 'committed_evidence'
     AND consent.import_batch_id = target.committed_import_batch_id)
   OR (consent.source_kind = 'support_object' AND EXISTS (
     SELECT 1 FROM journal_statement_support_objects target_object
     WHERE target_object.workspace_id = target.workspace_id
       AND target_object.account_id = target.account_id
       AND target_object.import_attempt_id = target.import_attempt_id
       AND target_object.support_object_id = consent.support_object_id
   ))
 )`
    : `JOIN journal_import_batches target
  ON target.workspace_id = consent.workspace_id
 AND target.account_id = consent.account_id
 AND target.import_batch_id = consent.import_batch_id
 AND consent.source_kind = 'committed_evidence'`;
  const targetField = kind === "import_attempt"
    ? "target.import_attempt_id"
    : "target.import_batch_id";
  return `SELECT
 consent.support_consent_id, consent.user_id, consent.workspace_id,
 consent.account_id, consent.source_kind, consent.consent_state,
 consent.revision, consent.expires_at_utc, consent.import_batch_id,
 consent.support_object_id, batch.evidence_object_key,
 COALESCE(batch.source_file_sha256, object.source_file_sha256) AS source_file_sha256,
 COALESCE(batch.source_file_size_bytes, object.source_file_size_bytes) AS source_file_size_bytes,
 COALESCE(batch.source_mime_type, object.source_mime_type) AS source_mime_type,
 object.object_key, object.purge_state
FROM journal_statement_support_consents consent
${targetJoin}
LEFT JOIN journal_import_batches batch
  ON batch.workspace_id = consent.workspace_id
 AND batch.account_id = consent.account_id
 AND batch.import_batch_id = consent.import_batch_id
LEFT JOIN journal_statement_support_objects object
  ON object.workspace_id = consent.workspace_id
 AND object.account_id = consent.account_id
 AND object.support_object_id = consent.support_object_id
WHERE ${targetField} = ? AND consent.consent_state = 'active'
ORDER BY CASE consent.source_kind WHEN 'committed_evidence' THEN 0 ELSE 1 END,
 consent.granted_at_utc DESC, consent.support_consent_id
LIMIT 1`;
}

export class JournalConsentedSourceDownloadService {
  private readonly environment: NodeJS.ProcessEnv;
  private readonly databasePath: string;
  private readonly readSource: SourceReader;

  constructor(private readonly input: Readonly<{
    database: Database.Database;
    scope: JournalAdminScope;
    environment?: NodeJS.ProcessEnv;
    databasePath?: string;
    sourceReader?: SourceReader;
  }>) {
    this.environment = input.environment ?? process.env;
    this.databasePath = input.databasePath ?? resolvePlatformDatabaseConfig({
      environment: this.environment,
    }).databasePath;
    this.readSource = input.sourceReader ?? defaultSourceReader;
  }

  private source(
    kind: JournalAdminImportInternalKind,
    internalId: string,
  ): SourceRow | null {
    return this.input.database.prepare<[string], SourceRow>(sourceSelect(kind))
      .get(internalId) ?? null;
  }

  private appendAudit(input: Readonly<{
    kind: JournalAdminImportInternalKind;
    internalId: string;
    reasonCode: string;
    accessReason: JournalAdminSensitiveAccessReason;
    outcome: "success" | "denied" | "failed";
    correlationRefSha256: string;
    timestamp: string;
    details?: Readonly<Record<string, string | number | boolean | null>>;
  }>): string {
    return new PlatformAdminAuditRepository(this.input.database).append({
      actorKind: "platform_user",
      actorUserId: this.input.scope.userId,
      actorRole: this.input.scope.role,
      action: "consented_source_downloaded",
      targetKind: "support_source",
      targetRefSha256: targetDigest(input.kind, input.internalId),
      outcome: input.outcome,
      reasonCode: input.reasonCode,
      correlationRefSha256: input.correlationRefSha256,
      previewReceiptSha256: null,
      details: Object.freeze({
        access_reason: input.accessReason,
        ...(input.details ?? {}),
      }),
      createdAtUtc: input.timestamp,
    });
  }

  download(input: Readonly<{
    kind: JournalAdminImportInternalKind;
    internalId: string;
    importRef: string;
    reasonCode: JournalAdminSensitiveAccessReason;
    correlationRefSha256: string;
    timestamp: string;
  }>): JournalConsentedSourceDownloadResult {
    if (!DOWNLOAD_REASONS.has(input.reasonCode)) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    }
    const authorizedAt = Date.parse(this.input.scope.authorizedAtUtc);
    const timestamp = Date.parse(input.timestamp);
    const discordVerified = this.input.scope.discordOwnerVerifiedAtUtc === null
      ? null
      : Date.parse(this.input.scope.discordOwnerVerifiedAtUtc);
    if (!Number.isFinite(timestamp) || timestamp - authorizedAt > 5 * 60 * 1000 ||
      (this.input.scope.mode === "production_discord_owner" &&
        (discordVerified === null || timestamp - discordVerified > 5 * 60 * 1000))) {
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }
    const source = this.source(input.kind, input.internalId);
    if (!source || source.expires_at_utc <= input.timestamp) {
      this.appendAudit({
        ...input,
        accessReason: input.reasonCode,
        outcome: "denied",
        reasonCode: source ? "support_consent_expired" : "active_support_consent_missing",
      });
      platformFailure("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    }
    if (!SOURCE_MIME_TYPES.has(source.source_mime_type)) {
      this.appendAudit({
        ...input,
        accessReason: input.reasonCode,
        outcome: "failed",
        reasonCode: "support_source_type_unavailable",
      });
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
    }

    let bytes: Uint8Array;
    try {
      bytes = this.readSource({
        source,
        databasePath: this.databasePath,
        environment: this.environment,
      });
      if (bytes.byteLength !== source.source_file_size_bytes ||
        createHash("sha256").update(bytes).digest("hex") !== source.source_file_sha256) {
        platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT");
      }
    } catch (error) {
      const operation = () => {
        const auditEventId = this.appendAudit({
          ...input,
          accessReason: input.reasonCode,
          outcome: "failed",
          reasonCode: "support_source_unavailable",
        });
        const sequence = this.nextConsentSequence(source);
        this.appendConsentEvent({
          source,
          sequence,
          eventKind: "download_failed",
          auditEventId,
          reasonCode: "support_source_unavailable",
          timestamp: input.timestamp,
        });
      };
      if (this.input.database.inTransaction) operation();
      else this.input.database.transaction(operation).immediate();
      platformFailure("TRADERLINK_JOURNAL_EVIDENCE_VAULT_CONFLICT", {}, error);
    }

    const operation = (): boolean => {
      const current = this.source(input.kind, input.internalId);
      if (!current || current.support_consent_id !== source.support_consent_id ||
        current.revision !== source.revision || current.expires_at_utc <= input.timestamp) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      const replay = this.input.database.prepare<[
        string,
        string,
        string,
      ], { found: number }>(`SELECT 1 AS found
FROM platform_admin_audit_events
WHERE actor_user_id = ? AND action = 'consented_source_downloaded'
  AND target_ref_sha256 = ? AND correlation_ref_sha256 = ?
  AND outcome = 'success' LIMIT 1`).get(
        this.input.scope.userId,
        targetDigest(input.kind, input.internalId),
        input.correlationRefSha256,
      )?.found === 1;
      if (replay) return true;
      const auditEventId = this.appendAudit({
        ...input,
        accessReason: input.reasonCode,
        outcome: "success",
        reasonCode: "consented_source_download_completed",
        details: Object.freeze({ source_kind: source.source_kind }),
      });
      const sequence = this.nextConsentSequence(source);
      this.appendConsentEvent({
        source,
        sequence,
        eventKind: "download_started",
        auditEventId,
        reasonCode: input.reasonCode,
        timestamp: input.timestamp,
      });
      const updated = this.input.database.prepare(`UPDATE journal_statement_support_consents
SET revision = revision + 1,
 completed_download_count = completed_download_count + 1,
 latest_download_at_utc = ?, updated_at_utc = ?
WHERE support_consent_id = ? AND user_id = ? AND workspace_id = ?
 AND account_id = ? AND consent_state = 'active' AND revision = ?
 AND expires_at_utc > ?`).run(
        input.timestamp,
        input.timestamp,
        source.support_consent_id,
        source.user_id,
        source.workspace_id,
        source.account_id,
        source.revision,
        input.timestamp,
      );
      if (updated.changes !== 1) {
        platformFailure("TRADERLINK_JOURNAL_ADMIN_AUTHORITY_CONFLICT");
      }
      this.appendConsentEvent({
        source,
        sequence: sequence + 1,
        eventKind: "download_completed",
        auditEventId,
        reasonCode: input.reasonCode,
        timestamp: input.timestamp,
      });
      return false;
    };
    const replayed = this.input.database.inTransaction
      ? operation()
      : this.input.database.transaction(operation).immediate();
    return Object.freeze({
      bytes,
      contentType: source.source_mime_type as JournalConsentedSourceDownloadResult["contentType"],
      filename: `journal-source-${sha256(input.importRef).slice(0, 16)}.csv`,
      replayed,
    });
  }

  private nextConsentSequence(source: SourceRow): number {
    return this.input.database.prepare<[
      string,
      string,
      string,
    ], { sequence_number: number }>(`SELECT COALESCE(MAX(sequence_number), 0) + 1 AS sequence_number
FROM journal_statement_support_consent_events
WHERE workspace_id = ? AND account_id = ? AND support_consent_id = ?`).get(
      source.workspace_id,
      source.account_id,
      source.support_consent_id,
    )!.sequence_number;
  }

  private appendConsentEvent(input: Readonly<{
    source: SourceRow;
    sequence: number;
    eventKind: "download_started" | "download_completed" | "download_failed";
    auditEventId: string;
    reasonCode: string;
    timestamp: string;
  }>): void {
    this.input.database.prepare(`INSERT INTO journal_statement_support_consent_events (
 support_consent_event_id, workspace_id, account_id, support_consent_id,
 sequence_number, event_kind, prior_state, new_state, actor_kind,
 actor_user_id, reason_code, audit_event_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'active', 'active', 'journal_owner_admin',
 ?, ?, ?, ?)`).run(
      createCanonicalUuidV4(),
      input.source.workspace_id,
      input.source.account_id,
      input.source.support_consent_id,
      input.sequence,
      input.eventKind,
      this.input.scope.userId,
      input.reasonCode,
      input.auditEventId,
      input.timestamp,
    );
  }
}
