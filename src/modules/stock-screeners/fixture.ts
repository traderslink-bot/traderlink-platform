import { OPENING_RANGE_MINUTES, type Candidate, type MarketPack, type MarketSession, type Values } from "./contracts";
import { marketWindows, type Window } from "./market-metrics";

function exampleStructure(window: Window, price: number, index: number): Values {
  const elapsed = (window.asOf - window.from) / 60_000;
  if (elapsed < 5) return {};
  const vwapDistance = index % 7 - 3;
  const vwapPosition = Math.sign(vwapDistance);
  const values: Values = { sessionVwap: price / (1 + vwapDistance / 100), vwapDistance, vwapPosition };
  if (elapsed >= 10) values.vwapCross = index % 5 === 0 ? vwapPosition : 0;
  if (window.session === "regular" || window.session === "last_regular") {
    const center = price * (1 + (index % 3 - 1) * 0.06);
    for (const minutes of OPENING_RANGE_MINUTES) {
      if (elapsed < minutes) break;
      const high = center * (1 + minutes / 3_000);
      const low = center * (1 - minutes / 3_000);
      values[`or${minutes}High`] = high;
      values[`or${minutes}Low`] = low;
      values[`or${minutes}Width`] = (high / low - 1) * 100;
      if (elapsed > minutes) values[`or${minutes}Position`] = price > high ? 1 : price < low ? -1 : 0;
    }
  }
  return values;
}

/** Generated only for the authenticated development owner, without provider credentials. */
export function previewPack(now: number, size = 79): MarketPack {
  const date = new Date(now);
  const days = Array.from({ length: 40 }, (_, index) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate() - 30 + index)))
    .filter(day => day.getUTCDay() > 0 && day.getUTCDay() < 6)
    .map(day => ({ date: day.toISOString().slice(0, 10), open: "09:30", close: "16:00" }));
  const { latest, windows } = marketWindows(days, now);
  const stocks = [
    ["ARVX", "Arvex Therapeutics", 6.24, 19.2, 76e6], ["CBLX", "Cobalex Bio", 2.71, 12.4, 41e6],
    ["QZNT", "Quazent Systems", 16.38, 8.7, 180e6], ["VXLM", "Vexel Materials", 0.2884, 5.9, 18e6],
    ["DRQT", "Daro Quantum", 48.21, 2.4, 194e6], ["URXF", "Urex Research", 4.32, -24.1, 52e6],
    ["MLVB", "Millvale Energy", 0.8319, -6.5, 31e6], ["YVTX", "Yavant Holdings", 3.13, -4.1, 89e6],
  ] as const;
  const marketCapExamples = [2.8e6, 14e6, 280e6, undefined, 1.4e9, 6.8e9, 23e9, 780e9, 3.1e12];
  const snapshots = Object.fromEntries(Object.entries(windows).map(([key, window]) => {
    const rows: Candidate[] = Array.from({ length: size - 1 }, (_, index) => {
      const [symbol, name, initialPrice, initialChange, cap] = stocks[index % stocks.length];
      const price = index < stocks.length ? initialPrice : Number((0.68 + ((index * 157) % 3200) / 100).toFixed(2));
      const change = (index < stocks.length ? initialChange : (index * 17 % 45) - 16) * (key === "after_hours" ? 0.5 : 1);
      const volume = 62_000 + ((index * 91_727 + 821_000) % 1_810_000);
      const bid = price * (1 - (index + 5) / 10_000), ask = price * (1 + (index + 5) / 10_000);
      const dist50 = index % 4 ? 8.8 : -6.3, dist200 = index % 3 ? 12.7 : -9.5;
      const spread = key === "last_regular" ? {} : { bid, ask, spread: (index + 5) * 2, spreadDollar: ask - bid };
      const capValue = index < stocks.length ? cap : marketCapExamples[index % marketCapExamples.length];
      return {
        symbol: index < stocks.length ? symbol : "X" + String(index).padStart(3, "0"),
        name: index < stocks.length ? name : "Example company " + index,
        exchange: (["NASDAQ", "NYSE", "AMEX"] as const)[index % 3],
        priceAt: window.asOf,
        values: {
          price, change, ...(capValue === undefined ? {} : { cap: capValue }), volume,
          ...exampleStructure(window, price, index),
          relativeVolume: 0.25 + index % 45 / 10,
          ...(index % 13 === 0 ? { pressReleaseAge: 1 + index % 47 } : {}),
          dollarVolume: price * volume, avg10: volume / 2, avg20: volume / 3, avg50: volume / 4, avgDollar: price * volume / 3, trades: 100 + index * 17,
          open: price * 0.96, high: price * 1.03, low: price * 0.91, range: 13.2, fromHigh: 2.91, fromLow: 9.89,
          ...(key === "regular" || key === "last_regular" ? { openGap: change * 0.7 } : {}),
          week: change / 2, month: change * 1.25, quarter: change * 1.6, halfYear: change * 1.9, year: change * 2.2, ytd: change * 2,
          week52high: price * 1.04, week52low: price * 0.55, below52High: 3.846, above52Low: 81.818,
          sma20: price / 1.04, sma50: price / (1 + dist50 / 100), sma200: price / (1 + dist200 / 100),
          ema9: price * 0.98, ema20: price * 0.95, dist20: 4, dist50, dist200,
          rsi: 20 + (index * 7 % 65), atr: price * 0.08, atrPercent: 8, ...spread,
        },
      };
    });
    // One missing required observation verifies the unavailable-data state.
    rows.push({ symbol: "XNOD", name: "Example with missing prices", exchange: "NASDAQ", values: { cap: 62e6 } });
    return [key, { version: 2, source: "Preview data", date: window.date, universeDate: window.date,
      session: key, asOf: window.asOf, capturedAt: now, closed: window.closed, partial: false, rows }];
  })) as MarketPack["snapshots"];
  return { latest: latest as MarketSession, snapshots };
}
