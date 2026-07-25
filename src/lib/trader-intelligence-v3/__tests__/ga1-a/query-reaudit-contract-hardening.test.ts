import { describe, expect, it } from "vitest";

import {
  buildSyntheticQueryFixture,
  buildExactMetricValue,
  buildTradeQueryComparison,
  buildTradeQueryResult,
  executeTradeQuery,
  getTradeQueryMetricDeclaration,
  TRADE_QUERY_METRIC_KEYS,
  verifyTradeQueryComparison,
  verifyTradeQueryResultShape,
  type TradeQueryMetricKey,
  type TradeQueryResult,
} from "../../analytics";

function execute(
  metrics: readonly TradeQueryMetricKey[] = ["net_pnl", "win_rate", "profit_factor"],
): Readonly<{
  readonly fixture: ReturnType<typeof buildSyntheticQueryFixture>;
  readonly result: TradeQueryResult;
}> {
  const fixture = buildSyntheticQueryFixture();
  const result = executeTradeQuery({
    source: fixture.source,
    partitionReceipt: fixture.partition,
    queryPlan: fixture.plan({ metrics }),
  });
  expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return Object.freeze({ fixture, result: result.value });
}

function redigest(mutator: (body: Record<string, unknown>) => void, result: TradeQueryResult) {
  const cloned = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
  delete cloned.resultDigest;
  delete cloned.executionReceipt;
  mutator(cloned);
  for (const row of cloned.rows as Array<{ metrics: Array<Record<string, unknown>> }>) {
    row.metrics = row.metrics.map((metric) => {
      const { metricDigest: _metricDigest, ...content } = metric;
      void _metricDigest;
      const rebuilt = buildExactMetricValue({
        ...content,
        value: Object.prototype.hasOwnProperty.call(content, "value")
          ? content.value
          : null,
      });
      expect(rebuilt, JSON.stringify(rebuilt)).toMatchObject({ ok: true });
      if (!rebuilt.ok) throw new Error(`${rebuilt.error.code}:${rebuilt.error.path}`);
      return rebuilt.value as unknown as Record<string, unknown>;
    });
  }
  const rebuilt = buildTradeQueryResult(cloned as never);
  expect(rebuilt, JSON.stringify(rebuilt)).toMatchObject({ ok: true });
  if (!rebuilt.ok) throw new Error(`${rebuilt.error.code}:${rebuilt.error.path}`);
  return rebuilt.value;
}

describe("GA1-A independent re-audit contract hardening", () => {
  it("rejects re-digested fabricated execution metrics at the comparison authority boundary", () => {
    const target = execute();
    const baseline = execute();
    for (const mutate of [
      (body: Record<string, unknown>) => {
        const metrics = ((body.rows as Array<{ metrics: Array<{ metricKey: string; value?: string }> }>)[0].metrics);
        metrics.find((metric) => metric.metricKey === "net_pnl")!.value = "999999";
      },
      (body: Record<string, unknown>) => {
        const metrics = ((body.rows as Array<{ metrics: Array<{ metricKey: string; numerator?: string }> }>)[0].metrics);
        metrics.find((metric) => metric.metricKey === "win_rate")!.numerator = "999999";
      },
      (body: Record<string, unknown>) => {
        const metrics = ((body.rows as Array<{ metrics: Array<{ metricKey: string; numerator?: string }> }>)[0].metrics);
        metrics.find((metric) => metric.metricKey === "profit_factor")!.numerator = "999999";
      },
    ]) {
      const fabricated = redigest(mutate, target.result);
      expect(verifyTradeQueryResultShape(fabricated, target.fixture.authority)).toMatchObject({ ok: true });
      expect(buildTradeQueryComparison(
        fabricated,
        baseline.result,
        target.fixture.authority,
      )).toMatchObject({
        ok: false,
        error: { path: "$.comparison.verifiedExecutions" },
      });
    }
  });

  it("rejects missing, extra, duplicate, and invalid metric semantics even after redigesting", () => {
    const { fixture, result } = execute();
    const cases = [
      (body: Record<string, unknown>) => {
        (body.rows as Array<{ metrics: unknown[] }>)[0].metrics.pop();
      },
      (body: Record<string, unknown>) => {
        const metrics = (body.rows as Array<{ metrics: unknown[] }>)[0].metrics;
        metrics.push(structuredClone(metrics[0]));
      },
      (body: Record<string, unknown>) => {
        const metrics = (body.rows as Array<{ metrics: unknown[] }>)[0].metrics;
        metrics.push(structuredClone(metrics[0]));
      },
      (body: Record<string, unknown>) => {
        const metric = (body.rows as Array<{ metrics: Array<{ metricKey: string; unit: string; currency: string | null }> }>)[0]
          .metrics.find((candidate) => candidate.metricKey === "net_pnl")!;
        metric.unit = "shares";
        metric.currency = null;
      },
      (body: Record<string, unknown>) => {
        const metric = (body.rows as Array<{ metrics: Array<{ metricKey: string; currency: string | null }> }>)[0]
          .metrics.find((candidate) => candidate.metricKey === "net_pnl")!;
        metric.currency = "CAD";
      },
    ];
    for (const mutate of cases) {
      expect(verifyTradeQueryResultShape(redigest(mutate, result), fixture.authority))
        .toMatchObject({ ok: false });
    }
  });

  it("reconstructs a transported comparison only from the two verified executions", () => {
    const target = execute();
    const baseline = execute();
    const comparison = buildTradeQueryComparison(
      target.result,
      baseline.result,
      target.fixture.authority,
    );
    expect(comparison, JSON.stringify(comparison)).toMatchObject({ ok: true });
    if (!comparison.ok) return;
    expect(verifyTradeQueryComparison(
      JSON.parse(JSON.stringify(comparison.value)),
      target.result,
      baseline.result,
      target.fixture.authority,
    )).toMatchObject({ ok: true });
    const fabricated = structuredClone(comparison.value) as unknown as {
      metrics: Array<{ difference: { value?: string } }>;
    };
    fabricated.metrics[0].difference.value = "999999";
    expect(verifyTradeQueryComparison(
      fabricated,
      target.result,
      baseline.result,
      target.fixture.authority,
    )).toMatchObject({ ok: false });
  });

  it("declares projector authority, availability, unit, and currency behavior explicitly", () => {
    expect(getTradeQueryMetricDeclaration("gross_pnl")).toMatchObject({
      requiredFields: ["grossPnl"], unit: "money", currencyBehavior: "selected_partition",
    });
    expect(getTradeQueryMetricDeclaration("signed_charges")).toMatchObject({
      requiredFields: ["signedCharges"], unit: "money",
    });
    expect(getTradeQueryMetricDeclaration("unique_account_count")).toMatchObject({
      requiredFields: ["canonicalAccountKey"], unit: "accounts",
    });
    expect(getTradeQueryMetricDeclaration("total_execution_count")).toMatchObject({
      requiredFields: ["supportingExecutionDigests"], unit: "executions",
    });
    expect(getTradeQueryMetricDeclaration("profit_factor")).toMatchObject({
      requiredDerivedSemantics: ["realized_outcome"], minimumSample: "1",
      unavailablePolicy: "ti_v3_query_profit_factor_zero_loss_denominator",
    });
    for (let index = 0; index < TRADE_QUERY_METRIC_KEYS.length; index += 64) {
      const { result } = execute(TRADE_QUERY_METRIC_KEYS.slice(index, index + 64));
      for (const metric of result.rows[0].metrics) {
        const declaration = getTradeQueryMetricDeclaration(metric.metricKey as TradeQueryMetricKey);
        expect(metric.unit, metric.metricKey).toBe(declaration.unit);
        expect(metric.currency).toBe(
          declaration.currencyBehavior === "selected_partition" ? "USD" : null,
        );
      }
    }
  });
});
