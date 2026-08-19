import "server-only";

import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_WEB_PUSH_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_WEB_PUSH_ACTIVE_KEY_VERSION" as const;
export const TRADERLINK_WEB_PUSH_KEYS_BASE64_ENV =
  "TRADERLINK_WEB_PUSH_KEYS_BASE64" as const;
export const TRADERLINK_WEB_PUSH_VAPID_PUBLIC_KEY_ENV =
  "TRADERLINK_WEB_PUSH_VAPID_PUBLIC_KEY" as const;
export const TRADERLINK_WEB_PUSH_VAPID_PRIVATE_KEY_ENV =
  "TRADERLINK_WEB_PUSH_VAPID_PRIVATE_KEY" as const;
export const TRADERLINK_WEB_PUSH_VAPID_SUBJECT_ENV =
  "TRADERLINK_WEB_PUSH_VAPID_SUBJECT" as const;

const VERSION = /^[A-Za-z0-9_-]{1,64}$/u;
const BASE64URL = /^[A-Za-z0-9_-]+$/u;

export type PlatformWebPushEncryptionConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

export type PlatformWebPushVapidConfiguration = Readonly<{
  privateKey: string;
  publicKey: string;
  subject: string;
}>;

export type PlatformWebPushConfiguration = Readonly<{
  encryption: PlatformWebPushEncryptionConfiguration;
  vapid: PlatformWebPushVapidConfiguration;
}>;

function failure(): never {
  return platformFailure("TRADERLINK_WEB_PUSH_CONFIGURATION_INVALID");
}

function decodeBase64(value: string, expectedBytes: number): Buffer {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== expectedBytes || decoded.toString("base64") !== value) failure();
  return decoded;
}

function decodeBase64url(value: string, expectedBytes: number): Buffer {
  if (!BASE64URL.test(value)) failure();
  const decoded = Buffer.from(value, "base64url");
  if (decoded.length !== expectedBytes || decoded.toString("base64url") !== value) failure();
  return decoded;
}

export function loadPlatformWebPushEncryptionConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): PlatformWebPushEncryptionConfiguration {
  const activeKeyVersion = environment[TRADERLINK_WEB_PUSH_ACTIVE_KEY_VERSION_ENV];
  const encoded = environment[TRADERLINK_WEB_PUSH_KEYS_BASE64_ENV];
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
    decodeBase64(key, 32);
    return [version, key];
  }));
  if (!(activeKeyVersion in keysBase64)) failure();
  return Object.freeze({ activeKeyVersion, keysBase64: Object.freeze(keysBase64) });
}

function validSubject(value: string): boolean {
  if (value.startsWith("mailto:")) {
    return value.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(value.slice(7));
  }
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && !parsed.username && !parsed.password &&
      !parsed.hash && value.length <= 512;
  } catch {
    return false;
  }
}

export function loadPlatformWebPushVapidConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): PlatformWebPushVapidConfiguration {
  const publicKey = environment[TRADERLINK_WEB_PUSH_VAPID_PUBLIC_KEY_ENV];
  const privateKey = environment[TRADERLINK_WEB_PUSH_VAPID_PRIVATE_KEY_ENV];
  const subject = environment[TRADERLINK_WEB_PUSH_VAPID_SUBJECT_ENV];
  if (!publicKey || !privateKey || !subject || !validSubject(subject)) failure();
  const decodedPublicKey = decodeBase64url(publicKey, 65);
  if (decodedPublicKey[0] !== 4) failure();
  decodeBase64url(privateKey, 32);
  return Object.freeze({ privateKey, publicKey, subject });
}

export function loadPlatformWebPushConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): PlatformWebPushConfiguration {
  return Object.freeze({
    encryption: loadPlatformWebPushEncryptionConfiguration(environment),
    vapid: loadPlatformWebPushVapidConfiguration(environment),
  });
}

export function platformWebPushPublicKey(
  environment: NodeJS.ProcessEnv = process.env,
): string {
  return loadPlatformWebPushVapidConfiguration(environment).publicKey;
}
