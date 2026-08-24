import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { platformFailure } from "../database/platform-migration-contract";
import type { PlatformNotificationEmailEncryptionConfiguration } from "./platform-notification-email-configuration";

export type EncryptedPlatformNotificationEmailAddress = Readonly<{
  authenticationTag: string;
  ciphertext: string;
  initializationVector: string;
  keyVersion: string;
}>;

const emailAddressPattern = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/u;
const base64urlPattern = /^[A-Za-z0-9_-]+$/u;

function failure(field: string): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field });
}

export function normalizePlatformNotificationEmailAddress(value: unknown): string {
  if (typeof value !== "string") failure("notificationEmailAddress");
  const normalized = value.trim().toLowerCase();
  if (
    normalized.length < 3 || normalized.length > 254 || !emailAddressPattern.test(normalized) ||
    /[\u0000-\u001f\u007f]/u.test(normalized)
  ) {
    failure("notificationEmailAddress");
  }
  return normalized;
}

export function platformNotificationEmailAddressHash(emailAddress: string): string {
  return createHash("sha256")
    .update(`traderlink:notification-email-address:v1\n${emailAddress}`, "utf8")
    .digest("hex");
}

function encryptionKey(
  configuration: PlatformNotificationEmailEncryptionConfiguration,
  version: string,
): Buffer {
  const encoded = configuration.keysBase64[version];
  if (!encoded) return failure("notificationEmailEncryptionKey");
  const decoded = Buffer.from(encoded, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== encoded) {
    return failure("notificationEmailEncryptionKey");
  }
  return decoded;
}

function aad(input: Readonly<{
  addressHash: string;
  emailAddressRef: string;
  userId: string;
}>): Buffer {
  return Buffer.from(
    `traderlink-notification-email-address-v1\n${input.userId}\n${input.emailAddressRef}\n${input.addressHash}`,
    "utf8",
  );
}

function base64url(value: string, field: string, minimumBytes: number, maximumBytes: number): Buffer {
  if (!base64urlPattern.test(value)) failure(field);
  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length < minimumBytes || decoded.length > maximumBytes ||
    decoded.toString("base64url") !== value
  ) {
    failure(field);
  }
  return decoded;
}

export function encryptPlatformNotificationEmailAddress(input: Readonly<{
  configuration: PlatformNotificationEmailEncryptionConfiguration;
  emailAddress: unknown;
  emailAddressRef: string;
  userId: string;
}>): Readonly<{ addressHash: string; encrypted: EncryptedPlatformNotificationEmailAddress }> {
  const emailAddress = normalizePlatformNotificationEmailAddress(input.emailAddress);
  const addressHash = platformNotificationEmailAddressHash(emailAddress);
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(input.configuration, input.configuration.activeKeyVersion),
    initializationVector,
  );
  cipher.setAAD(aad({
    addressHash,
    emailAddressRef: input.emailAddressRef,
    userId: input.userId,
  }));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(["traderlink_notification_email_address_v1", emailAddress]), "utf8"),
    cipher.final(),
  ]);
  return Object.freeze({
    addressHash,
    encrypted: Object.freeze({
      authenticationTag: cipher.getAuthTag().toString("base64url"),
      ciphertext: ciphertext.toString("base64url"),
      initializationVector: initializationVector.toString("base64url"),
      keyVersion: input.configuration.activeKeyVersion,
    }),
  });
}

export function decryptPlatformNotificationEmailAddress(input: Readonly<{
  addressHash: string;
  configuration: PlatformNotificationEmailEncryptionConfiguration;
  emailAddressRef: string;
  encrypted: EncryptedPlatformNotificationEmailAddress;
  userId: string;
}>): string {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(input.configuration, input.encrypted.keyVersion),
      base64url(input.encrypted.initializationVector, "notificationEmailInitializationVector", 12, 12),
    );
    decipher.setAAD(aad(input));
    decipher.setAuthTag(base64url(input.encrypted.authenticationTag, "notificationEmailAuthenticationTag", 16, 16));
    const parsed: unknown = JSON.parse(Buffer.concat([
      decipher.update(base64url(input.encrypted.ciphertext, "notificationEmailCiphertext", 1, 2048)),
      decipher.final(),
    ]).toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 2 || parsed[0] !== "traderlink_notification_email_address_v1") {
      return failure("notificationEmailStoredValue");
    }
    const emailAddress = normalizePlatformNotificationEmailAddress(parsed[1]);
    if (platformNotificationEmailAddressHash(emailAddress) !== input.addressHash) {
      return failure("notificationEmailAddressHash");
    }
    return emailAddress;
  } catch {
    return failure("notificationEmailStorage");
  }
}
