import {CommunityContentRoutePage} from "../../../community-content-route-page";
export default async function Page({params}:{params:Promise<{communitySlug:string;feed:string[]}>}){const {communitySlug,feed}=await params;return <CommunityContentRoutePage communitySlug={communitySlug} segments={feed}/>}
