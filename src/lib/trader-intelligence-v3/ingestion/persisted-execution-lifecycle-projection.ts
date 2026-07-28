import {
  addExactDecimals,
  negateExactDecimal,
  type CanonicalDecimal,
  type ExactResult,
} from "../domain/exact";
import type { CanonicalExecutionDigest } from "../domain/identity";
import {
  verifyPersistedRawBrokerCsvImport,
  type PersistedRawBrokerCsvImport,
} from "./persisted-raw-broker-csv-import";

export const PERSISTED_EXECUTION_LIFECYCLE_PROJECTION_VERSION =
  "ti_v3_persisted_execution_lifecycle_projection_v1" as const;

export interface PersistedExecutionLifecycle {
  readonly lifecycleKey: string;
  readonly canonicalOwnerKey: string;
  readonly canonicalAccountKey: string;
  readonly stableInstrumentKey: string | null;
  readonly rawBrokerSymbol: string;
  readonly currency: string;
  readonly netQuantity: CanonicalDecimal;
  readonly state: "open" | "closed";
  readonly latestExecutionAt: string;
  readonly supportingExecutionDigests: readonly CanonicalExecutionDigest[];
  readonly limitationCodes: readonly string[];
}

export interface PersistedExecutionLifecycleProjection {
  readonly schemaVersion: typeof PERSISTED_EXECUTION_LIFECYCLE_PROJECTION_VERSION;
  readonly lifecycles: readonly PersistedExecutionLifecycle[];
  readonly openLifecycleCount: string;
  readonly closedLifecycleCount: string;
}

export type PersistedExecutionLifecycleProjectionFailure = Readonly<{
  code: "ti_v3_persisted_lifecycle_invalid_source" | "ti_v3_persisted_lifecycle_quantity_invalid";
  path: string;
}>;

type MutableLifecycle = {
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  stableInstrumentKey: string | null;
  rawBrokerSymbol: string;
  currency: string;
  netQuantity: CanonicalDecimal;
  latestExecutionAt: string;
  supportingExecutionDigests: CanonicalExecutionDigest[];
  instrumentUnresolved: boolean;
};

function failure(
  code: PersistedExecutionLifecycleProjectionFailure["code"],
  path: string,
): ExactResult<never, PersistedExecutionLifecycleProjectionFailure> {
  return { ok: false, error: { code, path } };
}

function lifecycleKey(input: Readonly<{
  canonicalOwnerKey: string;
  canonicalAccountKey: string;
  stableInstrumentKey: string | null;
  rawBrokerSymbol: string;
  currency: string;
}>): string {
  return [
    input.canonicalOwnerKey,
    input.canonicalAccountKey,
    input.stableInstrumentKey ?? `raw_${input.rawBrokerSymbol.toLowerCase()}`,
    input.currency,
  ].join(":");
}

/**
 * Projects lifecycle only. It intentionally makes no realized or unrealized
 * P/L claim: a later fill that returns net quantity to zero clears the open
 * state, while unresolved instrument/basis authority remains a limitation.
 */
export function buildPersistedExecutionLifecycleProjection(
  records: readonly PersistedRawBrokerCsvImport[],
): ExactResult<
  PersistedExecutionLifecycleProjection,
  PersistedExecutionLifecycleProjectionFailure
> {
  const lifecycles = new Map<string, MutableLifecycle>();
  for (let recordIndex = 0; recordIndex < records.length; recordIndex += 1) {
    const verified = verifyPersistedRawBrokerCsvImport(records[recordIndex]);
    if (!verified.ok) return failure("ti_v3_persisted_lifecycle_invalid_source", `$.records[${recordIndex}]`);
    for (let executionIndex = 0; executionIndex < verified.value.acceptedExecutions.length; executionIndex += 1) {
      const execution = verified.value.acceptedExecutions[executionIndex];
      const content = execution.content;
      const key = lifecycleKey(content);
      const negatedQuantity = content.side === "sell"
        ? negateExactDecimal(content.quantity)
        : null;
      const signedQuantity = content.side === "buy"
        ? content.quantity
        : negatedQuantity?.ok
          ? negatedQuantity.value
          : null;
      if (signedQuantity === null) {
        return failure("ti_v3_persisted_lifecycle_quantity_invalid", `$.records[${recordIndex}].acceptedExecutions[${executionIndex}].quantity`);
      }
      const existing = lifecycles.get(key);
      const nextQuantity = existing === undefined
        ? { ok: true as const, value: signedQuantity }
        : addExactDecimals(existing.netQuantity, signedQuantity);
      if (!nextQuantity.ok) {
        return failure("ti_v3_persisted_lifecycle_quantity_invalid", `$.records[${recordIndex}].acceptedExecutions[${executionIndex}].quantity`);
      }
      const current: MutableLifecycle = existing ?? {
        canonicalOwnerKey: content.canonicalOwnerKey,
        canonicalAccountKey: content.canonicalAccountKey,
        stableInstrumentKey: content.stableInstrumentKey,
        rawBrokerSymbol: content.rawBrokerSymbol,
        currency: content.currency,
        netQuantity: nextQuantity.value,
        latestExecutionAt: content.executedAt,
        supportingExecutionDigests: [],
        instrumentUnresolved: content.instrumentResolutionState !== "resolved",
      };
      current.netQuantity = nextQuantity.value;
      if (content.executedAt > current.latestExecutionAt) {
        current.latestExecutionAt = content.executedAt;
      }
      current.supportingExecutionDigests.push(execution.canonicalContentDigest);
      current.instrumentUnresolved ||= content.instrumentResolutionState !== "resolved";
      lifecycles.set(key, current);
    }
  }
  const projected = [...lifecycles.entries()]
    .sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0)
    .map(([key, lifecycle]) => {
      const state = lifecycle.netQuantity === "0" ? "closed" as const : "open" as const;
      const limitationCodes = [
        ...(state === "open" ? ["ti_v3_lifecycle_open_position"] : []),
        ...(lifecycle.instrumentUnresolved ? ["ti_v3_lifecycle_instrument_unresolved"] : []),
      ];
      return Object.freeze({
        lifecycleKey: key,
        canonicalOwnerKey: lifecycle.canonicalOwnerKey,
        canonicalAccountKey: lifecycle.canonicalAccountKey,
        stableInstrumentKey: lifecycle.stableInstrumentKey,
        rawBrokerSymbol: lifecycle.rawBrokerSymbol,
        currency: lifecycle.currency,
        netQuantity: lifecycle.netQuantity,
        state,
        latestExecutionAt: lifecycle.latestExecutionAt,
        supportingExecutionDigests: Object.freeze([...lifecycle.supportingExecutionDigests].sort()),
        limitationCodes: Object.freeze(limitationCodes),
      });
    });
  return {
    ok: true,
    value: Object.freeze({
      schemaVersion: PERSISTED_EXECUTION_LIFECYCLE_PROJECTION_VERSION,
      lifecycles: Object.freeze(projected),
      openLifecycleCount: String(projected.filter((item) => item.state === "open").length),
      closedLifecycleCount: String(projected.filter((item) => item.state === "closed").length),
    }),
  };
}
