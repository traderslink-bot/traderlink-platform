import { compareUnicodeCodePoints } from "../../../domain/canonical";
import {
  type CurrencyCode,
  type ExactResult,
} from "../../../domain/exact";
import type {
  AnalysisSnapshotDependencies,
} from "../../../domain/snapshot";
import type { CanonicalQueryFilter } from "../../../domain/query";
import {
  ANALYSIS_RUN_CONTEXT_VERSION,
  ANALYSIS_RUN_RECEIPT_VERSION,
  ANALYTICAL_DIAGNOSTICS_VERSION,
  ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
  CHART_READY_SERIES_VERSION,
  EXACT_TABLE_VERSION,
  VALIDATED_CLAIM_VERSION,
  buildAnalysisRunContext,
  buildAnalysisRunReceipt,
  buildAnalyticalDiagnostics,
  buildAnalyticalEvidenceBundle,
  buildChartReadySeries,
  buildExactTable,
  buildValidatedClaim,
  contractFailure,
  getAnalysisRunContextDependencies,
  type AnalysisRunContext,
  type AnalysisRunReceipt,
  type AnalyticalContractFailure,
  type AnalyticalDiagnostics,
  type AnalyticalEvidenceBundle,
  type ChartReadySeries,
  type ExactMetricValue,
  type ExactTable,
  type ValidatedClaim,
} from "../../contracts";
import type {
  AnalyticalDatasetDerivationReceipt,
} from "../../adapters/snapshot-read-model";
import {
  verifyAnalyticalDatasetReceipt,
  verifyAnalyticalPartitionReceipt,
  type AnalyticalDatasetReceipt,
  type AnalyticalPartitionReceipt,
  type AnalyticalRow,
} from "../../dataset";
import type {
  NormalizedAnalysisArguments,
  ToolRegistryEntry,
} from "../../registry";
import {
  absoluteExactDecimal,
  compareCanonicalDecimals,
  decimalMetric,
  enumMetric,
  integerMetric,
  medianMetric,
  metricDirection,
  quotientMetric,
  ratioFromCounts,
  ratioFromDecimals,
  subtractMetrics,
  sumExactDecimals,
  unavailableMetric,
} from "./weekday-exact-math";
import {
  WEEKDAY_SEMANTIC_ORDER,
  WEEKDAY_TOOL_POLICY,
  buildWeekdayToolRegistryEntry,
  normalizeWeekdayAnalysisArguments,
  verifyWeekdayAnalysisArguments,
  type WeekdayAnalysisArguments,
} from "./weekday-policy";

export interface WeekdayAnalysisExecutionInput {
  readonly snapshot: unknown;
  readonly snapshotDependencies: AnalysisSnapshotDependencies;
  readonly canonicalFilter: CanonicalQueryFilter;
  readonly datasetReceipt: AnalyticalDatasetReceipt;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly arguments?: unknown;
}

export interface WeekdayAnalysisExecution {
  readonly normalizedArguments: NormalizedAnalysisArguments;
  readonly registryEntry: ToolRegistryEntry;
  readonly runContext: AnalysisRunContext;
  readonly evidenceBundles: readonly AnalyticalEvidenceBundle[];
  readonly tables: readonly ExactTable[];
  readonly claims: readonly ValidatedClaim[];
  readonly series: readonly ChartReadySeries[];
  readonly diagnostics: AnalyticalDiagnostics;
  readonly receipt: AnalysisRunReceipt;
}

type AfterLossState = "after_loss" | "first_trade" | "not_after_loss";

interface RowState {
  readonly row: AnalyticalRow;
  readonly afterLossState: AfterLossState;
}

interface Summary {
  readonly rows: readonly RowState[];
  readonly count: string;
  readonly wins: string;
  readonly losses: string;
  readonly flats: string;
  readonly grossPnl: string;
  readonly signedCharges: string;
  readonly netPnl: string;
  readonly expectancy: ExactMetricValue;
  readonly medianNetPnl: ExactMetricValue;
  readonly winRate: ExactMetricValue;
  readonly best: AnalyticalRow;
  readonly worst: AnalyticalRow;
  readonly largestWin: AnalyticalRow | null;
  readonly largestLoss: AnalyticalRow | null;
  readonly netPnlWithoutLargestWin: string;
  readonly netPnlWithoutLargestLoss: string;
  readonly afterLossCount: string;
  readonly afterLossRate: ExactMetricValue;
  readonly notionalAvailableCount: string;
  readonly notionalTotal: ExactMetricValue;
  readonly notionalMedian: ExactMetricValue;
  readonly quantityAvailableCount: string;
  readonly quantityTotal: ExactMetricValue;
  readonly quantityMedian: ExactMetricValue;
  readonly largestWinningContribution: ExactMetricValue;
  readonly largestLosingContribution: ExactMetricValue;
  readonly maximumAbsoluteTradeConcentration: ExactMetricValue;
}

class WeekdayConstructionError extends Error {
  constructor(
    readonly code: string,
    readonly path: string,
  ) {
    super(code);
  }
}

function required<T>(
  result: ExactResult<T, { readonly code: string; readonly path?: string }>,
  path: string,
): T {
  if (!result.ok) {
    throw new WeekdayConstructionError(
      result.error.code,
      `${path}${result.error.path ?? "$"}`,
    );
  }
  return result.value;
}

function compareRowsByStableEvidence(
  left: AnalyticalRow,
  right: AnalyticalRow,
): number {
  return compareUnicodeCodePoints(
    left.semanticRoundTripKey,
    right.semanticRoundTripKey,
  );
}

function selectBest(rows: readonly AnalyticalRow[]): AnalyticalRow {
  return [...rows].sort((left, right) => {
    const compared = compareCanonicalDecimals(right.netPnl, left.netPnl);
    return compared !== 0 ? compared : compareRowsByStableEvidence(left, right);
  })[0];
}

function selectWorst(rows: readonly AnalyticalRow[]): AnalyticalRow {
  return [...rows].sort((left, right) => {
    const compared = compareCanonicalDecimals(left.netPnl, right.netPnl);
    return compared !== 0 ? compared : compareRowsByStableEvidence(left, right);
  })[0];
}

function removeRow(
  rows: readonly AnalyticalRow[],
  removed: AnalyticalRow | null,
): readonly AnalyticalRow[] {
  return removed === null
    ? rows
    : rows.filter(
        (row) => row.semanticRoundTripKey !== removed.semanticRoundTripKey,
      );
}

function exactCountDifference(left: string, right: string): string {
  return (BigInt(left) - BigInt(right)).toString();
}

function groupRowsByVerifiedSequence(
  rows: readonly AnalyticalRow[],
): readonly RowState[] {
  const sessions = new Map<string, AnalyticalRow[]>();
  for (const row of rows) {
    const key = [
      row.canonicalOwnerKey,
      row.canonicalAccountKey,
      row.currency,
      row.sessionDate,
    ].join(":");
    sessions.set(key, [...(sessions.get(key) ?? []), row]);
  }
  const states: RowState[] = [];
  for (const key of [...sessions.keys()].sort(compareUnicodeCodePoints)) {
    const ordered = [...(sessions.get(key) as AnalyticalRow[])].sort(
      (left, right) => {
        const leftSequence = BigInt(left.sequenceInPartition);
        const rightSequence = BigInt(right.sequenceInPartition);
        return leftSequence < rightSequence
          ? -1
          : leftSequence > rightSequence
            ? 1
            : compareRowsByStableEvidence(left, right);
      },
    );
    ordered.forEach((row, index) => {
      const previous = index === 0 ? null : ordered[index - 1];
      states.push(Object.freeze({
        row,
        afterLossState:
          previous === null
            ? "first_trade"
            : compareCanonicalDecimals(previous.netPnl, "0") < 0
              ? "after_loss"
              : "not_after_loss",
      }));
    });
  }
  return Object.freeze(states);
}

function sumRowPnl(rows: readonly AnalyticalRow[]): string {
  return required(
    sumExactDecimals(rows.map((row) => row.netPnl)),
    "$.netPnl",
  );
}

function contributionMetric(
  metricKey: string,
  row: AnalyticalRow | null,
  total: string,
): ExactMetricValue {
  if (row === null || total === "0") {
    return unavailableMetric(
      metricKey,
      "ratio",
      null,
      "ti_v3_weekday_contribution_not_meaningful",
    );
  }
  const numerator = required(
    absoluteExactDecimal(row.netPnl),
    "$.contribution.numerator",
  );
  const denominator = required(
    absoluteExactDecimal(total),
    "$.contribution.denominator",
  );
  return ratioFromDecimals(metricKey, numerator, denominator);
}

function summarize(
  states: readonly RowState[],
  currency: CurrencyCode,
): Summary {
  if (states.length === 0) {
    throw new WeekdayConstructionError(
      "ti_v3_weekday_zero_sample",
      "$.summary",
    );
  }
  const rows = states.map((state) => state.row);
  const wins = rows.filter(
    (row) => compareCanonicalDecimals(row.netPnl, "0") > 0,
  );
  const losses = rows.filter(
    (row) => compareCanonicalDecimals(row.netPnl, "0") < 0,
  );
  const flats = rows.filter(
    (row) => compareCanonicalDecimals(row.netPnl, "0") === 0,
  );
  const grossPnl = required(
    sumExactDecimals(rows.map((row) => row.grossPnl)),
    "$.grossPnl",
  );
  const signedCharges = required(
    sumExactDecimals(rows.map((row) => row.signedCharges)),
    "$.signedCharges",
  );
  const netPnl = sumRowPnl(rows);
  const best = selectBest(rows);
  const worst = selectWorst(rows);
  const largestWin = wins.length === 0 ? null : selectBest(wins);
  const largestLoss = losses.length === 0 ? null : selectWorst(losses);
  const rowsWithoutLargestWin = removeRow(rows, largestWin);
  const rowsWithoutLargestLoss = removeRow(rows, largestLoss);
  const availableNotionals = rows.flatMap((row) =>
    row.entryNotional.state === "available" ? [row.entryNotional.amount] : [],
  );
  const availableQuantities = rows.flatMap((row) =>
    row.shareQuantity.state === "available"
      ? [row.shareQuantity.quantity]
      : [],
  );
  const absoluteValues = rows.map((row) =>
    required(absoluteExactDecimal(row.netPnl), "$.absoluteNetPnl"));
  const absoluteTotal = required(
    sumExactDecimals(absoluteValues),
    "$.absoluteNetPnlTotal",
  );
  const maximumAbsolute = [...absoluteValues].sort((left, right) =>
    compareCanonicalDecimals(right, left))[0];
  return Object.freeze({
    rows: states,
    count: String(rows.length),
    wins: String(wins.length),
    losses: String(losses.length),
    flats: String(flats.length),
    grossPnl,
    signedCharges,
    netPnl,
    expectancy: quotientMetric(
      "net_expectancy",
      "money_per_trade",
      currency,
      netPnl,
      String(rows.length),
    ),
    medianNetPnl: medianMetric(
      "median_net_pnl",
      "money",
      currency,
      rows.map((row) => row.netPnl),
    ),
    winRate: ratioFromCounts(
      "win_rate",
      String(wins.length),
      String(rows.length),
    ),
    best,
    worst,
    largestWin,
    largestLoss,
    netPnlWithoutLargestWin: sumRowPnl(rowsWithoutLargestWin),
    netPnlWithoutLargestLoss: sumRowPnl(rowsWithoutLargestLoss),
    afterLossCount: String(
      states.filter((state) => state.afterLossState === "after_loss").length,
    ),
    afterLossRate: ratioFromCounts(
      "after_loss_rate",
      String(
        states.filter((state) => state.afterLossState === "after_loss").length,
      ),
      String(rows.length),
    ),
    notionalAvailableCount: String(availableNotionals.length),
    notionalTotal:
      availableNotionals.length === 0
        ? unavailableMetric(
            "entry_notional_total",
            "notional",
            currency,
            "ti_v3_weekday_exact_notional_unavailable",
          )
        : decimalMetric(
            "entry_notional_total",
            "notional",
            currency,
            required(sumExactDecimals(availableNotionals), "$.notionalTotal"),
          ),
    notionalMedian:
      availableNotionals.length === 0
        ? unavailableMetric(
            "entry_notional_median",
            "notional",
            currency,
            "ti_v3_weekday_exact_notional_unavailable",
          )
        : medianMetric(
            "entry_notional_median",
            "notional",
            currency,
            availableNotionals,
          ),
    quantityAvailableCount: String(availableQuantities.length),
    quantityTotal:
      availableQuantities.length === 0
        ? unavailableMetric(
            "share_quantity_total",
            "shares",
            null,
            "ti_v3_weekday_exact_quantity_unavailable",
          )
        : decimalMetric(
            "share_quantity_total",
            "shares",
            null,
            required(sumExactDecimals(availableQuantities), "$.quantityTotal"),
          ),
    quantityMedian:
      availableQuantities.length === 0
        ? unavailableMetric(
            "share_quantity_median",
            "shares",
            null,
            "ti_v3_weekday_exact_quantity_unavailable",
          )
        : medianMetric(
            "share_quantity_median",
            "shares",
            null,
            availableQuantities,
          ),
    largestWinningContribution: contributionMetric(
      "largest_winning_trade_contribution",
      largestWin,
      netPnl,
    ),
    largestLosingContribution: contributionMetric(
      "largest_losing_trade_contribution",
      largestLoss,
      netPnl,
    ),
    maximumAbsoluteTradeConcentration:
      absoluteTotal === "0"
        ? unavailableMetric(
            "maximum_absolute_trade_concentration",
            "ratio",
            null,
            "ti_v3_weekday_contribution_not_meaningful",
          )
        : ratioFromDecimals(
            "maximum_absolute_trade_concentration",
            maximumAbsolute,
            absoluteTotal,
          ),
  });
}

function cell(
  columnKey: string,
  metric: ExactMetricValue,
  evidenceBundleDigest?: string,
): Readonly<{
  columnKey: string;
  metric: ExactMetricValue;
  evidenceBundleDigest?: string;
}> {
  return Object.freeze({
    columnKey,
    metric,
    ...(evidenceBundleDigest === undefined ? {} : { evidenceBundleDigest }),
  });
}

function ratioGreaterThanPolicy(metric: ExactMetricValue): boolean {
  if (metric.kind !== "exact_ratio") return false;
  return (
    BigInt(metric.numerator) *
      BigInt(WEEKDAY_TOOL_POLICY.outlierMaximumContributionDenominator) >
    BigInt(metric.denominator) *
      BigInt(WEEKDAY_TOOL_POLICY.outlierMaximumContributionNumerator)
  );
}

function buildNonBlockedExecution(
  context: AnalysisRunContext,
  argumentsValue: WeekdayAnalysisArguments,
  normalizedArguments: NormalizedAnalysisArguments,
  registryEntry: ToolRegistryEntry,
): WeekdayAnalysisExecution {
  const dependencies = getAnalysisRunContextDependencies(context);
  if (dependencies === null) {
    throw new WeekdayConstructionError(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.runContext",
    );
  }
  const partitionRows = dependencies.datasetReceipt.rows
    .filter((row) =>
      dependencies.partitionReceipt.includedRowKeys.includes(
        row.semanticRoundTripKey,
      ))
    .sort((left, right) =>
      compareRowsByStableEvidence(left, right));
  if (
    partitionRows.length === 0 ||
    partitionRows.some(
      (row) =>
        row.currency !== dependencies.partitionReceipt.currency ||
        row.timezone !== dependencies.canonicalFilter.timezone ||
        row.dateBasis !== dependencies.canonicalFilter.dateBasis,
    )
  ) {
    throw new WeekdayConstructionError(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.partitionRows",
    );
  }
  const rowStates = groupRowsByVerifiedSequence(partitionRows);
  const evidenceBundles: AnalyticalEvidenceBundle[] = [];
  const addEvidence = (
    evidenceKey: string,
    rows: readonly AnalyticalRow[],
    comparisonGroupKey: string | null,
  ): AnalyticalEvidenceBundle => {
    if (rows.length === 0) {
      throw new WeekdayConstructionError(
        "ti_v3_weekday_zero_sample",
        `$.evidence.${evidenceKey}`,
      );
    }
    const built = required(
      buildAnalyticalEvidenceBundle({
        schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
        evidenceKey,
        runContext: context,
        comparisonGroupKey,
        inclusionState: "included",
        candidateKeys: rows.map((row) => row.semanticRoundTripKey),
      }),
      `$.evidence.${evidenceKey}`,
    );
    evidenceBundles.push(built);
    return built;
  };
  const addExcludedEvidence = (
    evidenceKey: string,
    candidateKeys: readonly string[],
  ): AnalyticalEvidenceBundle => {
    const built = required(
      buildAnalyticalEvidenceBundle({
        schemaVersion: ANALYTICAL_EVIDENCE_BUNDLE_VERSION,
        evidenceKey,
        runContext: context,
        comparisonGroupKey: null,
        inclusionState: "excluded",
        candidateKeys,
      }),
      `$.evidence.${evidenceKey}`,
    );
    evidenceBundles.push(built);
    return built;
  };
  const limitations = (() => {
    const eligibility = dependencies.snapshotDependencies.eligibilitySet.results
      .find((result) =>
        result.capability === context.requiredEligibilityCapability);
    return [...new Set([
      ...dependencies.partitionReceipt.limitationCodes,
      ...(eligibility?.state === "limited" ? eligibility.reasonCodes : []),
    ])].sort(compareUnicodeCodePoints);
  })();

  const weekdayGroups = WEEKDAY_SEMANTIC_ORDER
    .map((weekday) => ({
      weekday,
      states: rowStates.filter((state) => state.row.weekday === weekday),
    }))
    .filter((group) => group.states.length > 0);
  const weekdaySummaries = weekdayGroups.map((group) => ({
    weekday: group.weekday,
    summary: summarize(group.states, dependencies.partitionReceipt.currency),
  }));
  const primaryRows = weekdaySummaries.map(({ weekday, summary }) => {
    const rows = summary.rows.map((state) => state.row);
    const groupKey = `weekday_${weekday}`;
    const allEvidence = addEvidence(`${groupKey}_all`, rows, groupKey);
    const bestEvidence = addEvidence(
      `${groupKey}_best_trade`,
      [summary.best],
      groupKey,
    );
    const worstEvidence = addEvidence(
      `${groupKey}_worst_trade`,
      [summary.worst],
      groupKey,
    );
    const retainedWithoutWin = removeRow(rows, summary.largestWin);
    const retainedWithoutLoss = removeRow(rows, summary.largestLoss);
    const retainedWinEvidence =
      retainedWithoutWin.length === 0
        ? null
        : addEvidence(
            `${groupKey}_without_largest_win`,
            retainedWithoutWin,
            groupKey,
          );
    const retainedLossEvidence =
      retainedWithoutLoss.length === 0
        ? null
        : addEvidence(
            `${groupKey}_without_largest_loss`,
            retainedWithoutLoss,
            groupKey,
          );
    return Object.freeze({
      rowKey: groupKey,
      cells: Object.freeze([
        cell("weekday", enumMetric("weekday", "weekday", weekday)),
        cell(
          "included_trade_count",
          integerMetric("included_trade_count", "trades", summary.count),
        ),
        cell("win_count", integerMetric("win_count", "trades", summary.wins)),
        cell("loss_count", integerMetric("loss_count", "trades", summary.losses)),
        cell("flat_count", integerMetric("flat_count", "trades", summary.flats)),
        cell(
          "gross_pnl",
          decimalMetric(
            "gross_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            summary.grossPnl,
          ),
        ),
        cell(
          "signed_charges",
          decimalMetric(
            "signed_charges",
            "charges",
            dependencies.partitionReceipt.currency,
            summary.signedCharges,
          ),
        ),
        cell(
          "net_pnl",
          decimalMetric(
            "net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnl,
          ),
        ),
        cell("net_expectancy", summary.expectancy),
        cell("median_net_pnl", summary.medianNetPnl),
        cell("win_rate", summary.winRate),
        cell(
          "best_trade_net_pnl",
          decimalMetric(
            "best_trade_net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            summary.best.netPnl,
          ),
          bestEvidence.bundleDigest,
        ),
        cell(
          "worst_trade_net_pnl",
          decimalMetric(
            "worst_trade_net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            summary.worst.netPnl,
          ),
          worstEvidence.bundleDigest,
        ),
        cell(
          "net_pnl_excluding_largest_win",
          decimalMetric(
            "net_pnl_excluding_largest_win",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnlWithoutLargestWin,
          ),
          retainedWinEvidence?.bundleDigest,
        ),
        cell(
          "net_pnl_excluding_largest_loss",
          decimalMetric(
            "net_pnl_excluding_largest_loss",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnlWithoutLargestLoss,
          ),
          retainedLossEvidence?.bundleDigest,
        ),
      ]),
      evidenceBundleDigest: allEvidence.bundleDigest,
    });
  });

  const primaryColumns = Object.freeze([
    { columnKey: "weekday", valueKind: "enum", unit: "weekday" },
    {
      columnKey: "included_trade_count",
      valueKind: "integer",
      unit: "trades",
    },
    { columnKey: "win_count", valueKind: "integer", unit: "trades" },
    { columnKey: "loss_count", valueKind: "integer", unit: "trades" },
    { columnKey: "flat_count", valueKind: "integer", unit: "trades" },
    { columnKey: "gross_pnl", valueKind: "exact_decimal", unit: "money" },
    {
      columnKey: "signed_charges",
      valueKind: "exact_decimal",
      unit: "charges",
    },
    { columnKey: "net_pnl", valueKind: "exact_decimal", unit: "money" },
    {
      columnKey: "net_expectancy",
      valueKind: "exact_decimal",
      allowedValueKinds: ["exact_decimal", "exact_ratio"],
      unit: "money_per_trade",
    },
    {
      columnKey: "median_net_pnl",
      valueKind: "exact_decimal",
      allowedValueKinds: ["exact_decimal", "exact_ratio"],
      unit: "money",
    },
    { columnKey: "win_rate", valueKind: "exact_ratio", unit: "ratio" },
    {
      columnKey: "best_trade_net_pnl",
      valueKind: "exact_decimal",
      unit: "money",
    },
    {
      columnKey: "worst_trade_net_pnl",
      valueKind: "exact_decimal",
      unit: "money",
    },
    {
      columnKey: "net_pnl_excluding_largest_win",
      valueKind: "exact_decimal",
      unit: "money",
    },
    {
      columnKey: "net_pnl_excluding_largest_loss",
      valueKind: "exact_decimal",
      unit: "money",
    },
  ]);

  const tables: ExactTable[] = [];
  const primaryTable = required(
    buildExactTable({
      schemaVersion: EXACT_TABLE_VERSION,
      tableKey: "weekday_summary",
      tableVersion: "v1",
      runContext: context,
      titlePurposeCode: "authoritative_exact_weekday_summary",
      currency: dependencies.partitionReceipt.currency,
      timezone: dependencies.canonicalFilter.timezone,
      dateBasis: dependencies.canonicalFilter.dateBasis,
      denominatorPolicy: "all_included_trades_flats_in_denominator",
      columns: primaryColumns,
      rows: primaryRows,
      summaryRows: [],
      includedCount: dependencies.partitionReceipt.includedCount,
      excludedCount: dependencies.partitionReceipt.excludedCount,
      coverageEligibilityState: context.eligibilityState,
      limitationCodes: limitations,
      evidenceBundles,
    }),
    "$.tables.weekdaySummary",
  );
  tables.push(primaryTable);

  const targetStates = rowStates.filter(
    (state) => state.row.weekday === argumentsValue.targetWeekday,
  );
  const baselineStates = rowStates.filter(
    (state) => state.row.weekday !== argumentsValue.targetWeekday,
  );
  const targetKeys = new Set(
    targetStates.map((state) => state.row.semanticRoundTripKey),
  );
  const baselineKeys = new Set(
    baselineStates.map((state) => state.row.semanticRoundTripKey),
  );
  if (
    [...targetKeys].some((key) => baselineKeys.has(key)) ||
    targetKeys.size + baselineKeys.size !== partitionRows.length
  ) {
    throw new WeekdayConstructionError(
      "ti_v3_weekday_partition_invariant_failed",
      "$.targetBaseline",
    );
  }

  let targetSummary: Summary | null = null;
  let baselineSummary: Summary | null = null;
  let comparisonTable: ExactTable | null = null;
  let effectTable: ExactTable | null = null;
  let distributionTable: ExactTable | null = null;
  let targetEvidence: AnalyticalEvidenceBundle | null = null;
  let baselineEvidence: AnalyticalEvidenceBundle | null = null;
  let fullDifference: ExactMetricValue | null = null;
  let medianDifference: ExactMetricValue | null = null;
  let winRemovalChangesDirection = false;
  let lossRemovalChangesDirection = false;
  let meanMedianAgree = false;
  let outlierConcentrated = false;
  let sampleState:
    | "insufficient"
    | "descriptive"
    | "eligible_tentative" = "insufficient";

  if (targetStates.length > 0 && baselineStates.length > 0) {
    targetSummary = summarize(
      targetStates,
      dependencies.partitionReceipt.currency,
    );
    baselineSummary = summarize(
      baselineStates,
      dependencies.partitionReceipt.currency,
    );
    targetEvidence = addEvidence(
      `target_${argumentsValue.targetWeekday}`,
      targetStates.map((state) => state.row),
      `target_${argumentsValue.targetWeekday}`,
    );
    baselineEvidence = addEvidence(
      "baseline_other_represented_weekdays",
      baselineStates.map((state) => state.row),
      "baseline_other_represented_weekdays",
    );
    const comparisonRows = [
      {
        rowKey: `target_${argumentsValue.targetWeekday}`,
        group: `target_${argumentsValue.targetWeekday}`,
        summary: targetSummary,
        evidence: targetEvidence,
      },
      {
        rowKey: "baseline_other_represented_weekdays",
        group: "baseline_other_represented_weekdays",
        summary: baselineSummary,
        evidence: baselineEvidence,
      },
    ].map(({ rowKey, group, summary, evidence }) => {
      const groupRows = summary.rows.map((state) => state.row);
      const largestWinEvidence = summary.largestWin === null
        ? null
        : addEvidence(
            `${rowKey}_largest_win`,
            [summary.largestWin],
            group,
          );
      const largestLossEvidence = summary.largestLoss === null
        ? null
        : addEvidence(
            `${rowKey}_largest_loss`,
            [summary.largestLoss],
            group,
          );
      const withoutWinRows = removeRow(groupRows, summary.largestWin);
      const withoutLossRows = removeRow(groupRows, summary.largestLoss);
      const withoutWinEvidence = withoutWinRows.length === 0
        ? null
        : addEvidence(`${rowKey}_without_largest_win`, withoutWinRows, group);
      const withoutLossEvidence = withoutLossRows.length === 0
        ? null
        : addEvidence(
            `${rowKey}_without_largest_loss`,
            withoutLossRows,
            group,
          );
      return Object.freeze({
        rowKey,
        cells: Object.freeze([
        cell("comparison_group", enumMetric("comparison_group", "group", group)),
        cell(
          "included_trade_count",
          integerMetric("included_trade_count", "trades", summary.count),
        ),
        cell(
          "net_pnl",
          decimalMetric(
            "net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnl,
          ),
        ),
        cell("net_expectancy", summary.expectancy),
        cell("median_net_pnl", summary.medianNetPnl),
        cell("win_rate", summary.winRate),
        cell(
          "after_loss_count",
          integerMetric("after_loss_count", "trades", summary.afterLossCount),
        ),
        cell("after_loss_rate", summary.afterLossRate),
        cell(
          "entry_notional_available_count",
          integerMetric(
            "entry_notional_available_count",
            "trades",
            summary.notionalAvailableCount,
          ),
        ),
        cell("entry_notional_total", summary.notionalTotal),
        cell("entry_notional_median", summary.notionalMedian),
        cell(
          "share_quantity_available_count",
          integerMetric(
            "share_quantity_available_count",
            "trades",
            summary.quantityAvailableCount,
          ),
        ),
        cell("share_quantity_total", summary.quantityTotal),
        cell("share_quantity_median", summary.quantityMedian),
        cell(
          "largest_winning_trade_contribution",
          summary.largestWinningContribution,
          largestWinEvidence?.bundleDigest,
        ),
        cell(
          "largest_losing_trade_contribution",
          summary.largestLosingContribution,
          largestLossEvidence?.bundleDigest,
        ),
        cell(
          "net_pnl_excluding_largest_win",
          decimalMetric(
            "net_pnl_excluding_largest_win",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnlWithoutLargestWin,
          ),
          withoutWinEvidence?.bundleDigest,
        ),
        cell(
          "net_pnl_excluding_largest_loss",
          decimalMetric(
            "net_pnl_excluding_largest_loss",
            "money",
            dependencies.partitionReceipt.currency,
            summary.netPnlWithoutLargestLoss,
          ),
          withoutLossEvidence?.bundleDigest,
        ),
      ]),
      evidenceBundleDigest: evidence.bundleDigest,
      });
    });
    comparisonTable = required(
      buildExactTable({
        schemaVersion: EXACT_TABLE_VERSION,
        tableKey: "target_weekday_baseline_summary",
        tableVersion: "v1",
        runContext: context,
        titlePurposeCode: "target_weekday_vs_all_other_represented_weekdays",
        currency: dependencies.partitionReceipt.currency,
        timezone: dependencies.canonicalFilter.timezone,
        dateBasis: dependencies.canonicalFilter.dateBasis,
        denominatorPolicy: "disjoint_exact_partition_all_included_trades",
        columns: [
          { columnKey: "comparison_group", valueKind: "enum", unit: "group" },
          { columnKey: "included_trade_count", valueKind: "integer", unit: "trades" },
          { columnKey: "net_pnl", valueKind: "exact_decimal", unit: "money" },
          { columnKey: "net_expectancy", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio"], unit: "money_per_trade" },
          { columnKey: "median_net_pnl", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio"], unit: "money" },
          { columnKey: "win_rate", valueKind: "exact_ratio", unit: "ratio" },
          { columnKey: "after_loss_count", valueKind: "integer", unit: "trades" },
          { columnKey: "after_loss_rate", valueKind: "exact_ratio", unit: "ratio" },
          { columnKey: "entry_notional_available_count", valueKind: "integer", unit: "trades" },
          { columnKey: "entry_notional_total", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "unavailable"], unit: "notional" },
          { columnKey: "entry_notional_median", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio", "unavailable"], unit: "notional" },
          { columnKey: "share_quantity_available_count", valueKind: "integer", unit: "trades" },
          { columnKey: "share_quantity_total", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "unavailable"], unit: "shares" },
          { columnKey: "share_quantity_median", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio", "unavailable"], unit: "shares" },
          { columnKey: "largest_winning_trade_contribution", valueKind: "exact_ratio", allowedValueKinds: ["exact_ratio", "unavailable"], unit: "ratio" },
          { columnKey: "largest_losing_trade_contribution", valueKind: "exact_ratio", allowedValueKinds: ["exact_ratio", "unavailable"], unit: "ratio" },
          { columnKey: "net_pnl_excluding_largest_win", valueKind: "exact_decimal", unit: "money" },
          { columnKey: "net_pnl_excluding_largest_loss", valueKind: "exact_decimal", unit: "money" },
        ],
        rows: comparisonRows,
        summaryRows: [],
        includedCount: dependencies.partitionReceipt.includedCount,
        excludedCount: dependencies.partitionReceipt.excludedCount,
        coverageEligibilityState: context.eligibilityState,
        limitationCodes: limitations,
        evidenceBundles,
      }),
      "$.tables.comparison",
    );
    tables.push(comparisonTable);

    fullDifference = subtractMetrics(
      "net_expectancy_difference",
      targetSummary.expectancy,
      baselineSummary.expectancy,
    );
    medianDifference = subtractMetrics(
      "median_net_pnl_difference",
      targetSummary.medianNetPnl,
      baselineSummary.medianNetPnl,
    );
    const fullDirection = metricDirection(fullDifference);
    const medianDirection = metricDirection(medianDifference);
    meanMedianAgree =
      fullDirection !== "unavailable" &&
      medianDirection !== "unavailable" &&
      fullDirection === medianDirection;
    const targetWithoutWinRows = removeRow(
      targetStates.map((state) => state.row),
      targetSummary.largestWin,
    );
    const targetWithoutLossRows = removeRow(
      targetStates.map((state) => state.row),
      targetSummary.largestLoss,
    );
    const withoutWinExpectancy =
      targetWithoutWinRows.length === 0
        ? unavailableMetric(
            "net_expectancy",
            "money_per_trade",
            dependencies.partitionReceipt.currency,
            "ti_v3_weekday_zero_sample",
          )
        : quotientMetric(
            "net_expectancy",
            "money_per_trade",
            dependencies.partitionReceipt.currency,
            sumRowPnl(targetWithoutWinRows),
            String(targetWithoutWinRows.length),
          );
    const withoutLossExpectancy =
      targetWithoutLossRows.length === 0
        ? unavailableMetric(
            "net_expectancy",
            "money_per_trade",
            dependencies.partitionReceipt.currency,
            "ti_v3_weekday_zero_sample",
          )
        : quotientMetric(
            "net_expectancy",
            "money_per_trade",
            dependencies.partitionReceipt.currency,
            sumRowPnl(targetWithoutLossRows),
            String(targetWithoutLossRows.length),
          );
    const withoutWinDirection = metricDirection(
      subtractMetrics(
        "net_expectancy_difference",
        withoutWinExpectancy,
        baselineSummary.expectancy,
      ),
    );
    const withoutLossDirection = metricDirection(
      subtractMetrics(
        "net_expectancy_difference",
        withoutLossExpectancy,
        baselineSummary.expectancy,
      ),
    );
    winRemovalChangesDirection =
      withoutWinDirection !== "unavailable" &&
      fullDirection !== "unavailable" &&
      withoutWinDirection !== fullDirection;
    lossRemovalChangesDirection =
      withoutLossDirection !== "unavailable" &&
      fullDirection !== "unavailable" &&
      withoutLossDirection !== fullDirection;
    outlierConcentrated = ratioGreaterThanPolicy(
      targetSummary.maximumAbsoluteTradeConcentration,
    );
    sampleState =
      targetStates.length < 5
        ? "insufficient"
        : targetStates.length < 10 || baselineStates.length < 20
          ? "descriptive"
          : "eligible_tentative";
    const allComparisonEvidence = addEvidence(
      "target_baseline_exact_partition",
      partitionRows,
      "target_baseline_exact_partition",
    );
    const totalNetPnl = sumRowPnl(partitionRows);
    const effectCells = [
      cell(
        "target_trade_count",
        integerMetric("target_trade_count", "trades", targetSummary.count),
      ),
      cell(
        "baseline_trade_count",
        integerMetric("baseline_trade_count", "trades", baselineSummary.count),
      ),
      cell(
        "trade_count_difference",
        decimalMetric(
          "trade_count_difference",
          "trades_difference",
          null,
          exactCountDifference(targetSummary.count, baselineSummary.count),
        ),
      ),
      cell(
        "net_pnl_difference",
        subtractMetrics(
          "net_pnl_difference",
          decimalMetric(
            "net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            targetSummary.netPnl,
          ),
          decimalMetric(
            "net_pnl",
            "money",
            dependencies.partitionReceipt.currency,
            baselineSummary.netPnl,
          ),
        ),
      ),
      cell("net_expectancy_difference", fullDifference),
      cell("median_net_pnl_difference", medianDifference),
      cell(
        "win_rate_difference",
        subtractMetrics(
          "win_rate_difference",
          targetSummary.winRate,
          baselineSummary.winRate,
        ),
      ),
      cell(
        "target_trade_count_share",
        ratioFromCounts(
          "target_trade_count_share",
          targetSummary.count,
          String(partitionRows.length),
        ),
      ),
      cell(
        "target_total_net_pnl_share",
        totalNetPnl === "0"
          ? unavailableMetric(
              "target_total_net_pnl_share",
              "ratio",
              null,
              "ti_v3_weekday_total_net_pnl_share_not_meaningful",
            )
          : ratioFromDecimals(
              "target_total_net_pnl_share",
              targetSummary.netPnl,
              totalNetPnl,
            ),
      ),
      cell(
        "mean_median_direction_agreement",
        enumMetric(
          "mean_median_direction_agreement",
          "state",
          meanMedianAgree ? "agree" : "disagree",
        ),
      ),
      cell(
        "largest_win_removal_direction_change",
        enumMetric(
          "largest_win_removal_direction_change",
          "state",
          winRemovalChangesDirection ? "changed" : "unchanged",
        ),
      ),
      cell(
        "largest_loss_removal_direction_change",
        enumMetric(
          "largest_loss_removal_direction_change",
          "state",
          lossRemovalChangesDirection ? "changed" : "unchanged",
        ),
      ),
      cell(
        "sample_sufficiency",
        enumMetric("sample_sufficiency", "state", sampleState),
      ),
      cell(
        "outlier_sensitivity",
        enumMetric(
          "outlier_sensitivity",
          "state",
          outlierConcentrated ||
            winRemovalChangesDirection ||
            lossRemovalChangesDirection
            ? "sensitive"
            : "stable",
        ),
      ),
      cell(
        "entry_time_distribution",
        unavailableMetric(
          "entry_time_distribution",
          "entry_time_distribution",
          null,
          "ti_v3_weekday_entry_time_bucket_unavailable",
        ),
      ),
    ];
    effectTable = required(
      buildExactTable({
        schemaVersion: EXACT_TABLE_VERSION,
        tableKey: "target_weekday_comparison_effects",
        tableVersion: "v1",
        runContext: context,
        titlePurposeCode: "exact_target_weekday_comparison_effects",
        currency: dependencies.partitionReceipt.currency,
        timezone: dependencies.canonicalFilter.timezone,
        dateBasis: dependencies.canonicalFilter.dateBasis,
        denominatorPolicy: "target_and_baseline_exact_partition",
        columns: [
          { columnKey: "target_trade_count", valueKind: "integer", unit: "trades" },
          { columnKey: "baseline_trade_count", valueKind: "integer", unit: "trades" },
          { columnKey: "trade_count_difference", valueKind: "exact_decimal", unit: "trades_difference" },
          { columnKey: "net_pnl_difference", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio"], unit: "money" },
          { columnKey: "net_expectancy_difference", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio"], unit: "money_per_trade" },
          { columnKey: "median_net_pnl_difference", valueKind: "exact_decimal", allowedValueKinds: ["exact_decimal", "exact_ratio"], unit: "money" },
          { columnKey: "win_rate_difference", valueKind: "exact_ratio", unit: "ratio" },
          { columnKey: "target_trade_count_share", valueKind: "exact_ratio", unit: "ratio" },
          { columnKey: "target_total_net_pnl_share", valueKind: "exact_ratio", allowedValueKinds: ["exact_ratio", "unavailable"], unit: "ratio" },
          { columnKey: "mean_median_direction_agreement", valueKind: "enum", unit: "state" },
          { columnKey: "largest_win_removal_direction_change", valueKind: "enum", unit: "state" },
          { columnKey: "largest_loss_removal_direction_change", valueKind: "enum", unit: "state" },
          { columnKey: "sample_sufficiency", valueKind: "enum", unit: "state" },
          { columnKey: "outlier_sensitivity", valueKind: "enum", unit: "state" },
          { columnKey: "entry_time_distribution", valueKind: "unavailable", unit: "entry_time_distribution" },
        ],
        rows: [{
          rowKey: "target_vs_baseline_effect",
          cells: effectCells,
          evidenceBundleDigest: allComparisonEvidence.bundleDigest,
        }],
        summaryRows: [],
        includedCount: dependencies.partitionReceipt.includedCount,
        excludedCount: dependencies.partitionReceipt.excludedCount,
        coverageEligibilityState: context.eligibilityState,
        limitationCodes: limitations,
        evidenceBundles,
      }),
      "$.tables.effects",
    );
    tables.push(effectTable);

    const distributionRows: Array<{
      rowKey: string;
      cells: readonly ReturnType<typeof cell>[];
      evidenceBundleDigest: string;
    }> = [];
    const addDistribution = (
      groupKey: string,
      dimension: string,
      bucket: string,
      states: readonly RowState[],
    ): void => {
      if (states.length === 0) return;
      const evidence = addEvidence(
        `${groupKey}_${dimension}_${bucket}`,
        states.map((state) => state.row),
        groupKey,
      );
      distributionRows.push({
        rowKey: `${groupKey}_${dimension}_${bucket}`,
        cells: Object.freeze([
          cell("comparison_group", enumMetric("comparison_group", "group", groupKey)),
          cell("dimension", enumMetric("distribution_dimension", "dimension", dimension)),
          cell("bucket", enumMetric("distribution_bucket", "bucket", bucket)),
          cell("trade_count", integerMetric("trade_count", "trades", String(states.length))),
          cell(
            "net_pnl",
            decimalMetric(
              "net_pnl",
              "money",
              dependencies.partitionReceipt.currency,
              sumRowPnl(states.map((state) => state.row)),
            ),
          ),
        ]),
        evidenceBundleDigest: evidence.bundleDigest,
      });
    };
    for (const [groupKey, states] of [
      [`target_${argumentsValue.targetWeekday}`, targetStates],
      ["baseline_other_represented_weekdays", baselineStates],
    ] as const) {
      for (const sequence of [...new Set(
        states.map((state) => state.row.sequenceInPartition),
      )].sort((left, right) =>
        BigInt(left) < BigInt(right)
          ? -1
          : BigInt(left) > BigInt(right)
            ? 1
            : 0)) {
        addDistribution(
          groupKey,
          "trade_sequence",
          `sequence_${sequence}`,
          states.filter(
            (state) => state.row.sequenceInPartition === sequence,
          ),
        );
      }
      for (const state of [
        "first_trade",
        "after_loss",
        "not_after_loss",
      ] as const) {
        addDistribution(
          groupKey,
          "after_loss_state",
          state,
          states.filter((rowState) => rowState.afterLossState === state),
        );
      }
      for (const availability of ["available", "unavailable"] as const) {
        addDistribution(
          groupKey,
          "entry_notional_availability",
          availability,
          states.filter(
            (state) => state.row.entryNotional.state === availability,
          ),
        );
        addDistribution(
          groupKey,
          "share_quantity_availability",
          availability,
          states.filter(
            (state) => state.row.shareQuantity.state === availability,
          ),
        );
      }
    }
    distributionTable = required(
      buildExactTable({
        schemaVersion: EXACT_TABLE_VERSION,
        tableKey: "target_weekday_distributions",
        tableVersion: "v1",
        runContext: context,
        titlePurposeCode: "exact_sequence_after_loss_and_position_distributions",
        currency: dependencies.partitionReceipt.currency,
        timezone: dependencies.canonicalFilter.timezone,
        dateBasis: dependencies.canonicalFilter.dateBasis,
        denominatorPolicy: "exact_bucket_membership",
        columns: [
          { columnKey: "comparison_group", valueKind: "enum", unit: "group" },
          { columnKey: "dimension", valueKind: "enum", unit: "dimension" },
          { columnKey: "bucket", valueKind: "enum", unit: "bucket" },
          { columnKey: "trade_count", valueKind: "integer", unit: "trades" },
          { columnKey: "net_pnl", valueKind: "exact_decimal", unit: "money" },
        ],
        rows: distributionRows,
        summaryRows: [],
        includedCount: dependencies.partitionReceipt.includedCount,
        excludedCount: dependencies.partitionReceipt.excludedCount,
        coverageEligibilityState: context.eligibilityState,
        limitationCodes: limitations,
        evidenceBundles,
      }),
      "$.tables.distributions",
    );
    tables.push(distributionTable);
  }

  if (dependencies.partitionReceipt.excludedCandidateKeys.length > 0) {
    const exclusions = dependencies.partitionReceipt.excludedCandidateKeys
      .map((key) =>
        dependencies.datasetReceipt.excludedCandidates.find(
          (candidate) => candidate.candidateKey === key,
        ))
      .filter((candidate): candidate is NonNullable<typeof candidate> =>
        candidate !== undefined);
    const reasons = [...new Set(exclusions.map((item) => item.reasonCode))]
      .sort(compareUnicodeCodePoints);
    const exclusionRows = reasons.map((reasonCode) => {
      const candidates = exclusions.filter(
        (candidate) => candidate.reasonCode === reasonCode,
      );
      const evidence = addExcludedEvidence(
        `excluded_${reasonCode.replace(/^ti_v3_/, "")}`,
        candidates.map((candidate) => candidate.candidateKey),
      );
      return Object.freeze({
        rowKey: `excluded_${reasonCode.replace(/^ti_v3_/, "")}`,
        cells: Object.freeze([
          cell(
            "exclusion_reason",
            enumMetric("exclusion_reason", "reason_code", reasonCode),
          ),
          cell(
            "excluded_count",
            integerMetric(
              "excluded_count",
              "candidates",
              String(candidates.length),
            ),
          ),
        ]),
        evidenceBundleDigest: evidence.bundleDigest,
      });
    });
    tables.push(required(
      buildExactTable({
        schemaVersion: EXACT_TABLE_VERSION,
        tableKey: "weekday_relevant_exclusions",
        tableVersion: "v1",
        runContext: context,
        titlePurposeCode: "partition_exclusions_and_limitations",
        currency: dependencies.partitionReceipt.currency,
        timezone: dependencies.canonicalFilter.timezone,
        dateBasis: dependencies.canonicalFilter.dateBasis,
        denominatorPolicy: "excluded_candidates_by_primary_reason",
        columns: [
          { columnKey: "exclusion_reason", valueKind: "enum", unit: "reason_code" },
          { columnKey: "excluded_count", valueKind: "integer", unit: "candidates" },
        ],
        rows: exclusionRows,
        summaryRows: [],
        includedCount: dependencies.partitionReceipt.includedCount,
        excludedCount: dependencies.partitionReceipt.excludedCount,
        coverageEligibilityState: context.eligibilityState,
        limitationCodes: limitations,
        evidenceBundles,
      }),
      "$.tables.exclusions",
    ));
  }

  const diagnosticEntries: Array<{
    diagnosticKey: string;
    severity: "info" | "limitation";
    code: string;
    affectedKeys: readonly string[];
  }> = [];
  const limit = (key: string, code: string): void => {
    diagnosticEntries.push({
      diagnosticKey: key,
      severity: "limitation",
      code,
      affectedKeys: [context.partitionDigest],
    });
  };
  if (targetStates.length < 5) {
    limit(
      "target_sample_insufficient",
      "ti_v3_weekday_target_sample_insufficient",
    );
  } else if (targetStates.length < 10) {
    limit(
      "target_sample_descriptive_only",
      "ti_v3_weekday_target_sample_descriptive_only",
    );
  }
  if (baselineStates.length < 20) {
    limit(
      "baseline_sample_insufficient",
      "ti_v3_weekday_baseline_sample_insufficient",
    );
  }
  if (targetStates.length === 0 || baselineStates.length === 0) {
    limit(
      "target_baseline_comparison_unavailable",
      "ti_v3_weekday_target_baseline_comparison_unavailable",
    );
  }
  if (!meanMedianAgree && fullDifference !== null) {
    limit(
      "mean_median_direction_disagreement",
      "ti_v3_weekday_mean_median_direction_disagree",
    );
  }
  if (winRemovalChangesDirection) {
    limit(
      "largest_win_changes_direction",
      "ti_v3_weekday_largest_win_changes_direction",
    );
  }
  if (lossRemovalChangesDirection) {
    limit(
      "largest_loss_changes_direction",
      "ti_v3_weekday_largest_loss_changes_direction",
    );
  }
  if (outlierConcentrated) {
    limit(
      "single_trade_concentration_exceeded",
      "ti_v3_weekday_outlier_contribution_exceeded",
    );
  }
  if (
    fullDifference !== null &&
    metricDirection(fullDifference) === "flat"
  ) {
    limit(
      "no_directional_tendency",
      "ti_v3_weekday_no_directional_tendency",
    );
  }
  const diagnostics = required(
    buildAnalyticalDiagnostics({
      schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
      runContext: context,
      entries: diagnosticEntries,
    }),
    "$.diagnostics",
  );

  const claims: ValidatedClaim[] = [];
  const promotionPermitted =
    targetSummary !== null &&
    baselineSummary !== null &&
    comparisonTable !== null &&
    fullDifference !== null &&
    sampleState === "eligible_tentative" &&
    context.eligibilityState === "eligible" &&
    limitations.length === 0 &&
    meanMedianAgree &&
    !winRemovalChangesDirection &&
    !lossRemovalChangesDirection &&
    !outlierConcentrated &&
    metricDirection(fullDifference) !== "flat" &&
    metricDirection(fullDifference) !== "unavailable";
  if (
    promotionPermitted &&
    targetSummary !== null &&
    baselineSummary !== null &&
    comparisonTable !== null
  ) {
    const direction = metricDirection(fullDifference as ExactMetricValue);
    const targetCounterRows = targetStates
      .map((state) => state.row)
      .filter((row) =>
        direction === "negative"
          ? compareCanonicalDecimals(row.netPnl, "0") > 0
          : compareCanonicalDecimals(row.netPnl, "0") < 0);
    const baselineCounterRows = baselineStates
      .map((state) => state.row)
      .filter((row) =>
        direction === "negative"
          ? compareCanonicalDecimals(row.netPnl, "0") < 0
          : compareCanonicalDecimals(row.netPnl, "0") > 0);
    const counterexampleDigests: string[] = [];
    if (targetCounterRows.length > 0) {
      counterexampleDigests.push(addEvidence(
        "counterexample_target_trades",
        targetCounterRows,
        `target_${argumentsValue.targetWeekday}`,
      ).bundleDigest);
    }
    if (baselineCounterRows.length > 0) {
      counterexampleDigests.push(addEvidence(
        "counterexample_baseline_trades",
        baselineCounterRows,
        "baseline_other_represented_weekdays",
      ).bundleDigest);
    }
    claims.push(required(
      buildValidatedClaim({
        schemaVersion: VALIDATED_CLAIM_VERSION,
        claimKey: `target_${argumentsValue.targetWeekday}_expectancy_tendency`,
        claimVersion: "v1",
        claimType:
          direction === "negative"
            ? "target_weekday_lower_historical_net_expectancy"
            : "target_weekday_higher_historical_net_expectancy",
        runContext: context,
        table: comparisonTable,
        subjectGroupKey: `target_${argumentsValue.targetWeekday}`,
        comparisonGroupKey: "baseline_other_represented_weekdays",
        metricKey: "net_expectancy",
        effectDerivation: {
          kind: "difference",
          targetRowKey: `target_${argumentsValue.targetWeekday}`,
          targetColumnKey: "net_expectancy",
          comparisonRowKey: "baseline_other_represented_weekdays",
          comparisonColumnKey: "net_expectancy",
        },
        confidenceEvidenceLabel: "tentative",
        outlierSensitivityState: "stable",
        evidenceBundles,
        counterexampleEvidenceBundleDigests: counterexampleDigests,
        allowedWordingCode:
          direction === "negative"
            ? "target_weekday_had_lower_historical_expectancy_than_baseline"
            : "target_weekday_had_higher_historical_expectancy_than_baseline",
      }),
      "$.claims.primary",
    ));
  }

  const series: ChartReadySeries[] = [];
  const seriesFromPrimary = (
    seriesKey: string,
    purpose: string,
    columnKey: string,
    unit: string,
    currency: CurrencyCode | null,
    zeroBaselineRequired: boolean,
  ): ChartReadySeries => required(
    buildChartReadySeries({
      schemaVersion: CHART_READY_SERIES_VERSION,
      seriesKey,
      seriesVersion: "v1",
      approvedVisualPurpose: purpose,
      allowedVisualTemplateKeys: ["weekday_exact_bars"],
      runContext: context,
      sourceTable: primaryTable,
      evidenceBundles,
      xDomain: "semantic_weekday_order",
      unit,
      currency,
      timezone: dependencies.canonicalFilter.timezone,
      dateBasis: dependencies.canonicalFilter.dateBasis,
      zeroBaselineRequired,
      denominatorPolicy: "all_included_trades_flats_in_denominator",
      points: primaryTable.rows.map((row, index) => ({
        pointKey: `${seriesKey}_${row.rowKey}`,
        sourceRowKey: row.rowKey,
        sourceColumnKey: columnKey,
        semanticOrder: String(index + 1),
        evidenceBundleDigest: row.evidenceBundleDigest,
      })),
      accessibilitySummarySelections: primaryTable.rows.flatMap((row) => [
        { rowKey: row.rowKey, columnKey },
        { rowKey: row.rowKey, columnKey: "included_trade_count" },
      ]),
      pointBudget: String(primaryTable.rows.length),
      downsamplingPolicy: "none_exact_points_only",
    }),
    `$.series.${seriesKey}`,
  );
  series.push(
    seriesFromPrimary(
      "exact_net_pnl_by_weekday",
      "weekday_net_pnl",
      "net_pnl",
      "money",
      dependencies.partitionReceipt.currency,
      true,
    ),
    seriesFromPrimary(
      "included_trade_count_by_weekday",
      "weekday_trade_count",
      "included_trade_count",
      "trades",
      null,
      true,
    ),
    seriesFromPrimary(
      "exact_expectancy_by_weekday",
      "weekday_expectancy",
      "net_expectancy",
      "money_per_trade",
      dependencies.partitionReceipt.currency,
      true,
    ),
  );
  if (comparisonTable !== null) {
    series.push(required(
      buildChartReadySeries({
        schemaVersion: CHART_READY_SERIES_VERSION,
        seriesKey: "target_weekday_vs_baseline_expectancy",
        seriesVersion: "v1",
        approvedVisualPurpose: "target_weekday_baseline_expectancy",
        allowedVisualTemplateKeys: ["grouped_exact_comparison_bars"],
        runContext: context,
        sourceTable: comparisonTable,
        evidenceBundles,
        xDomain: "target_and_baseline",
        unit: "money_per_trade",
        currency: dependencies.partitionReceipt.currency,
        timezone: dependencies.canonicalFilter.timezone,
        dateBasis: dependencies.canonicalFilter.dateBasis,
        zeroBaselineRequired: true,
        denominatorPolicy: "disjoint_exact_partition_all_included_trades",
        points: comparisonTable.rows.map((row, index) => ({
          pointKey: `expectancy_${row.rowKey}`,
          sourceRowKey: row.rowKey,
          sourceColumnKey: "net_expectancy",
          semanticOrder: String(index + 1),
          evidenceBundleDigest: row.evidenceBundleDigest,
        })),
        accessibilitySummarySelections: comparisonTable.rows.map((row) => ({
          rowKey: row.rowKey,
          columnKey: "net_expectancy",
        })),
        pointBudget: "2",
        downsamplingPolicy: "none_exact_points_only",
      }),
      "$.series.targetBaseline",
    ));
  }

  const receipt = required(
    buildAnalysisRunReceipt({
      schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
      runContext: context,
      tables,
      claims,
      series,
      evidenceBundles,
      diagnostics,
    }),
    "$.receipt",
  );
  return Object.freeze({
    normalizedArguments,
    registryEntry,
    runContext: context,
    evidenceBundles: Object.freeze(evidenceBundles),
    tables: Object.freeze(tables),
    claims: Object.freeze(claims),
    series: Object.freeze(series),
    diagnostics,
    receipt,
  });
}

export function executeWeekdayAnalysis(
  input: WeekdayAnalysisExecutionInput,
): ExactResult<WeekdayAnalysisExecution, AnalyticalContractFailure> {
  try {
    const dataset = verifyAnalyticalDatasetReceipt(input.datasetReceipt);
    if (!dataset.ok) {
      return contractFailure(
        dataset.error.code,
        `$.datasetReceipt${dataset.error.path.slice(1)}`,
      );
    }
    const partition = verifyAnalyticalPartitionReceipt(
      input.partitionReceipt,
      dataset.value,
    );
    if (!partition.ok) {
      return contractFailure(
        partition.error.code,
        `$.partitionReceipt${partition.error.path.slice(1)}`,
      );
    }
    const registryEntry = required(
      buildWeekdayToolRegistryEntry(),
      "$.registryEntry",
    );
    const normalizedArguments = required(
      normalizeWeekdayAnalysisArguments(input.arguments),
      "$.arguments",
    );
    const verifiedArguments = required(
      verifyWeekdayAnalysisArguments(normalizedArguments),
      "$.arguments",
    );
    const context = required(
      buildAnalysisRunContext({
        schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
        snapshot: input.snapshot,
        snapshotDependencies: input.snapshotDependencies,
        canonicalFilter: input.canonicalFilter,
        datasetReceipt: dataset.value,
        datasetDerivationReceipt: input.datasetDerivationReceipt,
        partitionReceipt: partition.value,
        normalizedArguments,
        registryEntry,
      }),
      "$.runContext",
    );
    if (context.eligibilityState === "blocked") {
      const diagnostics = required(
        buildAnalyticalDiagnostics({
          schemaVersion: ANALYTICAL_DIAGNOSTICS_VERSION,
          runContext: context,
          entries: [{
            diagnosticKey: "weekday_partition_blocked",
            severity: "blocked",
            code: "ti_v3_weekday_partition_blocked",
            affectedKeys: [context.partitionDigest],
          }],
        }),
        "$.diagnostics",
      );
      const receipt = required(
        buildAnalysisRunReceipt({
          schemaVersion: ANALYSIS_RUN_RECEIPT_VERSION,
          runContext: context,
          tables: [],
          claims: [],
          series: [],
          evidenceBundles: [],
          diagnostics,
        }),
        "$.receipt",
      );
      return {
        ok: true,
        value: Object.freeze({
          normalizedArguments,
          registryEntry,
          runContext: context,
          evidenceBundles: Object.freeze([]),
          tables: Object.freeze([]),
          claims: Object.freeze([]),
          series: Object.freeze([]),
          diagnostics,
          receipt,
        }),
      };
    }
    return {
      ok: true,
      value: buildNonBlockedExecution(
        context,
        verifiedArguments.values,
        normalizedArguments,
        registryEntry,
      ),
    };
  } catch (error) {
    if (error instanceof WeekdayConstructionError) {
      return contractFailure(error.code, error.path);
    }
    return contractFailure(
      "ti_v3_weekday_analysis_construction_failed",
      "$",
    );
  }
}
