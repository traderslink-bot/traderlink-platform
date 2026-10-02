import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunitiesPrivatePilotBootstrapMigration: PlatformMigration = Object.freeze({
  moduleNamespace:"community",
  migrationId:"0125_traderlink_communities_private_pilot_bootstrap",
  executionOrder:125,
  statements:Object.freeze([`INSERT OR IGNORE INTO traderlink_community_roles(role_id,community_id,name,status,created_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000124',community_id,'Pilot: test-coach-community','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_roles(role_id,community_id,name,status,created_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000125',community_id,'Pilot: test-alerts-community','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_roles(role_id,community_id,name,status,created_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000126',community_id,'Pilot: test-watchlist-community','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';

INSERT OR IGNORE INTO traderlink_community_role_capabilities(community_id,role_id,capability_key,granted_by_user_id,granted_at_utc)
SELECT community_id,'10000000-0000-4000-8000-000000000124',value,owner_user_id,updated_at_utc FROM traderlink_communities,json_each('["community.view","community.coaching.view","community.coaching.offer","community.coaching.students"]') WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_role_capabilities(community_id,role_id,capability_key,granted_by_user_id,granted_at_utc)
SELECT community_id,'10000000-0000-4000-8000-000000000125',value,owner_user_id,updated_at_utc FROM traderlink_communities,json_each('["community.view","community.alerts.view","community.alerts.create"]') WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_role_capabilities(community_id,role_id,capability_key,granted_by_user_id,granted_at_utc)
SELECT community_id,'10000000-0000-4000-8000-000000000126',value,owner_user_id,updated_at_utc FROM traderlink_communities,json_each('["community.view","community.watchlists.view","community.watchlists.publish_staff"]') WHERE discord_guild_id='1433570740430573642';

UPDATE traderlink_community_discord_role_mappings SET status='paused' WHERE community_id IN (SELECT community_id FROM traderlink_communities WHERE discord_guild_id='1433570740430573642') AND discord_role_id IN ('1546028813106941952','1546032355045679134','1546032386301755432','1546032396061646918');
INSERT OR IGNORE INTO traderlink_community_discord_role_mappings(mapping_id,community_id,discord_role_id,role_id,status,mapped_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000128',community_id,'1546032355045679134','10000000-0000-4000-8000-000000000124','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_discord_role_mappings(mapping_id,community_id,discord_role_id,role_id,status,mapped_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000129',community_id,'1546032386301755432','10000000-0000-4000-8000-000000000125','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_discord_role_mappings(mapping_id,community_id,discord_role_id,role_id,status,mapped_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000130',community_id,'1546032396061646918','10000000-0000-4000-8000-000000000126','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';

INSERT OR IGNORE INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000131',community_id,'coaching','1546033844468187156','coaching','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000132',community_id,'alerts','1546033958448529508','alerts','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';
INSERT OR IGNORE INTO traderlink_community_discord_destinations(destination_id,community_id,name,discord_channel_id,content_type,status,updated_by_user_id,created_at_utc,updated_at_utc)
SELECT '10000000-0000-4000-8000-000000000133',community_id,'watchlist','1546034056725008385','watchlists','active',owner_user_id,updated_at_utc,updated_at_utc FROM traderlink_communities WHERE discord_guild_id='1433570740430573642';

INSERT INTO traderlink_community_operator_grants(grant_id,user_id,status,granted_at_utc,revoked_at_utc)
SELECT '10000000-0000-4000-8000-000000000134',owner_user_id,'active',updated_at_utc,NULL FROM traderlink_communities WHERE discord_guild_id='1433570740430573642'
ON CONFLICT(user_id) DO UPDATE SET status='active',revoked_at_utc=NULL;

UPDATE traderlink_communities SET status='active' WHERE discord_guild_id='1433570740430573642' AND status='setup';`]),
});
