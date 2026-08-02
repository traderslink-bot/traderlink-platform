import Decimal from "decimal.js";

import { assertCanonicalJournalDecimal } from "../../contracts/journal-storage-values";

const ExactDecimal = Decimal.clone({
  precision: 160,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -1000,
  toExpPos: 1000,
});

function canonical(value: Decimal): string {
  const normalized = value.isZero() ? "0" : value.toFixed();
  assertCanonicalJournalDecimal(normalized, "decimalResult");
  return normalized;
}

export function addDecimal(left: string, right: string): string {
  return canonical(new ExactDecimal(left).plus(new ExactDecimal(right)));
}

export function subtractDecimal(left: string, right: string): string {
  return canonical(new ExactDecimal(left).minus(new ExactDecimal(right)));
}

export function absoluteDecimal(value: string): string {
  return canonical(new ExactDecimal(value).abs());
}

export function compareDecimal(left: string, right: string): number {
  return new ExactDecimal(left).comparedTo(new ExactDecimal(right));
}

export function negateDecimal(value: string): string {
  return canonical(new ExactDecimal(value).negated());
}
