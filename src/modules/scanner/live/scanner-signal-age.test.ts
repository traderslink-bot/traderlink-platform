import { scannerIndicatorResults } from "./scanner-indicator-calculation";
import { expect, it } from "vitest";
import { isRecentScannerSignal } from "@/app/(dashboard)/screeners/scanner-card-indicators";

it("shows an event for 15 elapsed minutes, then drops it on refresh", () => {
  const at = Date.UTC(2026, 10, 12, 15);
  expect(isRecentScannerSignal(at, at - 1)).toBe(false);
  expect(isRecentScannerSignal(at, at)).toBe(true);
  expect(isRecentScannerSignal(at, at + 30_000)).toBe(true);
  expect(isRecentScannerSignal(at, at + 60_000)).toBe(true);
  expect(isRecentScannerSignal(at, at + 899_999)).toBe(true);
  expect(isRecentScannerSignal(at, at + 900_000)).toBe(false);
  expect(isRecentScannerSignal(at, at + 86_400_000)).toBe(false);
});

it("keeps EMA alignment after a recent crossover expires in each scanner timeframe", () => {
  const start = Date.UTC(2026, 10, 12, 9);
  const through = start + 360 * 60_000;
  const bars = Array.from({ length: 360 }, (_, i) => {
    const close = i < 355 ? 10 - i * 0.01 : 25;
    return { time: start / 1000 + i * 60, open: close, high: close + 0.1, low: close - 0.1, close, volume: 100 };
  });
  for (const frame of ["1m", "5m", "15m"] as const) {
    const result = scannerIndicatorResults(bars, frame, through).result!;
    const cross = result.signals?.averages;
    if (!cross) throw Error(`Missing EMA crossover on ${frame}`);
    expect(cross.kind, frame).toBe("emaBullishCross");
    expect(isRecentScannerSignal(cross.at, through), frame).toBe(true);
    expect(isRecentScannerSignal(cross.at, cross.at + 900_000), frame).toBe(false);
    expect(result.ema9!, frame).toBeGreaterThan(result.ema20!);
  }
});
