// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { verifyCommunityRequestMember } from "./community-request-verification";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";

const at = "2026-11-19T17:00:00.000Z", main = "1433570740430573642", designated = "1546033958448529508";
const databases: Database.Database[] = [];
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

function fixture(guildId = main) {
  const database = openPristinePlatformTestDatabase(); databases.push(database);
  const userId = randomUUID(), communityId = randomUUID();
  const insert = (table: string, values: Record<string, string | number>) => {
    const keys = Object.keys(values);
    database.prepare(`INSERT INTO ${table}(${keys.join(",")}) VALUES(${keys.map(() => "?").join(",")})`).run(...Object.values(values));
  };
  insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: "100000000000000001", display_name: "Local owner", status: "active", created_at_utc: at, updated_at_utc: at });
  insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: "100000000000000001", status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("platform_discord_memberships", { user_id: userId, guild_id: guildId, username: "local-owner", role_ids_json: "[]", guild_owner: 1, first_verified_at_utc: at, last_verified_at_utc: at });
  insert("traderlink_communities", { community_id: communityId, discord_guild_id: guildId, slug: "local-review", display_name: "Local review", status: "active", owner_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
  const repository = new SharedAlertsRepository(database, () => at);
  repository.recordOwnerCheck(repository.ownerContext(communityId), "verified");
  repository.setPublisher({ communityId, userId }, userId, true);
  return { database, userId, communityId, insert };
}

describe("Explicit server review intent with real native memberships", () => {
  it("keeps normal Main verification denied and permits only the explicit Shared/Stats metadata intents", async () => {
    const f = fixture(), request = vi.fn(() => { throw new Error("Fresh native membership must not fetch Discord"); });
    const input = { slug: "local-review", userId: f.userId, botToken: "", atUtc: at };
    expect(await verifyCommunityRequestMember(f.database, input, request as typeof fetch)).toBe(false);
    for (const reviewIntent of ["shared-alerts", "stats", "community-owner-review"] as const)
      expect(await verifyCommunityRequestMember(f.database, { ...input, reviewIntent }, request as typeof fetch)).toBe(true);
    expect(request).not.toHaveBeenCalled();
  });

  it("never turns the intent into a suspension bypass or an arbitrary guild allowance", async () => {
    const f = fixture();
    f.database.prepare("UPDATE traderlink_community_memberships SET status='suspended' WHERE community_id=? AND user_id=?").run(f.communityId, f.userId);
    expect(await verifyCommunityRequestMember(f.database, { slug: "local-review", userId: f.userId, botToken: "", atUtc: at, reviewIntent: "shared-alerts" })).toBe(false);
    const other = fixture("100000000000000099");
    expect(await verifyCommunityRequestMember(other.database, { slug: "local-review", userId: other.userId, botToken: "", atUtc: at, reviewIntent: "stats" })).toBe(false);
  });

  it("excludes an ordinary Main destination even for the actual native owner", () => {
    const f = fixture(), allowedId = randomUUID(), ordinaryId = randomUUID();
    for (const [destinationId, channelId] of [[allowedId, designated], [ordinaryId, "1433570740430573999"]])
      f.insert("traderlink_community_discord_destinations", { destination_id: destinationId, community_id: f.communityId, name: channelId, discord_channel_id: channelId, content_type: "alerts", status: "active", updated_by_user_id: f.userId, created_at_utc: at, updated_at_utc: at });
    const policy = new SharedAlertsSourcePolicy(f.database);
    expect(policy.destinations(f.communityId, f.userId, at).map(row => row.destinationId)).toEqual([allowedId]);
    expect(() => policy.saveIntent({ communityId: f.communityId, publisherUserId: f.userId, alertId: randomUUID(), selection: { distribution: "discord", destinationIds: [ordinaryId] }, publishingMode: "discord_post", publish: true, atUtc: at })).toThrow(expect.objectContaining({ code: "changed" }));
    expect(f.database.prepare("SELECT count(*) total FROM traderlink_community_publication_distribution").get()).toEqual({ total: 0 });
  });
});
