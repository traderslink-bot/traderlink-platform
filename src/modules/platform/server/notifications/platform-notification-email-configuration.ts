import "server-only";

import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_NOTIFICATION_EMAIL_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_NOTIFICATION_EMAIL_ACTIVE_KEY_VERSION" as const;
export const TRADERLINK_NOTIFICATION_EMAIL_KEYS_BASE64_ENV =
  "TRADERLINK_NOTIFICATION_EMAIL_KEYS_BASE64" as const;

const VERSION = /^[A-Za-z0-9_-]{1,64}$/u;

export type PlatformNotificationEmailEncryptionConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

function failure(): never {
  return platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
    field: "notificationEmailEncryptionConfiguration",
  });
}

function decodeBase64Key(value: string): void {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== value) failure();
}

/**
 * Loads a versioned AES-256 key ring used only for notification email
 * addresses. Keys are deliberately separate from browser push subscriptions.
 */
export function loadPlatformNotificationEmailEncryptionConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): PlatformNotificationEmailEncryptionConfiguration {
  const activeKeyVersion = environment[TRADERLINK_NOTIFICATION_EMAIL_ACTIVE_KEY_VERSION_ENV];
  const encoded = environment[TRADERLINK_NOTIFICATION_EMAIL_KEYS_BASE64_ENV];
  if (!activeKeyVersion || !VERSION.test(activeKeyVersion) || !encoded) failure();

  let parsed: unknown;
  try {
    parsed = JSON.parse(encoded);
  } catch {
    failure();
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) failure();

  const keysBase64 = Object.fromEntries(Object.entries(parsed).map(([version, key]) => {
    if (!VERSION.test(version) || typeof key !== "string") failure();
    decodeBase64Key(key);
    return [version, key];
  }));
  if (!(activeKeyVersion in keysBase64)) failure();
  return Object.freeze({ activeKeyVersion, keysBase64: Object.freeze(keysBase64) });
}
