import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPage} from "@/app/dashboard-ui";
import type {CommunityDestinationFamily} from "@/src/modules/communities/contracts/community-branded-content";
import {CommunityBrandedContentRepository} from "@/src/modules/communities/server/community-branded-content-repository";
import {withPlatformDatabase} from "@/src/modules/platform/server/database/open-platform-database";
import {communityHubCacheScope,readCommunityContentCache} from "@/src/modules/communities/server/community-content-read-cache";
import {CommunityNavigation} from "./community-navigation";
import {loadCommunityDashboard} from "./community-dashboard-loader";
import {CommunityDestinationHubList} from "./community-destination-hub-list";

const titles:Record<CommunityDestinationFamily,string>={alert:"Alerts",watchlist:"Watchlists",content:"Content"};
export async function CommunityDestinationHubPage({communitySlug,family}:{communitySlug:string;family:CommunityDestinationFamily}){const path=`/communities/${communitySlug}/${family}`;const loaded=await loadCommunityDashboard(communitySlug,path);const hub=readCommunityContentCache(`${communityHubCacheScope(communitySlug)}${family}`,()=>withPlatformDatabase({mode:"runtime"},database=>new CommunityBrandedContentRepository(database).readHub(loaded.snapshot.community.communityId,family)));return <DashboardPage><CommunityNavigation snapshot={loaded.snapshot}/><Stack spacing={3}><Typography component="h1" variant="h1">{titles[family]}</Typography><CommunityDestinationHubList communitySlug={communitySlug} hub={hub} manageablePageIds={(loaded.snapshot.contentPages??[]).filter(page=>page.canPublish).map(page=>page.pageId)}/></Stack></DashboardPage>}
