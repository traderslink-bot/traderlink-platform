import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {CoachSetupPage} from "../../../coach-setup-page";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){
 const {communitySlug}=await params;
 const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/plans`);
 if(!loaded.snapshot.viewer.capabilities.includes("community.coaching.offer"))notFound();
 return <DashboardPage><CoachSetupPage page="plan-list" isReview={loaded.isReview} snapshot={loaded.snapshot}/></DashboardPage>;
}
