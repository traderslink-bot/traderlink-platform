import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

import { platformFailure } from "../database/platform-migration-contract";
import type { MoomooCredentialKeyConfiguration } from "./moomoo-connection-credentials";

export type MoomooPrivateDataPurpose =
  | "broker_account_id"
  | "broker_account_link_ref"
  | "fill_page_cursor"
  | "fill_receipt";

export type EncryptedMoomooPrivateData = Readonly<{
  keyVersion: string;
  initializationVector: string;
  ciphertext: string;
  authenticationTag: string;
}>;

function key(
  configuration: MoomooCredentialKeyConfiguration,
  version: string,
): Buffer {
  const encoded = configuration.keysBase64[version];
  if (!encoded) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }
  const decoded = Buffer.from(encoded, "base64");
  if (decoded.length !== 32 || decoded.toString("base64") !== encoded) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_CONFIGURATION_INVALID");
  }
  return decoded;
}

function aad(purpose: MoomooPrivateDataPurpose): Buffer {
  return Buffer.from(`traderlink-moomoo-private-data-v1:${purpose}`, "utf8");
}

function assertPlaintext(value: string): void {
  if (value.length < 1 || value.length > 12_000 || value.includes("\u0000")) {
    platformFailure("TRADERLINK_BROKER_CONNECTION_STORAGE_INVALID");
  }
}

export function encryptMoomooPrivateData(input: Readonly<{
  configuration: MoomooCredentialKeyConfiguration;
  purpose: MoomooPrivateDataPurpose;
  plaintext: string;
}>): EncryptedMoomooPrivateData {
  assertPlaintext(input.plaintext);
  const initializationVector = randomBytes(12);
  const cipher = createCipheriv(
    "aes-256-gcm",
    key(input.configuration, input.configuration.activeKeyVersion),
    initializationVector,
  );
  cipher.setAAD(aad(input.purpose));
  const ciphertext = Buffer.concat([
    cipher.update(input.plaintext, "utf8"),
    cipher.final(),
  ]);
  return Object.freeze({
    keyVersion: input.configuration.activeKeyVersion,
    initializationVector: initializationVector.toString("base64url"),
    ciphertext: ciphertext.toString("base64url"),
    authenticationTag: cipher.getAuthTag().toString("base64url"),
  });
}

export function decryptMoomooPrivateData(input: Readonly<{
  configuration: MoomooCredentialKeyConfiguration;
  purpose: MoomooPrivateDataPurpose;
  encrypted: EncryptedMoomooPrivateData;
}>): string {
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key(input.configuration, input.encrypted.keyVersion),
      Buffer.from(input.encrypted.initializationVector, "base64url"),
    );
    decipher.setAAD(aad(input.purpose));
    decipher.setAuthTag(Buffer.from(input.encrypted.authenticationTag, "base64url"));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(input.encrypted.ciphertext, "base64url")),
      decipher.final(),
    ]).toString("utf8");
    assertPlaintext(plaintext);
    return plaintext;
  } catch {
    platformFailure("TRADERLINK_BROKER_CONNECTION_ACCESS_DENIED");
  }
}
