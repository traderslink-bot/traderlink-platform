import type Database from "better-sqlite3";

import type { DiscordUserGuild } from "@/src/lib/academy/discord-oauth";
import { PlatformDiscordMembershipRepository } from "@/src/modules/platform/server/authentication/platform-discord-membership-repository";
import {
  assertCanonicalUtcTimestamp,
  assertCanonicalUuidV4,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

const DISCORD_SNOWFLAKE = /^\d{1,32}$/u;
const MANAGE_GUILD_PERMISSION = BigInt(32);

export type CommunityDiscordAccessObservation = Readonly<{
  observedAtUtc: string;
  guilds: readonly DiscordUserGuild[];
  memberships: readonly Readonly<{
    guildId: string;
    username: string;
    globalDisplayName: string | null;
    avatarHash: string | null;
    roleIds: readonly string[];
    guildOwner: boolean;
    joinedAtUtc: string | null;
  }>[];
}>;

export function readCommunityDiscordRefreshGuildIds(database: Database.Database): readonly string[] {
  const rows = database.prepare(`SELECT discord_guild_id FROM (
      SELECT invitation.discord_guild_id
      FROM traderlink_community_admission_invitations invitation
      WHERE coalesce((SELECT decision.status FROM traderlink_community_admission_decisions decision
        WHERE decision.discord_guild_id=invitation.discord_guild_id AND decision.kind='admission'
        ORDER BY decision.revision DESC LIMIT 1),'pending')!='declined'
      UNION
      SELECT community.discord_guild_id FROM traderlink_communities community
      LEFT JOIN traderlink_community_lifecycle lifecycle ON lifecycle.community_id=community.community_id
      WHERE community.status IN ('setup','active','paused') AND lifecycle.removed_at_utc IS NULL
    ) ORDER BY discord_guild_id LIMIT 101`).all() as { discord_guild_id: string }[];
  if (rows.length > 100) throw new Error("Community Discord refresh is too large.");
  return Object.freeze(rows.map(row => row.discord_guild_id));
}

function canManageGuild(guild: DiscordUserGuild): boolean {
  if (guild.owner === true) return true;
  if (typeof guild.permissions !== "string" || !/^\d+$/u.test(guild.permissions)) return false;
  try {
    return (BigInt(guild.permissions) & MANAGE_GUILD_PERMISSION) !== BigInt(0);
  } catch {
    return false;
  }
}

function usableGuilds(guilds: readonly DiscordUserGuild[]) {
  const byId = new Map<string, Readonly<{
    id: string;
    name: string;
    owner: boolean;
    canManage: boolean;
  }>>();
  for (const guild of guilds) {
    const name = guild.name?.normalize("NFKC").trim() ?? "";
    if (!DISCORD_SNOWFLAKE.test(guild.id) || name.length < 1 || name.length > 120 || /[\u0000-\u001f\u007f]/u.test(name)) continue;
    byId.set(guild.id, Object.freeze({
      id: guild.id,
      name,
      owner: guild.owner === true,
      canManage: canManageGuild(guild),
    }));
  }
  return [...byId.values()];
}

/**
 * Persists only evidence returned by the bounded live Discord bot observation.
 * This synchronous boundary can run inside the Core request-admission frame.
 */
export function syncCommunityDiscordAccessEvidence(database: Database.Database, input: Readonly<{
  userId: string;
  guilds: readonly DiscordUserGuild[];
  memberships?: CommunityDiscordAccessObservation["memberships"];
  verifiedAtUtc: string;
}>): Readonly<{ candidates: number; memberships: number }> {
  assertCanonicalUuidV4(input.userId, "userId");
  assertCanonicalUtcTimestamp(input.verifiedAtUtc, "verifiedAtUtc");
  const guilds = usableGuilds(input.guilds);
  const operation = () => {
    const discordMemberships = new PlatformDiscordMembershipRepository(database);
    for (const membership of input.memberships ?? []) discordMemberships.upsertCurrent({
      userId: input.userId,
      ...membership,
      verifiedAtUtc: input.verifiedAtUtc,
    });
    const ids = guilds.map(guild => guild.id);
    const saveCandidate = database.prepare(`INSERT INTO traderlink_community_discord_guild_candidates
      (user_id,discord_guild_id,guild_name,guild_owner,can_manage_guild,verified_at_utc)
      VALUES(?,?,?,?,?,?)
      ON CONFLICT(user_id,discord_guild_id) DO UPDATE SET
        guild_name=excluded.guild_name,guild_owner=excluded.guild_owner,
        can_manage_guild=excluded.can_manage_guild,verified_at_utc=excluded.verified_at_utc`);
    for (const guild of guilds) saveCandidate.run(
      input.userId,
      guild.id,
      guild.name,
      guild.owner ? 1 : 0,
      guild.canManage ? 1 : 0,
      input.verifiedAtUtc,
    );

    const communities = database.prepare(`SELECT community.community_id
      FROM traderlink_communities community
      JOIN platform_discord_memberships membership
        ON membership.user_id=? AND membership.guild_id=community.discord_guild_id
      WHERE community.status='active'
        AND membership.last_verified_at_utc=?
        AND community.discord_guild_id IN (SELECT value FROM json_each(?))
      ORDER BY community.community_id`)
      .all(input.userId, input.verifiedAtUtc, JSON.stringify(ids)) as { community_id: string }[];
    const repository = new TraderLinkCommunityRepository(database);
    for (const community of communities) repository.syncActiveMemberFromDiscord({
      communityId: community.community_id,
      userId: input.userId,
      timestamp: input.verifiedAtUtc,
    });
    return Object.freeze({ candidates: guilds.length, memberships: communities.length });
  };
  return database.inTransaction ? operation() : database.transaction(operation).immediate();
}

/** Discord I/O completes before the admitted persistence transaction begins. */
export async function observeCommunityDiscordAccess(input: Readonly<{
  authSubject: string;
  botToken: string;
  guildIds: readonly string[];
  request?: typeof fetch;
}>): Promise<CommunityDiscordAccessObservation> {
  if (!DISCORD_SNOWFLAKE.test(input.authSubject) || !input.botToken.trim()) return Object.freeze({ observedAtUtc: new Date().toISOString(), guilds: [], memberships: [] });
  const guildIds = [...new Set(input.guildIds.filter(id => DISCORD_SNOWFLAKE.test(id)))];
  if (guildIds.length > 100) throw new Error("Community Discord refresh is too large.");
  const request = input.request ?? fetch;
  const observe = async (guildId: string) => {
    const options = { headers: { Authorization: `Bot ${input.botToken}` }, cache: "no-store" as const };
    try {
      const [guildResponse, memberResponse] = await Promise.all([
        request(`https://discord.com/api/v10/guilds/${guildId}`, { ...options, signal: AbortSignal.timeout(8000) }),
        request(`https://discord.com/api/v10/guilds/${guildId}/members/${input.authSubject}`, { ...options, signal: AbortSignal.timeout(8000) }),
      ]);
      if (!guildResponse.ok || !memberResponse.ok) return null;
      const guild = await guildResponse.json() as { id?: unknown; name?: unknown; owner_id?: unknown };
      const member = await memberResponse.json() as {
        roles?: unknown; joined_at?: unknown;
        user?: { id?: unknown; username?: unknown; global_name?: unknown; avatar?: unknown };
      };
      if (guild.id !== guildId || typeof guild.name !== "string" || guild.name.length > 120
        || !DISCORD_SNOWFLAKE.test(String(guild.owner_id ?? ""))
        || member.user?.id !== input.authSubject || typeof member.user.username !== "string"
        || !Array.isArray(member.roles) || member.roles.length > 250
        || member.roles.some(role => typeof role !== "string" || !DISCORD_SNOWFLAKE.test(role))
        || (member.joined_at !== null && member.joined_at !== undefined && typeof member.joined_at !== "string")) return null;
      const owner = guild.owner_id === input.authSubject;
      return Object.freeze({
        guild: Object.freeze({ id: guildId, name: guild.name, owner, permissions: owner ? "32" : "0" }),
        membership: Object.freeze({
          guildId,
          username: member.user.username,
          globalDisplayName: typeof member.user.global_name === "string" ? member.user.global_name : null,
          avatarHash: typeof member.user.avatar === "string" ? member.user.avatar : null,
          roleIds: Object.freeze([...(member.roles as string[])]),
          guildOwner: owner,
          joinedAtUtc: typeof member.joined_at === "string" ? new Date(member.joined_at).toISOString() : null,
        }),
      });
    } catch {
      return null;
    }
  };
  const available: NonNullable<Awaited<ReturnType<typeof observe>>>[] = [];
  for (let index = 0; index < guildIds.length; index += 5) {
    const batch = await Promise.all(guildIds.slice(index, index + 5).map(observe));
    available.push(...batch.filter((item): item is NonNullable<typeof item> => item !== null));
  }
  return Object.freeze({
    observedAtUtc: new Date().toISOString(),
    guilds: Object.freeze(available.map(item => item.guild)),
    memberships: Object.freeze(available.map(item => item.membership)),
  });
}
