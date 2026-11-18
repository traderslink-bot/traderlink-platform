import { loadCommunityRetainedHistory } from "@/app/(dashboard)/communities/community-dashboard-loader";
import { CommunityRetainedHistoryPage } from "@/app/(dashboard)/communities/community-retained-history";
import {DashboardPage} from '@/app/dashboard-ui';
import {StudentsPage} from '../../../coach-workspace-navigation';
import {CoachStudentContent,type StudentPanelQuery} from '../../../coaching-student-content';
import {CoachingStudentFocus} from '../../../coaching-student-side-panel';
import {loadCommunityDashboard} from '../../../community-dashboard-loader';
export default async function Page({params,searchParams}:{params:Promise<{communitySlug:string}>;searchParams:Promise<StudentPanelQuery&{student?:string}>}){
 const retainedHistory = await loadCommunityRetainedHistory();
 if (retainedHistory) return <CommunityRetainedHistoryPage history={retainedHistory}/>;
 const {communitySlug}=await params,query=await searchParams;
 const {snapshot}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/students`);
 return <DashboardPage><CoachingStudentFocus section={query.focus}/><StudentsPage snapshot={snapshot} initialQuery={query.q??''} initialView={query.view==='history'?'history':'active'}/>{query.student?<CoachStudentContent snapshot={snapshot} relationshipId={query.student} query={query} directory/>:null}</DashboardPage>;
}
