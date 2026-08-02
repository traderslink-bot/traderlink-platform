import {
  absoluteExactDecimal,
  addExactDecimals,
  compareExactDecimals,
  divideExactDecimals,
  exactDecimalFromUnits,
  maximumExactDecimal,
  medianExactDecimals,
  minimumExactDecimal,
  multiplyExactDecimals,
  negateExactDecimal,
  percentageExactDecimals,
  subtractExactDecimals,
  sumExactDecimals,
} from "./exact-analytics-math";

describe("exact Analytics math", () => {
  it("keeps decimal addition, subtraction and multiplication exact", () => {
    expect(addExactDecimals("0.1", "0.2")).toBe("0.3");
    expect(subtractExactDecimals("100000000000000000000.01", "0.02"))
      .toBe("99999999999999999999.99");
    expect(multiplyExactDecimals("10.25", "3.2")).toBe("32.8");
    expect(sumExactDecimals(["0.1", "0.2", "-0.3"])).toBe("0");
    expect(negateExactDecimal("-1.25")).toBe("1.25");
    expect(absoluteExactDecimal("-1.25")).toBe("1.25");
  });

  it("retains a reduced rational and rounds half-up only for display", () => {
    expect(divideExactDecimals("10.5", "2", {
      decimalPlaces: 2,
      roundingPolicy: "half_up_2dp",
    })).toEqual({
      numeratorDecimal: "21",
      denominatorInteger: "4",
      roundedDecimal: "5.25",
      roundingPolicy: "half_up_2dp",
    });
    expect(divideExactDecimals("-1", "8", {
      decimalPlaces: 2,
      roundingPolicy: "half_up_2dp",
    }).roundedDecimal).toBe("-0.13");
    expect(percentageExactDecimals("1", "6").roundedDecimal).toBe("16.67");
  });

  it("calculates odd and even medians without float conversion", () => {
    expect(medianExactDecimals(["10", "1", "3"])?.roundedDecimal).toBe("3");
    expect(medianExactDecimals(["1", "2", "10", "20"])).toMatchObject({
      numeratorDecimal: "6",
      denominatorInteger: "1",
      roundedDecimal: "6",
    });
    expect(medianExactDecimals([])).toBeNull();
  });

  it("orders and formats arbitrary-size scaled integers deterministically", () => {
    expect(compareExactDecimals("1.0001", "1.00009")).toBe(1);
    expect(minimumExactDecimal(["5", "-2", "1.2"])).toBe("-2");
    expect(maximumExactDecimal(["5", "-2", "1.2"])).toBe("5");
    expect(exactDecimalFromUnits(BigInt(-123400), 4)).toBe("-12.34");
  });

  it("rejects a zero denominator instead of returning infinity or NaN", () => {
    expect(() => divideExactDecimals("1", "0", {
      decimalPlaces: 2,
      roundingPolicy: "half_up_2dp",
    })).toThrowError("TRADERLINK_PLATFORM_STORAGE_VALIDATION_FAILED");
  });
});
