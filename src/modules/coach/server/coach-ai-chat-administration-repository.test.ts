import Database from "better-sqlite3";
import { describe, expect, it } from "vitest";

import type { JournalAdminScope } from "@/src/modules/platform/contracts/journal-admin-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import type { PlatformAdminReferenceKeyConfiguration } from "@/src/modules/platform/server/administration/platform-admin-reference-authority";

import { CoachAiChatAdministrationRepository } from "./coach-ai-chat-administration-repository";

const initialTime = "2026-08-05T12:00:00.000Z";
const configuration: PlatformAdminReferenceKeyConfiguration = Object.freeze({
  activeKeyVersion: "test_key",
  keysBase64: Object.freeze({ test_key: Buffer.alloc(32, 7).toString("base64") }),
});

function adminScope(userId: string): JournalAdminScope {
  return Object.freeze({
    userId,
    role: "development_journal_owner_admin",
    mode: "local_development_owner",
    authorizedAtUtc: initialTime,
    discordOwnerVerifiedAtUtc: null,
    permissions: Object.freeze([]),
  });
}

function setup(): Readonly<{
  database: Database.Database;
  repository: CoachAiChatAdministrationRepository;
  otherRepository: CoachAiChatAdministrationRepository;
  creatorId: string;
  activeMemberId: string;
}> {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, { manifest: platformMigrationManifest, now: () => new Date(initialTime) });

  const adminId = createCanonicalUuidV4();
  const otherAdminId = createCanonicalUuidV4();
  const creatorId = createCanonicalUuidV4();
  const activeMemberId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  for (const [userId, displayName, status] of [
    [adminId, "Admin", "active"],
    [otherAdminId, "Other admin", "active"],
    [creatorId, "Former creator", "disabled"],
    [activeMemberId, "Active member", "active"],
  ] as const) {
    database.prepare(`INSERT INTO platform_users (user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc)
VALUES (?, 'development_local', ?, ?, ?, ?, ?)`).run(userId, `test-${userId}`, displayName, status, initialTime, initialTime);
  }
  database.prepare(`INSERT INTO platform_workspaces (workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc)
VALUES (?, 'Admin test workspace', 'America/New_York', 'active', ?, ?)`).run(workspaceId, initialTime, initialTime);
  database.prepare(`INSERT INTO platform_workspace_memberships (workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'member', 'active', ?, ?, ?)`).run(workspaceId, activeMemberId, adminId, initialTime, initialTime);
  database.prepare(`INSERT INTO journal_accounts (account_id, workspace_id, display_name, base_currency, trading_timezone, status, created_by_user_id, created_at_utc, updated_at_utc)
VALUES (?, ?, 'Former creator account', 'USD', 'America/New_York', 'active', ?, ?, ?)`).run(accountId, workspaceId, creatorId, initialTime, initialTime);

  return Object.freeze({
    database,
    repository: new CoachAiChatAdministrationRepository({ database, scope: adminScope(adminId), configuration }),
    otherRepository: new CoachAiChatAdministrationRepository({ database, scope: adminScope(otherAdminId), configuration }),
    creatorId,
    activeMemberId,
  });
}

describe("Coach AI Chat administration repository", () => {
  it("uses an active workspace member for an account with an inactive creator and rejects cross or invalid references", () => {
    const fixture = setup();
    try {
      const accountRef = fixture.repository.read().accounts[0]!.accountRef;
      expect(accountRef).toBeTruthy();
      expect(() => fixture.repository.savePlatformControl({
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 10_000,
        dailyEstimatedSpendCapUsd: "10",
      })).toThrow("coach_ai_feature_control_transition_invalid");

      fixture.repository.saveSettings({ modelId: "gpt-chat-test", inputCostUsdPerMillionTokens: "1", cachedInputCostUsdPerMillionTokens: "0.1", cacheWriteInputCostUsdPerMillionTokens: "1.25", outputCostUsdPerMillionTokens: "2" });
      expect(fixture.repository.savePlatformControl({
        enabled: true,
        dailyRequestCap: 20,
        dailyTokenCap: 10_000,
        dailyEstimatedSpendCapUsd: "10",
      })).toMatchObject({ enabled: true });

      expect(fixture.repository.saveAccountControl(accountRef, {
        enabled: true,
        dailyRequestCap: 10,
        dailyTokenCap: 5_000,
        dailyEstimatedSpendCapUsd: "5",
      })).toMatchObject({ enabled: true });
      expect(fixture.database.prepare(`SELECT user_id, account_id FROM coach_ai_feature_controls WHERE feature_key = 'ai_chat' AND scope_kind = 'account'`).get())
        .toEqual({ user_id: fixture.activeMemberId, account_id: expect.any(String) });
      expect(fixture.database.prepare(`SELECT COUNT(*) AS count FROM coach_ai_feature_controls WHERE user_id = ?`).get(fixture.creatorId))
        .toEqual({ count: 0 });

      expect(() => fixture.otherRepository.saveAccountControl(accountRef, {
        enabled: false,
        dailyRequestCap: null,
        dailyTokenCap: null,
        dailyEstimatedSpendCapUsd: null,
      })).toThrow("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
      expect(() => fixture.repository.saveAccountControl("not-an-account-reference", {
        enabled: false,
        dailyRequestCap: null,
        dailyTokenCap: null,
        dailyEstimatedSpendCapUsd: null,
      })).toThrow("TRADERLINK_JOURNAL_ADMIN_ACCESS_DENIED");
    } finally {
      fixture.database.close();
    }
  });

  it("fails safely when an account has no active workspace membership", () => {
    const fixture = setup();
    try {
      const accountRef = fixture.repository.read().accounts[0]!.accountRef;
      fixture.repository.saveSettings({ modelId: "gpt-chat-test", inputCostUsdPerMillionTokens: "1", cachedInputCostUsdPerMillionTokens: "0.1", cacheWriteInputCostUsdPerMillionTokens: "1.25", outputCostUsdPerMillionTokens: "2" });
      fixture.repository.savePlatformControl({ enabled: true, dailyRequestCap: 20, dailyTokenCap: 10_000, dailyEstimatedSpendCapUsd: "10" });
      fixture.database.prepare(`UPDATE platform_workspace_memberships SET status = 'suspended'`).run();
      expect(() => fixture.repository.saveAccountControl(accountRef, {
        enabled: true,
        dailyRequestCap: 10,
        dailyTokenCap: 5_000,
        dailyEstimatedSpendCapUsd: "5",
      })).toThrow("TRADERLINK_JOURNAL_ADMIN_MUTATION_INVALID");
    } finally {
      fixture.database.close();
    }
  });
});
