"use client";

import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Drawer from "@mui/material/Drawer";
import FormControlLabel from "@mui/material/FormControlLabel";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "@/app/dashboard-template";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

import type { PartnerAlertDiscordDestination } from "@/src/modules/partner-alerts/server/partner-alert-subscriber-access";
import type { PartnerAlertCatalogSaleState } from "@/src/modules/partner-alerts/server/partner-alert-catalog-read";

export type PartnerChannelCatalogItem = Readonly<{
  communityId: string;
  offerKey: string;
  communityName: string;
  channels: readonly string[];
  price: string;
  cadence: string;
  access: "available" | "subscribed" | "attention";
  saleState?: PartnerAlertCatalogSaleState;
  checkoutHref: string | null;
  billingProvider?: "stripe" | "whop";
  destinations?: readonly PartnerAlertDiscordDestination[];
  coveredChannels?: readonly string[];
  stripeCheckout?: boolean;
}>;

type Filter = "available" | "subscribed" | "attention";

const accessCopy = {
  available: { color: "default" as const, label: "Available" },
  subscribed: { color: "success" as const, label: "Subscribed" },
  attention: { color: "warning" as const, label: "Access needs attention" },
};

const communitySubscriptionCopy = {
  available: "Not subscribed",
  subscribed: "Active",
  attention: "Needs verification",
} as const;

const saleStateCopy = { paused: "Publishing paused", previous: "Previous offer", closed: "Sales closed" } as const;

function CatalogFilters({
  active,
  name,
  onActive,
  onName,
}: {
  active: ReadonlySet<Filter>;
  name: string;
  onActive: (filter: Filter, checked: boolean) => void;
  onName: (value: string) => void;
}) {
  return <Stack spacing={1.5}>
    <TextField
      fullWidth
      label="Community name"
      onChange={(event) => onName(event.target.value)}
      size="small"
      value={name}
    />
    {(["available", "subscribed", "attention"] as const).map((filter) => <FormControlLabel
      control={<Switch
        checked={active.has(filter)}
        onChange={(event) => onActive(filter, event.target.checked)}
      />}
      key={filter}
      label={accessCopy[filter].label}
    />)}
  </Stack>;
}

export function PartnerChannelCatalog({
  items,
  catalogStatus,
  premiumStatus,
}: {
  items: readonly PartnerChannelCatalogItem[];
  catalogStatus: "ready" | "unavailable";
  premiumStatus: "active" | "attention" | "checking" | "unavailable";
}) {
  const [mobileFilters, setMobileFilters] = useState(false);
  const [selected, setSelected] = useState<PartnerChannelCatalogItem | null>(null);
  const [checking, setChecking] = useState(false);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  const [accessOverrides, setAccessOverrides] = useState<Readonly<Record<string, PartnerChannelCatalogItem["access"]>>>({});
  const checkGeneration = useRef(0);
  const checkController = useRef<AbortController | null>(null);
  const checkoutController = useRef<AbortController | null>(null);
  const selectedKey = useRef<string | null>(null);
  const authoritativeItems = useRef(items);
  const [name, setName] = useState("");
  const [active, setActive] = useState<ReadonlySet<Filter>>(() => new Set());
  const filtered = useMemo(() => {
    const query = name.trim().toLocaleLowerCase();
    return items.map(item => ({ ...item, access: accessOverrides[`${item.communityId}:${item.offerKey}`] ?? item.access }))
      .filter((item) => (!query || item.communityName.toLocaleLowerCase().includes(query))
        && (active.size === 0 || active.has(item.access)));
  }, [accessOverrides, active, items, name]);
  const setFilter = (filter: Filter, checked: boolean) => setActive((current) => {
    const next = new Set(current);
    if (checked) next.add(filter); else next.delete(filter);
    return next;
  });
  useEffect(() => {
    if (authoritativeItems.current === items) return;
    authoritativeItems.current = items;
    const selected = items.find(item => `${item.communityId}:${item.offerKey}` === selectedKey.current) ?? null;
    if (!selected?.stripeCheckout || selected.saleState) {
      checkoutController.current?.abort(); checkoutController.current = null;
    }
    checkController.current?.abort(); checkGeneration.current += 1;
    setAccessOverrides({}); setChecking(checkoutController.current !== null); setAccessMessage(null);
    selectedKey.current = selected ? `${selected.communityId}:${selected.offerKey}` : null;
    setSelected(selected);
  }, [items]);
  const status = premiumStatus === "active"
    ? { color: "success" as const, label: "Active" }
    : premiumStatus === "attention"
      ? { color: "warning" as const, label: "Action needed" }
      : premiumStatus === "unavailable"
        ? { color: "warning" as const, label: "Verification unavailable" }
      : { color: "default" as const, label: "Checking" };
  const startStripeCheckout = async () => {
    if (!selected?.stripeCheckout || selected.saleState || checking || checkoutController.current) return;
    const { communityId, offerKey } = selected;
    const targetKey = `${communityId}:${offerKey}`;
    const controller = new AbortController();
    checkoutController.current = controller;
    const isCurrent = () => !controller.signal.aborted && checkoutController.current === controller && selectedKey.current === targetKey;
    setChecking(true);
    setAccessMessage(null);
    try {
      const response = await fetch(`/api/partner-channels/communities/${encodeURIComponent(communityId)}/offers/${encodeURIComponent(offerKey)}/checkout`, {
        method: "POST", credentials: "same-origin", signal: controller.signal,
        headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
      });
      if (!response.ok) throw new Error();
      const url = new URL((await response.json()).url);
      if (url.origin !== "https://checkout.stripe.com" || url.username || url.password) throw new Error();
      if (isCurrent()) window.location.assign(url.href);
    } catch {
      if (isCurrent()) setAccessMessage("Stripe checkout is temporarily unavailable.");
    } finally {
      if (checkoutController.current === controller) {
        checkoutController.current = null;
        setChecking(false);
      }
    }
  };
  const checkAccess = async () => {
    if (!selected || selected.saleState === "closed" || checking) return;
    const target = Object.freeze({ communityId: selected.communityId, offerKey: selected.offerKey });
    const targetKey = `${target.communityId}:${target.offerKey}`;
    const generation = ++checkGeneration.current;
    const controller = new AbortController(); checkController.current?.abort(); checkController.current = controller;
    setChecking(true); setAccessMessage(null);
    if (selected.access === "subscribed") {
      setAccessOverrides(current => ({ ...current, [targetKey]: "attention" }));
      setSelected({ ...selected, access: "attention" });
    }
    try {
      const response = await fetch(`/api/partner-channels/communities/${encodeURIComponent(target.communityId)}/offers/${encodeURIComponent(target.offerKey)}/access`, {
        method: "POST", cache: "no-store", credentials: "same-origin",
        headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, signal: controller.signal,
      });
      const body = await response.json() as { ok?: boolean; code?: string;
        result?: { access?: string; destinations?: readonly PartnerAlertDiscordDestination[] }; message?: string };
      if (controller.signal.aborted || generation !== checkGeneration.current || selectedKey.current !== targetKey) return;
      if (response.ok && body.ok === true && body.result?.access === "subscribed") {
        setAccessOverrides(current => ({ ...current, [targetKey]: "subscribed" }));
        const destinations = body.result.destinations;
        setSelected(current => current && `${current.communityId}:${current.offerKey}` === targetKey
          ? { ...current, access: "subscribed", destinations } : current);
        setAccessMessage("Access is active.");
      } else if (response.ok && body.ok === true && body.code === "eligible") {
        setAccessMessage("Your paid subscriptions were verified. Discord channel access is not active.");
      } else if (response.status === 403 && body.code === "subscription_required") {
        setAccessMessage("You need paid TraderLink Premium and a current subscription to this offer.");
      } else {
        setAccessMessage(body.message ?? "Access could not be verified. No access was changed.");
      }
    } catch { if (!controller.signal.aborted && generation === checkGeneration.current && selectedKey.current === targetKey) {
      setAccessMessage("Access could not be verified. No access was changed.");
    } }
    finally { if (generation === checkGeneration.current && selectedKey.current === targetKey) setChecking(false); }
  };
  const openChannels = (item: PartnerChannelCatalogItem) => {
    checkoutController.current?.abort(); checkoutController.current = null;
    checkController.current?.abort(); checkGeneration.current += 1;
    const key = `${item.communityId}:${item.offerKey}`; selectedKey.current = key;
    setChecking(false); setAccessMessage(null);
    setSelected({ ...item, access: accessOverrides[key] ?? item.access });
  };
  const closeChannels = () => {
    checkoutController.current?.abort(); checkoutController.current = null;
    checkController.current?.abort(); checkGeneration.current += 1; selectedKey.current = null;
    setChecking(false); setAccessMessage(null); setSelected(null);
  };

  return <DashboardPage>
    <Stack spacing={2.5}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Typography component="h1" sx={{ flex: 1 }} variant="h1">Partner Channels</Typography>
        <Paper variant="outlined" sx={{ alignItems: "center", display: "flex", gap: 1, px: 1.5, py: 1 }}>
          <Typography sx={{ fontWeight: 700 }} variant="body2">TraderLink Premium</Typography>
          <Chip color={status.color} label={status.label} size="small" />
        </Paper>
      </Stack>

      <Box sx={{ display: { xs: "block", md: "none" } }}>
        <DashboardSecondaryAction fullWidth onClick={() => setMobileFilters(true)} startIcon={<FilterListRoundedIcon />}>
          Filter channels
        </DashboardSecondaryAction>
      </Box>
      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" } }}>
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <DashboardPanel title="Filter channels">
            <CatalogFilters active={active} name={name} onActive={setFilter} onName={setName} />
          </DashboardPanel>
        </Box>
        <Stack spacing={1.5}>
          {catalogStatus === "unavailable" ? <DashboardPanel title="Partner Channels unavailable">
            <Typography color="text.secondary">
              We could not verify community offers yet. Access has not changed. Try again later.
            </Typography>
          </DashboardPanel> : filtered.length === 0 ? <DashboardPanel title={items.length === 0 ? "No Partner Channels available" : "No channels match these filters"}>
            <Typography color="text.secondary">
              {items.length === 0
                ? "Approved communities and their verified channel prices will appear here when they are ready."
                : "Change or clear the filters to see other Partner Channels."}
            </Typography>
          </DashboardPanel> : filtered.map((item) => <Paper key={`${item.communityId}:${item.offerKey}`} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                <Box sx={{ flex: 1 }}>
                  <Typography component="h2" variant="h3">{item.communityName}</Typography>
                  <Typography color="text.secondary" variant="body2">{item.channels.join(" · ")}</Typography>
                </Box>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Chip color={item.saleState ? "default" : accessCopy[item.access].color}
                    label={item.saleState ? saleStateCopy[item.saleState] : accessCopy[item.access].label} size="small" />
                  <Typography sx={{ fontWeight: 800 }}>{item.price} / {item.cadence}</Typography>
                </Stack>
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
                <Typography color="text.secondary" sx={{ flex: 1 }} variant="caption">
                  {item.billingProvider === "stripe" || item.stripeCheckout
                    ? "The community handles payments, refunds, and billing through Stripe."
                    : "The community handles payments, refunds, and billing through Whop."}
                </Typography>
                <DashboardSecondaryAction onClick={() => openChannels(item)}>View channels</DashboardSecondaryAction>
              </Stack>
            </Stack>
          </Paper>)}
        </Stack>
      </Box>
    </Stack>
    <Drawer
      anchor="bottom"
      onClose={() => setMobileFilters(false)}
      open={mobileFilters}
      slotProps={{ paper: { sx: { borderRadius: "16px 16px 0 0", p: 2.5 } } }}
    >
      <Typography component="h2" sx={{ mb: 2 }} variant="h3">Filter channels</Typography>
      <CatalogFilters active={active} name={name} onActive={setFilter} onName={setName} />
    </Drawer>
    <Dialog fullWidth maxWidth="sm" onClose={closeChannels} open={selected !== null}>
      {selected ? <>
        <DialogTitle>{selected.communityName}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Chip color={selected.saleState === "closed" ? "default" : accessCopy[selected.access].color}
                label={selected.saleState === "closed" ? saleStateCopy.closed : accessCopy[selected.access].label} size="small" />
              <Typography sx={{ fontWeight: 800 }}>{selected.price} / {selected.cadence}</Typography>
            </Stack>
            {!selected.saleState && selected.stripeCheckout && selected.access === "available" && selected.coveredChannels?.length ?
              <Alert severity="warning">
                Your existing subscriptions already cover {new Intl.ListFormat("en").format(selected.coveredChannels)}.
                {" "}Continuing starts a separate subscription at the price above.
              </Alert> : null}
            <Stack spacing={1}>
              <Typography sx={{ fontWeight: 700 }} variant="body2">Included read-only channels</Typography>
              {selected.channels.map((channel, index) => <Paper key={`${channel}:${index}`} variant="outlined" sx={{ p: 1.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{channel}</Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 0.75 }}>
                  {selected.saleState !== "closed" ? <Typography color="text.secondary" variant="caption">
                    Community subscription: {communitySubscriptionCopy[selected.access]}
                  </Typography> : null}
                  <Typography color="text.secondary" variant="caption">
                    TraderLink Premium: {status.label}
                  </Typography>
                </Stack>
              </Paper>)}
            </Stack>
            {selected.saleState !== "closed" && selected.access === "subscribed" && Array.isArray(selected.destinations)
              ? selected.destinations.filter(link => link && typeof link.name === "string"
                && typeof link.guildId === "string" && /^[1-9][0-9]{0,19}$/u.test(link.guildId)
                && typeof link.channelId === "string" && /^[1-9][0-9]{0,19}$/u.test(link.channelId))
                .map(link => <Button
                  key={link.channelId}
                  href={`https://discord.com/channels/${link.guildId}/${link.channelId}`}
                  rel="noopener noreferrer"
                  target="_blank"
                  variant="outlined"
                >Open {link.name} in Discord</Button>)
              : null}
            <Typography color="text.secondary" variant="body2">
              Posts are text-only and read-only. Links, invitations, attachments, images, and source-community promotion are not included.
            </Typography>
            <Typography color="text.secondary" variant="caption">
              {selected.billingProvider === "stripe" || selected.stripeCheckout
                ? "The community handles payments, refunds, and billing through Stripe."
                : "The community handles payments, refunds, and billing through Whop."}
            </Typography>
            {accessMessage ? <Typography color="text.secondary" variant="body2">{accessMessage}</Typography> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={closeChannels}>Close</Button>
          {selected.saleState === "closed" ? null : selected.saleState || selected.access === "subscribed" || selected.access === "attention"
            ? <Button disabled={checking} onClick={() => void checkAccess()} variant="contained">
              {checking ? "Checking…" : "Check access"}
            </Button>
            : selected.stripeCheckout
              ? <Button disabled={checking} onClick={() => void startStripeCheckout()} variant="contained">Continue to Stripe</Button>
              : selected.checkoutHref && premiumStatus === "active"
              ? <DashboardPrimaryAction href={selected.checkoutHref}>Continue to Whop</DashboardPrimaryAction>
              : <Button disabled variant="contained">Verification unavailable</Button>}
        </DialogActions>
      </> : null}
    </Dialog>
  </DashboardPage>;
}
