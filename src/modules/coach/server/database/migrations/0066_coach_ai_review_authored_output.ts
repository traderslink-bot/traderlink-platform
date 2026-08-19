import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string, nullable = false): string {
  const expression = `length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${expression}${nullable ? ")" : ")"})`;
}

function digestCheck(column: string): string {
  return `CHECK (length(${column}) = 64 AND ${column} = lower(${column}) AND ${column} NOT GLOB '*[^0-9a-f]*')`;
}

const sql = `CREATE TABLE coach_ai_review_authored_snapshots_v4 (
  coach_ai_review_authored_snapshot_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_authored_snapshot_id")},
  coach_ai_review_period_request_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  authoring_contract_version TEXT NOT NULL
    CHECK (authoring_contract_version = 'evidence_authoring_v4'),
  packet_contract_version TEXT NOT NULL CHECK (
    packet_contract_version IN (
      'traderlink_coach_weekly_ai_review_evidence_packet_v1',
      'traderlink_coach_monthly_ai_review_evidence_packet_v1'
    )
  ),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (
    length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'
  ),
  packet_sha256 TEXT NOT NULL ${digestCheck("packet_sha256")},
  packet_json TEXT NOT NULL CHECK (length(packet_json) BETWEEN 2 AND 8000000),
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

CREATE INDEX coach_ai_review_authored_snapshots_v4_account_created
ON coach_ai_review_authored_snapshots_v4(workspace_id, account_id, created_at_utc DESC);

CREATE TABLE coach_ai_review_authored_provider_calls_v4 (
  coach_ai_review_authored_provider_call_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_review_authored_provider_call_id")},
  coach_ai_review_period_request_id TEXT NOT NULL
    ${uuidCheck("coach_ai_review_period_request_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  call_sequence INTEGER NOT NULL CHECK (call_sequence >= 1),
  call_kind TEXT NOT NULL CHECK (call_kind IN (
    'weekly_authoring', 'monthly_partition_extraction', 'monthly_synthesis'
  )),
  prompt_sha256 TEXT NOT NULL ${digestCheck("prompt_sha256")},
  prompt_byte_length INTEGER NOT NULL CHECK (prompt_byte_length > 0),
  maximum_output_tokens INTEGER NOT NULL CHECK (
    maximum_output_tokens >= 1 AND maximum_output_tokens <= 16384
  ),
  state TEXT NOT NULL CHECK (state IN ('started', 'completed', 'failed', 'unknown')),
  provider_response_id TEXT CHECK (
    provider_response_id IS NULL OR (
      length(provider_response_id) BETWEEN 1 AND 160
      AND provider_response_id NOT GLOB '*[^A-Za-z0-9_-]*'
    )
  ),
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  cached_input_tokens INTEGER CHECK (cached_input_tokens IS NULL OR cached_input_tokens >= 0),
  cache_write_input_tokens INTEGER CHECK (
    cache_write_input_tokens IS NULL OR cache_write_input_tokens >= 0
  ),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  failure_code TEXT CHECK (
    failure_code IS NULL OR (
      length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*'
    )
  ),
  started_at_utc TEXT NOT NULL ${utcCheck("started_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc", true)},
  UNIQUE(coach_ai_review_period_request_id, call_sequence),
  CHECK ((state = 'started' AND provider_response_id IS NULL
      AND input_tokens IS NULL AND cached_input_tokens IS NULL
      AND cache_write_input_tokens IS NULL AND output_tokens IS NULL
      AND total_tokens IS NULL AND failure_code IS NULL AND finalized_at_utc IS NULL)
    OR (state = 'completed' AND provider_response_id IS NOT NULL
      AND input_tokens IS NOT NULL AND cached_input_tokens IS NOT NULL
      AND cache_write_input_tokens IS NOT NULL AND output_tokens IS NOT NULL
      AND total_tokens IS NOT NULL AND cached_input_tokens + cache_write_input_tokens <= input_tokens
      AND input_tokens + output_tokens = total_tokens
      AND failure_code IS NULL AND finalized_at_utc IS NOT NULL)
    OR (state IN ('failed', 'unknown') AND failure_code IS NOT NULL
      AND finalized_at_utc IS NOT NULL)),
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

CREATE INDEX coach_ai_review_authored_provider_calls_v4_request
ON coach_ai_review_authored_provider_calls_v4(
  coach_ai_review_period_request_id, call_sequence
);

CREATE TABLE coach_ai_issued_reviews_v4 (
  coach_ai_issued_review_id TEXT PRIMARY KEY
    ${uuidCheck("coach_ai_issued_review_id")},
  coach_ai_review_period_request_id TEXT NOT NULL UNIQUE
    ${uuidCheck("coach_ai_review_period_request_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  authoring_contract_version TEXT NOT NULL
    CHECK (authoring_contract_version = 'evidence_authoring_v4'),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (
    length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'
  ),
  output_contract_version TEXT NOT NULL CHECK (
    output_contract_version IN (
      'traderlink_coach_weekly_ai_review_authored_output_v1',
      'traderlink_coach_monthly_ai_review_authored_output_v1'
    )
  ),
  output_sha256 TEXT NOT NULL ${digestCheck("output_sha256")},
  output_json TEXT NOT NULL CHECK (length(output_json) BETWEEN 2 AND 160000),
  issued_at_utc TEXT NOT NULL ${utcCheck("issued_at_utc")},
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

CREATE INDEX coach_ai_issued_reviews_v4_account_issued
ON coach_ai_issued_reviews_v4(workspace_id, account_id, issued_at_utc DESC);

CREATE TRIGGER coach_ai_review_authored_snapshots_v4_scope
BEFORE INSERT ON coach_ai_review_authored_snapshots_v4
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_period_requests_v2 request
  WHERE request.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND request.user_id = NEW.user_id AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = 'insight_selection_v3'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_snapshot_scope_required'); END;

CREATE TRIGGER coach_ai_review_authored_snapshots_v4_no_update
BEFORE UPDATE ON coach_ai_review_authored_snapshots_v4
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_snapshot_immutable'); END;

CREATE TRIGGER coach_ai_review_authored_snapshots_v4_no_delete
BEFORE DELETE ON coach_ai_review_authored_snapshots_v4
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_snapshot_history_required'); END;

CREATE TRIGGER coach_ai_review_authored_provider_calls_v4_scope
BEFORE INSERT ON coach_ai_review_authored_provider_calls_v4
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_authored_snapshots_v4 snapshot
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id = snapshot.coach_ai_review_period_request_id
   AND request.user_id = snapshot.user_id AND request.workspace_id = snapshot.workspace_id
   AND request.account_id = snapshot.account_id
  JOIN coach_ai_review_generation_attempts_v2 attempt
    ON attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
   AND attempt.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
   AND attempt.user_id = NEW.user_id AND attempt.workspace_id = NEW.workspace_id
   AND attempt.account_id = NEW.account_id
  WHERE snapshot.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND snapshot.user_id = NEW.user_id AND snapshot.workspace_id = NEW.workspace_id
    AND snapshot.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = 'insight_selection_v3'
    AND attempt.generation_contract_version = 'insight_selection_v3'
    AND attempt.state = 'pending'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_provider_call_scope_required'); END;

CREATE TRIGGER coach_ai_review_authored_provider_calls_v4_transition
BEFORE UPDATE ON coach_ai_review_authored_provider_calls_v4
WHEN NEW.coach_ai_review_authored_provider_call_id IS NOT OLD.coach_ai_review_authored_provider_call_id
  OR NEW.coach_ai_review_period_request_id IS NOT OLD.coach_ai_review_period_request_id
  OR NEW.coach_ai_review_generation_attempt_id IS NOT OLD.coach_ai_review_generation_attempt_id
  OR NEW.user_id IS NOT OLD.user_id OR NEW.workspace_id IS NOT OLD.workspace_id
  OR NEW.account_id IS NOT OLD.account_id OR NEW.call_sequence IS NOT OLD.call_sequence
  OR NEW.call_kind IS NOT OLD.call_kind OR NEW.prompt_sha256 IS NOT OLD.prompt_sha256
  OR NEW.prompt_byte_length IS NOT OLD.prompt_byte_length
  OR NEW.maximum_output_tokens IS NOT OLD.maximum_output_tokens
  OR OLD.state <> 'started' OR NEW.state NOT IN ('completed', 'failed', 'unknown')
  OR NEW.started_at_utc IS NOT OLD.started_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_provider_call_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_authored_provider_calls_v4_no_delete
BEFORE DELETE ON coach_ai_review_authored_provider_calls_v4
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_authored_provider_call_history_required'); END;

CREATE TRIGGER coach_ai_issued_reviews_v4_scope
BEFORE INSERT ON coach_ai_issued_reviews_v4
WHEN NOT EXISTS (
  SELECT 1 FROM coach_ai_review_authored_snapshots_v4 snapshot
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id = snapshot.coach_ai_review_period_request_id
   AND request.user_id = snapshot.user_id AND request.workspace_id = snapshot.workspace_id
   AND request.account_id = snapshot.account_id
  WHERE snapshot.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    AND snapshot.user_id = NEW.user_id AND snapshot.workspace_id = NEW.workspace_id
    AND snapshot.account_id = NEW.account_id AND request.state = 'pending'
    AND request.generation_contract_version = 'insight_selection_v3'
    AND ((request.review_kind IN ('weekly', 'two_week')
        AND NEW.output_contract_version = 'traderlink_coach_weekly_ai_review_authored_output_v1')
      OR (request.review_kind = 'monthly'
        AND NEW.output_contract_version = 'traderlink_coach_monthly_ai_review_authored_output_v1'))
) OR EXISTS (
  SELECT 1 FROM coach_ai_issued_reviews_v3 old
  WHERE old.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_v4_output_scope_required'); END;

CREATE TRIGGER coach_ai_issued_reviews_v4_no_update
BEFORE UPDATE ON coach_ai_issued_reviews_v4
BEGIN SELECT RAISE(ABORT, 'coach_ai_issued_review_immutable'); END;

CREATE TRIGGER coach_ai_issued_reviews_v4_no_delete
BEFORE DELETE ON coach_ai_issued_reviews_v4
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_history_required'); END;

DROP TRIGGER coach_ai_review_generation_attempts_v3_issued_scope;
CREATE TRIGGER coach_ai_review_generation_attempts_v3_issued_scope
BEFORE UPDATE OF state ON coach_ai_review_generation_attempts_v2
WHEN NEW.generation_contract_version = 'insight_selection_v3'
  AND NEW.state = 'issued' AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_insight_selection_audits audit
    WHERE audit.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
      AND audit.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND audit.validation_state = 'accepted'
  ) AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_authored_provider_calls_v4 call
    WHERE call.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
      AND call.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
      AND call.state = 'completed'
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_v3_attempt_selection_required'); END;

DROP TRIGGER coach_ai_review_period_requests_issued_generation_scope;
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
    ) OR EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v4 review
      WHERE review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    )
  )) OR
  (NEW.generation_contract_version = 'insight_selection_v3' AND NOT (
    (EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v3 review
      WHERE review.coach_ai_issued_review_id = NEW.issued_review_id
        AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    ) AND EXISTS (
      SELECT 1 FROM coach_ai_review_insight_selection_audits audit
      WHERE audit.coach_ai_issued_review_id = NEW.issued_review_id
        AND audit.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
        AND audit.validation_state = 'accepted'
    )) OR EXISTS (
      SELECT 1 FROM coach_ai_issued_reviews_v4 review
      WHERE review.coach_ai_issued_review_id = NEW.issued_review_id
        AND review.coach_ai_review_period_request_id = NEW.coach_ai_review_period_request_id
    )
  ))
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_issued_generation_contract_invalid'); END;`;

export const coachAiReviewAuthoredOutputMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0066_coach_ai_review_authored_output",
  executionOrder: 66,
  statements: Object.freeze([sql]),
});
