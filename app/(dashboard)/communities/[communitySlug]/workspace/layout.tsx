import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {readCoachCommercialAccess} from "@/src/modules/communities/server/coaching-commercial-access";
import {IndependentCoachSignup} from "@/app/(member)/coaching/coach-signup";
import type {ReactNode} from "react";
import {CommunityNavigation} from "../../community-navigation";
import {loadCommunityDashboard} from "../../community-dashboard-loader";
export default async function Layout({children,params}:{children:ReactNode;params:Promise<{communitySlug:string}>}){
 const {communitySlug}=await params;
 const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace`);
 const access=loaded.isReview?null:withReadonlyPlatformDatabase({},db=>readCoachCommercialAccess(db,{coachUserId:loaded.snapshot.viewer.userId,scope:'community',communityId:loaded.snapshot.community.communityId,atUtc:new Date().toISOString()}));
 if(access&&!access.allowed)return <IndependentCoachSignup access={access}/>;
 return <><CommunityNavigation snapshot={loaded.snapshot}/>{children}</>;
}
