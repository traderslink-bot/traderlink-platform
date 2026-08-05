import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { deriveJournalImportAttemptDigests } from "./journal-import-attempt-authority";

const CONFIGURATION = Object.freeze({
  activeKeyVersion: "key1",
  keysBase64: Object.freeze({ key1: Buffer.alloc(32, 4).toString("base64") }),
});
const SCOPE: WorkspaceAccessScope = Object.freeze({
  userId: "10000000-0000-4000-8000-000000000001",
  workspaceId: "20000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["30000000-0000-4000-8000-000000000003"]),
  activeAccountId: "30000000-0000-4000-8000-000000000003",
});

describe("Journal import attempt authority", () => {
  it("derives separate privacy-safe digests bound to exact account scope", () => {
    const input = {
      configuration: CONFIGURATION,
      scope: SCOPE,
      browserIdempotencyRef: "40000000-0000-4000-8000-000000000004",
    };
    const first = deriveJournalImportAttemptDigests(input);
    expect(first.requestIdempotencySha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(first.correlationRefSha256).not.toBe(first.requestIdempotencySha256);
    expect(deriveJournalImportAttemptDigests(input)).toEqual(first);
    expect(deriveJournalImportAttemptDigests({
      ...input,
      scope: Object.freeze({
        ...SCOPE,
        activeAccountId: "50000000-0000-4000-8000-000000000005",
        allowedAccountIds: Object.freeze([
          "50000000-0000-4000-8000-000000000005",
        ]),
      }),
    }).requestIdempotencySha256).not.toBe(first.requestIdempotencySha256);
    expect(() => deriveJournalImportAttemptDigests({
      ...input,
      browserIdempotencyRef: "not-a-random-reference",
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
  });
});
