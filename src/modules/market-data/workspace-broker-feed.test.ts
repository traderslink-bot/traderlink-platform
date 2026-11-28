// @vitest-environment node
import { afterEach, expect, it, vi } from "vitest";
import { requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS } from "./workspace-market-settings";
import { readWorkspacePushQuote, type WorkspaceQuoteSession } from "./workspace-moomoo-quotes";
import { subscribeWorkspaceMoomooCards } from "./server/workspace-moomoo-card-feed";
import type { WorkspaceMoomooConnection } from "./server/workspace-moomoo-access";
import { runWorkspaceRestCards, runWorkspaceWebSocketCards } from "./server/workspace-moomoo-card-transport";

import { readWorkspaceRelativeVolume, readWorkspaceVolumeRevisions } from "./server/workspace-broker-volume-history";

vi.mock("server-only", () => ({}));
vi.mock("@/src/modules/scanner/alpaca/client", () => ({ requestAlpacaGateway: vi.fn() }));
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
  const revisions = vi.mocked(readWorkspaceVolumeRevisions).mockResolvedValueOnce(new Map()).mockResolvedValue(
    new Map([["NANO", { revision: "confirmed-revision", pending: false, minutes: [now / 1000 - 86_400] }]]),
  );
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
    expect(revisions).toHaveBeenCalledTimes(2);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(history).toHaveBeenCalledTimes(2);
    owner.close();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(revisions).toHaveBeenCalledTimes(3);
  } finally {
    owner.close();
    vi.unstubAllEnvs();
  }
});

it("publishes confirmed session corrections to open and newly attached cards without replacing live prices", async () => {
  vi.useFakeTimers({ now });
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "http://fixture.invalid");
  vi.mocked(runWorkspaceWebSocketCards).mockImplementation(transportRuns);
  vi.mocked(readWorkspaceVolumeRevisions).mockResolvedValueOnce(new Map()).mockResolvedValue(new Map([
    ["POM", { revision: "confirmed-pom", pending: false, minutes: [now / 1000] }],
    ["NANO", { revision: "confirmed-nano-yesterday", pending: false, minutes: [now / 1000 - 86_400] }],
  ]));
  const sessionTotals = {
    POM: {
      complete: true, date, regularClose: 960, correctionRevision: now,
      sessions: {
        premarket: { high: 6.90, low: 5.90, volume: 20_000 },
        regular: { high: 7.41, low: 6.40, volume: 150_000, dollarVolume: 1_001_000 },
      },
    },
  };
  const gateway = vi.mocked(requestAlpacaGateway).mockResolvedValueOnce({ feed: "sip", sessionTotals: {} })
    .mockResolvedValueOnce({ feed: "sip", sessionTotals })
    .mockRejectedValueOnce(Error("temporary_transport_failure"));
  const owner = subscribeWorkspaceMoomooCards("quote-correction", connection("owner"), vi.fn());
  const secondTab = subscribeWorkspaceMoomooCards("quote-correction", connection("owner"), vi.fn());
  const staleQuote = (price: number) => readWorkspacePushQuote("POM", {
    data_time_ms: Date.now(), last_price: price, high_price: 38, low_price: 6.4, volume: 550_000, turnover: 20_000_000,
    pre_market: { high_price: 7.10, volume: 21_000 },
  }, session, Date.now());
  try {
    owner.update(["POM", "NANO"], session, defaults);
    const [[socket]] = vi.mocked(runWorkspaceWebSocketCards).mock.calls;
    socket.accept("POM", staleQuote(7.2), null);
    socket.accept("NANO", quote("NANO", 1.42), null);
    await vi.advanceTimersByTimeAsync(0);
    expect(owner.quote("POM")?.quote?.regularHigh).toBe(38);

    await vi.advanceTimersByTimeAsync(31_000);
    expect(owner.quote("POM")?.quote).toMatchObject({ regularHigh: null, regularVolume: null, dayHigh: null });
    expect(owner.quote("NANO")?.quote?.price).toBe(1.42);

    await vi.advanceTimersByTimeAsync(30_000);
    secondTab.update(["POM"], session, defaults);
    expect(owner.quote("POM")?.quote).toMatchObject({
      price: 7.2, regularHigh: 7.41, dayHigh: 7.41, dayLow: 5.9, regularVolume: 150_000,
      premarketVolume: 21_000, sessionTurnover: 1_001_000,
    });
    expect(secondTab.quote("POM")).toEqual(owner.quote("POM"));
    expect(gateway.mock.calls[0][1].get("symbols")).toBe("POM");

    socket.accept("POM", staleQuote(7.23), null);
    await vi.advanceTimersByTimeAsync(30_000);
    expect(owner.quote("POM")?.quote).toMatchObject({ price: 7.23, regularHigh: 7.41, regularVolume: 150_000 });
    expect(runWorkspaceWebSocketCards).toHaveBeenCalledOnce();
  } finally {
    secondTab.close();
    owner.close();
    vi.unstubAllEnvs();
    gateway.mockReset();
  }
});
