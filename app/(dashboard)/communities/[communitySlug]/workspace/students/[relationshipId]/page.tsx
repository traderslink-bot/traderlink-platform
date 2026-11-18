import { loadCommunityRetainedHistory } from "@/app/(dashboard)/communities/community-dashboard-loader";
import { CommunityRetainedHistoryPage } from "@/app/(dashboard)/communities/community-retained-history";
import {CoachStudentContent,type StudentPanelQuery} from '../../../../coaching-student-content';
import {loadCommunityDashboard} from '../../../../community-dashboard-loader';
export default async function Page({params,searchParams}:{params:Promise<{communitySlug:string;relationshipId:string}>;searchParams:Promise<StudentPanelQuery>}){
 const retainedHistory = await loadCommunityRetainedHistory();
 if (retainedHistory) return <CommunityRetainedHistoryPage history={retainedHistory}/>;
 const {communitySlug,relationshipId}=await params;
 const {snapshot}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/students/${relationshipId}`);
 return <CoachStudentContent snapshot={snapshot} relationshipId={relationshipId} query={await searchParams}/>;
}
