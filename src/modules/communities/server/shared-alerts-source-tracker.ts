import { isCommunityReviewDiscordGuild } from "./community-review-discord-guild";
import type Database from "better-sqlite3";
import { assertCanonicalUuidV4, createCanonicalUtcTimestamp } from "../../platform/server/database/platform-migration-contract";
import { verifyCommunityRequestMember } from "./community-request-verification";
import { SharedAlertError } from "./shared-alerts-errors";
import { TraderLinkCommunityRepository } from "./traderlink-community-repository";
import type { SharedSourceDispatchBindings } from "./shared-alerts-source-dispatch";

type Role = Readonly<{ id: string; permissions: string }>;
type Overwrite = Readonly<{ id: string; type: number; allow: string; deny: string }>;
type Channel = Readonly<{ id: string; guild_id?: string; type: number; permission_overwrites: readonly Overwrite[] }>;
const snowflake = /^\d{1,32}$/u;

/** Private source-page read. userId MUST come from the current authenticated request, never query/form data. */
export async function readSharedAlertsSourceTracker(database: Database.Database, input: Readonly<{
  communitySlug: string; alertId: string; userId: string; botToken: string;
}>, request: typeof fetch = fetch) {
  assertCanonicalUuidV4(input.userId, "userId"); assertCanonicalUuidV4(input.alertId, "alertId");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(input.communitySlug) || input.communitySlug.length > 100 || !input.botToken.trim()) throw new SharedAlertError("unavailable");
  const reviewCommunity = database.prepare("SELECT discord_guild_id FROM traderlink_communities WHERE slug=? AND status='active'").get(input.communitySlug) as { discord_guild_id: string } | undefined;
  if (!reviewCommunity || !isCommunityReviewDiscordGuild(reviewCommunity.discord_guild_id)) throw new SharedAlertError("unavailable");
  if (!await verifyCommunityRequestMember(database, { slug: input.communitySlug, userId: input.userId, botToken: input.botToken, atUtc: createCanonicalUtcTimestamp() }, request)) throw new SharedAlertError("unavailable");
  const target = database.prepare(`SELECT c.community_id,c.discord_guild_id,i.auth_subject FROM traderlink_communities c
    JOIN platform_auth_identities i ON i.user_id=? AND i.auth_provider='discord' AND i.status='active'
    WHERE c.slug=? AND c.status='active'`).get(input.userId, input.communitySlug) as { community_id: string; discord_guild_id: string; auth_subject: string } | undefined;
  if (!target || !snowflake.test(target.discord_guild_id) || !snowflake.test(target.auth_subject)) throw new SharedAlertError("unavailable");
  const get = async (path: string): Promise<unknown> => {
    const response = await request(`https://discord.com/api/v10${path}`, { headers: { Authorization: `Bot ${input.botToken}` }, cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new SharedAlertError("discord_unavailable");
    return response.json();
  };
  const [guild, member, roles, channels] = await Promise.all([
    get(`/guilds/${target.discord_guild_id}`), get(`/guilds/${target.discord_guild_id}/members/${target.auth_subject}`),
    get(`/guilds/${target.discord_guild_id}/roles`), get(`/guilds/${target.discord_guild_id}/channels`),
  ]) as [{ id: string; owner_id: string }, { user: { id: string }; roles: unknown }, readonly Role[], readonly Channel[]];
  if (guild.id !== target.discord_guild_id || !snowflake.test(guild.owner_id) || member.user?.id !== target.auth_subject || !Array.isArray(member.roles) || member.roles.length > 250 || member.roles.some(role => typeof role !== "string" || !snowflake.test(role)) || !Array.isArray(roles) || roles.length > 250 || roles.some(role => !snowflake.test(role.id) || !/^\d{1,32}$/u.test(role.permissions)) || !Array.isArray(channels)) throw new SharedAlertError("discord_unavailable");
  const everyone = roles.find(role => role.id === target.discord_guild_id);
  if (!everyone) throw new SharedAlertError("discord_unavailable");
  const memberRoles = new Set<string>(member.roles);
  let base = BigInt(everyone.permissions);
  for (const role of roles) if (memberRoles.has(role.id)) base |= BigInt(role.permissions);
  const administrator = guild.owner_id === target.auth_subject || Boolean(base & BigInt(8));
  const readable = new Set<string>();
  for (const channel of channels) {
    if (!snowflake.test(channel.id) || (channel.guild_id && channel.guild_id !== target.discord_guild_id) || ![0, 5].includes(channel.type) || !Array.isArray(channel.permission_overwrites) || channel.permission_overwrites.some((item: Overwrite) => !snowflake.test(item.id) || ![0, 1].includes(item.type) || !/^\d{1,32}$/u.test(item.allow) || !/^\d{1,32}$/u.test(item.deny))) continue;
    let permissions = base;
    const everyoneOverwrite = channel.permission_overwrites.find((item: Overwrite) => item.type === 0 && item.id === target.discord_guild_id);
    if (everyoneOverwrite) permissions = (permissions & ~BigInt(everyoneOverwrite.deny)) | BigInt(everyoneOverwrite.allow);
    let deny = BigInt(0), allow = BigInt(0);
    for (const item of channel.permission_overwrites) if (item.type === 0 && item.id !== target.discord_guild_id && memberRoles.has(item.id)) { deny |= BigInt(item.deny); allow |= BigInt(item.allow); }
    permissions = (permissions & ~deny) | allow;
    const own = channel.permission_overwrites.find((item: Overwrite) => item.type === 1 && item.id === target.auth_subject);
    if (own) permissions = (permissions & ~BigInt(own.deny)) | BigInt(own.allow);
    if (administrator || Boolean(permissions & BigInt(1024))) readable.add(channel.id);
  }
  // Recheck actual owner/lifecycle and local active-user/membership after provider awaits.
  return database.transaction(() => {
    const current = database.prepare("SELECT owner_user_id,status FROM traderlink_communities WHERE community_id=?").get(target.community_id) as { owner_user_id: string; status: string } | undefined;
    const owner = current ? database.prepare("SELECT i.auth_subject FROM platform_auth_identities i JOIN platform_users u ON u.user_id=i.user_id AND u.status='active' WHERE i.user_id=? AND i.auth_provider='discord' AND i.status='active'").get(current.owner_user_id) as { auth_subject: string } | undefined : undefined;
    const identity = database.prepare("SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'").get(input.userId) as { auth_subject: string } | undefined;
    const access = new TraderLinkCommunityRepository(database).resolveAccess(target.community_id, input.userId);
    if (!current || current.status !== "active" || owner?.auth_subject !== guild.owner_id || identity?.auth_subject !== target.auth_subject || access.membershipStatus !== "active" || !access.capabilities.includes("community.view") || !access.capabilities.includes("community.alerts.view")) throw new SharedAlertError("unavailable");
    const alert = database.prepare(`SELECT a.alert_id alertId,a.title,a.symbol,a.body,a.status,a.published_at_utc publishedAtUtc,a.updated_at_utc updatedAtUtc,a.author_user_id authorUserId,
      audience.audience_id,audience.mode FROM traderlink_community_alerts a JOIN traderlink_community_audiences audience ON audience.audience_id=a.audience_id AND audience.community_id=a.community_id AND audience.status='active'
      WHERE a.community_id=? AND a.alert_id=? AND a.status IN ('published','archived') AND a.published_at_utc IS NOT NULL`).get(target.community_id, input.alertId) as { alertId: string; title: string; symbol: string | null; body: string; status: "published" | "archived"; publishedAtUtc: string; updatedAtUtc: string; authorUserId: string; audience_id: string; mode: string } | undefined;
    if (!alert) throw new SharedAlertError("not_found");
    const audienceAllowed = alert.mode === "everyone" || (alert.mode === "discord_roles" && (database.prepare("SELECT discord_role_id FROM traderlink_community_audience_discord_roles WHERE community_id=? AND audience_id=?").all(target.community_id, alert.audience_id) as { discord_role_id: string }[]).some(role => role.discord_role_id === target.discord_guild_id || memberRoles.has(role.discord_role_id)));
    if (!audienceAllowed) throw new SharedAlertError("not_found");
    const distribution = database.prepare("SELECT destination_ids_json FROM traderlink_community_publication_distribution WHERE community_id=? AND object_type='alert' AND object_id=?").get(target.community_id, input.alertId) as { destination_ids_json: string } | undefined;
    const ids: unknown = distribution ? JSON.parse(distribution.destination_ids_json) : [];
    if (!Array.isArray(ids) || !ids.length || ids.length > 50 || ids.some(id => typeof id !== "string")) throw new SharedAlertError("not_found");
    const associated = database.prepare(`SELECT destination_id,discord_channel_id FROM traderlink_community_discord_destinations WHERE community_id=? AND content_type='alerts'`)
      .all(target.community_id) as { destination_id: string; discord_channel_id: string }[];
    if (!associated.some(destination => ids.includes(destination.destination_id) && readable.has(destination.discord_channel_id))) throw new SharedAlertError("not_found");
    // No Journal, source grant list, conversation, partner routes or coaching records returned.
    return Object.freeze({ alertId: alert.alertId, communitySlug: input.communitySlug, title: alert.title, symbol: alert.symbol, body: alert.body, status: alert.status, authorUserId: alert.authorUserId, publishedAtUtc: alert.publishedAtUtc, updatedAtUtc: alert.updatedAtUtc });
  }).deferred();
}

/** A URL binding is only selected together with the real private reader above; no route is registered. */
export function sharedAlertsSourceTrackerBinding(publicOrigin: string): SharedSourceDispatchBindings["tracker"] {
  const origin = new URL(publicOrigin);
  if (!["http:", "https:"].includes(origin.protocol) || origin.username || origin.password) throw new SharedAlertError("invalid");
  return { readBoundary: "authenticated-community-audience-and-channel", url: (slug, alertId) => {
    assertCanonicalUuidV4(alertId, "alertId");
    if (slug.length > 100 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(slug)) throw new SharedAlertError("invalid");
    return new URL(`/communities/${slug}/alerts/${alertId}`, origin.origin).href;
  } };
}
