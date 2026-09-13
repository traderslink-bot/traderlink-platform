export const TRADE_INDICATOR_CALCULATION_VERSION = "trade_indicator_context_v3" as const;

export function hasCurrentTradeIndicatorContext(value: unknown): boolean {
  return value !== null && typeof value === "object" &&
    "calculationVersion" in value && value.calculationVersion === TRADE_INDICATOR_CALCULATION_VERSION;
}
