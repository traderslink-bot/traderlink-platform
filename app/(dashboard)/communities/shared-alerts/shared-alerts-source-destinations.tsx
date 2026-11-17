"use client";

import { useId, useState, useTransition, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
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
import { DashboardPrimaryAction } from "@/app/dashboard-template";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";
import type { SharedSourceSubmit } from "./shared-alerts-source-form";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

type SourceDestination = Readonly<{ id: string; name: string; channelId: string; active: boolean; publisherIds: readonly string[] }>;
type Choice = Readonly<{ id: string; name: string }>;

function SourceControlForm({ communitySlug, command, destinationId, label, submit, children, unavailable = false }: Readonly<{
  communitySlug: string; command: "save_destination" | "assign_publishers"; destinationId?: string;
  label: string; submit: SharedSourceSubmit; children: ReactNode; unavailable?: boolean;
}>) {
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const [feedback, setFeedback] = useState<SharedSourceActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || unavailable) return;
    const form = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await submit(form);
        setFeedback(result);
        if (result.status === "success") router.refresh();
      } catch { setFeedback({ status: "error", message: "We couldn't save these settings. Your selections are still here. Try again shortly." }); }
    });
  }
  return <Box component="form" onSubmit={save} aria-label={label} aria-busy={!ready || pending} data-shared-source-ready={ready}>
    <input type="hidden" name="communitySlug" value={communitySlug} />
    <input type="hidden" name="command" value={command} />
    {destinationId ? <input type="hidden" name="destinationId" value={destinationId} /> : null}
    <Box component="fieldset" disabled={!ready || pending || unavailable} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack spacing={2}>{children}<Box><DashboardPrimaryAction type="submit" disabled={!ready || pending || unavailable}>{label}</DashboardPrimaryAction></Box></Stack>
    </Box>
    {feedback ? <Alert severity={feedback.status === "success" ? "success" : "error"} role={feedback.status === "error" ? "alert" : "status"} sx={{ mt: 2 }}>{feedback.message}</Alert> : null}
  </Box>;
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
export function SharedAlertsSourceDestinations({ communitySlug, channels, destinations, publishers, submit }: Readonly<{
  communitySlug: string; channels: readonly Choice[]; destinations: readonly SourceDestination[]; publishers: readonly Choice[]; submit: SharedSourceSubmit;
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
        <SourceControlForm communitySlug={communitySlug} command="assign_publishers" destinationId={destination.id} label="Save publisher assignments" submit={submit}>
          <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
            <Typography component="legend" sx={{ fontWeight: 700 }}>Individual publishers for this source channel</Typography>
            {publishers.length ? publishers.map(publisher => <FormControlLabel key={publisher.id} control={<Checkbox name="publisherId" value={publisher.id} defaultChecked={destination.publisherIds.includes(publisher.id)} />} label={publisher.name} />) : <Typography>No users currently have publishing permission.</Typography>}
          </Box>
          <Typography variant="body2">Publishing permission is assigned separately. Receiving communities choose their own channels for each publisher.</Typography>
        </SourceControlForm>
      </Box>
    </Box>)}
  </Stack>;
}
