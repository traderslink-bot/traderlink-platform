import type { PlatformMigration } from "@/src/modules/platform/server/database/platform-migration-contract";

export const traderLinkCommunitiesDiscordFeatureAccessMigration: PlatformMigration = Object.freeze({
  moduleNamespace: "community",
  migrationId: "0123_traderlink_communities_discord_feature_access",
  executionOrder: 123,
  statements: Object.freeze([
    `INSERT INTO traderlink_community_capability_catalog (capability_key, catalog_version, description)
VALUES
  ('community.alerts.view', 1, 'Open alerts allowed by the member''s current Discord roles.'),
  ('community.watchlists.view', 1, 'Open server watchlists allowed by the member''s current Discord roles.'),
  ('community.coaching.view', 1, 'Open coaching allowed by the member''s current Discord roles.');`,
  ]),
});
