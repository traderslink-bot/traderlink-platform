// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { exactHistoryAcceptance } from "./rest-data";
import { AcceptedSeriesPublisher } from "../../market-data/accepted-series/publisher";
import { createAlpacaVerifiedLevelsProvider } from "./verified-levels-provider";

const end = Date.parse("2026-11-23T18:30:00Z");
const request = { symbol: "QA", timeframe: "4Hour", start: end - 14_400_000, end,
  acceptedEvidence: true, sessionMode: "regular" } as const;
const dailyStart = Date.parse("2026-11-20T05:00:00Z");
const dailyEnd = Date.parse("2026-11-23T13:12:00Z");
const dailyRequest = { symbol: "QA", timeframe: "1Day", start: dailyStart, end: dailyEnd, acceptedEvidence: true } as const;
const credentials = { keyId: "fixture", secretKey: "fixture" };
const json = (value: unknown) => Response.json(value);

function fixture({ changedAsset = false, duplicateBars = false, changedSplit = false, activity = "dense", incompleteNative = false,
  unexpectedDaily = false, dailySplit = false, changedRepeat = false } = {}) {
  let assetReads = 0, corporateReads = 0, splitDailyReads = 0;
  return vi.fn<typeof fetch>(async input => {
    const url = new URL(String(input));
    if (url.hostname === "paper-api.alpaca.markets" && url.pathname === "/v2/assets/QA") {
      assetReads++;
      return json({ id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", class: "us_equity", symbol: "QA", status: "active",
        exchange: changedAsset && assetReads > 1 ? "NYSE" : "NASDAQ" });
    }
    if (url.hostname === "paper-api.alpaca.markets" && url.pathname === "/v2/calendar") {
      const first = Date.parse(url.searchParams.get("start") + "T12:00:00Z");
      const last = Date.parse(url.searchParams.get("end") + "T12:00:00Z");
      const rows = [];
      for (let day = first; day <= last; day += 86_400_000) {
        const date = new Date(day);
        if (date.getUTCDay() !== 0 && date.getUTCDay() !== 6)
          rows.push({ date: date.toISOString().slice(0, 10), open: "09:30", close: "16:00" });
      }
      return json(rows);
    }
    if (url.hostname === "data.alpaca.markets" && url.pathname === "/v1/corporate-actions") {
      corporateReads++;
      if (dailySplit) return json({ corporate_actions: { reverse_splits: [{
        id: "two-for-one", symbol: "QA", ex_date: "2026-11-23", process_date: "2026-11-23", old_rate: 2, new_rate: 1,
      }] } });
      return json({ corporate_actions: { forward_splits: changedSplit && corporateReads > 1 ? [{
        id: "new-corporate-event", symbol: "QA", ex_date: "2026-11-23", process_date: "2026-11-23", old_rate: 1, new_rate: 2,
      }] : [] } });
    }
    if (url.hostname === "data.alpaca.markets" && url.pathname === "/v2/stocks/bars") {
      expect(url.searchParams.get("symbols")).toBe("QA");
      expect(url.searchParams.get("feed")).toBe("sip");
      const frame = url.searchParams.get("timeframe");
      if (frame === "1Day") {
        expect(url.searchParams.get("start")).toBe(new Date(dailyStart).toISOString());
        expect(url.searchParams.get("end")).toBe("2026-11-23T04:59:59.999Z");
        const prior = { t: "2026-11-20T05:00:00Z", o: 9.9, h: 10.1, l: 9.8, c: 10, v: 0 };
        if (dailySplit) {
          const split = url.searchParams.get("adjustment") === "split";
          if (split) splitDailyReads++;
          const price = split ? changedRepeat && splitDailyReads > 1 ? 23.92 : 23.93 : 11.9625;
          return json({ bars: { QA: [{ t: prior.t, o: price, h: price, l: price, c: price, v: split ? 50 : 101 }] },
            next_page_token: null });
        }
        const current = { t: "2026-11-23T05:00:00Z", o: 10, h: 12, l: 10, c: 12, v: 1000 };
        return json({ bars: { QA: unexpectedDaily ? [prior, current] : [prior] }, next_page_token: null });
      }
      expect(["1Min", "30Min"]).toContain(frame);
      expect(url.searchParams.get("start")).toBe(new Date(request.start).toISOString());
      expect(url.searchParams.get("end")).toBe(new Date(request.end - 1).toISOString());
      expect(url.searchParams.get("asof")).toBe("2026-11-23");
      const halfHour = frame === "30Min";
      if (halfHour) expect(url.searchParams.get("adjustment")).toBe("raw");
      const minutes = halfHour ? 30 : 1;
      const rows = Array.from({ length: activity === "empty" ? 0 : 240 / minutes }, (_, index) =>
        ({ t: new Date(request.start + index * minutes * 60_000).toISOString(), o: 9.9, h: 10.1, l: 9.8, c: 10,
          v: halfHour && activity === "dense" ? 3_000 : 100 }))
        .filter((_, index) => halfHour || activity === "dense" || index % 30 === 0);
      if (duplicateBars) rows.push(rows[0]);
      return json({ bars: { QA: rows }, next_page_token: halfHour && incompleteNative ? "unfinished" : null });
    }
    throw Error("fixture blocked unexpected provider operation");
  });
}

afterEach(() => vi.useRealTimers());

it("binds an exact later regular candle to observed listing, split and calendar evidence", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(end + 2_000);
  const transport = fixture();
  const provider = createAlpacaVerifiedLevelsProvider(credentials, transport);
  const accepted = await provider.readHistory(request, new AbortController().signal);
  expect(accepted?.qualified).toMatchObject({ symbol: "QA", venue: "NASDAQ", completedThroughMs: end,
    acceptedCutoffMs: Date.now(), availableAtMs: Date.now(), rows: [[request.start, end, 9.9, 10.1, 9.8, 10, 24_000]] });
  expect(accepted?.qualified).not.toHaveProperty("upstreamRevision");
  const adjustments = transport.mock.calls.map(([url]) => new URL(String(url)).searchParams.get("adjustment")).filter(Boolean);
  expect(adjustments.sort()).toEqual(["raw", "raw", "split"]);
});

it.each([{ changedAsset: true }, { changedSplit: true }, { duplicateBars: true }, { incompleteNative: true }])(
  "rejects a changed basis or ambiguous provider series (%j)", async options => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(end + 2_000);
    const provider = createAlpacaVerifiedLevelsProvider(credentials, fixture(options));
    expect(await provider.readHistory(request, new AbortController().signal)).toBeUndefined();
  },
);


it("carries the same sparse coverage inputs to history and subsequent observations", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(end + 2_000);
  const provider = createAlpacaVerifiedLevelsProvider(credentials, fixture({ activity: "sparse" }));
  const signal = new AbortController().signal;
  const observed = await provider.readHistory(request, signal);
  expect(observed?.qualified.rows).toEqual([[request.start, end, 9.9, 10.1, 9.8, 10, 800]]);
  expect(observed && "coverage" in observed && observed.coverage).toEqual([{ startMs: request.start, endMs: end, scheduledMinutes: 240, emittedMinutes: 8 }]);
  expect(observed?.qualified.emittedBarCoverage?.revision).toMatch(/^[a-f0-9]{64}$/);
  const trigger = await provider.observeInterval({
    basis: new AcceptedSeriesPublisher().publish(observed!.qualified)!, interval: { startMs: request.start, endMs: end }, operationId: "fixture", signal,
  });
  expect(trigger?.window.nativeHalfHours?.bars).toHaveLength(8);
});

it("keeps a fully observed empty interval available to the caller without issuing a candle", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(end + 2_000);
  const signal = new AbortController().signal;
  const prior = await createAlpacaVerifiedLevelsProvider(credentials, fixture()).readHistory(request, signal);
  const empty = createAlpacaVerifiedLevelsProvider(credentials, fixture({ activity: "empty" }));
  expect(await empty.readHistory(request, signal)).toBeUndefined();
  const observed = await empty.observeInterval({
    basis: new AcceptedSeriesPublisher().publish(prior!.qualified)!, interval: { startMs: request.start, endMs: end }, operationId: "fixture", signal,
  });
  expect(observed?.window.nativeHalfHours).toMatchObject({ bars: [], complete: true, nextPageToken: null });
});


it("requests only completed native Daily dates before a premarket cutoff and keeps the original receipt bound", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(dailyEnd + 1_000);
  const transport = fixture();
  const provider = createAlpacaVerifiedLevelsProvider(credentials, transport);
  const result = await provider.readHistory(dailyRequest, new AbortController().signal);
  expect(result?.qualified.rows).toEqual([[dailyStart, dailyStart + 86_400_000, 9.9, 10.1, 9.8, 10, 0]]);
  expect(result?.qualified.acceptedCutoffMs).toBe(dailyEnd + 1_000);
  expect(result && exactHistoryAcceptance(dailyRequest, result.history, result.qualified)).toBe(result?.qualified);
  const readCount = transport.mock.calls.length;
  const sameDay = { ...dailyRequest, start: Date.parse("2026-11-23T05:00:00Z") };
  expect(await provider.readHistory(sameDay, new AbortController().signal)).toBeUndefined();
  expect(transport.mock.calls).toHaveLength(readCount);
});

it("rejects a Daily page that supplies the current date after the provider cutoff", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(dailyEnd + 1_000);
  const provider = createAlpacaVerifiedLevelsProvider(credentials, fixture({ unexpectedDaily: true }));
  expect(await provider.readHistory(dailyRequest, new AbortController().signal)).toBeUndefined();
});

it("preserves the exact provider-adjusted Daily row at a price tie after a second agreeing read", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(dailyEnd + 1_000);
  const transport = fixture({ dailySplit: true });
  const provider = createAlpacaVerifiedLevelsProvider(credentials, transport);
  const result = await provider.readHistory(dailyRequest, new AbortController().signal);
  expect(result?.qualified.rows).toEqual([[dailyStart, dailyStart + 86_400_000, 23.93, 23.93, 23.93, 23.93, 50]]);
  const adjustments = transport.mock.calls.map(([url]) => new URL(String(url)).searchParams.get("adjustment")).filter(Boolean);
  expect(adjustments.sort()).toEqual(["raw", "split", "split"]);
  const conflicting = createAlpacaVerifiedLevelsProvider(credentials, fixture({ dailySplit: true, changedRepeat: true }));
  expect(await conflicting.readHistory(dailyRequest, new AbortController().signal)).toBeUndefined();
});

it("requires a connected security identifier when following an older ticker and ignores prior ticker reuse", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(Date.parse("2026-11-24T13:00:00Z"));
  const base = fixture({ dailySplit: true });
  const rename = { id: "name-change", process_date: "2026-11-24", old_symbol: "OLD", new_symbol: "QA",
    old_cusip: "123456782", new_cusip: "123456782" };
  function transport(broken: boolean): typeof fetch {
    return async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname !== "/v1/corporate-actions") return base(input, init);
      if (url.searchParams.get("symbols") === "OLD") {
        return json({ corporate_actions: { name_changes: [rename], reverse_splits: [{
          id: "applied-split", symbol: "OLD", ex_date: "2026-11-23", process_date: "2026-11-23",
          old_rate: 2, new_rate: 1, old_cusip: "123456781", new_cusip: broken ? "123456789" : "123456782",
        }] } });
      }
      return json({ corporate_actions: { name_changes: [rename, {
        id: "prior-ticker-use", process_date: "2026-11-22", old_symbol: "QA", new_symbol: "OTHER",
        old_cusip: "999999991", new_cusip: "999999992",
      }], reverse_splits: [{
        id: "unrelated-split", symbol: "QA", ex_date: "2026-11-22", process_date: "2026-11-22",
        old_rate: 3, new_rate: 1, old_cusip: "999999990", new_cusip: "999999991",
      }] } });
    };
  }
  const signal = new AbortController().signal;
  const linked = await createAlpacaVerifiedLevelsProvider(credentials, transport(false)).readHistory(dailyRequest, signal);
  expect(linked?.qualified.rows[0].slice(2)).toEqual([23.93, 23.93, 23.93, 23.93, 50]);
  expect(await createAlpacaVerifiedLevelsProvider(credentials, transport(true)).readHistory(dailyRequest, signal)).toBeUndefined();
});

it("requires terminal empty minute and half-hour reads before skipping a quiet eligible Daily date", async () => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(dailyEnd + 1_000);
  const quietStart = "2026-11-19T05:00:00.000Z";
  const quietEnd = "2026-11-20T04:59:59.999Z";
  const longer = { ...dailyRequest, start: Date.parse(quietStart) };
  const base = fixture();
  const resolutions: string[] = [];
  function transport(unexpectedMinute: boolean): typeof fetch {
    return async (input, init) => {
      const url = new URL(String(input));
      if (url.pathname !== "/v2/stocks/bars") return base(input, init);
      expect(url.searchParams.get("start")).toBe(quietStart);
      const frame = url.searchParams.get("timeframe");
      if (frame === "1Day") {
        url.searchParams.set("start", new Date(dailyStart).toISOString());
        return base(url, init);
      }
      expect(url.searchParams.get("end")).toBe(quietEnd);
      expect(url.searchParams.get("adjustment")).toBe("raw");
      resolutions.push(frame ?? "");
      const rows = frame === "1Min" && unexpectedMinute
        ? [{ t: "2026-11-19T14:30:00Z", o: 10, h: 10, l: 10, c: 10, v: 1 }] : [];
      return json({ bars: { QA: rows }, next_page_token: null });
    };
  }
  const signal = new AbortController().signal;
  const covered = await createAlpacaVerifiedLevelsProvider(credentials, transport(false)).readHistory(longer, signal);
  expect(resolutions.sort()).toEqual(["1Min", "30Min"]);
  expect(covered?.qualified.rows.map(row => row[0])).toEqual([dailyStart]);
  expect(await createAlpacaVerifiedLevelsProvider(credentials, transport(true)).readHistory(longer, signal)).toBeUndefined();
});
