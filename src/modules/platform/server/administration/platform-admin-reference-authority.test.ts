import { describe, expect, it } from "vitest";

import type { JournalAdminScope } from "../../contracts/journal-admin-scope";
import {
  issueJournalAdminReference,
  resolveJournalAdminReference,
} from "./platform-admin-reference-authority";

const configuration = Object.freeze({
  activeKeyVersion: "test_key",
  keysBase64: Object.freeze({ test_key: Buffer.alloc(32, 7).toString("base64") }),
});
const scope: JournalAdminScope = Object.freeze({
  userId: "00000000-0000-4000-8000-000000000001",
  role: "development_journal_owner_admin",
  mode: "local_development_owner",
  authorizedAtUtc: "2026-08-03T12:00:00.000Z",
  discordOwnerVerifiedAtUtc: null,
  permissions: Object.freeze(["read_operations"] as const),
});

describe("Journal admin opaque references", () => {
  it("round-trips only for the exact operator, mode and target kind", () => {
    const internalId = "00000000-0000-4000-8000-000000000002";
    const reference = issueJournalAdminReference({
      configuration,
      scope,
      kind: "user",
      internalId,
    });
    expect(reference).not.toContain(internalId);
    expect(resolveJournalAdminReference({
      configuration,
      scope,
      reference,
      expectedKinds: ["user"],
    })).toEqual({ kind: "user", internalId });
    expect(() => resolveJournalAdminReference({
      configuration,
      scope,
      reference,
      expectedKinds: ["import_attempt"],
    })).toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    expect(() => resolveJournalAdminReference({
      configuration,
      scope: { ...scope, mode: "production_discord_owner" },
      reference,
    })).toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  });

  it("rejects altered and non-canonical encodings", () => {
    const reference = issueJournalAdminReference({
      configuration,
      scope,
      kind: "audit_event",
      internalId: "00000000-0000-4000-8000-000000000003",
    });
    const altered = `${reference.slice(0, -1)}${reference.endsWith("A") ? "B" : "A"}`;
    expect(() => resolveJournalAdminReference({ configuration, scope, reference: altered }))
      .toThrowError("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
  });
});
