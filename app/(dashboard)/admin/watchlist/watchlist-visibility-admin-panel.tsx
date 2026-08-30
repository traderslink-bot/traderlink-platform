"use client";

import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import type { WatchlistVisibilityState } from "@/src/modules/watchlist/server/access/watchlist-visibility-service";

import { saveOwnerWatchlistVisibility } from "./watchlist-visibility-actions";

export function WatchlistVisibilityAdminPanel({
  initialState,
}: {
  initialState: WatchlistVisibilityState;
}) {
  const initiallyVisible = initialState.status === "available" && initialState.memberVisible;
  const [memberVisible, setMemberVisible] = useState(initiallyVisible);
  const [saved, setSaved] = useState(initiallyVisible);
  const [settingAvailable, setSettingAvailable] = useState(initialState.status === "available");
  const [message, setMessage] = useState<Readonly<{
    severity: "error" | "success" | "warning";
    text: string;
  }> | null>(initialState.status === "unavailable" ? Object.freeze({
    severity: "warning" as const,
    text: "Watchlist availability could not be read. It is hidden from members until it is available again.",
  }) : null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveOwnerWatchlistVisibility({ memberVisible });
      if (!result.ok) {
        setMessage(Object.freeze({ severity: "error", text: result.message }));
        return;
      }
      setMemberVisible(result.memberVisible);
      setSaved(result.memberVisible);
      setSettingAvailable(true);
      setMessage(Object.freeze({
        severity: "success",
        text: result.memberVisible
          ? "Watchlist is now available to members."
          : "Watchlist is now hidden from members.",
      }));
    });
  }

  return (
    <DashboardPanel title="Watchlist availability">
      <Stack spacing={1.5}>
        <FormControlLabel
          control={(
            <Switch
              checked={memberVisible}
              disabled={working}
              onChange={(event) => setMemberVisible(event.target.checked)}
            />
          )}
          label={memberVisible ? "Watchlist available to members" : "Watchlist hidden from members"}
        />
        <Typography color="text.secondary" variant="body2">
          Turn this off to hide the official Watchlist from other dashboard members. Publishing and owner access continue.
        </Typography>
        {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
        <DashboardPrimaryAction
          disabled={working || (settingAvailable && memberVisible === saved)}
          onClick={save}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          {working ? "Saving..." : "Save Watchlist availability"}
        </DashboardPrimaryAction>
      </Stack>
    </DashboardPanel>
  );
}
