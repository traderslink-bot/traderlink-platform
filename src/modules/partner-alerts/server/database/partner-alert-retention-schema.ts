import {
  PARTNER_ALERT_RETAINED_OPERATION_TABLE_SQL,
  PARTNER_ALERT_RETAINED_OPERATION_EXPIRY_INDEX_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_TABLE_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_EXPIRY_INDEX_SQL,
  PARTNER_ALERT_RETAINED_OPERATION_IMMUTABLE_TRIGGER_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_IMMUTABLE_TRIGGER_SQL
} from "./partner-alert-retained-evidence-schema";

/**
 * ID-free schema proposal for the owner-approved Partner Channels retention
 * policy. Importing this module only creates SQL strings. The Coordinator must
 * allocate the migration identity/order before registration or execution.
 *
 * The archive rows intentionally have no foreign key to platform_users. A
 * random lifecycle_ref groups retained evidence after the canonical lifecycle
 * has cleared its user_id. subject_binding_hmac_sha256 is produced with a
 * separately protected rotation key and exists only so an external tombstone
 * ledger can recognize a principal resurrected by restoring an older backup.
 */
export const PARTNER_ALERT_ERASURE_PRINCIPAL_STATEMENTS: readonly string[] = Object.freeze([
  `INSERT OR IGNORE INTO platform_users
    (user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc)
    VALUES('00000000-0000-4000-8000-000000000195','erasure','paid-partner-retained-principal-v1',
      'Removed Partner owner','disabled','2026-11-02T00:00:00.000Z','2026-11-02T00:00:00.000Z')`,
]);

export const PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS: readonly string[] = Object.freeze([
  PARTNER_ALERT_RETAINED_OPERATION_TABLE_SQL,
  PARTNER_ALERT_RETAINED_OPERATION_EXPIRY_INDEX_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_TABLE_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_EXPIRY_INDEX_SQL,
  `CREATE TABLE partner_alert_erasure_tombstones (
    tombstone_ref TEXT PRIMARY KEY,
    lifecycle_ref TEXT NOT NULL UNIQUE,
    subject_binding_hmac_sha256 TEXT NOT NULL UNIQUE CHECK(length(subject_binding_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL CHECK(length(binding_key_ref) BETWEEN 1 AND 120),
    erased_at_utc TEXT NOT NULL,
    last_affected_backup_expires_at_utc TEXT NOT NULL,
    retain_until_utc TEXT NOT NULL,
    source_operation_ref TEXT NOT NULL UNIQUE,
    CHECK(retain_until_utc>=last_affected_backup_expires_at_utc AND retain_until_utc>erased_at_utc),
    FOREIGN KEY(lifecycle_ref) REFERENCES platform_erasure_lifecycles(lifecycle_ref) ON DELETE RESTRICT
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX partner_alert_erasure_tombstone_expiry
    ON partner_alert_erasure_tombstones(retain_until_utc,tombstone_ref)`,
  `CREATE TABLE partner_alert_erasure_claim_successors (
    operation_ref TEXT NOT NULL,
    participant TEXT NOT NULL CHECK(length(participant) BETWEEN 1 AND 80),
    claim_binding_hmac_sha256 TEXT NOT NULL CHECK(length(claim_binding_hmac_sha256)=64),
    original_binding_hmac_sha256 TEXT NOT NULL CHECK(length(original_binding_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL CHECK(length(binding_key_ref) BETWEEN 1 AND 120),
    successor_kind TEXT NOT NULL CHECK(successor_kind IN ('role_cleanup','commercial_evidence',
      'operational_evidence','owner_disposition','delivery_settlement','restore_tombstone','private_disposition','transport_quiescence')),
    successor_ref TEXT NOT NULL CHECK(length(successor_ref) BETWEEN 1 AND 160),
    verified_at_utc TEXT NOT NULL,
    retain_until_utc TEXT NOT NULL,
    PRIMARY KEY(operation_ref,participant,claim_binding_hmac_sha256),
    CHECK(retain_until_utc>verified_at_utc),
    FOREIGN KEY(operation_ref) REFERENCES platform_erasure_module_operations(operation_ref) ON DELETE RESTRICT
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX partner_alert_erasure_claim_successor_expiry
    ON partner_alert_erasure_claim_successors(retain_until_utc,operation_ref)`,
  `CREATE TABLE partner_alert_retention_holds (
    hold_ref TEXT PRIMARY KEY,
    community_binding_hmac_sha256 TEXT NOT NULL CHECK(length(community_binding_hmac_sha256)=64),
    source_message_binding_hmac_sha256 TEXT NOT NULL CHECK(length(source_message_binding_hmac_sha256)=64),
    binding_key_ref TEXT NOT NULL CHECK(length(binding_key_ref) BETWEEN 1 AND 120),
    hold_kind TEXT NOT NULL CHECK(hold_kind IN ('dispute','refund_review','external_operation','recovery')),
    state TEXT NOT NULL CHECK(state IN ('active','released')),
    evidence_hmac_sha256 TEXT NOT NULL CHECK(length(evidence_hmac_sha256)=64),
    created_at_utc TEXT NOT NULL,
    released_at_utc TEXT,
    CHECK((state='active' AND released_at_utc IS NULL) OR (state='released' AND released_at_utc IS NOT NULL))
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX partner_alert_retention_hold_active
    ON partner_alert_retention_holds(state,hold_kind,community_binding_hmac_sha256,source_message_binding_hmac_sha256)`,
  `CREATE TABLE partner_alert_restore_reapplications (
    restore_ref TEXT PRIMARY KEY,
    restored_database_sha256 TEXT NOT NULL CHECK(length(restored_database_sha256)=64),
    tombstone_ledger_generation INTEGER NOT NULL CHECK(tombstone_ledger_generation>=1),
    tombstone_ledger_sha256 TEXT NOT NULL CHECK(length(tombstone_ledger_sha256)=64),
    binding_keyring_sha256 TEXT NOT NULL CHECK(length(binding_keyring_sha256)=64),
    required_key_count INTEGER NOT NULL CHECK(required_key_count>=0),
    covered_key_count INTEGER NOT NULL CHECK(covered_key_count=required_key_count),
    started_at_utc TEXT NOT NULL,
    applied_at_utc TEXT,
    verified_at_utc TEXT,
    state TEXT NOT NULL CHECK(state IN ('applying','verified','failed')),
    applied_tombstone_count INTEGER NOT NULL DEFAULT 0 CHECK(applied_tombstone_count>=0),
    UNIQUE(restore_ref,tombstone_ledger_generation,tombstone_ledger_sha256,binding_keyring_sha256),
    CHECK((state='applying' AND applied_at_utc IS NULL AND verified_at_utc IS NULL)
      OR (state='verified' AND applied_at_utc IS NOT NULL AND verified_at_utc IS NOT NULL)
      OR (state='failed' AND verified_at_utc IS NULL))
  ) STRICT, WITHOUT ROWID`,
  PARTNER_ALERT_RETAINED_OPERATION_IMMUTABLE_TRIGGER_SQL,
  PARTNER_ALERT_RETAINED_COMMERCIAL_IMMUTABLE_TRIGGER_SQL,
  `CREATE TRIGGER partner_alert_erasure_tombstone_immutable BEFORE UPDATE ON partner_alert_erasure_tombstones
    BEGIN SELECT RAISE(ABORT,'partner_alert_erasure_tombstone_immutable'); END`,
  `CREATE TRIGGER partner_alert_erasure_claim_successor_immutable BEFORE UPDATE ON partner_alert_erasure_claim_successors
    BEGIN SELECT RAISE(ABORT,'partner_alert_erasure_claim_successor_immutable'); END`,
  `CREATE TRIGGER partner_alert_retention_hold_transition BEFORE UPDATE ON partner_alert_retention_holds
    WHEN NEW.hold_ref IS NOT OLD.hold_ref OR NEW.community_binding_hmac_sha256 IS NOT OLD.community_binding_hmac_sha256
      OR NEW.source_message_binding_hmac_sha256 IS NOT OLD.source_message_binding_hmac_sha256
      OR NEW.binding_key_ref IS NOT OLD.binding_key_ref OR NEW.hold_kind IS NOT OLD.hold_kind
      OR NEW.evidence_hmac_sha256 IS NOT OLD.evidence_hmac_sha256 OR NEW.created_at_utc IS NOT OLD.created_at_utc
      OR OLD.state!='active' OR NEW.state!='released' OR NEW.released_at_utc IS NULL
    BEGIN SELECT RAISE(ABORT,'partner_alert_retention_hold_transition'); END`,
]);

/** Ten post-evidence objects only. The indexes preserve the original sixteen-statement
 * byte/order contract while excluding the six statements already registered by 0196. */
export const PARTNER_ALERT_POST_RETAINED_EVIDENCE_SCHEMA_STATEMENTS: readonly string[] = Object.freeze([
  ...PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS.slice(4, 11),
  ...PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS.slice(13, 16),
]);

/** Qualification consumer only. Never use this aggregate as a migration payload. */
export const PARTNER_ALERT_FULL_RETENTION_QUALIFICATION_STATEMENTS: readonly string[] =
  PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS;

export const PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS: readonly string[] = Object.freeze([
  `UPDATE partner_alert_source_messages
   SET retain_until_utc = '9999-12-31T23:59:59.999Z'
   WHERE state IN ('allowed','deleted')`,
  `UPDATE partner_alert_source_messages
   SET retain_until_utc = strftime('%Y-%m-%dT%H:%M:%fZ',
       (SELECT max(observed_at_utc) FROM partner_alert_source_revisions r
       WHERE r.community_id=partner_alert_source_messages.community_id
         AND r.source_channel_id=partner_alert_source_messages.source_channel_id
         AND r.message_id=partner_alert_source_messages.message_id),
       '+90 days')
   WHERE state='held' AND EXISTS(SELECT 1 FROM partner_alert_source_revisions r
       WHERE r.community_id=partner_alert_source_messages.community_id
         AND r.source_channel_id=partner_alert_source_messages.source_channel_id
         AND r.message_id=partner_alert_source_messages.message_id)`,
]);

export const PARTNER_ALERT_RETENTION_SCHEMA_DESCRIPTOR = Object.freeze({
  canRegister: false as const,
  migrationId: "0195_platform_paid_partner_retention_erasure" as const,
  executionOrder: 233 as const,
  predecessorMigrationId: "0194_traderlink_coaching_review_selection_lifecycle" as const,
  predecessorExecutionOrder: 232 as const,
  statements: PARTNER_ALERT_RETENTION_SCHEMA_STATEMENTS,
  backfillStatements: PARTNER_ALERT_RETENTION_SCHEMA_BACKFILL_STATEMENTS,
  existingRows: "allowed_and_deleted_hold_for_explicit_delivery_settlement_held_rejection_gets_90_days" as const,
  requiresExternalEncryptedTombstoneLedger: true as const,
  restoreTrafficGate: "verified_reapplication_required_before_runtime_open" as const,
  purgeGate: "deadline_and_terminal_delivery_and_no_active_dispute_external_or_recovery_hold" as const,
});
