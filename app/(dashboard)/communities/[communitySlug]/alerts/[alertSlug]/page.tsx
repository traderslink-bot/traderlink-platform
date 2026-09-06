import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { notFound } from "next/navigation";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import { updateCommunityAlertAction } from "../../../community-actions";
import { loadCommunityDashboard } from "../../../community-dashboard-loader";

export default async function CommunityAlertPage({params}:{params:Promise<{communitySlug:string;alertSlug:string}>}) {
  const {communitySlug,alertSlug}=await params;
  const {snapshot,isReview}=await loadCommunityDashboard(communitySlug,`/communities/${communitySlug}/alerts/${alertSlug}`);
  const alert=snapshot.alerts.find(item=>item.slug===alertSlug);
  if(!alert)notFound();
  const canEdit=alert.authorUserId===snapshot.viewer.userId||snapshot.viewer.capabilities.includes("community.alerts.manage_all");
  if(alert.publishingMode==="discord_post"&&!canEdit)notFound();
  return <DashboardPage>
    <Box component="a" href={`/communities/${communitySlug}/alerts`} sx={{color:"primary.main",fontWeight:800,textDecoration:"none"}}>← Back to alerts</Box>
    <DashboardPanel hideHeader><Stack spacing={2}><Stack direction="row" spacing={1} sx={{alignItems:"center",flexWrap:"wrap"}}><CampaignRoundedIcon color="primary"/>{alert.symbol?<Chip color="primary" label={alert.symbol}/>:null}<Chip color={alert.publishingMode==="tracked_page"?"success":"warning"} label={alert.publishingMode==="tracked_page"?"Tracked page":"Discord post"} variant="outlined"/></Stack><Typography component="h1" variant="h1">{alert.title}</Typography><Typography sx={{fontSize:"1.05rem",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{alert.body}</Typography><Typography color="text.secondary" variant="body2">{alert.authorName} · {alert.publishedAtUtc?new Date(alert.publishedAtUtc).toLocaleString("en-US",{timeZone:"UTC"})+" UTC":"Draft"}</Typography></Stack></DashboardPanel>
    {canEdit?<DashboardPanel title="Edit alert"><Box action={isReview?undefined:updateCommunityAlertAction} component="form"><input name="communitySlug" type="hidden" value={communitySlug}/><input name="alertId" type="hidden" value={alert.alertId}/><Stack spacing={2}><TextField defaultValue={alert.title} label="Title" name="title" required/><TextField defaultValue={alert.symbol??""} label="Ticker" name="symbol"/><TextField defaultValue={alert.body} label="Alert" minRows={4} multiline name="body" required/><TextField defaultValue={alert.publishingMode} label="Publishing" name="publishingMode" select><MenuItem value="tracked_page">Tracked TraderLink page</MenuItem><MenuItem value="discord_post">Full Discord post</MenuItem></TextField><TextField defaultValue={alert.audienceId} label="Audience" name="audienceId" select>{snapshot.audiences.filter(item=>item.status==="active").map(item=><MenuItem key={item.audienceId} value={item.audienceId}>{item.name}</MenuItem>)}</TextField><Stack direction="row" spacing={1}><Button disabled={isReview} name="status" type="submit" value="published" variant="contained">Save alert</Button><Button color="error" disabled={isReview} name="status" type="submit" value="archived" variant="outlined">Archive alert</Button></Stack></Stack></Box></DashboardPanel>:null}
  </DashboardPage>;
}
