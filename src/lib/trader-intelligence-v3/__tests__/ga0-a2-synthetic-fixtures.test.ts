import { describe, expect, it } from "vitest";

import {
  GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS,
  buildSyntheticCanonicalExecution,
  syntheticSourceDocumentDigest,
} from "../testing";

describe("Trader Intelligence v3 GA0-A2 exact synthetic fixture catalog", () => {
  it("contains every required synthetic scenario exactly once", () => {
    expect(GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS).toHaveLength(35);
    expect(new Set(GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS.map((fixture) => fixture.id)).size).toBe(35);
    for (const fixture of GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS) {
      expect(fixture.purpose.length).toBeGreaterThan(10);
      expect(fixture.expectedOrderingState.length).toBeGreaterThan(0);
      expect(fixture.expectedDuplicateState.length).toBeGreaterThan(0);
      expect(fixture).toHaveProperty("expectedEndingInventory");
      expect(fixture).toHaveProperty("expectedGrossPnl");
      expect(fixture).toHaveProperty("expectedCharges");
      expect(fixture).toHaveProperty("expectedNetPnl");
      expect(fixture).toHaveProperty("expectedBlockedOrLimitationState");
      expect(fixture).toHaveProperty("expectedCanonicalDigests");
    }
  });

  it("matches recorded identity golden vectors", () => {
    const identityFixture = GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS.find(
      (fixture) => fixture.id === "source_economic_identity_change",
    );
    expect(identityFixture).toBeDefined();
    expect(identityFixture?.expectedCanonicalDigests).toEqual([
      buildSyntheticCanonicalExecution().canonicalContentDigest,
      buildSyntheticCanonicalExecution({
        sourceDocumentDigest: syntheticSourceDocumentDigest("changed"),
      }).canonicalContentDigest,
      buildSyntheticCanonicalExecution({ price: "1.2501" }).canonicalContentDigest,
    ]);
  });

  it("uses only explicit synthetic identity and symbol labels", () => {
    const serialized = JSON.stringify(GA0_A2_SYNTHETIC_FIXTURE_EXPECTATIONS);
    expect(serialized).not.toMatch(/\b(?:IBKR|Moomoo|Webull|Robinhood|Schwab)\b/i);
    expect(serialized).not.toContain("account_");
  });
});
