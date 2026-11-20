// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { previewPack } from "./fixture";
import { parseLiveScreenerFrame, acceptLiveScreenerFrame } from "./live-screener-book";
import { validateMarketPack } from "./snapshot-file";
import { parseScreenerMoomooUniverse } from "./provider-transport";
import { MoomooScreenerData } from "./moomoo-market-data";
import { moomooScreenerLiveUpdates } from "./moomoo-live-worker";
import { moomooCalendarSessions } from "../market-data/moomoo-calendar";
import {
  screenerPrivateWireEnabled, screenerConnectionContext,
  encodeScreenerPrivateSelection, decodeScreenerPrivateSelection,
  encodeScreenerPrivatePack, decodeScreenerPrivatePack,
  encodeScreenerPrivateLive, decodeScreenerPrivateLive,
  encodeScreenerPrivateUniverse, decodeScreenerPrivateUniverse,
  encodeScreenerPrivateOperation, decodeScreenerPrivateOperation,
  encodeScreenerPrivateLinkedReply, decodeScreenerPrivateLinkedReply,
} from "./private-publication-wire";

const token = "fixture-private-worker-token-1234567890";
const now = Date.parse("2026-11-19T15:00:00Z");
const start = Date.parse("2026-11-19T14:30:00Z"), end = start + 6.5 * 3_600_000;
const chosen = { provider: "alpaca" as const, revision: 4 };
const linked = { provider: "moomoo" as const, revision: 8 };
const frame = { ...chosen, session: "regular", start, end, generation: now - 1_000, sequence: 1, sentAt: now, reset: true,
  rows: [{ symbol: "SHFS", price: .0277, priceAt: now, vwap: .0284, vwapAt: now }] };
function pack(provider = chosen.provider as "alpaca" | "moomoo", revision = chosen.revision) {
  const value = previewPack(now, 3);
  value.selection = { provider, revision };
  for (const snapshot of Object.values(value.snapshots)) {
    snapshot.source = provider === "alpaca" ? "Alpaca SIP" : "Moomoo";
    for (const row of snapshot.rows) delete row.values.pressReleaseAge;
  }
  return value;
}
const state = globalThis as typeof globalThis & { traderlinkScreenersLiveBook?: unknown };
afterEach(() => { delete state.traderlinkScreenersLiveBook; });

describe("private Screeners transport codec, not yet wired to a running publisher", () => {
  it("defaults to legacy and requires a separate explicit future gate", () => {
    expect(screenerPrivateWireEnabled({})).toBe(false);
    expect(screenerPrivateWireEnabled({ TRADERLINK_GATEWAY_CONTRACT: "traderslink.market.1" })).toBe(false);
    expect(screenerPrivateWireEnabled({ TRADERLINK_SCREENERS_PRIVATE_CONTRACT: "traderslink.screeners.1" })).toBe(true);
  });
  it.each([chosen, linked])("round-trips selection %j without transporting its brand or bearer", selection => {
    const wire = encodeScreenerPrivateSelection(selection, token);
    expect(decodeScreenerPrivateSelection(wire, token)).toEqual(selection);
    expect(JSON.stringify(wire)).not.toMatch(/alpaca|moomoo|provider|fixture-private/i);
    expect(screenerConnectionContext(selection, token)).toBe(screenerConnectionContext(selection, token));
    expect(() => decodeScreenerPrivateSelection(wire, token + "wrong")).toThrow("screener_provider_changed");
  });
  it("does not turn missing context/epoch or an unknown acquisition mode into Alpaca0", () => {
    const wire = encodeScreenerPrivateSelection(chosen, token);
    for (const data of [{}, { ...wire.data, epoch: undefined }, { ...wire.data, acquisition: "unknown" }]) {
      expect(() => decodeScreenerPrivateSelection({ ...wire, data }, token)).toThrow();
    }
    expect(() => encodeScreenerPrivateSelection({ provider: "alpaca", revision: -1 }, token)).toThrow();
    expect(() => encodeScreenerPrivateSelection(chosen, "short")).toThrow();
  });
  it.each([chosen, linked])("restores exact full-pack source and selection %j before the original validator", selection => {
    const original = pack(selection.provider, selection.revision);
    const wire = encodeScreenerPrivatePack(original, selection, selection.provider === "moomoo", token, now);
    const decoded = decodeScreenerPrivatePack(wire, selection, token);
    expect(decoded).toEqual({ ...selection, initial: selection.provider === "moomoo", pack: original });
    expect(validateMarketPack(decoded.pack, now, selection)).toEqual(original);
    expect(JSON.stringify(wire)).not.toMatch(/alpaca|moomoo|"provider"|"source"|"high"|"low"|"volume"|fixture-private/i);
  });
  it("rejects contradictory source/inner selection and PR data before projection can hide them", () => {
    const wrongSource = pack(); wrongSource.snapshots.regular.source = "Moomoo";
    expect(() => encodeScreenerPrivatePack(wrongSource, chosen, false, token, now)).toThrow("market_pack_invalid");
    const wrongInner = pack(); wrongInner.selection = linked;
    expect(() => encodeScreenerPrivatePack(wrongInner, chosen, false, token, now)).toThrow("market_pack_provider_mismatch");
    const news = pack(); news.snapshots.regular.rows[0].values.pressReleaseAge = 1;
    expect(() => encodeScreenerPrivatePack(news, chosen, false, token, now)).toThrow("market_pack_invalid");
    const noSelection = pack(); delete noSelection.selection;
    expect(() => encodeScreenerPrivatePack(noSelection, { provider: "alpaca", revision: 0 }, false, token, now)).toThrow("invalid_screening_contract");
  });
  it("keeps old-provider/revision and mixed-frame contexts fenced", () => {
    const wire = encodeScreenerPrivatePack(pack(), chosen, false, token, now);
    expect(() => decodeScreenerPrivatePack(wire, linked, token)).toThrow("screener_provider_changed");
    expect(() => decodeScreenerPrivatePack(wire, { ...chosen, revision: 5 }, token)).toThrow("screener_provider_changed");
    const mixed = structuredClone(wire);
    mixed.data.snapshot.frames.regular.connection = screenerConnectionContext(linked, token);
    expect(() => decodeScreenerPrivatePack(mixed, chosen, token)).toThrow("screener_provider_changed");
  });
  it("preserves the original population and timestamp/metric validation after decoding", () => {
    const decoded = decodeScreenerPrivatePack(encodeScreenerPrivatePack(pack(), chosen, false, token, now), chosen, token);
    const bad = { pack: structuredClone(validateMarketPack(decoded.pack, now, chosen)) };
    bad.pack.snapshots.regular.rows.pop();
    expect(() => validateMarketPack(bad.pack, now, chosen)).toThrow("market_pack_invalid");
    const badClock = { pack: structuredClone(validateMarketPack(decoded.pack, now, chosen)) };
    badClock.pack.snapshots.regular.capturedAt = now + 6_000;
    expect(() => validateMarketPack(badClock.pack, now, chosen)).toThrow("market_pack_invalid");
  });
  it("round-trips live nulls and optional vwapAt, without an omitted-selection compatibility escape", () => {
    const input = { ...frame, rows: [...frame.rows, { symbol: "OMH", price: null, priceAt: null, vwap: null }] };
    const wire = encodeScreenerPrivateLive(input, chosen, token);
    const decoded = decodeScreenerPrivateLive(wire, chosen, token);
    expect(decoded).toEqual(input);
    expect(parseLiveScreenerFrame(decoded, now, chosen)).toEqual(input);
    expect(() => encodeScreenerPrivateLive({ ...frame, provider: undefined, revision: undefined }, chosen, token)).toThrow();
    expect(() => decodeScreenerPrivateLive(wire, linked, token)).toThrow("screener_provider_changed");
    expect(JSON.stringify(wire)).not.toMatch(/alpaca|moomoo|provider|fixture-private/i);
  });
  it("keeps duplicate idempotence, missing-delta resync and generation/reset semantics in the real book", () => {
    const accept = (input: unknown) => acceptLiveScreenerFrame(parseLiveScreenerFrame(
      decodeScreenerPrivateLive(encodeScreenerPrivateLive(input, chosen, token), chosen, token), now, chosen), now);
    expect(accept(frame)).toBe("accepted");
    expect(accept(frame)).toBe("accepted");
    expect(accept({ ...frame, sequence: 3, reset: false })).toBe("resync");
    expect(accept({ ...frame, generation: now, sequence: 1, reset: false })).toBe("resync");
    expect(accept({ ...frame, generation: now, sequence: 1, reset: true })).toBe("accepted");
    expect(accept(frame)).toBe("resync");
  });
  it("restores the existing universe parser input and its pacing/roster identity", () => {
    const original = { ...linked, tradingDate: "2026-11-19", sourceTradingDate: "2026-11-18", spacingMs: 5_000,
      stocks: [{ symbol: "SHFS", exchange: "NASDAQ", marketCapAtCollection: 20_000_000 }] };
    const decoded = decodeScreenerPrivateUniverse(encodeScreenerPrivateUniverse(original, linked, token), linked, token);
    expect(decoded).toEqual(original);
    expect(parseScreenerMoomooUniverse(decoded, linked, "2026-11-19")).toEqual(parseScreenerMoomooUniverse(original, linked, "2026-11-19"));
  });
  it("round-trips all existing linked operation requests without new requests", () => {
    const operations = [
      { operation: "snapshots" as const, symbols: ["SHFS"] },
      { operation: "rehab" as const, symbol: "SHFS" },
      { operation: "calendar" as const, start: "2026-11-01", end: "2026-11-30" },
      { operation: "history" as const, symbol: "SHFS", timeframe: "1Min" as const, start, end, nextTime: start + 60_000, pageToken: "a".repeat(48) },
    ];
    for (const operation of operations) {
      const wire = encodeScreenerPrivateOperation(operation, linked, token);
      expect(decodeScreenerPrivateOperation(wire, linked, token)).toEqual({ feature: "screeners", ...linked, ...operation });
      expect(JSON.stringify(wire)).not.toMatch(/moomoo|alpaca|"provider"|"rehab"|fixture-private/i);
    }
    expect(() => encodeScreenerPrivateOperation(operations[0], chosen, token)).toThrow();
  });
  it("preserves the linked quote-derived live readings and strips unused transport diagnostics", () => {
    const payload = { ret_code: 0, provider: "moomoo", apiKey: "private", data: { snapshot_list: [{
      code: "US.SHFS", data_date: "2026-11-19", update_time: now, last_price: .0277, volume: 100,
      turnover: 2.84, bid_price: .0276, ask_price: .0278, token: "private", metadata: { provider: "moomoo" },
    }, null] } };
    const wire = encodeScreenerPrivateLinkedReply("snapshots", payload, linked, token);
    const decoded = decodeScreenerPrivateLinkedReply("snapshots", wire, linked, token);
    const window = { session: "regular" as const, start, end };
    expect(moomooScreenerLiveUpdates(decoded, ["SHFS"], window, now)).toEqual(moomooScreenerLiveUpdates(payload, ["SHFS"], window, now));
    expect(JSON.stringify(wire)).not.toMatch(/moomoo|apiKey|private|metadata|ret_code|snapshot_list|US\.SHFS/);
  });
  it("preserves linked split adjustment, history units/precision, exact VWAP and pagination fields", async () => {
    const split = { ret_code: 0, data: { rehabs: [{ ex_div_date: "2026-11-19", action_types: ["JOIN"], split_ratio: 2 }] } };
    const history = { ret_code: 0, data: { kline_list: [{ time_key: start - 86_400_000, open: 10, high: 12, low: 9, close: 11, volume: 1000, turnover: 1000 }], volume_precision: 1, next_time: start }, pagination: { has_more: false, next_page_token: "a".repeat(48) } };
    const roundTrip = (kind: "rehab" | "history", data: unknown) => decodeScreenerPrivateLinkedReply(kind, encodeScreenerPrivateLinkedReply(kind, data, linked, token), linked, token);
    expect(roundTrip("history", history)).toEqual(history);
    expect(roundTrip("rehab", split)).toEqual(split);
    const original = new MoomooScreenerData(async operation => operation.operation === "rehab" ? split : history, "2026-11-19");
    const neutral = new MoomooScreenerData(async operation => operation.operation === "rehab" ? roundTrip("rehab", split) : roundTrip("history", history), "2026-11-19");
    const query = new URLSearchParams({ symbols: "SHFS", timeframe: "5Min", start: new Date(start - 86_400_000).toISOString(), end: new Date(end).toISOString() });
    const result = await neutral.get("/v2/stocks/bars", query);
    expect(result).toEqual(await original.get("/v2/stocks/bars", query));
    expect(result).toMatchObject({ bars: { SHFS: [{ o: 20, h: 24, l: 18, c: 22, v: 50, vw: 20 }] } });
  });
  it("preserves full/short calendar sessions and contains nested diagnostic values", () => {
    const calendar = { ret_code: 0, data: { trading_days: [{ time: "2026-11-19", trade_date_type: "WHOLE", trade_second: 23400 }, { time: "2026-11-20", trade_date_type: "MORNING", trade_second: 12600 }] } };
    const decoded = decodeScreenerPrivateLinkedReply("calendar", encodeScreenerPrivateLinkedReply("calendar", calendar, linked, token), linked, token);
    expect(moomooCalendarSessions(decoded, "2026-11-19", "2026-11-20")).toEqual(moomooCalendarSessions(calendar, "2026-11-19", "2026-11-20"));
    const corrupt = { ret_code: 0, data: { snapshot_list: [{ code: "US.SHFS", last_price: { provider: "moomoo", token: "private" } }] } };
    expect(JSON.stringify(encodeScreenerPrivateLinkedReply("snapshots", corrupt, linked, token))).not.toMatch(/moomoo|private|token/);
    expect(() => encodeScreenerPrivateLinkedReply("history", { ret_code: 3, ret_msg: "private error" }, linked, token)).toThrow("invalid_screening_contract");
  });
});
