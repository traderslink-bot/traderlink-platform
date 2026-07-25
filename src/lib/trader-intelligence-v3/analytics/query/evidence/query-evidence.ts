import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateCanonicalCount,
  validateClaimedDigest,
  validateContractRecord,
  validateReasonCodes,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalRow } from "../../dataset";
import type { QueryRowSemantics } from "../execution/row-semantics";
import type { TradeQueryPlan } from "../contracts/query-plan";

export const TRADE_QUERY_EVIDENCE_VERSION = "ti_v3_trade_query_evidence_v1" as const;

export interface TradeQueryEvidenceCandidate {
  readonly semanticRoundTripKey: string;
  readonly rowDigest: CanonicalContentDigest;
  readonly executionDigests: readonly CanonicalContentDigest[];
  readonly occurrenceKeys: readonly string[];
  readonly role: "supporting" | "counterexample";
}

export interface TradeQueryEvidence {
  readonly schemaVersion: typeof TRADE_QUERY_EVIDENCE_VERSION;
  readonly queryPlanDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly canonicalFilterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly groupIdentity: string;
  readonly populationCount: string;
  readonly populationIdentityDigest: CanonicalContentDigest;
  readonly candidates: readonly TradeQueryEvidenceCandidate[];
  readonly limitationCodes: readonly string[];
  readonly evidenceDigest: CanonicalContentDigest;
}

function populationIdentity(rows: readonly QueryRowSemantics[]): CanonicalContentDigest {
  const result = finalizeContentAddressedAuthority("canonical_content", {
    policyKey: "ti_v3_query_group_population_identity",
    policyVersion: "v1",
    rowDigests: rows.map((item) => item.row.rowDigest).sort(compareUnicodeCodePoints),
  }, "digest");
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value.digest;
}

export function buildTradeQueryEvidence(
  plan: TradeQueryPlan,
  groupIdentity: string,
  rows: readonly QueryRowSemantics[],
  maximumCandidates: string,
): { readonly ok: true; readonly value: TradeQueryEvidence } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const ordered = [...rows].sort((left, right) =>
    compareUnicodeCodePoints(left.row.semanticRoundTripKey, right.row.semanticRoundTripKey));
  const gains = ordered.filter((item) => item.outcome === "gain");
  const losses = ordered.filter((item) => item.outcome === "loss");
  const supportingPool = gains.length >= losses.length ? gains : losses;
  const counterexamplePool = gains.length >= losses.length ? losses : gains;
  const selected: Array<Readonly<{ item: QueryRowSemantics; role: "supporting" | "counterexample" }>> = [];
  const maximum = BigInt(maximumCandidates);
  if (counterexamplePool.length > 0 && maximum > BigInt("0")) {
    selected.push({ item: counterexamplePool[0], role: "counterexample" });
  }
  for (const item of supportingPool) {
    if (BigInt(selected.length) >= maximum) break;
    selected.push({ item, role: "supporting" });
  }
  selected.sort((left, right) =>
    compareUnicodeCodePoints(left.item.row.semanticRoundTripKey, right.item.row.semanticRoundTripKey));
  return finalizeContentAddressedAuthority("trade_query_evidence", {
    schemaVersion: TRADE_QUERY_EVIDENCE_VERSION,
    queryPlanDigest: plan.queryPlanDigest,
    snapshotDigest: plan.authority.snapshotDigest,
    canonicalFilterDigest: plan.authority.canonicalFilterDigest,
    datasetReceiptDigest: plan.authority.datasetReceiptDigest,
    partitionDigest: plan.authority.partitionDigest,
    groupIdentity,
    populationCount: String(rows.length),
    populationIdentityDigest: populationIdentity(rows),
    candidates: selected.map(({ item, role }) => Object.freeze({
      semanticRoundTripKey: item.row.semanticRoundTripKey,
      rowDigest: item.row.rowDigest,
      executionDigests: item.row.supportingExecutionDigests,
      occurrenceKeys: item.row.supportingOccurrenceKeys,
      role,
    })),
    limitationCodes: [...new Set(rows.flatMap((item) => item.row.limitationCodes))]
      .sort(compareUnicodeCodePoints),
  }, "evidenceDigest") as { readonly ok: true; readonly value: TradeQueryEvidence } | {
    readonly ok: false; readonly error: AnalyticalContractFailure;
  };
}

export function verifyTradeQueryEvidence(
  input: unknown,
  plan: TradeQueryPlan,
): { readonly ok: true; readonly value: TradeQueryEvidence } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const record = validateContractRecord(input, [
    "schemaVersion", "queryPlanDigest", "snapshotDigest",
    "canonicalFilterDigest", "datasetReceiptDigest", "partitionDigest",
    "groupIdentity", "populationCount", "populationIdentityDigest",
    "candidates", "limitationCodes", "evidenceDigest",
  ]);
  if (!record.ok || record.value.schemaVersion !== TRADE_QUERY_EVIDENCE_VERSION) {
    return record.ok
      ? contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion")
      : record;
  }
  if (
    record.value.queryPlanDigest !== plan.queryPlanDigest ||
    record.value.snapshotDigest !== plan.authority.snapshotDigest ||
    record.value.canonicalFilterDigest !== plan.authority.canonicalFilterDigest ||
    record.value.datasetReceiptDigest !== plan.authority.datasetReceiptDigest ||
    record.value.partitionDigest !== plan.authority.partitionDigest ||
    typeof record.value.groupIdentity !== "string"
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.authority");
  const populationCount = validateCanonicalCount(record.value.populationCount, "$.populationCount");
  const populationDigest = validateClaimedDigest(
    record.value.populationIdentityDigest,
    "$.populationIdentityDigest",
    "canonical_content",
  );
  const evidenceDigest = validateClaimedDigest(
    record.value.evidenceDigest,
    "$.evidenceDigest",
    "trade_query_evidence",
  );
  const limitations = validateReasonCodes(record.value.limitationCodes, "$.limitationCodes");
  if (!populationCount.ok) return populationCount;
  if (!populationDigest.ok) return populationDigest;
  if (!evidenceDigest.ok) return evidenceDigest;
  if (!limitations.ok) return limitations;
  if (!Array.isArray(record.value.candidates) || record.value.candidates.length > 16) {
    return contractFailure("ti_v3_analytics_contract_oversized", "$.candidates");
  }
  const candidates: TradeQueryEvidenceCandidate[] = [];
  for (let index = 0; index < record.value.candidates.length; index += 1) {
    const path = `$.candidates[${index}]`;
    const candidate = validateContractRecord(record.value.candidates[index], [
      "semanticRoundTripKey", "rowDigest", "executionDigests", "occurrenceKeys", "role",
    ], [], path);
    if (!candidate.ok || typeof candidate.value.semanticRoundTripKey !== "string" ||
      (candidate.value.role !== "supporting" && candidate.value.role !== "counterexample") ||
      !Array.isArray(candidate.value.executionDigests) ||
      !Array.isArray(candidate.value.occurrenceKeys) ||
      candidate.value.executionDigests.length !== candidate.value.occurrenceKeys.length) {
      return candidate.ok
        ? contractFailure("ti_v3_analytics_contract_invalid", path)
        : candidate;
    }
    const rowDigest = validateClaimedDigest(candidate.value.rowDigest, `${path}.rowDigest`, "analytical_row");
    if (!rowDigest.ok) return rowDigest;
    candidates.push(candidate.value as unknown as TradeQueryEvidenceCandidate);
  }
  if (new Set(candidates.map((candidate) => candidate.semanticRoundTripKey)).size !== candidates.length) {
    return contractFailure("ti_v3_analytics_contract_duplicate_identity", "$.candidates");
  }
  const rebuilt = finalizeContentAddressedAuthority("trade_query_evidence", {
    schemaVersion: TRADE_QUERY_EVIDENCE_VERSION,
    queryPlanDigest: plan.queryPlanDigest,
    snapshotDigest: plan.authority.snapshotDigest,
    canonicalFilterDigest: plan.authority.canonicalFilterDigest,
    datasetReceiptDigest: plan.authority.datasetReceiptDigest,
    partitionDigest: plan.authority.partitionDigest,
    groupIdentity: record.value.groupIdentity,
    populationCount: populationCount.value,
    populationIdentityDigest: populationDigest.value,
    candidates,
    limitationCodes: limitations.value,
  }, "evidenceDigest");
  return rebuilt.ok && rebuilt.value.evidenceDigest === evidenceDigest.value
    ? { ok: true, value: rebuilt.value as TradeQueryEvidence }
    : contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.evidenceDigest");
}

export function resolveTradeQueryEvidence(
  input: unknown,
  plan: TradeQueryPlan,
  rows: readonly AnalyticalRow[],
): { readonly ok: true; readonly value: readonly AnalyticalRow[] } | {
  readonly ok: false; readonly error: AnalyticalContractFailure;
} {
  const evidence = verifyTradeQueryEvidence(input, plan);
  if (!evidence.ok) return evidence;
  const byKey = new Map(rows.map((row) => [row.semanticRoundTripKey, row]));
  const resolved: AnalyticalRow[] = [];
  for (const candidate of evidence.value.candidates) {
    const row = byKey.get(candidate.semanticRoundTripKey);
    if (
      row === undefined ||
      row.rowDigest !== candidate.rowDigest ||
      JSON.stringify(row.supportingExecutionDigests) !== JSON.stringify(candidate.executionDigests) ||
      JSON.stringify(row.supportingOccurrenceKeys) !== JSON.stringify(candidate.occurrenceKeys)
    ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.candidates");
    resolved.push(row);
  }
  return { ok: true, value: Object.freeze(resolved) };
}
