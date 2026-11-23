// @vitest-environment node
import Database from "better-sqlite3";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { POST } from "@/app/api/levels/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { readOwnedChartLevelMap } from "@/src/modules/market-data/server/chart-evidence-levels-read";
import type { StockLevelsChartEvidenceInput, StockLevelsMap } from "../stock-levels-contract";
import { takeScannerLevelsEvidenceOperation, withScannerLevelsEvidenceOperation } from "./stock-levels-runtime-client";

const state = vi.hoisted(() => ({
  databasePath: "",
  identity: { mode: "platform_session", scope: { userId: "isolated-levels-owner" } },
  scannerAccess: true,
  providers: { scanners: "alpaca", charts: "alpaca" },
  gateway: vi.fn<(operation: string, query: URLSearchParams) => Promise<unknown>>(),
  monitor: vi.fn<() => Promise<void>>(),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: () => state.identity,
}));
vi.mock("@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access", () => ({
  hasWatchlistDashboardNavigationAccess: () => false,
}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({
  hasScannerDashboardAccess: () => state.scannerAccess,
}));
vi.mock("@/src/modules/market-data/server/provider-settings", () => ({
  marketDataSelection: (feature: "scanners" | "charts") => ({ provider: state.providers[feature] }),
}));
vi.mock("@/src/modules/scanner/alpaca/client", () => ({
  requestAlpacaGateway: state.gateway,
}));
vi.mock("@/src/modules/stock-levels/server/monitor-saved-scanner-levels", async importOriginal => ({
  ...await importOriginal<typeof import("@/src/modules/stock-levels/server/monitor-saved-scanner-levels")>(),
  monitorCommittedScannerLevels: state.monitor,
}));
vi.mock("@/src/modules/platform/server/membership/platform-membership-generation-allowance", () => ({
  readGenerationAllowance: () => null,
}));
vi.mock("@/src/modules/platform/server/database/open-platform-database", () => ({
  openPlatformDatabase: () => new Database(state.databasePath, { fileMustExist: true }),
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase(_options: unknown, read: (connection: Database.Database) => unknown) {
    const db = new Database(state.databasePath, { readonly: true, fileMustExist: true });
    try { return read(db); }
    finally { db.close(); }
  },
}));

let directory: string;
let db: Database.Database;
beforeEach(() => {
  state.identity.mode = "platform_session";
  state.scannerAccess = true;
  state.providers.scanners = state.providers.charts = "alpaca";
  state.gateway.mockReset();
  state.monitor.mockReset().mockResolvedValue(undefined);
  directory = mkdtempSync(join(tmpdir(), "pending-levels-route-"));
  state.databasePath = join(directory, "test.sqlite");
  db = new Database(state.databasePath);
  db.exec(`
    CREATE TABLE platform_stock_levels_saved_maps (
      saved_map_id TEXT PRIMARY KEY, user_id TEXT, symbol TEXT, map_json TEXT,
      saved_at_ms INTEGER, updated_at_ms INTEGER, expires_at_ms INTEGER
    );
    CREATE TABLE platform_stock_levels_usage (
      user_id TEXT, symbol TEXT, requested_at_ms INTEGER, new_york_date TEXT
    );
    CREATE TABLE platform_stock_levels_activity (
      user_id TEXT, generated_at_ms INTEGER, new_york_date TEXT
    );
  `);
  vi.stubEnv("TRADERLINK_STOCK_LEVELS_RUNTIME_URL", "https://isolated-levels-runtime.invalid");
  vi.stubEnv("TRADERLINK_STOCK_LEVELS_RUNTIME_ACCESS_TOKEN", "fixture-runtime-only");
  vi.stubEnv("TRADERLINK_SCANNER_VERIFIED_LEVELS", "1");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  db.close();
  rmSync(directory, { recursive: true, force: true });
});

function startPlatformPost(handleRuntime: (request: Request) => Promise<Response>) {
  const runtime = vi.fn((input: URL, init: RequestInit) => handleRuntime(new Request(input, init)));
  vi.stubGlobal("fetch", runtime);
  const response = POST(new Request("https://platform.fixture.invalid/api/levels", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ symbol: "QA" }),
  }));
  return { response, runtime };
}

function persistedWriteCounts() {
  return db.prepare(`SELECT
    (SELECT COUNT(*) FROM platform_stock_levels_saved_maps) AS maps,
    (SELECT COUNT(*) FROM platform_stock_levels_usage) AS usage,
    (SELECT COUNT(*) FROM platform_stock_levels_activity) AS activity`).get();
}

it("waits for the sole Runtime reply, then stores that exact map with a real publication revision", async () => {
  const runtime = Promise.withResolvers<Response>();
  const operation = startPlatformPost(async request => {
    expect(new URL(request.url).pathname).toBe("/api/runtime/stock-levels");
    expect(request.method).toBe("POST");
    expect(await request.json()).toEqual({ symbol: "QA" });
    return runtime.promise;
  });
  await vi.waitFor(() => expect(operation.runtime).toHaveBeenCalledTimes(1));
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
  const now = Date.now();
  const map = {
    symbol: "QA", referencePrice: 4.25, referencePriceAsOf: now - 300,
    calculatedAt: now - 300, cacheStatus: "fresh",
    fullLadderCard: null, nearestSupportResistanceCard: null,
    levelMap: {
      currentPrice: 4.25, rangeState: "normal", nearestSupport: null, nearestResistance: null,
      nextStrongResistance: null, nextStrongSupport: null, supportLevels: [],
      resistanceLevels: [{ side: "resistance", label: "4H resistance", price: 4.3, distancePct: 1 }],
    },
    chartEvidenceProvenance: {
      version: 1, instrument: { id: "isolated-instrument", symbol: "QA", venue: "XNAS" },
      calculatedAtMs: now,
      inputs: [{
        id: "isolated-revision", frame: "4h", datasetId: "isolated-dataset", priceBasisId: "isolated-basis",
        calendarRevision: "isolated-calendar", sessionMode: "regular",
        completedThroughMs: now - 300, availableAtMs: now - 30, acceptedCutoffMs: now - 40, acceptedAtMs: now - 20,
        digest: "a".repeat(64),
      }],
      zones: [{ side: "resistance", index: 0, inputIds: ["isolated-revision"] }],
    },
  } satisfies StockLevelsMap;
  runtime.resolve(Response.json({ map }));
  const response = await operation.response;
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toMatchObject({ state: "ready", savedMap: { savedMapId: expect.any(String) } });
  expect(body.savedMap.map).not.toHaveProperty("chartEvidenceProvenance");
  expect(operation.runtime).toHaveBeenCalledTimes(1);
  expect(persistedWriteCounts()).toEqual({ maps: 1, usage: 1, activity: 1 });
  const stored = readOwnedChartLevelMap(state.identity as Parameters<typeof readOwnedChartLevelMap>[0], "QA");
  expect(stored).toMatchObject({ saved: { savedMapId: body.savedMap.savedMapId, map }, reference: {
    mapId: body.savedMap.savedMapId, revision: expect.stringMatching(/^[a-f0-9]{64}$/),
  } });
  expect(stored?.publishedAt).toBeGreaterThanOrEqual(now / 1_000);
});

it("makes no save, usage charge or retry when the pending Runtime request rejects", async () => {
  const runtime = Promise.withResolvers<Response>();
  const operation = startPlatformPost(() => runtime.promise);
  await vi.waitFor(() => expect(operation.runtime).toHaveBeenCalledTimes(1));
  runtime.reject(new DOMException("Fixture bridge aborted", "AbortError"));
  const response = await operation.response;
  expect(await response.json()).toMatchObject({ state: "unavailable", code: "runtime_unavailable" });
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
  expect(operation.runtime).toHaveBeenCalledTimes(1);
});

function scannerFixture() {
  const now = Date.now();
  const instrument = { id: "qa-listing", symbol: "QA", venue: "XNAS" };
  const common = {
    priceBasisId: "qa-split", calendarRevision: "qa-calendar",
    completedThroughMs: now - 300, availableAtMs: now - 30, acceptedCutoffMs: now - 40, acceptedAtMs: now - 20,
  } as const;
  const daily = {
    ...common, id: "daily", frame: "daily", sessionMode: "extended",
    datasetId: "alpaca-sip:native-et-day:v1", digest: "d".repeat(64),
  } as const;
  const fourHour = {
    ...common, id: "regular-4h", frame: "4h", sessionMode: "regular",
    datasetId: "alpaca-sip:regular-et-0930-4h:v1", digest: "a".repeat(64),
  } as const;
  const receipt = (input: StockLevelsChartEvidenceInput) => ({
    ...input, instrumentId: instrument.id, symbol: instrument.symbol, venue: instrument.venue,
  });
  const receipts = new Map<string, ReturnType<typeof receipt>>([[daily.id, receipt(daily)], [fourHour.id, receipt(fourHour)]]);
  const map = {
    symbol: instrument.symbol, referencePrice: 4.25, referencePriceAsOf: now - 300, referencePriceBasis: "last_trade",
    calculatedAt: now, cacheStatus: "fresh", fullLadderCard: null, nearestSupportResistanceCard: null,
    levelMap: {
      currentPrice: 4.25, rangeState: "normal", nearestSupport: null, nearestResistance: null,
      nextStrongResistance: null, nextStrongSupport: null, supportLevels: [],
      resistanceLevels: [{ side: "resistance", label: "4H resistance", price: 4.3, distancePct: 1 }],
    },
    chartEvidenceProvenance: {
      version: 1, instrument, calculatedAtMs: now, inputs: [daily, fourHour] as StockLevelsChartEvidenceInput[],
      zones: [{ side: "resistance", index: 0, inputIds: [fourHour.id] as string[] }],
    },
  } satisfies StockLevelsMap;
  const postRequest = (body: object = { symbol: "QA" }, signal?: AbortSignal, headers?: Record<string, string>) => new Request("https://platform.fixture.invalid/api/levels", {
    method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body), signal,
  });
  const post = (request = postRequest(), ownerUserId = state.identity.scope.userId) =>
    withScannerLevelsEvidenceOperation({
      request, ownerUserId, symbol: instrument.symbol,
      readAcceptedInput: id => receipts.get(id),
    }, () => POST(request));
  return { map, receipt, receipts, post, postRequest, daily, fourHour };
}

it("selects one private profile on the isolated POST and saves its independently matched map", async () => {
  const { map, post } = scannerFixture();
  vi.stubEnv("TRADERLINK_SCANNER_VERIFIED_LEVELS", "0");
  state.scannerAccess = false;
  state.providers.scanners = state.providers.charts = "moomoo";
  const runtime = vi.fn(async (_url: URL, init: RequestInit) => {
    expect(JSON.parse(init.body as string)).toEqual({ symbol: "QA", profile: "scanner-regular-4h-v1" });
    expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
    return Response.json({ map });
  });
  vi.stubGlobal("fetch", runtime);
  const body = await (await post()).json();
  expect(body).toMatchObject({ state: "ready", savedMap: { map: { referencePriceBasis: "last_trade" } } });
  expect(body.savedMap.map).not.toHaveProperty("chartEvidenceProvenance");
  expect(runtime).toHaveBeenCalledTimes(1);
  expect(state.gateway).not.toHaveBeenCalled();
  expect(state.monitor).not.toHaveBeenCalled();
  expect(readOwnedChartLevelMap(state.identity as Parameters<typeof readOwnedChartLevelMap>[0], "QA")?.saved.map).toEqual(map);
  expect(persistedWriteCounts()).toEqual({ maps: 1, usage: 1, activity: 1 });
});

it.each([
  "missing daily", "missing 4H", "wrong digest", "wrong calendar", "daily-only zone", "native 4H",
  "wrong acceptance clock", "different Daily dataset", "regular-only Daily session",
] as const)(
  "returns unavailable without writing or retrying for %s",
  async problem => {
    const { map, receipt, receipts, post, daily, fourHour } = scannerFixture();
    switch (problem) {
      case "missing daily": receipts.delete(daily.id); break;
      case "missing 4H": receipts.delete(fourHour.id); break;
      case "wrong digest": receipts.set(fourHour.id, { ...receipts.get(fourHour.id)!, digest: "b".repeat(64) }); break;
      case "wrong calendar": receipts.set(fourHour.id, { ...receipts.get(fourHour.id)!, calendarRevision: "other" }); break;
      case "daily-only zone": map.chartEvidenceProvenance.zones[0]!.inputIds = [daily.id]; break;
      case "native 4H": map.chartEvidenceProvenance.inputs[1] = { ...fourHour, datasetId: "qa-native-4h" }; break;
      case "wrong acceptance clock": receipts.set(fourHour.id, { ...receipts.get(fourHour.id)!, acceptedAtMs: fourHour.acceptedAtMs + 1 }); break;
      case "different Daily dataset":
      case "regular-only Daily session": {
        const input: StockLevelsChartEvidenceInput = problem === "different Daily dataset"
          ? { ...daily, datasetId: "other-native-daily" }
          : { ...daily, sessionMode: "regular" };
        map.chartEvidenceProvenance.inputs[0] = input;
        receipts.set(daily.id, receipt(input));
        break;
      }
    }
    const runtime = vi.fn(async () => Response.json({ map }));
    vi.stubGlobal("fetch", runtime);
    expect(await (await post()).json()).toMatchObject({ state: "unavailable", code: "market_data_unavailable" });
    expect(runtime).toHaveBeenCalledTimes(1);
    expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
  },
);

const sameOriginHeaders = {
  "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
  origin: "https://platform.fixture.invalid", host: "platform.fixture.invalid",
};

it.each([
  "unsupported profile", "null profile", "disabled feature", "non-session identity", "Scanner access denied",
  "Scanner provider mismatch", "Charts provider mismatch", "replacement", "cross-site request",
  "missing mutation header", "wrong origin",
] as const)("refuses isolated %s before consuming its operation or saving", async problem => {
  const { receipts, postRequest } = scannerFixture();
  const body: { symbol: string; profile: unknown; replaceSavedMapId?: string } = {
    symbol: "QA", profile: "scanner-regular-4h-v1",
  };
  const headers: Record<string, string> = { ...sameOriginHeaders };
  switch (problem) {
    case "unsupported profile": body.profile = "unsupported"; break;
    case "null profile": body.profile = null; break;
    case "disabled feature": vi.stubEnv("TRADERLINK_SCANNER_VERIFIED_LEVELS", "0"); break;
    case "non-session identity": state.identity.mode = "local_owner"; break;
    case "Scanner access denied": state.scannerAccess = false; break;
    case "Scanner provider mismatch": state.providers.scanners = "moomoo"; break;
    case "Charts provider mismatch": state.providers.charts = "moomoo"; break;
    case "replacement": body.replaceSavedMapId = "00000000-0000-4000-8000-000000000001"; break;
    case "cross-site request": headers["sec-fetch-site"] = "cross-site"; break;
    case "missing mutation header": delete headers[PLATFORM_MUTATION_REQUEST_HEADER]; break;
    case "wrong origin": headers.origin = "https://other.fixture.invalid"; break;
  }
  const request = postRequest(body, undefined, headers);
  const runtime = vi.fn();
  vi.stubGlobal("fetch", runtime);
  const response = await withScannerLevelsEvidenceOperation({
    request, ownerUserId: state.identity.scope.userId, symbol: "QA",
    readAcceptedInput: id => receipts.get(id),
  }, async () => {
    const result = await POST(request);
    expect(result.status).toBe(403);
    expect(await result.json()).toMatchObject({ state: "unavailable", code: "runtime_unavailable" });
    state.identity.mode = "platform_session";
    expect(takeScannerLevelsEvidenceOperation(request,
      state.identity as Parameters<typeof takeScannerLevelsEvidenceOperation>[1], "QA"))
      .toMatchObject({ request, symbol: "QA", ownerUserId: state.identity.scope.userId });
    return result;
  });
  expect(response.status).toBe(403);
  expect(runtime).not.toHaveBeenCalled();
  expect(state.gateway).not.toHaveBeenCalled();
  expect(state.monitor).not.toHaveBeenCalled();
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
});

it("refuses a disabled explicit browser profile without calling Runtime or saving", async () => {
  const { postRequest } = scannerFixture();
  vi.stubEnv("TRADERLINK_SCANNER_VERIFIED_LEVELS", "0");
  const runtime = vi.fn();
  vi.stubGlobal("fetch", runtime);
  const response = await POST(postRequest({ symbol: "QA", profile: "scanner-regular-4h-v1" }, undefined, sameOriginHeaders));
  expect(response.status).toBe(403);
  expect(runtime).not.toHaveBeenCalled();
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
});

it("keeps a validated explicit isolated request on its original receipt reader", async () => {
  const { map, post, postRequest } = scannerFixture();
  const runtime = vi.fn(async () => Response.json({ map }));
  vi.stubGlobal("fetch", runtime);
  const response = await post(postRequest({ symbol: "QA", profile: "scanner-regular-4h-v1" }, undefined, sameOriginHeaders));
  expect(response.status).toBe(200);
  expect(await response.json()).toMatchObject({ state: "ready" });
  expect(runtime).toHaveBeenCalledTimes(1);
  expect(state.gateway).not.toHaveBeenCalled();
  expect(state.monitor).not.toHaveBeenCalled();
  expect(persistedWriteCounts()).toEqual({ maps: 1, usage: 1, activity: 1 });
});

it("allows an admitted explicit browser profile through the normal operation and post-commit hook", async () => {
  const { map, receipts, postRequest } = scannerFixture();
  state.gateway.mockImplementation(async (operation, query) =>
    operation === "accepted-input" ? receipts.get(query.get("id")!) : undefined);
  const runtime = vi.fn(async (_url: URL, init: RequestInit) => {
    expect(JSON.parse(init.body as string)).toEqual({ symbol: "QA", profile: "scanner-regular-4h-v1" });
    return Response.json({ map });
  });
  vi.stubGlobal("fetch", runtime);
  expect(await (await POST(postRequest({ symbol: "QA", profile: "scanner-regular-4h-v1" }, undefined, sameOriginHeaders))).json()).toMatchObject({ state: "ready" });
  expect(runtime).toHaveBeenCalledTimes(1);
  expect(state.gateway).toHaveBeenCalledTimes(2);
  expect(state.monitor).toHaveBeenCalledOnce();
  expect(persistedWriteCounts()).toEqual({ maps: 1, usage: 1, activity: 1 });
});

it("refuses wrong owner, wrong symbol, replacement and reused request operations", async () => {
  const { map, receipts, post, postRequest } = scannerFixture();
  const runtime = vi.fn(async () => Response.json({ map }));
  vi.stubGlobal("fetch", runtime);
  const replaceSavedMapId = "00000000-0000-4000-8000-000000000001";
  for (const result of [
    await post(postRequest(), "other-owner"),
    await post(postRequest({ symbol: "WRONG" })),
    await post(postRequest({ symbol: "QA", replaceSavedMapId })),
  ]) {
    expect(await result.json()).toMatchObject({ state: "unavailable", code: "market_data_unavailable" });
  }
  expect(runtime).not.toHaveBeenCalled();
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });

  const request = postRequest();
  const duplicate = postRequest();
  const results = await withScannerLevelsEvidenceOperation({
    request, ownerUserId: state.identity.scope.userId, symbol: "QA",
    readAcceptedInput: id => receipts.get(id),
  }, () => Promise.all([POST(request), POST(duplicate)]));
  expect(await results[0].json()).toMatchObject({ state: "ready" });
  expect(await results[1].json()).toMatchObject({ state: "unavailable", code: "market_data_unavailable" });
  expect(runtime).toHaveBeenCalledTimes(1);
  expect(persistedWriteCounts()).toEqual({ maps: 1, usage: 1, activity: 1 });
});

it("never saves after an isolated caller aborts, even if the Runtime reply arrives", async () => {
  const { map, post, postRequest } = scannerFixture();
  const controller = new AbortController();
  const runtimeReply = Promise.withResolvers<Response>();
  const runtime = vi.fn((_url: URL, init: RequestInit) => {
    expect(init.signal).toBeDefined();
    return runtimeReply.promise;
  });
  vi.stubGlobal("fetch", runtime);
  const result = post(postRequest({ symbol: "QA" }, controller.signal));
  await vi.waitFor(() => expect(runtime).toHaveBeenCalledTimes(1));
  controller.abort();
  runtimeReply.resolve(Response.json({ map }));
  expect(await (await result).json()).toMatchObject({ state: "unavailable", code: "market_data_unavailable" });
  expect(persistedWriteCounts()).toEqual({ maps: 0, usage: 0, activity: 0 });
});
