"use client";

import { useId, useRef, useState, useTransition, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import { DashboardPrimaryAction } from "@/app/dashboard-template";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";
import type { SharedSourceSubmit } from "./shared-alerts-source-form";
import { isSharedSourceAssignmentState } from "./shared-alerts-source-assignments";
import type { SharedSourceAssignmentDestination, SharedSourceAssignmentPublisher } from "@/src/modules/communities/contracts/shared-alerts-contracts";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type SourceDestination = SharedSourceAssignmentDestination;
type Choice = Readonly<{ id: string; name: string; available?: boolean }>;
type ReloadAssignments = () => Promise<Readonly<{ destinations: readonly SharedSourceAssignmentDestination[]; publishers: readonly SharedSourceAssignmentPublisher[] }>>;

function SourceControlForm({ communitySlug, command, destinationId, label, submit, children, unavailable = false, submitUnavailable = false, transportErrorMessage }: Readonly<{
  communitySlug: string; command: "save_destination" | "assign_publishers"; destinationId?: string;
  label: string; submit: SharedSourceSubmit; children: ReactNode; unavailable?: boolean; submitUnavailable?: boolean; transportErrorMessage?: string;
}>) {
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [feedback, setFeedback] = useState<SharedSourceActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || unavailable || submitUnavailable) return;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await submit(form);
        setFeedback(result);
        if (result.status === "success") router.refresh();
      } catch { setFeedback({ status: "error", message: transportErrorMessage ?? "We couldn't save these settings. Your selections are still here. Try again shortly." }); }
    });
  }
  return <Box component="form" onSubmit={save} aria-label={label} aria-busy={!ready || pending} data-shared-source-ready={ready}>
    <input type="hidden" name="communitySlug" value={communitySlug} />
    <input type="hidden" name="command" value={command} />
    {destinationId ? <input type="hidden" name="destinationId" value={destinationId} /> : null}
    <Box component="fieldset" disabled={!ready || pending || unavailable} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack spacing={2}>{children}<Box><DashboardPrimaryAction type="submit" disabled={!ready || pending || unavailable || submitUnavailable}>{label}</DashboardPrimaryAction></Box></Stack>
    </Box>
    {feedback ? <Alert severity={feedback.status === "success" ? "success" : "error"} role={feedback.status === "error" ? "alert" : "status"} sx={{ mt: 2 }}>{feedback.message}</Alert> : null}
  </Box>;
}

/** Assignment token, selection and labels originate in ONE mounted editor snapshot.
 * Incoming server props never silently rebase a draft. Only a scoped acknowledgement
 * or the owner's explicit read/reconciliation can advance its base. */
function SourcePublisherAssignments({ communitySlug, destination, publishers, submit, reload }: Readonly<{
  communitySlug: string; destination: SourceDestination; publishers: readonly Choice[]; submit: SharedSourceSubmit; reload: ReloadAssignments;
}>) {
  const [snapshot, setSnapshot] = useState(() => ({ ...destination, publisherIds: [...destination.publisherIds] })), [ids, setIds] = useState<readonly string[]>(() => [...destination.publisherIds]);
  const [people, setPeople] = useState<readonly Choice[]>(() => [
    ...publishers.map(person => ({ ...person })), ...destination.publisherIds.filter(id => !publishers.some(person => person.id === id)).map((id, index) => ({ id, name: `Unavailable previous publisher ${index + 1}`, available: false })),
  ]);
  const [unknown, setUnknown] = useState(false), [busy, setBusy] = useState(false), [reading, setReading] = useState(false), [notice, setNotice] = useState("");
  const [readVersion, setReadVersion] = useState(0);
  const lock = useRef(false);
  const unavailableSelection = ids.some(id => !people.some(person => person.id === id && person.available !== false));
  async function save(form: FormData): Promise<SharedSourceActionResult> {
    if (lock.current || unknown) return { status: "error", message: "Reload current assignments before making another change." };
    lock.current = true; setBusy(true); setNotice("");
    const submitted = form.getAll("publisherId");
    try {
      if (form.get("expectedAssignmentState") !== snapshot.assignmentStateToken) throw new Error("Editor snapshot changed");
      const result = await submit(form), state = result.assignment;
      if (result.status === "success") {
        if (!isSharedSourceAssignmentState(state) || state.destinationId !== snapshot.id || state.publisherIds.length !== submitted.length || !state.publisherIds.every(id => submitted.includes(id))) throw new Error("Assignment acknowledgement changed");
        setSnapshot(current => ({ ...current, ...state, publisherIds: [...state.publisherIds] })); setIds([...state.publisherIds]); setUnknown(false);
      } else setUnknown(true);
      return result;
    } catch (error) { setUnknown(true); throw error; }
    finally { lock.current = false; setBusy(false); }
  }
  async function readCurrent() {
    if (lock.current) return;
    lock.current = true; setReading(true);
    try {
      const current = await reload(), next = current.destinations.find(row => row.id === snapshot.id);
      if (!next) throw new Error("Channel unavailable");
      setSnapshot({ ...next, publisherIds: [...next.publisherIds] });
      setPeople([...current.publishers, ...ids.filter(id => !current.publishers.some(person => person.id === id)).map((id, index) => ({ id, name: people.find(person => person.id === id)?.name ?? `Unavailable selection ${index + 1}`, available: false }))]);
      setUnknown(false); setReadVersion(current => current + 1); setNotice("Current assignments loaded. Your selections are retained; review them before saving.");
    } catch { setNotice("Current assignments could not be loaded. Your selections are still here."); }
    finally { lock.current = false; setReading(false); }
  }
  return <Stack spacing={1.5}>
    <Typography variant="body2">Saved individuals in this editor: {snapshot.publisherIds.map(id => people.find(person => person.id === id)?.name ?? "Unavailable previous publisher").join(", ") || "None"}. Reload current assignments to review later saved changes without discarding your selections.</Typography>
    {unknown ? <Alert severity="warning">The save result needs reconciliation. Reload current assignments before making another change; your selections are retained.</Alert> : null}
    <SourceControlForm key={readVersion} communitySlug={communitySlug} command="assign_publishers" destinationId={snapshot.id} label="Save publisher assignments" submit={save}
      unavailable={unknown || reading} submitUnavailable={unavailableSelection} transportErrorMessage="The save result could not be confirmed. Reload current assignments before making another change.">
      <input type="hidden" name="expectedAssignmentState" value={snapshot.assignmentStateToken} />
      <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
        <Typography component="legend" sx={{ fontWeight: 700 }}>Individual publishers for this source channel</Typography>
        {people.length ? people.filter(person => person.available !== false || ids.includes(person.id) || snapshot.publisherIds.includes(person.id)).map(person => <FormControlLabel key={person.id} control={<Checkbox name="publisherId" value={person.id} checked={ids.includes(person.id)} disabled={person.available === false && !ids.includes(person.id)} onChange={event => { const checked = event.target.checked; setIds(current => checked ? [...new Set([...current, person.id])] : current.filter(id => id !== person.id)); }} />} label={`${person.name}${person.available === false ? " — unavailable; remove to save" : ""}`} />) : <Typography>No users currently have publishing permission.</Typography>}
      </Box>
      {snapshot.hasLegacyAssignments ? <Typography variant="body2">Existing role assignments are retained. This form changes individuals only.</Typography> : null}
      <Typography variant="body2">Publishing permission is assigned separately. Receiving communities choose their own channels for each publisher.</Typography>
    </SourceControlForm>
    {notice ? <Alert role="status" severity="info">{notice}</Alert> : null}
    <Box><Button variant="outlined" disabled={busy || reading} onClick={() => void readCurrent()}>Reload current assignments</Button></Box>
  </Stack>;
}

function SourceDestinationFields({ channels, destination }: Readonly<{ channels: readonly Choice[]; destination?: SourceDestination }>) {
  const id = useId();
  const available = !destination || channels.some(channel => channel.id === destination.channelId);
  return <>
    <TextField id={`${id}-name`} name="name" label="Source channel name" defaultValue={destination?.name ?? ""} required fullWidth slotProps={{ htmlInput: { maxLength: 80 } }} />
    <TextField id={`${id}-channel`} select name="channelId" label="Discord channel in your server" defaultValue={available ? destination?.channelId ?? channels[0]?.id ?? "" : ""} required>
      {channels.map(channel => <MenuItem key={channel.id} value={channel.id}>{channel.name}</MenuItem>)}
    </TextField>
    {!available ? <Alert severity="warning">The previous channel is unavailable. Choose a channel the bot can post in.</Alert> : null}
    <FormControlLabel control={<Checkbox name="active" defaultChecked={destination?.active ?? true} />} label="Allow publishing to this source channel" />
  </>;
}

/** Owner-only surface when eventually mounted. Server authorization is repeated for every mutation. */
export function SharedAlertsSourceDestinations({ communitySlug, channels, destinations, publishers, submit, reloadAssignments }: Readonly<{
  communitySlug: string; channels: readonly Choice[]; destinations: readonly SourceDestination[]; publishers: readonly Choice[]; submit: SharedSourceSubmit; reloadAssignments: ReloadAssignments;
}>) {
  return <Stack spacing={3}>
    <Box>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Add a source channel</Typography>
      {!channels.length ? <Alert severity="warning" sx={{ mb: 2 }}>No verified Discord channels are currently available. Refresh your Discord connection before adding a source channel.</Alert> : null}
      <SourceControlForm communitySlug={communitySlug} command="save_destination" label="Add source channel" submit={submit} unavailable={!channels.length}>
        <SourceDestinationFields channels={channels} />
      </SourceControlForm>
    </Box>
    {destinations.map(destination => <Box key={destination.id} sx={{ minWidth: 0 }}>
      <Divider sx={{ mb: 2 }} />
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700, mb: 2, overflowWrap: "anywhere" }}>{destination.name}</Typography>
      <SourceControlForm communitySlug={communitySlug} command="save_destination" destinationId={destination.id} label="Save source channel" submit={submit} unavailable={!channels.length}>
        <SourceDestinationFields channels={channels} destination={destination} />
      </SourceControlForm>
      <Box sx={{ mt: 3 }}>
        <SourcePublisherAssignments communitySlug={communitySlug} destination={destination} publishers={publishers} submit={submit} reload={reloadAssignments} />
      </Box>
    </Box>)}
  </Stack>;
}
