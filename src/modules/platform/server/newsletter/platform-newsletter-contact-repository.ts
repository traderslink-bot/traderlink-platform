import "server-only";

import type Database from "better-sqlite3";

import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import {
  encryptPlatformNotificationEmailAddress,
  normalizePlatformNotificationEmailAddress,
} from "../notifications/platform-notification-email-crypto";
import type { PlatformNotificationEmailEncryptionConfiguration } from "../notifications/platform-notification-email-configuration";

type NewsletterConsentState = "undecided" | "subscribed" | "declined" | "unsubscribed";

type NewsletterContactRow = Readonly<{
  address_hash: string;
  newsletter_consent_state: NewsletterConsentState;
}>;

export type PlatformNewsletterContactStatus = Readonly<{
  hasVerifiedDiscordEmail: boolean;
  newsletterConsentState: NewsletterConsentState | "unavailable";
}>;

function assertActiveUser(
  database: Database.Database,
  userId: string,
): void {
  assertCanonicalUuidV4(userId, "newsletterUserId");
  const row = database.prepare<[string], Readonly<{ found: number }>>(
    "SELECT 1 AS found FROM platform_users WHERE user_id = ? AND status = 'active'",
  ).get(userId);
  if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
}

export class PlatformNewsletterContactRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly configuration: PlatformNotificationEmailEncryptionConfiguration,
  ) {}

  readStatus(userId: string): PlatformNewsletterContactStatus {
    assertActiveUser(this.database, userId);
    const row = this.database.prepare<[string], NewsletterContactRow>(`SELECT
  address_hash, newsletter_consent_state
FROM platform_newsletter_contacts
WHERE user_id = ?`).get(userId);
    return Object.freeze({
      hasVerifiedDiscordEmail: Boolean(row),
      newsletterConsentState: row?.newsletter_consent_state ?? "unavailable",
    });
  }

  /** Stores only a verified email Discord returned during a server-side OAuth exchange. */
  syncVerifiedDiscordEmail(input: Readonly<{
    emailAddress: unknown;
    updatedAtUtc: string;
    userId: string;
  }>): void {
    assertActiveUser(this.database, input.userId);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "newsletterContactUpdatedAtUtc");
    const emailAddress = normalizePlatformNotificationEmailAddress(input.emailAddress);
    const encrypted = encryptPlatformNotificationEmailAddress({
      configuration: this.configuration,
      emailAddress,
      emailAddressRef: input.userId,
      userId: input.userId,
    });
    const current = this.database.prepare<[string], NewsletterContactRow>(`SELECT
  address_hash, newsletter_consent_state
FROM platform_newsletter_contacts
WHERE user_id = ?`).get(input.userId);
    if (current?.address_hash === encrypted.addressHash) return;

    if (!current) {
      this.database.prepare(`INSERT INTO platform_newsletter_contacts (
  user_id, address_hash, key_version, initialization_vector, ciphertext,
  authentication_tag, source, source_email_verified, newsletter_consent_state,
  consent_recorded_at_utc, subscribed_at_utc, unsubscribed_at_utc,
  created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, 'discord_oauth', 1, 'undecided', NULL, NULL, NULL, ?, ?)`)
          .run(
            input.userId,
            encrypted.addressHash,
            encrypted.encrypted.keyVersion,
            encrypted.encrypted.initializationVector,
            encrypted.encrypted.ciphertext,
            encrypted.encrypted.authenticationTag,
            input.updatedAtUtc,
            input.updatedAtUtc,
          );
      return;
    }

    const hadSubscription = current.newsletter_consent_state === "subscribed";
    this.database.prepare(`UPDATE platform_newsletter_contacts
SET address_hash = ?, key_version = ?, initialization_vector = ?, ciphertext = ?,
    authentication_tag = ?, source = 'discord_oauth', source_email_verified = 1,
    newsletter_consent_state = ?, consent_recorded_at_utc = ?, subscribed_at_utc = ?,
    unsubscribed_at_utc = ?, updated_at_utc = ?
WHERE user_id = ?`).run(
        encrypted.addressHash,
        encrypted.encrypted.keyVersion,
        encrypted.encrypted.initializationVector,
        encrypted.encrypted.ciphertext,
        encrypted.encrypted.authenticationTag,
        hadSubscription ? "unsubscribed" : "undecided",
        hadSubscription ? input.updatedAtUtc : null,
        hadSubscription ? input.updatedAtUtc : null,
        hadSubscription ? input.updatedAtUtc : null,
        input.updatedAtUtc,
        input.userId,
      );
  }

  recordSignupChoice(input: Readonly<{
    subscribe: boolean;
    updatedAtUtc: string;
    userId: string;
  }>): PlatformNewsletterContactStatus {
    assertActiveUser(this.database, input.userId);
    assertCanonicalUtcTimestamp(input.updatedAtUtc, "newsletterConsentUpdatedAtUtc");
    const row = this.database.prepare<[string], NewsletterContactRow>(`SELECT
  address_hash, newsletter_consent_state
FROM platform_newsletter_contacts
WHERE user_id = ?`).get(input.userId);
    if (!row) return Object.freeze({
      hasVerifiedDiscordEmail: false,
      newsletterConsentState: "unavailable",
    });

    const state: NewsletterConsentState = input.subscribe ? "subscribed" : "declined";
    this.database.prepare(`UPDATE platform_newsletter_contacts
SET newsletter_consent_state = ?, consent_recorded_at_utc = ?,
    subscribed_at_utc = ?, unsubscribed_at_utc = NULL, updated_at_utc = ?
WHERE user_id = ?`).run(
      state,
      input.updatedAtUtc,
      input.subscribe ? input.updatedAtUtc : null,
      input.updatedAtUtc,
      input.userId,
    );
    return Object.freeze({
      hasVerifiedDiscordEmail: true,
      newsletterConsentState: state,
    });
  }
}
