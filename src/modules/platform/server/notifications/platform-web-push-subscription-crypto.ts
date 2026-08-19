import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import type { PlatformWebPushEncryptionConfiguration } from "./platform-web-push-configuration";
import { platformFailure } from "../database/platform-migration-contract";

export type PlatformWebPushSubscriptionInput = Readonly<{
  endpoint: string;
  expirationTime: number | null;
  keys: Readonly<{
    auth: string;
    p256dh: string;
  }>;
}>;

export type EncryptedPlatformWebPushSubscription = Readonly<{
  authenticationTag: string;
  ciphertext: string;
  initializationVector: string;
  keyVersion: string;
}>;

function failure(): never {
  return platformFailure("TRADERLINK_WEB_PUSH_STORAGE_INVALID");
}

function encryptionKey(
  configuration: PlatformWebPushEncryptionConfiguration,
  version: string,
): Buffer {
  const encoded = configuration.keysBase64[version];
  if (!encoded) return failure();
  const decoded = Buffer.from(encoded, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== encoded) return failure();
  return decoded;
}

function aad(input: Readonly<{
  deviceRef: string;
  endpointHash: string;
  userId: string;
}>): Buffer {
  return Buffer.from(
    `traderlink-web-push-subscription-v1\n${input.userId}\n${input.deviceRef}\n${input.endpointHash}`,
    "utf8",
  );
}

function base64url(value: unknown, minimumBytes: number, maximumBytes: number): string {
  if (typeof value !== "string" || !/^[A-Za-z0-9_-]+$/u.test(value)) failure();
  const decoded = Buffer.from(value, "base64url");
  if (
    decoded.length < minimumBytes ||
    decoded.length > maximumBytes ||
    decoded.toString("base64url") !== value
  ) {
    failure();
  }
  return value;
}

export function normalizePlatformWebPushSubscription(
  value: unknown,
): PlatformWebPushSubscriptionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) failure();
  const candidate = value as Record<string, unknown>;
  const endpointValue = normalizePlatformWebPushEndpoint(candidate.endpoint);
  const expirationTime = candidate.expirationTime;
  if (
    expirationTime !== null &&
    (typeof expirationTime !== "number" || !Number.isSafeInteger(expirationTime) || expirationTime < 0)
  ) {
    failure();
  }
  if (!candidate.keys || typeof candidate.keys !== "object" || Array.isArray(candidate.keys)) {
    failure();
  }
  const keys = candidate.keys as Record<string, unknown>;
  return Object.freeze({
    endpoint: endpointValue,
    expirationTime: expirationTime as number | null,
    keys: Object.freeze({
      auth: base64url(keys.auth, 16, 64),
      p256dh: base64url(keys.p256dh, 33, 128),
    }),
  });
}

export function normalizePlatformWebPushEndpoint(value: unknown): string {
  if (typeof value !== "string" || value.length > 4096) failure();
  let endpoint: URL;
  try {
    endpoint = new URL(value);
  } catch {
    failure();
  }
  if (
    endpoint.protocol !== "https:" || endpoint.username || endpoint.password ||
    endpoint.hash || endpoint.href !== value
  ) {
    failure();
  }
  return value;
}

export function encryptPlatformWebPushSubscription(input: Readonly<{
  configuration: PlatformWebPushEncryptionConfiguration;
  deviceRef: string;
  endpointHash: string;
  subscription: PlatformWebPushSubscriptionInput;
  userId: string;
}>): EncryptedPlatformWebPushSubscription {
  const normalized = normalizePlatformWebPushSubscription(input.subscription);
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    encryptionKey(input.configuration, input.configuration.activeKeyVersion),
    initializationVector,
  );
  cipher.setAAD(aad(input));
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify([
      "traderlink_web_push_subscription_v1",
      normalized.endpoint,
      normalized.expirationTime,
      normalized.keys.auth,
      normalized.keys.p256dh,
    ]), "utf8"),
    cipher.final(),
  ]);
  return Object.freeze({
    authenticationTag: cipher.getAuthTag().toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    initializationVector: initializationVector.toString("base64url"),
    keyVersion: input.configuration.activeKeyVersion,
  });
}

export function decryptPlatformWebPushSubscription(input: Readonly<{
  configuration: PlatformWebPushEncryptionConfiguration;
  deviceRef: string;
  encrypted: EncryptedPlatformWebPushSubscription;
  endpointHash: string;
  userId: string;
}>): PlatformWebPushSubscriptionInput {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(input.configuration, input.encrypted.keyVersion),
      Buffer.from(input.encrypted.initializationVector, "base64url"),
    );
    decipher.setAAD(aad(input));
    decipher.setAuthTag(Buffer.from(input.encrypted.authenticationTag, "base64url"));
    const parsed: unknown = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(input.encrypted.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 5 ||
      parsed[0] !== "traderlink_web_push_subscription_v1") failure();
    return normalizePlatformWebPushSubscription({
      endpoint: parsed[1],
      expirationTime: parsed[2],
      keys: { auth: parsed[3], p256dh: parsed[4] },
    });
  } catch {
    return failure();
  }
}
