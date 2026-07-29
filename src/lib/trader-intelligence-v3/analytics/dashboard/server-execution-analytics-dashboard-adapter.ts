import type { ExactResult } from "../../domain/exact";
import {
  createServerExecutionAnalyticsAdapter,
  type ServerExecutionAnalyticsAdapterFailure,
} from "../adapters";
import type { VerifiedTradeQueryDatasetSource } from "../query";
import type { TradeQueryFindingDimension } from "../query";
import {
  buildDashboardAttributionPacket,
  buildDashboardComparisonPacket,
  buildDashboardDistributionPacket,
  buildDashboardEvidencePagePacket,
  buildDashboardFindingsPacket,
  buildDashboardPeriodAttributionPacket,
  buildDashboardQueryPacket,
  type DashboardAttributionPacket,
  type DashboardComparisonPacket,
  type DashboardDistributionPacket,
  type DashboardEvidencePagePacket,
  type DashboardFindingsPacket,
  type DashboardPeriodAttributionPacket,
  type DashboardQueryPacket,
} from "./execution-analytics-dashboard-packets";

export const SERVER_EXECUTION_ANALYTICS_DASHBOARD_ADAPTER_VERSION =
  "ti_v3_server_execution_analytics_dashboard_adapter_v1" as const;

type DashboardResult<T> = ExactResult<T, ServerExecutionAnalyticsAdapterFailure>;

export interface ServerExecutionAnalyticsDashboardAdapter {
  readonly contractVersion: typeof SERVER_EXECUTION_ANALYTICS_DASHBOARD_ADAPTER_VERSION;
  readonly getCapabilities: ReturnType<typeof createServerExecutionAnalyticsAdapter>["getCapabilities"];
  readonly getOverview: (currency: string, queryPlan: unknown) => DashboardResult<DashboardQueryPacket>;
  readonly getBreakdown: (currency: string, queryPlan: unknown) => DashboardResult<DashboardQueryPacket>;
  readonly getPerformanceSeries: (currency: string, queryPlan: unknown) => DashboardResult<DashboardQueryPacket>;
  readonly getDistribution: (
    currency: string,
    queryPlan: unknown,
    distribution: unknown,
  ) => DashboardResult<DashboardDistributionPacket>;
  readonly getAttribution: (
    currency: string,
    queryPlan: unknown,
  ) => DashboardResult<DashboardAttributionPacket>;
  readonly getPeriodAttribution: (
    currency: string,
    baselineQueryPlan: unknown,
    comparisonQueryPlan: unknown,
  ) => DashboardResult<DashboardPeriodAttributionPacket>;
  readonly getComparison: (
    currency: string,
    targetQueryPlan: unknown,
    baselineQueryPlan: unknown,
  ) => DashboardResult<DashboardComparisonPacket>;
  readonly getEvidencePage: (
    currency: string,
    queryPlan: unknown,
    pagination: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
  ) => DashboardResult<DashboardEvidencePagePacket>;
  readonly getFindings: (
    currency: string,
    queryPlan: unknown,
    dimension: TradeQueryFindingDimension,
    minimumSample: string,
  ) => DashboardResult<DashboardFindingsPacket>;
}

function project<TInput, TPacket>(
  result: ExactResult<TInput, ServerExecutionAnalyticsAdapterFailure>,
  packet: (input: TInput) => TPacket,
): DashboardResult<TPacket> {
  return result.ok ? { ok: true, value: packet(result.value) } : result;
}

/**
 * Complete browser-safe facade over the execution analytics engine. Every
 * result is calculated by the server adapter and projected through a verified
 * dashboard packet before it can cross the React server/client boundary.
 */
export function createServerExecutionAnalyticsDashboardAdapter(
  source: VerifiedTradeQueryDatasetSource,
): ServerExecutionAnalyticsDashboardAdapter {
  const adapter = createServerExecutionAnalyticsAdapter(source);
  const dashboardAdapter: ServerExecutionAnalyticsDashboardAdapter = {
    contractVersion: SERVER_EXECUTION_ANALYTICS_DASHBOARD_ADAPTER_VERSION,
    getCapabilities: adapter.getCapabilities,
    getOverview: (currency, queryPlan) =>
      project(adapter.getOverview(currency, queryPlan), buildDashboardQueryPacket),
    getBreakdown: (currency, queryPlan) =>
      project(adapter.getBreakdown(currency, queryPlan), buildDashboardQueryPacket),
    getPerformanceSeries: (currency, queryPlan) =>
      project(adapter.getPerformanceSeries(currency, queryPlan), buildDashboardQueryPacket),
    getDistribution: (currency, queryPlan, distribution) =>
      project(
        adapter.getDistribution(currency, queryPlan, distribution),
        buildDashboardDistributionPacket,
      ),
    getAttribution: (currency, queryPlan) =>
      project(adapter.getAttribution(currency, queryPlan), buildDashboardAttributionPacket),
    getPeriodAttribution: (currency, baselineQueryPlan, comparisonQueryPlan) =>
      project(
        adapter.getPeriodAttribution(currency, baselineQueryPlan, comparisonQueryPlan),
        buildDashboardPeriodAttributionPacket,
      ),
    getComparison: (currency, targetQueryPlan, baselineQueryPlan) =>
      project(
        adapter.getComparison(currency, targetQueryPlan, baselineQueryPlan),
        buildDashboardComparisonPacket,
      ),
    getEvidencePage: (currency, queryPlan, pagination) =>
      project(
        adapter.getEvidencePage(currency, queryPlan, pagination),
        buildDashboardEvidencePagePacket,
      ),
    getFindings: (currency, queryPlan, dimension, minimumSample) =>
      project(
        adapter.getFindings(currency, queryPlan, dimension, minimumSample),
        buildDashboardFindingsPacket,
      ),
  };
  return Object.freeze(dashboardAdapter);
}
