"use client";

import { startTransition, useEffect, useReducer } from "react";
import type { ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import { initialScannerConnection, isScannerModel, scannerConnection } from "@/src/modules/scanner/live/connection-state";
import { memberScannerStatus, scannerOutsideActiveHours, SCANNER_TRANSIENT_FAILURE_GRACE_MS } from "@/src/modules/scanner/live/member-status";

export function useLiveScannerModel(sample?: ScannerReadModel) {
  const [state, dispatch] = useReducer(scannerConnection, undefined, () =>
    initialScannerConnection(sample ?? null, sample?.updatedAtUtc ? Date.parse(sample.updatedAtUtc) : Date.now()));
  useEffect(() => {
    if (sample) return;
    let source: EventSource | undefined;
    const open = () => {
      source?.close(); source = undefined;
      if (document.hidden) return;
      const connection = new EventSource("/api/screeners/live?stream=1"); source = connection;
      connection.addEventListener("scanner", event => {
        if (source !== connection) return;
        try {
          const model: unknown = JSON.parse((event as MessageEvent).data);
          if (!isScannerModel(model)) throw Error("invalid_scanner_model");
          startTransition(() => dispatch({ type: "model", model, now: Date.now() }));
        } catch { dispatch({ type: "failure", now: Date.now() }); }
      });
      connection.onerror = () => {
        if (source === connection) dispatch({ type: "failure", now: Date.now(), permanent: connection.readyState === EventSource.CLOSED });
      };
    };
    document.addEventListener("visibilitychange", open); open();
    return () => { source?.close(); source = undefined; document.removeEventListener("visibilitychange", open); };
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
  return { model: state.model, loadError, checkedAt: state.checkedAt, failedAt: state.failedAt, phase };
}
