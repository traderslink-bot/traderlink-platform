import { describe, expect, it } from "vitest";

import {
  EXACT_RATIO_ROUNDING_POLICY_VERSION,
  canonicalExactRatio,
  compareExactRatios,
  createExactRatio,
  decimalToExactRatio,
  ratioToExactDecimal,
  type CanonicalDecimal,
} from "../domain";

const ROUNDING_BOUNDS = {
  maximumSignificantDigits: 48,
  maximumScale: 24,
  allowNegative: true,
  allowZero: true,
};

describe("Trader Intelligence v3 exact ratio v1", () => {
  it("reduces signs and zero canonically", () => {
    expect(createExactRatio("20", "-30")).toEqual({
      ok: true,
      value: { numerator: "-2", denominator: "3" },
    });
    expect(createExactRatio("0", "-999")).toEqual({
      ok: true,
      value: { numerator: "0", denominator: "1" },
    });
    expect(createExactRatio("1", "0")).toEqual({
      ok: false,
      error: { code: "ti_v3_ratio_denominator_zero" },
    });
  });

  it("compares by exact cross multiplication", () => {
    const oneThird = createExactRatio("1", "3");
    const twoFifths = createExactRatio("2", "5");
    expect(oneThird.ok && twoFifths.ok).toBe(true);
    if (!oneThird.ok || !twoFifths.ok) return;
    expect(compareExactRatios(oneThird.value, twoFifths.value)).toBe(-1);
    expect(canonicalExactRatio(oneThird.value)).toBe("1/3");
  });

  it("converts terminating decimals to exact reduced ratios", () => {
    const ratio = decimalToExactRatio("12.375" as CanonicalDecimal);
    expect(ratio).toEqual({
      ok: true,
      value: { numerator: "99", denominator: "8" },
    });
  });

  it("requires explicit versioned half-even rounding", () => {
    const fiveHalves = createExactRatio("5", "2");
    const sevenHalves = createExactRatio("7", "2");
    expect(fiveHalves.ok && sevenHalves.ok).toBe(true);
    if (!fiveHalves.ok || !sevenHalves.ok) return;
    const policy = {
      version: EXACT_RATIO_ROUNDING_POLICY_VERSION,
      scale: 0,
      bounds: ROUNDING_BOUNDS,
    } as const;
    expect(ratioToExactDecimal(fiveHalves.value, policy)).toEqual({ ok: true, value: "2" });
    expect(ratioToExactDecimal(sevenHalves.value, policy)).toEqual({ ok: true, value: "4" });
  });
});
