import { describe, expect, it } from "vitest";

import {
  financialOutcomeColor,
  financialOutcomeMetricColor,
} from "./financial-outcome-color";

describe("financial outcome color", () => {
  it("uses green for gains, red for losses and standard text for zero", () => {
    expect(financialOutcomeColor("125.50")).toBe("success.main");
    expect(financialOutcomeColor("-125.50")).toBe("error.main");
    expect(financialOutcomeColor("0.00")).toBe("text.primary");
    expect(financialOutcomeColor("-0.00")).toBe("text.primary");
    expect(financialOutcomeColor(null)).toBe("text.primary");
  });

  it("colors only financial outcome metrics", () => {
    const gain = Object.freeze({ kind: "decimal" as const, valueDecimal: "42.00" });
    const loss = Object.freeze({ kind: "decimal" as const, valueDecimal: "-18.25" });

    expect(financialOutcomeMetricColor("net_pnl", gain)).toBe("success.main");
    expect(financialOutcomeMetricColor("expectancy", loss)).toBe("error.main");
    expect(financialOutcomeMetricColor("profit_factor", gain)).toBe("text.primary");
    expect(financialOutcomeMetricColor("win_rate", loss)).toBe("text.primary");
  });

  it("uses exact rational numerators without rounding zero into a gain", () => {
    expect(financialOutcomeColor(Object.freeze({
      denominatorInteger: "3",
      kind: "rational" as const,
      numeratorDecimal: "0.00",
      roundedDecimal: "0.00",
      roundingPolicy: "half_up",
    }))).toBe("text.primary");
  });
});
