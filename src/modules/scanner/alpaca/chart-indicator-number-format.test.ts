// @vitest-environment node
import { expect, it } from "vitest";
import type { BarPrice } from "lightweight-charts";
import { indicatorNumberFormat } from "./chart-indicator-number-format";

it("uses candle precision for price overlays and price-unit oscillators", () => {
  for (const type of ["SMA", "VWAP", "MACD", "ATR", "StdDev", "Momentum", "AO", "DPO", "BullBear"] as const) {
    const format = indicatorNumberFormat({ type }, 4);
    expect(format.precision, type).toBe(4);
    expect(format.readout(0.0021255), type).toBe("0.0021");
    expect(format.axis.type, type).toBe("custom");
    if (format.axis.type === "custom") expect(format.axis.formatter(-0.0016255 as BarPrice), type).toBe("-0.0016");
    expect(indicatorNumberFormat({ type }, 2).readout(1.1234), type).toBe("1.12");
  }
});

it("keeps sub-dollar price-unit output and axis ticks readable on an all-dollar chart", () => {
  const values = [
    ["MACD", -0.00371388445, "-0.0037"],
    ["MACD", -0.001328386, "-0.0013"],
    ["VisibleVolumeProfile", 0.8999833333, "0.9000"],
    ["SessionVolumeProfile", 0.8999833333, "0.9000"],
    ["Bollinger", 0.9962, "0.9962"],
    ["ATR", 0.0024, "0.0024"],
  ] as const;
  for (const [type, value, expected] of values) {
    const format = indicatorNumberFormat({ type }, 2);
    expect(format.readout(value), type).toBe(expected);
    expect(format.axis.minMove, type).toBe(0.0001);
    expect(format.readout(1.55), type).toBe("1.55");
    if (format.axis.type !== "custom") throw new Error("Expected a price-unit formatter");
    expect(format.axis.formatter(value as BarPrice), type).toBe(expected);
  }
  const ticks = [1.001, 1.002, 1.003] as BarPrice[];
  for (const type of ["MACD", "ATR", "Bollinger"] as const) {
    const { axis } = indicatorNumberFormat({ type }, 2);
    if (axis.type !== "custom") throw new Error("Expected a price-unit formatter");
    expect(axis.tickmarksFormatter?.(ticks)).toEqual(["1.0010", "1.0020", "1.0030"]);
    expect(axis.tickmarksFormatter?.([1.25, 1.50] as BarPrice[])).toEqual(["1.25", "1.50"]);
  }
  const explicit = indicatorNumberFormat({ type: "SessionVolumeProfile", output: { precision: 2, statusLineValues: true } }, 4);
  expect(explicit.readout(0.7199)).toBe("0.72");
  expect(explicit.axis.minMove).toBe(0.01);
  if (explicit.axis.type === "custom") expect(explicit.axis.tickmarksFormatter).toBeUndefined();
});

it("rounds price-unit readouts and axes to the same ticks as the candle series", () => {
  const midpoint = 1.56375;
  for (const type of ["VisibleVolumeProfile", "SessionVolumeProfile", "VWAP", "MACD"] as const) {
    const format = indicatorNumberFormat({ type }, 4);
    if (format.axis.type !== "custom") throw new Error("Expected a price-unit formatter");
    for (const [value, expected] of [
      [midpoint, "1.5638"], [-midpoint, "-1.5638"],
      [midpoint - Number.EPSILON, "1.5637"], [midpoint + Number.EPSILON, "1.5638"],
      [0.00005, "0.0001"], [-0.00005, "-0.0001"], [-0.00004999, "0.0000"],
      [9.99995, "10.0000"], [-0, "0.0000"],
    ] as const) {
      expect(format.readout(value), type).toBe(expected);
      expect(format.axis.formatter(value as BarPrice), type).toBe(expected);
    }
  }
  const format = (precision: number) => indicatorNumberFormat({ type: "SessionVolumeProfile", output: { statusLineValues: true, precision } }, 4);
  expect(format(2).readout(2.675)).toBe("2.68");
  expect(format(5).readout(-0.333335)).toBe("-0.33334");
  expect(format(0).readout(-2.5)).toBe("-3");
  expect(format(16).readout(123.45678901234567)).toBe((123.45678901234567).toFixed(16));
  const adaptive = indicatorNumberFormat({ type: "ATR" }, 2);
  if (adaptive.axis.type !== "custom") throw new Error("Expected a price-unit formatter");
  expect(adaptive.axis.tickmarksFormatter?.([midpoint, 1.56475] as BarPrice[])).toEqual(["1.5638", "1.5648"]);
});

it("keeps small EMV and ratio values readable without treating bounded oscillators as percentages", () => {
  for (const type of ["EMV", "CMF", "RVOL", "BBPercent", "Vortex", "RVI", "SMIErgodic", "BOP"] as const) {
    const format = indicatorNumberFormat({ type }, 4);
    expect(format.readout(-0.0016255), type).toBe("-0.0016");
    expect(format.readout(-1e-8), type).toBe("0.0000");
  }
  for (const type of ["RSI", "DMI", "Stoch", "Ultimate", "WilliamsR"] as const) {
    expect(indicatorNumberFormat({ type }, 4).readout(28.126), type).toBe("28.13");
  }
});

it("uses the percent sign only for percent-valued studies and leaves their magnitudes unchanged", () => {
  for (const type of ["ROC", "TRIX", "Coppock", "VolumeOsc", "HistVol", "BBWidth", "Ulcer"] as const) {
    expect(indicatorNumberFormat({ type }, 4).readout(2.525), type).toBe("2.52%");
  }
  expect(indicatorNumberFormat({ type: "BBPercent" }, 4).readout(0.7)).toBe("0.7000");
});

it("keeps volume axes compact and legend counts intact after toggling visibility or labels", () => {
  const defaultFormat = indicatorNumberFormat({ type: "OBV" }, 4);
  const toggled = indicatorNumberFormat({ type: "OBV", output: { statusLineValues: false, priceScaleLabels: true } }, 4);
  expect(defaultFormat.axis).toEqual({ type: "volume", minMove: 0.01, precision: 2 });
  expect(toggled.axis).toEqual(defaultFormat.axis);
  expect(toggled.readout(-1250134.3)).toBe("-1250134");
});

it("preserves explicitly saved precision including zero and an explicit volume exception", () => {
  const output = { statusLineValues: true, precision: 5 };
  expect(indicatorNumberFormat({ type: "DPO", output }, 4).readout(-0.0016255)).toBe("-0.00163");
  expect(indicatorNumberFormat({ type: "ROC", output }, 2).readout(0.5)).toBe("0.50000%");
  expect(indicatorNumberFormat({ type: "OBV", output }, 4).readout(1250134.3)).toBe("1250134.30000");
  expect(indicatorNumberFormat({ type: "OBV", output }, 4).axis.type).toBe("custom");
  const whole = indicatorNumberFormat({ type: "DPO", output: { ...output, precision: 0 } }, 4);
  expect(whole.readout(-0.12345)).toBe("0");
  expect(whole.axis.minMove).toBe(1);
});
