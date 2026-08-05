import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { beginJournalImportAttempt } from "./journal-import-attempt-service";
import { recoverStaleJournalImportAttempts } from "./journal-import-attempt-recovery";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";

const roots: string[] = [];
const START = new Date("2026-08-03T09:30:00.000Z");

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Readonly<{ databasePath: string; scope: WorkspaceAccessScope }> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-attempt-recovery-"));
  roots.push(root);
  const databasePath = join(root, "test.sqlite");
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => START });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => START,
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
  database.close();
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION", "key1");
  vi.stubEnv(
    "TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON",
    JSON.stringify({ key1: Buffer.alloc(32, 16).toString("base64") }),
  );
  return Object.freeze({
    databasePath,
    scope: Object.freeze({
      userId: signIn.userId,
      workspaceId: signIn.workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: signIn.allowedAccountIds,
      activeAccountId: signIn.allowedAccountIds[0]!,
    }),
  });
}

describe("Journal import attempt recovery", () => {
  it("closes a stale committing attempt without inventing an import", () => {
    const { databasePath, scope } = setup();
    const context = beginJournalImportAttempt(scope, {
      sourceBytes: Buffer.from("Trade Time,Ticker\n2026-08-03 09:30:00,TEST\n"),
      browserIdempotencyRef: "80000000-0000-4000-8000-000000000008",
      now: START,
    });
    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    const repository = new JournalImportAttemptRepository(database);
    const previewReady = repository.transition({
      scope,
      importAttemptId: context.attempt.importAttemptId,
      expectedRevision: context.attempt.revision,
      nextState: "preview_ready",
      reasonCode: "preview_ready",
      correlationRefSha256: context.correlationRefSha256,
      timestamp: "2026-08-03T09:30:01.000Z",
      resumableUntilUtc: "2026-08-10T09:30:01.000Z",
      adapterId: "generic_mapped_statement",
    });
    repository.transition({
      scope,
      importAttemptId: previewReady.importAttemptId,
      expectedRevision: previewReady.revision,
      nextState: "committing",
      reasonCode: "commit_started",
      correlationRefSha256: context.correlationRefSha256,
      timestamp: "2026-08-03T09:30:02.000Z",
    });
    database.close();

    expect(recoverStaleJournalImportAttempts({
      now: new Date("2026-08-03T09:36:00.000Z"),
    })).toEqual({
      examinedCount: 1,
      committedCount: 0,
      duplicateCount: 0,
      systemFailedCount: 1,
    });
    const verified = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(verified.prepare(`SELECT current_state, failure_code
FROM journal_import_attempts`).get()).toEqual({
        current_state: "system_failed",
        failure_code: "recovery_no_committed_batch",
      });
      expect(verified.prepare("SELECT COUNT(*) AS count FROM journal_import_batches").get())
        .toEqual({ count: 0 });
    } finally {
      verified.close();
    }
  });
});
