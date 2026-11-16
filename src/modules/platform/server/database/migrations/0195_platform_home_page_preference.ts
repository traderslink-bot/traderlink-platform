import type { PlatformMigration } from "../platform-migration-contract";

export const platformHomePagePreferenceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0195_platform_home_page_preference",
  executionOrder: 255,
  statements: Object.freeze([
    `ALTER TABLE platform_user_preferences
ADD COLUMN home_page TEXT NOT NULL DEFAULT 'welcome'
  CHECK (home_page IN ('welcome', 'trading-workspace', 'scanners', 'screeners', 'journal-workspace'));`,
  ]),
});
