import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  verifyExactMetricValue,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import type { TradeQueryEvidence } from "../evidence/query-evidence";
import type { TradeQueryPlan } from "./query-plan";
import { TRADE_QUERY_LIMITS } from "./query-plan";

export const TRADE_QUERY_RESULT_VERSION = "ti_v3_trade_query_result_v1" as const;
export const TRADE_QUERY_EXECUTION_RECEIPT_VERSION = "ti_v3_trade_query_execution_receipt_v1" as const;

export interface TradeQueryResultRow {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
  readonly includedCount: string;
  readonly metrics: readonly ExactMetricValue[];
  readonly evidenceDigest: CanonicalContentDigest;
  readonly limitationCodes: readonly string[];
}

export interface TradeQueryExecutionReceipt {
  readonly schemaVersion: typeof TRADE_QUERY_EXECUTION_RECEIPT_VERSION;
  readonly executorKey: "ti_v3_generic_trade_query_executor";
  readonly executorVersion: "v1";
  readonly gatewayKey: "ti_v3_read_only_trade_query_gateway";
  readonly gatewayVersion: "v1";
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly resultDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly datasetDerivationDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly evidenceDigests: readonly CanonicalContentDigest[];
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly receiptDigest: CanonicalContentDigest;
}

export interface TradeQueryResult {
  readonly schemaVersion: typeof TRADE_QUERY_RESULT_VERSION;
  readonly runContext: Readonly<{
    readonly executorKey: "ti_v3_generic_trade_query_executor";
    readonly executorVersion: "v1";
    readonly gatewayKey: "ti_v3_read_only_trade_query_gateway";
    readonly gatewayVersion: "v1";
  }>;
  readonly normalizedQueryPlan: TradeQueryPlan;
  readonly rows: readonly TradeQueryResultRow[];
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly evidence: readonly TradeQueryEvidence[];
  readonly excludedCandidateKeys: readonly string[];
  readonly limitationCodes: readonly string[];
  readonly diagnostics: readonly Readonly<{ readonly code: string; readonly affectedKeys: readonly string[] }>[];
  readonly resultDigest: CanonicalContentDigest;
  readonly executionReceipt: TradeQueryExecutionReceipt;
}

type ResultBody = Omit<TradeQueryResult, "resultDigest" | "executionReceipt">;

export function buildTradeQueryResult(
  body: ResultBody,
): { readonly ok: true; readonly value: TradeQueryResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const serialized = serializeCanonicalValue(body);
  if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumResultCodeUnits) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized", path: "$.result" },
    };
  }
  const addressed = finalizeContentAddressedAuthority("trade_query_result", body, "resultDigest");
  if (!addressed.ok) return addressed;
  const receipt = finalizeContentAddressedAuthority("trade_query_execution_receipt", {
    schemaVersion: TRADE_QUERY_EXECUTION_RECEIPT_VERSION,
    executorKey: body.runContext.executorKey,
    executorVersion: body.runContext.executorVersion,
    gatewayKey: body.runContext.gatewayKey,
    gatewayVersion: body.runContext.gatewayVersion,
    queryPlanDigest: body.normalizedQueryPlan.queryPlanDigest,
    resultDigest: addressed.value.resultDigest,
    snapshotDigest: body.normalizedQueryPlan.authority.snapshotDigest,
    datasetReceiptDigest: body.normalizedQueryPlan.authority.datasetReceiptDigest,
    datasetDerivationDigest: body.normalizedQueryPlan.authority.datasetDerivationDigest,
    partitionDigest: body.normalizedQueryPlan.authority.partitionDigest,
    evidenceDigests: body.evidence.map((item) => item.evidenceDigest).sort(compareUnicodeCodePoints),
    candidateCount: body.candidateCount,
    includedCount: body.includedCount,
    excludedCount: body.excludedCount,
  }, "receiptDigest");
  if (!receipt.ok) return receipt;
  return {
    ok: true,
    value: Object.freeze({
      ...addressed.value,
      executionReceipt: receipt.value as TradeQueryExecutionReceipt,
    }) as TradeQueryResult,
  };
}

export function verifyTradeQueryResultShape(
  input: unknown,
): { readonly ok: true; readonly value: TradeQueryResult } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "runContext", "normalizedQueryPlan", "rows",
    "candidateCount", "includedCount", "excludedCount", "evidence",
    "excludedCandidateKeys", "limitationCodes", "diagnostics",
    "resultDigest", "executionReceipt",
  ]);
  if (!record.ok || record.value.schemaVersion !== TRADE_QUERY_RESULT_VERSION) {
    return record.ok
      ? { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.schemaVersion" } }
      : record;
  }
  if (!Array.isArray(record.value.rows)) {
    return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.rows" } };
  }
  for (let rowIndex = 0; rowIndex < record.value.rows.length; rowIndex += 1) {
    const row = record.value.rows[rowIndex] as { readonly metrics?: unknown };
    if (!Array.isArray(row.metrics)) {
      return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: `$.rows[${rowIndex}].metrics` } };
    }
    for (let metricIndex = 0; metricIndex < row.metrics.length; metricIndex += 1) {
      const metric = verifyExactMetricValue(row.metrics[metricIndex]);
      if (!metric.ok) return metric;
    }
  }
  const digest = validateClaimedDigest(record.value.resultDigest, "$.resultDigest", "trade_query_result");
  const receipt = validateContractRecord(record.value.executionReceipt, [
    "schemaVersion", "executorKey", "executorVersion", "gatewayKey", "gatewayVersion",
    "queryPlanDigest", "resultDigest", "snapshotDigest", "datasetReceiptDigest",
    "datasetDerivationDigest", "partitionDigest", "evidenceDigests",
    "candidateCount", "includedCount", "excludedCount", "receiptDigest",
  ], [], "$.executionReceipt");
  if (!digest.ok) return digest;
  if (!receipt.ok) return receipt;
  const receiptDigest = validateClaimedDigest(receipt.value.receiptDigest, "$.executionReceipt.receiptDigest", "trade_query_execution_receipt");
  if (!receiptDigest.ok || receipt.value.resultDigest !== digest.value) {
    return { ok: false, error: { code: "ti_v3_analytics_contract_digest_mismatch", path: "$.executionReceipt" } };
  }
  return { ok: true, value: input as TradeQueryResult };
}
