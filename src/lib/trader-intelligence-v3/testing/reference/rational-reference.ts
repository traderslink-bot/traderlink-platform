import type { ReferenceDecimal } from "./bigint-decimal-reference";

export interface ReferenceRatio {
  numerator: string;
  denominator: string;
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

export function referenceRatio(numeratorInput: bigint, denominatorInput: bigint): ReferenceRatio {
  if (denominatorInput === BigInt(0)) throw new Error("ti_v3_reference_ratio_zero");
  if (numeratorInput === BigInt(0)) return { numerator: "0", denominator: "1" };
  const sign = denominatorInput < BigInt(0) ? BigInt(-1) : BigInt(1);
  const numerator = numeratorInput * sign;
  const denominator = denominatorInput * sign;
  const divisor = gcd(numerator, denominator);
  return {
    numerator: (numerator / divisor).toString(),
    denominator: (denominator / divisor).toString(),
  };
}

export function decimalReferenceRatio(value: ReferenceDecimal): ReferenceRatio {
  return referenceRatio(value.coefficient, BigInt(10) ** BigInt(value.scale));
}

export function divideReferenceDecimals(
  numerator: ReferenceDecimal,
  denominator: ReferenceDecimal,
): ReferenceRatio {
  return referenceRatio(
    numerator.coefficient * (BigInt(10) ** BigInt(denominator.scale)),
    denominator.coefficient * (BigInt(10) ** BigInt(numerator.scale)),
  );
}
