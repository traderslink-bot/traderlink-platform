import { expect, it, vi } from "vitest";
import { WorkspaceMoomooCandleCache } from "./server/workspace-moomoo-candle-cache";

const minute = 60_000;
const query = { symbol: "SPLT", timeframe: "1Min", adjustment: "raw", basisDate: "2026-11-27" } as const;
const time = (n: number) => n * minute;
const until = (start: number, end: number) => ({ start: time(start), end: time(end) - 1 });
const settled = () => time(300);
const allowed = () => true;
const never = new AbortController().signal;
const complete = <T>(bars: T[]) => ({ bars, complete: true });

it("fetches only missing portions of concurrent overlapping requests and retains sparse coverage", async () => {
  const cache = new WorkspaceMoomooCandleCache();
  const load = vi.fn(async ({ start }: { start: number }) => complete(start === time(12)
    ? [] : [{ time: start / 1000, open: 1, high: 1, low: 1, close: 1, volume: 100 }]));
  const read = (start: number, end: number) => cache.read({ ...query, ...until(start, end) }, never, allowed, load, settled);
  const [first, next, duplicate] = await Promise.all([read(10, 12), read(11, 14), read(11, 14)]);
  expect(load.mock.calls.map(([range]) => range)).toEqual([until(10, 12), until(12, 14)]);
  expect(first.bars.map(bar => bar.time)).toEqual([time(10) / 1000]);
  expect(next).toEqual(complete([]));
  expect(duplicate).toEqual(complete([]));
  await read(9, 15);
  expect(load.mock.calls.slice(-2).map(([range]) => range)).toEqual([until(9, 10), until(14, 15)]);
});

it("does not retain a provisional tail, revoked completion, or failed request", async () => {
  const cache = new WorkspaceMoomooCandleCache();
  const load = vi.fn(async () => complete([]));
  const read = () => cache.read({ ...query, ...until(295, 300) }, never, allowed, load, settled);
  await read();
  await read();
  expect(load.mock.calls).toEqual([[until(295, 300)], [until(298, 300)]]);
  const request = { ...query, ...until(10, 12) };
  const aborted = new AbortController();
  const interrupted = vi.fn(async () => { aborted.abort(); return complete([]); });
  await expect(cache.read(request, aborted.signal, allowed, interrupted, settled)).rejects.toMatchObject({ name: "AbortError" });
  let granted = true;
  const revoked = vi.fn(async () => { granted = false; return complete([]); });
  await expect(cache.read(request, never, () => granted, revoked, settled)).rejects.toThrow("broker_connection_changed");
  await expect(cache.read(request, never, allowed, async () => { throw Error("provider"); }, settled)).rejects.toThrow("provider");
  await cache.read(request, never, allowed, load, settled);
  expect(load).toHaveBeenLastCalledWith(until(10, 12));
});

it("aborts a queued request promptly and leaves its peer's provider call intact", async () => {
  const cache = new WorkspaceMoomooCandleCache();
  const request = { ...query, ...until(11, 14) };
  const controller = new AbortController();
  let release!: () => void;
  let entered!: () => void;
  const started = new Promise<void>(resolve => { entered = resolve; });
  const load = vi.fn(() => new Promise<ReturnType<typeof complete<never>>>(resolve => { release = () => resolve(complete([])); entered(); }));
  const first = cache.read(request, never, allowed, load, settled);
  await started;
  const waiting = cache.read(request, controller.signal, allowed, load, settled);
  controller.abort();
  await expect(waiting).rejects.toMatchObject({ name: "AbortError" });
  expect(load).toHaveBeenCalledOnce();
  release();
  await expect(first).resolves.toEqual(complete([]));
  await expect(cache.read(request, never, allowed, load, settled)).resolves.toEqual(complete([]));
  expect(load).toHaveBeenCalledOnce();
});

it("refetches the current Eastern daily candle while reusing prior days", async () => {
  const cache = new WorkspaceMoomooCandleCache();
  const today = Date.parse("2026-11-27T05:00:00Z");
  const now = () => today + 12 * 60 * minute;
  const range = { start: today - 24 * 60 * minute, end: now() };
  const load = vi.fn(async () => complete([]));
  const read = () => cache.read({ ...query, timeframe: "1Day", ...range }, never, allowed, load, now);
  await read();
  await read();
  expect(load.mock.calls).toEqual([[range], [{ start: today, end: range.end }]]);
});
