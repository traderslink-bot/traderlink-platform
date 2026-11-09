// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AlpacaPreviousCloseBook, PREVIOUS_CLOSE_TTL_MS, usablePreviousClose } from "./previous-close";

const now = Date.parse("2026-11-09T15:00:00Z"), date = "2026-11-09";
const bar = (close: number, t = "2026-11-06T05:00:00Z") => ({ t, o: close, h: close, l: close, c: close, v: 100 });
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(now); });
afterEach(() => vi.useRealTimers());

it("batches provider-adjusted closes, keeps fractional reverse/forward adjustments and never multiplies again", async () => {
  const get = vi.fn(async () => ({ bars: { ADGM: [bar(1.947)], SMX: [bar(4.928)], FORWARD: [bar(100)], NORMAL: [bar(5)] }, next_page_token: null }));
  const book = new AlpacaPreviousCloseBook({ get });
  const result = await book.read(["SMX", "ADGM", "FORWARD", "NORMAL"], date);
  expect(result.SMX).toMatchObject({ symbol: "SMX", price: 4.928, adjustment: "split", basisDate: date, fetchedAt: now });
  expect(result.ADGM?.price).toBe(1.947); expect(result.FORWARD?.price).toBe(100);
  expect(result.NORMAL?.price).toBe(5);
  const [path, query] = get.mock.calls[0] as unknown as [string, URLSearchParams];
  expect(path).toBe("/v2/stocks/bars"); expect(query.get("adjustment")).toBe("split");
  expect(query.get("feed")).toBe("sip"); expect(query.get("timeframe")).toBe("1Day");
  await book.read(["NORMAL", "SMX", "ADGM", "FORWARD"], date); expect(get).toHaveBeenCalledTimes(1);
});

it("finishes all pages before publishing and picks the latest actual prior bar", async () => {
  const get = vi.fn().mockResolvedValueOnce({ bars: { AAA: [bar(2, "2026-11-05T05:00:00Z")] }, next_page_token: "next" })
    .mockResolvedValueOnce({ bars: { AAA: [bar(3)] }, next_page_token: null });
  const book = new AlpacaPreviousCloseBook({ get });
  expect((await book.read(["AAA"], date)).AAA?.price).toBe(3);
  expect(get.mock.calls[1][1].get("page_token")).toBe("next");
});

it("withholds partial, conflicting and invalid history without a raw-price fallback", async () => {
  for (const payload of [
    { bars: { AAA: [bar(2)] }, next_page_token: "repeated" },
    { bars: { AAA: [bar(2), bar(3)] } },
    { bars: { AAA: [{ ...bar(2), h: 1 }] } },
    { bars: { AAA: "invalid" } },
  ]) {
    const get = vi.fn(async () => payload), book = new AlpacaPreviousCloseBook({ get });
    expect((await book.read(["AAA"], date)).AAA).toBeNull();
    expect(book.peek("AAA", date)).toBeNull();
  }
});

it("coalesces concurrent batches, retries unavailable history and rejects stale references", async () => {
  const get = vi.fn().mockRejectedValueOnce(Error("offline")).mockResolvedValue({ bars: { AAA: [bar(2)] } });
  const book = new AlpacaPreviousCloseBook({ get });
  expect((await book.read(["AAA"], date)).AAA).toBeNull();
  await book.read(["AAA"], date); expect(get).toHaveBeenCalledTimes(1);
  vi.setSystemTime(now + 10_001);
  const [a, b] = await Promise.all([book.read(["AAA"], date), book.read(["AAA"], date)]);
  expect(a.AAA?.price).toBe(2); expect(b.AAA?.price).toBe(2); expect(get).toHaveBeenCalledTimes(2);
  expect(book.peek("AAA", date, now + 10_001 + PREVIOUS_CLOSE_TTL_MS)).toBeNull();
});

it("isolates the adjustment basis date across an Eastern day rollover", async () => {
  const get = vi.fn().mockResolvedValueOnce({ bars: { AAA: [bar(2)] } })
    .mockResolvedValueOnce({ bars: { AAA: [bar(20, "2026-11-09T05:00:00Z")] } });
  const book = new AlpacaPreviousCloseBook({ get });
  const previous = (await book.read(["AAA"], date)).AAA!;
  vi.setSystemTime(Date.parse("2026-11-10T15:00:00Z"));
  expect(book.peek("AAA", "2026-11-10")).toBeNull();
  expect((await book.read(["AAA"], "2026-11-10")).AAA?.price).toBe(20);
  expect(usablePreviousClose(previous, "AAA", "2026-11-10", Date.now())).toBe(false);
});

it("enforces symbol/date/freshness identity and does not accept today's bar as yesterday's close", async () => {
  const get = vi.fn(async () => ({ bars: { AAA: [bar(2, "2026-11-09T05:00:00Z")] } }));
  const book = new AlpacaPreviousCloseBook({ get });
  expect((await book.read(["AAA"], date)).AAA).toBeNull();
  await expect(book.read(["AAA"], "2026-11-10")).rejects.toThrow("invalid_previous_close_date");
  const reference = { symbol: "AAA", price: 2, barAt: Date.parse("2026-11-06T05:00:00Z"), adjustment: "split", basisDate: date, fetchedAt: now };
  expect(usablePreviousClose(reference, "BBB", date, now)).toBe(false);
  expect(usablePreviousClose({ ...reference, adjustment: "raw" }, "AAA", date, now)).toBe(false);
  expect(usablePreviousClose({ ...reference, fetchedAt: now + 6_000 }, "AAA", date, now)).toBe(false);
});

 it("isolates corrupt symbol history without suppressing valid split-adjusted neighbours", async () => {
  const get = vi.fn(async () => ({ bars: { ADGM: [bar(1.947)], ARAY: [bar(4.4)], BAD: [{ ...bar(2), h: 1 }], CONFLICT: [bar(2), bar(3)] } }));
  const book = new AlpacaPreviousCloseBook({ get });
  const result = await book.read(["ADGM", "ARAY", "BAD", "CONFLICT"], date);
  expect(result.ADGM?.price).toBe(1.947);
  expect(result.ARAY?.price).toBe(4.4);
  expect(result.BAD).toBeNull();
  expect(result.CONFLICT).toBeNull();
});
