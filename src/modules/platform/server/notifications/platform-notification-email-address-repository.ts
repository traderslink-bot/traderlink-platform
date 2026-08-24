import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "../../contracts/workspace-access-scope";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
  createCanonicalUuidV4,
  platformFailure,
} from "../database/platform-migration-contract";
import {
  decryptPlatformNotificationEmailAddress,
  encryptPlatformNotificationEmailAddress,
  type EncryptedPlatformNotificationEmailAddress,
} from "./platform-notification-email-crypto";
import type { PlatformNotificationEmailEncryptionConfiguration } from "./platform-notification-email-configuration";
import {
  deliverPlatformNotificationEmail,
} from "./platform-resend-notification-email";
import type { PlatformNotificationDeliveryResult } from "./platform-remote-notification-delivery-contracts";

type EmailAddressState = "pending_confirmation" | "confirmed" | "superseded" | "disabled";

type EmailAddressRow = Readonly<{
  address_hash: string;
  authentication_tag: string;
  ciphertext: string;
  confirmation_expires_at_utc: string | null;
  confirmation_token_sha256: string | null;
  email_address_id: string;
  initialization_vector: string;
  key_version: string;
  state: EmailAddressState;
  user_id: string;
}>;

export type PlatformNotificationEmailAddressStatus = Readonly<{
  confirmationExpiresAtUtc: string | null;
  maskedEmailAddress: string | null;
  state: "none" | "pending_confirmation" | "confirmed";
}>;

export type PlatformResolvedNotificationEmailAddress = Readonly<{
  emailAddress: string;
  emailAddressRef: string;
}>;

export type PlatformNotificationEmailConfirmationResult = Readonly<{
  delivery: PlatformNotificationDeliveryResult;
  status: PlatformNotificationEmailAddressStatus;
}>;

export type PlatformNotificationEmailConfirmationCodeResult = Readonly<{
  status: "confirmed" | "invalid_or_expired";
}>;

type NotificationEmailDelivery = typeof deliverPlatformNotificationEmail;

const confirmationLifetimeMilliseconds = 30 * 60_000;
const confirmationCodePattern = /^[A-Za-z0-9_-]{16,64}$/u;

function confirmationCode(): string {
  return randomBytes(18).toString("base64url");
}

function confirmationTokenHash(input: Readonly<{
  code: string;
  emailAddressRef: string;
  userId: string;
}>): string {
  return createHash("sha256").update(
    `traderlink:notification-email-confirmation:v1\n${input.userId}\n${input.emailAddressRef}\n${input.code}`,
    "utf8",
  ).digest("hex");
}

function maskedEmailAddress(value: string): string {
  const [local, domain] = value.split("@");
  if (!local || !domain) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationEmailAddress" });
  }
  const localMask = local.length === 1 ? "*" : `${local.slice(0, 1)}***${local.slice(-1)}`;
  return `${localMask}@${domain}`;
}

function encrypted(row: EmailAddressRow): EncryptedPlatformNotificationEmailAddress {
  return Object.freeze({
    authenticationTag: row.authentication_tag,
    ciphertext: row.ciphertext,
    initializationVector: row.initialization_vector,
    keyVersion: row.key_version,
  });
}

function statusFor(row: EmailAddressRow | null, configuration: PlatformNotificationEmailEncryptionConfiguration): PlatformNotificationEmailAddressStatus {
  if (!row || (row.state !== "pending_confirmation" && row.state !== "confirmed")) {
    return Object.freeze({ confirmationExpiresAtUtc: null, maskedEmailAddress: null, state: "none" });
  }
  const emailAddress = decryptPlatformNotificationEmailAddress({
    addressHash: row.address_hash,
    configuration,
    emailAddressRef: row.email_address_id,
    encrypted: encrypted(row),
    userId: row.user_id,
  });
  return Object.freeze({
    confirmationExpiresAtUtc: row.state === "pending_confirmation" ? row.confirmation_expires_at_utc : null,
    maskedEmailAddress: maskedEmailAddress(emailAddress),
    state: row.state,
  });
}

/**
 * Account-scoped encrypted notification-email contact storage. The database
 * retains only an encrypted address and a one-way confirmation-code digest.
 */
export class PlatformNotificationEmailAddressRepository {
  constructor(
    private readonly database: Database.Database,
    private readonly configuration: PlatformNotificationEmailEncryptionConfiguration,
    private readonly notificationEmailDelivery: NotificationEmailDelivery = deliverPlatformNotificationEmail,
    private readonly createConfirmationCode: () => string = confirmationCode,
  ) {}

  private assertActiveScope(scope: WorkspaceAccessScope): void {
    const row = this.database.prepare<[string, string], { found: number }>(`SELECT 1 AS found
FROM platform_workspace_memberships membership
JOIN platform_users user ON user.user_id = membership.user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = membership.workspace_id
WHERE membership.user_id = ? AND membership.workspace_id = ?
  AND membership.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active'`).get(scope.userId, scope.workspaceId);
    if (!row) platformFailure("TRADERLINK_WORKSPACE_ACCESS_DENIED");
  }

  private activeAddressForUser(userId: string): EmailAddressRow | null {
    return this.database.prepare<[string], EmailAddressRow>(`SELECT
  email_address_id, user_id, address_hash, key_version, initialization_vector,
  ciphertext, authentication_tag, state, confirmation_token_sha256,
  confirmation_expires_at_utc
FROM platform_notification_email_addresses
WHERE user_id = ? AND state IN ('pending_confirmation', 'confirmed')
ORDER BY CASE state WHEN 'pending_confirmation' THEN 0 ELSE 1 END,
  updated_at_utc DESC, email_address_id DESC
LIMIT 1`).get(userId) ?? null;
  }

  readStatus(scope: WorkspaceAccessScope): PlatformNotificationEmailAddressStatus {
    this.assertActiveScope(scope);
    return statusFor(this.activeAddressForUser(scope.userId), this.configuration);
  }

  /**
   * Replaces the active contact with a pending encrypted address, then sends a
   * short-lived confirmation code. The plaintext code never reaches storage.
   */
  async requestConfirmation(input: Readonly<{
    emailAddress: unknown;
    requestedAtUtc: string;
    scope: WorkspaceAccessScope;
  }>): Promise<PlatformNotificationEmailConfirmationResult> {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.requestedAtUtc, "notificationEmailRequestedAtUtc");
    const code = this.createConfirmationCode();
    if (!confirmationCodePattern.test(code)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "notificationEmailConfirmationCode" });
    }
    const emailAddressRef = createCanonicalUuidV4();
    const email = encryptPlatformNotificationEmailAddress({
      configuration: this.configuration,
      emailAddress: input.emailAddress,
      emailAddressRef,
      userId: input.scope.userId,
    });
    const expiresAtUtc = new Date(Date.parse(input.requestedAtUtc) + confirmationLifetimeMilliseconds).toISOString();
    assertCanonicalUtcTimestamp(expiresAtUtc, "notificationEmailConfirmationExpiresAtUtc");
    const tokenHash = confirmationTokenHash({
      code,
      emailAddressRef,
      userId: input.scope.userId,
    });

    this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_notification_email_addresses
SET state = 'superseded', confirmation_token_sha256 = NULL,
    confirmation_expires_at_utc = NULL, updated_at_utc = ?
WHERE user_id = ? AND state = 'pending_confirmation'`).run(
        input.requestedAtUtc,
        input.scope.userId,
      );
      this.database.prepare(`INSERT INTO platform_notification_email_addresses (
  email_address_id, user_id, address_hash, key_version, initialization_vector,
  ciphertext, authentication_tag, state, confirmation_token_sha256,
  confirmation_expires_at_utc, confirmed_at_utc, created_at_utc, updated_at_utc
) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending_confirmation', ?, ?, NULL, ?, ?)`).run(
        emailAddressRef,
        input.scope.userId,
        email.addressHash,
        email.encrypted.keyVersion,
        email.encrypted.initializationVector,
        email.encrypted.ciphertext,
        email.encrypted.authenticationTag,
        tokenHash,
        expiresAtUtc,
        input.requestedAtUtc,
        input.requestedAtUtc,
      );
    }).immediate();

    const delivery = await this.notificationEmailDelivery({
      content: Object.freeze({
        destinationPath: null,
        summary: `Use this code to confirm your TradersLink notification email: ${code}`,
        title: "Confirm your notification email",
      }),
      emailAddress: decryptPlatformNotificationEmailAddress({
        addressHash: email.addressHash,
        configuration: this.configuration,
        emailAddressRef,
        encrypted: email.encrypted,
        userId: input.scope.userId,
      }),
      idempotencyKey: `traderlink-notification-email-confirmation:${emailAddressRef}:${tokenHash.slice(0, 16)}`,
    });
    return Object.freeze({
      delivery,
      status: this.readStatus(input.scope),
    });
  }

  confirmCode(input: Readonly<{
    code: unknown;
    confirmedAtUtc: string;
    scope: WorkspaceAccessScope;
  }>): PlatformNotificationEmailConfirmationCodeResult {
    this.assertActiveScope(input.scope);
    assertCanonicalUtcTimestamp(input.confirmedAtUtc, "notificationEmailConfirmedAtUtc");
    if (typeof input.code !== "string" || !confirmationCodePattern.test(input.code)) {
      return Object.freeze({ status: "invalid_or_expired" });
    }
    const row = this.activeAddressForUser(input.scope.userId);
    if (
      !row || row.state !== "pending_confirmation" || !row.confirmation_token_sha256 ||
      !row.confirmation_expires_at_utc || Date.parse(row.confirmation_expires_at_utc) < Date.parse(input.confirmedAtUtc)
    ) {
      return Object.freeze({ status: "invalid_or_expired" });
    }
    const actual = Buffer.from(row.confirmation_token_sha256, "hex");
    const expected = Buffer.from(confirmationTokenHash({
      code: input.code,
      emailAddressRef: row.email_address_id,
      userId: input.scope.userId,
    }), "hex");
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) {
      return Object.freeze({ status: "invalid_or_expired" });
    }
    const result = this.database.transaction(() => {
      this.database.prepare(`UPDATE platform_notification_email_addresses
SET state = 'superseded', updated_at_utc = ?
WHERE user_id = ? AND state = 'confirmed'`).run(input.confirmedAtUtc, input.scope.userId);
      return this.database.prepare(`UPDATE platform_notification_email_addresses
SET state = 'confirmed', confirmation_token_sha256 = NULL,
    confirmation_expires_at_utc = NULL, confirmed_at_utc = ?, updated_at_utc = ?
WHERE email_address_id = ? AND user_id = ? AND state = 'pending_confirmation'`).run(
        input.confirmedAtUtc,
        input.confirmedAtUtc,
        row.email_address_id,
        input.scope.userId,
      );
    })();
    return Object.freeze({ status: result.changes === 1 ? "confirmed" : "invalid_or_expired" });
  }

  /** Returns only a currently confirmed address for the delivery worker. */
  resolveConfirmedAddress(userId: string): PlatformResolvedNotificationEmailAddress | null {
    assertCanonicalUuidV4(userId, "notificationEmailUserId");
    const row = this.database.prepare<[string], EmailAddressRow>(`SELECT
  email_address_id, user_id, address_hash, key_version, initialization_vector,
  ciphertext, authentication_tag, state, confirmation_token_sha256,
  confirmation_expires_at_utc
FROM platform_notification_email_addresses
WHERE user_id = ? AND state = 'confirmed'
ORDER BY confirmed_at_utc DESC, email_address_id DESC
LIMIT 1`).get(userId) ?? null;
    if (!row) return null;
    return Object.freeze({
      emailAddress: decryptPlatformNotificationEmailAddress({
        addressHash: row.address_hash,
        configuration: this.configuration,
        emailAddressRef: row.email_address_id,
        encrypted: encrypted(row),
        userId,
      }),
      emailAddressRef: row.email_address_id,
    });
  }
}
