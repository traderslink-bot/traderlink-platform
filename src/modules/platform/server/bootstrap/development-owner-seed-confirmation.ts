import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

import { platformFailure } from "../database/platform-migration-contract";

export const DEVELOPMENT_OWNER_SEED_CONFIRMATION_KEY_ENV =
  "TRADERLINK_PLATFORM_DEVELOPMENT_OWNER_SEED_CONFIRMATION_KEY_BASE64";

const TOKEN_VERSION = "development-owner-seed-confirmation-v1";
const DEFAULT_TOKEN_TTL_MS = 5 * 60 * 1000;
const BASE64URL_PATTERN = /^[A-Za-z0-9_-]+$/u;
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;

export type DevelopmentOwnerSeedConfirmationIssue = Readonly<{
  token: string;
  expiresAtUtc: string;
}>;

export type DevelopmentOwnerSeedConfirmationAuthority = Readonly<{
  issue(payload: string): DevelopmentOwnerSeedConfirmationIssue;
  verify(token: string, payload: string): boolean;
}>;

export function loadDevelopmentOwnerSeedConfirmationKey(
  environment: NodeJS.ProcessEnv = process.env,
): Buffer {
  const encoded = environment[DEVELOPMENT_OWNER_SEED_CONFIRMATION_KEY_ENV];
  if (!encoded) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID");
  }
  const key = Buffer.from(encoded, "base64");
  if (key.length < 32 || key.toString("base64") !== encoded) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID");
  }
  return key;
}

function signature(
  key: Buffer,
  expiresAtMs: number,
  nonce: string,
  payload: string,
): string {
  return createHmac("sha256", key)
    .update(
      [TOKEN_VERSION, String(expiresAtMs), nonce, payload].join("\u001f"),
      "utf8",
    )
    .digest("hex");
}

export function createDevelopmentOwnerSeedConfirmationAuthority(
  options: Readonly<{
    key: Buffer;
    now?: () => Date;
    tokenTtlMs?: number;
    nonce?: () => Buffer;
  }>,
): DevelopmentOwnerSeedConfirmationAuthority {
  if (
    options.key.length < 32 ||
    (options.tokenTtlMs !== undefined &&
      (!Number.isSafeInteger(options.tokenTtlMs) || options.tokenTtlMs <= 0))
  ) {
    platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID");
  }
  const key = Buffer.from(options.key);
  const now = options.now ?? (() => new Date());
  const tokenTtlMs = options.tokenTtlMs ?? DEFAULT_TOKEN_TTL_MS;
  const nonce = options.nonce ?? (() => randomBytes(24));

  return Object.freeze({
    issue(payload: string): DevelopmentOwnerSeedConfirmationIssue {
      const expiresAtMs = now().getTime() + tokenTtlMs;
      const nonceValue = nonce().toString("base64url");
      if (!Number.isSafeInteger(expiresAtMs) || !BASE64URL_PATTERN.test(nonceValue)) {
        platformFailure("TRADERLINK_DEVELOPMENT_OWNER_SEED_CONFIGURATION_INVALID");
      }
      return Object.freeze({
        token: [
          TOKEN_VERSION,
          String(expiresAtMs),
          nonceValue,
          signature(key, expiresAtMs, nonceValue, payload),
        ].join("."),
        expiresAtUtc: new Date(expiresAtMs).toISOString(),
      });
    },
    verify(token: string, payload: string): boolean {
      const [version, expiresAtText, nonceValue, providedSignature, extra] =
        token.split(".");
      if (
        extra !== undefined ||
        version !== TOKEN_VERSION ||
        !/^\d+$/u.test(expiresAtText ?? "") ||
        !BASE64URL_PATTERN.test(nonceValue ?? "") ||
        !LOWERCASE_SHA256_PATTERN.test(providedSignature ?? "")
      ) {
        return false;
      }
      const expiresAtMs = Number(expiresAtText);
      if (!Number.isSafeInteger(expiresAtMs) || expiresAtMs < now().getTime()) {
        return false;
      }
      const expected = signature(key, expiresAtMs, nonceValue, payload);
      return timingSafeEqual(
        Buffer.from(providedSignature, "hex"),
        Buffer.from(expected, "hex"),
      );
    },
  });
}
