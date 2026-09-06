import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "@/app/dashboard-ui";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";

export const metadata = { title: "Communities | TraderLink" };

export default async function CommunitiesPage(){
  const identity=await requireTraderLinkPlatformServerComponentPageIdentity();
  const data=withReadonlyPlatformDatabase({},database=>{const repository=new TraderLinkCommunityRepository(database);return {communities:repository.listForUser(identity.scope.userId).filter(community=>repository.resolveAccess(community.communityId,identity.scope.userId).capabilities.includes("community.view")),canOnboard:Boolean(database.prepare(`SELECT 1 FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND guild_owner=1`).get(identity.scope.userId))};});
  return <DashboardPage>
    <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{alignItems:{md:"center"},justifyContent:"space-between"}}><Typography component="h1" variant="h1">Communities</Typography><Stack direction="row" spacing={1}>{data.canOnboard?<Button component={Link} href="/communities/onboarding" variant="contained">Connect Discord server</Button>:null}{process.env.RAILWAY_ENVIRONMENT_NAME==="staging"?<Button component={Link} href="/communities/review" variant="outlined">Open complete staging review</Button>:null}</Stack></Stack>
    {data.communities.length?<Grid container spacing={2}>{data.communities.map(community=><Grid key={community.communityId} size={{xs:12,md:6,lg:4}}><DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}><Box sx={{alignItems:"center",bgcolor:"primary.main",borderRadius:2,color:"primary.contrastText",display:"flex",height:44,justifyContent:"center",width:44}}><GroupsRoundedIcon/></Box><Chip color={community.status==="active"?"success":"default"} label={community.status}/></Stack><Box><Typography variant="h2">{community.displayName}</Typography><Typography color="text.secondary" variant="body2">Discord server</Typography></Box><Button component={Link} href={`/communities/${community.slug}`} variant="contained">Open community</Button></Stack></DashboardPanel></Grid>)}</Grid>:<DashboardUnavailableState actionHref={data.canOnboard?"/communities/onboarding":"/api/auth/discord/login?prompt=consent&returnTo=%2Fcommunities%2Fonboarding"} actionLabel={data.canOnboard?"Connect Discord server":"Refresh Discord servers"} description="Once a Discord server is onboarded, every verified member can use TraderLink and open its Community space." title="No linked communities yet"/>}
    <DashboardPanel title="For Discord server owners"><Typography variant="body2">Bring your Discord trading community into TraderLink, give your team better tools, offer your own coaching, understand how members use the community, and earn when those members upgrade to TraderLink Tier 2.</Typography></DashboardPanel>
  </DashboardPage>;
}
