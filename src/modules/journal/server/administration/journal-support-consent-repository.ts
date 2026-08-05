import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

export type JournalSupportConsentRecord = Readonly<{
  supportConsentId: string;
  sourceKind: "committed_evidence" | "support_object";
  importBatchId: string | null;
  supportObjectId: string | null;
  state: "active" | "revoked" | "expired";
  revision: number;
  grantedAtUtc: string;
  expiresAtUtc: string;
  revokedAtUtc: string | null;
  completedDownloadCount: number;
  latestDownloadAtUtc: string | null;
  updatedAtUtc: string;
}>;

export type JournalSupportObjectRecord = Readonly<{
  supportObjectId: string;
  objectKey: string;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  sourceMimeType: "text/csv" | "text/plain" | "application/csv";
  purgeState: "active" | "purge_pending" | "purged" | "purge_failed";
  expiresAtUtc: string;
  purgeReceiptSha256: string | null;
  purgedAtUtc: string | null;
}>;

export type JournalSupportPurgeWorkItem = Readonly<{
  userId: string;
  workspaceId: string;
  accountId: string;
  supportConsentId: string;
  consentState: JournalSupportConsentRecord["state"];
  consentRevision: number;
  expiresAtUtc: string;
  purgeState: JournalSupportObjectRecord["purgeState"];
}>;

type ConsentRow = Readonly<{
  support_consent_id: string;
  source_kind: JournalSupportConsentRecord["sourceKind"];
  import_batch_id: string | null;
  support_object_id: string | null;
  consent_state: JournalSupportConsentRecord["state"];
  revision: number;
  granted_at_utc: string;
  expires_at_utc: string;
  revoked_at_utc: string | null;
  completed_download_count: number;
  latest_download_at_utc: string | null;
  updated_at_utc: string;
}>;

const SELECT_CONSENT = `SELECT support_consent_id, source_kind, import_batch_id,
 support_object_id, consent_state, revision, granted_at_utc, expires_at_utc,
 revoked_at_utc, completed_download_count, latest_download_at_utc, updated_at_utc
FROM journal_statement_support_consents`;

function mapConsent(row: ConsentRow): JournalSupportConsentRecord {
  return Object.freeze({
    supportConsentId: row.support_consent_id,
    sourceKind: row.source_kind,
    importBatchId: row.import_batch_id,
    supportObjectId: row.support_object_id,
    state: row.consent_state,
    revision: row.revision,
    grantedAtUtc: row.granted_at_utc,
    expiresAtUtc: row.expires_at_utc,
    revokedAtUtc: row.revoked_at_utc,
    completedDownloadCount: row.completed_download_count,
    latestDownloadAtUtc: row.latest_download_at_utc,
    updatedAtUtc: row.updated_at_utc,
  });
}

export class JournalSupportConsentRepository {
  constructor(private readonly database: Database.Database) {}

  immediate<T>(operation: () => T): T {
    return this.database.inTransaction
      ? operation()
      : this.database.transaction(operation).immediate();
  }

  findOwned(
    scope: WorkspaceAccessScope,
    supportConsentId: string,
  ): JournalSupportConsentRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[string, string, string, string], ConsentRow>(`
${SELECT_CONSENT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND support_consent_id = ?`).get(
      scope.userId,
      scope.workspaceId,
      accountId,
      supportConsentId,
    );
    return row ? mapConsent(row) : null;
  }

  findActiveForAttempt(
    scope: WorkspaceAccessScope,
    importAttemptId: string,
  ): JournalSupportConsentRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[
      string,
      string,
      string,
      string,
    ], ConsentRow>(`SELECT consent.support_consent_id, consent.source_kind,
 consent.import_batch_id, consent.support_object_id, consent.consent_state,
 consent.revision, consent.granted_at_utc, consent.expires_at_utc,
 consent.revoked_at_utc, consent.completed_download_count,
 consent.latest_download_at_utc, consent.updated_at_utc
FROM journal_statement_support_consents consent
JOIN journal_statement_support_objects object
  ON object.workspace_id = consent.workspace_id
 AND object.account_id = consent.account_id
 AND object.support_object_id = consent.support_object_id
WHERE consent.user_id = ? AND consent.workspace_id = ? AND consent.account_id = ?
  AND object.import_attempt_id = ? AND consent.source_kind = 'support_object'
  AND consent.consent_state = 'active'`).get(
      scope.userId,
      scope.workspaceId,
      accountId,
      importAttemptId,
    );
    return row ? mapConsent(row) : null;
  }

  findActiveForImportBatch(
    scope: WorkspaceAccessScope,
    importBatchId: string,
  ): JournalSupportConsentRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[
      string,
      string,
      string,
      string,
    ], ConsentRow>(`
${SELECT_CONSENT}
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND import_batch_id = ? AND source_kind = 'committed_evidence'
  AND consent_state = 'active'`).get(
      scope.userId,
      scope.workspaceId,
      accountId,
      importBatchId,
    );
    return row ? mapConsent(row) : null;
  }

  findOwnedSupportObject(
    scope: WorkspaceAccessScope,
    supportConsentId: string,
  ): JournalSupportObjectRecord | null {
    const accountId = scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    const row = this.database.prepare<[
      string,
      string,
      string,
      string,
    ], {
      support_object_id: string;
      object_key: string;
      source_file_sha256: string;
      source_file_size_bytes: number;
      source_mime_type: JournalSupportObjectRecord["sourceMimeType"];
      purge_state: JournalSupportObjectRecord["purgeState"];
      expires_at_utc: string;
      purge_receipt_sha256: string | null;
      purged_at_utc: string | null;
    }>(`SELECT object.support_object_id, object.object_key,
 object.source_file_sha256, object.source_file_size_bytes,
 object.source_mime_type, object.purge_state, object.expires_at_utc,
 object.purge_receipt_sha256, object.purged_at_utc
FROM journal_statement_support_consents consent
JOIN journal_statement_support_objects object
  ON object.workspace_id = consent.workspace_id
 AND object.account_id = consent.account_id
 AND object.support_object_id = consent.support_object_id
WHERE consent.user_id = ? AND consent.workspace_id = ? AND consent.account_id = ?
  AND consent.support_consent_id = ? AND consent.source_kind = 'support_object'`)
      .get(
        scope.userId,
        scope.workspaceId,
        accountId,
        supportConsentId,
      );
    return row ? Object.freeze({
      supportObjectId: row.support_object_id,
      objectKey: row.object_key,
      sourceFileSha256: row.source_file_sha256,
      sourceFileSizeBytes: row.source_file_size_bytes,
      sourceMimeType: row.source_mime_type,
      purgeState: row.purge_state,
      expiresAtUtc: row.expires_at_utc,
      purgeReceiptSha256: row.purge_receipt_sha256,
      purgedAtUtc: row.purged_at_utc,
    }) : null;
  }

  listSupportPurgeWork(
    timestamp: string,
    limit = 50,
  ): readonly JournalSupportPurgeWorkItem[] {
    assertCanonicalUtcTimestamp(timestamp, "timestamp");
    if (!Number.isSafeInteger(limit) || limit < 1 || limit > 200) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_purge_limit",
      });
    }
    const rows = this.database.prepare<[string, number], {
      user_id: string;
      workspace_id: string;
      account_id: string;
      support_consent_id: string;
      consent_state: JournalSupportConsentRecord["state"];
      revision: number;
      expires_at_utc: string;
      purge_state: JournalSupportObjectRecord["purgeState"];
    }>(`SELECT consent.user_id, consent.workspace_id, consent.account_id,
 consent.support_consent_id, consent.consent_state, consent.revision,
 consent.expires_at_utc, object.purge_state
FROM journal_statement_support_consents consent
JOIN journal_statement_support_objects object
  ON object.workspace_id = consent.workspace_id
 AND object.account_id = consent.account_id
 AND object.support_object_id = consent.support_object_id
WHERE (consent.consent_state = 'active' AND consent.expires_at_utc <= ?
       AND object.purge_state = 'active')
   OR (consent.consent_state IN ('revoked', 'expired')
       AND object.purge_state IN ('purge_pending', 'purge_failed'))
ORDER BY consent.expires_at_utc, consent.support_consent_id
LIMIT ?`).all(timestamp, limit);
    return Object.freeze(rows.map((row) => Object.freeze({
      userId: row.user_id,
      workspaceId: row.workspace_id,
      accountId: row.account_id,
      supportConsentId: row.support_consent_id,
      consentState: row.consent_state,
      consentRevision: row.revision,
      expiresAtUtc: row.expires_at_utc,
      purgeState: row.purge_state,
    })));
  }

  hasSupportObjectKey(objectKey: string): boolean {
    const row = this.database.prepare<[string], { found: number }>(`
SELECT 1 AS found FROM journal_statement_support_objects
WHERE object_key = ? LIMIT 1`).get(objectKey);
    return row?.found === 1;
  }

  createSupportObject(input: Readonly<{
    scope: WorkspaceAccessScope;
    importAttemptId: string;
    objectKey: string;
    sourceFileSha256: string;
    sourceFileSizeBytes: number;
    sourceMimeType: "text/csv" | "text/plain" | "application/csv";
    expiresAtUtc: string;
    timestamp: string;
  }>): string {
    const accountId = input.scope.activeAccountId;
    if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
    assertCanonicalUtcTimestamp(input.expiresAtUtc, "expiresAtUtc");
    const attempt = this.database.prepare<
      [string, string, string, string],
      { source_file_sha256: string; source_file_size_bytes: number }
    >(`SELECT source_file_sha256, source_file_size_bytes
FROM journal_import_attempts
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND import_attempt_id = ?`).get(
      input.scope.userId,
      input.scope.workspaceId,
      accountId,
      input.importAttemptId,
    );
    if (!attempt || attempt.source_file_sha256 !== input.sourceFileSha256 ||
      attempt.source_file_size_bytes !== input.sourceFileSizeBytes) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_source_attempt_mismatch",
      });
    }
    const supportObjectId = createCanonicalUuidV4();
    try {
      this.database.prepare(`INSERT INTO journal_statement_support_objects (
 support_object_id, workspace_id, account_id, import_attempt_id, object_key,
 source_file_sha256, source_file_size_bytes, source_mime_type, purge_state,
 expires_at_utc, purge_receipt_sha256, created_at_utc, updated_at_utc,
 purged_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, NULL, ?, ?, NULL)`)
        .run(
          supportObjectId,
          input.scope.workspaceId,
          accountId,
          input.importAttemptId,
          input.objectKey,
          input.sourceFileSha256,
          input.sourceFileSizeBytes,
          input.sourceMimeType,
          input.expiresAtUtc,
          input.timestamp,
          input.timestamp,
        );
    } catch (error) {
      platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_object_conflict",
      }, error);
    }
    return supportObjectId;
  }

  grant(input: Readonly<{
    scope: WorkspaceAccessScope;
    sourceKind: JournalSupportConsentRecord["sourceKind"];
    importBatchId: string | null;
    supportObjectId: string | null;
    expiresAtUtc: string;
    timestamp: string;
  }>): JournalSupportConsentRecord {
    return this.immediate(() => {
      const accountId = input.scope.activeAccountId;
      if (!accountId) platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      assertCanonicalUtcTimestamp(input.expiresAtUtc, "expiresAtUtc");
      const duration = Date.parse(input.expiresAtUtc) - Date.parse(input.timestamp);
      if (duration <= 0 || duration > 90 * 24 * 60 * 60 * 1000) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_consent_expiry_invalid",
        });
      }
      if (input.sourceKind === "support_object") {
        const source = this.database.prepare<[
          string,
          string,
          string,
          string,
          string,
        ], {
          support_object_id: string;
        }>(`SELECT object.support_object_id
FROM journal_statement_support_objects object
JOIN journal_import_attempts attempt
  ON attempt.workspace_id = object.workspace_id
 AND attempt.account_id = object.account_id
 AND attempt.import_attempt_id = object.import_attempt_id
WHERE attempt.user_id = ? AND object.workspace_id = ? AND object.account_id = ?
  AND object.support_object_id = ? AND object.purge_state = 'active'
  AND object.expires_at_utc >= ?`).get(
          input.scope.userId,
          input.scope.workspaceId,
          accountId,
          input.supportObjectId!,
          input.expiresAtUtc,
        );
        if (!source || input.importBatchId !== null) platformFailure(
          "TRADERLINK_JOURNAL_IMPORT_CONFLICT",
          { reason: "support_object_unavailable" },
        );
      } else {
        const batch = this.database.prepare<[string, string, string], {
          import_batch_id: string;
        }>(`SELECT import_batch_id FROM journal_import_batches
WHERE workspace_id = ? AND account_id = ? AND import_batch_id = ?`)
          .get(input.scope.workspaceId, accountId, input.importBatchId!);
        if (!batch || input.supportObjectId !== null) platformFailure(
          "TRADERLINK_JOURNAL_IMPORT_CONFLICT",
          { reason: "committed_evidence_unavailable" },
        );
      }
      const supportConsentId = createCanonicalUuidV4();
      this.database.prepare(`INSERT INTO journal_statement_support_consents (
 support_consent_id, user_id, workspace_id, account_id, source_kind,
 import_batch_id, support_object_id, purpose, consent_state, revision,
 granted_at_utc, expires_at_utc, revoked_at_utc, revoke_reason_code,
 completed_download_count, latest_download_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'importer_development', 'active', 1,
 ?, ?, NULL, NULL, 0, NULL, ?)`).run(
        supportConsentId,
        input.scope.userId,
        input.scope.workspaceId,
        accountId,
        input.sourceKind,
        input.importBatchId,
        input.supportObjectId,
        input.timestamp,
        input.expiresAtUtc,
        input.timestamp,
      );
      this.appendEvent({
        scope: input.scope,
        supportConsentId,
        sequenceNumber: 1,
        eventKind: "granted",
        priorState: null,
        newState: "active",
        actorKind: "source_user",
        actorUserId: input.scope.userId,
        reasonCode: "importer_development",
        timestamp: input.timestamp,
      });
      return this.findOwned(input.scope, supportConsentId)!;
    });
  }

  revoke(input: Readonly<{
    scope: WorkspaceAccessScope;
    supportConsentId: string;
    expectedRevision: number;
    timestamp: string;
  }>): JournalSupportConsentRecord {
    return this.immediate(() => {
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      const current = this.findOwned(input.scope, input.supportConsentId);
      if (!current || current.state !== "active" ||
        current.revision !== input.expectedRevision) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_consent_revision",
        });
      }
      const accountId = input.scope.activeAccountId!;
      const updated = this.database.prepare(`UPDATE journal_statement_support_consents
SET consent_state = 'revoked', revision = revision + 1,
 revoked_at_utc = ?, revoke_reason_code = 'source_user_revoked', updated_at_utc = ?
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND support_consent_id = ? AND consent_state = 'active' AND revision = ?`)
        .run(
          input.timestamp,
          input.timestamp,
          input.scope.userId,
          input.scope.workspaceId,
          accountId,
          input.supportConsentId,
          input.expectedRevision,
        );
      if (updated.changes !== 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_consent_revision",
      });
      this.appendEvent({
        scope: input.scope,
        supportConsentId: input.supportConsentId,
        sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
        eventKind: "revoked",
        priorState: "active",
        newState: "revoked",
        actorKind: "source_user",
        actorUserId: input.scope.userId,
        reasonCode: "source_user_revoked",
        timestamp: input.timestamp,
      });
      if (current.sourceKind === "support_object") {
        this.database.prepare(`UPDATE journal_statement_support_objects
SET purge_state = 'purge_pending', updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND support_object_id = ?
  AND purge_state = 'active'`).run(
          input.timestamp,
          input.scope.workspaceId,
          accountId,
          current.supportObjectId,
        );
        this.appendEvent({
          scope: input.scope,
          supportConsentId: input.supportConsentId,
          sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
          eventKind: "purge_requested",
          priorState: "revoked",
          newState: "revoked",
          actorKind: "system",
          actorUserId: null,
          reasonCode: "consent_revoked",
          timestamp: input.timestamp,
        });
      }
      return this.findOwned(input.scope, input.supportConsentId)!;
    });
  }

  expire(input: Readonly<{
    scope: WorkspaceAccessScope;
    supportConsentId: string;
    expectedRevision: number;
    timestamp: string;
  }>): JournalSupportConsentRecord {
    return this.immediate(() => {
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      const current = this.findOwned(input.scope, input.supportConsentId);
      if (!current || current.state !== "active" ||
        current.revision !== input.expectedRevision ||
        current.expiresAtUtc > input.timestamp) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_consent_expiry",
        });
      }
      const accountId = input.scope.activeAccountId!;
      const updated = this.database.prepare(`UPDATE journal_statement_support_consents
SET consent_state = 'expired', revision = revision + 1,
 revoked_at_utc = ?, revoke_reason_code = 'consent_expired', updated_at_utc = ?
WHERE user_id = ? AND workspace_id = ? AND account_id = ?
  AND support_consent_id = ? AND consent_state = 'active' AND revision = ?
  AND expires_at_utc <= ?`).run(
        input.timestamp,
        input.timestamp,
        input.scope.userId,
        input.scope.workspaceId,
        accountId,
        input.supportConsentId,
        input.expectedRevision,
        input.timestamp,
      );
      if (updated.changes !== 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_consent_expiry",
      });
      this.appendEvent({
        scope: input.scope,
        supportConsentId: input.supportConsentId,
        sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
        eventKind: "expired",
        priorState: "active",
        newState: "expired",
        actorKind: "system",
        actorUserId: null,
        reasonCode: "consent_expired",
        timestamp: input.timestamp,
      });
      if (current.sourceKind === "support_object") {
        this.database.prepare(`UPDATE journal_statement_support_objects
SET purge_state = 'purge_pending', updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND support_object_id = ?
  AND purge_state = 'active'`).run(
          input.timestamp,
          input.scope.workspaceId,
          accountId,
          current.supportObjectId,
        );
        this.appendEvent({
          scope: input.scope,
          supportConsentId: input.supportConsentId,
          sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
          eventKind: "purge_requested",
          priorState: "expired",
          newState: "expired",
          actorKind: "system",
          actorUserId: null,
          reasonCode: "consent_expired",
          timestamp: input.timestamp,
        });
      }
      return this.findOwned(input.scope, input.supportConsentId)!;
    });
  }

  recordSupportObjectPurged(input: Readonly<{
    scope: WorkspaceAccessScope;
    supportConsentId: string;
    purgeReceiptSha256: string;
    timestamp: string;
  }>): JournalSupportObjectRecord {
    return this.immediate(() => {
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      if (!/^[0-9a-f]{64}$/u.test(input.purgeReceiptSha256)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_purge_receipt",
        });
      }
      const object = this.findOwnedSupportObject(
        input.scope,
        input.supportConsentId,
      );
      const consent = this.findOwned(input.scope, input.supportConsentId);
      if (!object || !consent || consent.state === "active" ||
        !["purge_pending", "purge_failed"].includes(object.purgeState)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_purge_state",
        });
      }
      const updated = this.database.prepare(`UPDATE journal_statement_support_objects
SET purge_state = 'purged', purge_receipt_sha256 = ?, purged_at_utc = ?,
 updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND support_object_id = ?
  AND purge_state IN ('purge_pending', 'purge_failed')`).run(
        input.purgeReceiptSha256,
        input.timestamp,
        input.timestamp,
        input.scope.workspaceId,
        input.scope.activeAccountId,
        object.supportObjectId,
      );
      if (updated.changes !== 1) platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
        reason: "support_purge_state",
      });
      this.appendEvent({
        scope: input.scope,
        supportConsentId: input.supportConsentId,
        sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
        eventKind: "purged",
        priorState: consent.state,
        newState: consent.state,
        actorKind: "system",
        actorUserId: null,
        reasonCode: "support_source_purged",
        timestamp: input.timestamp,
      });
      return this.findOwnedSupportObject(input.scope, input.supportConsentId)!;
    });
  }

  recordSupportObjectPurgeFailed(input: Readonly<{
    scope: WorkspaceAccessScope;
    supportConsentId: string;
    timestamp: string;
  }>): JournalSupportObjectRecord {
    return this.immediate(() => {
      assertCanonicalUtcTimestamp(input.timestamp, "timestamp");
      const object = this.findOwnedSupportObject(input.scope, input.supportConsentId);
      const consent = this.findOwned(input.scope, input.supportConsentId);
      if (!object || !consent || consent.state === "active" ||
        !["purge_pending", "purge_failed"].includes(object.purgeState)) {
        platformFailure("TRADERLINK_JOURNAL_IMPORT_CONFLICT", {
          reason: "support_purge_state",
        });
      }
      this.database.prepare(`UPDATE journal_statement_support_objects
SET purge_state = 'purge_failed', updated_at_utc = ?
WHERE workspace_id = ? AND account_id = ? AND support_object_id = ?
  AND purge_state IN ('purge_pending', 'purge_failed')`).run(
        input.timestamp,
        input.scope.workspaceId,
        input.scope.activeAccountId,
        object.supportObjectId,
      );
      this.appendEvent({
        scope: input.scope,
        supportConsentId: input.supportConsentId,
        sequenceNumber: this.nextEventSequence(input.scope, input.supportConsentId),
        eventKind: "purge_failed",
        priorState: consent.state,
        newState: consent.state,
        actorKind: "system",
        actorUserId: null,
        reasonCode: "support_source_purge_failed",
        timestamp: input.timestamp,
      });
      return this.findOwnedSupportObject(input.scope, input.supportConsentId)!;
    });
  }

  private nextEventSequence(
    scope: WorkspaceAccessScope,
    supportConsentId: string,
  ): number {
    const row = this.database.prepare<[string, string, string], { sequence: number }>(`
SELECT COALESCE(MAX(sequence_number), 0) + 1 AS sequence
FROM journal_statement_support_consent_events
WHERE workspace_id = ? AND account_id = ? AND support_consent_id = ?`).get(
      scope.workspaceId,
      scope.activeAccountId!,
      supportConsentId,
    );
    return row?.sequence ?? 1;
  }

  private appendEvent(input: Readonly<{
    scope: WorkspaceAccessScope;
    supportConsentId: string;
    sequenceNumber: number;
    eventKind: "granted" | "revoked" | "expired" | "purge_requested" |
      "purged" | "purge_failed";
    priorState: JournalSupportConsentRecord["state"] | null;
    newState: JournalSupportConsentRecord["state"];
    actorKind: "source_user" | "system";
    actorUserId: string | null;
    reasonCode: string;
    timestamp: string;
  }>): void {
    this.database.prepare(`INSERT INTO journal_statement_support_consent_events (
 support_consent_event_id, workspace_id, account_id, support_consent_id,
 sequence_number, event_kind, prior_state, new_state, actor_kind,
 actor_user_id, reason_code, audit_event_id, created_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)`).run(
      createCanonicalUuidV4(),
      input.scope.workspaceId,
      input.scope.activeAccountId,
      input.supportConsentId,
      input.sequenceNumber,
      input.eventKind,
      input.priorState,
      input.newState,
      input.actorKind,
      input.actorUserId,
      input.reasonCode,
      input.timestamp,
    );
  }
}
