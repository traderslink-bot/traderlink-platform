import { compareUnicodeCodePoints } from "../../../domain/canonical";
import type { CanonicalContentDigest } from "../../../domain/identity";
import {
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
} from "../../contracts";
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
