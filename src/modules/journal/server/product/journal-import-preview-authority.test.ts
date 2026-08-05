import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  canonicalJournalImportPreviewPayload,
  createJournalImportPreviewAuthority,
} from "./journal-import-preview-authority";

const KEY = Buffer.alloc(32, 7).toString("base64");
const NOW = new Date("2026-08-03T07:30:00.000Z");
const SCOPE: WorkspaceAccessScope = Object.freeze({
  userId: "10000000-0000-4000-8000-000000000001",
  workspaceId: "20000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["30000000-0000-4000-8000-000000000003"]),
  activeAccountId: "30000000-0000-4000-8000-000000000003",
});

function payload(scope = SCOPE): string {
  return canonicalJournalImportPreviewPayload({
    scope,
    sourceFileSha256: "a".repeat(64),
    sourceFileSizeBytes: 123,
    accountRef: "b".repeat(64),
    accountSelectionRef: "c".repeat(64),
    commitKind: "ibkr",
    mappingVersion: "mapping-v1",
    parserVersion: "parser-v1",
    mappingContractSha256: null,
    sourceTimezone: "America/New_York",
    sourceIdentityConfirmationRequired: false,
    attemptBindingSha256: "d".repeat(64),
  });
}

describe("Journal import preview authority", () => {
  it("binds an opaque confirmation to the exact scope and expires it", () => {
    let now = NOW;
    const authority = createJournalImportPreviewAuthority(
      { activeKeyVersion: "key1", keysBase64: { key1: KEY } },
      {
        now: () => now,
        nonce: () => Buffer.alloc(24, 9),
      },
    );
    const issued = authority.issue(payload());
    expect(issued.previewRef).not.toContain("a".repeat(64));
    expect(authority.verify(issued.previewRef, payload())).toBe(true);
    expect(authority.verify(issued.previewRef, payload(Object.freeze({
      ...SCOPE,
      userId: "40000000-0000-4000-8000-000000000004",
    })))).toBe(false);
    now = new Date("2026-08-03T07:45:00.001Z");
    expect(authority.verify(issued.previewRef, payload())).toBe(false);
  });
});
