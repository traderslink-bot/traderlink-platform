// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
const fake = vi.hoisted(() => {
  class Worker {
    static instances: Worker[] = [];
    listeners = new Map<string, ((...args: unknown[]) => void)[]>();
    constructor() { Worker.instances.push(this); }
    on(event: string, callback: (...args: unknown[]) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]); return this;
    }
    once(event: string, callback: (...args: unknown[]) => void) { return this.on(event, callback); }
    emit(event: string, ...args: unknown[]) { for (const callback of this.listeners.get(event) ?? []) callback(...args); }
  }
  return { Worker };
});
vi.mock("node:worker_threads", () => ({ Worker: fake.Worker }));
import { runErasureWorker, startCommittedErasureRecovery } from "./platform-erasure-worker-supervisor";

afterEach(() => {
  fake.Worker.instances.length = 0;
  Reflect.deleteProperty(globalThis, Symbol.for("traderlink.platform.erasure.housekeeping.v1"));
  vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs();
});
describe("erasure supervisor actual-exit occupancy", () => {
  it("does not release its slot or return success before the writer exits", async () => {
    const pending = runErasureWorker("/synthetic.sqlite", null);
    const worker = fake.Worker.instances[0]!;
    let resolved = false; void pending.then(() => { resolved = true; });
    worker.emit("message", { status: "complete", result: { nextSelectionRef: null } });
    await Promise.resolve(); expect(resolved).toBe(false);
    expect(() => runErasureWorker("/synthetic.sqlite", null)).toThrow();
    worker.emit("exit", 0);
    await expect(pending).resolves.toEqual({ nextSelectionRef: null });
  });
  it("keeps occupancy after error, rejects after exit and then permits recovery", async () => {
    const pending = runErasureWorker("/synthetic.sqlite", null);
    const assertion = expect(pending).rejects.toMatchObject({ code: "TRADERLINK_ACCOUNT_ERASURE_FAILED" });
    const worker = fake.Worker.instances[0]!;
    worker.emit("error", new Error("synthetic_private_path_must_not_escape"));
    expect(() => runErasureWorker("/synthetic.sqlite", null)).toThrow();
    worker.emit("exit", 1); await assertion;
    const recovery = runErasureWorker("/synthetic.sqlite", null);
    fake.Worker.instances[1]!.emit("message", { status: "complete", result: { nextSelectionRef: null } });
    fake.Worker.instances[1]!.emit("exit", 0); await recovery;
  });
  it("rejects malformed or duplicate completion envelopes", async () => {
    const pending = runErasureWorker("/synthetic.sqlite", null);
    const assertion = expect(pending).rejects.toMatchObject({ code: "TRADERLINK_ACCOUNT_ERASURE_FAILED" });
    const worker = fake.Worker.instances[0]!;
    worker.emit("message", { status: "complete", result: { nextSelectionRef: "unsafe" } });
    worker.emit("message", { status: "complete", result: { nextSelectionRef: null } });
    worker.emit("exit", 0); await assertion;
  });
  it("keeps retention/recovery single-flight and drains a full batch only after actual exit", async () => {
    vi.useFakeTimers(); vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", "/tmp/synthetic.sqlite");
    startCommittedErasureRecovery();
    expect(fake.Worker.instances.length).toBe(1);
    await vi.advanceTimersByTimeAsync(15 * 60_000);
    expect(fake.Worker.instances.length).toBe(1);
    fake.Worker.instances[0]!.emit("message", { status: "complete", result: { nextSelectionRef: null, historyBatchFull: true } });
    await vi.advanceTimersByTimeAsync(2000); expect(fake.Worker.instances.length).toBe(1);
    fake.Worker.instances[0]!.emit("exit", 0);
    await vi.advanceTimersByTimeAsync(2000); expect(fake.Worker.instances.length).toBe(2);
    fake.Worker.instances[1]!.emit("message", { status: "complete", result: { nextSelectionRef: null, historyBatchFull: false } });
    fake.Worker.instances[1]!.emit("exit", 0); await Promise.resolve();
  });
});
