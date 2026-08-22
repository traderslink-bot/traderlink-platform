"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  dismissPlatformWebPushSetupReminder,
  isPlatformWebPushSetupReminderDismissed,
  PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT,
  preparePlatformWebPush,
  readPlatformWebPushBrowserState,
} from "@/src/modules/platform/client/pwa/platform-web-push";

type BannerState = "denied" | "hidden" | "off" | "unavailable";

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
  const windowsDevice = useSyncExternalStore(
    subscribeToDeviceDetails,
    browserRunsOnWindows,
    serverRunsOnWindows,
  );

  useEffect(() => {
    let active = true;
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    const refresh = () => {
      if (
        !enabled ||
        pathname === "/account/preferences" ||
        !installedDisplayMode() ||
        !navigator.onLine ||
        isPlatformWebPushSetupReminderDismissed()
      ) {
        setState("hidden");
        return;
      }

      void readPlatformWebPushBrowserState()
        .then(async (pushState) => {
          if (!active) return;
          if (pushState === "denied") {
            setState("denied");
            return;
          }
          if (pushState !== "off") {
            setState("hidden");
            return;
          }
          try {
            await preparePlatformWebPush();
            if (active) setState("off");
          } catch {
            if (active) setState("unavailable");
          }
        })
        .catch(() => {
          if (active) setState("hidden");
        });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    standaloneQuery.addEventListener("change", refresh);
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);
    window.addEventListener("focus", refresh);
    window.addEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      active = false;
      standaloneQuery.removeEventListener("change", refresh);
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      window.removeEventListener("focus", refresh);
      window.removeEventListener(PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT, refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [enabled, pathname]);

  if (state === "hidden") return null;

  return (
    <Alert
      severity={state === "denied" || state === "unavailable" ? "warning" : "info"}
      sx={{
        mb: { xs: 1.5, sm: 2 },
        "& .MuiAlert-message": { minWidth: 0, width: "100%" },
      }}
    >
      <AlertTitle sx={{ fontWeight: 800 }}>
        {state === "denied"
          ? "Notifications are turned off"
          : state === "unavailable"
            ? "Push notifications are unavailable"
            : "Turn on notifications"}
      </AlertTitle>
      <Typography variant="body2">
        {state === "denied"
          ? windowsDevice
            ? "Open Windows notification settings, turn on notifications for TradersLink (or Chrome if that is what Windows shows), then return to this app."
            : "Turn on TradersLink notifications in your device settings, then return to this app."
          : state === "unavailable"
            ? "TradersLink cannot turn on push notifications right now. This is a TradersLink setup issue, not something you can fix by reinstalling the app."
            : "Choose the alerts you want, press Set Preferences, then choose Allow when your device asks for notification permission."}
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={0.5}
        sx={{ alignItems: { xs: "stretch", sm: "center" }, mt: 1 }}
      >
        {state === "denied" && windowsDevice ? (
          <Button
            component="a"
            href="ms-settings:notifications"
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            Open Windows notification settings
          </Button>
        ) : state !== "unavailable" ? (
          <Button
            component={Link}
            href="/account/preferences#push-notifications"
            size="small"
            sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
            variant="contained"
          >
            {state === "denied" ? "View notification settings" : "Choose notification alerts"}
          </Button>
        ) : null}
        <Button
          onClick={() => {
            dismissPlatformWebPushSetupReminder();
            setState("hidden");
          }}
          size="small"
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          variant="text"
        >
          Don&apos;t show again
        </Button>
      </Stack>
    </Alert>
  );
}
