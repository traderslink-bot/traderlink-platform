"use client";

import { useEffect, useState } from "react";
import { SAVED_SCAN_STREAM_PATH, type SavedScanCatalogue } from "@/src/modules/scanner/custom/definition";
import { brokerSavedScansPath, type WorkspaceSavedEntry } from "./broker-workspace-data";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type RequestState = {
  ownerKey: string;
  path: string;
  batchKey: string;
  phase: "ready" | "unavailable" | "retrying";
  catalogue?: SavedScanCatalogue;
  results?: Readonly<Record<string, WorkspaceSavedEntry>>;
};

export function workspaceSavedScanBatch(ids: readonly string[]): string {
  return [...new Set(ids)].sort().join(",");
}

const maximumLine = 2_000_000;

export function useWorkspaceSavedScans(ownerKey: string | undefined, ids: readonly string[], broker = false) {
  const path = broker ? brokerSavedScansPath : SAVED_SCAN_STREAM_PATH;
  const batchKey = workspaceSavedScanBatch(ids);
  const [state, setState] = useState<RequestState>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!ownerKey) return;
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const publish = (fields: Omit<RequestState, "ownerKey" | "batchKey" | "path">) => {
      if (!abort.signal.aborted) setState({ path, ownerKey, batchKey, ...fields });
    };
    const reconnect = (notice: boolean) => {
      if (abort.signal.aborted) return;
      if (notice) publish({ phase: "retrying" });
      timer = setTimeout(() => void connect(), notice ? 4_000 : 1_000);
    };

    async function connect() {
      try {
        const response = await fetch(path, {
          credentials: "same-origin",
          cache: "no-store",
          signal: abort.signal,
          ...(batchKey ? {
            method: "POST",
            headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
            body: JSON.stringify({ ids: batchKey.split(",") }),
          } : {}),
        });
        if (abort.signal.aborted) return;
        if ([401, 403, 404].includes(response.status)) {
          publish({ phase: "unavailable" });
          return;
        }
        if (!response.ok) throw Error("saved_scans_unavailable");
        if (!batchKey) {
          const catalogue = await response.json() as SavedScanCatalogue;
          publish({ phase: "ready", catalogue });
          return;
        }
        if (!response.body) throw Error("saved_scan_stream_missing");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        try {
          while (!abort.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            pending += decoder.decode(value, { stream: true });
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            if (pending.length > maximumLine) throw Error("saved_scan_frame_too_large");
            for (const line of lines) {
              if (!line) continue;
              if (line.length > maximumLine) throw Error("saved_scan_frame_too_large");
              const { revision, scans, results } = JSON.parse(line) as SavedScanCatalogue & { results: Readonly<Record<string, WorkspaceSavedEntry>> };
              publish({ phase: "ready", catalogue: { revision, scans }, results });
            }
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
        }
        // A bounded stream also closes on access loss. Clear its private data while reconnecting.
        publish({ phase: "retrying" });
        reconnect(false);
      } catch {
        reconnect(true);
      }
    }

    void connect();
    return () => {
      abort.abort();
      clearTimeout(timer);
    };
  }, [path, ownerKey, batchKey, attempt]);

  const current = state?.ownerKey === ownerKey && state?.path === path ? state : undefined;
  return {
    catalogue: current?.catalogue,
    results: current?.batchKey === batchKey ? current?.results : undefined,
    phase: current?.phase,
    refreshCatalogue: () => { if (!batchKey && current?.phase !== "unavailable") setAttempt(value => value + 1); },
  };
}
