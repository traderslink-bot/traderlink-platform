// @vitest-environment node
import { randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { afterEach, describe, expect, it, vi } from "vitest";
import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { readCommunityViewerChannels } from "./community-channel-readership";
import { readCommunityInstallationStatus } from "./community-installation-status";
import { verifyCommunityOwner } from "./community-onboarding-service";
import { readCommunityDiscordResources } from "./community-discord-resources";
import { isCommunityOwnerReviewChannel } from "./community-owner-review-policy";
import { COMMUNITY_REVIEW_DISCORD_GUILD_ID as testsGuild } from "./community-review-discord-guild";

const main = "1433570740430573642", owner = "1433569535037931640", bot = "1554300060483715162";
const channel = "1546033958448529508", ordinary = "1433570740430573999";
const databases: Database.Database[] = [];
afterEach(() => { for (const database of databases.splice(0)) database.close(); });

function nativeMember() {
  const database = openPristinePlatformTestDatabase(); databases.push(database);
  const userId = randomUUID(), communityId = randomUUID(), at = "2026-11-19T17:00:00.000Z";
  const insert = (table: string, row: Record<string, string | number>) => database.prepare(`INSERT INTO ${table}(${Object.keys(row).join(",")}) VALUES(${Object.keys(row).map(() => "?").join(",")})`).run(...Object.values(row));
  insert("platform_users", { user_id: userId, auth_provider: "discord", auth_subject: owner, display_name: "Local owner", status: "active", created_at_utc: at, updated_at_utc: at });
  insert("platform_auth_identities", { user_id: userId, auth_provider: "discord", auth_subject: owner, status: "active", linked_by_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("platform_discord_memberships", { user_id: userId, guild_id: main, username: "local-owner", role_ids_json: "[]", guild_owner: 1, first_verified_at_utc: at, last_verified_at_utc: at });
  insert("traderlink_communities", { community_id: communityId, discord_guild_id: main, slug: "local-main", display_name: "Local Main", status: "active", owner_user_id: userId, created_at_utc: at, updated_at_utc: at });
  insert("traderlink_community_memberships", { community_id: communityId, user_id: userId, status: "active", discord_verified_at_utc: at, first_verified_at_utc: at, updated_at_utc: at });
  return { database, userId, communityId };
}
function provider(actualOwner = owner) {
  return vi.fn(async (resource: Parameters<typeof fetch>[0]) => {
    const pathname = new URL(String(resource)).pathname;
    if (pathname === `/api/v10/guilds/${main}`) return Response.json({ id: main, owner_id: actualOwner, name: "Local Main fixture" });
    if (pathname === `/api/v10/guilds/${main}/members/${owner}`) return Response.json({ user: { id: owner, username: "local-owner" }, roles: [] });
    if (pathname === "/api/v10/users/@me") return Response.json({ id: bot, bot: true });
    if (pathname === `/api/v10/guilds/${main}/roles`) return Response.json([{ id: main, name: "@everyone", permissions: "8" }]);
    if (pathname === `/api/v10/guilds/${main}/members/${bot}`) return Response.json({ user: { id: bot }, roles: [] });
    if (pathname === `/api/v10/guilds/${main}/channels`) return Response.json([channel, ordinary].map(id => ({ id, guild_id: main, name: id, type: 0, permission_overwrites: [] })));
    throw new Error(`Unexpected provider path: ${pathname}`);
  });
}

function installationProvider({ actualOwner = owner, guildId = main, installed = true }: {
  actualOwner?: string;
  guildId?: string;
  installed?: boolean;
} = {}) {
  return vi.fn(async (resource: Parameters<typeof fetch>[0]) => {
    const pathname = new URL(String(resource)).pathname;
    if (pathname === "/api/v10/users/@me/guilds") return Response.json(installed ? [{ id: guildId }] : []);
    if (pathname === `/api/v10/guilds/${guildId}`) return Response.json({ id: guildId, owner_id: actualOwner, name: "Installation fixture" });
    if (pathname === `/api/v10/guilds/${guildId}/members/${owner}`) return Response.json({ user: { id: owner, username: "local-owner" }, roles: [] });
    throw new Error(`Unexpected provider path: ${pathname}`);
  });
}

describe("Normal Community owner-review metadata opt-in", () => {
  it("preserves default Main denial and still requires the actual Discord guild owner", async () => {
    const request = provider();
    await expect(verifyCommunityOwner(main, owner, "isolated-test-token", request as typeof fetch)).rejects.toBeDefined();
    expect(request).not.toHaveBeenCalled();
    await expect(verifyCommunityOwner(main, owner, "isolated-test-token", request as typeof fetch, "community-owner-review")).resolves.toMatchObject({ guildId: main, discordUserId: owner });
    await expect(verifyCommunityOwner(main, owner, "isolated-test-token", provider("100000000000000001") as typeof fetch, "community-owner-review")).rejects.toThrow("Only the Discord server owner");
  });

  it("exposes approved Main channel discovery only, even when the bot has Administrator", async () => {
    const request = provider();
    await expect(readCommunityDiscordResources(main, "isolated-test-token", request as typeof fetch)).rejects.toBeDefined();
    expect(request).not.toHaveBeenCalled();
    const result = await readCommunityDiscordResources(main, "isolated-test-token", request as typeof fetch, "community-owner-review");
    expect(result.channels.map(row => row.id)).toEqual([channel]);
    expect(result.roles).toEqual([{ id: main, name: "@everyone" }]);
    expect(isCommunityOwnerReviewChannel(main, ordinary)).toBe(false);
  });

  it("keeps default Main readership denied and restricts an actual native owner's opted-in read", async () => {
    const f = nativeMember(), request = provider();
    expect(await readCommunityViewerChannels(f.database, "local-main", f.userId, "isolated-test-token", request as typeof fetch)).toEqual([]);
    expect(request).not.toHaveBeenCalled();
    expect(await readCommunityViewerChannels(f.database, "local-main", f.userId, "isolated-test-token", request as typeof fetch, [0, 5], "community-owner-review")).toEqual([channel]);
  });

  it.each(["membership suspended", "identity relinked"])("rejects the opted-in read when %s during provider I/O", async change => {
    const f = nativeMember(), response = provider();
    let changed = false;
    const request: typeof fetch = async resource => {
      if (!changed) {
        changed = true;
        if (change === "membership suspended") f.database.prepare("UPDATE traderlink_community_memberships SET status='suspended' WHERE community_id=? AND user_id=?").run(f.communityId, f.userId);
        else f.database.prepare("UPDATE platform_auth_identities SET auth_subject='100000000000000001' WHERE user_id=? AND auth_provider='discord'").run(f.userId);
      }
      return response(resource);
    };
    expect(await readCommunityViewerChannels(f.database, "local-main", f.userId, "isolated-test-token", request, [0, 5], "community-owner-review")).toEqual([]);
  });

  it("keeps Main installation verification denied for generic callers", async () => {
    expect(await readCommunityInstallationStatus(main, owner, "isolated-test-token", installationProvider() as typeof fetch)).toMatchObject({ state: "unavailable" });
  });

  it("allows the fixed owner-review installation path for Main", async () => {
    expect(await readCommunityInstallationStatus(main, owner, "isolated-test-token", installationProvider() as typeof fetch, "community-owner-review")).toMatchObject({ state: "ready" });
  });

  it("still rejects a Main installation when the linked member is not the current guild owner", async () => {
    const request = installationProvider({ actualOwner: "100000000000000001" });
    expect(await readCommunityInstallationStatus(main, owner, "isolated-test-token", request as typeof fetch, "community-owner-review")).toMatchObject({ state: "owner_required" });
  });

  it("preserves default installation verification for the Tests guild", async () => {
    const request = installationProvider({ guildId: testsGuild });
    expect(await readCommunityInstallationStatus(testsGuild, owner, "isolated-test-token", request as typeof fetch)).toMatchObject({ state: "ready" });
  });

  it("reports a complete inventory without the target as not installed", async () => {
    const request = installationProvider({ installed: false });
    expect(await readCommunityInstallationStatus(main, owner, "isolated-test-token", request as typeof fetch, "community-owner-review")).toMatchObject({ state: "not_installed" });
  });
});
