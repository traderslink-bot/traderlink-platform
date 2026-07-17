import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  formatMarketDataStatusLabel,
  formatTickerStatusLabel,
  formatTickerStatusTone,
} from "../live-watchlist-labels";

describe("live watchlist labels", () => {
  it("formats trader-facing market data status labels", () => {
    expect(formatMarketDataStatusLabel("live")).toBe("Live Data: ON");
    expect(formatMarketDataStatusLabel("stale")).toBe("Live Data: STALE");
    expect(formatMarketDataStatusLabel("offline")).toBe("Live Data: OFF");
    expect(formatMarketDataStatusLabel("starting")).toBe("Live Data: STARTING");
  });

  it("formats ticker status labels without exposing internal stream state", () => {
    expect(formatTickerStatusLabel("live")).toBe("Live Ticker Data: On");
    expect(formatTickerStatusLabel("stale")).toBe("Live Ticker Data: Stale");
    expect(formatTickerStatusLabel("offline")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusLabel("starting")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusLabel("deactivated")).toBe("Live Ticker Data: Off");
    expect(formatTickerStatusTone("live")).toBe("live");
    expect(formatTickerStatusTone("stale")).toBe("stale");
    expect(formatTickerStatusTone("offline")).toBe("off");
    expect(formatTickerStatusTone("starting")).toBe("off");
    expect(formatTickerStatusTone("deactivated")).toBe("off");
  });

  it("styles starting market data as a warning state instead of an off state", () => {
    const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");
    const positiveBlock = css.match(
      /\.watchlist-summary-panel span\[data-market-data-status="live"\][\s\S]*?color: var\(--academy-positive\);/,
    )?.[0] ?? "";
    const negativeBlock = css.match(
      /\.watchlist-summary-panel span\[data-market-data-status="offline"\][\s\S]*?color: var\(--academy-negative\);/,
    )?.[0] ?? "";
    const warningBlock = css.match(
      /\.watchlist-summary-panel span\[data-market-data-status="starting"\][\s\S]*?color: var\(--academy-warning\);/,
    )?.[0] ?? "";
    const staleWarningBlock = css.match(
      /\.watchlist-summary-panel span\[data-market-data-status="stale"\][\s\S]*?color: var\(--academy-warning\);/,
    )?.[0] ?? "";

    expect(positiveBlock).not.toContain('data-market-data-status="starting"');
    expect(negativeBlock).not.toContain('data-market-data-status="starting"');
    expect(warningBlock).toContain('data-market-data-status="starting"');
    expect(staleWarningBlock).toContain('data-market-data-status="stale"');
  });
});
