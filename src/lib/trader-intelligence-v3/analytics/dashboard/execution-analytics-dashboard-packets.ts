import { finalizeContentAddressedAuthority, type ExactMetricValue } from "../contracts";
import type { CanonicalContentDigest } from "../../../domain/identity";
import type {
  TradeQueryAttributionResult,
  TradeQueryDistributionResult,
  TradeQueryFindingPacket,
  TradeQueryPage,
  TradeQueryPeriodAttributionResult,
  TradeQueryResult,
} from "../query";

export const EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION =
  "ti_v3_execution_analytics_dashboard_packet_v1" as const;

export interface DashboardEvidenceCandidate {
  readonly semanticRoundTripKey: string;
  readonly rowDigest: CanonicalContentDigest;
  readonly role: "supporting" | "counterexample";
}

export interface DashboardEvidenceReference {
  readonly evidenceDigest: CanonicalContentDigest;
  readonly groupIdentity: string;
  readonly populationCount: string;
  readonly candidates: readonly DashboardEvidenceCandidate[];
  readonly limitationCodes: readonly string[];
}

export interface DashboardMetricRow {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly metrics: readonly ExactMetricValue[];
  readonly evidenceDigest: CanonicalContentDigest;
  readonly limitationCodes: readonly string[];
}

interface DashboardPacketBase {
  readonly schemaVersion: typeof EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION;
  readonly currency: string;
  readonly limitationCodes: readonly string[];
  readonly packetDigest: CanonicalContentDigest;
}

export interface DashboardQueryPacket extends DashboardPacketBase {
  readonly kind: "query";
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly executionReceiptDigest: CanonicalContentDigest;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly rows: readonly DashboardMetricRow[];
  readonly evidence: readonly DashboardEvidenceReference[];
}

export interface DashboardEvidencePagePacket extends DashboardPacketBase {
  readonly kind: "evidence_page";
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly pageDigest: CanonicalContentDigest;
  readonly pageSize: string;
  readonly offset: string;
  readonly totalRowCount: string;
  readonly omittedCount: string;
  readonly sourceResultWasBounded: boolean;
  readonly rows: readonly DashboardMetricRow[];
  readonly evidence: readonly DashboardEvidenceReference[];
  readonly continuation: Readonly<{
    readonly continuationDigest: CanonicalContentDigest;
    readonly nextOffset: string;
  }> | null;
}

export interface DashboardDistributionPacket extends DashboardPacketBase {
  readonly kind: "distribution";
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly measure: string;
  readonly unit: "money" | "seconds" | "shares";
  readonly availability: "available" | "unavailable";
  readonly populationCount: string;
  readonly availableValueCount: string;
  readonly statistics: readonly ExactMetricValue[];
  readonly findings: TradeQueryDistributionResult["findings"];
  readonly buckets: readonly TradeQueryDistributionResult["buckets"][number][];
  readonly evidence: readonly DashboardEvidenceReference[];
}

export interface DashboardAttributionPacket extends DashboardPacketBase {
  readonly kind: "attribution";
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly authorityState: "available" | "limited";
  readonly segments: readonly TradeQueryAttributionResult["segments"][number][];
  readonly evidence: readonly DashboardEvidenceReference[];
}

export interface DashboardPeriodAttributionPacket extends DashboardPacketBase {
  readonly kind: "period_attribution";
  readonly baselineQueryPlanDigest: CanonicalContentDigest;
  readonly comparisonQueryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly baselineCount: string;
  readonly comparisonCount: string;
  readonly baselineNetPnl: ExactMetricValue;
  readonly comparisonNetPnl: ExactMetricValue;
  readonly absoluteChange: ExactMetricValue;
  readonly frequencyEffect: ExactMetricValue;
  readonly mixEffect: ExactMetricValue;
  readonly averageResultEffect: ExactMetricValue;
  readonly reconciliationDifference: ExactMetricValue;
  readonly segments: readonly TradeQueryPeriodAttributionResult["segments"][number][];
  readonly evidence: readonly DashboardEvidenceReference[];
}

export interface DashboardFindingsPacket extends DashboardPacketBase {
  readonly kind: "findings";
  readonly queryResultDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly findingPacketDigest: CanonicalContentDigest;
  readonly dimension: TradeQueryFindingPacket["dimension"];
  readonly minimumSample: string;
  readonly findings: TradeQueryFindingPacket["findings"];
}

export type ExecutionAnalyticsDashboardPacket =
  | DashboardQueryPacket
  | DashboardEvidencePagePacket
  | DashboardDistributionPacket
  | DashboardAttributionPacket
  | DashboardPeriodAttributionPacket
  | DashboardFindingsPacket;

function evidenceReferences(
  evidence: TradeQueryResult["evidence"],
): readonly DashboardEvidenceReference[] {
  return Object.freeze(evidence.map((item) => Object.freeze({
    evidenceDigest: item.evidenceDigest,
    groupIdentity: item.groupIdentity,
    populationCount: item.populationCount,
    candidates: Object.freeze(item.candidates.map((candidate) => Object.freeze({
      semanticRoundTripKey: candidate.semanticRoundTripKey,
      rowDigest: candidate.rowDigest,
      role: candidate.role,
    }))),
    limitationCodes: item.limitationCodes,
  })));
}

function metricRows(rows: readonly TradeQueryResult["rows"][number][]): readonly DashboardMetricRow[] {
  return Object.freeze(rows.map((row) => Object.freeze({
    groupIdentity: row.groupIdentity,
    groupLabel: row.groupLabel,
    candidateCount: row.candidateCount,
    includedCount: row.includedCount,
    excludedCount: row.excludedCount,
    metrics: row.metrics,
    evidenceDigest: row.evidenceDigest,
    limitationCodes: row.limitationCodes,
  })));
}

function packet<T extends Omit<DashboardPacketBase, "packetDigest">>(
  type: string,
  body: T,
): T & Readonly<{ readonly packetDigest: CanonicalContentDigest }> {
  const built = finalizeContentAddressedAuthority(type, body, "packetDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as T & Readonly<{ readonly packetDigest: CanonicalContentDigest }>;
}

/** Projects verified engine results into a bounded browser-safe dashboard contract. */
export function buildDashboardQueryPacket(result: TradeQueryResult): DashboardQueryPacket {
  return packet("execution_analytics_dashboard_query_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "query" as const,
    currency: result.normalizedQueryPlan.authority.currency,
    queryPlanDigest: result.normalizedQueryPlan.queryPlanDigest,
    resultDigest: result.resultDigest,
    executionReceiptDigest: result.executionReceipt.receiptDigest,
    candidateCount: result.candidateCount,
    includedCount: result.includedCount,
    excludedCount: result.excludedCount,
    rows: metricRows(result.rows),
    evidence: evidenceReferences(result.evidence),
    limitationCodes: result.limitationCodes,
  });
}

export function buildDashboardEvidencePagePacket(
  page: TradeQueryPage,
  currency: string,
  limitationCodes: readonly string[],
): DashboardEvidencePagePacket {
  return packet("execution_analytics_dashboard_evidence_page_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "evidence_page" as const,
    currency,
    sourceResultDigest: page.sourceResultDigest,
    queryPlanDigest: page.queryPlanDigest,
    pageDigest: page.pageDigest,
    pageSize: page.pageSize,
    offset: page.offset,
    totalRowCount: page.totalRowCount,
    omittedCount: page.omittedCount,
    sourceResultWasBounded: page.sourceResultWasBounded,
    rows: metricRows(page.rows),
    evidence: evidenceReferences(page.evidence),
    continuation: page.continuation === null ? null : Object.freeze({
      continuationDigest: page.continuation.continuationDigest,
      nextOffset: page.continuation.nextOffset,
    }),
    limitationCodes,
  });
}

export function buildDashboardDistributionPacket(
  result: TradeQueryDistributionResult,
): DashboardDistributionPacket {
  return packet("execution_analytics_dashboard_distribution_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "distribution" as const,
    currency: result.currency ?? "",
    queryPlanDigest: result.queryPlanDigest,
    resultDigest: result.resultDigest,
    measure: result.measure,
    unit: result.unit,
    availability: result.availability,
    populationCount: result.populationCount,
    availableValueCount: result.availableValueCount,
    statistics: result.statistics,
    findings: result.findings,
    buckets: result.buckets,
    evidence: evidenceReferences(result.evidence),
    limitationCodes: result.limitationCodes,
  });
}

export function buildDashboardAttributionPacket(
  result: TradeQueryAttributionResult,
  currency: string,
): DashboardAttributionPacket {
  return packet("execution_analytics_dashboard_attribution_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "attribution" as const,
    currency,
    queryPlanDigest: result.queryPlanDigest,
    resultDigest: result.resultDigest,
    candidateCount: result.candidateCount,
    includedCount: result.includedCount,
    excludedCount: result.excludedCount,
    authorityState: result.authorityState,
    segments: result.segments,
    evidence: evidenceReferences(result.evidence),
    limitationCodes: result.limitationCodes,
  });
}

export function buildDashboardPeriodAttributionPacket(
  result: TradeQueryPeriodAttributionResult,
  currency: string,
): DashboardPeriodAttributionPacket {
  return packet("execution_analytics_dashboard_period_attribution_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "period_attribution" as const,
    currency,
    baselineQueryPlanDigest: result.baselineQueryPlanDigest,
    comparisonQueryPlanDigest: result.comparisonQueryPlanDigest,
    resultDigest: result.resultDigest,
    baselineCount: result.baselineCount,
    comparisonCount: result.comparisonCount,
    baselineNetPnl: result.baselineNetPnl,
    comparisonNetPnl: result.comparisonNetPnl,
    absoluteChange: result.absoluteChange,
    frequencyEffect: result.frequencyEffect,
    mixEffect: result.mixEffect,
    averageResultEffect: result.averageResultEffect,
    reconciliationDifference: result.reconciliationDifference,
    segments: result.segments,
    evidence: evidenceReferences(result.evidence),
    limitationCodes: result.limitationCodes,
  });
}

export function buildDashboardFindingsPacket(
  result: TradeQueryFindingPacket,
  currency: string,
): DashboardFindingsPacket {
  return packet("execution_analytics_dashboard_findings_packet", {
    schemaVersion: EXECUTION_ANALYTICS_DASHBOARD_PACKET_VERSION,
    kind: "findings" as const,
    currency,
    queryResultDigest: result.queryResultDigest,
    queryPlanDigest: result.queryPlanDigest,
    findingPacketDigest: result.packetDigest,
    dimension: result.dimension,
    minimumSample: result.minimumSample,
    findings: result.findings,
    limitationCodes: result.limitationCodes,
  });
}
