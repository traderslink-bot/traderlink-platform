// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";

import { GET, POST as runCustomScan, PUT } from "@/app/api/scanners/custom/route";
import { GET as listSavedScans, POST as streamSavedScans } from "@/app/api/scanners/saved/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { EMPTY_SCAN } from "../definition";
import { CustomScanMarket } from "../market";

const state = vi.hoisted(() => ({
  directory: "", admitted: new Set(["alice", "bob"]), workspace: new Set<string>(), open: vi.fn(), news: vi.fn(),
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity: (headers: Headers) => {
    const userId = headers.get("x-actor");
    if (!userId) throw Error("unauthenticated");
    return { scope: { userId } };
  },
}));
vi.mock("@/src/modules/market-data/server/market-tools-dashboard-access", () => ({
  hasScannerDashboardAccess: (identity: { scope: { userId: string } }) => state.admitted.has(identity.scope.userId),
  hasMarketToolsDashboardReadAccess: (identity: { scope: { userId: string } }) =>
    state.admitted.has(identity.scope.userId) || state.workspace.has(identity.scope.userId),
}));
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({ openLiveCustomScans: state.open }));
vi.mock("@/src/modules/stock-screeners/press-releases", () => ({ memberScannerPressReleaseRecords: state.news }));
vi.mock("@/src/modules/platform/server/database/platform-database-config", () => ({
  resolvePlatformDatabaseConfig: () => ({ databasePath: join(state.directory, "test.sqlite") }),
}));

it("saves, reopens and deletes a private scan independently of Watchlist", async () => {
  const directory = mkdtempSync(join(tmpdir(), "saved-scans-route-"));
  state.directory = directory;
  const origin = "https://scanner.test";
  const url = origin + "/api/scanners/custom";
  const read = (user: string) => GET(new Request(url, { headers: { "x-actor": user } }));
  const write = (user: string, data: unknown, valid = true) => PUT(new Request(url, {
    method: "PUT",
    headers: {
      "x-actor": user, origin, host: "scanner.test", "sec-fetch-site": "same-origin",
      ...(valid ? { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" } : {}),
    },
    body: JSON.stringify(data),
  }));
  const scan = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Pullback", definition: EMPTY_SCAN };
  try {
    expect(read("denied").status).toBe(404);
    expect(GET(new Request(url)).status).toBe(404);
    expect((await write("alice", { revision: 0, scans: [scan] }, false)).status).toBe(403);
    expect(await (await write("alice", { revision: 0, scans: [scan] })).json()).toEqual({ revision: 1, scans: [scan] });
    expect(await read("alice").json()).toEqual({ revision: 1, scans: [scan] });
    expect(await read("bob").json()).toEqual({ revision: 0, scans: [] });
    expect((await write("alice", { revision: 0, scans: [] })).status).toBe(409);
    expect(await (await write("alice", { revision: 1, scans: [] })).json()).toEqual({ revision: 2, scans: [] });
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

it("keeps member-visible catalysts scoped on both signed-in scan streams and clears results after revocation", async () => {
  const directory = mkdtempSync(join(tmpdir(), "saved-scans-news-"));
  state.directory = directory;
  vi.useFakeTimers();
  const now = Date.now();
  const origin = "https://scanner.test";
  const request = (path: string, user: string, method: "POST" | "PUT", body: unknown) => new Request(origin + path, {
    method, headers: { "x-actor": user, origin, host: "scanner.test", "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
    body: JSON.stringify(body),
  });
  const scan = { id: "11111111-1111-4111-8111-111111111111", name: "Recent PR", definition: {
    ...EMPTY_SCAN, rules: [{ metric: "pressRelease", minimum: null, maximum: 24 }],
  } };
  const market = new CustomScanMarket();
  market.set("open", now, "qa", [{
    symbol: "AAPL", exchange: "NASDAQ", price: 10, volume: 100, dollarVolume: 1_000,
    marketCap: null, float: null, dayChange: 0, belowHigh: 0, observedAt: now,
  }]);
  state.open.mockReturnValue({ market, close: vi.fn() });
  let entitled = true;
  state.news.mockImplementation((identity: { scope: { userId: string } }) => entitled && identity.scope.userId === "alice"
    ? new Map([["AAPL", { id: "article", publishedAt: now - 5_000, headline: "Actual headline", url: "https://test.invalid/article" }]])
    : undefined);
  const readers: ReadableStreamDefaultReader<Uint8Array>[] = [];
  async function open(response: Promise<Response>) {
    const opened = await response;
    expect(opened.status).toBe(200);
    const reader = opened.body!.getReader();
    readers.push(reader);
    return reader;
  }
  const frame = async (reader: ReadableStreamDefaultReader<Uint8Array>) => JSON.parse(new TextDecoder().decode((await reader.read()).value));
  try {
    const editor = "/api/scanners/custom";
    const input = [{ key: "main", definition: scan.definition, page: 1 }];
    expect((await PUT(request(editor, "alice", "PUT", { revision: 0, scans: [scan] }))).status).toBe(200);
    const alice = await open(runCustomScan(request(editor, "alice", "POST", input)));
    const bob = await open(runCustomScan(request(editor, "bob", "POST", input)));
    expect((await frame(alice)).main).toMatchObject({ total: 1, rows: [{ pressRelease: { id: "article" } }] });
    expect((await frame(bob)).main).toMatchObject({ total: 0, incomplete: 1, rows: [] });

    state.admitted.delete("alice");
    state.workspace.add("alice");
    const workspace = await open(streamSavedScans(request("/api/scanners/saved", "alice", "POST", { ids: [scan.id] })));
    expect((await frame(workspace)).results[scan.id]).toMatchObject({ result: { total: 1, rows: [{ pressRelease: { id: "article" } }] } });
    entitled = false;
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await frame(workspace)).results[scan.id]).toMatchObject({ result: { total: 0, incomplete: 1, rows: [] } });
  } finally {
    await Promise.all(readers.map(reader => reader.cancel()));
    state.admitted.add("alice");
    state.workspace.clear();
    state.open.mockReset();
    state.news.mockReset();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("streams a single private result per saved ID to Workspace and invalidates it on edit or deletion", async () => {
  const directory = mkdtempSync(join(tmpdir(), "saved-scans-workspace-"));
  state.directory = directory;
  const origin = "https://scanner.test";
  const request = (path: string, user: string, method = "GET", body?: unknown, valid = true) => new Request(origin + path, {
    method,
    headers: {
      "x-actor": user, origin, host: "scanner.test", "sec-fetch-site": "same-origin",
      ...(valid ? { [PLATFORM_MUTATION_REQUEST_HEADER]: "1" } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const catalogue = "/api/scanners/saved";
  const editor = "/api/scanners/custom";
  const id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const missing = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
  const scan = { id, name: "First scan", definition: {
    ...EMPTY_SCAN, rules: [{ metric: "dayHigh", minimum: 10, maximum: null }],
  } };
  const market = new CustomScanMarket();
  market.set("open", 1, "qa", [{
    symbol: "AAPL", exchange: "NASDAQ", price: 10, volume: 100, dollarVolume: 1_000,
    marketCap: null, float: null, dayChange: 0, belowHigh: 0, observedAt: 1, facts: { dayHigh: 12 },
  }]);
  const close = vi.fn();
  state.open.mockReturnValue({ market, close });
  const parseFrame = (value: Uint8Array | undefined) => JSON.parse(new TextDecoder().decode(value));
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let other: ReadableStreamDefaultReader<Uint8Array> | undefined;
  let standalone: ReadableStreamDefaultReader<Uint8Array> | undefined;
  vi.useFakeTimers();
  try {
    expect((await PUT(request(editor, "alice", "PUT", { revision: 0, scans: [scan] }))).status).toBe(200);
    state.admitted.delete("alice");
    state.workspace.add("alice");
    expect(GET(request(editor, "alice")).status).toBe(404);
    expect(listSavedScans(request(catalogue, "unauthorized")).status).toBe(404);
    expect(await listSavedScans(request(catalogue, "alice")).json()).toEqual({
      revision: 1, scans: [{ id, name: scan.name }],
    });
    expect((await streamSavedScans(request(catalogue, "alice", "POST", { ids: [id] }, false))).status).toBe(403);
    expect((await streamSavedScans(request(catalogue, "alice", "POST", { ids: [id], definition: EMPTY_SCAN }))).status).toBe(400);
    expect(state.open).not.toHaveBeenCalled();
    const response = await streamSavedScans(request(catalogue, "alice", "POST", { ids: [id, id, missing] }));
    reader = response.body!.getReader();
    const first = parseFrame((await reader.read()).value);
    expect(first).toMatchObject({
      revision: 1, scans: [{ id, name: scan.name }],
      results: {
        [id]: { state: "ready", result: { rows: [{ symbol: "AAPL", matches: [12] }] },
          columns: [{ metric: "dayHigh", label: "Day high", index: 0 }] },
        [missing]: { state: "unavailable" },
      },
    });
    expect(JSON.stringify(first)).not.toContain('"definition"');
    expect(JSON.stringify(first)).not.toContain('"minimum"');
    state.admitted.add("alice");
    const full = await runCustomScan(request(editor, "alice", "POST", [{ key: "main", definition: scan.definition, page: 1 }]));
    standalone = full.body!.getReader();
    expect(parseFrame((await standalone.read()).value).main).toMatchObject({
      rows: first.results[id].result.rows,
      ruleCoverage: [{ checked: 1, failed: 0, unknown: 0 }],
    });
    await standalone.cancel();
    expect(close).toHaveBeenCalledTimes(1);
    expect(market.evaluations).toBe(1);
    const crossOwner = await streamSavedScans(request(catalogue, "bob", "POST", { ids: [id] }));
    other = crossOwner.body!.getReader();
    expect(parseFrame((await other.read()).value)).toEqual({
      revision: 0, scans: [], results: { [id]: { state: "unavailable" } },
    });
    const changed = { ...scan, name: "Updated scan", definition: {
      ...EMPTY_SCAN, rules: [{ metric: "price", minimum: 11, maximum: null }],
    } };
    expect((await PUT(request(editor, "alice", "PUT", { revision: 1, scans: [changed] }))).status).toBe(200);
    expect(parseFrame((await reader.read()).value)).toMatchObject({
      revision: 2, scans: [{ id, name: changed.name }], results: { [id]: { result: { rows: [] } } },
    });
    expect((await PUT(request(editor, "alice", "PUT", { revision: 2, scans: [] }))).status).toBe(200);
    expect(parseFrame((await reader.read()).value)).toEqual({
      revision: 3, scans: [], results: { [id]: { state: "unavailable" }, [missing]: { state: "unavailable" } },
    });

    state.admitted.delete("alice");
    state.workspace.delete("alice");
    await vi.advanceTimersByTimeAsync(10_000);
    expect((await reader.read()).done).toBe(true);
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    await standalone?.cancel();
    await reader?.cancel();
    await other?.cancel();
    state.admitted.add("alice");
    state.workspace.clear();
    state.open.mockReset();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("shares live results with private rules by default and revokes the open stream before another result", async () => {
  const { GET: readOwnShare, PUT: updateShare, POST: watchShare, PATCH: copyShare } = await import("@/app/api/scanners/shared/route");
  const { readSharedScan, sharedScanView } = await import("./shared-scan-store");
  const { savedCustomScansDirectory } = await import("../saved");
  const directory = mkdtempSync(join(tmpdir(), "scanner-sharing-route-"));
  state.directory = directory;
  const origin = "https://scanner.test";
  const shared = "/api/scanners/shared";
  const editor = "/api/scanners/custom";
  const request = (path: string, user: string, method = "GET", body?: unknown) => new Request(origin + path, {
    method,
    headers: { "x-actor": user, origin, host: "scanner.test", "sec-fetch-site": "same-origin",
      [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const scan = { id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Private strategy", definition: {
    ...EMPTY_SCAN, match: "any", rules: [{ metric: "dayHigh", minimum: 7.123456, maximum: null }],
    groups: [{ match: "all", rules: [{ metric: "weeklyCloseVsSma4", minimum: 9, maximum: null }] }],
  } };
  const market = new CustomScanMarket();
  const row = { symbol: "AAPL", exchange: "NASDAQ" as const, price: 10, volume: 100, dollarVolume: 1_000,
    marketCap: null, float: null, dayChange: 0, belowHigh: 0, observedAt: 1,
    weeklyClosedAt: 1, facts: { dayHigh: 12, weeklyCloseVsSma4: 8 } };
  market.set("open", 1, "qa", [row]);
  const close = vi.fn();
  state.open.mockReturnValue({ market, close });
  vi.useFakeTimers();
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    expect((await PUT(request(editor, "alice", "PUT", { revision: 0, scans: [scan] }))).status).toBe(200);
    const published = await updateShare(request(shared, "alice", "PUT", {
      operation: "publish", scanId: scan.id, expectedId: null, revision: 1, mode: "results",
    }));
    expect(published.status).toBe(200);
    const { share } = await published.json();
    expect(await readOwnShare(request(shared + "?scanId=" + scan.id, "bob")).json()).toEqual({ share: null });
    const stored = readSharedScan(savedCustomScansDirectory(), share.id)!;
    expect(sharedScanView(stored)).toEqual({ id: share.id, mode: "results", name: scan.name });
    expect((await copyShare(request(shared, "bob", "PATCH", { id: share.id, name: "Unauthorized copy" }))).status).toBe(404);
    expect((await watchShare(request(shared, "not-admitted", "POST", { id: share.id, page: 1 }))).status).toBe(404);

    const watched = await watchShare(request(shared, "bob", "POST", { id: share.id, page: 1 }));
    expect(watched.status).toBe(200);
    reader = watched.body!.getReader();
    const bytes = new TextDecoder().decode((await reader.read()).value);
    expect(JSON.parse(bytes).shared.rows).toEqual([expect.objectContaining({ symbol: "AAPL", matches: [], sortValue: null })]);
    expect(bytes).not.toMatch(/7\.123456|dayHigh|weeklyCloseVsSma4|matchedRuleIndexes|ruleCoverage|groupCoverage|alternativeReadings|trendContext|evidenceReference/);

    const filtered = await updateShare(request(shared, "alice", "PUT", {
      operation: "publish", scanId: scan.id, expectedId: share.id, revision: 1, mode: "filters",
    }));
    expect(filtered.status).toBe(200);
    const { share: next } = await filtered.json();
    expect(next.id).not.toBe(share.id);
    await vi.advanceTimersByTimeAsync(10_000);
    expect(await reader.read()).toMatchObject({ done: true });
    expect(close).toHaveBeenCalledTimes(1);
    expect(sharedScanView(readSharedScan(savedCustomScansDirectory(), next.id)!).definition).toEqual(scan.definition);
    const copied = await copyShare(request(shared, "bob", "PATCH", { id: next.id, name: "My copy" }));
    expect(copied.status).toBe(201);
    expect(await GET(request(editor, "bob")).json()).toMatchObject({ scans: [{ name: "My copy", definition: scan.definition }] });
    expect((await updateShare(request(shared, "bob", "PUT", { operation: "revoke", scanId: scan.id, expectedId: next.id }))).status).toBe(409);
    expect((await updateShare(request(shared, "alice", "PUT", { operation: "revoke", scanId: scan.id, expectedId: next.id }))).status).toBe(200);
    expect((await watchShare(request(shared, "bob", "POST", { id: next.id, page: 1 }))).status).toBe(404);
  } finally {
    await reader?.cancel();
    state.open.mockReset();
    vi.useRealTimers();
    rmSync(directory, { recursive: true, force: true });
  }
});

it("applies, saves and reloads mixed All/Any rules with identical matches and unknown counts", async () => {
  const directory = mkdtempSync(join(tmpdir(), "scanner-group-round-trip-"));
  state.directory = directory;
  const origin = "https://scanner.test";
  const url = origin + "/api/scanners/custom";
  const request = (method: string, body?: unknown) => new Request(url, {
    method, headers: { origin, host: "scanner.test", "sec-fetch-site": "same-origin", "x-actor": "alice",
      [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify(body),
  });
  const now = Date.now();
  const market = new CustomScanMarket();
  const rows = [
    ["AAA", 5, 10_000_000, 0], ["BBB", 2, 11_000_000, 30], ["CCC", 6, 9_000_000, 30],
    ["DDD", 4, null, 0], ["EEE", 6, null, 0], ["FFF", 6, null, 30], ["GGG", 5, 15_000_000, 0],
  ] as const;
  market.set("open", now, "regular", rows.map(([symbol, price, float, dayChange]) => ({
    symbol, price, float, dayChange, observedAt: now, exchange: "NASDAQ", belowHigh: 0,
    marketCap: null, volume: 100, dollarVolume: 100 * price,
  })));
  state.open.mockReturnValue({ market, close: vi.fn() });
  const price = { metric: "price", minimum: null, maximum: 5 };
  const float = { metric: "float", minimum: null, maximum: 10_000_000 };
  const change = { metric: "dayChange", minimum: 30, maximum: null };
  const cases = [
    { outer: "all", inner: "any", symbols: ["AAA", "BBB"], incomplete: 1 },
    { outer: "any", inner: "all", symbols: ["AAA", "BBB", "CCC", "DDD", "GGG"], incomplete: 1 },
    { outer: "all", inner: "all", symbols: [], incomplete: 0 },
    { outer: "any", inner: "any", symbols: ["AAA", "BBB", "CCC", "DDD", "FFF", "GGG"], incomplete: 1 },
  ] as const;
  const id = "22222222-2222-4222-8222-222222222222";
  const assertRun = async (definition: unknown, expected: typeof cases[number]) => {
    const response = await runCustomScan(request("POST", [{key: "main", page: 1, definition}]));
    expect(response.status).toBe(200);
    const reader = response.body!.getReader();
    try {
      const frame = JSON.parse(new TextDecoder().decode((await reader.read()).value)).main;
      expect(frame.rows.map((row: {symbol: string}) => row.symbol).sort()).toEqual(expected.symbols);
      expect(frame).toMatchObject({ eligible: rows.length, total: expected.symbols.length,
        incomplete: expected.incomplete, excluded: rows.length - expected.symbols.length - expected.incomplete });
    } finally { await reader.cancel(); }
  };
  try {
    for (const [revision, example] of cases.entries()) {
      const definition = { ...EMPTY_SCAN, ...(example.outer === "any" ? {match: "any"} : {}),
        rules: [price], groups: [{match: example.inner, rules: [float, change]}] };
      await assertRun(definition, example);
      const entry = {id, name: "Nano momentum", definition};
      expect((await PUT(request("PUT", {revision, scans: [entry]}))).status).toBe(200);
      const reopened = await GET(request("GET")).json();
      expect(reopened).toEqual({revision: revision + 1, scans: [entry]});
      await assertRun(reopened.scans[0].definition, example);
    }
  } finally {
    state.open.mockReset();
    rmSync(directory, { recursive: true, force: true });
  }
});
