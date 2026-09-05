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
  return <CommunityDashboard isReview={loaded.isReview} section={resolved} snapshot={loaded.snapshot}/>;
}
