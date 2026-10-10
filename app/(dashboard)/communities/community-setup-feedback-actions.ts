"use server";

import { revalidatePath } from "next/cache";
import { requireTraderLinkPlatformPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { requireCommunityRequestAccess } from "@/src/modules/communities/server/community-request-access";
import { readCommunityDiscordResources } from "@/src/modules/communities/server/community-discord-resources";
import { resolveTraderLinkCommunityViewer } from "@/src/modules/communities/server/traderlink-community-viewer";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";
import { TraderLinkCommunityPlatformRepository } from "@/src/modules/communities/server/traderlink-community-platform-repository";
import { onboardApprovedCommunity, verifyCommunityOwner } from "@/src/modules/communities/server/community-onboarding-service";
import { isApprovedCommunityGuild } from "@/src/modules/communities/server/community-launch-policy";
import { TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, type TraderLinkCommunityFixedResponsibility } from "@/src/modules/communities/contracts/traderlink-community-contracts";
import type { CommunityPublicationFeedback } from "@/src/modules/communities/contracts/community-publication-feedback";

function failure(message: string): CommunityPublicationFeedback { return { status: "error", message }; }
function refreshSafely(path: string) { try { revalidatePath(path); } catch { /* The saved result remains valid. */ } }

export async function connectCommunityWithFeedback(form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const guildId = String(form.get("discordGuildId") ?? "");
  const slug = String(form.get("slug") ?? "").trim();
  const displayName = String(form.get("displayName") ?? "").trim();
  if (!isApprovedCommunityGuild(guildId)) return failure("Choose a server approved for connection.");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !displayName) return failure("Enter a community name and a URL name using lowercase letters, numbers and hyphens.");
  const linked = withPlatformDatabase({ mode: "runtime" }, db => db.prepare(`SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'`).get(identity.scope.userId) as { auth_subject: string } | undefined);
  if (!linked) return failure("Connect your Discord account, then refresh the server list.");
  let evidence;
  try { evidence = await verifyCommunityOwner(guildId, linked.auth_subject, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? ""); }
  catch { return failure("We couldn't verify this server connection. Install the TraderLink Discord app in this server, check its access, then try again as the server owner."); }
  let community;
  try { community = withPlatformDatabase({ mode: "runtime" }, db => onboardApprovedCommunity(db, { userId: identity.scope.userId, slug, displayName, evidence, atUtc: new Date().toISOString() })); }
  catch { return failure("We couldn't connect this community. Check that the URL name is available and that server ownership hasn't changed. Your entries are still here."); }
  refreshSafely("/communities");
  return { status: "success", message: "Discord server connected. Choose your roles and publishing channels in community settings.", href: `/communities/${encodeURIComponent(community.slug)}/manage` };
}

async function saveSetup(kind: "roles" | "channels", form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const slug = String(form.get("communitySlug") ?? "");
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return failure("Community unavailable.");
  const capability = kind === "roles" ? "community.roles.manage" : "community.discord.manage";
  let community: { community_id: string; discord_guild_id: string };
  try {
    await requireCommunityRequestAccess({ userId: identity.scope.userId, slug });
    community = withPlatformDatabase({ mode: "runtime" }, db => {
      const row = db.prepare(`SELECT community_id,discord_guild_id FROM traderlink_communities WHERE slug=?`).get(slug) as typeof community | undefined;
      if (!row) throw new Error("Unavailable");
      new TraderLinkCommunityRepository(db).requireCapability(row.community_id, identity.scope.userId, capability);
      return row;
    });
  } catch { return failure("We couldn't verify your permission to manage this server. Reconnect Discord or try again shortly."); }
  let resources;
  try { resources = await readCommunityDiscordResources(community.discord_guild_id, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? ""); }
  catch { return failure("Discord roles and channels are unavailable. Check that the bot is installed, then refresh this page."); }
  const role = resources.roles.find(item => item.id === form.get("discordRoleId"));
  const channel = resources.channels.find(item => item.id === form.get("discordChannelId"));
  const responsibilities = form.getAll("responsibilities").filter((value): value is TraderLinkCommunityFixedResponsibility => typeof value === "string" && Object.hasOwn(TRADERLINK_COMMUNITY_FIXED_RESPONSIBILITIES, value));
  const contentType = String(form.get("contentType") ?? "");
  if (kind === "roles" && (!role || !responsibilities.length)) return failure("Choose an existing Discord role and at least one responsibility.");
  if (kind === "channels" && (!channel?.canPublish || !["alerts", "watchlists", "coaching", "general"].includes(contentType))) return failure("Choose a current channel where the bot can post, and a content type.");
  try {
    withPlatformDatabase({ mode: "runtime" }, db => {
      const actor = resolveTraderLinkCommunityViewer(db, identity, slug);
      new TraderLinkCommunityRepository(db).requireCapability(community.community_id, actor.userId, capability);
      if (kind === "roles" && role) new TraderLinkCommunityRepository(db).saveDiscordFeatureMapping({ communityId: community.community_id, actorUserId: actor.userId, discordRoleId: role.id, discordRoleName: role.name, responsibilities, timestamp: new Date().toISOString() });
      if (kind === "channels" && channel) new TraderLinkCommunityPlatformRepository(db).saveDiscordDestination({ communityId: community.community_id, actor, name: channel.name, discordChannelId: channel.id, contentType: contentType as "alerts" | "watchlists" | "coaching" | "general", atUtc: new Date().toISOString() });
    });
  } catch { return failure("We couldn't save these settings. Your entries are still here. Refresh Discord access and try again."); }
  refreshSafely(`/communities/${slug}/manage/${kind}`);
  return { status: "success", message: kind === "roles" ? "Role access saved." : "Publishing channel saved. No test message was sent." };
}

export async function saveCommunityRoleWithFeedback(form: FormData) { return saveSetup("roles", form); }
export async function saveCommunityChannelWithFeedback(form: FormData) { return saveSetup("channels", form); }
