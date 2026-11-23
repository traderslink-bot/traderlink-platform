import { afterEach, expect, it, vi } from "vitest";
import { readCompletedChartHistory, sharedChartFetch, sharedChartStream } from "../../../../app/(dashboard)/charts/shared-chart-data";
afterEach(() => vi.unstubAllGlobals());
it("shares one connection for the same symbol and keeps it until its last chart closes", async () => {
  const sources: Source[] = [];
  class Source extends EventTarget { close = vi.fn(); onerror: ((event: Event) => void) | null = null; constructor(public url: string) { super(); sources.push(this); } }
  vi.stubGlobal("EventSource", Source);
  const one = sharedChartStream("/stream?symbol=OMH"), two = sharedChartStream("/stream?symbol=OMH");
  const receive = vi.fn(); two.addEventListener("price", receive);
  expect(sources).toHaveLength(1);
  sources[0].dispatchEvent(new MessageEvent("price", { data: '{"price":5}' })); expect(receive).toHaveBeenCalledOnce();
  one.close(); expect(sources[0].close).not.toHaveBeenCalled();
  two.close(); expect(sources[0].close).toHaveBeenCalledOnce();
});
it("coalesces history reads but one chart aborting does not cancel another chart", async () => {
  let finish!: (response: Response) => void;
  const transport = vi.fn<(url: string, init?: RequestInit) => Promise<Response>>(() => new Promise<Response>(resolve => { finish = resolve; })); vi.stubGlobal("fetch", transport);
  const abort = new AbortController();
  const one = sharedChartFetch("/bars?symbol=OMH", { signal: abort.signal }).catch(error => error.name);
  const two = sharedChartFetch("/bars?symbol=OMH");
  expect(transport).toHaveBeenCalledOnce(); abort.abort(); expect(await one).toBe("AbortError");
  expect(transport.mock.calls[0][1]?.signal?.aborted).toBe(false);
  finish(Response.json({ bars: [1, 2] })); expect(await (await two).json()).toEqual({ bars: [1, 2] });
});

it("starts a fresh request after the last consumer aborts during a remount", async () => {
  const transport = vi.fn<(url:string,init?:RequestInit)=>Promise<Response>>((url, init) => new Promise((_resolve,reject) => init?.signal?.addEventListener("abort",()=>reject(new DOMException(url,"AbortError")))));
  vi.stubGlobal("fetch",transport);
  const firstAbort=new AbortController(),secondAbort=new AbortController();
  const first=sharedChartFetch("/remount-bars",{signal:firstAbort.signal}).catch(error=>error.name);
  firstAbort.abort();await first;
  const second=sharedChartFetch("/remount-bars",{signal:secondAbort.signal}).catch(error=>error.name);
  expect(transport).toHaveBeenCalledTimes(2);secondAbort.abort();expect(await second).toBe("AbortError");
});

it("reuses the daily stream and replays the current candle when changing views", async () => {
  const connections: FixtureStream[] = [];
  class FixtureStream extends EventTarget {
    readonly close = vi.fn();
    constructor() { super(); connections.push(this); }
  }
  vi.useFakeTimers();
  vi.stubGlobal("EventSource", FixtureStream);
  const url = "/api/screeners/charts/stream?symbol=HANDOFF&daily=1";
  let nextView: ReturnType<typeof sharedChartStream> | undefined;
  try {
    const firstView = sharedChartStream(url, true);
    const source = connections[0];
    firstView.close();
    vi.advanceTimersByTime(500);
    const candle = JSON.stringify({ daily: true, bar: { time: 1793672400, close: 25 } });
    source.dispatchEvent(new MessageEvent("bar", { data: candle }));

    nextView = sharedChartStream(url, true);
    const listener = vi.fn();
    nextView.addEventListener("bar", listener);
    await Promise.resolve();
    expect(connections).toEqual([source]);
    expect(listener).toHaveBeenCalledWith(expect.objectContaining({ data: candle }));
    vi.advanceTimersByTime(1_000);
    expect(source.close).not.toHaveBeenCalled();

    nextView.close();
    vi.advanceTimersByTime(1_000);
    expect(source.close).toHaveBeenCalledOnce();
  } finally {
    nextView?.close();
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  }
});

it("requests completed history separately and treats a verified empty page as a hit", async () => {
  const window = { frame: "30m", session: "regular", start: 1795012200, end: 1795014000 } as const;
  const emptyPage = { state: "ready", start: window.start, end: window.end, basisDate: "2026-11-18", bars: [] };
  const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json(emptyPage))
    .mockResolvedValueOnce(Response.json({ state: "miss" }));
  vi.stubGlobal("fetch", transport);
  const { signal } = new AbortController();
  expect(await readCompletedChartHistory("OMH", window, "generation=selected", signal)).toStrictEqual(emptyPage);
  const [url, options] = transport.mock.calls[0];
  expect(url).toBe("/api/screeners/charts/bars?archive=1&symbol=OMH&frame=30m&session=regular&start=1795012200&end=1795014000&generation=selected");
  expect(options?.credentials).toBe("same-origin");
  expect(await readCompletedChartHistory("OMH", window, "generation=selected", signal)).toBeNull();
});
