import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildTradeQueryFindingPacket,
  EXECUTION_ANALYTICS_CAPABILITY_CATALOG,
  executeTradeQuery,
  getExecutionAnalyticsCapability,
  type ExactMetricValue,
  verifyTradeQueryFindingPacket,
  type TradeQueryResultRow,
} from "../../analytics";

function metric(row: TradeQueryResultRow, key: string): ExactMetricValue {
  const found = row.metrics.find((item) => item.metricKey === key);
  if (found === undefined) throw new Error(`missing metric ${key}`);
  return found;
}

describe("GA1-A execution analytics extension", () => {
  it("builds a deterministic, evidence-linked finding packet without causal claims", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const executed = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({ grouping: { kind: "weekday" }, metrics: ["net_pnl"] }),
    });
    expect(executed, JSON.stringify(executed)).toMatchObject({ ok: true });
    if (!executed.ok) return;
    const first = buildTradeQueryFindingPacket({
      result: executed.value, authority: fixture.authority, dimension: "time", minimumSample: "2",
    });
    const second = buildTradeQueryFindingPacket({
      result: executed.value, authority: fixture.authority, dimension: "time", minimumSample: "2",
    });
    expect(first).toMatchObject({ ok: true });
    expect(second).toMatchObject({ ok: true });
    if (!first.ok || !second.ok) return;
    expect(first.value.packetDigest).toBe(second.value.packetDigest);
    expect(first.value.findings).toHaveLength(7);
    expect(first.value.findings[0]).toMatchObject({
      sampleState: "sufficient", ruleToTest: "review_time_window_execution_process",
    });
    expect(first.value.evidenceDigests).toHaveLength(7);
    const verifiedPacket = verifyTradeQueryFindingPacket(first.value, executed.value, fixture.authority);
    expect(verifiedPacket, JSON.stringify(verifiedPacket))
      .toMatchObject({ ok: true, value: { packetDigest: first.value.packetDigest } });
    const tampered = structuredClone(first.value) as { findings: Array<{ ruleToTest: string | null }> };
    tampered.findings[0].ruleToTest = "causal_claim_not_allowed";
    expect(verifyTradeQueryFindingPacket(tampered, executed.value, fixture.authority)).toMatchObject({ ok: false });
  });

  it("publishes one authoritative capability and limitation catalog for downstream agents", () => {
    expect(EXECUTION_ANALYTICS_CAPABILITY_CATALOG.catalogDigest).toMatch(/^ti_v3:/);
    expect(getExecutionAnalyticsCapability("giveback_and_drawdown")).toMatchObject({
      state: "available_with_exact_execution_authority",
    });
    expect(getExecutionAnalyticsCapability("deterministic_findings_and_samples")).toMatchObject({
      state: "available_with_exact_execution_authority",
      supportedQueryFeatures: expect.arrayContaining(["content-addressed finding packet"]),
    });
    expect(getExecutionAnalyticsCapability("market_and_exit_quality")).toMatchObject({
      state: "reserved_for_future_engine",
      limitationCodes: expect.arrayContaining([
        "exit_quality_or_alternative_outcome_authority_required",
      ]),
    });
  });

  it("exposes exact intraday giveback and realized-drawdown metrics", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const result = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        metrics: [
          "maximum_intraday_realized_drawdown",
          "maximum_peak_profit_giveback",
          "average_peak_profit_giveback",
          "median_peak_profit_giveback",
          "days_with_peak_profit_giveback",
          "days_with_realized_drawdown",
          "green_to_red_day_count",
          "red_to_green_day_count",
          "average_signed_charges",
          "median_signed_charges",
          "commission_signed_charges",
          "average_commission_signed_charges",
          "median_commission_signed_charges",
          "gross_net_difference",
        ],
      }),
    });

    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;

    const row = result.value.rows[0];
    expect(metric(row, "maximum_intraday_realized_drawdown")).toMatchObject({ value: "5" });
    expect(metric(row, "maximum_peak_profit_giveback")).toMatchObject({ value: "5" });
    // The fixture has two chronological profit peaks that later give back
    // (July 4 and July 6); the average is across all seven trading days.
    expect(metric(row, "average_peak_profit_giveback")).toMatchObject({ numerator: "10", denominator: "7" });
    expect(metric(row, "median_peak_profit_giveback")).toMatchObject({ value: "0" });
    expect(metric(row, "days_with_peak_profit_giveback")).toMatchObject({ value: "2" });
    expect(metric(row, "days_with_realized_drawdown")).toMatchObject({ value: "3" });
    expect(metric(row, "green_to_red_day_count")).toMatchObject({ value: "2" });
    expect(metric(row, "red_to_green_day_count")).toMatchObject({ value: "0" });
    expect(metric(row, "average_signed_charges")).toMatchObject({ value: "0" });
    expect(metric(row, "median_signed_charges")).toMatchObject({ value: "0" });
    expect(metric(row, "commission_signed_charges")).toMatchObject({ value: "0" });
    expect(metric(row, "average_commission_signed_charges")).toMatchObject({ value: "0" });
    expect(metric(row, "median_commission_signed_charges")).toMatchObject({ value: "0" });
    expect(metric(row, "gross_net_difference")).toMatchObject({ value: "0" });
  });

  it("supports session, pre-entry daily state, and verified streak filters", () => {
    const fixture = buildSyntheticQueryFixture(14);
    const redState = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "pre_entry_daily_state", values: ["red"] }],
        grouping: { kind: "pre_entry_daily_state" },
        metrics: ["included_count", "net_pnl"],
      }),
    });
    const afterLoss = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "prior_completed_streak", outcome: "loss", minimum: "1", maximum: null }],
        grouping: { kind: "prior_completed_streak_bucket" },
        metrics: ["included_count", "net_pnl"],
      }),
    });
    const bySession = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "session", values: ["not_applicable"] }],
        grouping: { kind: "session" },
        metrics: ["included_count"],
      }),
    });
    const afterFirstWin = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "pre_entry_daily_path", values: ["after_first_win"] }],
        metrics: ["included_count", "net_pnl"],
      }),
    });
    const afterFirstLoss = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "pre_entry_daily_path", values: ["after_first_loss"] }],
        metrics: ["included_count", "net_pnl"],
      }),
    });

    expect(redState, JSON.stringify(redState)).toMatchObject({ ok: true });
    expect(afterLoss, JSON.stringify(afterLoss)).toMatchObject({ ok: true });
    expect(bySession, JSON.stringify(bySession)).toMatchObject({ ok: true });
    expect(afterFirstWin, JSON.stringify(afterFirstWin)).toMatchObject({ ok: true });
    expect(afterFirstLoss, JSON.stringify(afterFirstLoss)).toMatchObject({ ok: true });
    if (!redState.ok || !afterLoss.ok || !bySession.ok || !afterFirstWin.ok || !afterFirstLoss.ok) return;

    expect(redState.value.rows).toMatchObject([
      { groupIdentity: "pre_entry_daily_state:red", includedCount: "1" },
    ]);
    expect(afterLoss.value.rows).toMatchObject([
      { groupIdentity: "prior_streak:loss:1", includedCount: "1" },
    ]);
    expect(bySession.value.rows).toMatchObject([
      { groupIdentity: "session:not_applicable", includedCount: "14" },
    ]);
    expect(afterFirstWin.value.rows).toMatchObject([{ includedCount: "4" }]);
    expect(afterFirstLoss.value.rows).toMatchObject([{ includedCount: "1" }]);
  });

  it("preserves uniform broker/import authority for deterministic filtering and grouping", () => {
    const fixture = buildSyntheticQueryFixture(8);
    const result = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "source_identity", values: ["source_synthetic_broker_csv"] }],
        grouping: { kind: "broker_code" },
        metrics: ["included_count", "net_pnl"],
      }),
    });

    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.rows).toMatchObject([
      { groupIdentity: "broker:synthetic_broker", includedCount: "8" },
    ]);
    expect(result.value.limitationCodes).not.toContain(
      "ti_v3_query_source_authority_unavailable",
    );
  });

  it("filters and groups explicit source kind and charge coverage without weakening fee authority", () => {
    const fixture = buildSyntheticQueryFixture(8);
    const result = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [
          { kind: "source_kind", values: ["broker_csv"] },
          { kind: "charge_coverage", value: "complete" },
        ],
        grouping: { kind: "source_kind" },
        metrics: ["total_trades", "net_pnl", "signed_charges"],
      }),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (result.ok) expect(result.value.rows).toMatchObject([
      { groupIdentity: "source_kind:broker_csv", includedCount: "8" },
    ]);
  });
});
