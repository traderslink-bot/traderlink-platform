import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import type { ScannerReadModel } from "./contracts";
import { useLiveScannerModel } from "@/app/(dashboard)/screeners/use-live-scanner-model";
import { memberScannerStatus, SCANNER_TRANSIENT_FAILURE_GRACE_MS as GRACE } from "./member-status";

class Source extends EventTarget {
  static CLOSED = 2;
  static connections: Source[] = [];
  readyState = 1;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(readonly url: string) { super(); Source.connections.push(this); }
  close() { this.closed = true; this.readyState = 2; }
  model(value: unknown) { this.dispatchEvent(new MessageEvent("scanner", { data: JSON.stringify(value) })); }
  fail(permanent = false) { this.readyState = permanent ? 2 : 0; this.onerror?.(); }
}
const empty = { rows: [], focus: [], total: 0 };
const model: ScannerReadModel = { status: "ready", tradingDate: "2026-11-19", session: "regular", updatedAtUtc: "2026-11-19T16:00:00Z",
  universeCount: 2, receivedCount: 2, missingSymbols: [], missingFloatCount: 0, gainers: empty, momentum: empty, issues: [] };
let view: ReturnType<typeof useLiveScannerModel>;
function View() { const current = useLiveScannerModel(); useEffect(() => { view = current; }, [current]); return <div>{memberScannerStatus(current.model, current.loadError, current.checkedAt, current.failedAt)}</div>; }
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-19T16:30:00Z")); Source.connections = []; vi.stubGlobal("EventSource", Source); vi.spyOn(document, "hidden", "get").mockReturnValue(false); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("uses one bounded fault timer, preserves empty snapshots, resets on recovery and cleans up", async () => {
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<View />));
    expect(Source.connections).toHaveLength(1); const source = Source.connections[0];
    expect(source.url).toBe("/api/screeners/live?stream=1");
    await act(async () => source.model(model)); expect(view.model).toEqual(model);
    await act(async () => source.fail()); expect(view.phase).toBe("reconnecting"); expect(host.textContent).toBe("");
    expect(vi.getTimerCount()).toBe(1);
    await act(async () => { vi.advanceTimersByTime(5000); source.fail(); }); expect(vi.getTimerCount()).toBe(1);
    await act(async () => vi.advanceTimersByTime(GRACE - 5000 + 1));
    expect(host.textContent).toBe("Temporarily unavailable."); expect(view.phase).toBe("unavailable");
    await act(async () => source.model(model)); expect(host.textContent).toBe(""); expect(view.loadError).toBe(false); expect(vi.getTimerCount()).toBe(0);
    await act(async () => source.fail()); await act(async () => root.unmount());
    expect(source.closed).toBe(true); expect(vi.getTimerCount()).toBe(0);
  } finally { await act(async () => root.unmount()); host.remove(); }
});

it("ignores old connections after visibility reopen and clears permanently closed/auth-failed streams", async () => {
  const host = document.createElement("div"), root = createRoot(host); document.body.append(host);
  try {
    await act(async () => root.render(<View />)); const old = Source.connections[0];
    await act(async () => old.model(model));
    await act(async () => document.dispatchEvent(new Event("visibilitychange"))); const current = Source.connections.at(-1)!;
    expect(old.closed).toBe(true); expect(current).not.toBe(old);
    await act(async () => old.fail()); expect(view.loadError).toBe(false);
    await act(async () => current.model({ invalid: true })); expect(view.phase).toBe("reconnecting");
    await act(async () => current.fail(true)); expect(view.model).toBeNull(); expect(host.textContent).toBe("Temporarily unavailable.");
    await act(async () => document.dispatchEvent(new Event("visibilitychange")));
    await act(async () => Source.connections.at(-1)!.model(model)); expect(view.model).toEqual(model); expect(view.phase).toBeNull();
  } finally { await act(async () => root.unmount()); host.remove(); }
});
