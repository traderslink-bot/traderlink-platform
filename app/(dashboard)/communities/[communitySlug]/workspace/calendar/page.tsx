import {DashboardPage} from "@/app/dashboard-ui";
import {CoachingCalendarPage} from "../../../coaching-calendar-page";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/calendar`);return <DashboardPage><CoachingCalendarPage snapshot={loaded.snapshot}/></DashboardPage>}
