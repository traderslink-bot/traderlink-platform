import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const sql = `ALTER TABLE journal_trade_style_plans ADD COLUMN entry_reason_text TEXT CHECK (
  entry_reason_text IS NULL OR (length(entry_reason_text) BETWEEN 1 AND 12000 AND instr(entry_reason_text, char(0)) = 0)
);
ALTER TABLE journal_trade_style_plans ADD COLUMN has_upcoming_catalyst INTEGER CHECK (
  has_upcoming_catalyst IS NULL OR has_upcoming_catalyst IN (0, 1)
);
ALTER TABLE journal_trade_style_plans ADD COLUMN catalyst_details_text TEXT CHECK (
  catalyst_details_text IS NULL OR (length(catalyst_details_text) BETWEEN 1 AND 12000 AND instr(catalyst_details_text, char(0)) = 0)
);
ALTER TABLE journal_trade_style_plans ADD COLUMN planned_hold_trading_days INTEGER CHECK (
  planned_hold_trading_days IS NULL OR planned_hold_trading_days BETWEEN 1 AND 252
);
ALTER TABLE journal_trade_style_plan_events ADD COLUMN entry_reason_text TEXT CHECK (
  entry_reason_text IS NULL OR (length(entry_reason_text) BETWEEN 1 AND 12000 AND instr(entry_reason_text, char(0)) = 0)
);
ALTER TABLE journal_trade_style_plan_events ADD COLUMN has_upcoming_catalyst INTEGER CHECK (
  has_upcoming_catalyst IS NULL OR has_upcoming_catalyst IN (0, 1)
);
ALTER TABLE journal_trade_style_plan_events ADD COLUMN catalyst_details_text TEXT CHECK (
  catalyst_details_text IS NULL OR (length(catalyst_details_text) BETWEEN 1 AND 12000 AND instr(catalyst_details_text, char(0)) = 0)
);
ALTER TABLE journal_trade_style_plan_events ADD COLUMN planned_hold_trading_days INTEGER CHECK (
  planned_hold_trading_days IS NULL OR planned_hold_trading_days BETWEEN 1 AND 252
);`;

export const journalSwingPositionPlansMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "journal",
  migrationId: "0075_journal_swing_position_plans",
  executionOrder: 75,
  statements: Object.freeze([sql]),
});
