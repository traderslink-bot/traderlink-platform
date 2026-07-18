import {
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "./exact-decimal";

declare const exactChargeBrand: unique symbol;

export type ExactCharge = CanonicalDecimal & {
  readonly [exactChargeBrand]: "ExactCharge";
};

const CHARGE_BOUNDS = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
});

export function parseExactCharge(input: unknown): ExactResult<ExactCharge> {
  const result = validateExactDecimal(input, CHARGE_BOUNDS);
  return result.ok ? { ok: true, value: result.value as ExactCharge } : result;
}
