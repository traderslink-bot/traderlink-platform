import { serializeCanonicalValue } from "../../../domain/canonical";
import type { ExactResult } from "../../../domain/exact";
import {
  rehydrateAnalyticalDatasetDerivation,
  type ReadOnlySnapshotAuthoritySource,
} from "../../adapters";
import {
  buildAnalyticalPartitionReceipt,
  ANALYTICAL_PARTITION_VERSION,
} from "../../dataset";
import {
  contractFailure,
  validateContractRecord,
  type AnalyticalContractFailure,
} from "../../contracts";
import {
  WEEKDAY_EXECUTION_AUTHORITY_VERSION,
  type WeekdayExecutionAuthority,
} from "./weekday-execution-authority-contract";
import {
  executeWeekdayAnalysis,
  type WeekdayAnalysisExecution,
} from "./weekday-analysis";
import { WEEKDAY_TOOL_KEY, WEEKDAY_TOOL_VERSION } from "./weekday-policy";

const EXECUTION_KEYS = Object.freeze([
  "normalizedArguments",
  "registryEntry",
  "runContext",
  "evidenceBundles",
  "tables",
  "claims",
  "series",
  "diagnostics",
  "receipt",
  "executionAuthority",
]);

const AUTHORITY_KEYS = Object.freeze([
  "schemaVersion",
  "toolKey",
  "toolVersion",
  "partitionCurrency",
  "datasetDerivationReceipt",
  "normalizedArgumentsDigest",
  "registryEntryDigest",
  "runContextDigest",
  "selectedRowKeys",
  "selectedExclusionKeys",
  "payloadDigest",
  "authorityDigest",
]);

function replayFailure(path: string): ExactResult<never, AnalyticalContractFailure> {
  return contractFailure("ti_v3_analytics_contract_reference_mismatch", path);
}

/**
 * Persisted weekday output is untrusted. It becomes usable only after the exact
 * B1 authority is replayed and the complete protected B2 graph matches.
 */
export function rehydrateWeekdayAnalysisExecution(
  persisted: unknown,
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<WeekdayAnalysisExecution, AnalyticalContractFailure> {
  const canonicalPersisted = serializeCanonicalValue(persisted);
  if (!canonicalPersisted.ok) {
    return contractFailure(
      canonicalPersisted.error.code,
      canonicalPersisted.error.path,
    );
  }
  const executionRecord = validateContractRecord(persisted, EXECUTION_KEYS);
  if (!executionRecord.ok) return executionRecord;
  const authorityRecord = validateContractRecord(
    executionRecord.value.executionAuthority,
    AUTHORITY_KEYS,
    [],
    "$.executionAuthority",
  );
  if (
    !authorityRecord.ok ||
    authorityRecord.value.schemaVersion !== WEEKDAY_EXECUTION_AUTHORITY_VERSION ||
    authorityRecord.value.toolKey !== WEEKDAY_TOOL_KEY ||
    authorityRecord.value.toolVersion !== WEEKDAY_TOOL_VERSION
  ) {
    return replayFailure("$.executionAuthority");
  }
  const authority = authorityRecord.value as unknown as WeekdayExecutionAuthority;

  let sourceResult: ReturnType<ReadOnlySnapshotAuthoritySource["readExactAuthority"]>;
  try {
    sourceResult = source.readExactAuthority();
  } catch {
    return replayFailure("$.source");
  }
  if (sourceResult.state !== "available") return replayFailure("$.source");
  const fixedSource: ReadOnlySnapshotAuthoritySource = Object.freeze({
    sourceKey: source.sourceKey,
    sourceVersion: source.sourceVersion,
    readExactAuthority: () => sourceResult,
  });
  const dataset = rehydrateAnalyticalDatasetDerivation(
    authority.datasetDerivationReceipt,
    fixedSource,
  );
  if (!dataset.ok) return replayFailure("$.executionAuthority.datasetDerivationReceipt");
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: ANALYTICAL_PARTITION_VERSION,
    datasetReceipt: dataset.value.datasetReceipt,
    currency: authority.partitionCurrency,
  });
  if (!partition.ok) return replayFailure("$.executionAuthority.partitionCurrency");

  const replayed = executeWeekdayAnalysis({
    snapshot: sourceResult.authority.snapshot,
    snapshotDependencies: sourceResult.authority.snapshotDependencies,
    canonicalFilter: sourceResult.authority.snapshotDependencies.filter,
    datasetReceipt: dataset.value.datasetReceipt,
    datasetDerivationReceipt: dataset.value.derivationReceipt,
    partitionReceipt: partition.value,
    arguments: executionRecord.value.normalizedArguments &&
      typeof executionRecord.value.normalizedArguments === "object"
      ? (executionRecord.value.normalizedArguments as { values?: unknown }).values
      : undefined,
  });
  if (!replayed.ok) return replayed;
  const canonicalReplayed = serializeCanonicalValue(replayed.value);
  if (
    !canonicalReplayed.ok ||
    canonicalReplayed.value.json !== canonicalPersisted.value.json
  ) {
    return replayFailure("$");
  }
  return replayed;
}
