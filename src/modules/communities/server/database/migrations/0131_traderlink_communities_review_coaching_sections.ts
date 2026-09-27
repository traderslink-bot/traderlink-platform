import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunitiesReviewCoachingSectionsMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",migrationId:"0131_traderlink_communities_review_coaching_sections",executionOrder:131,
 statements:Object.freeze([`ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN went_well TEXT NOT NULL DEFAULT '' CHECK(length(went_well)<=8000);
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN needs_work TEXT NOT NULL DEFAULT '' CHECK(length(needs_work)<=8000);
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN next_focus TEXT NOT NULL DEFAULT '' CHECK(length(next_focus)<=8000);
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN coach_private_notes TEXT NOT NULL DEFAULT '' CHECK(length(coach_private_notes)<=8000);
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN previous_focus_status TEXT CHECK(previous_focus_status IS NULL OR previous_focus_status IN ('not_evaluated','improving','still_struggling','achieved','replaced'));
ALTER TABLE traderlink_community_coaching_trade_reviews ADD COLUMN previous_focus_assessment TEXT NOT NULL DEFAULT '' CHECK(length(previous_focus_assessment)<=8000);`]),
});
