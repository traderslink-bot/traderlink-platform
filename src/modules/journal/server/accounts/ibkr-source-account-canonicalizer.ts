import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { SourceAccountCanonicalizer } from "./journal-account-service";

export const IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION =
  "ibkr-source-account-v1" as const;

export const canonicalizeIbkrSourceAccountId: SourceAccountCanonicalizer = (
  rawSourceAccountId,
) => {
  const canonical = rawSourceAccountId.trim().normalize("NFKC").toUpperCase();
  if (
    canonical.length < 1 ||
    canonical.length > 255 ||
    /[\u0000-\u001f\u007f]/u.test(canonical)
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {
      check: "ibkr_source_account_canonicalization",
    });
  }
  return canonical;
};

export const IBKR_SOURCE_ACCOUNT_CANONICALIZERS = Object.freeze({
  [IBKR_SOURCE_ACCOUNT_CANONICALIZATION_VERSION]:
    canonicalizeIbkrSourceAccountId,
});
