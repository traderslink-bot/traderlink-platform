// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import Database from "better-sqlite3";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { GET as readLayout, POST as saveLayout } from "@/app/api/charts/layout/route";
import { GET as readChartPreferences } from "@/app/api/charts/preferences/route";
import { GET as readSplits } from "@/app/api/charts/splits/route";
import { GET as readCompany } from "@/app/api/company/details/route";
import { GET as readTechnicals } from "@/app/api/company/technicals/route";
import { GET as readLiveScanner } from "@/app/api/screeners/live/route";
import { GET as readScannerBars } from "@/app/api/screeners/charts/bars/route";
import { GET as readCustomScans } from "@/app/api/scanners/custom/route";
import { GET as readStockScreeners } from "@/app/api/stock-screeners/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { hasWatchlistDashboardNavigationAccess } from "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access";
import type { TraderLinkPlatformRequestIdentity } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import type { ScannerReadModel } from "@/src/modules/scanner/live/contracts";
import { DEFAULT_WORKSPACE_MARKET_SETTINGS } from "../workspace-market-settings";
import { saveWorkspaceMarketSettings } from "./workspace-market-settings-store";
import {
  hasLegacyScannerDashboardAccess,
  hasStockScreenersDashboardAccess,
  MARKET_TOOLS_ACCESS_MODE,
  MARKET_TOOLS_REVIEW_USER_IDS,
  readMarketToolsDashboardAccess,
  SCANNER_DASHBOARD_SUBJECTS,
  STOCK_SCREENERS_DASHBOARD_SUBJECTS,
  TRADING_WORKSPACE_DASHBOARD_SUBJECTS,
} from "./market-tools-dashboard-access";

const fixture = vi.hoisted(() => ({
  database: null as import("better-sqlite3").Database | null,
  directory: "",
  subscribe: vi.fn(() => vi.fn()),
  selectProvider: vi.fn(() => ({ provider: "alpaca", revision: 1 })),
  readSplitGateway: vi.fn(),
  toolPolicies: new Map<string, string>(),
  toolGrants: new Map<string, number>(),
  dashboardMembers: new Set<string>(),
  membershipReadAvailable: true,
}));

function session(userId: string): TraderLinkPlatformRequestIdentity {
  return {
    mode: "platform_session",
    scope: { userId },
    discord: null,
  } as TraderLinkPlatformRequestIdentity;
}

vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformRequestIdentity(headers: Headers) {
    const userId = headers.get("x-fixture-session");
    if (!userId) throw Error("sign_in_required");
    return session(userId);
  },
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, read: (database: Database.Database) => unknown) => read(fixture.database!),
}));
vi.mock("@/src/modules/platform/server/membership/membership-market-tool-access", () => ({
  // Exercise the feature's contract independently of the membership repository rollout.
  hasMarketToolDashboardAdmission: (_database: Database.Database, identity: TraderLinkPlatformRequestIdentity) =>
    fixture.dashboardMembers.has(identity.scope.userId),
  readMarketToolMembershipAccess(_database: Database.Database, userId: string, checks: readonly {
    key: string; existingAccess: boolean; memberReleaseReady: boolean; prePaywallAccess?: boolean;
  }[]) {
    if (!fixture.membershipReadAvailable) throw Error("membership_read_unavailable");
    return new Map(checks.map(({ key, existingAccess, memberReleaseReady, prePaywallAccess }) => [key,
      existingAccess || (memberReleaseReady && (fixture.toolPolicies.get(key) === "enforced"
        ? (fixture.toolGrants.get(`${userId}:${key}`) ?? 0) > Date.now()
        : prePaywallAccess === true)),
    ]));
  },
}));
vi.mock("@/src/modules/platform/server/database/platform-database-config", () => ({
  resolvePlatformDatabaseConfig: () => ({ databasePath: join(fixture.directory, "test.sqlite") }),
}));
vi.mock("./provider-settings", () => ({
  marketDataSelection: fixture.selectProvider,
}));
vi.mock("@/src/modules/scanner/alpaca/client", () => ({
  requestAlpacaGateway: async (operation: string, query: URLSearchParams) =>
    operation === "chart-splits" ? fixture.readSplitGateway(query)
      : { feed: "sip", connected: true, statusesSubscribed: true, statuses: [] },
}));
vi.mock("@/src/modules/scanner/live/server/runtime", () => ({
  readLiveScannerRuntime: (): ScannerReadModel => ({
    status: "ready", tradingDate: "2026-11-12", session: "regular", updatedAtUtc: null,
    universeCount: 1, receivedCount: 1, missingSymbols: [], missingFloatCount: 0, issues: [],
    gainers: { rows: [], focus: [], total: 0 }, momentum: { rows: [], focus: [], total: 0 },
  }),
  subscribeLiveScannerRuntime: fixture.subscribe,
  readLiveScannerMarketMovements: vi.fn(),
  scannerUniverseStore: vi.fn(),
}));
vi.mock("@/src/modules/news/server/press-release-dashboard-access", () => ({
  hasPressReleaseDashboardAccess: () => false,
}));
vi.mock("@/src/modules/company/server/company-market-data", () => ({
  companyUniverseEntry: async (symbol: string) => symbol === "NWGL" ? { symbol } : undefined,
  readCompanyTechnicals: async (symbol: string) => ({ symbol, stats: { price: 0.029 } }),
}));
vi.mock("@/src/modules/company/server/company-snapshot", () => ({
  companySymbol: (value: string) => value,
  readCompanySnapshot: async () => ({ companyProfile: { name: "Fixture Company" } }),
}));

const origin = "https://scanner.example.test";
const watchlistRoster = "TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT";
const drawer = "/api/charts/layout?workspace=scanner";

function request(path: string, actor: string | null, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (actor) headers.set("x-fixture-session", actor);
  return new Request(origin + path, { ...init, headers });
}

it("opens shared facts and chart settings for broker members without opening the current quote routes", async () => {
  const actor = "standalone";
  const company = "/api/company/details?symbol=NWGL";
  const preferences = "/api/charts/preferences";
  expect((await readCompany(request(company, actor))).status).toBe(404);
  saveWorkspaceMarketSettings({ ...DEFAULT_WORKSPACE_MARKET_SETTINGS, brokerAudience: "members" });
  expect((await readCompany(request(company, actor))).status).toBe(200);
  expect((await readLayout(request(drawer, actor))).status).toBe(200);
  expect((await readChartPreferences(request(preferences, actor))).status).toBe(200);
  expect((await readCompany(request(company, null))).status).toBe(401);
  expect((await readTechnicals(request("/api/company/technicals?symbol=NWGL", actor))).status).toBe(404);
  expect((await readLiveScanner(request("/api/screeners/live", actor))).status).toBe(404);
  expect((await readScannerBars(request("/api/screeners/charts/bars?symbol=NWGL", actor))).status).toBe(403);
});

it("withdraws explicitly closed Workspace admission from legacy subjects while preserving independent Scanner access", async () => {
  const first = "aabbccdd-eeff-4000-8000-010000000001";
  const second = "aabbccdd-eeff-4000-8000-010000000002";
  vi.stubEnv(MARKET_TOOLS_REVIEW_USER_IDS, [first, second].join(","));
  expect(readMarketToolsDashboardAccess(session("workspace")).tradingWorkspace).toBe(true);
  const opened = saveWorkspaceMarketSettings({ ...DEFAULT_WORKSPACE_MARKET_SETTINGS, currentAudience: "members" });
  expect(readMarketToolsDashboardAccess(session("standalone")).tradingWorkspace).toBe(true);
  saveWorkspaceMarketSettings({ ...opened, currentAudience: "review", brokerAudience: "members" });
  expect(readMarketToolsDashboardAccess(session(first)).tradingWorkspace).toBe(true);
  expect(readMarketToolsDashboardAccess(session(second)).tradingWorkspace).toBe(true);
  expect(readMarketToolsDashboardAccess(session("workspace")).tradingWorkspace).toBe(false);
  expect(readMarketToolsDashboardAccess(session("scanner"))).toEqual({ scanner: true, tradingWorkspace: false });
  expect((await readLiveScanner(request("/api/screeners/live", "workspace"))).status).toBe(404);
});

beforeEach(() => {
  fixture.membershipReadAvailable = true;
  fixture.selectProvider.mockClear();
  fixture.readSplitGateway.mockReset();
  fixture.toolPolicies.clear();
  fixture.toolGrants.clear();
  fixture.dashboardMembers.clear();
  fixture.directory = mkdtempSync(join(tmpdir(), "market-tools-watchlist-off-"));
  fixture.database = new Database(":memory:");
  fixture.database.exec(`
    CREATE TABLE platform_auth_identities (user_id TEXT, auth_provider TEXT, auth_subject TEXT, status TEXT);
    CREATE TABLE platform_operator_grants (
      operator_grant_id TEXT, user_id TEXT, authority_key TEXT, grant_state TEXT,
      granted_by_kind TEXT, granted_by_user_id TEXT, grant_receipt_sha256 TEXT,
      recovery_of_grant_id TEXT, granted_at_utc TEXT, revoked_at_utc TEXT, updated_at_utc TEXT
    );
    INSERT INTO platform_auth_identities VALUES
      ('scanner', 'discord', '11', 'active'),
      ('workspace', 'discord', '22', 'active'),
      ('revoked', 'discord', '33', 'revoked'),
      ('wrong-provider', 'google', '44', 'active'),
      ('legacy-moomoo', 'discord', '66', 'active'),
      ('standalone', 'email', 'member@example.test', 'active'),
      ('legacy', 'discord', '55', 'active');
  `);
  vi.stubEnv(watchlistRoster, undefined);
  vi.stubEnv(MARKET_TOOLS_ACCESS_MODE, "standard");
  vi.stubEnv(MARKET_TOOLS_REVIEW_USER_IDS, undefined);
  vi.stubEnv(SCANNER_DASHBOARD_SUBJECTS, "11,33,44");
  vi.stubEnv(STOCK_SCREENERS_DASHBOARD_SUBJECTS, undefined);
  vi.stubEnv("TRADERLINK_SCANNER_EARLY_ACCESS_DISCORD_SUBJECT", "66");
  vi.stubEnv(TRADING_WORKSPACE_DASHBOARD_SUBJECTS, "22");
  vi.stubEnv("TRADERLINK_MARKET_HALT_SOURCE", "alpaca");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_URL", "https://alpaca.example.test/");
  vi.stubEnv("TRADERLINK_ALPACA_GATEWAY_TOKEN", "fixture-token");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-12T15:00:30Z"));
});

it("keeps the three review tools within the exact two account identities, even when other identities can use the dashboard", async () => {
  const first = "aabbccdd-eeff-4000-8000-010000000001";
  const second = "aabbccdd-eeff-4000-8000-010000000002";
  vi.stubEnv(MARKET_TOOLS_ACCESS_MODE, undefined);
  vi.stubEnv(MARKET_TOOLS_REVIEW_USER_IDS, first + "," + second);
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "1");
  fixture.dashboardMembers.add("standalone");
  fixture.toolPolicies.set("scanners.access", "enforced");
  fixture.toolPolicies.set("screeners.access", "enforced");
  fixture.toolGrants.set("standalone:scanners.access", Date.now() + 60000);
  fixture.toolGrants.set("standalone:screeners.access", Date.now() + 60000);

  for (const actor of [first, second]) {
    expect(hasWatchlistDashboardNavigationAccess(session(actor))).toBe(false);
    expect(readMarketToolsDashboardAccess(session(actor))).toEqual({ scanner: true, tradingWorkspace: true });
    expect(hasStockScreenersDashboardAccess(session(actor))).toBe(true);
    expect((await readLiveScanner(request("/api/screeners/live", actor))).status).toBe(200);
  }
  for (const actor of ["standalone", "scanner", "workspace", "legacy-moomoo"]) {
    expect(readMarketToolsDashboardAccess(session(actor))).toEqual({ scanner: false, tradingWorkspace: false });
    expect(hasLegacyScannerDashboardAccess(session(actor))).toBe(false);
    expect(hasStockScreenersDashboardAccess(session(actor))).toBe(false);
    expect((await readLiveScanner(request("/api/screeners/live", actor))).status).toBe(404);
    expect((await readCustomScans(request("/api/scanners/custom", actor))).status).toBe(404);
    expect((await readStockScreeners(request("/api/stock-screeners", actor))).status).toBe(404);
  }
  for (const invalid of [undefined, first, first + "," + first, first + "," + second + ",third"]) {
    vi.stubEnv(MARKET_TOOLS_REVIEW_USER_IDS, invalid);
    expect(readMarketToolsDashboardAccess(session(first))).toEqual({ scanner: false, tradingWorkspace: false });
    expect(hasStockScreenersDashboardAccess(session(first))).toBe(false);
  }
});

afterEach(() => {
  fixture.database?.close();
  rmSync(fixture.directory, { recursive: true, force: true });
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it("separates each feature's active Discord roster from Watchlist and preserves the legacy pilot fallback", () => {
  for (const [actor, scanner, tradingWorkspace] of [
    ["scanner", true, false],
    ["workspace", false, true],
    ["revoked", false, false],
    ["wrong-provider", false, false],
    ["unlisted", false, false],
  ] as const) {
    expect(hasWatchlistDashboardNavigationAccess(session(actor))).toBe(false);
    expect(readMarketToolsDashboardAccess(session(actor))).toEqual({ scanner, tradingWorkspace });
  }

  vi.stubEnv(watchlistRoster, "55");
  vi.stubEnv(SCANNER_DASHBOARD_SUBJECTS, undefined);
  vi.stubEnv(TRADING_WORKSPACE_DASHBOARD_SUBJECTS, "");
  expect(readMarketToolsDashboardAccess(session("legacy"))).toEqual({ scanner: true, tradingWorkspace: false });
  vi.stubEnv(SCANNER_DASHBOARD_SUBJECTS, "55,invalid");
  expect(readMarketToolsDashboardAccess(session("legacy"))).toEqual({ scanner: false, tradingWorkspace: false });
  expect(hasStockScreenersDashboardAccess(session("legacy"))).toBe(true);
  vi.stubEnv(STOCK_SCREENERS_DASHBOARD_SUBJECTS, "");
  expect(hasStockScreenersDashboardAccess(session("legacy"))).toBe(false);
  expect(hasLegacyScannerDashboardAccess(session("legacy-moomoo"))).toBe(true);
});

it("keeps independently verified pilot access when the membership reader is unavailable", () => {
  fixture.membershipReadAvailable = false;
  expect(readMarketToolsDashboardAccess(session("scanner"))).toEqual({ scanner: true, tradingWorkspace: false });
  expect(readMarketToolsDashboardAccess(session("workspace"))).toEqual({ scanner: false, tradingWorkspace: true });
  expect(readMarketToolsDashboardAccess(session("standalone"))).toEqual({ scanner: false, tradingWorkspace: false });
  expect(hasStockScreenersDashboardAccess(session("standalone"))).toBe(false);
  expect(hasLegacyScannerDashboardAccess(session("legacy-moomoo"))).toBe(true);
});

it("independently admits members without Discord and denies expired, missing and shadow grants", () => {
  vi.stubEnv(SCANNER_DASHBOARD_SUBJECTS, "");
  vi.stubEnv(TRADING_WORKSPACE_DASHBOARD_SUBJECTS, "");
  const scanner = "scanners.access", screeners = "screeners.access";
  const future = Date.now() + 60_000;
  for (const [user, key, until] of [
    ["standalone", scanner, future], ["standalone", screeners, future],
    ["scanner-only", scanner, future], ["screeners-only", screeners, future],
    ["expired", scanner, Date.now()], ["expired", screeners, Date.now()],
  ] as const) fixture.toolGrants.set(`${user}:${key}`, until);
  fixture.toolPolicies.set(scanner, "enforced");
  fixture.toolPolicies.set(screeners, "enforced");
  for (const [user, scannerAccess, screenerAccess] of [
    ["standalone", true, true], ["scanner-only", true, false], ["screeners-only", false, true],
    ["expired", false, false], ["unlisted", false, false],
  ] as const) {
    const identity = session(user);
    expect(hasWatchlistDashboardNavigationAccess(identity)).toBe(false);
    expect(readMarketToolsDashboardAccess(identity)).toEqual({ scanner: scannerAccess, tradingWorkspace: false });
    expect(hasLegacyScannerDashboardAccess(identity)).toBe(scannerAccess);
    expect(hasStockScreenersDashboardAccess(identity)).toBe(screenerAccess);
  }
  fixture.toolPolicies.set(scanner, "shadow");
  fixture.toolPolicies.set(screeners, "off");
  expect(readMarketToolsDashboardAccess(session("standalone")).scanner).toBe(false);
  expect(hasLegacyScannerDashboardAccess(session("standalone"))).toBe(false);
  expect(hasStockScreenersDashboardAccess(session("standalone"))).toBe(false);
});

it("serves live Scanner to an eligible email account before enforcement with Watchlist off", async () => {
  fixture.dashboardMembers.add("standalone");
  const path = "/api/screeners/live?stream=1";
  const member = session("standalone");
  expect(member.discord).toBeNull();
  expect(hasWatchlistDashboardNavigationAccess(member)).toBe(false);
  expect(hasLegacyScannerDashboardAccess(member)).toBe(false);

  for (const mode of [undefined, "off", "shadow"]) {
    if (mode) fixture.toolPolicies.set("scanners.access", mode);
    const stream = await readLiveScanner(request(path, "standalone"));
    expect(stream.status).toBe(200);
    const reader = stream.body!.getReader();
    try {
      expect(new TextDecoder().decode((await reader.read()).value)).toContain("event: scanner");
    } finally {
      await reader.cancel();
    }
  }
  expect((await readLiveScanner(request(path, "unlisted"))).status).toBe(404);
  expect((await readLiveScanner(request(path, null))).status).toBe(404);
  fixture.toolPolicies.set("scanners.access", "enforced");
  expect((await readLiveScanner(request(path, "standalone"))).status).toBe(404);
});

it("serves the live feed, indicators and company data to either admitted tool while Watchlist is off", async () => {
  const bars = Array.from({ length: 360 }, (_, index) => {
    const close = index < 355 ? 10 - index * 0.01 : 25;
    return { time: Date.now() / 1000 - (360 - index) * 60, open: close, high: close + 0.1, low: close - 0.1, close, volume: 100 };
  });
  const load = vi.fn(async (url: URL) => {
    expect(url.href).toBe("https://alpaca.example.test/bars?symbol=NWGL");
    return Response.json({ symbol: "NWGL", feed: "sip", adjustment: "split", bars });
  });
  vi.stubGlobal("fetch", load);
  const indicatorPath = "/api/screeners/charts/bars?symbol=NWGL&scannerIndicators=1&frame=5m&details=1";
  fixture.toolPolicies.set("scanners.access", "enforced");
  fixture.toolGrants.set("standalone:scanners.access", Date.now() + 60_000);
  fixture.toolPolicies.set("screeners.access", "enforced");
  fixture.toolGrants.set("screeners-only:screeners.access", Date.now() + 60_000);
  for (const actor of ["scanner", "workspace", "standalone"]) {
    expect(hasWatchlistDashboardNavigationAccess(session(actor))).toBe(false);
    const feed = await readLiveScanner(request("/api/screeners/live", actor));
    expect(feed.status).toBe(200);
    expect(await feed.json()).toMatchObject({ status: "ready", tradingDate: "2026-11-12", receivedCount: 1 });
    const stream = await readLiveScanner(request("/api/screeners/live?stream=1", actor));
    expect(stream.headers.get("content-type")).toBe("text/event-stream");
    const reader = stream.body!.getReader();
    try {
      const { value } = await reader.read();
      expect(new TextDecoder().decode(value)).toContain("event: scanner");
    } finally {
      await reader.cancel();
    }

    const indicators = await readScannerBars(request(indicatorPath, actor));
    expect(indicators.status).toBe(200);
    expect(await indicators.json()).toMatchObject({
      readings: expect.arrayContaining([expect.objectContaining({ label: "Moving averages", state: "Bullish alignment" })]),
    });
    const company = await readCompany(request("/api/company/details?symbol=NWGL", actor));
    expect(company.status).toBe(200);
    expect(await company.json()).toEqual({ company: { companyProfile: { name: "Fixture Company" } }, news: [], scannerMember: true });
    const technicals = await readTechnicals(request("/api/company/technicals?symbol=NWGL", actor));
    expect(technicals.status).toBe(200);
    expect(await technicals.json()).toEqual({ symbol: "NWGL", stats: { price: 0.029 } });
  }
  for (const actor of ["unlisted", "screeners-only", null]) {
    expect((await readLiveScanner(request("/api/screeners/live", actor))).status).toBe(404);
    expect((await readScannerBars(request(indicatorPath, actor))).status).toBe(404);
    expect((await readCompany(request("/api/company/details?symbol=NWGL", actor))).status).toBe(actor ? 404 : 401);
    expect((await readTechnicals(request("/api/company/technicals?symbol=NWGL", actor))).status).toBe(actor ? 404 : 401);
  }
  expect(load).toHaveBeenCalledOnce();
});

it("saves and restores drawer layouts per account with Watchlist off and retains write guards", async () => {
  const layout = { version: 1, groups: [{ id: "ticker-1", symbol: "NWGL", panels: [{ id: "chart-1", timeframe: "5m" }] }], selectedPanel: "chart-1" };
  const original = await (await readLayout(request(drawer, "scanner"))).json();
  const body = JSON.stringify({ ...original, layout });
  const headers = {
    origin, host: new URL(origin).host, "content-type": "application/json",
    "sec-fetch-site": "same-origin", [PLATFORM_MUTATION_REQUEST_HEADER]: "1",
  };
  expect((await saveLayout(request(drawer, "scanner", { method: "POST", body }))).status).toBe(403);
  expect((await saveLayout(request(drawer, "scanner", { method: "POST", headers, body }))).status).toBe(200);
  expect(await (await readLayout(request(drawer, "scanner"))).json()).toMatchObject({ layout });
  const workspace = await (await readLayout(request(drawer, "workspace"))).json();
  expect(workspace).toMatchObject({ layout: { groups: [] }, revision: 0 });
  expect((await saveLayout(request(drawer, "workspace", { method: "POST", headers, body }))).status).toBe(409);
  expect((await saveLayout(request(drawer, "scanner", { method: "POST", headers, body }))).status).toBe(409);

  const workspaceLayout = { ...layout, groups: [{ ...layout.groups[0], symbol: "AAPL" }] };
  expect((await saveLayout(request(drawer, "workspace", {
    method: "POST", headers, body: JSON.stringify({ ...workspace, layout: workspaceLayout }),
  }))).status).toBe(200);
  expect(await (await readLayout(request(drawer, "workspace"))).json()).toMatchObject({ layout: workspaceLayout });

  vi.stubEnv(watchlistRoster, "11,22");
  expect(await (await readLayout(request(drawer, "scanner"))).json()).toMatchObject({ layout });
  expect(await (await readLayout(request(drawer, "workspace"))).json()).toMatchObject({ layout: workspaceLayout });
  expect((await readLayout(request(drawer, "unlisted"))).status).toBe(403);
  expect((await readLayout(request(drawer, null))).status).toBe(401);

  const mainLayout = "/api/charts/layout?workspace=main";
  fixture.toolPolicies.set("charts.access", "enforced");
  fixture.toolGrants.set("charts-only:charts.access", Date.now() + 60_000);
  const reviewer = "aabbccdd-eeff-4000-8000-010000000001";
  vi.stubEnv(MARKET_TOOLS_REVIEW_USER_IDS, reviewer + ",aabbccdd-eeff-4000-8000-010000000002");
  expect((await readLayout(request(mainLayout, reviewer))).status).toBe(200);
  expect((await readLayout(request(mainLayout, "charts-only"))).status).toBe(403);
  expect((await readLayout(request(mainLayout, "scanner"))).status).toBe(403);
  expect((await readLayout(request(mainLayout, "unlisted"))).status).toBe(403);
  expect((await readLayout(request(drawer, "charts-only"))).status).toBe(403);
});

it.each(["charts-only", "scanner", "workspace"])(
  "serves qualified split markers to eligible unpaid %s access with Watchlist off",
  async actor => {
    if (actor === "charts-only") fixture.dashboardMembers.add(actor);
    expect(fixture.toolGrants.size).toBe(0);
    expect(hasWatchlistDashboardNavigationAccess(session(actor))).toBe(false);
    const reply = {
      symbol: "NWGL", basisDate: "2026-11-12", coverageStart: "2025-02-10", qualifiedThrough: "2026-11-11",
      splits: [{ id: "fixture-split", date: "2026-11-10", oldShares: 12, newShares: 1 }],
    };
    fixture.readSplitGateway.mockResolvedValue(reply);
    const response = await readSplits(request("/api/charts/splits?symbol=NWGL", actor));
    expect(response.status).toBe(200);
    const body = await response.json();
    const markerId = body.splits[0].id;
    expect(markerId).toMatch(/^[a-f0-9]{64}$/);
    expect(markerId).not.toBe(reply.splits[0].id);
    expect(body).toEqual({ ...reply, splits: [{ ...reply.splits[0], id: markerId }] });
    expect(fixture.readSplitGateway).toHaveBeenCalledExactlyOnceWith(new URLSearchParams({ symbol: "NWGL" }));
    const repeated = await readSplits(request("/api/charts/splits?symbol=NWGL", actor));
    expect(await repeated.json()).toEqual(body);
    expect(reply.splits[0].id).toBe("fixture-split");
  },
);

it.each([[null, 401, "not_authenticated"], ["unlisted", 403, "chart_access_denied"]] as const)(
  "rejects split-marker requests from %s before choosing a provider or reading the gateway",
  async (actor, status, error) => {
    const response = await readSplits(request("/api/charts/splits?symbol=NWGL", actor));
    expect(response.status).toBe(status);
    expect(await response.json()).toEqual({ error });
    expect(fixture.selectProvider).not.toHaveBeenCalled();
    expect(fixture.readSplitGateway).not.toHaveBeenCalled();
  },
);
