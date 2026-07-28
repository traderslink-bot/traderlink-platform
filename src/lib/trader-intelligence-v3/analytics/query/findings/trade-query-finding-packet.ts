import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateContractKey,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import {
  verifyTradeQueryResultShape,
  type TradeQueryResultRow,
} from "../contracts/query-result";
import type { TradeQueryAuthority } from "../contracts/query-plan";

export const TRADE_QUERY_FINDING_PACKET_VERSION = "ti_v3_trade_query_finding_packet_v1" as const;

export type TradeQueryFindingDimension =
  | "overall" | "source" | "symbol" | "direction" | "time" | "price" | "size" | "sequence" | "fees";

export interface TradeQueryFindingPacketRequest {
  readonly result: unknown;
  readonly authority: TradeQueryAuthority;
  readonly dimension: TradeQueryFindingDimension;
  /** Minimum closed trades before a row can be called a sample-backed finding. */
  readonly minimumSample: string;
}

export interface TradeQueryFinding {
  readonly findingKey: string;
  readonly dimension: TradeQueryFindingDimension;
  readonly groupIdentity: string;
  readonly groupLabel: string;
  readonly sampleState: "sufficient" | "insufficient" | "metric_unavailable";
  readonly includedCount: string;
  readonly netPnl: string | null;
  readonly evidenceDigest: CanonicalContentDigest;
  readonly limitationCodes: readonly string[];
  /** A deterministic review prompt; it is explicitly not a causal conclusion. */
  readonly ruleToTest: string | null;
}

export interface TradeQueryFindingPacket {
  readonly schemaVersion: typeof TRADE_QUERY_FINDING_PACKET_VERSION;
  readonly queryResultDigest: CanonicalContentDigest;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly dimension: TradeQueryFindingDimension;
  readonly minimumSample: string;
  readonly findings: readonly TradeQueryFinding[];
  readonly evidenceDigests: readonly CanonicalContentDigest[];
  readonly limitationCodes: readonly string[];
  readonly packetDigest: CanonicalContentDigest;
}

function reviewRule(dimension: TradeQueryFindingDimension): string | null {
  switch (dimension) {
    case "source": return "review_source_or_import_boundary";
    case "symbol": return "review_symbol_specific_execution_process";
    case "direction": return "review_direction_specific_execution_process";
    case "time": return "review_time_window_execution_process";
    case "price": return "review_entry_price_range_execution_process";
    case "size": return "review_position_size_execution_process";
    case "sequence": return "review_trade_sequence_execution_process";
    case "fees": return "review_fee_or_commission_structure";
    default: return null;
  }
}

function netPnl(row: TradeQueryResultRow): string | null {
  const metric = row.metrics.find((item) => item.metricKey === "net_pnl");
  return metric?.kind === "exact_decimal" ? metric.value : null;
}

function findingKey(dimension: TradeQueryFindingDimension, groupIdentity: string): string {
  const result = validateContractKey(`finding_${dimension}_${groupIdentity}`, "$.findingKey", 512);
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

/**
 * Produces a signed, bounded review packet from an already verified query
 * result. It intentionally reports a rule to test, never a causal claim.
 */
export function buildTradeQueryFindingPacket(
  request: TradeQueryFindingPacketRequest,
): { readonly ok: true; readonly value: TradeQueryFindingPacket } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const verified = verifyTradeQueryResultShape(request.result, request.authority);
  if (!verified.ok) return verified;
  const minimumSample = validateCanonicalCount(request.minimumSample, "$.minimumSample");
  if (!minimumSample.ok || BigInt(minimumSample.value) === BigInt("0")) {
    return minimumSample.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.minimumSample")
      : minimumSample;
  }
  const result = verified.value;
  const ruleToTest = reviewRule(request.dimension);
  const findings = result.rows.map((row) => {
    const value = netPnl(row);
    const sampleState: TradeQueryFinding["sampleState"] = value === null
      ? "metric_unavailable"
      : BigInt(row.includedCount) >= BigInt(minimumSample.value)
        ? "sufficient"
        : "insufficient";
    return Object.freeze({
      findingKey: findingKey(request.dimension, row.groupIdentity),
      dimension: request.dimension,
      groupIdentity: row.groupIdentity,
      groupLabel: row.groupLabel,
      sampleState,
      includedCount: row.includedCount,
      netPnl: value,
      evidenceDigest: row.evidenceDigest,
      limitationCodes: row.limitationCodes,
      ruleToTest: sampleState === "sufficient" ? ruleToTest : null,
    });
  }).sort((left, right) => compareUnicodeCodePoints(left.groupIdentity, right.groupIdentity));
  const limitations = [...new Set([
    ...result.limitationCodes,
    ...findings.flatMap((finding) => finding.limitationCodes),
    ...findings.filter((finding) => finding.sampleState === "insufficient")
      .map(() => "ti_v3_query_finding_sample_insufficient"),
    ...findings.filter((finding) => finding.sampleState === "metric_unavailable")
      .map(() => "ti_v3_query_finding_net_pnl_unavailable"),
  ])].sort(compareUnicodeCodePoints);
  return finalizeContentAddressedAuthority("trade_query_finding_packet", {
    schemaVersion: TRADE_QUERY_FINDING_PACKET_VERSION,
    queryResultDigest: result.resultDigest,
    queryPlanDigest: result.normalizedQueryPlan.queryPlanDigest,
    dimension: request.dimension,
    minimumSample: minimumSample.value,
    findings: Object.freeze(findings),
    evidenceDigests: Object.freeze([...new Set(findings.map((finding) => finding.evidenceDigest))]
      .sort(compareUnicodeCodePoints)),
    limitationCodes: Object.freeze(limitations),
  }, "packetDigest") as { readonly ok: true; readonly value: TradeQueryFindingPacket } | {
    readonly ok: false; readonly error: AnalyticalContractFailure;
  };
}

/** Rebuilds the packet from the verified query result; supplied findings are never trusted. */
export function verifyTradeQueryFindingPacket(
  input: unknown,
  result: unknown,
  authority: TradeQueryAuthority,
): { readonly ok: true; readonly value: TradeQueryFindingPacket } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "queryResultDigest", "queryPlanDigest", "dimension", "minimumSample",
    "findings", "evidenceDigests", "limitationCodes", "packetDigest",
  ]);
  if (!record.ok || record.value.schemaVersion !== TRADE_QUERY_FINDING_PACKET_VERSION) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion")
      : record;
  }
  if (
    typeof record.value.dimension !== "string" ||
    !["overall", "source", "symbol", "direction", "time", "price", "size", "sequence", "fees"].includes(record.value.dimension)
  ) return contractFailure("ti_v3_analytics_contract_invalid", "$.dimension");
  if (typeof record.value.packetDigest !== "string" ||
    !/^ti_v3:trade_query_finding_packet:v1:sha256:[a-f0-9]{64}$/.test(record.value.packetDigest)) {
    return contractFailure("ti_v3_validation_digest_invalid", "$.packetDigest");
  }
  const rebuilt = buildTradeQueryFindingPacket({
    result,
    authority,
    dimension: record.value.dimension as TradeQueryFindingDimension,
    minimumSample: record.value.minimumSample as string,
  });
  if (!rebuilt.ok) return rebuilt;
  return rebuilt.value.packetDigest === record.value.packetDigest &&
    JSON.stringify(record.value) === JSON.stringify(rebuilt.value)
    ? rebuilt
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.packetDigest");
}
