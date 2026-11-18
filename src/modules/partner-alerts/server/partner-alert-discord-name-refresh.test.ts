// @vitest-environment node
import Database from "better-sqlite3";
import { expect, it } from "vitest";
import { refreshPartnerAlertDiscordNames, refreshPartnerAlertDiscordNamesPage } from "./partner-alert-discord-name-refresh";

it("updates listing labels by Discord ID without changing mappings or offer coverage", () => {
  const database = new Database(":memory:");
  try {
    database.exec(`
      CREATE TABLE partner_alert_partners (community_id TEXT PRIMARY KEY, source_guild_id TEXT, display_name TEXT, revision INTEGER);
      CREATE TABLE partner_alert_mappings (mapping_id TEXT PRIMARY KEY, community_id TEXT, source_guild_id TEXT,
        source_channel_id TEXT, display_name TEXT, revision INTEGER, approved_revision INTEGER);
      CREATE TABLE offers (mapping_id TEXT REFERENCES partner_alert_mappings(mapping_id));
      INSERT INTO partner_alert_partners VALUES ('community','guild','Old guild',5), ('other','other-guild','Other guild',2);
      INSERT INTO partner_alert_mappings VALUES ('mapped','community','guild','channel','Old channel',3,3),
        ('unreadable','community','guild','hidden','Hidden',1,1), ('other-mapping','other','other-guild','channel','Other channel',1,1);
      INSERT INTO offers VALUES ('mapped');
    `);
    const refresh = database.transaction(() => refreshPartnerAlertDiscordNames(database,
      { communityId: "community", sourceGuildId: "guild" },
      { guildName: "New guild", channels: [{ channelId: "channel", name: "New channel" }] }));
    refresh.immediate();
    refresh.immediate();

    expect(database.prepare("SELECT display_name,revision FROM partner_alert_partners ORDER BY community_id").all())
      .toEqual([{ display_name: "New guild", revision: 6 }, { display_name: "Other guild", revision: 2 }]);
    expect(database.prepare("SELECT mapping_id,source_channel_id,display_name,revision,approved_revision FROM partner_alert_mappings ORDER BY mapping_id").all())
      .toEqual([
        { mapping_id: "mapped", source_channel_id: "channel", display_name: "New channel", revision: 3, approved_revision: 3 },
        { mapping_id: "other-mapping", source_channel_id: "channel", display_name: "Other channel", revision: 1, approved_revision: 1 },
        { mapping_id: "unreadable", source_channel_id: "hidden", display_name: "Hidden", revision: 1, approved_revision: 1 },
      ]);
    expect(database.prepare("SELECT mapping_id FROM offers").all()).toEqual([{ mapping_id: "mapped" }]);
  } finally {
    database.close();
  }
});

it("skips removed servers and discards a rename if the partner revision changes during lookup", async () => {
  const database = new Database(":memory:");
  try {
    database.exec(`
      CREATE TABLE traderlink_communities (community_id TEXT, discord_guild_id TEXT, owner_user_id TEXT, status TEXT);
      CREATE TABLE traderlink_community_lifecycle (community_id TEXT, removed_at_utc TEXT);
      CREATE TABLE partner_alert_partners (community_id TEXT, source_guild_id TEXT, owner_user_id TEXT,
        display_name TEXT, status TEXT, revision INTEGER);
      CREATE TABLE partner_alert_mappings (community_id TEXT, source_guild_id TEXT, source_channel_id TEXT, display_name TEXT);
      INSERT INTO traderlink_communities VALUES ('one','first','owner','active'), ('two','second','owner','active'),
        ('three','removed','owner','active');
      INSERT INTO traderlink_community_lifecycle VALUES ('three','2026-11-13');
      INSERT INTO partner_alert_partners VALUES ('one','first','owner','First','active',1),
        ('two','second','owner','Second','active',1), ('three','removed','owner','Third','active',1);
    `);
    const visited: string[] = [];
    const admission = { runForUsers: <T>(ids: readonly string[], operation: () => T) => {
      expect(ids).toEqual(["owner"]);
      return database.transaction(operation).immediate();
    } };
    const catalog = async (guildId: string) => {
      visited.push(guildId);
      if (guildId === "second") database.exec("UPDATE partner_alert_partners SET revision=2 WHERE community_id='two'");
      return { guildName: "Renamed", channels: [] };
    };
    await expect(refreshPartnerAlertDiscordNamesPage(database, admission, catalog, null,
      new AbortController().signal)).resolves.toBeNull();
    expect(visited).toEqual(["first", "second"]);
    expect(database.prepare("SELECT display_name,revision FROM partner_alert_partners ORDER BY community_id").all())
      .toEqual([{ display_name: "Renamed", revision: 2 }, { display_name: "Third", revision: 1 },
        { display_name: "Second", revision: 2 }]);
  } finally {
    database.close();
  }
});

it("projects refreshed names in the trader catalog from the same saved mapping", async () => {
  const { mkdtempSync, rmSync } = await import("node:fs");
  const { tmpdir } = await import("node:os");
  const { join } = await import("node:path");
  const { readPartnerAlertCatalogCandidates } = await import("./partner-alert-catalog-read");
  const directory = mkdtempSync(join(tmpdir(), "partner-discord-names-"));
  const path = join(directory, "fixture.sqlite");
  const database = new Database(path);
  const communityId = "20000000-0000-4000-8000-000000000002";
  const mappingId = "40000000-0000-4000-8000-000000000004";
  const offerId = "30000000-0000-4000-8000-000000000003";
  const userId = "10000000-0000-4000-8000-000000000001";
  const offer = {
    offerId, communityId, version: 1, kind: "channel", title: "Morning alerts", mappingIds: [mappingId],
    currency: { code: "USD", minorUnitDigits: 2 }, amountMinor: 2500,
    cadence: { unit: "calendar_month", count: 1 },
    whop: { environment: "live", accountId: "biz_partner", productId: "prod_alerts", planId: "plan_monthly" },
  };
  try {
    database.exec(`
      CREATE TABLE partner_alert_partners (community_id TEXT, source_guild_id TEXT, display_name TEXT, status TEXT, revision INTEGER);
      CREATE TABLE partner_alert_mappings (mapping_id TEXT, community_id TEXT, source_guild_id TEXT, source_channel_id TEXT,
        display_name TEXT, review_state TEXT, revision INTEGER, approved_revision INTEGER, ever_approved INTEGER, delivery_state TEXT);
      CREATE TABLE partner_alert_offers (community_id TEXT, offer_id TEXT, version INTEGER,
        review_state TEXT, whop_environment TEXT, offer_json TEXT, whop_account_id TEXT);
      CREATE TABLE partner_alert_offer_channels (community_id TEXT, offer_id TEXT, offer_version INTEGER, mapping_id TEXT);
      CREATE TABLE partner_alert_memberships (user_id TEXT, community_id TEXT, offer_id TEXT, offer_version INTEGER,
        environment TEXT, whop_account_id TEXT);
    `);
    database.prepare("INSERT INTO partner_alert_partners VALUES (?, 'guild', 'Old guild', 'active', 5)").run(communityId);
    database.prepare("INSERT INTO partner_alert_mappings VALUES (?, ?, 'guild', 'channel', 'Old channel', 'approved', 3, 3, 1, 'ready')")
      .run(mappingId, communityId);
    database.prepare("INSERT INTO partner_alert_offers VALUES (?, ?, 1, 'approved', 'live', ?, 'biz_partner')")
      .run(communityId, offerId, JSON.stringify(offer));
    database.prepare("INSERT INTO partner_alert_offer_channels VALUES (?, ?, 1, ?)").run(communityId, offerId, mappingId);
    const reader = new Database(path, { readonly: true });
    try {
      expect(readPartnerAlertCatalogCandidates(reader, userId)).toMatchObject({
        candidates: [{ item: { communityName: "Old guild", channels: ["Old channel"] } }],
      });
      database.transaction(() => refreshPartnerAlertDiscordNames(database,
        { communityId, sourceGuildId: "guild" },
        { guildName: "New guild", channels: [{ channelId: "channel", name: "New channel" }] })).immediate();
      expect(readPartnerAlertCatalogCandidates(reader, userId)).toMatchObject({
        candidates: [{ item: { offerKey: `${offerId}:1`, communityName: "New guild", channels: ["New channel"] } }],
      });
    } finally {
      reader.close();
    }
  } finally {
    database.close();
    rmSync(directory, { recursive: true });
  }
});
