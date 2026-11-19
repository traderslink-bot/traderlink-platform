import { watchlistIndicatorsVisibilityMigration } from "@/src/modules/platform/server/database/migrations/0222_watchlist_indicators_visibility";
import { readIndicatorsPremiumOnly } from "./watchlist-indicators-visibility";
// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import Database from "better-sqlite3";
import { JSDOM } from "jsdom";
import { runInContext } from "node:vm";
import { platformWatchlistPremiumAccessControlsMigration } from "@/src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_access_controls";
import { platformWatchlistPremiumSupportResistanceMigration } from "@/src/modules/platform/server/database/migrations/0156_platform_watchlist_premium_support_resistance";
import { watchlistMaskedAddedDateMigration } from "@/src/modules/platform/server/database/migrations/0219_watchlist_masked_added_date";
import { watchlistRowVisibilityMigration } from "@/src/modules/platform/server/database/migrations/0218_watchlist_row_visibility";

const adapter = vi.hoisted(() => ({
  db: null as unknown, owner: true, premium: false, signedIn: true, offline: false,
  plans: new Map<string, boolean>(),
}));
vi.mock("./watchlist-admin-authorization", () => ({
  withWatchlistAdminDatabase: (_headers: Headers, operation: (db: unknown, scope: unknown) => unknown) => {
    if (!adapter.owner) throw Error("Owner only");
    return operation(adapter.db, { userId: "owner" });
  },
}));
vi.mock("@/src/modules/platform/server/database/open-readonly-platform-database", () => ({
  withReadonlyPlatformDatabase: (_options: unknown, operation: (db: unknown) => unknown) => {
    if (adapter.offline) throw Error("Unavailable");
    return operation(adapter.db);
  },
}));
vi.mock("@/src/modules/platform/server/authentication/require-platform-request-scope", () => ({
  requireTraderLinkPlatformAuthenticatedRequestIdentity: () => {
    if (!adapter.signedIn) throw Error("No session");
    return { scope: { userId: "member" }, discord: { guildOwner: false, roleIds: [] } };
  },
}));
vi.mock("./platform-discord-watchlist-entitlement", () => ({ hasPlatformDiscordPremiumAccess: () => adapter.premium }));
vi.mock("./watchlist-plan-policy", () => ({ readWatchlistPlanDecisions: () => adapter.plans }));

import { readHiddenTickerAddedVisible, saveHiddenTickerAddedVisible, readRowHiddenFromFree, saveRowHiddenFromFree, saveTickerPremiumOnly, readTickerPremiumOnly, readAnalysisPremiumOnly, canViewWatchlistTicker } from "./watchlist-analysis-visibility";
import { projectWatchlistTickerForViewer, projectWatchlistTickersForViewer } from "./watchlist-ticker-projection";
import { createLiveWatchlistStream, broadcastLiveWatchlistUpdate } from "@/src/lib/live-watchlist/live-watchlist-events";
import { WATCHLIST_PREMIUM_CONTROL } from "../runtime/watchlist-premium-control";
import { GET, POST } from "@/app/api/admin/watchlist/analysis-visibility/route";
import type { LiveWatchlistListSymbol, LiveWatchlistListPayload } from "@/src/lib/live-watchlist/live-watchlist-list";
import type { LiveWatchlistSymbolState } from "@/src/lib/live-watchlist/live-watchlist-types";

const headers = new Headers();
const item = { symbol: "SECRET", status: "live", updatedAt: 100, firstPostedAt: 90, latestPrice: 12.34, watchlistGroup: "main" } as LiveWatchlistListSymbol;
const payload = (symbols = [item]) => ({ symbols, generatedAt: 110 }) as LiveWatchlistListPayload;
let db: Database.Database;
const save = (hidden: boolean) => saveRowHiddenFromFree(db, { symbol: "SECRET", premiumOnly: hidden, actorUserId: "owner" });

beforeEach(() => {
  db = new Database(":memory:"); db.pragma("foreign_keys = ON"); adapter.db = db;
  Object.assign(adapter, { owner: true, premium: false, signedIn: true, offline: false, plans: new Map() });
  db.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES('owner'); CREATE TABLE live_watchlist_symbols(symbol TEXT,state_json TEXT);");
  for (const migration of [platformWatchlistPremiumAccessControlsMigration, platformWatchlistPremiumSupportResistanceMigration, watchlistRowVisibilityMigration, watchlistMaskedAddedDateMigration, watchlistIndicatorsVisibilityMigration]) {
    for (const statement of migration.statements) db.exec(statement);
  }
});
afterEach(() => { db.close(); vi.restoreAllMocks(); });

describe("per-ticker row visibility", () => {
  it("defaults off and persists and audits independently of all existing access settings", () => {
    expect(readRowHiddenFromFree(db, "SECRET")).toBe(false);
    saveTickerPremiumOnly(db, { symbol: "SECRET", premiumOnly: true, actorUserId: "owner" });
    save(true); save(false); save(true);
    expect(readRowHiddenFromFree(db, "SECRET")).toBe(true);
    expect(readTickerPremiumOnly(db, "SECRET")).toBe(true);
    expect(readAnalysisPremiumOnly(db, "SECRET")).toBe(false);
    expect(db.prepare("SELECT previous_hidden_from_free,hidden_from_free FROM platform_watchlist_row_visibility_audit ORDER BY audit_id").all())
      .toEqual([{ previous_hidden_from_free: 0, hidden_from_free: 1 }, { previous_hidden_from_free: 1, hidden_from_free: 0 }, { previous_hidden_from_free: 0, hidden_from_free: 1 }]);
  });
  it("rolls back an incomplete save and rejects malformed flags and symbols", () => {
    db.exec("DROP TABLE platform_watchlist_row_visibility_audit");
    expect(() => save(true)).toThrow();
    expect(readRowHiddenFromFree(db, "SECRET")).toBe(false);
    expect(() => saveRowHiddenFromFree(db, { symbol: "bad!", premiumOnly: true, actorUserId: "owner" })).toThrow();
    expect(() => saveRowHiddenFromFree(db, { symbol: "SECRET", premiumOnly: 1 as unknown as boolean, actorUserId: "owner" })).toThrow();
  });
  it("keeps pre-migration reads compatible without silently accepting writes", () => {
    db.exec("DROP TABLE platform_watchlist_row_visibility");
    expect(readRowHiddenFromFree(db, "SECRET")).toBe(false);
    expect(() => save(true)).toThrow();
    adapter.owner = false;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([item]);
  });
  it.each(Array.from({ length: 32 }, (_, flags) => flags))("preserves the existing checkbox combinations (%i)", flags => {
    const ticker = Boolean(flags & 1), analysis = Boolean(flags & 2), levels = Boolean(flags & 4), hidden = Boolean(flags & 8), added = Boolean(flags & 16);
    saveHiddenTickerAddedVisible(db, { symbol: "SECRET", premiumOnly: added, actorUserId: "owner" });
    db.prepare("INSERT INTO platform_watchlist_analysis_visibility VALUES(?,?,?,?,?)").run("SECRET", Number(analysis), Number(ticker), "2026-11-18", "owner");
    db.prepare("INSERT INTO platform_watchlist_levels_visibility VALUES(?,?,?,?)").run("SECRET", Number(levels), "2026-11-18", "owner");
    save(hidden); adapter.owner = false;
    const rows = projectWatchlistTickersForViewer(payload(), headers).symbols;
    expect(rows.length).toBe(hidden && !added ? 0 : 1);
    if (rows[0] && (hidden || ticker)) {
      expect(rows[0].premiumTickerHidden).toBe(true);
      expect(rows[0].firstPostedAt).toBe(added ? 90 : null);
      expect(rows[0].latestPrice).toBeNull();
      expect(JSON.stringify(rows)).not.toContain("SECRET");
    }
    if (!hidden) expect(rows[0].premiumTickerHidden === true).toBe(ticker);
    adapter.premium = true;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([item]);
    adapter.owner = true; adapter.premium = false;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([item]);
    expect(readAnalysisPremiumOnly(db, "SECRET")).toBe(analysis);
    expect(db.prepare("SELECT premium_only FROM platform_watchlist_levels_visibility WHERE symbol='SECRET'").get()).toEqual({ premium_only: Number(levels) });
  });
  it("honors selected paid-plan decisions and preserves private owner-only rows", () => {
    save(true); adapter.owner = false; adapter.plans.set("SECRET", true);
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([item]);
    adapter.plans.set("SECRET", false); adapter.premium = true;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([]);
    expect(projectWatchlistTickersForViewer(payload([{ ...item, watchlistGroup: "private" }]), headers).symbols).toEqual([]);
    adapter.owner = true;
    expect(projectWatchlistTickersForViewer(payload([{ ...item, watchlistGroup: "private" }]), headers).symbols).toHaveLength(1);
  });
  it("restores the existing placeholder on uncheck and keeps detail access independent", () => {
    save(true); adapter.owner = false;
    expect(canViewWatchlistTicker(headers, "SECRET")).toBe(true);
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([]);
    saveTickerPremiumOnly(db, { symbol: "SECRET", premiumOnly: true, actorUserId: "owner" });
    expect(canViewWatchlistTicker(headers, "SECRET")).toBe(false);
    save(false);
    const rows = projectWatchlistTickersForViewer(payload(), headers).symbols;
    expect(rows[0].premiumTickerHidden).toBe(true);
    expect(JSON.stringify(rows)).not.toContain("SECRET");
  });
  it("hides only the selected ticker and keeps category placement for eligible members", () => {
    save(true); adapter.owner = false;
    const other = { ...item, symbol: "PUBLIC", watchlistGroup: "swings" } as LiveWatchlistListSymbol;
    const source = payload([item, other]);
    expect(projectWatchlistTickersForViewer(source, headers).symbols).toEqual([other]);
    expect(source.symbols).toEqual([item, other]);
    adapter.premium = true;
    expect(projectWatchlistTickersForViewer(source, headers).symbols).toEqual([item, other]);
    adapter.premium = false; save(false);
    expect(projectWatchlistTickersForViewer(source, headers).symbols).toEqual([item, other]);
  });
  it("does not serialize a hidden ticker or price into member SSE", async () => {
    save(true); adapter.owner = false;
    const stream = createLiveWatchlistStream(next => projectWatchlistTickerForViewer(next, headers));
    const reader = stream.getReader(); await reader.read();
    try {
      broadcastLiveWatchlistUpdate({ ...item, cards: {} } as LiveWatchlistSymbolState);
      broadcastLiveWatchlistUpdate({ ...item, symbol: "PUBLIC", latestPrice: 1.23, cards: {} } as LiveWatchlistSymbolState);
      const next = await reader.read(), encoded = new TextDecoder().decode(next.value);
      expect(encoded).not.toContain("SECRET"); expect(encoded).not.toContain("12.34");
      expect(encoded).toContain("PUBLIC");
      expect(projectWatchlistTickerForViewer(item, headers)).toBeNull();
    } finally { await reader.cancel(); }
  });
  it("returns no member rows or ticker-bearing events if access cannot be checked", () => {
    adapter.owner = false; adapter.offline = true;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([]);
    expect(projectWatchlistTickerForViewer(item, headers)?.symbol).toBe("watchlist-refresh");
    adapter.offline = false; adapter.signedIn = false;
    expect(projectWatchlistTickersForViewer(payload(), headers).symbols).toEqual([]);
  });
});

describe("hidden ticker Added date", () => {
  const setDate = (value: boolean) => saveHiddenTickerAddedVisible(db, {symbol:"SECRET",premiumOnly:value,actorUserId:"owner"});
  it("defaults off, persists, audits and rolls back a partial write independently", () => {
    expect(readHiddenTickerAddedVisible(db,"SECRET")).toBe(false);
    setDate(true); setDate(false);
    expect(db.prepare("SELECT previous_show_added,show_added FROM platform_watchlist_hidden_added_visibility_audit ORDER BY audit_id").all()).toEqual([{previous_show_added:0,show_added:1},{previous_show_added:1,show_added:0}]);
    db.exec("DROP TABLE platform_watchlist_hidden_added_visibility_audit");
    expect(()=>setDate(true)).toThrow();
    expect(readHiddenTickerAddedVisible(db,"SECRET")).toBe(false);
    expect(()=>saveHiddenTickerAddedVisible(db,{symbol:"bad!",premiumOnly:true,actorUserId:"owner"})).toThrow();
    expect(()=>saveHiddenTickerAddedVisible(db,{symbol:"SECRET",premiumOnly:1 as unknown as boolean,actorUserId:"owner"})).toThrow();
  });
  it("preserves old schema reads, requires the migration for writes", () => {
    db.exec("DROP TABLE platform_watchlist_hidden_added_visibility");
    expect(readHiddenTickerAddedVisible(db,"SECRET")).toBe(false);
    expect(()=>setDate(true)).toThrow();
    save(true); adapter.owner=false;
    expect(projectWatchlistTickersForViewer(payload(),headers).symbols).toEqual([]);
  });
  it("shows only the publication time, never a fallback timestamp or detail data", () => {
    setDate(true); save(true); adapter.owner=false;
    const current = {...item, updatedAt:999, firstPostedAt:90, companyInfo:{country:"US",updatedAt:500}};
    const row=projectWatchlistTickersForViewer(payload([current]),headers).symbols[0];
    expect(row.firstPostedAt).toBe(90);
    expect(row.companyInfo).toBeUndefined(); expect(row.latestPrice).toBeNull();
    expect(row.symbol).toMatch(/^premium-/); expect(JSON.stringify(row)).not.toContain("SECRET");
    for(const time of [null,NaN,0,-1]) expect(projectWatchlistTickersForViewer(payload([{...item,firstPostedAt:time}]),headers).symbols[0].firstPostedAt).toBeNull();
    setDate(false); expect(projectWatchlistTickersForViewer(payload(),headers).symbols).toEqual([]);
  });
  it("keeps Private entries omitted and selected-plan members fully visible", () => {
    setDate(true); save(true); adapter.owner=false;
    expect(projectWatchlistTickersForViewer(payload([{...item,watchlistGroup:"private"}]),headers).symbols).toEqual([]);
    db.prepare("INSERT INTO live_watchlist_symbols VALUES ('SECRET',?)").run('{"watchlistGroup":"private"}');
    expect(projectWatchlistTickersForViewer(payload(),headers).symbols).toEqual([]);
    db.exec("DELETE FROM live_watchlist_symbols");
    adapter.plans.set("SECRET",true);
    expect(projectWatchlistTickersForViewer(payload(),headers).symbols).toEqual([item]);
    adapter.plans.set("SECRET",false);
    expect(projectWatchlistTickersForViewer(payload(),headers).symbols[0].firstPostedAt).toBe(90);
  });
  it("uses the same date-only projection for member events without ticker or price leakage", () => {
    setDate(true); save(true); adapter.owner=false;
    const row=projectWatchlistTickerForViewer(item,headers)!;
    expect(row.firstPostedAt).toBe(90); expect(row.premiumTickerHidden).toBe(true);
    expect(JSON.stringify(row)).not.toContain("SECRET"); expect(row.latestPrice).toBeNull();
    expect(row).toEqual(projectWatchlistTickersForViewer(payload(),headers).symbols[0]);
  });
  it("saves and reads only the new owner setting without modifying row or Premium choices", async () => {
    const request = new Request("https://app.example.test/api/admin/watchlist/analysis-visibility", {method:"POST",body:JSON.stringify({symbol:"SECRET",control:"added",premiumOnly:true}),headers:{host:"app.example.test",origin:"https://app.example.test","sec-fetch-site":"same-origin","x-traderlink-journal-admin-request":"1"}});
    expect((await POST(request)).status).toBe(200);
    expect(await (await GET(new Request("https://app.example.test/api/admin/watchlist/analysis-visibility?symbol=SECRET&control=added"))).json()).toEqual({symbol:"SECRET",premiumOnly:true});
    expect(readRowHiddenFromFree(db,"SECRET")).toBe(false); expect(readTickerPremiumOnly(db,"SECRET")).toBe(false);
    adapter.owner=false;
    expect((await GET(new Request("https://app.example.test/api/admin/watchlist/analysis-visibility?symbol=SECRET&control=added"))).status).toBe(404);
  });
});

describe("row access owner API", () => {
  const request = (body: unknown, csrf = true) => new Request("https://app.example.test/api/admin/watchlist/analysis-visibility", {
    method: "POST", body: JSON.stringify(body), headers: csrf ? { host: "app.example.test", origin: "https://app.example.test", "sec-fetch-site": "same-origin", "x-traderlink-journal-admin-request": "1" } : {},
  });
  it("reads, saves and reloads only the selected ticker setting", async () => {
    expect(await (await GET(new Request("https://app.example.test/api/admin/watchlist/analysis-visibility?symbol=SECRET&control=row"))).json()).toEqual({ symbol: "SECRET", premiumOnly: false });
    expect((await POST(request({ symbol: "SECRET", control: "row", premiumOnly: true }))).status).toBe(200);
    expect(await (await GET(new Request("https://app.example.test/api/admin/watchlist/analysis-visibility?symbol=SECRET&control=row"))).json()).toEqual({ symbol: "SECRET", premiumOnly: true });
    expect(readTickerPremiumOnly(db, "SECRET")).toBe(false);
    expect(readRowHiddenFromFree(db, "OTHER")).toBe(false);
  });
  it("rejects member writes, invalid booleans, unknown controls and missing CSRF", async () => {
    adapter.owner = false;
    expect((await POST(request({ symbol: "SECRET", control: "row", premiumOnly: true }))).status).toBe(404);
    adapter.owner = true;
    expect((await POST(request({ symbol: "SECRET", control: "row", premiumOnly: true }, false))).status).toBe(404);
    expect((await POST(request({ symbol: "SECRET", control: "row", premiumOnly: "true" }))).status).toBe(400);
    expect((await POST(request({ symbol: "SECRET", control: "unknown", premiumOnly: true }))).status).toBe(400);
    expect(readRowHiddenFromFree(db, "SECRET")).toBe(false);
  });
});

describe("owner control", () => {
  it("places the Added checkbox beside existing access controls and saves/reopens independently", async () => {
    const dom=new JSDOM('<div class="watchlist-access-controls"></div>',{runScripts:"outside-only"});
    const fetch=vi.fn(async (url:string, options:{method:string;body?:string}) => {
      const absolute=new URL(url,"https://app.example.test");
      const request=new Request(absolute,{method:options.method,body:options.body,headers:{host:"app.example.test",origin:"https://app.example.test","sec-fetch-site":"same-origin","x-traderlink-journal-admin-request":"1"}});
      return options.method==="POST"?POST(request):GET(request);
    });
    Object.assign(dom.window,{fetch,AbortSignal});
    runInContext(WATCHLIST_PREMIUM_CONTROL.replace(/^<script>\n?|\n?<\/script>$/g,""),dom.getInternalVMContext());
    const win=dom.window as unknown as {watchlistPremiumControl:(symbol:string,container:Element)=>void};
    const container=dom.window.document.querySelector("div")!;
    try {
      win.watchlistPremiumControl("SECRET",container);
      const inputs=container.querySelectorAll("input");
      await vi.waitFor(()=>expect(inputs[5].disabled).toBe(false));
      expect(inputs).toHaveLength(6); expect(inputs[5].checked).toBe(false);
      expect(inputs[5].getAttribute("aria-label")).toBe("SECRET Show Added date for hidden ticker");
      inputs[5].click(); await vi.waitFor(()=>expect(readHiddenTickerAddedVisible(db,"SECRET")).toBe(true));
      await vi.waitFor(()=>expect(inputs[5].disabled).toBe(false));
      expect(readTickerPremiumOnly(db,"SECRET")).toBe(false); expect(readRowHiddenFromFree(db,"SECRET")).toBe(false);
      container.replaceChildren(); win.watchlistPremiumControl("SECRET",container);
      expect(container.querySelectorAll("input")[5].checked).toBe(true);
      expect(fetch.mock.calls.filter(([,o])=>o.method==="GET")).toHaveLength(1);
      expect(fetch.mock.calls.filter(([,o])=>o.method==="POST")).toHaveLength(1);
      const indicator=container.querySelector<HTMLInputElement>('input[aria-label="SECRET Premium-only indicators"]')!;
      expect(indicator).toBeTruthy();indicator.click();
      await vi.waitFor(()=>expect(readIndicatorsPremiumOnly(db,"SECRET")).toBe(true));
      await vi.waitFor(()=>expect(indicator.disabled).toBe(false));
      container.replaceChildren();win.watchlistPremiumControl("SECRET",container);
      expect(container.querySelector<HTMLInputElement>('input[aria-label="SECRET Premium-only indicators"]')!.checked).toBe(true);
      expect(readHiddenTickerAddedVisible(db,"SECRET")).toBe(true);expect(readAnalysisPremiumOnly(db,"SECRET")).toBe(false);

    } finally {dom.window.close();}
  });

  it("loads and saves the independent row checkbox and restores it after a failed save", async () => {
    const dom = new JSDOM('<div class="watchlist-grouped-actions"><div class="watchlist-access-controls"></div></div>', { runScripts: "outside-only" });
    const requests: Array<{ symbol: string; control: string; premiumOnly: boolean }> = [];
    let fail = false, saved = true;
    const fetch = vi.fn(async (url: string, options: { method: string; body?: string }) => {
      if (options.method === "POST") {
        const input = JSON.parse(options.body!); requests.push(input);
        if (!fail) saved = input.premiumOnly;
        return { ok: !fail, json: async () => fail ? { error: "Not saved" } : input };
      }
      const control = new URL(url, "https://app.example.test").searchParams.get("control");
      return { ok: true, json: async () => control === "all" ? { symbol: "SECRET", settings: { ticker: false, analysis: false, levels: false, indicators: false, row: saved, added: false } } : { symbol: "SECRET", premiumOnly: control === "row" && saved } };
    });
    Object.assign(dom.window, { fetch, AbortSignal });
    runInContext(WATCHLIST_PREMIUM_CONTROL.replace(/^<script>\n?|\n?<\/script>$/g, ""), dom.getInternalVMContext());
    const win = dom.window as unknown as { watchlistPremiumControl: (symbol: string, container: Element) => void };
    const container = dom.window.document.querySelector(".watchlist-access-controls")!;
    try {
      win.watchlistPremiumControl("SECRET", container);
      await new Promise(resolve => setTimeout(resolve, 0));
      const inputs = container.querySelectorAll("input"); expect(inputs.length).toBe(6);
      expect(fetch.mock.calls.filter(([, options]) => options.method === "GET")).toHaveLength(1);
      const input = inputs[4]; expect(input.checked).toBe(true); expect(input.disabled).toBe(false);
      expect(input.getAttribute("aria-label")).toBe("SECRET Hide row from members without paid access");
      input.click(); await new Promise(resolve => setTimeout(resolve, 0));
      expect(requests).toEqual([{ symbol: "SECRET", premiumOnly: false, control: "row" }]);
      expect(input.checked).toBe(false);
      fail = true; input.click(); await new Promise(resolve => setTimeout(resolve, 0));
      expect(input.checked).toBe(false); expect(container.textContent).toContain("Current setting reloaded");
      expect(input.disabled).toBe(false);
    } finally { dom.window.close(); }
  });
  it.each([false, true])("reads actual SQL policy after a committed save loses its acknowledgement (read also fails: %s)", async failReadback => {
    save(true);
    const dom = new JSDOM('<div class="watchlist-access-controls"></div>', { runScripts: "outside-only" });
    let loseAck = true, readUnavailable = false, writes = 0;
    const fetch = vi.fn(async (url: string, options: { method: string; body?: string; headers?: HeadersInit }) => {
      const absolute = new URL(url, "https://app.example.test");
      if (options.method === "POST") {
        writes++;
        const requestHeaders = new Headers(options.headers);
        requestHeaders.set("host", "app.example.test"); requestHeaders.set("origin", "https://app.example.test"); requestHeaders.set("sec-fetch-site", "same-origin");
        const response = await POST(new Request(absolute, { method: "POST", body: options.body,
          headers: requestHeaders }));
        expect(response.status).toBe(200);
        if (loseAck) { loseAck = false; readUnavailable = failReadback; return Response.json({ error: "Lost acknowledgement" }, { status: 503 }); }
        return response;
      }
      if (readUnavailable) return Response.json({ error: "Read unavailable" }, { status: 503 });
      return GET(new Request(absolute));
    });
    Object.assign(dom.window, { fetch, AbortSignal });
    runInContext(WATCHLIST_PREMIUM_CONTROL.replace(/^<script>\n?|\n?<\/script>$/g, ""), dom.getInternalVMContext());
    const win = dom.window as unknown as { watchlistPremiumControl: (symbol: string, container: Element) => void };
    const container = dom.window.document.querySelector("div")!;
    try {
      win.watchlistPremiumControl("SECRET", container);
      const input = container.querySelectorAll("input")[4];
      await vi.waitFor(() => expect(input.disabled).toBe(false));
      expect(input.checked).toBe(true);
      input.click();
      await vi.waitFor(() => expect(input.disabled).toBe(false));
      expect(readRowHiddenFromFree(db, "SECRET")).toBe(false);
      expect(writes).toBe(1);
      if (!failReadback) {
        expect(input.checked).toBe(false); expect(input.indeterminate).toBe(false);
        container.replaceChildren(); win.watchlistPremiumControl("SECRET", container);
        expect(container.querySelectorAll("input")[4].checked).toBe(false);
      } else {
        expect(input.indeterminate).toBe(true); expect(container.textContent).toContain("saved setting is unknown");
        expect(input.getAttribute("role")).toBe("checkbox");
        // The owner can still make an explicit choice; recovery never repeats a POST.
        readUnavailable = false; input.click();
        await vi.waitFor(() => expect(input.disabled).toBe(false));
        expect(input.indeterminate).toBe(false);
        expect(input.checked).toBe(true);
        expect(readRowHiddenFromFree(db, "SECRET")).toBe(true);
        expect(writes).toBe(2);
      }
    } finally { dom.window.close(); }
  });
});
