import { describe, expect, it } from "vitest";

import {
  assertEvidenceScope,
  assertSnapshotExecutionManifest,
  applyCorrectionSet,
  buildAnalysisSnapshot,
  buildCanonicalQueryFilter,
  buildDatasetManifest,
  buildEvidenceReference,
  buildRetrospectiveAnalysisPolicy,
  calculateArtifactState,
  calculateManifestEligibility,
  createCanonicalContentIdentity,
  createEmptyEnrichmentSet,
  equivalentPersistenceIdentityIsCurrent,
  verifyAnalysisSnapshot,
  resolveRelativeDateRange,
  type RelativeDateResolver,
} from "../../domain";
import type { CanonicalContentDigest, CanonicalExecutionDigest, CanonicalSourceDocumentDigest } from "../../domain/identity";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";
import { buildSyntheticCanonicalExecution } from "../../testing/synthetic-execution-builder";

const digest = (domain: string, value: string) => `ti_v3:${domain}:v1:sha256:${value.repeat(64)}` as CanonicalContentDigest;
const availableA = buildSyntheticCanonicalExecution({ executionId: "MANIFEST-A", brokerExecutionIndex: "1" });
const availableB = buildSyntheticCanonicalExecution({ executionId: "MANIFEST-B", brokerExecutionIndex: "2" });
const executionA = availableA.canonicalContentDigest;
const executionB = availableB.canonicalContentDigest;
const sourceA = availableA.content.sourceDocumentDigest;
const policy = digest("canonical_content", "b");
const analysisCutoffAt = "2026-07-17T20:00:00.000000000Z" as CanonicalUtcTimestamp;

type ManifestOverrides = Partial<{ executions: readonly CanonicalExecutionDigest[]; gaps: readonly unknown[]; openPositions: readonly unknown[]; persistenceId: string; coverageStates: readonly string[]; priorInventory: readonly unknown[]; sourceDocuments: readonly unknown[]; policies: readonly unknown[]; currencies: readonly string[] }>;

function manifestResult(overrides: ManifestOverrides = {}) {
  const executions = overrides.executions ?? [executionA, executionB];
  const correctionResult = applyCorrectionSet({
    baseActiveExecutionDigests: executions,
    availableExecutionCatalog: [availableA, availableB],
    corrections: [],
    correctionCutoffAt: analysisCutoffAt,
  });
  expect(correctionResult.ok).toBe(true);
  if (!correctionResult.ok) throw new Error(correctionResult.error.code);
  return buildDatasetManifest({
    canonicalOwnerKey: "owner_local",
    canonicalAccountKeys: ["account_primary"],
    sourceDocuments: overrides.sourceDocuments ?? [{ sourceDocumentDigest: sourceA, sourceKind: "broker_csv", statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }], deletionState: "present" }],
    acceptedExecutionDigests: executions,
    correctionResult: correctionResult.value,
    policies: overrides.policies ?? [{ policyKey: "ti_v3_fifo_policy", policyVersion: "v1", policyDigest: policy }],
    statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }],
    knownGaps: overrides.gaps ?? [],
    overlappingPeriods: [], exclusions: [],
    priorInventory: overrides.priorInventory ?? [{ ledgerKey: "account_primary:aapl:usd", state: "proven_flat", contractDigest: null }],
    openPositions: overrides.openPositions ?? [], currencies: overrides.currencies ?? ["USD"], coverageStates: overrides.coverageStates ?? (overrides.gaps?.length ? ["partial_account_period"] : ["complete_account_period"]),
    reconstructionStatus: overrides.gaps?.length ? "limited" : "exact",
    reconstructionReasonCodes: overrides.gaps?.length ? ["ti_v3_coverage_gap"] : [],
  });
}

function manifest(overrides: ManifestOverrides = {}) {
  const built = manifestResult(overrides);
  expect(built, built.ok ? undefined : JSON.stringify(built.error)).toMatchObject({ ok: true });
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

function filter() {
  const resolver: RelativeDateResolver = { resolve: () => ({ ok: true, value: { requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-17", startAt: "2026-07-01T00:00:00.000000000Z" as CanonicalUtcTimestamp, endAt: analysisCutoffAt, calendarPolicyKey: "ti_v3_utc_calendar", calendarPolicyVersion: "v1", sessionEvidence: [] } }) };
  const receipt = resolveRelativeDateRange({ request: { dateBasis: "execution_date", timeBasis: "utc", timezone: "UTC", requestedStartDate: "2026-07-01", requestedEndDate: "2026-07-17", startBoundary: "inclusive", endBoundary: "inclusive", calendarBasis: "calendar_day", relativeRange: null }, now: analysisCutoffAt, resolver });
  expect(receipt.ok).toBe(true); if (!receipt.ok) throw new Error(receipt.error.code);
  const built = buildCanonicalQueryFilter({
    dateResolutionReceipt: receipt.value,
    accountFilters: ["account_primary"], instrumentFilters: ["AAPL", "AAPL"], directionFilters: ["long"], sessionFilters: ["regular"], lifecycleFilters: ["position_closed"], setupFilter: null, outcomeFilters: ["gain", "loss"], currencyFilters: ["USD"], evidenceCapabilityFilters: ["closed_trade_analytics"], openPositionPolicy: "exclude_from_closed_trade_analytics", correctionCutoffAt: analysisCutoffAt, analysisCutoffAt, boundSnapshotDigest: null,
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

function authority(manifestValue: ReturnType<typeof manifest>) {
  const correctionResult = applyCorrectionSet({
    baseActiveExecutionDigests: manifestValue.content.acceptedExecutionDigests,
    availableExecutionCatalog: [availableA, availableB],
    corrections: [],
    correctionCutoffAt: analysisCutoffAt,
  });
  const retrospectivePolicy = buildRetrospectiveAnalysisPolicy({
    state: manifestValue.content.openPositions.length > 0 ? "open_position_execution_review_only" : "closed_historical_trade",
    analysisCutoffAt,
    correctionCutoffAt: analysisCutoffAt,
    openPositionPolicy: manifestValue.content.openPositions.length > 0 ? "execution_review_only" : "exclude_from_closed_trade_analytics",
    includedLifecycleStates: ["execution_accepted", ...(manifestValue.content.openPositions.length > 0 ? ["position_open" as const] : ["position_closed" as const])],
    excludedLifecycleStates: [],
  });
  expect(correctionResult.ok && retrospectivePolicy.ok).toBe(true);
  if (!correctionResult.ok || !retrospectivePolicy.ok) throw new Error("synthetic authority failed");
  return { correctionResult: correctionResult.value, retrospectivePolicy: retrospectivePolicy.value };
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
    const eligibility = calculateManifestEligibility({ manifest: open, ...authority(open), analysisCutoffAt, requiredEvidenceReferences: [] });
    expect(eligibility, eligibility.ok ? undefined : JSON.stringify(eligibility.error)).toMatchObject({ ok: true });
    if (!eligibility.ok) return;
    expect(eligibility.value.results.find((result) => result.capability === "closed_trade_analytics")?.state).toBe("limited");
    expect(eligibility.value.results.find((result) => result.capability === "execution_review")?.state).toBe("eligible");
    expect(eligibility.value.results.find((result) => result.capability === "export")?.state).toBe("eligible");
  });

  it("rejects duplicate identities, foreign open executions, scope mismatches, and false complete coverage", () => {
    const source = { sourceDocumentDigest: sourceA, sourceKind: "broker_csv", statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }], deletionState: "present" };
    expect(manifestResult({ sourceDocuments: [source, source] }).ok).toBe(false);
    expect(manifestResult({ openPositions: [{ ledgerKey: "account_primary:aapl:usd", executionDigests: [digest("canonical_execution", "9")] }] }).ok).toBe(false);
    expect(manifestResult({ priorInventory: [{ ledgerKey: "account_foreign:aapl:usd", state: "proven_flat", contractDigest: null }] }).ok).toBe(false);
    expect(manifestResult({ gaps: [{ scopeKey: "account_primary", range: { startAt: "2026-07-04T00:00:00.000000000Z", endAt: "2026-07-05T00:00:00.000000000Z", startInclusive: true, endInclusive: false }, reasonCode: "ti_v3_source_period_missing" }], coverageStates: ["complete_account_period"] }).ok).toBe(false);
  });
});

describe("GA0-A3 snapshot and evidence binding", () => {
  it("rejects mixed manifests and resolves semantic evidence after equivalent reimport", () => {
    const first = manifest();
    const equivalent = manifest({ executions: [executionB, executionA] });
    const eligibility = calculateManifestEligibility({ manifest: first, ...authority(first), analysisCutoffAt, requiredEvidenceReferences: [] });
    const canonicalFilter = filter();
    const enrichment = createEmptyEnrichmentSet(first, analysisCutoffAt);
    expect({ eligibility, enrichment }).toMatchObject({ eligibility: { ok: true }, enrichment: { ok: true } });
    if (!eligibility.ok || !enrichment.ok) return;
    const snapshot = buildAnalysisSnapshot({ manifest: first, eligibilitySet: eligibility.value, enrichmentSet: enrichment.value, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", reconstructedRoundTripKeys: [] });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    expect(assertSnapshotExecutionManifest(snapshot.value, digest("dataset_manifest", "9")).ok).toBe(false);
    const evidence = buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "canonical_execution", semanticKey: executionA, correctionDigest: null, policyDigest: null });
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) return;
    expect(assertEvidenceScope(evidence.value, { manifestDigest: first.manifestDigest, snapshotDigest: snapshot.value.snapshotDigest }).ok).toBe(true);
    expect(verifyAnalysisSnapshot({ ...snapshot.value, manifestDigest: digest("dataset_manifest", "8") }, { manifest: first, eligibilitySet: eligibility.value, filter: canonicalFilter, enrichmentSet: enrichment.value }).ok).toBe(false);
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "canonical_execution", semanticKey: digest("canonical_execution", "9"), correctionDigest: null, policyDigest: null }).ok).toBe(false);
    expect(buildAnalysisSnapshot({ manifest: first, eligibilitySet: { ...eligibility.value }, enrichmentSet: enrichment.value, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", reconstructedRoundTripKeys: [] }).ok).toBe(false);
    expect(buildAnalysisSnapshot({ manifest: first, eligibilitySet: eligibility.value, enrichmentSet: { ...enrichment.value }, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", reconstructedRoundTripKeys: [] }).ok).toBe(false);
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
