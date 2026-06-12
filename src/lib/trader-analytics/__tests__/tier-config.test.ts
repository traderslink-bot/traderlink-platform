import { describe, expect, it } from "vitest";

import {
  canUseAiCoach,
  canUseChartContext,
  DEFAULT_TRADER_INTELLIGENCE_AI_ADD_ON,
  DEFAULT_TRADER_INTELLIGENCE_TIER,
  readTraderIntelligenceTierFromEnv,
  resolveTraderIntelligenceTier,
  TRADER_INTELLIGENCE_AI_ADD_ONS,
  TRADER_INTELLIGENCE_TIERS,
} from "../product/tier-config";

describe("Trader Intelligence tier config", () => {
  it("keeps AI as an add-on over the two base tiers", () => {
    expect(Object.keys(TRADER_INTELLIGENCE_TIERS).sort()).toEqual([
      "chart_context",
      "free_execution",
    ]);
    expect(Object.keys(TRADER_INTELLIGENCE_AI_ADD_ONS).sort()).toEqual([
      "ai_coach",
      "none",
    ]);
    expect(canUseAiCoach(TRADER_INTELLIGENCE_AI_ADD_ONS.ai_coach)).toBe(true);
    expect(canUseAiCoach(TRADER_INTELLIGENCE_AI_ADD_ONS.none)).toBe(false);
  });

  it("defaults this local app to chart context while preserving free gating", () => {
    expect(DEFAULT_TRADER_INTELLIGENCE_TIER.id).toBe("chart_context");
    expect(canUseChartContext(DEFAULT_TRADER_INTELLIGENCE_TIER)).toBe(true);
    expect(canUseChartContext(TRADER_INTELLIGENCE_TIERS.free_execution)).toBe(
      false,
    );
    expect(DEFAULT_TRADER_INTELLIGENCE_AI_ADD_ON.id).toBe("none");
  });

  it("supports explicit local/test tier overrides without inventing tiers", () => {
    expect(
      readTraderIntelligenceTierFromEnv({
        TRADER_INTELLIGENCE_TIER: "free_execution",
      }).id,
    ).toBe("free_execution");
    expect(
      readTraderIntelligenceTierFromEnv({
        TRADER_INTELLIGENCE_TIER: "chart_context",
      }).id,
    ).toBe("chart_context");
    expect(resolveTraderIntelligenceTier("ai_coach").id).toBe("chart_context");
    expect(
      readTraderIntelligenceTierFromEnv({
        TRADER_INTELLIGENCE_TIER: "unknown",
      }).id,
    ).toBe("chart_context");
  });
});
