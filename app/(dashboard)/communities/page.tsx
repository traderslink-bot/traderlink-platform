import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { DashboardPage, DashboardPanel, DashboardUnavailableState } from "@/app/dashboard-ui";
import { requireTraderLinkPlatformServerComponentPageIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { TraderLinkCommunityRepository } from "@/src/modules/communities/server/traderlink-community-repository";

export const metadata = { title: "Communities | TraderLink" };

const refreshDiscordServersHref="/api/auth/discord/login?prompt=consent&returnTo=%2Fcommunities";

export default async function CommunitiesPage(){
  const identity=await requireTraderLinkPlatformServerComponentPageIdentity();
  const data=withReadonlyPlatformDatabase({},database=>{const repository=new TraderLinkCommunityRepository(database);return {historyCommunities:database.prepare(`SELECT c.slug,c.display_name,c.owner_user_id,l.removed_at_utc,EXISTS(SELECT 1 FROM traderlink_community_coaching_relationships cr WHERE cr.community_id=c.community_id AND cr.coach_user_id=?) is_coach,EXISTS(SELECT 1 FROM traderlink_community_coaching_relationships r WHERE r.community_id=c.community_id AND (r.coach_user_id=? OR r.student_user_id=?)) has_history FROM traderlink_communities c LEFT JOIN traderlink_community_lifecycle l ON l.community_id=c.community_id WHERE (l.removed_at_utc IS NOT NULL OR c.status='paused') AND (c.owner_user_id=? OR EXISTS(SELECT 1 FROM traderlink_community_coaching_relationships r WHERE r.community_id=c.community_id AND (r.coach_user_id=? OR r.student_user_id=?))) ORDER BY c.display_name`).all(identity.scope.userId,identity.scope.userId,identity.scope.userId,identity.scope.userId,identity.scope.userId,identity.scope.userId) as {slug:string;display_name:string;owner_user_id:string;removed_at_utc:string|null;has_history:number;is_coach:number}[],communities:repository.listForUser(identity.scope.userId).filter(community=>repository.resolveAccess(community.communityId,identity.scope.userId).capabilities.includes("community.view")),canOnboard:Boolean(database.prepare(`SELECT 1 FROM traderlink_community_discord_guild_candidates WHERE user_id=? AND guild_owner=1`).get(identity.scope.userId))};});
  return <DashboardPage>
    <Stack direction={{xs:"column",md:"row"}} spacing={2} sx={{alignItems:{md:"center"},justifyContent:"space-between"}}><Typography component="h1" variant="h1">Communities</Typography><Stack direction="row" sx={{flexWrap:"wrap",gap:1}}><Button href={refreshDiscordServersHref} variant="outlined">Refresh Discord servers</Button>{data.canOnboard?<Button href="/communities/onboarding" variant="contained">Connect Discord server</Button>:null}{process.env.RAILWAY_ENVIRONMENT_NAME==="staging"?<Button href="/communities/review" variant="outlined">Open complete staging review</Button>:null}</Stack></Stack>
    {data.communities.length?<Grid container spacing={2}>{data.communities.map(community=><Grid key={community.communityId} size={{xs:12,md:6,lg:4}}><DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}><Box sx={{alignItems:"center",bgcolor:"primary.main",borderRadius:2,color:"primary.contrastText",display:"flex",height:44,justifyContent:"center",width:44}}><GroupsRoundedIcon/></Box><Chip color={community.status==="active"?"success":"default"} label={community.status}/></Stack><Box><Typography variant="h2">{community.displayName}</Typography><Typography color="text.secondary" variant="body2">Discord server</Typography></Box><Button href={`/communities/${community.slug}`} variant="contained">Open community</Button></Stack></DashboardPanel></Grid>)}</Grid>:<DashboardUnavailableState actionHref={refreshDiscordServersHref} actionLabel="Refresh Discord servers" description="Once a Discord server is onboarded, every verified member can use TraderLink and open its Community space." title="No linked communities yet"/>}
    {data.historyCommunities.length?<DashboardPanel title="Community history and recovery"><Stack spacing={2}>{data.historyCommunities.map(community=><Stack key={community.slug} spacing={1}><Typography sx={{fontWeight:700}}>{community.display_name}</Typography>{community.owner_user_id===identity.scope.userId?<Button href={`/communities/${community.slug}/recovery`}>{community.removed_at_utc?"Community recovery":"Discord connection"}</Button>:null}{community.has_history?<Button href={community.is_coach?`/communities/${community.slug}/workspace/students`:`/communities/${community.slug}/coaching`}>Coaching history</Button>:null}</Stack>)}</Stack></DashboardPanel>:null}
    <DashboardPanel title="For Discord server owners"><Typography variant="body2">Bring your Discord trading community into TraderLink, give your team better tools, offer your own coaching, and understand how members use the community.</Typography></DashboardPanel>
  </DashboardPage>;
}
