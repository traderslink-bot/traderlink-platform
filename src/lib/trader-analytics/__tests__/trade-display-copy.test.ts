import { describe, expect, it } from "vitest";

import {
  isUserFacingTickerSymbol,
  userFacingTradeSymbol,
} from "../product/trade-display-copy";

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
});
