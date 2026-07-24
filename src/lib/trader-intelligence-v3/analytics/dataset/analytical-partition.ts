import { compareUnicodeCodePoints } from "../../domain/canonical";
import { parseCurrencyCode, type CurrencyCode, type ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  validateClaimedDigest,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../contracts/contract-validation";
import {
  verifyAnalyticalDatasetReceipt,
  type AnalyticalDatasetReceipt,
} from "./analytical-dataset";

export const ANALYTICAL_PARTITION_VERSION =
  "ti_v3_analytical_partition_v1" as const;

export interface AnalyticalPartitionReceipt {
  readonly schemaVersion: typeof ANALYTICAL_PARTITION_VERSION;
  readonly datasetReceiptDigest: CanonicalContentDigest;
  readonly snapshotDigest: CanonicalContentDigest;
  readonly filterDigest: CanonicalContentDigest;
  readonly currency: CurrencyCode;
  readonly partitionScopePolicyKey: "ti_v3_currency_partition_scope";
  readonly partitionScopePolicyVersion: "v1";
  readonly globalExclusionPolicyKey: "ti_v3_global_exclusion_blocks_currency_partition";
  readonly globalExclusionPolicyVersion: "v1";
  readonly ownerScope: readonly string[];
  readonly accountScope: readonly string[];
  readonly instrumentScope: readonly string[];
  readonly includedRowKeys: readonly string[];
  readonly excludedCandidateKeys: readonly string[];
  readonly includedCount: string;
  readonly excludedCount: string;
  readonly candidateCount: string;
  readonly limitationCodes: readonly string[];
  readonly partitionDigest: CanonicalContentDigest;
}

const verifiedPartitionDatasets =
  new WeakMap<AnalyticalPartitionReceipt, AnalyticalDatasetReceipt>();

export function getAnalyticalPartitionDataset(
  partition: AnalyticalPartitionReceipt,
): AnalyticalDatasetReceipt | null {
  return verifiedPartitionDatasets.get(partition) ?? null;
}

export function buildAnalyticalPartitionReceipt(
  input: unknown,
): ExactResult<AnalyticalPartitionReceipt, AnalyticalContractFailure> {
  const record = validateContractRecord(
    input,
    ["schemaVersion", "datasetReceipt", "currency"],
  );
  if (!record.ok) return record;
  if (record.value.schemaVersion !== ANALYTICAL_PARTITION_VERSION) {
    return contractFailure("ti_v3_analytics_contract_invalid", "$.schemaVersion");
  }
  const dataset = verifyAnalyticalDatasetReceipt(record.value.datasetReceipt);
  if (!dataset.ok) {
    return contractFailure(
      dataset.error.code,
      `$.datasetReceipt${dataset.error.path.slice(1)}`,
    );
  }
  const currency = parseCurrencyCode(record.value.currency);
  if (!currency.ok || !dataset.value.currencyPartitions.includes(currency.value)) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.currency",
    );
  }
  if (dataset.value.globalExcludedCandidateKeys.length > 0) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.datasetReceipt.globalExcludedCandidateKeys",
    );
  }
  const rows = dataset.value.rows.filter((row) => row.currency === currency.value);
  const exclusions = dataset.value.excludedCandidates.filter(
    (candidate) =>
      candidate.scopeState === "ledger_scoped" &&
      candidate.currency === currency.value,
  );
  if (rows.length === 0 && exclusions.length === 0) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.currency",
    );
  }
  const ownerScope = [...new Set([
    ...rows.map((row) => row.canonicalOwnerKey),
    ...exclusions.map((candidate) => candidate.canonicalOwnerKey as string),
  ])].sort(compareUnicodeCodePoints);
  const accountScope = [...new Set([
    ...rows.map((row) => row.canonicalAccountKey),
    ...exclusions.map((candidate) => candidate.canonicalAccountKey as string),
  ])].sort(compareUnicodeCodePoints);
  const instrumentScope = [...new Set([
    ...rows.map((row) => row.stableInstrumentKey),
    ...exclusions.map((candidate) => candidate.stableInstrumentKey as string),
  ])].sort(compareUnicodeCodePoints);
  const limitationCodes = [...new Set([
    ...dataset.value.limitations,
    ...rows.flatMap((row) => row.limitationCodes),
    ...exclusions.flatMap((candidate) => candidate.limitationCodes),
  ])].sort(compareUnicodeCodePoints);
  const result = finalizeContentAddressedAuthority("analytical_partition", {
    schemaVersion: ANALYTICAL_PARTITION_VERSION,
    datasetReceiptDigest: dataset.value.receiptDigest,
    snapshotDigest: dataset.value.snapshotDigest,
    filterDigest: dataset.value.filterDigest,
    currency: currency.value,
    partitionScopePolicyKey: "ti_v3_currency_partition_scope" as const,
    partitionScopePolicyVersion: "v1" as const,
    globalExclusionPolicyKey: dataset.value.globalExclusionPolicyKey,
    globalExclusionPolicyVersion: dataset.value.globalExclusionPolicyVersion,
    ownerScope,
    accountScope,
    instrumentScope,
    includedRowKeys: rows
      .map((row) => row.semanticRoundTripKey)
      .sort(compareUnicodeCodePoints),
    excludedCandidateKeys: exclusions
      .map((candidate) => candidate.candidateKey)
      .sort(compareUnicodeCodePoints),
    includedCount: String(rows.length),
    excludedCount: String(exclusions.length),
    candidateCount: String(rows.length + exclusions.length),
    limitationCodes,
  }, "partitionDigest") as ExactResult<
    AnalyticalPartitionReceipt,
    AnalyticalContractFailure
  >;
  if (result.ok) verifiedPartitionDatasets.set(result.value, dataset.value);
  return result;
}

export function verifyAnalyticalPartitionReceipt(
  input: unknown,
  datasetReceipt?: AnalyticalDatasetReceipt,
): ExactResult<AnalyticalPartitionReceipt, AnalyticalContractFailure> {
  if (typeof input === "object" && input !== null) {
    const knownDataset = verifiedPartitionDatasets.get(
      input as AnalyticalPartitionReceipt,
    );
    if (knownDataset !== undefined && datasetReceipt === undefined) {
      return { ok: true, value: input as AnalyticalPartitionReceipt };
    }
  }
  if (datasetReceipt === undefined) {
    return contractFailure(
      "ti_v3_analytics_contract_reference_mismatch",
      "$.datasetReceipt",
    );
  }
  const record = validateContractRecord(input, [
    "schemaVersion", "datasetReceiptDigest", "snapshotDigest", "filterDigest",
    "currency", "partitionScopePolicyKey", "partitionScopePolicyVersion",
    "globalExclusionPolicyKey", "globalExclusionPolicyVersion",
    "ownerScope", "accountScope", "instrumentScope",
    "includedRowKeys", "excludedCandidateKeys",
    "includedCount", "excludedCount", "candidateCount", "limitationCodes",
    "partitionDigest",
  ]);
  if (!record.ok) return record;
  const digest = validateClaimedDigest(
    record.value.partitionDigest,
    "$.partitionDigest",
    "analytical_partition",
  );
  if (!digest.ok) return digest;
  const rebuilt = buildAnalyticalPartitionReceipt({
    schemaVersion: ANALYTICAL_PARTITION_VERSION,
    datasetReceipt,
    currency: record.value.currency,
  });
  const sameStrings = (
    supplied: unknown,
    expected: readonly string[],
  ): boolean => Array.isArray(supplied) &&
    supplied.length === expected.length &&
    supplied.every((value, index) => value === expected[index]);
  if (
    !rebuilt.ok ||
    rebuilt.value.partitionDigest !== digest.value ||
    record.value.schemaVersion !== rebuilt.value.schemaVersion ||
    record.value.datasetReceiptDigest !== rebuilt.value.datasetReceiptDigest ||
    record.value.snapshotDigest !== rebuilt.value.snapshotDigest ||
    record.value.filterDigest !== rebuilt.value.filterDigest ||
    record.value.currency !== rebuilt.value.currency ||
    record.value.partitionScopePolicyKey !== rebuilt.value.partitionScopePolicyKey ||
    record.value.partitionScopePolicyVersion !== rebuilt.value.partitionScopePolicyVersion ||
    record.value.globalExclusionPolicyKey !== rebuilt.value.globalExclusionPolicyKey ||
    record.value.globalExclusionPolicyVersion !== rebuilt.value.globalExclusionPolicyVersion ||
    !sameStrings(record.value.ownerScope, rebuilt.value.ownerScope) ||
    !sameStrings(record.value.accountScope, rebuilt.value.accountScope) ||
    !sameStrings(record.value.instrumentScope, rebuilt.value.instrumentScope) ||
    !sameStrings(record.value.includedRowKeys, rebuilt.value.includedRowKeys) ||
    !sameStrings(record.value.excludedCandidateKeys, rebuilt.value.excludedCandidateKeys) ||
    record.value.includedCount !== rebuilt.value.includedCount ||
    record.value.excludedCount !== rebuilt.value.excludedCount ||
    record.value.candidateCount !== rebuilt.value.candidateCount ||
    !sameStrings(record.value.limitationCodes, rebuilt.value.limitationCodes)
  ) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.partitionDigest",
    );
  }
  return rebuilt;
}
