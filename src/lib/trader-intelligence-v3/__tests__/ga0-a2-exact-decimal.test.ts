import { describe, expect, it } from "vitest";

import {
  addExactDecimals,
  multiplyExactDecimals,
  parseAcceptedExecutionQuantity,
  parseCurrencyCode,
  parseExactCharge,
  parseExactMoney,
  parseExactPrice,
  validateExactDecimal,
  type CanonicalDecimal,
} from "../domain";

describe("Trader Intelligence v3 exact decimal v1", () => {
  it.each([
    ["", "ti_v3_decimal_empty"],
    [" 1", "ti_v3_decimal_whitespace_forbidden"],
    ["1 0", "ti_v3_decimal_whitespace_forbidden"],
    ["1e3", "ti_v3_decimal_exponent_forbidden"],
    ["1,000", "ti_v3_decimal_locale_format_forbidden"],
    ["NaN", "ti_v3_decimal_non_finite_forbidden"],
    ["Infinity", "ti_v3_decimal_non_finite_forbidden"],
    ["0x10", "ti_v3_decimal_hex_forbidden"],
    ["+1", "ti_v3_decimal_malformed"],
    ["--1", "ti_v3_decimal_malformed"],
    ["1.", "ti_v3_decimal_malformed"],
  ])("rejects invalid lexical input with %s", (input, code) => {
    expect(validateExactDecimal(input)).toEqual({ ok: false, error: { code } });
  });

  it.each([
    ["-0", "0"],
    ["-0.000", "0"],
    ["00012.3400", "12.34"],
    ["0.125000", "0.125"],
    ["000", "0"],
  ])("canonicalizes %s to %s", (input, expected) => {
    expect(validateExactDecimal(input)).toEqual({ ok: true, value: expected });
  });

  it("enforces general precision and scale bounds without rounding", () => {
    expect(validateExactDecimal("9".repeat(48))).toEqual({
      ok: true,
      value: "9".repeat(48),
    });
    expect(validateExactDecimal("9".repeat(49))).toEqual({
      ok: false,
      error: { code: "ti_v3_decimal_precision_exceeded" },
    });
    expect(validateExactDecimal(`0.${"0".repeat(23)}1`)).toEqual({
      ok: true,
      value: `0.${"0".repeat(23)}1`,
    });
    expect(validateExactDecimal(`0.${"0".repeat(24)}1`)).toEqual({
      ok: false,
      error: { code: "ti_v3_decimal_scale_exceeded" },
    });
  });

  it("keeps addition and multiplication exact", () => {
    const left = validateExactDecimal("0.1");
    const right = validateExactDecimal("0.2");
    expect(left.ok && right.ok).toBe(true);
    if (!left.ok || !right.ok) return;
    expect(addExactDecimals(left.value, right.value)).toEqual({ ok: true, value: "0.3" });
    expect(
      multiplyExactDecimals(
        "0.000000000001" as CanonicalDecimal,
        "0.000000000001" as CanonicalDecimal,
      ),
    ).toEqual({ ok: true, value: "0.000000000000000000000001" });
  });

  it("applies quantity, price, charge, and currency domain rules", () => {
    expect(parseAcceptedExecutionQuantity("0")).toEqual({
      ok: false,
      error: { code: "ti_v3_decimal_zero_forbidden" },
    });
    expect(parseAcceptedExecutionQuantity("0.000000000001")).toEqual({
      ok: true,
      value: "0.000000000001",
    });
    expect(parseAcceptedExecutionQuantity("0.0000000000001")).toEqual({
      ok: false,
      error: { code: "ti_v3_decimal_scale_exceeded" },
    });
    expect(parseExactPrice("-0.01")).toEqual({
      ok: false,
      error: { code: "ti_v3_decimal_negative_forbidden" },
    });
    expect(parseExactCharge("-0.0025")).toEqual({ ok: true, value: "-0.0025" });
    expect(parseCurrencyCode("usd")).toEqual({
      ok: false,
      error: { code: "ti_v3_currency_invalid" },
    });
    expect(parseExactMoney("12.5", "USD")).toEqual({
      ok: true,
      value: { amount: "12.5", currency: "USD" },
    });
  });
});
