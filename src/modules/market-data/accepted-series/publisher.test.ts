// @vitest-environment node
import { createHash } from "node:crypto";
import { expect, it } from "vitest";

import { browserChartHistory } from "../server/browser-chart-history";
import { encodeGatewayWire, decodeGatewayWire } from "../transport/gateway-wire";
import { ALPACA_NATIVE_DAILY_DATASET, ALPACA_REGULAR_FOUR_HOUR_DATASET, bindHistoryAcceptance, type AlpacaHistoryRequest, type AlpacaHistoryResult } from "../../scanner/alpaca/rest-data";
import { compareVerifiedAlpacaRegularHistory, prepareVerifiedAlpacaRegularHistory, qualifyAlpacaNativeDailyHistory,
  verifyAlpacaNativeDailyWindow, verifyAlpacaRegularFourHourCoverage, verifyAlpacaRegularFourHourWindow } from "../../scanner/alpaca/verify-regular-history";
import { AcceptedSeriesPublisher, type QualifiedInputSeries } from "./publisher";
import { createVerifiedLevelsReceiptBroker } from "../../scanner/alpaca/verified-levels-receipt-broker";
import { nativeDailyScannerContext } from "../../scanner/alpaca/native-daily-scanner-context";

const start = 1_795_012_200_000;
const end = start + 14_400_000;
const source: QualifiedInputSeries = {
  instrumentId: "listing-test", symbol: "QA", venue: "NASDAQ", frame: "4h",
  datasetId: "test-dataset", priceBasisId: "known-basis", calendarRevision: "qualified-calendar",
  sessionMode: "regular", completedThroughMs: end, acceptedCutoffMs: end + 600, availableAtMs: end + 400,
  upstreamRevision: "test-source-1", rows: [[start, end, 9.98, 10.25, 9.90, 10.20, 24_000]],
};
const request: AlpacaHistoryRequest = { symbol: source.symbol, start, end, timeframe: "4Hour", acceptedEvidence: true };
const bar = { time: start / 1_000, open: 9.98, high: 10.25, low: 9.9, close: 10.2, volume: 24_000 };
const history: AlpacaHistoryResult = { symbol: source.symbol, adjustment: "split", feed: "sip", complete: true, nextPageToken: null, bars: [bar] };

it("derives dated Daily and Weekly returns without counting a partial week or guessing calendar coverage", () => {
  const dates = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20",
    "2026-11-23", "2026-11-24", "2026-11-25", "2026-11-27", "2026-11-30", "2026-12-01"];
  const closes = [100, 101, 102, 103, 104, 106, 107, 108, 110, 115, 116];
  const rows: QualifiedInputSeries["rows"] = dates.slice(0, -1).map((date, index) => {
    const startMs = Date.parse(date + "T05:00:00Z");
    return [startMs, startMs + 86_400_000, closes[index], closes[index], closes[index], closes[index], 100];
  });
  const cutoff = rows.at(-1)![1];
  const daily: QualifiedInputSeries = { ...source, rows, frame: "daily", sessionMode: "extended",
    datasetId: ALPACA_NATIVE_DAILY_DATASET, acceptedCutoffMs: cutoff, completedThroughMs: cutoff, availableAtMs: cutoff };
  const calendar = { available: true as const, start: "2026-11-16", end: "2026-12-06",
    sessions: dates.map(date => ({ date, open: "09:30", close: date === "2026-11-27" ? "13:00" : "16:00" })) };
  const context = nativeDailyScannerContext(daily, [calendar]);
  expect(context?.daily).toMatchObject({ previousClose: 110, close: 115, closedAtMs: cutoff });
  expect(context?.weekly).toMatchObject({ previousClose: 104, close: 110, closedAtMs: Date.parse("2026-11-28T05:00:00Z") });
  expect(context?.weekly?.changePercent).toBeCloseTo((110 / 104 - 1) * 100);
  expect(nativeDailyScannerContext(daily, [{ ...calendar, start: "2026-11-17", sessions: calendar.sessions.slice(1) }])?.weekly).toBeUndefined();
  expect(nativeDailyScannerContext({ ...daily, rows: rows.filter((_, index) => index !== 6) }, [calendar])?.weekly).toBeUndefined();
  const publisher = new AcceptedSeriesPublisher(() => cutoff);
  const pair = publisher.publishPair(daily, source, context);
  if (!pair) throw Error("expected paired Daily receipt");
  const result = publisher.readDailyContext(pair[0].id);
  expect(result).toEqual({ input: pair[0], context });
  expect(decodeGatewayWire("accepted-daily-context", encodeGatewayWire("accepted-daily-context", result))).toEqual(result);
  expect(publisher.readDailyContext(pair[1].id)).toBeUndefined();
  publisher.publish({ ...daily, upstreamRevision: "corrected" });
  expect(publisher.readDailyContext(pair[0].id)).toBeUndefined();
});

it.each([false, true])("binds a paired Daily and regular response to the pending IDs with wire=%s", wire => {
  const date = "2026-11-20";
  const opening = Date.parse(date + "T14:30:00Z");
  const close = opening + 14_400_000;
  const midnight = Date.parse(date + "T05:00:00Z");
  const nextMidnight = midnight + 86_400_000;
  const basis = {
    instrumentId: source.instrumentId, symbol: source.symbol, venue: source.venue,
    priceBasisId: source.priceBasisId, calendarRevision: source.calendarRevision,
    acceptedCutoffMs: nextMidnight, availableAtMs: nextMidnight + 100,
  };
  const calendar = { available: true as const, start: date, end: date, sessions: [{ date, open: "09:30", close: "16:00" }] };
  const daily = {
    request: { symbol: source.symbol, startMs: midnight, endMs: nextMidnight, kind: "daily" as const, operationId: "map", requestId: "daily", wire },
    basis,
    window: { symbol: source.symbol, startMs: midnight, endMs: nextMidnight, calendar,
      split: { ...history, basisDate: date, bars: [{ ...bar, time: midnight / 1_000 }] },
      raw: { ...history, adjustment: "raw" as const, basisDate: date, bars: [{ ...bar, time: midnight / 1_000 }] } },
  };
  const minutes = Array.from({ length: 240 }, (_, index) => ({ ...bar, time: opening / 1_000 + index * 60, volume: 100 }));
  const regular = {
    request: { symbol: source.symbol, startMs: opening, endMs: close, kind: "4h" as const, operationId: "map", requestId: "later", wire },
    basis,
    window: { symbol: source.symbol, startMs: opening, endMs: close, calendar,
      split: { ...history, basisDate: date, bars: minutes },
      raw: { ...history, adjustment: "raw" as const, basisDate: date, bars: minutes } },
  };
  let acceptedAt = nextMidnight + 500;
  const publisher = new AcceptedSeriesPublisher(() => acceptedAt, 3);
  const broker = createVerifiedLevelsReceiptBroker(publisher);
  const signal = new AbortController().signal;
  expect(broker.issueMapHistory(daily, { ...regular, basis: { ...basis, priceBasisId: "unrelated" } }, signal)).toBeUndefined();
  expect(broker.issueMapHistory(daily, { ...regular, basis: { ...basis, availableAtMs: nextMidnight + 501 } }, signal)).toBeUndefined();
  expect(broker.issueMapHistory(daily, regular, AbortSignal.abort())).toBeUndefined();
  acceptedAt++;
  const pair = broker.issueMapHistory(daily, regular, signal);
  expect(pair?.inputs).toMatchObject([{ frame: "daily", acceptedAtMs: acceptedAt }, { frame: "4h", acceptedAtMs: acceptedAt }]);
  if (!pair) throw Error("paired fixture was not accepted");
  expect(pair.daily.requestId).toBe("daily");
  expect(pair.fourHour.requestId).toBe("later");
  for (const [index, reply] of [pair.daily, pair.fourHour].entries()) {
    const json = JSON.parse(reply.body);
    const decoded = wire ? decodeGatewayWire("history", json) : json;
    expect(decoded.acceptedInput).toEqual(pair.inputs[index]);
    expect(publisher.read(pair.inputs[index].id)).toBe(pair.inputs[index]);
  }
  expect(publisher.latestFullCandle(pair.inputs[1].id)?.row).toEqual([opening, close, 9.98, 10.25, 9.9, 10.2, 24_000]);
  const saved = { dailyId: pair.inputs[0].id, regularId: pair.inputs[1].id, previousId: pair.inputs[1].id, savedAfterMs: acceptedAt + 10 };
  expect(broker.issueLaterRegularHistory(regular, saved, signal)).toBeUndefined();
  const laterDate = "2026-11-23";
  const laterStart = Date.parse(laterDate + "T14:30:00Z");
  const laterEnd = laterStart + 14_400_000;
  const laterMinutes = minutes.map((minute, index) => ({ ...minute, time: laterStart / 1_000 + index * 60 }));
  const later = {
    request: { ...regular.request, requestId: "prospective", startMs: laterStart, endMs: laterEnd },
    basis: { ...basis, acceptedCutoffMs: laterEnd, availableAtMs: laterEnd + 1 },
    window: { ...regular.window, startMs: laterStart, endMs: laterEnd,
      calendar: { ...calendar, start: laterDate, end: laterDate, sessions: [{ ...calendar.sessions[0], date: laterDate }] },
      split: { ...regular.window.split, basisDate: laterDate, bars: laterMinutes },
      raw: { ...regular.window.raw, basisDate: laterDate, bars: laterMinutes } },
  };
  acceptedAt = laterEnd + 5;
  expect(broker.issueLaterRegularHistory(later, { ...saved, previousId: "missing" }, signal)).toBeUndefined();
  expect(broker.issueLaterRegularHistory(later, { ...saved, savedAfterMs: laterStart }, signal)).toBeUndefined();
  const other = publisher.publish({ ...source, symbol: "OTHER" });
  const map = { mapId: "saved-map", mapRevision: "a".repeat(64) };
  const issued = broker.issueLaterRegularHistory(later, saved, signal, map);
  expect(issued?.input).toMatchObject({ frame: "4h", completedThroughMs: laterEnd, acceptedAtMs: acceptedAt });
  const opportunities = publisher.readRegularOpportunities(saved.dailyId, saved.regularId, map);
  expect(opportunities).toMatchObject([{ ...saved, triggerId: issued?.input.id, startMs: laterStart }]);
  expect(decodeGatewayWire("accepted-regular-opportunities", encodeGatewayWire("accepted-regular-opportunities", opportunities)))
    .toEqual(opportunities);
  expect(publisher.readRegularOpportunities(saved.dailyId, "different-receipt", map)).toEqual([]);
  expect(publisher.readRegularOpportunities(saved.dailyId, saved.regularId, { ...map, mapId: "different-map" })).toEqual([]);
  expect(publisher.latestFullCandle(issued?.input.id ?? "")?.row.slice(0, 2)).toEqual([laterStart, laterEnd]);
  expect(publisher.read(saved.dailyId)).toBe(pair.inputs[0]);
  expect(publisher.read(saved.regularId)).toBe(pair.inputs[1]);
  expect(other && publisher.read(other.id)).toBeUndefined();
  publisher.publish({ ...source, symbol: "NEWCOMER" });
  expect(publisher.readRegularOpportunities(saved.dailyId, saved.regularId, map)).toEqual([]);
});

it("binds the selected encoding and retains a real acceptance ID on retry", () => {
  const publisher = new AcceptedSeriesPublisher(() => end + 700);
  const input = bindHistoryAcceptance(request, history, source, publisher);
  if (!input) throw Error("expected a qualified acceptance");
  const canonical = `["traderlink.levels-input.v1",["listing-test","QA","NASDAQ"],"4h","test-dataset","known-basis","qualified-calendar","regular",${end},${end + 600},[[${start},${end},9.98,10.25,9.9,10.2,24000]]]`;
  expect(input.digest).toBe(createHash("sha256").update(canonical).digest("hex"));
  expect(bindHistoryAcceptance(request, history, source, publisher)).toBe(input);
  expect(publisher.read(input.id)).toBe(input);

  const correction = bindHistoryAcceptance(request, history, { ...source, upstreamRevision: "test-source-2" }, publisher);
  expect(correction?.digest).toBe(input.digest);
  expect(correction?.id).not.toBe(input.id);
  expect(publisher.read(input.id)).toBeUndefined();
  expect(decodeGatewayWire("accepted-input", encodeGatewayWire("accepted-input", correction))).toEqual(correction);
  const reply = { ...history, acceptedInput: correction };
  expect(decodeGatewayWire("history", encodeGatewayWire("history", reply))).toEqual(reply);
  expect(browserChartHistory(reply)).not.toHaveProperty("acceptedInput");
});

it("does not qualify plain history, incomplete series, or proof for different candle values", () => {
  const publisher = new AcceptedSeriesPublisher(() => end + 700);
  expect(bindHistoryAcceptance(request, history, undefined, publisher)).toBeUndefined();
  expect(bindHistoryAcceptance(request, { ...history, complete: false }, source, publisher)).toBeUndefined();
  expect(bindHistoryAcceptance(request, { ...history, bars: [{ ...bar, volume: 23_999 }] }, source, publisher)).toBeUndefined();
  expect(bindHistoryAcceptance(request, history, { ...source, acceptedCutoffMs: end + 800 }, publisher)).toBeUndefined();
  expect(bindHistoryAcceptance(request, history, { ...source, availableAtMs: end - 1 }, publisher)).toBeUndefined();
});

it("derives regular buckets only from complete matching minutes, with the verified exchange early close", () => {
  const date = "2026-11-27";
  const startMs = Date.parse(date + "T14:30:00Z");
  const endMs = Date.parse(date + "T18:00:00Z");
  const bars = Array.from({ length: 210 }, (_, index) => ({
    ...bar, time: startMs / 1_000 + index * 60, volume: 100,
  }));
  const split = { ...history, basisDate: date, bars };
  const raw: AlpacaHistoryResult = { ...split, adjustment: "raw" };
  const args = {
    symbol: history.symbol, startMs, endMs, split, raw,
    calendar: { available: true as const, start: date, end: date, sessions: [{ date, open: "09:30", close: "13:00" }] },
  };
  expect(compareVerifiedAlpacaRegularHistory(args)).toEqual({
    state: "equal", count: 210, regularFourHour: [[startMs, endMs, bar.open, bar.high, bar.low, bar.close, 21_000]],
  });
  expect(compareVerifiedAlpacaRegularHistory({ ...args, raw: { ...raw, bars: bars.slice(1) } }))
    .toEqual({ state: "unavailable" });
  expect(compareVerifiedAlpacaRegularHistory({ ...args, raw: { ...raw, bars: [{ ...bars[0], volume: 101 }, ...bars.slice(1)] } }))
    .toEqual({ state: "different", count: 210 });

  expect(verifyAlpacaRegularFourHourWindow({ ...args, startMs: startMs - 5, endMs: endMs + 7 })).toEqual([
    [startMs, endMs, bar.open, bar.high, bar.low, bar.close, 21_000],
  ]);
  const missing = bars.filter((_, index) => index !== 130);
  expect(verifyAlpacaRegularFourHourWindow({ ...args, raw: { ...raw, bars: missing }, split: { ...split, bars: missing } }))
    .toBeUndefined();
  expect(verifyAlpacaRegularFourHourWindow({ ...args, endMs: endMs - 500 })).toBeUndefined();
});

it("keeps a completed full 4H candle without admitting the same day's open closing bucket", () => {
  const date = "2026-11-20";
  const startMs = Date.parse(date + "T14:30:00Z");
  const endMs = Date.parse(date + "T19:00:00Z");
  const bars = Array.from({ length: 270 }, (_, index) => ({
    ...bar, time: startMs / 1_000 + index * 60, volume: 100,
  }));
  const split = { ...history, basisDate: date, bars };
  const raw: AlpacaHistoryResult = { ...split, adjustment: "raw" };
  const window = {
    symbol: history.symbol, startMs, endMs, split, raw,
    calendar: { available: true as const, start: date, end: date, sessions: [{ date, open: "09:30", close: "16:00" }] },
  };
  expect(verifyAlpacaRegularFourHourWindow(window)).toEqual([
    [startMs, startMs + 14_400_000, bar.open, bar.high, bar.low, bar.close, 24_000],
  ]);
  const request: AlpacaHistoryRequest = {
    symbol: history.symbol, timeframe: "4Hour", start: startMs, end: endMs, acceptedEvidence: true, sessionMode: "regular",
  };
  const observed = {
    instrumentId: source.instrumentId, symbol: history.symbol, venue: source.venue,
    priceBasisId: source.priceBasisId, calendarRevision: source.calendarRevision,
    acceptedCutoffMs: endMs + 1, availableAtMs: endMs + 2,
  };
  const verified = prepareVerifiedAlpacaRegularHistory(request, window, observed);
  if (!verified) throw Error("expected the verified regular history");
  const publisher = new AcceptedSeriesPublisher(() => endMs + 3);
  expect(bindHistoryAcceptance(request, verified.history, verified.qualified, publisher)).toMatchObject({
    datasetId: ALPACA_REGULAR_FOUR_HOUR_DATASET, completedThroughMs: startMs + 14_400_000,
    acceptedCutoffMs: observed.acceptedCutoffMs, availableAtMs: observed.availableAtMs, acceptedAtMs: endMs + 3,
  });
  expect(prepareVerifiedAlpacaRegularHistory({ ...request, start: startMs + 1 }, window, observed)).toBeUndefined();
  expect(prepareVerifiedAlpacaRegularHistory(request, window, { ...observed, availableAtMs: endMs - 1 })).toBeUndefined();
});

it("keeps exact zero-volume native Daily rows across DST and refuses a partial next day", () => {
  const day = (time: string) => Date.parse(time);
  const friday = day("2026-03-06T05:00:00Z");
  const monday = day("2026-03-09T04:00:00Z");
  const endMs = day("2026-03-10T04:00:00Z");
  const startMs = friday;
  const bars = [{ time: friday / 1_000, open: 1.62, high: 1.62, low: 1.62, close: 1.62, volume: 0 },
    { ...bar, time: monday / 1_000 }];
  const split = { ...history, basisDate: "2026-03-10", bars };
  const raw: AlpacaHistoryResult = { ...split, adjustment: "raw" };
  const window = {
    symbol: history.symbol, startMs, endMs, raw, split,
    calendar: { available: true as const, start: "2026-03-06", end: "2026-03-10", sessions: [
      { date: "2026-03-06", open: "09:30", close: "16:00" }, { date: "2026-03-09", open: "09:30", close: "16:00" },
    ] },
  };
  const request: AlpacaHistoryRequest = {
    symbol: history.symbol, timeframe: "1Day", start: startMs, end: endMs, acceptedEvidence: true,
  };
  const basis = { instrumentId: source.instrumentId, symbol: history.symbol, venue: source.venue,
    priceBasisId: source.priceBasisId, calendarRevision: source.calendarRevision, acceptedCutoffMs: endMs + 1, availableAtMs: endMs + 2 };
  const qualified = qualifyAlpacaNativeDailyHistory(request, window, basis);
  expect(qualified?.rows.map(item => item.slice(0, 2))).toEqual([
    [friday, day("2026-03-07T05:00:00Z")], [monday, endMs],
  ]);
  expect(qualified?.rows[0]).toEqual([friday, day("2026-03-07T05:00:00Z"), 1.62, 1.62, 1.62, 1.62, 0]);
  const disagrees = [{ ...bars[0], volume: 1 }, bars[1]];
  expect(verifyAlpacaNativeDailyWindow({ ...window, raw: { ...raw, bars: disagrees } })).toBeUndefined();
  const negative = [{ ...bars[0], volume: -1 }, bars[1]];
  expect(verifyAlpacaNativeDailyWindow({
    ...window, raw: { ...raw, bars: negative }, split: { ...split, bars: negative },
  })).toBeUndefined();
  const publisher = new AcceptedSeriesPublisher(() => endMs + 3);
  expect(bindHistoryAcceptance(request, split, qualified, publisher)).toMatchObject({
    frame: "daily", datasetId: ALPACA_NATIVE_DAILY_DATASET, sessionMode: "extended", completedThroughMs: endMs,
  });
  expect(verifyAlpacaNativeDailyWindow({ ...window, endMs: endMs - 1 })).toBeUndefined();
  expect(verifyAlpacaNativeDailyWindow({
    ...window, calendar: [{ ...window.calendar, end: "2026-03-06", sessions: [window.calendar.sessions[0]] },
      { ...window.calendar, start: "2026-03-09", sessions: [window.calendar.sessions[1]] }],
  })).toBeUndefined();
});


const sparseDate = "2026-11-20";
const sparseStart = Date.parse(sparseDate + "T14:30:00Z");
const sparseEnd = Date.parse(sparseDate + "T21:00:00Z");
const fullBucketEnd = sparseStart + 14_400_000;

function sparseObservation(minutes: AlpacaHistoryResult["bars"], halves = minutes): Parameters<typeof verifyAlpacaRegularFourHourCoverage>[0] {
  const common = { ...history, basisDate: sparseDate };
  return {
    symbol: history.symbol, startMs: sparseStart, endMs: sparseEnd,
    calendar: { available: true, start: sparseDate, end: sparseDate, sessions: [{ date: sparseDate, open: "09:30", close: "16:00" }] },
    raw: { ...common, adjustment: "raw", bars: minutes }, split: { ...common, bars: minutes },
    nativeHalfHours: { ...common, adjustment: "raw", bars: halves },
  };
}

it("keeps quiet half-hours and an entirely empty shortened bucket in coverage without adding candles", () => {
  const active = { ...bar, time: sparseStart / 1000, volume: 23 };
  const observed = sparseObservation([active]);
  const covered = verifyAlpacaRegularFourHourCoverage(observed);
  expect(covered).toEqual({
    rows: [[sparseStart, fullBucketEnd, bar.open, bar.high, bar.low, bar.close, 23]],
    coverage: [
      { startMs: sparseStart, endMs: fullBucketEnd, scheduledMinutes: 240, emittedMinutes: 1 },
      { startMs: fullBucketEnd, endMs: sparseEnd, scheduledMinutes: 150, emittedMinutes: 0 },
    ],
  });
  expect(verifyAlpacaRegularFourHourCoverage(sparseObservation([]))?.rows).toEqual([]);
  expect(verifyAlpacaRegularFourHourCoverage({ ...observed, nativeHalfHours: undefined })).toBeUndefined();
});

it("rejects evidence when one resolution is missing, duplicated, inconsistent, partial or on a different basis", () => {
  const active = { ...bar, time: sparseStart / 1000, volume: 23 };
  const observed = sparseObservation([active]);
  const native = observed.nativeHalfHours!;
  for (const series of [
    { ...native, bars: [] },
    { ...native, bars: [active, active] },
    { ...native, bars: [{ ...active, volume: 24 }] },
    { ...native, bars: [{ ...active, time: active.time + 60 }] },
    { ...native, complete: false, nextPageToken: "still-pending" },
    { ...native, basisDate: "2026-11-19" },
  ]) expect(verifyAlpacaRegularFourHourCoverage({ ...observed, nativeHalfHours: series })).toBeUndefined();
  expect(verifyAlpacaRegularFourHourCoverage(sparseObservation([], [active]))).toBeUndefined();
  expect(verifyAlpacaRegularFourHourCoverage(sparseObservation([{ ...active, volume: 0 }]))).toBeUndefined();
  expect(verifyAlpacaRegularFourHourCoverage({ ...observed, calendar: { available: false } })).toBeUndefined();
});

it("supersedes the same covered window after an emitted-bar correction even if aggregate OHLCV stays the same", () => {
  const active = { ...bar, time: sparseStart / 1000, volume: 23 };
  const request = { symbol: history.symbol, timeframe: "4Hour", start: sparseStart, end: sparseEnd,
    acceptedEvidence: true, sessionMode: "regular" } as const;
  const basis = { ...source, acceptedCutoffMs: sparseEnd + 1, availableAtMs: sparseEnd + 2 };
  const observed = sparseObservation([active]);
  // Add an emitted minute and preserve the native 30m/4H OHLCV.
  const corrected = sparseObservation([{ ...active, volume: 22 }, { ...active, time: active.time + 60, volume: 1 }], [active]);
  const first = prepareVerifiedAlpacaRegularHistory(request, observed, basis)!;
  const second = prepareVerifiedAlpacaRegularHistory(request, corrected, basis)!;
  expect(first.qualified.rows).toEqual(second.qualified.rows);
  expect(first.qualified.emittedBarCoverage?.revision).not.toBe(second.qualified.emittedBarCoverage?.revision);
  const publisher = new AcceptedSeriesPublisher(() => sparseEnd + 3);
  const prior = publisher.publish(first.qualified)!;
  const current = publisher.publish(second.qualified)!;
  expect(prior.digest).toBe(current.digest);
  expect(prior.id).not.toBe(current.id);
  expect(publisher.publish(second.qualified)?.id).toBe(current.id);
  expect(publisher.read(prior.id)).toBeUndefined();
  expect(publisher.read(current.id)).toBeDefined();
  expect(current).not.toHaveProperty("emittedBarCoverage");
});

it("retains the original paired receipts and clocks when only observation times change", () => {
  const active = { ...bar, time: sparseStart / 1000, volume: 23 };
  const observed = sparseObservation([active]);
  const request = { symbol: history.symbol, timeframe: "4Hour", start: sparseStart, end: sparseEnd,
    acceptedEvidence: true, sessionMode: "regular" } as const;
  const basis = { ...source, acceptedCutoffMs: sparseEnd + 1, availableAtMs: sparseEnd + 2 };
  const regular = prepareVerifiedAlpacaRegularHistory(request, observed, basis)!.qualified;
  const daily: QualifiedInputSeries = { ...source, frame: "daily", datasetId: ALPACA_NATIVE_DAILY_DATASET,
    sessionMode: "extended" };

  let now = sparseEnd + 3;
  const publisher = new AcceptedSeriesPublisher(() => now);
  const pair = publisher.publishPair(daily, regular)!;
  const laterDate = "2026-11-21";
  const reread = {
    ...observed,
    raw: { ...observed.raw, basisDate: laterDate },
    split: { ...observed.split, basisDate: laterDate },
    nativeHalfHours: { ...observed.nativeHalfHours!, basisDate: laterDate },
  };
  now += 86_400_000;
  const clocks = { acceptedCutoffMs: now - 2, availableAtMs: now - 1 };
  const later = prepareVerifiedAlpacaRegularHistory(request, reread, { ...basis, ...clocks })!.qualified;
  expect(later.emittedBarCoverage).toEqual(regular.emittedBarCoverage);
  const repeated = publisher.publishPair({ ...daily, ...clocks }, later)!;
  expect(repeated[0]).toBe(pair[0]);
  expect(repeated[1]).toBe(pair[1]);
  expect(publisher.read(pair[0].id)?.acceptedCutoffMs).toBe(daily.acceptedCutoffMs);
  expect(publisher.read(pair[1].id)?.availableAtMs).toBe(regular.availableAtMs);

  const rebased = publisher.publish({ ...later, priceBasisId: "corrected-basis" })!;
  expect(rebased.id).not.toBe(pair[1].id);
  expect(publisher.read(pair[1].id)).toBeUndefined();
  const rescheduled = publisher.publish({ ...later, priceBasisId: rebased.priceBasisId, calendarRevision: "corrected-calendar" })!;
  expect(rescheduled.id).not.toBe(rebased.id);
  expect(publisher.read(rebased.id)).toBeUndefined();
  expect(publisher.read(pair[0].id)).toBe(pair[0]);
});

it("withdraws a literal current receipt, its candle and calendar, and only its dependent opportunities", () => {
  const now = end + 86_400_000 + 1_000;
  const publisher = new AcceptedSeriesPublisher(() => now);
  const daily = publisher.publish({ ...source, frame: "daily" })!;
  const original = publisher.publish(source)!;
  const laterStart = start + 86_400_000;
  const laterEnd = end + 86_400_000;
  const later = publisher.publish({ ...source, completedThroughMs: laterEnd, acceptedCutoffMs: laterEnd,
    availableAtMs: laterEnd, rows: [[laterStart, laterEnd, 10.2, 10.25, 9.9, 10.2, 100]] })!;
  const calendars = [{ available: true as const, start: sparseDate, end: sparseDate, sessions: [] }];
  const map = { mapId: "retained-map", mapRevision: "a".repeat(64) };
  const event = { ...map, dailyId: daily.id, regularId: original.id, previousId: original.id, triggerId: later.id,
    savedAfterMs: end, startMs: laterStart, calendars, verifiedEmptyStarts: [start + 43_200_000] };
  publisher.rememberRegularCalendar(original.id, calendars);
  publisher.rememberRegularCalendar(later.id, calendars);
  publisher.recordRegularOpportunity(event);
  expect(publisher.readRegularOpportunities(daily.id, original.id, map)).toEqual([event]);
  expect(publisher.withdraw(later.id)).toBe(true);
  expect(publisher.withdraw(later.id)).toBe(false);
  expect(publisher.latestFullCandle(later.id)).toBeUndefined();
  expect(publisher.readRegularCalendar(later.id)).toBeUndefined();
  expect(publisher.readRegularOpportunities(daily.id, original.id, map)).toEqual([]);
  expect(publisher.read(original.id)).toBe(original);
  expect(publisher.readRegularCalendar(original.id)).toEqual(calendars);
  expect(publisher.read(daily.id)).toBe(daily);

  const replacement = publisher.publish({ ...source, upstreamRevision: "replacement" })!;
  expect(publisher.withdraw(original.id)).toBe(false);
  expect(publisher.read(replacement.id)).toBe(replacement);
});
