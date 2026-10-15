import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunitiesCoachingServiceMeasurementMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",migrationId:"0130_traderlink_communities_coaching_service_measurement",executionOrder:130,
 statements:Object.freeze([`ALTER TABLE traderlink_community_coaching_plans ADD COLUMN plan_style TEXT NOT NULL DEFAULT 'structured' CHECK(plan_style IN ('structured','custom'));
ALTER TABLE traderlink_community_coaching_plan_items ADD COLUMN measurement_kind TEXT NOT NULL DEFAULT 'reviews' CHECK(measurement_kind IN ('trades','trading_days','reviews','check_ins','sessions','lessons','questions','custom'));
ALTER TABLE traderlink_community_coaching_plan_items ADD COLUMN planned_minutes INTEGER CHECK(planned_minutes IS NULL OR planned_minutes BETWEEN 1 AND 1440);
ALTER TABLE traderlink_community_coaching_plan_items ADD COLUMN timeline_enabled INTEGER NOT NULL DEFAULT 1 CHECK(timeline_enabled IN (0,1));
ALTER TABLE traderlink_community_coaching_plan_items ADD COLUMN review_depth TEXT NOT NULL DEFAULT 'standard' CHECK(review_depth IN ('standard','trades_only','complete_day'));`]),
});
