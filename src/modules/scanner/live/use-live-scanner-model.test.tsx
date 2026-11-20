import { act, useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
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
  fail(terminal = false) { this.readyState = terminal ? 2 : 0; this.onerror?.(); }
}
const empty = { rows: [], focus: [], total: 0 };
const model: ScannerReadModel = { status: "ready", tradingDate: "2026-11-19", session: "regular", updatedAtUtc: "2026-11-19T16:00:00Z",
  universeCount: 2, receivedCount: 2, missingSymbols: [], missingFloatCount: 0, gainers: empty, momentum: empty, issues: [] };
let view: ReturnType<typeof useLiveScannerModel>, root: Root, host: HTMLDivElement;
let hidden = false;
const request = vi.fn();
const response = (status: number, body: unknown = model) => ({ status, ok: status === 200, json: async () => body });
function View() { const current = useLiveScannerModel(); useEffect(() => { view = current; }, [current]); return <div>{memberScannerStatus(current.model, current.loadError, current.checkedAt, current.failedAt)}</div>; }
const tick = async (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const mount = async () => { host = document.createElement("div"); document.body.append(host); root = createRoot(host); await act(async () => root.render(<View />)); };
beforeEach(() => {
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-11-19T16:30:00Z")); Source.connections = []; hidden = false;
  request.mockReset().mockResolvedValue(response(200)); vi.stubGlobal("fetch", request); vi.stubGlobal("EventSource", Source);
  vi.spyOn(document, "hidden", "get").mockImplementation(() => hidden);
});
afterEach(async () => { if (root) await act(async () => root.unmount()); host?.remove(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("recovers a terminal stream after a deploy-like 503 without refresh and keeps the last model", async () => {
  await mount(); const source = Source.connections[0];
  await act(async () => source.model(model)); request.mockResolvedValueOnce(response(503)).mockResolvedValueOnce(response(200));
  await act(async () => source.fail(true)); expect(source.closed).toBe(true); expect(view.model).toEqual(model); expect(view.phase).toBe("reconnecting");
  await tick(1_000); expect(request).toHaveBeenCalledTimes(1); expect(Source.connections).toHaveLength(1);
  await tick(2_000); expect(request).toHaveBeenCalledTimes(2); expect(Source.connections).toHaveLength(2);
  expect(view.model).toEqual(model); expect(view.phase).toBeNull();
  expect(request.mock.calls[0][0]).toBe("/api/screeners/live");
  expect(request.mock.calls[0][1]).toMatchObject({ credentials: "same-origin", cache: "no-store", redirect: "error" });
  await act(async () => source.model({ ...model, status: "disabled" })); expect(view.model?.status).toBe("ready");
});
it("uses only stream frames while healthy; native transient errors recover without another request", async () => {
  await mount(); const source = Source.connections[0];
  for (let i = 0; i < 15; i++) { await act(async () => source.model(model)); await tick(5_000); }
  expect(request).not.toHaveBeenCalled(); expect(Source.connections).toHaveLength(1);
  await act(async () => source.fail()); await tick(5_000); expect(view.phase).toBe("reconnecting"); expect(host.textContent).toBe("");
  await act(async () => source.model(model)); expect(view.phase).toBeNull(); expect(request).not.toHaveBeenCalled();
});
it("detects a silent dead stream and reopens one replacement", async () => {
  await mount(); const source = Source.connections[0]; await act(async () => source.model(model));
  await tick(44_999); expect(request).not.toHaveBeenCalled();
  await tick(1_001); expect(source.closed).toBe(true); expect(request).toHaveBeenCalledTimes(1); expect(Source.connections).toHaveLength(2);
});
it("manual retry coalesces clicks, verifies denial, and recovers later without retaining denied rows", async () => {
  await mount(); await act(async () => Source.connections[0].model(model));
  let finish!: (value: ReturnType<typeof response>) => void;
  request.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => { view.retry(); view.retry(); view.retry(); }); expect(request).toHaveBeenCalledTimes(1);
  await act(async () => finish(response(404))); expect(view.model).toBeNull();
  await tick(1_000); expect(Source.connections).toHaveLength(2); expect(view.model).toEqual(model);
});
it("cancels hidden/unmounted work, resumes once on visibility and ignores an aborted late response", async () => {
  await mount(); let finish!: (value: ReturnType<typeof response>) => void;
  request.mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }));
  await act(async () => view.retry()); const signal = request.mock.calls[0][1].signal as AbortSignal;
  hidden = true; await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(signal.aborted).toBe(true); expect(vi.getTimerCount()).toBe(1); // failure notice only
  hidden = false; await act(async () => document.dispatchEvent(new Event("visibilitychange")));
  expect(Source.connections).toHaveLength(2);
  await act(async () => finish(response(200, { ...model, status: "disabled" })));
  expect(view.model?.status).toBe("ready");
  await act(async () => root.unmount()); expect(Source.connections.at(-1)!.closed).toBe(true); expect(vi.getTimerCount()).toBe(0);
});
it("focus and online wake a failed connection but do not churn a healthy stream", async () => {
  await mount(); await act(async () => { window.dispatchEvent(new Event("focus")); window.dispatchEvent(new Event("online")); });
  expect(request).not.toHaveBeenCalled();
  await act(async () => Source.connections[0].fail(true));
  await act(async () => { window.dispatchEvent(new Event("online")); window.dispatchEvent(new Event("focus")); });
  expect(request).toHaveBeenCalledTimes(1); expect(Source.connections).toHaveLength(2);
});
it("bounds repeated failures and shows an outage only after two minutes", async () => {
  await mount(); await act(async () => Source.connections[0].model(model)); request.mockResolvedValue(response(503));
  await act(async () => Source.connections[0].fail(true)); const first = view.failedAt;
  await tick(GRACE); expect(view.failedAt).toBe(first); expect(host.textContent).toBe("");
  await tick(1); expect(host.textContent).toBe("Temporarily unavailable."); expect(view.phase).toBe("unavailable");
  expect(request.mock.calls.length).toBeLessThan(10);
});
it("aborts a hung recovery request and schedules another attempt", async () => {
  await mount(); request.mockImplementationOnce((_url, options) => new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Error("aborted")))));
  await act(async () => view.retry()); await tick(8_000); expect(request.mock.calls[0][1].signal.aborted).toBe(true);
  await tick(1_000); expect(request).toHaveBeenCalledTimes(2); expect(Source.connections).toHaveLength(2);
});
