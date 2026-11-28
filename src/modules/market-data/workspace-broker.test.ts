// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS, parseWorkspaceMarketSettings, workspaceAudienceAllows } from "./workspace-market-settings";
import { readWorkspaceMarketSettings, saveWorkspaceMarketSettings } from "./server/workspace-market-settings-store";
import { readWorkspacePushBook, readWorkspacePushQuote, readWorkspaceRestQuotes, type WorkspaceQuoteSession } from "./workspace-moomoo-quotes";
import { brokerWorkspaceScannerModel, brokerWorkspaceSavedResults } from "./workspace-broker-rows";
import { readWorkspaceRelativeVolume, workspaceVolumeThrough } from "./server/workspace-broker-volume-history";
import type { WorkspaceMoomooConnection } from "./server/workspace-moomoo-access";
import * as alpacaClient from "@/src/modules/scanner/alpaca/client";
import type { LiveScannerRow, ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import type { SavedScanResults } from "@/src/modules/scanner/custom/definition";

vi.mock("server-only", () => ({}));

const context: WorkspaceQuoteSession = { date: "2026-11-24", session: "regular", regularCloseMinute: 960 };
const at = Date.parse("2026-11-24T14:45:00.000Z");
const price = { data_time_ms: at, last_price: 1.4, prev_close_price: 1.12, high_price: 1.5, low_price: 1.1,
  volume: 300_000, turnover: 420_000, pre_market: { volume: 200_000, high_price: 1.33, low_price: 1.08 } };

describe("broker workspace rollout settings", () => {
  it("starts off, allows the owner to set both audiences independently, and stores revisions atomically", () => {
    const directory = mkdtempSync(join(tmpdir(), "broker-workspace-settings-"));
    try {
      const environment: NodeJS.ProcessEnv = { NODE_ENV: "test", TRADERLINK_PLATFORM_DB_PATH: join(directory, "workspace.sqlite") };
      const initial = readWorkspaceMarketSettings(environment);
      expect(initial).toEqual(DEFAULT_WORKSPACE_MARKET_SETTINGS);
      expect(workspaceAudienceAllows(initial.brokerAudience, true)).toBe(false);
      const saved = saveWorkspaceMarketSettings({ ...initial, brokerAudience: "members", cardTransport: "rest",
        cardRefreshMs: 3000, restBatchSize: 12, restSpacingMs: 2100, restPassWaitMs: 8100 }, environment);
      expect(readWorkspaceMarketSettings(environment)).toEqual(saved);
      expect(saved.currentAudience).toBe("review");
      expect(workspaceAudienceAllows(saved.brokerAudience, false)).toBe(true);
      expect(workspaceAudienceAllows(saved.currentAudience, false)).toBe(false);
      expect(() => saveWorkspaceMarketSettings(initial, environment)).toThrow("workspace_settings_conflict");
      expect(() => parseWorkspaceMarketSettings({ ...saved, restBatchSize: 401 })).toThrow();
      expect(() => parseWorkspaceMarketSettings({ ...saved, cardRefreshMs: -1 })).toThrow();
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});

describe("broker quote and Scanner projection", () => {
  it("uses matching elapsed sessions for RVOL with verified sparse Moomoo history", async () => {
    vi.useFakeTimers({ now: at + 6000 });
    const dates = ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-23", context.date];
    const candle = (date: string, volume: number) => ({
      time_key: Date.parse(`${date}T14:45:00Z`), open: 1, high: 2, low: 1, close: 1.5, volume,
    });
    const request: WorkspaceMoomooConnection["request"] = vi.fn(async input => {
      if (input.operation === "calendar") return { data: { trading_days: dates.map(time => ({ time, trade_date_type: "WHOLE" })) } };
      if (input.operation === "rehab") return { data: { rehabs: [] } };
      if (input.operation !== "history" || input.timeframe !== "15Min") throw Error("unexpected fixture request");
      return { data: { kline_list: [candle(dates[0], 600), candle(dates[1], 600), candle(dates[2], 600), candle(dates[4], 900)] } };
    });
    const connection = { request, current: () => true, generation: "fixture", accessToken: async () => "test" };
    try {
      expect(await readWorkspaceRelativeVolume("NANO", context, workspaceVolumeThrough(Date.now()), connection, new AbortController().signal)).toBe(2.25);
    } finally { vi.useRealTimers(); }
  });

  it("recalculates RVOL from qualified corrected 15-minute history and withholds unproven coverage", async () => {
    vi.useFakeTimers({ now: at + 6000 });
    const dates = ["2026-11-18", "2026-11-19", "2026-11-20", "2026-11-23", context.date];
    const bar = { open: 1, high: 2, low: 1, close: 1.5 };
    const start = (at - 15 * 60_000) / 1000;
    const before = { ...bar, time: start, volume: 400 };
    const readEvidence = vi.spyOn(alpacaClient, "readAlpacaTradeCorrectionEvidence").mockResolvedValue({
      symbol: "NANO", feed: "sip", adjustment: "raw", generation: 1,
      rows: [{ symbol: "NANO", minute: start, before, bar: { ...before, high: 1.8, volume: 100 }, correctionRevision: 1 }],
    });
    let completeNativeWindow = true;
    const request: WorkspaceMoomooConnection["request"] = vi.fn(async input => {
      if (input.operation === "calendar") return { data: { trading_days: dates.map(time => ({ time, trade_date_type: "WHOLE" })) } };
      if (input.operation === "rehab") return { data: { rehabs: [] } };
      if (input.operation === "history" && input.timeframe === "15Min") return { data: { kline_list: [
        ...dates.slice(0, 3).map(date => ({ ...bar, time_key: Date.parse(`${date}T14:45:00Z`), volume: 600 })),
        { ...bar, time_key: at, volume: 900 },
      ] } };
      if (input.operation === "history" && input.timeframe === "1Min") {
        if (!completeNativeWindow) throw Error("native_constituents_unavailable");
        return { data: { kline_list: [
          { ...bar, time_key: (start + 60) * 1000, volume: 400 },
          { ...bar, high: 1.7, time_key: (start + 120) * 1000, volume: 750 },
        ] } };
      }
      throw Error("unexpected fixture request");
    });
    const connection = { request, current: () => true, generation: "fixture", accessToken: async () => "test" };
    const signal = new AbortController().signal;
    const read = () => readWorkspaceRelativeVolume("NANO", context, workspaceVolumeThrough(Date.now()), connection, signal);
    try {
      expect(await read()).toBe(2.125);
      expect(readEvidence).toHaveBeenCalledWith(expect.objectContaining({ symbol: "NANO" }), expect.any(Object), signal);
      completeNativeWindow = false;
      expect(await read()).toBeNull();
    } finally {
      readEvidence.mockRestore();
      vi.useRealTimers();
    }
  });

  it("preserves session volume and does not roll a regular quote into after-hours", () => {
    const quote = readWorkspacePushQuote("NANO", price, context, at);
    expect(quote).toMatchObject({ price: 1.4, premarketVolume: 200_000, regularVolume: 300_000, postMarketVolume: null });
    const after = Date.parse("2026-11-24T21:30:00.000Z");
    expect(readWorkspacePushQuote("NANO", { ...price, data_time_ms: after }, { ...context, session: "after_hours" }, after)).toBeNull();
    expect(readWorkspacePushQuote("NANO", { ...price, data_time_ms: after, after_market: { price: 1.5, volume: 100_000 } },
      { ...context, session: "after_hours" }, after)).toMatchObject({ price: 1.5, regularClose: 1.4, postMarketVolume: 100_000 });
  });

  it("normalizes REST snapshots with the existing batching format and rejects symbols outside the requested roster", () => {
    const rows = readWorkspaceRestQuotes({ ret_code: 0, data: { snapshot_list: [
      { code: "US.NANO", data_date: context.date, update_time: at, last_price: 1.4, prev_close_price: 1.12,
        volume: 300_000, pre_volume: 200_000, bid_price: 1.39, ask_price: 1.41 },
      { code: "US.OTHER", data_date: context.date, update_time: at, last_price: 9 },
    ] } }, ["NANO"], context, at);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ quote: { symbol: "NANO", regularVolume: 300_000 }, book: { bid: 1.39, ask: 1.41 } });
  });

  it("keeps ranked matches while replacing price fields or marking them unavailable", () => {
    const active: LiveScannerRow = { symbol: "NANO", company: "A test company", exchange: "NASDAQ", price: 7.12345,
      sessionGain: 800, volume: 1000, dollarVolume: 7000, marketCap: 200_000, marketCapAtCollection: 200_000, float: 210_000,
      relativeVolume: 100, dayHigh: 8, dayLow: 7, offHighPercent: -10, floatRetrievedAtUtc: null, spreadPercent: 12,
      providerAtUtc: new Date(at).toISOString(), receivedAtUtc: new Date(at).toISOString(),
      activity: { oneMinuteGain: 90, fiveMinuteGain: null, oneMinuteVolume: null, oneMinuteDollarVolume: null,
        fiveMinuteVolume: null, fiveMinuteVolumeSpike: null, volumeAcceleration: null }, reasons: [], news: [] };
    const screen = { rows: [active, { ...active, symbol: "QUIET" }], focus: [], total: 2 };
    const model: ScannerReadModel = { status: "ready", tradingDate: context.date, session: context.session, updatedAtUtc: active.receivedAtUtc,
      universeCount: 2, receivedCount: 2, missingSymbols: [], missingFloatCount: 0, gainers: screen, momentum: screen, issues: [] };
    const quote = readWorkspacePushQuote("NANO", price, context, at)!;
    const book = readWorkspacePushBook({ data_time_ms: at, bid_list: [{ price: 1.39 }], ask_list: [{ price: 1.41 }] }, context, at)!;
    const result = brokerWorkspaceScannerModel(model, symbol => symbol === "NANO" ? { quote, book } : {}, at);
    expect(result.gainers.rows.map(row => row.symbol)).toEqual(["NANO", "QUIET"]);
    expect(result.gainers.rows[0]).toMatchObject({ price: 1.4, dayVolume: 500_000, relativeVolume: null });
    expect(result.gainers.rows[0].spreadPercent).toBeCloseTo(1.42857);
    expect(result.gainers.rows[1]).toMatchObject({ price: null, dayVolume: null, spreadPercent: null });
    expect(JSON.stringify(result)).not.toContain("7.12345");
    const publication: SavedScanResults = { revision: 1, scans: [], results: { scan: { state: "ready", result: {
      status: "open", total: 1, eligible: 1, incomplete: 0, updatedAt: at, rows: [{ symbol: "NANO", exchange: "NASDAQ",
        price: 7.12345, volume: 10, dayChange: 12, belowHigh: 4, dollarVolume: 10, float: 10, marketCap: 10,
        sortValue: 7.12345, matches: [7.12345], matchedRuleIndexes: [0], evidenceReference: "private-evidence" }] } } } };
    const saved = brokerWorkspaceSavedResults(publication, () => ({ quote, book }), "regular", at);
    expect(JSON.stringify(saved)).not.toContain("7.12345");
    expect(JSON.stringify(saved)).not.toContain("private-evidence");
  });
});
