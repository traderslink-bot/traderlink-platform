// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { easternDayStart } from "../../scanner/alpaca/candles";
import { ChartSessionCalendar } from "../../scanner/alpaca/chart-calendar";
import { AlpacaRestData, type AlpacaHistoryRequest } from "../../scanner/alpaca/rest-data";
import { AlpacaCandleArchive } from "./alpaca-archive";
import { AlpacaPreviousCloseBook } from "../../scanner/alpaca/previous-close";
import { candleHistoryTargets, fillCandleHistoryWindow, nextCandleHistoryGap, type BackfillWindowDays } from "./backfill";
import { eligibleHistorySymbols, initialCandleHistorySettings, popularBackgroundSymbols } from "./settings";
import { CandleSplitEventStore } from "./split-event-store";
import { CandleHistoryStore } from "./store";

it("rejects a roster refresh that was prepared before a new market-cap setting", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candle-roster-revision-"));
  const archive = new AlpacaCandleArchive(join(directory, "archive.sqlite"),
    { history: vi.fn() }, { forYear: vi.fn() }, vi.fn());
  try {
    const settings = { ...initialCandleHistorySettings(), popularTickers: [] };
    const oldRoster = [{ symbol: "SMALL", marketCap: 400_000_000 }];
    const wideRoster = [...oldRoster, { symbol: "LARGER", marketCap: 600_000_000 }];
    const old = archive.changeSettings(settings, oldRoster);
    const next = archive.changeSettings({ ...old.settings, marketCapCeiling: 650_000_000 }, wideRoster);
    expect(next.backfill.total).toBe(2);
    expect(() => archive.setUniverse(oldRoster, old.settings.revision)).toThrow("candle_history_settings_conflict");
    expect(archive.state().backfill.total).toBe(2);
    archive.setUniverse(oldRoster, next.settings.revision);
    expect(archive.state().backfill.total).toBe(1);
  } finally {
    archive.close();
    await Promise.resolve();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("fills older history in wider windows with the same coverage and candles", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candles-wide-window-"));
  const date = "2026-11-23";
  const now = Date.parse(`${date}T12:00:00Z`);
  const basis = "b".repeat(64);
  const settings = initialCandleHistorySettings();
  for (const frame of Object.keys(settings.retention) as (keyof typeof settings.retention)[]) {
    settings.retention[frame] = { amount: 180, unit: "days" };
  }
  settings.retention["1m"] = { amount: 10, unit: "days" };
  settings.retention["5m"] = { amount: 30, unit: "days" };
  const dates = ["2026-06-05", "2026-08-12", "2026-10-20", "2026-11-20"];
  const calendar = new ChartSessionCalendar();
  calendar.merge({ available: true, start: "2026-05-20", end: date, sessions: dates.map(date => ({
    date, open: "09:30", close: "16:00",
  })) });
  const bars = dates.map((date, index) => ({
    time: easternDayStart(Date.parse(`${date}T12:00:00Z`) / 1_000),
    open: 1, high: 2, low: 1, close: 2, volume: 10 + index,
  }));
  const symbol = "TEST";
  const targets = candleHistoryTargets({ symbol, basis, date, calendar, settings });
  const run = async (olderWindowDays: BackfillWindowDays) => {
    const path = join(directory, `${olderWindowDays}.sqlite`);
    let store = new CandleHistoryStore(path);
    const read = vi.fn(async ({ timeframe, start, end }: AlpacaHistoryRequest) => ({
      symbol, basisDate: date, feed: "sip" as const, adjustment: "split" as const, complete: true, nextPageToken: null,
      bars: bars.map(bar => timeframe === "1Day" ? bar : { ...bar, time: bar.time + 570 * 60 })
        .filter(bar => bar.time * 1_000 >= start && bar.time * 1_000 <= end),
    }));
    const windows = [];
    try {
      const first = nextCandleHistoryGap(store, targets)!;
      windows.push(first);
      await fillCandleHistoryWindow({ store, read, calendar, settings, symbol, basis, window: first, now });
      store.close();
      store = new CandleHistoryStore(path);
      for (let attempt = 0; attempt < 8; attempt++) {
        const window = nextCandleHistoryGap(store, targets, olderWindowDays);
        if (!window) break;
        expect(window.end).toBeLessThanOrEqual(first.start);
        windows.push(window);
        await fillCandleHistoryWindow({ store, read, calendar, settings, symbol, basis, window, now, olderWindowDays });
      }
      expect(nextCandleHistoryGap(store, targets, olderWindowDays)).toBeUndefined();
      return { data: targets.map(target => store.read(target)), requests: read.mock.calls.length, windows };
    } finally {
      store.close();
    }
  };
  try {
    const shortWindows = await run(30);
    const wideWindows = await run(120);
    expect(wideWindows.windows[0]).toEqual(shortWindows.windows[0]);
    expect(wideWindows.windows.length).toBeLessThan(shortWindows.windows.length);
    expect(wideWindows.requests).toBeLessThan(shortWindows.requests);
    expect(wideWindows.data).toEqual(shortWindows.data);
    expect(wideWindows.data[0]).toHaveLength(1);
    expect(wideWindows.data.at(-1)).toHaveLength(4);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("keeps background streaming off, backfills both groups, and preserves storage and settings across restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candles-test-"));
  const path = join(directory, "shared.sqlite");
  const basis = "a".repeat(64);
  const start = easternDayStart(Date.parse("2026-11-18T12:00:00Z") / 1_000);
  const end = easternDayStart(Date.parse("2026-11-19T12:00:00Z") / 1_000);
  const now = Date.parse("2026-11-19T12:00:00Z");
  const bar = { time: start + 570 * 60, open: 1, high: 2, low: 1, close: 2, volume: 35 };
  const calendar = new ChartSessionCalendar();
  calendar.merge({ available: true, start: "2026-11-18", end: "2026-11-19", sessions: [
    { date: "2026-11-18", open: "09:30", close: "16:00" },
    { date: "2026-11-19", open: "09:30", close: "16:00" },
  ] });
  let store = new CandleHistoryStore(path);
  try {
    const settings = initialCandleHistorySettings();
    expect(settings.popularTickers).toHaveLength(175);
    expect(popularBackgroundSymbols(settings)).toEqual([]);
    settings.popularTickers = ["NVDA", "SPY"];
    settings.retention["1m"] = { amount: 1, unit: "months" };
    const universe = [{ symbol: "NVDA", marketCap: 300_000_000 }, { symbol: "ABCD", marketCap: 100_000_000 }];
    const groups = eligibleHistorySymbols(universe, settings);
    expect([...groups.combined]).toEqual(["NVDA", "ABCD", "SPY"]);
    const saved = store.changeSettings(settings, [...groups.marketCap]);
    expect(saved.revision).toBe(1);
    const read = vi.fn(async ({ symbol, timeframe }) => ({
      symbol, feed: "sip" as const, adjustment: "split" as const, basisDate: "2026-11-19",
      bars: timeframe === "1Min" ? [bar, { ...bar, time: bar.time + 60, close: 1, volume: 20 }] : [{ ...bar, time: start }],
      complete: true, nextPageToken: null,
    }));
    const input = { store, read, calendar, settings: saved, symbol: "NVDA", basis, window: { start, end }, now };
    expect(await fillCandleHistoryWindow(input)).toMatchObject({ calls: 2 });
    expect(await fillCandleHistoryWindow(input)).toMatchObject({ calls: 0 });
    expect(store.read({ symbol: "NVDA", basis, frame: "30m", session: "regular", start, end })).toEqual([
      { ...bar, close: 1, volume: 55 },
    ]);
    expect(store.read({ symbol: "NVDA", basis: "b".repeat(64), frame: "30m", session: "regular", start, end })).toBeNull();
    const stats = store.storage(groups.marketCap, groups.popular);
    expect(stats.marketCap.bars).toBeGreaterThan(0);
    expect(stats.marketCap).toEqual(stats.combined);
    expect(stats.popular).toEqual(stats.overlap);
    expect(stats.physicalBytes).toBeGreaterThan(0);
    store.close();
    store = new CandleHistoryStore(path);
    expect(store.settings()).toEqual(saved);
    expect(store.roster()).toEqual(["ABCD", "NVDA"]);
    const next = store.changeSettings({ ...saved, popularMinuteUpdates: true });
    expect(popularBackgroundSymbols(next)).toEqual(["NVDA", "SPY"]);
    expect(() => store.changeSettings(saved)).toThrow("candle_history_settings_conflict");
    store.retainFrom({ symbol: "NVDA", basis, frame: "30m", session: "regular" }, end);
    expect(store.read({ symbol: "NVDA", basis, frame: "30m", session: "regular", start, end })).toBeNull();
    expect(store.read({ symbol: "NVDA", basis, frame: "4h", session: "regular", start, end })).toHaveLength(1);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("fills a verified exchange closure without provider reads and still checks open sessions", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candles-closure-"));
  const store = new CandleHistoryStore(join(directory, "shared.sqlite"));
  const settings = initialCandleHistorySettings();
  settings.retention["1m"] = { amount: 5, unit: "days" };
  const basis = "a".repeat(64);
  const now = Date.parse("2026-11-23T08:00:00Z");
  const friday = easternDayStart(Date.parse("2026-11-20T12:00:00Z") / 1_000);
  const start = friday + 86_400;
  const end = easternDayStart(now / 1_000);
  const calendar = new ChartSessionCalendar();
  const sessions = [{ date: "2026-11-20", open: "09:30", close: "16:00" }];
  calendar.merge({ available: true, start: "2026-11-20", end: "2026-11-21", sessions });
  const read = vi.fn(async ({ symbol }: AlpacaHistoryRequest) => ({
    symbol, basisDate: "2026-11-23", feed: "sip" as const, adjustment: "split" as const,
    complete: true, nextPageToken: null, bars: [],
  }));
  const input = { store, settings, basis, now, calendar, read, symbol: "QUIET", window: { start, end } };
  const minutes = { ...input.window, symbol: input.symbol, basis, frame: "1m" as const, session: "regular" as const };
  const daily = { ...minutes, frame: "1D" as const, session: "daily" as const };
  try {
    await expect(fillCandleHistoryWindow(input)).rejects.toThrow("history_calendar_unavailable");
    expect(store.read(minutes)).toBeNull();
    calendar.merge({ available: true, start: "2026-11-20", end: "2026-11-22", sessions });
    await expect(fillCandleHistoryWindow({ ...input, canSave: () => false })).rejects.toThrow("candle_history_target_changed");
    expect(store.read(daily)).toBeNull();
    expect(await fillCandleHistoryWindow(input)).toEqual({ calls: 0, updatedSeries: 13 });
    expect(store.read(minutes)).toEqual([]);
    expect(store.read(daily)).toEqual([]);
    expect(await fillCandleHistoryWindow(input)).toEqual({ calls: 0, updatedSeries: 0 });
    expect(read).not.toHaveBeenCalled();

    expect(await fillCandleHistoryWindow({ ...input, window: { start: friday, end } })).toEqual({ calls: 2, updatedSeries: 13 });
    expect(read.mock.calls.map(([request]) => request.timeframe)).toEqual(["1Min", "1Day"]);
    expect(store.read({ ...minutes, start: friday })).toEqual([]);
  } finally {
    store.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("finishes a whole roster at the default cadence and resumes without repeating history after restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candles-restart-"));
  const path = join(directory, "shared.sqlite");
  let now = Date.parse("2026-11-23T08:00:00Z");
  const start = easternDayStart(Date.parse("2026-11-18T12:00:00Z") / 1_000);
  const store = new CandleHistoryStore(path);
  const settings = initialCandleHistorySettings();
  settings.popularTickers = ["SPY"];
  for (const frame of Object.keys(settings.retention) as (keyof typeof settings.retention)[]) {
    settings.retention[frame] = { amount: 5, unit: "days" };
  }
  store.changeSettings(settings, ["TEST"]);
  store.close();
  const history = vi.fn(async ({ symbol, timeframe, start: from, end }: AlpacaHistoryRequest) => {
    const time = timeframe === "1Min" ? start + 570 * 60 : start;
    const bars = time * 1_000 >= from && time * 1_000 <= end
      ? [{ time, open: 10, high: 10, low: 10, close: 10, volume: 5 }] : [];
    return { symbol, basisDate: "2026-11-23", feed: "sip" as const, adjustment: "split" as const,
      complete: true, nextPageToken: null, bars };
  });
  const calendar = { forYear: async () => ({ available: true as const, start: "2026-11-17", end: "2026-11-23", sessions: [
    { date: "2026-11-18", open: "09:30", close: "16:00" },
    { date: "2026-11-19", open: "09:30", close: "16:00" },
    { date: "2026-11-20", open: "09:30", close: "16:00" },
  ] }) };
  const reverseSplit = { providerEventId: "opposite-30", kind: "reverse" as const, reportedSymbol: "OLD",
    successorSymbol: "TEST", effectiveDate: "2026-11-19", processedDate: "2026-11-19", oldShares: 30, newShares: 1 };
  const split = vi.fn(async (symbol: string) => ({ symbol, basisDate: "2026-11-23",
    revision: symbol === "TEST" ? "with-split" : "no-splits", events: symbol === "TEST" ? [reverseSplit] : [] }));
  vi.useFakeTimers();
  let archive = new AlpacaCandleArchive(path, { history }, calendar, split, () => now);
  try {
    await vi.advanceTimersByTimeAsync(2_000);
    expect(archive.state().backfill).toEqual({ total: 2, complete: 2, retrying: 0 });
    expect(history.mock.calls.every(([request]) => !request.adjustment || request.adjustment === "split")).toBe(true);
    expect(split).toHaveBeenCalledTimes(2);
    const bars = archive.read({ symbol: "SPY", frame: "4h", session: "regular", start,
      end: easternDayStart(now / 1_000) });
    expect(bars).toMatchObject({ state: "ready", bars: [{ time: start + 570 * 60, volume: 5 }] });
    const originalCalls = history.mock.calls.length;
    archive.close();
    await Promise.resolve();
    archive = new AlpacaCandleArchive(path, { history }, calendar, split, () => now);
    await vi.advanceTimersByTimeAsync(1_000);
    expect(archive.state().backfill).toEqual({ total: 2, complete: 2, retrying: 0 });
    expect(history).toHaveBeenCalledTimes(originalCalls);
    expect(split).toHaveBeenCalledTimes(2);
    const events = new CandleSplitEventStore(join(directory, "split-events.sqlite"));
    try {
      expect(events.read("TEST")).toEqual({ symbol: "TEST", basisDate: "2026-11-23", revision: "with-split", events: [reverseSplit] });
      expect(events.read("SPY")?.events).toEqual([]);
      expect(events.read("UNKNOWN")).toBeNull();
      events.save({ symbol: "TEST", basisDate: "2026-11-22", revision: "late-old-snapshot", events: [] });
      expect(events.read("TEST")?.events).toEqual([reverseSplit]);
      const priceBasis = createHash("sha256").update("alpaca-sip-split-archive-v1:with-split").digest("hex");
      const qualified = { symbol: "TEST", basisDate: "2026-11-23", coverageStart: "2026-11-18",
        priceBasis, evidenceSha256: "b".repeat(64), events: [reverseSplit] };
      expect(events.readQualified("TEST", qualified.priceBasis)).toBeNull();
      expect(archive.readQualifiedSplitHistory("TEST")).toBeNull();
      events.publishQualified([qualified]);
      expect(events.readQualified("TEST", qualified.priceBasis)).toEqual(qualified);
      expect(archive.readQualifiedSplitHistory("test")).toEqual(qualified);
      expect(archive.readQualifiedSplitHistory("MISSING")).toBeNull();
      expect(events.readQualified("TEST", "c".repeat(64))).toBeNull();
      expect(() => events.publishQualified([{ ...qualified, symbol: "SPY" },
        { ...qualified, coverageStart: "2026-11-20" }])).toThrow("invalid_split_lineage_evidence");
      expect(events.readQualified("SPY", qualified.priceBasis)).toBeNull();
      events.save({ symbol: "TEST", basisDate: "2026-11-23", revision: "raw-ticker-only", events: [] });
      expect(events.readQualified("TEST", qualified.priceBasis)).toEqual(qualified);
      expect(archive.readQualifiedSplitHistory("TEST")).toEqual(qualified);
    } finally {
      events.close();
    }
    expect(archive.backgroundSymbols()).toEqual([]);
    expect(archive.read({ symbol: "SPY", frame: "4h", session: "regular", start,
      end: easternDayStart(now / 1_000) })).toEqual(bars);
    const prior = archive.readQualifiedSplitHistory("TEST")!;
    now += 86_400_000;
    expect(archive.readQualifiedSplitHistory("TEST")).toBeNull();
    const archiveStore = new CandleHistoryStore(path);
    try {
      archiveStore.updateBasis("TEST", "2026-11-24", prior.priceBasis);
      expect(archive.readQualifiedSplitHistory("TEST")).toEqual(prior);
      archiveStore.updateBasis("TEST", "2026-11-24", "c".repeat(64));
      expect(archive.readQualifiedSplitHistory("TEST")).toBeNull();
    } finally {
      archiveStore.close();
    }
  } finally {
    archive.close();
    await Promise.resolve();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it.each([{ slots: 2, interval: 2_500 }, { slots: 4, interval: 250 }] as const)(
  "fills $slots concurrent ticker windows and resumes them with the standard worker", async ({ slots, interval }) => {
  const directory = mkdtempSync(join(tmpdir(), "shared-candle-window-batch-"));
  const path = join(directory, "shared.sqlite");
  const now = Date.parse("2026-11-23T08:00:00Z");
  const store = new CandleHistoryStore(path);
  const settings = initialCandleHistorySettings();
  const otherSymbols = slots === 2 ? ["SPY"] : ["SPY", "XLF", "QQQ"];
  settings.popularTickers = otherSymbols;
  for (const frame of Object.keys(settings.retention) as (keyof typeof settings.retention)[]) {
    settings.retention[frame] = { amount: 5, unit: "days" };
  }
  store.changeSettings(settings, ["TEST"]);
  store.close();

  const start = easternDayStart(Date.parse("2026-11-19T12:00:00Z") / 1_000);
  let release = () => {};
  const firstRead = new Promise<void>(resolve => { release = resolve; });
  const transport = vi.fn<typeof fetch>(async input => {
    const params = new URL(String(input)).searchParams;
    const symbol = params.get("symbols")!;
    if (symbol === "TEST") await firstRead;
    const time = (start + (params.get("timeframe") === "1Min" ? 570 * 60 : 0)) * 1_000;
    const bars = time >= Date.parse(params.get("start")!) && time <= Date.parse(params.get("end")!)
      ? [{ t: new Date(time).toISOString(), o: 10, h: 11, l: 9, c: 11, v: 90 }] : [];
    return Response.json({ bars: { [symbol]: bars }, next_page_token: null });
  });
  const calendar = { forYear: vi.fn(async (year: number) => ({
    available: true as const, start: year + "-01-01", end: year + "-12-31",
    sessions: year === 2026 ? ["18", "19", "20"].map(day =>
      ({ date: "2026-11-" + day, open: "09:30", close: "16:00" })) : [],
  })) };
  const split = vi.fn(async () => "retained");
  const provider = new AlpacaRestData({ keyId: "fixture", secretKey: "fixture" }, transport, "sip", slots);
  vi.useFakeTimers();
  vi.setSystemTime(now);
  let archive = new AlpacaCandleArchive(path, provider, calendar, split, Date.now, slots, 120, interval);
  try {
    const readSymbols = () => transport.mock.calls.map(([input]) => new URL(String(input)).searchParams.get("symbols"));
    await vi.advanceTimersByTimeAsync(interval - 1);
    expect(readSymbols()).toEqual([]);
    await vi.advanceTimersByTimeAsync(1);
    expect([...new Set(readSymbols())]).toEqual(["TEST", ...otherSymbols]);
    expect(calendar.forYear.mock.calls).toEqual([[2026], [2025]]);
    await vi.advanceTimersByTimeAsync(interval * 5);
    expect(readSymbols().filter(symbol => symbol === "TEST")).toEqual(["TEST"]);
    expect(archive.state().backfill).toEqual({ total: slots, complete: slots - 1, retrying: 0 });
    release();
    await vi.advanceTimersByTimeAsync(interval * 6);
    expect(archive.state().backfill).toEqual({ total: slots, complete: slots, retrying: 0 });
    const key = { frame: "4h" as const, session: "regular" as const, start, end: easternDayStart(now / 1_000) };
    for (const symbol of ["TEST", ...otherSymbols]) {
      expect(archive.read({ ...key, symbol })).toMatchObject({ state: "ready", bars: [
        { time: start + 570 * 60, open: 10, high: 11, low: 9, close: 11, volume: 90 },
      ] });
    }
    const requestCount = transport.mock.calls.length;
    archive.close();
    await Promise.resolve();
    archive = new AlpacaCandleArchive(path, provider, calendar, split);
    await vi.advanceTimersByTimeAsync(15_000);
    expect(archive.state().backfill).toEqual({ total: slots, complete: slots, retrying: 0 });
    expect(transport).toHaveBeenCalledTimes(requestCount);
    expect(split).toHaveBeenCalledTimes(slots);
  } finally {
    release();
    archive.close();
    await Promise.resolve();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("reuses verified Daily history for Scanner, stores only the fetched tail, and survives a restart", async () => {
  const directory = mkdtempSync(join(tmpdir(), "scanner-daily-reuse-"));
  const path = join(directory, "shared.sqlite");
  const date = "2026-11-09";
  const now = Date.parse(date + "T15:00:00Z");
  const start = Date.parse("2026-10-05T04:00:00Z") / 1_000;
  const last = Date.parse("2026-11-06T05:00:00Z") / 1_000;
  const end = Date.parse(date + "T05:00:00Z") / 1_000;
  const oldBar = { time: last - 86_400, open: 1, high: 2, low: 1, close: 2, volume: 35 };
  const newBar = { ...oldBar, time: last, close: 1.5 };
  const key = { symbol: "TEST", frame: "1D" as const, session: "daily" as const, start, end };
  const basis = "a".repeat(64);
  const store = new CandleHistoryStore(path);
  store.changeSettings(initialCandleHistorySettings(), ["TEST", "COLD"]);
  store.updateBasis("TEST", date, basis);
  store.updateBasis("SPY", date, basis);
  store.saveVerified([{ ...key, basis, end: last, bars: [oldBar] },
    { ...key, basis, symbol: "SPY", bars: [] }]);
  store.close();
  const get = vi.fn(async (_path: string, query: URLSearchParams) => ({
    bars: Object.fromEntries(query.get("symbols")!.split(",").map(symbol => [symbol, [
      { t: new Date(last * 1_000).toISOString(), o: 1, h: 2, l: 1, c: 1.5, v: 35 },
    ]])), next_page_token: null,
  }));
  const unavailableCalendar = { forYear: async () => ({ available: false as const, start: "", end: "", sessions: [] }) };
  const history = vi.fn();
  const split = vi.fn();
  const makeArchive = () => new AlpacaCandleArchive(path, { history }, unavailableCalendar, split, () => now);
  const makeBook = (archive: AlpacaCandleArchive) => new AlpacaPreviousCloseBook({ get }, unavailableCalendar, {
    read: (symbol, start, end) => archive.readScannerDaily(symbol, start, end),
    remember: (basisDate, start, end, entries) => archive.rememberScannerDaily(basisDate, start, end, entries),
  });
  vi.useFakeTimers();
  vi.setSystemTime(now);
  let archive = makeArchive();
  try {
    expect(archive.readScannerDaily("TEST", start, end)).toEqual({ bars: [oldBar], missing: { start: last, end } });
    const result = await makeBook(archive).read(["TEST", "COLD"], date);
    expect(result.TEST?.price).toBe(newBar.close);
    expect(result.COLD?.price).toBe(newBar.close);
    expect(get.mock.calls.map(([, q]) => [q.get("symbols"), q.get("start"), q.get("end")])).toEqual([
      ["COLD", "2026-10-05T04:00:00.000Z", "2026-11-09T04:59:59.999Z"],
      ["TEST", "2026-11-06T05:00:00.000Z", "2026-11-09T04:59:59.999Z"],
    ]);
    await vi.advanceTimersByTimeAsync(1);
    expect(archive.read(key)).toMatchObject({ state: "ready", bars: [oldBar, newBar] });
    expect(archive.read({ ...key, symbol: "COLD" })).toEqual({ state: "miss" });
    archive.close();
    await Promise.resolve();
    archive = makeArchive();
    expect((await makeBook(archive).read(["TEST"], date)).TEST?.price).toBe(newBar.close);
    expect(get).toHaveBeenCalledTimes(2);
    expect(split).not.toHaveBeenCalled();
    expect(history).not.toHaveBeenCalled();
  } finally {
    archive.close();
    await Promise.resolve();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("uses the premarket archive tail and requests only the older gap when the calendar confirms a closed weekend", async () => {
  const directory = mkdtempSync(join(tmpdir(), "scanner-opening-daily-gap-"));
  const path = join(directory, "shared.sqlite");
  const date = "2026-11-23";
  const now = Date.parse(date + "T09:00:00Z");
  const start = Date.parse("2026-10-19T04:00:00Z") / 1_000;
  const archivedStart = Date.parse("2026-11-19T05:00:00Z") / 1_000;
  const friday = Date.parse("2026-11-20T05:00:00Z") / 1_000;
  const archivedEnd = Date.parse("2026-11-21T05:00:00Z") / 1_000;
  const end = easternDayStart(now / 1_000);
  const candles = [{ time: friday, open: 3, high: 4, low: 2.5, close: 3.6, volume: 8_000 }];
  const older = { time: start, open: 2, high: 3, low: 1, close: 2.1, volume: 1000 };
  const basis = "a".repeat(64);
  const store = new CandleHistoryStore(path);
  const settings = { ...initialCandleHistorySettings(), popularTickers: [] };
  store.changeSettings(settings, ["TEST"]);
  for (const symbol of ["TEST", "SPY"]) {
    store.updateBasis(symbol, date, basis);
    store.markReconciled(symbol, basis, archivedEnd);
    store.saveVerified([{ symbol, basis, frame: "1D", session: "daily",
      start: symbol === "TEST" ? archivedStart : start, end: archivedEnd, bars: candles }]);
  }
  store.close();
  const sessions = Array.from({ length: 35 }, (_, index) => new Date((start + 6 * 3600 + index * 86_400) * 1_000))
    .filter(day => day.getUTCDay() !== 0 && day.getUTCDay() !== 6)
    .map(day => ({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" }));
  const calendar = { forYear: async (year: number) => ({
    available: true as const, start: year + "-01-01", end: year + "-12-31", sessions: year === 2026 ? sessions : [],
  }) };
  const get = vi.fn(async (_path: string, query: URLSearchParams) => {
    expect(query.get("symbols")).toBe("TEST");
    expect(query.get("start")).toBe("2026-10-19T04:00:00.000Z");
    expect(query.get("end")).toBe("2026-11-19T04:59:59.999Z");
    return { bars: { TEST: [{ t: new Date(older.time * 1_000).toISOString(), o: older.open, h: older.high,
      l: older.low, c: older.close, v: older.volume }] }, next_page_token: null };
  });
  const background = vi.fn(async () => { throw Error("fixture does not run older backfill"); });
  vi.useFakeTimers();
  vi.setSystemTime(now);
  const archive = new AlpacaCandleArchive(path, { history: background }, calendar, async () => "fixture-basis");
  try {
    expect(archive.readScannerDaily("TEST", start, end)).toBeNull();
    await vi.advanceTimersByTimeAsync(2_500);
    expect(archive.readScannerDaily("TEST", start, end)).toEqual({
      bars: candles, missing: { start, end: archivedStart },
    });
    const previousCloses = new AlpacaPreviousCloseBook({ get }, calendar, {
      read: (symbol, from, to) => archive.readScannerDaily(symbol, from, to),
      remember: (basisDate, from, to, entries) => archive.rememberScannerDaily(basisDate, from, to, entries),
    });
    expect((await previousCloses.read(["TEST"], date)).TEST).toMatchObject({ price: 3.6, barAt: friday * 1000 });
    expect(get).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(archive.readScannerDaily("TEST", start, end)).toEqual({ bars: [older, ...candles], missing: null });
  } finally {
    archive.close();
    await Promise.resolve();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});
