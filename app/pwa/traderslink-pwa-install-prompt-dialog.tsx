"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  hasInstalledTradersLinkPwa,
  isTradersLinkPwaRunningStandalone,
  requestTradersLinkPwaInstallation,
  serverTradersLinkPwaInstallPromptReady,
  startTradersLinkPwaInstallPromptCapture,
  subscribeToTradersLinkPwaInstallPrompt,
  tradersLinkPwaInstallPromptReady,
} from "./traderslink-pwa-install-prompt";

export function TradersLinkPwaInstallPrompt() {
  const installPromptReady = useSyncExternalStore(
    subscribeToTradersLinkPwaInstallPrompt,
    tradersLinkPwaInstallPromptReady,
    serverTradersLinkPwaInstallPromptReady,
  );
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [openingInstall, setOpeningInstall] = useState(false);

  useEffect(() => {
    startTradersLinkPwaInstallPromptCapture();
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    let active = true;
    const refreshInstalledState = () => {
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

    refreshInstalledState();
    standaloneQuery.addEventListener("change", refreshInstalledState);
    window.addEventListener("appinstalled", refreshInstalledState);
    return () => {
      active = false;
      standaloneQuery.removeEventListener("change", refreshInstalledState);
      window.removeEventListener("appinstalled", refreshInstalledState);
    };
  }, []);

  async function install(): Promise<void> {
    setOpeningInstall(true);
    await requestTradersLinkPwaInstallation();
    setOpeningInstall(false);
    setDismissed(true);
  }

  if (dismissed || installed || !installPromptReady) return null;

  return (
    <Dialog fullWidth maxWidth="xs" onClose={() => setDismissed(true)} open>
      <DialogTitle>Install TradersLink app</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          Install TradersLink PWA APP to send push notifications to your devices. Get press release alerts on your phone. Easily enter trades in the app and more.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button disabled={openingInstall} onClick={() => setDismissed(true)}>
          Not now
        </Button>
        <Button
          disabled={openingInstall}
          onClick={() => void install()}
          startIcon={<DownloadRoundedIcon />}
          variant="contained"
        >
          {openingInstall ? "Opening install..." : "Install TradersLink app"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
