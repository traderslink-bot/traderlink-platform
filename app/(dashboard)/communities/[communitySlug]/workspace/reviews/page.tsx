import {DashboardPage} from "@/app/dashboard-ui";
import {ReviewsPage} from "../../../coaching-program-pages";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
export default async function Page({params}:{params:Promise<{communitySlug:string}>}){const {communitySlug}=await params;const loaded=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/workspace/reviews`);return <DashboardPage><ReviewsPage snapshot={loaded.snapshot}/></DashboardPage>}
