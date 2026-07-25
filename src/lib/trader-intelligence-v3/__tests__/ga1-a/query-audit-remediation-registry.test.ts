import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  executeTradeQuery,
  resolveTradeQueryEvidence,
  TRADE_QUERY_METRIC_KEYS,
  TRADE_QUERY_METRIC_REGISTRY,
  verifyTradeQueryMetricDeclaration,
  verifyTradeQueryMetricRegistry,
  verifyTradeQueryResultShape,
  type ExactMetricValue,
  type TradeQueryResultRow,
} from "../../analytics";

function metric(row: TradeQueryResultRow, key: string): ExactMetricValue {
  const found = row.metrics.find((item) => item.metricKey === key);
  if (found === undefined) throw new Error(`missing metric ${key}`);
  return found;
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
    });
    expect(declaration("median_loser_entry_notional")).toMatchObject({
      requiredFields: ["entryNotional", "netPnl"],
      requiredDerivedSemantics: ["realized_outcome", "complete_entry_notional_authority"],
      unavailableConditions: ["zero_total_population", "no_losing_trade", "incomplete_entry_notional_authority", "zero_entry_notional_denominator"],
    });
    expect(declaration("net_pnl_per_100_shares")).toMatchObject({
      requiredFields: ["shareQuantity", "netPnl"],
      unavailableConditions: ["zero_total_population", "incomplete_share_quantity_authority", "zero_share_quantity_denominator"],
    });
    expect(declaration("return_on_entry_notional")).toMatchObject({
      requiredFields: ["entryNotional", "netPnl"],
      unavailableConditions: ["zero_total_population", "incomplete_entry_notional_authority", "zero_entry_notional_denominator", "zero_denominator"],
    });
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
