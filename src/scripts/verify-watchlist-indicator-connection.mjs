import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

let closed = 0, refreshed = false, dropQuote = false, accessCalls = 0, assertions = 0;
const context = createContext({ process: { env: {} }, Object });
const connection = { connectionId: "fixture-connection", state: "active", authorizedScopes: ["quote:read"] };
const modules = {
  "server-only": {}, "node:crypto": { createHash },
  "@/src/modules/level-analysis/server/providers/moomoo-daily-trade-kline-market-data-provider": { MoomooDailyTradeKlineMarketDataProvider: class {} },
  "@/src/modules/platform/server/authentication/authenticated-user-journal-scope": { deriveAuthenticatedUserJournalScope: (_db, userId) => ({ userId }) },
  "@/src/modules/platform/server/database/open-platform-database": { openPlatformDatabase: () => ({ close: () => { closed++; } }) },
  "@/src/modules/platform/server/database/platform-migration-contract": { platformFailure: () => { throw Error("access_denied"); } },
  "@/src/modules/platform/server/identity/platform-user-repository": { PlatformUserRepository: class { findActiveByAuthIdentity(_provider, subject) { return { userId: subject }; } } },
  "@/src/modules/platform/server/broker-connections/moomoo-connection-access-service": { MoomooConnectionAccessService: class {
    async accessToken() { refreshed = true; accessCalls++; return "private-fixture-token"; }
  } },
  "@/src/modules/platform/server/broker-connections/moomoo-connection-repository": { MoomooConnectionRepository: class {
    find() { return refreshed && dropQuote ? { ...connection, authorizedScopes: [] } : connection; }
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
await assert.rejects(() => use(async () => null, { OWNER_SUBJECT: "123,456" }), /access_denied/u); assertions++;
equal(accessCalls, before); equal(closed, 3);
await assert.rejects(() => use(async () => null, {}), /access_denied/u); assertions++;
equal(closed, 4);
await assert.rejects(() => use(async () => { throw Error("fixture consumer failed"); }, { OWNER_SUBJECT: "123" }), /fixture consumer failed/u); assertions++;
equal(closed, 5);
console.log(`PASS: ${assertions} focused assertions against the actual Indicators Moomoo access boundary with injected repositories: exactly one configured connection, post-refresh quote permission, opaque scope and connection cleanup on every path. No live credential/database/provider use.`);
