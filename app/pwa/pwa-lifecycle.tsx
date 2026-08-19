"use client";

import WifiOffRoundedIcon from "@mui/icons-material/WifiOffRounded";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import {
  listManualTradeOutbox,
  MANUAL_TRADE_OUTBOX_CHANGED_EVENT,
  pruneManualTradeReceipts,
  syncManualTradeOutbox,
  type ManualTradeOutboxRecord,
} from "@/src/modules/platform/client/pwa/manual-trade-outbox";

function subscribeToConnectionChange(onStoreChange: () => void): () => void {
  window.addEventListener("online", onStoreChange);
  window.addEventListener("offline", onStoreChange);
  return () => {
    window.removeEventListener("online", onStoreChange);
    window.removeEventListener("offline", onStoreChange);
  };
}

function browserOnlineSnapshot(): boolean {
  return navigator.onLine;
}

function serverOnlineSnapshot(): boolean {
  return true;
}

export function PwaLifecycle({
  accountSelectionRef,
  offlineScopeRef,
}: {
  accountSelectionRef: string | null;
  offlineScopeRef: string;
}) {
  const router = useRouter();
  const syncing = useRef(false);
  const [outbox, setOutbox] = useState<readonly ManualTradeOutboxRecord[]>([]);
  const online = useSyncExternalStore(
    subscribeToConnectionChange,
    browserOnlineSnapshot,
    serverOnlineSnapshot,
  );

  const refreshOutbox = useCallback(async () => {
    if (!accountSelectionRef) {
      setOutbox([]);
      return;
    }
    try {
      setOutbox(await listManualTradeOutbox({
        accountSelectionRef,
        offlineScopeRef,
      }));
    } catch {
      setOutbox([]);
    }
  }, [accountSelectionRef, offlineScopeRef]);

  const runSync = useCallback(async () => {
    if (!accountSelectionRef || !navigator.onLine || syncing.current) return;
    syncing.current = true;
    try {
      const results = await syncManualTradeOutbox({
        accountSelectionRef,
        offlineScopeRef,
      });
      if (results.some((record) => record.state === "saved_to_traderlink")) {
        router.refresh();
      }
      await refreshOutbox();
    } finally {
      syncing.current = false;
    }
  }, [accountSelectionRef, offlineScopeRef, refreshOutbox, router]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "traderlink:pwa-sync-request") {
        void runSync();
      }
      if (event.data?.type === "traderlink:pwa-outbox-changed") {
        void refreshOutbox();
      }
    };
    navigator.serviceWorker.addEventListener("message", onMessage);
    void navigator.serviceWorker.register("/sw.js", { scope: "/" });
    return () => {
      navigator.serviceWorker.removeEventListener("message", onMessage);
    };
  }, [refreshOutbox, runSync]);

  useEffect(() => {
    const onChanged = () => void refreshOutbox();
    void pruneManualTradeReceipts().then(refreshOutbox);
    window.addEventListener(MANUAL_TRADE_OUTBOX_CHANGED_EVENT, onChanged);
    return () => {
      window.removeEventListener(MANUAL_TRADE_OUTBOX_CHANGED_EVENT, onChanged);
    };
  }, [refreshOutbox]);

  useEffect(() => {
    if (online) void runSync();
  }, [online, runSync]);

  useEffect(() => {
    const onResume = () => {
      if (document.visibilityState === "visible") void runSync();
    };
    window.addEventListener("focus", onResume);
    document.addEventListener("visibilitychange", onResume);
    return () => {
      window.removeEventListener("focus", onResume);
      document.removeEventListener("visibilitychange", onResume);
    };
  }, [runSync]);

  const waitingCount = outbox.filter((record) =>
    record.state === "saved_on_device" || record.state === "syncing").length;
  const reviewCount = outbox.filter((record) =>
    record.state === "needs_review").length;

  if (online && waitingCount === 0 && reviewCount === 0) return null;

  const title = !online
    ? "Offline"
    : reviewCount > 0
      ? "Needs your review"
      : "Syncing";
  const message = !online
    ? waitingCount > 0
      ? `${waitingCount} saved trade${waitingCount === 1 ? " is" : "s are"} waiting to sync.`
      : "Some pages may not update until you reconnect."
    : reviewCount > 0
      ? `${reviewCount} saved trade${reviewCount === 1 ? " needs" : "s need"} attention in Trade Entry.`
      : `${waitingCount} saved trade${waitingCount === 1 ? " is" : "s are"} being checked.`;

  return (
    <Paper
      aria-live="polite"
      elevation={6}
      role="status"
      sx={{
        alignItems: "center",
        border: "1px solid",
        borderColor: "divider",
        bottom: { xs: "calc(12px + env(safe-area-inset-bottom))", sm: 20 },
        display: "flex",
        gap: 1.25,
        left: "50%",
        maxWidth: "calc(100vw - 24px)",
        px: 2,
        py: 1.25,
        position: "fixed",
        transform: "translateX(-50%)",
        width: { xs: "calc(100vw - 24px)", sm: "auto" },
        zIndex: (theme) => theme.zIndex.snackbar,
      }}
    >
      <WifiOffRoundedIcon color="action" fontSize="small" />
      <Box>
        <Typography sx={{ fontWeight: 700 }} variant="body2">
          {title}
        </Typography>
        <Typography color="text.secondary" variant="caption">
          {message}
        </Typography>
      </Box>
    </Paper>
  );
}
