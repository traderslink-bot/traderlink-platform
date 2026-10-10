import type { PlatformMigration } from "../platform-migration-contract";

export const platformMembershipFeatureCopyMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0157_platform_membership_feature_copy", executionOrder: 157,
  statements: Object.freeze([`
CREATE TABLE platform_membership_feature_copy (
  feature_key TEXT PRIMARY KEY REFERENCES platform_membership_feature_definitions(feature_key),
  brief TEXT NOT NULL,
  details TEXT NOT NULL,
  updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL
) STRICT;
`]),
});
