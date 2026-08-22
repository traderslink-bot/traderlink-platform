"use client";

import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Typography from "@mui/material/Typography";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";

import {
  hasInstalledTradersLinkPwa,
  isTradersLinkPwaRunningStandalone,
  requestTradersLinkPwaInstallation,
  serverTradersLinkPwaInstallPromptReady,
  startTradersLinkPwaInstallPromptCapture,
  subscribeToTradersLinkPwaInstallPrompt,
  tradersLinkPwaInstallPromptReady,
} from "./traderslink-pwa-install-prompt";

const INSTALL_PROMPT_DISPLAY_COUNT_STORAGE_KEY =
  "traderlink:pwa-install-prompt-display-count:v1";
const INSTALL_PROMPT_SUPPRESSED_STORAGE_KEY =
  "traderlink:pwa-install-prompt-suppressed:v1";
const INSTALL_PROMPT_DISMISS_LINK_DISPLAY_COUNT = 3;

function readStoredDisplayCount(): number {
  try {
    const value = Number.parseInt(
      window.localStorage.getItem(INSTALL_PROMPT_DISPLAY_COUNT_STORAGE_KEY) ?? "0",
      10,
    );
    return Number.isSafeInteger(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function TradersLinkPwaInstallPrompt() {
  const installPromptReady = useSyncExternalStore(
    subscribeToTradersLinkPwaInstallPrompt,
    tradersLinkPwaInstallPromptReady,
    serverTradersLinkPwaInstallPromptReady,
  );
  const [installed, setInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [openingInstall, setOpeningInstall] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);
  const [storageReady, setStorageReady] = useState(false);
  const [suppressed, setSuppressed] = useState(false);
  const recordedPromptDisplay = useRef(false);

  useEffect(() => {
    try {
      setSuppressed(window.localStorage.getItem(INSTALL_PROMPT_SUPPRESSED_STORAGE_KEY) === "true");
    } catch {
      setSuppressed(false);
    } finally {
      setDisplayCount(readStoredDisplayCount());
      setStorageReady(true);
    }
  }, []);

  const showPrompt = storageReady && !dismissed && !installed && !suppressed && installPromptReady;

  useEffect(() => {
    if (!showPrompt || recordedPromptDisplay.current) return;
    recordedPromptDisplay.current = true;

    setDisplayCount((currentCount) => {
      const nextCount = currentCount + 1;
      try {
        window.localStorage.setItem(INSTALL_PROMPT_DISPLAY_COUNT_STORAGE_KEY, String(nextCount));
      } catch {
        // The prompt remains usable when browser storage is unavailable.
      }
      return nextCount;
    });
  }, [showPrompt]);

  function suppressPrompt(): void {
    try {
      window.localStorage.setItem(INSTALL_PROMPT_SUPPRESSED_STORAGE_KEY, "true");
    } catch {
      // The current page can still honor the trader's choice.
    }
    setSuppressed(true);
  }

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

  if (!showPrompt) return null;

  return (
    <Dialog fullWidth maxWidth="xs" onClose={() => setDismissed(true)} open>
      <DialogTitle>Install TradersLink app</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">
          Install TradersLink PWA APP to send push notifications to your devices. Get press release alerts on your phone. Easily enter trades in the app and more.
        </Typography>
      </DialogContent>
      <DialogActions>
        {displayCount >= INSTALL_PROMPT_DISMISS_LINK_DISPLAY_COUNT ? (
          <Button onClick={suppressPrompt} variant="text">
            Don&apos;t show this again
          </Button>
        ) : null}
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
