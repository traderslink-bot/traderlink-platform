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

const roots: string[] = [];
const FIRST = "2026-08-03T07:45:00.000Z";
const HASH_A = "a".repeat(64);
const HASH_B = "b".repeat(64);
const IDEMPOTENCY = "c".repeat(64);
const CORRELATION = "d".repeat(64);

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Readonly<{
  database: ReturnType<typeof openPlatformDatabase>;
  scope: WorkspaceAccessScope;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-import-attempt-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(FIRST) });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => new Date(FIRST),
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
  return Object.freeze({
    database,
    scope: Object.freeze({
      userId: signIn.userId,
      workspaceId: signIn.workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: signIn.allowedAccountIds,
      activeAccountId: signIn.allowedAccountIds[0]!,
    }),
  });
}

describe("Journal import attempt repository", () => {
  it("requires an explicit instrumentation epoch and admits a retry only once", () => {
    const { database, scope } = setup();
    try {
      const repository = new JournalImportAttemptRepository(database);
      const request = {
        scope,
        requestIdempotencySha256: IDEMPOTENCY,
        sourceFileSha256: HASH_A,
        sourceFileSizeBytes: 123,
        fileKind: "csv" as const,
        safeBrokerLabel: "Example Broker",
        correlationRefSha256: CORRELATION,
        timestamp: FIRST,
      };
      expect(() => repository.admit(request))
        .toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
      repository.activateEpoch({
        applicationVersion: "test-admin-import-attempts",
        timestamp: FIRST,
      });
      const admitted = repository.admit(request);
      expect(admitted).toMatchObject({ currentState: "received", revision: 1 });
      expect(repository.admit(request).importAttemptId).toBe(admitted.importAttemptId);
      expect(() => repository.admit({ ...request, sourceFileSha256: HASH_B }))
        .toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_import_attempts").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_import_attempt_events").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("enforces expected revisions, legal transitions and immutable event history", () => {
    const { database, scope } = setup();
    try {
      const repository = new JournalImportAttemptRepository(database);
      repository.activateEpoch({ applicationVersion: "test", timestamp: FIRST });
      const admitted = repository.admit({
        scope,
        requestIdempotencySha256: IDEMPOTENCY,
        sourceFileSha256: HASH_A,
        sourceFileSizeBytes: 123,
        fileKind: "csv",
        safeBrokerLabel: null,
        correlationRefSha256: CORRELATION,
        timestamp: FIRST,
      });
      const inspecting = repository.transition({
        scope,
        importAttemptId: admitted.importAttemptId,
        expectedRevision: 1,
        nextState: "inspecting",
        reasonCode: "inspection_started",
        correlationRefSha256: CORRELATION,
        timestamp: "2026-08-03T07:45:01.000Z",
      });
      const waiting = repository.transition({
        scope,
        importAttemptId: admitted.importAttemptId,
        expectedRevision: inspecting.revision,
        nextState: "awaiting_mapping",
        reasonCode: "mapping_needed",
        correlationRefSha256: CORRELATION,
        timestamp: "2026-08-03T07:45:02.000Z",
        resumableUntilUtc: "2026-08-10T07:45:02.000Z",
        counts: { issues: 1, preserved_rows: 2 },
      });
      expect(waiting).toMatchObject({
        currentState: "awaiting_mapping",
        revision: 3,
        issueCount: 1,
        preservedRowCount: 2,
      });
      expect(() => repository.transition({
        scope,
        importAttemptId: admitted.importAttemptId,
        expectedRevision: 2,
        nextState: "expired",
        reasonCode: "resume_expired",
        correlationRefSha256: CORRELATION,
        timestamp: "2026-08-10T07:45:03.000Z",
      })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");
      expect(() => database.prepare("DELETE FROM journal_import_attempt_events").run())
        .toThrowError(/immutable/u);
      expect(database.prepare(`SELECT sequence_number, prior_state, new_state
FROM journal_import_attempt_events ORDER BY sequence_number`).all()).toEqual([
        { sequence_number: 1, prior_state: null, new_state: "received" },
        { sequence_number: 2, prior_state: "received", new_state: "inspecting" },
        { sequence_number: 3, prior_state: "inspecting", new_state: "awaiting_mapping" },
      ]);
    } finally {
      database.close();
    }
  });
});
