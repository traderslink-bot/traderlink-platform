import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]')`;
}

function utcCheck(column: string): string {
  return `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
}

const sql = `CREATE TABLE coach_ai_review_generation_attempts (
  coach_ai_review_generation_attempt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_attempt_id")},
  user_id TEXT NOT NULL ${uuidCheck("user_id")},
  workspace_id TEXT NOT NULL ${uuidCheck("workspace_id")},
  account_id TEXT NOT NULL ${uuidCheck("account_id")},
  review_kind TEXT NOT NULL CHECK (review_kind IN ('weekly', 'monthly')),
  review_request_id TEXT NOT NULL ${uuidCheck("review_request_id")},
  attempt_number INTEGER NOT NULL CHECK (attempt_number >= 1),
  provider_key TEXT NOT NULL CHECK (provider_key = 'openai_direct'),
  model_id TEXT NOT NULL CHECK (length(model_id) BETWEEN 1 AND 128 AND model_id NOT GLOB '*[^A-Za-z0-9._:-]*'),
  state TEXT NOT NULL CHECK (state IN ('pending', 'issued', 'failed')),
  failure_code TEXT CHECK (failure_code IS NULL OR (length(failure_code) BETWEEN 1 AND 96 AND failure_code NOT GLOB '*[^A-Z0-9_]*')),
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  finalized_at_utc TEXT ${utcCheck("finalized_at_utc")},
  CHECK ((state = 'pending' AND failure_code IS NULL AND finalized_at_utc IS NULL) OR (state = 'issued' AND failure_code IS NULL AND finalized_at_utc IS NOT NULL) OR (state = 'failed' AND failure_code IS NOT NULL AND finalized_at_utc IS NOT NULL)),
  UNIQUE (review_kind, review_request_id, attempt_number),
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (workspace_id) REFERENCES platform_workspaces(workspace_id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  FOREIGN KEY (account_id) REFERENCES journal_accounts(account_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE INDEX coach_ai_review_generation_attempts_account ON coach_ai_review_generation_attempts(workspace_id, account_id, created_at_utc DESC);
CREATE UNIQUE INDEX coach_ai_review_generation_attempts_one_pending ON coach_ai_review_generation_attempts(review_kind, review_request_id) WHERE state = 'pending';
CREATE UNIQUE INDEX coach_ai_review_generation_attempts_one_issued ON coach_ai_review_generation_attempts(review_kind, review_request_id) WHERE state = 'issued';

CREATE TABLE coach_ai_review_generation_attempt_receipts (
  coach_ai_review_generation_attempt_receipt_id TEXT PRIMARY KEY ${uuidCheck("coach_ai_review_generation_attempt_receipt_id")},
  coach_ai_review_generation_attempt_id TEXT NOT NULL UNIQUE ${uuidCheck("coach_ai_review_generation_attempt_id")},
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  input_cost_usd_per_million_tokens TEXT CHECK (input_cost_usd_per_million_tokens IS NULL OR (length(input_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND input_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND input_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(input_cost_usd_per_million_tokens AS REAL) >= 0)),
  output_cost_usd_per_million_tokens TEXT CHECK (output_cost_usd_per_million_tokens IS NULL OR (length(output_cost_usd_per_million_tokens) BETWEEN 1 AND 24 AND output_cost_usd_per_million_tokens NOT GLOB '*[^0-9.]*' AND output_cost_usd_per_million_tokens NOT GLOB '*.*.*' AND CAST(output_cost_usd_per_million_tokens AS REAL) >= 0)),
  estimated_cost_usd TEXT CHECK (estimated_cost_usd IS NULL OR (length(estimated_cost_usd) BETWEEN 1 AND 32 AND estimated_cost_usd NOT GLOB '*[^0-9.]*' AND estimated_cost_usd NOT GLOB '*.*.*' AND CAST(estimated_cost_usd AS REAL) >= 0)),
  recorded_at_utc TEXT NOT NULL ${utcCheck("recorded_at_utc")},
  CHECK ((input_tokens IS NULL AND output_tokens IS NULL AND total_tokens IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND total_tokens = input_tokens + output_tokens)),
  CHECK ((input_cost_usd_per_million_tokens IS NULL AND output_cost_usd_per_million_tokens IS NULL AND estimated_cost_usd IS NULL) OR (input_tokens IS NOT NULL AND output_tokens IS NOT NULL AND input_cost_usd_per_million_tokens IS NOT NULL AND output_cost_usd_per_million_tokens IS NOT NULL AND estimated_cost_usd IS NOT NULL)),
  FOREIGN KEY (coach_ai_review_generation_attempt_id) REFERENCES coach_ai_review_generation_attempts(coach_ai_review_generation_attempt_id) ON UPDATE RESTRICT ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER coach_ai_review_generation_attempts_weekly_scope BEFORE INSERT ON coach_ai_review_generation_attempts
WHEN NEW.review_kind = 'weekly' AND NOT EXISTS (
  SELECT 1 FROM coach_weekly_review_requests request
  WHERE request.coach_weekly_review_request_id = NEW.review_request_id
    AND request.user_id = NEW.user_id
    AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'coach_weekly_review_request_scope_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_monthly_scope BEFORE INSERT ON coach_ai_review_generation_attempts
WHEN NEW.review_kind = 'monthly' AND NOT EXISTS (
  SELECT 1 FROM coach_monthly_review_requests request
  WHERE request.coach_monthly_review_request_id = NEW.review_request_id
    AND request.user_id = NEW.user_id
    AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
)
BEGIN SELECT RAISE(ABORT, 'coach_monthly_review_request_scope_required'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_no_retry_after_issue BEFORE INSERT ON coach_ai_review_generation_attempts
WHEN EXISTS (
  SELECT 1 FROM coach_ai_review_generation_attempts prior
  WHERE prior.review_kind = NEW.review_kind
    AND prior.review_request_id = NEW.review_request_id
    AND prior.state = 'issued'
)
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_already_issued'); END;

CREATE TRIGGER coach_ai_review_generation_attempts_no_delete BEFORE DELETE ON coach_ai_review_generation_attempts BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_history_required'); END;
CREATE TRIGGER coach_ai_review_generation_attempts_terminal_immutable BEFORE UPDATE ON coach_ai_review_generation_attempts WHEN OLD.state <> 'pending' BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_attempt_terminal'); END;
CREATE TRIGGER coach_ai_review_generation_attempts_pending_guard BEFORE UPDATE ON coach_ai_review_generation_attempts WHEN OLD.state = 'pending' AND (NEW.coach_ai_review_generation_attempt_id <> OLD.coach_ai_review_generation_attempt_id OR NEW.user_id <> OLD.user_id OR NEW.workspace_id <> OLD.workspace_id OR NEW.account_id <> OLD.account_id OR NEW.review_kind <> OLD.review_kind OR NEW.review_request_id <> OLD.review_request_id OR NEW.attempt_number <> OLD.attempt_number OR NEW.provider_key <> OLD.provider_key OR NEW.model_id <> OLD.model_id OR NEW.created_at_utc <> OLD.created_at_utc) BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_attempt_identity_immutable'); END;
CREATE TRIGGER coach_ai_review_generation_attempt_receipts_no_update BEFORE UPDATE ON coach_ai_review_generation_attempt_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_receipt_immutable'); END;
CREATE TRIGGER coach_ai_review_generation_attempt_receipts_no_delete BEFORE DELETE ON coach_ai_review_generation_attempt_receipts BEGIN SELECT RAISE(ABORT, 'coach_ai_review_generation_history_required'); END;`;

export const coachAiReviewGenerationAttemptsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0028_coach_ai_review_generation_attempts",
  executionOrder: 28,
  statements: Object.freeze([sql]),
});
