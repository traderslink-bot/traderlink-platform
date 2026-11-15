import {notFound} from "next/navigation";
import {DashboardPage} from "@/app/dashboard-ui";
import {coachPlanRows,coachingWorkItems} from "@/src/modules/communities/contracts/coaching-work-model";
import {CoachingPlanOperationPage} from "../../../../coaching-plan-operation-page";
import {loadCommunityDashboard} from "../../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string;planId:string}>}){const {communitySlug,planId}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/plans/${planId}`);if(!coachPlanRows(loaded.snapshot,coachingWorkItems(loaded.snapshot)).some(p=>p.id===planId))notFound();return <DashboardPage><CoachingPlanOperationPage snapshot={loaded.snapshot} planId={planId}/></DashboardPage>}
