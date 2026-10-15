import type Database from "better-sqlite3";
import { PlatformDiscordMembershipRepository } from "../../platform/server/authentication/platform-discord-membership-repository";
import { createCanonicalUtcTimestamp, createCanonicalUuidV4 } from "../../platform/server/database/platform-migration-contract";
import { isApprovedCommunityGuild, isFreshCommunityEvidence } from "./community-launch-policy";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";

const snowflake = /^\d{1,32}$/u;

/** Fresh bot responses prove installation and ownership; OAuth candidates are only discovery. */
export async function verifyCommunityOwner(guildId: string, discordUserId: string, botToken: string, request: typeof fetch = fetch) {
  if (!snowflake.test(guildId) || !snowflake.test(discordUserId) || !botToken.trim()) throw new Error("Discord connection unavailable.");
  const options = { headers: { Authorization: `Bot ${botToken}` }, cache: "no-store" as const };
  const [guildResponse, memberResponse] = await Promise.all([
    request(`https://discord.com/api/v10/guilds/${guildId}`, { ...options, signal: AbortSignal.timeout(8000) }),
    request(`https://discord.com/api/v10/guilds/${guildId}/members/${discordUserId}`, { ...options, signal: AbortSignal.timeout(8000) }),
  ]);
  if (!guildResponse.ok || !memberResponse.ok) throw new Error("Discord server verification unavailable.");
  const guild = await guildResponse.json() as { id?: string; owner_id?: string; name?: string };
  const member = await memberResponse.json() as { user?: { id?: string; username?: string; global_name?: string | null; avatar?: string | null }; roles?: unknown; joined_at?: string | null };
  if (guild.id !== guildId || guild.owner_id !== discordUserId || member.user?.id !== discordUserId) throw new Error("Only the Discord server owner can connect this server.");
  if (typeof guild.name !== "string" || !guild.name.trim() || guild.name.trim().length > 120 || /[\u0000-\u001f\u007f]/u.test(guild.name)) throw new Error("Discord server verification unavailable.");
  if (!member.user.username || !Array.isArray(member.roles) || member.roles.length > 250 || member.roles.some(role => typeof role !== "string" || !snowflake.test(role))) throw new Error("Discord server verification unavailable.");
  return {
    guildId, guildName: guild.name.trim(), discordUserId, username: member.user.username,
    globalDisplayName: member.user.global_name ?? null, avatarHash: member.user.avatar ?? null,
    roleIds: member.roles as string[], joinedAtUtc: member.joined_at ? new Date(member.joined_at).toISOString() : null,
    verifiedAtUtc: createCanonicalUtcTimestamp(),
  };
}

export function onboardApprovedCommunity(db: Database.Database, input: {
  userId: string; slug?: string; displayName?: string;
  evidence: Awaited<ReturnType<typeof verifyCommunityOwner>>; atUtc: string;
}) {
  const { evidence } = input;
  if (!isApprovedCommunityGuild(evidence.guildId)) throw new Error("This server has not been approved for onboarding.");
  if (!isFreshCommunityEvidence(evidence.verifiedAtUtc, input.atUtc)) throw new Error("Refresh Discord verification and try again.");
  return db.transaction(() => {
    const identity = db.prepare(`SELECT 1 FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND auth_subject=? AND status='active'`).get(input.userId, evidence.discordUserId);
    if (!identity) throw new Error("Discord account connection required.");
    const existing = db.prepare(`SELECT slug,owner_user_id FROM traderlink_communities WHERE discord_guild_id=?`).get(evidence.guildId) as { slug: string; owner_user_id: string } | undefined;
    if (existing && existing.owner_user_id !== input.userId) throw new Error("Server ownership transfer requires verification.");
    new PlatformDiscordMembershipRepository(db).upsertCurrent({
      userId: input.userId, guildId: evidence.guildId, username: evidence.username,
      globalDisplayName: evidence.globalDisplayName, avatarHash: evidence.avatarHash,
      roleIds: evidence.roleIds, guildOwner: true, joinedAtUtc: evidence.joinedAtUtc, verifiedAtUtc: evidence.verifiedAtUtc,
    });
    if (existing) return { slug: existing.slug };
    const displayName = input.displayName ?? evidence.guildName;
    let slug = input.slug;
    if (!slug) {
      const nameSlug = evidence.guildName.normalize("NFKD").replace(/[\u0300-\u036f]/gu, "").toLowerCase()
        .replace(/[^a-z0-9]+/gu, "-").replace(/^-+|-+$/gu, "").slice(0, 48).replace(/-+$/gu, "");
      const base = nameSlug ? (nameSlug.length >= 3 && /^[a-z]/u.test(nameSlug) ? nameSlug : `community-${nameSlug}`) : "community";
      slug = base;
      let suffix = 2;
      while (db.prepare("SELECT 1 FROM traderlink_communities WHERE slug=?").get(slug)) slug = `${base}-${suffix++}`;
    }
    const permissions = new TraderLinkCommunityRepository(db);
    const created = permissions.createFromVerifiedDiscordOwner({ ownerUserId: input.userId, discordGuildId: evidence.guildId, slug, displayName, timestamp: input.atUtc });
    db.prepare(`INSERT INTO traderlink_community_audiences(audience_id,community_id,name,mode,status,created_by_user_id,created_at_utc,updated_at_utc) VALUES(?,?,'Everyone','everyone','active',?,?,?)`).run(createCanonicalUuidV4(), created.communityId, input.userId, input.atUtc, input.atUtc);
    db.prepare(`INSERT INTO traderlink_community_settings(community_id,description,named_activity_retention_days,visibility_status,visibility_copy,updated_at_utc) VALUES(?,'',90,'not_configured','',?)`).run(created.communityId, input.atUtc);
    db.prepare(`INSERT INTO traderlink_community_partner_programs(community_id,status,commission_basis_points,attribution_days,currency,updated_by_user_id,updated_at_utc) VALUES(?,'disabled',NULL,90,'USD',?,?)`).run(created.communityId, input.userId, input.atUtc);
    // Never create global operator grants, test mappings, or test channels here.
    permissions.setStatus({ communityId: created.communityId, actorUserId: input.userId, status: "active", timestamp: input.atUtc });
    return { slug: created.slug };
  }).immediate();
}
