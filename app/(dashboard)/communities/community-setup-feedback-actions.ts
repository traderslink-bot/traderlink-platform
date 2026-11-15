"use server";
import {revalidatePath} from "next/cache";
import {requireTraderLinkPlatformPageIdentity} from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {onboardApprovedCommunity,verifyCommunityOwner} from "@/src/modules/communities/server/community-onboarding-service";
import {isApprovedCommunityGuild} from "@/src/modules/communities/server/community-launch-policy";
import {canConnectCommunity} from "@/src/modules/communities/server/community-admission-service";
import type {CommunityPublicationFeedback} from "@/src/modules/communities/contracts/community-publication-feedback";
function failure(message: string): CommunityPublicationFeedback { return { status: "error", message }; }

function refreshSafely(path: string) { try { revalidatePath(path); } catch { /* The saved result remains valid. */ } }

export async function connectCommunityWithFeedback(form: FormData): Promise<CommunityPublicationFeedback> {
  const identity = await requireTraderLinkPlatformPageIdentity();
  const guildId = String(form.get("discordGuildId") ?? "");
  if (!withPlatformDatabase({ mode: "runtime" }, db => canConnectCommunity(db, guildId, identity.scope.userId, isApprovedCommunityGuild(guildId)))) return failure("This community needs TraderLink owner approval before it can connect.");
  const linked = withPlatformDatabase({ mode: "runtime" }, db => db.prepare(`SELECT auth_subject FROM platform_auth_identities WHERE user_id=? AND auth_provider='discord' AND status='active'`).get(identity.scope.userId) as { auth_subject: string } | undefined);
  if (!linked) return failure("Connect your Discord account, then refresh the server list.");
  let evidence;
  try { evidence = await verifyCommunityOwner(guildId, linked.auth_subject, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? ""); }
  catch { return failure("We couldn't verify this server connection. Install the TraderLink Discord app in this server, check its access, then try again as the server owner."); }
  let community;
  try { community = withPlatformDatabase({ mode: "runtime" }, db => onboardApprovedCommunity(db, { userId: identity.scope.userId, evidence, atUtc: new Date().toISOString() })); }
  catch { return failure("We couldn't connect this server. Confirm TraderLink owner approval and current server ownership, then try again."); }
  refreshSafely("/communities");
  return { status: "success", message: "Discord server connected. Choose your roles and publishing channels in community settings.", href: `/communities/${encodeURIComponent(community.slug)}/manage` };
}
