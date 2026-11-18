"use client";
import Link from "next/link";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import {DashboardPage,DashboardPanel} from "@/app/dashboard-ui";
import type {SharedAlertsSnapshot} from "@/src/modules/communities/contracts/shared-alerts-contracts";
import type {FixtureKey} from "@/src/modules/communities/server/shared-alerts-staging-fixture-authority";
import {SharedAlertsActionForm,SharedAlertsBindingsProvider} from "./shared-alerts-bindings";
import {mutateSharedFixture,draftSharedFixture,markSharedFixtureRead} from "./shared-alerts-staging-fixture-actions";
export function SharedFixtureCommunity({runId,communityKey,snapshot,error}:{runId:string;communityKey:FixtureKey;snapshot:SharedAlertsSnapshot;error:boolean}){
 const base=`/__private/shared-alerts-fixture/${runId}/${communityKey}`,mutate=mutateSharedFixture.bind(null,runId,communityKey),publisher=snapshot.publishers[0];
 const outgoing=snapshot.requests.filter(r=>r.source.communityId===snapshot.community.communityId&&r.status==="active"&&!r.sourcePaused&&!r.receiverPaused),chosen=outgoing[0];
 return <SharedAlertsBindingsProvider bindings={{mutate,draft:draftSharedFixture.bind(null,runId,communityKey),markRead:markSharedFixtureRead.bind(null,runId,communityKey),navigation:{basePath:base,communityHref:base+"?screen=community",testLabel:"SyntheticAgreement"}}}><DashboardPage><Stack spacing={2.5}>
  <Alert severity="info">SyntheticAgreement test community. ActualDiscordIO goes only to TradersLink Tests. This window expires automatically.</Alert>
  {error?<Alert severity="error">The test action could not finish. Check the active test window and current sharing settings.</Alert>:null}
  <DashboardPanel title={`${snapshot.community.name} — test community`}><Stack direction="row" spacing={2}><Button component={Link} prefetch={false} href={base+"?tab=connections"} variant="contained">Back to Shared alerts</Button><Button component={Link} prefetch={false} href="/communities" variant="outlined">My actual communities</Button></Stack></DashboardPanel>
  <DashboardPanel title="Test publishing access"><SharedAlertsActionForm><input type="hidden" name="communitySlug" value={communityKey}/><input type="hidden" name="command" value="publisher"/><input type="hidden" name="userId" value={publisher.userId}/><FormControlLabel control={<Checkbox name="enabled" defaultChecked={publisher.canPublish}/>} label={`Allow ${publisher.name} to publish in this synthetic community`}/><Button type="submit" variant="contained">Save test publishing access</Button></SharedAlertsActionForm></DashboardPanel>
  <DashboardPanel title="Send a test alert">{chosen?<SharedAlertsActionForm><input type="hidden" name="communitySlug" value={communityKey}/><input type="hidden" name="command" value="publish"/><input type="hidden" name="version" value={chosen.version}/><input type="hidden" name="tab" value="connections"/><Stack spacing={2}><TextField label="Test connection" name="requestId" select defaultValue={chosen.requestId}>{outgoing.map(r=><MenuItem key={r.requestId} value={r.requestId}>{r.receiver.name} · revision {r.version}</MenuItem>)}</TextField><TextField label="Test alert text" name="content" multiline minRows={4} required slotProps={{htmlInput:{maxLength:1800}}}/><Button type="submit" variant="contained" disabled={!publisher.canPublish}>Send test alert</Button></Stack></SharedAlertsActionForm>:<Alert severity="info">Accept a sharing request and select its Tests channel before sending an alert.</Alert>}</DashboardPanel>
  {snapshot.selected?.request.source.communityId===snapshot.community.communityId?snapshot.selected.deliveries.filter(d=>d.status==="awaiting_approval").map(d=><DashboardPanel key={d.deliveryId} title="Correct a queued test alert"><SharedAlertsActionForm><input type="hidden" name="communitySlug" value={communityKey}/><input type="hidden" name="command" value="correct"/><input type="hidden" name="requestId" value={snapshot.selected!.request.requestId}/><input type="hidden" name="deliveryId" value={d.deliveryId}/><input type="hidden" name="contentRevision" value={d.contentRevision}/><Stack spacing={2}><TextField label="Corrected test alert text" name="content" multiline minRows={3} defaultValue={d.body} required slotProps={{htmlInput:{maxLength:1800}}}/><Button type="submit" variant="outlined">Save test correction</Button></Stack></SharedAlertsActionForm></DashboardPanel>):null}
 </Stack></DashboardPage></SharedAlertsBindingsProvider>;
}
