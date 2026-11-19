// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { SharedAlertsRepository } from "./shared-alerts-repository";
import { SharedAlertsSourcePublication } from "./shared-alerts-source-publication";
import { SharedAlertsSourcePolicy } from "./shared-alerts-source-policy";
import { sharedAlertsSourceOriginalDelivery } from "./shared-alerts-source-original-delivery";
import type { SharedSourceDispatchContext } from "./shared-alerts-source-dispatch";

const at = "2026-11-19T17:00:00.000Z", guild = "1559172784813514803", channel = "1559172786176401410";
const ownerDiscord = "1433569535037931640", bot = "1554300060483715162";
const databases: Database.Database[] = [];
afterEach(() => { vi.unstubAllEnvs(); for (const database of databases.splice(0)) database.close(); });

function fixture(providerStatus = 200) {
  vi.stubEnv("TRADERLINK_SHARED_ALERTS_DELIVERY_ENABLED", "1");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", "");
  const database = openPristinePlatformTestDatabase(); databases.push(database);
  const userId = randomUUID(), communityId = randomUUID(), audienceId = randomUUID(), destinationId = randomUUID();
  const insert = (table: string, row: Record<string, string | number>) => database.prepare(`INSERT INTO ${table}(${Object.keys(row).join(",")}) VALUES(${Object.keys(row).map(() => "?").join(",")})`).run(...Object.values(row));
  insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: ownerDiscord, display_name: "Local owner", status: "active", created_at_utc: at, updated_at_utc: at });
  insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: ownerDiscord, status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("platform_discord_memberships", { user_id: userId, guild_id: guild, username: "local-owner", role_ids_json: "[]", guild_owner: 1, first_verified_at_utc: at, last_verified_at_utc: at });
  insert("traderlink_communities", { community_id: communityId, discord_guild_id: guild, slug: "local-source", display_name: "Local source", status: "active", owner_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
  const repository = new SharedAlertsRepository(database, () => at);
  repository.recordOwnerCheck(repository.ownerContext(communityId), "verified");
  repository.setPublisher({ communityId, userId }, userId, true);
  insert("traderlink_community_audiences", { audience_id: audienceId, community_id: communityId, name: "Everyone", mode: "everyone", status: "active", created_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_discord_destinations", { destination_id: destinationId, community_id: communityId, name: "Local source", discord_channel_id: channel, content_type: "alerts", status: "active", updated_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  const create = (title: string) => new SharedAlertsSourcePublication(database).save({ communityId, actorUserId: userId, audienceId, title, body: "Local complete alert", status: "published", publishingMode: "discord_post", selection: { distribution: "discord", destinationIds: [destinationId] }, atUtc: at });
  const alert = create("Selected local alert"), other = create("Excluded local alert");
  const delivery = (id: string) => (database.prepare("SELECT delivery_id FROM traderlink_community_content_deliveries WHERE object_id=?").get(id) as { delivery_id: string }).delivery_id;
  const selected = delivery(alert.alertId), excluded = delivery(other.alertId);
  database.prepare("UPDATE traderlink_community_content_deliveries SET status='sending',updated_at_utc='2026-11-19T16:00:00.000Z' WHERE delivery_id=?").run(excluded);
  let synchronousFrames = 0, sends = 0;
  const request = vi.fn(async (resource: Parameters<typeof fetch>[0], options?: RequestInit) => {
    expect(database.inTransaction).toBe(false);
    const pathname = new URL(String(resource)).pathname;
    if (options?.method === "POST") { sends++; return providerStatus === 200 ? Response.json({ id: "1559172786176401999", channel_id: channel }) : new Response("provider unavailable", { status: providerStatus }); }
    if (pathname === `/api/v10/guilds/${guild}`) return Response.json({ id: guild, owner_id: ownerDiscord });
    if (pathname === "/api/v10/users/@me") return Response.json({ id: bot });
    if (pathname.endsWith("/channels")) return Response.json([{ id: channel, guild_id: guild, name: "general", type: 0, permission_overwrites: [] }]);
    if (pathname.endsWith("/roles")) return Response.json([{ id: guild, permissions: "68608" }]);
    if (pathname.endsWith(`/members/${bot}`)) return Response.json({ roles: [] });
    throw new Error(`Unexpected provider path: ${pathname}`);
  });
  // Tests the SQL-hook/await mechanism with real domain authorization. This
  // local transaction hook is NOT a Core admission or production effect ticket.
  const withCurrentWriter = <T>(operation: () => T): T => database.transaction(() => { synchronousFrames++; return operation(); }).immediate();
  const context: SharedSourceDispatchContext = { database, policy: new SharedAlertsSourcePolicy(database), request: request as typeof fetch, now: () => at, botToken: "isolated-test-token", limit: 1, notBeforeUtc: undefined, trackedPageUrl: () => "https://app.traderslink.pro/communities/local-source/alerts/local",
    selectedOriginal: { deliveryId: selected, withCurrentWriter, assertCurrent: () => { expect(database.inTransaction).toBe(true); }, commitObservation: (_ids, operation) => withCurrentWriter(operation) } };
  return { database, selected, excluded, context, request, synchronousFrames: () => synchronousFrames, sends: () => sends };
}

describe("Selected original sender atomic SQL hooks (not hosted/native admission proof)", () => {
  it("keeps provider awaits outside transactions and leaves excluded interrupted rows unchanged", async () => {
    const f = fixture(), before = f.database.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.excluded);
    expect(await sharedAlertsSourceOriginalDelivery.run(f.context)).toEqual({ delivered: 1, failed: 0 });
    expect(f.sends()).toBe(1);
    expect(f.synchronousFrames()).toBeGreaterThan(4);
    expect(f.database.prepare("SELECT * FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.excluded)).toEqual(before);
    expect(f.database.prepare("SELECT status,delivery_outcome FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.selected)).toEqual({ status: "delivered", delivery_outcome: "confirmed" });
  });

  it("stores an unknown provider outcome through a fresh hook and never replays it", async () => {
    const f = fixture(503);
    expect(await sharedAlertsSourceOriginalDelivery.run(f.context)).toEqual({ delivered: 0, failed: 1 });
    expect(f.database.prepare("SELECT status,delivery_outcome FROM traderlink_community_content_deliveries WHERE delivery_id=?").get(f.selected)).toEqual({ status: "failed", delivery_outcome: "uncertain" });
    expect(await sharedAlertsSourceOriginalDelivery.run(f.context)).toEqual({ delivered: 0, failed: 0 });
    expect(f.sends()).toBe(1);
  });
});
