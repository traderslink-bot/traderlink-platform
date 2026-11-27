import { AcceptedSeriesPublisher, type QualifiedInputSeries } from "../../market-data/accepted-series/publisher";
import { encodeGatewayWire, gatewayWireOperation, gatewayWireQuery, gatewayWireSubscription } from "../../market-data/transport/gateway-wire";
import { openStatusJournal } from "./status-journal";
import { createServer, type ServerResponse } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { createHash, timingSafeEqual } from "node:crypto";
import { alpacaCandle, chartSymbol, type Candle } from "./candles";
import {AlpacaVwapCorporateEvents} from "./chart-vwap-events";
import {AlpacaVwapHistory} from "./chart-vwap-history";
import {parseChartCalendarYear} from "./chart-calendar-request";
import { projectQualifiedChartSplits } from "./qualified-chart-splits";
import {parseVwapSeedRequest} from "./chart-vwap-seed";
import {AlpacaChartCalendar} from "./chart-calendar-provider";
import type { ChartCalendar } from "./chart-calendar";
import { AlpacaRestData, bindHistoryAcceptance, parseHistoryRequest, type AlpacaHistoryRequest,
  type AlpacaHistoryResult } from "./rest-data";
import { AlpacaSessionBook, alpacaMinuteTradeRules } from "./session-book";
import { AlpacaScannerListings } from "./scanner-listings";
import { ScannerStreamHub } from "./scanner-stream-hub";
import { easternClock } from "../live/sessions";
import { AlpacaPreviousCloseBook } from "./previous-close";
import { ScannerSplitReference } from "./scanner-split-reference";
import { AlpacaChartCorrections } from "./alpaca-chart-corrections";
import { parseChartCorrection } from "./chart-correction";
import { parseTradeRevisionRequest } from "./trade-revisions";
import { ChartLiveBook } from "./chart-live-book";
import { ChartOvernightFeed } from "./chart-overnight-feed";
import { chartOvernightTradingDate } from "./chart-overnight-session";
import { AlpacaTradingStatusBook } from "./trading-status";
import { LivePriceHub, priceObservationOrder } from "./live-price-hub";
import { parseScannerSignalBars, readScannerSignalBars, SCANNER_SIGNAL_CONCURRENCY, type ScannerSignalBars } from "./scanner-signal-bars";
import { coalescedMetadata } from "../live/server/coalesced-cache";
import { createVerifiedScannerLevelsMonitor, type SavedScannerMapAdmission, type ScannerLevelsObserveInterval } from "./verified-levels-monitor";
import { AlpacaCandleArchive, parseArchiveUniverse } from "../../market-data/candle-history/alpaca-archive";
import { ReadonlyCandleArchive } from "../../market-data/candle-history/readonly-archive";
import { parseCandleHistorySettings } from "../../market-data/candle-history/settings";
import { parseArchiveRead } from "../../market-data/candle-history/transport";
import { nativeDailyScannerContext } from "./native-daily-scanner-context";

type Client = { symbol: string; daily:boolean; wire?:boolean; response: ServerResponse };
type ReadVerifiedLevelsHistory = (request: AlpacaHistoryRequest, signal: AbortSignal) => Promise<{
  history: AlpacaHistoryResult;
  qualified: QualifiedInputSeries;
  calendars: ChartCalendar[];
} | undefined>;
type GatewayOptions = {
  /** An isolated supervisor can share its qualified receipt issuer with this process. */
  acceptedInputs?: AcceptedSeriesPublisher;
  observeScannerLevelsInterval?: ScannerLevelsObserveInterval;
  /** Only a qualified private adapter may bind authentic source metadata. */
  qualifyHistory?: (
    request: AlpacaHistoryRequest,
    history: AlpacaHistoryResult,
    signal: AbortSignal,
  ) => Promise<QualifiedInputSeries | undefined>;
  readVerifiedRegularHistory?: ReadVerifiedLevelsHistory;
  readVerifiedLevelsHistory?: ReadVerifiedLevelsHistory;
  candleHistory?: { path: string; adminToken: string };
  candleHistoryReadPath?: string;
  keyId: string; secretKey: string; token: string; haltSource?: "alpaca" | "official"; haltStatusJournal?: string; overnightCharts?: boolean };

async function verifyForHistoryResponse<T>(response: ServerResponse, operation: (signal: AbortSignal) => Promise<T>) {
  if (response.destroyed) return;
  const disconnected = new AbortController();
  const cancel = () => disconnected.abort();
  response.once("close", cancel);
  const signal = AbortSignal.any([disconnected.signal, AbortSignal.timeout(120_000)]);
  try {
    const result = await operation(signal).catch(() => undefined);
    if (!signal.aborted) return result;
  } finally {
    response.off("close", cancel);
  }
}

// This service deliberately knows no trading/account-management API URL.
export function createAlpacaGateway(options: GatewayOptions) {
  if (options.candleHistory && options.candleHistoryReadPath) throw Error("Ambiguous candle history mode");
  const archiveReader = options.candleHistoryReadPath && new ReadonlyCandleArchive(options.candleHistoryReadPath);
  const clients = new Set<Client>();
  const tradingStatuses = new AlpacaTradingStatusBook();
  let statusPersistenceHealthy = true;
  let statusJournal:ReturnType<typeof openStatusJournal>|null=null;
  try {if(options.haltSource === "alpaca" && options.haltStatusJournal)statusJournal=openStatusJournal(options.haltStatusJournal,tradingStatuses);}
  catch {statusPersistenceHealthy=false;}
  let statusesSubscribed = false, statusesRejected = false, subscriptionQueued = false;
  let subscriptionKind:"prices"|"statuses"|null=null;
  let statusAttemptTimer:ReturnType<typeof setTimeout>|undefined;
  const statusStartedAt = new Date().toISOString();
  const chartBooks = new Map<string, ChartLiveBook>();
  const priceUpdates=new Map<string,{price:number;time:string}>();
  const priceTimer=setInterval(()=>{for(const client of clients){const price=priceUpdates.get(client.symbol);if(price)send(client,"price",price);}priceUpdates.clear();for(const [key,book] of chartBooks){void book.warm();const [symbol,daily]=key.split("|");for(const bar of book.drain())for(const client of clients)if(client.symbol===symbol&&client.daily===(daily==="true")&&(daily==="true"||!corrections.has(symbol,bar.time)))send(client,"bar",{bar,daily:daily==="true",provisional:true});}},250);priceTimer.unref();
  const cache = new Map<string, { at: number; bars: Candle[] }>();
  const pending = new Map<string, Promise<Candle[]>>();
  const rest = new AlpacaRestData(options);
  const corrections = new AlpacaChartCorrections(rest, revisions => {
    const { symbol } = revisions[0];
    cache.delete(`${symbol}:false:${chartBasisDate}:split`);
    vwapHistory.invalidateSymbol(symbol);
    sessionBook.remove(symbol);
    scannerHub.mark(symbol);
    try { archive?.applyTradeCorrections(revisions); } catch { /* Provider-qualified live corrections still reach charts. */ }
    for (const client of clients) if (client.symbol === symbol) {
      for (const revision of revisions) send(client, "chart-correction", parseChartCorrection(revision));
    }
  }, Date.now, start => archive?.readTradeCorrections(start) ?? []);
  const correctedHistory = async (request: AlpacaHistoryRequest, background = false): Promise<AlpacaHistoryResult> => {
    const history = await rest.history(request, background);
    return request.timeframe === "1Min" ? corrections.overlay(history, request.start, request.end) : history;
  };
  let signalReads = 0;
  const signalHistory = coalescedMetadata(async (request: ScannerSignalBars) => {
    if (signalReads >= SCANNER_SIGNAL_CONCURRENCY) throw Error("busy");
    signalReads++;
    const signal = AbortSignal.timeout(45_000);
    try { return await readScannerSignalBars({ get: (path, query) => rest.get(path, query, signal) }, request); }
    finally { signalReads--; }
  }, 5_000, request => JSON.stringify(request), SCANNER_SIGNAL_CONCURRENCY);
  const chartCalendar = new AlpacaChartCalendar(options);
  const accepted = options.acceptedInputs ?? new AcceptedSeriesPublisher();
  const levelsMonitor = options.observeScannerLevelsInterval && createVerifiedScannerLevelsMonitor(accepted, options.observeScannerLevelsInterval);
  const levelsMonitorTimer = levelsMonitor && setInterval(() => { void levelsMonitor.poll(); }, 15_000);
  levelsMonitorTimer?.unref();
  const overnightRest = options.overnightCharts ? new AlpacaRestData(options, fetch, "boats") : null;
  const overnightFeed = overnightRest && new ChartOvernightFeed(options, overnightRest, async date => {
    const calendar = await chartCalendar.forYear(Number(date.slice(0, 4)));
    return calendar.available ? calendar.sessions.some(row => row.date === date) : undefined;
  });
  const corporateEvents = new AlpacaVwapCorporateEvents(options);
  const splitReference = new ScannerSplitReference(rest, symbol => corporateEvents.splitHistory(symbol),
    symbol => scannerHub.mark(symbol));
  const archive: AlpacaCandleArchive | undefined = options.candleHistory && new AlpacaCandleArchive(options.candleHistory.path, { history: correctedHistory }, chartCalendar,
    async symbol => {
      const history = await corporateEvents.splitHistory(symbol);
      splitReference.remember(history);
      return history;
    });
  const vwapHistory = new AlpacaVwapHistory({ history: correctedHistory }, chartCalendar, Date.now, corporateEvents);
  const listings = new AlpacaScannerListings(options);
  const previousCloses = new AlpacaPreviousCloseBook(rest, chartCalendar, archive ? {
    read: (symbol, start, end) => archive.readScannerDaily(symbol, start, end),
    remember: (date, start, end, entries) => archive.rememberScannerDaily(date, start, end, entries),
  } : undefined);
  let chartBasisDate = easternClock(Date.now()).date;
  const sessionBook = new AlpacaSessionBook(rest, symbol => scannerHub.mark(symbol), archive ? (symbol, date, start, end) => {
    try {
      const result = archive.read({ symbol, frame: "1m", session: "extended", start, end });
      return result.state === "ready" && result.basisDate === date ? result.bars : null;
    } catch {
      return null;
    }
  } : undefined);
  const leases = new Map<string, number>();
  const quotes = new Map<string, Record<string, unknown>>();
  const digest = (value: string) => createHash("sha256").update(value).digest();
  let socket: WebSocket | null = null, authenticated = false, retry: ReturnType<typeof setTimeout> | undefined;
  let subscribedTrades = new Set<string>();
  let subscribedBars = new Set<string>();
  let retryCount = 0, stopped = false, requests = 0, windowStart = Date.now();
  const send = (client: Client, event: string, value: unknown) => {
    if (client.response.writableLength > 256_000) { client.response.destroy(); return; }
    client.response.write(`event: ${event}\ndata: ${JSON.stringify(client.wire ? encodeGatewayWire("stream",value) : value)}\n\n`);
  };
  const status = (state: string) => { for (const client of clients) send(client, "status", { state, adjustment: "split", basisDate: easternClock(Date.now()).date }); };
  const sendTradingStatus=(client:Client)=>send(client,"trading-status",{symbol:client.symbol,available:authenticated&&statusesSubscribed,status:authenticated&&statusesSubscribed?tradingStatuses.read(client.symbol):null});
  let priceGeneration = 0;
  let previousPriceSymbols = new Set<string>();
  const priceHub = new LivePriceHub(() => {
    const wanted = new Set(priceHub.symbols());
    const removed = [...previousPriceSymbols].filter(symbol => !wanted.has(symbol) && !leases.has(symbol) && ![...clients].some(client=>client.symbol===symbol));
    previousPriceSymbols = wanted;
    if (authenticated && socket?.readyState === WebSocket.OPEN && removed.length) unsubscribeForeground(removed);
    if (!needsSocket()) { clearTimeout(retry); const old=socket;socket=null;authenticated=false;priceHub.state(false);old?.close(); }
    else { subscribe(); connect(); }
  }, bootstrapLivePrices);
  async function bootstrapLivePrices(requested: readonly string[]) {
    if(!requested.length)return;
    const generation = priceGeneration;
    const snapshots = await rest.get("/v2/stocks/snapshots", new URLSearchParams({symbols:requested.join(","),feed:"sip"})) as Record<string,{latestTrade?:unknown}>;
    if(generation!==priceGeneration)return;
    for(const symbol of requested)priceHub.observe(symbol,snapshots[symbol]?.latestTrade);
  }
  const symbols = () => [...new Set([...clients].map(client => client.symbol).concat([...leases.keys()],priceHub.symbols()))];
  const archiveBackground = () => archive?.backgroundSymbols() ?? [];
  const needsSocket = () => options.haltSource === "alpaca" || symbols().length > 0 || archiveBackground().length > 0;

  function unsubscribeForeground(removed: readonly string[]) {
    const background = new Set(archiveBackground());
    const stoppedBars = removed.filter(symbol => !background.has(symbol));
    socket?.send(JSON.stringify({ action: "unsubscribe", trades: removed, quotes: removed, dailyBars: removed,
      bars: stoppedBars, updatedBars: stoppedBars }));
  }

  function archiveMinuteState(): "off" | "connecting" | "active" {
    const wanted = archiveBackground();
    if (!wanted.length) return "off";
    return authenticated && wanted.every(symbol => subscribedBars.has(symbol)) ? "active" : "connecting";
  }

  function refreshArchiveSubscriptions(previous: readonly string[]) {
    const foreground = new Set(symbols());
    const background = new Set(archiveBackground());
    const removed = previous.filter(symbol => !foreground.has(symbol) && !background.has(symbol));
    if (authenticated && socket?.readyState === WebSocket.OPEN && removed.length) {
      socket.send(JSON.stringify({ action: "unsubscribe", bars: removed, updatedBars: removed }));
    }
    if (needsSocket()) {
      subscribe();
      connect();
    } else {
      clearTimeout(retry);
      const old = socket;
      socket = null; authenticated = false;
      old?.close();
    }
  }
  const snapshotQueue=new Set<string>();let bootstrapping=false;
  async function bootstrapSnapshots(){
    if(bootstrapping)return;bootstrapping=true;
    try{while(snapshotQueue.size&&!stopped){
      const batch=[...snapshotQueue].slice(0,200);for(const symbol of batch)snapshotQueue.delete(symbol);
      const generation = priceGeneration;
      try{
        const snapshots=await rest.get("/v2/stocks/snapshots",new URLSearchParams({symbols:batch.join(","),feed:"sip"})) as Record<string,Record<string,unknown>>;
        if (generation !== priceGeneration) continue;
        for(const symbol of batch)if(leases.has(symbol)&&snapshots[symbol]){quotes.set(symbol,{...snapshots[symbol],...(quotes.get(symbol)??{})});scannerHub.mark(symbol);}
      }catch{/* Missing baselines remain unavailable; the maintenance sweep retries. */}
    }}finally{bootstrapping=false;}
  }
  function scannerSessionTotals(symbol: string, date: string, regularClose: number) {
    // Scanner should only rebuild from history once the provider has confirmed the update.
    const start = Date.parse(date + "T00:00:00Z");
    if (!subscribedTrades.has(symbol) || corrections.isPending(symbol, start, start + 86_400_000)) return null;
    const totals = sessionBook.read(symbol, date, regularClose);
    const correctionRevision = totals.complete ? corrections.sessionRevision(symbol, date) : undefined;
    return correctionRevision ? { ...totals, correctionRevision } : totals;
  }
  const scannerHub=new ScannerStreamHub((requested,regularClose)=>({feed:"sip",connected:authenticated,
    snapshots:Object.fromEntries(requested.map(symbol=>{
      const quote=quotes.get(symbol);if(!quote)return [symbol,null];
      const daily=quote.dailyBar as {t?:string;c?:number}|undefined,previous=quote.prevDailyBar as {t?:string;c?:number}|undefined,bidAsk=quote.latestQuote as {t?:string;bp?:number;ap?:number}|undefined;
      return [symbol,{dailyBar:daily?{t:daily.t,c:daily.c}:undefined,prevDailyBar:previous?{t:previous.t,c:previous.c}:undefined,latestQuote:bidAsk?{t:bidAsk.t,bp:bidAsk.bp,ap:bidAsk.ap}:undefined,tradingStatus:statusesSubscribed?tradingStatuses.read(symbol):null,adjustedPreviousClose:splitReference.read(previousCloses.peek(symbol,easternClock(Date.now()).date),tradingStatuses.read(symbol))}];
    })),
    sessionTotals:Object.fromEntries(requested.map(symbol=>[symbol,scannerSessionTotals(symbol, easternClock(Date.now()).date, regularClose)]))
  }) as import("./scanner-snapshots").AlpacaQuoteReply,requested=>{for(const symbol of requested){leases.set(symbol,Date.now()+45_000);if(!quotes.has(symbol)||(!quotes.get(symbol)?.prevDailyBar&&!quotes.get(symbol)?.dailyBar))snapshotQueue.add(symbol);}void bootstrapSnapshots();void previousCloses.read(requested,easternClock(Date.now()).date).then(()=>scannerHub.refresh()).catch(()=>{});});
  try {
    for (const history of archive?.readEffectiveSplitHistories() ?? []) splitReference.remember(history);
  } catch { /* The live halt path can still verify an affected ticker. */ }
  function subscribe() {
    if (authenticated && socket?.readyState === WebSocket.OPEN) {
      if(subscriptionKind){subscriptionQueued=true;return;}
      subscriptionKind="prices";
      const wanted = symbols();
      const bars = [...new Set([...wanted, ...archiveBackground()])];
      socket.send(JSON.stringify({ action: "subscribe", trades: wanted, quotes: [...new Set([...leases.keys(),...priceHub.symbols()])], bars, updatedBars: bars, dailyBars: wanted }));
    }
  }
  function requestStatuses(){
    if(options.haltSource!=="alpaca"||statusesRejected||statusesSubscribed||subscriptionKind||!authenticated||socket?.readyState!==WebSocket.OPEN)return;
    subscriptionKind="statuses";
    socket.send(JSON.stringify({action:"subscribe",statuses:["*"]}));
    statusAttemptTimer=setTimeout(()=>{
      if(subscriptionKind!=="statuses")return;
      statusesRejected=true;statusesSubscribed=false;subscriptionKind=null;scannerHub.refresh();
      if(subscriptionQueued){subscriptionQueued=false;subscribe();}
    },5000);statusAttemptTimer.unref();
  }
  function connect() {
    if (stopped || !needsSocket() || socket) return;
    subscriptionKind=null;subscriptionQueued=false;statusesSubscribed=false;clearTimeout(statusAttemptTimer);
    status("connecting");
    const candidate = new WebSocket("wss://stream.data.alpaca.markets/v2/sip");
    socket = candidate;
    const authTimeout = setTimeout(() => candidate.close(), 15_000);
    candidate.addEventListener("open", () => candidate.send(JSON.stringify({ action: "auth", key: options.keyId, secret: options.secretKey })));
    candidate.addEventListener("message", event => {
      if(socket!==candidate||stopped)return;
      let messages: unknown;
      try { messages = JSON.parse(String(event.data)); } catch { return; }
      if (!Array.isArray(messages)) return;
      const acceptedStatuses: Record<string, unknown>[] = [];
      const changedSymbols = new Set<string>();
      for (const message of messages) {
        if (message.T === "t") priceHub.observe(message.S,message);
        if (["t", "q", "b", "u", "d", "c", "x"].includes(message.T) && typeof message.S === "string") scannerHub.mark(message.S);
        if (message.T === "c" || message.T === "x") corrections.observe(message);
        if (["t", "c", "x"].includes(message.T)) { sessionBook.observe(message); for(const daily of [false,true])chartBooks.get(`${message.S}|${daily}`)?.observe(message); }
        if(message.T === "t" && alpacaMinuteTradeRules(message).known && alpacaMinuteTradeRules(message).prices && Number.isFinite(message.p) && message.p>0){
          if([...clients].some(client=>client.symbol===message.S)){const prior=priceUpdates.get(message.S);if(!prior||priceObservationOrder(message.t)>=priceObservationOrder(prior.time))priceUpdates.set(message.S,{price:message.p,time:message.t});}
        }
        if ((message.T === "c" || message.T === "x") && leases.has(message.S)) {quotes.delete(message.S);snapshotQueue.add(message.S);void bootstrapSnapshots();}
        if (message.T === "success" && message.msg === "authenticated") {
          clearTimeout(authTimeout); authenticated = true; retryCount = 0; subscribe();
        } else if (message.T === "subscription") {
          const completed=subscriptionKind;subscriptionKind=null;
          if(completed==="statuses")clearTimeout(statusAttemptTimer);
          statusesSubscribed = !statusesRejected && statusPersistenceHealthy && Array.isArray(message.statuses) && message.statuses.includes("*");
          if(completed==="statuses"&&!statusesSubscribed)statusesRejected=true;
          subscribedTrades = new Set(Array.isArray(message.trades) ? message.trades : []);
          const corrections = new Set(Array.isArray(message.updatedBars) ? message.updatedBars : []);
          subscribedBars = new Set((Array.isArray(message.bars) ? message.bars : []).filter((symbol: string) => corrections.has(symbol)));
          scannerHub.refresh();priceHub.state(true);void bootstrapLivePrices(priceHub.symbols()).catch(()=>{});status("connected");
          for(const client of clients)sendTradingStatus(client);
          requestStatuses();
          if(subscriptionQueued&&!subscriptionKind){subscriptionQueued=false;subscribe();}
        } else if (message.T === "error") {
          if(authenticated&&subscriptionKind==="statuses"&&[409,410].includes(message.code)){
            clearTimeout(statusAttemptTimer);subscriptionKind=null;statusesRejected=true;statusesSubscribed=false;scannerHub.refresh();
            if(subscriptionQueued){subscriptionQueued=false;subscribe();}
          }else{priceHub.state(false);status("unavailable");candidate.close();}
        } else if ((message.T === "t" || message.T === "q") && leases.has(message.S)) {
          if (message.T === "t") { const rules = alpacaMinuteTradeRules(message); if (!rules.known || !rules.prices) continue; }
          const current = quotes.get(message.S) ?? {};
          const key = message.T === "t" ? "latestTrade" : "latestQuote";
          const previous = current[key] as { t?: string } | undefined;
          if (!previous?.t || Date.parse(message.t) >= Date.parse(previous.t)) quotes.set(message.S, { ...current, [key]: message });
        } else if (["b", "u", "d"].includes(message.T)) {
          const bar = alpacaCandle(message);
          if (bar && message.T !== "d" && typeof message.S === "string" && corrections.has(message.S, bar.time)) {
            if (message.T === "u") corrections.refresh(message.S);
            continue;
          }
          if (leases.has(message.S)) {
            const previous = quotes.get(message.S) ?? {};
            const oldDaily = previous.dailyBar as { t?: string } | undefined;
            const rollover = message.T === "d" && oldDaily?.t && easternClock(Date.parse(oldDaily.t)).date < easternClock(Date.parse(message.t)).date;
            quotes.set(message.S, { ...previous, ...(rollover ? { prevDailyBar: oldDaily } : {}), [message.T === "d" ? "dailyBar" : "minuteBar"]: message });
          }
          if (bar && message.T !== "d" && typeof message.S === "string") archive?.enqueueMinute(message.S, bar);
          if (bar && message.T !== "d") chartBooks.get(`${message.S}|false`)?.seal(bar.time);
          if (bar) for (const client of clients) if (client.symbol === message.S && client.daily === (message.T === "d") && !(message.T === "d" && chartBooks.get(`${message.S}|true`)?.covers(bar.time))) send(client, "bar", { bar, daily: message.T === "d" });
        }
      }
      if (options.haltSource === "alpaca") for (const message of messages) {
        if (typeof message.S === "string") {
          if (message.T === "s" && tradingStatuses.observe(message)) {
            acceptedStatuses.push(message);
            changedSymbols.add(message.S);
          }
          if (message.T === "t" && typeof message.t === "string" && typeof message.p === "number") {
            const rules = alpacaMinuteTradeRules(message);
            if (rules.known && rules.prices && tradingStatuses.observeTrade(message.S, message.t, message.p)) {
              changedSymbols.add(message.S);
            }
          }
        }
      }
      if (changedSymbols.size) {
        try {
          if (acceptedStatuses.length) statusJournal?.appendMany(acceptedStatuses);
          for (const symbol of changedSymbols) {
            scannerHub.mark(symbol);
            for (const client of clients) if (client.symbol === symbol) sendTradingStatus(client);
          }
        } catch {
          statusPersistenceHealthy = false;
          statusesSubscribed = false;
          scannerHub.refresh();
        }
      }
    });
    candidate.addEventListener("error", () => candidate.close());
    candidate.addEventListener("close", () => {
      clearTimeout(authTimeout);
      if (socket !== candidate) return;
      socket = null; authenticated = false; statusesSubscribed = false; subscriptionKind=null;clearTimeout(statusAttemptTimer);
      subscribedTrades.clear();subscribedBars.clear();priceGeneration++;priceHub.state(false);
      quotes.clear();priceUpdates.clear();
      for(const book of chartBooks.values())book.invalidate();
      sessionBook.invalidate();
      if (!stopped && needsSocket()) {
        status("reconnecting");
        retry = setTimeout(connect, Math.min(30_000, 1000 * 2 ** Math.min(retryCount++, 5)));
      }
    });
  }
  const leaseTimer = setInterval(() => {
    const basisDate = easternClock(Date.now()).date;
    if (basisDate !== chartBasisDate) {
      chartBasisDate = basisDate; cache.clear();
      for(const book of chartBooks.values())book.invalidate();
      status("reconnecting"); status(authenticated ? "connected" : "connecting");
    }
    const expired = [...leases].filter(([, until]) => until < Date.now()).map(([symbol]) => symbol);
    for (const symbol of expired) { leases.delete(symbol); quotes.delete(symbol); sessionBook.remove(symbol); }
    if (expired.length && authenticated && socket?.readyState === WebSocket.OPEN) {
      const unusedBars = expired.filter(symbol => ![...clients].some(client => client.symbol === symbol) && !priceHub.symbols().includes(symbol));
      if (unusedBars.length) unsubscribeForeground(unusedBars);
    }
    if (!needsSocket()) { clearTimeout(retry); const old = socket; socket = null; authenticated = false; old?.close(); }
  }, 5000);
  leaseTimer.unref();
  async function history(symbol: string, daily: boolean): Promise<Candle[]> {
    const basisDate = easternClock(Date.now()).date;
    const key = `${symbol}:${daily}:${basisDate}:split`;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < 30_000) return cached.bars;
    const existing = pending.get(key);
    if (existing) return existing;
    if (pending.size >= 4) throw Error("busy");
    if (Date.now() - windowStart >= 60_000) { requests = 0; windowStart = Date.now(); }
    if (++requests > 120) throw Error("busy");
    const load = async () => {
      const url = new URL("https://data.alpaca.markets/v2/stocks/bars");
      url.search = new URLSearchParams({ symbols: symbol, timeframe: daily ? "1Day" : "1Min", start: new Date(Date.now() - (daily ? 400 : 14) * 86_400_000).toISOString(), end: new Date().toISOString(), feed: "sip", adjustment: "split", sort: "desc", limit: daily ? "400" : "10000" }).toString();
      const response = await fetch(url, { headers: { "APCA-API-KEY-ID": options.keyId, "APCA-API-SECRET-KEY": options.secretKey }, signal: AbortSignal.timeout(20_000) });
      if (!response.ok) throw Error(response.status === 429 ? "busy" : "provider_unavailable");
      const payload = await response.json();
      if (easternClock(Date.now()).date !== basisDate) throw Error("adjustment_basis_changed");
      if (!payload.bars || !Array.isArray(payload.bars[symbol] ?? [])) throw Error("provider_unavailable");
      const bars = (payload.bars[symbol] ?? []).map(alpacaCandle).filter((bar: Candle | null): bar is Candle => bar !== null).sort((a: Candle, b: Candle) => a.time - b.time);
      const corrected = daily ? bars : corrections.overlay({ symbol, bars, adjustment: "split", basisDate, feed: "sip",
        complete: true, nextPageToken: null }, Date.now() - 14 * 86_400_000, Date.now()).bars;
      cache.delete(key); cache.set(key, { at: Date.now(), bars: corrected });
      while (cache.size > 40) cache.delete(cache.keys().next().value!);
      return corrected;
    };
    const promise = load().finally(() => pending.delete(key));
    pending.set(key, promise); return promise;
  }
  const server = createServer(async (request, response) => {
    response.setHeader("Cache-Control", "no-store");
    if (!timingSafeEqual(digest(request.headers.authorization ?? ""), digest(`Bearer ${options.token}`))) { response.writeHead(401); response.end(); return; }
    const url = new URL(request.url ?? "/", "http://localhost");
    const operation=gatewayWireOperation(url.pathname);
    const reply=(value:unknown)=>response.end(JSON.stringify(operation?encodeGatewayWire(operation,value):value));
    try {
      if(operation){url.pathname="/"+operation;url.search=gatewayWireQuery(url.searchParams,true).toString();}
      if (url.pathname === "/candle-history" && request.method === "GET") {
        const reader = archive || archiveReader;
        if (!reader) { response.writeHead(404).end(); return; }
        const range = parseArchiveRead(url.searchParams);
        response.setHeader("Content-Type", "application/json");
        const result = url.searchParams.get("purpose") === "scanner" ? reader.readScannerStudy(range) : reader.read(range);
        if (result.state === "ready" && url.searchParams.get("purpose") !== "scanner") archive?.touch(range.symbol);
        reply(result);
        return;
      }
      if (url.pathname === "/candle-history/admin" || url.pathname === "/candle-history/roster") {
        const credential = request.headers["x-traderlink-candle-history-admin"];
        if (!archive || !options.candleHistory || typeof credential !== "string" ||
          !timingSafeEqual(digest(credential), digest(options.candleHistory.adminToken))) {
          response.writeHead(404).end(); return;
        }
        if (request.method === "GET" && url.pathname === "/candle-history/admin") {
          response.setHeader("Content-Type", "application/json");
          reply({ ...archive.state(), minuteState: archiveMinuteState() });
          return;
        }
        if (request.method !== "PUT") { response.writeHead(405).end(); return; }
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const part of request) {
          const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part);
          size += chunk.byteLength;
          if (size > 1_048_576) { response.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        try {
          const input = JSON.parse(Buffer.concat(chunks).toString("utf8")) as {
            settings?: unknown; universe?: unknown; rosterSettingsRevision?: unknown;
          };
          const universe = parseArchiveUniverse(input?.universe);
          response.setHeader("Content-Type", "application/json");
          if (url.pathname === "/candle-history/roster") {
            const revision = input.rosterSettingsRevision;
            if (revision !== undefined && (typeof revision !== "number" || !Number.isSafeInteger(revision) || revision < 0)) {
              throw Error("invalid_archive_universe");
            }
            archive.setUniverse(universe, revision);
            reply({ state: "saved" });
          } else {
            const holdings = parseCandleHistorySettings(input?.settings);
            const previous = archive.backgroundSymbols();
            const result = archive.changeSettings(holdings, universe);
            refreshArchiveSubscriptions(previous);
            reply({ ...result, minuteState: archiveMinuteState() });
          }
        } catch (error) {
          const code = error instanceof Error ? error.message : "";
          if (code === "candle_history_settings_conflict") response.writeHead(409).end();
          else if (error instanceof SyntaxError || code.startsWith("invalid_")) response.writeHead(400).end();
          else throw error;
        }
        return;
      }
      if (url.pathname === "/halts" && request.method === "GET") {
        response.setHeader("Content-Type", "application/json");
        reply({feed:"sip",connected:authenticated,statusesSubscribed,observedSince:statusStartedAt,statuses:tradingStatuses.all(),events:tradingStatuses.events()});return;
      }
      if(url.pathname === "/prices" && request.method === "POST"){
        let body="";
        for await(const chunk of request){body+=chunk.toString();if(body.length>16_384)throw Error("invalid_symbol");}
        const input=(operation?gatewayWireSubscription(JSON.parse(body),true):JSON.parse(body)) as {symbols?:unknown};
        if(!Array.isArray(input.symbols)||!input.symbols.length||input.symbols.length>400||input.symbols.some(value=>typeof value!=="string"))throw Error("invalid_symbol");
        const requested=input.symbols.map(value=>chartSymbol(value as string));
        if(new Set(requested).size!==requested.length||new Set([...symbols(),...requested]).size>4500)throw Error("invalid_symbol");
        priceHub.add(requested,response,operation?value=>encodeGatewayWire("prices",value):undefined);return;
      }
      if(url.pathname === "/scanner-stream" && request.method === "POST"){
        let body="";
        for await(const chunk of request){body+=chunk.toString();if(body.length>131_072)throw Error("invalid_symbol");}
        const input=(operation?gatewayWireSubscription(JSON.parse(body),true):JSON.parse(body)) as {symbols:unknown;regularClose:unknown};
        if(!Array.isArray(input.symbols)||!input.symbols.length||input.symbols.length>4000||![780,960].includes(Number(input.regularClose)))throw Error("invalid_symbol");
        const requested=input.symbols.map(value=>chartSymbol(String(value)));
        if(new Set(requested).size!==requested.length||new Set([...leases.keys(),...requested]).size>4500)throw Error("invalid_symbol");
        scannerHub.add(requested,Number(input.regularClose),response,operation?value=>encodeGatewayWire("scanner-stream",value):undefined);subscribe();connect();return;
      }
      if (url.pathname === "/accepted-map-monitor" && request.method === "POST") {
        if (!levelsMonitor) { response.writeHead(404).end(); return; }
        let body = "";
        for await (const chunk of request) {
          body += chunk.toString();
          if (body.length > 2_048) { response.writeHead(413).end(); return; }
        }
        const admission = JSON.parse(body) as SavedScannerMapAdmission;
        const calendars = accepted.readRegularCalendar(admission.regularId);
        if (!calendars || !levelsMonitor.admit(admission, calendars)) { response.writeHead(409).end(); return; }
        response.writeHead(202, { "Content-Type": "application/json" });
        reply({ admitted: true });
        return;
      }
      if(request.method !== "GET"){response.writeHead(405);response.end();return;}
      if (url.pathname === "/health") { response.setHeader("Content-Type", "application/json"); reply({ ready: true, feed: "sip" }); return; }
      if (url.pathname === "/trade-revisions") {
        const manifest = corrections.manifest(parseTradeRevisionRequest(url.searchParams, Date.now()));
        response.setHeader("Content-Type", "application/json");
        reply(manifest);
        return;
      }
      if (url.pathname === "/scanner-listings") {
        const excluded = await listings.read();
        response.setHeader("Content-Type", "application/json");
        reply({ excluded }); return;
      }
      if (url.pathname === "/scanner-signal-bars") {
        const input = parseScannerSignalBars(url.searchParams);
        const output = await signalHistory(input);
        if (response.destroyed) return;
        response.setHeader("Content-Type", "application/json");
        reply(output); return;
      }
      if(url.pathname==="/calendar"){
        const result=await chartCalendar.forYear(parseChartCalendarYear(url.searchParams));
        response.setHeader("Content-Type","application/json");reply(result);return;
      }
      if (url.pathname === "/vwap-seed") {
        const result=await vwapHistory.read(parseVwapSeedRequest(url.searchParams));
        response.setHeader("Content-Type","application/json");reply(result);return;
      }
      if (url.pathname === "/chart-splits" && request.method === "GET") {
        const symbol = chartSymbol(url.searchParams.get("symbol") ?? "");
        const basisDate = easternClock(Date.now()).date;
        const reader = archive || archiveReader;
        const snapshot = reader ? reader.readQualifiedSplitHistory(symbol) : null;
        response.setHeader("Content-Type", "application/json");
        reply(projectQualifiedChartSplits(symbol, basisDate, snapshot));
        return;
      }
      if (url.pathname === "/analyzer-splits") {
        const result = await corporateEvents.read(chartSymbol(url.searchParams.get("symbol") ?? ""), "Splits");
        response.setHeader("Content-Type", "application/json");
        reply(result);
        return;
      }
      if (url.pathname === "/chart-unadjusted-history" && request.method === "GET") {
        const window = parseHistoryRequest(url.searchParams);
        const overnight = url.searchParams.get("overnight") === "1";
        if (overnight && window.timeframe !== "1Min") throw Error("invalid_history_request");
        const source = overnight ? overnightRest : rest;
        if (!source) { response.writeHead(404); response.end(); return; }
        const result = await (source === rest ? correctedHistory({ ...window, adjustment: "raw" }) : source.history({ ...window, adjustment: "raw" }));
        const bars = overnight ? result.bars.filter(bar => bar.low > 0 && chartOvernightTradingDate(bar.time * 1000)) : result.bars;
        const sessionFacts = window.timeframe === "1Min" ? { calendar: await chartCalendar.forBars(bars) } : { calendars: await chartCalendar.forHistory(bars) };
        reply({ ...result, bars, ...sessionFacts });
        return;
      }
      if (url.pathname === "/chart-overnight-history" && request.method === "GET") {
        if (!overnightRest) { response.writeHead(404); response.end(); return; }
        const window = parseHistoryRequest(url.searchParams);
        if (window.timeframe !== "1Min" || window.adjustment === "raw") throw Error("invalid_history_request");
        const relevant = window.end - window.start >= 8 * 3600_000 ||
          chartOvernightTradingDate(window.start) || chartOvernightTradingDate(window.end);
        const result = relevant ? await overnightRest.history(window) : {
          symbol: window.symbol, feed: "boats", adjustment: "split", basisDate: easternClock(Date.now()).date,
          bars: [], complete: true, nextPageToken: null,
        };
        response.setHeader("Content-Type", "application/json");
        reply({ ...result, bars: result.bars.filter(bar => bar.low > 0 && chartOvernightTradingDate(bar.time * 1000)) });
        return;
      }
      if (url.pathname === "/accepted-regular-opportunities" && request.method === "GET") {
        const dailyId = url.searchParams.get("dailyId") ?? "";
        const regularId = url.searchParams.get("regularId") ?? "";
        const mapId = url.searchParams.get("mapId") ?? "";
        const mapRevision = url.searchParams.get("mapRevision") ?? "";
        if (![dailyId, regularId, mapId].every(id => /^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(id)) ||
          !/^[a-f0-9]{64}$/u.test(mapRevision)) {
          response.writeHead(400).end(); return;
        }
        response.setHeader("Content-Type", "application/json");
        reply(accepted.readRegularOpportunities(dailyId, regularId, { mapId, mapRevision })); return;
      }
      if (url.pathname === "/accepted-input" || url.pathname === "/accepted-input-candle" || url.pathname === "/accepted-daily-context") {
        const id = url.searchParams.get("id") ?? "";
        if (!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/u.test(id)) { response.writeHead(400).end(); return; }
        const input = url.pathname === "/accepted-input" ? accepted.read(id) : url.pathname === "/accepted-input-candle"
          ? accepted.latestFullCandle(id) : accepted.readDailyContext(id);
        if (!input) { response.writeHead(404).end(); return; }
        response.setHeader("Content-Type", "application/json");
        reply(input); return;
      }
      if (url.pathname === "/history") {
        const request = parseHistoryRequest(url.searchParams);
        const dailyStartup = url.searchParams.get("dailyStartup");
        if (dailyStartup !== null && (dailyStartup !== "1" || request.timeframe !== "1Day" ||
          request.adjustment === "raw" || request.acceptedEvidence || request.sessionMode)) throw Error("invalid_history_request");
        if (request.sessionMode === "regular" ||
          (request.timeframe === "1Day" && request.acceptedEvidence && options.readVerifiedLevelsHistory)) {
          const read = options.readVerifiedLevelsHistory ?? options.readVerifiedRegularHistory;
          const verified = read && await verifyForHistoryResponse(response, signal => read(request, signal));
          if (response.destroyed) return;
          const acceptedInput = verified && bindHistoryAcceptance(request, verified.history, verified.qualified, accepted);
          if (verified && acceptedInput) {
            if (acceptedInput.frame === "4h") {
              accepted.rememberRegularCalendar(acceptedInput.id, verified.calendars);
            } else {
              const context = nativeDailyScannerContext(verified.qualified, verified.calendars);
              if (context) accepted.rememberDailyContext(acceptedInput.id, context);
            }
            response.setHeader("Content-Type", "application/json");
            reply({ ...verified.history, calendars: verified.calendars, acceptedInput });
            return;
          }
          if (request.sessionMode === "regular") { response.writeHead(503).end(); return; }
        }
        const archived = archive ? await archive.readChartHistory(request, dailyStartup === "1")
          : archiveReader ? archiveReader.readChartHistory(request) : null;
        const base: AlpacaHistoryResult = archived ?? await correctedHistory(request);
        const result = request.timeframe === "1Min" ? corrections.overlay(base, request.start, request.end) : base;
        if (archived) archive?.touch(request.symbol);
        else archive?.rememberChartHistory(request, result);
        if (result.adjustment === "raw") {
          response.setHeader("Content-Type", "application/json");
          reply(result);
          return;
        }
        const calendar = request.timeframe === "1Min" ? { calendar: await chartCalendar.forBars(result.bars) }
          : { calendars: await chartCalendar.forHistory(result.bars) };
        if (response.destroyed) return;
        const qualify = options.qualifyHistory;
        const qualified = request.acceptedEvidence && qualify
          ? await verifyForHistoryResponse(response, signal => qualify(request, result, signal)) : undefined;
        if (response.destroyed) return;
        const acceptedInput = bindHistoryAcceptance(request, result, qualified, accepted);
        response.setHeader("Content-Type", "application/json");
        reply({ ...result, ...calendar, ...(acceptedInput ? { acceptedInput } : {}) });
        return;
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
        const adjustedCloses = url.searchParams.get("sessions") === "1" ? await previousCloses.read(requested, date) : {};
        const regularClose = Number(url.searchParams.get("regularClose") ?? 960);
        if (![780, 960].includes(regularClose)) throw Error("invalid_symbol");
        const totals = url.searchParams.get("sessions") === "1" ? Object.fromEntries(requested.map(symbol => [symbol, scannerSessionTotals(symbol, date, regularClose)])) : undefined;
        response.setHeader("Content-Type", "application/json");
        reply({ feed: "sip", connected: authenticated, snapshots: Object.fromEntries(requested.map(symbol => [symbol, quotes.has(symbol) ? { ...quotes.get(symbol), tradingStatus:statusesSubscribed?tradingStatuses.read(symbol):null, adjustedPreviousClose: splitReference.read(adjustedCloses[symbol] ?? null, tradingStatuses.read(symbol)) } : null])), sessionTotals: totals }); return;
      }
      const symbol = chartSymbol(url.searchParams.get("symbol") ?? "");
      if (url.pathname === "/overnight") {
        const payload = await rest.get("/v2/stocks/trades/latest", new URLSearchParams({ symbols: symbol, feed: "boats" })) as { trades?: Record<string, unknown> };
        response.setHeader("Content-Type", "application/json"); reply({ feed: "boats", symbol, trade: payload.trades?.[symbol] ?? null });
      } else if (url.pathname === "/bars") {
        const daily = url.searchParams.get("daily") === "1";
        const bars = await history(symbol, daily);
        response.setHeader("Content-Type", "application/json");
        reply({ symbol, feed: "sip", baseTimeframe: daily ? "1D" : "1m", adjustment: "split", basisDate: easternClock(Date.now()).date, bars,...(!daily?{calendar:await chartCalendar.forBars(bars)}:{}) });
      } else if (url.pathname === "/stream") {
        const chartSymbols = new Set([...clients].map(client => client.symbol));
        if (clients.size >= 16 || (!chartSymbols.has(symbol) && chartSymbols.size >= 8)) throw Error("busy");
        response.writeHead(200, { "Content-Type": "text/event-stream", "X-Accel-Buffering": "no" });
        response.write("retry: 3000\n\n");
        const daily=url.searchParams.get("daily")==="1",bookKey=`${symbol}|${daily}`;
        const client = { symbol, daily, response, wire:operation!==null }; clients.add(client);
        const detachOvernight = !daily && url.searchParams.get("overnight") === "1" ? overnightFeed?.add(symbol, {
          status: state => send(client, "overnight-status", { state }),
          price: price => send(client, "overnight-price", price),
          bar: (bar, provisional) => send(client, "overnight-bar", { bar, daily: false, provisional }),
        }) : undefined;
        if(!chartBooks.has(bookKey))chartBooks.set(bookKey,new ChartLiveBook(symbol,rest,daily));
        for(const bar of chartBooks.get(bookKey)!.snapshot())send(client,"bar",{bar,daily,provisional:true});
        for (const revision of corrections.values(symbol)) send(client, "chart-correction", parseChartCorrection(revision));
        send(client, "status", { state: authenticated ? "connected" : "connecting" });
        sendTradingStatus(client);
        subscribe(); connect();
        const heartbeat = setInterval(() => response.write(": heartbeat\n\n"), 15_000);
        response.on("close", () => {
          clearInterval(heartbeat); detachOvernight?.(); clients.delete(client);
          if(![...clients].some(item=>item.symbol===symbol&&item.daily===daily)){chartBooks.get(bookKey)?.invalidate();chartBooks.delete(bookKey);}
          if (!needsSocket()) { clearTimeout(retry); const old = socket; socket = null; authenticated = false; old?.close(); }
          else if (!symbols().includes(symbol) && authenticated && socket?.readyState === WebSocket.OPEN) unsubscribeForeground([symbol]);
        });
      } else { response.writeHead(404); response.end(); }
    } catch (error) {
      if (response.headersSent) { response.destroy(); return; }
      const code = error instanceof Error ? error.message : "provider_unavailable";
      const status = ["invalid_symbol", "invalid_history_request", "invalid_scanner_signal_bars", "invalid_archive_query", "invalid_trade_revision_request"].includes(code) ? 400 : code === "busy" ? 429 : 502;
      response.writeHead(status, { "Content-Type": "application/json" });
      response.end(JSON.stringify({ error: status === 400 ? operation?"invalid_request":"invalid_symbol" : status === 429 ? "busy" : operation?"market_unavailable":"provider_unavailable" }));
    }
  });
  server.on("listening",()=>{if(needsSocket())connect();});
  return { server, close() { stopped = true; corrections.close(); archive?.close(); clearInterval(levelsMonitorTimer); levelsMonitor?.stop(); overnightFeed?.close(); clearTimeout(statusAttemptTimer);statusJournal?.close(); clearInterval(priceTimer); scannerHub.close();priceHub.close(); clearInterval(leaseTimer); clearTimeout(retry); sessionBook.invalidate(); for (const symbol of leases.keys()) sessionBook.remove(symbol); socket?.close(); for (const client of clients) client.response.end(); server.close(); } };
}

export async function readPrivateJson(path: string): Promise<Record<string, string>> {
  const info = await stat(path);
  if ((info.mode & 0o077) !== 0 || !info.isFile()) throw Error("Private configuration permissions invalid");
  return JSON.parse(await readFile(path, "utf8"));
}
