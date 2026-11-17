import {CommunityNavigation} from "../../../community-navigation";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { loadCommunityPublishingDashboard as loadCommunityDashboard } from "../../../community-publication-dashboard-loader";

export default async function CommunityAlertPage({params}:{params:Promise<{communitySlug:string;alertSlug:string}>}) {
  const {communitySlug,alertSlug}=await params;
  const {snapshot}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/alerts/${alertSlug}`);
  const alert=snapshot.alerts.find(item=>item.slug===alertSlug||item.alertId===alertSlug);
  if(!alert)notFound();
  return <DashboardPage><CommunityNavigation snapshot={snapshot}/>
    <Box component="a" href={`/communities/${communitySlug}/alerts`} sx={{color:"primary.main",fontWeight:800,textDecoration:"none"}}>← Back to alerts</Box>
    <DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" spacing={1} sx={{alignItems:"center",flexWrap:"wrap"}}><CampaignRoundedIcon color="primary"/>{alert.symbol?<Chip color="primary" label={alert.symbol}/>:null}<Chip color={alert.publishingMode==="tracked_page"?"success":"warning"} label={alert.publishingMode==="tracked_page"?"Tracked page":"Discord post"} variant="outlined"/></Stack><Typography component="h1" variant="h1">{alert.title}</Typography><Typography sx={{fontSize:"1.05rem",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{alert.body}</Typography><Stack direction="row" spacing={1.25} sx={{alignItems:"center"}}><Avatar alt={`${alert.authorName} profile picture`} src={alert.authorAvatarUrl??undefined}>{alert.authorName.trim().split(/\s+/).map(part=>part[0]).slice(0,2).join("").toUpperCase()}</Avatar><Box><Typography sx={{fontWeight:800}}>Published by {alert.authorName}</Typography><Typography color="text.secondary" variant="body2">{alert.publishedAtUtc?new Date(alert.publishedAtUtc).toLocaleString("en-US",{timeZone:"UTC"})+" UTC":"Draft"}</Typography></Box></Stack></Stack></DashboardPanel>
  </DashboardPage>;
}
