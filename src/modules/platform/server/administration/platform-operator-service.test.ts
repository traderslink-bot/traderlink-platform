import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { PlatformDiscordSignInService } from "../authentication/platform-discord-sign-in-service";
import { createAndRestoreVerifyPlatformDatabaseBackup } from "../database/platform-database-backup";
import { openPlatformDatabase } from "../database/open-platform-database";
import { runPlatformMigrations } from "../database/run-platform-migrations";
import {
  executePlatformOperatorChange,
  previewPlatformOperatorChange,
} from "./platform-operator-service";
import { PlatformOperatorRepository } from "./platform-operator-repository";

const roots: string[] = [];
const GUILD_ID = "987654321098765432";
const NOW = new Date("2026-08-03T07:00:00.000Z");

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup(): Readonly<{
  root: string;
  databasePath: string;
  firstUserId: string;
  secondUserId: string;
}> {
  const root = mkdtempSync(join(tmpdir(), "traderlink-admin-operator-"));
  roots.push(root);
  const databasePath = join(root, "development.sqlite");
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath,
    forbiddenRepositoryRoots: [],
  });
  try {
    runPlatformMigrations(database, { now: () => NOW });
    const service = new PlatformDiscordSignInService(database, { now: () => NOW });
    const first = service.signIn({
      authSubject: "123456789012345678",
      username: "owner-one",
      globalDisplayName: "Owner One",
      avatarHash: null,
      guildId: GUILD_ID,
      roleIds: [],
      guildOwner: true,
      joinedAtUtc: null,
    });
    const second = service.signIn({
      authSubject: "223456789012345678",
      username: "owner-two",
      globalDisplayName: "Owner Two",
      avatarHash: null,
      guildId: GUILD_ID,
      roleIds: [],
      guildOwner: true,
      joinedAtUtc: null,
    });
    return Object.freeze({
      root,
      databasePath,
      firstUserId: first.userId,
      secondUserId: second.userId,
    });
  } finally {
    database.close();
  }
}

async function backup(
  root: string,
  databasePath: string,
  name: string,
  now: Date,
) {
  return createAndRestoreVerifyPlatformDatabaseBackup({
    sourcePath: databasePath,
    backupPath: join(root, name, "backup.sqlite"),
    restoreVerificationPath: join(root, name, "restored.sqlite"),
    forbiddenRepositoryRoots: [],
    now: () => now,
  });
}

describe("offline Journal admin operator authority", () => {
  it("previews privately and requires the exact confirmation, digest and backup", async () => {
    const state = setup();
    const preview = previewPlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "grant",
      targetUserId: state.firstUserId,
      forbiddenRepositoryRoots: [],
    });
    expect(preview).toMatchObject({
      status: "ready",
      operation: "grant",
      activeGrantPresent: false,
      targetDiscordIdentityCount: 1,
      confirmationText: "GRANT JOURNAL OWNER ADMIN",
    });
    expect(JSON.stringify(preview)).not.toContain(state.firstUserId);
    expect(JSON.stringify(preview)).not.toContain("123456789012345678");
    const evidence = await backup(
      state.root,
      state.databasePath,
      "grant-backup",
      new Date("2026-08-03T07:01:00.000Z"),
    );
    expect(() => executePlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "grant",
      targetUserId: state.firstUserId,
      expectedPreviewDigest: preview.previewDigest,
      confirmationText: "wrong",
      backupEvidence: evidence,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-03T07:02:00.000Z"),
    })).toThrowError("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");

    expect(executePlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "grant",
      targetUserId: state.firstUserId,
      expectedPreviewDigest: preview.previewDigest,
      confirmationText: preview.confirmationText,
      backupEvidence: evidence,
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-03T07:02:00.000Z"),
    })).toMatchObject({
      status: "completed",
      operation: "grant",
      activeGrantPresent: true,
    });

    const database = openPlatformDatabase({
      mode: "runtime",
      databasePath: state.databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(new PlatformOperatorRepository(database).findActive()?.userId)
        .toBe(state.firstUserId);
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_admin_audit_events WHERE action = 'operator_granted'").get())
        .toEqual({ count: 1 });
    } finally {
      database.close();
    }
  });

  it("atomically recovers the singleton grant and can revoke it", async () => {
    const state = setup();
    const grantPreview = previewPlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "grant",
      targetUserId: state.firstUserId,
      forbiddenRepositoryRoots: [],
    });
    executePlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "grant",
      targetUserId: state.firstUserId,
      expectedPreviewDigest: grantPreview.previewDigest,
      confirmationText: grantPreview.confirmationText,
      backupEvidence: await backup(
        state.root,
        state.databasePath,
        "first",
        new Date("2026-08-03T07:01:00.000Z"),
      ),
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-03T07:02:00.000Z"),
    });

    const recoverPreview = previewPlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "recover",
      targetUserId: state.secondUserId,
      forbiddenRepositoryRoots: [],
    });
    executePlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "recover",
      targetUserId: state.secondUserId,
      expectedPreviewDigest: recoverPreview.previewDigest,
      confirmationText: recoverPreview.confirmationText,
      backupEvidence: await backup(
        state.root,
        state.databasePath,
        "recover",
        new Date("2026-08-03T07:03:00.000Z"),
      ),
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-03T07:04:00.000Z"),
    });
    const revokePreview = previewPlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "revoke",
      targetUserId: state.secondUserId,
      forbiddenRepositoryRoots: [],
    });
    executePlatformOperatorChange({
      databasePath: state.databasePath,
      operation: "revoke",
      targetUserId: state.secondUserId,
      expectedPreviewDigest: revokePreview.previewDigest,
      confirmationText: revokePreview.confirmationText,
      backupEvidence: await backup(
        state.root,
        state.databasePath,
        "revoke",
        new Date("2026-08-03T07:05:00.000Z"),
      ),
      forbiddenRepositoryRoots: [],
      now: () => new Date("2026-08-03T07:06:00.000Z"),
    });

    const database = openPlatformDatabase({
      mode: "runtime",
      databasePath: state.databasePath,
      forbiddenRepositoryRoots: [],
    });
    try {
      expect(new PlatformOperatorRepository(database).findActive()).toBeNull();
      expect(database.prepare("SELECT grant_state, COUNT(*) AS count FROM platform_operator_grants GROUP BY grant_state").all())
        .toEqual([{ grant_state: "revoked", count: 2 }]);
      expect(database.prepare("SELECT COUNT(*) AS count FROM platform_admin_audit_events WHERE action IN ('operator_granted', 'operator_recovered', 'operator_revoked')").get())
        .toEqual({ count: 3 });
    } finally {
      database.close();
    }
  });
});
