const US_EQUITY_TICKER_PATTERN = /^[A-Z]{1,5}(?:[.-][A-Z])?$/;

export function isUserFacingTickerSymbol(
  symbol: string | null | undefined,
): boolean {
  return US_EQUITY_TICKER_PATTERN.test(symbol?.trim().toUpperCase() ?? "");
}

export function userFacingTradeSymbol(
  symbol: string | null | undefined,
  fallback = "Selected trade",
): string {
  const normalized = symbol?.trim().toUpperCase() ?? "";

  return isUserFacingTickerSymbol(normalized) ? normalized : fallback;
}
