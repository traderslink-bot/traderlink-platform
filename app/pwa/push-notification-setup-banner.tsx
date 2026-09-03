"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import {
  enablePlatformWebPushWithSavedPreferences,
  PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT,
  preparePlatformWebPush,
  readPlatformWebPushBrowserState,
  readPlatformWebPushSubscriptionStatus,
  type PreparedPlatformWebPush,
} from "@/src/modules/platform/client/pwa/platform-web-push";

type BannerState =
  | "blocked"
  | "hidden"
  | "off"
  | "restore"
  | "unavailable"
  | "unknown";

function installedDisplayMode(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true;
}

function subscribeToDeviceDetails(): () => void {
  return () => undefined;
}

function browserRunsOnWindows(): boolean {
  return /Windows/u.test(navigator.userAgent);
}

function serverRunsOnWindows(): boolean {
  return false;
}

export function PushNotificationSetupBanner({
  enabled,
  pathname,
}: {
  enabled: boolean;
  pathname: string;
}) {
  const [state, setState] = useState<BannerState>("hidden");
  const [prepared, setPrepared] = useState<PreparedPlatformWebPush | null>(null);
  const [working, setWorking] = useState(false);
  const windowsDevice = useSyncExternalStore(
    subscribeToDeviceDetails,
    browserRunsOnWindows,
    serverRunsOnWindows,
  );

  const refresh = useCallback(async () => {
    if (!installedDisplayMode()) {
      setPrepared(null);
      setState("hidden");
      return;
    }
    if (!enabled || !navigator.onLine) {
      setPrepared(null);
      setState("unknown");
      return;
    }

    try {
      const browserState = await readPlatformWebPushBrowserState();
      if (browserState === "denied") {
        setPrepared(null);
        setState("blocked");
        return;
      }
      if (browserState === "unsupported") {
        setPrepared(null);
        setState("unavailable");
        return;
      }
      if (browserState === "off") {
        try {
          setPrepared(await preparePlatformWebPush());
          setState("off");
        } catch {
          setPrepared(null);
          setState("unavailable");
        }
        return;
      }

      const serverStatus = await readPlatformWebPushSubscriptionStatus();
      if (serverStatus === "active") {
        setPrepared(null);
        setState("hidden");
        return;
      }
      try {
        setPrepared(await preparePlatformWebPush());
        setState("restore");
      } catch {
        setPrepared(null);
        setState("unavailable");
      }
    } catch {
      setPrepared(null);
      setState("unknown");
    }
  }, [enabled, pathname]);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const refreshNow = () => void refresh();

    void refresh();
    standaloneQuery.addEventListener("change", refreshNow);
    window.addEventListener("online", refreshNow);
    window.addEventListener("offline", refreshNow);
    window.addEventListener("focus", refreshNow);
    window.addEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refreshNow);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      standaloneQuery.removeEventListener("change", refreshNow);
      window.removeEventListener("online", refreshNow);
      window.removeEventListener("offline", refreshNow);
      window.removeEventListener("focus", refreshNow);
      window.removeEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refreshNow);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refresh]);

  async function enableOrRestore(): Promise<void> {
    if (!prepared || working) return;
    setWorking(true);
    try {
      await enablePlatformWebPushWithSavedPreferences(prepared);
      await refresh();
    } catch {
      const browserState = await readPlatformWebPushBrowserState().catch(() => "checking" as const);
      setPrepared(null);
      setState(browserState === "denied" ? "blocked" : "unknown");
    } finally {
      setWorking(false);
    }
  }

  async function checkAgain(): Promise<void> {
    if (working) return;
    setWorking(true);
    try {
      await refresh();
    } finally {
      setWorking(false);
    }
  }

  if (state === "hidden") return null;

  const title = state === "blocked"
    ? "Phone notifications are blocked"
    : state === "off"
      ? "Phone notifications are not enabled"
      : state === "restore"
        ? "Phone notifications need to be restored"
        : state === "unavailable"
          ? "Phone notifications are unavailable"
          : "We can’t confirm phone notifications";
  const copy = state === "blocked"
    ? windowsDevice
      ? "Allow notifications for TradersLink (or Chrome if that is what Windows shows), then return here."
      : "Allow notifications for TradersLink in your phone settings, then return here."
    : state === "off"
      ? "Future TradersLink alerts cannot reach this phone until notifications are enabled."
      : state === "restore"
        ? "This phone’s notification connection is no longer active. Restore it to receive future alerts."
        : state === "unavailable"
          ? "TradersLink cannot make this phone ready for notifications right now. Future alerts may not reach this phone."
          : "TradersLink could not check this phone’s notification connection right now. Future alerts may not reach this phone.";

  return (
    <Alert
      severity="warning"
      sx={{
        mb: { xs: 1.5, sm: 2 },
        "& .MuiAlert-message": { minWidth: 0, width: "100%" },
      }}
    >
      <AlertTitle sx={{ fontWeight: 800 }}>{title}</AlertTitle>
      <Typography variant="body2">{copy}</Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={0.5}
        sx={{ alignItems: { xs: "stretch", sm: "center" }, mt: 1 }}
      >
        {state === "off" || state === "restore" ? (
          <Button
            disabled={working || prepared === null}
            onClick={() => void enableOrRestore()}
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            {working
              ? state === "restore" ? "Restoring..." : "Enabling..."
              : state === "restore" ? "Restore notifications" : "Enable notifications"}
          </Button>
        ) : state === "blocked" && windowsDevice ? (
          <Button
            component="a"
            href="ms-settings:notifications"
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            Open Windows notification settings
          </Button>
        ) : state === "unknown" || state === "unavailable" ? (
          <Button
            disabled={working}
            onClick={() => void checkAgain()}
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            {working ? "Checking..." : "Check again"}
          </Button>
        ) : (
          <Button
            component={Link}
            href="/account/preferences#push-notifications"
            prefetch={false}
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            View setup steps
          </Button>
        )}
        {state !== "blocked" || windowsDevice ? (
          <Button
            component={Link}
            href="/account/preferences#push-notifications"
            prefetch={false}
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="text"
          >
            Notification settings
          </Button>
        ) : null}
      </Stack>
    </Alert>
  );
}
