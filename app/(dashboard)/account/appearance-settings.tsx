"use client";

import Alert from "@mui/material/Alert";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import type { PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";
import { saveAppearance } from "./appearance-actions";

export function AppearanceSettings({ appearance }: { appearance: PlatformAppearance }) {
  const router = useRouter();
  const [selectedAppearance, setSelectedAppearance] = useState(appearance);
  const [message, setMessage] = useState<string | null>(null);
  const [working, startTransition] = useTransition();

  function choose(nextAppearance: PlatformAppearance | null): void {
    if (!nextAppearance || nextAppearance === selectedAppearance || working) return;
    setSelectedAppearance(nextAppearance);
    setMessage(null);
    startTransition(async () => {
      const result = await saveAppearance(nextAppearance);
      if (result.ok) {
        setSelectedAppearance(result.appearance);
        setMessage("Appearance saved.");
        router.refresh();
      } else {
        setSelectedAppearance(appearance);
        setMessage(result.message);
      }
    });
  }

  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Choose the dashboard appearance you prefer.
      </Typography>
      {message ? <Alert severity={message === "Appearance saved." ? "success" : "error"}>{message}</Alert> : null}
      <ToggleButtonGroup
        aria-label="Dashboard appearance"
        color="primary"
        disabled={working}
        exclusive
        onChange={(_, value: PlatformAppearance | null) => choose(value)}
        value={selectedAppearance}
      >
        <ToggleButton value="light">Light</ToggleButton>
        <ToggleButton value="dark">Dark</ToggleButton>
      </ToggleButtonGroup>
    </Stack>
  );
}
