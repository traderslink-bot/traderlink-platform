import { compareUnicodeCodePoints } from "../../domain/canonical";
import {
  buildRoundTripEvidenceInventory,
  buildExecutionOccurrenceEvidenceInventory,
  verifyExecutionOccurrenceEvidenceInventory,
  verifyRoundTripEvidenceInventory,
  type ExecutionOccurrenceEvidenceInventory,
  type RoundTripEvidenceInventory,
} from "../../domain/evidence";
import {
  createExactRatio,
  decimalToExactRatio,
  parseExactMoneyAmount,
  type CurrencyCode,
  type ExactResult,
} from "../../domain/exact";
import {
  orderCanonicalExecutions,
  resolveExecutionRelationships,
  verifyCanonicalExecutionEnvelope,
  type CanonicalExecutionEnvelope,
  type CompleteExecutionRelationshipResolution,
} from "../../domain/execution";
import { createCanonicalContentIdentity, type CanonicalContentDigest, type CanonicalExecutionDigest } from "../../domain/identity";
import { verifyDatasetManifest, type DatasetManifest } from "../../domain/manifest";
import { verifyCanonicalQueryFilter, type CanonicalQueryFilter } from "../../domain/query";
import {
  verifyAnalysisSnapshot,
  type AnalysisSnapshot,
  type AnalysisSnapshotDependencies,
} from "../../domain/snapshot";
import {
  applyCorrectionSet,
  verifyCorrectionApplicationResult,
  type CorrectionApplicationResult,
  type CorrectionRecord,
} from "../../domain/temporal";
import {
  isVerifiedAnalyticalPnlReconstructionResult,
  isVerifiedStartingInventoryContract,
  reconstructAnalyticalPnl,
  type AnalyticalLedgerResult,
  type AnalyticalPnlReconstructionResult,
  type FlatToFlatRoundTrip,
  type StartingInventoryContract,
} from "../../domain/accounting";
import {
  ANALYTICAL_DATASET_VERSION,
  ANALYTICAL_EXCLUSION_REASONS,
  buildAnalyticalDatasetReceipt,
  type AnalyticalDatasetReceipt,
  type ExcludedAnalyticalCandidate,
} from "../dataset/analytical-dataset";
import { ANALYTICAL_ROW_VERSION, buildAnalyticalRow, type ExactMoneyFact } from "../dataset/analytical-row";
import { GA0_B1_CONTRACT_LIMITS } from "../contracts/contract-validation";
import { GA0_B1_DERIVATION_POLICY, resolveSessionFacts, type ResolvedSessionFacts } from "./session-policy";

export const SNAPSHOT_READ_MODEL_ADAPTER_KEY = "ti_v3_snapshot_read_model_adapter" as const;
export const SNAPSHOT_READ_MODEL_ADAPTER_VERSION = "v1" as const;

export interface SnapshotReadModelAuthority {
  readonly snapshot: unknown;
  readonly snapshotDependencies: AnalysisSnapshotDependencies;
  readonly correctionAuthority: Readonly<{
    result: CorrectionApplicationResult;
    baseActiveExecutionDigests: readonly CanonicalExecutionDigest[];
    availableExecutionCatalog: readonly CanonicalExecutionEnvelope[];
    corrections: readonly CorrectionRecord[];
  }>;
  readonly acceptedExecutionCatalog: readonly CanonicalExecutionEnvelope[];
  readonly relationshipResolution: CompleteExecutionRelationshipResolution;
  readonly startingInventories: readonly StartingInventoryContract[];
  readonly reconstruction: AnalyticalPnlReconstructionResult;
  readonly derivationPolicy: typeof GA0_B1_DERIVATION_POLICY;
}

export type ReadOnlyAuthorityResult = Readonly<
  | { readonly state: "available"; readonly authority: SnapshotReadModelAuthority }
  | { readonly state: "unavailable"; readonly reasonCode: string }
>;

export interface ReadOnlySnapshotAuthoritySource {
  readonly sourceKey: string;
  readonly sourceVersion: string;
  readonly readExactAuthority: () => ReadOnlyAuthorityResult;
}

export interface SnapshotReadModelFailure {
  readonly code:
    | "ti_v3_analytics_source_unavailable"
    | "ti_v3_analytics_authority_unverified"
    | "ti_v3_analytics_authority_mismatch"
    | "ti_v3_analytics_filter_unsupported"
    | "ti_v3_analytics_input_oversized"
    | "ti_v3_analytics_dataset_construction_failed";
  readonly path: string;
  readonly reasonCode?: string;
}

interface VerifiedAuthority {
  readonly snapshot: AnalysisSnapshot;
  readonly dependencies: AnalysisSnapshotDependencies;
  readonly manifest: DatasetManifest;
  readonly filter: CanonicalQueryFilter;
  readonly correctionResult: CorrectionApplicationResult;
  readonly acceptedExecutions: readonly CanonicalExecutionEnvelope[];
  readonly relationshipResolution: CompleteExecutionRelationshipResolution;
  readonly reconstruction: AnalyticalPnlReconstructionResult;
  readonly occurrenceInventory: ExecutionOccurrenceEvidenceInventory | null;
  readonly roundTripInventory: RoundTripEvidenceInventory | null;
}

interface RoundTripCandidate {
  readonly ledger: AnalyticalLedgerResult;
  readonly roundTrip: FlatToFlatRoundTrip;
}

interface PreliminaryRow {
  readonly candidateKey: string;
  readonly rowInput: Record<string, unknown>;
  readonly firstEntry: CanonicalExecutionEnvelope;
}

function failure(
  code: SnapshotReadModelFailure["code"],
  path: string,
  reasonCode?: string,
): ExactResult<never, SnapshotReadModelFailure> {
  return { ok: false, error: { code, path, ...(reasonCode === undefined ? {} : { reasonCode }) } };
}

function contentIdentityMatches(
  domain: Parameters<typeof createCanonicalContentIdentity>[0],
  content: unknown,
  digest: CanonicalContentDigest,
): boolean {
  const identity = createCanonicalContentIdentity(domain, "v1", content);
  return identity.ok && identity.value.identifier === digest;
}

function correctionContent(result: CorrectionApplicationResult): object {
  return {
    schemaVersion: "ti_v3_correction_result_v1",
    status: result.status,
    correctionCutoffAt: result.correctionCutoffAt,
    baseActiveExecutionDigests: result.baseActiveExecutionDigests,
    availableExecutionCatalogDigest: result.availableExecutionCatalogDigest,
    availableExecutionDigests: result.availableExecutionDigests,
    activeExecutionDigests: result.activeExecutionDigests,
    appliedCorrectionDigests: result.appliedCorrectionDigests,
    excludedCorrectionDigests: result.excludedCorrectionDigests,
    reasonCodes: result.reasonCodes,
  };
}

function relationshipProjection(resolution: CompleteExecutionRelationshipResolution): object {
  return {
    retainedExecutionDigests: resolution.retainedExecutions.map((execution) => execution.canonicalContentDigest),
    groupBlocks: resolution.groupBlocks,
    globalBlocks: resolution.globalBlocks,
    coverageReceipt: {
      version: resolution.coverageReceipt.version,
      state: resolution.coverageReceipt.state,
      inputExecutionCount: String(resolution.coverageReceipt.inputExecutionCount),
      inputOccurrenceDigest: resolution.coverageReceipt.inputOccurrenceDigest,
      inputOccurrenceKeys: resolution.coverageReceipt.inputOccurrenceKeys,
      inputExecutionDigests: resolution.coverageReceipt.inputExecutionDigests,
      candidateIndexSummaries: resolution.coverageReceipt.candidateIndexSummaries.map((summary) => ({
        indexName: summary.indexName,
        partitionCount: String(summary.partitionCount),
        candidatePartitionCount: String(summary.candidatePartitionCount),
      })),
      candidateRelationshipCount: String(resolution.coverageReceipt.candidateRelationshipCount),
      classifiedCandidateCount: String(resolution.coverageReceipt.classifiedCandidateCount),
      defaultDistinctPairCount: resolution.coverageReceipt.defaultDistinctPairCount,
      defaultDistinctProof: resolution.coverageReceipt.defaultDistinctProof,
      candidateRelationships: resolution.coverageReceipt.candidateRelationships,
      retainedOccurrenceCount: String(resolution.coverageReceipt.retainedOccurrenceCount),
      suppressedOccurrenceCount: String(resolution.coverageReceipt.suppressedOccurrenceCount),
      blockedGroupCount: String(resolution.coverageReceipt.blockedGroupCount),
      resourceLimits: {
        maximumCandidatePairs: String(resolution.coverageReceipt.resourceLimits.maximumCandidatePairs),
      },
    },
  };
}

function authorityIdentity(content: unknown): string | null {
  const identity = createCanonicalContentIdentity("canonical_content", "v1", content);
  return identity.ok ? identity.value.identifier : null;
}

function sameStrings(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateFilterSupport(
  filter: CanonicalQueryFilter,
  eligibility: AnalysisSnapshotDependencies["eligibilitySet"],
): ExactResult<true, SnapshotReadModelFailure> {
  if (filter.dateBasis !== "trade_close_date" || filter.calendarBasis !== "calendar_day") return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.dateBasis");
  if (
    !((filter.timeBasis === "utc" && filter.timezone === "UTC") ||
      ((filter.timeBasis === "exchange_local" || filter.timeBasis === "owner_local") && filter.timezone === "America/New_York"))
  ) return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.timezone");
  if (filter.setupFilter !== null) return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.setupFilter");
  for (const capability of filter.evidenceCapabilityFilters) {
    if (!eligibility.results.some((result) => result.capability === capability)) return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.evidenceCapabilityFilters");
  }
  return { ok: true, value: true };
}

function verifyAuthority(input: SnapshotReadModelAuthority): ExactResult<VerifiedAuthority, SnapshotReadModelFailure> {
  if (input.derivationPolicy !== GA0_B1_DERIVATION_POLICY) return failure("ti_v3_analytics_authority_unverified", "$.derivationPolicy");
  const dependencies = input.snapshotDependencies;
  const manifest = verifyDatasetManifest(dependencies.manifest);
  const filter = verifyCanonicalQueryFilter(dependencies.filter);
  if (!manifest.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.manifest");
  if (!filter.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.filter");
  if (!contentIdentityMatches("dataset_manifest", manifest.value.content, manifest.value.manifestDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.manifest.manifestDigest");
  const { eligibilitySetDigest: _eligibilityDigest, ...eligibilityContent } = dependencies.eligibilitySet;
  void _eligibilityDigest;
  if (!contentIdentityMatches("eligibility_set", eligibilityContent, dependencies.eligibilitySet.eligibilitySetDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.eligibilitySet.eligibilitySetDigest");
  const { filterDigest: _filterDigest, ...filterContent } = filter.value;
  void _filterDigest;
  if (!contentIdentityMatches("canonical_filter", filterContent, filter.value.filterDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.filter.filterDigest");
  const { enrichmentSetDigest: _enrichmentDigest, ...enrichmentContent } = dependencies.enrichmentSet;
  void _enrichmentDigest;
  if (!contentIdentityMatches("enrichment_set", enrichmentContent, dependencies.enrichmentSet.enrichmentSetDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.enrichmentSet.enrichmentSetDigest");
  if (dependencies.occurrenceInventory !== null) {
    const inventory = verifyExecutionOccurrenceEvidenceInventory(dependencies.occurrenceInventory);
    if (!inventory.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.occurrenceInventory");
    const { inventoryDigest, ...content } = inventory.value;
    if (!contentIdentityMatches("evidence_inventory", content, inventoryDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.occurrenceInventory.inventoryDigest");
  }
  if (dependencies.roundTripInventory !== null) {
    const inventory = verifyRoundTripEvidenceInventory(dependencies.roundTripInventory);
    if (!inventory.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.roundTripInventory");
    const { inventoryDigest, ...content } = inventory.value;
    if (!contentIdentityMatches("evidence_inventory", content, inventoryDigest)) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.roundTripInventory.inventoryDigest");
  }
  const snapshot = verifyAnalysisSnapshot(input.snapshot, dependencies);
  if (!snapshot.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshot");
  const support = validateFilterSupport(filter.value, dependencies.eligibilitySet);
  if (!support.ok) return support;
  const suppliedCorrection = verifyCorrectionApplicationResult(input.correctionAuthority.result);
  if (!suppliedCorrection.ok || !contentIdentityMatches("correction_result", correctionContent(input.correctionAuthority.result), input.correctionAuthority.result.correctionResultDigest)) return failure("ti_v3_analytics_authority_unverified", "$.correctionAuthority.result");
  const rebuiltCorrection = applyCorrectionSet({
    baseActiveExecutionDigests: input.correctionAuthority.baseActiveExecutionDigests,
    availableExecutionCatalog: input.correctionAuthority.availableExecutionCatalog,
    corrections: input.correctionAuthority.corrections,
    correctionCutoffAt: manifest.value.content.correctionCutoffAt,
  });
  if (!rebuiltCorrection.ok || rebuiltCorrection.value.correctionResultDigest !== suppliedCorrection.value.correctionResultDigest || suppliedCorrection.value.correctionResultDigest !== manifest.value.content.correctionResultDigest) return failure("ti_v3_analytics_authority_mismatch", "$.correctionAuthority.result");
  if (input.acceptedExecutionCatalog.length > GA0_B1_CONTRACT_LIMITS.maximumEvidenceItems) return failure("ti_v3_analytics_input_oversized", "$.acceptedExecutionCatalog");
  const acceptedExecutions: CanonicalExecutionEnvelope[] = [];
  for (let index = 0; index < input.acceptedExecutionCatalog.length; index += 1) {
    const execution = verifyCanonicalExecutionEnvelope(input.acceptedExecutionCatalog[index]);
    if (!execution.ok || execution.value.validation.state !== "accepted") return failure("ti_v3_analytics_authority_unverified", `$.acceptedExecutionCatalog[${index}]`);
    acceptedExecutions.push(execution.value);
  }
  const executionDigests = acceptedExecutions.map((execution) => execution.canonicalContentDigest).sort(compareUnicodeCodePoints);
  if (new Set(executionDigests).size !== executionDigests.length || !sameStrings(executionDigests, manifest.value.content.acceptedExecutionDigests) || !sameStrings(executionDigests, suppliedCorrection.value.activeExecutionDigests)) return failure("ti_v3_analytics_authority_mismatch", "$.acceptedExecutionCatalog");
  const rebuiltResolution = resolveExecutionRelationships(acceptedExecutions);
  if (authorityIdentity(relationshipProjection(rebuiltResolution)) !== authorityIdentity(relationshipProjection(input.relationshipResolution))) return failure("ti_v3_analytics_authority_mismatch", "$.relationshipResolution");
  const startingInventories: StartingInventoryContract[] = [];
  for (let index = 0; index < input.startingInventories.length; index += 1) {
    if (!isVerifiedStartingInventoryContract(input.startingInventories[index])) return failure("ti_v3_analytics_authority_unverified", `$.startingInventories[${index}]`);
    startingInventories.push(input.startingInventories[index]);
  }
  if (!isVerifiedAnalyticalPnlReconstructionResult(input.reconstruction)) return failure("ti_v3_analytics_authority_unverified", "$.reconstruction");
  const rebuiltReconstruction = reconstructAnalyticalPnl({ relationshipResolution: rebuiltResolution, startingInventories });
  if (authorityIdentity(rebuiltReconstruction) !== authorityIdentity(input.reconstruction)) return failure("ti_v3_analytics_authority_mismatch", "$.reconstruction");
  if (!sameStrings(
    [...rebuiltReconstruction.inputExecutionDigests].sort(compareUnicodeCodePoints),
    [...snapshot.value.evidenceSubjects.executionDigests].sort(compareUnicodeCodePoints),
  )) return failure("ti_v3_analytics_authority_mismatch", "$.reconstruction.inputExecutionDigests");
  const rebuiltOccurrence = buildExecutionOccurrenceEvidenceInventory(rebuiltResolution);
  if (!rebuiltOccurrence.ok || (dependencies.occurrenceInventory !== null && rebuiltOccurrence.value.inventoryDigest !== dependencies.occurrenceInventory.inventoryDigest)) return failure("ti_v3_analytics_authority_mismatch", "$.snapshotDependencies.occurrenceInventory");
  const rebuiltRoundTrips = buildRoundTripEvidenceInventory(rebuiltReconstruction);
  if (!rebuiltRoundTrips.ok || (dependencies.roundTripInventory !== null && rebuiltRoundTrips.value.inventoryDigest !== dependencies.roundTripInventory.inventoryDigest)) return failure("ti_v3_analytics_authority_mismatch", "$.snapshotDependencies.roundTripInventory");
  return { ok: true, value: Object.freeze({
    snapshot: snapshot.value, dependencies, manifest: manifest.value, filter: filter.value,
    correctionResult: rebuiltCorrection.value,
    acceptedExecutions: Object.freeze([...acceptedExecutions].sort((left, right) => compareUnicodeCodePoints(left.canonicalContentDigest, right.canonicalContentDigest))),
    relationshipResolution: rebuiltResolution, reconstruction: rebuiltReconstruction,
    occurrenceInventory: dependencies.occurrenceInventory === null ? null : rebuiltOccurrence.value,
    roundTripInventory: dependencies.roundTripInventory === null ? null : rebuiltRoundTrips.value,
  }) };
}

function terminatingRatioDecimal(numeratorInput: string, denominatorInput: string): string | null {
  const reduced = createExactRatio(numeratorInput, denominatorInput);
  if (!reduced.ok || BigInt(reduced.value.numerator) < BigInt(0)) return null;
  const numerator = BigInt(reduced.value.numerator);
  const denominator = BigInt(reduced.value.denominator);
  const integer = numerator / denominator;
  let remainder = numerator % denominator;
  if (remainder === BigInt(0)) return integer.toString();
  let fraction = "";
  while (remainder !== BigInt(0) && fraction.length <= 24) {
    remainder *= BigInt(10);
    fraction += (remainder / denominator).toString();
    remainder %= denominator;
  }
  if (remainder !== BigInt(0) || fraction.length > 24) return null;
  return `${integer.toString()}.${fraction}`;
}

function entryNotional(roundTrip: FlatToFlatRoundTrip, currency: CurrencyCode): ExactMoneyFact {
  const quantityRatio = decimalToExactRatio(roundTrip.entryQuantity);
  if (!quantityRatio.ok) return Object.freeze({ state: "unavailable", reasonCode: ANALYTICAL_EXCLUSION_REASONS.unavailableFinancialFact });
  const numerator = (BigInt(roundTrip.weightedAverageEntryPrice.numerator) * BigInt(quantityRatio.value.numerator)).toString();
  const denominator = (BigInt(roundTrip.weightedAverageEntryPrice.denominator) * BigInt(quantityRatio.value.denominator)).toString();
  const decimal = terminatingRatioDecimal(numerator, denominator);
  if (decimal === null || !parseExactMoneyAmount(decimal).ok) return Object.freeze({ state: "unavailable", reasonCode: ANALYTICAL_EXCLUSION_REASONS.unavailableFinancialFact });
  return Object.freeze({ state: "available", amount: decimal, currency });
}

function exclusion(
  candidateKey: string,
  semanticRoundTripKey: string | null,
  reasonCode: string,
  executions: readonly CanonicalExecutionDigest[] = [],
  occurrences: readonly string[] = [],
  currency: CurrencyCode | null = null,
  limitations: readonly string[] = [],
): ExcludedAnalyticalCandidate {
  return Object.freeze({ candidateKey, semanticRoundTripKey, reasonCode,
    limitationCodes: Object.freeze([...new Set(limitations)].sort(compareUnicodeCodePoints)),
    relatedExecutionDigests: Object.freeze([...new Set(executions)].sort(compareUnicodeCodePoints)),
    relatedOccurrenceKeys: Object.freeze([...new Set(occurrences)].sort(compareUnicodeCodePoints)),
    currency });
}

function outcome(amount: string): "gain" | "loss" | "flat" {
  return amount === "0" ? "flat" : amount.startsWith("-") ? "loss" : "gain";
}

function filterIncludesRow(
  filter: CanonicalQueryFilter,
  input: Readonly<{
    account: string; instrument: string; symbol: string; direction: "long" | "short";
    currency: CurrencyCode; finalExitAt: string; session: ResolvedSessionFacts; netPnl: string;
  }>,
  eligibility: AnalysisSnapshotDependencies["eligibilitySet"],
): boolean {
  if (filter.accountFilters.length > 0 && !filter.accountFilters.includes(input.account)) return false;
  if (filter.instrumentFilters.length > 0 && !filter.instrumentFilters.includes(input.instrument) && !filter.instrumentFilters.includes(input.symbol)) return false;
  if (filter.directionFilters.length > 0 && !filter.directionFilters.includes(input.direction)) return false;
  if (filter.currencyFilters.length > 0 && !filter.currencyFilters.includes(input.currency)) return false;
  if (filter.sessionFilters.length > 0 && !filter.sessionFilters.includes(input.session.session)) return false;
  if (filter.outcomeFilters.length > 0 && !filter.outcomeFilters.includes(outcome(input.netPnl))) return false;
  if (filter.lifecycleFilters.length > 0 && !filter.lifecycleFilters.includes("position_closed")) return false;
  if (filter.evidenceCapabilityFilters.some((capability) => {
    const result = eligibility.results.find((entry) => entry.capability === capability);
    return result === undefined || (result.state !== "eligible" && result.state !== "limited");
  })) return false;
  const startTimestampIncluded = input.finalExitAt > filter.resolvedAbsoluteRange.startAt || (input.finalExitAt === filter.resolvedAbsoluteRange.startAt && filter.startBoundary === "inclusive");
  const endTimestampIncluded = input.finalExitAt < filter.resolvedAbsoluteRange.endAt || (input.finalExitAt === filter.resolvedAbsoluteRange.endAt && filter.endBoundary === "inclusive");
  const startDateIncluded = input.session.sessionDate > filter.requestedStartDate || (input.session.sessionDate === filter.requestedStartDate && filter.startBoundary === "inclusive");
  const endDateIncluded = input.session.sessionDate < filter.requestedEndDate || (input.session.sessionDate === filter.requestedEndDate && filter.endBoundary === "inclusive");
  return startTimestampIncluded && endTimestampIncluded && startDateIncluded && endDateIncluded;
}

function deriveDataset(authority: VerifiedAuthority): ExactResult<AnalyticalDatasetReceipt, SnapshotReadModelFailure> {
  const exclusions: ExcludedAnalyticalCandidate[] = [];
  const preliminary: PreliminaryRow[] = [];
  const occurrenceByDigest = new Map<CanonicalExecutionDigest, string[]>();
  for (const key of authority.occurrenceInventory?.occurrenceKeys ?? []) {
    const digest = authority.manifest.content.acceptedExecutionDigests.find((candidate) => key.startsWith(`${candidate}:`));
    if (digest !== undefined) occurrenceByDigest.set(digest, [...(occurrenceByDigest.get(digest) ?? []), key]);
  }
  const executionByDigest = new Map(authority.acceptedExecutions.map((execution) => [execution.canonicalContentDigest, execution]));
  const roundTrips = authority.reconstruction.ledgers.flatMap((ledger) => ledger.flatToFlatRoundTrips.map((roundTrip) => ({ ledger, roundTrip })));
  const groups = new Map<string, RoundTripCandidate[]>();
  for (const candidate of roundTrips) groups.set(candidate.roundTrip.roundTripId, [...(groups.get(candidate.roundTrip.roundTripId) ?? []), candidate]);
  const inventoryKeys = new Set(authority.roundTripInventory?.roundTripKeys ?? []);
  const allRoundTripKeys = [...new Set([...groups.keys(), ...inventoryKeys])].sort(compareUnicodeCodePoints);
  const closedEligibility = authority.dependencies.eligibilitySet.results.find((result) => result.capability === "closed_trade_analytics");
  for (const key of allRoundTripKeys) {
    const candidates = groups.get(key) ?? [];
    if (candidates.length !== 1) {
      const count = candidates.length === 0 ? 1 : candidates.length;
      for (let index = 0; index < count; index += 1) exclusions.push(exclusion(`${key}:candidate:${String(index + 1)}`, key, candidates.length === 0 ? ANALYTICAL_EXCLUSION_REASONS.missingRoundTripInventory : ANALYTICAL_EXCLUSION_REASONS.duplicateCandidate, candidates[index]?.roundTrip.executionDigests ?? []));
      continue;
    }
    const { ledger, roundTrip } = candidates[0];
    if (!inventoryKeys.has(key)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingRoundTripInventory, roundTrip.executionDigests, [], ledger.currency)); continue; }
    if (closedEligibility === undefined || closedEligibility.state === "blocked") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityBlocked, roundTrip.executionDigests, [], ledger.currency, closedEligibility?.reasonCodes ?? [])); continue; }
    if (closedEligibility.state === "pending") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityPending, roundTrip.executionDigests, [], ledger.currency, closedEligibility.reasonCodes)); continue; }
    if (closedEligibility.state === "stale") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityStale, roundTrip.executionDigests, [], ledger.currency, closedEligibility.reasonCodes)); continue; }
    const executions = roundTrip.executionDigests.map((digest) => executionByDigest.get(digest));
    if (executions.some((execution) => execution === undefined)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingExecutionEvidence, roundTrip.executionDigests, [], ledger.currency)); continue; }
    const exactExecutions = executions as CanonicalExecutionEnvelope[];
    if (exactExecutions.some((execution) => execution.content.canonicalOwnerKey !== ledger.canonicalOwnerKey || execution.content.canonicalAccountKey !== ledger.canonicalAccountKey || execution.content.stableInstrumentKey !== ledger.stableInstrumentKey || execution.content.currency !== ledger.currency)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.catalogMismatch, roundTrip.executionDigests, [], ledger.currency)); continue; }
    if (exactExecutions.some((execution) => execution.content.stableInstrumentKey === null)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unresolvedInstrument, roundTrip.executionDigests, [], ledger.currency)); continue; }
    const occurrences = roundTrip.executionDigests.map((digest) => occurrenceByDigest.get(digest) ?? []);
    if (occurrences.some((keys) => keys.length !== 1)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingOccurrenceEvidence, roundTrip.executionDigests, occurrences.flat(), ledger.currency)); continue; }
    const ordering = orderCanonicalExecutions(exactExecutions);
    if (ordering.state !== "ordered" || ordering.economicallyOrderedExecutions === null) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unprovableOrder, roundTrip.executionDigests, occurrences.flat(), ledger.currency, ordering.reasonCodes)); continue; }
    const entrySide = roundTrip.direction === "long" ? "buy" : "sell";
    const exitSide = roundTrip.direction === "long" ? "sell" : "buy";
    const firstEntry = ordering.economicallyOrderedExecutions.find((execution) => execution.content.side === entrySide);
    const finalExit = [...ordering.economicallyOrderedExecutions].reverse().find((execution) => execution.content.side === exitSide);
    if (firstEntry === undefined || finalExit === undefined) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.catalogMismatch, roundTrip.executionDigests, occurrences.flat(), ledger.currency)); continue; }
    const session = resolveSessionFacts(finalExit.content.executedAt, authority.filter.timezone);
    if (!session.ok) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unprovableSession, roundTrip.executionDigests, occurrences.flat(), ledger.currency)); continue; }
    const symbolChanged = exactExecutions.some((execution) => execution.content.rawBrokerSymbol !== firstEntry.content.rawBrokerSymbol);
    if (!filterIncludesRow(authority.filter, { account: ledger.canonicalAccountKey, instrument: ledger.stableInstrumentKey, symbol: firstEntry.content.rawBrokerSymbol, direction: roundTrip.direction, currency: ledger.currency, finalExitAt: finalExit.content.executedAt, session: session.value, netPnl: roundTrip.netAnalyticalPnl }, authority.dependencies.eligibilitySet)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.filterExcluded, roundTrip.executionDigests, occurrences.flat(), ledger.currency)); continue; }
    const limitations = [...new Set([...(closedEligibility.state === "limited" ? closedEligibility.reasonCodes : []), ...ledger.limitations])].sort(compareUnicodeCodePoints);
    const notional = entryNotional(roundTrip, ledger.currency);
    if (notional.state === "unavailable") limitations.push(notional.reasonCode);
    preliminary.push({ candidateKey: key, firstEntry, rowInput: {
      schemaVersion: ANALYTICAL_ROW_VERSION, semanticRoundTripKey: key,
      supportingExecutionDigests: ordering.economicallyOrderedExecutions.map((execution) => execution.canonicalContentDigest),
      supportingOccurrenceKeys: ordering.economicallyOrderedExecutions.map((execution) => (occurrenceByDigest.get(execution.canonicalContentDigest) as string[])[0]),
      canonicalOwnerKey: ledger.canonicalOwnerKey, canonicalAccountKey: ledger.canonicalAccountKey,
      stableInstrumentKey: ledger.stableInstrumentKey, displayedSymbol: firstEntry.content.rawBrokerSymbol,
      displayedSymbolStatus: symbolChanged ? "non_authoritative_symbol_changed_first_entry_selected" : "non_authoritative_stable_symbol",
      direction: roundTrip.direction, currency: ledger.currency, firstEntryAt: firstEntry.content.executedAt,
      finalExitAt: finalExit.content.executedAt, timezone: authority.filter.timezone,
      dateBasis: "trade_close_date", sessionDate: session.value.sessionDate, weekday: session.value.weekday,
      session: session.value.session, sequenceInPartition: "0", grossPnl: roundTrip.grossRealizedPnl,
      signedCharges: roundTrip.signedCharges, netPnl: roundTrip.netAnalyticalPnl,
      entryNotional: notional, shareQuantity: { state: "available", quantity: roundTrip.entryQuantity },
      lifecycleState: "closed_flat_to_flat", coverageState: limitations.length === 0 ? "exact" : "limited",
      evidenceQuality: limitations.length === 0 ? "verified_exact" : "verified_exact_with_limitations",
      limitationCodes: [...new Set(limitations)].sort(compareUnicodeCodePoints),
    } });
  }
  authority.manifest.content.openPositions.forEach((position) => exclusions.push(exclusion(`open:${position.ledgerKey}`, null, ANALYTICAL_EXCLUSION_REASONS.openLifecycle, position.executionDigests)));
  authority.reconstruction.blockedStates.forEach((blocked, index) => exclusions.push(exclusion(`blocked:${blocked.code}:${blocked.executionDigest ?? "none"}:${String(index + 1)}`, null, blocked.code.includes("order") ? ANALYTICAL_EXCLUSION_REASONS.ambiguousReconstruction : ANALYTICAL_EXCLUSION_REASONS.blockedReconstruction, blocked.relatedExecutionDigests ?? (blocked.executionDigest === null ? [] : [blocked.executionDigest]), [], null, [blocked.code])));
  authority.manifest.content.exclusions.forEach((item) => exclusions.push(exclusion(`manifest:${item.evidenceDigest}`, null, ANALYTICAL_EXCLUSION_REASONS.openLifecycle, [], [], null, [item.reasonCode])));
  const partitions = new Map<string, PreliminaryRow[]>();
  for (const row of preliminary) {
    const partitionKey = `${String(row.rowInput.canonicalAccountKey)}:${String(row.rowInput.currency)}:${String(row.rowInput.sessionDate)}`;
    partitions.set(partitionKey, [...(partitions.get(partitionKey) ?? []), row]);
  }
  const rows = [];
  for (const partitionKey of [...partitions.keys()].sort(compareUnicodeCodePoints)) {
    const partition = partitions.get(partitionKey) as PreliminaryRow[];
    const ordering = orderCanonicalExecutions(partition.map((row) => row.firstEntry));
    if (partition.length > 1 && (ordering.state !== "ordered" || ordering.economicallyOrderedExecutions === null)) {
      partition.forEach((row) => exclusions.push(exclusion(row.candidateKey, row.candidateKey, ANALYTICAL_EXCLUSION_REASONS.unprovableOrder, row.rowInput.supportingExecutionDigests as CanonicalExecutionDigest[], row.rowInput.supportingOccurrenceKeys as string[], row.rowInput.currency as CurrencyCode, ordering.reasonCodes)));
      continue;
    }
    const orderedEntries = ordering.economicallyOrderedExecutions ?? partition.map((row) => row.firstEntry);
    for (let index = 0; index < orderedEntries.length; index += 1) {
      const row = partition.find((candidate) => candidate.firstEntry.canonicalContentDigest === orderedEntries[index].canonicalContentDigest);
      if (row === undefined) return failure("ti_v3_analytics_authority_mismatch", "$.sequence");
      const built = buildAnalyticalRow({ ...row.rowInput, sequenceInPartition: String(index + 1) });
      if (!built.ok) return failure("ti_v3_analytics_dataset_construction_failed", `$.rows.${built.error.path}`, built.error.code);
      rows.push(built.value);
    }
  }
  if (rows.length + exclusions.length > GA0_B1_CONTRACT_LIMITS.maximumRows) return failure("ti_v3_analytics_input_oversized", "$.candidates");
  const limitations = [...new Set([
    ...authority.manifest.content.reconstructionReasonCodes,
    ...authority.reconstruction.limitations,
    ...(closedEligibility?.state === "limited" ? closedEligibility.reasonCodes : []),
  ])].sort(compareUnicodeCodePoints);
  const dataset = buildAnalyticalDatasetReceipt({
    schemaVersion: ANALYTICAL_DATASET_VERSION, snapshotDigest: authority.snapshot.snapshotDigest,
    manifestDigest: authority.manifest.manifestDigest, filterDigest: authority.filter.filterDigest,
    analysisCutoffAt: authority.snapshot.analysisCutoffAt, correctionCutoffAt: authority.snapshot.correctionCutoffAt,
    correctionResultDigest: authority.correctionResult.correctionResultDigest,
    eligibilitySetDigest: authority.dependencies.eligibilitySet.eligibilitySetDigest,
    retrospectivePolicyDigest: authority.snapshot.retrospectivePolicyDigest,
    evidenceNamespace: authority.snapshot.evidenceNamespace,
    occurrenceInventoryDigest: authority.occurrenceInventory?.inventoryDigest ?? null,
    roundTripInventoryDigest: authority.roundTripInventory?.inventoryDigest ?? null,
    adapterKey: SNAPSHOT_READ_MODEL_ADAPTER_KEY, adapterVersion: SNAPSHOT_READ_MODEL_ADAPTER_VERSION,
    derivationPolicyKey: GA0_B1_DERIVATION_POLICY.policyKey,
    derivationPolicyVersion: GA0_B1_DERIVATION_POLICY.policyVersion,
    rows, excludedCandidates: exclusions, limitations,
  });
  return dataset.ok ? dataset : failure("ti_v3_analytics_dataset_construction_failed", dataset.error.path, dataset.error.code);
}

export function readAnalyticalDataset(
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<AnalyticalDatasetReceipt, SnapshotReadModelFailure> {
  let result: ReadOnlyAuthorityResult;
  try {
    result = source.readExactAuthority();
  } catch {
    return failure("ti_v3_analytics_source_unavailable", "$.source", "ti_v3_current_data_read_failed");
  }
  if (result.state === "unavailable") return failure("ti_v3_analytics_source_unavailable", "$.source", result.reasonCode);
  const authority = verifyAuthority(result.authority);
  return authority.ok ? deriveDataset(authority.value) : authority;
}

export function createSyntheticInMemoryReadOnlySource(
  authority: SnapshotReadModelAuthority,
): ReadOnlySnapshotAuthoritySource {
  const copied = Object.freeze({
    ...authority,
    correctionAuthority: Object.freeze({
      ...authority.correctionAuthority,
      baseActiveExecutionDigests: Object.freeze([...authority.correctionAuthority.baseActiveExecutionDigests]),
      availableExecutionCatalog: Object.freeze([...authority.correctionAuthority.availableExecutionCatalog]),
      corrections: Object.freeze([...authority.correctionAuthority.corrections]),
    }),
    acceptedExecutionCatalog: Object.freeze([...authority.acceptedExecutionCatalog]),
    startingInventories: Object.freeze([...authority.startingInventories]),
  });
  return Object.freeze({
    sourceKey: "ti_v3_synthetic_in_memory_exact_authority",
    sourceVersion: "v1",
    readExactAuthority: () => Object.freeze({ state: "available" as const, authority: copied }),
  });
}
