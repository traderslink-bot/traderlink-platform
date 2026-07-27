import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildAnalyticalRow,
  buildQueryRowSemantics,
  calculateTradeQueryMetrics,
  executeTradeQuery,
  resolveTradeQueryEvidence,
  TRADE_QUERY_METRIC_KEYS,
  TRADE_QUERY_METRIC_REGISTRY,
  verifyTradeQueryMetricDeclaration,
  verifyTradeQueryMetricRegistry,
  verifyTradeQueryResultShape,
  type ExactMetricValue,
  type AnalyticalRow,
  type TradeQueryFilter,
  type TradeQueryMetricKey,
  type TradeQueryResultRow,
} from "../../analytics";

function metric(row: TradeQueryResultRow, key: string): ExactMetricValue {
  const found = row.metrics.find((item) => item.metricKey === key);
  if (found === undefined) throw new Error(`missing metric ${key}`);
  return found;
}

function directMetrics(
  overrides: Partial<Pick<AnalyticalRow,
    "entryNotional" | "shareQuantity" | "limitationCodes" | "coverageState" | "evidenceQuality"
  >>,
  keys: readonly TradeQueryMetricKey[],
): readonly ExactMetricValue[] {
  const template = buildSyntheticQueryFixture().derived.datasetReceipt.rows[0];
  const { rowDigest: _rowDigest, ...content } = template;
  void _rowDigest;
  const built = buildAnalyticalRow({
    ...content,
    ...overrides,
    semanticRoundTripKey: "registry_behavior_trade",
    supportingOccurrenceKeys: template.supportingExecutionDigests.map((_, index) =>
      `registry_behavior_occurrence_${index + 1}`),
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return calculateTradeQueryMetrics(
    keys,
    buildQueryRowSemantics([built.value]),
    { candidateCount: "1", includedCount: "1", excludedCount: "0" },
    "USD",
  );
}

describe("GA1-A audit remediation and metric registry", () => {
  it("registers at least 55 immutable versioned execution-only metrics", () => {
    expect(TRADE_QUERY_METRIC_KEYS.length).toBeGreaterThanOrEqual(55);
    expect(TRADE_QUERY_METRIC_REGISTRY.entries).toHaveLength(
      TRADE_QUERY_METRIC_KEYS.length,
    );
    expect(Object.isFrozen(TRADE_QUERY_METRIC_REGISTRY)).toBe(true);
    expect(Object.isFrozen(TRADE_QUERY_METRIC_REGISTRY.entries)).toBe(true);
    expect(verifyTradeQueryMetricRegistry(
      JSON.parse(JSON.stringify(TRADE_QUERY_METRIC_REGISTRY)),
    )).toMatchObject({ ok: true });
    for (const declaration of TRADE_QUERY_METRIC_REGISTRY.entries) {
      expect(verifyTradeQueryMetricDeclaration(
        JSON.parse(JSON.stringify(declaration)),
      )).toMatchObject({ ok: true });
      expect(declaration.metricDigest).toMatch(
        /^ti_v3:trade_query_metric_registry_entry:/,
      );
      expect(Object.isFrozen(declaration)).toBe(true);
    }
    const tampered = JSON.parse(
      JSON.stringify(TRADE_QUERY_METRIC_REGISTRY.entries[0]),
    ) as { calculationPolicy: string };
    tampered.calculationPolicy = "foreign_policy";
    expect(verifyTradeQueryMetricDeclaration(tampered)).toMatchObject({
      ok: false,
    });
  });

  it("composes composite metric dependencies and explicit unavailable conditions", () => {
    const declaration = (key: string) => {
      const found = TRADE_QUERY_METRIC_REGISTRY.entries.find((entry) => entry.metricKey === key);
      if (found === undefined) throw new Error(`missing declaration ${key}`);
      return found;
    };
    expect(declaration("average_winner_holding_time")).toMatchObject({
      requiredFields: ["firstEntryAt", "finalExitAt", "netPnl"],
      requiredDerivedSemantics: ["realized_outcome", "completed_holding_duration"],
      unavailableConditions: ["zero_total_population", "no_winning_trade"],
      unavailableReasonCodes: expect.arrayContaining([
        "ti_v3_query_charge_coverage_unknown",
        "ti_v3_query_zero_sample",
      ]),
    });
    expect(declaration("median_loser_entry_notional")).toMatchObject({
      requiredFields: ["entryNotional", "netPnl"],
      requiredDerivedSemantics: ["realized_outcome", "complete_entry_notional_authority"],
      unavailableConditions: ["zero_total_population", "no_losing_trade", "incomplete_entry_notional_authority"],
      unavailableReasonCodes: expect.arrayContaining([
        "ti_v3_query_charge_coverage_unknown",
        "ti_v3_query_required_authority_unavailable",
        "ti_v3_query_zero_sample",
      ]),
    });
    expect(declaration("net_pnl_per_100_shares")).toMatchObject({
      requiredFields: ["shareQuantity", "netPnl"],
      unavailableConditions: ["zero_total_population", "incomplete_share_quantity_authority", "zero_total_share_quantity_denominator"],
      unavailableReasonCodes: expect.arrayContaining([
        "ti_v3_query_charge_coverage_unknown",
        "ti_v3_query_required_authority_unavailable",
        "ti_v3_query_zero_denominator",
      ]),
    });
    expect(declaration("return_on_entry_notional")).toMatchObject({
      requiredFields: ["entryNotional", "netPnl"],
      unavailableConditions: ["zero_total_population", "incomplete_entry_notional_authority", "zero_total_entry_notional_denominator"],
      unavailableReasonCodes: expect.arrayContaining([
        "ti_v3_query_charge_coverage_unknown",
        "ti_v3_query_required_authority_unavailable",
        "ti_v3_query_zero_denominator",
      ]),
    });
    expect(declaration("average_share_quantity")).toMatchObject({
      unavailableConditions: ["zero_total_population", "incomplete_share_quantity_authority"],
    });
    expect(declaration("average_entry_notional")).toMatchObject({
      unavailableConditions: ["zero_total_population", "incomplete_entry_notional_authority"],
    });
    expect(declaration("longest_winning_trade_streak")).toMatchObject({
      unavailablePolicy: "available_zero_when_no_matching_streak",
      unavailableConditions: [],
      unavailableReasonCodes: ["ti_v3_query_charge_coverage_unknown"],
    });
    expect(declaration("maximum_trades_per_trading_day")).toMatchObject({
      unavailablePolicy: "available_at_zero_population",
      unavailableConditions: [],
      unavailableReasonCodes: [],
    });
    for (const key of ["average_win_loss_ratio", "median_win_loss_ratio", "breakeven_win_rate"] as const) {
      expect(declaration(key).unavailableConditions).toEqual([
        "zero_total_population", "no_winning_trade", "no_losing_trade",
      ]);
    }
  });

  it("keeps all declarations aligned with emitted unavailable reasons across behavior families", () => {
    const executeAll = (filters: readonly TradeQueryFilter[]) => {
      const fixture = buildSyntheticQueryFixture();
      const values: ExactMetricValue[] = [];
      for (let index = 0; index < TRADE_QUERY_METRIC_KEYS.length; index += 64) {
        const result = executeTradeQuery({
          source: fixture.source,
          partitionReceipt: fixture.partition,
          queryPlan: fixture.plan({
            filters,
            metrics: TRADE_QUERY_METRIC_KEYS.slice(index, index + 64),
          }),
        });
        expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
        if (result.ok) values.push(...result.value.rows[0].metrics);
      }
      return values;
    };
    const zeroPopulation = executeAll([
      { kind: "date_range", startDate: "2026-08-01", endDate: "2026-08-02" },
    ]);
    const scenarios = [
      executeAll([]),
      zeroPopulation,
      executeAll([{ kind: "realized_outcome", values: ["gain"] }]),
      executeAll([{ kind: "realized_outcome", values: ["loss"] }]),
      directMetrics(
        { shareQuantity: { state: "unavailable", reasonCode: "ti_v3_query_fixture_missing_quantity" } },
        ["average_share_quantity", "median_share_quantity", "maximum_share_quantity", "net_pnl_per_100_shares"],
      ),
      directMetrics(
        { entryNotional: { state: "unavailable", reasonCode: "ti_v3_query_fixture_missing_notional" } },
        ["average_entry_notional", "median_entry_notional", "maximum_entry_notional", "return_on_entry_notional"],
      ),
      directMetrics(
        { shareQuantity: { state: "available", quantity: "0" } },
        ["average_share_quantity", "median_share_quantity", "maximum_share_quantity", "net_pnl_per_100_shares"],
      ),
      directMetrics(
        { entryNotional: { state: "available", amount: "0", currency: "USD" as AnalyticalRow["currency"] } },
        ["average_entry_notional", "median_entry_notional", "maximum_entry_notional", "return_on_entry_notional"],
      ),
    ];
    for (const values of scenarios) {
      for (const value of values) {
        const declaration = TRADE_QUERY_METRIC_REGISTRY.entries.find((entry) => entry.metricKey === value.metricKey);
        if (declaration === undefined) throw new Error(`missing declaration ${value.metricKey}`);
        if (value.kind === "unavailable") {
          expect(declaration.unavailableReasonCodes, value.metricKey).toContain(value.reasonCode);
          expect(declaration.limitationCodes, value.metricKey).toContain(value.reasonCode);
        }
      }
    }
    expect(directMetrics(
      { shareQuantity: { state: "available", quantity: "0" } },
      ["average_share_quantity", "median_share_quantity", "maximum_share_quantity"],
    ).every((value) => value.kind !== "unavailable")).toBe(true);
    expect(directMetrics(
      { entryNotional: { state: "available", amount: "0", currency: "USD" as AnalyticalRow["currency"] } },
      ["average_entry_notional", "median_entry_notional", "maximum_entry_notional"],
    ).every((value) => value.kind !== "unavailable")).toBe(true);
    const unknownChargeCoverage = directMetrics(
      {
        limitationCodes: ["ti_v3_analytics_charge_coverage_unknown"],
        coverageState: "limited",
        evidenceQuality: "verified_exact_with_limitations",
      },
      ["gross_pnl", "total_trades", "trading_day_count", "signed_charges", "net_pnl", "win_count"],
    );
    for (const key of ["gross_pnl", "total_trades", "trading_day_count"] as const) {
      expect(unknownChargeCoverage.find((value) => value.metricKey === key)?.kind).not.toBe("unavailable");
    }
    for (const key of ["signed_charges", "net_pnl", "win_count"] as const) {
      expect(unknownChargeCoverage.find((value) => value.metricKey === key)).toMatchObject({
        kind: "unavailable",
        reasonCode: "ti_v3_query_charge_coverage_unknown",
      });
    }
  });

  it("binds grouped candidate, included, and excluded authority to evidence", () => {
    const fixture = buildSyntheticQueryFixture(30, false);
    const result = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        filters: [{ kind: "realized_outcome", values: ["gain"] }],
        grouping: { kind: "direction" },
        metrics: [
          "candidate_count",
          "included_count",
          "excluded_count",
          "net_pnl",
        ],
      }),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    for (const row of result.value.rows) {
      expect(BigInt(row.candidateCount)).toBe(
        BigInt(row.includedCount) + BigInt(row.excludedCount),
      );
      expect(metric(row, "candidate_count")).toMatchObject({
        kind: "integer",
        value: row.candidateCount,
      });
      expect(metric(row, "included_count")).toMatchObject({
        kind: "integer",
        value: row.includedCount,
      });
      expect(metric(row, "excluded_count")).toMatchObject({
        kind: "integer",
        value: row.excludedCount,
      });
      const evidence = result.value.evidence.find(
        (item) => item.evidenceDigest === row.evidenceDigest,
      );
      expect(evidence).toMatchObject({
        groupIdentity: row.groupIdentity,
        populationCount: row.includedCount,
      });
      expect(resolveTradeQueryEvidence(
        evidence,
        result.value.normalizedQueryPlan,
        fixture.derived.datasetReceipt.rows,
      )).toMatchObject({ ok: true });
    }
    expect(verifyTradeQueryResultShape(
      JSON.parse(JSON.stringify(result.value)),
      fixture.authority,
    )).toMatchObject({ ok: true });

    const reversed = buildSyntheticQueryFixture(30, true);
    const reverseResult = executeTradeQuery({
      source: reversed.source,
      partitionReceipt: reversed.partition,
      queryPlan: reversed.plan({
        filters: [{ kind: "realized_outcome", values: ["gain"] }],
        grouping: { kind: "direction" },
        metrics: [
          "candidate_count",
          "included_count",
          "excluded_count",
          "net_pnl",
        ],
      }),
    });
    expect(reverseResult).toMatchObject({
      ok: true,
      value: { resultDigest: result.value.resultDigest },
    });
  });

  it("deterministically bounds result rows after ordering while groupLimit rejects", () => {
    const fixture = buildSyntheticQueryFixture(30, false);
    const options = {
      grouping: { kind: "symbol" } as const,
      metrics: ["net_pnl", "candidate_count", "included_count", "excluded_count"] as const,
      ordering: [{ by: "metric", metricKey: "net_pnl", direction: "descending" }] as const,
      limits: { resultRowLimit: "2" },
    };
    const result = executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan(options),
    });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    expect(result.value.rows).toHaveLength(2);
    expect(result.value.evidence).toHaveLength(2);
    expect(result.value.limitationCodes).toContain(
      "ti_v3_query_result_rows_bounded",
    );
    expect(result.value.rows.map((row) => row.evidenceDigest).sort()).toEqual(
      result.value.evidence.map((item) => item.evidenceDigest).sort(),
    );

    const reversed = buildSyntheticQueryFixture(30, true);
    const reverseResult = executeTradeQuery({
      source: reversed.source,
      partitionReceipt: reversed.partition,
      queryPlan: reversed.plan(options),
    });
    expect(reverseResult).toMatchObject({
      ok: true,
      value: { resultDigest: result.value.resultDigest },
    });

    expect(executeTradeQuery({
      source: fixture.source,
      partitionReceipt: fixture.partition,
      queryPlan: fixture.plan({
        ...options,
        limits: { groupLimit: "2", resultRowLimit: "2" },
      }),
    })).toMatchObject({
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized" },
    });
  });
});
