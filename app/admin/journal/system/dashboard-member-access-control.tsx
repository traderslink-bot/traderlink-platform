"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveDashboardMemberAccess } from "./dashboard-member-access-actions";

export function DashboardMemberAccessControl({
  initialAllowAllDiscordMembers,
}: Readonly<{
  initialAllowAllDiscordMembers: boolean;
}>) {
  const [enabled, setEnabled] = useState(initialAllowAllDiscordMembers);
  const [saved, setSaved] = useState(initialAllowAllDiscordMembers);
  const [message, setMessage] = useState<Readonly<{
    state: "success" | "error";
    text: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();

  function save(): void {
    startTransition(async () => {
      const result = await saveDashboardMemberAccess({
        allowAllDiscordMembers: enabled,
      });
      if (!result.ok) {
        setMessage(Object.freeze({ state: "error", text: result.message }));
        return;
      }
      setSaved(enabled);
      setMessage(Object.freeze({
        state: "success",
        text: enabled
          ? "Free dashboard access is on for verified TradersLink Discord members."
          : "Free dashboard access is off. Premium access is required for members.",
      }));
    });
  }

  return (
    <Stack spacing={1.5}>
      <FormControlLabel
        control={<Switch checked={enabled} onChange={(event) => setEnabled(event.target.checked)} />}
        label="Allow @everyone free dashboard access"
      />
      <Typography color="text.secondary" variant="body2">
        {enabled
          ? "Any verified member of the TradersLink Discord server can sign in and use the dashboard."
          : "Free member access is off. The verified owner and Premium members retain dashboard access."}
      </Typography>
      {message ? <Alert severity={message.state}>{message.text}</Alert> : null}
      <Button disabled={working || enabled === saved} onClick={save} variant="contained">
        {working ? "Saving..." : "Save dashboard access"}
      </Button>
    </Stack>
  );
}
