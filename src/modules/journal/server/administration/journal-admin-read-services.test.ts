import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { JOURNAL_ADMIN_PERMISSIONS } from "@/src/modules/platform/contracts/journal-admin-scope";
import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { PlatformAdminAuditRepository } from "@/src/modules/platform/server/administration/platform-admin-audit-repository";
import { PlatformAdminAuditService } from "@/src/modules/platform/server/administration/platform-admin-audit-service";
import { PlatformAdminSystemService } from "@/src/modules/platform/server/administration/platform-admin-system-service";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { JournalAdminDecisionService } from "./journal-admin-decision-service";
import { JournalImportAttemptRepository } from "./journal-import-attempt-repository";
import { JournalAdminImportService } from "./journal-admin-import-service";
import { JournalAdminOverviewService } from "./journal-admin-overview-service";
import { createJournalAdminReadContext } from "./journal-admin-read-helpers";
import { JournalAdminUserService } from "./journal-admin-user-service";
import { JournalAdminUserControlService } from "./journal-admin-user-control-service";
import { JournalStatementFormatService } from "./journal-statement-format-service";

const roots: string[] = [];
const NOW = "2026-08-03T12:00:00.000Z";
const configuration = Object.freeze({
  activeKeyVersion: "test_key",
  keysBase64: Object.freeze({ test_key: Buffer.alloc(32, 9).toString("base64") }),
});

afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-admin-read-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "test.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database, { now: () => new Date(NOW) });
  const signIn = new PlatformDiscordSignInService(database, {
    now: () => new Date(NOW),
  }).signIn({
    authSubject: "123456789012345678",
    username: "owner",
    globalDisplayName: "Journal Owner",
    avatarHash: null,
    guildId: "987654321098765432",
    roleIds: [],
    guildOwner: true,
    joinedAtUtc: null,
  });
  const accountId = signIn.allowedAccountIds[0]!;
  const journalScope: WorkspaceAccessScope = Object.freeze({
    userId: signIn.userId,
    workspaceId: signIn.workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: signIn.allowedAccountIds,
    activeAccountId: accountId,
  });
  const adminScope = Object.freeze({
    userId: signIn.userId,
    role: "development_journal_owner_admin" as const,
    mode: "local_development_owner" as const,
    authorizedAtUtc: NOW,
    discordOwnerVerifiedAtUtc: null,
    permissions: JOURNAL_ADMIN_PERMISSIONS,
  });
  return { database, signIn, accountId, journalScope, adminScope };
}

describe("Journal Administration read services", () => {
  it("reconciles bounded empty/fresh operational state without leaking internal identity", () => {
    const { database, signIn, accountId, journalScope, adminScope } = setup();
    try {
      const attempts = new JournalImportAttemptRepository(database);
      attempts.activateEpoch({ applicationVersion: "admin-read-test", timestamp: NOW });
      const attempt = attempts.admit({
        scope: journalScope,
        requestIdempotencySha256: "a".repeat(64),
        sourceFileSha256: "b".repeat(64),
        sourceFileSizeBytes: 125,
        fileKind: "csv",
        safeBrokerLabel: "Example Broker",
        correlationRefSha256: "c".repeat(64),
        timestamp: NOW,
      });
      const inspecting = attempts.transition({
        scope: journalScope,
        importAttemptId: attempt.importAttemptId,
        expectedRevision: attempt.revision,
        nextState: "inspecting",
        reasonCode: "inspection_started",
        correlationRefSha256: "c".repeat(64),
        timestamp: "2026-08-03T12:00:01.000Z",
      });
      attempts.transition({
        scope: journalScope,
        importAttemptId: attempt.importAttemptId,
        expectedRevision: inspecting.revision,
        nextState: "awaiting_mapping",
        reasonCode: "mapping_needed",
        correlationRefSha256: "c".repeat(64),
        timestamp: "2026-08-03T12:00:02.000Z",
        resumableUntilUtc: "2026-08-10T12:00:02.000Z",
        counts: { preserved_rows: 2, issues: 1 },
      });
      new PlatformAdminAuditRepository(database).append({
        actorKind: "platform_user",
        actorUserId: signIn.userId,
        actorRole: "development_journal_owner_admin",
        action: "admin_access_allowed",
        targetKind: "authority",
        targetRefSha256: createHash("sha256").update("authority").digest("hex"),
        outcome: "success",
        reasonCode: "development_loopback_authorized",
        correlationRefSha256: createHash("sha256").update("request").digest("hex"),
        previewReceiptSha256: null,
        details: { mode: "local_development_owner" },
        createdAtUtc: NOW,
      });

      const overview = new JournalAdminOverviewService({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      }).read();
      expect(overview.users.registeredProduction).toBe(1);
      expect(overview.imports.mappingRequired).toBe(1);
      expect(overview.imports.commitRate.percentage).toBeNull();

      const userService = new JournalAdminUserService({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      });
      const users = userService.list();
      expect(users.items).toHaveLength(1);
      const userDetail = userService.detail(users.items[0]!.userRef);
      expect(userDetail?.accounts[0]).toMatchObject({
        displayName: "Primary Journal",
        unresolvedDecisionCount: 0,
      });

      const importService = new JournalAdminImportService({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      });
      const imports = importService.list();
      expect(imports.items).toHaveLength(1);
      expect(imports.items[0]).toMatchObject({
        currentState: "awaiting_mapping",
        preservedRowCount: 2,
        issueCount: 1,
      });
      expect(importService.detail(imports.items[0]!.importRef)?.timeline).toHaveLength(3);

      expect(new JournalStatementFormatService({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      }).list().formats.items).toHaveLength(0);
      expect(new JournalAdminDecisionService({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      }).read().aggregates).toHaveLength(0);

      const readContext = createJournalAdminReadContext({
        database,
        scope: adminScope,
        configuration,
        now: new Date(NOW),
      });
      const system = new PlatformAdminSystemService(readContext, {
        NODE_ENV: "development",
      }).read();
      expect(system.schema.migrationCount).toBeGreaterThanOrEqual(21);
      expect(system.processing.userWaitingCount).toBe(1);
      const audit = new PlatformAdminAuditService(readContext).list();
      expect(audit.items).toHaveLength(1);

      const serialized = JSON.stringify({
        overview,
        users,
        userDetail,
        imports,
        system,
        audit,
      });
      expect(serialized).not.toContain(signIn.userId);
      expect(serialized).not.toContain(signIn.workspaceId);
      expect(serialized).not.toContain(accountId);
      expect(serialized).not.toContain("123456789012345678");
      expect(serialized).not.toContain("987654321098765432");
      expect(serialized).not.toContain("b".repeat(64));
    } finally {
      database.close();
    }
  }, 20_000);

  it("disables another user without changing Journal facts and records the control", () => {
    const { database, adminScope } = setup();
    try {
      const targetUserId = randomUUID();
      database.prepare(`INSERT INTO platform_users (
        user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
      ) VALUES (?, 'discord', '987654321098765431', 'Academy member', 'active', ?, ?)`)
        .run(targetUserId, NOW, NOW);
      const userService = new JournalAdminUserService({
        database, scope: adminScope, configuration, now: new Date(NOW),
      });
      const target = userService.list().items.find((user) => user.displayName === "Academy member");
      expect(target).toMatchObject({ journalStarted: false, status: "active" });
      const result = new JournalAdminUserControlService({
        database, scope: adminScope, configuration, now: new Date(NOW),
      }).execute({
        userRef: target!.userRef,
        action: "disable",
        confirmation: "DISABLE USER",
        reasonCode: "owner_support_review",
        correlationRefSha256: "d".repeat(64),
      });
      expect(result).toEqual({ status: "disabled", revokedSessionCount: 0 });
      expect(new JournalAdminUserControlService({
        database, scope: adminScope, configuration, now: new Date(NOW),
      }).execute({
        userRef: target!.userRef,
        action: "disable",
        confirmation: "DISABLE USER",
        reasonCode: "owner_support_review",
        correlationRefSha256: "d".repeat(64),
      })).toEqual(result);
      expect(database.prepare<[string], { status: string }>("SELECT status FROM platform_users WHERE user_id = ?").get(targetUserId)?.status).toBe("disabled");
      expect(database.prepare<[], { count: number }>("SELECT COUNT(*) AS count FROM platform_user_control_audit_events WHERE action = 'disable'").get()?.count).toBe(1);
    } finally {
      database.close();
    }
  }, 20_000);
});
