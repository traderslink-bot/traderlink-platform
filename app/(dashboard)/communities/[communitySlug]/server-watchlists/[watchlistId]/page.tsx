import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";
import { updateCommunityServerWatchlistAction } from "../../../community-actions";

export default async function ServerWatchlistPage({params}:{params:Promise<{communitySlug:string;watchlistId:string}>}){
  const {communitySlug,watchlistId}=await params;
  const {snapshot,isReview}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/server-watchlists/${watchlistId}`);
  const watchlist=snapshot.watchlists.find(item=>item.sourceKind==="server"&&item.watchlistId===watchlistId);
  if(!watchlist)notFound();
  const canManage=watchlist.authorUserId===snapshot.viewer.userId||snapshot.viewer.capabilities.includes("community.watchlists.manage_all");
  if(watchlist.publishingMode==="discord_post"&&!canManage)notFound();
  return <DashboardPage><Button component={Link} href={`/communities/${communitySlug}/watchlists`} startIcon={<ArrowBackRoundedIcon/>}>Back to watchlists</Button><DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" spacing={1} sx={{alignItems:"center"}}><Chip color="warning" label="Server watchlist"/><Chip color={watchlist.publishingMode==="tracked_page"?"success":"warning"} label={watchlist.publishingMode==="tracked_page"?"Tracked page":"Discord post"} variant="outlined"/></Stack><Typography component="h1" variant="h1">{watchlist.title}</Typography>{watchlist.description?<Typography color="text.secondary">{watchlist.description}</Typography>:null}<Stack direction="row" sx={{flexWrap:"wrap",gap:1}}>{watchlist.symbols?.map(symbol=><Chip color="primary" key={symbol} label={symbol}/>)}</Stack><Typography color="text.secondary" variant="body2">{watchlist.authorName}</Typography></Stack></DashboardPanel>{canManage?<DashboardPanel title="Edit watchlist"><Box action={isReview?undefined:updateCommunityServerWatchlistAction} component="form"><input name="communitySlug" type="hidden" value={communitySlug}/><input name="watchlistId" type="hidden" value={watchlistId}/><Stack spacing={2}><TextField defaultValue={watchlist.title} label="Watchlist title" name="title" required/><TextField defaultValue={watchlist.symbols?.join(", ")} label="Symbols" name="symbols" required/><TextField defaultValue={watchlist.description} label="Notes" minRows={3} multiline name="description"/><TextField defaultValue={watchlist.publishingMode??"tracked_page"} label="Publishing" name="publishingMode" select><MenuItem value="tracked_page">Tracked TraderLink page</MenuItem><MenuItem value="discord_post">Full Discord post</MenuItem></TextField><Stack direction="row" spacing={1}><Button disabled={isReview} name="status" type="submit" value="published" variant="contained">Save watchlist</Button><Button color="error" disabled={isReview} name="status" type="submit" value="archived" variant="outlined">Archive watchlist</Button></Stack></Stack></Box></DashboardPanel>:null}</DashboardPage>;
}
