import {CommunityBrandedFeedPage} from "../../../community-branded-feed-page";
export default async function Page({params}:{params:Promise<{communitySlug:string;feed:string[]}>}){const {communitySlug,feed}=await params;return <CommunityBrandedFeedPage communitySlug={communitySlug} pageType="watchlist" segments={feed}/>;}
