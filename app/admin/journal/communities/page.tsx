import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { DashboardMetricCard, DashboardPanel } from "@/app/dashboard-ui";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { configureCommunityCoachFeeAction, configureCommunityPartnerAction, setCommunityStatusAction } from "@/app/(dashboard)/admin/communities/admin-actions";

type CommunityRow=Readonly<{communityId:string;slug:string;name:string;status:string;guildId:string;members:number;coaches:number;alerts:number;watchlists:number;pending:number}>;

export default async function JournalCommunitiesAdminPage(){
  const snapshot=await withJournalAdminPageDatabase((database)=>{
    const rows=database.prepare(`SELECT c.community_id communityId,c.slug,c.display_name name,c.status,c.discord_guild_id guildId,
  (SELECT count(*) FROM traderlink_community_memberships m WHERE m.community_id=c.community_id AND m.status='active') members,
  (SELECT count(*) FROM traderlink_community_coach_profiles p WHERE p.community_id=c.community_id AND p.status='active') coaches,
  (SELECT count(*) FROM traderlink_community_alerts a WHERE a.community_id=c.community_id AND a.status='published') alerts,
  ((SELECT count(*) FROM traderlink_community_watchlist_placements w WHERE w.community_id=c.community_id AND w.status='published')+
   (SELECT count(*) FROM traderlink_community_server_watchlists w WHERE w.community_id=c.community_id AND w.status='published')) watchlists,
  (SELECT count(*) FROM traderlink_community_content_deliveries d WHERE d.community_id=c.community_id AND d.status IN ('pending','sending','failed')) pending
FROM traderlink_communities c ORDER BY c.updated_at_utc DESC`).all() as CommunityRow[];
    return Object.freeze({rows:Object.freeze(rows),members:rows.reduce((sum,row)=>sum+row.members,0),content:rows.reduce((sum,row)=>sum+row.alerts+row.watchlists,0),pending:rows.reduce((sum,row)=>sum+row.pending,0)});
  });
  return <Stack spacing={3}>
    <Stack direction="row" spacing={1} sx={{alignItems:"center"}}><ForumRoundedIcon color="primary"/><Typography component="h1" variant="h1">Communities</Typography></Stack>
    <Grid container spacing={2}><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption={`${snapshot.rows.filter(row=>row.status==="active").length} active`} label="Discord servers" value={String(snapshot.rows.length)}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Verified Discord memberships" label="Members" value={snapshot.members.toLocaleString()}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Alerts and watchlists" label="Published content" value={snapshot.content.toLocaleString()}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Pending, sending or failed" label="Delivery queue" value={snapshot.pending.toLocaleString()}/></Grid></Grid>
    <DashboardPanel title="Connected Discord servers"><Stack spacing={1.5}>{snapshot.rows.map(row=><Stack direction={{xs:"column",md:"row"}} key={row.slug} sx={{alignItems:{md:"center"},border:1,borderColor:"divider",borderRadius:2,justifyContent:"space-between",p:2}}><Stack><Typography style={{fontWeight:800}}>{row.name}</Typography><Typography color="text.secondary" variant="caption">Guild {row.guildId} · {row.members} members · {row.coaches} coaches · {row.alerts} alerts · {row.watchlists} watchlists · {row.status}</Typography></Stack><Button component={Link} href={`/communities/${row.slug}/manage`} size="small" variant="outlined">Open server dashboard</Button></Stack>)}{!snapshot.rows.length?<Typography color="text.secondary">No Discord servers have been connected.</Typography>:null}</Stack></DashboardPanel>
    <Grid container spacing={2}>
      <Grid size={{xs:12,lg:6}}><DashboardPanel title="Tier 2 partner terms"><Box action={configureCommunityPartnerAction} component="form"><Stack spacing={2}><CommunitySelect rows={snapshot.rows}/><TextField defaultValue="disabled" label="Status" name="status" select><MenuItem value="disabled">Disabled</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="paused">Paused</MenuItem></TextField><TextField helperText="Leave blank until you decide the server's share." label="Commission percent" name="commissionPercent" type="number"/><TextField defaultValue={90} label="Attribution window in days" name="attributionDays" type="number"/><TextField defaultValue="USD" label="Currency" name="currency"/><Button disabled={!snapshot.rows.length} type="submit" variant="contained">Save partner terms</Button></Stack></Box></DashboardPanel></Grid>
      <Grid size={{xs:12,lg:6}}><DashboardPanel title="Optional future coach fee"><Box action={configureCommunityCoachFeeAction} component="form"><Stack spacing={2}><CommunitySelect rows={snapshot.rows}/><TextField helperText="Leave blank to apply the rule to every coach in this server." label="Specific coach user ID" name="coachUserId"/><TextField label="Fee percent" name="feePercent" type="number" required/><TextField defaultValue="disabled" label="Status" name="status" select><MenuItem value="disabled">Disabled</MenuItem><MenuItem value="active">Active</MenuItem></TextField><TextField label="Internal notes" minRows={2} multiline name="notes"/><Button disabled={!snapshot.rows.length} type="submit" variant="contained">Save fee rule</Button><Typography color="text.secondary" variant="caption">TraderLink does not process coaching payments in this pilot. This control stays disabled until a compatible provider is selected.</Typography></Stack></Box></DashboardPanel></Grid>
    </Grid>
    <Grid container spacing={2}><Grid size={{xs:12,md:6}}><DashboardPanel title="Server status"><Box action={setCommunityStatusAction} component="form"><Stack spacing={2}><CommunitySelect rows={snapshot.rows}/><TextField defaultValue="active" label="New status" name="status" select><MenuItem value="active">Active</MenuItem><MenuItem value="paused">Paused</MenuItem><MenuItem value="suspended">Suspended</MenuItem></TextField><Button disabled={!snapshot.rows.length} type="submit" variant="contained">Update server</Button></Stack></Box></DashboardPanel></Grid><Grid size={{xs:12,md:6}}><DashboardPanel title="Discord delivery queue"><Typography variant="h2">{snapshot.pending}</Typography><Typography color="text.secondary" variant="body2">Pending, sending, or failed deliveries require attention.</Typography></DashboardPanel></Grid></Grid>
  </Stack>;
}

function CommunitySelect({rows}:{rows:readonly CommunityRow[]}){return <TextField label="Community" name="communityId" select required>{rows.map(row=><MenuItem key={row.communityId} value={row.communityId}>{row.name}</MenuItem>)}</TextField>}
