import type { PlatformMigration } from "../platform-migration-contract";

// Coordinator-reserved successor of 0158; additive settings only, no collections.
export const platformCoachingCommissionTermsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0159_platform_coaching_commission_terms",
  executionOrder: 172,
  statements: Object.freeze([
    `ALTER TABLE traderlink_community_coach_fee_rules ADD COLUMN minimum_commission_minor INTEGER CHECK(minimum_commission_minor IS NULL OR (minimum_commission_minor>=0 AND minimum_commission_minor<=9007199254740991));`,
    `ALTER TABLE traderlink_community_coach_fee_rules ADD COLUMN currency TEXT CHECK(currency IS NULL OR currency IN ('USD','CAD'));`,
    `ALTER TABLE traderlink_community_coach_fee_rules ADD COLUMN duration_count INTEGER CHECK(duration_count IS NULL OR duration_count BETWEEN 1 AND 36500);`,
    `ALTER TABLE traderlink_community_coach_fee_rules ADD COLUMN duration_unit TEXT CHECK((duration_unit IS NULL AND duration_count IS NULL) OR (duration_unit IS NOT NULL AND duration_unit IN ('days','weeks','months') AND duration_count IS NOT NULL));`,
  ]),
});
