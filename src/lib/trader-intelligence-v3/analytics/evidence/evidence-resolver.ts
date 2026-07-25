import {
  getAnalysisRunContextDependencies,
  verifyAnalysisRunContext,
  verifyAnalyticalEvidenceBundle,
  type AnalysisRunContext,
  type AnalyticalEvidenceBundle,
} from "../contracts";
import type { AnalyticalRow } from "../dataset";
import type { ExcludedAnalyticalCandidate } from "../dataset";

export interface ResolvedAnalyticalEvidence {
  readonly evidence: AnalyticalEvidenceBundle;
  readonly includedRows: readonly AnalyticalRow[];
  readonly excludedCandidates: readonly ExcludedAnalyticalCandidate[];
  readonly roundTripKeys: readonly string[];
  readonly occurrenceKeys: readonly string[];
  readonly simulationCandidateKeys: readonly string[];
}

export interface EvidenceResolutionFailure {
  readonly code: string;
  readonly path: string;
}

function fail(code: string, path: string): { readonly ok: false; readonly error: EvidenceResolutionFailure } {
  return { ok: false, error: { code, path } };
}

/** Resolves evidence against the verified B1 dataset/partition, never IDs alone. */
export function resolveAnalyticalEvidenceBundle(
  bundle: unknown,
  runContext: AnalysisRunContext,
): { readonly ok: true; readonly value: ResolvedAnalyticalEvidence } | { readonly ok: false; readonly error: EvidenceResolutionFailure } {
  const context = verifyAnalysisRunContext(runContext);
  if (!context.ok) return fail("ti_v3_evidence_run_context_invalid", "$.runContext");
  const dependencies = getAnalysisRunContextDependencies(context.value);
  if (dependencies === null) return fail("ti_v3_evidence_authority_unavailable", "$.runContext");
  const verified = verifyAnalyticalEvidenceBundle(bundle, context.value);
  if (!verified.ok) return fail("ti_v3_evidence_bundle_invalid", `$.bundle${verified.error.path.slice(1)}`);
  const candidateKeys = verified.value.candidateKeys;
  if (new Set(candidateKeys).size !== candidateKeys.length) return fail("ti_v3_evidence_duplicate_candidate", "$.bundle.candidateKeys");
  if (verified.value.inclusionState === "included" && verified.value.populationState === "empty_included" && candidateKeys.length !== 0) return fail("ti_v3_evidence_empty_population_not_empty", "$.bundle.candidateKeys");
  const includedRows = verified.value.inclusionState === "included"
    ? candidateKeys.map((key) => dependencies.datasetReceipt.rows.find((row) => row.semanticRoundTripKey === key))
    : [];
  const excludedCandidates = verified.value.inclusionState === "excluded"
    ? candidateKeys.map((key) => dependencies.datasetReceipt.excludedCandidates.find((candidate) => candidate.candidateKey === key))
    : [];
  if (includedRows.some((row) => row === undefined)) return fail("ti_v3_evidence_included_candidate_missing", "$.bundle.candidateKeys");
  if (excludedCandidates.some((candidate) => candidate === undefined)) return fail("ti_v3_evidence_excluded_candidate_missing", "$.bundle.candidateKeys");
  if (verified.value.inclusionState === "included" && candidateKeys.some((key) => dependencies.partitionReceipt.excludedCandidateKeys.includes(key))) return fail("ti_v3_evidence_included_candidate_excluded", "$.bundle.candidateKeys");
  if (verified.value.inclusionState === "excluded" && candidateKeys.some((key) => dependencies.partitionReceipt.includedRowKeys.includes(key))) return fail("ti_v3_evidence_excluded_candidate_included", "$.bundle.candidateKeys");
  const simulationCandidateKeys = verified.value.simulationAuthority === undefined
    ? []
    : [...verified.value.simulationAuthority.actualCandidateKeys];
  if (simulationCandidateKeys.some((key) => !candidateKeys.includes(key))) return fail("ti_v3_evidence_simulation_candidate_foreign", "$.bundle.simulationAuthority");
  return {
    ok: true,
    value: Object.freeze({
      evidence: verified.value,
      includedRows: Object.freeze(includedRows as AnalyticalRow[]),
      excludedCandidates: Object.freeze(excludedCandidates as ExcludedAnalyticalCandidate[]),
      roundTripKeys: verified.value.roundTripKeys,
      occurrenceKeys: verified.value.occurrenceKeys,
      simulationCandidateKeys: Object.freeze(simulationCandidateKeys),
    }),
  };
}
