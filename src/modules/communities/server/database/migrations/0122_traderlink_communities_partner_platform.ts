import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

const uuid = (column: string) => `CHECK (length(${column}) = 36 AND ${column} = lower(${column}) AND length(replace(${column}, '-', '')) = 32 AND replace(${column}, '-', '') NOT GLOB '*[^0-9a-f]*' AND substr(${column}, 9, 1) = '-' AND substr(${column}, 14, 1) = '-' AND substr(${column}, 19, 1) = '-' AND substr(${column}, 24, 1) = '-')`;
const utc = (column: string) => `CHECK (length(${column}) = 24 AND ${column} GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9].[0-9][0-9][0-9]Z')`;
const snowflake = (column: string) => `CHECK (length(${column}) BETWEEN 1 AND 32 AND ${column} NOT GLOB '*[^0-9]*')`;

const sql = `CREATE TABLE traderlink_community_operator_grants (
  grant_id TEXT PRIMARY KEY ${uuid("grant_id")}, user_id TEXT NOT NULL UNIQUE ${uuid("user_id")},
  status TEXT NOT NULL CHECK (status IN ('active','revoked')), granted_at_utc TEXT NOT NULL ${utc("granted_at_utc")},
  revoked_at_utc TEXT, FOREIGN KEY (user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_discord_guild_candidates (
  user_id TEXT NOT NULL ${uuid("user_id")}, discord_guild_id TEXT NOT NULL ${snowflake("discord_guild_id")},
  guild_name TEXT NOT NULL CHECK(length(trim(guild_name)) BETWEEN 1 AND 120), guild_owner INTEGER NOT NULL CHECK(guild_owner IN (0,1)),
  can_manage_guild INTEGER NOT NULL CHECK(can_manage_guild IN (0,1)), verified_at_utc TEXT NOT NULL ${utc("verified_at_utc")},
  PRIMARY KEY(user_id,discord_guild_id), FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_settings (
  community_id TEXT PRIMARY KEY ${uuid("community_id")}, description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=1000),
  logo_url TEXT, named_activity_retention_days INTEGER NOT NULL DEFAULT 90 CHECK(named_activity_retention_days BETWEEN 7 AND 730),
  visibility_status TEXT NOT NULL DEFAULT 'not_configured' CHECK(visibility_status IN ('not_configured','active','declined')),
  visibility_copy TEXT NOT NULL DEFAULT '', updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_audiences (
  audience_id TEXT PRIMARY KEY ${uuid("audience_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80), mode TEXT NOT NULL CHECK(mode IN ('everyone','discord_roles')),
  status TEXT NOT NULL CHECK(status IN ('active','archived')), created_by_user_id TEXT NOT NULL ${uuid("created_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")}, updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(community_id,name COLLATE NOCASE), UNIQUE(audience_id,community_id),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
  FOREIGN KEY (created_by_user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;
CREATE TABLE traderlink_community_audience_discord_roles (
  audience_id TEXT NOT NULL ${uuid("audience_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  discord_role_id TEXT NOT NULL ${snowflake("discord_role_id")}, PRIMARY KEY(audience_id,discord_role_id),
  FOREIGN KEY (audience_id,community_id) REFERENCES traderlink_community_audiences(audience_id,community_id) ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_discord_destinations (
  destination_id TEXT PRIMARY KEY ${uuid("destination_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80), discord_channel_id TEXT NOT NULL ${snowflake("discord_channel_id")},
  content_type TEXT NOT NULL CHECK(content_type IN ('alerts','watchlists','coaching','general')),
  status TEXT NOT NULL CHECK(status IN ('active','paused')), updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")}, updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(community_id,discord_channel_id,content_type), FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_alerts (
  alert_id TEXT PRIMARY KEY ${uuid("alert_id")}, community_id TEXT NOT NULL ${uuid("community_id")}, slug TEXT NOT NULL,
  author_user_id TEXT NOT NULL ${uuid("author_user_id")}, title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 140),
  symbol TEXT, body TEXT NOT NULL CHECK(length(trim(body)) BETWEEN 1 AND 8000), status TEXT NOT NULL CHECK(status IN ('draft','published','archived')),
  audience_id TEXT NOT NULL ${uuid("audience_id")}, published_at_utc TEXT, created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")}, UNIQUE(community_id,slug), UNIQUE(alert_id,community_id),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
  FOREIGN KEY (audience_id,community_id) REFERENCES traderlink_community_audiences(audience_id,community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_watchlist_placements (
  placement_id TEXT PRIMARY KEY ${uuid("placement_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  watchlist_id TEXT NOT NULL ${uuid("watchlist_id")}, author_user_id TEXT NOT NULL ${uuid("author_user_id")},
  audience_id TEXT NOT NULL ${uuid("audience_id")}, status TEXT NOT NULL CHECK(status IN ('published','removed')),
  shared_at_utc TEXT NOT NULL ${utc("shared_at_utc")}, removed_at_utc TEXT, UNIQUE(community_id,watchlist_id),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
  FOREIGN KEY (watchlist_id) REFERENCES community_watchlists(watchlist_id) ON DELETE RESTRICT,
  FOREIGN KEY (audience_id,community_id) REFERENCES traderlink_community_audiences(audience_id,community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coach_profiles (
  coach_profile_id TEXT PRIMARY KEY ${uuid("coach_profile_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  user_id TEXT NOT NULL ${uuid("user_id")}, coach_slug TEXT NOT NULL CHECK(length(coach_slug) BETWEEN 2 AND 100), display_name TEXT NOT NULL CHECK(length(trim(display_name)) BETWEEN 1 AND 100),
  headline TEXT NOT NULL DEFAULT '' CHECK(length(headline)<=180), biography TEXT NOT NULL DEFAULT '' CHECK(length(biography)<=4000),
  delivery_summary TEXT NOT NULL DEFAULT '' CHECK(length(delivery_summary)<=1000), capacity INTEGER NOT NULL DEFAULT 1 CHECK(capacity BETWEEN 1 AND 10000),
  status TEXT NOT NULL CHECK(status IN ('draft','active','paused','archived')), created_at_utc TEXT NOT NULL ${utc("created_at_utc")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")}, UNIQUE(community_id,user_id), UNIQUE(community_id,coach_slug), UNIQUE(coach_profile_id,community_id),
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coaching_plans (
  plan_id TEXT PRIMARY KEY ${uuid("plan_id")}, coach_profile_id TEXT NOT NULL ${uuid("coach_profile_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 100), description TEXT NOT NULL CHECK(length(description)<=4000),
  cadence TEXT NOT NULL CHECK(cadence IN ('weekly','monthly','trade_reviews','custom')), trade_review_limit INTEGER,
  price_label TEXT NOT NULL CHECK(length(price_label)<=80), payment_instructions TEXT NOT NULL CHECK(length(payment_instructions)<=1000),
  audience_id TEXT NOT NULL ${uuid("audience_id")}, status TEXT NOT NULL CHECK(status IN ('draft','active','paused','archived')),
  created_at_utc TEXT NOT NULL ${utc("created_at_utc")}, updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  UNIQUE(plan_id,community_id), FOREIGN KEY (coach_profile_id,community_id) REFERENCES traderlink_community_coach_profiles(coach_profile_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY (audience_id,community_id) REFERENCES traderlink_community_audiences(audience_id,community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coaching_relationships (
  relationship_id TEXT PRIMARY KEY ${uuid("relationship_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  coach_profile_id TEXT NOT NULL ${uuid("coach_profile_id")}, coach_user_id TEXT NOT NULL ${uuid("coach_user_id")}, student_user_id TEXT NOT NULL ${uuid("student_user_id")},
  plan_id TEXT NOT NULL ${uuid("plan_id")}, status TEXT NOT NULL CHECK(status IN ('pending','active','ended','declined')),
  requested_at_utc TEXT NOT NULL ${utc("requested_at_utc")}, started_at_utc TEXT, ended_at_utc TEXT,
  UNIQUE(community_id,coach_user_id,student_user_id,plan_id), UNIQUE(relationship_id,community_id),
  FOREIGN KEY (plan_id,community_id) REFERENCES traderlink_community_coaching_plans(plan_id,community_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_journal_grants (
  grant_id TEXT PRIMARY KEY ${uuid("grant_id")}, relationship_id TEXT NOT NULL ${uuid("relationship_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  coach_user_id TEXT NOT NULL ${uuid("coach_user_id")}, student_user_id TEXT NOT NULL ${uuid("student_user_id")}, journal_account_id TEXT NOT NULL ${uuid("journal_account_id")},
  data_scope TEXT NOT NULL CHECK(data_scope IN ('summary','trades','journal','analytics','complete')),
  status TEXT NOT NULL CHECK(status IN ('active','revoked')), granted_at_utc TEXT NOT NULL ${utc("granted_at_utc")}, revoked_at_utc TEXT,
  UNIQUE(relationship_id,journal_account_id,data_scope), FOREIGN KEY (relationship_id,community_id) REFERENCES traderlink_community_coaching_relationships(relationship_id,community_id) ON DELETE RESTRICT,
  FOREIGN KEY (journal_account_id) REFERENCES journal_accounts(account_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_content_deliveries (
  delivery_id TEXT PRIMARY KEY ${uuid("delivery_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  object_type TEXT NOT NULL CHECK(object_type IN ('alert','watchlist','coach','plan')), object_id TEXT NOT NULL,
  destination_id TEXT NOT NULL ${uuid("destination_id")}, status TEXT NOT NULL CHECK(status IN ('pending','sending','delivered','failed','cancelled')),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK(attempt_count BETWEEN 0 AND 20), last_error TEXT, requested_at_utc TEXT NOT NULL ${utc("requested_at_utc")},
  delivered_at_utc TEXT, updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  FOREIGN KEY (destination_id) REFERENCES traderlink_community_discord_destinations(destination_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_activity_events (
  event_id TEXT PRIMARY KEY ${uuid("event_id")}, community_id TEXT NOT NULL ${uuid("community_id")},
  user_id TEXT ${uuid("user_id")}, event_type TEXT NOT NULL, object_type TEXT NOT NULL, object_id TEXT,
  path TEXT NOT NULL CHECK(length(path) BETWEEN 1 AND 500), occurred_at_utc TEXT NOT NULL ${utc("occurred_at_utc")},
  FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_activity_recent ON traderlink_community_activity_events(community_id,occurred_at_utc DESC);
CREATE TABLE traderlink_community_activity_daily_members (
  community_id TEXT NOT NULL ${uuid("community_id")}, activity_day TEXT NOT NULL CHECK(activity_day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  path TEXT NOT NULL CHECK(length(path) BETWEEN 1 AND 500), user_id TEXT NOT NULL ${uuid("user_id")}, views INTEGER NOT NULL CHECK(views>=1),
  first_viewed_at_utc TEXT NOT NULL ${utc("first_viewed_at_utc")}, last_viewed_at_utc TEXT NOT NULL ${utc("last_viewed_at_utc")},
  PRIMARY KEY(community_id,activity_day,path,user_id), FOREIGN KEY(community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT, WITHOUT ROWID;

CREATE TABLE traderlink_community_partner_programs (
  community_id TEXT PRIMARY KEY ${uuid("community_id")}, status TEXT NOT NULL CHECK(status IN ('disabled','active','paused')),
  commission_basis_points INTEGER CHECK(commission_basis_points BETWEEN 0 AND 10000), attribution_days INTEGER NOT NULL DEFAULT 90 CHECK(attribution_days BETWEEN 1 AND 3650),
  currency TEXT NOT NULL DEFAULT 'USD' CHECK(length(currency)=3), updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")},
  updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")}, FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;
CREATE TABLE traderlink_community_partner_attributions (
  attribution_id TEXT PRIMARY KEY ${uuid("attribution_id")}, community_id TEXT NOT NULL ${uuid("community_id")}, user_id TEXT NOT NULL ${uuid("user_id")},
  status TEXT NOT NULL CHECK(status IN ('attributed','converted','expired','reversed')), attributed_at_utc TEXT NOT NULL ${utc("attributed_at_utc")},
  converted_at_utc TEXT, UNIQUE(user_id), FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;
CREATE TABLE traderlink_community_partner_earnings (
  earning_id TEXT PRIMARY KEY ${uuid("earning_id")}, community_id TEXT NOT NULL ${uuid("community_id")}, attribution_id TEXT NOT NULL ${uuid("attribution_id")},
  period_key TEXT NOT NULL, gross_minor INTEGER NOT NULL CHECK(gross_minor>=0), commission_minor INTEGER NOT NULL CHECK(commission_minor>=0),
  currency TEXT NOT NULL CHECK(length(currency)=3), status TEXT NOT NULL CHECK(status IN ('estimated','approved','paid','reversed')),
  recorded_at_utc TEXT NOT NULL ${utc("recorded_at_utc")}, UNIQUE(attribution_id,period_key),
  FOREIGN KEY (attribution_id) REFERENCES traderlink_community_partner_attributions(attribution_id) ON DELETE RESTRICT
) STRICT;
CREATE TABLE traderlink_community_partner_billing_events (
  billing_event_id TEXT PRIMARY KEY ${uuid("billing_event_id")}, provider_event_ref TEXT NOT NULL UNIQUE CHECK(length(provider_event_ref) BETWEEN 1 AND 200),
  user_id TEXT NOT NULL ${uuid("user_id")}, event_type TEXT NOT NULL CHECK(event_type IN ('tier2.started','tier2.renewed','tier2.refunded','tier2.ended')),
  period_key TEXT NOT NULL CHECK(length(period_key) BETWEEN 1 AND 40), gross_minor INTEGER NOT NULL CHECK(gross_minor>=0),
  currency TEXT NOT NULL CHECK(length(currency)=3), occurred_at_utc TEXT NOT NULL ${utc("occurred_at_utc")}, processed_at_utc TEXT NOT NULL ${utc("processed_at_utc")},
  FOREIGN KEY(user_id) REFERENCES platform_users(user_id) ON DELETE RESTRICT
) STRICT;

CREATE TABLE traderlink_community_coach_fee_rules (
  fee_rule_id TEXT PRIMARY KEY ${uuid("fee_rule_id")}, community_id TEXT, coach_user_id TEXT ${uuid("coach_user_id")},
  fee_basis_points INTEGER NOT NULL CHECK(fee_basis_points BETWEEN 0 AND 10000), status TEXT NOT NULL CHECK(status IN ('disabled','active')),
  provider_key TEXT NOT NULL DEFAULT 'future_external_provider', notes TEXT NOT NULL DEFAULT '' CHECK(length(notes)<=1000),
  updated_by_user_id TEXT NOT NULL ${uuid("updated_by_user_id")}, updated_at_utc TEXT NOT NULL ${utc("updated_at_utc")},
  CHECK(community_id IS NOT NULL OR coach_user_id IS NOT NULL), FOREIGN KEY (community_id) REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT
) STRICT;

CREATE TRIGGER traderlink_community_journal_grants_owner_insert BEFORE INSERT ON traderlink_community_journal_grants
WHEN NOT EXISTS (SELECT 1 FROM journal_accounts a JOIN platform_workspace_memberships m ON m.workspace_id=a.workspace_id WHERE a.account_id=NEW.journal_account_id AND m.user_id=NEW.student_user_id AND m.role='owner' AND m.status='active')
BEGIN SELECT RAISE(ABORT,'traderlink_community_journal_grant_not_owned'); END;
CREATE TRIGGER traderlink_community_journal_grants_no_transfer BEFORE UPDATE ON traderlink_community_journal_grants
WHEN NEW.relationship_id<>OLD.relationship_id OR NEW.community_id<>OLD.community_id OR NEW.coach_user_id<>OLD.coach_user_id OR NEW.student_user_id<>OLD.student_user_id OR NEW.journal_account_id<>OLD.journal_account_id OR NEW.data_scope<>OLD.data_scope
BEGIN SELECT RAISE(ABORT,'traderlink_community_journal_grant_immutable_scope'); END;`;

export const traderLinkCommunitiesPartnerPlatformMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community", migrationId: "0122_traderlink_communities_partner_platform", executionOrder: 122,
  statements: Object.freeze([sql]),
});
