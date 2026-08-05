import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalPrivacyHmacConfiguration } from "../imports/journal-import-service";

const TOKEN_VERSION = "journal-import-preview-v1";
const TOKEN_TTL_MS = 15 * 60 * 1000;
const KEY_VERSION_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;

type Keyring = Readonly<{
  activeKeyVersion: string;
  keys: ReadonlyMap<string, Buffer>;
}>;

export type JournalImportPreviewConfirmation = Readonly<{
  previewRef: string;
  previewExpiresAtUtc: string;
}>;

function keyring(configuration: JournalPrivacyHmacConfiguration): Keyring {
  if (!KEY_VERSION_PATTERN.test(configuration.activeKeyVersion)) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  const keys = new Map<string, Buffer>();
  for (const [version, encoded] of Object.entries(configuration.keysBase64)) {
    const key = Buffer.from(encoded, "base64");
    if (
      !KEY_VERSION_PATTERN.test(version) ||
      key.length < 32 ||
      key.toString("base64") !== encoded
    ) platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    keys.set(version, key);
  }
  if (!keys.has(configuration.activeKeyVersion)) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  return Object.freeze({ activeKeyVersion: configuration.activeKeyVersion, keys });
}

function signature(input: Readonly<{
  key: Buffer;
  keyVersion: string;
  expiresAtMs: number;
  nonce: string;
  payload: string;
}>): string {
  return createHmac("sha256", input.key)
    .update([
      TOKEN_VERSION,
      input.keyVersion,
      String(input.expiresAtMs),
      input.nonce,
      input.payload,
    ].join("\u001f"), "utf8")
    .digest("hex");
}

export function createJournalImportPreviewAuthority(
  configuration: JournalPrivacyHmacConfiguration,
  options: Readonly<{
    now?: () => Date;
    nonce?: () => Buffer;
    tokenTtlMs?: number;
  }> = {},
): Readonly<{
  issue(payload: string): JournalImportPreviewConfirmation;
  verify(previewRef: string, payload: string): boolean;
}> {
  const configured = keyring(configuration);
  const now = options.now ?? (() => new Date());
  const nonce = options.nonce ?? (() => randomBytes(24));
  const tokenTtlMs = options.tokenTtlMs ?? TOKEN_TTL_MS;
  if (!Number.isSafeInteger(tokenTtlMs) || tokenTtlMs <= 0) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    issue(payload) {
      const expiresAtMs = now().getTime() + tokenTtlMs;
      const nonceValue = nonce().toString("base64url");
      const keyVersion = configured.activeKeyVersion;
      const key = configured.keys.get(keyVersion);
      if (!key || !BASE64URL_PATTERN.test(nonceValue) ||
        !Number.isSafeInteger(expiresAtMs)) {
        platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
      }
      return Object.freeze({
        previewRef: [
          TOKEN_VERSION,
          keyVersion,
          String(expiresAtMs),
          nonceValue,
          signature({ key, keyVersion, expiresAtMs, nonce: nonceValue, payload }),
        ].join("."),
        previewExpiresAtUtc: new Date(expiresAtMs).toISOString(),
      });
    },
    verify(previewRef, payload) {
      const [version, keyVersion, expiresAtText, nonceValue, supplied, extra] =
        previewRef.split(".");
      if (
        extra !== undefined ||
        version !== TOKEN_VERSION ||
        !KEY_VERSION_PATTERN.test(keyVersion ?? "") ||
        !/^\d+$/u.test(expiresAtText ?? "") ||
        !BASE64URL_PATTERN.test(nonceValue ?? "") ||
        !LOWERCASE_SHA256_PATTERN.test(supplied ?? "")
      ) return false;
      const expiresAtMs = Number(expiresAtText);
      const key = configured.keys.get(keyVersion!);
      if (!key || !Number.isSafeInteger(expiresAtMs) || expiresAtMs < now().getTime()) {
        return false;
      }
      const expected = signature({
        key,
        keyVersion: keyVersion!,
        expiresAtMs,
        nonce: nonceValue!,
        payload,
      });
      return timingSafeEqual(Buffer.from(supplied!, "hex"), Buffer.from(expected, "hex"));
    },
  });
}

export function canonicalJournalImportPreviewPayload(input: Readonly<{
  scope: WorkspaceAccessScope;
  sourceFileSha256: string;
  sourceFileSizeBytes: number;
  accountRef: string;
  accountSelectionRef: string;
  commitKind: "ibkr" | "mapped_csv";
  mappingVersion: string;
  parserVersion: string;
  mappingContractSha256: string | null;
  sourceTimezone: string;
  sourceIdentityConfirmationRequired: boolean;
  attemptBindingSha256: string;
}>): string {
  return JSON.stringify([
    "traderlink-journal-import-preview-payload-v1",
    input.scope.userId,
    input.scope.workspaceId,
    input.scope.activeAccountId,
    input.accountSelectionRef,
    input.commitKind,
    input.mappingVersion,
    input.parserVersion,
    input.mappingContractSha256,
    input.sourceTimezone,
    input.sourceIdentityConfirmationRequired,
    input.attemptBindingSha256,
    input.sourceFileSha256,
    input.sourceFileSizeBytes,
    input.accountRef,
  ]);
}
