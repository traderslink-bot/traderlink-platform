// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { classifyErasureFailure, observeErasurePhase, observeErasureTable } from "./platform-erasure-observability";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it("distinguishes a thrown phase from a successful return without disclosing the exception", () => {
  vi.stubEnv("NODE_ENV", "production");
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const error = Object.assign(new Error("private path and identity must stay private"), { code: "not_admitted" });
  expect(() => observeErasurePhase("logical_admission_settlement", () => { throw error; })).toThrow(error);
  expect(log.mock.calls[1]).toHaveLength(1);
  expect(JSON.parse(log.mock.calls[1]![0] as string)).toEqual(expect.objectContaining({
    event: "platform_erasure_phase",
    phase: "logical_admission_settlement", state: "failed", failureKind: "admission_required",
    durationMs: expect.any(Number), atUtc: expect.any(String),
  }));
  expect(log.mock.calls.every(call => typeof call[0] === "string" && !call[0].includes("\n"))).toBe(true);
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
  log.mockClear();
  const result = {};
  expect(observeErasurePhase("foreign_key_check", () => result)).toBe(result);
  expect(JSON.parse(log.mock.calls[1]![0] as string)).toMatchObject({ state: "finished" });
  expect(JSON.parse(log.mock.calls[1]![0] as string)).not.toHaveProperty("failureKind");
});

it("reports slow table work and failures as atomic JSON without logging values or every fast query", () => {
  vi.stubEnv("NODE_ENV", "production");
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const clock = vi.spyOn(performance, "now");
  clock.mockReturnValueOnce(0).mockReturnValueOnce(75);
  expect(observeErasureTable("capture_fk_edge", "child", 10, () => 2, "parent")).toBe(2);
  expect(log.mock.calls).toHaveLength(1);
  expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({
    event: "platform_erasure_phase", phase: "capture_fk_edge", table: "child", parentTable: "parent",
    selectedRows: 10, durationMs: 75, state: "finished",
  });
  log.mockClear();
  clock.mockReturnValueOnce(0).mockReturnValueOnce(1);
  observeErasureTable("delete_table", "child", 2, () => 2);
  expect(log).not.toHaveBeenCalled();
  const error = Object.assign(new Error("private payload"), { code: "SQLITE_FULL" });
  expect(() => observeErasureTable("delete_table", "child", 2, () => { throw error; })).toThrow(error);
  expect(JSON.parse(log.mock.calls[0]![0] as string)).toMatchObject({ state: "failed", failureKind: "sqlite_full" });
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
});

it("reports only fixed categories and never invokes an exception getter or serializer", () => {
  for (const [code, category] of [
    ["SQLITE_BUSY_SNAPSHOT", "sqlite_busy"], ["SQLITE_LOCKED", "sqlite_locked"],
    ["SQLITE_FULL", "sqlite_full"], ["SQLITE_IOERR_READ", "sqlite_io"],
    ["held", "admission_hold"], ["unqualified", "admission_hold"], ["conflict", "admission_hold"],
    ["secret", "unknown"],
  ]) expect(classifyErasureFailure({ code })).toBe(category);
  const getter = vi.fn(() => { throw new Error("private"); });
  const error = Object.defineProperty({ toJSON: getter, toString: getter }, "code", { get: getter });
  expect(classifyErasureFailure(error)).toBe("unknown");
  expect(classifyErasureFailure(new Proxy({}, { getOwnPropertyDescriptor: getter }))).toBe("unknown");
  expect(getter).toHaveBeenCalledTimes(1); // Proxy trap only; caught without replacing the original error.
});
