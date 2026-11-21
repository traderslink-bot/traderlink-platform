import { companyWireResource, encodeCompanyData } from '../src/modules/company/company-data-wire.mjs';
import { createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";

const config = JSON.parse(await readFile(process.argv[2], "utf8"));
if (typeof config.token !== "string" || config.token.length < 32) throw Error("Missing gateway token");
const digest = value => createHash("sha256").update(value).digest();
const authorization = digest(`Bearer ${config.token}`);
const pcAuthorization = typeof config.pcProfileToken === "string" && config.pcProfileToken.length >= 32
  ? digest(`Bearer ${config.pcProfileToken}`) : null;
const requests = new Map();
const secHeaders = { "User-Agent": "TradersLink company research support@traderslink.pro", Accept: "application/json" };

// Leave headroom for other consumers of the Finnhub account.
const finnhubSpacingMs = 2100;
let nextFinnhubCall = 0;
let finnhubPausedUntil = 0;

async function fetchFinnhub(target, options) {
  const now = Date.now();
  const scheduled = Math.max(now, nextFinnhubCall, finnhubPausedUntil);
  if (scheduled - now > 6000) return null;
  nextFinnhubCall = scheduled + finnhubSpacingMs;
  if (scheduled > now) await new Promise(resolve => setTimeout(resolve, scheduled - now));
  if (Date.now() < finnhubPausedUntil) return null;
  const result = await fetch(target, { ...options, signal: AbortSignal.timeout(3000) });
  if (result.status === 429) {
    const retryAfter = result.headers.get("Retry-After");
    const delay = retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) * 1000 : Date.parse(retryAfter ?? "") - Date.now();
    finnhubPausedUntil = Date.now() + Math.max(60_000, Number.isFinite(delay) ? delay : 0);
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

const server = createServer(async (request, response) => {
  response.setHeader("Cache-Control", "no-store");
  response.setHeader("Content-Type", "application/json");
  const reply = (status, data) => { response.writeHead(status); response.end(data); };
  const presented = digest(request.headers.authorization ?? "");
  const fullAccess = timingSafeEqual(authorization, presented);
  const profileAccess = pcAuthorization && timingSafeEqual(pcAuthorization, presented);
  if (!fullAccess && !profileAccess) return reply(401, "{}");
  const url = new URL(request.url ?? "/", "http://localhost");
  const wireKind=companyWireResource(url.pathname);
  if ((url.pathname !== "/company-data" && !wireKind) || request.method !== "GET") return reply(404, "{}");
  if(wireKind&&([...url.searchParams.keys()].some(key=>key!=="id")||url.searchParams.getAll("id").length>1))return reply(400,"{}");
  const kind = wireKind ?? url.searchParams.get("kind") ?? "";
  if (!fullAccess && kind !== "profile") return reply(403, "{}");
  const key = url.searchParams.get(wireKind?"id":"key") ?? "";
  const provider = providerRequest(kind, key);
  if (!provider) return reply(400, "{}");
  const isFinnhub = kind === "profile" || kind === "metrics";
  if (isFinnhub && !config.finnhubToken) return reply(503, "{}");
  const [target, headers, ttl] = provider;
  const now = Date.now();
  let cached = requests.get(target);
  if (!cached || cached.expires <= now) {
    const options = { headers, redirect: "error" };
    const upstream = isFinnhub ? fetchFinnhub(target, options) :
      fetch(target, { ...options, signal: AbortSignal.timeout(8000) });
    const operation = upstream.then(async result => {
      if (!result || result.status === 429) return { status: 503, data: "{}", bytes: 2 };
      if (!result.ok) return { status: 502, data: "{}", bytes: 2 };
      const payload = await result.json();
      const data = JSON.stringify(payload);
      const bytes = Buffer.byteLength(data);
      return bytes > 16 * 1024 * 1024 ? { status: 502, data: "{}", bytes: 2 } : { status: 200, data, bytes };
    }).catch(() => ({ status: 502, data: "{}", bytes: 2 }));
    cached = { expires: now + ttl * 1000, operation, bytes: 0 };
    const entry = cached;
    requests.delete(target);
    requests.set(target, entry);
    void operation.then(result => {
      entry.bytes = result.bytes;
      if (result.status !== 200) entry.expires = Date.now() + 60_000;
      while (requests.size > 128 || [...requests.values()].reduce((size, item) => size + item.bytes, 0) > 64 * 1024 * 1024) {
        requests.delete(requests.keys().next().value);
      }
    });
    while (requests.size > 128) requests.delete(requests.keys().next().value);
  }
  const {status, data} = await cached.operation;
  if(wireKind&&status===200){
    try{return reply(status,JSON.stringify(encodeCompanyData(wireKind,JSON.parse(data))));}
    catch{return reply(502,"{}");}
  }
  return reply(status, data);
});
server.listen(3043, "127.0.0.1");
