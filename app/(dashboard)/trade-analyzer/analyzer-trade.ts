export const ANALYZED_TRADES_HREF = "/analytics/trade-analyzer/day/trades";

export type AnalyzerTrade = Readonly<{
  id: string;
  symbol: string;
  direction: "long" | "short";
  currency: string;
  entryDate: string;
  openedAtUtc: string;
  closed: boolean;
  canAnalyze: boolean;
  executions: readonly Readonly<{
    localDate: string;
    localTime: string;
    sourceTimezone: string;
    side: "buy" | "sell";
    quantity: string;
    price: string | null;
  }>[];
}>;

export function analyzerTradeHref(id: string, interval = "1m", event?: string | null, basis?: "gross" | "net") {
  const params = new URLSearchParams({ trade: id });
  if (interval === "5m") params.set("interval", interval);
  if (event) params.set("event", event);
  if (basis) params.set("basis", basis);
  return `/trade-analyzer?${params}`;
}
