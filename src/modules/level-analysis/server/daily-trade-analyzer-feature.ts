/**
 * Deliberately disabled until Yahoo extended-hours coverage is proven against
 * the required execution and post-exit windows. Retain the implementation so
 * it can be resumed without rebuilding the Journal integration.
 */
export function dailyTradeYahooAnalyzerEnabled(
  environment: NodeJS.ProcessEnv = process.env,
): boolean {
  return environment.TRADERLINK_PLATFORM_DAILY_TRADE_YAHOO_ANALYZER_ENABLED === "true";
}
