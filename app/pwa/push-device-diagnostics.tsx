"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  enablePlatformWebPushWithSavedPreferences, PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT,
  preparePlatformWebPush, readPlatformWebPushDiagnostics,
  type PlatformWebPushDiagnostics,
} from "@/src/modules/platform/client/pwa/platform-web-push";

export function PushDeviceDiagnostics() {
  const [details, setDetails] = useState<PlatformWebPushDiagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const inFlight = useRef(false);
  const mounted = useRef(false);
  const refresh = useCallback(async (test = false, restore = false) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      if (restore) await enablePlatformWebPushWithSavedPreferences(await preparePlatformWebPush());
      const next = await readPlatformWebPushDiagnostics(test);
      if (!mounted.current) return;
      setDetails(next);
      setChecked(true);
      if (test) setMessage(next?.testState === "provider_accepted"
        ? "Test notification sent. Check your notifications and tap it to open TradersLink."
        : next?.testState === "pending" || next?.testState === "sending"
          ? "Your test is waiting to send. We’ll keep trying for up to one minute."
          : "We couldn’t send the test notification. Try again in a minute.");
    } catch (error) {
      if (mounted.current) {
        setFailed(true);
        setMessage(error instanceof Error && !/abort|timeout/i.test(error.message)
          ? error.message : "We couldn’t check your notifications. Check your internet connection and try again.");
      }
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    mounted.current = true;
    const changed = () => { if (document.visibilityState === "visible") void refresh(); };
    void refresh();
    window.addEventListener("online", changed);
    window.addEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, changed);
    return () => {
      mounted.current = false;
      window.removeEventListener("online", changed);
      window.removeEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, changed);
    };
  }, [refresh]);
  return <Stack spacing={1.5}>
    <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 800 }}>Test notifications</Typography>
    <Typography variant="body2" color="text.secondary">
      Send a test to the device you’re using now to check that an alert appears.
    </Typography>
    {busy ? <Typography variant="body2" role="status">Please wait…</Typography> : null}
    {!busy && checked && !failed && !details ? <Typography variant="body2">Turn on notifications above before sending a test.</Typography> : null}
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
      <Button disabled={busy || !details || details.status !== "active" || failed} onClick={() => void refresh(true)} variant="outlined">Send test notification</Button>
      {details?.status === "needs_restore" ? <Button disabled={busy} onClick={() => void refresh(false, true)} variant="outlined">Restore notifications</Button> : null}
      {failed || !details ? <Button disabled={busy} onClick={() => void refresh()} variant="text">Check again</Button> : null}
    </Stack>
    {message ? <Alert severity={failed ? "warning" : "info"} role="status">{message}</Alert> : null}
  </Stack>;
}
