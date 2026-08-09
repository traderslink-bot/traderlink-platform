import type { PlatformMigration } from
  "@/src/modules/platform/server/database/platform-migration-contract";

function nullablePositiveMoney(column: string): string {
  return `CHECK (${column} IS NULL OR (
    length(${column}) BETWEEN 1 AND 32
    AND ${column} NOT GLOB '*[^0-9.]*'
    AND ${column} NOT GLOB '*.*.*'
    AND CAST(${column} AS REAL) > 0
  ))`;
}

function positiveMoney(column: string): string {
  return `CHECK (
    length(${column}) BETWEEN 1 AND 32
    AND ${column} NOT GLOB '*[^0-9.]*'
    AND ${column} NOT GLOB '*.*.*'
    AND CAST(${column} AS REAL) > 0
  )`;
}

const sql = `ALTER TABLE coach_ai_review_budget_controls
ADD COLUMN per_subscriber_paid_cycle_estimated_spend_cap_usd TEXT
  NOT NULL DEFAULT '1.00'
  ${positiveMoney("per_subscriber_paid_cycle_estimated_spend_cap_usd")};

ALTER TABLE coach_ai_review_budget_controls
ADD COLUMN emergency_trailing_30_day_estimated_spend_cap_usd TEXT
  ${nullablePositiveMoney("emergency_trailing_30_day_estimated_spend_cap_usd")};`;

export const coachAiReviewSubscriberBudgetSafeguardsMigration: PlatformMigration =
  Object.freeze({
    moduleNamespace: "coach",
    migrationId: "0050_coach_ai_review_subscriber_budget_safeguards",
    executionOrder: 50,
    statements: Object.freeze([sql]),
  });
