import {
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "./exact-decimal";

declare const exactPriceBrand: unique symbol;

export type ExactPrice = CanonicalDecimal & {
  readonly [exactPriceBrand]: "ExactPrice";
};

const PRICE_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 12,
  allowNegative: false,
  allowZero: true,
});

export function parseExactPrice(input: unknown): ExactResult<ExactPrice> {
  const result = validateExactDecimal(input, PRICE_BOUNDS);
  return result.ok ? { ok: true, value: result.value as ExactPrice } : result;
}
