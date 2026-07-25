import { serializeCanonicalValue } from "../../../domain/canonical";
import type { ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalPartitionReceipt } from "../../dataset";
import type { TradeQueryResult } from "../contracts/query-result";
import { executeTradeQuery } from "../execution/query-executor";
import type { VerifiedTradeQueryDatasetSource } from "../gateway/read-only-query-gateway";

export const PERSISTED_TRADE_QUERY_VERSION = "ti_v3_persisted_trade_query_v1" as const;

export interface PersistedTradeQueryEnvelope {
  readonly schemaVersion: typeof PERSISTED_TRADE_QUERY_VERSION;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly queryPlan: TradeQueryResult["normalizedQueryPlan"];
  readonly result: TradeQueryResult;
  readonly envelopeDigest: string;
}

export function buildPersistedTradeQueryEnvelope(
  result: TradeQueryResult,
  partitionReceipt: AnalyticalPartitionReceipt,
): PersistedTradeQueryEnvelope {
  const built = finalizeContentAddressedAuthority("persisted_trade_query", {
    schemaVersion: PERSISTED_TRADE_QUERY_VERSION,
    partitionReceipt,
    queryPlan: result.normalizedQueryPlan,
    result,
  }, "envelopeDigest");
  if (!built.ok) throw new Error(`${built.error.code}:${built.error.path}`);
  return built.value as PersistedTradeQueryEnvelope;
}

export function rehydratePersistedTradeQuery(
  input: unknown,
  source: VerifiedTradeQueryDatasetSource,
): ExactResult<TradeQueryResult, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "partitionReceipt", "queryPlan", "result", "envelopeDigest",
  ], [], "$");
  if (!record.ok || record.value.schemaVersion !== PERSISTED_TRADE_QUERY_VERSION) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion")
      : record;
  }
  const suppliedDigest = validateClaimedDigest(
    record.value.envelopeDigest,
    "$.envelopeDigest",
    "persisted_trade_query",
  );
  if (!suppliedDigest.ok) return suppliedDigest;
  const rebuiltEnvelope = finalizeContentAddressedAuthority("persisted_trade_query", {
    schemaVersion: PERSISTED_TRADE_QUERY_VERSION,
    partitionReceipt: record.value.partitionReceipt,
    queryPlan: record.value.queryPlan,
    result: record.value.result,
  }, "envelopeDigest");
  if (!rebuiltEnvelope.ok || rebuiltEnvelope.value.envelopeDigest !== suppliedDigest.value) {
    return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.envelopeDigest");
  }
  const replayed = executeTradeQuery({
    source,
    partitionReceipt: record.value.partitionReceipt as AnalyticalPartitionReceipt,
    queryPlan: record.value.queryPlan,
  });
  if (!replayed.ok) return replayed;
  const supplied = serializeCanonicalValue(record.value.result);
  const actual = serializeCanonicalValue(replayed.value);
  if (!supplied.ok || !actual.ok || supplied.value.json !== actual.value.json) {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.result");
  }
  return replayed;
}
