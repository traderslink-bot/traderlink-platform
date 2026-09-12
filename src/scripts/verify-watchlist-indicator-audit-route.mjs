import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { randomUUID } from "node:crypto";

let allowed = false, identityThrows = false, storeThrows = false, opens = 0, assertions = 0;
const context = createContext({ Request, Response, URL });
const storage = { history: async options => ({ records: [], nextCursor: null, options }),
  calculation: async id => ({ status: "expired_or_unavailable", id }) };
const modules = {
  "@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access": { hasWatchlistDashboardNavigationAccess: () => allowed },
  "@/src/modules/platform/server/authentication/require-platform-request-scope": { requireTraderLinkPlatformRequestIdentity: () => {
    if (identityThrows) throw Error("fixture auth failure"); return { mode: "fixture" };
  } },
  "@/src/modules/watchlist/server/indicators/indicator-audit-runtime": { watchlistIndicatorAuditStore: () => {
    opens++; if (storeThrows) throw Error("private path must not appear"); return storage;
  } },
};
const source = await readFile(new URL("../../app/api/admin/watchlist/indicator-audit/route.ts", import.meta.url), "utf8");
const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
await module.link(specifier => {
  const exports = modules[specifier]; assert.ok(exports, `Unexpected import ${specifier}`);
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context });
});
await module.evaluate();
const get = query => module.namespace.GET(new Request(`https://fixture.invalid/api/admin/watchlist/indicator-audit${query}`));
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
equal((await get("")).status, 404); equal(opens, 0);
identityThrows = true;
equal((await get(`?calculation=${randomUUID()}`)).status, 404); equal(opens, 0);
identityThrows = false; allowed = true;
for (const query of ["?calculation=../../private", "?before=../../private", "?limit=101", "?limit=0", "?limit=NaN"]) {
  equal((await get(query)).status, 400);
}
equal(opens, 0);
const history = await get("?limit=50");
equal(history.status, 200); equal(history.headers.get("cache-control"), "private, no-store, max-age=0");
equal((await history.json()).options.limit, 50);
const expired = await get(`?calculation=${randomUUID()}`);
equal(expired.status, 410); equal((await expired.json()).status, "expired_or_unavailable");
equal(expired.headers.get("content-disposition").startsWith("attachment; filename=\"watchlist-indicator-calculation-"), true);
storeThrows = true;
const unavailable = await get(""); equal(unavailable.status, 503);
equal((await unavailable.text()).includes("private path"), false);
console.log(`PASS: ${assertions} focused assertions against the actual Indicators audit GET handler with injected authorization/storage. Anonymous access opens no storage; invalid inputs, no-store, expired exports and sanitized failures verified. No live app/database calls.`);
