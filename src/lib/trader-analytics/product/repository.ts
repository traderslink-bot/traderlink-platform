import type {
  SavedExecutionTrade,
  SavedExecutionTradeId,
  SavedTraderAnalyticsReport,
  SavedTraderAnalyticsReportId,
  SavedTraderAnalyticsRepository,
  TraderAnalyticsUserId,
} from "./types";

export class InMemorySavedTraderAnalyticsRepository
  implements SavedTraderAnalyticsRepository
{
  private readonly trades = new Map<SavedExecutionTradeId, SavedExecutionTrade>();
  private readonly reports = new Map<
    SavedTraderAnalyticsReportId,
    SavedTraderAnalyticsReport
  >();

  constructor(args?: {
    trades?: SavedExecutionTrade[];
    reports?: SavedTraderAnalyticsReport[];
  }) {
    for (const trade of args?.trades ?? []) {
      this.saveTrade(trade);
    }

    for (const report of args?.reports ?? []) {
      this.saveReport(report);
    }
  }

  listTrades(userId: TraderAnalyticsUserId): SavedExecutionTrade[] {
    return [...this.trades.values()]
      .filter((trade) => trade.userId === userId)
      .sort((left, right) =>
        left.sessionDate === right.sessionDate
          ? left.id.localeCompare(right.id)
          : left.sessionDate.localeCompare(right.sessionDate),
      );
  }

  getTrade(
    userId: TraderAnalyticsUserId,
    tradeId: SavedExecutionTradeId,
  ): SavedExecutionTrade | null {
    const trade = this.trades.get(tradeId);

    return trade && trade.userId === userId ? trade : null;
  }

  saveTrade(trade: SavedExecutionTrade): void {
    this.trades.set(trade.id, trade);
  }

  listReports(userId: TraderAnalyticsUserId): SavedTraderAnalyticsReport[] {
    return [...this.reports.values()]
      .filter((report) => report.userId === userId)
      .sort((left, right) => right.generatedAt.localeCompare(left.generatedAt));
  }

  getReport(
    userId: TraderAnalyticsUserId,
    reportId: SavedTraderAnalyticsReportId,
  ): SavedTraderAnalyticsReport | null {
    const report = this.reports.get(reportId);

    return report && report.userId === userId ? report : null;
  }

  saveReport(report: SavedTraderAnalyticsReport): void {
    this.reports.set(report.id, report);
  }
}
