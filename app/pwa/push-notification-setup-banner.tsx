"use client";

import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "next/link";
import { useEffect, useState } from "react";

import {
  dismissPlatformWebPushSetupReminder,
  isPlatformWebPushSetupReminderDismissed,
  PLATFORM_WEB_PUSH_STATE_CHANGED_EVENT,
  readPlatformWebPushBrowserState,
} from "@/src/modules/platform/client/pwa/platform-web-push";

type BannerState = "denied" | "hidden" | "off";

function installedDisplayMode(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true;
}

export function PushNotificationSetupBanner({
  enabled,
  pathname,
}: {
  enabled: boolean;
  pathname: string;
}) {
  const [state, setState] = useState<BannerState>("hidden");

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
        .then((pushState) => {
          if (!active) return;
          setState(pushState === "off" || pushState === "denied" ? pushState : "hidden");
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
      severity={state === "denied" ? "warning" : "info"}
      sx={{
        mb: { xs: 1.5, sm: 2 },
        "& .MuiAlert-message": { minWidth: 0, width: "100%" },
      }}
    >
      <AlertTitle sx={{ fontWeight: 800 }}>
        {state === "denied" ? "Notifications are turned off" : "Turn on notifications"}
      </AlertTitle>
      <Typography variant="body2">
        Turn on TradersLink notifications on this device
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={0.5}
        sx={{ alignItems: { xs: "stretch", sm: "center" }, mt: 1 }}
      >
        <Button
          component={Link}
          href="/account/preferences#push-notifications"
          size="small"
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
          variant="contained"
        >
          {state === "denied" ? "View setup steps" : "Set up notifications"}
        </Button>
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
