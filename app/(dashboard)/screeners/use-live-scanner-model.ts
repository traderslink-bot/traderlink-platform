"use client";

import { startTransition, useCallback, useEffect, useReducer, useRef } from "react";
import type { ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import { initialScannerConnection, isScannerModel, scannerConnection } from "@/src/modules/scanner/live/connection-state";
import { memberScannerStatus, scannerOutsideActiveHours, SCANNER_TRANSIENT_FAILURE_GRACE_MS } from "@/src/modules/scanner/live/member-status";

export function useLiveScannerModel(sample?: ScannerReadModel) {
  const [state, dispatch] = useReducer(scannerConnection, undefined, () =>
    initialScannerConnection(sample ?? null, sample?.updatedAtUtc ? Date.parse(sample.updatedAtUtc) : Date.now()));
  const retryRef = useRef<() => void>(() => {});
  const retry = useCallback(() => retryRef.current(), []);
  useEffect(() => {
    if (sample) return;
    let source: EventSource | undefined;
    let disposed = false;
    let reconnectTimer: number | undefined;
    let watchdog: number | undefined;
    let probe: AbortController | undefined;
    let probeTimer: number | undefined;
    let attempts = 0;
    let recovering = false;
    const clearTimers = () => {
      window.clearTimeout(reconnectTimer); reconnectTimer = undefined;
      window.clearTimeout(watchdog); watchdog = undefined;
    };
    const close = () => { source?.close(); source = undefined; };
    const schedule = () => {
      if (disposed || document.hidden || reconnectTimer !== undefined || probe) return;
      const delay = Math.min(30_000, 1_000 * 2 ** Math.min(attempts++, 5));
      reconnectTimer = window.setTimeout(() => { reconnectTimer = undefined; void recover(); }, delay);
    };
    const armWatchdog = () => {
      window.clearTimeout(watchdog);
      // The server sends a complete frame every five seconds, even without trades.
      // One timer detects a silently dead stream without extra healthy polling.
      watchdog = window.setTimeout(() => {
        dispatch({ type: "failure", now: Date.now() });
        close(); schedule();
      }, 45_000);
    };
    const open = () => {
      clearTimers(); close();
      if (disposed || document.hidden) return;
      recovering = false;
      const connection = new EventSource("/api/screeners/live?stream=1"); source = connection;
      armWatchdog();
      connection.addEventListener("scanner", event => {
        if (source !== connection) return;
        try {
          const model: unknown = JSON.parse((event as MessageEvent).data);
          if (!isScannerModel(model)) throw Error("invalid_scanner_model");
          attempts = 0; recovering = false; armWatchdog();
          startTransition(() => dispatch({ type: "model", model, now: Date.now() }));
        } catch { dispatch({ type: "failure", now: Date.now() }); }
      });
      connection.onerror = () => {
        if (source !== connection) return;
        recovering = true;
        dispatch({ type: "failure", now: Date.now() });
        // CLOSED can mean a deploy or a transient HTTP failure, not just denial.
        if (connection.readyState === EventSource.CLOSED) { clearTimers(); close(); schedule(); }
      };
    };
    const recover = async () => {
      if (disposed || document.hidden || probe) return;
      clearTimers(); close(); recovering = true;
      dispatch({ type: "failure", now: Date.now() });
      const controller = new AbortController(); probe = controller;
      probeTimer = window.setTimeout(() => controller.abort(), 8_000);
      let recovered = false;
      try {
        // Recovery only: check the same member-protected snapshot boundary before
        // reusing results. Never infer lost access merely from EventSource.CLOSED.
        const response = await fetch("/api/screeners/live", {
          credentials: "same-origin", cache: "no-store", redirect: "error", signal: controller.signal,
        });
        if (disposed || controller.signal.aborted || probe !== controller) return;
        if ([401, 403, 404].includes(response.status)) {
          dispatch({ type: "failure", now: Date.now(), permanent: true });
        } else if (response.ok) {
          const model: unknown = await response.json();
          if (disposed || controller.signal.aborted || probe !== controller) return;
          if (!isScannerModel(model)) throw Error("invalid_scanner_model");
          dispatch({ type: "model", model, now: Date.now() });
          recovered = true;
        }
      } catch { /* Keep last valid same-context rows during a bounded recovery. */ }
      finally {
        if (probe === controller) {
          window.clearTimeout(probeTimer); probeTimer = undefined; probe = undefined;
          if (!disposed && !document.hidden) {
            if (recovered) open(); else schedule();
          }
        }
      }
    };
    const wake = () => {
      if (document.hidden) {
        clearTimers(); close(); probe?.abort(); probe = undefined;
        window.clearTimeout(probeTimer); probeTimer = undefined;
      } else if (!source || recovering) void recover();
    };
    retryRef.current = () => { if (!probe) { attempts = 0; void recover(); } };
    document.addEventListener("visibilitychange", wake);
    window.addEventListener("online", wake); window.addEventListener("focus", wake);
    open();
    return () => {
      disposed = true; retryRef.current = () => {};
      clearTimers(); close(); probe?.abort(); window.clearTimeout(probeTimer);
      document.removeEventListener("visibilitychange", wake);
      window.removeEventListener("online", wake); window.removeEventListener("focus", wake);
    };
  }, [sample]);
  useEffect(() => {
    if (state.failedAt === null) return;
    const timer = window.setTimeout(() => dispatch({ type: "expire", now: Date.now() }),
      Math.max(0, state.failedAt + SCANNER_TRANSIENT_FAILURE_GRACE_MS + 1 - Date.now()));
    return () => window.clearTimeout(timer);
  }, [state.failedAt]);
  const loadError = state.failedAt !== null;
  const notice = memberScannerStatus(state.model, loadError, state.checkedAt, state.failedAt);
  const phase: "unavailable" | "reconnecting" | "refreshing" | null = scannerOutsideActiveHours(state.model, state.checkedAt) || state.model?.status === "disabled" ? null
    : loadError ? notice ? "unavailable" : "reconnecting" : state.continuity.emptySince !== null ? "refreshing" : null;
  return { model: state.model, loadError, checkedAt: state.checkedAt, failedAt: state.failedAt, phase, retry };
}
