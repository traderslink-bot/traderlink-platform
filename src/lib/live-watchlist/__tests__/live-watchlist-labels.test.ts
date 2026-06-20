import { describe, expect, it } from "vitest";

import {
  formatMarketDataStatusLabel,
  formatTickerStatusLabel,
  formatTickerStatusTone,
} from "../live-watchlist-labels";

describe("live watchlist labels", () => {
  it("formats trader-facing market data status labels", () => {
    expect(formatMarketDataStatusLabel("live")).toBe("Live Data: ON");
    expect(formatMarketDataStatusLabel("stale")).toBe("Live Data: OFF");
    expect(formatMarketDataStatusLabel("offline")).toBe("Live Data: OFF");
    expect(formatMarketDataStatusLabel("starting")).toBe("Live Data: OFF");
  });

  it("formats ticker status labels without exposing internal stream state", () => {
    expect(formatTickerStatusLabel("live")).toBe("Ticker Data: Live (slight delay)");
    expect(formatTickerStatusLabel("stale")).toBe("Ticker Data: off");
    expect(formatTickerStatusLabel("deactivated")).toBe("Ticker Data: off");
    expect(formatTickerStatusTone("live")).toBe("live");
    expect(formatTickerStatusTone("stale")).toBe("off");
    expect(formatTickerStatusTone("deactivated")).toBe("off");
  });
});
