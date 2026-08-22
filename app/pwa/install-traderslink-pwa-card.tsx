"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import {
  hasInstalledTradersLinkPwa,
  isIosDevice,
  isTradersLinkPwaRunningStandalone,
  requestTradersLinkPwaInstallation,
  serverTradersLinkPwaInstallPromptReady,
  startTradersLinkPwaInstallPromptCapture,
  subscribeToTradersLinkPwaInstallPrompt,
  tradersLinkPwaInstallPromptReady,
} from "./traderslink-pwa-install-prompt";

type InstallState =
  | "checking"
  | "installed"
  | "ios"
  | "manual"
  | "ready"
  | "prompting"
  | "installing";

export function InstallTradersLinkPwaMethods({
  onInstalled,
}: {
  onInstalled?: () => void;
}) {
  const [installState, setInstallState] = useState<InstallState>("checking");
  const [installHelpOpen, setInstallHelpOpen] = useState(false);
  const installPromptReady = useSyncExternalStore(
    subscribeToTradersLinkPwaInstallPrompt,
    tradersLinkPwaInstallPromptReady,
    serverTradersLinkPwaInstallPromptReady,
  );

  useEffect(() => {
    startTradersLinkPwaInstallPromptCapture();
    const refreshInstallationState = () => {
      if (isTradersLinkPwaRunningStandalone()) {
        setInstallState("installed");
        onInstalled?.();
        return;
      }
      setInstallState(installPromptReady ? "ready" : isIosDevice() ? "ios" : "manual");
    };
    const onAppInstalled = () => {
      setInstallState("installed");
      onInstalled?.();
    };

    refreshInstallationState();
    window.addEventListener("appinstalled", onAppInstalled);
    return () => {
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  }, [installPromptReady, onInstalled]);

  async function requestInstallation(): Promise<void> {
    if (!installPromptReady) {
      setInstallHelpOpen(true);
      return;
    }

    setInstallState("prompting");
    try {
      const choice = await requestTradersLinkPwaInstallation();
      setInstallState(choice?.outcome === "accepted" ? "installing" : "manual");
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
  const [installed, setInstalled] = useState(false);
  const hideWhenInstalled = useCallback(() => setInstalled(true), []);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    let active = true;
    const refresh = () => {
      if (isTradersLinkPwaRunningStandalone()) {
        setInstalled(true);
        return;
      }
      void hasInstalledTradersLinkPwa()
        .then((isInstalled) => {
          if (active) setInstalled(isInstalled);
        })
        .catch(() => {
          if (active) setInstalled(false);
        });
    };
    refresh();
    standaloneQuery.addEventListener("change", refresh);
    window.addEventListener("appinstalled", refresh);
    return () => {
      active = false;
      standaloneQuery.removeEventListener("change", refresh);
      window.removeEventListener("appinstalled", refresh);
    };
  }, []);

  if (installed) return null;

  return (
    <DashboardPanel
      eyebrow="Mobile and desktop"
      title="Install TradersLink PWA App"
    >
      <Box sx={{ display: "grid", gap: 1.25, maxWidth: 760 }}>
        <Typography color="text.secondary" variant="body2">
          Install TradersLink PWA APP to send push notifications to your devices. Get press release alerts on your phone. Easily enter trades in the app and more.
        </Typography>
        <InstallTradersLinkPwaMethods onInstalled={hideWhenInstalled} />
      </Box>
    </DashboardPanel>
  );
}
