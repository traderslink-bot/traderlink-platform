import { compareUnicodeCodePoints, serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractRecord,
  validateReasonCodes,
  verifyExactMetricValue,
  type AnalyticalContractFailure,
  type ExactMetricValue,
} from "../../contracts";
import {
  verifyTradeQueryEvidence,
  type TradeQueryEvidence,
} from "../evidence/query-evidence";
import {
  verifyTradeQueryPlan,
  type TradeQueryAuthority,
  type TradeQueryPlan,
} from "./query-plan";
import { TRADE_QUERY_LIMITS } from "./query-plan";
import { getTradeQueryMetricDeclaration } from "../metrics/metric-registry";

export const TRADE_QUERY_RESULT_VERSION = "ti_v3_trade_query_result_v1" as const;
export const TRADE_QUERY_EXECUTION_RECEIPT_VERSION = "ti_v3_trade_query_execution_receipt_v1" as const;

export interface TradeQueryResultRow {
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly canonicalOrder: string;
  readonly candidateCount: string;
  readonly includedCount: string;
  readonly excludedCount: string;
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
  authority: TradeQueryAuthority,
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
  const plan = verifyTradeQueryPlan(record.value.normalizedQueryPlan, authority);
  if (!plan.ok) return plan;
  const runContext = validateContractRecord(record.value.runContext, [
    "executorKey", "executorVersion", "gatewayKey", "gatewayVersion",
  ], [], "$.runContext");
  if (
    !runContext.ok ||
    runContext.value.executorKey !== "ti_v3_generic_trade_query_executor" ||
    runContext.value.executorVersion !== "v1" ||
    runContext.value.gatewayKey !== "ti_v3_read_only_trade_query_gateway" ||
    runContext.value.gatewayVersion !== "v1"
  ) {
    return runContext.ok
      ? { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.runContext" } }
      : runContext;
  }
  const candidateCount = validateCanonicalCount(record.value.candidateCount, "$.candidateCount");
  const includedCount = validateCanonicalCount(record.value.includedCount, "$.includedCount");
  const excludedCount = validateCanonicalCount(record.value.excludedCount, "$.excludedCount");
  if (!candidateCount.ok) return candidateCount;
  if (!includedCount.ok) return includedCount;
  if (!excludedCount.ok) return excludedCount;
  if (
    BigInt(candidateCount.value) !==
    BigInt(includedCount.value) + BigInt(excludedCount.value)
  ) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_count_mismatch", path: "$.counts" },
    };
  }
  if (!Array.isArray(record.value.evidence)) {
    return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.evidence" } };
  }
  const evidence: TradeQueryEvidence[] = [];
  for (let index = 0; index < record.value.evidence.length; index += 1) {
    const verified = verifyTradeQueryEvidence(record.value.evidence[index], plan.value);
    if (!verified.ok) return verified;
    evidence.push(verified.value);
  }
  if (!Array.isArray(record.value.rows)) {
    return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: "$.rows" } };
  }
  const rows: TradeQueryResultRow[] = [];
  for (let rowIndex = 0; rowIndex < record.value.rows.length; rowIndex += 1) {
    const path = `$.rows[${rowIndex}]`;
    const row = validateContractRecord(record.value.rows[rowIndex], [
      "groupIdentity", "groupLabel", "canonicalOrder", "candidateCount",
      "includedCount", "excludedCount", "metrics", "evidenceDigest",
      "limitationCodes",
    ], [], path);
    if (
      !row.ok ||
      typeof row.value.groupIdentity !== "string" ||
      typeof row.value.groupLabel !== "string" ||
      typeof row.value.canonicalOrder !== "string" ||
      !Array.isArray(row.value.metrics)
    ) {
      return { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path: `$.rows[${rowIndex}].metrics` } };
    }
    const candidateCount = validateCanonicalCount(row.value.candidateCount, `${path}.candidateCount`);
    const includedCount = validateCanonicalCount(row.value.includedCount, `${path}.includedCount`);
    const excludedCount = validateCanonicalCount(row.value.excludedCount, `${path}.excludedCount`);
    const evidenceDigest = validateClaimedDigest(
      row.value.evidenceDigest,
      `${path}.evidenceDigest`,
      "trade_query_evidence",
    );
    const limitations = validateReasonCodes(row.value.limitationCodes, `${path}.limitationCodes`);
    if (!candidateCount.ok) return candidateCount;
    if (!includedCount.ok) return includedCount;
    if (!excludedCount.ok) return excludedCount;
    if (!evidenceDigest.ok) return evidenceDigest;
    if (!limitations.ok) return limitations;
    if (
      BigInt(candidateCount.value) !==
      BigInt(includedCount.value) + BigInt(excludedCount.value)
    ) {
      return {
        ok: false,
        error: { code: "ti_v3_analytics_contract_count_mismatch", path },
      };
    }
    const verifiedMetrics: ExactMetricValue[] = [];
    if (row.value.metrics.length !== plan.value.metrics.length) {
      return {
        ok: false,
        error: { code: "ti_v3_analytics_contract_reference_mismatch", path: `${path}.metrics` },
      };
    }
    for (let metricIndex = 0; metricIndex < row.value.metrics.length; metricIndex += 1) {
      const metric = verifyExactMetricValue(row.value.metrics[metricIndex]);
      if (!metric.ok) return metric;
      const expectedKey = plan.value.metrics[metricIndex];
      const declaration = getTradeQueryMetricDeclaration(expectedKey);
      const expectedCurrency = declaration.currencyBehavior === "selected_partition"
        ? plan.value.authority.currency
        : null;
      if (
        metric.value.metricKey !== expectedKey ||
        metric.value.unit !== declaration.unit ||
        metric.value.currency !== expectedCurrency
      ) {
        return {
          ok: false,
          error: { code: "ti_v3_analytics_contract_reference_mismatch", path: `${path}.metrics[${metricIndex}]` },
        };
      }
      verifiedMetrics.push(metric.value);
    }
    const countMetric = (key: string) => verifiedMetrics.find((metric) =>
      metric.metricKey === key);
    for (const [key, expected] of [
      ["candidate_count", candidateCount.value],
      ["included_count", includedCount.value],
      ["excluded_count", excludedCount.value],
    ] as const) {
      const metric = countMetric(key);
      if (
        metric !== undefined &&
        (metric.kind !== "integer" || metric.value !== expected)
      ) {
        return {
          ok: false,
          error: { code: "ti_v3_analytics_contract_count_mismatch", path: `${path}.metrics` },
        };
      }
    }
    const rowEvidence = evidence.find((item) =>
      item.evidenceDigest === evidenceDigest.value);
    if (
      rowEvidence === undefined ||
      rowEvidence.groupIdentity !== row.value.groupIdentity ||
      rowEvidence.populationCount !== includedCount.value
    ) {
      return {
        ok: false,
        error: { code: "ti_v3_analytics_contract_reference_mismatch", path: `${path}.evidenceDigest` },
      };
    }
    rows.push(Object.freeze({
      groupIdentity: row.value.groupIdentity,
      groupLabel: row.value.groupLabel,
      canonicalOrder: row.value.canonicalOrder,
      candidateCount: candidateCount.value,
      includedCount: includedCount.value,
      excludedCount: excludedCount.value,
      metrics: Object.freeze(verifiedMetrics),
      evidenceDigest: evidenceDigest.value,
      limitationCodes: limitations.value,
    }));
  }
  if (new Set(rows.map((row) => row.groupIdentity)).size !== rows.length) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_duplicate_identity", path: "$.rows" },
    };
  }
  if (
    evidence.length !== rows.length ||
    new Set(evidence.map((item) => item.evidenceDigest)).size !== evidence.length
  ) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_reference_mismatch", path: "$.evidence" },
    };
  }
  if (plan.value.grouping.kind === "aggregate") {
    if (
      rows.length !== 1 ||
      rows[0].candidateCount !== candidateCount.value ||
      rows[0].includedCount !== includedCount.value ||
      rows[0].excludedCount !== excludedCount.value
    ) {
      return {
        ok: false,
        error: { code: "ti_v3_analytics_contract_count_mismatch", path: "$.rows[0]" },
      };
    }
  }
  if (
    !Array.isArray(record.value.excludedCandidateKeys) ||
    BigInt(record.value.excludedCandidateKeys.length) >
      BigInt(plan.value.limits.totalEvidenceLimit) ||
    record.value.excludedCandidateKeys.some((key) => typeof key !== "string") ||
    new Set(record.value.excludedCandidateKeys).size !==
      record.value.excludedCandidateKeys.length
  ) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_invalid", path: "$.excludedCandidateKeys" },
    };
  }
  const resultLimitations = validateReasonCodes(
    record.value.limitationCodes,
    "$.limitationCodes",
  );
  if (!resultLimitations.ok) return resultLimitations;
  if (
    !Array.isArray(record.value.diagnostics) ||
    BigInt(record.value.diagnostics.length) >
      BigInt(plan.value.limits.diagnosticLimit)
  ) {
    return {
      ok: false,
      error: { code: "ti_v3_analytics_contract_oversized", path: "$.diagnostics" },
    };
  }
  const diagnostics: Array<Readonly<{
    readonly code: string;
    readonly affectedKeys: readonly string[];
  }>> = [];
  for (let index = 0; index < record.value.diagnostics.length; index += 1) {
    const path = `$.diagnostics[${index}]`;
    const diagnostic = validateContractRecord(
      record.value.diagnostics[index],
      ["code", "affectedKeys"],
      [],
      path,
    );
    if (
      !diagnostic.ok ||
      typeof diagnostic.value.code !== "string" ||
      !Array.isArray(diagnostic.value.affectedKeys) ||
      diagnostic.value.affectedKeys.some((key) => typeof key !== "string")
    ) {
      return diagnostic.ok
        ? { ok: false, error: { code: "ti_v3_analytics_contract_invalid", path } }
        : diagnostic;
    }
    diagnostics.push(Object.freeze({
      code: diagnostic.value.code,
      affectedKeys: Object.freeze(
        [...diagnostic.value.affectedKeys as string[]]
          .sort(compareUnicodeCodePoints),
      ),
    }));
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
  const rebuilt = buildTradeQueryResult({
    schemaVersion: TRADE_QUERY_RESULT_VERSION,
    runContext: Object.freeze({
      executorKey: "ti_v3_generic_trade_query_executor",
      executorVersion: "v1",
      gatewayKey: "ti_v3_read_only_trade_query_gateway",
      gatewayVersion: "v1",
    }),
    normalizedQueryPlan: plan.value,
    rows: Object.freeze(rows),
    candidateCount: candidateCount.value,
    includedCount: includedCount.value,
    excludedCount: excludedCount.value,
    evidence: Object.freeze(evidence),
    excludedCandidateKeys: Object.freeze(
      [...record.value.excludedCandidateKeys as string[]]
        .sort(compareUnicodeCodePoints),
    ),
    limitationCodes: resultLimitations.value,
    diagnostics: Object.freeze(diagnostics),
  });
  if (
    !rebuilt.ok ||
    rebuilt.value.resultDigest !== digest.value ||
    rebuilt.value.executionReceipt.receiptDigest !== receiptDigest.value
  ) return { ok: false, error: { code: "ti_v3_analytics_contract_digest_mismatch", path: "$.resultDigest" } };
  return rebuilt;
}
