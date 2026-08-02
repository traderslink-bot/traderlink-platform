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
import { verifyCanonicalQueryFilter, verifyDateResolutionReceipt, type CanonicalQueryFilter, type DateResolutionReceipt } from "../../domain/query";
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
  startingInventoryManifestLedgerKey,
  verifyStartingInventoryContract,
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
import {
  ANALYTICAL_ROW_VERSION,
  buildAnalyticalRow,
  type AnalyticalRow,
  type ExactMoneyFact,
} from "../dataset/analytical-row";
import {
  GA0_B1_CONTRACT_LIMITS,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractKey,
  validateContractRecord,
} from "../contracts/contract-validation";
import { GA0_B1_DERIVATION_POLICY, resolveSessionFacts, type ResolvedSessionFacts } from "./session-policy";

export const SNAPSHOT_READ_MODEL_ADAPTER_KEY = "ti_v3_snapshot_read_model_adapter" as const;
export const SNAPSHOT_READ_MODEL_ADAPTER_VERSION = "v1" as const;
export const ANALYTICAL_DATASET_DERIVATION_VERSION =
  "ti_v3_analytical_dataset_derivation_v1" as const;

export interface AnalyticalDatasetDerivationReceipt {
  readonly schemaVersion: typeof ANALYTICAL_DATASET_DERIVATION_VERSION;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly manifestDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly correctionResultDigest: CanonicalContentDigest;
  readonly eligibilitySetDigest: CanonicalContentDigest;
  readonly retrospectivePolicyDigest: CanonicalContentDigest;
  readonly evidenceNamespace: string;
  readonly occurrenceInventoryDigest: CanonicalContentDigest | null;
  readonly roundTripInventoryDigest: CanonicalContentDigest | null;
  readonly adapterKey: typeof SNAPSHOT_READ_MODEL_ADAPTER_KEY;
  readonly adapterVersion: typeof SNAPSHOT_READ_MODEL_ADAPTER_VERSION;
  readonly derivationPolicyKey: typeof GA0_B1_DERIVATION_POLICY.policyKey;
  readonly derivationPolicyVersion: typeof GA0_B1_DERIVATION_POLICY.policyVersion;
  readonly exchangeCalendarPolicyKey: typeof GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyKey;
  readonly exchangeCalendarPolicyVersion: typeof GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyVersion;
  readonly derivationDigest: CanonicalContentDigest;
}

export interface DerivedAnalyticalDataset {
  readonly datasetReceipt: AnalyticalDatasetReceipt;
  readonly derivationReceipt: AnalyticalDatasetDerivationReceipt;
}

export interface SnapshotReadModelAuthority {
  readonly snapshot: unknown;
  readonly snapshotDependencies: AnalysisSnapshotDependencies;
  readonly dateResolutionReceipt: DateResolutionReceipt;
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
  /**
   * Optional compact activity projection from the same fixed authority source.
   * It exposes accepted broker facts only; analytical P/L still requires
   * readExactAuthority and the verified reconstruction path.
   */
  readonly readAcceptedExecutionActivity?: () => readonly CanonicalExecutionEnvelope[];
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
  readonly dateResolutionReceipt: DateResolutionReceipt;
  readonly correctionResult: CorrectionApplicationResult;
  readonly acceptedExecutions: readonly CanonicalExecutionEnvelope[];
  readonly relationshipResolution: CompleteExecutionRelationshipResolution;
  readonly reconstruction: AnalyticalPnlReconstructionResult;
  readonly occurrenceInventory: ExecutionOccurrenceEvidenceInventory | null;
  readonly roundTripInventory: RoundTripEvidenceInventory | null;
}

const verifiedDatasetDerivations =
  new WeakMap<AnalyticalDatasetDerivationReceipt, AnalyticalDatasetReceipt>();

function finalizeDatasetDerivation(
  dataset: AnalyticalDatasetReceipt,
): ExactResult<DerivedAnalyticalDataset, SnapshotReadModelFailure> {
  const result = finalizeContentAddressedAuthority("analytical_dataset_derivation", {
    schemaVersion: ANALYTICAL_DATASET_DERIVATION_VERSION,
    datasetReceiptDigest: dataset.receiptDigest,
    snapshotDigest: dataset.snapshotDigest,
    manifestDigest: dataset.manifestDigest,
    filterDigest: dataset.filterDigest,
    correctionResultDigest: dataset.correctionResultDigest,
    eligibilitySetDigest: dataset.eligibilitySetDigest,
    retrospectivePolicyDigest: dataset.retrospectivePolicyDigest,
    evidenceNamespace: dataset.evidenceNamespace,
    occurrenceInventoryDigest: dataset.occurrenceInventoryDigest,
    roundTripInventoryDigest: dataset.roundTripInventoryDigest,
    adapterKey: SNAPSHOT_READ_MODEL_ADAPTER_KEY,
    adapterVersion: SNAPSHOT_READ_MODEL_ADAPTER_VERSION,
    derivationPolicyKey: GA0_B1_DERIVATION_POLICY.policyKey,
    derivationPolicyVersion: GA0_B1_DERIVATION_POLICY.policyVersion,
    exchangeCalendarPolicyKey: GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyKey,
    exchangeCalendarPolicyVersion: GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyVersion,
  }, "derivationDigest");
  if (!result.ok) {
    return failure(
      "ti_v3_analytics_dataset_construction_failed",
      "$.derivationReceipt",
      result.error.code,
    );
  }
  const derivationReceipt = result.value as AnalyticalDatasetDerivationReceipt;
  verifiedDatasetDerivations.set(derivationReceipt, dataset);
  return {
    ok: true,
    value: Object.freeze({ datasetReceipt: dataset, derivationReceipt }),
  };
}

export function buildVerifiedAnalyticalDatasetDerivation(
  dataset: AnalyticalDatasetReceipt,
): ExactResult<DerivedAnalyticalDataset, SnapshotReadModelFailure> {
  return finalizeDatasetDerivation(dataset);
}

export function getVerifiedDerivedAnalyticalDataset(
  receipt: AnalyticalDatasetDerivationReceipt,
): AnalyticalDatasetReceipt | null {
  return verifiedDatasetDerivations.get(receipt) ?? null;
}

function verifyPersistedDatasetDerivationReceipt(
  input: unknown,
): ExactResult<AnalyticalDatasetDerivationReceipt, SnapshotReadModelFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "datasetReceiptDigest", "snapshotDigest", "manifestDigest",
    "filterDigest", "correctionResultDigest", "eligibilitySetDigest",
    "retrospectivePolicyDigest", "evidenceNamespace",
    "occurrenceInventoryDigest", "roundTripInventoryDigest", "adapterKey",
    "adapterVersion", "derivationPolicyKey", "derivationPolicyVersion",
    "exchangeCalendarPolicyKey", "exchangeCalendarPolicyVersion",
    "derivationDigest",
  ]);
  if (!record.ok || record.value.schemaVersion !== ANALYTICAL_DATASET_DERIVATION_VERSION) {
    return failure("ti_v3_analytics_authority_unverified", "$.derivationReceipt");
  }
  const requiredDigests = [
    ["datasetReceiptDigest", "analytical_dataset"],
    ["snapshotDigest", "analysis_snapshot"],
    ["manifestDigest", "dataset_manifest"],
    ["filterDigest", "canonical_filter"],
    ["correctionResultDigest", "correction_result"],
    ["eligibilitySetDigest", "eligibility_set"],
    ["retrospectivePolicyDigest", "retrospective_policy"],
  ] as const;
  const digests = new Map<string, CanonicalContentDigest>();
  for (const [field, domain] of requiredDigests) {
    const digest = validateClaimedDigest(
      record.value[field],
      `$.derivationReceipt.${field}`,
      domain,
    );
    if (!digest.ok) {
      return failure(
        "ti_v3_analytics_authority_unverified",
        `$.derivationReceipt.${field}`,
      );
    }
    digests.set(field, digest.value);
  }
  const nullableInventoryDigest = (
    field: "occurrenceInventoryDigest" | "roundTripInventoryDigest",
  ): ExactResult<CanonicalContentDigest | null, SnapshotReadModelFailure> => {
    if (record.value[field] === null) return { ok: true, value: null };
    const digest = validateClaimedDigest(
      record.value[field],
      `$.derivationReceipt.${field}`,
      "evidence_inventory",
    );
    return digest.ok
      ? { ok: true, value: digest.value }
      : failure(
        "ti_v3_analytics_authority_unverified",
        `$.derivationReceipt.${field}`,
      );
  };
  const occurrenceInventoryDigest = nullableInventoryDigest(
    "occurrenceInventoryDigest",
  );
  const roundTripInventoryDigest = nullableInventoryDigest(
    "roundTripInventoryDigest",
  );
  if (!occurrenceInventoryDigest.ok) return occurrenceInventoryDigest;
  if (!roundTripInventoryDigest.ok) return roundTripInventoryDigest;
  const evidenceNamespace = validateContractKey(
    record.value.evidenceNamespace,
    "$.derivationReceipt.evidenceNamespace",
  );
  if (
    !evidenceNamespace.ok ||
    !evidenceNamespace.value.startsWith("evidence:") ||
    record.value.adapterKey !== SNAPSHOT_READ_MODEL_ADAPTER_KEY ||
    record.value.adapterVersion !== SNAPSHOT_READ_MODEL_ADAPTER_VERSION ||
    record.value.derivationPolicyKey !== GA0_B1_DERIVATION_POLICY.policyKey ||
    record.value.derivationPolicyVersion !== GA0_B1_DERIVATION_POLICY.policyVersion ||
    record.value.exchangeCalendarPolicyKey !==
      GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyKey ||
    record.value.exchangeCalendarPolicyVersion !==
      GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyVersion
  ) {
    return failure("ti_v3_analytics_authority_unverified", "$.derivationReceipt");
  }
  const suppliedDigest = validateClaimedDigest(
    record.value.derivationDigest,
    "$.derivationReceipt.derivationDigest",
    "analytical_dataset_derivation",
  );
  if (!suppliedDigest.ok) {
    return failure(
      "ti_v3_analytics_authority_unverified",
      "$.derivationReceipt.derivationDigest",
    );
  }
  const rebuilt = finalizeContentAddressedAuthority(
    "analytical_dataset_derivation",
    {
      schemaVersion: ANALYTICAL_DATASET_DERIVATION_VERSION,
      datasetReceiptDigest: digests.get("datasetReceiptDigest") as CanonicalContentDigest,
      snapshotDigest: digests.get("snapshotDigest") as CanonicalContentDigest,
      manifestDigest: digests.get("manifestDigest") as CanonicalContentDigest,
      filterDigest: digests.get("filterDigest") as CanonicalContentDigest,
      correctionResultDigest: digests.get("correctionResultDigest") as CanonicalContentDigest,
      eligibilitySetDigest: digests.get("eligibilitySetDigest") as CanonicalContentDigest,
      retrospectivePolicyDigest: digests.get("retrospectivePolicyDigest") as CanonicalContentDigest,
      evidenceNamespace: evidenceNamespace.value,
      occurrenceInventoryDigest: occurrenceInventoryDigest.value,
      roundTripInventoryDigest: roundTripInventoryDigest.value,
      adapterKey: SNAPSHOT_READ_MODEL_ADAPTER_KEY,
      adapterVersion: SNAPSHOT_READ_MODEL_ADAPTER_VERSION,
      derivationPolicyKey: GA0_B1_DERIVATION_POLICY.policyKey,
      derivationPolicyVersion: GA0_B1_DERIVATION_POLICY.policyVersion,
      exchangeCalendarPolicyKey: GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyKey,
      exchangeCalendarPolicyVersion: GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyVersion,
    },
    "derivationDigest",
  );
  if (
    !rebuilt.ok ||
    rebuilt.value.derivationDigest !== suppliedDigest.value
  ) {
    return failure(
      "ti_v3_analytics_authority_mismatch",
      "$.derivationReceipt.derivationDigest",
    );
  }
  return {
    ok: true,
    value: rebuilt.value as AnalyticalDatasetDerivationReceipt,
  };
}

function sameDatasetDerivationReceipt(
  left: AnalyticalDatasetDerivationReceipt,
  right: AnalyticalDatasetDerivationReceipt,
): boolean {
  const fields: readonly (keyof AnalyticalDatasetDerivationReceipt)[] = [
    "schemaVersion", "datasetReceiptDigest", "snapshotDigest", "manifestDigest",
    "filterDigest", "correctionResultDigest", "eligibilitySetDigest",
    "retrospectivePolicyDigest", "evidenceNamespace",
    "occurrenceInventoryDigest", "roundTripInventoryDigest", "adapterKey",
    "adapterVersion", "derivationPolicyKey", "derivationPolicyVersion",
    "exchangeCalendarPolicyKey", "exchangeCalendarPolicyVersion",
    "derivationDigest",
  ];
  return fields.every((field) => left[field] === right[field]);
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
  if (filter.dateBasis !== "trade_close_date") return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.dateBasis");
  if (
    !((filter.timeBasis === "utc" && filter.timezone === "UTC") ||
      ((filter.timeBasis === "exchange_local" || filter.timeBasis === "owner_local") && filter.timezone === "America/New_York"))
  ) return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.timezone");
  if ((filter.timezone === "UTC" && filter.calendarBasis !== "calendar_day") || (filter.timezone === "America/New_York" && filter.calendarBasis !== "trading_session")) return failure("ti_v3_analytics_filter_unsupported", "$.canonicalFilter.calendarBasis");
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
  const dateResolutionReceipt = verifyDateResolutionReceipt(input.dateResolutionReceipt);
  if (!manifest.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.manifest");
  if (!filter.ok) return failure("ti_v3_analytics_authority_unverified", "$.snapshotDependencies.filter");
  if (!dateResolutionReceipt.ok || dateResolutionReceipt.value.receiptDigest !== filter.value.dateResolutionReceiptDigest) return failure("ti_v3_analytics_authority_mismatch", "$.dateResolutionReceipt");
  if (
    filter.value.timezone === "America/New_York" &&
    (
      dateResolutionReceipt.value.calendarPolicyKey !== GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyKey ||
      dateResolutionReceipt.value.calendarPolicyVersion !== GA0_B1_DERIVATION_POLICY.exchangeCalendarPolicyVersion
    )
  ) return failure("ti_v3_analytics_authority_unverified", "$.dateResolutionReceipt.calendarPolicy");
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
    const verifiedInventory = verifyStartingInventoryContract(input.startingInventories[index]);
    if (!verifiedInventory.ok) return failure("ti_v3_analytics_authority_unverified", `$.startingInventories[${index}]`);
    startingInventories.push(verifiedInventory.value);
  }
  const manifestInventories = new Map(manifest.value.content.priorInventory.map((entry) => [entry.ledgerKey, entry]));
  const suppliedInventoryKeys = startingInventories.map((inventory) => startingInventoryManifestLedgerKey(inventory.ledgerIdentity));
  if (
    new Set(suppliedInventoryKeys).size !== suppliedInventoryKeys.length ||
    suppliedInventoryKeys.length !== manifestInventories.size ||
    startingInventories.some((inventory) => {
      const manifestInventory = manifestInventories.get(startingInventoryManifestLedgerKey(inventory.ledgerIdentity));
      return manifestInventory === undefined ||
        manifestInventory.state !== inventory.state ||
        manifestInventory.contractDigest !== inventory.contractDigest;
    })
  ) return failure("ti_v3_analytics_authority_mismatch", "$.startingInventories");
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
    snapshot: snapshot.value, dependencies, manifest: manifest.value, filter: filter.value, dateResolutionReceipt: dateResolutionReceipt.value,
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

interface ExclusionLedgerScope {
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string;
  readonly currency: CurrencyCode;
}

function ledgerExclusionScope(
  ledger: Pick<
    AnalyticalLedgerResult,
    "canonicalOwnerKey" | "canonicalAccountKey" | "stableInstrumentKey" | "currency"
  >,
): ExclusionLedgerScope {
  return Object.freeze({
    canonicalOwnerKey: ledger.canonicalOwnerKey,
    canonicalAccountKey: ledger.canonicalAccountKey,
    stableInstrumentKey: ledger.stableInstrumentKey,
    currency: ledger.currency,
  });
}

function exclusion(
  candidateKey: string,
  semanticRoundTripKey: string | null,
  reasonCode: string,
  executions: readonly CanonicalExecutionDigest[] = [],
  occurrences: readonly string[] = [],
  scope: ExclusionLedgerScope | null = null,
  limitations: readonly string[] = [],
  sourceReasonCode: string | null = null,
): ExcludedAnalyticalCandidate {
  const authority = sourceReasonCode !== null
    ? "manifest"
    : reasonCode === ANALYTICAL_EXCLUSION_REASONS.filterExcluded
      ? "canonical_filter"
      : reasonCode === ANALYTICAL_EXCLUSION_REASONS.openLifecycle
        ? "lifecycle"
        : reasonCode.includes("reconstruction")
          ? "reconstruction"
          : reasonCode.includes("eligibility")
            ? "eligibility"
            : "read_model";
  return Object.freeze({
    candidateKey,
    semanticRoundTripKey,
    scopeState: scope === null ? "global_unassigned" as const : "ledger_scoped" as const,
    canonicalOwnerKey: scope?.canonicalOwnerKey ?? null,
    canonicalAccountKey: scope?.canonicalAccountKey ?? null,
    stableInstrumentKey: scope?.stableInstrumentKey ?? null,
    reasonCode,
    sourceReasonCode,
    secondaryReasonCodes: Object.freeze([]),
    sourceReasonCodes: Object.freeze(sourceReasonCode === null ? [] : [sourceReasonCode]),
    reasonLedgerPolicyKey: "ti_v3_analytical_exclusion_reason_ledger" as const,
    reasonLedgerPolicyVersion: "v1" as const,
    reasonAuthorities: Object.freeze([Object.freeze({
      reasonCode,
      authority,
      sourceReasonCode,
      mappingPolicyKey: sourceReasonCode === null
        ? null
        : "ti_v3_manifest_exclusion_reason_mapping",
      mappingPolicyVersion: sourceReasonCode === null ? null : "v1",
    })]),
    reasonMappingPolicyKey: "ti_v3_manifest_exclusion_reason_mapping" as const,
    reasonMappingPolicyVersion: "v1" as const,
    limitationCodes: Object.freeze([...new Set(limitations)].sort(compareUnicodeCodePoints)),
    relatedExecutionDigests: Object.freeze([...new Set(executions)].sort(compareUnicodeCodePoints)),
    relatedOccurrenceKeys: Object.freeze([...new Set(occurrences)].sort(compareUnicodeCodePoints)),
    currency: scope?.currency ?? null,
  });
}

function mapManifestExclusionReason(sourceReasonCode: string): string {
  if (sourceReasonCode.includes("open_position") || sourceReasonCode.includes("lifecycle")) return ANALYTICAL_EXCLUSION_REASONS.openLifecycle;
  if (sourceReasonCode.includes("correction")) return ANALYTICAL_EXCLUSION_REASONS.eligibilityIncompatible;
  if (sourceReasonCode.includes("coverage") || sourceReasonCode.includes("reconstruction")) return ANALYTICAL_EXCLUSION_REASONS.blockedReconstruction;
  return ANALYTICAL_EXCLUSION_REASONS.manifestExcluded;
}

function semanticExclusionIdentity(candidate: ExcludedAnalyticalCandidate): string {
  if (candidate.semanticRoundTripKey !== null) return `round_trip:${candidate.semanticRoundTripKey}`;
  if (candidate.relatedExecutionDigests.length > 0) return `executions:${candidate.relatedExecutionDigests.join(":")}`;
  return `candidate:${candidate.candidateKey}`;
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
  if (
    filter.sessionFilters.length > 0 &&
    (
      input.session.session === "not_applicable" ||
      !filter.sessionFilters.includes(input.session.session)
    )
  ) return false;
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
  const scopeForExecutionDigests = (
    digests: readonly CanonicalExecutionDigest[],
  ): ExclusionLedgerScope | null => {
    if (digests.length === 0) return null;
    const executions = digests.map((digest) => executionByDigest.get(digest));
    if (
      executions.some((execution) => execution === undefined) ||
      executions.some((execution) => execution?.content.stableInstrumentKey === null)
    ) return null;
    const first = executions[0] as CanonicalExecutionEnvelope;
    if (
      executions.some((execution) =>
        execution?.content.canonicalOwnerKey !== first.content.canonicalOwnerKey ||
        execution.content.canonicalAccountKey !== first.content.canonicalAccountKey ||
        execution.content.stableInstrumentKey !== first.content.stableInstrumentKey ||
        execution.content.currency !== first.content.currency)
    ) return null;
    return Object.freeze({
      canonicalOwnerKey: first.content.canonicalOwnerKey,
      canonicalAccountKey: first.content.canonicalAccountKey,
      stableInstrumentKey: first.content.stableInstrumentKey as string,
      currency: first.content.currency,
    });
  };
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
      for (let index = 0; index < count; index += 1) {
        const candidate = candidates[index];
        exclusions.push(exclusion(
          `${key}:candidate:${String(index + 1)}`,
          key,
          candidates.length === 0
            ? ANALYTICAL_EXCLUSION_REASONS.missingRoundTripInventory
            : ANALYTICAL_EXCLUSION_REASONS.duplicateCandidate,
          candidate?.roundTrip.executionDigests ?? [],
          [],
          candidate === undefined ? null : ledgerExclusionScope(candidate.ledger),
        ));
      }
      continue;
    }
    const { ledger, roundTrip } = candidates[0];
    const ledgerScope = ledgerExclusionScope(ledger);
    if (!inventoryKeys.has(key)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingRoundTripInventory, roundTrip.executionDigests, [], ledgerScope)); continue; }
    if (closedEligibility === undefined || closedEligibility.state === "blocked") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityBlocked, roundTrip.executionDigests, [], ledgerScope, closedEligibility?.reasonCodes ?? [])); continue; }
    if (closedEligibility.state === "pending") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityPending, roundTrip.executionDigests, [], ledgerScope, closedEligibility.reasonCodes)); continue; }
    if (closedEligibility.state === "stale") { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.eligibilityStale, roundTrip.executionDigests, [], ledgerScope, closedEligibility.reasonCodes)); continue; }
    const executions = roundTrip.executionDigests.map((digest) => executionByDigest.get(digest));
    if (executions.some((execution) => execution === undefined)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingExecutionEvidence, roundTrip.executionDigests, [], ledgerScope)); continue; }
    const exactExecutions = executions as CanonicalExecutionEnvelope[];
    if (exactExecutions.some((execution) => execution.content.canonicalOwnerKey !== ledger.canonicalOwnerKey || execution.content.canonicalAccountKey !== ledger.canonicalAccountKey || execution.content.stableInstrumentKey !== ledger.stableInstrumentKey || execution.content.currency !== ledger.currency)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.catalogMismatch, roundTrip.executionDigests, [], ledgerScope)); continue; }
    if (exactExecutions.some((execution) => execution.content.stableInstrumentKey === null)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unresolvedInstrument, roundTrip.executionDigests, [], ledgerScope)); continue; }
    const occurrences = roundTrip.executionDigests.map((digest) => occurrenceByDigest.get(digest) ?? []);
    if (occurrences.some((keys) => keys.length !== 1)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.missingOccurrenceEvidence, roundTrip.executionDigests, occurrences.flat(), ledgerScope)); continue; }
    const ordering = orderCanonicalExecutions(exactExecutions);
    if (ordering.state !== "ordered" || ordering.economicallyOrderedExecutions === null) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unprovableOrder, roundTrip.executionDigests, occurrences.flat(), ledgerScope, ordering.reasonCodes)); continue; }
    const entrySide = roundTrip.direction === "long" ? "buy" : "sell";
    const exitSide = roundTrip.direction === "long" ? "sell" : "buy";
    const firstEntry = ordering.economicallyOrderedExecutions.find((execution) => execution.content.side === entrySide);
    const finalExit = [...ordering.economicallyOrderedExecutions].reverse().find((execution) => execution.content.side === exitSide);
    if (firstEntry === undefined || finalExit === undefined) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.catalogMismatch, roundTrip.executionDigests, occurrences.flat(), ledgerScope)); continue; }
    const entrySession = resolveSessionFacts(firstEntry.content.executedAt, authority.filter.timezone, authority.dateResolutionReceipt);
    const exitSession = resolveSessionFacts(finalExit.content.executedAt, authority.filter.timezone, authority.dateResolutionReceipt);
    if (!entrySession.ok || !exitSession.ok) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.unprovableSession, roundTrip.executionDigests, occurrences.flat(), ledgerScope)); continue; }
    const symbolChanged = exactExecutions.some((execution) => execution.content.rawBrokerSymbol !== firstEntry.content.rawBrokerSymbol);
    const firstSource = exactExecutions[0].content;
    const uniformSourceAuthority = exactExecutions.every((execution) =>
      execution.content.sourceIdentity === firstSource.sourceIdentity &&
      execution.content.sourceKind === firstSource.sourceKind &&
      execution.content.sourceSystem === firstSource.sourceSystem &&
      execution.content.brokerCode === firstSource.brokerCode &&
      execution.content.evidenceClass === firstSource.evidenceClass,
    );
    const sourceAuthority = uniformSourceAuthority
      ? {
          state: "available" as const,
          sourceIdentity: firstSource.sourceIdentity,
          sourceKind: firstSource.sourceKind,
          sourceSystem: firstSource.sourceSystem,
          brokerCode: firstSource.brokerCode,
          evidenceClass: firstSource.evidenceClass,
        }
      : {
          state: "unavailable" as const,
          reasonCode: "ti_v3_analytics_mixed_source_authority",
        };
    if (!filterIncludesRow(authority.filter, { account: ledger.canonicalAccountKey, instrument: ledger.stableInstrumentKey, symbol: firstEntry.content.rawBrokerSymbol, direction: roundTrip.direction, currency: ledger.currency, finalExitAt: finalExit.content.executedAt, session: exitSession.value, netPnl: roundTrip.netAnalyticalPnl }, authority.dependencies.eligibilitySet)) { exclusions.push(exclusion(key, key, ANALYTICAL_EXCLUSION_REASONS.filterExcluded, roundTrip.executionDigests, occurrences.flat(), ledgerScope)); continue; }
    const limitations = [...new Set([...(closedEligibility.state === "limited" ? closedEligibility.reasonCodes : []), ...ledger.limitations])].sort(compareUnicodeCodePoints);
    const notional = entryNotional(roundTrip, ledger.currency);
    if (notional.state === "unavailable") limitations.push(notional.reasonCode);
    if (sourceAuthority.state === "unavailable") limitations.push(sourceAuthority.reasonCode);
    if (exactExecutions.some((execution) => execution.content.evidenceClass === "migrated_unverified")) {
      limitations.push("ti_v3_analytics_legacy_migration_limited");
    }
    if (exactExecutions.some((execution) => execution.content.chargeCoverageState !== "complete")) {
      limitations.push("ti_v3_analytics_charge_coverage_unknown");
    }
    if (exactExecutions.some((execution) => execution.content.basisContinuityState !== "resolved")) {
      limitations.push("ti_v3_analytics_instrument_basis_limited");
    }
    preliminary.push({ candidateKey: key, firstEntry, rowInput: {
      schemaVersion: ANALYTICAL_ROW_VERSION, semanticRoundTripKey: key,
      supportingExecutionDigests: ordering.economicallyOrderedExecutions.map((execution) => execution.canonicalContentDigest),
      supportingOccurrenceKeys: ordering.economicallyOrderedExecutions.map((execution) => (occurrenceByDigest.get(execution.canonicalContentDigest) as string[])[0]),
      canonicalOwnerKey: ledger.canonicalOwnerKey, canonicalAccountKey: ledger.canonicalAccountKey,
      stableInstrumentKey: ledger.stableInstrumentKey, displayedSymbol: firstEntry.content.rawBrokerSymbol,
      displayedSymbolStatus: symbolChanged ? "non_authoritative_symbol_changed_first_entry_selected" : "non_authoritative_stable_symbol",
      direction: roundTrip.direction, sourceAuthority, currency: ledger.currency, firstEntryAt: firstEntry.content.executedAt,
      finalExitAt: finalExit.content.executedAt, timezone: authority.filter.timezone,
      dateBasis: "trade_close_date", sessionDate: exitSession.value.sessionDate, weekday: exitSession.value.weekday,
      entrySession: entrySession.value.session, exitSession: exitSession.value.session,
      session: exitSession.value.session, sequenceInPartition: "0", grossPnl: roundTrip.grossRealizedPnl,
      signedCharges: roundTrip.signedCharges,
      signedChargesByKind: roundTrip.signedChargesByKind,
      chargeKindCoverageState: roundTrip.chargeKindCoverageState,
      netPnl: roundTrip.netAnalyticalPnl,
      entryNotional: notional, shareQuantity: { state: "available", quantity: roundTrip.entryQuantity },
      lifecycleState: "closed_flat_to_flat", coverageState: limitations.length === 0 ? "exact" : "limited",
      evidenceQuality: limitations.length === 0 ? "verified_exact" : "verified_exact_with_limitations",
      limitationCodes: [...new Set(limitations)].sort(compareUnicodeCodePoints),
    } });
  }
  for (const position of authority.manifest.content.openPositions) {
    const positionScope = scopeForExecutionDigests(position.executionDigests);
    const [account, instrument, currency] = position.ledgerKey.split(":");
    if (
      positionScope === null ||
      positionScope.canonicalOwnerKey !== authority.manifest.content.canonicalOwnerKey ||
      positionScope.canonicalAccountKey !== account ||
      positionScope.stableInstrumentKey !== instrument ||
      positionScope.currency.toLowerCase() !== currency
    ) return failure("ti_v3_analytics_authority_mismatch", "$.manifest.openPositions");
    const positionExecutionSet = new Set(position.executionDigests);
    for (const reconstructed of roundTrips) {
      const reconstructedExecutionSet = new Set(
        reconstructed.roundTrip.executionDigests,
      );
      const overlaps = position.executionDigests.some((digest) =>
        reconstructedExecutionSet.has(digest));
      if (!overlaps) continue;
      const isExactExecutionSet =
        positionExecutionSet.size === reconstructedExecutionSet.size &&
        [...positionExecutionSet].every((digest) =>
          reconstructedExecutionSet.has(digest));
      if (!isExactExecutionSet) {
        return failure(
          "ti_v3_analytics_authority_mismatch",
          "$.candidateAccounting.partialOverlap",
        );
      }
    }
    exclusions.push(exclusion(
      `open:${position.ledgerKey}`,
      null,
      ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
      position.executionDigests,
      [],
      positionScope,
    ));
  }
  authority.reconstruction.blockedStates.forEach((blocked, index) => {
    const digests = blocked.relatedExecutionDigests ??
      (blocked.executionDigest === null ? [] : [blocked.executionDigest]);
    exclusions.push(exclusion(
      `blocked:${blocked.code}:${blocked.executionDigest ?? "none"}:${String(index + 1)}`,
      null,
      blocked.code.includes("order")
        ? ANALYTICAL_EXCLUSION_REASONS.ambiguousReconstruction
        : ANALYTICAL_EXCLUSION_REASONS.blockedReconstruction,
      digests,
      [],
      scopeForExecutionDigests(digests),
      [blocked.code],
    ));
  });
  authority.manifest.content.exclusions.forEach((item) => {
    const digests = String(item.evidenceDigest).startsWith(
      "ti_v3:canonical_execution:",
    )
      ? [item.evidenceDigest as CanonicalExecutionDigest]
      : [];
    exclusions.push(exclusion(
    `manifest:${item.evidenceDigest}`,
    null,
    mapManifestExclusionReason(item.reasonCode),
    digests,
    [],
    scopeForExecutionDigests(digests),
    [item.reasonCode],
    item.reasonCode,
    ));
  });
  const partitions = new Map<string, PreliminaryRow[]>();
  for (const row of preliminary) {
    const partitionKey = `${String(row.rowInput.canonicalAccountKey)}:${String(row.rowInput.currency)}:${String(row.rowInput.sessionDate)}`;
    partitions.set(partitionKey, [...(partitions.get(partitionKey) ?? []), row]);
  }
  const rows: AnalyticalRow[] = [];
  for (const partitionKey of [...partitions.keys()].sort(compareUnicodeCodePoints)) {
    const partition = partitions.get(partitionKey) as PreliminaryRow[];
    const ordering = orderCanonicalExecutions(partition.map((row) => row.firstEntry));
    if (partition.length > 1 && (ordering.state !== "ordered" || ordering.economicallyOrderedExecutions === null)) {
      partition.forEach((row) => exclusions.push(exclusion(
        row.candidateKey,
        row.candidateKey,
        ANALYTICAL_EXCLUSION_REASONS.unprovableOrder,
        row.rowInput.supportingExecutionDigests as CanonicalExecutionDigest[],
        row.rowInput.supportingOccurrenceKeys as string[],
        {
          canonicalOwnerKey: row.rowInput.canonicalOwnerKey as string,
          canonicalAccountKey: row.rowInput.canonicalAccountKey as string,
          stableInstrumentKey: row.rowInput.stableInstrumentKey as string,
          currency: row.rowInput.currency as CurrencyCode,
        },
        ordering.reasonCodes,
      )));
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
  const mappedExclusions: ExcludedAnalyticalCandidate[] = [];
  for (const candidate of exclusions) {
    if (candidate.semanticRoundTripKey === null) {
      mappedExclusions.push(candidate);
      continue;
    }
    if (candidate.relatedExecutionDigests.length === 0) {
      mappedExclusions.push(candidate);
      continue;
    }
    const keyedRoundTrips = roundTrips.filter(
      (item) =>
        item.roundTrip.roundTripId === candidate.semanticRoundTripKey,
    );
    const overlappingRoundTrips = keyedRoundTrips.length > 0
      ? keyedRoundTrips
      : roundTrips.filter((item) =>
          candidate.relatedExecutionDigests.some((digest) =>
            item.roundTrip.executionDigests.includes(digest)));
    if (overlappingRoundTrips.length === 0) {
      mappedExclusions.push(candidate);
      continue;
    }
    if (overlappingRoundTrips.length !== 1) {
      return failure(
        "ti_v3_analytics_authority_mismatch",
        "$.candidateAccounting.ambiguousOverlap",
      );
    }
    const reconstructed = overlappingRoundTrips[0];
    const candidateExecutionSet = new Set(candidate.relatedExecutionDigests);
    const reconstructedExecutionSet = new Set(
      reconstructed.roundTrip.executionDigests,
    );
    const exactExecutionSet =
      candidateExecutionSet.size === reconstructedExecutionSet.size &&
      [...candidateExecutionSet].every((digest) =>
        reconstructedExecutionSet.has(digest));
    if (candidate.sourceReasonCode === null && !exactExecutionSet) {
      return failure(
        "ti_v3_analytics_authority_mismatch",
        "$.candidateAccounting.partialOverlap",
      );
    }
    const row = rows.find(
      (item) =>
        item.semanticRoundTripKey === reconstructed.roundTrip.roundTripId,
    );
    const semanticKey = reconstructed.roundTrip.roundTripId;
    const executionDigests = reconstructed.roundTrip.executionDigests;
    const occurrenceKeys = row?.supportingOccurrenceKeys ??
      executionDigests.flatMap((digest) =>
        occurrenceByDigest.get(digest) ?? []);
    mappedExclusions.push(exclusion(
      semanticKey,
      semanticKey,
      candidate.reasonCode,
      executionDigests,
      occurrenceKeys,
      ledgerExclusionScope(reconstructed.ledger),
      candidate.limitationCodes,
      candidate.sourceReasonCode,
    ));
  }
  const precedence = [
    ANALYTICAL_EXCLUSION_REASONS.blockedReconstruction,
    ANALYTICAL_EXCLUSION_REASONS.ambiguousReconstruction,
    ANALYTICAL_EXCLUSION_REASONS.eligibilityBlocked,
    ANALYTICAL_EXCLUSION_REASONS.eligibilityPending,
    ANALYTICAL_EXCLUSION_REASONS.eligibilityStale,
    ANALYTICAL_EXCLUSION_REASONS.eligibilityIncompatible,
    ANALYTICAL_EXCLUSION_REASONS.openLifecycle,
    ANALYTICAL_EXCLUSION_REASONS.filterExcluded,
    ANALYTICAL_EXCLUSION_REASONS.manifestExcluded,
  ] as const;
  const precedenceIndex = (reasonCode: string): number => {
    const index = precedence.indexOf(reasonCode as typeof precedence[number]);
    return index < 0 ? precedence.length : index;
  };
  const grouped = new Map<string, ExcludedAnalyticalCandidate[]>();
  for (const candidate of mappedExclusions) {
    const identity = semanticExclusionIdentity(candidate);
    grouped.set(identity, [...(grouped.get(identity) ?? []), candidate]);
  }
  for (const candidates of grouped.values()) {
    const ledgerScopeKeys = new Set(
      candidates
        .filter((candidate) => candidate.scopeState === "ledger_scoped")
        .map((candidate) => [
          candidate.canonicalOwnerKey,
          candidate.canonicalAccountKey,
          candidate.stableInstrumentKey,
          candidate.currency,
        ].join(":")),
    );
    if (ledgerScopeKeys.size > 1) {
      return failure(
        "ti_v3_analytics_authority_mismatch",
        "$.candidateAccounting.scope",
      );
    }
  }
  // 2026-07-23 America/Toronto: exclusion identity has one deterministic
  // primary outcome while retaining every accepted reason and provenance row.
  const deduplicatedExclusions = [...grouped.values()].map((candidates) => {
    const ordered = [...candidates].sort((left, right) => {
      const precedenceDifference =
        precedenceIndex(left.reasonCode) - precedenceIndex(right.reasonCode);
      return precedenceDifference !== 0
        ? precedenceDifference
        : compareUnicodeCodePoints(left.reasonCode, right.reasonCode);
    });
    const primary = ordered[0];
    const allReasons = [...new Set(ordered.map((candidate) => candidate.reasonCode))]
      .sort((left, right) => {
        const difference = precedenceIndex(left) - precedenceIndex(right);
        return difference !== 0 ? difference : compareUnicodeCodePoints(left, right);
      });
    const sourceReasons = [...new Set(
      ordered.flatMap((candidate) => candidate.sourceReasonCodes),
    )].sort(compareUnicodeCodePoints);
    const reasonAuthorities = [...new Map(
      ordered
        .flatMap((candidate) => candidate.reasonAuthorities)
        .map((item) => [
          `${item.reasonCode}:${item.authority}:${item.sourceReasonCode ?? ""}:${item.mappingPolicyKey ?? ""}:${item.mappingPolicyVersion ?? ""}`,
          item,
        ]),
    ).values()].sort((left, right) =>
      compareUnicodeCodePoints(
        `${left.reasonCode}:${left.authority}:${left.sourceReasonCode ?? ""}`,
        `${right.reasonCode}:${right.authority}:${right.sourceReasonCode ?? ""}`,
      ));
    const ledgerScoped = ordered.find(
      (candidate) => candidate.scopeState === "ledger_scoped",
    );
    return Object.freeze({
      ...primary,
      candidateKey: ordered
        .map((candidate) => candidate.candidateKey)
        .sort(compareUnicodeCodePoints)[0],
      sourceReasonCode: sourceReasons[0] ?? null,
      secondaryReasonCodes: Object.freeze(allReasons.slice(1)),
      sourceReasonCodes: Object.freeze(sourceReasons),
      reasonAuthorities: Object.freeze(reasonAuthorities),
      limitationCodes: Object.freeze([...new Set(
        ordered.flatMap((candidate) => candidate.limitationCodes),
      )].sort(compareUnicodeCodePoints)),
      relatedExecutionDigests: Object.freeze([...new Set(
        ordered.flatMap((candidate) => candidate.relatedExecutionDigests),
      )].sort(compareUnicodeCodePoints)),
      relatedOccurrenceKeys: Object.freeze([...new Set(
        ordered.flatMap((candidate) => candidate.relatedOccurrenceKeys),
      )].sort(compareUnicodeCodePoints)),
      scopeState: ledgerScoped === undefined
        ? "global_unassigned" as const
        : "ledger_scoped" as const,
      canonicalOwnerKey: ledgerScoped?.canonicalOwnerKey ?? null,
      canonicalAccountKey: ledgerScoped?.canonicalAccountKey ?? null,
      stableInstrumentKey: ledgerScoped?.stableInstrumentKey ?? null,
      currency: ledgerScoped?.currency ?? null,
    });
  }).sort((left, right) => compareUnicodeCodePoints(left.candidateKey, right.candidateKey));
  const excludedRoundTrips = new Set(deduplicatedExclusions.flatMap((candidate) => candidate.semanticRoundTripKey === null ? [] : [candidate.semanticRoundTripKey]));
  const includedRows = rows.filter((row) => !excludedRoundTrips.has(row.semanticRoundTripKey));
  if (includedRows.length + deduplicatedExclusions.length > GA0_B1_CONTRACT_LIMITS.maximumRows) return failure("ti_v3_analytics_input_oversized", "$.candidates");
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
    rows: includedRows, excludedCandidates: deduplicatedExclusions, limitations,
  });
  return dataset.ok ? dataset : failure("ti_v3_analytics_dataset_construction_failed", dataset.error.path, dataset.error.code);
}

export function readAnalyticalDataset(
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<AnalyticalDatasetReceipt, SnapshotReadModelFailure> {
  const derived = readAnalyticalDatasetWithDerivation(source);
  return derived.ok ? { ok: true, value: derived.value.datasetReceipt } : derived;
}

export function readAnalyticalDatasetWithDerivation(
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<DerivedAnalyticalDataset, SnapshotReadModelFailure> {
  let result: ReadOnlyAuthorityResult;
  try {
    result = source.readExactAuthority();
  } catch {
    return failure("ti_v3_analytics_source_unavailable", "$.source", "ti_v3_current_data_read_failed");
  }
  if (result.state === "unavailable") return failure("ti_v3_analytics_source_unavailable", "$.source", result.reasonCode);
  try {
    const authority = verifyAuthority(result.authority);
    if (!authority.ok) return authority;
    const dataset = deriveDataset(authority.value);
    return dataset.ok ? finalizeDatasetDerivation(dataset.value) : dataset;
  } catch {
    return failure("ti_v3_analytics_authority_unverified", "$.source.authority");
  }
}

// 2026-07-23 America/Toronto: persisted derivation receipts re-enter only by
// replaying the exact read-model authority and matching the complete receipt.
export function rehydrateAnalyticalDatasetDerivation(
  persisted: unknown,
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<DerivedAnalyticalDataset, SnapshotReadModelFailure> {
  const replayed = readAnalyticalDatasetWithDerivation(source);
  if (!replayed.ok) return replayed;
  const supplied = verifyPersistedDatasetDerivationReceipt(persisted);
  if (
    !supplied.ok ||
    !sameDatasetDerivationReceipt(
      supplied.value,
      replayed.value.derivationReceipt,
    )
  ) return failure("ti_v3_analytics_authority_mismatch", "$.derivationReceipt");
  return replayed;
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
