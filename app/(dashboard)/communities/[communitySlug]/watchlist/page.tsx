import {CommunityDestinationHubPage} from "../../community-destination-hub";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;return <CommunityDestinationHubPage communitySlug={communitySlug} family="watchlist"/>}
