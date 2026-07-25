import type { ExactResult } from "../../domain/exact";
import type { CanonicalContentDigest } from "../../domain/identity";
import {
  buildFinalToolRegistrySnapshot,
  resolveFinalToolRegistryEntry,
  verifyFinalToolRegistrySnapshot,
  type ToolRegistryEntry,
  type NormalizedAnalysisArguments,
} from "../registry";
import {
  executeWeekdayAnalysis,
  normalizeWeekdayAnalysisArguments,
  WEEKDAY_TOOL_KEY,
  WEEKDAY_TOOL_VERSION,
  type WeekdayAnalysisExecution,
  type WeekdayAnalysisExecutionInput,
} from "../tools/weekday";
import {
  executeDailyStopAnalysis,
  normalizeDailyStopArguments,
  DAILY_STOP_TOOL_KEY,
  DAILY_STOP_TOOL_VERSION,
  type DailyStopAnalysisExecution,
  type DailyStopAnalysisExecutionInput,
} from "../tools/daily-stop";
import {
  type AnalyticalContractFailure,
  type AnalysisRunContext,
  type AnalysisRunReceipt,
} from "../contracts";

export const REGISTERED_TOOL_RUNNER_VERSION = "ti_v3_registered_tool_runner_v1" as const;

export interface RegisteredToolExecutionRequest {
  readonly registrySnapshot: unknown;
  readonly toolKey: unknown;
  readonly toolVersion: unknown;
  readonly snapshot: unknown;
  readonly snapshotDependencies: unknown;
  readonly canonicalFilter: unknown;
  readonly datasetReceipt: unknown;
  readonly datasetDerivationReceipt: unknown;
  readonly partitionReceipt: unknown;
  readonly arguments?: unknown;
}

export type RegisteredToolExecution =
  | WeekdayAnalysisExecution
  | DailyStopAnalysisExecution;

export interface RegisteredToolExecutionResult {
  readonly runnerVersion: typeof REGISTERED_TOOL_RUNNER_VERSION;
  readonly toolKey: typeof WEEKDAY_TOOL_KEY | typeof DAILY_STOP_TOOL_KEY;
  readonly toolVersion: typeof WEEKDAY_TOOL_VERSION | typeof DAILY_STOP_TOOL_VERSION;
  readonly registrySnapshotDigest: CanonicalContentDigest;
  readonly registryEntry: ToolRegistryEntry;
  readonly registryEntryDigest: CanonicalContentDigest;
  readonly normalizedArgumentsDigest: CanonicalContentDigest;
  readonly runContext: AnalysisRunContext;
  readonly execution: RegisteredToolExecution;
  readonly receipt: AnalysisRunReceipt;
}

export interface RegisteredToolRejection {
  readonly kind: "rejected_before_execution";
  readonly code: string;
  readonly path: string;
}

export type RegisteredToolRunnerResult = ExactResult<
  RegisteredToolExecutionResult,
  RegisteredToolRejection
>;

function reject<T = never>(code: string, path: string): ExactResult<T, RegisteredToolRejection> {
  return { ok: false, error: { kind: "rejected_before_execution", code, path } };
}

function contractReject(
  result: { readonly ok: false; readonly error: AnalyticalContractFailure },
  path: string,
): RegisteredToolRunnerResult {
  return reject(result.error.code, `${path}${result.error.path.slice(1)}`);
}

function parseRequest(input: unknown): ExactResult<Record<string, unknown>, RegisteredToolRejection> {
  if (typeof input !== "object" || input === null || Array.isArray(input)) return reject("ti_v3_runner_request_invalid", "$");
  const required = [
    "registrySnapshot", "toolKey", "toolVersion", "snapshot", "snapshotDependencies",
    "canonicalFilter", "datasetReceipt", "datasetDerivationReceipt", "partitionReceipt",
  ];
  const allowed = new Set([...required, "arguments"]);
  const keys = Object.keys(input);
  const extra = keys.find((key) => !allowed.has(key));
  if (extra !== undefined) return reject("ti_v3_runner_request_extra_field", `$.${extra}`);
  const record: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (descriptor === undefined || descriptor.get !== undefined || descriptor.set !== undefined || !("value" in descriptor)) return reject("ti_v3_runner_request_invalid", `$.${key}`);
    record[key] = descriptor.value;
  }
  const missing = required.find((key) => !Object.prototype.hasOwnProperty.call(record, key));
  if (missing !== undefined) return reject("ti_v3_runner_request_missing_field", `$.${missing}`);
  return { ok: true, value: record };
}

function normalizeArguments(
  toolKey: string,
  rawArguments: unknown,
): ExactResult<NormalizedAnalysisArguments, RegisteredToolRejection> {
  if (toolKey === WEEKDAY_TOOL_KEY) {
    const result = normalizeWeekdayAnalysisArguments(rawArguments);
    if (!result.ok) return reject(result.error.code, result.error.path);
    return result;
  }
  const result = normalizeDailyStopArguments(rawArguments);
  if (!result.ok) return reject(result.error.code, result.error.path);
  return result;
}

/**
 * Closed dispatch boundary for the two accepted GA0-B tools. Financial work is
 * performed only by the already accepted B2/B3 executors.
 */
export function executeRegisteredTraderIntelligenceTool(
  input: unknown,
): RegisteredToolRunnerResult {
  const request = parseRequest(input);
  if (!request.ok) return request;
  const values = request.value;
  const toolKey = values.toolKey;
  const toolVersion = values.toolVersion;
  if (typeof toolKey !== "string") return reject("ti_v3_runner_unknown_tool_key", "$.toolKey");
  if (typeof toolVersion !== "string") return reject("ti_v3_runner_unsupported_tool_version", "$.toolVersion");

  const registry = verifyFinalToolRegistrySnapshot(values.registrySnapshot);
  if (!registry.ok) return contractReject(registry, "$.registrySnapshot");
  const canonicalRegistry = buildFinalToolRegistrySnapshot();
  const entry = resolveFinalToolRegistryEntry(registry.value, toolKey, toolVersion);
  if (entry === null) {
    const knownKey = registry.value.entries.some((candidate) => candidate.toolKey === toolKey);
    return reject(
      knownKey ? "ti_v3_runner_unsupported_tool_version" : "ti_v3_runner_unknown_tool_key",
      knownKey ? "$.toolVersion" : "$.toolKey",
    );
  }
  if (entry.deprecationState !== "active_contract" || entry.executableState !== "tool_specific_deterministic_executor") {
    return reject("ti_v3_runner_tool_not_executable", "$.registrySnapshot.entries");
  }
  const normalized = normalizeArguments(toolKey, values.arguments);
  if (!normalized.ok) return normalized;

  const executionInput = {
    snapshot: values.snapshot,
    snapshotDependencies: values.snapshotDependencies,
    canonicalFilter: values.canonicalFilter,
    datasetReceipt: values.datasetReceipt,
    datasetDerivationReceipt: values.datasetDerivationReceipt,
    partitionReceipt: values.partitionReceipt,
    arguments: normalized.value.values,
  };
  let executionResult: ReturnType<typeof executeWeekdayAnalysis> | ReturnType<typeof executeDailyStopAnalysis>;
  if (toolKey === WEEKDAY_TOOL_KEY && toolVersion === WEEKDAY_TOOL_VERSION) {
    executionResult = executeWeekdayAnalysis(executionInput as WeekdayAnalysisExecutionInput);
  } else if (toolKey === DAILY_STOP_TOOL_KEY && toolVersion === DAILY_STOP_TOOL_VERSION) {
    executionResult = executeDailyStopAnalysis(executionInput as DailyStopAnalysisExecutionInput);
  } else {
    return reject("ti_v3_runner_closed_dispatch_mismatch", "$.toolKey");
  }
  if (!executionResult.ok) return contractReject(executionResult, "$.execution");
  const execution = executionResult.value;
  return {
    ok: true,
    value: Object.freeze({
      runnerVersion: REGISTERED_TOOL_RUNNER_VERSION,
      toolKey: toolKey as typeof WEEKDAY_TOOL_KEY | typeof DAILY_STOP_TOOL_KEY,
      toolVersion: toolVersion as typeof WEEKDAY_TOOL_VERSION | typeof DAILY_STOP_TOOL_VERSION,
      registrySnapshotDigest: canonicalRegistry.registryDigest,
      registryEntry: entry,
      registryEntryDigest: entry.entryDigest,
      normalizedArgumentsDigest: execution.normalizedArguments.argumentsDigest,
      runContext: execution.runContext,
      execution,
      receipt: execution.receipt,
    }),
  };
}

export function verifyRegisteredToolExecutionResult(
  result: RegisteredToolExecutionResult,
): RegisteredToolRunnerResult {
  const registry = buildFinalToolRegistrySnapshot();
  if (result.registrySnapshotDigest !== registry.registryDigest) return reject("ti_v3_runner_registry_identity_mismatch", "$.registrySnapshotDigest");
  const entry = resolveFinalToolRegistryEntry(registry, result.toolKey, result.toolVersion);
  if (entry === null || entry.entryDigest !== result.registryEntryDigest || result.registryEntry.entryDigest !== entry.entryDigest) {
    return reject("ti_v3_runner_registry_entry_mismatch", "$.registryEntry");
  }
  if (result.execution.normalizedArguments.argumentsDigest !== result.normalizedArgumentsDigest) return reject("ti_v3_runner_arguments_mismatch", "$.normalizedArgumentsDigest");
  if (result.execution.runContext.runContextDigest !== result.receipt.runContextDigest) return reject("ti_v3_runner_receipt_mismatch", "$.receipt");
  return { ok: true, value: result };
}
