import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

let closed = 0, refreshed = false, dropQuote = false, accessCalls = 0, assertions = 0, disabled = new Set(), selectedSubject = null, budgetCalls = 0;
const context = createContext({ process: { env: {} }, Object });
const connection = { connectionId: "fixture-connection", state: "active", authorizedScopes: ["quote:read"] };
const modules = {
  "server-only": {},
  "@/src/modules/platform/server/broker-connections/moomoo-shared-transport": {
    TRADERLINK_MOOMOO_SHARED_BUDGET_ENV: "TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED",
    sharedMoomooFetch: async (_url, _init, options) => {
      assert.equal(options.priority, "watchlist"); assert.equal(options.requireEnabled, true);
      assert.equal(options.environment.TRADERLINK_MOOMOO_SHARED_BUDGET_ENABLED, "true");
      budgetCalls++; return { ok: true };
    },
  }, "node:crypto": { createHash },
  "@/src/modules/market-data/server/provider-settings": { marketDataEnvironment: (_feature, environment) => environment },
  "@/src/modules/scanner/alpaca/client": { alpacaMarketDataEnabled: () => false },
  "@/src/modules/scanner/alpaca/watchlist-adapter": { fetchAlpacaWatchlistCandles: () => { throw Error("unexpected Alpaca call"); } },
  "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider": { MoomooDailyTradeKlineMarketDataProvider: class {
    constructor(_token, request) { this.request = request; }
    async fetch() { await this.request("https://webapi.moomoo.com/test-fixture"); return { ok: true }; }
  } },
  "@/src/modules/platform/server/authentication/authenticated-user-journal-scope": { deriveAuthenticatedUserJournalScope: (_db, userId) => ({ userId }) },
  "@/src/modules/platform/server/database/open-platform-database": { openPlatformDatabase: () => ({ close: () => { closed++; } }) },
  "@/src/modules/platform/server/database/platform-migration-contract": { platformFailure: () => { throw Error("access_denied"); } },
  "@/src/modules/platform/server/identity/platform-user-repository": { PlatformUserRepository: class { findActiveByAuthIdentity(_provider, subject) { return { userId: subject }; } } },
  "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service": { MoomooConnectionAccessService: class {
    async accessToken(scope) { selectedSubject = scope.userId; refreshed = true; accessCalls++; return "private-fixture-token"; }
  } },
  "@/src/modules/platform/server/broker-connections/moomoo-connection-repository": { MoomooConnectionRepository: class {
    find(scope) { return disabled.has(scope.userId) ? null : refreshed && dropQuote ? { ...connection, authorizedScopes: [] } : { ...connection, connectionId: `fixture-${scope.userId}` }; }
  } },
  "./access/watchlist-dashboard-navigation-access": { TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT_ENV: "OWNER_SUBJECT" },
};
const source = await readFile(new URL("../modules/watchlist/server/moomoo-watchlist-candle-bridge.ts", import.meta.url), "utf8");
const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
await module.link(specifier => {
  const exports = modules[specifier]; assert.ok(exports, `Unexpected import ${specifier}`);
  return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
});
await module.evaluate();
const use = module.namespace.withWatchlistIndicatorMoomooAccess;
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
const result = await use(async access => {
  equal(access.token, "private-fixture-token"); equal(/^[0-9a-f]{64}$/u.test(access.requestScope), true);
  return { status: "ready" };
}, { OWNER_SUBJECT: "123" });
equal(result, { status: "ready" }); equal(closed, 1); equal(accessCalls, 1);
refreshed = false; dropQuote = true;
await assert.rejects(() => use(async () => { throw Error("must not receive token after revoked quote scope"); }, { OWNER_SUBJECT: "123" }), /access_denied/u); assertions++;
equal(closed, 2);
refreshed = false; dropQuote = false;
const before = accessCalls;
await use(async () => null, { OWNER_SUBJECT: "123,456" });
equal(selectedSubject, "123"); equal(accessCalls, before + 1); equal(closed, 3);
disabled.add("123");
await use(async () => null, { OWNER_SUBJECT: "123,456" });
equal(selectedSubject, "456"); equal(closed, 4);
const status = module.namespace.readSharedMoomooConnectionStatus;
const statusCalls = accessCalls;
equal(status({ OWNER_SUBJECT: "123,456" }).ready, true);
equal(accessCalls, statusCalls); equal(closed, 5);
disabled.add("456"); equal(status({ OWNER_SUBJECT: "123,456" }).ready, false); equal(closed, 6);
await assert.rejects(() => use(async () => null, { OWNER_SUBJECT: "123,456" }), /access_denied/u); assertions++;
equal(accessCalls, statusCalls); equal(closed, 7);
disabled.clear();
await assert.rejects(() => use(async () => null, {}), /access_denied/u); assertions++;
equal(closed, 8);
await assert.rejects(() => use(async () => { throw Error("fixture consumer failed"); }, { OWNER_SUBJECT: "123" }), /fixture consumer failed/u); assertions++;
equal(closed, 9);
await module.namespace.fetchWatchlistMoomooCandles({}, { OWNER_SUBJECT: "123" });
equal(budgetCalls, 1); equal(closed, 10);
console.log(`PASS: ${assertions} focused assertions against the actual Indicators Moomoo access boundary with injected repositories: deterministic configured shared connection, read-only readiness, post-refresh quote permission, opaque scope and connection cleanup on every path. No live credential/database/provider use.`);
