"use client";
import {useState} from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import type {CommunityDiscordResources} from "@/src/modules/communities/contracts/community-discord-resources";
import {CommunityNavigation} from "./community-navigation";
import {CommunityCoachingFeedbackForm as CommunityPublicationForm} from "./community-coaching-feedback-form";
import {saveCommunityRoleWithFeedback,setCommunityPauseWithFeedback,pauseCommunityDiscordRoleFeaturesAction,saveCommunitySettingsAction,changeCommunityLifecycleWithFeedback} from "./community-management-actions";
function has(snapshot:TraderLinkCommunityDashboardSnapshot,key:string){return snapshot.viewer.capabilities.includes(key as never);}
export function CommunityManagementDashboard({snapshot,section,isReview=false,discordResources=null}:{snapshot:TraderLinkCommunityDashboardSnapshot;section:"manage"|"roles"|"settings";isReview?:boolean;discordResources?:CommunityDiscordResources|null}){
 return <DashboardPage><CommunityNavigation snapshot={snapshot}/>{section==="manage"?<OwnerDashboard snapshot={snapshot}/>:section==="roles"?<Team snapshot={snapshot} isReview={isReview} discordResources={discordResources}/>:<Settings snapshot={snapshot} isReview={isReview} discordResources={discordResources}/>}</DashboardPage>;
}
function OwnerDashboard({snapshot}:{snapshot:TraderLinkCommunityDashboardSnapshot}){
 const items=[{label:"Roles and access",section:"roles",permission:"community.roles.manage"},{label:"Settings",section:"settings",permission:"community.manage"}].filter(item=>snapshot.community.isOwner||has(snapshot,item.permission));
 return <DashboardPanel title="Manage"><Grid container spacing={2}>{items.map(item=><Grid key={item.section} size={{xs:12,sm:6,lg:4}}><Button component={Link} href={`/communities/${snapshot.community.slug}/manage/${item.section}`} fullWidth variant="outlined">{item.label}</Button></Grid>)}
    {snapshot.community.isOwner ? (
      <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
        <Button component={Link} href={`/communities/${snapshot.community.slug}/partner-channels`} fullWidth variant="outlined">
          Publish partner channels
        </Button>
      </Grid>
    ) : null}
  </Grid></DashboardPanel>;
}
const fixedResponsibilities=[
  {key:"coaching-access",label:"Access coaching"},
  {key:"coach",label:"Work as a coach"},
  {key:"community-admin",label:"Community Admin"},
] as const;
const communityCapabilityLabels:Readonly<Record<string,string>>={
  "community.admin":"Community Admin",
  "community.view":"Access community",
  "community.manage":"Manage community",
  "community.team.manage":"Manage team",
  "community.roles.manage":"Manage roles and access",
  "community.members.view":"View members",
  "community.coaching.manage_all":"Manage community coaching",
  "community.coaching.offer":"Work as a coach",
  "community.coaching.students":"Manage coaching students",
  "community.coaching.view":"Access coaching",
};
function Team({snapshot,isReview,discordResources}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean;discordResources:CommunityDiscordResources|null}){return <Grid container spacing={2}><Grid size={{xs:12,lg:7}}><DashboardPanel title="Roles and access"><Typography color="text.secondary" sx={{mb:2}}>Choose what each Discord role can access or do inside this TraderLink community. These mappings do not change Discord permissions.</Typography><Stack spacing={1.5}>{snapshot.staffRoles.map(role=><Box key={role.roleId} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}><Stack direction="row" sx={{alignItems:"start",justifyContent:"space-between"}}><Box><Typography style={{fontWeight:800}}>{role.name}</Typography></Box>{role.discordRoleIds[0]?<Box action={isReview?undefined:pauseCommunityDiscordRoleFeaturesAction} component="form"><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="discordRoleId" type="hidden" value={role.discordRoleIds[0]}/><Button color="error" disabled={isReview} size="small" type="submit">Remove mapping</Button></Box>:null}</Stack><Stack direction="row" sx={{flexWrap:"wrap",gap:.75,mt:1}}>{role.capabilities.filter(capability=>capability!=="community.view"&&Object.hasOwn(communityCapabilityLabels,capability)).map((capability,index)=><Chip color={index%3===0?"success":index%3===1?"warning":"error"} key={capability} label={communityCapabilityLabels[capability]??capability} size="small" variant="outlined"/>)}</Stack></Box>)}</Stack>{!snapshot.staffRoles.length?<Typography color="text.secondary">No server-feature roles are mapped yet.</Typography>:null}</DashboardPanel></Grid><Grid size={{xs:12,lg:5}}><DashboardPanel title="Map a Discord role"><CommunityPublicationForm action={saveCommunityRoleWithFeedback} disabled={isReview}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><Stack spacing={1.5}><TextField defaultValue="" disabled={!discordResources} label="Discord role" name="discordRoleId" required select>{discordResources?.roles.map(role=><MenuItem key={role.id} value={role.id}>{role.name}</MenuItem>)}</TextField>{!discordResources?<Chip color="warning" label="Discord roles unavailable"/>:null}{[{label:"Content access",keys:["coaching-access"]},{label:"Team responsibilities",keys:["coach","community-admin"]}].map(group=><Box component="fieldset" key={group.label} sx={{border:1,borderColor:"divider",borderRadius:2,p:1.5}}><Typography component="legend" sx={{fontWeight:800}}>{group.label}</Typography><Stack>{fixedResponsibilities.filter(item=>group.keys.includes(item.key)).map(item=><FormControlLabel control={<Checkbox name="responsibilities" value={item.key}/>} key={item.key} label={item.label}/>)}</Stack></Box>)}<Button disabled={isReview||!discordResources?.roles.length} type="submit" variant="contained">Save role mapping</Button></Stack></CommunityPublicationForm></DashboardPanel></Grid></Grid>}
function Settings({snapshot,isReview,discordResources}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview:boolean;discordResources:CommunityDiscordResources|null}){const [confirmStatus,setConfirmStatus]=useState(false);return <Grid container spacing={2}><Grid size={{xs:12,lg:7}}><DashboardPanel title="Community identity"><Typography sx={{mb:1}}>Connected Discord server: {discordResources?.guildName??"Unable to verify - refresh Discord access"}</Typography><Typography color="text.secondary" sx={{mb:2}} variant="body2">Editing the community name and description here does not rename your Discord server.</Typography><Box action={isReview?undefined:saveCommunitySettingsAction} component="form"><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><Stack spacing={2}><TextField defaultValue={snapshot.community.displayName} fullWidth label="Community name" name="displayName"/><TextField defaultValue={snapshot.settings.description} fullWidth label="Community description" minRows={4} multiline name="description"/><Button disabled={isReview} type="submit" variant="contained">Save settings</Button></Stack></Box></DashboardPanel></Grid>{snapshot.community.isOwner?<Grid size={12}><DashboardPanel title="Community connection"><Stack spacing={2}><Chip label={snapshot.community.status==="active"?"Active":snapshot.community.status==="paused"?"Paused":snapshot.community.status} color={snapshot.community.status==="active"?"success":"warning"}/><Typography>Discord bot access: {discordResources?"Verified":snapshot.lifecycle?.botState==="not_installed"?"Bot not installed. Install it again, then reconnect.":"Unable to verify. Check the bot installation and Discord access."}</Typography><Typography color="text.secondary">Pausing stops active community use and delivery. It preserves records and does not uninstall the bot.</Typography>{snapshot.community.status==="active"||snapshot.community.status==="paused"?<><Button disabled={isReview} variant="outlined" onClick={()=>setConfirmStatus(true)}>{snapshot.community.status==="active"?"Pause community":"Resume community"}</Button>{confirmStatus?<CommunityPublicationForm action={setCommunityPauseWithFeedback} disabled={isReview}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="communityStatus" type="hidden" value={snapshot.community.status==="active"?"paused":"active"}/><Typography>{snapshot.community.status==="active"?"Pause this community? Member access and publishing will pause; records remain available under the existing history rules.":"Resume this community? Member access and publishing will follow the current role and channel settings."}</Typography><Button type="submit" variant="contained">{snapshot.community.status==="active"?"Confirm pause":"Confirm resume"}</Button><Button onClick={()=>setConfirmStatus(false)}>Cancel</Button></CommunityPublicationForm>:null}</>:null}<CommunityManagementLifecycleControls slug={snapshot.community.slug} disabled={isReview}/></Stack></DashboardPanel></Grid>:null}</Grid>}
export function CommunityManagementLifecycleControls({slug,removed=false,recoverable=false,disabled=false}:{slug:string;removed?:boolean;recoverable?:boolean;disabled?:boolean}){
 const [confirm,setConfirm]=useState(false);
 return <Stack spacing={2}>{!removed||recoverable?<CommunityPublicationForm action={changeCommunityLifecycleWithFeedback} disabled={disabled}><input name="communitySlug" type="hidden" value={slug}/><input name="operation" type="hidden" value={removed?"recover":"reconnect"}/><Typography color="text.secondary">{removed?"Recover settings into a paused community. This does not resend old deliveries.":"After installing the Discord bot again, reconnect to verify ownership and restore the existing connection. Old deliveries will not be resent."}</Typography><Button type="submit" variant="outlined">{removed?"Recover community":"Reconnect Discord"}</Button></CommunityPublicationForm>:null}{!removed?<><Button color="error" disabled={disabled} onClick={()=>setConfirm(true)}>Remove community</Button>{confirm?<CommunityPublicationForm action={changeCommunityLifecycleWithFeedback} disabled={disabled}><input name="communitySlug" type="hidden" value={slug}/><input name="operation" type="hidden" value="remove"/><Typography>Remove this community from active use? Publishing stops. Settings have a 30-day recovery window. Personal Journals remain untouched and original participants retain read-only coaching history.</Typography><FormControlLabel label="I understand and want to remove this community" control={<Checkbox required name="confirmRemoval"/>}/><Button type="submit" color="error" variant="contained">Confirm removal</Button><Button onClick={()=>setConfirm(false)}>Cancel</Button></CommunityPublicationForm>:null}</>:null}</Stack>;
}
