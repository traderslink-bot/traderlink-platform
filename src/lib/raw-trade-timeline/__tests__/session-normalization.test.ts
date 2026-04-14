import { describe, expect, it } from "vitest";
import { normalizeCandle } from "../normalizers/normalize-candle";
import {
  isMarketOpenSessionBucket,
  normalizeOptionalSessionBucketValue,
  normalizeSessionBucketValue,
} from "../session/normalize-session-bucket";

describe("session normalization boundary", () => {
  it("maps known provider session aliases into canonical internal buckets", () => {
    expect(normalizeSessionBucketValue("open")).toBe("market_open");
    expect(normalizeSessionBucketValue("regular_open")).toBe("market_open");
    expect(normalizeSessionBucketValue("premarket")).toBe("pre_market");
    expect(normalizeSessionBucketValue("afterhours")).toBe("after_hours");
  });

  it("maps unknown provider session labels into explicit unknown", () => {
    expect(normalizeSessionBucketValue("auction")).toBe("unknown");
    expect(normalizeOptionalSessionBucketValue("custom_vendor_label")).toBe(
      "unknown",
    );
  });

  it("normalizes candle session buckets before they enter Layer 1", () => {
    const candle = normalizeCandle({
      symbol: "ABCD",
      timestamp: "2024-04-12T13:30:00.000Z",
      timeframe: "1m",
      open: 1,
      high: 1.05,
      low: 0.99,
      close: 1.04,
      volume: 10000,
      sessionBucket: "open",
    });

    expect(candle.sessionBucket).toBe("market_open");
    expect(isMarketOpenSessionBucket(candle.sessionBucket)).toBe(true);
  });
});
