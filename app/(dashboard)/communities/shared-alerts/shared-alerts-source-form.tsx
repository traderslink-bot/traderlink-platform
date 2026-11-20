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
export function SharedAlertsSourceForm({ communitySlug, audiences, destinations, isOwner = false, initialAlert, initialDestinationIds = [], initialDistribution = "discord", submit }: Readonly<{
  communitySlug: string; audiences: readonly Option[]; destinations: readonly Option[];
  isOwner?: boolean;
  initialAlert?: SharedSourceAlert; initialDestinationIds?: readonly string[]; initialDistribution?: "website" | "discord"; submit: SharedSourceSubmit;
}>) {
  const ready = useSyncExternalStore(subscribeToHydration, clientReady, serverReady);
  const id = useId();
  const [saved, setSaved] = useState(initialAlert);
  const [title, setTitle] = useState(initialAlert?.title ?? "");
  const [body, setBody] = useState(initialAlert?.body ?? "");
  const [symbol, setSymbol] = useState(initialAlert?.symbol ?? "");
  const [audienceId, setAudienceId] = useState(initialAlert?.audienceId ?? audiences[0]?.id ?? "");
  const [selectedIds, setSelectedIds] = useState<readonly string[]>(() => [...initialDestinationIds]);
  const [mode, setMode] = useState(initialAlert?.publishingMode ?? "discord_post");
  const [distribution, setDistribution] = useState(initialDistribution);
  const [feedback, setFeedback] = useState<SharedSourceActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  const requestId = useRef<string | null>(null);
  const archived = saved?.status === "archived";
  const bodyTooLong = body.length > SHARED_ALERT_BODY_MAX_LENGTH;
  const titleInvalid = !title.trim() || title.trim().length > 140 || /[\u0000-\u001f\u007f]/u.test(title.trim());
  const bodyInvalid = !body.trim() || bodyTooLong || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(body);
  const symbolInvalid = Boolean(symbol.trim()) && !/^[A-Z0-9][A-Z0-9.\-/:^]{0,31}$/u.test(symbol.trim().toUpperCase());
  const audienceAvailable = audiences.some(item => item.id === audienceId);
  const unavailableIds = selectedIds.filter(value => !destinations.some(item => item.id === value));
  const draftReady = audienceAvailable && !titleInvalid && !bodyInvalid && !symbolInvalid && !unavailableIds.length;
  const publishReady = draftReady && selectedIds.length > 0;
  function selectChannel(value: string, checked: boolean) {
    setSelectedIds(current => checked ? current.includes(value) ? current : [...current, value] : current.filter(item => item !== value));
  }
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ready || pending || archived) return;
    const form = new FormData(event.currentTarget);
    const button = (event.nativeEvent as SubmitEvent).submitter;
    const status = button instanceof HTMLButtonElement ? button.value : saved?.publishedAtUtc ? "published" : "draft";
    if (!["draft", "published", "archived"].includes(status)) return;
    if (status !== "archived" && bodyTooLong) return;
    if ((status === "draft" && !draftReady) || (status === "published" && !publishReady)) return;
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
        <TextField id={`${id}-title`} name="title" label="Alert title" value={title} onChange={event => setTitle(event.target.value)} required fullWidth error={Boolean(title) && titleInvalid} helperText={title && titleInvalid ? "Use a nonempty, single-line title of up to 140 characters." : undefined} slotProps={{ htmlInput: { maxLength: 140 } }} />
        <TextField id={`${id}-symbol`} name="symbol" label="Symbol (optional)" value={symbol} onChange={event => setSymbol(event.target.value)} error={symbolInvalid} helperText={symbolInvalid ? "Use a valid ticker symbol, or leave this blank." : undefined} slotProps={{ htmlInput: { maxLength: 32 } }} />
        <TextField id={`${id}-body`} name="body" label="Full alert" value={body} onChange={event => setBody(event.target.value)} required multiline minRows={8} fullWidth error={Boolean(body) && bodyInvalid && !archived} slotProps={{ htmlInput: { maxLength: SHARED_ALERT_BODY_MAX_LENGTH } }} helperText={bodyTooLong ? `Shorten this alert to ${SHARED_ALERT_BODY_MAX_LENGTH} characters or fewer to save an edit.` : body && bodyInvalid ? "Enter alert text without unsupported control characters." : `${body.length} of ${SHARED_ALERT_BODY_MAX_LENGTH} characters`} />
        <TextField id={`${id}-audience`} select name="audienceId" label="Source audience" value={audienceId} onChange={event => setAudienceId(event.target.value)} required>
          {!audienceAvailable ? <MenuItem value={audienceId} disabled>{audienceId ? "Unavailable source audience" : "No source audiences available"}</MenuItem> : null}
          {audiences.map(item => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
        </TextField>
        <TextField id={`${id}-distribution`} select name="distribution" label="Delivery" value={distribution} onChange={event => {
          const next = event.target.value as "website" | "discord";
          setDistribution(next); if (next === "website") setMode("tracked_page");
        }}>
          <MenuItem value="discord">Send to Discord</MenuItem><MenuItem value="website">Website only</MenuItem>
        </TextField>
        <Typography variant="body2">{distribution === "website"
          ? "For a new alert, Website only requests no Discord posts to your server or partner communities."
          : "For a new alert, selected source channels receive the format below. Eligible partners receive the full alert under the existing agreement and the receiving community's channel and approval settings; this is not a delivery confirmation."}</Typography>
        <TextField id={`${id}-mode`} select name="publishingMode" label="Post in your Discord" value={mode} onChange={event => setMode(event.target.value as SharedSourceAlert["publishingMode"])} disabled={distribution === "website"}>
          <MenuItem value="discord_post">Full alert</MenuItem><MenuItem value="tracked_page">Tracker page link</MenuItem>
        </TextField>
        {distribution === "website" ? <input type="hidden" name="publishingMode" value="tracked_page" /> : null}
        <Box component="fieldset" sx={{ border: 0, p: 0, m: 0, minWidth: 0 }}>
          <Typography component="legend" sx={{ fontWeight: 700 }}>{distribution === "website" ? "Source channels for private-page access" : "Source channels"}</Typography>
          <Typography variant="body2">Choose at least one source channel in either mode. Only members who meet the alert audience and can read an associated channel can open its private page.</Typography>
          {destinations.map(item => <FormControlLabel key={item.id} control={<Checkbox name="destinationId" value={item.id} checked={selectedIds.includes(item.id)} onChange={event => selectChannel(item.id, event.target.checked)} />} label={item.name} />)}
          {unavailableIds.map(value => <FormControlLabel key={value} control={<Checkbox name="destinationId" value={value} checked onChange={() => selectChannel(value, false)} />} label="Unavailable previous source channel" />)}
          {!destinations.length ? <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography>No source channels are currently available to you.</Typography>
            <Typography variant="body2">{isOwner ? "Check individual publisher assignments and whether the source channel is active." : "Ask your server owner to check your source-channel assignment and whether the channel is active."}</Typography>
            {isOwner ? <Box><DashboardSecondaryAction href={`/communities/${encodeURIComponent(communitySlug)}/manage/shared-alerts/source-channels`}>Source channel assignments</DashboardSecondaryAction></Box> : null}
          </Stack> : null}
        </Box>
        {!audienceAvailable ? <Alert severity="warning">A current source audience is required before saving a draft or publishing. Ask your server owner to check the audience setup.</Alert> : null}
        {unavailableIds.length ? <Alert severity="warning">Remove unavailable previous source channels before saving a draft or publishing. Your alert text is retained.</Alert> : null}
        {!saved?.publishedAtUtc && !selectedIds.length ? <Typography variant="body2">{draftReady ? "You can save a draft without selecting source channels. Publishing still needs at least one authorized source channel." : "A draft can omit source channels, but it still needs a valid title, alert text, optional symbol and source audience."}</Typography> : null}
        {destinations.length && !selectedIds.length ? <Typography variant="body2">Select a source channel before publishing.</Typography> : null}
        {saved?.publishedAtUtc ? <Alert severity="info">This alert has already been published. Corrections and withdrawals follow its recorded delivery rules and can update existing Discord messages. Changing Delivery does not recall previous posts or retry an uncertain delivery.</Alert> : null}
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}>
          {!saved?.publishedAtUtc ? <DashboardSecondaryAction type="submit" value="draft" disabled={pending || !draftReady}>Save draft</DashboardSecondaryAction> : null}
          <DashboardPrimaryAction type="submit" value="published" disabled={pending || !publishReady}>{saved?.publishedAtUtc ? "Save correction" : "Publish alert"}</DashboardPrimaryAction>
          {saved?.publishedAtUtc ? <DashboardSecondaryAction type="submit" value="archived" formNoValidate disabled={pending}>Withdraw alert</DashboardSecondaryAction> : null}
        </Stack>
      </Stack>
    </Box>
    {feedback ? <Alert severity={feedback.status === "success" ? "success" : "error"} role={feedback.status === "error" ? "alert" : "status"} sx={{ mt: 2 }}>{feedback.message}</Alert> : null}
    {archived ? <Typography sx={{ mt: 2 }}>This alert has been withdrawn.</Typography> : null}
    <Box sx={{ mt: 3, minWidth: 0 }}>
      <Typography component="h3" variant="subtitle1" sx={{ fontWeight: 700 }}>Alert content preview</Typography>
      <Typography variant="body2">Your authored content; partner approval, Discord presentation and delivery results are shown separately.</Typography>
      <Typography sx={{ fontWeight: 700, overflowWrap: "anywhere" }}>{title}</Typography>
      <Typography sx={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{body}</Typography>
    </Box>
  </Box>;
}
