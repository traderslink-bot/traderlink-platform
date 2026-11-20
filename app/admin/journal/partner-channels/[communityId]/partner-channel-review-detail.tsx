"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, JOURNAL_ADMIN_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-admin-request";
import { PartnerAlertActivityPanel } from "@/app/(dashboard)/partner-channels/partner-alert-activity-panel";
import type { PartnerAlertReviewFeedback } from "@/src/modules/partner-alerts/server/partner-alert-read-model";

type ReceivingOptions = Readonly<{ communityId: string; mappingId: string; partnerRevision: number;
  mappingRevision: number; destinationGuildId: string; options: readonly Readonly<{ channelId: string;
    channelName: string | null; roleId: string; roleName: string | null; available: boolean; reason: string | null }>[] }>;
type ReviewAttempt = Readonly<{ body: Readonly<Record<string, unknown>>; fingerprint: string; key: string }>;
type ReceivingSelection = Readonly<{ channel: string; role: string; partnerRevision: number; mappingRevision: number }>;
type Mapping = Readonly<{ mappingId: string; displayName: string; sourceChannelId: string;
  revision: number; reviewState: string; destinationChannelId: string | null; destinationRoleId: string | null;
  deliveryPaused?: true }>;
type OfferTerms = Readonly<{ offerId: string; version: number; title: string; amountMinor: number;
  currency: Readonly<{ code: string; minorUnitDigits: number }>; cadence: Readonly<{ unit: string; count: number }>;
  mappingIds: readonly string[] }>;
type Offer = Readonly<{ offer: OfferTerms; reviewState: string; currentApprovedOffer?: OfferTerms }>;
type ReviewView = Readonly<{ communityId: string; displayName: string; status: string; revision: number;
  personalInspectionConfirmed?: boolean;
  reviewRequested?: boolean;
  reviewFeedback?: PartnerAlertReviewFeedback;
  mappings: readonly Mapping[]; offers: readonly Offer[]; contentPolicy: Readonly<{ blockedServerNames: readonly string[];
    blockedPhrases: readonly string[]; authorMode: string; allowedAuthorIds: readonly string[] }>;
  latestAgreement: null | Readonly<{ agreementId: string; version: number; contractedChannels: number;
    terms: Readonly<{ pricingSource: string }>; quote: Readonly<{ totalMinor: number;
      currency: Readonly<{ code: string; minorUnitDigits: number }>; cadence: Readonly<{ unit: string; count: number }> }> }> }>;

function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
function reviewView(value: unknown): ReviewView | null {
  const envelope = record(value); const result = record(envelope?.result);
  if (envelope?.ok !== true || !result || typeof result.communityId !== "string"
    || typeof result.displayName !== "string" || typeof result.status !== "string"
    || !Number.isInteger(result.revision) || !Array.isArray(result.mappings) || !Array.isArray(result.offers)
    || !record(result.contentPolicy)) return null;
  return result as unknown as ReviewView;
}
function money(amount: number, currency: { code: string; minorUnitDigits: number }): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.code,
    minimumFractionDigits: currency.minorUnitDigits, maximumFractionDigits: currency.minorUnitDigits })
    .format(amount / (10 ** currency.minorUnitDigits));
}
function cadence(value: { unit: string; count: number }): string {
  if (value.unit === "calendar_month") return value.count === 1 ? "month" : `${value.count} months`;
  if (value.unit === "day") return value.count === 1 ? "day" : `${value.count} days`;
  return `${value.count} ${value.unit}`;
}

export function PartnerChannelReviewDetail({ communityId }: { communityId: string }) {
  const [view, setView] = useState<ReviewView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [refreshRequired, setRefreshRequired] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "warning" | "error"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [destinations, setDestinations] = useState<Record<string, ReceivingSelection>>({});
  const [activeMappingId, setActiveMappingId] = useState<string | null>(null);
  const [resources, setResources] = useState<Record<string, ReceivingOptions>>({});
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState<ReviewAttempt | null>(null);
  const requestKey = useRef<ReviewAttempt | null>(null);
  const saving = useRef(false);
  const resourceAbort = useRef<AbortController | null>(null);
  const blocked = pending || unconfirmed !== null || refreshRequired;
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/journal/partner-channels/${communityId}`, {
        cache: "no-store", credentials: "same-origin", signal,
      });
      if (!response.ok) throw new Error("unavailable");
      const next = reviewView(await response.json());
      if (signal?.aborted) return;
      if (!next || next.communityId !== communityId) throw new Error("unavailable");
      setView(next); setMessage(null); setRefreshRequired(false); return true;
    } catch {
      if (!signal?.aborted) { setRefreshRequired(true); setMessage({ severity: "warning",
        text: "This review is temporarily unavailable. Reload to check the saved review." }); } return false;
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [communityId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal);
    return () => controller.abort(); }, [load]);
  useEffect(() => () => resourceAbort.current?.abort(), []);
  const loadResources = async (mapping: Mapping) => {
    if (!view || blocked) return;
    const prior = destinations[mapping.mappingId];
    if (prior && !window.confirm("Reload receiving choices and replace the unsaved selection with the saved mapping?")) return;
    resourceAbort.current?.abort(); const controller = new AbortController(); resourceAbort.current = controller;
    const shownRevision = view.revision;
    setActiveMappingId(mapping.mappingId); setResourceLoading(true); setResourceError(null);
    try {
      const response = await fetch(`/api/admin/journal/partner-channels/${communityId}/resources?mappingId=${encodeURIComponent(mapping.mappingId)}`,
        { cache: "no-store", credentials: "same-origin", signal: controller.signal });
      const envelope = record(await response.json()); const result = record(envelope?.result);
      if (!response.ok || envelope?.ok !== true || !result || result.communityId !== communityId
        || result.mappingId !== mapping.mappingId || result.partnerRevision !== shownRevision
        || result.mappingRevision !== mapping.revision || !Array.isArray(result.options)
        || result.options.length > 250 || result.options.some(value => {
          const option = record(value);
          return !option || typeof option.channelId !== "string" || typeof option.roleId !== "string"
            || !/^[1-9][0-9]{0,19}$/u.test(option.channelId) || !/^[1-9][0-9]{0,19}$/u.test(option.roleId)
            || typeof option.available !== "boolean"
            || (option.channelName !== null && typeof option.channelName !== "string")
            || (option.roleName !== null && typeof option.roleName !== "string")
            || (option.reason !== null && typeof option.reason !== "string");
        })) throw Error("unavailable");
      if (controller.signal.aborted) return;
      const snapshot = result as unknown as ReceivingOptions;
      setResources(current => ({ ...current, [mapping.mappingId]: snapshot }));
      setDestinations(current => ({ ...current, [mapping.mappingId]: { channel: mapping.destinationChannelId ?? "",
        role: mapping.destinationRoleId ?? "", partnerRevision: snapshot.partnerRevision, mappingRevision: snapshot.mappingRevision } }));
    } catch { if (!controller.signal.aborted) setResourceError("Receiving choices are unavailable or this review changed. Reload the review and try again. Saved selections are kept."); }
    finally { if (!controller.signal.aborted) setResourceLoading(false); }
  };
  const executeAttempt = async (attempt: ReviewAttempt) => {
    if (saving.current) return; saving.current = true; setPending(true); setMessage(null);
    const wasUnknown = unconfirmed !== null;
    const unknown = () => { setUnconfirmed(attempt); setMessage({ severity: "warning",
      text: "The original review outcome is still unconfirmed. The same action and request reference are kept; a refused retry does not establish whether the first action was saved." }); };
    try {
      const response = await fetch(`/api/admin/journal/partner-channels/${attempt.body.communityId}`, {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "content-type": "application/json", [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
          [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: attempt.key }, body: attempt.fingerprint });
      const payload = record(await response.json()); const saved = record(payload?.result);
      const resourceId = attempt.body.mappingId ?? attempt.body.offerId ?? attempt.body.communityId;
      const matched = response.ok && payload?.ok === true && saved !== null && saved.communityId === attempt.body.communityId
        && saved.resourceId === resourceId && saved.partnerRevision === Number(attempt.body.expectedRevision) + 1
        && Number.isSafeInteger(saved.resourceVersion) && Number(saved.resourceVersion) >= 1 && typeof saved.state === "string"
        && (attempt.body.action !== "approveMapping" || (saved.resourceVersion === attempt.body.expectedMappingRevision && saved.state === "approved"));
      if (!matched) {
        if (wasUnknown || response.ok || response.status >= 500 || [408, 429].includes(response.status)) { unknown(); return; }
        requestKey.current = null;
        setMessage({ severity: response.status === 409 ? "warning" : "error", text: response.status === 409
          ? "This request changed. Reload before reviewing it." : "The review action could not be saved." }); return;
      }
      requestKey.current = null; setUnconfirmed(null);
      if (["requestChanges", "declinePartner"].includes(String(attempt.body.action))) setReason("");
      if (await load()) setMessage({ severity: "success", text: "The review action was saved." });
      else setMessage({ severity: "warning", text: "The review action was saved, but the updated review could not be loaded. Reload before another action." });
    } catch { unknown(); }
    finally { saving.current = false; setPending(false); }
  };
  const submit = (command: Record<string, unknown>, expectedRevision = view?.revision) => {
    if (!view || blocked || expectedRevision === undefined) return;
    const body = Object.freeze({ ...command, communityId, expectedRevision });
    const fingerprint = JSON.stringify(body);
    const attempt = requestKey.current?.fingerprint === fingerprint ? requestKey.current
      : Object.freeze({ body, fingerprint, key: crypto.randomUUID() });
    requestKey.current = attempt; return executeAttempt(attempt);
  };

  if (loading && !view) return <Stack spacing={2}><Button component={Link} href="/admin/journal/partner-channels">Back to requests</Button>
    <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 1.5, p: 3 }}>
      <CircularProgress size={22} /><Typography>Loading partner review…</Typography>
    </Paper></Stack>;
  if (!view) return <Stack spacing={2}><Button component={Link} href="/admin/journal/partner-channels">Back to requests</Button>
    {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}</Stack>;
  const canResume = view.status === "publishing_paused" || view.mappings.some(mapping => mapping.deliveryPaused);
  const canActivate = view.status === "setup_required" && !view.reviewRequested;
  const canPause = view.status === "active" && !view.reviewRequested;
  const showReviewActions = view.reviewRequested === true;
  return <Stack spacing={2.5}>
    <Box><Button component={Link} href="/admin/journal/partner-channels">Back to requests</Button>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, mt: 1 }}>
        <Typography component="h1" sx={{ flex: 1 }} variant="h4">{view.displayName}</Typography><Chip label={view.status.replaceAll("_", " ")} />
      </Stack></Box>
    {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
    {refreshRequired && !unconfirmed ? <Button disabled={pending} variant="outlined" onClick={() => void load()}>Reload review</Button> : null}
    {unconfirmed ? <Alert severity="warning"><Stack spacing={1}>
      <Typography>The original review outcome is unconfirmed. Receiving choices and the original action stay frozen.</Typography>
      <Button disabled={pending} onClick={() => void executeAttempt(unconfirmed)}>Retry same review action</Button>
      <Button disabled={pending} onClick={() => void load()}>Check saved review</Button>
    </Stack></Alert> : null}
    {view.reviewFeedback ? <Alert severity="info" sx={{ overflowWrap: "anywhere" }}>
      <AlertTitle>{view.reviewFeedback.kind === "declined" ? "Application declined" : "Changes requested"}</AlertTitle>
      <Typography variant="body2">{view.reviewFeedback.reason}</Typography>
    </Alert> : null}
    <Alert severity="info">Approval rechecks the required Discord and billing details. Approved communities still need publishing activated.</Alert>
    {showReviewActions || view.personalInspectionConfirmed ? <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography component="h2" variant="h6">Personal inspection</Typography>
      {view.personalInspectionConfirmed ? <Typography>Inspection confirmed</Typography> :
        <Button disabled={blocked} onClick={() => void submit({ action: "confirmInspection" })}>
          Confirm I inspected all channels
        </Button>}
    </Paper> : null}
    <Paper variant="outlined" sx={{ p: 2.5 }}><Typography component="h2" variant="h6">Channel mappings</Typography>
      <Stack divider={<Divider flexItem />} spacing={2} sx={{ mt: 1.5 }}>{view.mappings.map(mapping => {
        const snapshot = resources[mapping.mappingId];
        const selected = destinations[mapping.mappingId];
        const pair = snapshot?.options.find(option => option.channelId === selected?.channel && option.roleId === selected?.role);
        const isCurrent = selected?.partnerRevision === view.revision && selected?.mappingRevision === mapping.revision;
        return <Stack key={mapping.mappingId} spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Typography sx={{ flex: 1, fontWeight: 800 }}>{mapping.displayName}</Typography>
            {mapping.deliveryPaused ? <Chip label="Delivery paused" size="small" color="warning" /> : null}
            <Chip label={mapping.reviewState} size="small" />
          </Stack>
          <Button sx={{ alignSelf: "flex-start" }} disabled={blocked || resourceLoading}
            onClick={() => void loadResources(mapping)} variant="outlined">
            {mapping.reviewState === "awaiting_approval" ? "Choose receiving channel" : "View receiving details"}
          </Button>
          {activeMappingId === mapping.mappingId ? <Stack spacing={1}>
            {resourceLoading ? <Typography role="status">Loading verified receiving choices…</Typography> : null}
            {resourceError ? <Alert severity="info">{resourceError}</Alert> : null}
            {snapshot && selected && mapping.reviewState === "awaiting_approval" ? <>
              {!isCurrent ? <Alert severity="info">This review changed. Reload the receiving choices before approval.</Alert> : null}
              <TextField select label="Receiving channel and dedicated role" size="small"
                disabled={blocked || resourceLoading || !isCurrent}
                value={pair ? `${selected.channel}:${selected.role}` : ""}
                onChange={event => {
                  const option = snapshot.options.find(row => `${row.channelId}:${row.roleId}` === event.target.value);
                  if (option?.available) setDestinations(current => ({ ...current, [mapping.mappingId]: {
                    channel: option.channelId, role: option.roleId, partnerRevision: snapshot.partnerRevision,
                    mappingRevision: snapshot.mappingRevision } }));
                }}>
                <MenuItem value="">Choose a verified existing pair</MenuItem>
                {snapshot.options.map(option => <MenuItem key={`${option.channelId}:${option.roleId}`}
                  value={`${option.channelId}:${option.roleId}`} disabled={!option.available}>
                  {option.channelName ?? "Channel metadata unavailable"} · {option.roleName ?? "Role metadata unavailable"}
                </MenuItem>)}
              </TextField>
              {snapshot.options.filter(option => !option.available).map(option => <Typography key={`${option.channelId}:${option.roleId}`}
                variant="body2" color="text.secondary">{option.channelName ?? "Receiving channel"}: {option.reason}</Typography>)}
              {!snapshot.options.length ? <Alert severity="info">No configured receiving pair is available for this source. An existing private read-only channel and an exclusive dedicated role must be configured before approval.</Alert> : null}
              {selected.channel && !pair ? <Alert severity="warning">The previously selected pair is unavailable. Its selection is kept; choose a verified pair to replace it.</Alert> : null}
              <Button disabled={blocked || resourceLoading || !isCurrent || !pair?.available}
                onClick={() => void submit({ action: "approveMapping", mappingId: mapping.mappingId,
                  expectedMappingRevision: selected.mappingRevision, destinationChannelId: selected.channel,
                  destinationRoleId: selected.role }, selected.partnerRevision)} variant="outlined">Approve channel</Button>
            </> : snapshot && selected ? <Typography>{pair?.channelName ?? "Saved channel metadata unavailable"}
              {" · "}{pair?.roleName ?? "Saved role metadata unavailable"}. Approved bindings are read-only.</Typography> : null}
          </Stack> : null}
        </Stack>;
      })}</Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2.5 }}><Typography component="h2" variant="h6">Channel access and pricing</Typography>
      <Stack divider={<Divider flexItem />} spacing={2} sx={{ mt: 1.5 }}>{view.offers.map(item => <Stack key={`${item.offer.offerId}:${item.offer.version}`} direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 800 }}>{item.offer.title}</Typography>
          <Typography color="text.secondary">{money(item.offer.amountMinor, item.offer.currency)} / {cadence(item.offer.cadence)}</Typography>
          <Typography variant="body2" color="text.secondary">{view.mappings.filter(mapping => item.offer.mappingIds.includes(mapping.mappingId)).map(mapping => mapping.displayName).join(" · ")}</Typography>
          {item.currentApprovedOffer ? <Typography variant="body2" color="text.secondary">
            Currently approved {money(item.currentApprovedOffer.amountMinor, item.currentApprovedOffer.currency)} / {cadence(item.currentApprovedOffer.cadence)}
          </Typography> : null}
        </Box>
        <Chip label={item.reviewState === "awaiting_approval" ? "Under review" : item.reviewState} size="small" />
        {item.reviewState === "awaiting_approval" ? <Button disabled={blocked} onClick={() => void submit({ action: "approveOffer",
          offerId: item.offer.offerId, offerVersion: item.offer.version })} variant="outlined">Approve offer</Button> : null}
      </Stack>)}</Stack>
    </Paper>
    <Paper variant="outlined" sx={{ p: 2.5 }}><Typography component="h2" variant="h6">Content policy</Typography>
      <Typography color="text.secondary" sx={{ mt: 1 }}>Text only. Links, invites, media, attachments, mass mentions, source-community promotion, and chat are blocked.</Typography>
    </Paper>
    {showReviewActions || canActivate || canResume || canPause ? <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography component="h2" variant="h6">{showReviewActions ? "Review decision" : "Publishing"}</Typography>
      <Stack spacing={1.5} sx={{ mt: 1.5 }}>
        {showReviewActions || canPause ? <TextField fullWidth label={canPause ? "Reason for pausing" : "Reason shown to publisher"}
          onChange={event => setReason(event.target.value)} value={reason} slotProps={{ htmlInput: { maxLength: 500 } }} /> : null}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
          {showReviewActions ? <>
            <Button disabled={blocked || reason.trim().length === 0} onClick={() => void submit({ action: "requestChanges", reason: reason.trim() })} variant="outlined">Request changes</Button>
            <Button disabled={blocked || reason.trim().length === 0} onClick={() => {
              if (window.confirm("Decline this application? The publisher can update it and submit again.")) {
                void submit({ action: "declinePartner", reason: reason.trim() });
              }
            }} variant="outlined" color="error">Decline application</Button>
            <Button disabled={blocked} onClick={() => void submit({ action: "approvePartner" })} variant="contained">Approve partner</Button>
          </> : null}
          {(canActivate || (canResume && !view.reviewRequested)) && <Button disabled={blocked}
            onClick={() => {
              const question = canResume ? "Recheck the approved Discord channels and resume publishing?"
                : "Activate publishing for these approved Discord channels?";
              if (window.confirm(question)) void submit({ action: "activatePartner" });
            }} variant="contained">{canResume ? "Recheck and resume publishing" : "Activate publishing"}</Button>}
          {canPause ? <Button disabled={blocked || reason.trim().length === 0} onClick={() => {
            if (window.confirm("Pause alert delivery and new purchases? Current subscribers will keep access.")) {
              void submit({ action: "setPartnerState", state: "publishing_paused", reason: reason.trim() });
            }
          }} variant="outlined">Pause publishing</Button> : null}
        </Stack>
      </Stack>
    </Paper> : null}
    {["active", "publishing_paused", "suspended", "ended"].includes(view.status)
      ? <PartnerAlertActivityPanel key={communityId} endpoint={`/api/admin/journal/partner-channels/${communityId}`} /> : null}
  </Stack>;
}
