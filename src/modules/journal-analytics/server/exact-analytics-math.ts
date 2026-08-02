import { platformFailure } from "@/src/modules/platform/server/database/platform-migration-contract";
import { assertCanonicalJournalDecimal } from "@/src/modules/journal/contracts/journal-storage-values";

export type ExactDecimalParts = Readonly<{
  units: bigint;
  scale: number;
}>;

export type ExactAnalyticsRational = Readonly<{
  numeratorDecimal: string;
  denominatorInteger: string;
  roundedDecimal: string;
  roundingPolicy: string;
}>;

const EXACT_ZERO = BigInt(0);
const EXACT_ONE = BigInt(1);
const EXACT_TWO = BigInt(2);
const EXACT_TEN = BigInt(10);

const powersOfTen = new Map<number, bigint>([[0, EXACT_ONE]]);

export function exactPowerOfTen(exponent: number): bigint {
  if (!Number.isSafeInteger(exponent) || exponent < 0 || exponent > 256) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "decimalScale",
    });
  }
  const cached = powersOfTen.get(exponent);
  if (cached !== undefined) return cached;
  const value = EXACT_TEN ** BigInt(exponent);
  powersOfTen.set(exponent, value);
  return value;
}

export function parseExactDecimal(value: string): ExactDecimalParts {
  assertCanonicalJournalDecimal(value, "exactDecimal");
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  const units = BigInt(`${whole}${fraction}`) *
    (negative ? -EXACT_ONE : EXACT_ONE);
  return Object.freeze({ units, scale: fraction.length });
}

function normalizedParts(parts: ExactDecimalParts): ExactDecimalParts {
  let { units, scale } = parts;
  if (units === EXACT_ZERO) {
    return Object.freeze({ units: EXACT_ZERO, scale: 0 });
  }
  while (scale > 0 && units % EXACT_TEN === EXACT_ZERO) {
    units /= EXACT_TEN;
    scale -= 1;
  }
  return Object.freeze({ units, scale });
}

export function exactDecimalFromUnits(units: bigint, scale: number): string {
  if (!Number.isSafeInteger(scale) || scale < 0 || scale > 256) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "decimalScale",
    });
  }
  const normalized = normalizedParts({ units, scale });
  if (normalized.units === EXACT_ZERO) return "0";
  const negative = normalized.units < EXACT_ZERO;
  const digits = (negative ? -normalized.units : normalized.units)
    .toString()
    .padStart(normalized.scale + 1, "0");
  const unsigned = normalized.scale === 0
    ? digits
    : `${digits.slice(0, -normalized.scale)}.${digits.slice(-normalized.scale)}`;
  const value = negative ? `-${unsigned}` : unsigned;
  assertCanonicalJournalDecimal(value, "exactDecimalResult");
  return value;
}

function align(
  left: ExactDecimalParts,
  right: ExactDecimalParts,
): Readonly<{ leftUnits: bigint; rightUnits: bigint; scale: number }> {
  const scale = Math.max(left.scale, right.scale);
  return Object.freeze({
    leftUnits: left.units * exactPowerOfTen(scale - left.scale),
    rightUnits: right.units * exactPowerOfTen(scale - right.scale),
    scale,
  });
}

export function addExactDecimals(left: string, right: string): string {
  const aligned = align(parseExactDecimal(left), parseExactDecimal(right));
  return exactDecimalFromUnits(
    aligned.leftUnits + aligned.rightUnits,
    aligned.scale,
  );
}

export function subtractExactDecimals(left: string, right: string): string {
  const aligned = align(parseExactDecimal(left), parseExactDecimal(right));
  return exactDecimalFromUnits(
    aligned.leftUnits - aligned.rightUnits,
    aligned.scale,
  );
}

export function multiplyExactDecimals(left: string, right: string): string {
  const leftParts = parseExactDecimal(left);
  const rightParts = parseExactDecimal(right);
  return exactDecimalFromUnits(
    leftParts.units * rightParts.units,
    leftParts.scale + rightParts.scale,
  );
}

export function compareExactDecimals(left: string, right: string): number {
  const aligned = align(parseExactDecimal(left), parseExactDecimal(right));
  return aligned.leftUnits < aligned.rightUnits
    ? -1
    : aligned.leftUnits > aligned.rightUnits
      ? 1
      : 0;
}

export function negateExactDecimal(value: string): string {
  const parts = parseExactDecimal(value);
  return exactDecimalFromUnits(-parts.units, parts.scale);
}

export function absoluteExactDecimal(value: string): string {
  const parts = parseExactDecimal(value);
  return exactDecimalFromUnits(
    parts.units < EXACT_ZERO ? -parts.units : parts.units,
    parts.scale,
  );
}

export function sumExactDecimals(values: readonly string[]): string {
  return values.reduce(addExactDecimals, "0");
}

function greatestCommonDivisor(left: bigint, right: bigint): bigint {
  let a = left < EXACT_ZERO ? -left : left;
  let b = right < EXACT_ZERO ? -right : right;
  while (b !== EXACT_ZERO) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

function roundRationalHalfUp(
  numerator: bigint,
  denominator: bigint,
  decimalPlaces: number,
): string {
  const negative = numerator < EXACT_ZERO;
  const absoluteNumerator = negative ? -numerator : numerator;
  const scaled = absoluteNumerator * exactPowerOfTen(decimalPlaces);
  let quotient = scaled / denominator;
  const remainder = scaled % denominator;
  if (remainder * EXACT_TWO >= denominator) quotient += EXACT_ONE;
  return exactDecimalFromUnits(negative ? -quotient : quotient, decimalPlaces);
}

export function divideExactDecimals(
  numeratorDecimal: string,
  denominatorDecimal: string,
  options: Readonly<{
    decimalPlaces: number;
    roundingPolicy: string;
  }>,
): ExactAnalyticsRational {
  const numerator = parseExactDecimal(numeratorDecimal);
  const denominator = parseExactDecimal(denominatorDecimal);
  if (denominator.units === EXACT_ZERO) {
    platformFailure("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED", {
      field: "zeroDenominator",
    });
  }
  let rationalNumerator =
    numerator.units * exactPowerOfTen(denominator.scale);
  let rationalDenominator =
    denominator.units * exactPowerOfTen(numerator.scale);
  if (rationalDenominator < EXACT_ZERO) {
    rationalNumerator = -rationalNumerator;
    rationalDenominator = -rationalDenominator;
  }
  const divisor = greatestCommonDivisor(
    rationalNumerator,
    rationalDenominator,
  );
  rationalNumerator /= divisor;
  rationalDenominator /= divisor;
  return Object.freeze({
    numeratorDecimal: rationalNumerator.toString(),
    denominatorInteger: rationalDenominator.toString(),
    roundedDecimal: roundRationalHalfUp(
      rationalNumerator,
      rationalDenominator,
      options.decimalPlaces,
    ),
    roundingPolicy: options.roundingPolicy,
  });
}

export function percentageExactDecimals(
  numeratorDecimal: string,
  denominatorDecimal: string,
): ExactAnalyticsRational {
  return divideExactDecimals(
    multiplyExactDecimals(numeratorDecimal, "100"),
    denominatorDecimal,
    { decimalPlaces: 2, roundingPolicy: "half_up_2dp" },
  );
}

export function medianExactDecimals(
  values: readonly string[],
  decimalPlaces = 2,
): ExactAnalyticsRational | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort(compareExactDecimals);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return divideExactDecimals(sorted[middle], "1", {
      decimalPlaces,
      roundingPolicy: `half_up_${decimalPlaces}dp`,
    });
  }
  return divideExactDecimals(
    addExactDecimals(sorted[middle - 1], sorted[middle]),
    "2",
    {
      decimalPlaces,
      roundingPolicy: `half_up_${decimalPlaces}dp`,
    },
  );
}

export function minimumExactDecimal(values: readonly string[]): string | null {
  return values.length === 0
    ? null
    : [...values].sort(compareExactDecimals)[0];
}

export function maximumExactDecimal(values: readonly string[]): string | null {
  return values.length === 0
    ? null
    : [...values].sort(compareExactDecimals).at(-1) ?? null;
}
