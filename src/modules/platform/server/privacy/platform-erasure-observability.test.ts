// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { classifyErasureFailure, observeErasurePhase } from "./platform-erasure-observability";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

it("distinguishes a thrown phase from a successful return without disclosing the exception", () => {
  vi.stubEnv("NODE_ENV", "production");
  const log = vi.spyOn(console, "info").mockImplementation(() => {});
  const error = Object.assign(new Error("private path and identity must stay private"), { code: "not_admitted" });
  expect(() => observeErasurePhase("logical_admission_settlement", () => { throw error; })).toThrow(error);
  expect(log.mock.calls[1]).toEqual(["platform_erasure_phase", expect.objectContaining({
    phase: "logical_admission_settlement", state: "failed", failureKind: "admission_required",
    durationMs: expect.any(Number), atUtc: expect.any(String),
  })]);
  expect(JSON.stringify(log.mock.calls)).not.toContain("private");
  log.mockClear();
  const result = {};
  expect(observeErasurePhase("foreign_key_check", () => result)).toBe(result);
  expect(log.mock.calls[1]![1]).toMatchObject({ state: "finished" });
  expect(log.mock.calls[1]![1]).not.toHaveProperty("failureKind");
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
