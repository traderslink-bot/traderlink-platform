"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
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
  muteMarketHaltTicker,
  saveMarketHaltAlertsEnabled,
  unmuteMarketHaltTicker,
} from "../account/notification-preferences-actions";

type DrawerMessage = Readonly<{
  severity: "error" | "success";
  text: string;
}>;

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
  const [working, startTransition] = useTransition();

  useEffect(() => {
    if (!notificationMuteTicker) return;
    onNotificationMuteHandled();
    setMessage(null);
    startTransition(async () => {
      const result = await muteMarketHaltTicker(notificationMuteTicker);
      if (!result.ok) {
        setMessage({ severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(Object.freeze(
        [...mutedTickers, result.ticker].filter((value, index, values) => values.indexOf(value) === index).sort(),
      ));
      setMessage({ severity: "success", text: `${result.ticker} is muted until 8:00 PM ET.` });
    });
  }, [mutedTickers, notificationMuteTicker, onMutedTickersChange, onNotificationMuteHandled, startTransition]);

  function saveEnabled(nextEnabled: boolean): void {
    onEnabledChange(nextEnabled);
    setMessage(null);
    startTransition(async () => {
      const result = await saveMarketHaltAlertsEnabled(nextEnabled);
      if (!result.ok) {
        onEnabledChange(enabled);
        setMessage({ severity: "error", text: result.message });
        return;
      }
      onEnabledChange(result.enabled);
      setMessage({
        severity: "success",
        text: result.enabled ? "Halt alerts are on." : "Halt alerts are off.",
      });
    });
  }

  function muteTicker(): void {
    const requestedTicker = ticker.trim().toUpperCase();
    if (!requestedTicker) {
      setMessage({ severity: "error", text: "Enter a ticker to mute." });
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const result = await muteMarketHaltTicker(requestedTicker);
      if (!result.ok) {
        setMessage({ severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(Object.freeze(
        [...mutedTickers, result.ticker].filter((value, index, values) => values.indexOf(value) === index).sort(),
      ));
      setTicker("");
      setMessage({ severity: "success", text: `${result.ticker} is muted until 8:00 PM ET.` });
    });
  }

  function unmuteTicker(tickerToUnmute: string): void {
    setMessage(null);
    startTransition(async () => {
      const result = await unmuteMarketHaltTicker(tickerToUnmute);
      if (!result.ok) {
        setMessage({ severity: "error", text: result.message });
        return;
      }
      onMutedTickersChange(mutedTickers.filter((value) => value !== result.ticker));
      setMessage({ severity: "success", text: `${result.ticker} will receive halt alerts again.` });
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
          Stay informed when Nasdaq or NYSE stocks are halted during the trading day. Turn push notifications on to receive alerts for trading halts, including volatility and news-related halts, or switch them off anytime.
        </Typography>
        <FormControlLabel
          control={<Switch checked={enabled} color="primary" disabled={working} onChange={(event) => saveEnabled(event.target.checked)} />}
          label="Halt alerts"
          sx={{ alignSelf: "start", ml: -0.5 }}
        />
      </Box>
      <Divider />
      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Muted Tickers</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          Stock halting too much? Enter the ticker to mute alerts for that stock and keep your alerts on for other halts.
        </Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          You can also mute a ticker directly from a halt notification. Muted tickers automatically reset at <strong>8:00 PM ET each trading day</strong>, so you&apos;ll start the next session with all ticker alerts available again.
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
                Muted tickers will appear here, where you can remove them at any time.
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
      </Box>
      <Divider />
      <Box sx={{ display: "grid", gap: 1.25 }}>
        <Typography component="h3" sx={{ fontWeight: 850 }} variant="subtitle1">Get TradersLink on Your Device</Typography>
        <Typography color="text.secondary" sx={{ lineHeight: 1.55 }} variant="body2">
          Install the TradersLink PWA to receive stock halt push notifications directly on your device. The app works on supported desktop and mobile devices, giving you quick access to TradersLink and halt alerts without needing to keep the website open.
        </Typography>
        <InstallTradersLinkPwaMethods />
      </Box>
      {message ? <Alert aria-live="polite" role="status" severity={message.severity}>{message.text}</Alert> : null}
    </Box>
  );
}
