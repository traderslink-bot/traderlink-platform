"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import NotificationsRoundedIcon from "@mui/icons-material/NotificationsRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
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
  const [installHelpOpen, setInstallHelpOpen] = useState(false);

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
    if (!prompt) {
      setInstallHelpOpen(true);
      return;
    }

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
      {installState !== "installed" ? (
        <DashboardPrimaryAction
          disabled={installState === "prompting"}
          onClick={() => void requestInstallation()}
          startIcon={<DownloadRoundedIcon />}
          sx={{ alignSelf: "flex-start" }}
        >
          {installState === "prompting" ? "Opening install..." : "Install TradersLink app"}
        </DashboardPrimaryAction>
      ) : null}
      {installState === "installing" ? (
        <Typography color="text.secondary" variant="body2">
          Finish installation in your browser. TradersLink will then appear with your other apps.
        </Typography>
      ) : null}
      {installState === "installed" ? (
        <Typography color="success.main" sx={{ alignItems: "center", display: "flex", fontWeight: 700, gap: 0.75 }} variant="body2">
          <NotificationsRoundedIcon fontSize="small" />
          TradersLink is installed on this device.
        </Typography>
      ) : null}
      <Dialog fullWidth maxWidth="xs" onClose={() => setInstallHelpOpen(false)} open={installHelpOpen}>
        <DialogTitle>Install TradersLink app</DialogTitle>
        <DialogContent>
          {installState === "ios" ? (
            <Typography>
              In Safari, tap the Share button, then choose Add to Home Screen.
            </Typography>
          ) : (
            <Typography>
              In Chrome or Edge, open the browser menu and choose Install app. If you do not see that option, update your browser or try Chrome or Edge.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallHelpOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
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
