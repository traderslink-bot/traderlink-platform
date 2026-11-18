import Link from "next/link";
import {notFound} from "next/navigation";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import {withReadonlyPlatformDatabase} from "@/src/modules/platform/server/database/open-readonly-platform-database";
import {parseWatchlistResearch} from "@/src/modules/communities/contracts/community-watchlist-research";
import {loadCommunityPublishingDashboard} from "../../../community-publication-dashboard-loader";
import {CommunityNavigation} from "../../../community-navigation";
import {CommunityWatchlistEditor} from "../../../community-watchlist-editor";
import {CommunityPublicationHistory} from "../../../community-publication-history";
import {CommunityStatsVisitRecorder} from "../../../community-stats-visit-recorder";

export default async function CommunityServerWatchlistPage({params}:{params:Promise<{communitySlug:string;watchlistId:string}>}){
  const {communitySlug,watchlistId}=await params;
  if(!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(watchlistId))notFound();
  const detailPath=`/communities/${communitySlug}/server-watchlists/${watchlistId}`;
  const {snapshot,isReview}=await loadCommunityPublishingDashboard(communitySlug,detailPath);
  // The normal snapshot already applies membership, publication and exact destination visibility.
  const watchlist=snapshot.watchlists.find(item=>item.sourceKind==="server"&&item.watchlistId===watchlistId);
  if(!watchlist)notFound();
  const capabilities=snapshot.viewer.capabilities;
  const canEdit=capabilities.includes("community.watchlists.publish_staff")&&(watchlist.authorUserId===snapshot.viewer.userId||capabilities.includes("community.watchlists.manage_all"));
  const symbols=watchlist.symbols??[];
  // Read additional body facts only after the exact publication passed the normal reader guard.
  const research=isReview?{}:withReadonlyPlatformDatabase({},database=>{
    const row=database.prepare("SELECT ticker_research_json FROM traderlink_community_server_watchlists WHERE community_id=? AND watchlist_id=?").get(snapshot.community.communityId,watchlistId) as {ticker_research_json:string}|undefined;
    if(!row)notFound();
    return parseWatchlistResearch(row.ticker_research_json,symbols);
  });
  return <DashboardPage><CommunityNavigation snapshot={snapshot}/>
    {!isReview&&watchlist.status==="published"&&watchlist.publishingMode==="tracked_page"?<CommunityStatsVisitRecorder communitySlug={communitySlug}/>:null}
    <Typography component={Link} href={`/communities/${communitySlug}/watchlist`} sx={{color:"primary.main",fontWeight:800,textDecoration:"none"}}>← Back to watchlists</Typography>
    <DashboardPanel hideHeader><Stack spacing={2}>
      <Typography component="h1" variant="h1">{watchlist.title}</Typography>
      <Typography sx={{whiteSpace:"pre-wrap"}}>{watchlist.description}</Typography>
      <Typography color="text.secondary">Published by {watchlist.authorName}</Typography>
      {symbols.map(symbol=>{const item=research[symbol];return <Stack key={symbol} spacing={1}>
        <Typography component="h2" variant="h2">{symbol}</Typography>
        {item?.notes?<Typography sx={{whiteSpace:"pre-wrap"}}>{item.notes}</Typography>:null}
        {item?.research?<Typography sx={{whiteSpace:"pre-wrap"}}>{item.research}</Typography>:null}
        {item?.priceTarget?<Typography>Price target: {item.priceTarget}</Typography>:null}
        {item?.supportLevels?.length?<Typography>Support levels: {item.supportLevels.join(", ")}</Typography>:null}
        {item?.stopLoss?<Typography>Stop loss: {item.stopLoss}</Typography>:null}
        {item?.publisherTake?<Typography sx={{whiteSpace:"pre-wrap"}}>Publisher take: {item.publisherTake}</Typography>:null}
        {item?.sources.map(source=><Typography component="a" href={source} key={source} rel="noopener noreferrer" target="_blank" sx={{overflowWrap:"anywhere"}}>{source}</Typography>)}
      </Stack>;})}
    </Stack></DashboardPanel>
    {canEdit?<DashboardPanel title="Edit watchlist"><CommunityWatchlistEditor communitySlug={communitySlug} watchlist={watchlist} research={research} isReview={isReview} publishing={snapshot.publishing}/></DashboardPanel>:null}
    {!isReview?<CommunityPublicationHistory communityId={snapshot.community.communityId} objectId={watchlistId} kind="watchlist" canManage={canEdit}/>:null}
  </DashboardPage>;
}
