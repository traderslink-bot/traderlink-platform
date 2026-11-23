"use client";

import { useCallback, useEffect, useState } from "react";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import {
  EMPTY_SCAN, parseSavedScanBook, SCAN_STREAM_PATH, type SavedScanBook, type ScanPublication, type ScanQuery,
} from "@/src/modules/scanner/custom/definition";

import { SHARED_SCAN_PATH } from "@/src/modules/scanner/custom/sharing";

const requestHeaders = { "Content-Type":"application/json", [PLATFORM_MUTATION_REQUEST_HEADER]:"1" };
const bookEvent = "traderlink:saved-live-scans";

export function useSavedCustomScans(enabled = true) {
  const [book,setBook] = useState<SavedScanBook>();
  const [error,setError] = useState("");
  const reload = useCallback(async (signal?: AbortSignal) => {
    try {
      const response = await fetch(SCAN_STREAM_PATH, { cache:"no-store", signal });
      if (!response.ok) throw Error();
      const loaded = parseSavedScanBook(await response.json());
      if (signal?.aborted) return false;
      setBook(current => current && current.revision > loaded.revision ? current : loaded);
      setError("");
      return true;
    } catch {
      if (!signal?.aborted) setError("Saved scans could not load.");
      return false;
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    const abort = new AbortController();
    void reload(abort.signal);
    function receive(event: Event) {
      const saved = (event as CustomEvent<SavedScanBook>).detail;
      setBook(current => current && current.revision > saved.revision ? current : saved);
    }
    window.addEventListener(bookEvent, receive);
    return () => { abort.abort(); window.removeEventListener(bookEvent, receive); };
  }, [enabled, reload]);

  async function save(next: SavedScanBook) {
    const response = await fetch(SCAN_STREAM_PATH, { method:"PUT", headers:requestHeaders, body:JSON.stringify(next) });
    if (response.status === 409) {
      const refreshed = await reload();
      throw Error(refreshed
        ? "Saved scans changed. Close this dialog and review the latest list. Your filters are still here."
        : "Saved scans changed. Refresh the saved scans list before trying again.");
    }
    if (!response.ok) throw Error("Could not save this scan. Try again.");
    const saved = parseSavedScanBook(await response.json());
    window.dispatchEvent(new CustomEvent(bookEvent, { detail:saved }));
    return saved;
  }
  return { book, error, reload, save };
}

export function useCustomScanResults(queries: readonly ScanQuery[], runRevision: number, shareId?: string) {
  const sharedPage = shareId ? queries[0]?.page : undefined;
  const body = JSON.stringify(shareId && sharedPage ? { id: shareId, page: sharedPage } : queries);
  const key = (body === "[]" ? "" : runRevision + ":" + body);
  type Snapshot = { key: string; queries: readonly ScanQuery[]; values: ScanPublication };
  const [publication, setPublication] = useState<{
    key: string; values: ScanPublication; error: string; usable?: Snapshot;
  }>();
  useEffect(() => {
    if (!key) return;
    const requested: ScanQuery[] = shareId && sharedPage
      ? [{ key: "shared", definition: EMPTY_SCAN, page: sharedPage }] : JSON.parse(body);
    const abort = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    function error() {
      if (!abort.signal.aborted) {
        setPublication(current => ({
          key, values: {}, usable: shareId ? undefined : current?.usable, error: "Reconnecting to scanner results…",
        }));
        timer = setTimeout(() => void connect(), 1_200);
      }
    }
    async function connect() {
      try {
        const response = await fetch(shareId ? SHARED_SCAN_PATH : SCAN_STREAM_PATH, { method:"POST", headers:requestHeaders, body, signal:abort.signal });
        if (abort.signal.aborted) return;
        if (!response.ok || !response.body) {
          if ([401, 403, 404].includes(response.status)) {
            setPublication({ key, values:{}, error:"This scan could not be opened." });
            return;
          }
          if (response.status === 400) {
            setPublication(current => ({ key, values: {}, usable: current?.usable, error: "This scan could not be opened." }));
            return;
          }
          throw Error();
        }
        reader = response.body.getReader();
        const decoder = new TextDecoder();
        let pending = "";
        while (!abort.signal.aborted) {
          const { value, done } = await reader.read();
          if (done) { error(); break; }
          pending += decoder.decode(value, { stream:true });
          const lines = pending.split("\n");
          pending = lines.pop()!;
          const values: ScanPublication = {};
          for (const line of lines) {
            if (line) Object.assign(values,JSON.parse(line));
          }
          if (Object.keys(values).length && !abort.signal.aborted) {
            setPublication(current => {
              const merged = { ...(current?.key === key ? current.values : {}), ...values };
              const usable = requested.every(query => merged[query.key]?.status === "open" || merged[query.key]?.status === "closed");
              const unavailable = requested.some(query => merged[query.key]?.status === "unavailable");
              return { key, values: merged,
                usable: usable ? { key, queries: requested, values: merged } : current?.usable,
                error: unavailable ? "Scanner data is temporarily unavailable." : "",
              };
            });
          }
        }
      } catch { error(); }
      finally { reader?.releaseLock(); reader = undefined; }
    }
    void connect();
    return () => { clearTimeout(timer); abort.abort(); void reader?.cancel().catch(() => {}); };
  }, [key, body, shareId, sharedPage]);
  const current = publication?.key === key ? publication : undefined;
  const lastUsable = key ? publication?.usable : undefined;
  const showPrevious = !!lastUsable && (lastUsable.key !== key || !!current?.error ||
    queries.some(query => current?.values[query.key]?.status === "waiting"));
  return {
    values: showPrevious ? lastUsable.values : current?.values ?? {},
    queries: showPrevious ? lastUsable.queries : queries,
    error: current?.error ?? "",
    showPrevious,
  };
}
