import { describe, expect, it } from "vitest";
import { completedRegularIntradayCandle, regularIntradayBucket, type AcceptedMinuteSnapshot } from "./completed-candles";
import { SHARED_CHART_REPLAY as fixture } from "./replay-fixture";

const snapshot: AcceptedMinuteSnapshot = {
  basis: fixture.basis,
  revision: fixture.revision,
  receivedAt: fixture.receivedAt,
  acceptedAt: fixture.acceptedAt,
  coverage: fixture.triggerInterval,
  bars: fixture.minutes,
};

const request = {
  snapshot,
  session: fixture.session,
  frame: "4h" as const,
  time: fixture.triggerInterval.start,
  cutoff: fixture.acceptedAt,
};

describe("completed chart evidence candles", () => {
  it("withholds confirmation until acceptance and aggregates the exact OHLCV once", () => {
    expect(completedRegularIntradayCandle({ ...request, cutoff: fixture.receivedAt })).toEqual({ state: "unavailable" });
    expect(completedRegularIntradayCandle(request)).toMatchObject({
      state: "ready",
      candle: {
        bar: fixture.expectedTriggerBar,
        interval: fixture.triggerInterval,
        plotTime: fixture.triggerInterval.start,
        acceptedAt: fixture.acceptedAt,
        revision: fixture.revision,
        shortened: false,
      },
    });
  });

  it("distinguishes verified no-trade coverage from unresolved coverage", () => {
    const empty = { ...snapshot, bars: [] };
    expect(completedRegularIntradayCandle({ ...request, snapshot: empty })).toEqual({ state: "no-trades" });
    expect(completedRegularIntradayCandle({
      ...request,
      snapshot: { ...empty, coverage: { ...empty.coverage, end: empty.coverage.end - 60 } },
    })).toEqual({ state: "unavailable" });
  });

  it("rejects ambiguous duplicate minutes within one accepted revision", () => {
    expect(completedRegularIntradayCandle({
      ...request,
      snapshot: { ...snapshot, bars: [...snapshot.bars, fixture.minutes[239]] },
    })).toEqual({ state: "unavailable" });
  });

  it("labels a fully covered shortened candle without promoting it to a full bucket", () => {
    const start = fixture.triggerInterval.end;
    const end = fixture.session.end;
    const bar = { ...fixture.expectedTriggerBar, time: start, volume: 100 };
    expect(completedRegularIntradayCandle({
      ...request,
      time: start,
      cutoff: end,
      snapshot: { ...snapshot, receivedAt: end, acceptedAt: end, coverage: { start, end }, bars: [bar] },
    })).toMatchObject({ state: "ready", candle: { interval: { start, end }, shortened: true, bar } });
  });

  it.each([
    ["2026-10-30T13:30:00Z", "2026-10-30T17:30:00Z", "2026-10-30T20:00:00Z"],
    ["2026-11-18T14:30:00Z", "2026-11-18T18:30:00Z", "2026-11-18T21:00:00Z"],
    ["2026-11-27T14:30:00Z", "2026-11-27T18:00:00Z", "2026-11-27T18:00:00Z"],
  ])("anchors %s and clips at the declared regular close", (open, firstEnd, close) => {
    const [start, boundary, end] = [open, firstEnd, close].map(value => Date.parse(value) / 1_000);
    expect(regularIntradayBucket(start, "4h", { start, end })).toEqual({ start, end: boundary });
    expect(regularIntradayBucket(end - 60, "4h", { start, end })).toEqual({
      start: boundary < end ? boundary : start,
      end,
    });
    expect(regularIntradayBucket(end, "4h", { start, end })).toBeNull();
  });
});
