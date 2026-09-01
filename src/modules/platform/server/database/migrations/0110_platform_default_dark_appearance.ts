import type { PlatformMigration } from "../platform-migration-contract";

export const platformDefaultDarkAppearanceMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0110_platform_default_dark_appearance",
  executionOrder: 110,
  statements: Object.freeze([
    `UPDATE platform_user_preferences
SET appearance_mode = 'dark',
    updated_at_utc = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE appearance_mode <> 'dark'`,
    `DROP TRIGGER platform_users_create_preferences`,
    `CREATE TRIGGER platform_users_create_preferences
AFTER INSERT ON platform_users BEGIN
  INSERT INTO platform_user_preferences (
    user_id,
    reporting_currency,
    appearance_mode,
    updated_at_utc
  ) VALUES (
    NEW.user_id,
    'USD',
    'dark',
    NEW.updated_at_utc
  );
END`,
  ]),
});
