import { describe, expect, it } from "vitest";

import {
  buildAnalyticalPartitionReceipt,
  createSyntheticInMemoryReadOnlySource,
  executeWeekdayAnalysis,
  normalizeWeekdayAnalysisArguments,
  readAnalyticalDatasetWithDerivation,
  verifyAnalysisRunReceipt,
  verifyWeekdayAnalysisArguments,
  WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
} from "../../analytics";
import {
  buildSyntheticCanonicalExecution,
  buildSyntheticGa0B1Authority,
} from "../../testing";
import type { CanonicalExecutionEnvelope } from "../../domain";

interface TradeSpec {
  readonly date: string;
  readonly minute: number;
  readonly netPnl: string;
  readonly currency?: "CAD" | "USD";
}

function priceForNetPnl(netPnl: string): string {
  const values: Readonly<Record<string, string>> = Object.freeze({
    "-20": "1",
    "-2": "19",
    "-1": "20",
    "0": "21",
    "1": "22",
    "2": "23",
  });
  const value = values[netPnl];
  if (value === undefined) throw new Error(`unsupported synthetic pnl ${netPnl}`);
  return value;
}

function executionsForTrades(
  specs: readonly TradeSpec[],
): readonly CanonicalExecutionEnvelope[] {
  const executions: CanonicalExecutionEnvelope[] = [];
  const orderedSpecs = [...specs].sort((left, right) =>
    left.date < right.date
      ? -1
      : left.date > right.date
        ? 1
        : left.minute - right.minute);
  orderedSpecs.forEach((spec, index) => {
    const entryIndex = index * 2 + 1;
    const exitIndex = entryIndex + 1;
    const hour = 14 + ((spec.minute - (spec.minute % 60)) / 60);
    const minute = spec.minute % 60;
    const entryMinute = String(minute).padStart(2, "0");
    const exitMinute = String(minute + 1).padStart(2, "0");
    const currency = spec.currency ?? "USD";
    const common = {
      currency,
      quantity: "1",
      charges: [{ kind: "commission" as const, amount: "0", currency }],
      sourceTimezoneEvidence: "UTC+00:00",
      timestampPrecision: "minute" as const,
    };
    executions.push(
      buildSyntheticCanonicalExecution({
        ...common,
        executionId: `B2-ENTRY-${String(entryIndex).padStart(3, "0")}`,
        orderId: `B2-ORDER-${String(entryIndex).padStart(3, "0")}`,
        brokerExecutionIndex: String(entryIndex),
        brokerFillSequence: String(entryIndex),
        originalSourceRowLocator: {
          kind: "row_number",
          value: String(entryIndex),
          rowOrderPreserved: true,
        },
        executedAt: `${spec.date}T${String(hour).padStart(2, "0")}:${entryMinute}:00.000000000Z`,
        side: "buy",
        price: "21",
      }),
      buildSyntheticCanonicalExecution({
        ...common,
        executionId: `B2-EXIT-${String(exitIndex).padStart(3, "0")}`,
        orderId: `B2-ORDER-${String(exitIndex).padStart(3, "0")}`,
        brokerExecutionIndex: String(exitIndex),
        brokerFillSequence: String(exitIndex),
        originalSourceRowLocator: {
          kind: "row_number",
          value: String(exitIndex),
          rowOrderPreserved: true,
        },
        executedAt: `${spec.date}T${String(hour).padStart(2, "0")}:${exitMinute}:00.000000000Z`,
        side: "sell",
        price: priceForNetPnl(spec.netPnl),
      }),
    );
  });
  return Object.freeze(executions);
}

const BASELINE_DATES = Object.freeze([
  "2026-07-01",
  "2026-07-02",
  "2026-07-06",
  "2026-07-07",
  "2026-07-08",
  "2026-07-09",
  "2026-07-13",
  "2026-07-14",
  "2026-07-15",
  "2026-07-16",
]);

function eligibleTradeSpecs(): readonly TradeSpec[] {
  const targetPnls = ["-2", "-2", "-2", "-2", "-2", "-2", "-2", "-2", "1", "1"];
  const fridayDates = [
    "2026-07-03", "2026-07-03", "2026-07-03", "2026-07-03",
    "2026-07-10", "2026-07-10", "2026-07-10",
    "2026-07-17", "2026-07-17", "2026-07-17",
  ];
  const target = targetPnls.map((netPnl, index) => ({
    date: fridayDates[index],
    minute: (index % 4) * 5,
    netPnl,
  }));
  const baseline = BASELINE_DATES.flatMap((date, index) => [
    { date, minute: 30, netPnl: index < 2 ? "-1" : "1" },
    { date, minute: 40, netPnl: "1" },
  ]);
  return Object.freeze([...target, ...baseline]);
}

function executeFixture(
  specs: readonly TradeSpec[] = eligibleTradeSpecs(),
  argumentsValue?: unknown,
) {
  const authority = buildSyntheticGa0B1Authority(executionsForTrades(specs));
  const derived = readAnalyticalDatasetWithDerivation(
    createSyntheticInMemoryReadOnlySource(authority),
  );
  if (!derived.ok) throw new Error(JSON.stringify(derived.error));
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) {
    throw new Error(
      `${partition.error.code}:${partition.error.path}:${JSON.stringify({
        rows: derived.value.datasetReceipt.rows.length,
        currencies: derived.value.datasetReceipt.currencyPartitions,
        exclusions: derived.value.datasetReceipt.excludedCandidates.map(
          (candidate) => candidate.reasonCode,
        ),
      })}`,
    );
  }
  const result = executeWeekdayAnalysis({
    snapshot: authority.snapshot,
    snapshotDependencies: authority.snapshotDependencies,
    canonicalFilter: authority.snapshotDependencies.filter,
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
    arguments: argumentsValue,
  });
  return { authority, derived: derived.value, partition: partition.value, result };
}

function tableCell(
  result: ReturnType<typeof executeFixture>["result"],
  tableKey: string,
  rowKey: string,
  columnKey: string,
) {
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  const table = result.value.tables.find((item) => item.tableKey === tableKey);
  const row = table?.rows.find((item) => item.rowKey === rowKey);
  const cell = row?.cells.find((item) => item.columnKey === columnKey);
  if (cell === undefined) throw new Error(`${tableKey}:${rowKey}:${columnKey}`);
  return cell.metric;
}

describe("GA0-B2 weekday arguments and registry policy", () => {
  it("uses an explicit content-addressed Friday default and rejects localized or foreign policies", () => {
    const normalized = normalizeWeekdayAnalysisArguments();
    expect(normalized).toMatchObject({
      ok: true,
      value: {
        argumentSchemaDigest: WEEKDAY_ARGUMENT_SCHEMA_DIGEST,
        values: {
          targetWeekday: "friday",
          comparisonPolicy: "all_other_represented_weekdays_v1",
          evidenceSamplePolicy: "ti_v3_weekday_conservative_evidence_v1",
          outlierPolicy: "ti_v3_weekday_outlier_contribution_v1",
        },
      },
    });
    if (!normalized.ok) return;
    const verified = verifyWeekdayAnalysisArguments(normalized.value);
    expect(
      verified,
      verified.ok ? undefined : JSON.stringify(verified.error),
    ).toMatchObject({ ok: true });
    expect(
      normalizeWeekdayAnalysisArguments({ targetWeekday: "Friday" }),
    ).toMatchObject({ ok: false });
    expect(
      normalizeWeekdayAnalysisArguments({ comparisonPolicy: "nearest_day" }),
    ).toMatchObject({ ok: false });
  });
});

describe("GA0-B2 exact weekday summary and target partition", () => {
  it("produces semantic weekday order, exact arithmetic, evidence, series, diagnostics, and a terminal receipt", () => {
    const fixture = executeFixture();
    expect(
      fixture.result,
      fixture.result.ok ? undefined : JSON.stringify(fixture.result.error),
    ).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    const execution = fixture.result.value;
    const summary = execution.tables.find(
      (table) => table.tableKey === "weekday_summary",
    );
    expect(summary?.rows.map((row) => row.rowKey)).toEqual([
      "weekday_monday",
      "weekday_tuesday",
      "weekday_wednesday",
      "weekday_thursday",
      "weekday_friday",
    ]);
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "included_trade_count",
      ),
    ).toMatchObject({ kind: "integer", value: "10" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "net_pnl",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-14", currency: "USD" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "net_expectancy",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-1.4" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "median_net_pnl",
      ),
    ).toMatchObject({ kind: "exact_decimal", value: "-2" });
    expect(
      tableCell(
        fixture.result,
        "weekday_summary",
        "weekday_friday",
        "win_rate",
      ),
    ).toMatchObject({ kind: "exact_ratio", numerator: "1", denominator: "5" });
    expect(
      tableCell(
        fixture.result,
        "target_weekday_baseline_summary",
        "target_friday",
        "after_loss_count",
      ),
    ).toMatchObject({ kind: "integer", value: "5" });
    expect(execution.claims).toHaveLength(1);
    expect(execution.claims[0]).toMatchObject({
      claimType: "target_weekday_lower_historical_net_expectancy",
      confidenceEvidenceLabel: "tentative",
      outlierSensitivityState: "stable",
      targetSampleSize: "10",
      comparisonSampleSize: "20",
      allowedWordingCode:
        "target_weekday_had_lower_historical_expectancy_than_baseline",
    });
    expect(execution.claims[0].counterexampleEvidenceBundleDigests.length)
      .toBeGreaterThanOrEqual(2);
    expect(execution.series.map((series) => series.seriesKey)).toEqual([
      "exact_net_pnl_by_weekday",
      "included_trade_count_by_weekday",
      "exact_expectancy_by_weekday",
      "target_weekday_vs_baseline_expectancy",
    ]);
    expect(execution.receipt).toMatchObject({
      runStatus: "completed",
      partitionCurrency: "USD",
      includedCount: "30",
      excludedCount: "0",
    });
    expect(
      verifyAnalysisRunReceipt(execution.receipt, {
        runContext: execution.runContext,
        tables: execution.tables,
        claims: execution.claims,
        series: execution.series,
        evidenceBundles: execution.evidenceBundles,
        diagnostics: execution.diagnostics,
      }),
    ).toMatchObject({ ok: true });
  }, 30_000);

  it("proves target and baseline are disjoint and exhaustive", () => {
    const fixture = executeFixture();
    if (!fixture.result.ok) throw new Error(fixture.result.error.code);
    const comparison = fixture.result.value.tables.find(
      (table) => table.tableKey === "target_weekday_baseline_summary",
    );
    expect(comparison?.rows.map((row) => ({
      key: row.rowKey,
      evidence: fixture.result.ok
        ? fixture.result.value.evidenceBundles.find(
            (bundle) => bundle.bundleDigest === row.evidenceBundleDigest,
          )?.candidateKeys
        : [],
    }))).toSatisfy((groups: Array<{ evidence?: readonly string[] }>) => {
      const target = new Set(groups[0].evidence);
      const baseline = new Set(groups[1].evidence);
      return (
        [...target].every((key) => !baseline.has(key)) &&
        target.size + baseline.size === 30
      );
    });
  }, 30_000);
});

describe("GA0-B2 conservative sample and outlier policy", () => {
  it("returns a limited descriptive artifact graph and abstains below five target observations", () => {
    const target = eligibleTradeSpecs().filter((spec) => spec.date === "2026-07-03");
    const baseline = eligibleTradeSpecs().filter((spec) => spec.date !== "2026-07-03" && !["2026-07-10", "2026-07-17"].includes(spec.date));
    const fixture = executeFixture([...target, ...baseline]);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.claims).toHaveLength(0);
    expect(fixture.result.value.receipt.runStatus).toBe("limited");
    expect(
      fixture.result.value.diagnostics.entries.map((entry) => entry.code),
    ).toContain("ti_v3_weekday_target_sample_insufficient");
  }, 30_000);

  it("labels an outlier-concentrated result and does not promote a tendency claim", () => {
    const specs = eligibleTradeSpecs().map((spec, index) =>
      spec.date === "2026-07-03" && index === 0
        ? { ...spec, netPnl: "-20" }
        : spec);
    const fixture = executeFixture(specs);
    expect(fixture.result).toMatchObject({ ok: true });
    if (!fixture.result.ok) return;
    expect(fixture.result.value.claims).toHaveLength(0);
    expect(fixture.result.value.receipt.runStatus).toBe("limited");
    expect(
      fixture.result.value.diagnostics.entries.map((entry) => entry.code),
    ).toContain("ti_v3_weekday_outlier_contribution_exceeded");
  }, 30_000);
});

describe("GA0-B2 deterministic identity and blocked paths", () => {
  it("isolates USD and CAD into separate verified financial artifact graphs", () => {
    const mixedSpecs = [
      ...eligibleTradeSpecs(),
      { date: "2026-07-03", minute: 50, netPnl: "-1", currency: "CAD" as const },
      { date: "2026-07-06", minute: 50, netPnl: "1", currency: "CAD" as const },
    ];
    const authority = buildSyntheticGa0B1Authority(
      executionsForTrades(mixedSpecs),
    );
    const derived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    if (!derived.ok) throw new Error(derived.error.code);
    const executeCurrency = (currency: "CAD" | "USD") => {
      const partition = buildAnalyticalPartitionReceipt({
        schemaVersion: "ti_v3_analytical_partition_v1",
        datasetReceipt: derived.value.datasetReceipt,
        currency,
      });
      if (!partition.ok) throw new Error(partition.error.code);
      return executeWeekdayAnalysis({
        snapshot: authority.snapshot,
        snapshotDependencies: authority.snapshotDependencies,
        canonicalFilter: authority.snapshotDependencies.filter,
        datasetReceipt: derived.value.datasetReceipt,
        datasetDerivationReceipt: derived.value.derivationReceipt,
        partitionReceipt: partition.value,
      });
    };
    const usd = executeCurrency("USD");
    const cad = executeCurrency("CAD");
    expect(usd).toMatchObject({
      ok: true,
      value: { receipt: { partitionCurrency: "USD", includedCount: "30" } },
    });
    expect(cad).toMatchObject({
      ok: true,
      value: { receipt: { partitionCurrency: "CAD", includedCount: "2" } },
    });
    if (!usd.ok || !cad.ok) return;
    expect(
      usd.value.tables.flatMap((table) =>
        table.rows.flatMap((row) =>
          row.cells.map((entry) => entry.metric.currency)),
      ).filter((currency) => currency !== null),
    ).not.toContain("CAD");
    expect(
      cad.value.tables.flatMap((table) =>
        table.rows.flatMap((row) =>
          row.cells.map((entry) => entry.metric.currency)),
      ).filter((currency) => currency !== null),
    ).not.toContain("USD");
  }, 30_000);

  it("is invariant to caller execution order", () => {
    const specs = eligibleTradeSpecs();
    const forward = executeFixture(specs);
    const reversedAuthority = buildSyntheticGa0B1Authority(
      [...executionsForTrades(specs)].reverse(),
    );
    const reversedDerived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(reversedAuthority),
    );
    if (!forward.result.ok || !reversedDerived.ok) {
      throw new Error("fixture failed");
    }
    const reversedPartition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: reversedDerived.value.datasetReceipt,
      currency: "USD",
    });
    if (!reversedPartition.ok) throw new Error(reversedPartition.error.code);
    const reversed = executeWeekdayAnalysis({
      snapshot: reversedAuthority.snapshot,
      snapshotDependencies: reversedAuthority.snapshotDependencies,
      canonicalFilter: reversedAuthority.snapshotDependencies.filter,
      datasetReceipt: reversedDerived.value.datasetReceipt,
      datasetDerivationReceipt: reversedDerived.value.derivationReceipt,
      partitionReceipt: reversedPartition.value,
    });
    expect(reversed).toMatchObject({ ok: true });
    if (!reversed.ok) return;
    expect(reversed.value.receipt.runDigest).toBe(
      forward.result.value.receipt.runDigest,
    );
  }, 30_000);

  it("returns diagnostics-only blocked output for a verified zero-included partition", () => {
    const authority = buildSyntheticGa0B1Authority(
      executionsForTrades(eligibleTradeSpecs()),
      { filterOverrides: { outcomeFilters: ["flat"] } },
    );
    const derived = readAnalyticalDatasetWithDerivation(
      createSyntheticInMemoryReadOnlySource(authority),
    );
    if (!derived.ok) throw new Error(derived.error.code);
    const partition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: derived.value.datasetReceipt,
      currency: "USD",
    });
    if (!partition.ok) throw new Error(partition.error.code);
    const result = executeWeekdayAnalysis({
      snapshot: authority.snapshot,
      snapshotDependencies: authority.snapshotDependencies,
      canonicalFilter: authority.snapshotDependencies.filter,
      datasetReceipt: derived.value.datasetReceipt,
      datasetDerivationReceipt: derived.value.derivationReceipt,
      partitionReceipt: partition.value,
    });
    expect(result).toMatchObject({
      ok: true,
      value: {
        tables: [],
        claims: [],
        series: [],
        evidenceBundles: [],
        receipt: { runStatus: "blocked" },
        diagnostics: {
          entries: [{ severity: "blocked", code: "ti_v3_weekday_partition_blocked" }],
        },
      },
    });
  }, 30_000);
});
