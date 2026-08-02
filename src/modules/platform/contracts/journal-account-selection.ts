import { createHash, timingSafeEqual } from "node:crypto";

import {
  assertCanonicalUuidV4,
  platformFailure,
} from "../server/database/platform-migration-contract";

const JOURNAL_ACCOUNT_SELECTION_DOMAIN =
  "traderlink:journal-account-selection:v1";
const LOWERCASE_SHA256_PATTERN = /^[0-9a-f]{64}$/u;

declare const journalAccountSelectionRefBrand: unique symbol;

/**
 * An opaque browser-safe account selector. The underlying account UUID and
 * broker identifiers remain server-side.
 */
export type JournalAccountSelectionRef = string & {
  readonly [journalAccountSelectionRefBrand]: true;
};

/**
 * Callers must pass only accounts that are active and allowed for the current
 * workspace access scope. Archived or unauthorized accounts do not belong in
 * this collection.
 */
export type AllowedActiveJournalAccount = Readonly<{
  accountId: string;
}>;

export type JournalAccountSelectionResolution = Readonly<{
  accountId: string;
  selectionRef: JournalAccountSelectionRef;
  resolution: "exact" | "fallback";
}>;

function failInvalidSelectionRef(): never {
  platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED", {
    reason: "journal_account_selection_ref_invalid",
  });
}

function canonicalSelectionPayload(
  workspaceId: string,
  accountId: string,
): string {
  return `${JOURNAL_ACCOUNT_SELECTION_DOMAIN}\n${JSON.stringify([
    workspaceId,
    accountId,
  ])}\n`;
}

function selectionRefsEqual(
  left: JournalAccountSelectionRef,
  right: JournalAccountSelectionRef,
): boolean {
  return timingSafeEqual(Buffer.from(left, "ascii"), Buffer.from(right, "ascii"));
}

export function isJournalAccountSelectionRef(
  value: unknown,
): value is JournalAccountSelectionRef {
  return typeof value === "string" && LOWERCASE_SHA256_PATTERN.test(value);
}

export function parseJournalAccountSelectionRef(
  value: unknown,
): JournalAccountSelectionRef {
  if (!isJournalAccountSelectionRef(value)) failInvalidSelectionRef();
  return value;
}

export function deriveJournalAccountSelectionRef(
  workspaceId: string,
  accountId: string,
): JournalAccountSelectionRef {
  assertCanonicalUuidV4(workspaceId, "workspaceId");
  assertCanonicalUuidV4(accountId, "accountId");

  return parseJournalAccountSelectionRef(
    createHash("sha256")
      .update(canonicalSelectionPayload(workspaceId, accountId), "utf8")
      .digest("hex"),
  );
}

export function resolveJournalAccountSelection(
  workspaceId: string,
  suppliedSelectionRef: unknown,
  allowedActiveAccounts: readonly AllowedActiveJournalAccount[],
): JournalAccountSelectionResolution {
  assertCanonicalUuidV4(workspaceId, "workspaceId");

  if (allowedActiveAccounts.length === 0) {
    platformFailure("TRADERLINK_ACCOUNT_NOT_FOUND", {
      reason: "no_active_journal_accounts",
    });
  }

  const accountIds = allowedActiveAccounts.map(({ accountId }) => {
    assertCanonicalUuidV4(accountId, "accountId");
    return accountId;
  });
  if (new Set(accountIds).size !== accountIds.length) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "allowedActiveAccounts",
    });
  }

  const sortedAccountIds = [...accountIds].sort((left, right) =>
    left.localeCompare(right, "en"),
  );

  if (suppliedSelectionRef === undefined || suppliedSelectionRef === null) {
    const accountId = sortedAccountIds[0];
    return Object.freeze({
      accountId,
      selectionRef: deriveJournalAccountSelectionRef(workspaceId, accountId),
      resolution: "fallback",
    });
  }

  const selectionRef = parseJournalAccountSelectionRef(suppliedSelectionRef);
  for (const accountId of sortedAccountIds) {
    const candidateRef = deriveJournalAccountSelectionRef(workspaceId, accountId);
    if (selectionRefsEqual(selectionRef, candidateRef)) {
      return Object.freeze({
        accountId,
        selectionRef: candidateRef,
        resolution: "exact",
      });
    }
  }

  failInvalidSelectionRef();
}
