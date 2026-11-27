import { companyWireResource, encodeCompanyData } from '../src/modules/company/company-data-wire.mjs';
import { createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { isAbsolute } from "node:path";
import { readCompanyRosterExport } from "../src/modules/company/company-roster-export.mjs";
import { openCompanyRecordStore } from "../src/modules/company/company-record-store.mjs";
import { readCompanyRoster, startCompanyRefreshWorker } from "../src/modules/company/company-refresh-worker.mjs";

const config = JSON.parse(await readFile(process.argv[2], "utf8"));
if (typeof config.token !== "string" || config.token.length < 32) throw Error("Missing gateway token");
const digest = value => createHash("sha256").update(value).digest();
const authorization = digest(`Bearer ${config.token}`);
const pcAuthorization = typeof config.pcProfileToken === "string" && config.pcProfileToken.length >= 32
  ? digest(`Bearer ${config.pcProfileToken}`) : null;
const requests = new Map();
const storePath = config.companyRecordStore;
const rosterPath = config.companyRosterFile;
const rosterExport = config.companyRosterExport;
if ((storePath && !isAbsolute(storePath)) || (rosterPath && (!storePath || !isAbsolute(rosterPath))) ||
    (rosterExport && (!storePath || rosterPath))) {
  throw Error("Invalid company refresh storage configuration");
}
const store = storePath ? openCompanyRecordStore(storePath) : null;
const snapshotPath = "/traderslink/v1/company/snapshots";
const secHeaders = { "User-Agent": "TradersLink company research support@traderslink.pro", Accept: "application/json" };

// Leave headroom for other consumers of the Finnhub account.
const finnhubSpacingMs = 2100;
let nextFinnhubCall = store?.readWorkerState("statisticsNextCall") ?? 0;
let finnhubPausedUntil = store?.readWorkerState("statisticsCooldown") ?? 0;
let nextSecCall = 0;
let secPausedUntil = store?.readWorkerState("secCooldown") ?? 0;

function providerPause(result, defaultMs) {
  const retryAfter = result.headers.get("Retry-After");
  const delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 :
    Date.parse(retryAfter ?? "") - Date.now();
  return Date.now() + Math.max(defaultMs, Number.isFinite(delay) ? delay : 0);
}

async function fetchSec(target, options) {
  const clock = Date.now();
  if (clock < secPausedUntil) return null;
  const scheduled = Math.max(nextSecCall, clock);
  if (scheduled - clock > 6000) return null;
  nextSecCall = scheduled + 350;
  if (scheduled > clock) await new Promise(resolve => setTimeout(resolve, scheduled - clock));
  if (Date.now() < secPausedUntil) return null;
  const response = await fetch(target, { ...options, signal: AbortSignal.timeout(8000) });
  if (response.status === 429 || response.status === 503) {
    secPausedUntil = providerPause(response, 60_000);
    store?.writeWorkerState("secCooldown", secPausedUntil);
  }
  return response;
}

async function fetchFinnhub(target, options) {
  const now = Date.now();
  const scheduled = Math.max(now, nextFinnhubCall, finnhubPausedUntil);
  if (scheduled - now > 6000) return null;
  nextFinnhubCall = scheduled + finnhubSpacingMs;
  store?.writeWorkerState("statisticsNextCall", nextFinnhubCall);
  if (scheduled > now) await new Promise(resolve => setTimeout(resolve, scheduled - now));
  if (Date.now() < finnhubPausedUntil) return null;
  const result = await fetch(target, { ...options, signal: AbortSignal.timeout(3000) });
  if (result.status === 429) {
    finnhubPausedUntil = providerPause(result, 60_000);
    store?.writeWorkerState("statisticsCooldown", finnhubPausedUntil);
  }
  return result;
}

function providerRequest(kind, key) {
  if (kind === "directory" && !key) return ["https://www.sec.gov/files/company_tickers.json", secHeaders, 86400];
  if (kind === "submissions" && /^CIK\d{10}(?:-submissions-\d+)?\.json$/.test(key))
    return [`https://data.sec.gov/submissions/${key}`, secHeaders, 3600];
  if (kind === "facts" && /^CIK\d{10}\.json$/.test(key))
    return [`https://data.sec.gov/api/xbrl/companyfacts/${key}`, secHeaders, 86400];
  if (!/^[A-Z][A-Z0-9.-]{0,14}$/.test(key)) return;
  if (kind === "profile" || kind === "metrics") {
    const endpoint = kind === "profile" ? `profile2?symbol=${key}` : `metric?symbol=${key}&metric=all`;
    return [`https://finnhub.io/api/v1/stock/${endpoint}`,
      { "X-Finnhub-Token": config.finnhubToken ?? "" }, 86400];
  }
}

async function readProvider(kind, key, fresh = false) {
  const provider = providerRequest(kind, key);
  if (!provider) return {status:400, data:"{}"};
  const isFinnhub = kind === "profile" || kind === "metrics";
  if (isFinnhub && !config.finnhubToken) return {status:503, data:"{}"};
  const [target, headers, ttl] = provider;
  const now = Date.now();
  let cached = requests.get(target);
  if (!cached || (!cached.pending && (cached.expires <= now || (fresh && now - cached.started >= 1000)))) {
    const options = { headers, redirect: "error" };
    const upstream = isFinnhub ? fetchFinnhub(target, options) :
      fetchSec(target, options);
    const operation = upstream.then(async result => {
      if (!result || result.status === 429) return { status: 503, data: "{}", bytes: 2 };
      if (!result.ok) return { status: 502, data: "{}", bytes: 2 };
      const payload = await result.json();
      const data = JSON.stringify(payload);
      const bytes = Buffer.byteLength(data);
      return bytes > 16 * 1024 * 1024 ? { status: 502, data: "{}", bytes: 2 } : { status: 200, data, bytes };
    }).catch(() => ({ status: 502, data: "{}", bytes: 2 }));
    cached = { expires: now + ttl * 1000, operation, bytes: 0, pending: true, started: now };
    const entry = cached;
    requests.delete(target);
    requests.set(target, entry);
    void operation.then(result => {
      entry.bytes = result.bytes;
      entry.pending = false;
      if (result.status !== 200) entry.expires = Date.now() + 60_000;
      while (requests.size > 128 || [...requests.values()].reduce((size, item) => size + item.bytes, 0) > 64 * 1024 * 1024) {
        requests.delete(requests.keys().next().value);
      }
    });
    while (requests.size > 128) requests.delete(requests.keys().next().value);
  }
  return cached.operation;
}

async function workerProvider(kind, key, fresh) {
  const result = await readProvider(kind, key, fresh);
  if (result.status !== 200) {
    const failure = new Error("Company source unavailable");
    failure.retryAt = kind === "profile" || kind === "metrics" ? finnhubPausedUntil : secPausedUntil;
    throw failure;
  }
  return JSON.parse(result.data);
}

async function workerSecText(url, allowMissing = false) {
  const response = await fetchSec(url, { headers: { ...secHeaders, Accept: "application/atom+xml,text/plain" }, redirect: "error" });
  if (allowMissing && response?.status === 404) return null;
  if (!response?.ok) throw Error("SEC discovery unavailable");
  const body = await response.text();
  if (Buffer.byteLength(body) > 16 * 1024 * 1024) throw Error("SEC discovery response too large");
  return body;
}

function readSnapshots(url) {
  const symbols = url.searchParams.getAll("symbol");
  const asOf = url.searchParams.get("asOf");
  const revision = url.searchParams.get("revision");
  const view = url.searchParams.get("view");
  if (symbols.length === 0 || symbols.length > 128 || new Set(symbols).size !== symbols.length ||
      symbols.some(symbol => !/^[A-Z][A-Z0-9.-]{0,15}$/.test(symbol)) ||
      (view !== null && (view !== "detail" || symbols.length !== 1)) ||
      ["asOf", "revision", "view"].some(key => url.searchParams.getAll(key).length > 1) ||
      [...url.searchParams.keys()].some(key => !["symbol", "asOf", "revision", "view"].includes(key)) ||
      [asOf, revision].some(value => value !== null && (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))))) return null;
  return store.read(symbols, {
    asOf: asOf === null ? undefined : Number(asOf),
    revision: revision === null ? undefined : Number(revision),
    includeDetail: view === "detail",
  });
}

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json");
  const reply = (status, data) => { response.writeHead(status); response.end(data); };
  const presented = digest(request.headers.authorization ?? "");
  const fullAccess = timingSafeEqual(authorization, presented);
  const profileAccess = pcAuthorization && timingSafeEqual(pcAuthorization, presented);
  if (!fullAccess && !profileAccess) return reply(401, "{}");
  const url = new URL(request.url ?? "/", "http://localhost");
  if (url.pathname === snapshotPath && request.method === "GET") {
    if (!fullAccess) return reply(403, "{}");
    if (!store) return reply(404, "{}");
    try {
      const snapshot = readSnapshots(url);
      return snapshot ? reply(200, JSON.stringify(snapshot)) : reply(400, "{}");
    } catch { return reply(503, "{}"); }
  }
  const wireKind=companyWireResource(url.pathname);
  if ((url.pathname !== "/company-data" && !wireKind) || request.method !== "GET") return reply(404, "{}");
  if(wireKind&&([...url.searchParams.keys()].some(key=>key!=="id")||url.searchParams.getAll("id").length>1))return reply(400,"{}");
  const kind = wireKind ?? url.searchParams.get("kind") ?? "";
  if (!fullAccess && kind !== "profile") return reply(403, "{}");
  const key = url.searchParams.get(wireKind?"id":"key") ?? "";
  const {status, data} = await readProvider(kind, key);
  if(wireKind&&status===200){
    try{return reply(status,JSON.stringify(encodeCompanyData(wireKind,JSON.parse(data))));}
    catch{return reply(502,"{}");}
  }
  return reply(status, data);
});
server.listen(3043, "127.0.0.1");
if (rosterPath || rosterExport) startCompanyRefreshWorker({
  store,
  loadRoster: rosterExport ? (previous, now) => readCompanyRosterExport(rosterExport, previous, now) : () => readCompanyRoster(rosterPath),
  provider: workerProvider,
  secText: workerSecText,
  onError: phase => process.stderr.write(`Company refresh ${phase} unavailable\n`),
});
