import { createCanonicalContentIdentity, type CanonicalContentDigest } from "../../../domain/identity";
import type { CurrencyCode, ExactResult } from "../../../domain/exact";
import {
  contractFailure,
  finalizeContentAddressedAuthority,
  type AnalyticalContractFailure,
} from "../../contracts";
import type { AnalyticalDatasetDerivationReceipt } from "../../adapters";
import type { AnalyticalDatasetReceipt, AnalyticalPartitionReceipt } from "../../dataset";
import type { WeekdayAnalysisExecutionWithoutAuthority } from "./weekday-analysis";
import { WEEKDAY_TOOL_KEY, WEEKDAY_TOOL_VERSION } from "./weekday-policy";

export const WEEKDAY_EXECUTION_AUTHORITY_VERSION =
  "ti_v3_weekday_execution_authority_v1" as const;

export interface WeekdayExecutionAuthority {
  readonly schemaVersion: typeof WEEKDAY_EXECUTION_AUTHORITY_VERSION;
  readonly toolKey: typeof WEEKDAY_TOOL_KEY;
  readonly toolVersion: typeof WEEKDAY_TOOL_VERSION;
  readonly partitionCurrency: CurrencyCode;
  readonly datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt;
  readonly normalizedArgumentsDigest: CanonicalContentDigest;
  readonly registryEntryDigest: CanonicalContentDigest;
  readonly runContextDigest: CanonicalContentDigest;
  readonly selectedRowKeys: readonly string[];
  readonly selectedExclusionKeys: readonly string[];
  readonly payloadDigest: CanonicalContentDigest;
  readonly authorityDigest: CanonicalContentDigest;
}

export function buildWeekdayExecutionAuthority(
  execution: WeekdayAnalysisExecutionWithoutAuthority,
  datasetDerivationReceipt: AnalyticalDatasetDerivationReceipt,
  datasetReceipt: AnalyticalDatasetReceipt,
  partitionReceipt: AnalyticalPartitionReceipt,
): ExactResult<WeekdayExecutionAuthority, AnalyticalContractFailure> {
  const payloadIdentity = createCanonicalContentIdentity(
    "weekday_execution_payload",
    "v1",
    execution,
  );
  if (!payloadIdentity.ok) {
    return contractFailure(payloadIdentity.error.code, payloadIdentity.error.path);
  }
  const selectedRows = datasetReceipt.rows
    .filter((row) => partitionReceipt.includedRowKeys.includes(row.semanticRoundTripKey))
    .map((row) => row.semanticRoundTripKey);
  const selectedExclusions = datasetReceipt.excludedCandidates
    .filter((candidate) => partitionReceipt.excludedCandidateKeys.includes(candidate.candidateKey))
    .map((candidate) => candidate.candidateKey);
  const result = finalizeContentAddressedAuthority(
    "weekday_execution_authority",
    {
      schemaVersion: WEEKDAY_EXECUTION_AUTHORITY_VERSION,
      toolKey: WEEKDAY_TOOL_KEY,
      toolVersion: WEEKDAY_TOOL_VERSION,
      partitionCurrency: partitionReceipt.currency,
      datasetDerivationReceipt,
      normalizedArgumentsDigest: execution.normalizedArguments.argumentsDigest,
      registryEntryDigest: execution.registryEntry.entryDigest,
      runContextDigest: execution.runContext.runContextDigest,
      selectedRowKeys: selectedRows,
      selectedExclusionKeys: selectedExclusions,
      payloadDigest: payloadIdentity.value.identifier,
    },
    "authorityDigest",
  );
  return result as ExactResult<WeekdayExecutionAuthority, AnalyticalContractFailure>;
}
