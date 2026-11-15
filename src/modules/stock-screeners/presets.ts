import { DEFAULT_DEFINITION, type Definition, type Metric, type Rule } from "./contracts";

const atLeast = (metric: Metric, value: number): Rule => ({ metric, operator: "gte", value });
const atMost = (metric: Metric, value: number): Rule => ({ metric, operator: "lte", value });
const exact = (metric: Metric, value: number): Rule => ({ metric, operator: "eq", value });
const price = (value: number, upper: number): Rule => ({ metric: "price", operator: "between", value, upper });
const liquid = atLeast("avgDollar", 1e6);
const rangeColumns: Metric[] = ["price", "or15Position", "or15High", "or15Low", "volume"];
const vwapColumns: Metric[] = ["price", "sessionVwap", "vwapPosition", "vwapDistance", "volume"];
const vwapCrossColumns: Metric[] = ["price", "sessionVwap", "vwapCross", "vwapDistance", "volume"];

function preset(id: string, name: string, session: Definition["session"], rules: Rule[], metric: Metric, extra?: Metric[], dir: "asc" | "desc" = "desc") {
  return { id, name, definition: { ...DEFAULT_DEFINITION, session, rules, sort: { metric, dir }, columns: extra ?? DEFAULT_DEFINITION.columns } };
}

export const PRESETS = [
  preset("leaders", "Regular leaders", "regular", [atLeast("change", 3), atLeast("volume", 250_000)], "change"),
  preset("laggards", "Regular laggards", "regular", [atMost("change", -3), atLeast("volume", 250_000)], "change", undefined, "asc"),
  preset("gaps", "Premarket gappers", "premarket", [price(1, 30), atLeast("change", 5), atLeast("volume", 100_000)], "change"),
  preset("gap-down", "Premarket gap down", "premarket", [price(1, 30), atMost("change", -5), atLeast("volume", 100_000)], "change", undefined, "asc"),
  preset("active", "Most active", "latest", [], "volume"),
  preset("dollar", "Dollar volume leaders", "latest", [], "dollarVolume"),
  preset("unusual-volume", "Unusual volume", "latest", [atLeast("relativeVolume", 2), atLeast("volume", 100_000)], "relativeVolume",
    ["price", "change", "relativeVolume", "volume", "cap"]),
  preset("recent-pr", "Recent press releases", "latest", [atMost("pressReleaseAge", 24)], "pressReleaseAge",
    ["price", "change", "pressReleaseAge", "volume", "cap"], "asc"),
  preset("or15-above", "Above 15m opening range", "regular", [exact("or15Position", 1)], "volume", rangeColumns),
  preset("or15-below", "Below 15m opening range", "regular", [exact("or15Position", -1)], "volume", rangeColumns),
  preset("vwap-above", "Above session VWAP", "latest", [exact("vwapPosition", 1)], "vwapDistance", vwapColumns),
  preset("vwap-below", "Below session VWAP", "latest", [exact("vwapPosition", -1)], "vwapDistance", vwapColumns, "asc"),
  preset("vwap-reclaim", "VWAP reclaim · last 5m", "latest", [exact("vwapCross", 1)], "volume", vwapCrossColumns),
  preset("vwap-reject", "VWAP rejection · last 5m", "latest", [exact("vwapCross", -1)], "volume", vwapCrossColumns),
  preset("liquid", "Liquid under $10", "latest", [price(0.5, 10), liquid], "avgDollar", ["price", "change", "volume", "avgDollar", "cap"]),
  preset("tight", "Tight spreads", "latest", [price(0.5, 10), liquid, atMost("spread", 50)], "spread", ["price", "bid", "ask", "spread", "avgDollar"], "asc"),
  preset("after-up", "After-hours gainers", "after_hours", [atLeast("change", 3), atLeast("volume", 50_000)], "change"),
  preset("after-down", "After-hours decliners", "after_hours", [atMost("change", -3), atLeast("volume", 50_000)], "change", undefined, "asc"),
  preset("swing", "Swing uptrend", "last_regular", [atLeast("dist50", 0), atLeast("dist200", 0)], "month", ["price", "month", "dist50", "dist200", "cap"]),
  preset("highs", "Near 52-week high", "last_regular", [atMost("below52High", 5), atLeast("dist50", 0)], "below52High",
    ["price", "week52high", "below52High", "month", "volume"], "asc"),
  preset("oversold", "Oversold", "last_regular", [atMost("rsi", 30), liquid], "rsi", ["price", "change", "rsi", "atrPercent", "volume"], "asc"),
  preset("high-atr", "High ATR", "last_regular", [liquid], "atrPercent", ["price", "change", "atr", "atrPercent", "avgDollar"]),
];

export const COLUMN_SETS: { name: string; columns: Metric[] }[] = [
  { name: "Summary", columns: DEFAULT_DEFINITION.columns },
  { name: "Liquidity", columns: ["price", "volume", "dollarVolume", "avg20", "spread"] },
  { name: "Performance", columns: ["price", "change", "week", "month", "quarter", "ytd"] },
  { name: "Technicals", columns: ["price", "dist20", "dist50", "dist200", "atrPercent", "rsi"] },
  { name: "Opening range", columns: rangeColumns },
  { name: "VWAP", columns: vwapColumns },
  { name: "Catalysts", columns: ["price", "change", "pressReleaseAge", "relativeVolume", "volume"] },
];
