import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import {
  createJournalMappingSupportPackage,
  createJournalMappingSupportPackageV2,
} from "../product/journal-mapping-support-package";
import {
  beginJournalImportAttempt,
  finishJournalImportPreview,
} from "./journal-import-attempt-service";

const roots: string[] = [];
const START = new Date("2026-08-03T08:15:00.000Z");
const BROWSER_REF = "40000000-0000-4000-8000-000000000004";

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Readonly<{
  databasePath: string;
  scope: WorkspaceAccessScope;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-attempt-service-"));
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
    JSON.stringify({ key1: Buffer.alloc(32, 8).toString("base64") }),
  );
  vi.stubEnv("TRADERLINK_PLATFORM_APPLICATION_VERSION", "attempt-service-test");
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

describe("Journal import attempt service", () => {
  it("activates telemetry only with the complete service and resumes the same upload", () => {
    const { databasePath, scope } = setup();
    const sourceBytes = Buffer.from([
      "Trade Time,Ticker,Action,Filled Qty,Fill Price",
      "2026-08-03 09:30:00,TEST,Buy,10,1.25",
    ].join("\n"));
    const package_ = createJournalMappingSupportPackageV2(
      createJournalMappingSupportPackage({
        sourceBytes,
        brokerName: "Example Broker",
        failureCode: "TRADERLINK_JOURNAL_IMPORT_MAPPING_FAILED",
      }),
    );
    const first = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: BROWSER_REF,
      now: START,
    });
    expect(first.attempt.currentState).toBe("inspecting");
    const waiting = finishJournalImportPreview(scope, {
      context: first,
      package: package_,
      preview: null,
      safeMappingContract: null,
      now: new Date("2026-08-03T08:15:01.000Z"),
    });
    expect(waiting).toMatchObject({ currentState: "awaiting_mapping", revision: 3 });

    const resumed = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: BROWSER_REF,
      now: new Date("2026-08-03T08:16:00.000Z"),
    });
    expect(resumed).toMatchObject({
      attempt: { importAttemptId: first.attempt.importAttemptId, currentState: "inspecting" },
      attemptBindingSha256: first.attemptBindingSha256,
    });
    expect(() => beginJournalImportAttempt(scope, {
      sourceBytes: Buffer.from("different file"),
      browserIdempotencyRef: BROWSER_REF,
      now: new Date("2026-08-03T08:16:01.000Z"),
    })).toThrowError("TRADERLINK_JOURNAL_IMPORT_CONFLICT");

    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_import_instrumentation_epochs").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_import_attempts").get())
        .toEqual({ count: 1 });
      expect(database.prepare("SELECT COUNT(*) AS count FROM journal_statement_format_observations").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });
});
