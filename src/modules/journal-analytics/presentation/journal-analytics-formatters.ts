import type {
  JournalAnalyticsExactValue,
  JournalAnalyticsMetricResult,
  JournalAnalyticsPartitionedResponse,
} from "../contracts/analytics-result";

function decimalParts(value: string): Readonly<{
  negative: boolean;
  units: bigint;
  scale: number;
}> {
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const [whole, fraction = ""] = unsigned.split(".");
  return Object.freeze({
    negative,
    units: BigInt(`${whole}${fraction}`),
    scale: fraction.length,
  });
}

function groupWholeDigits(value: string): string {
  return value.replace(/\B(?=(\d{3})+(?!\d))/gu, ",");
}

export function formatJournalAnalyticsDecimal(
  value: string,
  decimalPlaces = 2,
  keepTrailingZeroes = false,
): string {
  const parts = decimalParts(value);
  let units = parts.units;
  let scale = parts.scale;
  if (scale > decimalPlaces) {
    const factor = BigInt(10) ** BigInt(scale - decimalPlaces);
    let rounded = units / factor;
    if ((units % factor) * BigInt(2) >= factor) rounded += BigInt(1);
    units = rounded;
    scale = decimalPlaces;
  }
  if (keepTrailingZeroes && scale < decimalPlaces) {
    units *= BigInt(10) ** BigInt(decimalPlaces - scale);
    scale = decimalPlaces;
  }
  const digits = units.toString().padStart(scale + 1, "0");
  const whole = scale === 0 ? digits : digits.slice(0, -scale);
  const fraction = scale === 0
    ? ""
    : keepTrailingZeroes
      ? digits.slice(-scale)
      : digits.slice(-scale).replace(/0+$/u, "");
  const rendered = fraction.length > 0
    ? `${groupWholeDigits(whole)}.${fraction}`
    : groupWholeDigits(whole);
  return parts.negative && units !== BigInt(0) ? `-${rendered}` : rendered;
}

export function formatJournalAnalyticsDuration(milliseconds: number): string {
  if (milliseconds < 60_000) {
    return `${formatJournalAnalyticsDecimal(String(milliseconds / 1_000))} sec`;
  }
  if (milliseconds < 3_600_000) {
    return `${formatJournalAnalyticsDecimal(String(milliseconds / 60_000))} min`;
  }
  return `${formatJournalAnalyticsDecimal(String(milliseconds / 3_600_000))} hr`;
}

function formatExactValue(
  value: JournalAnalyticsExactValue,
  metric: JournalAnalyticsMetricResult,
): string {
  if (metric.valueKind === "duration" && value.kind !== "text") {
    const milliseconds = value.kind === "duration"
      ? value.milliseconds
      : value.kind === "integer"
        ? value.value
        : Number(value.kind === "decimal" ? value.valueDecimal : value.roundedDecimal);
    if (Number.isFinite(milliseconds) && milliseconds >= 0) {
      return formatJournalAnalyticsDuration(milliseconds);
    }
  }
  if (value.kind === "integer") return value.value.toLocaleString("en-US");
  if (value.kind === "duration") return formatJournalAnalyticsDuration(value.milliseconds);
  if (value.kind === "text") return value.value;
  const decimal = value.kind === "decimal"
    ? value.valueDecimal
    : value.roundedDecimal;
  const formatted = formatJournalAnalyticsDecimal(decimal, 2, metric.valueKind === "money");
  if (metric.unit === "percent") return `${formatted}%`;
  if (metric.valueKind === "money" && metric.currency) {
    return formatted.startsWith("-") ? `-$${formatted.slice(1)}` : `$${formatted}`;
  }
  return formatted;
}

export function formatJournalAnalyticsMetric(
  metric: JournalAnalyticsMetricResult,
): string {
  return metric.value === null ? "N/A" : formatExactValue(metric.value, metric);
}

export function journalAnalyticsMetricCaption(
  metric: JournalAnalyticsMetricResult,
): string {
  if (metric.state === "unavailable") {
    return metric.limitationReasonCodes.length > 0
      ? "Required facts are missing"
      : "N/A for this scope";
  }
  if (metric.state === "partial") return "Partial factual coverage";
  if (metric.state === "empty") return "No matching trades";
  return metric.description;
}

export function findJournalAnalyticsMetric(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
): readonly JournalAnalyticsMetricResult[] {
  return Object.freeze(response.partitions.flatMap((partition) => {
    const metric = partition.metrics.find((entry) => entry.metricId === metricId);
    return metric ? [metric] : [];
  }));
}

export function formatJournalAnalyticsPartitionedMetric(
  response: JournalAnalyticsPartitionedResponse,
  metricId: string,
): string {
  const metrics = findJournalAnalyticsMetric(response, metricId);
  if (metrics.length === 0) return "N/A";
  return metrics.map(formatJournalAnalyticsMetric).join(" / ");
}
