import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { createHash, timingSafeEqual } from "node:crypto";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";

const activatedAt = Date.parse("2026-09-11T13:30:00Z"), callbacks = [], refreshes = [];
let ticker = { status: "live", firstPostedAt: activatedAt }, reads = 0, cacheReads = 0, assertions = 0, storageFailure = false;
const environment = { TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN: "offline-fixture-credential" };
const context = createContext({ Response, Buffer, process: { env: environment } });
const source = await readFile(new URL("../../app/api/live-watchlist/indicators/refresh/route.ts", import.meta.url), "utf8");
const dependencies = {
  "node:crypto": { createHash, timingSafeEqual },
  "next/server": { after: callback => callbacks.push(callback) },
  "@/src/lib/live-watchlist/live-watchlist-store": { LiveWatchlistStore: class {
    async getSymbol() { reads++; if (storageFailure) throw Error("private-path"); return ticker; }
    async listSymbols() { return { symbols: ticker ? [{ ...ticker, symbol: "TNON" }] : [] }; }
  } },
  "@/src/modules/watchlist/server/indicators/indicator-refresh-runtime": {
    reconcileWatchlistIndicatorPopulation: active => { assert.equal(typeof active.get, "function"); },
    readSharedWatchlistIndicatorCandles: (symbol, activationId) => { cacheReads++; assert.equal(symbol, "TNON"); assert.equal(activationId, `TNON:${activatedAt}`); return null; },
    refreshWatchlistIndicators: async (...args) => refreshes.push(args),
  },
};
const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
await module.link(name => {
  const exports = dependencies[name]; assert.ok(exports, name);
  return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
});
await module.evaluate();
const post = (body = { symbol: "TNON", activatedAt }, token = environment.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN) => module.namespace.POST(new Request("https://fixture.invalid/refresh", {
  method: "POST", headers: { authorization: `Bearer ${token}` }, body: typeof body === "string" ? body : JSON.stringify(body),
}));
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
equal((await post(undefined, "wrong")).status, 401); equal(reads, 0);
for (const invalid of ["x".repeat(1100), "{", null, { symbol: "../TNON", activatedAt }, { symbol: "TNON", activatedAt: "123" }]) {
  equal((await post(invalid)).status, 400);
}
equal(reads, 0); equal(callbacks.length, 0);
for (const inactive of [null, { status: "deactivated", firstPostedAt: activatedAt }, { status: "live", firstPostedAt: activatedAt - 1 }]) {
  ticker = inactive; equal((await (await post()).json()).status, "inactive");
}
equal(callbacks.length, 0); equal(cacheReads, 0);
ticker = { status: "live", firstPostedAt: activatedAt };
const response = await post(); equal(response.status, 200); equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
equal(await response.json(), { handled: true, status: "warming", candles: null });
equal(refreshes.length, 0); equal(callbacks.length, 1);
await callbacks.shift()(); equal(refreshes.length, 1);
equal(refreshes[0], ["TNON", `TNON:${activatedAt}`]);
await post(); ticker = null; await callbacks.shift()(); equal(refreshes.length, 1);
storageFailure = true; const failure = await post(); equal(failure.status, 503); equal((await failure.text()).includes("private-path"), false);
environment.TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN = ""; equal((await post()).status, 503);
console.log(`PASS: ${assertions} focused assertions against the actual publisher refresh POST: authorization before storage, bounded body, activation isolation, deferred background refresh, activation recheck, no-store and sanitized failures. No network, provider or live storage calls.`);
