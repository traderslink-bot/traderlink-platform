import {
  addExactDecimals,
  multiplyExactDecimals,
  subtractExactDecimals,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "./exact-decimal";
import type { ExactPrice } from "./exact-price";
import type { ExactQuantity } from "./exact-quantity";

declare const exactMoneyAmountBrand: unique symbol;
declare const currencyCodeBrand: unique symbol;

export type ExactMoneyAmount = CanonicalDecimal & {
  readonly [exactMoneyAmountBrand]: "ExactMoneyAmount";
};

export type CurrencyCode = string & {
  readonly [currencyCodeBrand]: "CurrencyCode";
};

export interface ExactMoney {
  amount: ExactMoneyAmount;
  currency: CurrencyCode;
}

export type CurrencyFailure = { code: "ti_v3_currency_invalid" };

const MONEY_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
});

export function parseCurrencyCode(
  input: unknown,
): ExactResult<CurrencyCode, CurrencyFailure> {
  if (typeof input !== "string" || !/^[A-Z]{3}$/.test(input)) {
    return { ok: false, error: { code: "ti_v3_currency_invalid" } };
  }
  return { ok: true, value: input as CurrencyCode };
}

export function parseExactMoneyAmount(
  input: unknown,
): ExactResult<ExactMoneyAmount> {
  const result = validateExactDecimal(input, MONEY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactMoneyAmount }
    : result;
}

export function parseExactMoney(
  amount: unknown,
  currency: unknown,
): ExactResult<ExactMoney, { code: string }> {
  const parsedAmount = parseExactMoneyAmount(amount);
  if (!parsedAmount.ok) {
    return parsedAmount;
  }
  const parsedCurrency = parseCurrencyCode(currency);
  if (!parsedCurrency.ok) {
    return parsedCurrency;
  }
  return {
    ok: true,
    value: { amount: parsedAmount.value, currency: parsedCurrency.value },
  };
}

export function addExactMoneyAmounts(
  left: ExactMoneyAmount,
  right: ExactMoneyAmount,
): ExactResult<ExactMoneyAmount> {
  const result = addExactDecimals(left, right, MONEY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactMoneyAmount }
    : result;
}

export function subtractExactMoneyAmounts(
  left: ExactMoneyAmount,
  right: ExactMoneyAmount,
): ExactResult<ExactMoneyAmount> {
  const result = subtractExactDecimals(left, right, MONEY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactMoneyAmount }
    : result;
}

export function multiplyPriceByQuantity(
  price: ExactPrice,
  quantity: ExactQuantity,
): ExactResult<ExactMoneyAmount> {
  const result = multiplyExactDecimals(price, quantity, MONEY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactMoneyAmount }
    : result;
}
