import { removePlatformDatabaseTestFixture } from "@/src/test/platform-database-fixture";
import { randomUUID } from "node:crypto";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import Database from "better-sqlite3";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import ScreenersPage from "@/app/(dashboard)/screeners/page";
import { GET, POST } from "@/app/api/stock-screeners/route";
import { POST as receiveLiveFrame } from "@/app/api/internal/stock-screeners-live/route";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { PlatformDiscordSignInService } from "@/src/modules/platform/server/authentication/platform-discord-sign-in-service";
import { platformAuthCookieName } from "@/src/modules/platform/server/authentication/platform-auth-cookies";
import { TRADERLINK_PLATFORM_SESSION_COOKIE } from "@/src/modules/platform/server/authentication/platform-session-service";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { DEFAULT_DEFINITION, type Candidate, type MarketPack, type RunResult, type SavedScreen, type SavedScreens } from "./contracts";
import { completedSessionBars, intradayStructureMetrics } from "./intraday-structure";
import { marketWindows, type ProviderBar } from "./market-metrics";
import type { CommunityPage, SharedScreen } from "./sharing-contracts";

const pageRequest = vi.hoisted(() => ({ headers: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => pageRequest.headers }));
vi.mock("@/app/dashboard-template", () => ({ DashboardPage: "main" }));
vi.mock("@/app/(dashboard)/screeners/stock-screener-workspace", () => ({
  StockScreenerWorkspace: ({ sharedScreen, initialSaved }: { sharedScreen: SharedScreen | null; initialSaved: SavedScreens }) =>
    createElement("pre", null, JSON.stringify({ sharedScreen, initialSaved })),
}));

const origin = "https://screeners-test.example";
const endpoint = origin + "/api/stock-screeners";
const now = new Date("2026-11-14T21:00:00.000Z");
const guild = "100000000000000000";
const premium = "200000000000000000";
const authorSubject = "300000000000000001";
const recipientSubject = "300000000000000002";

function preparedFixture(): MarketPack {
  const calendar = ["2026-11-12", "2026-11-13"].map(date => ({ date, open: "09:30", close: "16:00" }));
  const { latest, windows } = marketWindows(calendar, now.getTime());
  const extraRows = Array.from({ length: 50 }, (_, index): Candidate => ({
    symbol: `QAFILL${String(index).padStart(2, "0")}`, exchange: "NASDAQ", values: { price: 20 + Math.min(index, 48) },
  }));
  const snapshots = Object.fromEntries(Object.values(windows).map(window => {
    const rows = ([["QAUP", 13], ["QADOWN", 7], ["QAINSIDE", 9.5]] as const).map(([symbol, price]) => {
      const bars: ProviderBar[] = [0, 5, 10, 20].map((minutes, index) => {
        const close = index === 3 ? price : 10;
        return { time: (window.from + minutes * 60_000) / 1000, open: close, close, high: close + 1, low: close - 1, volume: 100, vwap: close };
      });
      const priceAt = window.from + 25 * 60_000;
      return { symbol, exchange: symbol === "QAUP" ? "NYSE" : "NASDAQ",
        values: { price, ...intradayStructureMetrics(window, completedSessionBars(window, bars), price, priceAt) }, priceAt };
    });
    return [window.session, { version: 2, source: "Alpaca SIP", session: window.session, date: window.date, universeDate: window.date,
      asOf: window.asOf, capturedAt: now.getTime(), closed: window.closed, partial: false, rows: [...rows, ...extraRows] }];
  })) as MarketPack["snapshots"];
  return { latest, snapshots };
}

function headersFor(token: string): Headers {
  return new Headers({ host: new URL(origin).host, cookie: `${platformAuthCookieName(TRADERLINK_PLATFORM_SESSION_COOKIE)}=${token}` });
}

function memberGet(token: string, query = "") {
  return GET(new Request(endpoint + query, { headers: headersFor(token) }));
}

function memberPost(token: string, body: unknown) {
  const headers = headersFor(token);
  headers.set("origin", origin);
  headers.set("sec-fetch-site", "same-origin");
  headers.set(PLATFORM_MUTATION_REQUEST_HEADER, "1");
  headers.set("content-type", "application/json");
  return POST(new Request(endpoint, { method: "POST", headers, body: JSON.stringify(body) }));
}

async function read<T>(response: Response): Promise<T> {
  expect(response.status).toBe(200);
  return response.json();
}

async function openPage(token: string, shared: string) {
  pageRequest.headers = headersFor(token);
  return renderToStaticMarkup(await ScreenersPage({ searchParams: Promise.resolve({ shared }) }));
}

it("shares opening-range and VWAP rules across two accounts and revokes the link when the source becomes private", async () => {
  const root = mkdtempSync(join(tmpdir(), "traderlink-screeners-two-accounts-"));
  const databasePath = join(root, "test.sqlite");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(now);
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("TRADERLINK_PLATFORM_PUBLIC_ORIGIN", origin);
  vi.stubEnv("TRADERLINK_PLATFORM_DB_PATH", databasePath);
  vi.stubEnv("TRADERLINK_STOCK_SCREENERS_ENABLED", "1");
  vi.stubEnv("DISCORD_GUILD_ID", guild);
  vi.stubEnv("TRADERSLINK_PREMIUM_DISCORD_ROLE_ID", premium);
  vi.stubEnv("TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT", `${authorSubject},${recipientSubject}`);
  try {
    const database = openPlatformDatabase({ mode: "initializer", databasePath });
    let author: string, recipient: string;
    try {
      runPlatformMigrations(database);
      const signIn = new PlatformDiscordSignInService(database);
      function testMember(authSubject: string, name: string) {
        return signIn.signIn({ authSubject, username: name, globalDisplayName: name, avatarHash: null,
          guildId: guild, roleIds: [premium], guildOwner: false, joinedAtUtc: null }).session.token;
      }
      author = testMember(authorSubject, "Test Author");
      recipient = testMember(recipientSubject, "Test Recipient");
    } finally { database.close(); }

    const directory = join(root, "stock-screeners-v1");
    mkdirSync(directory, { mode: 0o700 });
    writeFileSync(join(directory, "market.json"), JSON.stringify(preparedFixture()), { mode: 0o600 });

    const original: SavedScreen = { id: randomUUID(), name: "Author's opening range and VWAP", definition: {
      ...DEFAULT_DEFINITION, session: "last_regular", columns: ["price", "or15Position", "sessionVwap", "vwapPosition"],
      exchanges: ["NASDAQ", "NYSE"],
      rules: [{ metric: "price", operator: "lt", value: 10, exclude: true }, { metric: "vwapPosition", operator: "eq", value: 1 }],
      groups: [[{ metric: "or15Position", operator: "eq", value: 1 }, { metric: "price", operator: "gt", value: 100 }]],
      sort: { ...DEFAULT_DEFINITION.sort, secondary: { metric: "price", dir: "asc" } },
    } };

    const savedAuthor = await read<SavedScreens>(await memberPost(author, { action: "save", saved: { revision: 0, defaultId: null, screens: [original] } }));
    const shared = await read<SharedScreen>(await memberPost(author, { action: "share", operation: "publish", screenId: original.id,
      expectedId: null, revision: savedAuthor.revision, listed: false }));
    expect(shared).toMatchObject({ author: "Test Author", definition: original.definition, listed: false });
    expect((await read<CommunityPage>(await memberGet(recipient, "?community=1"))).screens).toEqual([]);
    expect((await read<SavedScreens>(await memberGet(recipient))).screens).toEqual([]);
    expect(await read(await memberGet(recipient, `?sharing=${original.id}`))).toBeNull();

    const redirect = await memberGet(recipient, `?open=${shared.id}`);
    expect(redirect.status).toBe(303);
    expect(redirect.headers.get("location")).toBe(`/screeners?shared=${shared.id}`);
    expect(await openPage(recipient, shared.id)).toContain("Test Author");

    const run = await read<RunResult>(await memberPost(recipient, { action: "run", definition: shared.definition }));
    expect(run.total).toBe(1);
    expect(run.rows[0]).toMatchObject({ symbol: "QAUP", values: { or15High: 11, or15Low: 9, or15Position: 1, sessionVwap: 10.75, vwapPosition: 1 } });
    expect((await memberGet(author, `?run=${run.id}&page=1&sort=ticker&dir=asc`)).status).toBe(404);
    expect((await memberGet(recipient, `?run=${run.id}&page=1&sort=ticker&dir=asc`)).status).toBe(200);

    const copy: SavedScreen = { id: randomUUID(), name: "Recipient copy", definition: shared.definition };
    const savedRecipient = await read<SavedScreens>(await memberPost(recipient, { action: "save", saved: { revision: 0, defaultId: null, screens: [copy] } }));
    expect(savedRecipient.screens).toEqual([copy]);
    expect((await read<SavedScreens>(await memberGet(author))).screens).toEqual([original]);
    expect((await memberPost(recipient, { action: "share", operation: "revoke", screenId: original.id, expectedId: shared.id })).status).toBe(404);

    await read(await memberPost(author, { action: "share", operation: "visibility", screenId: original.id, expectedId: shared.id, listed: true }));
    expect((await read<CommunityPage>(await memberGet(recipient, "?community=1"))).screens.map(preset => preset.id)).toEqual([shared.id]);
    const personal: SavedScreen = { ...original, definition: { ...original.definition, universe: "list", tickers: ["QAUP"] } };
    expect((await memberPost(author, { action: "save", saved: { ...savedAuthor, revision: 0, screens: [personal] } })).status).toBe(409);
    const catalog = new Database(join(directory, "shared.sqlite"), { fileMustExist: true });
    try {
      catalog.exec("BEGIN IMMEDIATE");
      const blocked = await memberPost(author, { action: "save", saved: { ...savedAuthor, screens: [personal] } });
      expect(blocked.status).toBe(503);
    } finally {
      if (catalog.inTransaction) catalog.exec("ROLLBACK");
      catalog.close();
    }
    expect(await read(await memberGet(author))).toEqual(savedAuthor);
    expect(await openPage(recipient, shared.id)).toContain("Test Author");
    const savedPrivate = await read<SavedScreens>(await memberPost(author, { action: "save", saved: { ...savedAuthor, screens: [personal] } }));
    expect.soft(await openPage(recipient, shared.id)).toContain("&quot;sharedScreen&quot;:null");
    expect.soft((await read<CommunityPage>(await memberGet(recipient, "?community=1"))).screens).toEqual([]);
    expect.soft(await read(await memberGet(author, `?sharing=${original.id}`))).toBeNull();
    const stalePublish = await memberPost(author, { action: "share", operation: "publish", screenId: original.id,
      expectedId: shared.id, revision: savedAuthor.revision, listed: true });
    expect((await stalePublish.json()).error).toBe("private_tickers");

    const savedPublic = await read<SavedScreens>(await memberPost(author, { action: "save", saved: { ...savedPrivate, screens: [original] } }));
    expect(await openPage(recipient, shared.id)).toContain("&quot;sharedScreen&quot;:null");
    expect((await read<CommunityPage>(await memberGet(recipient, "?community=1"))).screens).toEqual([]);
    expect(await read(await memberGet(author, `?sharing=${original.id}`))).toBeNull();
    const reopened = await read<SavedScreens>(await memberGet(recipient));
    expect(reopened.screens).toEqual([copy]);
    const afterRestore = await read<RunResult>(await memberPost(recipient, { action: "run", definition: reopened.screens[0].definition }));
    expect(afterRestore.total).toBe(1);
    expect(afterRestore.rows[0]).toMatchObject({ symbol: "QAUP", values: { or15Position: 1, vwapPosition: 1 } });

    const replacement = await read<SharedScreen>(await memberPost(author, { action: "share", operation: "publish", screenId: original.id,
      expectedId: null, revision: savedPublic.revision, listed: false }));
    expect(replacement.id).not.toBe(shared.id);
    expect(await openPage(recipient, replacement.id)).toContain("Test Author");
    expect(await openPage(recipient, shared.id)).toContain("&quot;sharedScreen&quot;:null");
    expect((await read<CommunityPage>(await memberGet(recipient, "?community=1"))).screens).toEqual([]);
    expect(await read(await memberPost(author, { action: "share", operation: "revoke", screenId: original.id, expectedId: replacement.id }))).toBeNull();
    expect(await openPage(recipient, replacement.id)).toContain("&quot;sharedScreen&quot;:null");
    expect(await read(await memberGet(recipient))).toEqual(reopened);
    const afterRevocation = await read<RunResult>(await memberPost(recipient, { action: "run", definition: reopened.screens[0].definition }));
    expect(afterRevocation.rows.map(row => row.symbol)).toEqual(["QAUP"]);

    const runAll = (token: string) => memberPost(token, { action: "run", definition: { ...DEFAULT_DEFINITION, session: "last_regular" } });
    const authorRun = await read<RunResult>(await runAll(author));
    const recipientRun = await read<RunResult>(await runAll(recipient));
    const sortedPage = (token: string, runId: string, page: number) =>
      memberGet(token, `?run=${runId}&page=${page}&sort=price&dir=asc&thenBy=ticker&thenDir=desc`);
    vi.setSystemTime(now.getTime() + 31 * 60_000);
    for (const [token, pinned] of [[author, authorRun], [recipient, recipientRun]] as const) {
      const sorted = await read<RunResult>(await sortedPage(token, pinned.id, 1));
      expect(sorted).toMatchObject({ id: pinned.id, capturedAt: pinned.capturedAt, page: 1, total: 53 });
      expect(sorted.rows[0].symbol).toBe("QADOWN");
      const nextPage = await read<RunResult>(await sortedPage(token, pinned.id, 2));
      expect(nextPage).toMatchObject({ id: pinned.id, capturedAt: pinned.capturedAt, page: 2 });
      expect(nextPage.rows.map(row => row.symbol)).toEqual(["QAFILL47", "QAFILL49", "QAFILL48"]);

      for (let index = 0; index < 5; index++) await read<RunResult>(await runAll(token));
      expect((await sortedPage(token, pinned.id, 2)).status).toBe(200);
      await read<RunResult>(await runAll(token));
      const evicted = await sortedPage(token, pinned.id, 2);
      expect(evicted.status).toBe(404);
      expect(await evicted.json()).toEqual({ error: "run_expired" });
      const refreshed = await read<RunResult>(await runAll(token));
      expect(refreshed.id).not.toBe(pinned.id);
      expect((await sortedPage(token, refreshed.id, 2)).status).toBe(200);
    }
    expect(await read(await memberGet(author))).toEqual(savedPublic);
    expect(await read(await memberGet(recipient))).toEqual(reopened);

    const regularOpen = Date.parse("2026-11-16T14:30:00Z");
    const regularNow = regularOpen + 45 * 60_000;
    vi.setSystemTime(regularNow);
    const prepared = preparedFixture();
    prepared.latest = "regular";
    prepared.snapshots.regular = {
      ...prepared.snapshots.regular, date: "2026-11-16", asOf: regularNow - 60_000, capturedAt: regularNow, closed: false,
    };
    writeFileSync(join(directory, "market.json"), JSON.stringify(prepared), { mode: 0o600 });
    vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_WORKER", "1");
    const publisherToken = "isolated-test-token-for-the-screener-worker";
    vi.stubEnv("TRADERLINK_STOCK_SCREENERS_LIVE_PUSH_TOKEN", publisherToken);
    const frame = await receiveLiveFrame(new Request(origin + "/api/internal/stock-screeners-live", {
      method: "POST", headers: { authorization: "Bearer " + publisherToken },
      body: JSON.stringify({ session: "regular", start: regularOpen, end: regularOpen + 390 * 60_000, generation: regularNow - 10,
        sentAt: regularNow, sequence: 1, reset: true, rows: [{ symbol: "QAUP", price: 15, priceAt: regularNow - 50, vwap: 11 }] }),
    }));
    expect(frame.status).toBe(204);
    const liveDefinition = { ...DEFAULT_DEFINITION, session: "latest", universe: "list", tickers: ["QAUP"] };
    for (const testToken of [author, recipient]) {
      const liveRun = await read<RunResult>(await memberPost(testToken, { action: "run", definition: liveDefinition }));
      expect(liveRun.rows[0]).toMatchObject({ priceAt: regularNow - 50, values: { price: 15, sessionVwap: 11 } });
    }
    expect((await GET(new Request(endpoint))).status).toBe(404);
  } finally {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    await removePlatformDatabaseTestFixture(root);
  }
}, 30_000);
