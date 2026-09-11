"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useEffect, useRef, useState } from "react";

export function PwaUpdateNotice({ paused = false }: { paused?: boolean }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [applying, setApplying] = useState(false);
  const [activationFailed, setActivationFailed] = useState(false);
  const activationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requested = useRef(false);
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let lastCheck = 0;
    const inspect = () => {
      if (!cancelled) setWaiting(registration?.waiting ??
        (installing?.state === "installed" && navigator.serviceWorker.controller ? installing : null));
    };
    const found = () => {
      installing?.removeEventListener("statechange", inspect);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", inspect);
      inspect();
    };
    const check = () => {
      if (!registration || !navigator.onLine || document.visibilityState !== "visible") return;
      inspect();
      if (Date.now() - lastCheck < 60 * 60_000) return;
      lastCheck = Date.now();
      void registration.update().catch(() => undefined);
    };
    const changed = () => { if (requested.current) window.location.reload(); };
    void navigator.serviceWorker.ready.then((ready) => {
      if (cancelled) return;
      registration = ready;
      registration.addEventListener("updatefound", found);
      found();
      check();
    }).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      cancelled = true;
      clearTimeout(activationTimer.current);
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", inspect);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);
  if (!waiting || paused) return null;
  return <Alert severity="info" sx={{ position: "fixed", bottom: 16, right: 16,
    width: "calc(100vw - 32px)", maxWidth: 420, zIndex: (theme) => theme.zIndex.snackbar }}>
    <Stack spacing={1}>
      <span>A TradersLink update is ready. Save any edits before updating. Offline entries already saved on this device will remain.</span>
      {activationFailed && <span>The update could not finish. Please try again when connected.</span>}
      <Button disabled={applying} sx={{ alignSelf: "flex-start" }} variant="outlined" onClick={() => {
        requested.current = true;
        setApplying(true);
        setActivationFailed(false);
        const failed = () => {
          requested.current = false;
          setApplying(false);
          setActivationFailed(true);
        };
        clearTimeout(activationTimer.current);
        activationTimer.current = setTimeout(failed, 15_000);
        try { waiting.postMessage({ type: "traderlink:activate-update" }); }
        catch { clearTimeout(activationTimer.current); failed(); }
      }}>{applying ? "Updating…" : "Update app"}</Button>
    </Stack>
  </Alert>;
}
