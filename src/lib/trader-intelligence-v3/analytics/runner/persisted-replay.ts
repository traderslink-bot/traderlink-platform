import { serializeCanonicalValue } from "../../domain/canonical";
import type { ExactResult } from "../../domain/exact";
import type { ReadOnlySnapshotAuthoritySource } from "../adapters";
import { validateContractRecord } from "../contracts";
import {
  buildFinalToolRegistrySnapshot,
  resolveFinalToolRegistryEntry,
  verifyFinalToolRegistrySnapshot,
  type ToolRegistrySnapshot,
} from "../registry";
import {
  rehydrateWeekdayAnalysisExecution,
  WEEKDAY_TOOL_KEY,
  WEEKDAY_TOOL_VERSION,
  type WeekdayAnalysisExecution,
} from "../tools/weekday";
import {
  rehydrateDailyStopAnalysisExecution,
  DAILY_STOP_TOOL_KEY,
  DAILY_STOP_TOOL_VERSION,
  type DailyStopAnalysisExecution,
} from "../tools/daily-stop";
import {
  REGISTERED_TOOL_RUNNER_VERSION,
  type RegisteredToolExecution,
  type RegisteredToolExecutionResult,
  type RegisteredToolRejection,
} from "./tool-runner";

export const PERSISTED_REGISTERED_TOOL_ENVELOPE_VERSION = "ti_v3_persisted_registered_tool_envelope_v1" as const;

export interface PersistedRegisteredToolEnvelope {
  readonly schemaVersion: typeof PERSISTED_REGISTERED_TOOL_ENVELOPE_VERSION;
  readonly runnerVersion: typeof REGISTERED_TOOL_RUNNER_VERSION;
  readonly registrySnapshot: ToolRegistrySnapshot;
  readonly toolKey: string;
  readonly toolVersion: string;
  readonly registryEntryDigest: string;
  readonly normalizedArgumentsDigest: string;
  readonly execution: RegisteredToolExecution;
}

function reject(code: string, path: string): ExactResult<never, RegisteredToolRejection> {
  return { ok: false, error: { kind: "rejected_before_execution", code, path } };
}

export function buildPersistedRegisteredToolEnvelope(
  result: RegisteredToolExecutionResult,
): PersistedRegisteredToolEnvelope {
  return Object.freeze({
    schemaVersion: PERSISTED_REGISTERED_TOOL_ENVELOPE_VERSION,
    runnerVersion: result.runnerVersion,
    registrySnapshot: buildFinalToolRegistrySnapshot(),
    toolKey: result.toolKey,
    toolVersion: result.toolVersion,
    registryEntryDigest: result.registryEntryDigest,
    normalizedArgumentsDigest: result.normalizedArgumentsDigest,
    execution: result.execution,
  });
}

/** Re-enters persisted output only through the selected tool's semantic replay. */
export function rehydrateRegisteredToolExecution(
  persisted: unknown,
  source: ReadOnlySnapshotAuthoritySource,
): ExactResult<RegisteredToolExecution, RegisteredToolRejection> {
  const record = validateContractRecord(persisted, [
    "schemaVersion", "runnerVersion", "registrySnapshot", "toolKey", "toolVersion",
    "registryEntryDigest", "normalizedArgumentsDigest", "execution",
  ]);
  if (!record.ok) return reject(record.error.code, record.error.path);
  if (record.value.schemaVersion !== PERSISTED_REGISTERED_TOOL_ENVELOPE_VERSION || record.value.runnerVersion !== REGISTERED_TOOL_RUNNER_VERSION) return reject("ti_v3_replay_envelope_invalid", "$.schemaVersion");
  const registry = verifyFinalToolRegistrySnapshot(record.value.registrySnapshot);
  if (!registry.ok) return reject("ti_v3_replay_registry_mismatch", "$.registrySnapshot");
  if (typeof record.value.toolKey !== "string" || typeof record.value.toolVersion !== "string") return reject("ti_v3_replay_tool_identity_invalid", "$.toolKey");
  const entry = resolveFinalToolRegistryEntry(registry.value, record.value.toolKey, record.value.toolVersion);
  if (entry === null || entry.entryDigest !== record.value.registryEntryDigest) return reject("ti_v3_replay_registry_entry_mismatch", "$.registryEntryDigest");
  if (typeof record.value.normalizedArgumentsDigest !== "string") return reject("ti_v3_replay_arguments_invalid", "$.normalizedArgumentsDigest");

  let replayed: WeekdayAnalysisExecution | DailyStopAnalysisExecution;
  if (record.value.toolKey === WEEKDAY_TOOL_KEY && record.value.toolVersion === WEEKDAY_TOOL_VERSION) {
    const result = rehydrateWeekdayAnalysisExecution(record.value.execution, source);
    if (!result.ok) return reject("ti_v3_replay_semantic_mismatch", "$.execution");
    replayed = result.value;
  } else if (record.value.toolKey === DAILY_STOP_TOOL_KEY && record.value.toolVersion === DAILY_STOP_TOOL_VERSION) {
    const result = rehydrateDailyStopAnalysisExecution(record.value.execution, source);
    if (!result.ok) return reject("ti_v3_replay_semantic_mismatch", "$.execution");
    replayed = result.value;
  } else {
    return reject("ti_v3_replay_unknown_tool", "$.toolKey");
  }
  if (replayed.normalizedArguments.argumentsDigest !== record.value.normalizedArgumentsDigest) return reject("ti_v3_replay_arguments_mismatch", "$.normalizedArgumentsDigest");
  const persistedGraph = serializeCanonicalValue(record.value.execution);
  const replayedGraph = serializeCanonicalValue(replayed);
  if (!persistedGraph.ok || !replayedGraph.ok || persistedGraph.value.json !== replayedGraph.value.json) return reject("ti_v3_replay_semantic_mismatch", "$.execution");
  return { ok: true, value: replayed };
}
