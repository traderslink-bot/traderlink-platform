import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunityBrandedFeedsMigration:PlatformMigration=Object.freeze({
  moduleNamespace:"community",
  migrationId:"0177_traderlink_community_branded_feeds",
  executionOrder:275,
  statements:Object.freeze([`
CREATE TABLE traderlink_community_page_allowances (
 community_id TEXT PRIMARY KEY REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 page_limit INTEGER NOT NULL CHECK(page_limit BETWEEN 0 AND 1000),
 updated_by_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 updated_at_utc TEXT NOT NULL
) STRICT;
CREATE TABLE traderlink_community_content_categories (
 category_id TEXT PRIMARY KEY, community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80), slug TEXT NOT NULL CHECK(length(slug) BETWEEN 1 AND 80),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','archived')),
 created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(community_id,slug),UNIQUE(community_id,name COLLATE NOCASE),UNIQUE(category_id,community_id)
) STRICT;
CREATE TABLE traderlink_community_content_pages (
 page_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 page_type TEXT NOT NULL CHECK(page_type IN('alert','watchlist','swing','content')),
 feed_kind TEXT NOT NULL CHECK(feed_kind IN('publisher','category','publisher_category','general')),
 slug TEXT NOT NULL CHECK(length(slug) BETWEEN 1 AND 80),secondary_slug TEXT CHECK(secondary_slug IS NULL OR length(secondary_slug) BETWEEN 1 AND 80),title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 120),
 description TEXT NOT NULL DEFAULT '' CHECK(length(description)<=1000),logo_url TEXT,publisher_user_id TEXT REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 category_id TEXT,status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('draft','active','archived')),
 display_count INTEGER NOT NULL DEFAULT 20 CHECK(display_count BETWEEN 1 AND 100),
 created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(community_id,page_type,slug,secondary_slug),UNIQUE(page_id,community_id),
 FOREIGN KEY(category_id,community_id) REFERENCES traderlink_community_content_categories(category_id,community_id) ON DELETE RESTRICT,
 CHECK((feed_kind='publisher' AND publisher_user_id IS NOT NULL AND category_id IS NULL) OR
       (feed_kind='category' AND publisher_user_id IS NULL AND category_id IS NOT NULL) OR
       (feed_kind='publisher_category' AND publisher_user_id IS NOT NULL AND category_id IS NOT NULL) OR
       (feed_kind='general' AND publisher_user_id IS NULL AND category_id IS NULL))
) STRICT;
CREATE UNIQUE INDEX traderlink_community_active_page_slug_namespace
 ON traderlink_community_content_pages(community_id,page_type,slug) WHERE status<>'archived' AND secondary_slug IS NULL;
CREATE UNIQUE INDEX traderlink_community_active_page_route_pair
 ON traderlink_community_content_pages(community_id,page_type,slug,secondary_slug) WHERE status<>'archived' AND secondary_slug IS NOT NULL;
CREATE TABLE traderlink_community_content_page_aliases (
 community_id TEXT NOT NULL,page_type TEXT NOT NULL,old_slug TEXT NOT NULL,old_secondary_slug TEXT NOT NULL DEFAULT '',page_id TEXT NOT NULL,
 created_at_utc TEXT NOT NULL,PRIMARY KEY(community_id,page_type,old_slug,old_secondary_slug),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;
CREATE TABLE traderlink_community_content_page_publishers (
 page_id TEXT NOT NULL,community_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 can_publish INTEGER NOT NULL DEFAULT 1 CHECK(can_publish IN(0,1)),can_edit_own INTEGER NOT NULL DEFAULT 1 CHECK(can_edit_own IN(0,1)),
 can_delete_own INTEGER NOT NULL DEFAULT 0 CHECK(can_delete_own IN(0,1)),can_moderate INTEGER NOT NULL DEFAULT 0 CHECK(can_moderate IN(0,1)),
 assigned_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,assigned_at_utc TEXT NOT NULL,
 PRIMARY KEY(page_id,user_id),FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;
CREATE TABLE traderlink_community_content_page_metadata_settings (
 page_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,
 show_publication_price INTEGER NOT NULL DEFAULT 1 CHECK(show_publication_price IN(0,1)),show_company INTEGER NOT NULL DEFAULT 1 CHECK(show_company IN(0,1)),
 show_exchange INTEGER NOT NULL DEFAULT 1 CHECK(show_exchange IN(0,1)),show_industry INTEGER NOT NULL DEFAULT 1 CHECK(show_industry IN(0,1)),
 show_website INTEGER NOT NULL DEFAULT 0 CHECK(show_website IN(0,1)),show_market_cap INTEGER NOT NULL DEFAULT 1 CHECK(show_market_cap IN(0,1)),
 updated_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,updated_at_utc TEXT NOT NULL,
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE
) STRICT;
CREATE TABLE traderlink_community_content_placements (
 placement_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,page_id TEXT NOT NULL,
 content_type TEXT NOT NULL CHECK(content_type IN('alert','watchlist','swing','content')),content_id TEXT NOT NULL,
 publisher_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,category_id TEXT,
 status TEXT NOT NULL DEFAULT 'published' CHECK(status IN('draft','published','removed')),
 published_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(page_id,content_type,content_id),UNIQUE(placement_id,community_id),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE,
 FOREIGN KEY(category_id,community_id) REFERENCES traderlink_community_content_categories(category_id,community_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_content_feed ON traderlink_community_content_placements(page_id,status,published_at_utc DESC,placement_id);
CREATE TABLE traderlink_community_swing_posts (
 swing_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 author_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
 symbol TEXT NOT NULL CHECK(length(symbol) BETWEEN 1 AND 15),research_body TEXT NOT NULL CHECK(length(research_body)<=30000),
 chart_urls_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(chart_urls_json)),commentary TEXT NOT NULL DEFAULT '' CHECK(length(commentary)<=8000),
 price_target TEXT,support_levels_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(support_levels_json)),stop_loss TEXT,publisher_take TEXT NOT NULL DEFAULT '' CHECK(length(publisher_take)<=2000),
 status TEXT NOT NULL CHECK(status IN('draft','published','archived')),published_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(swing_id,community_id)
) STRICT;
CREATE TABLE traderlink_community_general_content (
 content_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 author_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),
 summary TEXT NOT NULL DEFAULT '' CHECK(length(summary)<=600),body TEXT NOT NULL CHECK(length(body)<=30000),
 resources_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(resources_json)),status TEXT NOT NULL CHECK(status IN('draft','published','archived')),
 published_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,UNIQUE(content_id,community_id)
) STRICT;
CREATE TABLE traderlink_community_content_ticker_details (
 detail_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,content_type TEXT NOT NULL CHECK(content_type IN('alert','watchlist','swing')),
 content_id TEXT NOT NULL,symbol TEXT NOT NULL CHECK(length(symbol) BETWEEN 1 AND 15),ordinal INTEGER NOT NULL DEFAULT 0 CHECK(ordinal BETWEEN 0 AND 999),
 price_target TEXT,support_levels_json TEXT NOT NULL DEFAULT '[]' CHECK(json_valid(support_levels_json)),stop_loss TEXT,publisher_take TEXT NOT NULL DEFAULT '' CHECK(length(publisher_take)<=2000),
 publication_price REAL,publication_price_observed_at_utc TEXT,publication_price_source TEXT NOT NULL DEFAULT 'eodhd',publication_price_status TEXT NOT NULL CHECK(publication_price_status IN('available','unavailable','stale')),
 company_name TEXT,exchange TEXT,industry TEXT,website TEXT,market_cap REAL,company_source TEXT NOT NULL DEFAULT 'finnhub',company_status TEXT NOT NULL CHECK(company_status IN('available','partial','unavailable')),
 captured_at_utc TEXT NOT NULL,UNIQUE(content_type,content_id,symbol),UNIQUE(detail_id,community_id)
) STRICT;
ALTER TABLE traderlink_community_activity_events ADD COLUMN page_id TEXT;
ALTER TABLE traderlink_community_activity_events ADD COLUMN category_id TEXT;
ALTER TABLE traderlink_community_activity_events ADD COLUMN publisher_user_id TEXT;
CREATE INDEX traderlink_community_activity_dimensions ON traderlink_community_activity_events(community_id,page_id,category_id,publisher_user_id,occurred_at_utc DESC);
ALTER TABLE community_stats_events ADD COLUMN page_id TEXT;
ALTER TABLE community_stats_events ADD COLUMN category_id TEXT;
ALTER TABLE community_stats_events ADD COLUMN publisher_user_id TEXT;
CREATE INDEX community_stats_web_dimensions ON community_stats_events(community_id,page_id,category_id,publisher_user_id,occurred_at_utc DESC);
CREATE TABLE traderlink_community_content_audit (
 audit_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,actor_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 event_type TEXT NOT NULL,object_type TEXT NOT NULL,object_id TEXT NOT NULL,details_json TEXT NOT NULL CHECK(json_valid(details_json)),occurred_at_utc TEXT NOT NULL
) STRICT;
`]),
});
