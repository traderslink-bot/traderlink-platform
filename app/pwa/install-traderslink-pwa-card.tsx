"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState } from "react";

import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";

type InstallPromptChoice = Readonly<{
  outcome: "accepted" | "dismissed";
}>;

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<InstallPromptChoice>;
};

type InstallState =
  | "checking"
  | "installed"
  | "ios"
  | "manual"
  | "ready"
  | "prompting"
  | "installing";

function isInstalledApp(): boolean {
  const iosNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches ||
    iosNavigator.standalone === true;
}

function isIosDevice(): boolean {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function InstallTradersLinkPwaMethods() {
  const deferredPrompt = useRef<DeferredInstallPrompt | null>(null);
  const [installState, setInstallState] = useState<InstallState>("checking");

  useEffect(() => {
    const refreshInstallationState = () => {
      if (isInstalledApp()) {
        setInstallState("installed");
        return;
      }
      setInstallState(isIosDevice() ? "ios" : "manual");
    };
    const onBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      deferredPrompt.current = event as DeferredInstallPrompt;
      setInstallState("ready");
    };
    const onAppInstalled = () => {
      deferredPrompt.current = null;
      setInstallState("installed");
    };

    refreshInstallationState();
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, []);

  async function requestInstallation(): Promise<void> {
    const prompt = deferredPrompt.current;
    if (!prompt) return;

    setInstallState("prompting");
    try {
      const choice = await prompt.prompt();
      deferredPrompt.current = null;
      setInstallState(choice.outcome === "accepted" ? "installing" : "manual");
    } catch {
      setInstallState("manual");
    }
  }

  return (
    <Box sx={{ display: "grid", gap: 1.25 }}>
      {installState === "ready" ? (
        <DashboardPrimaryAction
          onClick={() => void requestInstallation()}
          startIcon={<DownloadRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          Install app
        </DashboardPrimaryAction>
      ) : null}
      {installState === "prompting" ? (
        <Typography color="text.secondary" variant="body2">
          Your browser is opening the installation prompt.
        </Typography>
      ) : null}
      {installState === "installing" ? (
        <Typography color="text.secondary" variant="body2">
          Finish installation in your browser. TradersLink will then appear with your other apps.
        </Typography>
      ) : null}
      {installState === "ios" ? (
        <Typography color="text.secondary" variant="body2">
          On iPhone or iPad, tap Share in Safari, then choose Add to Home Screen.
        </Typography>
      ) : null}
      {installState === "manual" ? (
        <Typography color="text.secondary" variant="body2">
          Open your browser menu and choose Install app. If that option is not available, this browser does not offer app installation yet.
        </Typography>
      ) : null}
      {installState === "installed" ? (
        <Typography color="success.main" sx={{ alignItems: "center", display: "flex", fontWeight: 700, gap: 0.75 }} variant="body2">
          <NotificationsRoundedIcon fontSize="small" />
          TradersLink is installed on this device.
        </Typography>
      ) : null}
    </Box>
  );
}

export function InstallTradersLinkPwaCard() {
  return (
    <DashboardPanel
      eyebrow="Mobile and desktop"
      title="Install TradersLink PWA App"
    >
      <Box sx={{ display: "grid", gap: 1.25, maxWidth: 760 }}>
        <Typography color="text.secondary" variant="body2">
          Install TradersLink PWA APP to send push notifications to your devices. Get press release alerts on your phone. Easily enter trades in the app and more.
        </Typography>
        <InstallTradersLinkPwaMethods />
      </Box>
    </DashboardPanel>
  );
}
