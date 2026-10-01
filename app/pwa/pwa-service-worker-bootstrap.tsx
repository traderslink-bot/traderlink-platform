"use client";

import { useEffect } from "react";

import { watchPwaUpdateSafety } from "@/src/modules/platform/client/pwa/platform-pwa-update-safety";
import { preparePlatformServiceWorker } from "@/src/modules/platform/client/pwa/platform-service-worker-registration";

export function PwaServiceWorkerBootstrap() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const stopWatching = watchPwaUpdateSafety();
    // register() already checks for an updated worker. The update notice handles
    // later foreground checks; a second immediate update() is redundant.
    void preparePlatformServiceWorker().catch(() => undefined);
    return stopWatching;
  }, []);

  return null;
}
