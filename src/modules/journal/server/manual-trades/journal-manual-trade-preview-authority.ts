import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import type { JournalPrivacyHmacConfiguration } from "../imports/journal-import-service";
import type {
  JournalManualTrackerKind,
  JournalManualTradeEntry,
} from "../../contracts/journal-manual-trade-capture-contracts";

const TOKEN_VERSION = "manual-trade-preview-v1";
const TOKEN_TTL_MS = 15 * 60 * 1000;
const KEY_VERSION_PATTERN = /^[a-z][a-z0-9_-]{0,47}$/u;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;

type Keyring = Readonly<{
  activeKeyVersion: string;
  keys: ReadonlyMap<string, Buffer>;
}>;

export type JournalManualTradePreviewAuthority = Readonly<{
  issue(payload: string): Readonly<{ previewRef: string; expiresAtUtc: string }>;
  verify(previewRef: string, payload: string): boolean;
  opaqueRef(purpose: "execution" | "group" | "position", material: string): string;
}>;

function keyring(configuration: JournalPrivacyHmacConfiguration): Keyring {
  if (!KEY_VERSION_PATTERN.test(configuration.activeKeyVersion)) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  const keys = new Map<string, Buffer>();
  for (const [version, encoded] of Object.entries(configuration.keysBase64)) {
    if (!KEY_VERSION_PATTERN.test(version)) {
      platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    }
    const key = Buffer.from(encoded, "base64");
    if (key.length < 32 || key.toString("base64") !== encoded) {
      platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
    }
    keys.set(version, key);
  }
  if (!keys.has(configuration.activeKeyVersion)) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }
  return Object.freeze({
    activeKeyVersion: configuration.activeKeyVersion,
    keys,
  });
}

function signature(
  key: Buffer,
  keyVersion: string,
  expiresAtMs: number,
  nonce: string,
  payload: string,
): string {
  return createHmac("sha256", key)
    .update(
      [TOKEN_VERSION, keyVersion, String(expiresAtMs), nonce, payload]
        .join("\u001f"),
      "utf8",
    )
    .digest("hex");
}

export function createJournalManualTradePreviewAuthority(
  configuration: JournalPrivacyHmacConfiguration,
  options: Readonly<{
    now?: () => Date;
    nonce?: () => Buffer;
    tokenTtlMs?: number;
  }> = {},
): JournalManualTradePreviewAuthority {
  const configured = keyring(configuration);
  const now = options.now ?? (() => new Date());
  const nonce = options.nonce ?? (() => randomBytes(24));
  const tokenTtlMs = options.tokenTtlMs ?? TOKEN_TTL_MS;
  if (!Number.isSafeInteger(tokenTtlMs) || tokenTtlMs <= 0) {
    platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
  }

  return Object.freeze({
    issue(payload: string) {
      const expiresAtMs = now().getTime() + tokenTtlMs;
      const nonceValue = nonce().toString("base64url");
      const keyVersion = configured.activeKeyVersion;
      const key = configured.keys.get(keyVersion);
      if (
        !key ||
        !Number.isSafeInteger(expiresAtMs) ||
        !BASE64URL_PATTERN.test(nonceValue)
      ) {
        platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
      }
      return Object.freeze({
        previewRef: [
          TOKEN_VERSION,
          keyVersion,
          String(expiresAtMs),
          nonceValue,
          signature(key, keyVersion, expiresAtMs, nonceValue, payload),
        ].join("."),
        expiresAtUtc: new Date(expiresAtMs).toISOString(),
      });
    },
    verify(previewRef: string, payload: string) {
      const [version, keyVersion, expiresAtText, nonceValue, supplied, extra] =
        previewRef.split(".");
      if (
        extra !== undefined ||
        version !== TOKEN_VERSION ||
        !KEY_VERSION_PATTERN.test(keyVersion ?? "") ||
        !/^\d+$/u.test(expiresAtText ?? "") ||
        !BASE64URL_PATTERN.test(nonceValue ?? "") ||
        !LOWERCASE_SHA256_PATTERN.test(supplied ?? "")
      ) {
        return false;
      }
      const expiresAtMs = Number(expiresAtText);
      const key = configured.keys.get(keyVersion!);
      if (!key || !Number.isSafeInteger(expiresAtMs) || expiresAtMs < now().getTime()) {
        return false;
      }
      const expected = signature(
        key,
        keyVersion!,
        expiresAtMs,
        nonceValue!,
        payload,
      );
      return timingSafeEqual(
        Buffer.from(supplied!, "hex"),
        Buffer.from(expected, "hex"),
      );
    },
    opaqueRef(purpose, material) {
      const key = configured.keys.get(configured.activeKeyVersion);
      if (!key) {
        platformFailure("TRADERLINK_JOURNAL_PRIVACY_CONFIGURATION_INVALID");
      }
      return createHmac("sha256", key)
        .update(
          ["traderlink-manual-trade-ref-v1", purpose, material].join("\u001f"),
          "utf8",
        )
        .digest("hex");
    },
  });
}

export function canonicalJournalManualTradePreviewPayload(input: Readonly<{
  scope: WorkspaceAccessScope;
  accountSelectionRef: string;
  tracker: JournalManualTrackerKind;
  entries: readonly JournalManualTradeEntry[];
}>): string {
  const entries = [...input.entries]
    .sort((left, right) =>
      left.localDate.localeCompare(right.localDate) ||
      left.localTime.localeCompare(right.localTime) ||
      left.normalizedSymbol.localeCompare(right.normalizedSymbol) ||
      left.tradeCurrency.localeCompare(right.tradeCurrency) ||
      left.clientRowRef.localeCompare(right.clientRowRef))
    .map((entry) => [
      entry.clientRowRef,
      entry.localDate,
      entry.localTime,
      entry.sourceTimezone,
      entry.normalizedSymbol,
      entry.tradeCurrency,
      entry.side,
      entry.quantityDecimal,
      entry.priceDecimal,
      entry.feesDecimal,
    ]);
  return JSON.stringify([
    "traderlink-manual-trade-preview-payload-v1",
    input.scope.userId,
    input.scope.workspaceId,
    input.scope.activeAccountId,
    input.accountSelectionRef,
    input.tracker,
    entries,
  ]);
}

export function digestJournalManualTradePreviewPayload(payload: string): string {
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
