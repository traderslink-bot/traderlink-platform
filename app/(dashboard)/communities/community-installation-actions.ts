"use server";

import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { readCommunityInstallationStatus } from "@/src/modules/communities/server/community-installation-status";
import { COMMUNITY_INSTALLATION_MESSAGES, type CommunityInstallationStatus } from "@/src/modules/communities/contracts/community-installation-status";

export async function checkCommunityInstallation(form: FormData): Promise<CommunityInstallationStatus> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const guildId = String(form.get("discordGuildId") ?? "");
  const denied: CommunityInstallationStatus = {state: "owner_required", message: COMMUNITY_INSTALLATION_MESSAGES.owner_required};
  if (!/^\d{1,32}$/u.test(guildId) || !isApprovedCommunityGuild(guildId)) return denied;
  const candidate = withReadonlyPlatformDatabase({}, db => db.prepare(`SELECT identity.auth_subject, community.slug connected_slug, community.owner_user_id connected_owner
    FROM traderlink_community_discord_guild_candidates candidate
    JOIN platform_auth_identities identity ON identity.user_id=candidate.user_id AND identity.auth_provider='discord' AND identity.status='active'
    LEFT JOIN traderlink_communities community ON community.discord_guild_id=candidate.discord_guild_id
    WHERE candidate.user_id=? AND candidate.discord_guild_id=? AND candidate.guild_owner=1`)
    .get(identity.scope.userId, guildId) as {auth_subject: string; connected_slug: string | null; connected_owner: string | null} | undefined);
  if (!candidate || (candidate.connected_owner && candidate.connected_owner !== identity.scope.userId)) return denied;
  if (candidate.connected_slug) return {state: "connected", message: COMMUNITY_INSTALLATION_MESSAGES.connected, href: `/communities/${encodeURIComponent(candidate.connected_slug)}/manage`};
  return readCommunityInstallationStatus(guildId, candidate.auth_subject, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "");
}
