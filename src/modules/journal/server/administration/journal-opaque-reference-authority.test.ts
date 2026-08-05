import { describe, expect, it } from "vitest";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  issueJournalOpaqueReference,
  resolveJournalOpaqueReference,
} from "./journal-opaque-reference-authority";

const configuration = Object.freeze({
  activeKeyVersion: "key1",
  keysBase64: Object.freeze({
    key1: Buffer.alloc(32, 21).toString("base64"),
    retained: Buffer.alloc(32, 22).toString("base64"),
  }),
});
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "11111111-1111-4111-8111-111111111111",
  workspaceId: "22222222-2222-4222-8222-222222222222",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze(["33333333-3333-4333-8333-333333333333"]),
  activeAccountId: "33333333-3333-4333-8333-333333333333",
});

describe("Journal opaque references", () => {
  it("round-trips only inside the exact owner, account and reference kind", () => {
    const internalId = "44444444-4444-4444-8444-444444444444";
    const reference = issueJournalOpaqueReference({
      configuration,
      scope,
      kind: "import_attempt",
      internalId,
    });
    expect(reference).not.toContain(internalId);
    expect(resolveJournalOpaqueReference({
      configuration,
      scope,
      kind: "import_attempt",
      reference,
    })).toBe(internalId);
    expect(() => resolveJournalOpaqueReference({
      configuration,
      scope: Object.freeze({
        ...scope,
        activeAccountId: "55555555-5555-4555-8555-555555555555",
      }),
      kind: "import_attempt",
      reference,
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
    expect(() => resolveJournalOpaqueReference({
      configuration,
      scope,
      kind: "import_batch",
      reference,
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
  });

  it("rejects a modified token and reads a retained key version", () => {
    const retainedConfiguration = Object.freeze({
      ...configuration,
      activeKeyVersion: "retained",
    });
    const reference = issueJournalOpaqueReference({
      configuration: retainedConfiguration,
      scope,
      kind: "support_consent",
      internalId: "66666666-6666-4666-8666-666666666666",
    });
    expect(resolveJournalOpaqueReference({
      configuration,
      scope,
      kind: "support_consent",
      reference,
    })).toBe("66666666-6666-4666-8666-666666666666");
    const changedFinalCharacter = reference.endsWith("A") ? "B" : "A";
    expect(() => resolveJournalOpaqueReference({
      configuration,
      scope,
      kind: "support_consent",
      reference: `${reference.slice(0, -1)}${changedFinalCharacter}`,
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
  });
});
