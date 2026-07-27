import { describe, expect, it } from "vitest";

import {
  EXECUTION_PLAN_CATALOG,
  TRADE_QUERY_METRIC_KEYS,
  TRADE_QUERY_METRIC_REGISTRY,
  executionPlanCatalogMetricKeys,
  verifyExecutionPlanCatalog,
} from "../../analytics";

describe("execution plan catalog lock", () => {
  it("binds every registered execution metric to a planned implemented family", () => {
    expect(verifyExecutionPlanCatalog()).toEqual({
      completeMetricCoverage: true,
      duplicatePlanFamilyKeys: [],
      duplicateMetricKeysWithinFamily: [],
    });
    expect(executionPlanCatalogMetricKeys()).toEqual(
      [...TRADE_QUERY_METRIC_KEYS].sort(),
    );
    const declared = new Set(TRADE_QUERY_METRIC_REGISTRY.entries.map((entry) => entry.metricKey));
    for (const catalog of EXECUTION_PLAN_CATALOG) {
      for (const key of catalog.metricKeys) expect(declared.has(key), key).toBe(true);
      if (catalog.state === "implemented") expect(catalog.metricKeys.length, catalog.planFamilyKey).toBeGreaterThan(0);
    }
  });

  it("keeps source-field and non-execution boundaries explicit instead of inventing a metric", () => {
    expect(EXECUTION_PLAN_CATALOG).toEqual(expect.arrayContaining([
      expect.objectContaining({
        planFamilyKey: "commission_only_round_trip_analytics",
        state: "requires_execution_field",
        metricKeys: [],
      }),
      expect.objectContaining({
        planFamilyKey: "market_setup_risk_and_exit_quality",
        state: "not_execution_derived",
        metricKeys: [],
      }),
    ]));
  });
});
