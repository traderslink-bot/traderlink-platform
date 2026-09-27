import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid=(column:string)=>`CHECK (length(${column})=36 AND ${column}=lower(${column}) AND substr(${column},14,1)='-' AND substr(${column},15,1)='4')`;
const snowflake=(column:string)=>`CHECK (${column} IS NULL OR (length(${column}) BETWEEN 2 AND 32 AND ${column} NOT GLOB '*[^0-9]*'))`;

export const traderLinkCommunitiesCoachingPlanBuilderMigration:PlatformMigration=Object.freeze({
  moduleNamespace:"community",
  migrationId:"0129_traderlink_communities_coaching_plan_builder",
  executionOrder:129,
  statements:Object.freeze([`ALTER TABLE traderlink_community_coaching_plans ADD COLUMN price_amount_minor INTEGER CHECK(price_amount_minor IS NULL OR price_amount_minor BETWEEN 0 AND 1000000000);
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN currency TEXT NOT NULL DEFAULT 'USD' CHECK(length(currency)=3 AND currency=upper(currency));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN billing_cadence TEXT NOT NULL DEFAULT 'monthly' CHECK(billing_cadence IN ('weekly','monthly','one_time','custom'));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN quote_required INTEGER NOT NULL DEFAULT 0 CHECK(quote_required IN (0,1));
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN required_discord_role_id TEXT ${snowflake("required_discord_role_id")};
ALTER TABLE traderlink_community_coaching_plans ADD COLUMN auto_archive_after_days INTEGER CHECK(auto_archive_after_days IS NULL OR auto_archive_after_days BETWEEN 1 AND 3650);

CREATE TABLE traderlink_community_coaching_plan_items(
 plan_item_id TEXT PRIMARY KEY ${uuid("plan_item_id")},
 plan_id TEXT NOT NULL ${uuid("plan_id")},
 community_id TEXT NOT NULL ${uuid("community_id")},
 item_type TEXT NOT NULL CHECK(item_type IN ('trade_review','trading_day_review','performance_review','journal_review','rules_review','strategy_review','risk_review','goal_review','student_check_in','review_follow_up','private_session','group_lesson','questions','custom_task')),
 frequency TEXT NOT NULL CHECK(frequency IN ('weekly','every_two_weeks','monthly','once','custom')),
 coverage_period TEXT NOT NULL CHECK(coverage_period IN ('single_item','previous_7_days','since_last_review','calendar_week','previous_month','custom')),
 quantity INTEGER NOT NULL DEFAULT 1 CHECK(quantity BETWEEN 1 AND 500),
 due_offset_days INTEGER NOT NULL DEFAULT 0 CHECK(due_offset_days BETWEEN 0 AND 365),
 selection_mode TEXT NOT NULL DEFAULT 'not_applicable' CHECK(selection_mode IN ('not_applicable','coach','student','coach_or_student')),
 follow_up_days INTEGER NOT NULL DEFAULT 0 CHECK(follow_up_days BETWEEN 0 AND 365),
 ordinal INTEGER NOT NULL CHECK(ordinal BETWEEN 0 AND 99),
 UNIQUE(plan_id,item_type),UNIQUE(plan_id,ordinal),
 FOREIGN KEY(plan_id,community_id) REFERENCES traderlink_community_coaching_plans(plan_id,community_id) ON DELETE CASCADE
) STRICT;

CREATE TABLE traderlink_community_coaching_plan_journal_scopes(
 plan_id TEXT NOT NULL ${uuid("plan_id")},
 community_id TEXT NOT NULL ${uuid("community_id")},
 data_scope TEXT NOT NULL CHECK(data_scope IN ('trades','trade_notes','rules','tags','analytics','open_positions','journal_notes','images')),
 required INTEGER NOT NULL CHECK(required IN (0,1)),
 PRIMARY KEY(plan_id,data_scope),
 FOREIGN KEY(plan_id,community_id) REFERENCES traderlink_community_coaching_plans(plan_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;`]),
});
