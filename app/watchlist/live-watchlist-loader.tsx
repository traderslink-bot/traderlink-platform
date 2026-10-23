"use client";

import { useEffect, useState } from "react";

import { projectLiveWatchlistList, type LiveWatchlistListPayload } from "@/src/lib/live-watchlist/live-watchlist-list";
import { LiveWatchlistIndexClient } from "./live-watchlist-client";

type LoadState =
  | { kind: "loading" }
  | { kind: "ready"; data: LiveWatchlistListPayload }
  | { kind: "error" };

/** Keep the page navigation independent of the live list data request. */
export function LiveWatchlistLoader() {
  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/live-watchlist?view=list", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("watchlist_load_unavailable");
        const data = projectLiveWatchlistList(await response.json());
        if (!Array.isArray(data.symbols)) throw new Error("watchlist_load_invalid");
        if (!controller.signal.aborted) setState({ kind: "ready", data });
      } catch {
        if (!controller.signal.aborted) setState({ kind: "error" });
      }
    })();
    return () => controller.abort();
  }, [attempt]);

  if (state.kind === "ready") {
    return <LiveWatchlistIndexClient initialState={state.data} />;
  }

  return (
    <div className="watchlist-page">
      <section className="academy-card watchlist-empty" role="status" aria-live="polite">
        {state.kind === "loading" ? (
          <>
            <h2>Loading watchlist</h2>
            <p>Getting the latest tickers…</p>
          </>
        ) : (
          <>
            <h2>Watchlist unavailable</h2>
            <p>The list could not load. Your tickers have not been changed.</p>
            <button
              type="button"
              className="academy-card-action"
              onClick={() => {
                setState({ kind: "loading" });
                setAttempt((current) => current + 1);
              }}
            >
              Try again
            </button>
          </>
        )}
      </section>
    </div>
  );
}
