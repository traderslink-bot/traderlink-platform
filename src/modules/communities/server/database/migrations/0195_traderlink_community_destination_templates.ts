import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

/** Coordinator-reserved identity. Manifest integration follows the shared migration queue. */
export const traderLinkCommunityDestinationTemplatesMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",
 migrationId:"0195_traderlink_community_destination_templates",
 executionOrder:233,
 statements:Object.freeze([`
ALTER TABLE traderlink_community_content_pages ADD COLUMN template_key TEXT NOT NULL DEFAULT 'standard_alert'
 CHECK(template_key IN('standard_alert','watchlist_list','research_swing','article','research_report','guide','brief_update','custom'));
ALTER TABLE traderlink_community_content_pages ADD COLUMN permission_mode TEXT NOT NULL DEFAULT 'inherit'
 CHECK(permission_mode IN('inherit','restricted'));
ALTER TABLE traderlink_community_content_pages ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1);
ALTER TABLE traderlink_community_content_pages ADD COLUMN custom_template_id TEXT REFERENCES traderlink_community_content_templates(template_id) ON DELETE SET NULL;
ALTER TABLE traderlink_community_content_categories ADD COLUMN parent_category_id TEXT REFERENCES traderlink_community_content_categories(category_id) ON DELETE RESTRICT;

UPDATE traderlink_community_content_pages SET template_key=CASE page_type
 WHEN 'watchlist' THEN 'watchlist_list' WHEN 'swing' THEN 'research_swing' WHEN 'content' THEN 'article' ELSE 'standard_alert' END;

CREATE TABLE traderlink_community_content_templates (
 template_id TEXT PRIMARY KEY,community_id TEXT NOT NULL REFERENCES traderlink_communities(community_id) ON DELETE RESTRICT,
 family TEXT NOT NULL CHECK(family IN('alert','watchlist','content')),
 preset_key TEXT NOT NULL CHECK(preset_key IN('standard_alert','watchlist_list','research_swing','article','research_report','guide','brief_update','custom')),
 name TEXT NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 80),schema_json TEXT NOT NULL CHECK(json_valid(schema_json)),
 status TEXT NOT NULL DEFAULT 'active' CHECK(status IN('active','archived')),
 created_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(community_id,name COLLATE NOCASE),UNIQUE(template_id,community_id)
) STRICT;

CREATE TABLE traderlink_community_category_permissions (
 community_id TEXT NOT NULL,category_id TEXT NOT NULL,user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 can_publish INTEGER NOT NULL DEFAULT 1 CHECK(can_publish IN(0,1)),can_configure INTEGER NOT NULL DEFAULT 0 CHECK(can_configure IN(0,1)),
 can_moderate INTEGER NOT NULL DEFAULT 0 CHECK(can_moderate IN(0,1)),
 assigned_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,assigned_at_utc TEXT NOT NULL,
 PRIMARY KEY(category_id,user_id),
 FOREIGN KEY(category_id,community_id) REFERENCES traderlink_community_content_categories(category_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;
CREATE INDEX traderlink_community_category_permission_user ON traderlink_community_category_permissions(community_id,user_id,category_id);

CREATE TABLE traderlink_community_watchlist_items (
 item_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,page_id TEXT NOT NULL,symbol TEXT NOT NULL CHECK(length(symbol) BETWEEN 1 AND 15),
 publisher_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,category_id TEXT,
 authored_json TEXT NOT NULL CHECK(json_valid(authored_json)),metadata_json TEXT NOT NULL DEFAULT '{}' CHECK(json_valid(metadata_json)),
 status TEXT NOT NULL CHECK(status IN('draft','published','removed')),revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),
 published_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(page_id,symbol),UNIQUE(item_id,community_id),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE,
 FOREIGN KEY(category_id,community_id) REFERENCES traderlink_community_content_categories(category_id,community_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_watchlist_current ON traderlink_community_watchlist_items(page_id,status,updated_at_utc DESC,symbol);
CREATE TABLE traderlink_community_watchlist_item_revisions (
 item_id TEXT NOT NULL,revision INTEGER NOT NULL,actor_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 authored_json TEXT NOT NULL CHECK(json_valid(authored_json)),metadata_json TEXT NOT NULL CHECK(json_valid(metadata_json)),
 status TEXT NOT NULL CHECK(status IN('draft','published','removed')),changed_at_utc TEXT NOT NULL,
 PRIMARY KEY(item_id,revision),FOREIGN KEY(item_id) REFERENCES traderlink_community_watchlist_items(item_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;

CREATE TABLE traderlink_community_content_documents (
 document_id TEXT PRIMARY KEY,community_id TEXT NOT NULL,page_id TEXT NOT NULL,category_id TEXT,
 author_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,slug TEXT NOT NULL CHECK(length(slug) BETWEEN 1 AND 80),
 template_key TEXT NOT NULL CHECK(template_key IN('article','research_report','guide','brief_update','custom')),
 title TEXT NOT NULL CHECK(length(trim(title)) BETWEEN 1 AND 160),subtitle TEXT NOT NULL DEFAULT '' CHECK(length(subtitle)<=600),
 body_json TEXT NOT NULL CHECK(json_valid(body_json)),status TEXT NOT NULL CHECK(status IN('draft','published','archived')),
 revision INTEGER NOT NULL DEFAULT 1 CHECK(revision>=1),published_at_utc TEXT,created_at_utc TEXT NOT NULL,updated_at_utc TEXT NOT NULL,
 UNIQUE(page_id,slug),UNIQUE(document_id,community_id),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE,
 FOREIGN KEY(category_id,community_id) REFERENCES traderlink_community_content_categories(category_id,community_id) ON DELETE RESTRICT
) STRICT;
CREATE INDEX traderlink_community_content_document_feed ON traderlink_community_content_documents(page_id,status,published_at_utc DESC,document_id);
CREATE TABLE traderlink_community_content_document_revisions (
 document_id TEXT NOT NULL,revision INTEGER NOT NULL,actor_user_id TEXT REFERENCES platform_users(user_id) ON DELETE SET NULL,
 title TEXT NOT NULL,subtitle TEXT NOT NULL,body_json TEXT NOT NULL CHECK(json_valid(body_json)),status TEXT NOT NULL,
 changed_at_utc TEXT NOT NULL,PRIMARY KEY(document_id,revision),
 FOREIGN KEY(document_id) REFERENCES traderlink_community_content_documents(document_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;

CREATE TABLE traderlink_community_content_daily_stats (
 community_id TEXT NOT NULL,page_id TEXT NOT NULL,activity_day TEXT NOT NULL,
 category_id TEXT NOT NULL DEFAULT '',publisher_user_id TEXT NOT NULL DEFAULT '',
 visits INTEGER NOT NULL CHECK(visits>=0),unique_members INTEGER NOT NULL CHECK(unique_members>=0),
 content_opens INTEGER NOT NULL CHECK(content_opens>=0),last_rolled_up_at_utc TEXT NOT NULL,
 PRIMARY KEY(community_id,page_id,activity_day,category_id,publisher_user_id),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;
CREATE INDEX traderlink_community_content_daily_stats_time ON traderlink_community_content_daily_stats(community_id,activity_day,page_id);

CREATE TABLE traderlink_community_legacy_destination_routes (
 community_id TEXT NOT NULL,legacy_family TEXT NOT NULL CHECK(legacy_family IN('swing')),
 legacy_slug TEXT NOT NULL,legacy_secondary_slug TEXT NOT NULL DEFAULT '',page_id TEXT NOT NULL,
 created_at_utc TEXT NOT NULL,PRIMARY KEY(community_id,legacy_family,legacy_slug,legacy_secondary_slug),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE
) STRICT,WITHOUT ROWID;
INSERT INTO traderlink_community_legacy_destination_routes(community_id,legacy_family,legacy_slug,legacy_secondary_slug,page_id,created_at_utc)
 SELECT community_id,'swing',slug,coalesce(secondary_slug,''),page_id,updated_at_utc FROM traderlink_community_content_pages WHERE page_type='swing';
UPDATE traderlink_community_content_pages AS page SET slug=substr(slug,1,60)||'-research-'||substr(replace(page_id,'-',''),1,8)
 WHERE page_type='swing' AND EXISTS(
  SELECT 1 FROM traderlink_community_content_pages AS other
  WHERE other.community_id=page.community_id AND other.page_type='alert' AND other.slug=page.slug
   AND coalesce(other.secondary_slug,'')=coalesce(page.secondary_slug,'')
 );
UPDATE traderlink_community_content_pages SET page_type='alert' WHERE page_type='swing';

INSERT INTO traderlink_community_content_documents(document_id,community_id,page_id,category_id,author_user_id,slug,template_key,title,subtitle,body_json,status,revision,published_at_utc,created_at_utc,updated_at_utc)
 SELECT content.content_id,content.community_id,placement.page_id,placement.category_id,content.author_user_id,
  lower(replace(replace(replace(trim(content.title),' ','-'),'/','-'),'_','-')),'article',content.title,content.summary,
  json_object('version',1,'sections',json_array(json_object('kind','text','text',content.body)),'legacyResources',json(content.resources_json)),
  content.status,1,content.published_at_utc,content.created_at_utc,content.updated_at_utc
 FROM traderlink_community_general_content content
 JOIN traderlink_community_content_placements placement ON placement.content_type='content' AND placement.content_id=content.content_id
 WHERE NOT EXISTS(SELECT 1 FROM traderlink_community_content_documents document WHERE document.document_id=content.content_id);
`]),
});
