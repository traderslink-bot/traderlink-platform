import {
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactDecimalBounds,
  type ExactResult,
} from "./exact-decimal";

export const EXACT_RATIO_POLICY_VERSION = "ti_v3_exact_ratio_v1" as const;
export const EXACT_RATIO_ROUNDING_POLICY_VERSION =
  "ti_v3_round_half_even_v1" as const;

declare const exactRatioBrand: unique symbol;

export interface ExactRatio {
  numerator: string;
  denominator: string;
  readonly [exactRatioBrand]: "ExactRatio";
}

export type ExactRatioFailureCode =
  | "ti_v3_ratio_numerator_invalid"
  | "ti_v3_ratio_denominator_invalid"
  | "ti_v3_ratio_denominator_zero"
  | "ti_v3_ratio_input_too_large"
  | "ti_v3_ratio_rounding_policy_invalid"
  | "ti_v3_ratio_rounding_scale_invalid";

export interface ExactRatioFailure {
  code: ExactRatioFailureCode;
}

export interface ExactRatioRoundingPolicy {
  version: typeof EXACT_RATIO_ROUNDING_POLICY_VERSION;
  scale: number;
  bounds: ExactDecimalBounds;
}

function gcd(left: bigint, right: bigint): bigint {
  let a = left < BigInt(0) ? -left : left;
  let b = right < BigInt(0) ? -right : right;
  while (b !== BigInt(0)) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function integerDigits(value: string): number {
  return value.startsWith("-") ? value.length - 1 : value.length;
}

export function createExactRatio(
  numeratorInput: string,
  denominatorInput: string,
): ExactResult<ExactRatio, ExactRatioFailure> {
  if (!/^-?(?:0|[1-9][0-9]*)$/.test(numeratorInput)) {
    return { ok: false, error: { code: "ti_v3_ratio_numerator_invalid" } };
  }
  if (!/^-?(?:0|[1-9][0-9]*)$/.test(denominatorInput)) {
    return { ok: false, error: { code: "ti_v3_ratio_denominator_invalid" } };
  }
  if (integerDigits(numeratorInput) > 256 || integerDigits(denominatorInput) > 256) {
    return { ok: false, error: { code: "ti_v3_ratio_input_too_large" } };
  }
  let numerator = BigInt(numeratorInput);
  let denominator = BigInt(denominatorInput);
  if (denominator === BigInt(0)) {
    return { ok: false, error: { code: "ti_v3_ratio_denominator_zero" } };
  }
  if (numerator === BigInt(0)) {
    return {
      ok: true,
      value: { numerator: "0", denominator: "1" } as ExactRatio,
    };
  }
  if (denominator < BigInt(0)) {
    numerator = -numerator;
    denominator = -denominator;
  }
  const divisor = gcd(numerator, denominator);
  return {
    ok: true,
    value: {
      numerator: (numerator / divisor).toString(),
      denominator: (denominator / divisor).toString(),
    } as ExactRatio,
  };
}

export function canonicalExactRatio(value: ExactRatio): string {
  return `${value.numerator}/${value.denominator}`;
}

export function compareExactRatios(left: ExactRatio, right: ExactRatio): -1 | 0 | 1 {
  const comparison =
    BigInt(left.numerator) * BigInt(right.denominator) -
    BigInt(right.numerator) * BigInt(left.denominator);
  return comparison < BigInt(0) ? -1 : comparison > BigInt(0) ? 1 : 0;
}

export function addExactRatios(
  left: ExactRatio,
  right: ExactRatio,
): ExactResult<ExactRatio, ExactRatioFailure> {
  const numerator =
    BigInt(left.numerator) * BigInt(right.denominator) +
    BigInt(right.numerator) * BigInt(left.denominator);
  const denominator = BigInt(left.denominator) * BigInt(right.denominator);
  return createExactRatio(numerator.toString(), denominator.toString());
}

export function decimalToExactRatio(
  value: CanonicalDecimal,
): ExactResult<ExactRatio, ExactRatioFailure> {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  const numerator =
    BigInt(`${integer}${fraction}` || "0") * (negative ? BigInt(-1) : BigInt(1));
  const denominator = BigInt(10) ** BigInt(fraction.length);
  return createExactRatio(numerator.toString(), denominator.toString());
}

export function ratioToExactDecimal(
  ratio: ExactRatio,
  policy: ExactRatioRoundingPolicy,
): ExactResult<CanonicalDecimal, ExactRatioFailure | { code: string }> {
  if (policy.version !== EXACT_RATIO_ROUNDING_POLICY_VERSION) {
    return { ok: false, error: { code: "ti_v3_ratio_rounding_policy_invalid" } };
  }
  if (policy.scale < 0 || policy.scale % 1 !== 0 || policy.scale > policy.bounds.maximumScale) {
    return { ok: false, error: { code: "ti_v3_ratio_rounding_scale_invalid" } };
  }

  const numerator = BigInt(ratio.numerator);
  const denominator = BigInt(ratio.denominator);
  const negative = numerator < BigInt(0);
  const magnitude = negative ? -numerator : numerator;
  const scaled = magnitude * BigInt(10) ** BigInt(policy.scale);
  let quotient = scaled / denominator;
  const remainder = scaled % denominator;
  const doubledRemainder = remainder * BigInt(2);
  if (
    doubledRemainder > denominator ||
    (doubledRemainder === denominator && quotient % BigInt(2) !== BigInt(0))
  ) {
    quotient += BigInt(1);
  }

  const digits = quotient.toString().padStart(policy.scale + 1, "0");
  const unsigned =
    policy.scale === 0
      ? digits
      : `${digits.slice(0, -policy.scale)}.${digits.slice(-policy.scale)}`;
  const candidate = negative && quotient !== BigInt(0) ? `-${unsigned}` : unsigned;
  return validateExactDecimal(candidate, policy.bounds);
}
