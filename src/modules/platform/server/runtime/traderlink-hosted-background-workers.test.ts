// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";

const fixture = vi.hoisted(() => {
  class Worker {
    static current: Worker;
    listeners = new Map<string, ((...args: unknown[]) => void)[]>();
    constructor() { Worker.current = this; }
    on(event: string, callback: (...args: unknown[]) => void) {
      this.listeners.set(event, [...(this.listeners.get(event) ?? []), callback]); return this;
    }
    once(event: string, callback: (...args: unknown[]) => void) { return this.on(event, callback); }
    emit(event: string, ...args: unknown[]) { for (const callback of this.listeners.get(event) ?? []) callback(...args); }
  }
  return {
    Worker, notes: vi.fn(async () => {}), moves: vi.fn(async () => {}),
    deliveries: vi.fn(async () => {}), approvals: vi.fn(async () => {}),
    analyzer: vi.fn(async () => 0), close: vi.fn(), finalize: vi.fn(),
    reverseSplits: vi.fn(async () => []),
    finishDelivery: undefined as undefined | (() => void),
    remote: vi.fn(),
  };
});
vi.mock("node:worker_threads", () => ({ Worker: fixture.Worker }));
vi.mock("@/src/modules/watchlist/server/notifications/watchlist-notes-notifications", () => ({ runNotesNotifications: fixture.notes }));
vi.mock("@/src/modules/watchlist/server/notifications/watchlist-category-move-notifications", () => ({ runCategoryMoveNotifications: fixture.moves }));
vi.mock("@/src/modules/watchlist/server/notifications/watchlist-notification-runtime", () => ({ reconcileWatchlistNotificationApprovals: fixture.approvals }));
vi.mock("@/src/modules/watchlist/server/notifications/watchlist-notification-delivery", () => ({ runWatchlistNotificationDelivery: fixture.deliveries }));
vi.mock("@/src/modules/level-analysis/server/daily-trade-analyzer-runtime", () => ({ runDailyTradeAnalyzerOnce: fixture.analyzer }));
vi.mock("@/src/modules/news/server/reverse-splits/runtime", () => ({ runReverseSplitWorkerOnce: fixture.reverseSplits }));
vi.mock("../broker-connections/moomoo-connection-monitor-runtime", () => ({ startMoomooConnectionMonitor: vi.fn() }));
vi.mock("../authentication/platform-login-mail-queue", () => ({ startPlatformLoginMailWorker: vi.fn() }));
vi.mock("@/src/modules/watchlist/server/setups/setup-shared-feed-runtime", () => ({ startWatchlistSetupSharedFeed: vi.fn() }));
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({ startConfiguredLiveScannerRuntime: vi.fn() }));
vi.mock("./platform-background-worker-mode", () => ({ resolvePlatformBackgroundWorkerMode: () => "enabled" }));
vi.mock("../database/open-platform-database", () => ({ openPlatformDatabase: () => ({ close: fixture.close }) }));
vi.mock("../notifications/platform-remote-notification-delivery-repository", () => ({ PlatformRemoteNotificationDeliveryRepository: class {} }));
vi.mock("../notifications/platform-remote-notification-delivery-service", () => ({ PlatformRemoteNotificationDeliveryService: class { runOne = fixture.remote; } }));

import { runErasureWorker } from "../privacy/platform-erasure-worker-supervisor";
import { startTraderLinkHostedBackgroundWorkers } from "./traderlink-hosted-background-workers";

afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllEnvs(); });

it("defers new timer passes until actual writer exit while allowing in-flight delivery to finalize", async () => {
  vi.useFakeTimers(); vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("REVERSE_SPLIT_ENABLED", "true");
  vi.stubEnv("REVERSE_SPLIT_PRIVATE_PREVIEW_ENABLED", "true");
  fixture.remote.mockImplementationOnce(() => new Promise<void>(resolve => { fixture.finishDelivery = resolve; })
    .then(() => { fixture.finalize(); return true; })).mockResolvedValue(false);
  startTraderLinkHostedBackgroundWorkers();
  await vi.dynamicImportSettled();
  const calls = () => [fixture.notes, fixture.moves, fixture.deliveries, fixture.approvals, fixture.analyzer, fixture.remote]
    .map(fn => fn.mock.calls.length);
  expect(calls()).toEqual([1, 1, 1, 1, 1, 1]);
  const erasure = runErasureWorker("/synthetic.sqlite", null);
  await vi.advanceTimersByTimeAsync(45_000);
  expect(calls()).toEqual([1, 1, 1, 1, 1, 1]);
  expect(fixture.reverseSplits).toHaveBeenCalledTimes(5);
  fixture.finishDelivery!(); await vi.advanceTimersByTimeAsync(0);
  expect(fixture.finalize).toHaveBeenCalledOnce();
  expect(fixture.close).toHaveBeenCalledOnce();
  fixture.Worker.current.emit("message", { status: "complete", result: { nextSelectionRef: null } });
  await vi.advanceTimersByTimeAsync(15_000);
  expect(calls()).toEqual([1, 1, 1, 1, 1, 1]);
  expect(fixture.reverseSplits).toHaveBeenCalledTimes(7);
  fixture.Worker.current.emit("exit", 0); await erasure;
  await vi.advanceTimersByTimeAsync(30_000);
  expect(calls()).toEqual([3, 3, 3, 3, 2, 3]);
});
