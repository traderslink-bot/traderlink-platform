import { describe, expect, it } from "vitest";

import { TraderLinkPlatformError } from "../server/database/platform-migration-contract";
import {
  deriveJournalAccountSelectionRef,
  isJournalAccountSelectionRef,
  parseJournalAccountSelectionRef,
  resolveJournalAccountSelection,
} from "./journal-account-selection";

const WORKSPACE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_WORKSPACE_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const ACCOUNT_A_ID = "22222222-2222-4222-8222-222222222222";
const ACCOUNT_B_ID = "33333333-3333-4333-8333-333333333333";

function capturePlatformError(operation: () => unknown): TraderLinkPlatformError {
  try {
    operation();
  } catch (error) {
    expect(error).toBeInstanceOf(TraderLinkPlatformError);
    return error as TraderLinkPlatformError;
  }
  throw new Error("Expected TraderLinkPlatformError");
}

describe("journal account selection", () => {
  it("derives a deterministic lowercase opaque reference from workspace and account UUIDs", () => {
    const first = deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_A_ID);
    const second = deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_A_ID);
    const otherAccount = deriveJournalAccountSelectionRef(
      WORKSPACE_ID,
      ACCOUNT_B_ID,
    );
    const otherWorkspace = deriveJournalAccountSelectionRef(
      OTHER_WORKSPACE_ID,
      ACCOUNT_A_ID,
    );

    expect(first).toBe(second);
    expect(first).toMatch(/^[0-9a-f]{64}$/u);
    expect(first).not.toContain(WORKSPACE_ID);
    expect(first).not.toContain(ACCOUNT_A_ID);
    expect(otherAccount).not.toBe(first);
    expect(otherWorkspace).not.toBe(first);
  });

  it("validates and parses only lowercase SHA-256 selection references", () => {
    const valid = deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_A_ID);

    expect(isJournalAccountSelectionRef(valid)).toBe(true);
    expect(parseJournalAccountSelectionRef(valid)).toBe(valid);
    expect(isJournalAccountSelectionRef(valid.toUpperCase())).toBe(false);

    const failure = capturePlatformError(() =>
      parseJournalAccountSelectionRef(valid.toUpperCase()),
    );
    expect(failure.code).toBe("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    expect(failure.safeContext).toEqual({
      reason: "journal_account_selection_ref_invalid",
    });
    expect(JSON.stringify(failure.safeContext)).not.toContain(valid);
  });

  it("falls back deterministically to the first sorted active allowed account", () => {
    const resolution = resolveJournalAccountSelection(
      WORKSPACE_ID,
      undefined,
      [{ accountId: ACCOUNT_B_ID }, { accountId: ACCOUNT_A_ID }],
    );

    expect(resolution).toEqual({
      accountId: ACCOUNT_A_ID,
      selectionRef: deriveJournalAccountSelectionRef(
        WORKSPACE_ID,
        ACCOUNT_A_ID,
      ),
      resolution: "fallback",
    });
    expect(Object.isFrozen(resolution)).toBe(true);
  });

  it("resolves an exact reference only against the supplied active allowed accounts", () => {
    const selected = resolveJournalAccountSelection(
      WORKSPACE_ID,
      deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_B_ID),
      [{ accountId: ACCOUNT_A_ID }, { accountId: ACCOUNT_B_ID }],
    );

    expect(selected).toEqual({
      accountId: ACCOUNT_B_ID,
      selectionRef: deriveJournalAccountSelectionRef(
        WORKSPACE_ID,
        ACCOUNT_B_ID,
      ),
      resolution: "exact",
    });

    const excludedFailure = capturePlatformError(() =>
      resolveJournalAccountSelection(
        WORKSPACE_ID,
        deriveJournalAccountSelectionRef(WORKSPACE_ID, ACCOUNT_B_ID),
        [{ accountId: ACCOUNT_A_ID }],
      ),
    );
    expect(excludedFailure.code).toBe("TRADERLINK_ACCOUNT_ACCESS_DENIED");
    expect(excludedFailure.safeContext).toEqual({
      reason: "journal_account_selection_ref_invalid",
    });
  });

  it("rejects forged and cross-workspace references without disclosing identifiers", () => {
    for (const suppliedSelectionRef of [
      "0".repeat(64),
      deriveJournalAccountSelectionRef(OTHER_WORKSPACE_ID, ACCOUNT_A_ID),
    ]) {
      const failure = capturePlatformError(() =>
        resolveJournalAccountSelection(
          WORKSPACE_ID,
          suppliedSelectionRef,
          [{ accountId: ACCOUNT_A_ID }],
        ),
      );
      expect(failure.code).toBe("TRADERLINK_ACCOUNT_ACCESS_DENIED");
      expect(failure.safeContext).toEqual({
        reason: "journal_account_selection_ref_invalid",
      });
      const serializedContext = JSON.stringify(failure.safeContext);
      expect(serializedContext).not.toContain(WORKSPACE_ID);
      expect(serializedContext).not.toContain(ACCOUNT_A_ID);
      expect(serializedContext).not.toContain(suppliedSelectionRef);
    }
  });

  it("fails explicitly when the caller has no active allowed accounts", () => {
    const failure = capturePlatformError(() =>
      resolveJournalAccountSelection(WORKSPACE_ID, undefined, []),
    );

    expect(failure.code).toBe("TRADERLINK_ACCOUNT_NOT_FOUND");
    expect(failure.safeContext).toEqual({
      reason: "no_active_journal_accounts",
    });
  });
});
