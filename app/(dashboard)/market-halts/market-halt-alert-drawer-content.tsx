"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import NotificationsOffRoundedIcon from "@mui/icons-material/NotificationsOffRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState, useTransition } from "react";

import { InstallTradersLinkPwaMethods } from "@/app/pwa/install-traderslink-pwa-card";
import {
  PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT,
  readPlatformWebPushBrowserState,
  type PlatformWebPushBrowserState,
} from "@/src/modules/platform/client/pwa/platform-web-push";
import {
  muteMarketHaltTicker,
  saveMarketHaltAlertsEnabled,
  unmuteMarketHaltTicker,
} from "../account/notification-preferences-actions";

type DrawerMessage = Readonly<{
  placement: "halt" | "muted";
  severity: "error" | "success";
  text: string;
}>;

type HaltAlertServiceState = "checking" | "limited" | "ready" | "unavailable";

type HaltAlertStatusResponse = Readonly<{ status?: string }>;

function statusPresentation(input: Readonly<{
  enabled: boolean;
  pushState: PlatformWebPushBrowserState;
  serviceState: HaltAlertServiceState;
}>) {
  if (input.serviceState === "checking" || input.pushState === "checking") {
    return Object.freeze({
      color: "#536273",
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      label: "Checking alerts",
      tone: "#f1f3f5",
    });
  }
  if (!input.enabled || input.pushState !== "enabled") {
    return Object.freeze({
      color: "#9a5b00",
      icon: <NotificationsOffRoundedIcon fontSize="small" />,
      label: "Turn on notifications",
      tone: "#fff4e5",
    });
  }
  if (input.serviceState === "ready") {
    return Object.freeze({
      color: "#19733f",
      icon: <CheckCircleRoundedIcon fontSize="small" />,
      label: "Halt alerts are ready",
      tone: "#e7f6ec",
    });
  }
  if (input.serviceState === "limited") {
    return Object.freeze({
      color: "#9a5b00",
      icon: <WarningAmberRoundedIcon fontSize="small" />,
      label: "Some halt alerts unavailable",
      tone: "#fff4e5",
    });
  }
  return Object.freeze({
    color: "#b42318",
    icon: <WarningAmberRoundedIcon fontSize="small" />,
    label: "Halt alerts are unavailable",
    tone: "#fef0ef",
  });
}

async function readHaltAlertServiceState(): Promise<Exclude<HaltAlertServiceState, "checking">> {
  try {
    const response = await fetch("/api/platform/market-halts/status", {
      cache: "no-store",
      credentials: "same-origin",
    });
    const body = await response.json() as HaltAlertStatusResponse;
    if (response.ok && (body.status === "ready" || body.status === "limited")) return body.status;
  } catch {
    // The visible state below reports the safe unavailable result.
  }
  return "unavailable";
}

export function MarketHaltAlertDrawerContent({
  enabled,
  mutedTickers,
  onClose,
  onEnabledChange,
  onNotificationMuteHandled,
  onMutedTickersChange,
  notificationMuteTicker,
}: {
  enabled: boolean;
  mutedTickers: readonly string[];
  onClose: () => void;
  onEnabledChange: (enabled: boolean) => void;
  onNotificationMuteHandled: () => void;
  onMutedTickersChange: (tickers: readonly string[]) => void;
  notificationMuteTicker: string | null;
}) {
  const [ticker, setTicker] = useState("");
  const [message, setMessage] = useState<DrawerMessage | null>(null);
  const [pushState, setPushState] = useState<PlatformWebPushBrowserState>("checking");
  const [serviceState, setServiceState] = useState<HaltAlertServiceState>("checking");
  const [working, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    function refresh(): void {
      void Promise.all([
        readPlatformWebPushBrowserState().catch(() => "off" as const),
        readHaltAlertServiceState(),
      ]).then(([nextPushState, nextServiceState]) => {
        if (!active) return;
        setPushState(nextPushState);
        setServiceState(nextServiceState);
      });
    }
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refresh);
    const interval = window.setInterval(refresh, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refresh);
    };
  }, []);

  useEffect(() => {
    if (!notificationMuteTicker) return;
    onNotificationMuteHandled();
    setMessage(null);
    startTransition(async () => {
      const result = await muteMarketHaltTicker(notificationMuteTicker);
      if (!result.ok) {
        setMessage({ placement: "muted", severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(Object.freeze(
        [...mutedTickers, result.ticker].filter((value, index, values) => values.indexOf(value) === index).sort(),
      ));
      setMessage({ placement: "muted", severity: "success", text: `${result.ticker} is muted until 8:00 PM ET.` });
    });
  }, [mutedTickers, notificationMuteTicker, onMutedTickersChange, onNotificationMuteHandled, startTransition]);

  function saveEnabled(nextEnabled: boolean): void {
    onEnabledChange(nextEnabled);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMarketHaltAlertsEnabled(nextEnabled);
      if (!result.ok) {
        onEnabledChange(enabled);
        setMessage({ placement: "halt", severity: "error", text: result.message });
        return;
      }
      onEnabledChange(result.enabled);
    });
  }

  const status = statusPresentation({ enabled, pushState, serviceState });

  function muteTicker(): void {
    const requestedTicker = ticker.trim().toUpperCase();
    if (!requestedTicker) {
      setMessage({ placement: "muted", severity: "error", text: "Enter a ticker to mute." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await muteMarketHaltTicker(requestedTicker);
      if (!result.ok) {
        setMessage({ placement: "muted", severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(Object.freeze(
        [...mutedTickers, result.ticker].filter((value, index, values) => values.indexOf(value) === index).sort(),
      ));
      setTicker("");
      setMessage({ placement: "muted", severity: "success", text: `${result.ticker} is muted until 8:00 PM ET.` });
    });
  }

  function unmuteTicker(tickerToUnmute: string): void {
    setMessage(null);
    startTransition(async () => {
      const result = await unmuteMarketHaltTicker(tickerToUnmute);
      if (!result.ok) {
        setMessage({ placement: "muted", severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(mutedTickers.filter((value) => value !== result.ticker));
      setMessage({ placement: "muted", severity: "success", text: `${result.ticker} will receive halt alerts again.` });
    });
  }

  return (
    <Box
      sx={{
        alignContent: "start",
        display: "grid",
        gap: 2.5,
        height: "100%",
        overflowY: "auto",
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.5 },
      }}
    >
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
          Halt alerts
        </Typography>
        <Tooltip title="Close Halt Alerts">
          <IconButton aria-label="Close Halt Alerts" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          Stay informed when Nasdaq or NYSE stocks are halted. Turn push notifications on to receive volatility and news-related halt alerts.
        </Typography>
        <FormControlLabel
          control={<Switch checked={enabled} color="primary" disabled={working} onChange={(event) => saveEnabled(event.target.checked)} />}
          label="Halt alerts"
          sx={{ alignSelf: "start", ml: -0.5 }}
        />
        <Box
          aria-live="polite"
          role="status"
          sx={{
            alignItems: "center",
            bgcolor: status.tone,
            borderRadius: 1,
            color: status.color,
            display: "flex",
            fontSize: 13,
            fontWeight: 800,
            gap: 0.75,
            lineHeight: 1.35,
            px: 1,
            py: 0.75,
            width: "fit-content",
          }}
        >
          {status.icon}
          {status.label}
        </Box>
        {message?.placement === "halt" ? <Alert aria-live="polite" role="status" severity={message.severity}>{message.text}</Alert> : null}
      </Box>
      <Divider />
      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Muted Tickers</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          Stock halting too much? Enter the ticker to mute alerts for that stock. You can also mute a ticker directly from a halt notification. Muted tickers reset at <strong>8:00 PM ET</strong> so you start the next session fresh.
        </Typography>
        <Box component="form" onSubmit={(event) => {
          event.preventDefault();
          muteTicker();
        }} sx={{ alignItems: "stretch", display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
          <TextField
            autoCapitalize="characters"
            disabled={working}
            fullWidth
            label="Ticker"
            onChange={(event) => setTicker(event.target.value.toUpperCase())}
            size="small"
            value={ticker}
          />
          <Button disabled={working} sx={{ flexShrink: 0, height: 40, minHeight: 40 }} type="submit" variant="outlined">
            Mute for today
          </Button>
        </Box>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {mutedTickers.length === 0 ? (
            <>
              <Typography color="text.secondary" variant="body2">
                Unmute muted tickers
              </Typography>
              <Typography color="text.secondary" variant="caption">
                No tickers muted today.
              </Typography>
            </>
          ) : (
            <Box sx={{ display: "grid", gap: 0.25 }}>
              {mutedTickers.map((mutedTicker) => (
                <Box key={mutedTicker} sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">{mutedTicker}</Typography>
                  <Tooltip title={`Unmute ${mutedTicker}`}>
                    <span>
                      <IconButton
                        aria-label={`Unmute ${mutedTicker}`}
                        disabled={working}
                        onClick={() => unmuteTicker(mutedTicker)}
                        size="small"
                      >
                        <CloseRoundedIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        {message?.placement === "muted" ? <Alert aria-live="polite" role="status" severity={message.severity}>{message.text}</Alert> : null}
      </Box>
      <Divider />
      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Get TradersLink on Your Device</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          Install the TradersLink PWA to receive stock halt push notifications directly on your device. The app works on supported desktop and mobile devices.
        </Typography>
        <InstallTradersLinkPwaMethods />
      </Box>
    </Box>
  );
}
