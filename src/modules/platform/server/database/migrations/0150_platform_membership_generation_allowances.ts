import type { PlatformMigration } from "../platform-migration-contract";

export const platformMembershipGenerationAllowancesMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform",
  migrationId: "0150_platform_membership_generation_allowances",
  executionOrder: 150,
  statements: Object.freeze([
    `ALTER TABLE platform_membership_plan_features ADD COLUMN reset_days INTEGER
      CHECK(reset_days IS NULL OR reset_days > 0);`,
  ]),
});
