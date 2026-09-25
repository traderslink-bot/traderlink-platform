"use client";
import { useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import type { ReverseSplitNotificationSettings } from "@/src/modules/news/contracts/reverse-split-notification-contracts";
import { saveReverseSplitNotification } from "./notification-actions";

export function ReverseSplitNotificationControls({ initial }: { initial: ReverseSplitNotificationSettings }) {
  const [settings, setSettings] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);
  function save(channel: "web_push" | "email", enabled: boolean) {
    startTransition(async () => {
      const response = await saveReverseSplitNotification(channel, enabled);
      if (response.ok) setSettings(response.settings);
      setResult({ ok: response.ok, message: response.ok ? "Saved." : response.message });
    });
  }
  return <Stack spacing={1}>
    <Typography component="h3" variant="subtitle1">Reverse Splits</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <FormControlLabel label="Push" control={<Switch checked={settings.webPushEnabled} disabled={pending || !settings.available}
        onChange={(_, enabled) => save("web_push", enabled)} slotProps={{ input: { "aria-label": "Reverse-split push notifications" } }} />} />
      <FormControlLabel label="Email" control={<Switch checked={settings.emailEnabled} disabled={pending || !settings.available}
        onChange={(_, enabled) => save("email", enabled)} slotProps={{ input: { "aria-label": "Reverse-split email notifications" } }} />} />
    </Stack>
    {!settings.available ? <Alert severity="info">Private preview notifications are not enabled yet.</Alert>
      : !settings.deliveryEnabled ? <Alert severity="info">Your choices can be saved. Delivery is awaiting activation.</Alert> : null}
    <Typography variant="body2" color="text.secondary">Evening updates at 7 PM Eastern, with later corrections when confirmed. Sunday includes the week ahead. These switches use the same settings on both pages.</Typography>
    <Link href="/account/preferences">Manage device push and notification email</Link>
    {result ? <Alert severity={result.ok ? "success" : "error"} role="status">{result.message}</Alert> : null}
  </Stack>;
}
