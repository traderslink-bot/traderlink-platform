import type { PlatformMigration } from "../platform-migration-contract";

/** Coordinator reservation: 0171 Shared alerts precedes this candidate; no hosted application. */
export const platformLoginIdentityProfilesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0172_platform_login_identity_profiles",
  executionOrder: 185,
  statements: Object.freeze([
    `CREATE TABLE platform_login_identity_profiles (
      auth_provider TEXT NOT NULL CHECK(auth_provider IN ('google','discord')),
      auth_subject TEXT NOT NULL,
      display_name TEXT NOT NULL CHECK(length(display_name) BETWEEN 1 AND 120),
      verified_email TEXT CHECK(verified_email IS NULL OR length(verified_email) BETWEEN 3 AND 254),
      updated_at_utc TEXT NOT NULL,
      PRIMARY KEY(auth_provider, auth_subject),
      FOREIGN KEY(auth_provider, auth_subject) REFERENCES platform_auth_identities(auth_provider, auth_subject)
        ON UPDATE RESTRICT ON DELETE RESTRICT
    ) STRICT, WITHOUT ROWID`,
  ]),
});
