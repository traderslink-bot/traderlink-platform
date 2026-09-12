import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { stripTypeScriptTypes } from "node:module";
import { SourceTextModule, SyntheticModule, createContext } from "node:vm";
import { memberIndicatorSnapshot } from "../lib/live-watchlist/indicators/indicator-member-snapshot.ts";

const posted = Date.parse("2026-09-11T13:30:00Z");
let auth = false, ticker = { status: "live", firstPostedAt: posted }, storeReads = 0, cacheReads = 0, assertions = 0;
const context = createContext({ Response });
const source = await readFile(new URL("../../app/api/live-watchlist/symbols/[symbol]/indicators/route.ts", import.meta.url), "utf8");
const privateSnapshot = { version: "indicators-v1", symbol: "TNON", activationId: `TNON:${posted}`, calculationId: "private-audit-id", provider: "Moomoo",
  timeframes: { "1m": { version: "indicators-v1", timeframe: "1m", close: 3, dataThrough: posted + 60_000,
    provider: "Moomoo", requestScope: "private-scope", rawError: "private-error", trend: "uptrend" } }, vwap: { value: 3, dataThrough: posted + 60_000, secret: "private-vwap" } };
const imports = {
  "@/src/lib/live-watchlist/live-watchlist-auth": { authorizeWatchlistMemberRequest: async () => auth ? { ok: true } : { ok: false, error: "Access denied.", status: 403 } },
  "@/src/lib/live-watchlist/live-watchlist-store": { LiveWatchlistStore: class { async getSymbol() { storeReads++; return ticker; } } },
  "@/src/modules/watchlist/server/indicators/indicator-refresh-runtime": { readCachedWatchlistIndicators: (symbol, activationId) => {
    cacheReads++; assert.equal(symbol, "TNON"); assert.equal(activationId, `TNON:${posted}`); return privateSnapshot;
  } },
  "@/src/lib/live-watchlist/indicators/indicator-member-snapshot": { memberIndicatorSnapshot },
};
const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
await module.link(name => {
  const exports = imports[name]; assert.ok(exports, `Unexpected member-route runtime import ${name}`);
  return new SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
});
await module.evaluate();
const get = symbol => module.namespace.GET(new Request("https://fixture.invalid/indicators"), { params: Promise.resolve({ symbol }) });
const equal = (a, b) => { assert.deepEqual(a, b); assertions++; };
equal((await get("TNON")).status, 403); equal(storeReads, 0); equal(cacheReads, 0);
auth = true;
equal((await get("../TNON")).status, 404); equal(storeReads, 0);
for (const invalid of [null, { status: "deactivated", firstPostedAt: posted }, { status: "live", firstPostedAt: null }]) {
  ticker = invalid; equal((await get("TNON")).status, 404);
}
equal(cacheReads, 0);
ticker = { status: "live", firstPostedAt: posted };
const response = await get("tnon"), body = await response.text();
equal(response.status, 200); equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
equal(/Moomoo|private-|provider|requestScope|rawError|calculationId|secret/u.test(body), false);
equal(JSON.parse(body).snapshot.timeframes["1m"].trend, "uptrend");
equal(cacheReads, 1);
console.log(`PASS: ${assertions} focused assertions against the actual member Indicators GET handler: existing authorization first, absent/deactivated/unposted ticker concealment, exact activation lookup, no-store and positive nested output allowlist. No provider requests or live storage.`);
