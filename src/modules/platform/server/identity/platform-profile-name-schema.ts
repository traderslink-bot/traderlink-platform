/** Additive custom-name ownership; no backfill, renaming or identity changes. */
export const platformProfileNameSchemaStatements = Object.freeze([
  `ALTER TABLE platform_login_identity_profiles ADD COLUMN profile_display_name TEXT
    CHECK(profile_display_name IS NULL OR length(profile_display_name) BETWEEN 1 AND 120)`,
  `CREATE TABLE platform_user_profile_names (
    user_id TEXT PRIMARY KEY REFERENCES platform_users(user_id) ON DELETE RESTRICT,
    normalized_name TEXT NOT NULL UNIQUE CHECK(length(normalized_name) BETWEEN 1 AND 360),
    saved_at_utc TEXT NOT NULL
  ) STRICT`,
]);
