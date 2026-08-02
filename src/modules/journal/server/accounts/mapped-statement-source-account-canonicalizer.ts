import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

import type { SourceAccountCanonicalizer } from "./journal-account-service";

export const MAPPED_STATEMENT_SOURCE_ACCOUNT_CANONICALIZATION_VERSION =
  "mapped-statement-account-v1" as const;

export const canonicalizeMappedStatementSourceAccount: SourceAccountCanonicalizer = (
  rawSourceAccountId,
) => {
  const canonical = rawSourceAccountId.trim().normalize("NFKC").toLowerCase();
  if (
    canonical.length < 1 ||
    canonical.length > 255 ||
    /[\u0000-\u001f\u007f]/u.test(canonical)
  ) {
    platformFailure("TRADERLINK_ACCOUNT_IDENTITY_RECOVERY_REQUIRED", {
      check: "mapped_statement_account_canonicalization",
    });
  }
  return canonical;
};

export const JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS = Object.freeze({
  [MAPPED_STATEMENT_SOURCE_ACCOUNT_CANONICALIZATION_VERSION]:
    canonicalizeMappedStatementSourceAccount,
});
