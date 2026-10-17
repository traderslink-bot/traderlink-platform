import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {CoachSetupPage} from "../../../../coach-setup-page";
import {loadCommunityDashboard} from "../../../../community-dashboard-loader";
export default async function Page({params,searchParams}:{params:Promise<{communitySlug:string}>;searchParams:Promise<{planId?:string|string[]}>}){
 const {communitySlug}=await params;
 const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/setup/plans`);
 if(!loaded.snapshot.viewer.capabilities.includes("community.coaching.offer"))notFound();
 const {planId}=await searchParams;
 if(planId&&(typeof planId!=="string"||!loaded.snapshot.plans.some(plan=>plan.planId===planId&&loaded.snapshot.coaches.some(coach=>coach.coachProfileId===plan.coachProfileId&&coach.userId===loaded.snapshot.viewer.userId))))notFound();
 return <DashboardPage><CoachSetupPage page="plans" editingPlanId={typeof planId==="string"?planId:undefined} isReview={loaded.isReview} snapshot={loaded.snapshot}/></DashboardPage>;
}
