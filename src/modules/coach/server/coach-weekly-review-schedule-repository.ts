import type Database from "better-sqlite3";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { createCanonicalUtcTimestamp, platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";

export type CoachWeeklyReviewSchedule = Readonly<{
  fridayDeliveryTimeEastern: string;
  updatedAtUtc: string;
}>;

const DELIVERY_TIME_PATTERN = /^(?:1[6-9]|2[0-3]):[0-5][0-9]$/u;

function activeAccountId(scope: WorkspaceAccessScope): string {
  if (!scope.activeAccountId || !scope.allowedAccountIds.includes(scope.activeAccountId)) {
    platformFailure("TRADERLINK_ACCOUNT_ACCESS_DENIED");
  }
  return scope.activeAccountId;
}

export class CoachWeeklyReviewScheduleRepository {
  constructor(private readonly database: Database.Database) {}

  read(scope: WorkspaceAccessScope): CoachWeeklyReviewSchedule | null {
    const row = this.database.prepare<[string], Readonly<{
      friday_delivery_time_eastern: string;
      updated_at_utc: string;
    }>>(`SELECT friday_delivery_time_eastern, updated_at_utc
FROM coach_weekly_review_schedules
WHERE account_id = ?`).get(activeAccountId(scope));
    return row ? Object.freeze({
      fridayDeliveryTimeEastern: row.friday_delivery_time_eastern,
      updatedAtUtc: row.updated_at_utc,
    }) : null;
  }

  save(
    scope: WorkspaceAccessScope,
    fridayDeliveryTimeEastern: unknown,
    now = new Date(),
  ): CoachWeeklyReviewSchedule {
    if (typeof fridayDeliveryTimeEastern !== "string" || !DELIVERY_TIME_PATTERN.test(fridayDeliveryTimeEastern)) {
      platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
        field: "fridayDeliveryTimeEastern",
      });
    }
    const updatedAtUtc = createCanonicalUtcTimestamp(now);
    this.database.prepare(`INSERT INTO coach_weekly_review_schedules (
  account_id, friday_delivery_time_eastern, updated_at_utc
) VALUES (?, ?, ?)
ON CONFLICT(account_id) DO UPDATE SET
  friday_delivery_time_eastern = excluded.friday_delivery_time_eastern,
  updated_at_utc = excluded.updated_at_utc`).run(
      activeAccountId(scope),
      fridayDeliveryTimeEastern,
      updatedAtUtc,
    );
    return Object.freeze({ fridayDeliveryTimeEastern, updatedAtUtc });
  }
}
