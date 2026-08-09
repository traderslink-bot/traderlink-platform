import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export const MOOMOO_SOURCE_ACCOUNT_CANONICALIZATION_VERSION =
  "moomoo_account_id_v1" as const;

export function canonicalizeMoomooSourceAccountId(rawSourceAccountId: string): string {
  const canonical = rawSourceAccountId.normalize("NFKC").trim();
  if (
    canonical.length < 1 || canonical.length > 128 ||
    /[\u0000-\u001f\u007f]/u.test(canonical)
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED");
  }
  return canonical;
}

export const MOOMOO_SOURCE_ACCOUNT_CANONICALIZERS = Object.freeze({
  [MOOMOO_SOURCE_ACCOUNT_CANONICALIZATION_VERSION]:
    canonicalizeMoomooSourceAccountId,
});
