"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  canSafelyUpdatePwa,
  PWA_UPDATE_SAFETY_CHANGED,
} from "@/src/modules/platform/client/pwa/platform-pwa-update-safety";

type UpdateNotice = "hidden" | "editing" | "other-windows" | "failed";

export function PwaUpdateNotice({ paused = false }: { paused?: boolean }) {
  const pathname = usePathname();
  const [notice, setNotice] = useState<UpdateNotice>("hidden");
  const reloading = useRef(false);
  const reloadReady = useRef(false);
  const automaticFailed = useRef(false);
  const initialController = useRef<ServiceWorker | null | undefined>(undefined);
  const retry = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let cancelled = false;
    let registration: ServiceWorkerRegistration | undefined;
    let installing: ServiceWorker | null = null;
    let waitingWorker: ServiceWorker | null = null;
    let attemptedWorker: ServiceWorker | null = null;
    let applying = false;
    let activationTimer: ReturnType<typeof setTimeout> | undefined;
    let readinessTimer: ReturnType<typeof setTimeout> | undefined;
    let reply: MessagePort | undefined;
    let lastCheck = 0;
    if (initialController.current === undefined) initialController.current = navigator.serviceWorker.controller;

    const clearAttempt = () => {
      applying = false;
      clearTimeout(activationTimer);
      reply?.close();
      reply = undefined;
    };
    const safeNow = () => !cancelled && !paused && navigator.onLine &&
      document.visibilityState === "visible" && canSafelyUpdatePwa();
    const reload = () => {
      // Always recheck after the asynchronous, cross-window activation handshake.
      if (!safeNow()) { setNotice("editing"); clearAttempt(); return; }
      if (reloading.current) return;
      reloading.current = true;
      clearAttempt();
      window.location.reload();
    };
    const fail = () => {
      clearAttempt();
      automaticFailed.current = true;
      setNotice(canSafelyUpdatePwa() ? "failed" : "editing");
    };
    const inspect = () => {
      if (cancelled || reloading.current) return;
      const current = registration?.waiting ?? null;
      if (waitingWorker !== current) {
        waitingWorker?.removeEventListener("statechange", inspect);
        waitingWorker = current;
        waitingWorker?.addEventListener("statechange", inspect);
      }
      if (initialController.current && navigator.serviceWorker.controller &&
        navigator.serviceWorker.controller !== initialController.current) reloadReady.current = true;
      if (!current && !reloadReady.current && !applying && !automaticFailed.current) return;
      if (!canSafelyUpdatePwa()) { setNotice("editing"); return; }
      if (automaticFailed.current) { setNotice("failed"); return; }
      if (!safeNow()) return;
      if (reloadReady.current) { reload(); return; }
      if (!current || applying || attemptedWorker === current) return;
      attemptedWorker = current;
      applying = true;
      setNotice("hidden");
      const channel = new MessageChannel();
      reply = channel.port1;
      reply.onmessage = (event: MessageEvent) => {
        if (cancelled || !applying) return;
        if (event.data?.status === "blocked") {
          clearAttempt();
          setNotice(canSafelyUpdatePwa() ? "other-windows" : "editing");
        } else if (event.data?.status !== "activating") fail();
      };
      activationTimer = setTimeout(() => {
        if (current.state === "activated" || (initialController.current &&
          navigator.serviceWorker.controller !== initialController.current)) {
          reloadReady.current = true;
          reload();
        } else fail();
      }, 15_000);
      try {
        current.postMessage({ type: "traderlink:request-safe-update" }, [channel.port2]);
      } catch { fail(); }
    };
    const check = () => {
      if (!registration || document.visibilityState !== "visible") return;
      if (!applying && !automaticFailed.current) attemptedWorker = null;
      inspect();
      if (!navigator.onLine || Date.now() - lastCheck < 60 * 60_000) return;
      lastCheck = Date.now();
      void registration.update().catch(() => undefined);
    };
    const found = () => {
      installing?.removeEventListener("statechange", inspect);
      installing = registration?.installing ?? null;
      installing?.addEventListener("statechange", inspect);
      inspect();
    };
    const changed = () => {
      if (initialController.current && navigator.serviceWorker.controller !== initialController.current) {
        reloadReady.current = true;
      }
      clearAttempt();
      inspect();
    };
    retry.current = () => { if (automaticFailed.current || reloadReady.current) reload(); else inspect(); };
    void navigator.serviceWorker.ready.then((ready) => {
      if (cancelled) return;
      registration = ready;
      registration.addEventListener("updatefound", found);
      // Allow the current React commit's edit guards to register before deciding.
      readinessTimer = setTimeout(() => { found(); check(); }, 0);
    }).catch(() => undefined);
    navigator.serviceWorker.addEventListener("controllerchange", changed);
    document.addEventListener("visibilitychange", check);
    window.addEventListener("pageshow", check);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    window.addEventListener(PWA_UPDATE_SAFETY_CHANGED, inspect);
    return () => {
      cancelled = true;
      clearAttempt();
      clearTimeout(readinessTimer);
      retry.current = () => undefined;
      registration?.removeEventListener("updatefound", found);
      installing?.removeEventListener("statechange", inspect);
      waitingWorker?.removeEventListener("statechange", inspect);
      navigator.serviceWorker.removeEventListener("controllerchange", changed);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("pageshow", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
      window.removeEventListener(PWA_UPDATE_SAFETY_CHANGED, inspect);
    };
  }, [pathname, paused]);

  if (notice === "hidden" || paused) return null;
  return <Alert data-pwa-update-control severity="info" sx={{ position: "fixed", bottom: 16, right: 16,
    width: "calc(100vw - 32px)", maxWidth: 420, zIndex: (theme) => theme.zIndex.modal - 1 }}>
    <Stack spacing={1}>
      <span>{notice === "editing"
        ? "An update is ready. Finish and save your work, then close and reopen TradersLink to update."
        : notice === "other-windows"
          ? "An update is ready. Save your work in other TradersLink windows, then close them and reopen this app."
          : "The automatic update could not finish. Save any work, then reload the app to try again."}</span>
      <span>Offline entries already saved on this device will remain.</span>
      {notice === "failed" && <Button sx={{ alignSelf: "flex-start" }} variant="outlined" onClick={() => retry.current()}>
        Reload app
      </Button>}
    </Stack>
  </Alert>;
}
