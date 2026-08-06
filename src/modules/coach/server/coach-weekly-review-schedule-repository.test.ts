import Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { platformMigrationManifest } from "@/src/modules/platform/server/database/platform-migration-manifest";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";

import { CoachReviewDeliveryScheduleRepository } from "./coach-weekly-review-schedule-repository";

const nowUtc = "2026-08-05T12:00:00.000Z";

function setup(): Readonly<{
  database: Database.Database;
  scope: WorkspaceAccessScope;
}> {
  const database = new Database(":memory:");
  database.pragma("foreign_keys = ON");
  runPlatformMigrations(database, {
    manifest: platformMigrationManifest,
    now: () => new Date(nowUtc),
  });
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const accountId = createCanonicalUuidV4();
  database.prepare(`INSERT INTO platform_users (
  user_id, auth_provider, auth_subject, display_name, status, created_at_utc, updated_at_utc
) VALUES (?, 'development_local', 'scheduled-review-owner', 'Scheduled owner', 'active', ?, ?)`)
    .run(userId, nowUtc, nowUtc);
  database.prepare(`INSERT INTO platform_workspaces (
  workspace_id, display_name, default_trading_timezone, status, created_at_utc, updated_at_utc
) VALUES (?, 'Scheduled workspace', 'America/New_York', 'active', ?, ?)`)
    .run(workspaceId, nowUtc, nowUtc);
  database.prepare(`INSERT INTO platform_workspace_memberships (
  workspace_id, user_id, role, status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'owner', 'active', ?, ?, ?)`)
    .run(workspaceId, userId, userId, nowUtc, nowUtc);
  database.prepare(`INSERT INTO journal_accounts (
  account_id, workspace_id, display_name, base_currency, trading_timezone,
  status, created_by_user_id, created_at_utc, updated_at_utc
) VALUES (?, ?, 'Scheduled account', 'USD', 'America/New_York', 'active', ?, ?, ?)`)
    .run(accountId, workspaceId, userId, nowUtc, nowUtc);
  return Object.freeze({
    database,
    scope: Object.freeze({
      userId,
      workspaceId,
      workspaceRole: "owner",
      allowedAccountIds: Object.freeze([accountId]),
      activeAccountId: accountId,
    }),
  });
}

describe("Coach review delivery schedule repository", () => {
  it("accepts only the Friday-to-Sunday half-hour delivery choices shown in Account Settings", () => {
    const { database, scope } = setup();
    try {
      const repository = new CoachReviewDeliveryScheduleRepository(database);
      expect(repository.save(scope, {
        weeklyDeliveryDay: "sunday",
        deliveryTimeEastern: "23:30",
      }, new Date(nowUtc))).toMatchObject({
        weeklyDeliveryDay: "sunday",
        deliveryTimeEastern: "23:30",
      });
      expect(() => repository.save(scope, {
        weeklyDeliveryDay: "friday",
        deliveryTimeEastern: "20:15",
      }, new Date(nowUtc))).toThrow("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
      expect(() => repository.save(scope, {
        weeklyDeliveryDay: "saturday",
        deliveryTimeEastern: "23:59",
      }, new Date(nowUtc))).toThrow("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
    } finally {
      database.close();
    }
  });

  it("lists only active accounts with an enabled review schedule", () => {
    const { database, scope } = setup();
    try {
      const repository = new CoachReviewDeliveryScheduleRepository(database);
      expect(repository.listEnabledAccounts()).toEqual([]);
      repository.save(scope, {
        weeklyDeliveryDay: "saturday",
        deliveryTimeEastern: "20:30",
      }, new Date(nowUtc));

      expect(repository.listEnabledAccounts()).toEqual([{
        scope,
        accountTimezone: "America/New_York",
        monthlyEnabledAtUtc: nowUtc,
        schedule: {
          weeklyDeliveryDay: "saturday",
          deliveryTimeEastern: "20:30",
          updatedAtUtc: nowUtc,
        },
      }]);

      database.prepare(`UPDATE platform_workspace_memberships
SET status = 'suspended' WHERE workspace_id = ? AND user_id = ?`)
        .run(scope.workspaceId, scope.userId);
      expect(repository.listEnabledAccounts()).toEqual([]);
    } finally {
      database.close();
    }
  });
});
