import {
  GENERAL_EXACT_DECIMAL_BOUNDS,
  EXACT_RATIO_ROUNDING_POLICY_VERSION,
  addExactDecimals,
  compareExactDecimals,
  createExactRatio,
  decimalToExactRatio,
  negateExactDecimal,
  ratioToExactDecimal,
  validateExactDecimal,
  type CanonicalDecimal,
  type ExactRatio,
  type ExactResult,
} from "../../../domain/exact";
import {
  EXACT_METRIC_VALUE_VERSION,
  buildExactMetricValue,
  type ExactMetricValue,
} from "../../contracts/exact-metric";
import {
  contractFailure,
  type AnalyticalContractFailure,
} from "../../contracts/contract-validation";

function exactZero(): CanonicalDecimal {
  const zero = validateExactDecimal("0", GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!zero.ok) throw new Error(zero.error.code);
  return zero.value;
}

export function sumExactDecimals(
  values: readonly string[],
): ExactResult<CanonicalDecimal, AnalyticalContractFailure> {
  let total = exactZero();
  for (const input of values) {
    const value = validateExactDecimal(input, GENERAL_EXACT_DECIMAL_BOUNDS);
    if (!value.ok) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.exactValues",
      );
    }
    const next = addExactDecimals(total, value.value);
    if (!next.ok) {
      return contractFailure(
        "ti_v3_analytics_contract_invalid",
        "$.exactValues",
      );
    }
    total = next.value;
  }
  return { ok: true, value: total };
}

export function absoluteExactDecimal(
  input: string,
): ExactResult<CanonicalDecimal, AnalyticalContractFailure> {
  const value = validateExactDecimal(input, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!value.ok) {
    return contractFailure(
      "ti_v3_analytics_contract_invalid",
      "$.exactValue",
    );
  }
  if (compareExactDecimals(value.value, exactZero()) >= 0) {
    return { ok: true, value: value.value };
  }
  const negated = negateExactDecimal(value.value);
  return negated.ok
    ? { ok: true, value: negated.value }
    : contractFailure("ti_v3_analytics_contract_invalid", "$.exactValue");
}

export function compareCanonicalDecimals(left: string, right: string): -1 | 0 | 1 {
  const parsedLeft = validateExactDecimal(left, GENERAL_EXACT_DECIMAL_BOUNDS);
  const parsedRight = validateExactDecimal(right, GENERAL_EXACT_DECIMAL_BOUNDS);
  if (!parsedLeft.ok || !parsedRight.ok) {
    throw new Error("ti_v3_weekday_invalid_exact_decimal");
  }
  return compareExactDecimals(parsedLeft.value, parsedRight.value);
}

export function decimalMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  value: string,
): ExactMetricValue {
  const built = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "exact_decimal",
    unit,
    currency,
    value,
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

export function integerMetric(
  metricKey: string,
  unit: string,
  value: string,
): ExactMetricValue {
  const built = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "integer",
    unit,
    currency: null,
    value,
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

export function enumMetric(
  metricKey: string,
  unit: string,
  value: string,
): ExactMetricValue {
  const built = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "enum",
    unit,
    currency: null,
    value,
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

export function unavailableMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  reasonCode: string,
): ExactMetricValue {
  const built = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "unavailable",
    unit,
    currency,
    value: null,
    reasonCode,
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

export function ratioMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  ratio: ExactRatio,
): ExactMetricValue {
  const built = buildExactMetricValue({
    schemaVersion: EXACT_METRIC_VALUE_VERSION,
    metricKey,
    kind: "exact_ratio",
    unit,
    currency,
    value: null,
    numerator: ratio.numerator,
    denominator: ratio.denominator,
  });
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value;
}

function terminatingScale(denominatorInput: string): number | null {
  let denominator = BigInt(denominatorInput);
  let twos = 0;
  let fives = 0;
  while (denominator % BigInt(2) === BigInt(0)) {
    denominator /= BigInt(2);
    twos += 1;
  }
  while (denominator % BigInt(5) === BigInt(0)) {
    denominator /= BigInt(5);
    fives += 1;
  }
  if (denominator !== BigInt(1)) return null;
  return twos > fives ? twos : fives;
}

export function quotientMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  numeratorDecimal: string,
  denominatorCount: string,
): ExactMetricValue {
  if (denominatorCount === "0") {
    return unavailableMetric(
      metricKey,
      unit,
      currency,
      "ti_v3_weekday_zero_denominator",
    );
  }
  const parsed = validateExactDecimal(
    numeratorDecimal,
    GENERAL_EXACT_DECIMAL_BOUNDS,
  );
  if (!parsed.ok) throw new Error(parsed.error.code);
  const decimalRatio = decimalToExactRatio(parsed.value);
  if (!decimalRatio.ok) throw new Error(decimalRatio.error.code);
  const ratio = createExactRatio(
    decimalRatio.value.numerator,
    (
      BigInt(decimalRatio.value.denominator) * BigInt(denominatorCount)
    ).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  const scale = terminatingScale(ratio.value.denominator);
  if (
    scale !== null &&
    scale <= GENERAL_EXACT_DECIMAL_BOUNDS.maximumScale
  ) {
    const decimal = ratioToExactDecimal(ratio.value, {
      version: EXACT_RATIO_ROUNDING_POLICY_VERSION,
      scale,
      bounds: GENERAL_EXACT_DECIMAL_BOUNDS,
    });
    if (decimal.ok) {
      return decimalMetric(metricKey, unit, currency, decimal.value);
    }
  }
  return ratioMetric(metricKey, unit, currency, ratio.value);
}

export function medianMetric(
  metricKey: string,
  unit: string,
  currency: string | null,
  values: readonly string[],
): ExactMetricValue {
  if (values.length === 0) {
    return unavailableMetric(
      metricKey,
      unit,
      currency,
      "ti_v3_weekday_zero_sample",
    );
  }
  const ordered = [...values].sort(compareCanonicalDecimals);
  const middle = (ordered.length - (ordered.length % 2)) / 2;
  if (ordered.length % 2 === 1) {
    return decimalMetric(metricKey, unit, currency, ordered[middle]);
  }
  const total = sumExactDecimals([ordered[middle - 1], ordered[middle]]);
  if (!total.ok) throw new Error(total.error.code);
  return quotientMetric(metricKey, unit, currency, total.value, "2");
}

export function ratioFromCounts(
  metricKey: string,
  numerator: string,
  denominator: string,
): ExactMetricValue {
  if (denominator === "0") {
    return unavailableMetric(
      metricKey,
      "ratio",
      null,
      "ti_v3_weekday_zero_denominator",
    );
  }
  const ratio = createExactRatio(numerator, denominator);
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(metricKey, "ratio", null, ratio.value);
}

export function ratioFromDecimals(
  metricKey: string,
  numerator: string,
  denominator: string,
): ExactMetricValue {
  const numeratorValue = validateExactDecimal(
    numerator,
    GENERAL_EXACT_DECIMAL_BOUNDS,
  );
  const denominatorValue = validateExactDecimal(
    denominator,
    GENERAL_EXACT_DECIMAL_BOUNDS,
  );
  if (!numeratorValue.ok || !denominatorValue.ok) {
    throw new Error("ti_v3_weekday_invalid_exact_ratio_input");
  }
  if (denominatorValue.value === "0") {
    return unavailableMetric(
      metricKey,
      "ratio",
      null,
      "ti_v3_weekday_zero_denominator",
    );
  }
  const left = decimalToExactRatio(numeratorValue.value);
  const right = decimalToExactRatio(denominatorValue.value);
  if (!left.ok || !right.ok) throw new Error("ti_v3_weekday_ratio_failed");
  const ratio = createExactRatio(
    (
      BigInt(left.value.numerator) * BigInt(right.value.denominator)
    ).toString(),
    (
      BigInt(left.value.denominator) * BigInt(right.value.numerator)
    ).toString(),
  );
  if (!ratio.ok) throw new Error(ratio.error.code);
  return ratioMetric(metricKey, "ratio", null, ratio.value);
}

export function metricDirection(
  metric: ExactMetricValue,
): "negative" | "flat" | "positive" | "unavailable" {
  if (metric.kind === "exact_decimal") {
    const comparison = compareCanonicalDecimals(metric.value, "0");
    return comparison < 0 ? "negative" : comparison > 0 ? "positive" : "flat";
  }
  if (metric.kind === "exact_ratio") {
    const numerator = BigInt(metric.numerator);
    return numerator < BigInt(0)
      ? "negative"
      : numerator > BigInt(0)
        ? "positive"
        : "flat";
  }
  return "unavailable";
}

export function subtractMetrics(
  metricKey: string,
  target: ExactMetricValue,
  baseline: ExactMetricValue,
): ExactMetricValue {
  if (
    !["exact_decimal", "exact_ratio"].includes(target.kind) ||
    !["exact_decimal", "exact_ratio"].includes(baseline.kind) ||
    target.unit !== baseline.unit ||
    target.currency !== baseline.currency
  ) {
    return unavailableMetric(
      metricKey,
      target.unit,
      target.currency,
      "ti_v3_weekday_comparison_unavailable",
    );
  }
  const toRatio = (metric: ExactMetricValue): ExactRatio => {
    if (metric.kind === "exact_ratio") {
      const ratio = createExactRatio(metric.numerator, metric.denominator);
      if (!ratio.ok) throw new Error(ratio.error.code);
      return ratio.value;
    }
    const parsed = validateExactDecimal(
      (metric as Extract<ExactMetricValue, { kind: "exact_decimal" }>).value,
      GENERAL_EXACT_DECIMAL_BOUNDS,
    );
    if (!parsed.ok) throw new Error(parsed.error.code);
    const ratio = decimalToExactRatio(parsed.value);
    if (!ratio.ok) throw new Error(ratio.error.code);
    return ratio.value;
  };
  const left = toRatio(target);
  const right = toRatio(baseline);
  const result = createExactRatio(
    (
      BigInt(left.numerator) * BigInt(right.denominator) -
      BigInt(right.numerator) * BigInt(left.denominator)
    ).toString(),
    (
      BigInt(left.denominator) * BigInt(right.denominator)
    ).toString(),
  );
  if (!result.ok) throw new Error(result.error.code);
  if (target.kind === "exact_decimal" && baseline.kind === "exact_decimal") {
    const scale = terminatingScale(result.value.denominator);
    if (
      scale !== null &&
      scale <= GENERAL_EXACT_DECIMAL_BOUNDS.maximumScale
    ) {
      const decimal = ratioToExactDecimal(result.value, {
        version: EXACT_RATIO_ROUNDING_POLICY_VERSION,
        scale,
        bounds: GENERAL_EXACT_DECIMAL_BOUNDS,
      });
      if (decimal.ok) {
        return decimalMetric(
          metricKey,
          target.unit,
          target.currency,
          decimal.value,
        );
      }
    }
  }
  return ratioMetric(metricKey, target.unit, target.currency, result.value);
}
