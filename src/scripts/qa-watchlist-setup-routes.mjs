import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { stripTypeScriptTypes } from "node:module";
import { createContext, SourceTextModule, SyntheticModule } from "node:vm";

// Actual route handlers; all authorization/storage dependencies are offline doubles.
// No app server, database, provider request, settings write or notification runs.
let owner = false, mutation = false, member = false, visible = true, prices = true;
let reads = 0, saves = 0, assertions = 0, conflict = false, resultReads = 0, resultFailure = false;
const identity = "00000000-0000-4000-8000-000000000001";
let ticker = { symbol: "TEST", status: "live", firstPostedAt: 1791547200000, indicatorPublicationIdentity: identity };
const configuration = { version: 1, revision: 1, tickerOverrides: {}, settings: { enabled: false,
  enabledDetectors: ["vwap-reclaim-hold", "ema9-pullback-bounce", "ema20-pullback-bounce", "higher-low-reversal"],
  sessions: ["premarket", "regular", "postmarket"], showMemberCard: true, notifyForming: false, notifyConfirmed: false } };
const context = createContext({ Request, Response, URL, TextDecoder, Number, Error, Promise, Buffer });
const sourceStore = await readFile(new URL("../modules/watchlist/server/setups/setup-store.ts", import.meta.url), "utf8");
const storeModule = new SourceTextModule(stripTypeScriptTypes(sourceStore, { mode: "transform" }), { context });
function synthetic(exports) {
  return new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context });
}
const kinds = configuration.settings.enabledDetectors;
await storeModule.link(specifier => {
  if (specifier === "server-only") return synthetic({});
  if (specifier === "node:crypto") return synthetic({ createHash() { throw Error("No storage in route QA"); }, randomUUID() { throw Error("No storage in route QA"); } });
  if (specifier === "node:fs/promises") return synthetic(Object.fromEntries(["mkdir", "open", "readdir", "rename", "stat", "unlink"].map(name => [name, () => { throw Error("No filesystem in route handler"); }])));
  if (specifier === "node:path") return synthetic({ dirname() {}, join() {} });
  if (specifier.endsWith("platform-database-config")) return synthetic({ resolvePlatformDatabaseConfig() { throw Error("No app database"); } });
  if (specifier.endsWith("setup-contracts")) return synthetic({ INITIAL_WATCHLIST_SETUP_KINDS: kinds });
  throw Error(`Unexpected store dependency ${specifier}`);
});
await storeModule.evaluate();
const mocks = {
  "@/src/modules/platform/server/administration/platform-admin-authorization": { withJournalAdminDatabase: (_headers, callback) => { if (!owner) throw Error("denied"); return callback(); } },
  "@/src/modules/platform/server/administration/platform-admin-request-security": { requireJournalAdminMutationRequest: () => { if (!mutation) throw Error("denied"); } },
  "@/src/lib/live-watchlist/live-watchlist-store": { LiveWatchlistStore: class {
    async listSymbols() { reads++; return { symbols: ticker ? [ticker] : [] }; }
    async getSymbol() { reads++; return ticker; }
  } },
  "@/src/modules/watchlist/server/setups/setup-store": {
    parseSetupConfiguration: storeModule.namespace.parseSetupConfiguration,
    savedSetupPublicationIdentity: storeModule.namespace.savedSetupPublicationIdentity,
    watchlistSetupStore: () => ({ configuration: async () => { reads++; return structuredClone(configuration); },
      status: () => ({ failure: null }), latest: async () => { reads++; return null; },
      resultEvidence: async function* () { resultReads++; if (resultFailure) throw Error("offline read failure");
        yield { record: { input: { revision: "input-1", publicationIdentity: identity }, evaluation: { rulesVersion: "v1" } } }; },
      saveConfiguration: async (value, expected) => { saves++; assert.equal(expected, value.revision); if (conflict) throw Error("setup_configuration_changed"); return { ...value, revision: expected + 1 }; } }),
  },
  "@/src/modules/watchlist/server/setups/setup-runtime": { readWatchlistSetupRuntimeFailure: () => null,
    readWatchlistSetupSnapshot: async () => { reads++; return { symbol: "TEST", publicationIdentity: identity }; } },
  "@/src/modules/watchlist/server/setups/setup-shared-feed-runtime": { watchlistSetupFeedStatus: () => ({ running: false }) },
  "@/src/modules/watchlist/server/setups/setup-admission-runtime": { watchlistMoomooAdmission: () => ({ status: () => ({ storageUnavailable: false }) }) },
  "@/src/lib/live-watchlist/setups/setup-contracts": { INITIAL_WATCHLIST_SETUP_KINDS: kinds },
  "@/src/lib/live-watchlist/setups/setup-results": { SETUP_RESULT_WINDOWS: [5, 15, 30, 60], SetupResultsAccumulator: class {
    add() {} results(filter) { return { filter, total: 1 }; }
  } },
  "@/src/lib/live-watchlist/live-watchlist-auth": { authorizeWatchlistMemberRequest: async () => member ? { ok: true } : { ok: false, error: "Sign in", status: 401 } },
  "@/src/modules/watchlist/server/access/watchlist-analysis-visibility": { canViewWatchlistTicker: () => visible, canViewWatchlistAnalysisPrices: () => prices },
};
async function load(path) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  const module = new SourceTextModule(stripTypeScriptTypes(source), { context });
  await module.link(specifier => { assert.ok(mocks[specifier], specifier); return synthetic(mocks[specifier]); });
  await module.evaluate(); return module.namespace;
}
const admin = await load("../../app/api/admin/watchlist/setups/route.ts");
const members = await load("../../app/api/live-watchlist/symbols/[symbol]/setups/route.ts");
const resultsRoute = await load("../../app/api/admin/watchlist/setups/results/route.ts");
const equal = (actual, expected) => { assert.deepEqual(actual, expected); assertions++; };
const req = body => new Request("https://offline.invalid/api/admin/watchlist/setups", body === undefined ? undefined : { method: "POST", body: typeof body === "string" ? body : JSON.stringify(body) });
equal((await admin.GET(req())).status, 404); equal(reads, 0);
equal((await resultsRoute.GET(req())).status, 404); equal(resultReads, 0);
equal((await admin.POST(req(configuration))).status, 404); equal(saves, 0);
owner = true;
equal((await resultsRoute.GET(new Request("https://offline.invalid/?minutes=7"))).status, 400); equal(resultReads, 0);
equal((await resultsRoute.GET(new Request("https://offline.invalid/?from=2026-02-30"))).status, 400);
equal((await resultsRoute.GET(new Request("https://offline.invalid/?from=2026-10-10&to=2026-10-01"))).status, 400);
equal((await resultsRoute.GET(new Request("https://offline.invalid/?kind=bad"))).status, 400);
equal((await resultsRoute.GET(new Request("https://offline.invalid/?evidence=../../secret"))).status, 400);
const resultResponse = await resultsRoute.GET(new Request("https://offline.invalid/?symbol=test&minutes=15&page=2"));
equal(resultResponse.status, 200); equal(resultResponse.headers.get("cache-control"), "private, no-store");
const resultBody = await resultResponse.json(); equal(resultBody.filter.symbol, "TEST"); equal(resultBody.filter.minutes, 15); equal(resultBody.filter.page, 2);
equal((await resultsRoute.GET(new Request(`https://offline.invalid/?evidence=input-1&publication=${identity}&rules=v1`))).status, 200);
equal((await resultsRoute.GET(new Request(`https://offline.invalid/?evidence=expired&publication=${identity}`))).status, 404);
resultFailure = true; equal((await resultsRoute.GET(req())).status, 503);
resultFailure = false; equal((await resultsRoute.GET(req())).status, 200);
const controls = await admin.GET(req()); equal(controls.status, 200);
const body = await controls.json(); equal(body.configuration.settings.enabled, false); equal(body.configuration.settings.enabledDetectors.length, 4);
equal(body.deliveryEnabled, false); equal(controls.headers.get("cache-control"), "private, no-store");
mutation = true;
equal((await admin.POST(req("x".repeat(16385)))).status, 400); equal(saves, 0);
equal((await admin.POST(req({ ...configuration, settings: { ...configuration.settings, notifyConfirmed: true } }))).status, 400); equal(saves, 0);
equal((await admin.POST(req({ ...configuration, settings: { ...configuration.settings, enabledDetectors: ["invalid"] } }))).status, 400);
equal((await admin.POST(req(configuration))).status, 200); equal(saves, 1);
conflict = true; equal((await admin.POST(req(configuration))).status, 409);
const memberReq = new Request("https://offline.invalid/api/live-watchlist/symbols/TEST/setups");
const params = { params: Promise.resolve({ symbol: "TEST" }) };
let before = reads;
equal((await members.GET(memberReq, params)).status, 401); equal(reads, before);
member = true; visible = false;
equal((await (await members.GET(memberReq, params)).json()).snapshot, null); equal(reads, before);
visible = true; prices = false;
equal((await (await members.GET(memberReq, params)).json()).snapshot, null); equal(reads, before);
prices = true; ticker = { ...ticker, status: "deactivated" };
equal((await (await members.GET(memberReq, params)).json()).snapshot, null); equal(reads, before + 1);
ticker = { ...ticker, status: "live" };
const response = await members.GET(memberReq, params);
equal((await response.json()).snapshot.publicationIdentity, identity); equal(response.headers.get("cache-control"), "private, no-store, max-age=0");
equal(saves, 2); // One success and one conflict against an in-memory double only.
// Actual store with virtual storage: recover from a pre-existing full directory
// while preserving latest publication data and unrelated/pinned exports.
const fullModule = new SourceTextModule(stripTypeScriptTypes(sourceStore, { mode: "transform" }), { context });
const latestName = `latest-${"f".repeat(64)}.json`;
const files = new Map([["settings.json", JSON.stringify(configuration)], [latestName, "latest-preserved"], ["pinned-example.json", "pin-preserved"],
  ...Array.from({ length: 4998 }, (_, index) => [`evidence-${index.toString(16).padStart(64, "0")}.json`, "x"])]);
const sizes = new Map(); // Large virtual byte counts without allocating a large buffer.
const missing = () => Object.assign(Error("missing"), { code: "ENOENT" });
let virtualWrites = 0;
await fullModule.link(specifier => {
  if (specifier === "server-only") return synthetic({});
  if (specifier === "node:crypto") return synthetic({ createHash, randomUUID: () => "offline" });
  if (specifier === "node:path") return synthetic({ dirname: () => "virtual", join: (...parts) => parts.join("/") });
  if (specifier.endsWith("platform-database-config")) return synthetic({ resolvePlatformDatabaseConfig: () => ({ databasePath: "virtual/unused" }) });
  if (specifier.endsWith("setup-contracts")) return synthetic({ INITIAL_WATCHLIST_SETUP_KINDS: kinds });
  if (specifier === "node:fs/promises") return synthetic({ mkdir: async () => {}, readdir: async (_path, options) => [...files.keys()].map(name => options?.withFileTypes ? { name, isFile: () => true } : name),
    stat: async path => { const name = path.split("/").at(-1), value = files.get(name); if (value === undefined) throw missing(); return { size: sizes.get(name) ?? Buffer.byteLength(value), mtimeMs: 1 }; },
    open: async (path, mode) => {
      const name = path.split("/").at(-1);
      if (mode === "r" && !files.has(name)) throw missing();
      if (mode === "wx") { assert.equal(files.has(name), false); virtualWrites++; files.set(name, ""); }
      return { stat: async () => ({ size: Buffer.byteLength(files.get(name)) }), readFile: async () => files.get(name),
        writeFile: async value => files.set(name, String(value)), sync: async () => {}, close: async () => {} };
    }, rename: async (from, to) => { const name = from.split("/").at(-1); files.set(to.split("/").at(-1), files.get(name)); files.delete(name); },
    unlink: async path => { const name = path.split("/").at(-1); if (!files.delete(name)) throw missing(); sizes.delete(name); } });
  throw Error(specifier);
});
await fullModule.evaluate();
const fullStore = new fullModule.namespace.WatchlistSetupStore("virtual");
equal((await fullStore.saveConfiguration(configuration, configuration.revision)).revision, 2);
equal(JSON.parse(files.get("settings.json")).settings.enabled, false);
equal(files.get(latestName), "latest-preserved"); equal(files.get("pinned-example.json"), "pin-preserved");
equal(files.size < 5000, true); equal(virtualWrites, 2); equal(fullStore.status().failure, null);
await assert.rejects(fullStore.saveConfiguration(configuration, 1), /setup_configuration_changed/u); assertions++;
equal(fullStore.status().failure, null);
files.clear(); files.set("settings.json", JSON.stringify({ ...configuration, settings: { ...configuration.settings, enabled: true } }));
files.set(latestName, "latest-preserved"); files.set("pinned-example.json", "pin-preserved");
const oversizedHistory = `evidence-${"e".repeat(64)}.json`;
files.set(oversizedHistory, "old-generated-history"); sizes.set(oversizedHistory, 99000000);
const byteStore = new fullModule.namespace.WatchlistSetupStore("virtual");
const record = { version: 1, configurationRevision: 1, input: { symbol: "TEST", publicationIdentity: identity, revision: "new-input" },
  evaluation: { rulesVersion: "offline", snapshot: { symbol: "TEST", publicationIdentity: identity } } };
await byteStore.save(record);
equal(files.has(oversizedHistory), false); equal(files.get(latestName), "latest-preserved");
equal(files.get("pinned-example.json"), "pin-preserved"); equal((await byteStore.latest("TEST", identity)).input.revision, "new-input");
equal(byteStore.status().failure, null);
await byteStore.save(record); equal(byteStore.status().failure, null); // Same revision stays idempotent.
equal((await byteStore.saveConfiguration(configuration, 1)).settings.enabled, false);
// The new reader inspects only managed evidence/latest records and never writes,
// even when corrupt records, a cancellation or missing history are encountered.
const beforeResultWrites = virtualWrites;
const retainedResults = [];
for await (const item of byteStore.resultEvidence()) retainedResults.push(item);
equal(retainedResults.filter(item => item.record).length, 2);
equal(retainedResults.filter(item => item.unreadable).length, 1);
equal(virtualWrites, beforeResultWrites);
const aborted = new AbortController(); aborted.abort();
await assert.rejects(async () => { for await (const _item of byteStore.resultEvidence(aborted.signal)) {} }, /setup_results_cancelled/u); assertions++;
console.log(`PASS ${assertions} offline actual-handler checks: owner/member gates, settings schema/body/revision, notifications disabled, publication identity and cache policy. No network or app storage.`);
console.log("PASS: rotation recovers a 5,000-file directory, keeps latest/pinned files and preserves control saves; conflicts do not mark storage unavailable.");
