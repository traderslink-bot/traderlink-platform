import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import { verifyAnalysisSnapshot, type AnalysisSnapshot, type AnalysisSnapshotDependencies } from "../../domain/snapshot";
import { verifyCanonicalQueryFilter, type CanonicalQueryFilter } from "../../domain/query";
import { verifyAnalyticalDatasetReceipt, type AnalyticalDatasetReceipt } from "../dataset";
import {
  verifyAnalyticalPartitionReceipt,
  type AnalyticalPartitionReceipt,
} from "../dataset/analytical-partition";
import {
  getVerifiedDerivedAnalyticalDataset,
  type AnalyticalDatasetDerivationReceipt,
} from "../adapters/snapshot-read-model";
import {
  verifyNormalizedAnalysisArguments,
  verifyToolRegistryEntry,
  type NormalizedAnalysisArguments,
  type ToolRegistryEntry,
} from "../registry";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "./contract-validation";

export const ANALYSIS_RUN_CONTEXT_VERSION = "ti_v3_analysis_run_context_v1" as const;

export interface AnalysisRunContext {
  readonly schemaVersion: typeof ANALYSIS_RUN_CONTEXT_VERSION;
  readonly toolKey: string;
  readonly toolVersion: string;
  readonly registryEntryDigest: CanonicalContentDigest;
  readonly toolPolicyKey: string;
  readonly toolPolicyVersion: string;
  readonly requiredEligibilityCapability: string;
  readonly argumentSchemaDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly partitionDigest: CanonicalContentDigest;
  readonly partitionCurrency: string;
  readonly normalizedArgumentsDigest: CanonicalContentDigest;
  readonly eligibilityState: "eligible" | "limited" | "blocked";
  readonly runContextDigest: CanonicalContentDigest;
}

export interface AnalysisRunContextDependencies {
  readonly snapshot: AnalysisSnapshot;
  readonly snapshotDependencies: AnalysisSnapshotDependencies;
  readonly canonicalFilter: CanonicalQueryFilter;
  readonly datasetReceipt: AnalyticalDatasetReceipt;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly partitionReceipt: AnalyticalPartitionReceipt;
  readonly normalizedArguments: NormalizedAnalysisArguments;
  readonly registryEntry: ToolRegistryEntry;
}

const verifiedRunContextDependencies = new WeakMap<AnalysisRunContext, AnalysisRunContextDependencies>();

export function getAnalysisRunContextDependencies(
  context: AnalysisRunContext,
): AnalysisRunContextDependencies | null {
  return verifiedRunContextDependencies.get(context) ?? null;
}

export function buildAnalysisRunContext(
  input: unknown,
): ExactResult<AnalysisRunContext, AnalyticalContractFailure> {
  const record = validateContractRecord(input, [
    "schemaVersion", "snapshot", "snapshotDependencies", "canonicalFilter",
    "datasetReceipt", "datasetDerivationReceipt", "partitionReceipt",
    "normalizedArguments", "registryEntry",
  ]);
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYSIS_RUN_CONTEXT_VERSION) return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  const authorities = input as Record<string, unknown>;
  const dependencies = authorities.snapshotDependencies as AnalysisSnapshotDependencies;
  const snapshot = verifyAnalysisSnapshot(authorities.snapshot, dependencies);
  if (!snapshot.ok) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.snapshot");
  const filter = verifyCanonicalQueryFilter(authorities.canonicalFilter);
  if (!filter.ok) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.canonicalFilter");
  const dataset = verifyAnalyticalDatasetReceipt(authorities.datasetReceipt);
  if (!dataset.ok) return contractFailure(dataset.error.code, `$.datasetReceipt${dataset.error.path.slice(1)}`);
  const derivedDataset = getVerifiedDerivedAnalyticalDataset(
    authorities.datasetDerivationReceipt as AnalyticalDatasetDerivationReceipt,
  );
  if (
    derivedDataset === null ||
    derivedDataset.receiptDigest !== dataset.value.receiptDigest
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.datasetDerivationReceipt");
  const partition = verifyAnalyticalPartitionReceipt(
    authorities.partitionReceipt,
    dataset.value,
  );
  if (!partition.ok) {
    return contractFailure(
      partition.error.code,
      `$.partitionReceipt${partition.error.path.slice(1)}`,
    );
  }
  const normalizedArguments = verifyNormalizedAnalysisArguments(authorities.normalizedArguments);
  if (!normalizedArguments.ok) return contractFailure(normalizedArguments.error.code, `$.normalizedArguments${normalizedArguments.error.path.slice(1)}`);
  const registryEntry = verifyToolRegistryEntry(authorities.registryEntry);
  if (!registryEntry.ok) return contractFailure(registryEntry.error.code, `$.registryEntry${registryEntry.error.path.slice(1)}`);
  if (
    snapshot.value.canonicalFilter.filterDigest !== filter.value.filterDigest ||
    snapshot.value.filterDigest !== filter.value.filterDigest ||
    dataset.value.snapshotDigest !== snapshot.value.snapshotDigest ||
    dataset.value.filterDigest !== filter.value.filterDigest ||
    dataset.value.manifestDigest !== snapshot.value.manifestDigest ||
    dataset.value.eligibilitySetDigest !== snapshot.value.eligibilitySetDigest ||
    dataset.value.correctionResultDigest !== snapshot.value.correctionResultDigest ||
    dataset.value.retrospectivePolicyDigest !== snapshot.value.retrospectivePolicyDigest ||
    dataset.value.evidenceNamespace !== snapshot.value.evidenceNamespace ||
    dataset.value.occurrenceInventoryDigest !== (dependencies.occurrenceInventory?.inventoryDigest ?? null) ||
    dataset.value.roundTripInventoryDigest !== (dependencies.roundTripInventory?.inventoryDigest ?? null) ||
    dataset.value.adapterKey !== "ti_v3_snapshot_read_model_adapter" ||
    dataset.value.adapterVersion !== "v1" ||
    dataset.value.derivationPolicyKey !== "ti_v3_closed_round_trip_read_model" ||
    dataset.value.derivationPolicyVersion !== "v1" ||
    dataset.value.analysisCutoffAt !== snapshot.value.analysisCutoffAt ||
    dataset.value.correctionCutoffAt !== snapshot.value.correctionCutoffAt
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.datasetReceipt");
  if (normalizedArguments.value.argumentSchemaDigest !== registryEntry.value.argumentSchemaDigest) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.normalizedArguments.argumentSchemaDigest");
  if (!registryEntry.value.supportedTimezones.includes(filter.value.timezone)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.canonicalFilter.timezone");
  if (!registryEntry.value.supportedCurrencies.includes(partition.value.currency)) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.partitionReceipt.currency");
  const includedRowKeys = new Set(partition.value.includedRowKeys);
  const partitionRows = dataset.value.rows.filter((row) =>
    includedRowKeys.has(row.semanticRoundTripKey));
  const rowProperty = (field: string): string => field.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
  if (
    registryEntry.value.requiredRowFields.some((field) =>
      partitionRows.some((row) => !(rowProperty(field) in row)))
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.registryEntry.requiredRowFields");
  const eligibility = dependencies.eligibilitySet.results.find((result) => result.capability === registryEntry.value.requiredEligibilityCapability);
  if (
    eligibility === undefined ||
    (
      eligibility.state !== "eligible" &&
      eligibility.state !== "limited" &&
      eligibility.state !== "blocked"
    )
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.registryEntry.requiredEligibilityCapability");
  const eligibilityState =
    eligibility.state === "blocked" || partition.value.includedCount === "0"
      ? "blocked" as const
      : eligibility.state;
  if (
    (eligibility.state === "blocked" && partition.value.includedCount !== "0") ||
    (eligibilityState === "blocked" && partition.value.excludedCount === "0")
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.partitionReceipt");
  const result = finalizeContentAddressedAuthority("analysis_run_context", {
    schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION,
    toolKey: registryEntry.value.toolKey,
    toolVersion: registryEntry.value.toolVersion,
    registryEntryDigest: registryEntry.value.entryDigest,
    toolPolicyKey: registryEntry.value.toolPolicyKey,
    toolPolicyVersion: registryEntry.value.toolPolicyVersion,
    requiredEligibilityCapability: registryEntry.value.requiredEligibilityCapability,
    argumentSchemaDigest: registryEntry.value.argumentSchemaDigest,
    snapshotDigest: snapshot.value.snapshotDigest,
    filterDigest: filter.value.filterDigest,
    datasetReceiptDigest: dataset.value.receiptDigest,
    partitionDigest: partition.value.partitionDigest,
    partitionCurrency: partition.value.currency,
    normalizedArgumentsDigest: normalizedArguments.value.argumentsDigest,
    eligibilityState,
  }, "runContextDigest") as ExactResult<AnalysisRunContext, AnalyticalContractFailure>;
  if (!result.ok) return result;
  verifiedRunContextDependencies.set(result.value, Object.freeze({
    snapshot: snapshot.value,
    snapshotDependencies: dependencies,
    canonicalFilter: filter.value,
    datasetReceipt: dataset.value,
    datasetDerivationReceipt: authorities.datasetDerivationReceipt as AnalyticalDatasetDerivationReceipt,
    partitionReceipt: partition.value,
    normalizedArguments: normalizedArguments.value,
    registryEntry: registryEntry.value,
  }));
  return result;
}

export function verifyAnalysisRunContext(
  input: unknown,
  dependencies?: AnalysisRunContextDependencies,
): ExactResult<AnalysisRunContext, AnalyticalContractFailure> {
  if (typeof input === "object" && input !== null) {
    const knownDependencies = verifiedRunContextDependencies.get(input as AnalysisRunContext);
    if (knownDependencies !== undefined && dependencies === undefined) return { ok: true, value: input as AnalysisRunContext };
  }
  if (dependencies === undefined) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.dependencies");
  const record = validateContractRecord(input, [
    "schemaVersion", "toolKey", "toolVersion", "registryEntryDigest", "toolPolicyKey", "toolPolicyVersion", "requiredEligibilityCapability", "argumentSchemaDigest", "snapshotDigest",
    "filterDigest", "datasetReceiptDigest", "partitionDigest", "partitionCurrency",
    "normalizedArgumentsDigest",
    "eligibilityState", "runContextDigest",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(record.value.runContextDigest, "$.runContextDigest", "analysis_run_context");
  if (!digest.ok) return digest;
  const rebuilt = buildAnalysisRunContext({ schemaVersion: ANALYSIS_RUN_CONTEXT_VERSION, ...dependencies });
  if (!rebuilt.ok || rebuilt.value.runContextDigest !== digest.value) return contractFailure("ti_v3_analytics_contract_digest_mismatch", "$.runContextDigest");
  return rebuilt;
}
