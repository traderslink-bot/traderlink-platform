import type { PlatformMigration } from "../platform-migration-contract";

function uuidCheck(column: string): string {
  return `CHECK (
    length(${column}) = 36 AND ${column} = lower(${column})
    AND length(replace(${column}, '-', '')) = 32
    AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*'
    AND substr(${column}, 15, 1) = '4' AND substr(${column}, 20, 1) GLOB '[89ab]'
  )`;
}

function utcCheck(column: string, nullable = false): string {
  const value = `length(${column}) = 24
    AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z'`;
  return `CHECK (${nullable ? `${column} IS NULL OR (` : "("}${value}${nullable ? ")" : ")"})`;
}

const sql = `CREATE TABLE platform_newsletter_contacts (
  user_id TEXT PRIMARY KEY ${uuidCheck("user_id")},
  address_hash TEXT NOT NULL CHECK (
    length(address_hash) = 64 AND address_hash = lower(address_hash)
    AND address_hash NOT GLOB '*[^0-9a-f]*'
  ),
  key_version TEXT NOT NULL CHECK (
    length(key_version) BETWEEN 1 AND 64
    AND key_version NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  initialization_vector TEXT NOT NULL CHECK (
    length(initialization_vector) BETWEEN 16 AND 64
    AND initialization_vector NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  ciphertext TEXT NOT NULL CHECK (
    length(ciphertext) BETWEEN 1 AND 2048
    AND ciphertext NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  authentication_tag TEXT NOT NULL CHECK (
    length(authentication_tag) BETWEEN 16 AND 64
    AND authentication_tag NOT GLOB '*[^A-Za-z0-9_-]*'
  ),
  source TEXT NOT NULL CHECK (source = 'discord_oauth'),
  source_email_verified INTEGER NOT NULL CHECK (source_email_verified = 1),
  newsletter_consent_state TEXT NOT NULL CHECK (
    newsletter_consent_state IN ('undecided', 'subscribed', 'declined', 'unsubscribed')
  ),
  consent_recorded_at_utc TEXT ${utcCheck("consent_recorded_at_utc", true)},
  subscribed_at_utc TEXT ${utcCheck("subscribed_at_utc", true)},
  unsubscribed_at_utc TEXT ${utcCheck("unsubscribed_at_utc", true)},
  created_at_utc TEXT NOT NULL ${utcCheck("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utcCheck("updated_at_utc")},
  FOREIGN KEY (user_id) REFERENCES platform_users(user_id)
    ON UPDATE RESTRICT ON DELETE RESTRICT,
  CHECK (
    (newsletter_consent_state = 'undecided'
      AND consent_recorded_at_utc IS NULL
      AND subscribed_at_utc IS NULL
      AND unsubscribed_at_utc IS NULL)
    OR (newsletter_consent_state = 'subscribed'
      AND consent_recorded_at_utc IS NOT NULL
      AND subscribed_at_utc IS NOT NULL
      AND unsubscribed_at_utc IS NULL)
    OR (newsletter_consent_state = 'declined'
      AND consent_recorded_at_utc IS NOT NULL
      AND subscribed_at_utc IS NULL
      AND unsubscribed_at_utc IS NULL)
    OR (newsletter_consent_state = 'unsubscribed'
      AND consent_recorded_at_utc IS NOT NULL
      AND subscribed_at_utc IS NOT NULL
      AND unsubscribed_at_utc IS NOT NULL)
  )
) STRICT;

CREATE INDEX platform_newsletter_contacts_subscriber_chronology
  ON platform_newsletter_contacts(newsletter_consent_state, updated_at_utc DESC, user_id);`;

export const platformNewsletterOptInMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0088_platform_newsletter_opt_in",
  executionOrder: 88,
  statements: Object.freeze([sql]),
});
