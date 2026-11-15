import type { JournalTradingDayReviewRecord } from "./journal-trading-day-review-contracts";

export const chartJournalAccountHeader = "x-traderlink-chart-journal-account";
export const chartJournalNoteLimit = 2_000;

export type ChartJournalFill = Readonly<{
  id: string;
  symbol: string;
  executedAt: string;
  price: string | null;
  quantity: string;
  currency: string;
  side: "buy" | "sell";
  tradeIds: readonly string[];
}>;

export type ChartJournalTrade = Readonly<{
  id: string;
  roundTripId: string;
  memberIds: readonly string[];
  symbol: string;
  openedAt: string;
  closedAt: string | null;
  direction: "long" | "short";
  currency: string;
  shareBalance: string;
  style: "day_trade" | "swing";
  positionRef: string | null;
}>;

export type ChartJournalPlan = Readonly<{
  drawingId: string;
  direction: "long" | "short";
  entry: string;
  stop: string;
  target: string;
  priceBasisDate: string;
}>;

export type ChartJournalItem = Readonly<{
  id: string;
  kind: "note" | "plan";
  symbol: string;
  at: string;
  day: string;
  text: string;
  plan: ChartJournalPlan | null;
  roundTripId: string | null;
  revision: number;
}>;

export type ChartJournalSession = Readonly<{
  accountName: string;
  accountCurrency: string;
  accountTimezone: string;
  offlineScopeRef: string;
  dayReview: JournalTradingDayReviewRecord | null;
  day: string;
  fills: readonly ChartJournalFill[];
  trades: readonly ChartJournalTrade[];
  openPositions: readonly ChartJournalTrade[];
  items: readonly ChartJournalItem[];
  moreFills: boolean;
  moreNotes: boolean;
}>;

export type ChartJournalSelection = Readonly<{ time: number; price: number | null; estimated: boolean }>;

export type ChartJournalOverlay = Readonly<{
  id: string;
  time: number;
  kind: ChartJournalFill["side"] | "note";
}>;

export type ChartJournalPlotMode = "fills" | "notes" | "both";
export type ChartJournalPlot = Readonly<{
  fills: readonly Pick<ChartJournalFill, "id" | "executedAt" | "side">[];
  notes: readonly ChartJournalItem[];
}>;
