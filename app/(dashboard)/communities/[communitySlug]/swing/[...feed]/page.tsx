import {notFound,redirect} from "next/navigation";
import {CommunityBrandedContentRepository} from "@/src/modules/communities/server/community-branded-content-repository";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {loadCommunityPublishingDashboard as loadCommunityDashboard} from "../../../community-publication-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string;feed:string[]}>}){const {communitySlug,feed}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/swing/${feed.join("/")}`);const page=withPlatformDatabase({mode:"runtime"},database=>new CommunityBrandedContentRepository(database).resolveLegacySwing(loaded.snapshot.community.communityId,feed));if(!page)notFound();redirect(`/communities/${communitySlug}/alert/${[page.slug,page.secondarySlug].filter(Boolean).join("/")}`)}
