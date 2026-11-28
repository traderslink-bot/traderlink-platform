// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { runLiveScreenerSession } from "./live-market-worker";

vi.mock("node:timers/promises", () => ({
  setTimeout(ms: number, _: undefined, { signal }: { signal: AbortSignal }) {
    return new Promise<void>((resolve, reject) => {
      const abort = () => { clearTimeout(timer); reject(signal.reason); };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, ms);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
  },
}));

const start = Date.parse("2026-11-16T14:30:00Z");
const minute = 60_000;
const basisDate = "2026-11-16";
const sockets: Upstream[] = [];
class Upstream extends EventTarget {
  static CLOSING = 2;
  readyState = 1;
  send = vi.fn();
  constructor() {
    super();
    sockets.push(this);
  }
  frame(...rows: unknown[]) {
    this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(rows) }));
  }
  close() {
    this.readyState = 3;
    this.dispatchEvent(new Event("close"));
  }
}
function subscribe(socket: Upstream) {
  socket.dispatchEvent(new Event("open"));
  socket.frame({ T: "success", msg: "authenticated" }, { T: "subscription", trades: ["AAA"] });
}
function trade(t: string, p: number, s: number) {
  return { T: "t", S: "AAA", t, p, s, c: ["@"], z: "C" };
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  sockets.length = 0;
});

describe("live Screeners worker", () => {
  it("streams price during warm-up and reseeds a new boundary after a connection closes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(start + 1000);
    vi.stubGlobal("WebSocket", Upstream);
    const fetch = vi.fn(async (url: URL) => {
      if (url.pathname === "/trade-revisions") return Response.json({ feed: "sip", symbols: {} });
      const cutoff = Number(url.searchParams.get("end"));
      expect(url.pathname).toBe("/screener-candle-bars");
      expect(url.searchParams.get("start")).toBe(String(start));
      return Response.json({ feed:"sip", adjustment:"split", frame:"1m", basisDate, end:cutoff,
        coverage:{ AAA:{status:"complete",completedThroughMs:cutoff} },
        bars:{ AAA:[{time:start/1000,volume:100,vwap:10}] },
      });
    });
    vi.stubGlobal("fetch", fetch);
    const abort = new AbortController();
    const publish = vi.fn(() => true);
    const onState = vi.fn();
    const run = runLiveScreenerSession({ symbols:["AAA"], start, end:start+10*minute, signal:abort.signal,
      credentials:{keyId:"test",secretKey:"test"},
      environment:{NODE_ENV:"test",TRADERLINK_ALPACA_GATEWAY_URL:"http://127.0.0.1:12345",TRADERLINK_ALPACA_GATEWAY_TOKEN:"test"},
      publish, onState,
    });
    try {
      subscribe(sockets[0]!);
      sockets[0]!.frame(trade("2026-11-16T14:30:01.123456789Z",20,10), trade("2026-11-16T14:30:01.123Z",9,10));
      await vi.advanceTimersByTimeAsync(125);
      expect(publish).toHaveBeenLastCalledWith([{symbol:"AAA",price:20,priceAt:start+1123,vwap:null}]);
      await vi.advanceTimersByTimeAsync(minute+3_000);
      expect(fetch.mock.calls.filter(([url]) => url.pathname === "/screener-candle-bars")).toHaveLength(1);
      expect(onState).toHaveBeenLastCalledWith("connected",1);
      expect(publish).toHaveBeenLastCalledWith([{symbol:"AAA",price:20,priceAt:start+1123,vwap:10,vwapAt:start+minute}]);
      sockets[0]!.close();
      await vi.advanceTimersByTimeAsync(600);
      expect(sockets).toHaveLength(2);
      subscribe(sockets[1]!);
      expect(onState.mock.calls.map(([state])=>state)).toEqual(["warming","connected","disconnected","warming"]);
      await vi.advanceTimersByTimeAsync(minute+3_000);
      expect(fetch.mock.calls.filter(([url]) => url.pathname === "/screener-candle-bars").map(([url]) => Number(url.searchParams.get("end")))).toEqual([start+minute,start+2*minute]);
      sockets[1]!.frame(trade("2026-11-16T14:32:00.000Z",14,100));
      await vi.advanceTimersByTimeAsync(125);
      expect(publish).toHaveBeenLastCalledWith([{symbol:"AAA",price:14,priceAt:start+2*minute,vwap:12,vwapAt:start+2*minute}]);
      sockets[1]!.frame({ ...trade("2026-11-16T14:32:03.000Z", 18, 100), c:["I"] });
      await vi.advanceTimersByTimeAsync(125);
      expect(publish).toHaveBeenLastCalledWith([{symbol:"AAA",price:14,priceAt:start+2*minute,vwap:14,vwapAt:start+2*minute+3_000}]);
      sockets[1]!.frame({ T: "x", S: "AAA" });
      await vi.advanceTimersByTimeAsync(125);
      expect(publish).toHaveBeenLastCalledWith([{symbol:"AAA",price:null,priceAt:null,vwap:null}]);
    } finally {
      abort.abort();
      await run;
    }
  });
});
