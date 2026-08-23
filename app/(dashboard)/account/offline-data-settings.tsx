"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PLATFORM_OFFLINE_MAX_PAGE_DATA_BYTES,
  PLATFORM_OFFLINE_MAX_SAVED_VIEW_BYTES,
} from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";
import {
  PLATFORM_OFFLINE_DATA_CHANGED_EVENT,
  platformOfflinePartitionKey,
  readPlatformOfflineStorageSummary,
  removePlatformOfflinePartition,
  type PlatformOfflineStorageSummary,
} from "@/src/modules/platform/client/pwa/offline-projection-store";
import { disablePlatformWebPush } from "@/src/modules/platform/client/pwa/platform-web-push";
import { InstallTradersLinkPwaMethods } from "@/app/pwa/install-traderslink-pwa-card";

function formatBytes(bytes: number): string {
  if (bytes < 1_024) return `${bytes} bytes`;
  if (bytes < 1_048_576) return `${(bytes / 1_024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

function formatStorageLimit(bytes: number): string {
  return `${bytes / 1_000_000} MB`;
}

function formatTime(value: string | null): string {
  if (!value) return "No pages saved yet";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function OfflineDataSettings({
  accountSelectionRef,
  offlineScopeRef,
}: {
  accountSelectionRef: string | null;
  offlineScopeRef: string;
}) {
  const partitionKey = useMemo(
    () => platformOfflinePartitionKey(offlineScopeRef, accountSelectionRef),
    [accountSelectionRef, offlineScopeRef],
  );
  const [summary, setSummary] = useState<PlatformOfflineStorageSummary | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setSummary(await readPlatformOfflineStorageSummary(partitionKey));
    } catch {
      setSummary(null);
    }
  }, [partitionKey]);

  useEffect(() => {
    void refresh();
    const onChanged = () => void refresh();
    window.addEventListener(PLATFORM_OFFLINE_DATA_CHANGED_EVENT, onChanged);
    return () => window.removeEventListener(PLATFORM_OFFLINE_DATA_CHANGED_EVENT, onChanged);
  }, [refresh]);

  async function remove(): Promise<void> {
    setWorking(true);
    try {
      await disablePlatformWebPush().catch(() => undefined);
      await removePlatformOfflinePartition(partitionKey);
      setConfirmOpen(false);
      setMessage("Offline data was removed from this device.");
      await refresh();
    } catch {
      setMessage("Offline data could not be removed. Close other TraderLink windows and try again.");
    } finally {
      setWorking(false);
    }
  }

  const pendingTradeCount = summary?.pendingTradeCount ?? 0;
  const savedPageCount = summary
    ? summary.savedViewCount > 0
      ? summary.savedViewCount
      : summary.projectionCount
    : 0;
  const deviceStorageBytes = summary?.browserUsageBytes ??
    summary?.approximateBytes ?? 0;
  return (
    <Stack spacing={1.5}>
      <Typography color="text.secondary" variant="body2">
        Install TradersLink PWA APP to send push notifications to your devices. Get press release alerts on your phone. Easily enter trades in the app and more.
      </Typography>
      <InstallTradersLinkPwaMethods />
      <Typography color="text.secondary" variant="body2">
        In Chrome or Edge, open the browser menu and choose <strong>Install app</strong>. On iPhone or iPad, open the Share menu and choose <strong>Add to Home Screen</strong>. <Link href="https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/What_is_a_progressive_web_app" rel="noreferrer" target="_blank">Learn what a PWA is</Link>.
      </Typography>
      {message ? <Alert severity={message.startsWith("Offline data was") ? "success" : "error"}>{message}</Alert> : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Stack spacing={0.25} sx={{ minWidth: 150 }}>
          <Typography color="text.secondary" variant="caption">Saved pages</Typography>
          <Typography sx={{ fontWeight: 800 }}>{savedPageCount}</Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ minWidth: 170 }}>
          <Typography color="text.secondary" variant="caption">Last updated</Typography>
          <Typography sx={{ fontWeight: 800 }}>{formatTime(summary?.lastSyncedAtUtc ?? null)}</Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ minWidth: 130 }}>
          <Typography color="text.secondary" variant="caption">Device storage</Typography>
          <Typography sx={{ fontWeight: 800 }}>{formatBytes(deviceStorageBytes)}</Typography>
        </Stack>
        <Stack spacing={0.25} sx={{ minWidth: 130 }}>
          <Typography color="text.secondary" variant="caption">Unsynced trades</Typography>
          <Typography sx={{ fontWeight: 800 }}>{pendingTradeCount}</Typography>
        </Stack>
      </Stack>
      <Typography color="text.secondary" variant="caption">
        TraderLink keeps up to {formatStorageLimit(PLATFORM_OFFLINE_MAX_PAGE_DATA_BYTES)} of read-only page copies in this browser and removes the oldest copies first. Each saved page is limited to {formatStorageLimit(PLATFORM_OFFLINE_MAX_SAVED_VIEW_BYTES)}. Unsynced trades are never removed automatically.
      </Typography>
      <Button color="error" onClick={() => setConfirmOpen(true)} sx={{ alignSelf: "flex-start" }} variant="outlined">
        Remove offline data
      </Button>
      <Dialog fullWidth maxWidth="sm" onClose={() => !working && setConfirmOpen(false)} open={confirmOpen}>
        <DialogTitle>Remove offline data?</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25}>
            <Typography>
              This removes saved page copies and offline trade entries for the current Trade Tracker account, and turns off push notifications on this device.
            </Typography>
            {pendingTradeCount > 0 ? (
              <Alert severity="warning">
                {pendingTradeCount} unsynced trade {pendingTradeCount === 1 ? "entry is" : "entries are"} only saved on this device. Removing offline data will permanently remove {pendingTradeCount === 1 ? "it" : "them"} before TraderLink receives {pendingTradeCount === 1 ? "it" : "them"}.
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={working} onClick={() => setConfirmOpen(false)}>Keep offline data</Button>
          <Button color="error" disabled={working} onClick={() => void remove()} variant="contained">
            {working ? "Removing..." : "Remove from this device"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
