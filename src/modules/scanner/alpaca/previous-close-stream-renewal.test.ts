// @vitest-environment node
import { EventEmitter } from "node:events";
import type { ServerResponse } from "node:http";
import { afterEach, expect, it, vi } from "vitest";
import { AlpacaPreviousCloseBook, usablePreviousClose } from "./previous-close";
import { ScannerStreamHub } from "./scanner-stream-hub";

const date = "2026-11-09", initial = Date.parse("2026-11-09T15:00:00Z");
afterEach(() => vi.useRealTimers());
it("renews 1790 transmitted references across two TTL cycles with slow failed cohorts and overlapping five-second reads", async () => {
  vi.useFakeTimers(); vi.setSystemTime(initial);
  const symbols = Array.from({ length: 1790 }, (_, i) => `S${String(i).padStart(4, "0")}`);
  const attempts = new Map<string, number>(); let active = 0, peak = 0, calls = 0;
  const rest = { get: vi.fn(async (_path: string, query: URLSearchParams) => {
    const wanted = query.get("symbols")!.split(",");
    expect(wanted.length).toBeLessThanOrEqual(50);
    const key = wanted.join(","), attempt = (attempts.get(key) ?? 0) + 1;
    attempts.set(key, attempt); calls++; active++; peak = Math.max(peak, active);
    const fail = attempt === 2 && (wanted.includes("S0000") || wanted.includes("S1000"));
    await new Promise(resolve => setTimeout(resolve, fail ? 20_000 : 3_000));
    active--;
    if (fail) throw Error("provider_unavailable");
    return { bars: Object.fromEntries(wanted.map(symbol => [symbol, [{ t: "2026-11-06T05:00:00Z", o: 2, h: 2, l: 2, c: 2, v: 100 }]])) };
  }) };
  const book = new AlpacaPreviousCloseBook(rest);
  const delivered = new Map<string, unknown>();
  const hub: ScannerStreamHub = new ScannerStreamHub(wanted => ({ feed: "sip", connected: true,
    snapshots: Object.fromEntries(wanted.map(symbol => [symbol, { adjustedPreviousClose: book.peek(symbol, date) }])), sessionTotals: {},
  }), wanted => { void book.read(wanted, date).then(() => hub.refresh()); });
  const response = Object.assign(new EventEmitter(), { writeHead: () => {}, end: () => {}, destroy: () => {}, destroyed: false, writableLength: 0,
    write: (text: string) => {
      const line = text.split("\n").find(value => value.startsWith("data: "));
      if (line) for (const [symbol, value] of Object.entries(JSON.parse(line.slice(6)).snapshots)) delivered.set(symbol, (value as { adjustedPreviousClose: unknown }).adjustedPreviousClose);
    },
  });
  try {
    hub.add(symbols, 960, response as unknown as ServerResponse);
    await vi.advanceTimersByTimeAsync(40_000);
    for (let elapsed = 40; elapsed <= 760; elapsed += 5) {
      expect(symbols.filter(symbol => usablePreviousClose(delivered.get(symbol), symbol, date, Date.now()))).toHaveLength(1790);
      await vi.advanceTimersByTimeAsync(5_000);
    }
    expect(peak).toBeLessThanOrEqual(4);
    expect(attempts.get(symbols.slice(0, 50).join(","))).toBeGreaterThanOrEqual(4);
    expect(calls).toBeLessThan(200);
  } finally { hub.close(); }
}, 30_000);
