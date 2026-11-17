"use client";

import { useActionState, useCallback, useEffect, useRef, useState, useSyncExternalStore, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPage, DashboardPanel } from "@/app/dashboard-ui";
import type { SharedAlertDraftState, SharedAlertRequest, SharedAlertRoute, SharedAlertsSnapshot } from "@/src/modules/communities/contracts/shared-alerts-contracts";
import { mutateSharedAlertDraft, mutateSharedAlerts } from "./shared-alerts-actions";
import { SharedAlertsReadMarker } from "./shared-alerts-read-marker";

type View = "find" | "requests" | "connections" | "history" | "activity" | "settings";
type Snapshot = SharedAlertsSnapshot;
const panelBorder = { border: 1, borderColor: "divider", borderRadius: 2, p: 2 } as const;
const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;
const initialDraftState: SharedAlertDraftState = { error: null, destination: null };

function useSharedMessageAction() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [state, action, pending] = useActionState(async (previous: SharedAlertDraftState, data: FormData) => {
    const origin = window.location.href;
    const next = await mutateSharedAlertDraft(previous, data);
    if (next.destination) { setMessage(""); if (window.location.href === origin) router.push(next.destination); }
    return next;
  }, initialDraftState);
  return { state, action, message, setMessage, pending };
}

function url(snapshot: Snapshot, values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) if (value !== undefined && value !== "") query.set(key, String(value));
  return `/communities/${snapshot.community.slug}/manage/shared-alerts?${query}`;
}
function date(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "UTC" }).format(new Date(value)) + " UTC";
}
function Submit({ children, disabled = false, color = "primary", variant = "contained" }: { children: ReactNode; disabled?: boolean; color?: "primary" | "error"; variant?: "contained" | "outlined" | "text" }) {
  const { pending } = useFormStatus();
  return <Button color={color} disabled={disabled || pending} type="submit" variant={variant}>{pending ? "Saving…" : children}</Button>;
}
function ReviewDecisionButtons({ canApprove, contentRevision }: { canApprove: boolean; contentRevision: number }) {
  const { pending } = useFormStatus();
  const [reviewedRevision, setReviewedRevision] = useState(contentRevision);
  if (reviewedRevision !== contentRevision) return <Alert severity="warning" action={
    <Button type="button" onClick={() => setReviewedRevision(contentRevision)}>Review updated post</Button>
  }>This post changed. Review the updated text before deciding.</Alert>;
  return <Stack direction="row" spacing={1} aria-busy={pending}>
    <input type="hidden" name="contentRevision" value={reviewedRevision} />
    <Button name="decision" value="approve" type="submit" variant="contained" disabled={!canApprove || pending}>Approve post</Button>
    <Button name="decision" value="reject" type="submit" color="error" variant="outlined" disabled={pending}>Decline post</Button>
  </Stack>;
}
function Fields({ snapshot, command, request, tab = "requests" }: { snapshot: Snapshot; command: string; request?: SharedAlertRequest; tab?: View }) {
  return <>
    <input name="communitySlug" type="hidden" value={snapshot.community.slug} />
    <input name="command" type="hidden" value={command} />
    <input name="tab" type="hidden" value={tab} />
    {snapshot.selected?.deliveryFilter==="approval"?<input name="approvalOnly" type="hidden" value="1" />:null}
    {request ? <><input name="requestId" type="hidden" value={request.requestId} /><input name="version" type="hidden" value={request.version} /></> : null}
  </>;
}
function deliveryChannelLabel(snapshot: Snapshot, request: SharedAlertRequest, channelId: string, authorUserId: string) {
  const name = request.routes.find(route => route.userId === authorUserId && route.channelId === channelId)?.channelName
    ?? snapshot.channels.find(channel => channel.channelId === channelId)?.name;
  return name ? `#${name}` : `Channel ${channelId}`;
}

function Channels({ snapshot, value, onChange, name="channelId", disabled=false, formError=null, retainedChannelName=null }: { snapshot: Snapshot; value: string; onChange: (value: string) => void; name?:string; disabled?:boolean; formError?: string | null; retainedChannelName?: string | null }) {
  const router = useRouter();
  const selectedAvailable = snapshot.channels.some(channel => channel.channelId === value);
  const retainedName = formError && value && !selectedAvailable ? retainedChannelName : null;
  return <Stack spacing={1}>
    {snapshot.channelError && snapshot.channelError !== formError ? <Alert severity="warning">{snapshot.channelError}</Alert> : null}
    <TextField disabled={disabled || !snapshot.channels.length} fullWidth label="Receiving Discord channel" name={name} onChange={event => onChange(event.target.value)} required select value={selectedAvailable || retainedName ? value : ""}>
      {retainedName ? <MenuItem value={value} disabled>#{retainedName}</MenuItem> : null}
      {snapshot.channels.map(channel => <MenuItem key={channel.channelId} value={channel.channelId}>#{channel.name}</MenuItem>)}
    </TextField>
    {!snapshot.channels.length && !snapshot.channelError ? <Typography variant="body2" color="text.secondary">No writable text channels were found. Check the TraderLink bot’s View Channel, Send Messages and Read Message History permissions in your server.</Typography> : null}
    <Button onClick={() => router.refresh()} size="small" sx={{ alignSelf: "flex-start" }}>Refresh channels</Button>
  </Stack>;
}
function Pages({ total, page, snapshot, tab, parameter, requestId }: { total: number; page: number; snapshot: Snapshot; tab: View; parameter: "page" | "requestPage" | "deliveryPage"; requestId?: string }) {
  const pages = Math.max(1, Math.ceil(total / snapshot.pageSize));
  return <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mt: 2 }}>
    <Typography color="text.secondary" variant="body2">{total === 0 ? "0" : `${(page - 1) * snapshot.pageSize + 1}–${Math.min(page * snapshot.pageSize, total)}`} of {total}</Typography>
    <Stack direction="row" spacing={1}>
      <Button component={Link} disabled={page <= 1} href={url(snapshot, { tab, q: snapshot.query, request: requestId, approvalOnly:parameter==="deliveryPage"&&snapshot.selected?.deliveryFilter==="approval"?"1":undefined, [parameter]: page - 1 })} size="small">Previous</Button>
      <Button component={Link} disabled={page >= pages} href={url(snapshot, { tab, q: snapshot.query, request: requestId, approvalOnly:parameter==="deliveryPage"&&snapshot.selected?.deliveryFilter==="approval"?"1":undefined, [parameter]: page + 1 })} size="small">Next</Button>
    </Stack>
  </Stack>;
}
function Directory({ snapshot }: { snapshot: Snapshot }) {
  return <DashboardPanel title="Find communities">
    <Box component="form" method="get" sx={{ mb: 2 }}>
      <input name="tab" type="hidden" value="find" />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField defaultValue={snapshot.query} fullWidth label="Search communities" name="q" slotProps={{ htmlInput: { maxLength: 80 } }} /><Button type="submit" variant="contained">Search</Button></Stack>
    </Box>
    <Grid container spacing={2}>
      {snapshot.directory.map(community => <Grid key={community.communityId} size={{ xs: 12, md: 6 }}><Box sx={panelBorder}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}><Avatar src={community.logoUrl ?? undefined} alt="">{community.name.slice(0, 1)}</Avatar><Box><Typography component="h3" variant="h6">{community.name}</Typography><Typography color="text.secondary" variant="body2">{community.slug}</Typography></Box></Stack>
          <Chip label={community.blocked ? "Requests blocked" : community.requestsOpen ? "Open to sharing requests" : "Requests closed"} size="small" sx={{ alignSelf: "flex-start" }} />
          {community.existingRequestId?<Button component={Link} href={url(snapshot,{tab:community.existingConnection?"connections":"requests",request:community.existingRequestId})} variant="outlined">{community.existingConnection?"Open connection":"Open existing request"}</Button>:<Button component={Link} disabled={community.blocked || !community.requestsOpen} href={url(snapshot, { tab: "find", compose: community.communityId })} variant="outlined">Send sharing request</Button>}
        </Stack>
      </Box></Grid>)}
    </Grid>
    {!snapshot.directory.length ? <Typography color="text.secondary">{snapshot.query ? "No connected communities match your search." : "No other connected communities are available yet."}</Typography> : null}
    <Pages total={snapshot.directoryTotal} page={snapshot.directoryPage} snapshot={snapshot} tab="find" parameter="page" />
  </DashboardPanel>;
}
function Compose({ snapshot }: { snapshot: Snapshot }) {
  const other = snapshot.composeCommunity!;
  const draft = useSharedMessageAction();
  const [direction, setDirection] = useState("send");
  const [publishers, setPublishers] = useState<string[]>([]);
  const eligible = snapshot.publishers.filter(person => person.canPublish);
  return <DashboardPanel title="Send sharing request">
    <Box action={draft.action} component="form"><Fields snapshot={snapshot} command="create" />
      <input name="otherCommunityId" type="hidden" value={other.communityId} />
      <input name="showSourceCommunityName" type="hidden" value="on" />
      <Stack spacing={2}>
        {draft.state.error ? <Alert severity="error" role="alert">{draft.state.error}</Alert> : null}
        <Typography><strong>{snapshot.community.name}</strong> and <strong>{other.name}</strong></Typography>
        <TextField label="Sharing direction" name="direction" onChange={event => setDirection(event.target.value)} select value={direction}>
          <MenuItem value="send">Send our alerts to {other.name}</MenuItem><MenuItem value="receive">Ask {other.name} to offer their analysts</MenuItem>
        </TextField>
        {direction === "send" ? <Box><Typography component="h3" variant="subtitle1">Analysts to offer</Typography>
          {eligible.map(person => <FormControlLabel key={person.userId} control={<Checkbox name="publisherId" value={person.userId} checked={publishers.includes(person.userId)} onChange={event => { const checked = event.target.checked; setPublishers(current => checked ? [...current,person.userId] : current.filter(id => id !== person.userId)); }} />} label={person.name} />)}
          {!eligible.length ? <Alert severity="warning">Give a team member Publish alerts permission before sending an offer.</Alert> : null}
          <Button component={Link} href={url(snapshot,{tab:"settings"})}>Manage publishing permissions</Button>
        </Box> : <Alert severity="info">The other owner will offer analysts first. You can then choose which analysts to receive and their channels before accepting.</Alert>}
        <TextField disabled={draft.pending} label="Message to the owner" multiline minRows={3} name="message" onChange={event => draft.setMessage(event.target.value)} required slotProps={{ htmlInput: { maxLength: 2000 } }} value={draft.message} />
        <Stack direction="row" spacing={1}><Submit disabled={(direction === "send" && !publishers.length) || other.blocked || !other.requestsOpen}>Send request</Submit><Button component={Link} href={url(snapshot, { tab: "find" })}>Cancel</Button></Stack>
      </Stack>
    </Box>
  </DashboardPanel>;
}
function RequestList({ snapshot, tab }: { snapshot: Snapshot; tab: View }) {
  return <DashboardPanel title={tab === "connections" ? "Connections" : tab === "history" ? "Request history" : tab === "activity" ? "Unread activity" : "Sharing requests"}>
    <Stack spacing={1.5}>{snapshot.requests.map(request => {
      const outgoing = request.source.communityId === snapshot.community.communityId;
      const other = outgoing ? request.receiver : request.source;
      const paused = request.sourcePaused || request.receiverPaused;
      return <Box key={request.requestId} sx={{ ...panelBorder, borderColor: snapshot.selected?.request.requestId === request.requestId ? "primary.main" : "divider" }}>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}><Typography component="h3" variant="subtitle1" sx={{ fontWeight: 800 }}>{other.name}</Typography><Stack direction="row" spacing={1}><Chip label={request.status === "active" && paused ? "Paused" : request.isConnection && request.status === "pending" ? "Changes awaiting acceptance" : request.status} size="small" />{request.unread ? <Chip color="primary" label={`${request.unread} unread updates`} size="small" /> : null}</Stack></Stack>
          <Typography color="text.secondary" variant="body2">{outgoing ? "Sending our alerts" : "Receiving their alerts"}</Typography>
          <Typography color="text.secondary" variant="body2">{request.initiatorCommunityId === snapshot.community.communityId ? "Request sent by you" : "Request received"}</Typography>
          <Typography color="text.secondary" variant="caption">{date(request.updatedAtUtc)}</Typography>
          <Button component={Link} prefetch={false} href={`${url(snapshot, { tab, request: request.requestId, requestPage: snapshot.requestPage })}#sharing-detail`} variant="outlined">{request.isConnection ? "Manage connection" : "Open request"}</Button>
        </Stack>
      </Box>;
    })}</Stack>
    {!snapshot.requests.length ? <Typography color="text.secondary">{tab === "connections" ? "No active connections yet." : "No pending sharing requests."}</Typography> : null}
    <Pages total={snapshot.requestTotal} page={snapshot.requestPage} snapshot={snapshot} tab={tab} parameter="requestPage" />
  </DashboardPanel>;
}
function ReviewAgreement({ snapshot, request }: { snapshot: Snapshot; request: SharedAlertRequest }) {
  const receiving=request.receiver.communityId===snapshot.community.communityId;
  const [showName,setShowName]=useState(request.showSourceCommunityName);
  const [selected,setSelected]=useState<string[]>(receiving ? request.routes.filter(route=>route.selected && route.offered && route.canPublish).map(route=>route.userId) : request.routes.filter(route=>route.offered && route.canPublish).map(route=>route.userId));
  const routes=receiving?request.routes.filter(r=>r.offered && r.canPublish):snapshot.publishers.filter(p=>p.canPublish).map(p=>request.routes.find(r=>r.userId===p.userId)??{...p,offered:false,selected:false,channelId:null,channelName:null,revision:1,requireApproval:false,paused:false});
  return <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} command="agree" request={request} tab={request.isConnection?"connections":"requests"} />
    <input type="hidden" name="agreed" value="on" />
    <Stack spacing={2}>
      <Typography component="h3" variant="h6">{receiving?"Choose analysts to receive":"Offer analysts"}</Typography>
      {routes.map(route=><Box key={`${route.userId}-${route.revision}`} sx={panelBorder}><Stack spacing={1.5}>
        <FormControlLabel control={<Checkbox name="publisherId" value={route.userId} checked={selected.includes(route.userId)} onChange={event=>{const checked=event.target.checked;setSelected(current=>checked?[...current,route.userId]:current.filter(id=>id!==route.userId));}} />} label={route.name} />
        {receiving && selected.includes(route.userId)?<><ReceivingChannelChoice snapshot={snapshot} route={route} /><FormControlLabel control={<Checkbox defaultChecked={route.requireApproval} name={`approval_${route.userId}`} />} label="Require approval before posting" /></>:null}
      </Stack></Box>)}
      {!routes.length?<Alert severity="warning">{receiving?"This request has no available analyst offer. Ask the source owner to add analysts before you can accept.":"Give a team member Publish alerts permission, then return to offer analysts."}</Alert>:null}
      {!receiving?<Button component={Link} href={url(snapshot,{tab:"settings"})}>Manage publishing permissions</Button>:null}
      {receiving?<FormControlLabel control={<Checkbox checked={showName} name="showSourceCommunityName" onChange={event=>setShowName(event.target.checked)} />} label={`Show ${request.source.name}’s community name in Discord posts sent to our server`} />:<input name="showSourceCommunityName" type="hidden" value={showName?"on":""} />}
      <Submit disabled={!selected.length}>{receiving?"Accept selected analysts":"Send analyst offer"}</Submit>
    </Stack>
  </Box>;
}
function ReceivingChannelChoice({ snapshot, route }: {snapshot: Snapshot; route: SharedAlertRoute}) {
  const [channel,setChannel]=useState(route.channelId??"");
  return <Channels snapshot={snapshot} value={channel} onChange={setChannel} name={`channel_${route.userId}`} />;
}
function Lifecycle({ snapshot, request, command, label, danger = false }: { snapshot: Snapshot; request: SharedAlertRequest; command: string; label: string; danger?: boolean }) {
  const [confirmed, setConfirmed] = useState(false);
  return <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} command={command} request={request} tab={request.isConnection ? "connections" : "requests"} />
    <Stack spacing={1}>
      {danger ? <FormControlLabel control={<Checkbox checked={confirmed} onChange={event => setConfirmed(event.target.checked)} />} label={<Typography variant="body2">Confirm {label.toLowerCase()}</Typography>} /> : null}
      <Submit color={danger ? "error" : "primary"} disabled={danger && !confirmed} variant="outlined">{label}</Submit>
    </Stack>
  </Box>;
}
function ReceivingPublisher({ snapshot, request, route }: { snapshot:Snapshot; request:SharedAlertRequest; route:SharedAlertRoute }) {
  const [channel,setChannel]=useState(route.channelId??"");
  const [channelName, setChannelName] = useState(route.channelName);
  const [requireApproval, setRequireApproval] = useState(route.requireApproval);
  const errorRef = useRef<HTMLDivElement>(null);
  const [result, save] = useActionState(mutateSharedAlertDraft, initialDraftState);
  useEffect(() => { if (result.error) errorRef.current?.focus(); }, [result]);
  const router = useRouter();
  useEffect(() => { if (result.destination) router.replace(result.destination, { scroll: false }); }, [result.destination, router]);
  return <Box sx={panelBorder}><Stack spacing={2}>
    <Typography component="h3" variant="h6">{route.name}</Typography>
    <Box action={save} component="form"><Fields snapshot={snapshot} request={request} command="route" tab="connections" />
      <input type="hidden" name="userId" value={route.userId} /><input type="hidden" name="routeRevision" value={route.revision} /><input type="hidden" name="routeCommand" value="save" />
      <Stack spacing={1.5}>{result.error ? <Alert severity="error" ref={errorRef} tabIndex={-1}>{result.error}</Alert> : null}<Channels snapshot={snapshot} value={channel} onChange={next => {
        setChannel(next);
        setChannelName(snapshot.channels.find(option => option.channelId === next)?.name ?? null);
      }} formError={result.error} retainedChannelName={channelName} />
        <FormControlLabel control={<Checkbox name="requireApproval" checked={requireApproval} onChange={event => setRequireApproval(event.target.checked)} />} label="Require approval before posting" />
        <Submit disabled={!snapshot.channels.some(c=>c.channelId===channel)} variant="outlined">Save settings</Submit>
      </Stack>
    </Box>
    <Stack direction="row" spacing={1}>{[route.paused?"resume":"pause","remove"].map(command=><Box key={command} action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} request={request} command="route" tab="connections" /><input type="hidden" name="userId" value={route.userId} /><input type="hidden" name="routeRevision" value={route.revision} /><input type="hidden" name="routeCommand" value={command} /><Submit variant="outlined" color={command==="remove"?"error":"primary"}>{command==="resume"?"Resume":command==="pause"?"Pause":"Stop sharing this analyst"}</Submit></Box>)}</Stack>
  </Stack></Box>;
}
function ReceiverSettings({ snapshot, request }: { snapshot: Snapshot; request: SharedAlertRequest }) {
  const [showName,setShowName]=useState(request.showSourceCommunityName);
  return <Stack spacing={3}>
    {request.routes.filter(r=>r.selected).map(route=><ReceivingPublisher key={`${route.userId}-${route.revision}`} snapshot={snapshot} request={request} route={route} />)}
    <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} command="presentation" request={request} /><Stack spacing={1.5}>
      <FormControlLabel control={<Checkbox checked={showName} name="showSourceCommunityName" onChange={event=>setShowName(event.target.checked)} />} label={`Show ${request.source.name}’s community name in Discord posts sent to our server`} />
      <input type="hidden" name="agreed" value="on" />
      <Submit disabled={showName===request.showSourceCommunityName}>Save post attribution</Submit>
    </Stack></Box>
  </Stack>;
}
function PublisherPermissions({ snapshot }: { snapshot:Snapshot }) {
  return <DashboardPanel title="Publishers"><Stack spacing={1.5}>{snapshot.publishers.map(p=><Box key={p.userId} action={mutateSharedAlerts} component="form" sx={panelBorder}>
    <Fields snapshot={snapshot} command="publisher" tab="settings" /><input type="hidden" name="userId" value={p.userId} />
    <Stack spacing={1}><Typography variant="subtitle1">{p.name}</Typography><FormControlLabel control={<Checkbox defaultChecked={p.canPublish} name="enabled" />} label="Publish alerts" /><Submit variant="outlined">Save permission</Submit></Stack>
  </Box>)}{!snapshot.publishers.length?<Typography color="text.secondary">No connected team members.</Typography>:null}</Stack></DashboardPanel>;
}
function Conversation({ snapshot, request }: { snapshot: Snapshot; request: SharedAlertRequest }) {
  const selected = snapshot.selected!;
  const draft = useSharedMessageAction();
  return <Stack spacing={2}>
    <Typography component="h3" variant="h6">Messages</Typography>
    {!selected.messages.length?<Typography color="text.secondary">No messages in this request.</Typography>:null}
    {selected.readThrough === null ? <Button component={Link} href={url(snapshot, { tab: request.isConnection ? "connections" : "requests", request: request.requestId })}>Latest messages</Button> : null}
    {selected.olderMessagesBefore ? <Button component={Link} href={url(snapshot, { tab: request.isConnection ? "connections" : "requests", request: request.requestId, before: selected.olderMessagesBefore })}>Older messages</Button> : null}
    {selected.messages.map(message => <Box key={message.sequence} data-shared-read-latest={message.sequence === selected.readThrough?.messageSequence ? "message" : undefined} sx={{ ...panelBorder, bgcolor: message.authorCommunityId === snapshot.community.communityId ? "action.hover" : "background.paper" }}>
      <Typography variant="subtitle2">{message.authorName}</Typography><Typography variant="caption" color="text.secondary">{date(message.createdAtUtc)}</Typography><Typography sx={{ mt: 1, whiteSpace: "pre-wrap", overflowWrap: "anywhere" }} variant="body2">{message.body}</Typography>
    </Box>)}
    {request.status === "pending" || request.status === "active" ? <Box action={draft.action} component="form"><Fields snapshot={snapshot} command="reply" request={request} tab={request.isConnection ? "connections" : "requests"} />
      <Stack spacing={1}>{draft.state.error ? <Alert severity="error" role="alert">{draft.state.error}</Alert> : null}<TextField disabled={draft.pending} label="Reply to the owner" multiline minRows={3} name="message" onChange={event => draft.setMessage(event.target.value)} required slotProps={{ htmlInput: { maxLength: 2000 } }} value={draft.message} /><Typography color="text.secondary" variant="body2">Replies are private to these owners. Sending a reply does not accept sharing.</Typography><Submit>Send reply</Submit></Stack>
    </Box> : null}
  </Stack>;
}
function SelectedRequest({ snapshot, onRead }: { snapshot: Snapshot; onRead: () => void }) {
  const selected = snapshot.selected!;
  const request = selected.request;
  const receiving = request.receiver.communityId === snapshot.community.communityId;
  const ownPaused = receiving ? request.receiverPaused : request.sourcePaused;
  const otherPaused = receiving ? request.sourcePaused : request.receiverPaused;
  const other = receiving ? request.source : request.receiver;
  return <Box id="sharing-detail" tabIndex={-1} sx={{scrollMarginTop: 16}}><DashboardPanel title={request.isConnection ? "Shared alert connection" : "Sharing request"}><Stack spacing={3}>
    {selected.readThrough && request.unread > 0 ? <SharedAlertsReadMarker communitySlug={snapshot.community.slug} requestId={request.requestId} onRead={onRead} {...selected.readThrough} /> : null}
    <Box>
      <Typography component="h2" variant="h5">{request.source.name} → {request.receiver.name}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{request.routes.filter(r=>r.offered).map(r=>r.name).join(", ") || "No analysts offered"}</Typography>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mt: 1.5 }}><Chip label={request.status === "active" ? ownPaused || otherPaused ? "Paused" : "Sharing active" : request.isConnection && request.status === "pending" ? "Changes awaiting acceptance" : request.status} size="small" /></Stack>
    </Box>
    {request.integrationProblem ? <Alert severity="warning">{request.integrationProblem} New deliveries remain blocked until verification succeeds.</Alert> : null}
    {request.status === "pending" ? receiving || !request.sourceApproved || !request.routes.some(route=>route.offered && route.canPublish) ? <ReviewAgreement key={`${request.requestId}-${request.version}`} snapshot={snapshot} request={request} /> : <Alert severity="info">Your analyst offer has been sent. Waiting for {request.receiver.name} to choose analysts and accept.</Alert> : null}
    <Box><Conversation snapshot={snapshot} request={request} />
      <Typography component="h3" variant="h6" sx={{mt:2}}>Status updates</Typography>
      {!selected.events.length?<Typography color="text.secondary">No status updates.</Typography>:null}
      {selected.events.map((event,index)=><Box key={`${event.atUtc}-${index}`} data-shared-read-latest={index === 0 ? "event" : undefined} sx={{...panelBorder,mt:1}}><Typography variant="body2">{event.event}</Typography><Typography variant="caption" color="text.secondary">{date(event.atUtc)}</Typography></Box>)}
    </Box>
    {request.status === "active" ? <>
      <Alert severity={ownPaused || otherPaused ? "warning" : "success"}>{ownPaused ? "You paused this connection. " : ""}{otherPaused ? "The other owner paused this connection. " : ""}{!ownPaused && !otherPaused ? "Sharing is active." : "Sharing stays paused until both owners allow it."}</Alert>
      <Lifecycle snapshot={snapshot} request={request} command={ownPaused ? "resume" : "pause"} label={ownPaused ? "Resume my side" : "Pause sharing"} />
      <Lifecycle snapshot={snapshot} request={request} command="analysts" label={receiving?"Change received analysts":"Change offered analysts"} />
      {receiving ? <ReceiverSettings key={`${request.requestId}-${request.version}`} snapshot={snapshot} request={request} /> : null}
    </> : null}

    {selected.deliveries.length || selected.deliveryFilter==="approval" || request.status==="active" ? <><Divider /><Box><Typography component="h3" variant="h6" sx={{ mb: 1 }}>{selected.deliveryFilter==="approval"?"Posts awaiting approval":"Delivery log"}</Typography>
      {receiving?<Stack direction="row" sx={{gap:1,mb:2,flexWrap:"wrap"}}><Button component={Link} href={url(snapshot,{tab:"connections",request:request.requestId})} variant={selected.deliveryFilter==="all"?"contained":"outlined"}>All posts</Button><Button component={Link} href={url(snapshot,{tab:"connections",request:request.requestId,approvalOnly:"1"})} variant={selected.deliveryFilter==="approval"?"contained":"outlined"}>Awaiting approval ({selected.approvalTotal})</Button></Stack>:null}
      {!selected.deliveries.length?<Typography color="text.secondary">{selected.deliveryFilter==="approval" ? "No posts awaiting approval." : "No deliveries yet."}</Typography>:null}<Stack spacing={1}>{selected.deliveries.map(delivery => <Box key={delivery.deliveryId} sx={panelBorder}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}><Typography variant="subtitle2">{delivery.kind === "correction" ? "Correction: " : delivery.kind === "withdrawal" ? "Withdrawn: " : ""}{delivery.title}</Typography><Chip label={delivery.status==="pending"&&delivery.parts.some(p=>p.status==="delivered")?"Partially delivered":delivery.status.replaceAll("_"," ")} size="small" /></Stack>
      <Typography color="text.secondary" variant="caption">{date(delivery.createdAtUtc)} · {delivery.authorName} · {deliveryChannelLabel(snapshot, request, delivery.channelId, delivery.authorUserId)} · {delivery.attemptCount} attempts · Updated {date(delivery.updatedAtUtc)}</Typography>
      {delivery.parts.length>1?<Typography variant="body2">{delivery.parts.filter(p=>p.status==="delivered").length} of {delivery.parts.length} messages delivered</Typography>:null}
      {delivery.parts.length>1?<Stack spacing={0.5}>{delivery.parts.map(part=><Stack key={part.number} direction="row" sx={{gap:1,alignItems:"center",flexWrap:"wrap"}}>
        {part.discordUrl?<Button component="a" href={part.discordUrl} target="_blank" rel="noopener noreferrer" size="small">Part {part.number} of {part.total}</Button>:<Typography variant="caption">Part {part.number} of {part.total}</Typography>}
        <Chip size="small" label={part.status} />{part.error?<Typography variant="caption">{part.error}</Typography>:null}
      </Stack>)}</Stack>:null}
      <Stack direction="row" spacing={2}>{delivery.discordUrl ? <Button component="a" href={delivery.discordUrl} target="_blank" rel="noopener noreferrer" size="small">Open Discord post</Button> : null}{delivery.originalDiscordUrl ? <Button component="a" href={delivery.originalDiscordUrl} target="_blank" rel="noopener noreferrer" size="small">Original alert</Button> : null}</Stack>
      {delivery.status==="awaiting_approval" && receiving ? <Stack spacing={1.5}>
        {delivery.parts.map(part=><Box key={part.number} sx={panelBorder}><Typography variant="body2" sx={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{part.content}</Typography></Box>)}
        {!delivery.reviewable?<Typography variant="body2" color="text.secondary">Waiting for the original Discord post.</Typography>:null}
        <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} request={request} command="review" tab="connections" /><input type="hidden" name="deliveryId" value={delivery.deliveryId} />
          <ReviewDecisionButtons contentRevision={delivery.contentRevision} canApprove={delivery.reviewable && request.status === "active" && !request.sourcePaused && !request.receiverPaused} />
        </Box>
      </Stack>:null}
      {delivery.error ? <Typography variant="body2" sx={{ mt: 1 }}>{delivery.error}</Typography> : null}
      {delivery.status === "uncertain" ? <Typography variant="body2" sx={{ mt: 1 }}>Discord may have accepted this alert. It will not be resent automatically. Check the receiving channel.</Typography> : null}
      {delivery.status === "failed" && request.status === "active" && !request.sourcePaused && !request.receiverPaused ? <Box action={mutateSharedAlerts} component="form" sx={{ mt: 1 }}><Fields snapshot={snapshot} command="retry" request={request} tab="connections" /><input name="deliveryId" type="hidden" value={delivery.deliveryId} /><Submit variant="outlined">Retry delivery</Submit></Box> : null}
    </Box>)}</Stack><Pages total={selected.deliveryTotal} page={selected.deliveryPage} snapshot={snapshot} tab="connections" parameter="deliveryPage" requestId={request.requestId} /></Box></> : null}
    {request.status === "pending" ? <Lifecycle snapshot={snapshot} request={request} command={request.initiatorCommunityId === snapshot.community.communityId ? "withdraw" : "decline"} label={request.initiatorCommunityId === snapshot.community.communityId ? "Withdraw request" : "Decline request"} danger /> : null}
    {request.status === "active" ? <Lifecycle snapshot={snapshot} request={request} command="end" label="End connection" danger /> : null}
    <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} command="block" /><input name="otherCommunityId" type="hidden" value={other.communityId} /><Stack spacing={1}><Typography variant="body2" color="text.secondary">Block future requests from {other.name}. Existing agreements must be paused or ended separately.</Typography><Submit variant="text">Block future requests</Submit></Stack></Box>
  </Stack></DashboardPanel></Box>;
}
function ContactSettings({ snapshot }: { snapshot: Snapshot }) {
  return <DashboardPanel title="Sharing request settings"><Stack spacing={2}>
    <Box action={mutateSharedAlerts} component="form"><Fields snapshot={snapshot} command="settings" tab="settings" /><Stack spacing={1}><FormControlLabel control={<Checkbox defaultChecked={snapshot.community.requestsOpen} name="requestsOpen" />} label="Allow sharing requests from connected communities" /><Submit variant="outlined">Save settings</Submit></Stack></Box>
    <Box><Typography component="h3" variant="h6">Blocked communities</Typography>{!snapshot.blockedCommunities.length?<Typography color="text.secondary">No blocked communities.</Typography>:null}{snapshot.blockedCommunities.map(community => <Box action={mutateSharedAlerts} component="form" key={community.communityId} sx={{ mt: 1 }}><Fields snapshot={snapshot} command="unblock" tab="settings" /><input name="otherCommunityId" type="hidden" value={community.communityId} /><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{community.name}</Typography><Submit variant="text">Unblock</Submit></Stack></Box>)}</Box>
  </Stack></DashboardPanel>;
}

export function SharedAlertsClient({ snapshot: incoming, tab, error, saved }: { snapshot: Snapshot; tab: View; error: string | null; saved: boolean }) {
  const interactive = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const navigate = (next: View) => (event: { preventDefault(): void }) => {
    if (next === tab) return;
    event.preventDefault();
    startNavigation(() => router.push(url(incoming, { tab: next })));
  };
  const tabScroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const scroller = tabScroller.current;
    if (!interactive || !scroller || typeof ResizeObserver === "undefined") return;
    // MUI does not always reveal the selected tab when only its viewport
    // changes size. Adjust horizontal navigation without moving page or focus.
    const revealSelectedTab = () => {
      const selected = scroller.querySelector('[role="tab"][aria-selected="true"]');
      if (!selected) return;
      const bounds = scroller.getBoundingClientRect(), active = selected.getBoundingClientRect();
      if (active.left < bounds.left) scroller.scrollLeft += active.left - bounds.left;
      else if (active.right > bounds.right) scroller.scrollLeft += active.right - bounds.right;
    };
    const observer = new ResizeObserver(revealSelectedTab);
    observer.observe(scroller);
    return () => observer.disconnect();
  }, [interactive, tab]);
  const [acknowledged, setAcknowledged] = useState<Snapshot | null>(null);
  const onRead = useCallback(() => setAcknowledged(incoming), [incoming]);
  // Apply the acknowledgement only to these exact server props. A later
  // navigation or new activity receives fresh server counts, never a stale mask.
  const readRequest = acknowledged === incoming ? incoming.selected?.request : null;
  const snapshot: Snapshot = readRequest ? {
    ...incoming,
    unreadCount: Math.max(0, incoming.unreadCount - readRequest.unread),
    requestUnreadCount: Math.max(0, (incoming.requestUnreadCount ?? 0) - (readRequest.status === "pending" && !readRequest.isConnection ? readRequest.unread : 0)),
    connectionUnreadCount: Math.max(0, (incoming.connectionUnreadCount ?? 0) - (readRequest.isConnection ? readRequest.unread : 0)),
    requests: incoming.requests.map(request => request.requestId === readRequest.requestId ? { ...request, unread: 0 } : request),
    selected: incoming.selected ? { ...incoming.selected, request: { ...readRequest, unread: 0 } } : null,
  } : incoming;
  return <DashboardPage>
    {!interactive ? <Typography role="status" variant="body2">Loading sharing controls…</Typography> : null}
    <Stack aria-busy={!interactive} inert={!interactive} data-shared-alerts-ready={interactive ? "true" : "false"} spacing={2.5} sx={{ minWidth: 0 }}>
    <DashboardPanel hideHeader><Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, alignItems: { sm: "center" }, justifyContent: "space-between" }}><Box><Typography component="h1" variant="h1">Shared alerts</Typography><Typography color="text.secondary" sx={{ mt: 1 }}>{snapshot.community.name}</Typography></Box><Stack direction="row" spacing={1}><Button component={Link} href="/help/traderslink-app/shared-alerts" aria-label="Help for Shared alerts">Help</Button><Button component={Link} href="/communities">My communities</Button><Button component={Link} href={`/communities/${snapshot.community.slug}/manage`}>Back to community</Button></Stack></Stack>
      <Tabs aria-label="Shared alert sections" allowScrollButtonsMobile scrollButtons slotProps={{ scroller: { ref: tabScroller } }} value={tab} variant="scrollable" sx={{ mt: 2, borderBottom: 1, borderColor: "divider", "& .MuiTab-root.Mui-selected": { color: "text.primary" }, "& .MuiTabs-indicator": { bgcolor: "text.primary" } }}>
        <Tab component={Link} onNavigate={navigate("find")} href={url(snapshot, { tab: "find" })} label="Find communities" value="find" />
        <Tab component={Link} onNavigate={navigate("requests")} href={url(snapshot, { tab: "requests" })} label={<Badge badgeContent={snapshot.requestUnreadCount??0} color="error" max={99} sx={{ pr: 1.5 }}>Requests</Badge>} value="requests" />
        <Tab component={Link} onNavigate={navigate("connections")} href={url(snapshot, { tab: "connections" })} label={<Badge badgeContent={snapshot.connectionUnreadCount??0} color="error" sx={{pr:1.5}}>Connections</Badge>} value="connections" />
        <Tab component={Link} onNavigate={navigate("activity")} href={url(snapshot,{tab:"activity"})} label={<Badge badgeContent={snapshot.unreadCount} color="error" sx={{pr:1.5}}>Activity</Badge>} value="activity" />
        <Tab component={Link} onNavigate={navigate("history")} href={url(snapshot,{tab:"history"})} label="History" value="history" />
        <Tab component={Link} onNavigate={navigate("settings")} href={url(snapshot,{tab:"settings"})} label="Settings" value="settings" />
      </Tabs>
    </DashboardPanel>
    {navigating ? <LinearProgress aria-label="Loading Shared alerts" /> : null}
    {!snapshot.deliveryEnabled ? <Alert severity="info">Shared Discord delivery is awaiting activation. Alerts published while delivery is off will not be shared later.</Alert> : null}
    {error ? <Alert severity="error" role="alert">{error}</Alert> : saved ? <Alert severity="success" role="status">Changes saved.</Alert> : null}
    {tab === "find" ? <>
      {snapshot.composeCommunity ? <Compose key={snapshot.composeCommunity.communityId} snapshot={snapshot} /> : <Directory snapshot={snapshot} />}

    </> : tab === "settings" ? <><PublisherPermissions snapshot={snapshot} /><ContactSettings snapshot={snapshot} /></> : <Grid container spacing={2}>
      <Grid size={{ xs: 12, lg: snapshot.selected ? 4 : 12 }}><RequestList snapshot={snapshot} tab={tab} /></Grid>
      {snapshot.selected ? <Grid size={{ xs: 12, lg: 8 }}><SelectedRequest key={snapshot.selected.request.requestId} snapshot={snapshot} onRead={onRead} /></Grid> : null}
    </Grid>}
    </Stack>
  </DashboardPage>;
}
