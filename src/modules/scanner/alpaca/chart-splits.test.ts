import { expect, it } from "vitest";
import { candleBucket, CHART_TIMEFRAMES, usesDailyCandles } from "./candles";
import { chartSplitLabel, parseChartSplits, projectChartSplits } from "./chart-splits";
import { DEFAULT_CHART_PREFERENCES, parseChartPreferences } from "./chart-preferences";
import { decodeGatewayWire, encodeGatewayWire } from "../../market-data/transport/gateway-wire";

const seconds = (iso: string) => Date.parse(iso) / 1000;
const optt = { id: "optt-2026-09-14", date: "2026-09-14", oldShares: 30, newShares: 1 };
const premarket = seconds("2026-09-14T08:07:00Z");
const opening = seconds("2026-09-14T13:33:00Z");
const daily = seconds("2026-09-14T04:00:00Z");

it("places the reported OPTT split on the first observed candle across every supported timeframe", () => {
  for (const frame of CHART_TIMEFRAMES) {
    const prior = { time: seconds("2026-09-11T16:00:00Z") };
    const extended = usesDailyCandles(frame) ? daily : premarket;
    const regular = usesDailyCandles(frame) ? daily : opening;
    expect(projectChartSplits([optt], [prior, { time: extended }], frame, false))
      .toEqual([{ split: optt, time: candleBucket(extended, frame, false) }]);
    expect(projectChartSplits([optt], [prior, { time: regular }], frame, true))
      .toEqual([{ split: optt, time: candleBucket(regular, frame, true) }]);
  }
  expect(chartSplitLabel(optt)).toBe("1-for-30 reverse split");
});

it("skips carried candles and old splits outside the loaded history", () => {
  const nextDay = seconds("2026-09-15T13:33:00Z");
  const bars = [{ time: nextDay }, { time: opening, carried: true }];
  expect(projectChartSplits([optt], bars, "1m", true, daily)).toEqual([{ split: optt, time: nextDay }]);
  expect(projectChartSplits([optt], bars, "1m", true)).toEqual([]);
});

it("round-trips split facts and rejects conflicting or impossible ratios", () => {
  const data = { symbol: "OPTT", basisDate: "2026-09-14", splits: [optt] };
  expect(decodeGatewayWire("chart-splits", encodeGatewayWire("chart-splits", data))).toEqual(data);
  expect(parseChartSplits([optt, optt])).toEqual([optt]);
  expect(() => parseChartSplits([optt, { ...optt, newShares: 2 }])).toThrow();
  expect(() => parseChartSplits([{ ...optt, oldShares: 0 }])).toThrow();
});

it("keeps split-adjusted as the legacy default and serializes both explicit choices", () => {
  expect(parseChartPreferences(DEFAULT_CHART_PREFERENCES).priceAdjustment ?? "split").toBe("split");
  for (const priceAdjustment of ["split", "raw"] as const) {
    expect(parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, priceAdjustment }).priceAdjustment).toBe(priceAdjustment);
  }
  expect(() => parseChartPreferences({ ...DEFAULT_CHART_PREFERENCES, priceAdjustment: "all" })).toThrow();
});
