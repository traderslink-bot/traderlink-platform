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
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, JOURNAL_ADMIN_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-admin-request";
import { PartnerAlertActivityPanel } from "@/app/(dashboard)/partner-channels/partner-alert-activity-panel";
import type { PartnerAlertReviewFeedback } from "@/src/modules/partner-alerts/server/partner-alert-read-model";

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
  const [message, setMessage] = useState<{ severity: "success" | "warning" | "error"; text: string } | null>(null);
  const [reason, setReason] = useState("");
  const [destinations, setDestinations] = useState<Record<string, { channel: string; role: string }>>({});
  const requestKey = useRef<{ fingerprint: string; key: string } | null>(null);
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
      setView(next); setMessage(null);
    } catch {
      if (!signal?.aborted) setMessage({ severity: "warning",
        text: "This review is temporarily unavailable. No review action was taken." });
    } finally { if (!signal?.aborted) setLoading(false); }
  }, [communityId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal);
    return () => controller.abort(); }, [load]);
  const submit = async (command: Record<string, unknown>) => {
    if (!view || pending) return;
    setPending(true); setMessage(null);
    const body = { ...command, communityId, expectedRevision: view.revision };
    const fingerprint = JSON.stringify(body);
    if (requestKey.current?.fingerprint !== fingerprint) {
      requestKey.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const response = await fetch(`/api/admin/journal/partner-channels/${communityId}`, {
        method: "POST", credentials: "same-origin", cache: "no-store",
        headers: { "content-type": "application/json", [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
          [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: requestKey.current.key },
        body: fingerprint,
      });
      const payload = record(await response.json());
      if (!response.ok || payload?.ok !== true) {
        const conflict = response.status === 409;
        setMessage({ severity: conflict ? "warning" : "error",
          text: conflict ? "This request changed. Reload before reviewing it."
            : response.status === 503 ? "The review outcome could not be confirmed. Retry the same action or reload to check the saved decision."
              : "The review action could not be saved." });
        if (response.status !== 503) requestKey.current = null;
        return;
      }
      requestKey.current = null;
      if (command.action === "requestChanges" || command.action === "declinePartner") setReason("");
      setMessage({ severity: "success", text: "The review action was saved." });
      await load();
    } catch { setMessage({ severity: "warning", text: "The review outcome could not be confirmed. Retry the unchanged action on this page to reuse its request reference. After reloading, check the saved review before trying again." }); }
    finally { setPending(false); }
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
    {view.reviewFeedback ? <Alert severity="info" sx={{ overflowWrap: "anywhere" }}>
      <AlertTitle>{view.reviewFeedback.kind === "declined" ? "Application declined" : "Changes requested"}</AlertTitle>
      <Typography variant="body2">{view.reviewFeedback.reason}</Typography>
    </Alert> : null}
    <Alert severity="info">Approval rechecks the required Discord and billing details. Approved communities still need publishing activated.</Alert>
    {showReviewActions || view.personalInspectionConfirmed ? <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography component="h2" variant="h6">Personal inspection</Typography>
      {view.personalInspectionConfirmed ? <Typography>Inspection confirmed</Typography> :
        <Button disabled={pending} onClick={() => void submit({ action: "confirmInspection" })}>
          Confirm I inspected all channels
        </Button>}
    </Paper> : null}
    <Paper variant="outlined" sx={{ p: 2.5 }}><Typography component="h2" variant="h6">Channel mappings</Typography>
      <Stack divider={<Divider flexItem />} spacing={2} sx={{ mt: 1.5 }}>{view.mappings.map(mapping => {
        const selected = destinations[mapping.mappingId] ?? { channel: mapping.destinationChannelId ?? "", role: mapping.destinationRoleId ?? "" };
        return <Stack key={mapping.mappingId} spacing={1.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Typography sx={{ flex: 1, fontWeight: 800 }}>{mapping.displayName}</Typography>
            {mapping.deliveryPaused ? <Chip label="Delivery paused" size="small" color="warning" /> : null}
            <Chip label={mapping.reviewState} size="small" />
          </Stack>
          {mapping.reviewState === "awaiting_approval" ? <Stack direction={{ xs: "column", md: "row" }} spacing={1}>
            <TextField label="Destination channel ID" onChange={event => {
              const channel = event.target.value;
              setDestinations(current => ({ ...current, [mapping.mappingId]: { ...(current[mapping.mappingId] ?? selected), channel } }));
            }} size="small" value={selected.channel} />
            <TextField label="Dedicated role ID" onChange={event => {
              const role = event.target.value;
              setDestinations(current => ({ ...current, [mapping.mappingId]: { ...(current[mapping.mappingId] ?? selected), role } }));
            }} size="small" value={selected.role} />
            <Button disabled={pending || !selected.channel || !selected.role} onClick={() => void submit({ action: "approveMapping",
              mappingId: mapping.mappingId, expectedMappingRevision: mapping.revision,
              destinationChannelId: selected.channel, destinationRoleId: selected.role })} variant="outlined">Approve channel</Button>
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
        {item.reviewState === "awaiting_approval" ? <Button disabled={pending} onClick={() => void submit({ action: "approveOffer",
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
            <Button disabled={pending || reason.trim().length === 0} onClick={() => void submit({ action: "requestChanges", reason: reason.trim() })} variant="outlined">Request changes</Button>
            <Button disabled={pending || reason.trim().length === 0} onClick={() => {
              if (window.confirm("Decline this application? The publisher can update it and submit again.")) {
                void submit({ action: "declinePartner", reason: reason.trim() });
              }
            }} variant="outlined" color="error">Decline application</Button>
            <Button disabled={pending} onClick={() => void submit({ action: "approvePartner" })} variant="contained">Approve partner</Button>
          </> : null}
          {(canActivate || (canResume && !view.reviewRequested)) && <Button disabled={pending}
            onClick={() => {
              const question = canResume ? "Recheck the approved Discord channels and resume publishing?"
                : "Activate publishing for these approved Discord channels?";
              if (window.confirm(question)) void submit({ action: "activatePartner" });
            }} variant="contained">{canResume ? "Recheck and resume publishing" : "Activate publishing"}</Button>}
          {canPause ? <Button disabled={pending || reason.trim().length === 0} onClick={() => {
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
