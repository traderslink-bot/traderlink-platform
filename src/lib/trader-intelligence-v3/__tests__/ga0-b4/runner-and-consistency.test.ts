import { describe, expect, it } from "vitest";

import {
  buildAnalyticalPartitionReceipt,
  buildFinalToolRegistrySnapshot,
  buildPersistedRegisteredToolEnvelope,
  createSyntheticInMemoryReadOnlySource,
  executeRegisteredTraderIntelligenceTool,
  readAnalyticalDatasetWithDerivation,
  rehydrateRegisteredToolExecution,
  resolveAnalyticalEvidenceBundle,
  validateCrossArtifactConsistency,
  verifyFinalToolRegistrySnapshot,
  WEEKDAY_TOOL_KEY,
  DAILY_STOP_TOOL_KEY,
} from "../../analytics";
import type { CanonicalExecutionEnvelope } from "../../domain";
import { buildSyntheticCanonicalExecution, buildSyntheticGa0B1Authority } from "../../testing";

function buildExecutions(): readonly CanonicalExecutionEnvelope[] {
  const dates = [
    "2026-07-01", "2026-07-02", "2026-07-03", "2026-07-06", "2026-07-07",
    "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-13", "2026-07-14",
    "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-20", "2026-07-21",
    "2026-07-22", "2026-07-23", "2026-07-24", "2026-07-27", "2026-07-28",
  ];
  const executions: CanonicalExecutionEnvelope[] = [];
  dates.forEach((date, index) => {
    const entry = String(index * 2 + 1);
    const exit = String(index * 2 + 2);
    const netPnl = index % 5 === 0 || index % 5 === 1 ? "-1" : index % 5 === 2 ? "0" : "1";
    const exitPrice = netPnl === "-1" ? "20" : netPnl === "0" ? "21" : "22";
    const common = {
      currency: "USD" as const,
      quantity: "1",
      charges: [{ kind: "commission" as const, amount: "0", currency: "USD" as const }],
      sourceTimezoneEvidence: "UTC+00:00",
      timestampPrecision: "minute" as const,
      rawBrokerSymbol: "SYNTH",
      stableInstrumentKey: "instrument_synthetic",
    };
    executions.push(buildSyntheticCanonicalExecution({
      ...common,
      executionId: `B4-ENTRY-${entry}`,
      orderId: `B4-ORDER-${entry}`,
      brokerExecutionIndex: entry,
      brokerFillSequence: entry,
      originalSourceRowLocator: { kind: "row_number", value: entry, rowOrderPreserved: true },
      executedAt: `${date}T14:00:00.000000000Z`,
      side: "buy",
      price: "21",
    }));
    executions.push(buildSyntheticCanonicalExecution({
      ...common,
      executionId: `B4-EXIT-${exit}`,
      orderId: `B4-ORDER-${entry}`,
      brokerExecutionIndex: exit,
      brokerFillSequence: exit,
      originalSourceRowLocator: { kind: "row_number", value: exit, rowOrderPreserved: true },
      executedAt: `${date}T14:01:00.000000000Z`,
      side: "sell",
      price: exitPrice,
    }));
  });
  return Object.freeze(executions);
}

function fixture() {
  const authority = buildSyntheticGa0B1Authority(buildExecutions());
  const derived = readAnalyticalDatasetWithDerivation(createSyntheticInMemoryReadOnlySource(authority));
  if (!derived.ok) throw new Error(`${derived.error.code}:${derived.error.path}`);
  const partition = buildAnalyticalPartitionReceipt({
    schemaVersion: "ti_v3_analytical_partition_v1",
    datasetReceipt: derived.value.datasetReceipt,
    currency: "USD",
  });
  if (!partition.ok) throw new Error(`${partition.error.code}:${partition.error.path}`);
  const request = {
    registrySnapshot: buildFinalToolRegistrySnapshot(),
    snapshot: authority.snapshot,
    snapshotDependencies: authority.snapshotDependencies,
    canonicalFilter: authority.snapshotDependencies.filter,
    datasetReceipt: derived.value.datasetReceipt,
    datasetDerivationReceipt: derived.value.derivationReceipt,
    partitionReceipt: partition.value,
  };
  return { authority, request, source: createSyntheticInMemoryReadOnlySource(authority) };
}

describe("GA0-B4 final registry and closed runner", () => {
  it("builds exactly two canonical entries independent of caller order", () => {
    const first = buildFinalToolRegistrySnapshot();
    const second = buildFinalToolRegistrySnapshot();
    expect(first.registryDigest).toBe(second.registryDigest);
    expect(first.entries.map((entry) => `${entry.toolKey}:${entry.toolVersion}`)).toEqual([
      `${WEEKDAY_TOOL_KEY}:v1`,
      `${DAILY_STOP_TOOL_KEY}:v1`,
    ]);
    expect(new Set(first.entries.map((entry) => entry.entryDigest)).size).toBe(2);
  });

  it("dispatches both accepted tools and rejects foreign or unknown identities", () => {
    const { request } = fixture();
    const weekday = executeRegisteredTraderIntelligenceTool({ ...request, toolKey: WEEKDAY_TOOL_KEY, toolVersion: "v1" });
    expect(weekday, JSON.stringify(weekday)).toMatchObject({ ok: true, value: { toolKey: WEEKDAY_TOOL_KEY, toolVersion: "v1" } });
    const dailyStop = executeRegisteredTraderIntelligenceTool({ ...request, toolKey: DAILY_STOP_TOOL_KEY, toolVersion: "v1", arguments: { consecutiveLossThreshold: "2" } });
    expect(dailyStop, JSON.stringify(dailyStop)).toMatchObject({ ok: true, value: { toolKey: DAILY_STOP_TOOL_KEY, toolVersion: "v1" } });
    expect(executeRegisteredTraderIntelligenceTool({ ...request, toolKey: "weekday", toolVersion: "v1" })).toMatchObject({ ok: false, error: { code: "ti_v3_runner_unknown_tool_key" } });
    expect(executeRegisteredTraderIntelligenceTool({ ...request, toolKey: DAILY_STOP_TOOL_KEY, toolVersion: "v1", arguments: { targetWeekday: "friday" } })).toMatchObject({ ok: false });
  }, 30000);

  it("validates the produced graph and resolves evidence against B1 authority", () => {
    const { request } = fixture();
    const result = executeRegisteredTraderIntelligenceTool({ ...request, toolKey: WEEKDAY_TOOL_KEY, toolVersion: "v1" });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    const execution = result.value.execution;
    const consistency = validateCrossArtifactConsistency({
      runContext: execution.runContext,
      tables: execution.tables,
      claims: execution.claims,
      series: execution.series,
      evidenceBundles: execution.evidenceBundles,
      diagnostics: execution.diagnostics,
      receipt: execution.receipt,
      expectedToolKey: WEEKDAY_TOOL_KEY,
    });
    expect(consistency).toMatchObject({ ok: true, value: { valid: true } });
    const evidence = execution.evidenceBundles[0];
    expect(resolveAnalyticalEvidenceBundle(evidence, execution.runContext)).toMatchObject({ ok: true, value: { evidence: { bundleDigest: evidence.bundleDigest } } });
  }, 30000);

  it("replays the exact persisted graph through the selected tool", () => {
    const { request, source } = fixture();
    const result = executeRegisteredTraderIntelligenceTool({ ...request, toolKey: DAILY_STOP_TOOL_KEY, toolVersion: "v1" });
    expect(result, JSON.stringify(result)).toMatchObject({ ok: true });
    if (!result.ok) return;
    const envelope = buildPersistedRegisteredToolEnvelope(result.value);
    const replayed = rehydrateRegisteredToolExecution(JSON.parse(JSON.stringify(envelope)), source);
    expect(replayed).toMatchObject({ ok: true, value: { receipt: { runContextDigest: result.value.receipt.runContextDigest } } });
    const relabeled = { ...JSON.parse(JSON.stringify(envelope)), toolKey: WEEKDAY_TOOL_KEY, toolVersion: "v1" };
    expect(rehydrateRegisteredToolExecution(relabeled, source)).toMatchObject({ ok: false, error: { code: "ti_v3_replay_registry_entry_mismatch" } });
  }, 30000);

  it("covers fixed-seed threshold cases, deterministic repeats, and cross-tool substitution", () => {
    const { request } = fixture();
    const thresholds = ["1", "2", "3", "4", "5"] as const;
    const runs = thresholds.map((consecutiveLossThreshold) =>
      executeRegisteredTraderIntelligenceTool({
        ...request,
        toolKey: DAILY_STOP_TOOL_KEY,
        toolVersion: "v1",
        arguments: { consecutiveLossThreshold },
      }));
    expect(runs.every((run) => run.ok)).toBe(true);
    const first = runs[0];
    if (!first.ok) return;
    const repeat = executeRegisteredTraderIntelligenceTool({
      ...request,
      toolKey: DAILY_STOP_TOOL_KEY,
      toolVersion: "v1",
      arguments: { consecutiveLossThreshold: "1" },
    });
    expect(repeat).toMatchObject({ ok: true, value: { receipt: { runDigest: first.value.receipt.runDigest } } });
    const substituted = validateCrossArtifactConsistency({
      runContext: first.value.execution.runContext,
      tables: first.value.execution.tables,
      claims: first.value.execution.claims,
      series: first.value.execution.series,
      evidenceBundles: first.value.execution.evidenceBundles,
      diagnostics: first.value.execution.diagnostics,
      receipt: first.value.execution.receipt,
      expectedToolKey: WEEKDAY_TOOL_KEY,
    });
    expect(substituted).toMatchObject({ ok: false, error: { code: "ti_v3_consistency_tool_mismatch" } });
  }, 30000);

  it("rejects registry order and digest tampering before execution", () => {
    const registry = buildFinalToolRegistrySnapshot();
    const reversed = verifyFinalToolRegistrySnapshot({
      ...registry,
      entries: [...registry.entries].reverse(),
    });
    expect(reversed).toMatchObject({ ok: true, value: { registryDigest: registry.registryDigest } });
    const tampered = verifyFinalToolRegistrySnapshot({
      ...registry,
      registryDigest: `sha256:${"0".repeat(64)}`,
    });
    expect(tampered).toMatchObject({ ok: false, error: { code: "ti_v3_analytics_contract_reference_mismatch" } });
  });
});
