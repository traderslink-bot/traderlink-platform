import { describe, expect, it } from "vitest";
import {
  executeAnalyticsAgent,
  resolveAnalyticsAgentIntent,
} from "../../analytics/agent";
import { buildSyntheticQueryFixture } from "../../analytics/query";

function request(question: string, count = 12) {
  const fixture = buildSyntheticQueryFixture(count);
  return {
    fixture,
    request: {
      source: fixture.source,
      partitionReceipt: fixture.partition,
      ownerScope: fixture.partition.ownerScope,
      accountScope: fixture.partition.accountScope,
      question,
    },
  };
}

describe("Analytics Agent v1 Foundation", () => {
  it("routes its initial plain-English inventory deterministically without a model", () => {
    expect(resolveAnalyticsAgentIntent("What times of day am I least profitable?").intent).toBe("time_of_day_performance");
    expect(resolveAnalyticsAgentIntent("How do I trade after a loss?")).toMatchObject({ intent: "prior_outcome_behavior", previousOutcome: "loss" });
    expect(resolveAnalyticsAgentIntent("Show my results in stocks under $5.")).toMatchObject({
      intent: "price_range_performance",
      priceRange: { minimum: null, maximum: "5" },
    });
    expect(resolveAnalyticsAgentIntent("Did I buy the VWAP reclaim?").intent).toBe("unsupported_market_or_setup");
  });

  it("builds an engine-backed core-performance answer with bounded evidence and replay identity", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent(input.request);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      status: "answered",
      resolvedIntent: "core_performance",
      capabilityKeys: ["core_performance"],
      sampleSize: "12",
      enginePlanDigest: expect.stringMatching(/^ti_v3:trade_query_plan:v1:sha256:/),
      resultDigest: expect.stringMatching(/^ti_v3:trade_query_result:v1:sha256:/),
      executionReceiptDigest: expect.stringMatching(/^ti_v3:trade_query_execution_receipt:v1:sha256:/),
      answerDigest: expect.stringMatching(/^ti_v3:analytics_agent_answer:v1:sha256:/),
    });
    expect(result.value.evidenceTradeReferences.length).toBeGreaterThan(0);
    expect(result.value.headline).toContain("completed trade execution data");
  });

  it("uses verified filters and engine grouping for time, ticker, price, behavior, sequence, repeat, drawdown, fees, and data quality", () => {
    const questions = [
      "What times of day am I least profitable?",
      "What tickers hurt me most?",
      "Show my results in stocks under $5.",
      "How do I trade after a loss?",
      "Do fourth-and-later trades perform worse?",
      "Do repeat attempts on the same ticker hurt me?",
      "Am I giving back profits?",
      "Are fees hurting my small trades?",
      "Can this result be trusted?",
    ];
    for (const question of questions) {
      const input = request(question);
      const result = executeAnalyticsAgent(input.request);
      const detail = result.ok ? "ok" : `${result.error.code}:${result.error.path}`;
      expect(result.ok, `${question}: ${detail}`).toBe(true);
      if (!result.ok) continue;
      expect(result.value.enginePlanDigest).toMatch(/^ti_v3:trade_query_plan:v1:sha256:/);
      expect(result.value.resultDigest).toMatch(/^ti_v3:trade_query_result:v1:sha256:/);
      expect(result.value.rankedRows.length).toBeGreaterThan(0);
    }
  });

  it("returns structured unsupported boundaries for market, exit-quality, and planned-risk claims", () => {
    for (const [question, code] of [
      ["Did I buy the VWAP reclaim?", "market_or_setup_data_required"],
      ["Did I cut winners too early?", "exit_quality_or_alternative_outcome_authority_required"],
      ["Did I follow my daily max loss rule?", "planned_risk_authority_required"],
    ] as const) {
      const input = request(question);
      const result = executeAnalyticsAgent(input.request);
      expect(result).toMatchObject({ ok: true });
      if (!result.ok) continue;
      expect(result.value).toMatchObject({
        status: "unsupported",
        enginePlanDigest: null,
        resultDigest: null,
        unsupportedReason: { code },
      });
    }
  });

  it("withholds a pattern below the minimum sample while retaining the verified engine result", () => {
    const input = request("Do later trades hurt me?", 2);
    const result = executeAnalyticsAgent(input.request);
    expect(result).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      status: "insufficient_sample",
      sampleSize: "2",
      enginePlanDigest: expect.stringMatching(/^ti_v3:trade_query_plan:v1:sha256:/),
      unsupportedReason: { code: "insufficient_sample_size" },
    });
  });

  it("fails closed when the caller owner scope does not match the engine partition", () => {
    const input = request("How am I doing overall?");
    const result = executeAnalyticsAgent({ ...input.request, ownerScope: ["another-owner"] });
    expect(result).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.analyticsAgent.scope" } });
  });

  it("preserves deterministic answer identity for the same verified request", () => {
    const input = request("What tickers hurt me most?");
    const first = executeAnalyticsAgent(input.request);
    const second = executeAnalyticsAgent(input.request);
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;
    expect(first.value.answerDigest).toBe(second.value.answerDigest);
  });
});
