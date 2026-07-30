import type {
  AnalyticsLabQuery,
  ChartKind,
  LabAnalysisKind,
  LabGroupingKey,
  LabMetricKey,
} from "./lab-types";

const analysisValues = [
  "performance",
  "breakdown",
  "distribution",
  "attribution",
  "evidence",
] as const satisfies readonly LabAnalysisKind[];
const metricValues = [
  "net_pnl",
  "gross_pnl",
  "average_pnl",
  "median_pnl",
  "win_rate",
  "profit_factor",
  "expectancy",
  "total_trades",
  "average_holding_time",
  "average_share_quantity",
  "average_entry_notional",
  "signed_charges",
  "best_trade",
  "worst_trade",
  "profitable_day_percentage",
  "maximum_intraday_drawdown",
  "maximum_peak_profit_giveback",
  "repeat_attempt_percentage",
] as const satisfies readonly LabMetricKey[];
const groupingValues = [
  "day",
  "week",
  "month",
  "weekday",
  "symbol",
  "direction",
  "session",
  "entry_session",
  "exit_session",
  "entry_hour",
  "exit_hour",
  "entry_half_hour",
  "trade_sequence",
  "trade_sequence_bucket",
  "previous_completed_outcome",
  "prior_completed_streak_bucket",
  "pre_entry_daily_state",
  "repeat_attempt",
  "repeat_attempt_bucket",
  "holding_time_bucket",
  "share_quantity_bucket",
  "entry_notional_bucket",
  "charge_coverage",
] as const satisfies readonly LabGroupingKey[];
const chartValues = [
  "area",
  "line",
  "bars",
  "horizontal",
  "table",
] as const satisfies readonly ChartKind[];
const comparisonValues = ["none", "previous_period"] as const;
const evidenceRowValues = [6, 12, 24] as const;
const directionValues = ["all", "long", "short"] as const;
const outcomeValues = ["all", "gain", "loss", "flat"] as const;
const sessionValues = [
  "all",
  "premarket",
  "regular",
  "after_hours",
  "overnight",
] as const;
const weekdayValues = [
  "all",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;
const previousOutcomeValues = [
  "all",
  "none",
  "gain",
  "loss",
  "flat",
] as const;
const preEntryStateValues = ["all", "green", "red", "flat"] as const;
const temporalGroupings = new Set<LabGroupingKey>([
  "day",
  "week",
  "month",
  "weekday",
  "entry_hour",
  "exit_hour",
  "entry_half_hour",
]);
const queryKeys = [
  "analysis",
  "metric",
  "grouping",
  "chart",
  "comparison",
  "evidenceRows",
  "filters",
] as const;
const filterKeys = [
  "symbol",
  "direction",
  "outcome",
  "session",
  "weekday",
  "startDate",
  "endDate",
  "entryStart",
  "entryEnd",
  "holdingMinimum",
  "holdingMaximum",
  "sequenceMinimum",
  "sequenceMaximum",
  "previousOutcome",
  "preEntryState",
  "repeatAttemptMinimum",
  "repeatAttemptMaximum",
  "shareMinimum",
  "shareMaximum",
  "notionalMinimum",
  "notionalMaximum",
] as const;

function fail(path: string): never {
  throw new Error(`Invalid Analytics Lab query at ${path}.`);
}

function recordValue(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    fail(path);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(
  record: Record<string, unknown>,
  expected: readonly string[],
  path: string,
): void {
  const actual = Object.keys(record).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    fail(path);
  }
}

function enumValue<const T extends readonly (string | number)[]>(
  value: unknown,
  allowed: T,
  path: string,
): T[number] {
  if (!allowed.some((candidate) => candidate === value)) {
    fail(path);
  }
  return value as T[number];
}

function stringValue(
  value: unknown,
  path: string,
  maximumLength: number,
): string {
  if (
    typeof value !== "string" ||
    value.length > maximumLength ||
    /[\u0000-\u001f\u007f]/.test(value)
  ) {
    fail(path);
  }
  return value;
}

function dateValue(value: unknown, path: string): string {
  const date = stringValue(value, path, 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    new Date(`${date}T00:00:00.000Z`).toISOString().slice(0, 10) !== date
  ) {
    fail(path);
  }
  return date;
}

function timeValue(value: unknown, path: string): string {
  const time = stringValue(value, path, 5);
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    fail(path);
  }
  return time;
}

function numericBound(
  value: unknown,
  path: string,
  options: {
    integer: boolean;
    maximum: number;
  },
): string {
  const bound = stringValue(value, path, 32);
  if (bound === "") return bound;
  const pattern = options.integer
    ? /^(?:0|[1-9]\d*)$/
    : /^(?:0|[1-9]\d*)(?:\.\d+)?$/;
  const numeric = Number(bound);
  if (
    !pattern.test(bound) ||
    !Number.isFinite(numeric) ||
    numeric < 0 ||
    numeric > options.maximum
  ) {
    fail(path);
  }
  return bound;
}

function validateBoundOrder(
  minimum: string,
  maximum: string,
  path: string,
): void {
  if (
    minimum !== "" &&
    maximum !== "" &&
    Number(minimum) > Number(maximum)
  ) {
    fail(path);
  }
}

function validChart(
  analysis: LabAnalysisKind,
  grouping: LabGroupingKey,
  chart: ChartKind,
): boolean {
  if (analysis === "evidence") return chart === "table";
  if (analysis === "performance" && temporalGroupings.has(grouping)) {
    return ["area", "line", "bars", "table"].includes(chart);
  }
  return ["bars", "horizontal", "table"].includes(chart);
}

export function normalizeAnalyticsLabQuery(
  input: unknown,
): AnalyticsLabQuery {
  const query = recordValue(input, "query");
  requireExactKeys(query, queryKeys, "query");
  const filters = recordValue(query.filters, "query.filters");
  requireExactKeys(filters, filterKeys, "query.filters");

  const analysis = enumValue(query.analysis, analysisValues, "query.analysis");
  const metric = enumValue(query.metric, metricValues, "query.metric");
  const grouping = enumValue(query.grouping, groupingValues, "query.grouping");
  const chart = enumValue(query.chart, chartValues, "query.chart");
  const comparison = enumValue(
    query.comparison,
    comparisonValues,
    "query.comparison",
  );
  const evidenceRows = enumValue(
    query.evidenceRows,
    evidenceRowValues,
    "query.evidenceRows",
  );
  if (!validChart(analysis, grouping, chart)) {
    fail("query.chart");
  }

  const symbol = stringValue(filters.symbol, "query.filters.symbol", 64);
  if (symbol === "") {
    fail("query.filters.symbol");
  }
  const startDate = dateValue(
    filters.startDate,
    "query.filters.startDate",
  );
  const endDate = dateValue(filters.endDate, "query.filters.endDate");
  if (startDate > endDate) {
    fail("query.filters.dateRange");
  }
  const entryStart = timeValue(
    filters.entryStart,
    "query.filters.entryStart",
  );
  const entryEnd = timeValue(filters.entryEnd, "query.filters.entryEnd");
  if (entryStart > entryEnd) {
    fail("query.filters.entryTimeRange");
  }

  const holdingMinimum = numericBound(
    filters.holdingMinimum,
    "query.filters.holdingMinimum",
    { integer: false, maximum: 3_155_760_000 },
  );
  const holdingMaximum = numericBound(
    filters.holdingMaximum,
    "query.filters.holdingMaximum",
    { integer: false, maximum: 3_155_760_000 },
  );
  const sequenceMinimum = numericBound(
    filters.sequenceMinimum,
    "query.filters.sequenceMinimum",
    { integer: true, maximum: 1_000_000 },
  );
  const sequenceMaximum = numericBound(
    filters.sequenceMaximum,
    "query.filters.sequenceMaximum",
    { integer: true, maximum: 1_000_000 },
  );
  const repeatAttemptMinimum = numericBound(
    filters.repeatAttemptMinimum,
    "query.filters.repeatAttemptMinimum",
    { integer: true, maximum: 1_000_000 },
  );
  const repeatAttemptMaximum = numericBound(
    filters.repeatAttemptMaximum,
    "query.filters.repeatAttemptMaximum",
    { integer: true, maximum: 1_000_000 },
  );
  const shareMinimum = numericBound(
    filters.shareMinimum,
    "query.filters.shareMinimum",
    { integer: false, maximum: 1_000_000_000_000_000 },
  );
  const shareMaximum = numericBound(
    filters.shareMaximum,
    "query.filters.shareMaximum",
    { integer: false, maximum: 1_000_000_000_000_000 },
  );
  const notionalMinimum = numericBound(
    filters.notionalMinimum,
    "query.filters.notionalMinimum",
    { integer: false, maximum: 1_000_000_000_000_000_000 },
  );
  const notionalMaximum = numericBound(
    filters.notionalMaximum,
    "query.filters.notionalMaximum",
    { integer: false, maximum: 1_000_000_000_000_000_000 },
  );
  validateBoundOrder(
    holdingMinimum,
    holdingMaximum,
    "query.filters.holdingRange",
  );
  validateBoundOrder(
    sequenceMinimum,
    sequenceMaximum,
    "query.filters.sequenceRange",
  );
  validateBoundOrder(
    repeatAttemptMinimum,
    repeatAttemptMaximum,
    "query.filters.repeatAttemptRange",
  );
  validateBoundOrder(
    shareMinimum,
    shareMaximum,
    "query.filters.shareRange",
  );
  validateBoundOrder(
    notionalMinimum,
    notionalMaximum,
    "query.filters.notionalRange",
  );

  return {
    analysis,
    metric,
    grouping,
    chart,
    comparison,
    evidenceRows,
    filters: {
      symbol,
      direction: enumValue(
        filters.direction,
        directionValues,
        "query.filters.direction",
      ),
      outcome: enumValue(
        filters.outcome,
        outcomeValues,
        "query.filters.outcome",
      ),
      session: enumValue(
        filters.session,
        sessionValues,
        "query.filters.session",
      ),
      weekday: enumValue(
        filters.weekday,
        weekdayValues,
        "query.filters.weekday",
      ),
      startDate,
      endDate,
      entryStart,
      entryEnd,
      holdingMinimum,
      holdingMaximum,
      sequenceMinimum,
      sequenceMaximum,
      previousOutcome: enumValue(
        filters.previousOutcome,
        previousOutcomeValues,
        "query.filters.previousOutcome",
      ),
      preEntryState: enumValue(
        filters.preEntryState,
        preEntryStateValues,
        "query.filters.preEntryState",
      ),
      repeatAttemptMinimum,
      repeatAttemptMaximum,
      shareMinimum,
      shareMaximum,
      notionalMinimum,
      notionalMaximum,
    },
  };
}


