import { createServer, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash, timingSafeEqual } from "node:crypto";
import { alpacaCandle, chartSymbol, type Candle } from "./candles";
import { AlpacaRestData, parseHistoryRequest } from "./rest-data";
import { AlpacaSessionBook, alpacaMinuteTradeRules } from "./session-book";
import { ScannerStreamHub } from "./scanner-stream-hub";
import { easternClock } from "../live/sessions";

type Client = { symbol: string; response: ServerResponse };
type GatewayOptions = { keyId: string; secretKey: string; token: string };

// This service deliberately knows no trading/account-management API URL.
export function createAlpacaGateway(options: GatewayOptions) {
  const clients = new Set<Client>();
  const priceUpdates=new Map<string,{price:number;time:string}>();
  const priceTimer=setInterval(()=>{for(const client of clients){const price=priceUpdates.get(client.symbol);if(price)send(client,"price",price);}priceUpdates.clear();},250);priceTimer.unref();
  const cache = new Map<string, { at: number; bars: Candle[] }>();
  const pending = new Map<string, Promise<Candle[]>>();
  const rest = new AlpacaRestData(options);
  const sessionBook = new AlpacaSessionBook(rest,symbol=>scannerHub.mark(symbol));
  const leases = new Map<string, number>();
  const quotes = new Map<string, Record<string, unknown>>();
  const digest = (value: string) => createHash("sha256").update(value).digest();
  let socket: WebSocket | null = null, authenticated = false, retry: ReturnType<typeof setTimeout> | undefined;
  let subscribedTrades = new Set<string>();
  let retryCount = 0, stopped = false, requests = 0, windowStart = Date.now();
  const send = (client: Client, event: string, value: unknown) => {
    if (client.response.writableLength > 256_000) { client.response.destroy(); return; }
    client.response.write(`event: ${event}\ndata: ${JSON.stringify(value)}\n\n`);
  };
  const status = (state: string) => { for (const client of clients) send(client, "status", { state }); };
  const symbols = () => [...new Set([...clients].map(client => client.symbol).concat([...leases.keys()]))];
  const snapshotQueue=new Set<string>();let bootstrapping=false;
  async function bootstrapSnapshots(){
    if(bootstrapping)return;bootstrapping=true;
    try{while(snapshotQueue.size&&!stopped){
      const batch=[...snapshotQueue].slice(0,200);for(const symbol of batch)snapshotQueue.delete(symbol);
      try{
        const snapshots=await rest.get("/v2/stocks/snapshots",new URLSearchParams({symbols:batch.join(","),feed:"sip"})) as Record<string,Record<string,unknown>>;
        for(const symbol of batch)if(leases.has(symbol)&&snapshots[symbol]){quotes.set(symbol,{...snapshots[symbol],...(quotes.get(symbol)??{})});scannerHub.mark(symbol);}
      }catch{/* Missing baselines remain unavailable; the maintenance sweep retries. */}
    }}finally{bootstrapping=false;}
  }
  const scannerHub=new ScannerStreamHub((requested,regularClose)=>({feed:"sip",connected:authenticated,
    snapshots:Object.fromEntries(requested.map(symbol=>{
      const quote=quotes.get(symbol);if(!quote)return [symbol,null];
      const daily=quote.dailyBar as {t?:string;c?:number}|undefined,previous=quote.prevDailyBar as {t?:string;c?:number}|undefined,bidAsk=quote.latestQuote as {t?:string;bp?:number;ap?:number}|undefined;
      return [symbol,{dailyBar:daily?{t:daily.t,c:daily.c}:undefined,prevDailyBar:previous?{t:previous.t,c:previous.c}:undefined,latestQuote:bidAsk?{t:bidAsk.t,bp:bidAsk.bp,ap:bidAsk.ap}:undefined}];
    })),
    sessionTotals:Object.fromEntries(requested.map(symbol=>[symbol,subscribedTrades.has(symbol)?sessionBook.read(symbol,easternClock(Date.now()).date,regularClose):null]))
  }) as import("./scanner-snapshots").AlpacaQuoteReply,requested=>{for(const symbol of requested){leases.set(symbol,Date.now()+45_000);if(!quotes.has(symbol)||(!quotes.get(symbol)?.prevDailyBar&&!quotes.get(symbol)?.dailyBar))snapshotQueue.add(symbol);}void bootstrapSnapshots();});
  function subscribe() {
    if (authenticated && socket?.readyState === WebSocket.OPEN) {
      const wanted = symbols();
      socket.send(JSON.stringify({ action: "subscribe", trades: wanted, quotes: [...leases.keys()], bars: wanted, updatedBars: wanted, dailyBars: wanted }));
    }
  }
  function connect() {
    if (stopped || !symbols().length || socket) return;
    status("connecting");
    const candidate = new WebSocket("wss://stream.data.alpaca.markets/v2/sip");
    socket = candidate;
    const authTimeout = setTimeout(() => candidate.close(), 15_000);
    candidate.addEventListener("open", () => candidate.send(JSON.stringify({ action: "auth", key: options.keyId, secret: options.secretKey })));
    candidate.addEventListener("message", event => {
      let messages: unknown;
      try { messages = JSON.parse(String(event.data)); } catch { return; }
      if (!Array.isArray(messages)) return;
      for (const message of messages) {
        if (["t", "q", "b", "u", "d", "c", "x"].includes(message.T) && typeof message.S === "string") scannerHub.mark(message.S);
        if (["t", "c", "x"].includes(message.T)) sessionBook.observe(message);
        if(message.T === "t" && alpacaMinuteTradeRules(message).known && alpacaMinuteTradeRules(message).prices && Number.isFinite(message.p) && message.p>0){
          if([...clients].some(client=>client.symbol===message.S)){const prior=priceUpdates.get(message.S);if(!prior||Date.parse(message.t)>=Date.parse(prior.time))priceUpdates.set(message.S,{price:message.p,time:message.t});}
        }
        if ((message.T === "c" || message.T === "x") && leases.has(message.S)) {quotes.delete(message.S);snapshotQueue.add(message.S);void bootstrapSnapshots();}
        if (message.T === "success" && message.msg === "authenticated") {
          clearTimeout(authTimeout); authenticated = true; retryCount = 0; subscribe();
        } else if (message.T === "subscription") {
          subscribedTrades = new Set(Array.isArray(message.trades) ? message.trades : []);
          scannerHub.refresh();status("connected");
        } else if (message.T === "error") {
          status("unavailable"); candidate.close();
        } else if ((message.T === "t" || message.T === "q") && leases.has(message.S)) {
          if (message.T === "t") { const rules = alpacaMinuteTradeRules(message); if (!rules.known || !rules.prices) continue; }
          const current = quotes.get(message.S) ?? {};
          const key = message.T === "t" ? "latestTrade" : "latestQuote";
          const previous = current[key] as { t?: string } | undefined;
          if (!previous?.t || Date.parse(message.t) >= Date.parse(previous.t)) quotes.set(message.S, { ...current, [key]: message });
        } else if (["b", "u", "d"].includes(message.T)) {
          if (leases.has(message.S)) {
            const previous = quotes.get(message.S) ?? {};
            const oldDaily = previous.dailyBar as { t?: string } | undefined;
            const rollover = message.T === "d" && oldDaily?.t && easternClock(Date.parse(oldDaily.t)).date < easternClock(Date.parse(message.t)).date;
            quotes.set(message.S, { ...previous, ...(rollover ? { prevDailyBar: oldDaily } : {}), [message.T === "d" ? "dailyBar" : "minuteBar"]: message });
          }
          const bar = alpacaCandle(message);
          if (bar) for (const client of clients) if (client.symbol === message.S) send(client, "bar", { bar, daily: message.T === "d" });
        }
      }
    });
    candidate.addEventListener("error", () => candidate.close());
    candidate.addEventListener("close", () => {
      clearTimeout(authTimeout);
      if (socket !== candidate) return;
      socket = null; authenticated = false;
      subscribedTrades.clear();
      quotes.clear();priceUpdates.clear();
      sessionBook.invalidate();
      if (!stopped && symbols().length) {
        status("reconnecting");
        retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(retryCount++, 5)));
      }
    });
  }
  const leaseTimer = setInterval(() => {
    const expired = [...leases].filter(([, until]) => until < Date.now()).map(([symbol]) => symbol);
    for (const symbol of expired) { leases.delete(symbol); quotes.delete(symbol); sessionBook.remove(symbol); }
    if (expired.length && authenticated && socket?.readyState === WebSocket.OPEN) {
      const unusedBars = expired.filter(symbol => ![...clients].some(client => client.symbol === symbol));
      socket.send(JSON.stringify({ action: "unsubscribe", trades: expired, quotes: expired, bars: unusedBars, updatedBars: unusedBars, dailyBars: unusedBars }));
    }
    if (!symbols().length) { clearTimeout(retry); const old = socket; socket = null; authenticated = false; old?.close(); }
  }, 5000);
  leaseTimer.unref();
  async function history(symbol: string, daily: boolean): Promise<Candle[]> {
    const key = `${symbol}:${daily}`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < 30_000) return cached.bars;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 4) throw Error("busy");
    if (Date.now() - windowStart >= 60_000) { requests = 0; windowStart = Date.now(); }
    if (++requests > 120) throw Error("busy");
    const load = async () => {
      const url = new URL("https://data.alpaca.markets/v2/stocks/bars");
      url.search = new URLSearchParams({ symbols: symbol, timeframe: daily ? "1Day" : "1Min", start: new Date(Date.now() - (daily ? 400 : 14) * 86_400_000).toISOString(), end: new Date().toISOString(), feed: "sip", adjustment: "raw", sort: "desc", limit: daily ? "400" : "10000" }).toString();
      const response = await fetch(url, { headers: { "APCA-API-KEY-ID": options.keyId, "APCA-API-SECRET-KEY": options.secretKey }, signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw Error(response.status === 429 ? "busy" : "provider_unavailable");
      const payload = await response.json();
      if (!payload.bars || !Array.isArray(payload.bars[symbol] ?? [])) throw Error("provider_unavailable");
      const bars = (payload.bars[symbol] ?? []).map(alpacaCandle).filter((bar: Candle | null): bar is Candle => bar !== null).sort((a: Candle, b: Candle) => a.time - b.time);
      cache.delete(key); cache.set(key, { at: Date.now(), bars });
      while (cache.size > 40) cache.delete(cache.keys().next().value!);
      return bars;
    };
    const promise = load().finally(() => pending.delete(key));
    pending.set(key, promise); return promise;
  }
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (!timingSafeEqual(digest(request.headers.authorization ?? ""), digest(`Bearer ${options.token}`))) { response.writeHead(401); response.end(); return; }
    const url = new URL(request.url ?? "/", "http://localhost");
    try {
      if(url.pathname === "/scanner-stream" && request.method === "POST"){
        let body="";
        for await(const chunk of request){body+=chunk.toString();if(body.length>131_072)throw Error("invalid_symbol");}
        const input=JSON.parse(body) as {symbols:unknown;regularClose:unknown};
        if(!Array.isArray(input.symbols)||!input.symbols.length||input.symbols.length>4000||![780,960].includes(Number(input.regularClose)))throw Error("invalid_symbol");
        const requested=input.symbols.map(value=>chartSymbol(String(value)));
        if(new Set(requested).size!==requested.length||new Set([...leases.keys(),...requested]).size>4500)throw Error("invalid_symbol");
        scannerHub.add(requested,Number(input.regularClose),response);subscribe();connect();return;
      }
      if(request.method !== "GET"){response.writeHead(405);response.end();return;}
      if (url.pathname === "/health") { response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ ready: true, feed: "sip" })); return; }
      if (url.pathname === "/history") {
        const result = await rest.history(parseHistoryRequest(url.searchParams));
        response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify(result)); return;
      }
      if (url.pathname === "/quotes") {
        const requested = (url.searchParams.get("symbols") ?? "").split(",").map(chartSymbol);
        if (!requested.length || requested.length > 400 || new Set(requested).size !== requested.length || new Set([...leases.keys(), ...requested]).size > 4500) throw Error("invalid_symbol");
        const missing = requested.filter(symbol => !quotes.has(symbol));
        const added = requested.some(symbol => !leases.has(symbol));
        for (const symbol of requested) leases.set(symbol, Date.now() + 45_000);
        if (added) subscribe(); connect();
        if (missing.length) {
          const snapshots = await rest.get("/v2/stocks/snapshots", new URLSearchParams({ symbols: missing.join(","), feed: "sip" })) as Record<string, Record<string, unknown>>;
          for (const symbol of missing) if (snapshots[symbol]) {
            // A streamed update received during HTTP bootstrap wins over its snapshot.
            const current = quotes.get(symbol) ?? {};
            quotes.set(symbol, { ...snapshots[symbol], ...current });
          }
        }
        const date = easternClock(Date.now()).date;
        const regularClose = Number(url.searchParams.get("regularClose") ?? 960);
        if (![780, 960].includes(regularClose)) throw Error("invalid_symbol");
        const totals = url.searchParams.get("sessions") === "1" ? Object.fromEntries(requested.map(symbol => [symbol, subscribedTrades.has(symbol) ? sessionBook.read(symbol, date, regularClose) : null])) : undefined;
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ feed: "sip", connected: authenticated, snapshots: Object.fromEntries(requested.map(symbol => [symbol, quotes.get(symbol) ?? null])), sessionTotals: totals })); return;
      }
      const symbol = chartSymbol(url.searchParams.get("symbol") ?? "");
      if (url.pathname === "/overnight") {
        const payload = await rest.get("/v2/stocks/trades/latest", new URLSearchParams({ symbols: symbol, feed: "boats" })) as { trades?: Record<string, unknown> };
        response.setHeader("Content-Type", "application/json"); response.end(JSON.stringify({ feed: "boats", symbol, trade: payload.trades?.[symbol] ?? null }));
      } else if (url.pathname === "/bars") {
        const daily = url.searchParams.get("daily") === "1";
        const bars = await history(symbol, daily);
        response.setHeader("Content-Type", "application/json");
        response.end(JSON.stringify({ symbol, feed: "sip", baseTimeframe: daily ? "1D" : "1m", adjustment: "raw", bars }));
      } else if (url.pathname === "/stream") {
        const chartSymbols = new Set([...clients].map(client => client.symbol));
        if (clients.size >= 16 || (!chartSymbols.has(symbol) && chartSymbols.size >= 8)) throw Error("busy");
        response.writeHead(200, { "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" });
        response.write("retry: 3000\n\n");
        const client = { symbol, response }; clients.add(client);
        send(client, "status", { state: authenticated ? "connected" : "connecting" });
        subscribe(); connect();
        const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 15_000);
        response.on("close", () => {
          clearInterval(heartbeat); clients.delete(client);
          if (!symbols().length) { clearTimeout(retry); const old = socket; socket = null; authenticated = false; old?.close(); }
          else if (!symbols().includes(symbol) && authenticated && socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ action: "unsubscribe", bars: [symbol], updatedBars: [symbol], dailyBars: [symbol] }));
        });
      } else { response.writeHead(404); response.end(); }
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      const code = error instanceof Error ? error.message : "provider_unavailable";
      const status = ["invalid_symbol", "invalid_history_request"].includes(code) ? 400 : code === "busy" ? 429 : 502;
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: status === 400 ? "invalid_symbol" : status === 429 ? "busy" : "provider_unavailable" }));
    }
  });
  return { server, close() { stopped = true; clearInterval(priceTimer); scannerHub.close(); clearInterval(leaseTimer); clearTimeout(retry); sessionBook.invalidate(); for (const symbol of leases.keys()) sessionBook.remove(symbol); socket?.close(); for (const client of clients) client.response.end(); server.close(); } };
}

export async function readPrivateJson(path: string): Promise<Record<string, string>> {
  const info = await stat(path);
  if ((info.mode & 0o077) !== 0 || !info.isFile()) throw Error("Private configuration permissions invalid");
  return JSON.parse(await readFile(path, "utf8"));
}
