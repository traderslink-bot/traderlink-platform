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

export function userFacingTradeDirection(
  value: string | null | undefined,
): string {
  if (value === "short") {
    return "Limited sell-side review";
  }

  if (value === "long") {
    return "Long trade";
  }

  return value ? value.replaceAll("_", " ") : "Unknown direction";
}

export function sellStartingReviewLimitationCopy(): string {
  return "This saved item starts with a sell-side execution. The app can replay the position history, but full short-trade coaching is not supported yet.";
}
