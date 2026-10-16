"use client";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {DashboardPanel} from "@/app/dashboard-ui";
import {CommunityPublicationForm} from "./community-publication-form";
import {saveCommunityPublishersWithFeedback} from "./community-setup-feedback-actions";
import type {TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CommunityDiscordResources} from "@/src/modules/communities/contracts/community-discord-resources";
export function CommunityPublisherAssignments({snapshot,resources,disabled}:{snapshot:TraderLinkCommunityDashboardSnapshot;resources:CommunityDiscordResources|null;disabled:boolean}){
 return <DashboardPanel title="Allowed publishers"><Stack spacing={2}>{snapshot.channels.filter(channel=>channel.contentType==="alerts"||channel.contentType==="watchlists").map(channel=>{
 const selected=snapshot.publishing?.assignments[channel.destinationId]??[];
 const users=snapshot.publishing?.team??[];
 const stale=selected.filter(subject=>subject.kind==="user"?!users.some(user=>user.userId===subject.id):!resources?.roles.some(role=>role.id===subject.id));
 return <CommunityPublicationForm key={`${channel.destinationId}:${JSON.stringify(selected)}`} action={saveCommunityPublishersWithFeedback} disabled={disabled||!resources}>
 <input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="destinationId" value={channel.destinationId}/>
 <Stack spacing={1}><Typography component="h3" variant="h3">#{channel.name} · {channel.contentType==="alerts"?"Alerts":"Watchlists"}</Typography><Typography variant="body2">Bot access: {resources?(resources.channels.find(item=>item.id===channel.discordChannelId)?.canPublish?"Can publish":"Unavailable — check Discord channel permissions"):"Not verified"}</Typography><Typography variant="body2">{selected.length?`${selected.length} publisher assignments`:"No publishers assigned"}. The verified owner can publish to this destination. Other publishers need both a publishing responsibility and an individual or Discord-role assignment.</Typography>
 <Typography sx={{fontWeight:700}}>Team members</Typography>{users.map(user=><FormControlLabel key={user.userId} label={user.displayName} control={<Checkbox name="publisherUserId" value={user.userId} defaultChecked={selected.some(subject=>subject.kind==="user"&&subject.id===user.userId)}/>}/>)}
 <Typography sx={{fontWeight:700}}>Discord roles</Typography>{resources?.roles.map(role=><FormControlLabel key={role.id} label={role.name} control={<Checkbox name="publisherRoleId" value={role.id} defaultChecked={selected.some(subject=>subject.kind==="role"&&subject.id===role.id)}/>}/>)}
 {stale.map(subject=><FormControlLabel key={`${subject.kind}:${subject.id}`} label={`Unavailable ${subject.kind==="user"?"team member":"Discord role"} — uncheck to remove`} control={<Checkbox name={subject.kind==="user"?"publisherUserId":"publisherRoleId"} value={subject.id} defaultChecked/>}/>)}
 <Typography variant="body2">Individual and role assignments combine. Removing an individual assignment does not remove access granted through a role.</Typography>
 {!resources?<Typography role="status">Discord roles are unavailable. Refresh access before editing assignments.</Typography>:null}<Button type="submit" variant="contained">Save publisher access</Button></Stack></CommunityPublicationForm>;
 })}{!snapshot.channels.some(channel=>channel.contentType==="alerts"||channel.contentType==="watchlists")?<Typography>Add an alerts or watchlists channel above before assigning publishers.</Typography>:null}</Stack></DashboardPanel>;
}
