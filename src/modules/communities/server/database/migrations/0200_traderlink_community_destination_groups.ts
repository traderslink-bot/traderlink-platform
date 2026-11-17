import type {PlatformMigration} from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunityDestinationGroupsMigration:PlatformMigration=Object.freeze({
 moduleNamespace:"community",
 migrationId:"0200_traderlink_community_destination_groups",
 executionOrder:277,
 statements:Object.freeze([`
ALTER TABLE traderlink_community_content_pages ADD COLUMN discord_destination_id TEXT
 REFERENCES traderlink_community_discord_destinations(destination_id) ON DELETE SET NULL;
CREATE INDEX traderlink_community_content_page_discord_destination
 ON traderlink_community_content_pages(community_id,discord_destination_id)
 WHERE discord_destination_id IS NOT NULL;

CREATE TRIGGER traderlink_community_content_page_destination_insert
BEFORE INSERT ON traderlink_community_content_pages
WHEN NEW.discord_destination_id IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM traderlink_community_discord_destinations destination
 WHERE destination.destination_id=NEW.discord_destination_id
  AND destination.community_id=NEW.community_id
  AND destination.content_type=CASE NEW.page_type WHEN 'alert' THEN 'alerts' WHEN 'watchlist' THEN 'watchlists' ELSE 'general' END
)
BEGIN SELECT RAISE(ABORT,'traderlink_community_content_page_destination_invalid'); END;
CREATE TRIGGER traderlink_community_content_page_destination_update
BEFORE UPDATE OF discord_destination_id,community_id,page_type ON traderlink_community_content_pages
WHEN NEW.discord_destination_id IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM traderlink_community_discord_destinations destination
 WHERE destination.destination_id=NEW.discord_destination_id
  AND destination.community_id=NEW.community_id
  AND destination.content_type=CASE NEW.page_type WHEN 'alert' THEN 'alerts' WHEN 'watchlist' THEN 'watchlists' ELSE 'general' END
)
BEGIN SELECT RAISE(ABORT,'traderlink_community_content_page_destination_invalid'); END;

CREATE TABLE traderlink_community_content_page_roles (
 page_id TEXT NOT NULL,
 community_id TEXT NOT NULL,
 role_id TEXT NOT NULL,
 can_publish INTEGER NOT NULL DEFAULT 1 CHECK(can_publish IN(0,1)),
 can_edit_own INTEGER NOT NULL DEFAULT 1 CHECK(can_edit_own IN(0,1)),
 can_delete_own INTEGER NOT NULL DEFAULT 0 CHECK(can_delete_own IN(0,1)),
 can_moderate INTEGER NOT NULL DEFAULT 0 CHECK(can_moderate IN(0,1)),
 assigned_by_user_id TEXT NOT NULL REFERENCES platform_users(user_id) ON DELETE RESTRICT,
 assigned_at_utc TEXT NOT NULL,
 PRIMARY KEY(page_id,role_id),
 FOREIGN KEY(page_id,community_id) REFERENCES traderlink_community_content_pages(page_id,community_id) ON DELETE CASCADE,
 FOREIGN KEY(role_id,community_id) REFERENCES traderlink_community_roles(role_id,community_id) ON DELETE RESTRICT
) STRICT,WITHOUT ROWID;
CREATE INDEX traderlink_community_content_page_role_lookup
 ON traderlink_community_content_page_roles(community_id,role_id,page_id);

WITH RECURSIVE category_ancestry(page_id,community_id,category_id,parent_category_id) AS (
 SELECT page.page_id,page.community_id,category.category_id,category.parent_category_id
 FROM traderlink_community_content_pages page
 JOIN traderlink_community_content_categories category
  ON category.category_id=page.category_id AND category.community_id=page.community_id
 WHERE page.permission_mode='inherit'
 UNION ALL
 SELECT ancestry.page_id,ancestry.community_id,parent.category_id,parent.parent_category_id
 FROM category_ancestry ancestry
 JOIN traderlink_community_content_categories parent
  ON parent.category_id=ancestry.parent_category_id AND parent.community_id=ancestry.community_id
), effective AS (
 SELECT ancestry.page_id,ancestry.community_id,permission.user_id,
  max(permission.can_publish) can_publish,max(permission.can_moderate) can_moderate,
  max(permission.assigned_at_utc) assigned_at_utc
 FROM category_ancestry ancestry
 JOIN traderlink_community_category_permissions permission
  ON permission.category_id=ancestry.category_id AND permission.community_id=ancestry.community_id
 GROUP BY ancestry.page_id,ancestry.community_id,permission.user_id
)
INSERT INTO traderlink_community_content_page_publishers(
 page_id,community_id,user_id,can_publish,can_edit_own,can_delete_own,can_moderate,assigned_by_user_id,assigned_at_utc
)
SELECT effective.page_id,effective.community_id,effective.user_id,effective.can_publish,effective.can_publish,0,effective.can_moderate,
 community.owner_user_id,effective.assigned_at_utc
FROM effective JOIN traderlink_communities community ON community.community_id=effective.community_id
ON CONFLICT(page_id,user_id) DO UPDATE SET
 can_publish=max(traderlink_community_content_page_publishers.can_publish,excluded.can_publish),
 can_edit_own=max(traderlink_community_content_page_publishers.can_edit_own,excluded.can_edit_own),
 can_delete_own=traderlink_community_content_page_publishers.can_delete_own,
 can_moderate=max(traderlink_community_content_page_publishers.can_moderate,excluded.can_moderate),
 assigned_at_utc=max(traderlink_community_content_page_publishers.assigned_at_utc,excluded.assigned_at_utc);
`]),
});
