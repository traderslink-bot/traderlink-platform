import type { PlatformMigration } from "../platform-migration-contract";

export const platformAppearancePreferencesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0103_platform_appearance_preferences",
  executionOrder: 103,
  statements: Object.freeze([
    `ALTER TABLE platform_user_preferences
ADD COLUMN appearance_mode TEXT NOT NULL DEFAULT 'light'
  CHECK (appearance_mode IN ('light', 'dark'))`,
  ]),
});
