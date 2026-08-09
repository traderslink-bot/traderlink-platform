import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE coach_ai_review_account_settings_v2
  ADD COLUMN review_timing_mode TEXT NOT NULL
  DEFAULT 'automatic_after_12_hours'
  CHECK (review_timing_mode IN ('automatic_after_12_hours', 'wait_for_tracker_input'));

ALTER TABLE coach_ai_review_account_setting_revisions_v2
  ADD COLUMN review_timing_mode TEXT NOT NULL
  DEFAULT 'automatic_after_12_hours'
  CHECK (review_timing_mode IN ('automatic_after_12_hours', 'wait_for_tracker_input'));`;

export const coachAiReviewTimingModesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "coach",
  migrationId: "0043_coach_ai_review_timing_modes",
  executionOrder: 43,
  statements: Object.freeze([sql]),
});
