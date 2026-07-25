import type { ExactResult } from "../../domain/exact";
import type { AnalyticalContractFailure } from "../contracts";
import {
  buildToolRegistrySnapshot,
  verifyToolRegistrySnapshot,
  type ToolRegistryEntry,
  type ToolRegistrySnapshot,
} from "./tool-registry-contract";
import { buildWeekdayToolRegistryEntry } from "../tools/weekday/weekday-policy";
import { buildDailyStopToolRegistryEntry } from "../tools/daily-stop/daily-stop-policy";

export const FINAL_TOOL_REGISTRY_KEY = "ti_v3_ga0_b_final_two_tool_registry" as const;
export const FINAL_TOOL_REGISTRY_VERSION = "v1" as const;

function required<T>(result: ExactResult<T, AnalyticalContractFailure>): T {
  if (!result.ok) throw new Error(`${result.error.code}:${result.error.path}`);
  return result.value;
}

/** The only executable registry accepted by the GA0-B runner. */
export function buildFinalToolRegistrySnapshot(): ToolRegistrySnapshot {
  return required(buildToolRegistrySnapshot({
    schemaVersion: "ti_v3_tool_registry_snapshot_v1",
    registryKey: FINAL_TOOL_REGISTRY_KEY,
    registryVersion: FINAL_TOOL_REGISTRY_VERSION,
    entries: [
      required(buildWeekdayToolRegistryEntry()),
      required(buildDailyStopToolRegistryEntry()),
    ],
  }));
}

export function verifyFinalToolRegistrySnapshot(
  input: unknown,
): ExactResult<ToolRegistrySnapshot, AnalyticalContractFailure> {
  const expected = buildFinalToolRegistrySnapshot();
  const supplied = verifyToolRegistrySnapshot(input);
  if (!supplied.ok || supplied.value.registryDigest !== expected.registryDigest) {
    return {
      ok: false,
      error: {
        code: "ti_v3_analytics_contract_reference_mismatch",
        path: "$.registrySnapshot",
      },
    };
  }
  return supplied;
}

export function resolveFinalToolRegistryEntry(
  snapshot: ToolRegistrySnapshot,
  toolKey: string,
  toolVersion: string,
): ToolRegistryEntry | null {
  return snapshot.entries.find(
    (entry) => entry.toolKey === toolKey && entry.toolVersion === toolVersion,
  ) ?? null;
}
