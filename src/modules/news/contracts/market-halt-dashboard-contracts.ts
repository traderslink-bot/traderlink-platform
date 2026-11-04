export type MarketHaltDashboardRow = Readonly<{
  id: string;
  ticker: string;
  market: string;
  haltTimeEt: string;
  reasonCode: string;
  reason: string;
  quoteTimeEt: string | null;
  tradeTimeEt: string | null;
  source: "nasdaq" | "nyse";
  sourceUrl: string;
}>;

export type MarketHaltDashboardReadModel = Readonly<{
  tradingDate: string;
  updatedAtUtc: string | null;
  rows: readonly MarketHaltDashboardRow[];
}>;
