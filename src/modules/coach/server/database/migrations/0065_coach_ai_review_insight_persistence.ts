import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string, nullable = false): string {
  const check = `length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${check}${nullable ? ")" : ")"})`;
}

function digestCheck(column: string, nullable = false): string {
  const check = `length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${check}${nullable ? ")" : ")"})`;
}

function nonnegativeMoneyCheck(column: string, nullable = false): string {
  const check = `length(${column}) BETWEEN 1 AND 40 AND ${column} NOT GLOB '*[^0-9.]*' AND ${column} NOT GLOB '*.*.*' AND CAST(${column} AS REAL) >= 0`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${check}${nullable ? ")" : ")"})`;
}

const sql = `DROP TRIGGER coach_ai_review_period_requests_v2_issued_scope;

ALTER TABLE coach_ai_review_period_requests_v2
ADD COLUMN generation_contract_version TEXT NOT NULL DEFAULT 'openai_direct_v2'
CHECK (generation_contract_version IN ('openai_direct_v2', 'insight_selection_v3'));

ALTER TABLE coach_ai_review_generation_attempts_v2
ADD COLUMN generation_contract_version TEXT NOT NULL DEFAULT 'openai_direct_v2'
CHECK (generation_contract_version IN ('openai_direct_v2', 'insight_selection_v3'));

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN reservation_overrun INTEGER NOT NULL DEFAULT 0
CHECK (reservation_overrun IN (0, 1));

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN input_token_overrun INTEGER NOT NULL DEFAULT 0
CHECK (input_token_overrun >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN output_token_overrun INTEGER NOT NULL DEFAULT 0
CHECK (output_token_overrun >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN total_token_overrun INTEGER NOT NULL DEFAULT 0
CHECK (total_token_overrun >= 0);

ALTER TABLE coach_ai_review_generation_attempt_receipts_v2
ADD COLUMN cost_overrun_usd TEXT ${nonnegativeMoneyCheck("cost_overrun_usd", true)};

ALTER TABLE coach_ai_review_budget_controls
ADD COLUMN provider_calls_blocked INTEGER NOT NULL DEFAULT 0
CHECK (provider_calls_blocked IN (0, 1));

ALTER TABLE coach_ai_review_budget_controls
ADD COLUMN provider_calls_blocked_reason TEXT CHECK (
  provider_calls_blocked_reason IS NULL OR provider_calls_blocked_reason =
    'TRADERLINK_COACH_RESERVATION_OVERRUN'
);

ALTER TABLE coach_ai_review_budget_controls
ADD COLUMN provider_calls_blocked_at_utc TEXT
${utcCheck("provider_calls_blocked_at_utc", true)};

CREATE TABLE coach_ai_review_generation_contract_state (
  state_key TEXT PRIMARY KEY CHECK (state_key = 'singleton'),
  active_generation_contract_version TEXT NOT NULL
    CHECK (active_generation_contract_version IN ('openai_direct_v2', 'insight_selection_v3')),
  minimum_reader_contract_version TEXT NOT NULL
    CHECK (minimum_reader_contract_version IN ('openai_direct_v2', 'insight_selection_v3')),
  transition_generation INTEGER NOT NULL CHECK (transition_generation IN (1, 2)),
  transitioned_at_utc TEXT NOT NULL ${utcCheck("transitioned_at_utc")},
  CHECK ((transition_generation = 1
      AND active_generation_contract_version = 'openai_direct_v2'
      AND minimum_reader_contract_version = 'openai_direct_v2')
    OR (transition_generation = 2
      AND active_generation_contract_version = 'insight_selection_v3'
      AND minimum_reader_contract_version = 'insight_selection_v3'))
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_review_generation_contract_state (
  state_key, active_generation_contract_version,
  minimum_reader_contract_version, transition_generation, transitioned_at_utc
) VALUES (
  'singleton', 'openai_direct_v2', 'openai_direct_v2', 1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

CREATE TABLE coach_ai_review_dispatch_recovery_state (
  state_key TEXT PRIMARY KEY CHECK (state_key = 'singleton'),
  recovery_epoch TEXT NOT NULL CHECK (
    length(recovery_epoch) = 64 AND recovery_epoch = lower(recovery_epoch)
    AND recovery_epoch NOT GLOB '*[^0-9a-f]*'
  ),
  recovery_generation INTEGER NOT NULL CHECK (recovery_generation >= 1),
  transitioned_at_utc TEXT NOT NULL ${utcCheck("transitioned_at_utc")}
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_review_dispatch_recovery_state (
  state_key, recovery_epoch, recovery_generation, transitioned_at_utc
) VALUES (
  'singleton', lower(hex(randomblob(32))), 1,
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
);

CREATE TABLE coach_ai_review_insight_snapshots (
  coach_ai_review_insight_snapshot_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_insight_snapshot_id")},
  coach_ai_review_period_request_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  generation_contract_version TEXT NOT NULL
    CHECK (generation_contract_version = 'insight_selection_v3'),
  snapshot_contract_version TEXT NOT NULL
    CHECK (snapshot_contract_version = 'traderlink_coach_ai_review_insight_snapshot_v1'),
  insight_engine_version TEXT NOT NULL CHECK (length(insight_engine_version) BETWEEN 1 AND 96),
  renderer_version TEXT NOT NULL CHECK (length(renderer_version) BETWEEN 1 AND 96),
  plan_catalog_version TEXT NOT NULL CHECK (length(plan_catalog_version) BETWEEN 1 AND 96),
  selection_contract_version TEXT NOT NULL
    CHECK (selection_contract_version = 'traderlink_coach_ai_review_plan_selection_v1'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (
    length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'
  ),
  source_digest_sha256 TEXT NOT NULL ${digestCheck("source_digest_sha256")},
  candidates_digest_sha256 TEXT NOT NULL ${digestCheck("candidates_digest_sha256")},
  shortlist_digest_sha256 TEXT NOT NULL ${digestCheck("shortlist_digest_sha256")},
  catalog_digest_sha256 TEXT NOT NULL ${digestCheck("catalog_digest_sha256")},
  provider_package_digest_sha256 TEXT NOT NULL
    ${digestCheck("provider_package_digest_sha256")},
  invocation_manifest_digest_sha256 TEXT NOT NULL
    ${digestCheck("invocation_manifest_digest_sha256")},
  provider_package_key TEXT NOT NULL CHECK (
    length(provider_package_key) = 22
    AND provider_package_key NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  deterministic_default_review_plan_ref TEXT NOT NULL CHECK (
    length(deterministic_default_review_plan_ref) = 36
    AND deterministic_default_review_plan_ref GLOB 'review_plan_*'
    AND substr(deterministic_default_review_plan_ref, 13) NOT GLOB '*[^0-9a-f]*'
  ),
  artifact_codec_version TEXT NOT NULL CHECK (artifact_codec_version = 'deflate_raw_v1'),
  artifact_uncompressed_byte_length INTEGER NOT NULL
    CHECK (artifact_uncompressed_byte_length > 0),
  artifact_compressed_byte_length INTEGER NOT NULL
    CHECK (artifact_compressed_byte_length > 0),
  artifact_digest_sha256 TEXT NOT NULL ${digestCheck("artifact_digest_sha256")},
  artifact_blob BLOB NOT NULL CHECK (
    typeof(artifact_blob) = 'blob'
    AND length(artifact_blob) = artifact_compressed_byte_length
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  FOREIGN KEY (coach_ai_review_period_request_id)
    REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_insight_snapshots_account_period
ON coach_ai_review_insight_snapshots(workspace_id, account_id, created_at_utc DESC);

CREATE TABLE coach_ai_review_insight_provider_dispatches (
  coach_ai_review_insight_provider_dispatch_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_insight_provider_dispatch_id")},
  coach_ai_review_period_request_id TEXT NOT NULL
    ${uuidCheck("coach_ai_review_period_request_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  recovery_epoch TEXT NOT NULL CHECK (
    length(recovery_epoch) = 64 AND recovery_epoch = lower(recovery_epoch)
    AND recovery_epoch NOT GLOB '*[^0-9a-f]*'
  ),
  lease_generation INTEGER NOT NULL CHECK (lease_generation >= 1),
  fencing_token_sha256 TEXT NOT NULL ${digestCheck("fencing_token_sha256")},
  retired_fencing_token_sha256 TEXT
    ${digestCheck("retired_fencing_token_sha256", true)},
  lease_acquired_at_utc TEXT NOT NULL ${utcCheck("lease_acquired_at_utc")},
  lease_expires_at_utc TEXT NOT NULL ${utcCheck("lease_expires_at_utc")},
  transport_may_have_started_at_utc TEXT
    ${utcCheck("transport_may_have_started_at_utc", true)},
  selection_terminal_at_utc TEXT ${utcCheck("selection_terminal_at_utc", true)},
  request_body_digest_sha256 TEXT ${digestCheck("request_body_digest_sha256", true)},
  request_body_byte_length INTEGER CHECK (
    request_body_byte_length IS NULL OR request_body_byte_length > 0
  ),
  provider_response_id TEXT CHECK (
    provider_response_id IS NULL OR (
      length(provider_response_id) BETWEEN 1 AND 160
      AND provider_response_id NOT GLOB '*[^A-Za-z0-9_-]*'
    )
  ),
  lease_state TEXT NOT NULL CHECK (
    lease_state IN ('leased', 'transport_authorized', 'selection_terminal', 'settled')
  ),
  usage_settlement_state TEXT NOT NULL CHECK (
    usage_settlement_state IN (
      'not_dispatched', 'no_usage', 'receipt_recorded',
      'unknown_after_dispatch', 'reconciled_no_usage', 'reconciled_receipt'
    )
  ),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 96
      AND failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  CHECK (lease_expires_at_utc > lease_acquired_at_utc),
  CHECK ((transport_may_have_started_at_utc IS NULL
      AND request_body_digest_sha256 IS NULL AND request_body_byte_length IS NULL)
    OR (transport_may_have_started_at_utc IS NOT NULL
      AND request_body_digest_sha256 IS NOT NULL AND request_body_byte_length IS NOT NULL)),
  CHECK (retired_fencing_token_sha256 IS NULL OR (
    transport_may_have_started_at_utc IS NOT NULL
    AND lease_state IN ('selection_terminal', 'settled')
    AND usage_settlement_state IN (
      'unknown_after_dispatch', 'reconciled_no_usage', 'reconciled_receipt'
    )
  )),
  CHECK ((lease_state = 'leased'
      AND transport_may_have_started_at_utc IS NULL
      AND selection_terminal_at_utc IS NULL
      AND usage_settlement_state = 'not_dispatched')
    OR (lease_state = 'transport_authorized'
      AND transport_may_have_started_at_utc IS NOT NULL
      AND selection_terminal_at_utc IS NULL
      AND usage_settlement_state = 'not_dispatched')
    OR (lease_state = 'selection_terminal'
      AND selection_terminal_at_utc IS NOT NULL
      AND usage_settlement_state = 'unknown_after_dispatch')
    OR (lease_state = 'settled'
      AND selection_terminal_at_utc IS NOT NULL
      AND usage_settlement_state IN (
        'no_usage', 'receipt_recorded', 'reconciled_no_usage', 'reconciled_receipt'
      ))),
  UNIQUE (coach_ai_review_period_request_id, lease_generation),
  FOREIGN KEY (coach_ai_review_period_request_id)
    REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_review_generation_attempt_id)
    REFERENCES coach_ai_review_generation_attempts_v2(coach_ai_review_generation_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX coach_ai_review_insight_dispatches_one_active
ON coach_ai_review_insight_provider_dispatches(coach_ai_review_period_request_id)
WHERE lease_state IN ('leased', 'transport_authorized');

CREATE UNIQUE INDEX coach_ai_review_insight_dispatches_provider_response
ON coach_ai_review_insight_provider_dispatches(provider_response_id)
WHERE provider_response_id IS NOT NULL;

CREATE INDEX coach_ai_review_insight_dispatches_recovery
ON coach_ai_review_insight_provider_dispatches(
  lease_state, lease_expires_at_utc, recovery_epoch
);

CREATE TABLE coach_ai_issued_reviews_v3 (
  coach_ai_issued_review_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_issued_review_id")},
  coach_ai_review_period_request_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  generation_source TEXT NOT NULL
    CHECK (generation_source IN ('provider_selected', 'deterministic_default')),
  provider_key TEXT CHECK (provider_key IS NULL OR provider_key = 'openai_direct'),
  model_id TEXT CHECK (
    model_id IS NULL OR (
      length(model_id) BETWEEN 1 AND 128
      AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'
    )
  ),
  output_contract_version TEXT NOT NULL CHECK (
    output_contract_version IN (
      'traderlink_coach_periodic_ai_review_output_v3',
      'traderlink_coach_monthly_ai_review_output_v3'
    )
  ),
  prompt_renderer_version TEXT NOT NULL CHECK (
    prompt_renderer_version IN (
      'periodic_insight_v1_renderer_v1',
      'monthly_insight_v1_renderer_v1'
    )
  ),
  review_plan_ref TEXT NOT NULL CHECK (
    length(review_plan_ref) = 36 AND review_plan_ref GLOB 'review_plan_*'
    AND substr(review_plan_ref, 13) NOT GLOB '*[^0-9a-f]*'
  ),
  output_digest_sha256 TEXT NOT NULL ${digestCheck("output_digest_sha256")},
  output_json TEXT NOT NULL CHECK (json_valid(output_json) AND json_type(output_json) = 'object'),
  issued_at_utc TEXT NOT NULL ${utcCheck("issued_at_utc")},
  CHECK ((generation_source = 'provider_selected'
      AND provider_key = 'openai_direct' AND model_id IS NOT NULL)
    OR (generation_source = 'deterministic_default'
      AND provider_key IS NULL AND model_id IS NULL)),
  FOREIGN KEY (coach_ai_review_period_request_id)
    REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_issued_reviews_v3_account_issued
ON coach_ai_issued_reviews_v3(workspace_id, account_id, issued_at_utc DESC);

CREATE TABLE coach_ai_review_insight_selection_audits (
  coach_ai_review_insight_selection_audit_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_insight_selection_audit_id")},
  coach_ai_review_period_request_id TEXT NOT NULL
    ${uuidCheck("coach_ai_review_period_request_id")},
  coach_ai_review_generation_attempt_id TEXT
    ${uuidCheck("coach_ai_review_generation_attempt_id")},
  coach_ai_review_insight_provider_dispatch_id TEXT
    ${uuidCheck("coach_ai_review_insight_provider_dispatch_id")},
  coach_ai_issued_review_id TEXT ${uuidCheck("coach_ai_issued_review_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  selection_source TEXT NOT NULL
    CHECK (selection_source IN ('provider_selected', 'deterministic_default')),
  selection_reason_code TEXT NOT NULL CHECK (
    selection_reason_code IN (
      'provider_selection_accepted', 'provider_selection_rejected',
      'single_authorized_plan', 'provider_input_limit',
      'provider_reservation_refused', 'provider_configuration_drift',
      'usage_unknown_after_dispatch', 'provider_selection_unavailable'
    )
  ),
  validation_state TEXT NOT NULL CHECK (validation_state IN ('accepted', 'rejected')),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 96
      AND failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  provider_package_key TEXT CHECK (
    provider_package_key IS NULL OR (
      length(provider_package_key) = 22
      AND provider_package_key NOT GLOB '*[^A-Za-z0-9_-]*'
    )
  ),
  provider_choice_key TEXT CHECK (
    provider_choice_key IS NULL OR provider_choice_key IN (
      'plan_1', 'plan_2', 'plan_3', 'plan_4', 'plan_5', 'plan_6'
    )
  ),
  review_plan_ref TEXT CHECK (
    review_plan_ref IS NULL OR (
      length(review_plan_ref) = 36 AND review_plan_ref GLOB 'review_plan_*'
      AND substr(review_plan_ref, 13) NOT GLOB '*[^0-9a-f]*'
    )
  ),
  structured_selection_json TEXT CHECK (
    structured_selection_json IS NULL OR (
      json_valid(structured_selection_json) AND json_type(structured_selection_json) = 'object'
    )
  ),
  structured_selection_digest_sha256 TEXT
    ${digestCheck("structured_selection_digest_sha256", true)},
  focus_tracking_json TEXT CHECK (
    focus_tracking_json IS NULL OR (
      json_valid(focus_tracking_json) AND json_type(focus_tracking_json) = 'array'
    )
  ),
  focus_tracking_digest_sha256 TEXT
    ${digestCheck("focus_tracking_digest_sha256", true)},
  source_digest_sha256 TEXT NOT NULL ${digestCheck("source_digest_sha256")},
  shortlist_digest_sha256 TEXT NOT NULL ${digestCheck("shortlist_digest_sha256")},
  catalog_digest_sha256 TEXT NOT NULL ${digestCheck("catalog_digest_sha256")},
  rendered_output_digest_sha256 TEXT
    ${digestCheck("rendered_output_digest_sha256", true)},
  recovery_epoch TEXT CHECK (
    recovery_epoch IS NULL OR (
      length(recovery_epoch) = 64 AND recovery_epoch = lower(recovery_epoch)
      AND recovery_epoch NOT GLOB '*[^0-9a-f]*'
    )
  ),
  lease_generation INTEGER CHECK (lease_generation IS NULL OR lease_generation >= 1),
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  CHECK ((structured_selection_json IS NULL AND structured_selection_digest_sha256 IS NULL)
    OR (structured_selection_json IS NOT NULL AND structured_selection_digest_sha256 IS NOT NULL)),
  CHECK ((focus_tracking_json IS NULL AND focus_tracking_digest_sha256 IS NULL)
    OR (focus_tracking_json IS NOT NULL AND focus_tracking_digest_sha256 IS NOT NULL)),
  CHECK ((selection_source = 'provider_selected'
      AND coach_ai_review_generation_attempt_id IS NOT NULL
      AND coach_ai_review_insight_provider_dispatch_id IS NOT NULL
      AND provider_package_key IS NOT NULL
      AND recovery_epoch IS NOT NULL AND lease_generation IS NOT NULL)
    OR (selection_source = 'deterministic_default'
      AND coach_ai_review_generation_attempt_id IS NULL
      AND coach_ai_review_insight_provider_dispatch_id IS NULL
      AND provider_choice_key IS NULL
      AND structured_selection_json IS NULL
      AND recovery_epoch IS NULL AND lease_generation IS NULL
      AND validation_state = 'accepted')),
  CHECK ((selection_source = 'provider_selected'
      AND ((validation_state = 'accepted'
          AND selection_reason_code = 'provider_selection_accepted')
        OR (validation_state = 'rejected'
          AND selection_reason_code = 'provider_selection_rejected')))
    OR (selection_source = 'deterministic_default'
      AND selection_reason_code IN (
        'single_authorized_plan', 'provider_input_limit',
        'provider_reservation_refused', 'provider_configuration_drift',
        'usage_unknown_after_dispatch', 'provider_selection_unavailable'
      ))),
  CHECK ((validation_state = 'accepted'
      AND failure_code IS NULL AND coach_ai_issued_review_id IS NOT NULL
      AND review_plan_ref IS NOT NULL AND rendered_output_digest_sha256 IS NOT NULL
      AND focus_tracking_json IS NOT NULL
      AND (selection_source = 'deterministic_default'
        OR (provider_choice_key IS NOT NULL AND structured_selection_json IS NOT NULL)))
    OR (validation_state = 'rejected'
      AND failure_code IS NOT NULL AND coach_ai_issued_review_id IS NULL
      AND focus_tracking_json IS NULL)),
  FOREIGN KEY (coach_ai_review_period_request_id)
    REFERENCES coach_ai_review_period_requests_v2(coach_ai_review_period_request_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_review_generation_attempt_id)
    REFERENCES coach_ai_review_generation_attempts_v2(coach_ai_review_generation_attempt_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_review_insight_provider_dispatch_id)
    REFERENCES coach_ai_review_insight_provider_dispatches(
      coach_ai_review_insight_provider_dispatch_id
    ) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (coach_ai_issued_review_id)
    REFERENCES coach_ai_issued_reviews_v3(coach_ai_issued_review_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE UNIQUE INDEX coach_ai_review_insight_selection_one_accepted
ON coach_ai_review_insight_selection_audits(coach_ai_review_period_request_id)
WHERE validation_state = 'accepted';

CREATE UNIQUE INDEX coach_ai_review_insight_selection_one_per_attempt
ON coach_ai_review_insight_selection_audits(
  coach_ai_review_generation_attempt_id
) WHERE coach_ai_review_generation_attempt_id IS NOT NULL;

CREATE INDEX coach_ai_review_insight_selection_request_recorded
ON coach_ai_review_insight_selection_audits(
  coach_ai_review_period_request_id, recorded_at_utc DESC
);

CREATE TRIGGER coach_ai_review_generation_contract_state_no_delete
BEFORE DELETE ON coach_ai_review_generation_contract_state
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_state_required'); END;

CREATE TRIGGER coach_ai_review_generation_contract_state_transition
BEFORE UPDATE ON coach_ai_review_generation_contract_state
WHEN NEW.state_key IS NOT OLD.state_key
  OR OLD.transition_generation <> 1 OR NEW.transition_generation <> 2
  OR OLD.active_generation_contract_version <> 'openai_direct_v2'
  OR OLD.minimum_reader_contract_version <> 'openai_direct_v2'
  OR NEW.active_generation_contract_version <> 'insight_selection_v3'
  OR NEW.minimum_reader_contract_version <> 'insight_selection_v3'
  OR NEW.transitioned_at_utc <= OLD.transitioned_at_utc
  OR EXISTS (
    SELECT 1 FROM coach_ai_review_period_requests_v2
    WHERE generation_contract_version = 'openai_direct_v2' AND state = 'pending'
  )
  OR EXISTS (
    SELECT 1 FROM coach_ai_review_generation_attempts_v2
    WHERE generation_contract_version = 'openai_direct_v2' AND state = 'pending'
  )
  OR EXISTS (
    SELECT 1 FROM coach_ai_review_generation_control_reservations_v2
    WHERE state IN ('reserved', 'started')
  )
  OR EXISTS (
    SELECT 1 FROM coach_ai_feature_controls
    WHERE scope_kind = 'platform' AND feature_key IN ('weekly_reviews', 'monthly_reviews')
      AND enabled <> 0
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_dispatch_recovery_state_no_delete
BEFORE DELETE ON coach_ai_review_dispatch_recovery_state
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_dispatch_recovery_state_required'); END;

CREATE TRIGGER coach_ai_review_dispatch_recovery_state_transition
BEFORE UPDATE ON coach_ai_review_dispatch_recovery_state
WHEN NEW.state_key IS NOT OLD.state_key
  OR NEW.recovery_epoch = OLD.recovery_epoch
  OR NEW.recovery_generation <> OLD.recovery_generation + 1
  OR NEW.transitioned_at_utc <= OLD.transitioned_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_dispatch_recovery_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_insight_feature_enable_insert_guard
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.enabled = 1 AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_generation_contract_state
    WHERE state_key = 'singleton'
      AND active_generation_contract_version = 'insight_selection_v3'
      AND minimum_reader_contract_version = 'insight_selection_v3'
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_inactive'); END;

CREATE TRIGGER coach_ai_review_insight_feature_enable_update_guard
BEFORE UPDATE OF enabled ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND OLD.enabled <> 1 AND NEW.enabled = 1 AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_generation_contract_state
    WHERE state_key = 'singleton'
      AND active_generation_contract_version = 'insight_selection_v3'
      AND minimum_reader_contract_version = 'insight_selection_v3'
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_inactive'); END;

CREATE TRIGGER coach_ai_review_insight_budget_block_consistency
BEFORE UPDATE OF provider_calls_blocked, provider_calls_blocked_reason,
  provider_calls_blocked_at_utc ON coach_ai_review_budget_controls
WHEN (NEW.provider_calls_blocked = 1 AND (
    NEW.provider_calls_blocked_reason IS NULL
    OR NEW.provider_calls_blocked_at_utc IS NULL
  )) OR (NEW.provider_calls_blocked = 0 AND (
    NEW.provider_calls_blocked_reason IS NOT NULL
    OR NEW.provider_calls_blocked_at_utc IS NOT NULL
  ))
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_block_state_invalid'); END;

CREATE TRIGGER coach_ai_review_insight_feature_budget_block_insert_guard
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.enabled = 1 AND EXISTS (
    SELECT 1 FROM coach_ai_review_budget_controls
    WHERE control_key = 'ai_reviews' AND provider_calls_blocked = 1
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_calls_blocked'); END;

CREATE TRIGGER coach_ai_review_insight_feature_budget_block_update_guard
BEFORE UPDATE OF enabled ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND OLD.enabled <> 1 AND NEW.enabled = 1 AND EXISTS (
    SELECT 1 FROM coach_ai_review_budget_controls
    WHERE control_key = 'ai_reviews' AND provider_calls_blocked = 1
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_calls_blocked'); END;

CREATE TRIGGER coach_ai_review_insight_reservation_budget_block_guard
BEFORE INSERT ON coach_ai_review_generation_control_reservations_v2
WHEN EXISTS (
  SELECT 1 FROM coach_ai_review_generation_attempts_v2 attempt
  JOIN coach_ai_review_budget_controls control ON control.control_key = 'ai_reviews'
  WHERE attempt.coach_ai_review_generation_attempt_id =
      NEW.coach_ai_review_generation_attempt_id
    AND attempt.generation_contract_version = 'insight_selection_v3'
    AND control.provider_calls_blocked = 1
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_provider_calls_blocked'); END;

CREATE TRIGGER coach_ai_review_insight_receipt_overrun_guard
BEFORE INSERT ON coach_ai_review_generation_attempt_receipts_v2
WHEN (NEW.reservation_overrun = 0 AND (
    NEW.input_token_overrun <> 0 OR NEW.output_token_overrun <> 0
    OR NEW.total_token_overrun <> 0 OR NEW.cost_overrun_usd IS NOT NULL
  )) OR (NEW.reservation_overrun = 1 AND (
    NEW.cost_overrun_usd IS NULL OR (
      NEW.input_token_overrun = 0 AND NEW.output_token_overrun = 0
      AND NEW.total_token_overrun = 0
      AND CAST(NEW.cost_overrun_usd AS REAL) = 0
    )
  ))
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_receipt_overrun_state_invalid'); END;

CREATE TRIGGER coach_ai_review_period_requests_generation_contract_insert
BEFORE INSERT ON coach_ai_review_period_requests_v2
WHEN NEW.generation_contract_version <> (
  SELECT active_generation_contract_version
  FROM coach_ai_review_generation_contract_state WHERE state_key = 'singleton'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_inactive'); END;

CREATE TRIGGER coach_ai_review_period_requests_generation_contract_immutable
BEFORE UPDATE ON coach_ai_review_period_requests_v2
WHEN NEW.generation_contract_version <> OLD.generation_contract_version
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_immutable'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_generation_contract_scope
BEFORE INSERT ON coach_ai_review_generation_attempts_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = NEW.generation_contract_version
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_attempt_generation_contract_invalid'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_generation_contract_immutable
BEFORE UPDATE ON coach_ai_review_generation_attempts_v2
WHEN NEW.generation_contract_version <> OLD.generation_contract_version
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_contract_immutable'); END;

CREATE TRIGGER coach_ai_issued_reviews_v2_generation_contract_scope
BEFORE INSERT ON coach_ai_issued_reviews_v2
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.generation_contract_version = 'openai_direct_v2'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_v2_generation_contract_required'); END;

CREATE TRIGGER coach_ai_review_insight_snapshots_scope
BEFORE INSERT ON coach_ai_review_insight_snapshots
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = NEW.generation_contract_version
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_snapshot_scope_required'); END;

CREATE TRIGGER coach_ai_review_insight_snapshots_no_update
BEFORE UPDATE ON coach_ai_review_insight_snapshots
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_snapshot_immutable'); END;

CREATE TRIGGER coach_ai_review_insight_snapshots_no_delete
BEFORE DELETE ON coach_ai_review_insight_snapshots
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_snapshot_history_required'); END;

CREATE TRIGGER coach_ai_review_insight_dispatches_scope
BEFORE INSERT ON coach_ai_review_insight_provider_dispatches
WHEN NOT EXISTS (
  SELECT 1
  FROM coach_ai_review_generation_attempts_v2 attempt
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id = attempt.coach_ai_review_period_request_id
  JOIN coach_ai_review_generation_control_reservations_v2 reservation
    ON reservation.coach_ai_review_generation_attempt_id =
      attempt.coach_ai_review_generation_attempt_id
    AND reservation.user_id = attempt.user_id
    AND reservation.workspace_id = attempt.workspace_id
    AND reservation.account_id = attempt.account_id
  JOIN coach_ai_review_dispatch_recovery_state recovery ON recovery.state_key = 'singleton'
  WHERE attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
    AND attempt.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND attempt.user_id = NEW.user_id AND attempt.workspace_id = NEW.workspace_id
    AND attempt.account_id = NEW.account_id AND attempt.state = 'pending'
    AND attempt.generation_contract_version = 'insight_selection_v3'
    AND reservation.state = 'started'
    AND request.state = 'pending' AND request.generation_contract_version = 'insight_selection_v3'
    AND EXISTS (
      SELECT 1 FROM coach_ai_review_insight_snapshots snapshot
      WHERE snapshot.coach_ai_review_period_request_id =
          NEW.coach_ai_review_period_request_id
        AND snapshot.user_id = NEW.user_id
        AND snapshot.workspace_id = NEW.workspace_id
        AND snapshot.account_id = NEW.account_id
        AND snapshot.provider_key = attempt.provider_key
        AND snapshot.model_id = attempt.model_id
    )
    AND recovery.recovery_epoch = NEW.recovery_epoch
)
  OR EXISTS (
    SELECT 1 FROM coach_ai_review_insight_provider_dispatches prior
    WHERE prior.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND (prior.lease_state IN ('leased', 'transport_authorized')
        OR prior.usage_settlement_state = 'unknown_after_dispatch'
        OR prior.transport_may_have_started_at_utc IS NOT NULL)
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_dispatch_scope_required'); END;

CREATE TRIGGER coach_ai_review_insight_dispatches_update_guard
BEFORE UPDATE ON coach_ai_review_insight_provider_dispatches
WHEN NEW.coach_ai_review_insight_provider_dispatch_id IS NOT OLD.coach_ai_review_insight_provider_dispatch_id
  OR NEW.coach_ai_review_period_request_id IS NOT OLD.coach_ai_review_period_request_id
  OR NEW.coach_ai_review_generation_attempt_id IS NOT OLD.coach_ai_review_generation_attempt_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id OR NEW.created_at_utc IS NOT OLD.created_at_utc
  OR NEW.updated_at_utc <= OLD.updated_at_utc
  OR OLD.lease_state = 'settled'
  OR NOT (
    (OLD.lease_state = 'leased' AND NEW.lease_state = 'leased'
      AND NEW.lease_generation = OLD.lease_generation + 1
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS NOT OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc > OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc > OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS NULL
      AND NEW.selection_terminal_at_utc IS NULL
      AND NEW.request_body_digest_sha256 IS NULL
      AND NEW.request_body_byte_length IS NULL
      AND NEW.provider_response_id IS NULL AND NEW.failure_code IS NULL
      AND NEW.usage_settlement_state = 'not_dispatched')
    OR (OLD.lease_state = 'leased' AND NEW.lease_state = 'transport_authorized'
      AND NEW.lease_generation = OLD.lease_generation
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS NOT NULL
      AND NEW.selection_terminal_at_utc IS NULL
      AND NEW.provider_response_id IS NULL AND NEW.failure_code IS NULL
      AND EXISTS (
        SELECT 1 FROM coach_ai_review_generation_control_reservations_v2 reservation
        WHERE reservation.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
          AND reservation.state = 'started'
      )
      AND NEW.usage_settlement_state = 'not_dispatched')
    OR (OLD.lease_state = 'leased' AND NEW.lease_state = 'settled'
      AND NEW.lease_generation = OLD.lease_generation
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS NULL
      AND NEW.selection_terminal_at_utc IS NOT NULL
      AND NEW.request_body_digest_sha256 IS NULL
      AND NEW.request_body_byte_length IS NULL
      AND NEW.provider_response_id IS NULL AND NEW.failure_code IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
        WHERE receipt.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
      )
      AND NEW.usage_settlement_state = 'no_usage')
    OR (OLD.lease_state = 'transport_authorized'
      AND NEW.lease_state = 'selection_terminal'
      AND NEW.lease_generation = OLD.lease_generation
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS OLD.transport_may_have_started_at_utc
      AND NEW.selection_terminal_at_utc IS NOT NULL
      AND NEW.request_body_digest_sha256 IS OLD.request_body_digest_sha256
      AND NEW.request_body_byte_length IS OLD.request_body_byte_length
      AND NEW.failure_code IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
        WHERE receipt.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
      )
      AND NEW.usage_settlement_state = 'unknown_after_dispatch')
    OR (OLD.lease_state = 'transport_authorized' AND NEW.lease_state = 'settled'
      AND NEW.lease_generation = OLD.lease_generation
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS OLD.transport_may_have_started_at_utc
      AND NEW.selection_terminal_at_utc IS NOT NULL
      AND NEW.request_body_digest_sha256 IS OLD.request_body_digest_sha256
      AND NEW.request_body_byte_length IS OLD.request_body_byte_length
      AND EXISTS (
        SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
        WHERE receipt.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
      )
      AND NEW.usage_settlement_state = 'receipt_recorded')
    OR (OLD.lease_state = 'selection_terminal' AND NEW.lease_state = 'settled'
      AND OLD.usage_settlement_state = 'unknown_after_dispatch'
      AND NEW.lease_generation = OLD.lease_generation
      AND NEW.recovery_epoch IS OLD.recovery_epoch
      AND NEW.fencing_token_sha256 IS OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS OLD.transport_may_have_started_at_utc
      AND NEW.selection_terminal_at_utc IS OLD.selection_terminal_at_utc
      AND NEW.request_body_digest_sha256 IS OLD.request_body_digest_sha256
      AND NEW.request_body_byte_length IS OLD.request_body_byte_length
      AND NEW.failure_code IS OLD.failure_code
      AND ((NEW.usage_settlement_state = 'reconciled_no_usage'
          AND NEW.provider_response_id IS OLD.provider_response_id)
        OR (NEW.usage_settlement_state = 'reconciled_receipt'
          AND EXISTS (
            SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
            WHERE receipt.coach_ai_review_generation_attempt_id =
              NEW.coach_ai_review_generation_attempt_id
          )
          AND (NEW.provider_response_id IS OLD.provider_response_id
            OR (OLD.provider_response_id IS NULL
              AND NEW.provider_response_id IS NOT NULL)))))
    OR (OLD.lease_state = 'leased' AND NEW.lease_state = 'settled'
      AND NEW.recovery_epoch = (
        SELECT recovery_epoch FROM coach_ai_review_dispatch_recovery_state
        WHERE state_key = 'singleton'
      )
      AND NEW.lease_generation = OLD.lease_generation + 1
      AND NEW.fencing_token_sha256 IS NOT OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 IS OLD.retired_fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS NULL
      AND NEW.selection_terminal_at_utc IS NOT NULL
      AND (OLD.recovery_epoch <> NEW.recovery_epoch
        OR OLD.lease_expires_at_utc <= NEW.selection_terminal_at_utc)
      AND NEW.request_body_digest_sha256 IS NULL
      AND NEW.request_body_byte_length IS NULL
      AND NEW.provider_response_id IS NULL AND NEW.failure_code IS NOT NULL
      AND NEW.usage_settlement_state = 'no_usage'
      AND NOT EXISTS (
        SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
        WHERE receipt.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
      ))
    OR (OLD.lease_state = 'transport_authorized'
      AND NEW.lease_state = 'selection_terminal'
      AND NEW.recovery_epoch = (
        SELECT recovery_epoch FROM coach_ai_review_dispatch_recovery_state
        WHERE state_key = 'singleton'
      )
      AND NEW.lease_generation = OLD.lease_generation + 1
      AND NEW.fencing_token_sha256 IS NOT OLD.fencing_token_sha256
      AND NEW.retired_fencing_token_sha256 = OLD.fencing_token_sha256
      AND NEW.lease_acquired_at_utc IS OLD.lease_acquired_at_utc
      AND NEW.lease_expires_at_utc IS OLD.lease_expires_at_utc
      AND NEW.transport_may_have_started_at_utc IS
        OLD.transport_may_have_started_at_utc
      AND NEW.selection_terminal_at_utc IS NOT NULL
      AND (OLD.recovery_epoch <> NEW.recovery_epoch
        OR OLD.lease_expires_at_utc <= NEW.selection_terminal_at_utc)
      AND NEW.request_body_digest_sha256 IS OLD.request_body_digest_sha256
      AND NEW.request_body_byte_length IS OLD.request_body_byte_length
      AND NEW.failure_code IS NOT NULL
      AND NEW.usage_settlement_state = 'unknown_after_dispatch'
      AND NOT EXISTS (
        SELECT 1 FROM coach_ai_review_generation_attempt_receipts_v2 receipt
        WHERE receipt.coach_ai_review_generation_attempt_id =
          NEW.coach_ai_review_generation_attempt_id
      ))
  )
  OR (OLD.transport_may_have_started_at_utc IS NOT NULL
    AND NEW.transport_may_have_started_at_utc IS NOT OLD.transport_may_have_started_at_utc)
  OR (OLD.selection_terminal_at_utc IS NOT NULL
    AND NEW.selection_terminal_at_utc IS NOT OLD.selection_terminal_at_utc)
  OR (OLD.provider_response_id IS NOT NULL
    AND NEW.provider_response_id IS NOT OLD.provider_response_id)
  OR (OLD.request_body_digest_sha256 IS NOT NULL
    AND NEW.request_body_digest_sha256 IS NOT OLD.request_body_digest_sha256)
  OR (OLD.request_body_byte_length IS NOT NULL
    AND NEW.request_body_byte_length IS NOT OLD.request_body_byte_length)
  OR (OLD.failure_code IS NOT NULL AND NEW.failure_code IS NOT OLD.failure_code)
  OR (OLD.retired_fencing_token_sha256 IS NOT NULL
    AND NEW.retired_fencing_token_sha256 IS NOT OLD.retired_fencing_token_sha256)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_dispatch_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_insight_dispatches_no_delete
BEFORE DELETE ON coach_ai_review_insight_provider_dispatches
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_dispatch_history_required'); END;

CREATE TRIGGER coach_ai_issued_reviews_v3_scope
BEFORE INSERT ON coach_ai_issued_reviews_v3
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = 'insight_selection_v3'
    AND EXISTS (
      SELECT 1 FROM coach_ai_review_insight_snapshots snapshot
      WHERE snapshot.coach_ai_review_period_request_id =
          NEW.coach_ai_review_period_request_id
        AND snapshot.user_id = NEW.user_id
        AND snapshot.workspace_id = NEW.workspace_id
        AND snapshot.account_id = NEW.account_id
    )
    AND ((request.review_kind IN ('weekly', 'two_week')
        AND NEW.output_contract_version = 'traderlink_coach_periodic_ai_review_output_v3'
        AND NEW.prompt_renderer_version = 'periodic_insight_v1_renderer_v1')
      OR (request.review_kind = 'monthly'
        AND NEW.output_contract_version = 'traderlink_coach_monthly_ai_review_output_v3'
        AND NEW.prompt_renderer_version = 'monthly_insight_v1_renderer_v1'))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_v3_output_scope_required'); END;

CREATE TRIGGER coach_ai_issued_reviews_v3_no_update
BEFORE UPDATE ON coach_ai_issued_reviews_v3
BEGIN SELECT RAISE(ABORT, 'coach_ai_issued_review_immutable'); END;

CREATE TRIGGER coach_ai_issued_reviews_v3_no_delete
BEFORE DELETE ON coach_ai_issued_reviews_v3
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_history_required'); END;

CREATE TRIGGER coach_ai_review_insight_selection_audits_scope
BEFORE INSERT ON coach_ai_review_insight_selection_audits
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
    AND request.generation_contract_version = 'insight_selection_v3'
    AND request.state = 'pending'
    AND EXISTS (
      SELECT 1 FROM coach_ai_review_insight_snapshots snapshot
      WHERE snapshot.coach_ai_review_period_request_id =
          NEW.coach_ai_review_period_request_id
        AND snapshot.user_id = NEW.user_id
        AND snapshot.workspace_id = NEW.workspace_id
        AND snapshot.account_id = NEW.account_id
        AND snapshot.source_digest_sha256 = NEW.source_digest_sha256
        AND snapshot.shortlist_digest_sha256 = NEW.shortlist_digest_sha256
        AND snapshot.catalog_digest_sha256 = NEW.catalog_digest_sha256
        AND snapshot.provider_package_key IS COALESCE(
          NEW.provider_package_key, snapshot.provider_package_key
        )
    )
)
  OR (NEW.coach_ai_review_generation_attempt_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_generation_attempts_v2 attempt
    WHERE attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
      AND attempt.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND attempt.user_id = NEW.user_id AND attempt.workspace_id = NEW.workspace_id
      AND attempt.account_id = NEW.account_id
      AND attempt.generation_contract_version = 'insight_selection_v3'
  ))
  OR (NEW.coach_ai_review_insight_provider_dispatch_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_insight_provider_dispatches dispatch
    WHERE dispatch.coach_ai_review_insight_provider_dispatch_id =
        NEW.coach_ai_review_insight_provider_dispatch_id
      AND dispatch.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND dispatch.coach_ai_review_generation_attempt_id =
        NEW.coach_ai_review_generation_attempt_id
      AND dispatch.user_id = NEW.user_id AND dispatch.workspace_id = NEW.workspace_id
      AND dispatch.account_id = NEW.account_id
      AND dispatch.recovery_epoch = NEW.recovery_epoch
      AND dispatch.lease_generation = NEW.lease_generation
      AND ((NEW.validation_state = 'accepted'
          AND dispatch.lease_state = 'settled'
          AND dispatch.usage_settlement_state = 'receipt_recorded'
          AND dispatch.provider_response_id IS NOT NULL)
        OR (NEW.validation_state = 'rejected'
          AND dispatch.lease_state IN ('selection_terminal', 'settled')))
  ))
  OR (NEW.coach_ai_issued_review_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM coach_ai_issued_reviews_v3 review
    WHERE review.coach_ai_issued_review_id = NEW.coach_ai_issued_review_id
      AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND review.user_id = NEW.user_id AND review.workspace_id = NEW.workspace_id
      AND review.account_id = NEW.account_id
      AND review.review_plan_ref = NEW.review_plan_ref
      AND review.generation_source = NEW.selection_source
      AND review.output_digest_sha256 = NEW.rendered_output_digest_sha256
  ))
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_selection_scope_required'); END;

CREATE TRIGGER coach_ai_review_insight_selection_audits_no_update
BEFORE UPDATE ON coach_ai_review_insight_selection_audits
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_selection_immutable'); END;

CREATE TRIGGER coach_ai_review_insight_selection_audits_no_delete
BEFORE DELETE ON coach_ai_review_insight_selection_audits
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_insight_selection_history_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_v3_issued_scope
BEFORE UPDATE OF state ON coach_ai_review_generation_attempts_v2
WHEN NEW.generation_contract_version = 'insight_selection_v3'
  AND NEW.state = 'issued' AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_insight_selection_audits audit
    WHERE audit.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
      AND audit.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND audit.validation_state = 'accepted'
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_v3_attempt_selection_required'); END;

CREATE TRIGGER coach_ai_review_period_requests_issued_generation_scope
BEFORE UPDATE OF state, issued_review_id ON coach_ai_review_period_requests_v2
WHEN NEW.state = 'issued' AND (
  (NEW.generation_contract_version = 'openai_direct_v2' AND (
    NOT EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v2 review
      WHERE review.coach_ai_issued_review_id = NEW.issued_review_id
        AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    ) OR EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v3 review
      WHERE review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    )
  )) OR
  (NEW.generation_contract_version = 'insight_selection_v3' AND (
    NOT EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v3 review
      WHERE review.coach_ai_issued_review_id = NEW.issued_review_id
        AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    ) OR EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v2 review
      WHERE review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    ) OR NOT EXISTS (
      SELECT 1 FROM coach_ai_review_insight_selection_audits audit
      WHERE audit.coach_ai_issued_review_id = NEW.issued_review_id
        AND audit.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
        AND audit.validation_state = 'accepted'
    )
  ))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_issued_generation_contract_invalid'); END;`;

export const coachAiReviewInsightPersistenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0065_coach_ai_review_insight_persistence",
  executionOrder: 65,
  statements: Object.freeze([sql]),
});
