// @vitest-environment node
import { randomUUID } from "node:crypto";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import { openPristinePlatformTestDatabase } from "@/src/test/pristine-platform-test-database";
import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
import { PlatformLoginService } from "@/src/modules/platform/server/authentication/platform-login-service";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";
import { observeCommunityDiscordAccess, readCommunityDiscordRefreshGuildIds, syncCommunityDiscordAccessEvidence } from "./community-discord-access-sync";

const roots: string[] = [];
const AT = "2026-11-19T15:00:00.000Z";
const GUILD = "1559172784813514803";

afterEach(async () => {
  for (const root of roots.splice(0)) await removePlatformDatabaseTestFixture(root);
});

describe("Community Discord access evidence sync", () => {
  it("persists owned-guild candidates and admits a real verified member to an active community", () => {
    const root = mkdtempSync(join(tmpdir(), "community-discord-oauth-sync-"));
    roots.push(root);
    const database = openPristinePlatformTestDatabase({
      mode: "initializer",
      databasePath: join(root, `${randomUUID()}.sqlite`),
      forbiddenRepositoryRoots: [],
    });
    try {
      const owner = new PlatformLoginService(database).signInOAuth({
        provider: "discord", subject: "100000000000000001", displayName: "Owner",
      });
      const member = new PlatformLoginService(database).signInOAuth({
        provider: "discord", subject: "100000000000000002", displayName: "Member",
      });
      const ownerUserId = owner.session.userId;
      const memberUserId = member.session.userId;
      const discord = new PlatformDiscordMembershipRepository(database);
      discord.upsertCurrent({ userId: ownerUserId, guildId: GUILD, username: "owner", globalDisplayName: "Owner", avatarHash: null, roleIds: [], guildOwner: true, joinedAtUtc: null, verifiedAtUtc: AT });
      const permissions = new TraderLinkCommunityRepository(database);
      const community = permissions.createFromVerifiedDiscordOwner({ ownerUserId, discordGuildId: GUILD, slug: "tests-community", displayName: "Tests Community", timestamp: AT });
      permissions.setStatus({ communityId: community.communityId, actorUserId: ownerUserId, status: "active", timestamp: AT });
      expect(readCommunityDiscordRefreshGuildIds(database)).toEqual([GUILD]);
      expect(syncCommunityDiscordAccessEvidence(database, {
        userId: memberUserId,
        guilds: [{ id: GUILD, name: "Tests Community", owner: false, permissions: "32" }],
        memberships: [{ guildId: GUILD, username: "member", globalDisplayName: "Member", avatarHash: null, roleIds: ["200000000000000001"], guildOwner: false, joinedAtUtc: null }],
        verifiedAtUtc: AT,
      })).toEqual({ candidates: 1, memberships: 1 });
      expect(permissions.findMembership(community.communityId, memberUserId)?.status).toBe("active");
      expect(database.prepare("SELECT guild_owner,can_manage_guild FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND discord_guild_id=?").get(memberUserId, GUILD)).toEqual({ guild_owner: 0, can_manage_guild: 1 });
      expect(syncCommunityDiscordAccessEvidence(database, {
        userId: memberUserId,
        guilds: [],
        memberships: [],
        verifiedAtUtc: AT,
      })).toEqual({ candidates: 0, memberships: 0 });
      expect(database.prepare("SELECT guild_owner,can_manage_guild FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND discord_guild_id=?").get(memberUserId, GUILD)).toEqual({ guild_owner: 0, can_manage_guild: 1 });

      expect(syncCommunityDiscordAccessEvidence(database, {
        userId: ownerUserId,
        guilds: [{ id: GUILD, name: "Tests Community", owner: true, permissions: "0" }],
        verifiedAtUtc: AT,
      })).toEqual({ candidates: 1, memberships: 1 });
      expect(database.prepare("SELECT guild_owner,can_manage_guild FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND discord_guild_id=?").get(ownerUserId, GUILD)).toEqual({ guild_owner: 1, can_manage_guild: 1 });
    } finally {
      database.close();
    }
  });

  it("accepts only matching live bot guild and member evidence", async () => {
    const request = async (input: string | URL | Request) => {
      const url = String(input);
      if (url.endsWith(`/guilds/${GUILD}`)) return Response.json({ id: GUILD, name: "Tests Community", owner_id: "100000000000000002" });
      if (url.endsWith(`/guilds/${GUILD}/members/100000000000000002`)) return Response.json({ roles: ["200000000000000001"], joined_at: "2026-11-01T10:00:00.000Z", user: { id: "100000000000000002", username: "member", global_name: "Member", avatar: null } });
      throw new Error("Unexpected request");
    };
    const observed = await observeCommunityDiscordAccess({ authSubject: "100000000000000002", botToken: "test-token", guildIds: [GUILD], request: request as typeof fetch });
    expect(observed).toEqual({
      observedAtUtc: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      guilds: [{ id: GUILD, name: "Tests Community", owner: true, permissions: "32" }],
      memberships: [{ guildId: GUILD, username: "member", globalDisplayName: "Member", avatarHash: null, roleIds: ["200000000000000001"], guildOwner: true, joinedAtUtc: "2026-11-01T10:00:00.000Z" }],
    });
  });
});
