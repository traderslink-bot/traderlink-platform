// @vitest-environment node
import { afterEach, beforeEach, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ loaded: [] as string[], mode: vi.fn(), maintenance: vi.fn(), readiness: vi.fn(), recovery: vi.fn(), workers: vi.fn() }));
vi.mock("./platform-background-worker-mode", () => ({ resolvePlatformBackgroundWorkerMode: state.mode }));
vi.mock("../database/run-hosted-platform-migration-maintenance", () => { state.loaded.push("maintenance"); return { runHostedPlatformMigrationMaintenance: state.maintenance }; });
vi.mock("../readiness/platform-hosted-runtime-readiness", () => { state.loaded.push("readiness"); return { verifyPlatformHostedRuntimeReadiness: state.readiness }; });
vi.mock("../privacy/platform-erasure-worker-supervisor", () => { state.loaded.push("recovery"); return { startCommittedErasureRecovery: state.recovery }; });
vi.mock("./traderlink-hosted-background-workers", () => { state.loaded.push("workers"); return { startTraderLinkHostedBackgroundWorkers: state.workers }; });
vi.mock("../observability/platform-runtime-delay-observability", () => ({ startPlatformRuntimeDelayObservability: vi.fn() }));
import { registerTraderLinkHostedNodeRuntime } from "../../../../../instrumentation-node";
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("NODE_ENV", "production");
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  state.maintenance.mockResolvedValue(null); state.readiness.mockReturnValue({ migrationCount: 203, storage: "synthetic" });
});
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });
it("returns before production maintenance/readiness and recovery/background worker module evaluation", async () => {
  expect(state.loaded).toEqual([]);
  state.mode.mockReturnValue("disabled_isolated_staging");
  await registerTraderLinkHostedNodeRuntime();
  expect(state.loaded).toEqual([]);
  for (const fn of [state.maintenance, state.readiness, state.recovery, state.workers]) expect(fn).not.toHaveBeenCalled();
});
it("preserves default production startup", async () => {
  state.mode.mockReturnValue("enabled"); await registerTraderLinkHostedNodeRuntime();
  for (const fn of [state.maintenance, state.readiness, state.recovery, state.workers]) expect(fn).toHaveBeenCalledOnce();
});
it("preserves private acceptance readiness then disables workers", async () => {
  state.mode.mockReturnValue("disabled_private_acceptance"); await registerTraderLinkHostedNodeRuntime();
  expect(state.maintenance).toHaveBeenCalledOnce(); expect(state.readiness).toHaveBeenCalledOnce();
  expect(state.recovery).not.toHaveBeenCalled(); expect(state.workers).not.toHaveBeenCalled();
});
it("terminates unqualified staging startup before all application side effects", async () => {
  state.mode.mockImplementation(() => { throw Error("refused"); });
  const exit = vi.spyOn(process, "exit").mockImplementation(() => { throw Error("terminated"); });
  await expect(registerTraderLinkHostedNodeRuntime()).rejects.toThrow("terminated");
  expect(exit).toHaveBeenCalledWith(1);
  for (const fn of [state.maintenance, state.readiness, state.recovery, state.workers]) expect(fn).not.toHaveBeenCalled();
});
