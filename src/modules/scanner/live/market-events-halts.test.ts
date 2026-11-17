import { describe, expect, it } from "vitest";

import { selectActiveScannerHalts } from "./active-halts";
import type { ScannerActiveHalt } from "./contracts";
import { selectMarketEventsHalts } from "./market-events-halts";

const tradingDate = "2026-11-16";
const at = (time: string) => Date.parse(`${tradingDate}T${time}-05:00`);
const airi = {
  id: "airi", source: "alpaca", halted: true, ticker: "AIRI", market: "AMEX",
  haltTimeEt: "15:21:40.106", haltedAtUtc: "2026-11-16T20:21:40.106Z",
  reasonCode: "P", reason: "News pending", quoteTimeEt: null, tradeTimeEt: null,
} satisfies ScannerActiveHalt;
const ccel = {
  ...airi, id: "ccel", ticker: "CCEL", haltTimeEt: "15:53:54.946",
  haltedAtUtc: "2026-11-16T20:53:54.946Z", reasonCode: "M", reason: "Volatility pause",
  quoteTimeEt: "16:00:00", quoteTimeScheduled: true, tradeTimeEt: "16:00:00", tradeTimeScheduled: true,
} satisfies ScannerActiveHalt;

describe("Market Events halt alerts", () => {
  it("expires CCEL at 4 p.m. and AIRI one hour after the halt while retaining their incoming pause status", () => {
    const rows = selectActiveScannerHalts([ccel, airi], new Date(at("15:59:59.999")));
    expect(selectMarketEventsHalts(rows, tradingDate, at("15:59:59.999"))).toEqual({
      rows, nextExpiryAt: at("16:00:00"),
    });
    const expected = rows.filter(row => row.ticker === "AIRI");
    expect(selectMarketEventsHalts(rows, tradingDate, at("16:00:00"))).toEqual({
      rows: expected, nextExpiryAt: at("16:21:40.106"),
    });
    expect(selectMarketEventsHalts(rows, tradingDate, at("16:21:40.106")).rows).toEqual([]);
    expect(selectActiveScannerHalts([ccel, airi], new Date(at("20:45:00"))).map(row => row.ticker)).toEqual(["CCEL", "AIRI"]);
  });

  it("clears a recent halt at post-market close and does not carry it into the next trading day", () => {
    const late = { ...airi, haltedAtUtc: undefined, haltTimeEt: "19:45:00" };
    expect(selectMarketEventsHalts([late], tradingDate, at("19:59:59"))).toEqual({
      rows: [late], nextExpiryAt: at("20:00:00"),
    });
    expect(selectMarketEventsHalts([late], tradingDate, at("20:00:00")).rows).toEqual([]);
    expect(selectMarketEventsHalts([late], tradingDate, Date.parse("2026-11-17T19:50:00-05:00")).rows).toEqual([]);
    expect(selectMarketEventsHalts([late], tradingDate, at("19:50:00"), true).rows).toEqual([]);
    const stale = { ...airi, haltedAtUtc: "2026-11-15T20:21:40.106Z" };
    expect(selectMarketEventsHalts([stale], tradingDate, at("15:30:00")).rows).toEqual([]);
  });

  it("keeps a quote-only resume or earlier-cycle trade time from suppressing an active alert", () => {
    const row = { ...airi, haltTimeEt: "—", quoteTimeEt: "15:35:00", tradeTimeEt: "15:15:00" };
    expect(selectMarketEventsHalts([row], tradingDate, at("15:40:00"))).toEqual({
      rows: [row], nextExpiryAt: at("16:21:40.106"),
    });
    expect(selectMarketEventsHalts([{ ...row, halted: false }], tradingDate, at("15:40:00")).rows).toEqual([]);
  });
});
