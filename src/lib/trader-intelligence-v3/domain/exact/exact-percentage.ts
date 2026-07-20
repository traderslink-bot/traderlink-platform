import {
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "./exact-decimal";

declare const exactPercentageBrand: unique symbol;

export type ExactPercentage = CanonicalDecimal & {
  readonly [exactPercentageBrand]: "ExactPercentage";
};

export function parseExactPercentage(input: unknown): ExactResult<ExactPercentage> {
  const result = validateExactDecimal(input);
  return result.ok
    ? { ok: true, value: result.value as ExactPercentage }
    : result;
}
