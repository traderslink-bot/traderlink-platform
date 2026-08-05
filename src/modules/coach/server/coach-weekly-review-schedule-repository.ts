import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type CoachReviewDeliverySchedule = Readonly<{
  weeklyDeliveryDay: "friday" | "saturday" | "sunday";
  deliveryTimeEastern: string;
  updatedAtUtc: string;
}>;

export type CoachScheduledReviewAccount = Readonly<{
  scope: WorkspaceAccessScope;
  accountTimezone: string;
  schedule: CoachReviewDeliverySchedule;
}>;

const DELIVERY_TIME_PATTERN = /^(?:1[6-9]|2[0-3]):[0-5][0-9]$/u;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

const WEEKLY_DELIVERY_DAYS = new Set(["friday", "saturday", "sunday"]);

function weeklyDeliveryDay(value: unknown): "friday" | "saturday" | "sunday" {
  if (typeof value !== "string" || !WEEKLY_DELIVERY_DAYS.has(value)) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", { field: "weeklyDeliveryDay" });
  }
  return value as "friday" | "saturday" | "sunday";
}

export class CoachReviewDeliveryScheduleRepository {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope): CoachReviewDeliverySchedule | null {
    const row = this.database.prepare<[string], Readonly<{
      weekly_delivery_day: "friday" | "saturday" | "sunday";
      delivery_time_eastern: string;
      updated_at_utc: string;
    }>>(`SELECT weekly_delivery_day, delivery_time_eastern, updated_at_utc
FROM coach_review_delivery_settings
WHERE account_id = ?`).get(activeAccountId(scope));
    return row ? Object.freeze({
      weeklyDeliveryDay: row.weekly_delivery_day,
      deliveryTimeEastern: row.delivery_time_eastern,
      updatedAtUtc: row.updated_at_utc,
    }) : null;
  }

  listEnabledAccounts(): readonly CoachScheduledReviewAccount[] {
    const rows = this.database.prepare<[], Readonly<{
      user_id: string;
      workspace_id: string;
      account_id: string;
      workspace_role: "owner" | "admin" | "member";
      trading_timezone: string;
      weekly_delivery_day: "friday" | "saturday" | "sunday";
      delivery_time_eastern: string;
      updated_at_utc: string;
    }>>(`SELECT account.created_by_user_id AS user_id,
  account.workspace_id, account.account_id, membership.role AS workspace_role,
  account.trading_timezone, settings.weekly_delivery_day,
  settings.delivery_time_eastern, settings.updated_at_utc
FROM coach_review_delivery_settings settings
JOIN journal_accounts account ON account.account_id = settings.account_id
JOIN platform_users user ON user.user_id = account.created_by_user_id
JOIN platform_workspaces workspace ON workspace.workspace_id = account.workspace_id
JOIN platform_workspace_memberships membership
  ON membership.workspace_id = account.workspace_id
 AND membership.user_id = account.created_by_user_id
WHERE account.status = 'active' AND user.status = 'active'
  AND workspace.status = 'active' AND membership.status = 'active'
ORDER BY account.workspace_id, account.account_id`).all();
    return Object.freeze(rows.map((row) => Object.freeze({
      scope: Object.freeze({
        userId: row.user_id,
        workspaceId: row.workspace_id,
        workspaceRole: row.workspace_role,
        allowedAccountIds: Object.freeze([row.account_id]),
        activeAccountId: row.account_id,
      }),
      accountTimezone: row.trading_timezone,
      schedule: Object.freeze({
        weeklyDeliveryDay: row.weekly_delivery_day,
        deliveryTimeEastern: row.delivery_time_eastern,
        updatedAtUtc: row.updated_at_utc,
      }),
    })));
  }

  save(
    scope: WorkspaceAccessScope,
    input: Readonly<{ weeklyDeliveryDay: unknown; deliveryTimeEastern: unknown }>,
    now = new Date(),
  ): CoachReviewDeliverySchedule {
    const deliveryDay = weeklyDeliveryDay(input.weeklyDeliveryDay);
    if (typeof input.deliveryTimeEastern !== "string" || !DELIVERY_TIME_PATTERN.test(input.deliveryTimeEastern)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "deliveryTimeEastern",
      });
    }
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    const accountId = activeAccountId(scope);
    this.database.prepare(`INSERT INTO coach_review_delivery_settings (
  account_id, weekly_delivery_day, delivery_time_eastern, updated_at_utc
) VALUES (?, ?, ?, ?)
ON CONFLICT(account_id) DO UPDATE SET
  weekly_delivery_day = excluded.weekly_delivery_day,
  delivery_time_eastern = excluded.delivery_time_eastern,
  updated_at_utc = excluded.updated_at_utc`).run(
      accountId,
      deliveryDay,
      input.deliveryTimeEastern,
      updatedAtUtc,
    );
    this.database.prepare(`INSERT INTO coach_monthly_review_settings (
  account_id, enabled_at_utc
) VALUES (?, ?)
ON CONFLICT(account_id) DO NOTHING`).run(accountId, updatedAtUtc);
    return Object.freeze({
      weeklyDeliveryDay: deliveryDay,
      deliveryTimeEastern: input.deliveryTimeEastern,
      updatedAtUtc,
    });
  }
}
