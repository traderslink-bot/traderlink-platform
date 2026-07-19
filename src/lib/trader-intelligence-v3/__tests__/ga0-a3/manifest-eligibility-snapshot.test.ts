import { describe, expect, it } from "vitest";

import {
  assertEvidenceScope,
  assertSnapshotExecutionManifest,
  buildAnalysisSnapshot,
  buildCanonicalQueryFilter,
  buildDatasetManifest,
  buildEvidenceReference,
  calculateArtifactState,
  calculateManifestEligibility,
  createCanonicalContentIdentity,
  createEmptyEnrichmentSetDigest,
  equivalentPersistenceIdentityIsCurrent,
  verifyAnalysisSnapshot,
} from "../../domain";
import type { CanonicalContentDigest, CanonicalExecutionDigest, CanonicalSourceDocumentDigest } from "../../domain/identity";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";

const digest = (domain: string, value: string) => `ti_v3:${domain}:v1:sha256:${value.repeat(64)}` as CanonicalContentDigest;
const executionA = digest("canonical_execution", "1") as CanonicalExecutionDigest;
const executionB = digest("canonical_execution", "2") as CanonicalExecutionDigest;
const sourceA = digest("canonical_source_document", "a") as CanonicalSourceDocumentDigest;
const policy = digest("canonical_content", "b");
const analysisCutoffAt = "2026-07-17T20:00:00.000000000Z" as CanonicalUtcTimestamp;

function manifest(overrides: Partial<{ executions: readonly CanonicalExecutionDigest[]; gaps: readonly unknown[]; openPositions: readonly unknown[]; persistenceId: string }> = {}) {
  const built = buildDatasetManifest({
    canonicalOwnerKey: "owner_local",
    canonicalAccountKeys: ["account_primary"],
    sourceDocuments: [{ sourceDocumentDigest: sourceA, sourceKind: "broker_csv", statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }], deletionState: "present" }],
    acceptedExecutionDigests: overrides.executions ?? [executionA, executionB],
    correctionDigests: [],
    correctionCutoffAt: analysisCutoffAt,
    policies: [{ policyKey: "ti_v3_fifo_policy", policyVersion: "v1", policyDigest: policy }],
    statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }],
    knownGaps: overrides.gaps ?? [],
    overlappingPeriods: [], exclusions: [],
    priorInventory: [{ ledgerKey: "account_primary:aapl:usd", state: "proven_flat", contractDigest: null }],
    openPositions: overrides.openPositions ?? [], currencies: ["USD"], coverageStates: ["complete_account_period"],
    reconstructionStatus: overrides.gaps?.length ? "limited" : "exact",
    reconstructionReasonCodes: overrides.gaps?.length ? ["ti_v3_coverage_gap"] : [],
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

function filter() {
  const built = buildCanonicalQueryFilter({
    dateBasis: "execution_date", timeBasis: "utc", timezone: "UTC",
    requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-17", startBoundary: "inclusive", endBoundary: "inclusive", calendarBasis: "calendar_day", relativeDateAnchorAt: null,
    resolvedAbsoluteRange: { startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-17T20:00:00.000000000Z" },
    accountFilters: ["account_primary"], instrumentFilters: ["AAPL", "AAPL"], directionFilters: ["long"], sessionFilters: ["regular"], lifecycleFilters: ["position_closed"], setupFilter: null, outcomeFilters: ["gain", "loss"], currencyFilters: ["USD"], evidenceCapabilityFilters: ["closed_trade_analytics"], openPositionPolicy: "exclude_from_closed_trade_analytics", correctionCutoffAt: analysisCutoffAt, analysisCutoffAt, boundSnapshotDigest: null,
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

describe("GA0-A3 manifests and capability eligibility", () => {
  it("preserves identity across persistence-id and ordering changes while factual changes alter it", () => {
    const left = manifest({ executions: [executionA, executionB], persistenceId: "row_1" });
    const right = manifest({ executions: [executionB, executionA], persistenceId: "row_999" });
    expect(right.manifestDigest).toBe(left.manifestDigest);
    expect(equivalentPersistenceIdentityIsCurrent(left.manifestDigest, right.manifestDigest)).toBe(true);
    const gap = manifest({ gaps: [{ scopeKey: "account_primary", range: { startAt: "2026-07-04T00:00:00.000000000Z", endAt: "2026-07-05T00:00:00.000000000Z", startInclusive: true, endInclusive: false }, reasonCode: "ti_v3_source_period_missing" }] });
    expect(gap.manifestDigest).not.toBe(left.manifestDigest);
    expect(gap.content.coverageStates).toContain("coverage_gap_detected");
  });

  it("blocks only affected capabilities and excludes open positions from closed-trade authority", () => {
    const open = manifest({ openPositions: [{ ledgerKey: "account_primary:aapl:usd", executionDigests: [executionA] }] });
    const eligibility = calculateManifestEligibility({ manifest: open, analysisCutoffAt });
    expect(eligibility.ok).toBe(true);
    if (!eligibility.ok) return;
    expect(eligibility.value.results.find((result) => result.capability === "closed_trade_analytics")?.state).toBe("limited");
    expect(eligibility.value.results.find((result) => result.capability === "execution_review")?.state).toBe("eligible");
    expect(eligibility.value.results.find((result) => result.capability === "export")?.state).toBe("eligible");
  });
});

describe("GA0-A3 snapshot and evidence binding", () => {
  it("rejects mixed manifests and resolves semantic evidence after equivalent reimport", () => {
    const first = manifest();
    const equivalent = manifest({ executions: [executionB, executionA] });
    const eligibility = calculateManifestEligibility({ manifest: first, analysisCutoffAt });
    const canonicalFilter = filter();
    const enrichment = createEmptyEnrichmentSetDigest(first.manifestDigest, analysisCutoffAt);
    expect(eligibility.ok && enrichment.ok).toBe(true);
    if (!eligibility.ok || !enrichment.ok) return;
    const snapshot = buildAnalysisSnapshot({ manifest: first, eligibilitySet: eligibility.value, enrichmentSetDigest: enrichment.value, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local" });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    expect(assertSnapshotExecutionManifest(snapshot.value, digest("dataset_manifest", "9")).ok).toBe(false);
    const evidence = buildEvidenceReference({ manifestDigest: equivalent.manifestDigest, snapshotDigest: snapshot.value.snapshotDigest, subjectKind: "canonical_execution", semanticKey: "execution:aapl:20260717t143000z:buy:100", correctionDigest: null, policyDigest: null, filterDigest: canonicalFilter.filterDigest, analysisCutoffAt });
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) return;
    expect(assertEvidenceScope(evidence.value, { manifestDigest: first.manifestDigest, snapshotDigest: snapshot.value.snapshotDigest }).ok).toBe(true);
    expect(verifyAnalysisSnapshot({ ...snapshot.value, manifestDigest: digest("dataset_manifest", "8") }, { manifest: first, eligibilitySet: eligibility.value, filter: canonicalFilter }).ok).toBe(false);
  });

  it("propagates correction, policy, eligibility, enrichment, and deleted-source staleness deterministically", () => {
    const identity = createCanonicalContentIdentity("canonical_content", "v1", { value: "one" });
    const changed = createCanonicalContentIdentity("canonical_content", "v1", { value: "two" });
    expect(identity.ok && changed.ok).toBe(true);
    if (!identity.ok || !changed.ok) return;
    const base = { recordedManifestDigest: identity.value.identifier, currentManifestDigest: identity.value.identifier, recordedPolicySetDigest: identity.value.identifier, currentPolicySetDigest: identity.value.identifier, recordedEligibilitySetDigest: identity.value.identifier, currentEligibilitySetDigest: identity.value.identifier, recordedEnrichmentSetDigest: identity.value.identifier, currentEnrichmentSetDigest: identity.value.identifier, sourceDeleted: false, superseded: false, blocked: false, retryableFailure: false, terminalFailure: false };
    expect(calculateArtifactState(base).state).toBe("current");
    expect(calculateArtifactState({ ...base, currentManifestDigest: changed.value.identifier }).state).toBe("stale_source");
    expect(calculateArtifactState({ ...base, currentPolicySetDigest: changed.value.identifier }).state).toBe("stale_policy");
    expect(calculateArtifactState({ ...base, currentEligibilitySetDigest: changed.value.identifier }).state).toBe("stale_eligibility");
    expect(calculateArtifactState({ ...base, sourceDeleted: true }).state).toBe("deleted_source");
  });
});
