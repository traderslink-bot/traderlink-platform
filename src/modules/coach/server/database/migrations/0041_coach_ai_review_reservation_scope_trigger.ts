import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `DROP TRIGGER coach_ai_review_generation_control_reservations_v2_scope;

CREATE TRIGGER coach_ai_review_generation_control_reservations_v2_scope
BEFORE INSERT ON coach_ai_review_generation_control_reservations_v2
WHEN NOT EXISTS (
  SELECT 1
  FROM coach_ai_review_generation_attempts_v2 attempt
  JOIN coach_ai_review_period_requests_v2 request
    ON request.coach_ai_review_period_request_id = attempt.coach_ai_review_period_request_id
  WHERE attempt.coach_ai_review_generation_attempt_id = NEW.coach_ai_review_generation_attempt_id
    AND attempt.user_id = NEW.user_id
    AND attempt.workspace_id = NEW.workspace_id
    AND attempt.account_id = NEW.account_id
    AND attempt.state = 'pending'
    AND request.user_id = NEW.user_id
    AND request.workspace_id = NEW.workspace_id
    AND request.account_id = NEW.account_id
    AND (
      (NEW.feature_key = 'weekly_reviews' AND request.review_kind IN ('weekly', 'two_week'))
      OR (NEW.feature_key = 'monthly_reviews' AND request.review_kind = 'monthly')
    )
)
BEGIN
  SELECT RAISE(ABORT, 'coach_ai_review_generation_control_reservation_scope_required');
END;`;

export const coachAiReviewReservationScopeTriggerMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0041_coach_ai_review_reservation_scope_trigger",
    executionOrder: 41,
    statements: Object.freeze([sql]),
  });
