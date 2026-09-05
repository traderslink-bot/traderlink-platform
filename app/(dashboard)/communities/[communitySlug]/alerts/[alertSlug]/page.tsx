import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";

export default async function CommunityAlertPage({params}:{params:Promise<{communitySlug:string;alertSlug:string}>}){const {communitySlug,alertSlug}=await params;const {snapshot}=await loadCommunityDashboard(communitySlug);const alert=snapshot.alerts.find(item=>item.slug===alertSlug);if(!alert)notFound();return <DashboardPage><ButtonBack href={`/communities/${communitySlug}/alerts`}/><DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" spacing={1} sx={{alignItems:"center"}}><CampaignRoundedIcon color="primary"/>{alert.symbol?<Chip color="primary" label={alert.symbol}/>:null}<Chip label={snapshot.audiences.find(a=>a.audienceId===alert.audienceId)?.name??"Community"}/></Stack><Typography component="h1" variant="h1">{alert.title}</Typography><Typography sx={{fontSize:"1.05rem",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{alert.body}</Typography><Typography color="text.secondary" variant="body2">Posted by {alert.authorName} · {alert.publishedAtUtc?new Date(alert.publishedAtUtc).toLocaleString("en-US",{timeZone:"UTC"})+" UTC":"Draft"}</Typography></Stack></DashboardPanel><Typography color="text.secondary" variant="caption">This alert belongs to {snapshot.community.displayName}. TraderLink provides the private page and Discord-role access; the author controls the alert.</Typography></DashboardPage>}
function ButtonBack({href}:{href:string}){return <Box component="a" href={href} sx={{color:"primary.main",fontWeight:800,textDecoration:"none"}}>← Back to alerts</Box>}
