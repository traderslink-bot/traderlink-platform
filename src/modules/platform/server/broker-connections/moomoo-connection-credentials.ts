import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto";

import { platformFailure } from "../database/platform-migration-contract";

export const TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION_ENV =
  "TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION" as const;
export const TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64_ENV =
  "TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64" as const;

const AAD = Buffer.from("traderlink-moomoo-connection-credentials-v1", "utf8");
const VERSION = /^[A-Za-z0-9_-]{1,64}$/u;

export type MoomooCredentialKeyConfiguration = Readonly<{
  activeKeyVersion: string;
  keysBase64: Readonly<Record<string, string>>;
}>;

export type MoomooOAuthCredentials = Readonly<{
  accessToken: string;
  refreshToken: string;
}>;

export type EncryptedMoomooCredentials = Readonly<{
  keyVersion: string;
  initializationVector: string;
  ciphertext: string;
  authenticationTag: string;
}>;

function failure(): never {
  return platformFailure("TRADERLINK_BROKER_CONNECTION_CONFIGURATION_INVALID");
}

function decodeKey(value: string): Buffer {
  const decoded = Buffer.from(value, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== value) failure();
  return decoded;
}

export function loadMoomooCredentialKeyConfiguration(
  environment: NodeJS.ProcessEnv = process.env,
): MoomooCredentialKeyConfiguration {
  const activeKeyVersion = environment[TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION_ENV];
  const encoded = environment[TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64_ENV];
  if (!activeKeyVersion || !VERSION.test(activeKeyVersion) || !encoded) failure();
  let parsed: unknown;
  try { parsed = JSON.parse(encoded); } catch { failure(); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) failure();
  const keysBase64 = Object.fromEntries(Object.entries(parsed).map(([version, key]) => {
    if (!VERSION.test(version) || typeof key !== "string") failure();
    decodeKey(key);
    return [version, key];
  }));
  if (!(activeKeyVersion in keysBase64)) failure();
  return Object.freeze({ activeKeyVersion, keysBase64: Object.freeze(keysBase64) });
}

function key(configuration: MoomooCredentialKeyConfiguration, version: string): Buffer {
  if (!VERSION.test(version) || !configuration.keysBase64[version]) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }
  return decodeKey(configuration.keysBase64[version]);
}

function assertToken(value: string): void {
  if (value.length < 1 || value.length > 4096 || /[\u0000-\u001f]/u.test(value)) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  }
}

export function encryptMoomooCredentials(input: Readonly<{
  configuration: MoomooCredentialKeyConfiguration;
  credentials: MoomooOAuthCredentials;
}>): EncryptedMoomooCredentials {
  assertToken(input.credentials.accessToken);
  assertToken(input.credentials.refreshToken);
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(input.configuration, input.configuration.activeKeyVersion), initializationVector);
  cipher.setAAD(AAD);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(["moomoo_oauth_credentials_v1", input.credentials.accessToken, input.credentials.refreshToken]), "utf8"),
    cipher.final(),
  ]);
  return Object.freeze({
    keyVersion: input.configuration.activeKeyVersion,
    initializationVector: initializationVector.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    authenticationTag: cipher.getAuthTag().toString("base64url"),
  });
}

export function decryptMoomooCredentials(input: Readonly<{
  configuration: MoomooCredentialKeyConfiguration;
  encrypted: EncryptedMoomooCredentials;
}>): MoomooOAuthCredentials {
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(input.configuration, input.encrypted.keyVersion), Buffer.from(input.encrypted.initializationVector, "base64url"));
    decipher.setAAD(AAD);
    decipher.setAuthTag(Buffer.from(input.encrypted.authenticationTag, "base64url"));
    const parsed: unknown = JSON.parse(Buffer.concat([
      decipher.update(Buffer.from(input.encrypted.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8"));
    if (!Array.isArray(parsed) || parsed.length !== 3 || parsed[0] !== "moomoo_oauth_credentials_v1" || typeof parsed[1] !== "string" || typeof parsed[2] !== "string") throw new Error();
    assertToken(parsed[1]); assertToken(parsed[2]);
    return Object.freeze({ accessToken: parsed[1], refreshToken: parsed[2] });
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }
}
