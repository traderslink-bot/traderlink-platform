import type { ExactResult } from "../../domain/exact";
import { EXECUTION_ANALYTICS_CAPABILITY_CATALOG } from "../query/execution-analytics-capabilities";
import { executeTradeQuery } from "../query/execution/query-executor";
import type { TradeQueryResult } from "../query/contracts/query-result";
import {
  executeTradeQueryAttribution,
  executeTradeQueryDistribution,
  executeTradeQueryPeriodAttribution,
  buildTradeQueryFindingPacket,
  paginateTradeQueryResult,
  type TradeQueryAttributionResult,
  type TradeQueryDistributionResult,
  type TradeQueryFindingDimension,
  type TradeQueryFindingPacket,
  type TradeQueryPage,
  type TradeQueryPeriodAttributionResult,
  type TradeQueryAuthority,
} from "../query";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway/read-only-query-gateway";
import {
  buildAnalyticalPartitionReceipt,
  type AnalyticalPartitionReceipt,
} from "../dataset";

export const SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION =
  "ti_v3_server_execution_analytics_adapter_v1" as const;

export type ServerExecutionAnalyticsAdapterFailure = Readonly<{
  code: "ti_v3_server_analytics_dataset_unavailable" | "ti_v3_server_analytics_partition_invalid" | "ti_v3_server_analytics_query_invalid";
  path: string;
}>;

export interface ServerExecutionAnalyticsAdapter {
  readonly contractVersion: typeof SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION;
  readonly getCapabilities: () => typeof EXECUTION_ANALYTICS_CAPABILITY_CATALOG;
  readonly resolveCurrencyPartition: (
    currency: string,
  ) => ExactResult<AnalyticalPartitionReceipt, ServerExecutionAnalyticsAdapterFailure>;
  readonly getOverview: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<TradeQueryResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getBreakdown: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<TradeQueryResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getPerformanceSeries: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<TradeQueryResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getDistribution: (
    currency: string,
    queryPlan: unknown,
    distribution: unknown,
  ) => ExactResult<TradeQueryDistributionResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getAttribution: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<TradeQueryAttributionResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getPeriodAttribution: (
    currency: string,
    baselineQueryPlan: unknown,
    comparisonQueryPlan: unknown,
  ) => ExactResult<TradeQueryPeriodAttributionResult, ServerExecutionAnalyticsAdapterFailure>;
  readonly getEvidencePage: (
    currency: string,
    queryPlan: unknown,
    pagination: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
  ) => ExactResult<TradeQueryPage, ServerExecutionAnalyticsAdapterFailure>;
  readonly getFindings: (
    currency: string,
    queryPlan: unknown,
    dimension: TradeQueryFindingDimension,
    minimumSample: string,
  ) => ExactResult<TradeQueryFindingPacket, ServerExecutionAnalyticsAdapterFailure>;
}

function failure(
  code: ServerExecutionAnalyticsAdapterFailure["code"],
  path: string,
): ExactResult<never, ServerExecutionAnalyticsAdapterFailure> {
  return { ok: false, error: { code, path } };
}

/**
 * Server-only seam over the verified v3 dataset gateway. It accepts a source
 * already bound to authenticated owner authority and never exposes a parser,
 * persistence handle, raw rows, or browser-selected owner scope.
 */
export function createServerExecutionAnalyticsAdapter(
  source: VerifiedTradeQueryDatasetSource,
): ServerExecutionAnalyticsAdapter {
  const resolveCurrencyPartition = (
    currency: string,
  ): ExactResult<AnalyticalPartitionReceipt, ServerExecutionAnalyticsAdapterFailure> => {
    const derived = source.readVerifiedDataset();
    if (!derived.ok) return failure("ti_v3_server_analytics_dataset_unavailable", "$.source");
    const partition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: derived.value.datasetReceipt,
      currency,
    });
    return partition.ok
      ? partition
      : failure("ti_v3_server_analytics_partition_invalid", "$.currency");
  };
  const execute = (
    currency: string,
    queryPlan: unknown,
  ): ExactResult<TradeQueryResult, ServerExecutionAnalyticsAdapterFailure> => {
    const partition = resolveCurrencyPartition(currency);
    if (!partition.ok) return partition;
    const result = executeTradeQuery({ source, partitionReceipt: partition.value, queryPlan });
    return result.ok
      ? result
      : failure("ti_v3_server_analytics_query_invalid", "$.queryPlan");
  };
  const distribution = (
    currency: string,
    queryPlan: unknown,
    distributionSpec: unknown,
  ): ExactResult<TradeQueryDistributionResult, ServerExecutionAnalyticsAdapterFailure> => {
    const partition = resolveCurrencyPartition(currency);
    if (!partition.ok) return partition;
    const result = executeTradeQueryDistribution({
      source,
      partitionReceipt: partition.value,
      queryPlan,
      distribution: distributionSpec,
    });
    return result.ok
      ? result
      : failure("ti_v3_server_analytics_query_invalid", "$.distribution");
  };
  const attribution = (
    currency: string,
    queryPlan: unknown,
  ): ExactResult<TradeQueryAttributionResult, ServerExecutionAnalyticsAdapterFailure> => {
    const partition = resolveCurrencyPartition(currency);
    if (!partition.ok) return partition;
    const result = executeTradeQueryAttribution({ source, partitionReceipt: partition.value, queryPlan });
    return result.ok
      ? result
      : failure("ti_v3_server_analytics_query_invalid", "$.queryPlan");
  };
  const periodAttribution = (
    currency: string,
    baselineQueryPlan: unknown,
    comparisonQueryPlan: unknown,
  ): ExactResult<TradeQueryPeriodAttributionResult, ServerExecutionAnalyticsAdapterFailure> => {
    const partition = resolveCurrencyPartition(currency);
    if (!partition.ok) return partition;
    const result = executeTradeQueryPeriodAttribution({
      source,
      partitionReceipt: partition.value,
      baselineQueryPlan,
      comparisonQueryPlan,
    });
    return result.ok
      ? result
      : failure("ti_v3_server_analytics_query_invalid", "$.periodAttribution");
  };
  const evidencePage = (
    currency: string,
    queryPlan: unknown,
    pagination: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
  ): ExactResult<TradeQueryPage, ServerExecutionAnalyticsAdapterFailure> => {
    const result = execute(currency, queryPlan);
    if (!result.ok) return result;
    const page = paginateTradeQueryResult(result.value, pagination);
    return page.ok
      ? page
      : failure("ti_v3_server_analytics_query_invalid", "$.pagination");
  };
  const queryAuthority = (
    currency: string,
  ): ExactResult<TradeQueryAuthority, ServerExecutionAnalyticsAdapterFailure> => {
    const derived = source.readVerifiedDataset();
    if (!derived.ok) return failure("ti_v3_server_analytics_dataset_unavailable", "$.source");
    const partition = resolveCurrencyPartition(currency);
    if (!partition.ok) return partition;
    return {
      ok: true,
      value: Object.freeze({
        datasetReceipt: derived.value.datasetReceipt,
        datasetDerivationReceipt: derived.value.derivationReceipt,
        partitionReceipt: partition.value,
      }),
    };
  };
  const findings = (
    currency: string,
    queryPlan: unknown,
    dimension: TradeQueryFindingDimension,
    minimumSample: string,
  ): ExactResult<TradeQueryFindingPacket, ServerExecutionAnalyticsAdapterFailure> => {
    const result = execute(currency, queryPlan);
    if (!result.ok) return result;
    const authority = queryAuthority(currency);
    if (!authority.ok) return authority;
    const packet = buildTradeQueryFindingPacket({
      result: result.value,
      authority: authority.value,
      dimension,
      minimumSample,
    });
    return packet.ok
      ? packet
      : failure("ti_v3_server_analytics_query_invalid", "$.findings");
  };
  return Object.freeze({
    contractVersion: SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION,
    getCapabilities: () => EXECUTION_ANALYTICS_CAPABILITY_CATALOG,
    resolveCurrencyPartition,
    getOverview: execute,
    getBreakdown: execute,
    getPerformanceSeries: execute,
    getDistribution: distribution,
    getAttribution: attribution,
    getPeriodAttribution: periodAttribution,
    getEvidencePage: evidencePage,
    getFindings: findings,
  });
}
