import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function utcCheck(column: string): string {
  return `CHECK (
    length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'
  )`;
}

function nullablePositiveMoney(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) BETWEEN 1 AND 32
    AND ${column} NOT GLOB '*[^0-9.]*'
    AND ${column} NOT GLOB '*.*.*'
    AND CAST(${column} AS REAL) > 0
  ))`;
}

const sql = `CREATE TABLE coach_ai_review_budget_controls (
  control_key TEXT PRIMARY KEY CHECK (control_key = 'ai_reviews'),
  trailing_30_day_estimated_spend_cap_usd TEXT
    ${nullablePositiveMoney("trailing_30_day_estimated_spend_cap_usd")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")}
) STRICT, WITHOUT ROWID;

INSERT INTO coach_ai_review_budget_controls (
  control_key, trailing_30_day_estimated_spend_cap_usd, updated_at_utc
) VALUES ('ai_reviews', NULL, '2026-08-09T00:00:00.000Z');

CREATE TRIGGER coach_ai_review_budget_controls_no_delete
BEFORE DELETE ON coach_ai_review_budget_controls
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_control_required'); END;

CREATE TRIGGER coach_ai_review_budget_controls_identity_immutable
BEFORE UPDATE ON coach_ai_review_budget_controls
WHEN NEW.control_key <> OLD.control_key
  OR NEW.updated_at_utc <= OLD.updated_at_utc
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_control_transition_invalid'); END;

CREATE TRIGGER coach_ai_review_budget_controls_enabled_guard
BEFORE UPDATE ON coach_ai_review_budget_controls
WHEN NEW.trailing_30_day_estimated_spend_cap_usd IS NULL
  AND EXISTS (
    SELECT 1 FROM coach_ai_feature_controls
    WHERE feature_key IN ('weekly_reviews', 'monthly_reviews')
      AND scope_kind = 'platform' AND enabled = 1
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_cap_required'); END;

CREATE TRIGGER coach_ai_review_budget_required_before_feature_insert
BEFORE INSERT ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_budget_controls
    WHERE control_key = 'ai_reviews'
      AND trailing_30_day_estimated_spend_cap_usd IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_cap_required'); END;

CREATE TRIGGER coach_ai_review_budget_required_before_feature_update
BEFORE UPDATE OF enabled ON coach_ai_feature_controls
WHEN NEW.feature_key IN ('weekly_reviews', 'monthly_reviews')
  AND NEW.scope_kind = 'platform' AND NEW.enabled = 1
  AND NOT EXISTS (
    SELECT 1 FROM coach_ai_review_budget_controls
    WHERE control_key = 'ai_reviews'
      AND trailing_30_day_estimated_spend_cap_usd IS NOT NULL
  )
BEGIN SELECT RAISE(ABORT, 'coach_ai_review_budget_cap_required'); END;`;

export const coachAiReviewRollingSpendGuardMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0049_coach_ai_review_rolling_spend_guard",
    executionOrder: 49,
    statements: Object.freeze([sql]),
  });
