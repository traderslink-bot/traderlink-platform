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
  readonly accountScope: readonly string[];
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
  const rows = dataset.value.rows.filter((row) => row.currency === currency.value);
  const exclusions = dataset.value.excludedCandidates.filter(
    (candidate) => candidate.currency === currency.value,
  );
  const accountScope = [...new Set(rows.map((row) => row.canonicalAccountKey))]
    .sort(compareUnicodeCodePoints);
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
    accountScope,
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
    "currency", "accountScope", "includedRowKeys", "excludedCandidateKeys",
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
  if (!rebuilt.ok || rebuilt.value.partitionDigest !== digest.value) {
    return contractFailure(
      "ti_v3_analytics_contract_digest_mismatch",
      "$.partitionDigest",
    );
  }
  return rebuilt;
}
