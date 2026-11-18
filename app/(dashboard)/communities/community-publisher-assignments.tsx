"use client";
import {useState} from "react";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import {DashboardPanel} from "@/app/dashboard-ui";
import {CommunityPublicationForm} from "./community-publication-form";
import {saveCommunityChannelWithFeedback,removeCommunityChannelWithFeedback} from "./community-setup-feedback-actions";
import type {TraderLinkCommunityDashboardSnapshot,TraderLinkCommunityChannel} from "@/src/modules/communities/contracts/traderlink-community-platform-contracts";
import type {CommunityDiscordResources} from "@/src/modules/communities/contracts/community-discord-resources";

export function CommunityPublisherAssignments({snapshot,resources,disabled}:{snapshot:TraderLinkCommunityDashboardSnapshot;resources:CommunityDiscordResources|null;disabled:boolean}){
 const [editing,setEditing]=useState<TraderLinkCommunityChannel|null>(null);
 const [adding,setAdding]=useState(false);
 const [removing,setRemoving]=useState<string|null>(null);
 const users=snapshot.publishing?.team??[];
 return <DashboardPanel title="Discord publishing"><Stack spacing={2}>
 <Typography color="text.secondary">Choose which Discord channels receive alerts and watchlists, and which team members can publish to each channel.</Typography>
 {snapshot.channels.map(channel=>{
 const selected=snapshot.publishing?.assignments[channel.destinationId]??[];
 return <Stack key={channel.destinationId} spacing={1} sx={{border:1,borderColor:"divider",borderRadius:2,p:2}}>
 <Typography sx={{fontWeight:800}}>#{channel.name}</Typography><Typography>Receives: {channel.contentType==="alerts"?"Trade Alerts":channel.contentType==="watchlists"?"Watchlists":channel.contentType==="coaching"?"Coaching":"General"} · {channel.status}</Typography>
 {channel.contentType==="alerts"||channel.contentType==="watchlists"?<Typography>Allowed publishers: {selected.map(subject=>subject.kind==="user"?users.find(user=>user.userId===subject.id)?.displayName??"Unavailable team member":`Existing role: ${resources?.roles.find(role=>role.id===subject.id)?.name??"unavailable"}`).join(", ")||"No publishers assigned"}. The verified server owner can also publish.</Typography>:null}
 <Stack direction="row" spacing={1}><Button disabled={disabled||!resources} onClick={()=>{setEditing(channel);setAdding(false);setRemoving(null);}}>Edit</Button><Button color="error" disabled={disabled||channel.status!=="active"} onClick={()=>setRemoving(channel.destinationId)}>Remove</Button></Stack>
 {removing===channel.destinationId?<CommunityPublicationForm action={removeCommunityChannelWithFeedback} disabled={disabled}><input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="destinationId" value={channel.destinationId}/><Typography>Stop future delivery to this destination? Sent messages and delivery history will be kept.</Typography><Button color="error" type="submit">Confirm removal</Button><Button onClick={()=>setRemoving(null)}>Cancel</Button></CommunityPublicationForm>:null}
 </Stack>;
 })}
 {!snapshot.channels.length?<Typography>No publishing destinations yet.</Typography>:null}
 <Button disabled={disabled||!resources} onClick={()=>{setEditing(null);setAdding(true);}}>Add destination</Button>
 {adding||editing?<DestinationForm key={editing?.destinationId??"new"} snapshot={snapshot} resources={resources} disabled={disabled} channel={editing} onCancel={()=>{setAdding(false);setEditing(null);}}/>:null}
 {!resources?<Typography role="status">Discord channels are unavailable. Refresh access before editing destinations.</Typography>:null}
 </Stack></DashboardPanel>;
}
function DestinationForm({snapshot,resources,disabled,channel,onCancel}:{snapshot:TraderLinkCommunityDashboardSnapshot;resources:CommunityDiscordResources|null;disabled:boolean;channel:TraderLinkCommunityChannel|null;onCancel:()=>void}){
 const [kind,setKind]=useState(channel?.contentType??"alerts");
 const selected=channel?snapshot.publishing?.assignments[channel.destinationId]??[]:[];
 const users=snapshot.publishing?.team??[];
 const legacyRoles=selected.filter(subject=>subject.kind==="role");
 return <CommunityPublicationForm action={saveCommunityChannelWithFeedback} disabled={disabled||!resources}><input name="communitySlug" type="hidden" value={snapshot.community.slug}/><input name="destinationId" type="hidden" value={channel?.destinationId??""}/><input name="expectedAssignments" type="hidden" value={JSON.stringify(selected)}/>
 <Stack spacing={2}><Typography component="h3" variant="h3">{channel?"Edit destination":"Add destination"}</Typography>
 {channel?<><input type="hidden" name="discordChannelId" value={channel.discordChannelId}/><input type="hidden" name="contentType" value={channel.contentType}/><Typography>#{channel.name} · {channel.contentType}</Typography><Typography color="text.secondary">To change the channel or content type, remove this destination and add another. This keeps earlier deliveries linked to their original destination.</Typography></>:<><TextField label="Discord channel" name="discordChannelId" required select defaultValue="">{resources?.channels.map(item=><MenuItem key={item.id} value={item.id} disabled={!item.canPublish}>#{item.name}{item.canPublish?"":" - Bot access required"}</MenuItem>)}</TextField><TextField label="Content sent here" name="contentType" select value={kind} onChange={event=>setKind(event.target.value as typeof kind)}><MenuItem value="alerts">Trade Alerts</MenuItem><MenuItem value="watchlists">Watchlists</MenuItem><MenuItem value="coaching">Coaching</MenuItem><MenuItem value="general">General</MenuItem></TextField></>}
 {kind==="alerts"||kind==="watchlists"?<><Typography sx={{fontWeight:700}}>Allowed publishers</Typography><Typography color="text.secondary">Select individual team members. They also need the corresponding publishing responsibility from Roles and access. The verified server owner can publish to every configured destination.</Typography>{users.map(user=><FormControlLabel key={user.userId} label={user.displayName} control={<Checkbox name="publisherUserId" value={user.userId} defaultChecked={selected.some(subject=>subject.kind==="user"&&subject.id===user.userId)}/>}/>)}{selected.filter(subject=>subject.kind==="user"&&!users.some(user=>user.userId===subject.id)).map(subject=><FormControlLabel key={subject.id} label="Unavailable team publisher - uncheck to remove" control={<Checkbox name="publisherUserId" value={subject.id} defaultChecked/>}/>)}{legacyRoles.length?<><Typography color="warning.main">Existing role assignments remain until you explicitly remove them. Replace them with individual publishers above.</Typography>{legacyRoles.map(subject=><FormControlLabel key={subject.id} label={`Remove existing role assignment: ${resources?.roles.find(role=>role.id===subject.id)?.name??"unavailable role"}`} control={<Checkbox name="removePublisherRoleId" value={subject.id}/>}/>)}</>:null}</>:null}
 <Typography color="text.secondary">Saving does not send a Discord post.</Typography><Button type="submit" variant="contained">Save destination</Button><Button onClick={onCancel}>Cancel</Button></Stack></CommunityPublicationForm>;
}
