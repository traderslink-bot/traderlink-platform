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


it("refreshes before expiry and timestamps a delayed adjusted reference when published", async () => {
  let finish!:(value:unknown)=>void;
  const get=vi.fn().mockResolvedValueOnce({bars:{AAA:[bar(2)]}}).mockImplementationOnce(()=>new Promise(resolve=>{finish=resolve;}));
  const book=new AlpacaPreviousCloseBook({get});await book.read(["AAA"],date);
  vi.setSystemTime(now+PREVIOUS_CLOSE_TTL_MS-59_000);
  const pending=book.read(["AAA"],date);
  expect(get).toHaveBeenCalledTimes(2);expect(book.peek("AAA",date)?.price).toBe(2);
  vi.setSystemTime(now+PREVIOUS_CLOSE_TTL_MS+1);
  expect(book.peek("AAA",date)).toBeNull();
  finish({bars:{AAA:[bar(2.1)]}});const refreshed=await pending;
  expect(refreshed.AAA).toMatchObject({price:2.1,fetchedAt:Date.now(),basisDate:date,adjustment:"split"});
});

it("keeps an unexpired adjusted close during a failed proactive refresh and retries without a gap",async()=>{
  const get=vi.fn().mockResolvedValueOnce({bars:{AAA:[bar(2)]}}).mockRejectedValueOnce(Error("provider_unavailable")).mockResolvedValue({bars:{AAA:[bar(2.1)]}});
  const book=new AlpacaPreviousCloseBook({get});await book.read(["AAA"],date);
  vi.setSystemTime(now+PREVIOUS_CLOSE_TTL_MS-59_000);
  expect((await book.read(["AAA"],date)).AAA?.price).toBe(2);
  expect(book.peek("AAA",date)?.fetchedAt).toBe(now);
  await book.read(["AAA"],date);expect(get).toHaveBeenCalledTimes(2);
  vi.setSystemTime(Date.now()+10_001);
  expect((await book.read(["AAA"],date)).AAA?.price).toBe(2.1);expect(get).toHaveBeenCalledTimes(3);
});

it("coalesces overlapping symbol batches and retries a shared failure without racing overwrites", async () => {
  let rejectFirst!: (error: Error) => void;
  const first = new Promise<unknown>((_resolve, reject) => { rejectFirst = reject; });
  const get = vi.fn().mockReturnValueOnce(first).mockResolvedValueOnce({ bars: { AAA: [bar(2.1)] } });
  const book = new AlpacaPreviousCloseBook({ get });
  const overlapping = book.read(["AAA", "BBB"], date);
  const single = book.read(["AAA"], date);
  expect(get).toHaveBeenCalledTimes(1);
  rejectFirst(Error("provider timeout"));
  expect((await overlapping).AAA).toBeNull(); expect((await single).AAA).toBeNull();
  vi.setSystemTime(now + 10_001);
  expect((await book.read(["AAA"], date)).AAA?.price).toBe(2.1);
});

it("batches identical archive gaps across the roster without fetching already covered dates", async () => {
  const tickers = Array.from({ length: 160 }, (_, index) => `S${String(index).padStart(3, "0")}`);
  const closeTime = Date.parse("2026-11-06T05:00:00Z") / 1_000;
  const olderEnd = Date.parse("2026-11-04T05:00:00Z") / 1_000;
  const savedBar = { time: closeTime, close: 3, open: 3, low: 3, high: 3, volume: 100 };
  const archive = {
    read: vi.fn((symbol: string, start: number) => symbol === "SPY" ? { bars: [savedBar], missing: null } :
      Number(symbol.slice(1)) % 2 === 0 ? { bars: [savedBar], missing: { start, end: olderEnd } } : null),
    remember: vi.fn(),
  };
  const get = vi.fn(async (_path: string, query: URLSearchParams) => {
    const end = Date.parse(query.get("end")!);
    const symbols = query.get("symbols")!.split(",");
    const older = end < closeTime * 1_000;
    return { bars: Object.fromEntries(symbols.map(symbol => [symbol, older ? [bar(2, "2026-11-03T05:00:00Z")] : [bar(4)]])) };
  });
  const book = new AlpacaPreviousCloseBook({ get }, { forYear: async () => ({ available: false }) }, archive);
  const pending = Promise.all([book.read(tickers, date), book.read(["S000", "S159"], date)]);
  expect(archive.read).toHaveBeenCalledTimes(128);
  await vi.advanceTimersByTimeAsync(0);
  const [result, overlap] = await pending;
  expect(get).toHaveBeenCalledTimes(4);
  expect(get.mock.calls.map(([, query]) => query.get("symbols")!.split(",").length)).toEqual([50, 30, 50, 30]);
  expect(get.mock.calls[0][1].get("end")).toBe(new Date(olderEnd * 1_000 - 1).toISOString());
  expect(result.S000?.price).toBe(3);
  expect(result.S159?.price).toBe(4);
  expect(overlap.S000).toEqual(result.S000);
  expect(overlap.S159).toEqual(result.S159);
  expect(archive.remember).toHaveBeenCalledTimes(4);
});

it("uses verified quiet days for weekly trends and volume without admitting a gap", async () => {
  const sessions = Array.from({ length: 35 }, (_, index) => new Date(Date.parse("2026-10-05T12:00:00Z") + index * 86_400_000))
    .filter(day => day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
    .map(day => ({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" }));
  const calendar = { available: true as const, start: "2026-10-05", end: "2026-11-09", sessions };
  const closes = sessions.map(({ date: day }, index) => {
    const offset = day < "2026-11-01" ? "04" : "05";
    const time = Date.parse(day + "T" + offset + ":00:00Z") / 1_000;
    return { time, close: index + 10, high: index + 10, low: index + 10, open: index + 10, volume: 100 };
  });
  const friday = closes.at(-1)!;
  const monday = Date.parse("2026-11-09T05:00:00Z") / 1_000;
  const archive = {
    read: (symbol: string) => ({ bars: symbol === "SPY" ? closes : closes.slice(0, -1),
      missing: symbol === "UNCOVERED" ? { start: friday.time, end: monday } : null }),
    remember: vi.fn(),
  };
  const get = vi.fn(async () => ({ bars: {} }));
  const book = new AlpacaPreviousCloseBook({ get }, { forYear: async () => calendar }, archive);
  const { QUIET, UNCOVERED } = await book.read(["QUIET", "UNCOVERED"], date);
  const priorFriday = closes.find(bar => bar.time === Date.parse("2026-10-30T04:00:00Z") / 1_000)!;
  const thursday = closes.at(-2)!;
  const weekly = ((thursday.close - priorFriday.close) * 100) / priorFriday.close;
  expect(QUIET?.price).toBe(thursday.close);
  expect(QUIET?.barAt).toBe(thursday.time * 1_000);
  expect(QUIET?.statistics?.weekly).toEqual({ from: "2026-10-30", through: "2026-11-06", percent: weekly });
  expect(QUIET?.statistics?.weeklyRelativeToSpy).toBeCloseTo((thursday.close - friday.close) / priorFriday.close * 100);
  expect(QUIET?.statistics?.weeklyCloseVsSma4).toBeGreaterThan(0);
  expect(QUIET?.statistics?.recentHighs?.previousWeek).toBe(thursday.high);
  expect(QUIET?.statistics?.averageVolume20).toBe(95);
  expect(QUIET?.statistics?.daily).toBeUndefined();
  expect(QUIET?.statistics?.averageDailyRange20).toBeUndefined();
  expect(UNCOVERED?.statistics?.weekly).toBeUndefined();
  expect(UNCOVERED?.statistics?.averageVolume20).toBeUndefined();
  expect(UNCOVERED?.statistics?.recentHighs?.previousWeek).toBeUndefined();
  expect(get).toHaveBeenCalledTimes(1);
});

it("computes covered daily and weekly returns and benchmarks only aligned completed dates", async () => {
  const { scannerDailyStatistics, relativeToScannerBenchmark } = await import("./scanner-daily-statistics");
  const sessions = Array.from({length:35},(_,i)=>new Date(Date.parse("2026-10-12T12:00:00Z")+i*86_400_000))
    .filter(day=>day.getUTCDay() >= 1 && day.getUTCDay() <= 5)
    .map(day=>({date:day.toISOString().slice(0,10),open:"09:30",close:day.getUTCDate() === 13 ? "13:00" : "16:00"}));
  const calendar = { available:true as const, start:"2026-10-01",end:"2026-12-01",sessions };
  const candles = new Map(sessions.map((day,index)=>[day.date,{
    time:Date.parse(day.date+"T12:00:00Z")/1000,close:100+index,
    open:100+index,high:101+index,low:99+index,volume:500+index,
  }]));
  const stats = scannerDailyStatistics("2026-11-16",candles,[calendar]);
  expect(stats).toMatchObject({
    daily:{from:"2026-11-12",through:"2026-11-13"},
    dailyClosedAt: Date.parse("2026-11-13T18:00:00Z"),
    weeklyClosedAt: Date.parse("2026-11-13T18:00:00Z"),
    weekly:{from:"2026-11-06",through:"2026-11-13"}, averageVolume20:514.5,
    dailyCloseVsSma20: expect.closeTo((124 / 114.5 - 1) * 100),
    weeklyCloseVsSma4: expect.closeTo((124 / 116.5 - 1) * 100),
    recentHighs: { lastFiveSessions: 125, lastSevenDays: 125, previousWeek: 125 },
  });
  expect(relativeToScannerBenchmark(stats?.daily,{from:"2026-11-12",through:"2026-11-13",percent:0})).toBe(stats?.daily?.percent);
  expect(relativeToScannerBenchmark(stats?.daily,stats?.weekly)).toBeUndefined();
  candles.delete("2026-11-12");
  expect(scannerDailyStatistics("2026-11-16",candles,[calendar])).toEqual({
    daily:undefined,weekly:undefined,averageVolume20:undefined,averageDailyRange20:undefined,
  });
});

it("qualifies the prior five sessions, seven dates and completed week independently", async () => {
  const { scannerDailyStatistics } = await import("./scanner-daily-statistics");
  const date = "2026-11-16";
  const days = ["2026-11-06", "2026-11-09", "2026-11-10", "2026-11-12", "2026-11-13", date];
  const calendar = { available: true as const, start: "2026-10-01", end: date,
    sessions: days.map(day => ({ date: day, open: "09:30", close: "16:00" })) };
  const prices = [16, 12, 10, 11, 9, 50];
  const bars = new Map(days.map((day, index) => [day, { time: Date.parse(day) / 1000,
    open: prices[index], high: prices[index], low: prices[index], close: prices[index], volume: 50 }]));
  expect(scannerDailyStatistics(date, bars, [calendar])?.recentHighs).toEqual({
    lastFiveSessions: 16, lastSevenDays: 12, previousWeek: 12,
  });
  bars.delete("2026-11-06");
  expect(scannerDailyStatistics(date, bars, [calendar])?.recentHighs).toEqual({
    lastFiveSessions: undefined, lastSevenDays: 12, previousWeek: 12,
  });
});
