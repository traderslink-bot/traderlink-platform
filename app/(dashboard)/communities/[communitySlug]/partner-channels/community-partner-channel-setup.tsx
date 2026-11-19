"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import FormControlLabel from "@mui/material/FormControlLabel";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { DashboardPage, DashboardPanel } from "@/app/dashboard-template";
import { PartnerAlertActivityPanel } from "@/app/(dashboard)/partner-channels/partner-alert-activity-panel";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { currencyDecimals, parseMembershipAmount } from "@/src/modules/platform/contracts/platform-membership-pricing";
import type { PartnerAlertCadence } from "@/src/modules/partner-alerts/contracts/partner-alert-contracts";
import { PARTNER_ALERT_IDEMPOTENCY_HEADER } from "@/src/modules/partner-alerts/contracts/partner-alert-request";
import { PARTNER_ALERT_STRIPE_RENEWAL_LIMITS } from "@/src/modules/partner-alerts/contracts/partner-alert-validation";

import type { PartnerStripeSellerStatus } from "@/src/modules/partner-alerts/server/partner-alert-stripe-onboarding";
import type { PartnerAlertReviewFeedback } from "@/src/modules/partner-alerts/server/partner-alert-read-model";
import type { PartnerAlertDiscordSourceCatalog, PartnerAlertDiscordSourceChannel,
  PartnerAlertUnavailableDiscordSourceChannel } from "@/src/modules/partner-alerts/server/partner-alert-discord-channel-catalog";

const stripeStatusText: Record<PartnerStripeSellerStatus, string> = {
  unconnected: "Connect Stripe to receive payments for your channels and packages.",
  setup_required: "Finish your account setup in Stripe.",
  in_review: "Stripe is reviewing your account. Check back for an update.",
  ready: "Stripe is connected. Card payments and payouts are active.",
  unavailable: "Could not check your Stripe account. Reload to try again.",
};

const steps = ["Community details", "Review access", "Source channels", "Channel access and pricing", "Content rules", "Review"] as const;

type OfferTerms = Readonly<{ offerId: string; version: number; title: string; mappingIds: readonly string[];
  amountMinor: number; currency: Readonly<{ code: string; minorUnitDigits: number }>;
  cadence: PartnerAlertCadence; billingProvider?: "stripe" }>;
type SetupView = Readonly<{ communityId: string; displayName: string; status: string; revision: number;
  currentAgreementId: string | null; reviewRequested: boolean; personalInspectionConfirmed: boolean;
  reviewFeedback?: PartnerAlertReviewFeedback;
  contentPolicy: Readonly<{ blockedServerNames: readonly string[]; blockedPhrases: readonly string[];
    authorMode: "all_humans" | "allowlist"; allowedAuthorIds: readonly string[] }>;
  mappings: readonly Readonly<{ mappingId: string; sourceChannelId: string; displayName: string; reviewState: string;
    deliveryPaused?: true }>[];
  offers: readonly Readonly<{ offer: OfferTerms; reviewState: string; currentApprovedOffer?: OfferTerms }>[];
  latestAgreement: null | Readonly<{ agreementId: string; version: number; contractedChannels: number;
    accepted: boolean;
    terms: Readonly<{ pricingSource: string }>; quote: Readonly<{ totalMinor: number;
      currency: Readonly<{ code: string; minorUnitDigits: number }>; cadence: Readonly<{ unit: string; count: number }> }> }> }>;

function setupView(value: unknown): SetupView | null {
  if (!value || typeof value !== "object") return null;
  const envelope = value as Record<string, unknown>;
  if (envelope.ok !== true || !envelope.result || typeof envelope.result !== "object") return null;
  const result = envelope.result as Record<string, unknown>;
  if (typeof result.communityId !== "string" || typeof result.displayName !== "string"
    || typeof result.status !== "string" || !Number.isInteger(result.revision)
    || !Array.isArray(result.mappings) || !Array.isArray(result.offers)) return null;
  return result as unknown as SetupView;
}

function money(amount: number, currency: { code: string; minorUnitDigits: number }): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.code, currencyDisplay: "code",
    minimumFractionDigits: currency.minorUnitDigits, maximumFractionDigits: currency.minorUnitDigits })
    .format(amount / (10 ** currency.minorUnitDigits));
}

function offerPrice(value: string, code: string): { amountMinor: number; minorUnitDigits: number } | null {
  try {
    const minorUnitDigits = currencyDecimals(code);
    const amountMinor = parseMembershipAmount(value, code);
    return minorUnitDigits <= 3 && amountMinor > 0 ? { amountMinor, minorUnitDigits } : null;
  } catch { return null; }
}

function recurringTerms(cadence: PartnerAlertCadence): string {
  const unit = cadence.unit === "day" ? "day" : "month";
  return cadence.count === 1 ? `every ${unit}` : `every ${cadence.count} ${unit}s`;
}

function editableAmount(offer: OfferTerms): string {
  const digits = offer.currency.minorUnitDigits;
  const amount = String(offer.amountMinor).padStart(digits + 1, "0");
  return digits === 0 ? amount : `${amount.slice(0, -digits)}.${amount.slice(-digits)}`;
}

const offerReviewCopy: Readonly<Record<string, string>> = { approved: "Approved", awaiting_approval: "Under review", draft: "Draft" };
const unavailableChannelReason: Record<PartnerAlertUnavailableDiscordSourceChannel["reason"], string> = {
  unsupported_type: "Unsupported channel type",
  missing_bot_permissions: "The bot needs View Channel and Read Message History",
  permissions_unverified: "Discord permissions could not be verified",
};

export function CommunityPartnerChannelSetup({ communityId, stripeStatus, stripeExistingEnabled, stripeNotice, stripeOfferDrafts }: {
  communityId: string; stripeOfferDrafts?: boolean; stripeStatus?: PartnerStripeSellerStatus; stripeExistingEnabled?: boolean; stripeNotice?: "refresh" | "link_failed";
}) {
  const [consent, setConsent] = useState(false);
  const [step, setStep] = useState(0);
  const [view, setView] = useState<SetupView | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [missing, setMissing] = useState(false);
  const [message, setMessage] = useState<{ severity: "success" | "warning" | "error"; text: string } | null>(null);
  const [discordName, setDiscordName] = useState<string | null>(null);
  const [blockedPhrases, setBlockedPhrases] = useState("");
  const [authorPolicy, setAuthorPolicy] = useState<Readonly<{
    authorMode: "all_humans" | "allowlist"; allowedAuthorIds: readonly string[] }>>({
      authorMode: "all_humans", allowedAuthorIds: [],
    });
  const [sourceChannelId, setSourceChannelId] = useState("");
  const [sourceChannels, setSourceChannels] = useState<readonly PartnerAlertDiscordSourceChannel[]>([]);
  const [unavailableSourceChannels, setUnavailableSourceChannels] = useState<readonly PartnerAlertUnavailableDiscordSourceChannel[]>([]);
  const [sourceChannelsLoading, setSourceChannelsLoading] = useState(false);
  const [sourceChannelsUnavailable, setSourceChannelsUnavailable] = useState(false);
  const [offerTitle, setOfferTitle] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerCurrency, setOfferCurrency] = useState("USD");
  const [cadenceUnit, setCadenceUnit] = useState<PartnerAlertCadence["unit"]>("calendar_month");
  const [cadenceCount, setCadenceCount] = useState("1");
  const [selectedMappings, setSelectedMappings] = useState<ReadonlySet<string>>(() => new Set());
  const [editingOffer, setEditingOffer] = useState<OfferTerms | null>(null);
  const offerNameInput = useRef<HTMLInputElement>(null);
  const requestKey = useRef<{ fingerprint: string; key: string } | null>(null);
  const sourceCatalogGeneration = useRef(0);
  const mappingDraftId = useRef<string | null>(null);
  const offerDraftId = useRef<string | null>(null);
  const detailsEdited = useRef(false);
  const price = offerPrice(offerAmount, offerCurrency);
  const count = Number(cadenceCount);
  const validCadence = /^\d+$/u.test(cadenceCount) && count >= 1 && count <= PARTNER_ALERT_STRIPE_RENEWAL_LIMITS[cadenceUnit];
  const pricingChanged = offerTitle !== (editingOffer?.title ?? "")
    || offerAmount !== (editingOffer ? editableAmount(editingOffer) : "")
    || offerCurrency !== (editingOffer?.currency.code ?? "USD")
    || cadenceUnit !== (editingOffer?.cadence.unit ?? "calendar_month") || cadenceCount !== String(editingOffer?.cadence.count ?? 1)
    || selectedMappings.size !== (editingOffer?.mappingIds.length ?? 0)
    || Boolean(editingOffer?.mappingIds.some(id => !selectedMappings.has(id)));
  const dirty = blockedPhrases !== (view?.contentPolicy.blockedPhrases.join("\n") ?? "") || sourceChannelId !== "" || pricingChanged;
  const populateOffer = (offer: OfferTerms | null) => {
    setEditingOffer(offer);
    offerDraftId.current = null;
    setOfferTitle(offer?.title ?? "");
    setOfferAmount(offer ? editableAmount(offer) : "");
    setOfferCurrency(offer?.currency.code ?? "USD");
    setCadenceUnit(offer?.cadence.unit ?? "calendar_month");
    setCadenceCount(String(offer?.cadence.count ?? 1));
    setSelectedMappings(new Set(offer?.mappingIds.filter(id =>
      view?.mappings.some(mapping => mapping.mappingId === id && mapping.reviewState !== "withdrawn"))));
  };
  useEffect(() => {
    if (!dirty) return;
    const protectDraft = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", protectDraft);
    return () => window.removeEventListener("beforeunload", protectDraft);
  }, [dirty]);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/partner-channels/communities/${communityId}`, {
        cache: "no-store", credentials: "same-origin", signal,
      });
      if (response.status === 404) { setView(null); setMissing(true); setMessage(null); return; }
      if (!response.ok) throw new Error("unavailable");
      const next = setupView(await response.json());
      if (signal?.aborted) return;
      if (!next || next.communityId !== communityId) throw new Error("unavailable");
      setView(next); setMissing(false);
      if (!detailsEdited.current) {
        setBlockedPhrases(next.contentPolicy.blockedPhrases.join("\n"));
      }
      setAuthorPolicy(Object.freeze({ authorMode: next.contentPolicy.authorMode,
        allowedAuthorIds: Object.freeze([...next.contentPolicy.allowedAuthorIds]) }));
      setMessage(null);
    } catch { if (!signal?.aborted) setMessage({ severity: "warning",
      text: "Publishing setup is temporarily unavailable. No settings were changed." }); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [communityId]);
  useEffect(() => { const controller = new AbortController(); void load(controller.signal);
    return () => controller.abort(); }, [load]);
  useEffect(() => {
    if (step !== 0 && step !== 2) return;
    const generation = ++sourceCatalogGeneration.current;
    const controller = new AbortController();
    setSourceChannelsLoading(true); setSourceChannelsUnavailable(false); setSourceChannels([]);
    setUnavailableSourceChannels([]); setSourceChannelId("");
    void fetch(`/api/partner-channels/communities/${communityId}/source-channels`, {
      cache: "no-store", credentials: "same-origin", signal: controller.signal,
    }).then(async response => {
      const body = await response.json() as { ok?: boolean; result?: Partial<PartnerAlertDiscordSourceCatalog> };
      if (!response.ok || body.ok !== true || !body.result?.guildName || !Array.isArray(body.result.channels)) throw new Error("unavailable");
      if (controller.signal.aborted || generation !== sourceCatalogGeneration.current) return;
      setDiscordName(body.result.guildName);
      setSourceChannels(body.result.channels);
      setUnavailableSourceChannels(body.result.unavailableChannels ?? []);
      setSourceChannelsUnavailable(false);
    }).catch(() => { if (!controller.signal.aborted && generation === sourceCatalogGeneration.current) {
      setDiscordName(null); setSourceChannels([]); setUnavailableSourceChannels([]);
      setSourceChannelId(""); setSourceChannelsUnavailable(true);
    } }).finally(() => { if (!controller.signal.aborted && generation === sourceCatalogGeneration.current) {
      setSourceChannelsLoading(false);
    } });
    return () => { controller.abort(); sourceCatalogGeneration.current += 1; };
  }, [communityId, step, view]);
  const refreshDiscordNames = async () => {
    setPending(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/partner-channels/communities/${communityId}/source-channels`, {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
      });
      if (!response.ok) throw new Error("Discord names unavailable");
      await load();
      setMessage({ severity: "success", text: "Discord names refreshed." });
    } catch {
      setMessage({ severity: "warning", text: "Discord names could not be refreshed. Try again." });
    } finally {
      setPending(false);
    }
  };
  const submit = async (command: Record<string, unknown>) => {
    if (pending) return;
    setPending(true); setMessage(null);
    const body = { ...command, communityId, expectedRevision: view?.revision ?? 0 };
    const fingerprint = JSON.stringify(body);
    if (requestKey.current?.fingerprint !== fingerprint) {
      requestKey.current = { fingerprint, key: crypto.randomUUID() };
    }
    try {
      const response = await fetch(`/api/partner-channels/communities/${communityId}`, {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
          [PARTNER_ALERT_IDEMPOTENCY_HEADER]: requestKey.current.key },
        body: fingerprint,
      });
      let result: { ok?: boolean };
      try { result = await response.json() as { ok?: boolean }; }
      catch { setMessage({ severity: "warning",
        text: "The save outcome could not be confirmed. Without changing these fields, retry on this page to reuse the same request reference. If you reload, check the saved setup before creating anything new." }); return; }
      if (!response.ok || result.ok !== true) {
        setMessage({ severity: response.status === 409 ? "warning" : "error",
          text: response.status === 409 ? "Your publishing setup changed. Reload before saving."
            : "This step could not be saved. No publishing change was made." });
        if (response.status !== 503) requestKey.current = null;
        return;
      }
      requestKey.current = null;
      if (command.action === "savePartnerDraft") detailsEdited.current = false;
      if (command.action === "saveMappingDraft") {
        mappingDraftId.current = null; setSourceChannelId("");
      }
      if (command.action === "saveOfferVersion") populateOffer(null);
      setMessage({ severity: "success", text: "This setup step was saved." });
      await load();
    } catch { setMessage({ severity: "warning",
      text: "The save outcome could not be confirmed. Without changing these fields, retry on this page to reuse the same request reference. If you reload, check the saved setup before creating anything new." }); }
    finally { setPending(false); }
  };
  const [stripePending, setStripePending] = useState(false);
  const [stripeFailed, setStripeFailed] = useState(false);
  const startStripe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    const data = new FormData(event.currentTarget, submitter);
    const body = new URLSearchParams();
    for (const [key, value] of data) if (typeof value === "string") body.set(key, value);
    setStripeFailed(false);
    setStripePending(true);
    try {
      const response = await fetch(`/api/partner-channels/communities/${encodeURIComponent(communityId)}/stripe-onboarding`, {
        method: "POST", headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body,
      });
      if (!response.ok) throw new Error("Stripe setup unavailable.");
      const { url } = await response.json() as { url: string };
      window.location.assign(url);
    } catch {
      setStripeFailed(true);
      setStripePending(false);
    }
  };
  const reviewFeedback = view?.reviewFeedback;
  const inspectionStatus = view?.personalInspectionConfirmed ? "Inspection confirmed" : "Inspection pending";
  const canSubmit = view && !view.reviewRequested && ["draft", "active", "setup_required"].includes(view.status);
  return <DashboardPage>
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <Box sx={{ flex: 1 }}>
          <Typography component="h1" variant="h1">Publish channels</Typography>
          {discordName ? <Typography color="text.secondary" variant="body2">{discordName}</Typography> : null}
        </Box>
        <Chip label={(view?.status ?? "Draft").replaceAll("_", " ")} />
      </Stack>
      <Alert severity="info">TraderLink verifies ownership and the required Discord and billing details when saving. Submitting sends your setup for review.</Alert>
      {reviewFeedback ? <Alert severity="warning" sx={{ overflowWrap: "anywhere" }}>
        <AlertTitle>{reviewFeedback.kind === "declined" ? "Application declined" : "Changes requested"}</AlertTitle>
        <Typography variant="body2">{reviewFeedback.reason}</Typography>
      </Alert> : null}
      {stripeStatus ? <Paper variant="outlined" sx={{ p: 2.5 }}>
        <Stack spacing={1.5}>
          <Typography component="h2" variant="h6">Stripe payouts</Typography>
          <Typography role="status" variant="body2">{stripeStatusText[stripeStatus]}</Typography>
          {stripeFailed || stripeNotice === "link_failed" ? <Alert severity="error">Stripe setup could not open. Try again.</Alert> : null}
          {stripeNotice === "refresh" && stripeStatus === "setup_required"
            ? <Alert severity="info">That Stripe link expired. Continue setup to open a new link.</Alert> : null}
          {stripeStatus === "unconnected" || stripeStatus === "setup_required"
            ? <Stack component="form" onSubmit={startStripe}
                direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
                {stripeStatus === "unconnected" ? <TextField name="country" label="Business country code"
                  helperText="Two letters, such as US or CA" required size="small"
                  slotProps={{ htmlInput: { minLength: 2, maxLength: 2, pattern: "[A-Za-z]{2}", autoCapitalize: "characters" } }} /> : null}
                {stripeStatus === "unconnected" && stripeExistingEnabled
                  ? <Button type="submit" name="method" value="existing" formNoValidate variant="outlined" disabled={stripePending}>
                    Connect existing Stripe account
                  </Button> : null}
                <Button type="submit" variant="contained" disabled={stripePending}>{stripePending ? "Opening Stripe…" : stripeStatus === "unconnected" ? "Connect Stripe" : "Continue Stripe setup"}</Button>
              </Stack> : null}
        </Stack>
      </Paper> : null}
      {dirty ? <Alert role="status" severity="info">You have unsaved changes. Save each edited step before leaving this page.</Alert> : null}
      {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
      {loading && !view ? <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 1.5, p: 2.5 }}>
        <CircularProgress size={22} /><Typography>Loading publishing setup…</Typography>
      </Paper> : null}
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "260px minmax(0, 1fr)" } }}>
        <Paper variant="outlined" sx={{ display: { xs: "none", md: "block" }, p: 1 }}>
          <List aria-label="Partner channel setup steps">
            {steps.map((label, index) => <ListItemButton key={label} onClick={() => setStep(index)} selected={step === index}>
              <ListItemText primary={`${index + 1}. ${label}`} />
            </ListItemButton>)}
          </List>
        </Paper>
        <Stack spacing={1.5}>
          <Box sx={{ display: { xs: "block", md: "none" } }}>
            <Typography sx={{ color: theme => theme.palette.text.primary, fontWeight: 800 }} variant="body2">Step {step + 1} of {steps.length}: {steps[step]}</Typography>
            <LinearProgress sx={{ mt: 1 }} value={((step + 1) / steps.length) * 100} variant="determinate" />
          </Box>
          <DashboardPanel title={steps[step]}>
            {step === 0 && <Stack spacing={1.5}>
              {sourceChannelsLoading ? <Typography>Checking Discord server…</Typography> : null}
              {sourceChannelsUnavailable ? <Alert severity="warning">Could not verify the Discord server. Reconnect the bot or reload to try again.</Alert> : null}
              {discordName ? <Typography>Discord server: {discordName}</Typography> : null}
              {view && <Button disabled={pending || sourceChannelsLoading} onClick={() => void refreshDiscordNames()}>
                Refresh Discord names
              </Button>}
              <TextField helperText="Optional. Enter one additional phrase per line."
                disabled={pending} label="Additional blocked phrases" minRows={2} multiline onChange={event => {
                  detailsEdited.current = true; setBlockedPhrases(event.target.value);
                }} value={blockedPhrases} />
              <Button disabled={pending || sourceChannelsLoading || !discordName}
                onClick={() => { if (discordName) void submit({ action: "savePartnerDraft", displayName: discordName,
                  contentPolicy: { blockedServerNames: [],
                    blockedPhrases: blockedPhrases.split("\n").map(value => value.trim()).filter(Boolean),
                    authorMode: authorPolicy.authorMode, allowedAuthorIds: [...authorPolicy.allowedAuthorIds] } }); }} variant="contained">
                {missing ? "Save community details" : "Save changes"}
              </Button>
            </Stack>}
            {step === 1 && <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
              <Typography>Give the TraderLink owner free access to inspect all channels in your Discord server, including paid and private channels.</Typography>
              {view || missing ? <Chip label={inspectionStatus} color={view?.personalInspectionConfirmed ? "success" : "default"} /> : null}
            </Stack>}
            {step === 2 && <Stack spacing={1.5}><Typography color="text.secondary">Choose a Discord text or announcement channel to publish.</Typography>
              {view?.mappings.map(mapping => <Chip key={mapping.mappingId} color={mapping.deliveryPaused ? "warning" : "default"}
                label={`${sourceChannels.find(channel => channel.channelId === mapping.sourceChannelId)?.name ?? mapping.displayName} · ${mapping.deliveryPaused ? "Delivery paused" : mapping.reviewState}`} />)}
              <TextField disabled={pending || !view || sourceChannelsLoading || sourceChannelsUnavailable
                || (!sourceChannels.length && !unavailableSourceChannels.length)} label="Discord source channel" select
                helperText={discordName && !sourceChannelsLoading && !sourceChannels.length ? "No channels are available to add." : undefined}
                onChange={event => setSourceChannelId(event.target.value)} value={sourceChannelId}>
                {sourceChannels.map(channel => <MenuItem key={channel.channelId} value={channel.channelId}>{channel.name}</MenuItem>)}
                {unavailableSourceChannels.map(channel => <MenuItem key={channel.channelId} value={channel.channelId} disabled sx={{ whiteSpace: "normal" }}>
                  <Stack sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
                    <Typography component="span">{channel.name}</Typography>
                    <Typography component="span" variant="caption">{unavailableChannelReason[channel.reason]}</Typography>
                  </Stack>
                </MenuItem>)}
              </TextField>
              {sourceChannelsLoading ? <Typography color="text.secondary" variant="caption">Loading readable text channels…</Typography> : null}
              {sourceChannelsUnavailable ? <Alert severity="warning">Source channels could not be verified. No channel was added.</Alert> : null}
              <Button disabled={pending || sourceChannelsLoading || sourceChannelsUnavailable || !view
                || !sourceChannels.some(channel => channel.channelId === sourceChannelId)}
                onClick={() => {
                  const channel = sourceChannels.find(item => item.channelId === sourceChannelId);
                  if (!channel) return;
                  const mappingId = mappingDraftId.current ?? crypto.randomUUID();
                  mappingDraftId.current = mappingId;
                  void submit({ action: "saveMappingDraft", mappingId, sourceChannelId, displayName: channel.name });
                }}
                variant="contained">Add source channel</Button>
            </Stack>}
            {step === 3 && <Stack spacing={1.5}>
              {view?.offers.map(({ offer, reviewState, currentApprovedOffer }) => <Stack key={offer.offerId} spacing={0.5}>
                <Typography sx={{ fontWeight: 700 }}>{offer.title}</Typography>
                <Typography variant="body2">{money(offer.amountMinor, offer.currency)} {recurringTerms(offer.cadence)}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {view.mappings.filter(mapping => offer.mappingIds.includes(mapping.mappingId)).map(mapping => mapping.displayName).join(" · ")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {offer.billingProvider === "stripe" ? offerReviewCopy[reviewState] : "Existing Whop subscriptions"}
                </Typography>
                {currentApprovedOffer ? <Typography variant="body2" color="text.secondary">
                  Currently approved {money(currentApprovedOffer.amountMinor, currentApprovedOffer.currency)} {recurringTerms(currentApprovedOffer.cadence)}
                  {" · "}{view.mappings.filter(mapping => currentApprovedOffer.mappingIds.includes(mapping.mappingId)).map(mapping => mapping.displayName).join(" · ")}
                </Typography> : null}
                {offer.billingProvider === "stripe" && stripeOfferDrafts && !view.reviewRequested ? <Button variant="outlined"
                  sx={{ alignSelf: "flex-start" }} disabled={pending || editingOffer?.offerId === offer.offerId}
                  aria-label={`Edit ${offer.title}`} onClick={() => {
                    if (pricingChanged && !window.confirm("Discard the unsaved pricing changes?")) return;
                    populateOffer(offer);
                    offerNameInput.current?.focus();
                  }}>Edit offer</Button> : null}
              </Stack>)}
              {view?.reviewRequested ? <Typography color="text.secondary">Pricing changes can be made after this review ends.</Typography>
                : !stripeOfferDrafts ? <Alert severity="info">
                {stripeStatus === "unconnected" ? "Connect your Stripe account above to add paid offers."
                  : stripeStatus === "setup_required" || stripeStatus === "in_review" ? stripeStatusText[stripeStatus]
                  : "Stripe pricing is temporarily unavailable. Reload to try again."}
              </Alert> : <>
              {editingOffer ? <Alert severity="info">Changes to {editingOffer.title} need approval. Existing subscriptions keep the price, billing period and channels they purchased.</Alert> : null}
              <Typography color="text.secondary">Select one channel to sell it individually, or select multiple channels to sell them as a package.</Typography>
              {view?.mappings.filter(mapping => mapping.reviewState !== "withdrawn").map(mapping => <FormControlLabel key={mapping.mappingId} label={mapping.displayName}
                control={<Checkbox checked={selectedMappings.has(mapping.mappingId)} onChange={event => {
                  const checked = event.target.checked;
                  setSelectedMappings(current => {
                    const next = new Set(current); if (checked) next.add(mapping.mappingId); else next.delete(mapping.mappingId); return next;
                  });
                }} />} />)}
              <TextField inputRef={offerNameInput} label="Offer name" onChange={event => setOfferTitle(event.target.value)} value={offerTitle} />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField fullWidth label="Price" onChange={event => setOfferAmount(event.target.value)}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }} value={offerAmount} />
                <TextField label="Currency" onChange={event => setOfferCurrency(event.target.value.toUpperCase())} value={offerCurrency} />
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField label="Bill every" onChange={event => setCadenceCount(event.target.value)} value={cadenceCount}
                  slotProps={{ htmlInput: { inputMode: "numeric" } }} error={cadenceCount !== "" && !validCadence}
                  helperText={cadenceCount !== "" && !validCadence ? `Enter 1 to ${PARTNER_ALERT_STRIPE_RENEWAL_LIMITS[cadenceUnit]}.` : undefined} />
                <TextField select label="Billing unit" onChange={event => setCadenceUnit(event.target.value as PartnerAlertCadence["unit"])} value={cadenceUnit}>
                  <MenuItem value="day">Days</MenuItem>
                  <MenuItem value="calendar_month">Months</MenuItem>
                </TextField>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button disabled={pending || !view || !pricingChanged || selectedMappings.size === 0 || offerTitle.trim().length === 0
                  || !price || !validCadence}
                  onClick={() => { if (!price || !validCadence) return;
                    const offerId = editingOffer?.offerId ?? offerDraftId.current ?? crypto.randomUUID(); offerDraftId.current = offerId;
                    void submit({ action: "saveOfferVersion", offer: { offerId,
                    communityId, version: (editingOffer?.version ?? 0) + 1, kind: selectedMappings.size === 1 ? "channel" : "package",
                    title: offerTitle.trim(), mappingIds: [...selectedMappings],
                    currency: { code: offerCurrency, minorUnitDigits: price.minorUnitDigits },
                    amountMinor: price.amountMinor, cadence: { unit: cadenceUnit, count }, billingProvider: "stripe" } }); }}
                  variant="contained">{editingOffer ? "Save offer changes" : "Save paid offer"}</Button>
                {editingOffer ? <Button disabled={pending} variant="outlined" onClick={() => populateOffer(null)}>Cancel editing</Button> : null}
              </Stack>
              </>}
            </Stack>}
            {step === 4 && <Typography color="text.secondary">Text only. Links, invites, media, attachments, mass mentions, source-server promotion, and chat are not allowed. Failed messages are held.</Typography>}
            {step === 5 && <Stack spacing={1.5}>
              {view ? <>
                <Typography variant="body2" color="text.secondary">{inspectionStatus}</Typography>
                <Box>
                  <Typography component="h3" variant="subtitle2">Source channels</Typography>
                  {view.mappings.filter(mapping => mapping.reviewState !== "withdrawn").map(mapping => (
                    <Typography variant="body2" key={mapping.mappingId}>
                      {sourceChannels.find(channel => channel.channelId === mapping.sourceChannelId)?.name ?? mapping.displayName}
                    </Typography>
                  ))}
                </Box>
                <Box>
                  <Typography component="h3" variant="subtitle2">Offers</Typography>
                  {view.offers.map(({ offer }) => <Typography variant="body2" key={offer.offerId}>
                    {offer.title} · {money(offer.amountMinor, offer.currency)} {recurringTerms(offer.cadence)}
                  </Typography>)}
                </Box>
              </> : null}
              <FormControlLabel control={<Checkbox checked={consent} onChange={event => setConsent(event.target.checked)} />} label="I consent to TraderLink republishing alerts from the selected Discord channels." />
              <Button disabled={pending || !canSubmit || !consent} onClick={() => void submit({ action: "submitRequest", rulesVersion: 1 })} variant="contained">
                {view?.reviewRequested ? "Under review" : reviewFeedback ? "Resubmit for review" : "Submit for review"}
              </Button></Stack>}
          </DashboardPanel>
          <Stack direction="row" spacing={1} sx={{ display: { xs: "flex", md: "none" }, justifyContent: "space-between" }}>
            <Button disabled={step === 0} onClick={() => setStep((current) => Math.max(0, current - 1))} variant="outlined">Back</Button>
            <Button disabled={step === steps.length - 1} onClick={() => setStep((current) => Math.min(steps.length - 1, current + 1))} variant="contained">Continue</Button>
          </Stack>
        </Stack>
      </Box>
      {view && ["active", "publishing_paused", "suspended", "ended"].includes(view.status)
        ? <PartnerAlertActivityPanel key={communityId} endpoint={`/api/partner-channels/communities/${communityId}`} /> : null}
    </Stack>
  </DashboardPage>;
}
