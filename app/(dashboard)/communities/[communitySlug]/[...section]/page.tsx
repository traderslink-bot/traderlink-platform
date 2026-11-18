import CommunityCoachingSectionPage from "../../community-coaching-section-page";
import {isCoachingStaff} from "@/src/modules/communities/contracts/coaching-audience";
import { notFound, redirect } from "next/navigation";

import { TRADERLINK_COMMUNITY_SECTIONS, type TraderLinkCommunitySection } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { CommunityDashboard } from "../../community-dashboard";
import { loadCommunityPublishingDashboard as loadCommunityDashboard } from "../../community-publication-dashboard-loader";
import { readCommunityDiscordResources } from "@/src/modules/communities/server/community-discord-resources";

function resolveSection(parts:readonly string[]):TraderLinkCommunitySection{
  if(parts[0]==="stats"&&(parts.length===1||(parts.length===2&&parts[1]==="activity")))return "activity";
  if(parts.length===2&&parts[0]==="manage"&&parts[1]==="alerts")return "alert-management";
  const value=parts[0]==="manage"?(parts[1]??"manage"):parts[0];
  if(!TRADERLINK_COMMUNITY_SECTIONS.includes(value as TraderLinkCommunitySection)) notFound();
  return value as TraderLinkCommunitySection;
}

export default async function CommunitySectionPage({params}:{params:Promise<{communitySlug:string;section:string[]}>}){
  const { communitySlug, section } = await params;
  if (["coaches", "coaching", "workspace"].includes(section[0])) {
    return <CommunityCoachingSectionPage params={Promise.resolve({ communitySlug, section })} />;
  } if(section.join("/")==="manage/activity")redirect(`/communities/${communitySlug}/stats/activity`); const resolved=resolveSection(section); const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/${section.join("/")}`);
  if(resolved==="activity"&&loaded.isReview)notFound();
  const capabilities=loaded.snapshot.viewer.capabilities;
  if(resolved==="coaching"&&isCoachingStaff(capabilities))redirect(`/communities/${communitySlug}/workspace`);
  const owner=loaded.snapshot.community.isOwner;
  const allowed=resolved==="home"||
    (resolved==="alerts"&&(capabilities.includes("community.alerts.view")||capabilities.includes("community.alerts.create")||loaded.snapshot.viewer.channelAccess?.alerts===true))||
    (resolved==="watchlists"&&(capabilities.includes("community.watchlists.view")||capabilities.includes("community.watchlists.publish_staff")||loaded.snapshot.viewer.channelAccess?.watchlists===true))||
    (resolved==="coaches"&&(capabilities.includes("community.coaching.view")||capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.manage_all")))||
    (resolved==="coaching"&&loaded.snapshot.relationships.some(item=>item.studentUserId===loaded.snapshot.viewer.userId))||
    (resolved==="workspace"&&(capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.students")))||
    (resolved==="manage"&&(owner||capabilities.includes("community.manage")))||
    (resolved==="alert-management"&&(capabilities.includes("community.alerts.create")||capabilities.includes("community.alerts.manage_all")))||
    (resolved==="team"&&(owner||capabilities.includes("community.team.manage")))||
    (resolved==="roles"&&(owner||capabilities.includes("community.roles.manage")))||
    (resolved==="members"&&(owner||capabilities.includes("community.members.view")))||
    (resolved==="activity"&&(owner||capabilities.includes("community.analytics.view")||loaded.snapshot.statsOwnContentAccess===true))||
    (resolved==="channels"&&(owner||capabilities.includes("community.discord.manage")))||
    (resolved==="templates"&&capabilities.includes("community.alerts.manage_all"))||
    (resolved==="settings"&&(owner||capabilities.includes("community.manage")));
  if(!allowed)notFound();
  const discordResources = !loaded.isReview && (resolved === "roles" || resolved === "channels" || resolved === "settings")
    ? await readCommunityDiscordResources(loaded.snapshot.community.discordGuildId, process.env.TRADERLINK_DISCORD_BOT_TOKEN ?? "").catch(() => null)
    : null;
  return <CommunityDashboard discordResources={discordResources} discordClientId={process.env.TRADERLINK_COMMUNITIES_DISCORD_CLIENT_ID?.trim()||null} isReview={loaded.isReview} section={resolved} snapshot={loaded.snapshot}/>;
}
