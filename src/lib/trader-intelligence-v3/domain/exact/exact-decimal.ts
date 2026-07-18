import Decimal from "decimal.js";

export const EXACT_DECIMAL_POLICY_VERSION = "ti_v3_exact_decimal_v1" as const;

export type ExactDecimalFailureCode =
  | "ti_v3_decimal_input_not_string"
  | "ti_v3_decimal_raw_length_exceeded"
  | "ti_v3_decimal_empty"
  | "ti_v3_decimal_whitespace_forbidden"
  | "ti_v3_decimal_exponent_forbidden"
  | "ti_v3_decimal_locale_format_forbidden"
  | "ti_v3_decimal_non_finite_forbidden"
  | "ti_v3_decimal_hex_forbidden"
  | "ti_v3_decimal_malformed"
  | "ti_v3_decimal_precision_exceeded"
  | "ti_v3_decimal_scale_exceeded"
  | "ti_v3_decimal_negative_forbidden"
  | "ti_v3_decimal_zero_forbidden"
  | "ti_v3_decimal_overflow";

export interface ExactDecimalFailure {
  code: ExactDecimalFailureCode;
}

export type ExactResult<T, E = ExactDecimalFailure> =
  | { ok: true; value: T }
  | { ok: false; error: E };

declare const canonicalDecimalBrand: unique symbol;

export type CanonicalDecimal = string & {
  readonly [canonicalDecimalBrand]: "CanonicalDecimal";
};

export interface ExactDecimalBounds {
  maximumSignificantDigits: number;
  maximumScale: number;
  allowNegative: boolean;
  allowZero: boolean;
}

export const GENERAL_EXACT_DECIMAL_BOUNDS: ExactDecimalBounds = Object.freeze({
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
});

export const MAXIMUM_EXACT_DECIMAL_RAW_CHARACTERS = 256;

const ExactDecimalImplementation = Decimal.clone({
  precision: 128,
  rounding: Decimal.ROUND_HALF_EVEN,
  toExpNeg: -1_000_000_000,
  toExpPos: 1_000_000_000,
});

function failure(code: ExactDecimalFailureCode): ExactResult<never> {
  return { ok: false, error: { code } };
}

function inputFailure(input: unknown): ExactDecimalFailureCode | null {
  if (typeof input !== "string") {
    return "ti_v3_decimal_input_not_string";
  }
  if (input.length === 0) {
    return "ti_v3_decimal_empty";
  }
  if (input.length > MAXIMUM_EXACT_DECIMAL_RAW_CHARACTERS) {
    return "ti_v3_decimal_raw_length_exceeded";
  }
  if (/\s/.test(input)) {
    return "ti_v3_decimal_whitespace_forbidden";
  }
  if (/[eE]/.test(input)) {
    return "ti_v3_decimal_exponent_forbidden";
  }
  if (input.includes(",")) {
    return "ti_v3_decimal_locale_format_forbidden";
  }
  if (/^(?:[+-]?(?:NaN|Infinity))$/i.test(input)) {
    return "ti_v3_decimal_non_finite_forbidden";
  }
  if (/^[+-]?0[xX]/.test(input)) {
    return "ti_v3_decimal_hex_forbidden";
  }
  if (!/^-?(?:0|[0-9]+)(?:\.[0-9]+)?$/.test(input)) {
    return "ti_v3_decimal_malformed";
  }
  return null;
}

function canonicalSignificantDigits(value: string): number {
  if (value === "0") {
    return 1;
  }
  return value.replace("-", "").replace(".", "").replace(/^0+/, "").length;
}

export function validateExactDecimal(
  input: unknown,
  bounds: ExactDecimalBounds = GENERAL_EXACT_DECIMAL_BOUNDS,
): ExactResult<CanonicalDecimal> {
  const lexicalFailure = inputFailure(input);
  if (lexicalFailure !== null) {
    return failure(lexicalFailure);
  }

  const value = input as string;
  const inputScale = value.includes(".") ? value.length - value.indexOf(".") - 1 : 0;
  if (inputScale > bounds.maximumScale) {
    return failure("ti_v3_decimal_scale_exceeded");
  }

  try {
    const decimal = new ExactDecimalImplementation(value);
    if (!decimal.isFinite()) {
      return failure("ti_v3_decimal_non_finite_forbidden");
    }
    if (!bounds.allowNegative && decimal.isNegative() && !decimal.isZero()) {
      return failure("ti_v3_decimal_negative_forbidden");
    }
    if (!bounds.allowZero && decimal.isZero()) {
      return failure("ti_v3_decimal_zero_forbidden");
    }
    const canonical = decimal.isZero() ? "0" : decimal.toFixed();
    if (canonicalSignificantDigits(canonical) > bounds.maximumSignificantDigits) {
      return failure("ti_v3_decimal_precision_exceeded");
    }
    const canonicalScale = canonical.includes(".")
      ? canonical.length - canonical.indexOf(".") - 1
      : 0;
    if (canonicalScale > bounds.maximumScale) {
      return failure("ti_v3_decimal_scale_exceeded");
    }
    return { ok: true, value: canonical as CanonicalDecimal };
  } catch {
    return failure("ti_v3_decimal_overflow");
  }
}

function binaryOperation(
  left: CanonicalDecimal,
  right: CanonicalDecimal,
  bounds: ExactDecimalBounds,
  operation: "add" | "subtract" | "multiply",
): ExactResult<CanonicalDecimal> {
  try {
    const leftValue = new ExactDecimalImplementation(left);
    const rightValue = new ExactDecimalImplementation(right);
    const result =
      operation === "add"
        ? leftValue.plus(rightValue)
        : operation === "subtract"
          ? leftValue.minus(rightValue)
          : leftValue.times(rightValue);
    return validateExactDecimal(result.isZero() ? "0" : result.toFixed(), bounds);
  } catch {
    return failure("ti_v3_decimal_overflow");
  }
}

export function addExactDecimals(
  left: CanonicalDecimal,
  right: CanonicalDecimal,
  bounds: ExactDecimalBounds = GENERAL_EXACT_DECIMAL_BOUNDS,
): ExactResult<CanonicalDecimal> {
  return binaryOperation(left, right, bounds, "add");
}

export function subtractExactDecimals(
  left: CanonicalDecimal,
  right: CanonicalDecimal,
  bounds: ExactDecimalBounds = GENERAL_EXACT_DECIMAL_BOUNDS,
): ExactResult<CanonicalDecimal> {
  return binaryOperation(left, right, bounds, "subtract");
}

export function multiplyExactDecimals(
  left: CanonicalDecimal,
  right: CanonicalDecimal,
  bounds: ExactDecimalBounds = GENERAL_EXACT_DECIMAL_BOUNDS,
): ExactResult<CanonicalDecimal> {
  return binaryOperation(left, right, bounds, "multiply");
}

export function compareExactDecimals(
  left: CanonicalDecimal,
  right: CanonicalDecimal,
): -1 | 0 | 1 {
  const comparison = new ExactDecimalImplementation(left).comparedTo(
    new ExactDecimalImplementation(right),
  );
  return comparison < 0 ? -1 : comparison > 0 ? 1 : 0;
}

export function negateExactDecimal(
  value: CanonicalDecimal,
  bounds: ExactDecimalBounds = GENERAL_EXACT_DECIMAL_BOUNDS,
): ExactResult<CanonicalDecimal> {
  return subtractExactDecimals("0" as CanonicalDecimal, value, bounds);
}
