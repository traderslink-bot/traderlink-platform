export interface ReferenceDecimal {
  coefficient: bigint;
  scale: number;
}

function powerOfTen(scale: number): bigint {
  return BigInt(10) ** BigInt(scale);
}

function normalize(value: ReferenceDecimal): ReferenceDecimal {
  if (value.coefficient === BigInt(0)) {
    return { coefficient: BigInt(0), scale: 0 };
  }
  let coefficient = value.coefficient;
  let scale = value.scale;
  while (scale > 0 && coefficient % BigInt(10) === BigInt(0)) {
    coefficient /= BigInt(10);
    scale -= 1;
  }
  return { coefficient, scale };
}

export function parseReferenceDecimal(value: string): ReferenceDecimal {
  if (!/^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?$/.test(value)) {
    throw new Error("ti_v3_reference_decimal_invalid");
  }
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [integer, fraction = ""] = unsigned.split(".");
  const coefficient =
    BigInt(`${integer}${fraction}`) * (negative ? BigInt(-1) : BigInt(1));
  return normalize({ coefficient, scale: fraction.length });
}

export function formatReferenceDecimal(value: ReferenceDecimal): string {
  const normalized = normalize(value);
  if (normalized.coefficient === BigInt(0)) return "0";
  const negative = normalized.coefficient < BigInt(0);
  const magnitude = negative ? -normalized.coefficient : normalized.coefficient;
  const digits = magnitude.toString().padStart(normalized.scale + 1, "0");
  const unsigned =
    normalized.scale === 0
      ? digits
      : `${digits.slice(0, -normalized.scale)}.${digits.slice(-normalized.scale)}`;
  return negative ? `-${unsigned}` : unsigned;
}

function align(
  left: ReferenceDecimal,
  right: ReferenceDecimal,
): { left: bigint; right: bigint; scale: number } {
  const scale = left.scale > right.scale ? left.scale : right.scale;
  return {
    left: left.coefficient * powerOfTen(scale - left.scale),
    right: right.coefficient * powerOfTen(scale - right.scale),
    scale,
  };
}

export function addReferenceDecimals(
  left: ReferenceDecimal,
  right: ReferenceDecimal,
): ReferenceDecimal {
  const aligned = align(left, right);
  return normalize({ coefficient: aligned.left + aligned.right, scale: aligned.scale });
}

export function subtractReferenceDecimals(
  left: ReferenceDecimal,
  right: ReferenceDecimal,
): ReferenceDecimal {
  const aligned = align(left, right);
  return normalize({ coefficient: aligned.left - aligned.right, scale: aligned.scale });
}

export function multiplyReferenceDecimals(
  left: ReferenceDecimal,
  right: ReferenceDecimal,
): ReferenceDecimal {
  return normalize({
    coefficient: left.coefficient * right.coefficient,
    scale: left.scale + right.scale,
  });
}

export function compareReferenceDecimals(
  left: ReferenceDecimal,
  right: ReferenceDecimal,
): -1 | 0 | 1 {
  const aligned = align(left, right);
  return aligned.left < aligned.right ? -1 : aligned.left > aligned.right ? 1 : 0;
}
