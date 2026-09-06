import { notFound } from "next/navigation";

import { TRADERLINK_COMMUNITY_SECTIONS, type TraderLinkCommunitySection } from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import { CommunityDashboard } from "../../community-dashboard";
import { loadCommunityDashboard } from "../../community-dashboard-loader";

function resolveSection(parts:readonly string[]):TraderLinkCommunitySection{
  const value=parts[0]==="manage"?(parts[1]??"manage"):parts[0];
  if(!TRADERLINK_COMMUNITY_SECTIONS.includes(value as TraderLinkCommunitySection)) notFound();
  return value as TraderLinkCommunitySection;
}

export default async function CommunitySectionPage({params}:{params:Promise<{communitySlug:string;section:string[]}>}){
  const {communitySlug,section}=await params; const resolved=resolveSection(section); const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/${section.join("/")}`);
  const capabilities=loaded.snapshot.viewer.capabilities;
  const owner=loaded.snapshot.community.isOwner;
  const allowed=resolved==="home"||
    (resolved==="alerts"&&(capabilities.includes("community.alerts.view")||capabilities.includes("community.alerts.create")))||
    (resolved==="watchlists"&&(capabilities.includes("community.watchlists.view")||capabilities.includes("community.watchlists.publish_staff")))||
    (resolved==="coaches"&&(capabilities.includes("community.coaching.view")||capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.manage_all")))||
    (resolved==="coaching"&&loaded.snapshot.relationships.some(item=>item.studentUserId===loaded.snapshot.viewer.userId))||
    (resolved==="workspace"&&(capabilities.includes("community.coaching.offer")||capabilities.includes("community.coaching.students")))||
    (resolved==="manage"&&(owner||capabilities.includes("community.manage")))||
    (resolved==="team"&&(owner||capabilities.includes("community.team.manage")))||
    (resolved==="roles"&&(owner||capabilities.includes("community.roles.manage")))||
    (resolved==="members"&&(owner||capabilities.includes("community.members.view")))||
    (resolved==="activity"&&(owner||capabilities.includes("community.analytics.view")))||
    (resolved==="channels"&&(owner||capabilities.includes("community.discord.manage")))||
    (resolved==="settings"&&(owner||capabilities.includes("community.manage")));
  if(!allowed)notFound();
  return <CommunityDashboard discordClientId={process.env.DISCORD_CLIENT_ID??null} isReview={loaded.isReview} section={resolved} snapshot={loaded.snapshot}/>;
}
