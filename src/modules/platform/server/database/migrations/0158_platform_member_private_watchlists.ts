import type { PlatformMigration } from "../platform-migration-contract";

/** Conditional release reservation: follows reconciled membership migration 0157. */
export const platformMemberPrivateWatchlistsMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "platform", migrationId: "0158_platform_member_private_watchlists", executionOrder: 158,
  statements: Object.freeze([`
CREATE TABLE platform_watchlist_plan_policies (
  symbol TEXT NOT NULL,
  control TEXT NOT NULL CHECK(control IN ('ticker','analysis','levels')),
  mode TEXT NOT NULL CHECK(mode IN ('legacy','plans')),
  updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY(symbol,control)
) STRICT;
CREATE TABLE platform_watchlist_plan_policy_plans (
  symbol TEXT NOT NULL,
  control TEXT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES platform_membership_plans(plan_id),
  PRIMARY KEY(symbol,control,plan_id),
  FOREIGN KEY(symbol,control) REFERENCES platform_watchlist_plan_policies(symbol,control)
) STRICT;
CREATE TABLE platform_private_watchlist_entries (
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  symbol TEXT NOT NULL CHECK(length(symbol) BETWEEN 1 AND 10 AND symbol=upper(symbol)),
  state TEXT NOT NULL CHECK(state IN ('active','archived')),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  PRIMARY KEY(user_id,symbol)
) STRICT;
CREATE TABLE platform_private_watchlist_operations (
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  request_id TEXT NOT NULL,
  symbol TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('addition','generation')),
  state TEXT NOT NULL CHECK(state IN ('reserved','completed','released','unresolved','failed')),
  request_hash TEXT NOT NULL,
  selected_analysis INTEGER NOT NULL DEFAULT 0 CHECK(selected_analysis IN (0,1)),
  selected_indicators INTEGER NOT NULL DEFAULT 0 CHECK(selected_indicators IN (0,1)),
  selected_levels INTEGER NOT NULL DEFAULT 0 CHECK(selected_levels IN (0,1)),
  maximum_cost_microusd INTEGER NOT NULL CHECK(maximum_cost_microusd BETWEEN 0 AND 9007199254740991),
  actual_cost_microusd INTEGER CHECK(actual_cost_microusd BETWEEN 0 AND maximum_cost_microusd),
  levels_json TEXT CHECK(levels_json IS NULL OR json_valid(levels_json)),
  analysis_json TEXT CHECK(analysis_json IS NULL OR json_valid(analysis_json)),
  indicators_json TEXT CHECK(indicators_json IS NULL OR json_valid(indicators_json)),
  created_at_utc TEXT NOT NULL,
  updated_at_utc TEXT NOT NULL,
  CHECK(state NOT IN ('completed','released','failed') OR actual_cost_microusd IS NOT NULL),
  CHECK(state<>'released' OR actual_cost_microusd=0),
  CHECK(operation<>'addition' OR (maximum_cost_microusd=0 AND selected_analysis=0 AND selected_indicators=0 AND selected_levels=0)),
  CHECK(levels_json IS NULL OR selected_levels=1),
  CHECK(analysis_json IS NULL OR selected_analysis=1),
  CHECK(indicators_json IS NULL OR selected_indicators=1),
  PRIMARY KEY(user_id,request_id),
  FOREIGN KEY(user_id,symbol) REFERENCES platform_private_watchlist_entries(user_id,symbol)
) STRICT;
CREATE INDEX platform_private_watchlist_usage ON platform_private_watchlist_operations(user_id,operation,created_at_utc);
CREATE TABLE platform_private_watchlist_plan_periods (
  plan_version_id TEXT NOT NULL REFERENCES platform_membership_plan_versions(plan_version_id),
  meter TEXT NOT NULL CHECK(meter IN ('ticker_additions','generations','cost_microusd')),
  period_kind TEXT NOT NULL CHECK(period_kind IN ('calendar_month','days','lifetime')),
  period_days INTEGER,
  CHECK((period_kind='days' AND period_days IS NOT NULL AND period_days BETWEEN 1 AND 9007199254740991) OR (period_kind<>'days' AND period_days IS NULL)),
  PRIMARY KEY(plan_version_id,meter)
) STRICT;
CREATE TRIGGER platform_private_watchlist_periods_insert_guard BEFORE INSERT ON platform_private_watchlist_plan_periods
WHEN NOT EXISTS(SELECT 1 FROM platform_membership_plan_versions WHERE plan_version_id=NEW.plan_version_id AND lifecycle_state='draft')
BEGIN SELECT RAISE(ABORT,'private_watchlist_period_requires_draft'); END;
CREATE TRIGGER platform_private_watchlist_periods_update_guard BEFORE UPDATE ON platform_private_watchlist_plan_periods
WHEN NEW.plan_version_id<>OLD.plan_version_id OR NEW.meter<>OLD.meter OR NOT EXISTS(SELECT 1 FROM platform_membership_plan_versions WHERE plan_version_id=OLD.plan_version_id AND lifecycle_state='draft')
BEGIN SELECT RAISE(ABORT,'private_watchlist_period_requires_draft'); END;
CREATE TRIGGER platform_private_watchlist_periods_delete_guard BEFORE DELETE ON platform_private_watchlist_plan_periods
WHEN NOT EXISTS(SELECT 1 FROM platform_membership_plan_versions WHERE plan_version_id=OLD.plan_version_id AND lifecycle_state='draft')
BEGIN SELECT RAISE(ABORT,'private_watchlist_period_requires_draft'); END;
CREATE TABLE platform_private_watchlist_member_overrides (
  user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  meter TEXT NOT NULL CHECK(meter IN ('ticker_additions','generations','cost_microusd','active_tickers')),
  limit_value INTEGER CHECK(limit_value BETWEEN 0 AND 9007199254740991),
  period_kind TEXT NOT NULL CHECK(period_kind IN ('calendar_month','days','lifetime')),
  period_days INTEGER,
  starts_at_utc TEXT NOT NULL,
  ends_at_utc TEXT,
  updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id),
  updated_at_utc TEXT NOT NULL,
  CHECK(ends_at_utc IS NULL OR ends_at_utc>starts_at_utc),
  CHECK((period_kind='days' AND period_days IS NOT NULL AND period_days BETWEEN 1 AND 9007199254740991) OR (period_kind<>'days' AND period_days IS NULL)),
  PRIMARY KEY(user_id,meter)
) STRICT;
`]),
});
