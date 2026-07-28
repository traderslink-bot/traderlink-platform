import type { ExactResult } from "../../domain/exact";
import { EXECUTION_ANALYTICS_CAPABILITY_CATALOG } from "../query/execution-analytics-capabilities";
import { executeTradeQuery } from "../query/execution/query-executor";
import type { TradeQueryResult } from "../query/contracts/query-result";
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
  return Object.freeze({
    contractVersion: SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION,
    getCapabilities: () => EXECUTION_ANALYTICS_CAPABILITY_CATALOG,
    resolveCurrencyPartition,
    getOverview: execute,
    getBreakdown: execute,
  });
}
