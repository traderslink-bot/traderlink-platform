import {CoachStudentContent,type StudentPanelQuery} from '../../../../coaching-student-content';
import {loadCommunityDashboard} from '../../../../community-dashboard-loader';
export default async function Page({params,searchParams}:{params:Promise<{communitySlug:string;relationshipId:string}>;searchParams:Promise<StudentPanelQuery>}){
 const {communitySlug,relationshipId}=await params;
 const {snapshot}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/students/${relationshipId}`);
 return <CoachStudentContent snapshot={snapshot} relationshipId={relationshipId} query={await searchParams}/>;
}
