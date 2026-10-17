import {CommunityNavigation} from "../../../community-navigation";
import {CommunityPublicationHistory} from "../../../community-publication-history";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { withReadonlyPlatformDatabase } from "@/src/modules/platform/server/database/open-readonly-platform-database";
import { parseWatchlistResearch, type CommunityWatchlistResearch } from "@/src/modules/communities/contracts/community-watchlist-research";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";
import { CommunityWatchlistEditor } from "../../../community-watchlist-editor";

export default async function ServerWatchlistPage({ params }: { params: Promise<{ communitySlug: string; watchlistId: string }> }) {
  const { communitySlug, watchlistId } = await params;
  const { snapshot, isReview } = await loadCommunityDashboard(communitySlug, `/communities/${communitySlug}/server-watchlists/${watchlistId}`);
  const watchlist = snapshot.watchlists.find(item => item.sourceKind === "server" && item.watchlistId === watchlistId);
  if (!watchlist) notFound();
  const canManage = snapshot.viewer.capabilities.includes("community.watchlists.publish_staff") && (watchlist.authorUserId === snapshot.viewer.userId || snapshot.viewer.capabilities.includes("community.watchlists.manage_all"));
  if ((watchlist.status !== "published") && !canManage) notFound();
  // Research is read only after the existing community/content authorization.
  const research: CommunityWatchlistResearch = isReview ? {} : withReadonlyPlatformDatabase({}, db => {
    const row = db.prepare("SELECT ticker_research_json FROM traderlink_community_server_watchlists WHERE watchlist_id=? AND community_id=?").get(watchlistId, snapshot.community.communityId) as { ticker_research_json: string } | undefined;
    const saved = parseWatchlistResearch(row?.ticker_research_json ?? "{}", watchlist.symbols ?? []);
    const legacy = db.prepare("SELECT symbol,note FROM traderlink_community_server_watchlist_symbols WHERE watchlist_id=? AND community_id=? ORDER BY ordinal").all(watchlistId, snapshot.community.communityId) as { symbol: string; note: string }[];
    return Object.fromEntries(legacy.map(item => [item.symbol, saved[item.symbol] ?? { notes: item.note, research: "", sources: [] }]));
  });
  return <DashboardPage><CommunityNavigation snapshot={snapshot}/>
    <Button component="a" href={`/communities/${communitySlug}/watchlists`}>Back to watchlists</Button>
    <DashboardPanel hideHeader><Stack spacing={2}>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}><Chip label={watchlist.status === "archived" ? "Archived" : watchlist.status === "draft" ? "Draft" : "Server watchlist"}/><Chip label={watchlist.publishingMode === "tracked_page" ? "Tracked page" : "Discord post"} variant="outlined"/></Stack>
      <Typography component="h1" variant="h1">{watchlist.title}</Typography>
      {watchlist.description ? <Typography sx={{ whiteSpace: "pre-wrap" }}>{watchlist.description}</Typography> : null}
      <Typography color="text.secondary">{watchlist.authorName}</Typography>
    </Stack></DashboardPanel>
    {watchlist.symbols?.map(symbol => <DashboardPanel key={symbol} title={symbol}><Stack spacing={2}>
      {research[symbol]?.notes ? <Stack><Typography sx={{ fontWeight: 700 }}>Notes</Typography><Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{research[symbol].notes}</Typography></Stack> : null}
      {research[symbol]?.research ? <Stack><Typography sx={{ fontWeight: 700 }}>DD research</Typography><Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{research[symbol].research}</Typography></Stack> : null}
      {research[symbol]?.sources.map((source, index) => <Link key={`${index}-${source}`} href={source} target="_blank" rel="noopener noreferrer" sx={{ overflowWrap: "anywhere" }}>{source}</Link>)}
    </Stack></DashboardPanel>)}
    {canManage ? <DashboardPanel title="Edit watchlist"><CommunityWatchlistEditor communitySlug={communitySlug} watchlist={watchlist} research={research} isReview={isReview} publishing={snapshot.publishing}/></DashboardPanel> : null}
    {!isReview?<CommunityPublicationHistory communityId={snapshot.community.communityId} objectId={watchlist.watchlistId} kind="watchlist" canManage={canManage}/>:null}
  </DashboardPage>;
}
