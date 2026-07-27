import { serializeCanonicalValue } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import { contractFailure, finalizeContentAddressedAuthority, validateCanonicalCount, validateContractRecord, type AnalyticalContractFailure } from "../../contracts";
import { TRADE_QUERY_LIMITS, type TradeQueryResult, type TradeQueryResultRow } from "../contracts";
import type { TradeQueryEvidence } from "../evidence/query-evidence";
import { isVerifiedTradeQueryExecution } from "../execution/verified-execution";

export const TRADE_QUERY_PAGE_VERSION = "ti_v3_trade_query_page_v1" as const;
export const TRADE_QUERY_CONTINUATION_VERSION = "ti_v3_trade_query_continuation_v1" as const;

export interface TradeQueryContinuation {
  readonly schemaVersion: typeof TRADE_QUERY_CONTINUATION_VERSION;
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly pageSize: string;
  readonly nextOffset: string;
  readonly continuationDigest: CanonicalContentDigest;
}

export interface TradeQueryPage {
  readonly schemaVersion: typeof TRADE_QUERY_PAGE_VERSION;
  readonly sourceResultDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly pageSize: string;
  readonly offset: string;
  readonly totalRowCount: string;
  readonly omittedCount: string;
  readonly sourceResultWasBounded: boolean;
  readonly rows: readonly TradeQueryResultRow[];
  readonly evidence: readonly TradeQueryEvidence[];
  readonly continuation: TradeQueryContinuation | null;
  readonly pageDigest: CanonicalContentDigest;
}

function buildContinuation(source: TradeQueryResult, pageSize: string, nextOffset: string) {
  return finalizeContentAddressedAuthority("trade_query_continuation", {
    schemaVersion: TRADE_QUERY_CONTINUATION_VERSION,
    sourceResultDigest: source.resultDigest,
    queryPlanDigest: source.normalizedQueryPlan.queryPlanDigest,
    pageSize, nextOffset,
  }, "continuationDigest");
}

function readContinuation(input: unknown, source: TradeQueryResult, pageSize: string): { readonly ok: true; readonly value: string } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  const record = validateContractRecord(input, ["schemaVersion", "sourceResultDigest", "queryPlanDigest", "pageSize", "nextOffset", "continuationDigest"], [], "$.pagination.continuation");
  if (!record.ok || record.value.schemaVersion !== TRADE_QUERY_CONTINUATION_VERSION || record.value.sourceResultDigest !== source.resultDigest || record.value.queryPlanDigest !== source.normalizedQueryPlan.queryPlanDigest || record.value.pageSize !== pageSize) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.pagination.continuation");
  const offset = validateCanonicalCount(record.value.nextOffset, "$.pagination.continuation.nextOffset");
  if (!offset.ok || typeof record.value.continuationDigest !== "string") return offset.ok
    ? contractFailure("ti_v3_analytics_contract_invalid", "$.pagination.continuation.continuationDigest") : offset;
  const rebuilt = buildContinuation(source, pageSize, offset.value);
  return rebuilt.ok && rebuilt.value.continuationDigest === record.value.continuationDigest ? { ok: true, value: offset.value } : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.pagination.continuation.continuationDigest");
}

export function paginateTradeQueryResult(
  source: TradeQueryResult,
  input: Readonly<{ readonly pageSize: unknown; readonly continuation?: unknown }>,
): { readonly ok: true; readonly value: TradeQueryPage } | { readonly ok: false; readonly error: AnalyticalContractFailure } {
  if (!isVerifiedTradeQueryExecution(source)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.pagination.sourceResult");
  const pageSize = validateCanonicalCount(input.pageSize, "$.pagination.pageSize");
  if (!pageSize.ok || BigInt(pageSize.value) === BigInt("0") || BigInt(pageSize.value) > BigInt(source.normalizedQueryPlan.limits.resultRowLimit)) return contractFailure("ti_v3_analytics_contract_oversized", "$.pagination.pageSize");
  const offset = input.continuation === undefined ? { ok: true as const, value: "0" } : readContinuation(input.continuation, source, pageSize.value);
  if (!offset.ok) return offset;
  if (BigInt(offset.value) > BigInt(source.rows.length)) return contractFailure("ti_v3_analytics_contract_invalid", "$.pagination.continuation.nextOffset");
  const rows: TradeQueryResultRow[] = [];
  let sourceIndex = BigInt("0");
  for (const row of source.rows) {
    if (sourceIndex >= BigInt(offset.value) && BigInt(rows.length) < BigInt(pageSize.value)) rows.push(row);
    sourceIndex += BigInt("1");
    if (BigInt(rows.length) === BigInt(pageSize.value)) break;
  }
  const rowEvidence = new Set(rows.map((row) => row.evidenceDigest));
  const evidence = Object.freeze(source.evidence.filter((item) => rowEvidence.has(item.evidenceDigest)));
  const nextOffset = BigInt(offset.value) + BigInt(rows.length);
  const continuation = nextOffset < BigInt(source.rows.length) ? buildContinuation(source, pageSize.value, nextOffset.toString()) : null;
  if (continuation !== null && !continuation.ok) return continuation;
  const body = {
    schemaVersion: TRADE_QUERY_PAGE_VERSION,
    sourceResultDigest: source.resultDigest,
    queryPlanDigest: source.normalizedQueryPlan.queryPlanDigest,
    pageSize: pageSize.value, offset: offset.value, totalRowCount: String(source.rows.length),
    omittedCount: (BigInt(source.rows.length) - nextOffset).toString(),
    sourceResultWasBounded: source.limitationCodes.includes("ti_v3_query_result_rows_bounded"),
    rows: Object.freeze(rows), evidence,
    continuation: continuation?.value ?? null,
  };
  const serialized = serializeCanonicalValue(body);
  if (!serialized.ok || serialized.value.json.length > TRADE_QUERY_LIMITS.maximumResultCodeUnits) return contractFailure("ti_v3_analytics_contract_oversized", "$.pagination.page");
  return finalizeContentAddressedAuthority("trade_query_page", body, "pageDigest") as | { readonly ok: true; readonly value: TradeQueryPage } | { readonly ok: false; readonly error: AnalyticalContractFailure };
}
