import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { request as httpsRequest } from "node:https";

const NASDAQ_TRADE_HALTS_RSS_URL = "https://nasdaqtrader.com/rss.aspx?feed=tradehalts";
const MAX_RESPONSE_BYTES = 1_000_000;
const port = Number.parseInt(process.env.PORT ?? "8080", 10);
const relaySecret = process.env.NASDAQ_HALT_RELAY_SECRET?.trim();

if (!relaySecret) throw new Error("NASDAQ_HALT_RELAY_SECRET is required.");

function authorized(value) {
  if (!value) return false;
  const expected = Buffer.from(`Bearer ${relaySecret}`, "utf8");
  const supplied = Buffer.from(value, "utf8");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}

function fetchNasdaqRss() {
  return new Promise((resolve, reject) => {
    const request = httpsRequest(NASDAQ_TRADE_HALTS_RSS_URL, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "TradersLinkNasdaqHaltRelay/1.0",
      },
      method: "GET",
      timeout: 15_000,
    }, (response) => {
      const chunks = [];
      let bytes = 0;
      response.on("data", (chunk) => {
        bytes += chunk.length;
        if (bytes > MAX_RESPONSE_BYTES) {
          response.destroy(new Error("Nasdaq Trade Halt RSS response exceeded the relay limit."));
          return;
        }
        chunks.push(chunk);
      });
      response.once("error", reject);
      response.once("end", () => resolve(Object.freeze({
        body: Buffer.concat(chunks),
        statusCode: response.statusCode ?? 0,
      })));
    });
    request.once("error", reject);
    request.once("timeout", () => request.destroy(new Error("Nasdaq Trade Halt RSS request timed out.")));
    request.end();
  });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url ?? "/", "http://relay.internal");
  if (request.method === "GET" && requestUrl.pathname === "/healthz") {
    response.writeHead(200, { "cache-control": "no-store", "content-type": "application/json" });
    response.end('{"ok":true}');
    return;
  }
  if (request.method !== "GET" || requestUrl.pathname !== "/nasdaq-trade-halts" || !authorized(request.headers.authorization)) {
    response.writeHead(401, { "cache-control": "no-store" });
    response.end();
    return;
  }
  try {
    const upstream = await fetchNasdaqRss();
    if (upstream.statusCode < 200 || upstream.statusCode >= 300) {
      response.writeHead(502, { "cache-control": "no-store" });
      response.end();
      return;
    }
    response.writeHead(200, {
      "cache-control": "no-store",
      "content-type": "application/rss+xml; charset=utf-8",
    });
    response.end(upstream.body);
  } catch {
    response.writeHead(502, { "cache-control": "no-store" });
    response.end();
  }
});

server.listen(port, "0.0.0.0", () => {
  void fetchNasdaqRss()
    .then((upstream) => console.info("nasdaq_halt_relay_startup_probe", { available: upstream.statusCode >= 200 && upstream.statusCode < 300, httpStatus: upstream.statusCode }))
    .catch(() => console.warn("nasdaq_halt_relay_startup_probe", { available: false, httpStatus: null }));
});
