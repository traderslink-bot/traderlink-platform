import Box from "@mui/material/Box";
import {notFound} from "next/navigation";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {CommunityWatchlistRepository} from "@/src/modules/community/server/community-watchlist-repository";
import {loadCommunityDashboard} from "../../../community-dashboard-loader";
import {CommunityNavigation} from "../../../community-navigation";
import {CommunityStatsVisitRecorder} from "../../../community-stats-visit-recorder";
import {requireMembershipPageScope} from "@/src/modules/platform/server/membership/platform-membership-page-access";

export default async function CommunityMemberWatchlistPage({params}:{params:Promise<{communitySlug:string;placementId:string}>}){
  const {communitySlug,placementId}=await params;
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u.test(placementId))notFound();
  const {snapshot,isReview}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/member-watchlists/${placementId}`);
  if(isReview||!snapshot.viewer.capabilities.includes("community.watchlists.view"))notFound();
  // Preserve the existing canonical public watchlist product gate; community roles do not grant it.
  await requireMembershipPageScope("community.access");
  const projection=withReadonlyPlatformDatabase({},db=>{
    // Query by exact placement, independently of the dashboard's bounded preview list.
    // The audience predicate is the same active-everyone/current-role contract as that list.
    const target=db.prepare(`SELECT w.slug,p.handle,u.display_name FROM traderlink_community_watchlist_placements x JOIN community_watchlists w ON w.watchlist_id=x.watchlist_id AND w.status='published' JOIN community_profiles p ON p.user_id=w.owner_user_id JOIN platform_users u ON u.user_id=x.author_user_id JOIN traderlink_community_audiences a ON a.community_id=x.community_id AND a.audience_id=x.audience_id WHERE x.community_id=@community AND x.placement_id=@placement AND x.status='published' AND (@owner=1 OR(a.status='active' AND(a.mode='everyone' OR EXISTS(SELECT 1 FROM traderlink_community_audience_discord_roles r WHERE r.community_id=a.community_id AND r.audience_id=a.audience_id AND r.discord_role_id IN(SELECT value FROM json_each(@roles))))))`).get({community:snapshot.community.communityId,placement:placementId,owner:snapshot.community.isOwner?1:0,roles:JSON.stringify(snapshot.viewer.discordRoleIds)}) as {slug:string;handle:string;display_name:string}|undefined;
    if(!target)return null;
    const detail=new CommunityWatchlistRepository(db).findPublished(target.handle,target.slug);
    return detail?{detail,authorName:target.display_name}:null;
  });
  if(!projection)notFound();
  const {detail,authorName}=projection;
  return <Box sx={{minWidth:0,color:"text.primary"}}><CommunityNavigation snapshot={snapshot}/><CommunityStatsVisitRecorder communitySlug={communitySlug}/>
    <Box component="a" href={`/communities/${communitySlug}/watchlists`} sx={{color:"primary.main"}}>Back to watchlists</Box>
    <Box sx={{my:2,p:2,bgcolor:"background.paper",border:1,borderColor:"divider",borderRadius:"9px"}}><h1 style={{overflowWrap:"anywhere"}}>{detail.title}</h1><p>Author: {detail.authorHandle}</p><p>Shared by: {authorName}</p>{detail.description?<p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{detail.description}</p>:null}</Box>
    {detail.tickers.map(ticker=><Box component="section" key={ticker.symbol} sx={{p:2,mb:2,bgcolor:"background.paper",border:1,borderColor:"divider",borderRadius:"9px"}}><h2>{ticker.symbol}</h2><dl>{[["Why watching",ticker.whyWatching],["Plan",ticker.plan],["Personal target",ticker.personalTarget],["Catalyst",ticker.catalyst],["Catalyst date",ticker.catalystDate]].filter(([,value])=>!!value).map(([label,value])=><Box key={label} sx={{mb:1.5}}><dt style={{fontWeight:600}}>{label}</dt><dd style={{margin:0,whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{value}</dd></Box>)}</dl></Box>)}
  </Box>;
}
