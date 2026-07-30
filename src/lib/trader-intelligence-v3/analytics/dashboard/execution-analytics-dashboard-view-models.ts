import type { ExactMetricValue } from "../contracts";
import type {
  DashboardComparisonPacket,
  DashboardDistributionPacket,
  DashboardEvidencePagePacket,
  DashboardEvidenceReference,
  DashboardMetricRow,
  DashboardQueryPacket,
  ExecutionAnalyticsDashboardPacket,
} from "./execution-analytics-dashboard-packets";

export interface DashboardMetricViewModel {
  readonly metricKey: string;
  readonly displayValue: string;
  readonly unit: string;
  readonly availability: "available" | "unavailable";
  readonly reasonCode: string | null;
}

/**
 * Trader-facing numeric presentation only. Exact source values and analytical
 * contracts remain unchanged; this avoids leaking long decimal tails into the
 * dashboard while keeping broker-row editing lossless in Data Decisions.
 */
export function formatDashboardDecimal(value: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (match === null) return value;
  const [, sign, whole, fraction = ""] = match;
  if (fraction.length <= 2) {
    const visible = fraction.replace(/0+$/, "");
    const normalizedSign = whole === "0" && visible.length === 0 ? "" : sign;
    return `${normalizedSign}${whole}${visible.length > 0 ? `.${visible}` : ""}`;
  }
  const cents = BigInt(`${whole}${fraction.slice(0, 2).padEnd(2, "0")}`);
  const roundedMagnitude = cents + (fraction[2] >= "5" ? BigInt(1) : BigInt(0));
  const roundedWhole = roundedMagnitude / BigInt(100);
  const roundedFraction = (roundedMagnitude % BigInt(100)).toString().padStart(2, "0").replace(/0+$/, "");
  const normalizedSign = roundedMagnitude === BigInt(0) ? "" : sign;
  return `${normalizedSign}${roundedWhole.toString()}${roundedFraction.length > 0 ? `.${roundedFraction}` : ""}`;
}

export interface DashboardTableRowViewModel {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly metrics: readonly DashboardMetricViewModel[];
  readonly evidenceDigest: string;
  readonly limitationCodes: readonly string[];
}

export interface DashboardTableViewModel {
  readonly kind: "query" | "evidence_page";
  readonly rows: readonly DashboardTableRowViewModel[];
  readonly limitationCodes: readonly string[];
}

export interface DashboardDistributionChartBucketViewModel {
  readonly bucketIdentity: string;
  readonly label: string;
  readonly count: string;
  readonly evidenceDigest: string | null;
}

export interface DashboardDistributionChartViewModel {
  readonly measure: string;
  readonly unit: string;
  readonly availability: "available" | "unavailable";
  readonly buckets: readonly DashboardDistributionChartBucketViewModel[];
  readonly limitationCodes: readonly string[];
}

export interface DashboardLimitationViewModel {
  readonly codes: readonly string[];
  readonly hasLimitations: boolean;
}

export interface DashboardEvidenceViewModel {
  readonly evidenceDigest: string;
  readonly groupIdentity: string;
  readonly populationCount: string;
  readonly candidates: readonly Readonly<{
    readonly semanticRoundTripKey: string;
    readonly rowDigest: string;
    readonly role: "supporting" | "counterexample";
  }>[];
  readonly limitationCodes: readonly string[];
}

export interface DashboardComparisonMetricViewModel {
  readonly metricKey: string;
  readonly target: DashboardMetricViewModel;
  readonly baseline: DashboardMetricViewModel;
  readonly difference: DashboardMetricViewModel;
  readonly percentageDifference: DashboardMetricViewModel;
}

export interface DashboardComparisonViewModel {
  readonly metrics: readonly DashboardComparisonMetricViewModel[];
  readonly limitationCodes: readonly string[];
}

/** Formats an exact engine value without rounding, aggregating, or converting it. */
export function formatDashboardMetric(metric: ExactMetricValue): DashboardMetricViewModel {
  if (metric.kind === "unavailable") {
    return Object.freeze({
      metricKey: metric.metricKey,
      displayValue: "Unavailable",
      unit: metric.unit,
      availability: "unavailable",
      reasonCode: metric.reasonCode,
    });
  }
  const currencyPrefix = metric.currency === null ? "" : `${metric.currency} `;
  const displayValue = metric.kind === "exact_ratio"
    ? `${currencyPrefix}${metric.numerator} / ${metric.denominator}`
    : metric.kind === "duration"
      ? `${metric.nanoseconds} ns`
      : metric.kind === "timestamp" || metric.kind === "date"
        ? metric.value
        : `${currencyPrefix}${metric.kind === "exact_decimal"
          ? formatDashboardDecimal(metric.value)
          : metric.value}`;
  return Object.freeze({
    metricKey: metric.metricKey,
    displayValue,
    unit: metric.unit,
    availability: "available",
    reasonCode: null,
  });
}

function tableRow(row: DashboardMetricRow): DashboardTableRowViewModel {
  return Object.freeze({
    groupIdentity: row.groupIdentity,
    groupLabel: row.groupLabel,
    candidateCount: row.candidateCount,
    includedCount: row.includedCount,
    excludedCount: row.excludedCount,
    metrics: Object.freeze(row.metrics.map(formatDashboardMetric)),
    evidenceDigest: row.evidenceDigest,
    limitationCodes: row.limitationCodes,
  });
}

/** Builds display-ready tables from packets only; it never accepts execution rows or query plans. */
export function buildDashboardTableViewModel(
  packet: DashboardQueryPacket | DashboardEvidencePagePacket,
): DashboardTableViewModel {
  return Object.freeze({
    kind: packet.kind,
    rows: Object.freeze(packet.rows.map(tableRow)),
    limitationCodes: packet.limitationCodes,
  });
}

function bucketLabel(lowerInclusive: string | null, upperExclusive: string | null): string {
  if (lowerInclusive === null && upperExclusive === null) return "All values";
  if (lowerInclusive === null) return `< ${upperExclusive}`;
  if (upperExclusive === null) return `≥ ${lowerInclusive}`;
  return `${lowerInclusive} to < ${upperExclusive}`;
}

/** Creates chart labels only. Counts and boundaries remain the exact packet strings. */
export function buildDashboardDistributionChartViewModel(
  packet: DashboardDistributionPacket,
): DashboardDistributionChartViewModel {
  return Object.freeze({
    measure: packet.measure,
    unit: packet.unit,
    availability: packet.availability,
    buckets: Object.freeze(packet.buckets.map((bucket) => Object.freeze({
      bucketIdentity: bucket.bucketIdentity,
      label: bucketLabel(bucket.lowerInclusive, bucket.upperExclusive),
      count: bucket.count,
      evidenceDigest: bucket.evidenceDigest,
    }))),
    limitationCodes: packet.limitationCodes,
  });
}

/** Keeps limitation state visible for every packet kind. */
export function buildDashboardLimitationViewModel(
  packet: ExecutionAnalyticsDashboardPacket,
): DashboardLimitationViewModel {
  return Object.freeze({
    codes: packet.limitationCodes,
    hasLimitations: packet.limitationCodes.length > 0,
  });
}

/** Formats only the exact comparison values issued by the governed packet. */
export function buildDashboardComparisonViewModel(
  packet: DashboardComparisonPacket,
): DashboardComparisonViewModel {
  return Object.freeze({
    metrics: Object.freeze(packet.metrics.map((metric) => Object.freeze({
      metricKey: metric.metricKey,
      target: formatDashboardMetric(metric.target),
      baseline: formatDashboardMetric(metric.baseline),
      difference: formatDashboardMetric(metric.difference),
      percentageDifference: formatDashboardMetric(metric.percentageDifference),
    }))),
    limitationCodes: packet.limitationCodes,
  });
}

function evidenceViewModel(evidence: DashboardEvidenceReference): DashboardEvidenceViewModel {
  return Object.freeze({
    evidenceDigest: evidence.evidenceDigest,
    groupIdentity: evidence.groupIdentity,
    populationCount: evidence.populationCount,
    candidates: Object.freeze(evidence.candidates.map((candidate) => Object.freeze({
      semanticRoundTripKey: candidate.semanticRoundTripKey,
      rowDigest: candidate.rowDigest,
      role: candidate.role,
    }))),
    limitationCodes: evidence.limitationCodes,
  });
}

/** Exposes only bounded evidence references for a selected packet group. */
export function buildDashboardEvidenceViewModel(
  packet: DashboardQueryPacket | DashboardEvidencePagePacket,
  evidenceDigest: string,
): DashboardEvidenceViewModel | null {
  const evidence = packet.evidence.find((item) => item.evidenceDigest === evidenceDigest);
  return evidence === undefined ? null : evidenceViewModel(evidence);
}
