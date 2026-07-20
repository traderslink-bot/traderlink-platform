import {
  addExactDecimals,
  compareExactDecimals,
  subtractExactDecimals,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "./exact-decimal";

declare const exactQuantityBrand: unique symbol;
declare const exactSignedQuantityBrand: unique symbol;

export type ExactQuantity = CanonicalDecimal & {
  readonly [exactQuantityBrand]: "ExactQuantity";
};

export type ExactSignedQuantity = CanonicalDecimal & {
  readonly [exactSignedQuantityBrand]: "ExactSignedQuantity";
};

const QUANTITY_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 12,
  allowNegative: false,
  allowZero: true,
});

const ACCEPTED_EXECUTION_QUANTITY_BOUNDS = Object.freeze({
  ...QUANTITY_BOUNDS,
  allowZero: false,
});

const SIGNED_QUANTITY_BOUNDS = Object.freeze({
  ...QUANTITY_BOUNDS,
  allowNegative: true,
});

export function parseExactQuantity(input: unknown): ExactResult<ExactQuantity> {
  const result = validateExactDecimal(input, QUANTITY_BOUNDS);
  return result.ok ? { ok: true, value: result.value as ExactQuantity } : result;
}

export function parseAcceptedExecutionQuantity(
  input: unknown,
): ExactResult<ExactQuantity> {
  const result = validateExactDecimal(input, ACCEPTED_EXECUTION_QUANTITY_BOUNDS);
  return result.ok ? { ok: true, value: result.value as ExactQuantity } : result;
}

export function parseExactSignedQuantity(
  input: unknown,
): ExactResult<ExactSignedQuantity> {
  const result = validateExactDecimal(input, SIGNED_QUANTITY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactSignedQuantity }
    : result;
}

export function addExactSignedQuantities(
  left: ExactSignedQuantity,
  right: ExactSignedQuantity,
): ExactResult<ExactSignedQuantity> {
  const result = addExactDecimals(left, right, SIGNED_QUANTITY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactSignedQuantity }
    : result;
}

export function subtractExactSignedQuantities(
  left: ExactSignedQuantity,
  right: ExactSignedQuantity,
): ExactResult<ExactSignedQuantity> {
  const result = subtractExactDecimals(left, right, SIGNED_QUANTITY_BOUNDS);
  return result.ok
    ? { ok: true, value: result.value as ExactSignedQuantity }
    : result;
}

export function compareExactQuantities(
  left: ExactQuantity | ExactSignedQuantity,
  right: ExactQuantity | ExactSignedQuantity,
): -1 | 0 | 1 {
  return compareExactDecimals(left, right);
}

export function signedQuantityFromQuantity(
  value: ExactQuantity,
): ExactSignedQuantity {
  return value as unknown as ExactSignedQuantity;
}
