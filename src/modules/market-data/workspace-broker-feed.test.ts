// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS } from "./workspace-market-settings";
import { readWorkspacePushQuote, type WorkspaceQuoteSession } from "./workspace-moomoo-quotes";
import { subscribeWorkspaceMoomooCards } from "./server/workspace-moomoo-card-feed";
import type { WorkspaceMoomooConnection } from "./server/workspace-moomoo-access";
import { runWorkspaceRestCards, runWorkspaceWebSocketCards } from "./server/workspace-moomoo-card-transport";

import { readWorkspaceRelativeVolume, readWorkspaceVolumeRevisions } from "./server/workspace-broker-volume-history";

vi.mock("server-only", () => ({}));
vi.mock("./server/workspace-moomoo-card-transport", () => ({
  runWorkspaceRestCards: vi.fn(), runWorkspaceWebSocketCards: vi.fn(),
}));
vi.mock("./server/workspace-broker-volume-history", () => ({
  readWorkspaceRelativeVolume: vi.fn(async () => null),
  readWorkspaceVolumeRevisions: vi.fn(async () => new Map()),
  workspaceVolumeThrough: (value: number) => Math.floor(value / 900_000) * 900_000,
}));

const date = "2026-11-24";
const now = Date.parse(`${date}T14:45:00.000Z`);
const session: WorkspaceQuoteSession = { date, session: "regular", regularCloseMinute: 960 };
const defaults = DEFAULT_WORKSPACE_MARKET_SETTINGS;
const connection = (generation: string): WorkspaceMoomooConnection => ({
  generation, current: () => true,
  accessToken: async () => `token-${generation}`,
  request: async () => ({}),
});
const transportRuns = () => new Promise<void>(() => {});
const quote = (symbol: string, price: number) => readWorkspacePushQuote(symbol,
  { last_price: price, data_time_ms: Date.now() }, session, Date.now());

afterEach(() => { vi.clearAllMocks(); vi.useRealTimers(); });

it("shares card demand by account, coalesces timed refreshes and keeps other accounts isolated", () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.mocked(runWorkspaceWebSocketCards).mockImplementation(transportRuns);
  const owner = subscribeWorkspaceMoomooCards("owner-generation", connection("owner"), vi.fn());
  const secondTab = subscribeWorkspaceMoomooCards("owner-generation", connection("owner"), vi.fn());
  const other = subscribeWorkspaceMoomooCards("other-generation", connection("other"), vi.fn());
  const settings = { ...defaults, cardRefreshMs: 3000 };
  try {
    owner.update(["NANO"], session, settings);
    secondTab.update(["NANO", "MICRO"], session, settings);
    other.update(["NANO"], session, settings);
    const [[original], [otherRun]] = vi.mocked(runWorkspaceWebSocketCards).mock.calls;
    expect(original.symbols()).toEqual(["NANO", "MICRO"]);
    expect(otherRun.symbols()).toEqual(["NANO"]);
    original.accept("NANO", quote("NANO", 1.13), null);
    expect(owner.quote("NANO")?.quote?.price).toBe(1.13);
    expect(secondTab.quote("NANO")?.quote?.price).toBe(1.13);
    expect(other.quote("NANO")).toBeUndefined();
    vi.advanceTimersByTime(1000);
    original.accept("NANO", quote("NANO", 1.52), null);
    vi.advanceTimersByTime(1000);
    original.accept("NANO", quote("NANO", 1.78), null);
    expect(owner.quote("NANO")?.quote?.price).toBe(1.13);
    vi.advanceTimersByTime(1000);
    expect(owner.quote("NANO")?.quote?.price).toBe(1.78);
  } finally {
    owner.close(); secondTab.close(); other.close();
  }
});

it("withdraws the old transport and rejects late quotes when the owner switches to REST and back", () => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
  vi.mocked(runWorkspaceWebSocketCards).mockImplementation(transportRuns);
  vi.mocked(runWorkspaceRestCards).mockImplementation(transportRuns);
  const owner = subscribeWorkspaceMoomooCards("owner-generation", connection("owner"), vi.fn());
  try {
    owner.update(["NANO"], session, defaults);
    const [[socket]] = vi.mocked(runWorkspaceWebSocketCards).mock.calls;
    socket.accept("NANO", quote("NANO", 1.01), null);
    const rest = { ...defaults, cardTransport: "rest" as const, restBatchSize: 10, restSpacingMs: 2500, restPassWaitMs: 7200 };
    owner.update(["NANO"], session, rest);
    const [[polling]] = vi.mocked(runWorkspaceRestCards).mock.calls;
    expect(polling.settings).toMatchObject({ restBatchSize: 10, restSpacingMs: 2500, restPassWaitMs: 7200 });
    expect(socket.signal.aborted).toBe(true);
    socket.accept("NANO", quote("NANO", 9), null);
    expect(owner.quote("NANO")).toBeUndefined();
    polling.accept("NANO", quote("NANO", 1.08), null);
    expect(owner.quote("NANO")?.quote?.price).toBe(1.08);
    owner.update(["NANO"], session, defaults);
    expect(polling.signal.aborted).toBe(true);
    expect(runWorkspaceWebSocketCards).toHaveBeenCalledTimes(2);
  } finally {
    owner.close();
  }
});

it("retains seeded premarket totals when a newer regular-session push omits them", () => {
  vi.useFakeTimers({ now });
  vi.mocked(runWorkspaceWebSocketCards).mockImplementation(transportRuns);
  const owner = subscribeWorkspaceMoomooCards("volume-fixture", connection("owner"), vi.fn());
  try {
    owner.update(["NANO"], session, defaults);
    const [[socket]] = vi.mocked(runWorkspaceWebSocketCards).mock.calls;
    socket.accept("NANO", quote("NANO", 1.42), null);
    const baseline = readWorkspacePushQuote("NANO", { data_time_ms: now - 1000, last_price: 1.11,
      pre_market: { volume: 240_000, high_price: 1.6 }, prev_close_price: 1.04 }, session, now);
    socket.accept("NANO", baseline, null);
    vi.advanceTimersByTime(1000);
    socket.accept("NANO", quote("NANO", 1.54), null);
    expect(owner.quote("NANO")?.quote).toMatchObject({
      price: 1.54, premarketVolume: 240_000, previousClose: 1.04, dayHigh: 1.6,
    });
  } finally { owner.close(); }
});

it("refreshes cached RVOL when a confirmed revision arrives within the same interval", async () => {
  vi.useFakeTimers({ now });
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "http://fixture.invalid");
  vi.mocked(runWorkspaceWebSocketCards).mockImplementation(transportRuns);
  const history = vi.mocked(readWorkspaceRelativeVolume).mockResolvedValueOnce(2.25).mockResolvedValueOnce(1.5);
  const revisions = vi.mocked(readWorkspaceVolumeRevisions).mockResolvedValue(new Map([["NANO", "confirmed-revision"]]));
  const owner = subscribeWorkspaceMoomooCards("volume-correction", connection("owner"), vi.fn());
  try {
    owner.update(["NANO"], session, defaults);
    const [[socket]] = vi.mocked(runWorkspaceWebSocketCards).mock.calls;
    socket.accept("NANO", quote("NANO", 1.42), null);
    await vi.advanceTimersByTimeAsync(0);
    expect(owner.relativeVolume("NANO")).toBe(2.25);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(owner.relativeVolume("NANO")).toBe(1.5);
    expect(history).toHaveBeenCalledTimes(2);
    expect(revisions).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(history).toHaveBeenCalledTimes(2);
    owner.close();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(revisions).toHaveBeenCalledTimes(2);
  } finally {
    owner.close();
    vi.unstubAllEnvs();
  }
});
