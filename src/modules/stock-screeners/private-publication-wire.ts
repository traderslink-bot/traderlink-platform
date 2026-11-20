/** Private worker/Railway boundary only. Never import into a browser entry. */
import { createHmac, timingSafeEqual } from "node:crypto";
import { isObject, METRICS, type ScreenerProviderSelection } from "./contracts";
import { validateMarketPack } from "./snapshot-file";
import type { MoomooScreenerOperation } from "./provider-transport";

export const SCREENER_PRIVATE_SCHEMA = "traderslink.screeners.1";
export const SCREENER_PRIVATE_PATHS = Object.freeze({
  selection: "/api/internal/screening/v1/connection",
  universe: "/api/internal/screening/v1/universe",
  operation: "/api/internal/screening/v1/read",
  pack: "/api/internal/screening/v1/snapshot",
  live: "/api/internal/screening/v1/updates",
});
type Data = Record<string, unknown>;
type Resource = keyof typeof SCREENER_PRIVATE_PATHS;
const sessions = ["premarket", "regular", "after_hours", "last_regular"] as const;
const sourceFor = (selection: ScreenerProviderSelection) => selection.provider === "alpaca" ? "Alpaca SIP" : "Moomoo";
const fail = (): never => { throw Error("invalid_screening_contract"); };
const object = (value: unknown): Data => isObject(value) ? value : fail();

/** A separate future gate: the candle-cache gate does not select this contract. */
export function screenerPrivateWireEnabled(environment: Record<string, string | undefined> = process.env) {
  return environment.TRADERLINK_SCREENERS_PRIVATE_CONTRACT === SCREENER_PRIVATE_SCHEMA;
}

function selection(value: unknown): ScreenerProviderSelection {
  const row = object(value);
  if ((row.provider !== "alpaca" && row.provider !== "moomoo") || !Number.isSafeInteger(row.revision) || Number(row.revision) < 0) fail();
  return { provider: row.provider as ScreenerProviderSelection["provider"], revision: Number(row.revision) };
}

/** Reuse the existing private bearer, with explicit feature/version separation. */
export function screenerConnectionContext(value: ScreenerProviderSelection, token: string) {
  const chosen = selection(value);
  if (token.length < 32) fail();
  return createHmac("sha256", token).update(JSON.stringify([SCREENER_PRIVATE_SCHEMA, "screeners", chosen.provider, chosen.revision])).digest("hex");
}
function context(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = object(value);
  const expected = screenerConnectionContext(chosen, token);
  if (row.epoch !== chosen.revision || typeof row.connection !== "string" || !/^[a-f0-9]{64}$/.test(row.connection)
    || !timingSafeEqual(Buffer.from(row.connection), Buffer.from(expected))) throw Error("screener_provider_changed");
}
function stamp(chosen: ScreenerProviderSelection, token: string) {
  return { connection: screenerConnectionContext(chosen, token), epoch: chosen.revision };
}
function envelope<T>(resource: Resource, data: T) { return { schema: SCREENER_PRIVATE_SCHEMA, resource, data }; }
function unwrap(value: unknown, resource: Resource): Data {
  const row = object(value);
  if (row.schema !== SCREENER_PRIVATE_SCHEMA || row.resource !== resource) fail();
  return object(row.data);
}

/** Closed projections exclude arbitrary transport/provider diagnostics. Values are never coerced. */
function rename(value: unknown, names: Record<string, string>, decode = false): Data {
  const row = object(value);
  return Object.fromEntries(Object.entries(names).flatMap(([domain, wire]) => {
    const from = decode ? wire : domain;
    return Object.hasOwn(row, from) && row[from] !== undefined ? [[decode ? domain : wire, row[from]]] : [];
  }));
}
function rows(value: unknown, map: (row: unknown) => unknown): unknown[] {
  if (!Array.isArray(value) || value.length > 30_000) fail();
  return (value as unknown[]).map(map);
}
const rowFields = { symbol: "ticker", exchange: "venue", name: "issuer", priceAt: "tradeObservedAt", quoteAt: "quoteObservedAt" };
const snapshotFields = { version: "format", date: "tradingDate", universeDate: "rosterDate", session: "phase", asOf: "through", capturedAt: "recordedAt", closed: "finished", partial: "incomplete" };
const metricAliases: Record<string, string> = { price: "last", open: "first", high: "peak", low: "trough", volume: "shares", cap: "equityValue", dollarVolume: "tradedValue" };
const metricFields = Object.fromEntries(Object.keys(METRICS).map(key => [key, metricAliases[key] ?? key]));
const domainMetrics = Object.fromEntries(Object.entries(metricFields).map(([key, wire]) => [wire, key]));
function observations(value: unknown, decode = false) {
  const names = decode ? domainMetrics : metricFields;
  return Object.fromEntries(Object.entries(object(value)).map(([key, item]) => {
    if (!Object.hasOwn(names, key) || names[key] === "pressReleaseAge") fail();
    return [names[key], item];
  }));
}
const liveFields = { session: "phase", start: "from", end: "until", generation: "run", sequence: "order", sentAt: "issuedAt", reset: "replace" };
const liveRowFields = { symbol: "ticker", price: "last", priceAt: "tradeObservedAt", vwap: "weighted", vwapAt: "weightedObservedAt" };

export function encodeScreenerPrivateSelection(chosen: ScreenerProviderSelection, token: string) {
  return envelope("selection", { ...stamp(chosen, token), acquisition: chosen.provider === "alpaca" ? "stream" : "linked" });
}
export function decodeScreenerPrivateSelection(value: unknown, token: string): ScreenerProviderSelection {
  const row = unwrap(value, "selection");
  if (row.acquisition !== "stream" && row.acquisition !== "linked") fail();
  const chosen = selection({ provider: row.acquisition === "stream" ? "alpaca" : "moomoo", revision: row.epoch });
  context(row, chosen, token);
  return chosen;
}

export function encodeScreenerPrivatePack(pack: unknown, chosen: ScreenerProviderSelection, initial: boolean, token: string, now = Date.now()) {
  if (typeof initial !== "boolean") fail();
  // Do not erase contradictory source/inner selection before the original validator sees it.
  const actual = validateMarketPack(pack, now, chosen);
  if (!actual.selection) fail(); // No Alpaca0 compatibility default on the neutral wire.
  const frames = Object.fromEntries(sessions.map(session => {
    const snapshot = actual.snapshots[session];
    return [session, { ...rename(snapshot, snapshotFields), ...stamp(chosen, token), entries: snapshot.rows.map(row => ({
      ...rename(row, rowFields), observations: observations(row.values),
    })) }];
  }));
  return envelope("pack", { ...stamp(chosen, token), firstPass: initial,
    snapshot: { activePhase: actual.latest, ...stamp(chosen, token), frames } });
}

export function decodeScreenerPrivatePack(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = unwrap(value, "pack"); context(row, chosen, token);
  if (typeof row.firstPass !== "boolean") fail();
  const pack = object(row.snapshot); context(pack, chosen, token);
  const frames = object(pack.frames);
  const snapshots = Object.fromEntries(sessions.map(session => {
    const snapshot = object(frames[session]); context(snapshot, chosen, token);
    return [session, { ...rename(snapshot, snapshotFields, true), source: sourceFor(chosen),
      rows: rows(snapshot.entries, input => {
        const entry = object(input);
        // Reject a PR or unsupported metric rather than turn a rejected worker payload into an accepted one.
        if (Object.hasOwn(entry, "pressRelease")) fail();
        return { ...rename(entry, rowFields, true), values: observations(entry.observations, true) };
      }) }];
  }));
  return { ...chosen, initial: row.firstPass, pack: { latest: pack.activePhase, selection: { ...chosen }, snapshots } };
}

/** Yield conversion work so unrelated chart/scanner requests retain event-loop access. */
export async function decodeScreenerPrivatePackAsync(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = unwrap(value, "pack"); context(row, chosen, token);
  if (typeof row.firstPass !== "boolean") fail();
  const pack = object(row.snapshot); context(pack, chosen, token);
  const frames = object(pack.frames);
  const snapshots: Data = {};
  for (const session of sessions) {
    const snapshot = object(frames[session]); context(snapshot, chosen, token);
    const entries = snapshot.entries;
    if (!Array.isArray(entries) || entries.length > 30_000) return fail();
    const restored: unknown[] = [];
    for (let index = 0; index < entries.length; index++) {
      if (index % 64 === 0) await new Promise<void>(resolve => setImmediate(resolve));
      const entry = object(entries[index]);
      if (Object.hasOwn(entry, "pressRelease")) fail();
      restored.push({ ...rename(entry, rowFields, true), values: observations(entry.observations, true) });
    }
    snapshots[session] = { ...rename(snapshot, snapshotFields, true), source: sourceFor(chosen), rows: restored };
  }
  return { ...chosen, initial: row.firstPass, pack: { latest: pack.activePhase, selection: { ...chosen }, snapshots } };
}

export function encodeScreenerPrivateLive(frame: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = object(frame);
  const declared = selection(row);
  if (declared.provider !== chosen.provider || declared.revision !== chosen.revision) throw Error("screener_provider_changed");
  return envelope("live", { ...stamp(chosen, token), ...rename(row, liveFields),
    entries: rows(row.rows, entry => rename(entry, liveRowFields)) });
}
export function decodeScreenerPrivateLive(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = unwrap(value, "live"); context(row, chosen, token);
  return { ...chosen, ...rename(row, liveFields, true), rows: rows(row.entries, entry => rename(entry, liveRowFields, true)) };
}

const universeFields = { tradingDate: "tradingDate", sourceTradingDate: "rosterDate", spacingMs: "minimumSpacingMs" };
const listingFields = { symbol: "ticker", exchange: "venue", marketCapAtCollection: "equityValue" };
export function encodeScreenerPrivateUniverse(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = object(value), declared = selection(row);
  if (declared.provider !== chosen.provider || declared.revision !== chosen.revision) throw Error("screener_provider_changed");
  return envelope("universe", { ...stamp(chosen, token), ...rename(row, universeFields), entries: rows(row.stocks, entry => rename(entry, listingFields)) });
}
export function decodeScreenerPrivateUniverse(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  const row = unwrap(value, "universe"); context(row, chosen, token);
  return { ...chosen, ...rename(row, universeFields, true), stocks: rows(row.entries, entry => rename(entry, listingFields, true)) };
}

const actions = { snapshots: "quotes", history: "candles", rehab: "splits", calendar: "sessions" } as const;
const operationFields = { symbols: "tickers", symbol: "ticker", timeframe: "interval", start: "from", end: "until", nextTime: "before", pageToken: "cursor" };
function linked(chosen: ScreenerProviderSelection) { if (selection(chosen).provider !== "moomoo") fail(); }
function operationKind(value: unknown): MoomooScreenerOperation["operation"] {
  if (typeof value !== "string" || !Object.hasOwn(actions, value)) fail();
  return value as MoomooScreenerOperation["operation"];
}
export function encodeScreenerPrivateOperation(operation: MoomooScreenerOperation, chosen: ScreenerProviderSelection, token: string) {
  linked(chosen);
  return envelope("operation", { ...stamp(chosen, token), action: actions[operationKind(operation.operation)], ...rename(operation, operationFields) });
}
export function decodeScreenerPrivateOperation(value: unknown, chosen: ScreenerProviderSelection, token: string) {
  linked(chosen);
  const row = unwrap(value, "operation"); context(row, chosen, token);
  const kind = Object.keys(actions).find(key => actions[key as keyof typeof actions] === row.action);
  if (!kind) fail();
  return { feature: "screeners", ...chosen, operation: kind, ...rename(row, operationFields, true) };
}

const quoteFields: Record<string, string> = {
  code: "ticker", data_date: "tradingDate", update_time: "observedAt", last_price: "last",
  prev_close_price: "priorClose", open_price: "first", high_price: "peak", low_price: "trough",
  volume: "shares", turnover: "tradedValue", total_market_val: "equityValue", bid_price: "bid", ask_price: "ask",
  ...Object.fromEntries(["pre", "after"].flatMap(phase => Object.entries({ price: "Last", volume: "Shares", turnover: "TradedValue", high_price: "Peak", low_price: "Trough" })
    .map(([field, name]) => [`${phase}_${field}`, `${phase === "pre" ? "early" : "late"}${name}`]))),
};
const candleFields = { time_key: "at", open: "first", high: "peak", low: "trough", close: "last", volume: "shares", turnover: "tradedValue" };
const eventFields = { ex_div_date: "date", action_types: "kinds", split_ratio: "ratio" };
const sessionFields = { time: "date", trade_date_type: "kind", trade_second: "seconds" };

/** Retain only fields used by the existing linked collector, never its raw diagnostics. */
function linkedRows(value: unknown, names: Record<string, string>, decode: boolean) {
  return rows(value, input => {
    if (!isObject(input)) return null; // Existing collectors isolate malformed peers.
    const row = rename(input, names, decode);
    for (const [domain, wire] of Object.entries(names)) {
      const key = decode ? domain : wire;
      if (!Object.hasOwn(row, key)) continue;
      const item = row[key];
      if (domain === "code") { if (typeof item !== "string") delete row[key]; }
      else if (["data_date", "ex_div_date", "time"].includes(domain)) {
        if (typeof item !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(item)) delete row[key];
      } else if (domain === "action_types") {
        if (Array.isArray(item)) row[key] = item.map(kind => typeof kind === "string" && /^[A-Z_]{1,32}$/.test(kind) ? kind : null);
        else delete row[key];
      } else if (domain === "trade_date_type") {
        if (item !== "WHOLE" && item !== "MORNING") delete row[key];
      } else if (item !== null && !(typeof item === "number" && Number.isFinite(item))) delete row[key];
    }
    if (names === quoteFields) {
      const key = decode ? "code" : "ticker", code = row[key];
      if (!decode) {
        if (typeof code === "string" && /^US\.[A-Z][A-Z0-9.-]{0,14}$/.test(code)) row[key] = code.slice(3);
        else delete row[key];
      } else if (typeof code === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(code)) row[key] = "US." + code;
      else delete row[key];
    }
    return row;
  });
}
export function encodeScreenerPrivateLinkedReply(kind: MoomooScreenerOperation["operation"], payload: unknown, chosen: ScreenerProviderSelection, token: string) {
  linked(chosen); operationKind(kind);
  const input = object(payload);
  if (input.ret_code !== 0) fail();
  const data = object(input.data);
  let result: Data;
  if (kind === "snapshots") result = { entries: linkedRows(data.snapshot_list, quoteFields, false) };
  else if (kind === "rehab") result = { entries: linkedRows(data.rehabs, eventFields, false) };
  else if (kind === "calendar") result = { entries: linkedRows(data.trading_days, sessionFields, false) };
  else result = {
    entries: linkedRows(data.kline_list, candleFields, false),
    ...rename(data, { volume_precision: "shareDecimals", next_time: "before" }),
    ...(isObject(input.pagination) ? { paging: rename(input.pagination, { has_more: "more", next_page_token: "cursor" }) } : {}),
  };
  return envelope("operation", { ...stamp(chosen, token), action: actions[kind], result });
}
export function decodeScreenerPrivateLinkedReply(kind: MoomooScreenerOperation["operation"], value: unknown, chosen: ScreenerProviderSelection, token: string) {
  linked(chosen); operationKind(kind);
  const row = unwrap(value, "operation"); context(row, chosen, token);
  if (row.action !== actions[kind]) fail();
  const result = object(row.result);
  let data: Data;
  if (kind === "snapshots") data = { snapshot_list: linkedRows(result.entries, quoteFields, true) };
  else if (kind === "rehab") data = { rehabs: linkedRows(result.entries, eventFields, true) };
  else if (kind === "calendar") data = { trading_days: linkedRows(result.entries, sessionFields, true) };
  else data = { kline_list: linkedRows(result.entries, candleFields, true), ...rename(result, { volume_precision: "shareDecimals", next_time: "before" }, true) };
  return { ret_code: 0, data, ...(kind === "history" && isObject(result.paging)
    ? { pagination: rename(result.paging, { has_more: "more", next_page_token: "cursor" }, true) } : {}) };
}
