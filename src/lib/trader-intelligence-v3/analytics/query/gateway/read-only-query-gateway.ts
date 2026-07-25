import type { ExactResult } from "../../../domain/exact";
import {
  readAnalyticalDatasetWithDerivation,
  getVerifiedDerivedAnalyticalDataset,
  type DerivedAnalyticalDataset,
  type ReadOnlySnapshotAuthoritySource,
} from "../../adapters";
import {
  contractFailure,
  type AnalyticalContractFailure,
} from "../../contracts";
import {
  verifyAnalyticalDatasetReceipt,
  verifyAnalyticalPartitionReceipt,
  type AnalyticalPartitionReceipt,
  type AnalyticalRow,
  type ExcludedAnalyticalCandidate,
} from "../../dataset";
import type { TradeQueryAuthority, TradeQueryPlan } from "../contracts/query-plan";

export interface VerifiedTradeQueryDatasetSource {
  readonly sourceKey: string;
  readonly sourceVersion: string;
  readonly readVerifiedDataset: () => ExactResult<DerivedAnalyticalDataset, {
    readonly code: string;
    readonly path: string;
  }>;
}

export interface ReadOnlyTradeQueryGateway {
  readonly gatewayKey: "ti_v3_read_only_trade_query_gateway";
  readonly gatewayVersion: "v1";
  readonly authority: TradeQueryAuthority;
  readonly readBoundedRows: (
    plan: TradeQueryPlan,
  ) => ExactResult<Readonly<{
    readonly rows: readonly AnalyticalRow[];
    readonly excludedCandidates: readonly ExcludedAnalyticalCandidate[];
  }>, AnalyticalContractFailure>;
}

export function createSnapshotTradeQueryDatasetSource(
  source: ReadOnlySnapshotAuthoritySource,
): VerifiedTradeQueryDatasetSource {
  return Object.freeze({
    sourceKey: source.sourceKey,
    sourceVersion: source.sourceVersion,
    readVerifiedDataset: () => readAnalyticalDatasetWithDerivation(source),
  });
}

export function createInMemoryVerifiedTradeQueryDatasetSource(
  derived: DerivedAnalyticalDataset,
): VerifiedTradeQueryDatasetSource {
  return Object.freeze({
    sourceKey: "ti_v3_verified_in_memory_query_dataset",
    sourceVersion: "v1",
    readVerifiedDataset: () => ({ ok: true as const, value: derived }),
  });
}

function sameAuthority(plan: TradeQueryPlan, authority: TradeQueryAuthority): boolean {
  return (
    plan.authority.snapshotDigest === authority.datasetReceipt.snapshotDigest &&
    plan.authority.canonicalFilterDigest === authority.datasetReceipt.filterDigest &&
    plan.authority.datasetReceiptDigest === authority.datasetReceipt.receiptDigest &&
    plan.authority.datasetDerivationDigest === authority.datasetDerivationReceipt.derivationDigest &&
    plan.authority.partitionDigest === authority.partitionReceipt.partitionDigest &&
    plan.authority.currency === authority.partitionReceipt.currency
  );
}

export function openReadOnlyTradeQueryGateway(
  source: VerifiedTradeQueryDatasetSource,
  partitionInput: unknown,
): ExactResult<ReadOnlyTradeQueryGateway, AnalyticalContractFailure> {
  let read: ReturnType<VerifiedTradeQueryDatasetSource["readVerifiedDataset"]>;
  try {
    read = source.readVerifiedDataset();
  } catch {
    return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.gateway.source");
  }
  if (!read.ok) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.gateway.source");
  const knownDataset = getVerifiedDerivedAnalyticalDataset(read.value.derivationReceipt);
  const dataset = knownDataset?.receiptDigest === read.value.datasetReceipt.receiptDigest
    ? { ok: true as const, value: knownDataset }
    : verifyAnalyticalDatasetReceipt(read.value.datasetReceipt);
  if (!dataset.ok) return dataset;
  if (
    read.value.derivationReceipt.datasetReceiptDigest !== dataset.value.receiptDigest ||
    read.value.derivationReceipt.snapshotDigest !== dataset.value.snapshotDigest ||
    read.value.derivationReceipt.filterDigest !== dataset.value.filterDigest
  ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.gateway.derivationReceipt");
  const knownPartition = verifyAnalyticalPartitionReceipt(
    partitionInput as AnalyticalPartitionReceipt,
  );
  const partition = knownPartition.ok
    ? knownPartition
    : verifyAnalyticalPartitionReceipt(
        partitionInput as AnalyticalPartitionReceipt,
        dataset.value,
      );
  if (!partition.ok) return partition;
  const authority = Object.freeze({
    datasetReceipt: dataset.value,
    datasetDerivationReceipt: read.value.derivationReceipt,
    partitionReceipt: partition.value,
  });
  const included = new Set(partition.value.includedRowKeys);
  const excluded = new Set(partition.value.excludedCandidateKeys);
  const partitionRows = Object.freeze(
    dataset.value.rows.filter((row) => included.has(row.semanticRoundTripKey)),
  );
  const partitionExclusions = Object.freeze(
    dataset.value.excludedCandidates.filter((candidate) => excluded.has(candidate.candidateKey)),
  );
  const gateway: ReadOnlyTradeQueryGateway = Object.freeze({
    gatewayKey: "ti_v3_read_only_trade_query_gateway",
    gatewayVersion: "v1",
    authority,
    readBoundedRows: (plan: TradeQueryPlan) => {
      if (!sameAuthority(plan, authority)) {
        return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.queryPlan.authority");
      }
      if (
        partitionRows.some((row) =>
          row.currency !== partition.value.currency ||
          !partition.value.ownerScope.includes(row.canonicalOwnerKey) ||
          !partition.value.accountScope.includes(row.canonicalAccountKey))
      ) return contractFailure("ti_v3_analytics_contract_reference_mismatch", "$.gateway.partition");
      return {
        ok: true as const,
        value: Object.freeze({
          rows: partitionRows,
          excludedCandidates: partitionExclusions,
        }),
      };
    },
  });
  return { ok: true, value: gateway };
}
