import type { ExactResult } from "../domain/exact";
import {
  createCanonicalContentIdentity,
  type CanonicalContentDigest,
  type CanonicalExecutionDigest,
  type CanonicalSourceDocumentDigest,
} from "../domain/identity";
import {
  buildPersistedExecutionLifecycleProjection,
  type PersistedExecutionLifecycleProjection,
} from "./persisted-execution-lifecycle-projection";
import {
  verifyPersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

export const PERSISTED_EXECUTION_ANALYTICS_READINESS_VERSION =
  "ti_v3_persisted_execution_analytics_readiness_v1" as const;

/**
 * This receipt is intentionally not an analytical dataset or partition. A raw
 * statement does not establish its opening inventory, correction history, or
 * account-period coverage, so issuing a P/L dataset from it would overclaim.
 */
export interface PersistedExecutionAnalyticsReadiness {
  readonly schemaVersion: typeof PERSISTED_EXECUTION_ANALYTICS_READINESS_VERSION;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly selectedPersistenceDigests: readonly CanonicalContentDigest[];
  readonly selectedSourceDocumentDigests: readonly CanonicalSourceDocumentDigest[];
  readonly selectedExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly lifecycleProjection: PersistedExecutionLifecycleProjection;
  readonly datasetState: "unavailable";
  readonly datasetReceiptDigest: null;
  readonly partitionReceiptDigests: readonly CanonicalContentDigest[];
  readonly queryIdentityDigest: null;
  readonly reasonCodes: readonly string[];
  readonly readinessDigest: CanonicalContentDigest;
}

export type PersistedExecutionAnalyticsReadinessFailure = Readonly<{
  code: "ti_v3_persisted_readiness_invalid_source" | "ti_v3_persisted_readiness_scope_mismatch" | "ti_v3_persisted_readiness_lifecycle_invalid" | "ti_v3_persisted_readiness_identity_invalid";
  path: string;
}>;

function failure(
  code: PersistedExecutionAnalyticsReadinessFailure["code"],
  path: string,
): ExactResult<never, PersistedExecutionAnalyticsReadinessFailure> {
  return { ok: false, error: { code, path } };
}

function orderedUnique<T extends string>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  ));
}

/**
 * Resolves the persisted source set into an explicit unavailable result. This
 * preserves all source/lifecycle identities while preventing a raw statement
 * from becoming a dataset, currency partition, or query without the separate
 * authority those financial claims require.
 */
export function buildPersistedExecutionAnalyticsReadiness(
  records: readonly PersistedRawBrokerCsvImport[],
): ExactResult<
  PersistedExecutionAnalyticsReadiness,
  PersistedExecutionAnalyticsReadinessFailure
> {
  if (records.length === 0) {
    return failure("ti_v3_persisted_readiness_invalid_source", "$.records");
  }
  const verifiedRecords: PersistedRawBrokerCsvImport[] = [];
  const persistenceDigests: CanonicalContentDigest[] = [];
  const sourceDocumentDigests: CanonicalSourceDocumentDigest[] = [];
  const executionDigests: CanonicalExecutionDigest[] = [];
  const reasonCodes = new Set<string>([
    "ti_v3_analytics_opening_inventory_authority_missing",
    "ti_v3_analytics_correction_authority_missing",
    "ti_v3_analytics_statement_period_authority_missing",
  ]);
  let canonicalOwnerKey: string | null = null;
  let canonicalAccountKey: string | null = null;

  for (let index = 0; index < records.length; index += 1) {
    const verified = verifyPersistedRawBrokerCsvImport(records[index]);
    if (!verified.ok) {
      return failure("ti_v3_persisted_readiness_invalid_source", `$.records[${index}]`);
    }
    const record = verified.value;
    if (
      (canonicalOwnerKey !== null && record.canonicalOwnerKey !== canonicalOwnerKey) ||
      (canonicalAccountKey !== null && record.canonicalAccountKey !== canonicalAccountKey)
    ) {
      return failure("ti_v3_persisted_readiness_scope_mismatch", `$.records[${index}]`);
    }
    canonicalOwnerKey ??= record.canonicalOwnerKey;
    canonicalAccountKey ??= record.canonicalAccountKey;
    verifiedRecords.push(record);
    persistenceDigests.push(record.persistenceDigest);
    sourceDocumentDigests.push(record.sourceDocumentDigest);
    executionDigests.push(...record.acceptedExecutions.map((execution) => execution.canonicalContentDigest));
    if (record.chargeCoverageState !== "complete") {
      reasonCodes.add("ti_v3_analytics_charge_coverage_unknown");
    }
    if (record.acceptedExecutions.some((execution) => execution.content.instrumentResolutionState !== "resolved")) {
      reasonCodes.add("ti_v3_analytics_instrument_authority_missing");
    }
  }
  const selectedPersistenceDigests = orderedUnique(persistenceDigests);
  const selectedSourceDocumentDigests = orderedUnique(sourceDocumentDigests);
  const selectedExecutionDigests = orderedUnique(executionDigests);
  if (
    selectedPersistenceDigests.length !== persistenceDigests.length ||
    selectedSourceDocumentDigests.length !== sourceDocumentDigests.length ||
    selectedExecutionDigests.length !== executionDigests.length ||
    canonicalOwnerKey === null ||
    canonicalAccountKey === null
  ) {
    return failure("ti_v3_persisted_readiness_invalid_source", "$.records");
  }
  const lifecycleProjection = buildPersistedExecutionLifecycleProjection(verifiedRecords);
  if (!lifecycleProjection.ok) {
    return failure("ti_v3_persisted_readiness_lifecycle_invalid", "$.records");
  }
  if (lifecycleProjection.value.openLifecycleCount !== "0") {
    reasonCodes.add("ti_v3_analytics_open_position_present");
  }
  const content = {
    schemaVersion: PERSISTED_EXECUTION_ANALYTICS_READINESS_VERSION,
    canonicalOwnerKey,
    canonicalAccountKey,
    selectedPersistenceDigests,
    selectedSourceDocumentDigests,
    selectedExecutionDigests,
    lifecycleProjection,
    datasetState: "unavailable" as const,
    datasetReceiptDigest: null,
    partitionReceiptDigests: Object.freeze([]),
    queryIdentityDigest: null,
    reasonCodes: orderedUnique([...reasonCodes]),
  };
  const identity = createCanonicalContentIdentity("canonical_content", "v1", content);
  if (!identity.ok) {
    return failure("ti_v3_persisted_readiness_identity_invalid", "$.readinessDigest");
  }
  return {
    ok: true,
    value: Object.freeze({
      ...content,
      readinessDigest: identity.value.identifier,
    }),
  };
}
