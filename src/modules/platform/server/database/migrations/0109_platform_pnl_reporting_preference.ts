import type { PlatformMigration } from "../platform-migration-contract";

const sql = `ALTER TABLE platform_user_preferences
ADD COLUMN pnl_reporting_basis TEXT NOT NULL DEFAULT 'gross'
  CHECK (pnl_reporting_basis IN ('gross', 'net'));`;

export const platformPnlReportingPreferenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0109_platform_pnl_reporting_preference",
  executionOrder: 109,
  statements: Object.freeze([sql]),
});
