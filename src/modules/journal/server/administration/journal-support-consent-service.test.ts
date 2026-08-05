import { mkdirSync, mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { beginJournalImportAttempt } from "./journal-import-attempt-service";
import {
  expireJournalSupportConsent,
  grantJournalAttemptSupportConsent,
  revokeJournalSupportConsent,
} from "./journal-support-consent-service";

const roots: string[] = [];
const START = new Date("2026-08-03T09:00:00.000Z");

afterEach(() => {
  vi.unstubAllEnvs();
  for (const root of roots.splice(0)) {
    rmSync(root, { recursive: true, force: true });
  }
});

function setup(): Readonly<{
  databasePath: string;
  scope: WorkspaceAccessScope;
  supportRoot: string;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-support-service-"));
  roots.push(root);
  const databaseRoot = join(root, "database");
  const supportRoot = join(root, "support");
  const evidenceRoot = join(root, "evidence");
  const stagingRoot = join(root, "staging");
  for (const path of [databaseRoot, supportRoot, evidenceRoot, stagingRoot]) {
    mkdirSync(path);
  }
  const databasePath = join(databaseRoot, "test.sqlite");
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
    JSON.stringify({ key1: Buffer.alloc(32, 14).toString("base64") }),
  );
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT", supportRoot);
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT", evidenceRoot);
  vi.stubEnv("TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT", stagingRoot);
  return Object.freeze({
    databasePath,
    supportRoot,
    scope: Object.freeze({
      userId: signIn.userId,
      workspaceId: signIn.workspaceId,
      workspaceRole: "owner" as const,
      allowedAccountIds: signIn.allowedAccountIds,
      activeAccountId: signIn.allowedAccountIds[0]!,
    }),
  });
}

describe("Journal support consent service", () => {
  it("grants idempotently and verifies purge after trader revocation", () => {
    const { databasePath, scope, supportRoot } = setup();
    const sourceBytes = Buffer.from("Trade Time,Ticker\n2026-08-03 09:30:00,TEST\n");
    const attempt = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: "60000000-0000-4000-8000-000000000006",
      now: START,
    });
    const granted = grantJournalAttemptSupportConsent(scope, {
      importAttemptId: attempt.attempt.importAttemptId,
      sourceBytes,
      sourceMimeType: "text/csv",
      now: START,
    });
    expect(granted).toMatchObject({ state: "active", purgeState: "active" });
    expect(readdirSync(supportRoot)).toHaveLength(1);
    const retried = grantJournalAttemptSupportConsent(scope, {
      importAttemptId: attempt.attempt.importAttemptId,
      sourceBytes,
      sourceMimeType: "text/csv",
      now: new Date("2026-08-03T09:01:00.000Z"),
    });
    expect(retried.supportConsentId).toBe(granted.supportConsentId);
    expect(readdirSync(supportRoot)).toHaveLength(1);

    const revoked = revokeJournalSupportConsent(scope, {
      supportConsentId: granted.supportConsentId,
      expectedRevision: granted.revision,
      now: new Date("2026-08-03T09:02:00.000Z"),
    });
    expect(revoked).toMatchObject({ state: "revoked", purgeState: "purged" });
    expect(readdirSync(supportRoot)).toHaveLength(0);

    const database = openPlatformDatabase({
      mode: "initializer",
      databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(database.prepare(`SELECT purge_state, length(purge_receipt_sha256) AS receipt_length
FROM journal_statement_support_objects`).get()).toEqual({
        purge_state: "purged",
        receipt_length: 64,
      });
      expect(database.prepare(`SELECT COUNT(*) AS count
FROM journal_statement_support_consent_events`).get()).toEqual({ count: 4 });
    } finally {
      database.close();
    }
  });

  it("expires an active support object and purges its bytes", () => {
    const { scope, supportRoot } = setup();
    const sourceBytes = Buffer.from("Trade Time,Ticker\n2026-08-03 09:30:00,TEST\n");
    const attempt = beginJournalImportAttempt(scope, {
      sourceBytes,
      browserIdempotencyRef: "70000000-0000-4000-8000-000000000007",
      now: START,
    });
    const granted = grantJournalAttemptSupportConsent(scope, {
      importAttemptId: attempt.attempt.importAttemptId,
      sourceBytes,
      sourceMimeType: "text/plain",
      retentionDays: 1,
      now: START,
    });
    const expired = expireJournalSupportConsent(scope, {
      supportConsentId: granted.supportConsentId,
      expectedRevision: granted.revision,
      now: new Date("2026-08-04T09:00:00.000Z"),
    });
    expect(expired).toMatchObject({ state: "expired", purgeState: "purged" });
    expect(readdirSync(supportRoot)).toHaveLength(0);
  });
});
