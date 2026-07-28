import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import { finalizeContentAddressedAuthority } from "../contracts";
import {
  buildAnalyticalPartitionReceipt,
  type AnalyticalPartitionReceipt,
} from "../dataset";
import {
  buildTradeQueryFindingPacket,
  executeTradeQueryAttribution,
  executeTradeQueryDistribution,
  executeTradeQueryPeriodAttribution,
  paginateTradeQueryResult,
  type TradeQueryAttributionResult,
  type TradeQueryAuthority,
  type TradeQueryDistributionResult,
  type TradeQueryFindingDimension,
  type TradeQueryFindingPacket,
  type TradeQueryPage,
  type TradeQueryPeriodAttributionResult,
  type TradeQueryResult,
} from "../query";
import { EXECUTION_ANALYTICS_CAPABILITY_CATALOG } from "../query/execution-analytics-capabilities";
import { executeTradeQuery } from "../query/execution/query-executor";
import type { VerifiedTradeQueryDatasetSource } from "../query/gateway/read-only-query-gateway";

export const SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION =
  "ti_v3_server_execution_analytics_adapter_v1" as const;
export const SERVER_EXECUTION_ANALYTICS_AUTHORITY_VERSION =
  "ti_v3_server_execution_analytics_authority_v1" as const;
export const SERVER_EXECUTION_ANALYTICS_GOVERNED_RESULT_VERSION =
  "ti_v3_server_execution_analytics_governed_result_v1" as const;

export type ServerExecutionAnalyticsAdapterFailure = Readonly<{
  code: "ti_v3_server_analytics_dataset_unavailable" | "ti_v3_server_analytics_partition_invalid" | "ti_v3_server_analytics_query_invalid";
  path: string;
}>;

/** Server-bound authority only; dashboard packet builders never accept these facts separately. */
export interface ServerExecutionAnalyticsAuthority {
  readonly schemaVersion: typeof SERVER_EXECUTION_ANALYTICS_AUTHORITY_VERSION;
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly currency: string;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly authorityDigest: CanonicalContentDigest;
}

/**
 * Content-addressed server envelope that ties a governed result to the exact
 * owner/account/currency/partition authority used to produce it.
 */
export interface ServerExecutionAnalyticsGovernedResult<T> {
  readonly schemaVersion: typeof SERVER_EXECUTION_ANALYTICS_GOVERNED_RESULT_VERSION;
  readonly authority: ServerExecutionAnalyticsAuthority;
  readonly result: T;
  readonly limitationCodes: readonly string[];
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly governedResultDigest: CanonicalContentDigest;
}

export interface ServerExecutionAnalyticsAdapter {
  readonly contractVersion: typeof SERVER_EXECUTION_ANALYTICS_ADAPTER_VERSION;
  readonly getCapabilities: () => typeof EXECUTION_ANALYTICS_CAPABILITY_CATALOG;
  readonly resolveCurrencyPartition: (
    currency: string,
  ) => ExactResult<AnalyticalPartitionReceipt, ServerExecutionAnalyticsAdapterFailure>;
  readonly getOverview: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getBreakdown: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getPerformanceSeries: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getDistribution: (
    currency: string,
    queryPlan: unknown,
    distribution: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryDistributionResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getAttribution: (
    currency: string,
    queryPlan: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryAttributionResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getPeriodAttribution: (
    currency: string,
    baselineQueryPlan: unknown,
    comparisonQueryPlan: unknown,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryPeriodAttributionResult>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getEvidencePage: (
    currency: string,
    queryPlan: unknown,
    pagination: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryPage>, ServerExecutionAnalyticsAdapterFailure>;
  readonly getFindings: (
    currency: string,
    queryPlan: unknown,
    dimension: TradeQueryFindingDimension,
    minimumSample: string,
  ) => ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryFindingPacket>, ServerExecutionAnalyticsAdapterFailure>;
}

interface ResolvedServerExecutionAnalyticsAuthority {
  readonly authority: ServerExecutionAnalyticsAuthority;
  readonly partition: AnalyticalPartitionReceipt;
  readonly queryAuthority: TradeQueryAuthority;
}

function failure(
  code: ServerExecutionAnalyticsAdapterFailure["code"],
  path: string,
): ExactResult<never, ServerExecutionAnalyticsAdapterFailure> {
  return { ok: false, error: { code, path } };
}

function bindGovernedResult<T>(
  authority: ServerExecutionAnalyticsAuthority,
  result: T,
  limitationCodes: readonly string[],
  sourceResultDigest: CanonicalContentDigest,
): ExactResult<ServerExecutionAnalyticsGovernedResult<T>, ServerExecutionAnalyticsAdapterFailure> {
  const bound = finalizeContentAddressedAuthority("server_execution_analytics_governed_result", {
    schemaVersion: SERVER_EXECUTION_ANALYTICS_GOVERNED_RESULT_VERSION,
    authority,
    result,
    limitationCodes,
    sourceResultDigest,
  }, "governedResultDigest");
  return bound.ok
    ? { ok: true, value: bound.value as ServerExecutionAnalyticsGovernedResult<T> }
    : failure("ti_v3_server_analytics_query_invalid", "$.governedResult");
}

/** Rebuilds both content-addressed layers before a dashboard packet may project them. */
export function verifyServerExecutionAnalyticsGovernedResult<T>(
  input: ServerExecutionAnalyticsGovernedResult<T>,
): boolean {
  const authority = input.authority;
  const rebuiltAuthority = finalizeContentAddressedAuthority("server_execution_analytics_authority", {
    schemaVersion: authority.schemaVersion,
    ownerScope: authority.ownerScope,
    accountScope: authority.accountScope,
    currency: authority.currency,
    snapshotDigest: authority.snapshotDigest,
    datasetReceiptDigest: authority.datasetReceiptDigest,
    datasetDerivationDigest: authority.datasetDerivationDigest,
    partitionDigest: authority.partitionDigest,
  }, "authorityDigest");
  if (!rebuiltAuthority.ok || rebuiltAuthority.value.authorityDigest !== authority.authorityDigest) return false;
  const rebuiltResult = finalizeContentAddressedAuthority("server_execution_analytics_governed_result", {
    schemaVersion: input.schemaVersion,
    authority,
    result: input.result,
    limitationCodes: input.limitationCodes,
    sourceResultDigest: input.sourceResultDigest,
  }, "governedResultDigest");
  return rebuiltResult.ok && rebuiltResult.value.governedResultDigest === input.governedResultDigest;
}

/**
 * Server-only seam over the verified v3 dataset gateway. It accepts a source
 * already bound to authenticated owner authority and never exposes a parser,
 * persistence handle, raw rows, or browser-selected owner scope.
 */
export function createServerExecutionAnalyticsAdapter(
  source: VerifiedTradeQueryDatasetSource,
): ServerExecutionAnalyticsAdapter {
  const resolveAuthority = (
    currency: string,
  ): ExactResult<ResolvedServerExecutionAnalyticsAuthority, ServerExecutionAnalyticsAdapterFailure> => {
    let derived: ReturnType<VerifiedTradeQueryDatasetSource["readVerifiedDataset"]>;
    try {
      derived = source.readVerifiedDataset();
    } catch {
      return failure("ti_v3_server_analytics_dataset_unavailable", "$.source");
    }
    if (!derived.ok) return failure("ti_v3_server_analytics_dataset_unavailable", "$.source");
    const partition = buildAnalyticalPartitionReceipt({
      schemaVersion: "ti_v3_analytical_partition_v1",
      datasetReceipt: derived.value.datasetReceipt,
      currency,
    });
    if (!partition.ok) return failure("ti_v3_server_analytics_partition_invalid", "$.currency");
    const queryAuthority: TradeQueryAuthority = Object.freeze({
      datasetReceipt: derived.value.datasetReceipt,
      datasetDerivationReceipt: derived.value.derivationReceipt,
      partitionReceipt: partition.value,
    });
    const built = finalizeContentAddressedAuthority("server_execution_analytics_authority", {
      schemaVersion: SERVER_EXECUTION_ANALYTICS_AUTHORITY_VERSION,
      ownerScope: partition.value.ownerScope,
      accountScope: partition.value.accountScope,
      currency: partition.value.currency,
      snapshotDigest: derived.value.datasetReceipt.snapshotDigest,
      datasetReceiptDigest: derived.value.datasetReceipt.receiptDigest,
      datasetDerivationDigest: derived.value.derivationReceipt.derivationDigest,
      partitionDigest: partition.value.partitionDigest,
    }, "authorityDigest");
    if (!built.ok) return failure("ti_v3_server_analytics_dataset_unavailable", "$.source");
    return {
      ok: true,
      value: Object.freeze({
        authority: built.value as ServerExecutionAnalyticsAuthority,
        partition: partition.value,
        queryAuthority,
      }),
    };
  };
  const resolveCurrencyPartition = (
    currency: string,
  ): ExactResult<AnalyticalPartitionReceipt, ServerExecutionAnalyticsAdapterFailure> => {
    const authority = resolveAuthority(currency);
    return authority.ok ? { ok: true, value: authority.value.partition } : authority;
  };
  const executeQuery = (
    currency: string,
    queryPlan: unknown,
  ): ExactResult<Readonly<{
    readonly resolved: ResolvedServerExecutionAnalyticsAuthority;
    readonly result: TradeQueryResult;
  }>, ServerExecutionAnalyticsAdapterFailure> => {
    const resolved = resolveAuthority(currency);
    if (!resolved.ok) return resolved;
    const result = executeTradeQuery({ source, partitionReceipt: resolved.value.partition, queryPlan });
    return result.ok
      ? { ok: true, value: Object.freeze({ resolved: resolved.value, result: result.value }) }
      : failure("ti_v3_server_analytics_query_invalid", "$.queryPlan");
  };
  const execute = (
    currency: string,
    queryPlan: unknown,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryResult>, ServerExecutionAnalyticsAdapterFailure> => {
    const query = executeQuery(currency, queryPlan);
    return query.ok
      ? bindGovernedResult(
          query.value.resolved.authority,
          query.value.result,
          query.value.result.limitationCodes,
          query.value.result.resultDigest,
        )
      : query;
  };
  const distribution = (
    currency: string,
    queryPlan: unknown,
    distributionSpec: unknown,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryDistributionResult>, ServerExecutionAnalyticsAdapterFailure> => {
    const resolved = resolveAuthority(currency);
    if (!resolved.ok) return resolved;
    const result = executeTradeQueryDistribution({
      source,
      partitionReceipt: resolved.value.partition,
      queryPlan,
      distribution: distributionSpec,
    });
    return result.ok
      ? bindGovernedResult(resolved.value.authority, result.value, result.value.limitationCodes, result.value.resultDigest)
      : failure("ti_v3_server_analytics_query_invalid", "$.distribution");
  };
  const attribution = (
    currency: string,
    queryPlan: unknown,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryAttributionResult>, ServerExecutionAnalyticsAdapterFailure> => {
    const resolved = resolveAuthority(currency);
    if (!resolved.ok) return resolved;
    const result = executeTradeQueryAttribution({ source, partitionReceipt: resolved.value.partition, queryPlan });
    return result.ok
      ? bindGovernedResult(resolved.value.authority, result.value, result.value.limitationCodes, result.value.resultDigest)
      : failure("ti_v3_server_analytics_query_invalid", "$.queryPlan");
  };
  const periodAttribution = (
    currency: string,
    baselineQueryPlan: unknown,
    comparisonQueryPlan: unknown,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryPeriodAttributionResult>, ServerExecutionAnalyticsAdapterFailure> => {
    const resolved = resolveAuthority(currency);
    if (!resolved.ok) return resolved;
    const result = executeTradeQueryPeriodAttribution({
      source,
      partitionReceipt: resolved.value.partition,
      baselineQueryPlan,
      comparisonQueryPlan,
    });
    return result.ok
      ? bindGovernedResult(resolved.value.authority, result.value, result.value.limitationCodes, result.value.resultDigest)
      : failure("ti_v3_server_analytics_query_invalid", "$.periodAttribution");
  };
  const evidencePage = (
    currency: string,
    queryPlan: unknown,
    pagination: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryPage>, ServerExecutionAnalyticsAdapterFailure> => {
    const query = executeQuery(currency, queryPlan);
    if (!query.ok) return query;
    const page = paginateTradeQueryResult(query.value.result, pagination);
    return page.ok
      ? bindGovernedResult(
          query.value.resolved.authority,
          page.value,
          query.value.result.limitationCodes,
          query.value.result.resultDigest,
        )
      : failure("ti_v3_server_analytics_query_invalid", "$.pagination");
  };
  const findings = (
    currency: string,
    queryPlan: unknown,
    dimension: TradeQueryFindingDimension,
    minimumSample: string,
  ): ExactResult<ServerExecutionAnalyticsGovernedResult<TradeQueryFindingPacket>, ServerExecutionAnalyticsAdapterFailure> => {
    const query = executeQuery(currency, queryPlan);
    if (!query.ok) return query;
    const result = buildTradeQueryFindingPacket({
      result: query.value.result,
      authority: query.value.resolved.queryAuthority,
      dimension,
      minimumSample,
    });
    return result.ok
      ? bindGovernedResult(
          query.value.resolved.authority,
          result.value,
          result.value.limitationCodes,
          result.value.queryResultDigest,
        )
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
