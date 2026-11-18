"use client";

import { useId, useRef, useState, useTransition, useSyncExternalStore, type FormEvent } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { DashboardPrimaryAction, DashboardSecondaryAction } from "@/app/dashboard-template";
import { SHARED_ALERT_BODY_MAX_LENGTH } from "@/src/modules/communities/contracts/shared-alerts-contracts";
import type { SharedSourceAlert } from "@/src/modules/communities/server/shared-alerts-source-publication";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";

const subscribeToHydration = () => () => {};
const clientReady = () => true;
const serverReady = () => false;

export type SharedSourceSubmit = (form: FormData) => Promise<SharedSourceActionResult>;
type Option = Readonly<{ id: string; name: string }>;

/** Standalone source composer. Parent supplies a real authenticated HTTP transport after route assignment. */
export function SharedAlertsSourceForm({ communitySlug, audiences, destinations, initialAlert, initialDestinationIds = [], initialDistribution = "discord", submit }: Readonly<{
  communitySlug: string; audiences: readonly Option[]; destinations: readonly Option[];
  initialAlert?: SharedSourceAlert; initialDestinationIds?: readonly string[]; initialDistribution?: "website" | "discord"; submit: SharedSourceSubmit;
}>) {
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const id = useId();
  const [saved, setSaved] = useState(initialAlert);
  const [title, setTitle] = useState(initialAlert?.title ?? "");
  const [body, setBody] = useState(initialAlert?.body ?? "");
  const [mode, setMode] = useState(initialAlert?.publishingMode ?? "discord_post");
  const [distribution, setDistribution] = useState(initialDistribution);
  const [feedback, setFeedback] = useState<SharedSourceActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const requestId = useRef<string | null>(null);
  const archived = saved?.status === "archived";
  const bodyTooLong = body.length > SHARED_ALERT_BODY_MAX_LENGTH;
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || archived) return;
    const form = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const status = button instanceof HTMLButtonElement ? button.value : saved?.publishedAtUtc ? "published" : "draft";
    if (!["draft", "published", "archived"].includes(status)) return;
    if (status !== "archived" && bodyTooLong) return;
    form.set("status", status);
    requestId.current ??= crypto.randomUUID();
    form.set("requestId", requestId.current);
    if (status === "archived" && saved) {
      // Withdrawal concerns the saved publication, not any unfinished local edits.
      form.set("title", saved.title); form.set("symbol", saved.symbol ?? ""); form.set("body", saved.body);
      form.set("audienceId", saved.audienceId); form.set("publishingMode", saved.publishingMode);
    }
    startTransition(async () => {
      try {
        const result = await submit(form);
        setFeedback(result);
        if (result.status === "success" && result.alert) { setSaved(result.alert); requestId.current = null; }
      } catch { setFeedback({ status: "error", message: "We couldn't save the alert. Your text is still here. Try again shortly." }); }
    });
  }
  return <Box component="form" onSubmit={save} aria-busy={!ready || pending} data-shared-source-ready={ready}>
    <input type="hidden" name="command" value="save_alert" />
    <input type="hidden" name="communitySlug" value={communitySlug} />
    {saved ? <><input type="hidden" name="alertId" value={saved.alertId} /><input type="hidden" name="expectedUpdatedAtUtc" value={saved.updatedAtUtc} /></> : null}
    <Box component="fieldset" disabled={!ready || pending || archived} sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
      <Stack spacing={2}>
        <TextField id={`${id}-title`} name="title" label="Alert title" value={title} onChange={event => setTitle(event.target.value)} required fullWidth slotProps={{ htmlInput: { maxLength: 140 } }} />
        <TextField id={`${id}-symbol`} name="symbol" label="Symbol (optional)" defaultValue={initialAlert?.symbol ?? ""} slotProps={{ htmlInput: { maxLength: 32 } }} />
        <TextField id={`${id}-body`} name="body" label="Full alert" value={body} onChange={event => setBody(event.target.value)} required multiline minRows={8} fullWidth error={bodyTooLong && !archived} slotProps={{ htmlInput: { maxLength: SHARED_ALERT_BODY_MAX_LENGTH } }} helperText={bodyTooLong ? `Shorten this alert to ${SHARED_ALERT_BODY_MAX_LENGTH} characters or fewer to save an edit.` : `${body.length} of ${SHARED_ALERT_BODY_MAX_LENGTH} characters`} />
        <TextField id={`${id}-audience`} select name="audienceId" label="Source audience" defaultValue={initialAlert?.audienceId ?? audiences[0]?.id ?? ""} required>
          {audiences.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <TextField id={`${id}-distribution`} select name="distribution" label="Publish to" value={distribution} onChange={event => {
          const next = event.target.value as "website" | "discord";
          setDistribution(next); if (next === "website") setMode("tracked_page");
        }}>
          <MenuItem value="discord">Send to Discord</MenuItem><MenuItem value="website">Website only</MenuItem>
        </TextField>
        <TextField id={`${id}-mode`} select name="publishingMode" label="Post in your Discord" value={mode} onChange={event => setMode(event.target.value as SharedSourceAlert["publishingMode"])} disabled={distribution === "website"}>
          <MenuItem value="discord_post">Full alert</MenuItem><MenuItem value="tracked_page">Tracker page link</MenuItem>
        </TextField>
        {distribution === "website" ? <input type="hidden" name="publishingMode" value="tracked_page" /> : null}
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700 }}>Your source channels</Typography>
          {destinations.length ? destinations.map(item => <FormControlLabel key={item.id} control={<Checkbox name="destinationId" value={item.id} defaultChecked={initialDestinationIds.includes(item.id)} />} label={item.name} />) : <Typography>No publishing channels are currently available to you.</Typography>}
        </Box>
        <Typography variant="body2">Partner communities receive the full alert using their own channel and approval settings.</Typography>
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {!saved?.publishedAtUtc ? <DashboardSecondaryAction type="submit" value="draft" disabled={pending || bodyTooLong}>Save draft</DashboardSecondaryAction> : null}
          <DashboardPrimaryAction type="submit" value="published" disabled={pending || bodyTooLong || !destinations.length || !audiences.length}>{saved?.publishedAtUtc ? "Save correction" : "Publish alert"}</DashboardPrimaryAction>
          {saved?.publishedAtUtc ? <DashboardSecondaryAction type="submit" value="archived" formNoValidate disabled={pending}>Withdraw alert</DashboardSecondaryAction> : null}
        </Stack>
      </Stack>
    </Box>
    {feedback ? <Alert severity={feedback.status === "success" ? "success" : "error"} role={feedback.status === "error" ? "alert" : "status"} sx={{ mt: 2 }}>{feedback.message}</Alert> : null}
    {archived ? <Typography sx={{ mt: 2 }}>This alert has been withdrawn.</Typography> : null}
    <Box sx={{ mt: 3, minWidth: 0 }}>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>Full alert preview</Typography>
      <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{title}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{body}</Typography>
    </Box>
  </Box>;
}
