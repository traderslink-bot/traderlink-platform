import { describe, expect, it } from "vitest";

import {
  isUserFacingTickerSymbol,
  sellStartingReviewLimitationCopy,
  userFacingTradeDirection,
  userFacingTradeSymbol,
} from "../product/trade-display-copy";
import { importTradeDirectionLabel } from "../product/import-user-copy";

describe("trade display copy", () => {
  it("keeps normal ticker symbols visible", () => {
    expect(userFacingTradeSymbol("AVEX")).toBe("AVEX");
    expect(userFacingTradeSymbol("brk.a")).toBe("BRK.A");
    expect(isUserFacingTickerSymbol("OMEX")).toBe(true);
  });

  it("hides import-id-like symbols from primary user copy", () => {
    expect(userFacingTradeSymbol("V516374MD")).toBe("Selected trade");
    expect(userFacingTradeSymbol("import:abc:trade:0")).toBe("Selected trade");
    expect(isUserFacingTickerSymbol("V516374MD")).toBe(false);
  });

  it("labels sell-starting records as limited review without short coaching claims", () => {
    expect(userFacingTradeDirection("short")).toBe("Limited sell-side review");
    expect(userFacingTradeDirection("long")).toBe("Long trade");
    expect(sellStartingReviewLimitationCopy()).toContain(
      "full short-trade coaching is not supported yet",
    );
    expect(sellStartingReviewLimitationCopy().toLowerCase()).not.toContain(
      "short-seller coaching",
    );
  });

  it("uses the same limited sell-side language on import routes", () => {
    expect(importTradeDirectionLabel("short")).toBe("Limited sell-side review");
    expect(importTradeDirectionLabel("long")).toBe("Long-side review");
  });
});
