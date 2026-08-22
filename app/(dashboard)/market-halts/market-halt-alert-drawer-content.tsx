"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState, useTransition } from "react";

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
      setMessage({ severity: "success", text: `${result.ticker} is muted until market close.` });
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
      setMessage({ severity: "success", text: `${result.ticker} is muted until market close.` });
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
    <Box sx={{ display: "grid", gap: 2, height: "100%", px: { xs: 2, sm: 2.5 }, py: { xs: 2, sm: 2.5 } }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: 1, justifyContent: "space-between" }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
          Halt Alerts (Nasdaq/NYSE)
        </Typography>
        <Tooltip title="Close Halt Alerts">
          <IconButton aria-label="Close Halt Alerts" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}>
            <CloseRoundedIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <FormControlLabel
        control={<Checkbox checked={enabled} disabled={working} onChange={(event) => saveEnabled(event.target.checked)} />}
        label="Halt alerts"
      />
      <Divider />
      <Box component="form" onSubmit={(event) => {
        event.preventDefault();
        muteTicker();
      }} sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1 }}>
        <TextField
          autoCapitalize="characters"
          disabled={working}
          label="Mute ticker"
          onChange={(event) => setTicker(event.target.value.toUpperCase())}
          size="small"
          value={ticker}
        />
        <Button disabled={working} type="submit" variant="outlined">
          Mute for today
        </Button>
      </Box>
      <Box>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Muted tickers</Typography>
        {mutedTickers.length === 0 ? (
          <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="caption">
            No tickers muted today.
          </Typography>
        ) : (
          <Box sx={{ display: "grid", gap: 0.25, mt: 0.5 }}>
            {mutedTickers.map((mutedTicker) => (
              <Box key={mutedTicker} sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}>
                <Typography variant="caption">{mutedTicker}</Typography>
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
      {message ? <Alert aria-live="polite" role="status" severity={message.severity}>{message.text}</Alert> : null}
    </Box>
  );
}
