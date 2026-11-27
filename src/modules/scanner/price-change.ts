import Decimal from "decimal.js";

/** Percent change between prices. Decimal price thresholds include exact equality. */
export function priceChangePercent(price: number, reference: number): number {
  if (price === reference) return 0;
  const scale = 1_000_000;
  const current = Math.round(price * scale);
  const base = Math.round(reference * scale);
  const numerator = (current - base) * 100;
  if (Number.isSafeInteger(current) && Number.isSafeInteger(base) && Number.isSafeInteger(numerator) &&
      base > 0 && current / scale === price && base / scale === reference) {
    return numerator / base;
  }
  return new Decimal(price).minus(reference).times(100).div(reference).toNumber();
}
