import { describe, expect, it } from "vitest";

import { buildAiReadPullbackRecoveryRecap, buildAnalysisBreakoutRecap } from "./ai-read-pullback-recap";

const postedAt = Date.parse("2026-09-08T13:30:00.000Z");
const publishedAt = Date.parse("2026-09-08T13:35:00.000Z");

function build(input: Readonly<{ observations: readonly { observedAtMs: number; price: number }[] }>) {
  return buildAiReadPullbackRecoveryRecap({
    observations: input.observations,
    plan: { kind: "shallow", publishedAtMs: publishedAt, zoneHigh: 1.1, zoneLow: 1 },
    postedAtMs: postedAt,
    postedPrice: 1.2,
    symbol: "PDSB",
  });
}

describe("AI Read pullback recap", () => {
  it("uses the actual pullback low after an entered AI Read zone", () => {
    const recap = build({ observations: [
      { observedAtMs: publishedAt, price: 1.08 },
      { observedAtMs: publishedAt + 60_000, price: 1.02 },
      { observedAtMs: publishedAt + 120_000, price: 1.3 },
    ] });
    expect(recap?.scenario).toBe("pullback_recovery");
    expect(recap?.text).toContain("Price traded into that area, reached $1.02");
    expect(recap?.text).toContain("27.5% move from the actual pullback price");
    expect(recap?.text).not.toContain("from the Watchlist posted price");
  });

  it("states only analysis levels actually cleared and uses posted price for continuation gain", () => {
    const recap = buildAnalysisBreakoutRecap({
      observations: [
        { observedAtMs: publishedAt, price: 0.52 },
        { observedAtMs: publishedAt + 60_000, price: 0.54 },
        { observedAtMs: publishedAt + 120_000, price: 0.65 },
      ],
      plan: { breakoutTriggerPrice: 0.54, clearedPrice: 0.52, nextLevelPrices: [0.6, 0.63, 0.7], publishedAtMs: publishedAt },
      postedAtMs: postedAt,
      postedPrice: 0.5,
      symbol: "PDSB",
    });
    expect(recap).toContain("cleared $0.5200 and the breakout trigger of $0.5400");
    expect(recap).toContain("$0.6000, $0.6300");
    expect(recap).toContain("high of $0.6500 for a potential gain of 30.0%");
    expect(recap).not.toContain("from the Watchlist posted price");
    expect(recap).not.toContain("$0.7000");
  });

  it("describes a recovery that turns before reaching the analysis area", () => {
    const recap = build({ observations: [
      { observedAtMs: publishedAt, price: 1.15 },
      { observedAtMs: publishedAt + 60_000, price: 1.3 },
    ] });
    expect(recap?.scenario).toBe("near_zone_recovery");
    expect(recap?.text).toContain("turned higher before reaching that area");
    expect(recap?.text).not.toContain("pulled back into");
  });

  it("does not apply an AI Read plan to prices observed before it was published", () => {
    const recap = build({ observations: [
      { observedAtMs: publishedAt - 60_000, price: 1.05 },
      { observedAtMs: publishedAt + 60_000, price: 1.3 },
    ] });
    expect(recap).toBeNull();
  });

  it("does not invent a recovery when a zone is entered without a later higher price", () => {
    const recap = build({ observations: [
      { observedAtMs: publishedAt, price: 1.05 },
      { observedAtMs: publishedAt + 60_000, price: 1.01 },
    ] });
    expect(recap).toBeNull();
  });
});
