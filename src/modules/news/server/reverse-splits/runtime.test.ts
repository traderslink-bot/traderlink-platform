import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ open: vi.fn(), close: vi.fn(), collection: vi.fn(), prepare: vi.fn() }));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({ openPlatformDatabase: mocks.open }));
vi.mock("@/src/modules/coach/server/market-calendar/coach-us-equities-calendar-repository", () => ({
  CoachUsEquitiesCalendarRepository: class { calendar() { return {}; } },
}));
vi.mock("./repository", () => ({ ReverseSplitRepository: class { claimRuntime() { return null; } } }));
vi.mock("./collection", () => ({ ReverseSplitCollectionService: class { runOnce() { return mocks.collection(); } } }));
vi.mock("./notification-delivery", () => ({ runReverseSplitNotifications: async () => [] }));
import { runReverseSplitWorkerOnce } from "./runtime";

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("REVERSE_SPLIT_ENABLED", "true");
  vi.stubEnv("REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED", "true");
  vi.stubEnv("EODHD_API_TOKEN", "synthetic-test-token");
  vi.stubEnv("REVERSE_SPLIT_SEC_USER_AGENT", "Synthetic test contact@example.invalid");
  vi.stubEnv("DISCORD_REVERSE_SPLIT_DELIVERY_ENABLED", "false");
  mocks.prepare.mockReturnValue({ get: () => ({ count: 7 }) });
  mocks.open.mockReturnValue({ prepare: mocks.prepare, close: mocks.close });
  mocks.collection.mockResolvedValue({ failures: [], processed: "idle" });
});
afterEach(() => vi.unstubAllEnvs());

describe("private worker activation and cleanup", () => {
  it("does not open a database or collect when either private flag is off", async () => {
    vi.stubEnv("REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED", "false");
    expect(await runReverseSplitWorkerOnce()).toEqual([]);
    expect(mocks.open.mock.calls.length).toBe(0);
    expect(mocks.collection.mock.calls.length).toBe(0);
    vi.stubEnv("REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED", "true");
    vi.stubEnv("REVERSE_SPLIT_ENABLED", "false");
    expect(await runReverseSplitWorkerOnce()).toEqual([]);
    expect(mocks.open.mock.calls.length).toBe(0);
  });
  it("fails closed on absent schema and closes its database", async () => {
    mocks.prepare.mockReturnValue({ get: () => ({ count: 4 }) });
    expect(await runReverseSplitWorkerOnce()).toEqual(["reverse_split_migration_required"]);
    expect(mocks.close.mock.calls.length).toBe(1);
    expect(mocks.collection.mock.calls.length).toBe(0);
  });
  it("resets its overlap guard when database opening fails", async () => {
    mocks.open.mockImplementationOnce(() => { throw new Error("Synthetic open failure"); });
    expect(await runReverseSplitWorkerOnce()).toEqual(["reverse_split_worker_unavailable"]);
    expect(await runReverseSplitWorkerOnce()).toEqual([]);
    expect(mocks.collection.mock.calls.length).toBe(1);
    expect(mocks.close.mock.calls.length).toBe(1);
  });
  it("prevents concurrent passes and always closes after collection failure", async () => {
    let release: () => void = () => {};
    mocks.collection.mockImplementationOnce(() => new Promise(resolve => { release = () => resolve({ failures: [], processed: "idle" }); }));
    const first = runReverseSplitWorkerOnce();
    expect(await runReverseSplitWorkerOnce()).toEqual([]);
    expect(mocks.open.mock.calls.length).toBe(1);
    release();
    await first;
    mocks.collection.mockRejectedValueOnce(new Error("Synthetic collection failure"));
    expect(await runReverseSplitWorkerOnce()).toEqual(["reverse_split_worker_unavailable"]);
    expect(mocks.close.mock.calls.length).toBe(2);
  });
});
