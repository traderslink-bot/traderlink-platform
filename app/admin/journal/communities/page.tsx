import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";

import { DashboardMetricCard, DashboardPanel } from "@/app/dashboard-ui";
import { withJournalAdminPageDatabase } from "@/src/modules/platform/server/administration/require-journal-admin-page";
import { readCoachingDeletionArchive } from "@/src/modules/communities/server/coaching-deletion-archive";
import { configureCommunityCoachFeeAction, setCommunityStatusAction, recoverCommunityOwnerAction } from "@/app/(dashboard)/admin/communities/admin-actions";

type CommunityRow=Readonly<{communityId:string;slug:string;name:string;status:string;guildId:string;members:number;coaches:number;alerts:number;watchlists:number;pending:number}>;
type AdminItem=Readonly<{community:string;name:string;detail:string;status:string}>;
type FeeRule=Readonly<{id:string;community:string;coach:string;percent:number;minimum:number|null;currency:string|null;durationCount:number|null;durationUnit:string|null}>;

export default async function JournalCommunitiesAdminPage({searchParams}:{searchParams:Promise<{archive?:string;archivePage?:string;recordPage?:string}>}){
  const query=await searchParams;
  const archivePage=/^\d{1,6}$/.test(query.archivePage??'')?Number(query.archivePage):0;
  const recordPage=/^\d{1,6}$/.test(query.recordPage??'')?Number(query.recordPage):0;
  const archiveData=await withJournalAdminPageDatabase(database=>{
    const now=new Date().toISOString();
    const rows=database.prepare(`SELECT archive_id id,community_name name,created_at_utc created,expires_at_utc expires
      FROM community_deletion_archives WHERE expires_at_utc>? ORDER BY created_at_utc DESC,archive_id LIMIT 21 OFFSET ?`).all(now,archivePage*20) as {id:string;name:string;created:string;expires:string}[];
    const selected=query.archive&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(query.archive)?readCoachingDeletionArchive(database,query.archive,now,recordPage):null;
    return {rows:rows.slice(0,20),hasNext:rows.length>20,selected};
  });
  const snapshot=await withJournalAdminPageDatabase((database)=>{
    const rows=database.prepare(`SELECT c.community_id communityId,c.slug,c.display_name name,c.status,c.discord_guild_id guildId,
  (SELECT count(*) FROM traderlink_community_memberships m WHERE m.community_id=c.community_id AND m.status='active') members,
  (SELECT count(*) FROM traderlink_community_coach_profiles p WHERE p.community_id=c.community_id AND p.status='active') coaches,
  (SELECT count(*) FROM traderlink_community_alerts a WHERE a.community_id=c.community_id AND a.status='published') alerts,
  ((SELECT count(*) FROM traderlink_community_watchlist_placements w WHERE w.community_id=c.community_id AND w.status='published')+
   (SELECT count(*) FROM traderlink_community_server_watchlists w WHERE w.community_id=c.community_id AND w.status='published')) watchlists,
  (SELECT count(*) FROM traderlink_community_content_deliveries d WHERE d.community_id=c.community_id AND d.status IN ('pending','sending','failed')) pending
FROM traderlink_communities c ORDER BY c.updated_at_utc DESC`).all() as CommunityRow[];
    const owners=database.prepare(`SELECT c.display_name community,u.display_name name,c.discord_guild_id detail,c.status FROM traderlink_communities c JOIN platform_users u ON u.user_id=c.owner_user_id ORDER BY c.display_name`).all() as AdminItem[];
    const staff=database.prepare(`WITH staff_roles AS (
      SELECT a.community_id,a.user_id,a.role_id FROM traderlink_community_member_role_assignments a WHERE a.status='active'
      UNION
      SELECT mapping.community_id,membership.user_id,mapping.role_id
      FROM traderlink_community_discord_role_mappings mapping
      JOIN traderlink_communities community ON community.community_id=mapping.community_id
      JOIN traderlink_community_memberships membership ON membership.community_id=community.community_id AND membership.status='active'
      JOIN platform_discord_memberships discord ON discord.user_id=membership.user_id AND discord.guild_id=community.discord_guild_id
      JOIN json_each(discord.role_ids_json) role ON role.value=mapping.discord_role_id
      WHERE mapping.status='active'
    )
    SELECT c.display_name community,u.display_name name,group_concat(DISTINCT r.name) detail,'active' status
    FROM staff_roles staff JOIN traderlink_communities c ON c.community_id=staff.community_id
    JOIN platform_users u ON u.user_id=staff.user_id AND u.status='active'
    JOIN traderlink_community_roles r ON r.role_id=staff.role_id AND r.community_id=staff.community_id AND r.status='active'
    GROUP BY c.community_id,u.user_id ORDER BY c.display_name,u.display_name`).all() as AdminItem[];
    const content=database.prepare(`SELECT c.display_name community,u.display_name name,'Alert · '||a.title detail,a.status FROM traderlink_community_alerts a JOIN traderlink_communities c ON c.community_id=a.community_id JOIN platform_users u ON u.user_id=a.author_user_id UNION ALL SELECT c.display_name,u.display_name,'Watchlist · '||w.title,w.status FROM traderlink_community_server_watchlists w JOIN traderlink_communities c ON c.community_id=w.community_id JOIN platform_users u ON u.user_id=w.author_user_id ORDER BY community,name`).all() as AdminItem[];
    const coaches=database.prepare(`SELECT c.display_name community,p.display_name name,p.active_students||' students' detail,p.status FROM (SELECT profile.*, (SELECT count(*) FROM traderlink_community_coaching_relationships r WHERE r.coach_profile_id=profile.coach_profile_id AND r.status='active') active_students FROM traderlink_community_coach_profiles profile) p JOIN traderlink_communities c ON c.community_id=p.community_id ORDER BY c.display_name,p.display_name`).all() as AdminItem[];
    const integrations=database.prepare(`SELECT c.display_name community,d.name name,d.content_type||' · '||d.discord_channel_id detail,d.status FROM traderlink_community_discord_destinations d JOIN traderlink_communities c ON c.community_id=d.community_id ORDER BY c.display_name,d.content_type`).all() as AdminItem[];
    const audit=database.prepare(`SELECT c.display_name community,u.display_name name,e.event_type detail,e.created_at_utc status FROM traderlink_community_authorization_audit_events e JOIN traderlink_communities c ON c.community_id=e.community_id JOIN platform_users u ON u.user_id=e.actor_user_id ORDER BY e.created_at_utc DESC LIMIT 50`).all() as AdminItem[];
    const feeRules=database.prepare(`SELECT fee.fee_rule_id id,coalesce(c.display_name,'All communities') community,coalesce(u.display_name,'All coaches') coach,fee.fee_basis_points percent,fee.minimum_commission_minor minimum,fee.currency,fee.duration_count durationCount,fee.duration_unit durationUnit FROM traderlink_community_coach_fee_rules fee LEFT JOIN traderlink_communities c ON c.community_id=fee.community_id LEFT JOIN platform_users u ON u.user_id=fee.coach_user_id ORDER BY fee.updated_at_utc DESC,fee.fee_rule_id DESC LIMIT 20`).all() as FeeRule[];
    return Object.freeze({feeRules:Object.freeze(feeRules),rows:Object.freeze(rows),owners:Object.freeze(owners),staff:Object.freeze(staff),content:Object.freeze(content),coaches:Object.freeze(coaches),integrations:Object.freeze(integrations),audit:Object.freeze(audit),members:rows.reduce((sum,row)=>sum+row.members,0),contentCount:rows.reduce((sum,row)=>sum+row.alerts+row.watchlists,0),pending:rows.reduce((sum,row)=>sum+row.pending,0)});
  });
  return <Stack spacing={3}>
    <Stack direction="row" spacing={1} sx={{alignItems:"center"}}><ForumRoundedIcon color="primary"/><Typography component="h1" variant="h1">Communities</Typography></Stack>
    <DashboardPanel title="Coaching deletion archives"><Stack spacing={1.5}>
      {archiveData.rows.map(row=><Stack key={row.id} direction={{xs:'column',sm:'row'}} spacing={1} sx={{justifyContent:'space-between'}}><Typography>{row.name} · {row.created.slice(0,10)} · Expires {row.expires.slice(0,10)}</Typography><Button component={Link} href={`?archive=${row.id}&archivePage=${archivePage}`} variant="outlined">Open archive</Button></Stack>)}
      {archiveData.rows.length===0?<Typography>No active archives</Typography>:null}
      <Stack direction="row" spacing={1}>{archivePage>0?<Button component={Link} href={`?archivePage=${archivePage-1}`}>Previous</Button>:null}{archiveData.hasNext?<Button component={Link} href={`?archivePage=${archivePage+1}`}>Next</Button>:null}</Stack>
      {archiveData.selected?<Stack spacing={1}>
        {archiveData.selected.records.map(record=><Box component="details" key={record.record_id}><Typography component="summary" sx={{cursor:'pointer',fontWeight:700}}>{archiveLabel(record.record_kind)}</Typography><ArchiveFields value={JSON.parse(record.payload_json)}/></Box>)}
        {archiveData.selected.files.map(file=><Button key={file.attachment_id} component="a" href={`/api/admin/communities/coaching-archives/${query.archive}?attachment=${file.attachment_id}`} target="_blank" rel="noopener noreferrer">{file.filename}</Button>)}
        <Stack direction="row" spacing={1}>{recordPage>0?<Button component={Link} href={`?archive=${query.archive}&archivePage=${archivePage}&recordPage=${recordPage-1}`}>Previous records</Button>:null}{archiveData.selected.hasMore?<Button component={Link} href={`?archive=${query.archive}&archivePage=${archivePage}&recordPage=${recordPage+1}`}>Next records</Button>:null}</Stack>
      </Stack>:null}
    </Stack></DashboardPanel>
    <Grid container spacing={2}><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption={`${snapshot.rows.filter(row=>row.status==="active").length} active`} label="Discord servers" value={String(snapshot.rows.length)}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Verified memberships" label="Members" value={snapshot.members.toLocaleString()}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Alerts and watchlists" label="Published content" value={snapshot.contentCount.toLocaleString()}/></Grid><Grid size={{xs:6,lg:3}}><DashboardMetricCard caption="Pending or failed" label="Delivery queue" value={snapshot.pending.toLocaleString()}/></Grid></Grid>
    <DashboardPanel title="Connected Discord servers"><Stack spacing={1.5}>{snapshot.rows.map(row=><Stack direction={{xs:"column",md:"row"}} key={row.slug} sx={{alignItems:{md:"center"},border:1,borderColor:"divider",borderRadius:2,justifyContent:"space-between",p:2}}><Stack><Typography style={{fontWeight:800}}>{row.name}</Typography><Typography color="text.secondary" variant="caption">Guild {row.guildId} · {row.members} members · {row.coaches} coaches · {row.alerts} alerts · {row.watchlists} watchlists · {row.status}</Typography></Stack><Button component={Link} href={`/communities/${row.slug}/manage`} size="small" variant="outlined">Open server dashboard</Button></Stack>)}{!snapshot.rows.length?<Typography color="text.secondary">No Discord servers have been connected.</Typography>:null}</Stack></DashboardPanel>
    <Grid container spacing={2}>
      <Grid size={{xs:12,lg:6}}><DashboardPanel title="Coaching commission"><Box action={configureCommunityCoachFeeAction} component="form"><Stack spacing={2}>
        <Chip label="Disabled" color="warning" sx={{alignSelf:"flex-start"}}/>
        <CommunitySelect rows={snapshot.rows}/>
        <TextField label="Specific coach user ID" name="coachUserId"/>
        <TextField label="Commission percent" name="feePercent" type="number" required slotProps={{htmlInput:{min:0,max:100,step:"0.01"}}}/>
        <TextField label="Minimum commission per payment" name="minimumCommission" type="number" slotProps={{htmlInput:{min:0,step:"0.01"}}}/>
        <TextField label="Currency" name="currency" select defaultValue="USD"><MenuItem value="USD">USD</MenuItem><MenuItem value="CAD">CAD</MenuItem></TextField>
        <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
          <TextField label="Duration (optional)" name="durationCount" type="number" slotProps={{htmlInput:{min:1,max:36500,step:1}}}/>
          <TextField label="Duration unit" name="durationUnit" select defaultValue="days"><MenuItem value="days">Days</MenuItem><MenuItem value="weeks">Weeks</MenuItem><MenuItem value="months">Months</MenuItem></TextField>
        </Stack>
        <TextField label="Internal notes" minRows={2} multiline name="notes"/>
        <Button disabled={!snapshot.rows.length} type="submit" variant="contained">Save commission settings</Button>
      </Stack></Box></DashboardPanel></Grid>
      <Grid size={{xs:12,lg:6}}><DashboardPanel title="Saved commission settings"><Stack divider={<Divider/>}>{snapshot.feeRules.map(rule=><Stack key={rule.id} spacing={0.5} sx={{py:1.5}}><Typography fontWeight={700}>{rule.community} · {rule.coach}</Typography><Typography>{(rule.percent/100).toFixed(2)}%{rule.minimum!==null?` · Minimum ${(rule.minimum/100).toFixed(2)} ${rule.currency??""}`:""}{rule.durationCount!==null?` · ${rule.durationCount} ${rule.durationUnit}`:""}</Typography><Chip label="Disabled" color="warning" size="small" sx={{alignSelf:"flex-start"}}/></Stack>)}{snapshot.feeRules.length===0?<Typography>No saved settings</Typography>:null}</Stack></DashboardPanel></Grid>
    </Grid>
    <DashboardPanel title="Verify server owner"><Box action={recoverCommunityOwnerAction} component="form"><Stack direction={{xs:"column",md:"row"}} spacing={2}><CommunitySelect rows={snapshot.rows}/><TextField label="Owner Discord user ID" name="discordUserId" required/><Button type="submit" variant="outlined" disabled={!snapshot.rows.length}>Verify and recover</Button></Stack></Box></DashboardPanel>
    <Grid container spacing={2}><Grid size={{xs:12,md:6}}><DashboardPanel title="Server status"><Box action={setCommunityStatusAction} component="form"><Stack spacing={2}><CommunitySelect rows={snapshot.rows}/><TextField defaultValue="active" label="New status" name="status" select><MenuItem value="active">Active</MenuItem><MenuItem value="paused">Paused</MenuItem><MenuItem value="suspended">Suspended</MenuItem></TextField><Button disabled={!snapshot.rows.length} type="submit" variant="contained">Update server</Button></Stack></Box></DashboardPanel></Grid><Grid size={{xs:12,md:6}}><DashboardPanel title="Discord delivery queue"><Typography variant="h2">{snapshot.pending}</Typography><Typography color="text.secondary" variant="body2">Pending, sending, or failed deliveries require attention.</Typography></DashboardPanel></Grid></Grid>
    <Grid container spacing={2}><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.owners} title="Server owners"/></Grid><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.staff} title="Staff assignments"/></Grid><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.content} title="Community content"/></Grid><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.coaches} title="Coaches"/></Grid><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.integrations} title="Integrations"/></Grid><Grid size={{xs:12,lg:6}}><AdminList items={snapshot.audit} title="Audit"/></Grid></Grid>
  </Stack>;
}

function archiveLabel(value:string){return value.replace(/_json$/,'').replaceAll('_',' ').replace(/\b\w/g,letter=>letter.toUpperCase());}
function ArchiveFields({value}:{value:unknown}){
  if(value===null||value===undefined)return null;
  if(Array.isArray(value))return <Stack spacing={1}>{value.map((item,index)=><ArchiveFields key={index} value={item}/>)}</Stack>;
  if(typeof value!=='object')return <Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{String(value)}</Typography>;
  return <Box component="dl" sx={{m:0,p:1}}>{Object.entries(value).filter(([key,entry])=>entry!==null&&entry!==''&&!key.endsWith('_id')).map(([key,entry])=>{
    let content:unknown=entry;
    if(key.endsWith('_json')&&typeof entry==='string'){try{content=JSON.parse(entry);}catch{content=entry;}}
    if(['status','state','delivery_state','acceptance_state','record_type','visibility'].includes(key)&&typeof content==='string')content=archiveLabel(content);
    return <Box key={key} sx={{mb:1}}><Typography component="dt" fontWeight={700}>{archiveLabel(key)}</Typography><Box component="dd" sx={{m:0}}><ArchiveFields value={content}/></Box></Box>;
  })}</Box>;
}
function CommunitySelect({rows}:{rows:readonly CommunityRow[]}){return <TextField label="Community" name="communityId" select required>{rows.map(row=><MenuItem key={row.communityId} value={row.communityId}>{row.name}</MenuItem>)}</TextField>}
function AdminList({items,title}:{items:readonly AdminItem[];title:string}){return <DashboardPanel title={title}><Stack divider={<Divider/>}>{items.slice(0,20).map((item,index)=><Stack direction={{xs:"column",sm:"row"}} key={`${item.community}-${item.name}-${index}`} sx={{alignItems:{sm:"center"},justifyContent:"space-between",py:1.25}}><Box><Typography style={{fontWeight:800}}>{item.name}</Typography><Typography color="text.secondary" variant="caption">{item.community} · {item.detail}</Typography></Box><Chip color={item.status==="active"||item.status==="published"?"success":"warning"} label={item.status} size="small"/></Stack>)}</Stack></DashboardPanel>}
