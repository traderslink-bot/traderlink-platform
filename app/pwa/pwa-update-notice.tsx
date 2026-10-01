"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useEffect, useRef, useState } from "react";

export function PwaUpdateNotice({ paused = false }: { paused?: boolean }) {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);
  const [applying, setApplying] = useState(false);
  const [reloadReady, setReloadReady] = useState(false);
  const [activationDelayed, setActivationDelayed] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const activationTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const requested = useRef(false);
  const reloading = useRef(false);

  const reload = () => {
    if (reloading.current) return;
    reloading.current = true;
    requested.current = false;
    clearTimeout(activationTimer.current);
    window.location.reload();
  };

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let waitingWorker: ServiceWorker | null = null;
    const initialController = navigator.serviceWorker.controller;
    let lastCheck = 0;
    const inspect = () => {
      if (cancelled) return;
      const current = registration?.waiting ??
        (registration?.installing?.state === "installed" && navigator.serviceWorker.controller
          ? registration.installing : null);
      if (waitingWorker !== current) {
        waitingWorker?.removeEventListener("statechange", inspect);
        waitingWorker = current;
        waitingWorker?.addEventListener("statechange", inspect);
      }
      setWaiting(current);
      // Another tab can activate the worker without reloading this page.
      if (initialController && navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller !== initialController) {
        setReloadReady(true);
      }
    };
    const found = () => {
      installing?.removeEventListener("statechange", inspect);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", inspect);
      inspect();
    };
    const check = () => {
      if (!registration || document.visibilityState !== "visible") return;
      inspect();
      if (!navigator.onLine || Date.now() - lastCheck < 60 * 60_000) return;
      lastCheck = Date.now();
      void registration.update().catch(() => undefined);
    };
    const changed = () => {
      if (requested.current) {
        if (!reloading.current) {
          reloading.current = true;
          requested.current = false;
          clearTimeout(activationTimer.current);
          window.location.reload();
        }
      } else inspect();
    };
    void navigator.serviceWorker.ready.then((ready) => {
      if (cancelled) return;
      registration = ready;
      registrationRef.current = ready;
      registration.addEventListener("updatefound", found);
      found();
      check();
    }).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("online", check);
    return () => {
      cancelled = true;
      requested.current = false;
      registrationRef.current = null;
      clearTimeout(activationTimer.current);
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", inspect);
      waitingWorker?.removeEventListener("statechange", inspect);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("online", check);
    };
  }, []);

  function applyUpdate() {
    if (applying || reloading.current) return;
    if (reloadReady || activationDelayed) { reload(); return; }
    // Read the live registration, not the worker captured when the banner appeared.
    const registration = registrationRef.current;
    const worker = registration?.waiting ??
      (registration?.installing?.state === "installed" ? registration.installing : null);
    if (!worker) {
      if (registration?.active?.state === "activated") reload();
      else setActivationDelayed(true);
      return;
    }
    const previousController = navigator.serviceWorker.controller;
    requested.current = true;
    setApplying(true);
    setActivationDelayed(false);
    const delayed = () => {
      // Activation can finish before the controllerchange callback is delivered.
      if (worker.state === "activated" || (navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller !== previousController)) {
        reload();
        return;
      }
      requested.current = false;
      setApplying(false);
      setActivationDelayed(true);
    };
    clearTimeout(activationTimer.current);
    activationTimer.current = setTimeout(delayed, 15_000);
    try {
      // Supported by Serwist, including workers predating our custom message.
      worker.postMessage({ type: "SKIP_WAITING" });
    } catch {
      clearTimeout(activationTimer.current);
      delayed();
    }
  }

  if ((!waiting && !applying && !reloadReady && !activationDelayed) || paused) return null;
  return <Alert severity="info" sx={{ position: "fixed", bottom: 16, right: 16,
    width: "calc(100vw - 32px)", maxWidth: 420, zIndex: (theme) => theme.zIndex.modal - 1 }}>
    <Stack spacing={1}>
      <span>{reloadReady
        ? "The update is ready to open. Save any edits, then reload the app. Offline entries already saved on this device will remain."
        : "A TradersLink update is ready. Save any edits before updating. Offline entries already saved on this device will remain."}</span>
      {activationDelayed && !reloadReady && <span>The update is taking longer than expected. Save any edits, then reload the app.</span>}
      <Button disabled={applying} sx={{ alignSelf: "flex-start" }} variant="outlined" onClick={applyUpdate}>
        {applying ? "Updating…" : reloadReady || activationDelayed ? "Reload app" : "Update app"}
      </Button>
    </Stack>
  </Alert>;
}
