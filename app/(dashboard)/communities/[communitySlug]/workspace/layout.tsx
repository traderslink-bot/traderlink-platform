import type {ReactNode} from "react";
import {CommunityNavigation} from "../../community-navigation";
import {loadCommunityDashboard} from "../../community-dashboard-loader";
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{communitySlug:string}>}){
 const {communitySlug}=await params;
 const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace`);
 return <><CommunityNavigation snapshot={loaded.snapshot}/>{children}</>;
}
