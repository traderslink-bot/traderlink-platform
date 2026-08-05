import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";
import { JournalSupportConsentRepository } from "./journal-support-consent-repository";

const roots: string[] = [];
const START = "2026-08-03T08:30:00.000Z";

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-support-consent-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(START) });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => new Date(START),
  }).signIn({
    authSubject: "123456789012345678",
    username: "journal-owner",
    globalDisplayName: "Journal Owner",
    avatarHash: null,
    guildId: "987654321098765432",
    roleIds: [],
    guildOwner: true,
    joinedAtUtc: null,
  });
  const scope: WorkspaceAccessScope = Object.freeze({
    userId: signIn.userId,
    workspaceId: signIn.workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: signIn.allowedAccountIds,
    activeAccountId: signIn.allowedAccountIds[0]!,
  });
  const attempts = new JournalImportAttemptRepository(database);
  attempts.activateEpoch({ applicationVersion: "test", timestamp: START });
  const attempt = attempts.admit({
    scope,
    requestIdempotencySha256: "a".repeat(64),
    sourceFileSha256: "b".repeat(64),
    sourceFileSizeBytes: 123,
    fileKind: "csv",
    safeBrokerLabel: "Example Broker",
    correlationRefSha256: "c".repeat(64),
    timestamp: START,
  });
  return { database, scope, attempt };
}

describe("Journal support consent repository", () => {
  it("defaults to explicit bounded consent and queues uncommitted source purge on revoke", () => {
    const { database, scope, attempt } = setup();
    try {
      const repository = new JournalSupportConsentRepository(database);
      const supportObjectId = repository.createSupportObject({
        scope,
        importAttemptId: attempt.importAttemptId,
        objectKey: "private_support_object_1234567890",
        sourceFileSha256: attempt.sourceFileSha256,
        sourceFileSizeBytes: attempt.sourceFileSizeBytes,
        sourceMimeType: "text/csv",
        expiresAtUtc: "2026-09-01T08:30:00.000Z",
        timestamp: START,
      });
      const granted = repository.grant({
        scope,
        sourceKind: "support_object",
        importBatchId: null,
        supportObjectId,
        expiresAtUtc: "2026-08-31T08:30:00.000Z",
        timestamp: START,
      });
      expect(granted).toMatchObject({ state: "active", revision: 1 });
      expect(() => repository.grant({
        scope,
        sourceKind: "support_object",
        importBatchId: null,
        supportObjectId,
        expiresAtUtc: "2027-01-01T08:30:00.000Z",
        timestamp: START,
      })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
      const revoked = repository.revoke({
        scope,
        supportConsentId: granted.supportConsentId,
        expectedRevision: 1,
        timestamp: "2026-08-04T08:30:00.000Z",
      });
      expect(revoked).toMatchObject({ state: "revoked", revision: 2 });
      expect(database.prepare(`SELECT purge_state FROM journal_statement_support_objects
WHERE support_object_id = ?`).get(supportObjectId)).toEqual({
        purge_state: "purge_pending",
      });
      expect(database.prepare(`SELECT event_kind FROM journal_statement_support_consent_events
ORDER BY sequence_number`).all()).toEqual([
        { event_kind: "granted" },
        { event_kind: "revoked" },
        { event_kind: "purge_requested" },
      ]);
      expect(() => database.prepare("DELETE FROM journal_statement_support_consents").run())
        .toThrowError(/immutable/u);
    } finally {
      database.close();
    }
  });
});
