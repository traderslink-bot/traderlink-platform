import { describe, expect, it } from "vitest";

import {
  assertEvidenceScope,
  assertSnapshotExecutionManifest,
  applyCorrectionSet,
  buildAnalysisSnapshot,
  buildCanonicalQueryFilter,
  buildDatasetManifest,
  buildEvidenceReference,
  buildExecutionOccurrenceEvidenceInventory,
  buildRetrospectiveAnalysisPolicy,
  buildRoundTripEvidenceInventory,
  calculateArtifactState,
  calculateManifestEligibility,
  createCanonicalContentIdentity,
  createEmptyEnrichmentSet,
  equivalentPersistenceIdentityIsCurrent,
  verifyAnalysisSnapshot,
  resolveRelativeDateRange,
  reconstructAnalyticalPnl,
  type RelativeDateResolver,
  type RetrospectivePolicyState,
} from "../../domain";
import type { CanonicalContentDigest, CanonicalExecutionDigest } from "../../domain/identity";
import type { CanonicalUtcTimestamp } from "../../domain/canonical";
import { buildSyntheticCanonicalExecution, syntheticSourceDocumentDigest } from "../../testing/synthetic-execution-builder";
import { buildSyntheticAnalyticalPnlInput } from "../../testing/synthetic-accounting-input";

const digest = (domain: string, value: string) => `ti_v3:${domain}:v1:sha256:${value.repeat(64)}` as CanonicalContentDigest;
const availableA = buildSyntheticCanonicalExecution({ executionId: "MANIFEST-A", brokerExecutionIndex: "1" });
const availableB = buildSyntheticCanonicalExecution({
  executionId: "MANIFEST-B",
  brokerExecutionIndex: "2",
  brokerFillSequence: "2",
  side: "sell",
  executedAt: "2026-07-18T13:45:13.000000000Z",
  timestampPrecision: "second",
  originalSourceRowLocator: { kind: "row_number", value: "2", rowOrderPreserved: true },
});
const executionA = availableA.canonicalContentDigest;
const executionB = availableB.canonicalContentDigest;
const sourceA = availableA.content.sourceDocumentDigest!;
const sourceB = syntheticSourceDocumentDigest("secondary");
const fifoPolicy = digest("canonical_content", "b");
const analysisCutoffAt = "2026-07-17T20:00:00.000000000Z" as CanonicalUtcTimestamp;

type ManifestOverrides = Partial<{ executions: readonly CanonicalExecutionDigest[]; gaps: readonly unknown[]; openPositions: readonly unknown[]; persistenceId: string; coverageStates: readonly string[]; priorInventory: readonly unknown[]; sourceDocuments: readonly unknown[]; policies: readonly unknown[]; currencies: readonly string[]; policyState: RetrospectivePolicyState; statementPeriods: readonly unknown[]; overlappingPeriods: readonly unknown[] }>;

function policyFor(open: boolean, state?: RetrospectivePolicyState) {
  const resolvedState = state ?? (open ? "open_position_execution_review_only" : "closed_historical_trade");
  const built = buildRetrospectiveAnalysisPolicy({
    state: resolvedState,
    analysisCutoffAt,
    correctionCutoffAt: analysisCutoffAt,
    openPositionPolicy: resolvedState === "open_position_execution_review_only" ? "execution_review_only" : "exclude_from_closed_trade_analytics",
    includedLifecycleStates: ["execution_accepted", ...(open ? ["position_open" as const] : ["position_closed" as const])],
    excludedLifecycleStates: [],
  });
  expect(built.ok).toBe(true);
  if (!built.ok) throw new Error(built.error.code);
  return built.value;
}

function manifestResult(overrides: ManifestOverrides = {}) {
  const executions = overrides.executions ?? [executionA, executionB];
  const openPositions = overrides.openPositions ?? [];
  const retrospectivePolicy = policyFor(openPositions.length > 0, overrides.policyState);
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
    policies: overrides.policies ?? [
      { policyKey: "ti_v3_fifo_policy", policyVersion: "v1", policyDigest: fifoPolicy },
      { policyKey: "ti_v3_retrospective_policy", policyVersion: "v1", policyDigest: retrospectivePolicy.policyDigest },
    ],
    statementPeriods: overrides.statementPeriods ?? [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }],
    knownGaps: overrides.gaps ?? [],
    overlappingPeriods: overrides.overlappingPeriods ?? [], exclusions: [],
    priorInventory: overrides.priorInventory ?? [{ ledgerKey: "owner_local:account_primary:aapl:usd", state: "proven_flat", contractDigest: digest("starting_inventory", "d") }],
    openPositions, currencies: overrides.currencies ?? ["USD"], coverageStates: overrides.coverageStates ?? (overrides.gaps?.length ? ["partial_account_period"] : ["complete_account_period"]),
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

function authority(manifestValue: ReturnType<typeof manifest>, state?: RetrospectivePolicyState) {
  const correctionResult = applyCorrectionSet({
    baseActiveExecutionDigests: manifestValue.content.acceptedExecutionDigests,
    availableExecutionCatalog: [availableA, availableB],
    corrections: [],
    correctionCutoffAt: analysisCutoffAt,
  });
  const retrospectivePolicy = policyFor(manifestValue.content.openPositions.length > 0, state);
  expect(correctionResult.ok).toBe(true);
  if (!correctionResult.ok) throw new Error("synthetic authority failed");
  return { correctionResult: correctionResult.value, retrospectivePolicy };
}

function evidenceInventories() {
  const accountingInput = buildSyntheticAnalyticalPnlInput([availableA, availableB]);
  const occurrenceInventory = buildExecutionOccurrenceEvidenceInventory(
    accountingInput.relationshipResolution,
  );
  const reconstruction = reconstructAnalyticalPnl(accountingInput);
  const roundTripInventory = buildRoundTripEvidenceInventory(reconstruction);
  expect(occurrenceInventory.ok && roundTripInventory.ok).toBe(true);
  if (!occurrenceInventory.ok || !roundTripInventory.ok) {
    throw new Error("synthetic evidence inventory failed");
  }
  return {
    occurrenceInventory: occurrenceInventory.value,
    roundTripInventory: roundTripInventory.value,
  };
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
    expect(eligibility.value.results.find((result) => result.capability === "closed_trade_analytics")?.state).toBe("blocked");
    expect(eligibility.value.results.find((result) => result.capability === "execution_review")?.state).toBe("eligible");
    expect(eligibility.value.results.find((result) => result.capability === "export")?.state).toBe("eligible");
  });

  it("binds exact policy content to the manifest and enforces policy-state capability limits", () => {
    const coachingBlockedManifest = manifest({ policyState: "ineligible_for_coaching" });
    const coachingBlocked = calculateManifestEligibility({
      manifest: coachingBlockedManifest,
      ...authority(coachingBlockedManifest, "ineligible_for_coaching"),
      analysisCutoffAt,
      requiredEvidenceReferences: [],
    });
    expect(coachingBlocked.ok).toBe(true);
    expect(coachingBlocked.ok && coachingBlocked.value.results.find((item) => item.capability === "coaching")?.state).toBe("blocked");

    const pendingManifest = manifest({ policyState: "pending_correction" });
    const pending = calculateManifestEligibility({
      manifest: pendingManifest,
      ...authority(pendingManifest, "pending_correction"),
      analysisCutoffAt,
      requiredEvidenceReferences: [],
    });
    expect(pending.ok).toBe(true);
    expect(pending.ok && pending.value.results.find((item) => item.capability === "exact_reconstruction")?.state).toBe("blocked");
    expect(pending.ok && pending.value.results.find((item) => item.capability === "execution_review")?.state).toBe("limited");
    expect(pending.ok && pending.value.results.find((item) => item.capability === "export")?.state).toBe("eligible");

    const ordinaryManifest = manifest();
    const foreignSameVersion = policyFor(false, "same_day_closed_trade");
    const foreign = calculateManifestEligibility({
      manifest: ordinaryManifest,
      correctionResult: authority(ordinaryManifest).correctionResult,
      retrospectivePolicy: foreignSameVersion,
      analysisCutoffAt,
      requiredEvidenceReferences: [],
    });
    expect(foreign).toMatchObject({ ok: false, error: { code: "ti_v3_eligibility_inconsistent" } });

    const closed = policyFor(false, "closed_historical_trade");
    const sameDay = policyFor(false, "same_day_closed_trade");
    expect(closed.policyVersion).toBe(sameDay.policyVersion);
    expect(closed.policyDigest).not.toBe(sameDay.policyDigest);
  });

  it("rejects duplicate identities, foreign open executions, scope mismatches, and false complete coverage", () => {
    const source = { sourceDocumentDigest: sourceA, sourceKind: "broker_csv", statementPeriods: [{ startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false }], deletionState: "present" };
    expect(manifestResult({ sourceDocuments: [source, source] }).ok).toBe(false);
    expect(manifestResult({ openPositions: [{ ledgerKey: "account_primary:aapl:usd", executionDigests: [digest("canonical_execution", "9")] }] }).ok).toBe(false);
    expect(manifestResult({ priorInventory: [{ ledgerKey: "owner_local:account_foreign:aapl:usd", state: "proven_flat", contractDigest: digest("starting_inventory", "e") }] }).ok).toBe(false);
    expect(manifestResult({ gaps: [{ scopeKey: "account_primary", range: { startAt: "2026-07-04T00:00:00.000000000Z", endAt: "2026-07-05T00:00:00.000000000Z", startInclusive: true, endInclusive: false }, reasonCode: "ti_v3_source_period_missing" }], coverageStates: ["complete_account_period"] }).ok).toBe(false);
  });

  it("canonicalizes per-source periods and enforces overlap membership and period coverage", () => {
    const firstPeriod = { startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-10T00:00:00.000000000Z", startInclusive: true, endInclusive: false };
    const secondPeriod = { startAt: "2026-07-10T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false };
    const source = (sourceDocumentDigest: string, statementPeriods: readonly unknown[]) => ({ sourceDocumentDigest, sourceKind: "broker_csv", statementPeriods, deletionState: "present" });
    const left = manifest({ sourceDocuments: [source(sourceA, [secondPeriod, firstPeriod])], statementPeriods: [firstPeriod, secondPeriod] });
    const right = manifest({ sourceDocuments: [source(sourceA, [firstPeriod, secondPeriod])], statementPeriods: [secondPeriod, firstPeriod] });
    expect(left.manifestDigest).toBe(right.manifestDigest);
    expect(manifestResult({ sourceDocuments: [source(sourceA, [firstPeriod, firstPeriod])], statementPeriods: [firstPeriod] }).ok).toBe(false);
    expect(manifestResult({ sourceDocuments: [source(sourceA, [secondPeriod])], statementPeriods: [firstPeriod] }).ok).toBe(false);

    const overlapRange = { startAt: "2026-07-04T00:00:00.000000000Z", endAt: "2026-07-05T00:00:00.000000000Z", startInclusive: true, endInclusive: false };
    const fullPeriod = { startAt: "2026-07-01T00:00:00.000000000Z", endAt: "2026-07-18T00:00:00.000000000Z", startInclusive: true, endInclusive: false };
    expect(manifestResult({ sourceDocuments: [source(sourceA, [fullPeriod])], overlappingPeriods: [{ sourceDocumentDigests: [sourceA, sourceA], range: overlapRange, resolutionState: "reconciled" }], coverageStates: ["overlapping_periods_reconciled"] }).ok).toBe(false);
    expect(manifestResult({ sourceDocuments: [source(sourceA, [fullPeriod]), source(sourceB, [fullPeriod])], overlappingPeriods: [{ sourceDocumentDigests: [sourceB, sourceA], range: overlapRange, resolutionState: "reconciled" }], coverageStates: ["overlapping_periods_reconciled"] }).ok).toBe(true);
    expect(manifestResult({ sourceDocuments: [source(sourceA, [fullPeriod]), source(sourceB, [fullPeriod])], overlappingPeriods: [{ sourceDocumentDigests: [sourceA, sourceB], range: overlapRange, resolutionState: "reconciled" }], gaps: [{ scopeKey: "account_primary", range: overlapRange, reasonCode: "ti_v3_source_period_missing" }], coverageStates: ["partial_account_period", "overlapping_periods_reconciled"] }).ok).toBe(false);
  });
});

describe("GA0-A3 snapshot and evidence binding", () => {
  it("rejects mixed manifests and resolves semantic evidence after equivalent reimport", () => {
    const first = manifest();
    const equivalent = manifest({ executions: [executionB, executionA] });
    expect(equivalent.manifestDigest).toBe(first.manifestDigest);
    const eligibility = calculateManifestEligibility({ manifest: first, ...authority(first), analysisCutoffAt, requiredEvidenceReferences: [] });
    const canonicalFilter = filter();
    const enrichment = createEmptyEnrichmentSet(first, analysisCutoffAt);
    const inventories = evidenceInventories();
    expect({ eligibility, enrichment }).toMatchObject({ eligibility: { ok: true }, enrichment: { ok: true } });
    if (!eligibility.ok || !enrichment.ok) return;
    const snapshot = buildAnalysisSnapshot({ manifest: first, eligibilitySet: eligibility.value, enrichmentSet: enrichment.value, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", ...inventories });
    expect(snapshot.ok).toBe(true);
    if (!snapshot.ok) return;
    expect(assertSnapshotExecutionManifest(snapshot.value, digest("dataset_manifest", "9")).ok).toBe(false);
    const evidence = buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "canonical_execution", semanticKey: executionA, correctionDigest: null, policyDigest: null });
    expect(evidence.ok).toBe(true);
    if (!evidence.ok) return;
    expect(assertEvidenceScope(evidence.value, { manifestDigest: first.manifestDigest, snapshotDigest: snapshot.value.snapshotDigest }).ok).toBe(true);
    expect(verifyAnalysisSnapshot({ ...snapshot.value, manifestDigest: digest("dataset_manifest", "8") }, { manifest: first, eligibilitySet: eligibility.value, filter: canonicalFilter, enrichmentSet: enrichment.value, ...inventories }).ok).toBe(false);
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "canonical_execution", semanticKey: digest("canonical_execution", "9"), correctionDigest: null, policyDigest: null }).ok).toBe(false);
    expect(buildAnalysisSnapshot({ manifest: first, eligibilitySet: { ...eligibility.value }, enrichmentSet: enrichment.value, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", ...inventories }).ok).toBe(false);
    expect(buildAnalysisSnapshot({ manifest: first, eligibilitySet: eligibility.value, enrichmentSet: { ...enrichment.value }, intentRuleCutoffAt: analysisCutoffAt, analysisCutoffAt, filter: canonicalFilter, evidenceNamespace: "evidence:owner_local", ...inventories }).ok).toBe(false);

    const occurrenceKey = inventories.occurrenceInventory.occurrenceKeys[0];
    const roundTripKey = inventories.roundTripInventory.roundTripKeys[0];
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "execution_occurrence", semanticKey: occurrenceKey, correctionDigest: null, policyDigest: null }).ok).toBe(true);
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "execution_occurrence", semanticKey: `${occurrenceKey}_invented`, correctionDigest: null, policyDigest: null }).ok).toBe(false);
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "reconstructed_round_trip", semanticKey: roundTripKey, correctionDigest: null, policyDigest: null }).ok).toBe(true);
    expect(buildEvidenceReference({ snapshot: snapshot.value, subjectKind: "reconstructed_round_trip", semanticKey: `${roundTripKey}_invented`, correctionDigest: null, policyDigest: null }).ok).toBe(false);

    expect(Object.isFrozen(snapshot.value.evidenceSubjects.executionOccurrenceKeys)).toBe(true);
    expect(Object.isFrozen(snapshot.value.canonicalFilter.resolvedAbsoluteRange)).toBe(true);
    expect(() => (snapshot.value.evidenceSubjects.executionOccurrenceKeys as string[]).push("invented")).toThrow();
    expect(() => ((snapshot.value.canonicalFilter.resolvedAbsoluteRange as { startAt: string }).startAt = analysisCutoffAt)).toThrow();
    expect(verifyAnalysisSnapshot({ ...snapshot.value })).toMatchObject({ ok: false });
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
