/** SQL for the Coordinator-reserved, still-unapplied0183 descriptor.
 * Job rows deliberately have no FK to the privacy roots that they outlive.
 */
export const platformErasureRecoverySchemaStatements = Object.freeze([
  `CREATE TABLE platform_erasure_operations (
    operation_id TEXT PRIMARY KEY NOT NULL,
    target_binding_sha256 TEXT,
    action TEXT NOT NULL CHECK(action IN ('trade_tracker_account','demo_trade_tracker_account','traderlink_account')),
    state TEXT NOT NULL CHECK(state IN ('purge_pending','complete')),
    active_slot INTEGER UNIQUE CHECK(active_slot IS NULL OR active_slot=1),
    created_at_utc TEXT NOT NULL,
    completed_at_utc TEXT,
    object_count INTEGER NOT NULL CHECK(object_count>=0),
    CHECK((state='purge_pending' AND active_slot=1 AND completed_at_utc IS NULL)
       OR (state='complete' AND active_slot IS NULL AND completed_at_utc IS NOT NULL AND target_binding_sha256 IS NULL))
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_erasure_objects (
    operation_id TEXT NOT NULL REFERENCES platform_erasure_operations(operation_id),
    ordinal INTEGER NOT NULL CHECK(ordinal>=0),
    kind TEXT NOT NULL CHECK(kind IN ('primary_evidence','support_source')),
    object_key TEXT NOT NULL,
    sha256 TEXT NOT NULL CHECK(length(sha256)=64),
    size_bytes INTEGER NOT NULL CHECK(size_bytes>0),
    vault_identity TEXT NOT NULL,
    phase TEXT NOT NULL CHECK(phase IN ('prepared','unlink_pending','purged','retained')),
    PRIMARY KEY(operation_id,ordinal),
    UNIQUE(kind,object_key)
  ) STRICT, WITHOUT ROWID`,
  `CREATE TABLE platform_erasure_history (
    receipt_id TEXT PRIMARY KEY NOT NULL,
    member_user_id TEXT NOT NULL,
    member_display_name TEXT NOT NULL CHECK(length(member_display_name)<=200),
    action TEXT NOT NULL CHECK(action IN ('trade_tracker_account','demo_trade_tracker_account','traderlink_account')),
    phase TEXT NOT NULL CHECK(phase IN ('accepted','not_deleted','committed_cleanup_pending','complete','outcome_unknown')),
    accepted_at_utc TEXT NOT NULL,
    updated_at_utc TEXT NOT NULL,
    committed_at_utc TEXT,
    finished_at_utc TEXT,
    expires_at_utc TEXT NOT NULL,
    safe_failure_kind TEXT CHECK(safe_failure_kind IS NULL OR safe_failure_kind IN ('transaction_rolled_back','cleanup_unavailable','interrupted_before_receipt')),
    CHECK(expires_at_utc>accepted_at_utc)
  ) STRICT, WITHOUT ROWID`,
  `CREATE INDEX platform_erasure_history_recent ON platform_erasure_history(accepted_at_utc DESC,receipt_id DESC)`,
  `CREATE INDEX platform_erasure_history_member_recent ON platform_erasure_history(member_user_id,accepted_at_utc DESC,receipt_id DESC)`,
  `CREATE INDEX platform_erasure_history_expiry ON platform_erasure_history(expires_at_utc,receipt_id)`,
  `CREATE INDEX platform_erasure_history_phase_recent ON platform_erasure_history(phase,accepted_at_utc,receipt_id)`,
]);
