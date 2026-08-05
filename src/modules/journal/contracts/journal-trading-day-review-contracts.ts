export type JournalTradingDayReviewStatus = "reviewed" | "incomplete";

export type JournalTradingDayReviewRecord = Readonly<{
  revision: number;
  status: JournalTradingDayReviewStatus;
  tradingDate: string;
  updatedAtUtc: string;
}>;
