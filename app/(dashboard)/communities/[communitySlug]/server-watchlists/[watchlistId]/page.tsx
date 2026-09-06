import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";

export default async function ServerWatchlistPage({params}:{params:Promise<{communitySlug:string;watchlistId:string}>}){
  const {communitySlug,watchlistId}=await params;
  const {snapshot}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/server-watchlists/${watchlistId}`);
  const watchlist=snapshot.watchlists.find(item=>item.sourceKind==="server"&&item.watchlistId===watchlistId);
  if(!watchlist)notFound();
  return <DashboardPage><Button component={Link} href={`/communities/${communitySlug}/watchlists`} startIcon={<ArrowBackRoundedIcon/>}>Back to watchlists</Button><DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" spacing={1} sx={{alignItems:"center"}}><Chip color="warning" label="Server watchlist"/><Chip color="success" label="Private community" variant="outlined"/></Stack><Typography component="h1" variant="h1">{watchlist.title}</Typography>{watchlist.description?<Typography color="text.secondary">{watchlist.description}</Typography>:null}<Stack direction="row" sx={{flexWrap:"wrap",gap:1}}>{watchlist.symbols?.map(symbol=><Chip color="primary" key={symbol} label={symbol}/>)}</Stack><Typography color="text.secondary" variant="body2">Published by {watchlist.authorName}. Access follows your current Discord roles.</Typography></Stack></DashboardPanel></DashboardPage>;
}
