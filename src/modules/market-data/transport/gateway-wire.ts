/** Versioned TraderLink server-to-server vocabulary. Upstream adapters remain private. */
export const GATEWAY_WIRE_VERSION = "traderslink.market.1";
export const GATEWAY_WIRE_ROUTES = {
  health: "availability", "candle-history": "archived-candles", "scanner-listings": "instrument-rules", calendar: "trading-days",
  "vwap-seed": "weighted-reference", "scanner-signal-bars": "signal-candles", "accepted-input": "accepted-input",
  "accepted-input-candle": "accepted-input-candle", "accepted-daily-context": "accepted-daily-context",
  "accepted-regular-opportunities": "accepted-regular-opportunities", "accepted-map-monitor": "accepted-map-monitor",
  "analyzer-splits": "capital-adjustments", "chart-splits": "split-events",
  "chart-overnight-history": "extended-candles", "chart-unadjusted-history": "original-candles", history: "candle-window", quotes: "market-state",
  overnight: "extended-price", bars: "recent-candles", stream: "chart-updates",
  "scanner-stream": "scanner-updates", "trade-revisions": "trade-revisions", "trade-correction-evidence": "trade-correction-evidence", prices: "price-updates", halts: "trading-pauses",
} as const;
export type GatewayOperation = keyof typeof GATEWAY_WIRE_ROUTES;
export function gatewayWirePath(operation: GatewayOperation): string {
  return `traderslink/v1/market/${GATEWAY_WIRE_ROUTES[operation]}`;
}
export function gatewayWireOperation(pathname: string): GatewayOperation | null {
  return (Object.keys(GATEWAY_WIRE_ROUTES) as GatewayOperation[]).find(key => "/" + gatewayWirePath(key) === pathname) ?? null;
}

type Spec = "scalar" | { fields: Fields } | { each: Spec } | { values: Spec };
type Fields = Record<string, readonly [string, Spec]>;
const scalar = "scalar" as const;
const record = (fields: Fields): Spec => ({ fields });
const array = (each: Spec): Spec => ({ each });
const dictionary = (values: Spec): Spec => ({ values });
const nullable = (spec: Spec) => spec; // Null is preserved by every node, never turned into a number.
const simple = (names: Record<string, string>): Spec => record(Object.fromEntries(Object.entries(names).map(([key, name]) => [key, [name, scalar]])));
const candle = simple({time:"at",open:"first",high:"peak",low:"trough",close:"last",volume:"shares"});
const rawBar = simple({T:"recordKind",S:"ticker",t:"observed",o:"first",h:"peak",l:"trough",c:"last",v:"shares",vw:"weighted",n:"prints"});
const trade = record({T:["recordKind",scalar],S:["ticker",scalar],t:["observed",scalar],p:["value",scalar],s:["shares",scalar],i:["sequence",scalar],x:["venue",scalar],c:["conditions",array(scalar)],z:["tape",scalar]});
const quote = record({T:["recordKind",scalar],S:["ticker",scalar],t:["observed",scalar],bp:["buyValue",scalar],bs:["buyShares",scalar],bx:["buyVenue",scalar],ap:["sellValue",scalar],as:["sellShares",scalar],ax:["sellVenue",scalar],c:["conditions",array(scalar)],z:["tape",scalar]});
const pause = simple({symbol:"ticker",halted:"paused",haltedAt:"pausedSince",observedAt:"observed",statusCode:"stateCode",reasonCode:"causeCode",reason:"explanation",tape:"listingTape",quoteResumedAt:"quotesAt",tradeResumedAt:"tradesAt",pauseObservedAt:"pauseSeenAt"});
const referenceReturn=simple({from:"from",through:"through",percent:"change"});
const referenceStats=record({
  daily:["dayReturn",referenceReturn],weekly:["weekReturn",referenceReturn],
  dailyClosedAt:["dayCloseAt",scalar],weeklyClosedAt:["weekCloseAt",scalar],
  averageVolume20:["averageShares",scalar],averageDollars20:["averageTurnover",scalar],averageDailyRange20:["averageRange",scalar],
  dailyCloseVsSma20:["dayVsAverage",scalar],weeklyCloseVsSma4:["weekVsAverage",scalar],
  dailyRelativeToSpy:["dayRelative",scalar],weeklyRelativeToSpy:["weekRelative",scalar],
  recentHighs:["relativeHighs",simple({lastFiveSessions:"fiveDays",lastSevenDays:"sevenDays",previousWeek:"lastWeek"})],
});
const previous = record({symbol:["ticker",scalar],price:["value",scalar],high:["peak",scalar],low:["trough",scalar],
  barAt:["candleAt",scalar],adjustment:["basis",scalar],basisDate:["basisDay",scalar],fetchedAt:["received",scalar],statistics:["studies",referenceStats]});
const snapshot = record({latestTrade:["lastPrint",trade],latestQuote:["bestPrices",quote],dailyBar:["dayCandle",rawBar],minuteBar:["minuteCandle",rawBar],prevDailyBar:["priorDayCandle",rawBar],adjustedPreviousClose:["priorClose",previous],tradingStatus:["tradingState",pause]});
const sessionTotal = simple({open:"first",largestTradeShares:"largestShares",largestTradeDollars:"largestTurnover",volume:"shares",dollarVolume:"turnover",high:"peak",low:"trough",price:"value",providerAt:"observed"});
const sessionState = record({date:["day",scalar],regularClose:["closeMinute",scalar],complete:["finished",scalar],correctionRevision:["tradeRevision",scalar],openingRanges:["openRanges",record(Object.fromEntries([5,15,30].map(n=>[String(n),[String(n),simple({high:"peak",low:"trough"})]])))],sessions:["periods",record({premarket:["beforeOpen",sessionTotal],regular:["openMarket",sessionTotal],after_hours:["afterClose",sessionTotal]})]});
const session = simple({date:"day",open:"opens",close:"closes"});
const calendar = record({available:["usable",scalar],start:["fromDay",scalar],end:["untilDay",scalar],sessions:["days",array(session)]});
const request = simple({symbol:"ticker",timeframe:"interval",anchor:"reference",before:"until",premarket:"beforeOpen",regular:"openMarket",postmarket:"afterClose",adjustment:"basis"});
const events = record({symbol:["ticker",scalar],anchor:["reference",scalar],basisDate:["basisDay",scalar],dates:["days",array(scalar)],available:["usable",scalar]});
const chartSplit = simple({id:"event",date:"effectiveDay",oldShares:"before",newShares:"after"});
const chartSplits = record({symbol:["ticker",scalar],basisDate:["basisDay",scalar],
  coverageStart:["coverageFrom",scalar],qualifiedThrough:["coverageThrough",scalar],splits:["events",array(chartSplit)]});
const sums = simple({open:"first",high:"peak",low:"trough",close:"last",hl2:"midpoint",hlc3:"typical",ohlc4:"average",hlcc4:"weightedClose"});
const moment = simple({mean:"average",m2:"dispersion"});
const moments = record(Object.fromEntries(Object.entries({open:"first",high:"peak",low:"trough",close:"last",hl2:"midpoint",hlc3:"typical",ohlc4:"average",hlcc4:"weightedClose"}).map(([key,name])=>[key,[name,moment]])));
const acceptedInput = simple({
  id: "id", digest: "digest", upstreamRevision: "sourceRevision", instrumentId: "listingId",
  symbol: "ticker", venue: "venue", frame: "resolution", datasetId: "dataset", priceBasisId: "priceVersion",
  calendarRevision: "calendarVersion", sessionMode: "sessionMode", completedThroughMs: "completedThrough",
  acceptedCutoffMs: "cutoff", availableAtMs: "observed", acceptedAtMs: "accepted",
});
const closedReturn = simple({ previousClose:"previous", close:"close", changePercent:"change", closedAtMs:"closedAt" });
const history = record({symbol:["ticker",scalar],feed:["coverage",scalar],adjustment:["basis",scalar],basisDate:["basisDay",scalar],bars:["candles",array(candle)],baseTimeframe:["interval",scalar],complete:["finished",scalar],nextPageToken:["continuation",scalar],calendar:["tradingDays",calendar],calendars:["tradingYears",array(calendar)],chartPageStart:["windowStart",scalar],acceptedInput:["acceptedInput",acceptedInput]});
const signalCandle = simple({time:"at",open:"first",high:"peak",low:"trough",close:"last",volume:"shares",vwap:"weighted"});
const signalHistory = record({
  feed:["coverage",scalar],adjustment:["basis",scalar],frame:["interval",scalar],basisDate:["basisDay",scalar],end:["until",scalar],
  bars:["candles",dictionary(array(signalCandle))], sessionVwap:["includeWeightedSession",scalar],historyBars:["lookback",scalar],
  coverage:["perInstrument",dictionary(simple({status:"state",completedThroughMs:"through"}))],
});
const market = record({feed:["coverage",scalar],connected:["online",scalar],at:["emitted",scalar],snapshots:["instruments",dictionary(nullable(snapshot))],sessionTotals:["periodTotals",dictionary(nullable(sessionState))]});
const seed = record({events:["capitalEvents",events],complete:["finished",scalar],request:["selection",request],basisDate:["basisDay",scalar],anchorKey:["referenceDay",scalar],start:["from",scalar],volume:["shares",scalar],sums:["totals",sums],moments:["distribution",moments]});
const priceFrame = record({protocolVersion:["revision",scalar],feed:["coverage",scalar],connected:["online",scalar],kind:["change",scalar],emittedAt:["emitted",scalar],prices:["values",dictionary(simple({price:"value",providerObservedAt:"observed",receiptAt:"received"}))]});
const schemas: Record<GatewayOperation, Spec> = {
  health:simple({ready:"ready",feed:"coverage"}),
  "candle-history":record({state:["state",scalar],bars:["candles",array(candle)],start:["from",scalar],
    end:["until",scalar],basisDate:["basisDay",scalar]}),"scanner-listings":record({excluded:["excluded",array(scalar)]}),calendar,
  "accepted-input":acceptedInput, "accepted-input-candle":record({input:["receipt",acceptedInput],row:["candle",array(scalar)]}),
  "accepted-daily-context":record({input:["receipt",acceptedInput],context:["context",record({daily:["day",closedReturn],weekly:["week",closedReturn]})]}),
  "accepted-regular-opportunities":array(record({
    ...Object.fromEntries(["dailyId","regularId","previousId","triggerId","savedAfterMs","startMs","mapId","mapRevision"].map(key => [key,[key,scalar] as const])),
    calendars:["tradingDays",array(calendar)],
    verifiedEmptyStarts:["verifiedQuietStarts",array(scalar)],
  })),
  "accepted-map-monitor":simple({admitted:"admitted"}),
  "vwap-seed":seed,"scanner-signal-bars":signalHistory,"analyzer-splits":events,"chart-splits":chartSplits,"chart-overnight-history":history,"chart-unadjusted-history":history,history,quotes:market,
  overnight:record({feed:["coverage",scalar],symbol:["ticker",scalar],trade:["lastPrint",trade]}),bars:history,
  stream:record({state:["connection",scalar],adjustment:["basis",scalar],basisDate:["basisDay",scalar],price:["value",scalar],time:["observed",scalar],bar:["candle",candle],daily:["daily",scalar],provisional:["forming",scalar],minute:["minute",scalar],premarket:["premarketTradeTotals",simple({through:"through",volume:"shares",dollarVolume:"notional"})],symbol:["ticker",scalar],available:["usable",scalar],status:["tradingState",pause]}),
  "scanner-stream":market,prices:priceFrame,
  "trade-revisions":record({feed:["coverage",scalar],generation:["generation",scalar],symbols:["instruments",dictionary(record({
    minutes:["at",array(scalar)],pending:["pending",scalar],revision:["revision",scalar],
  }))]}),
  "trade-correction-evidence":record({symbol:["ticker",scalar],feed:["coverage",scalar],adjustment:["basis",scalar],generation:["generation",scalar],
    nativeDays:["nativeDays",array(record({day:["dateStart",scalar],before:["prior",candle],bar:["candle",candle]}))],
    rows:["revisions",array(record({symbol:["ticker",scalar],minute:["minute",scalar],bar:["candle",candle],before:["prior",candle],
      correctionRevision:["revision",scalar],premarket:["premarketTradeTotals",simple({through:"through",volume:"shares",dollarVolume:"notional"})],
    }))]}),
  halts:record({feed:["coverage",scalar],connected:["online",scalar],statusesSubscribed:["trackingPauses",scalar],observedSince:["trackingSince",scalar],statuses:["tradingStates",array(pause)],events:["transitions",array(pause)]}),
};

function transform(spec: Spec, value: unknown, decode: boolean, budget: {nodes:number}, depth = 0): unknown {
  if (++budget.nodes > 2_000_000 || depth > 24) throw Error("market_contract_invalid");
  if (value === null) return null;
  if (spec === scalar) {
    if (typeof value !== "string" && typeof value !== "boolean" && !(typeof value === "number" && Number.isFinite(value))) throw Error("market_contract_invalid");
    return value;
  }
  if ("each" in spec) {
    if (!Array.isArray(value)) throw Error("market_contract_invalid");
    return value.map(item=>transform(spec.each,item,decode,budget,depth+1));
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw Error("market_contract_invalid");
  const object = value as Record<string,unknown>;
  if ("values" in spec) return Object.fromEntries(Object.entries(object).map(([key,item])=>{
    if (!/^[A-Z][A-Z0-9.-]{0,15}$/.test(key)) throw Error("market_contract_invalid");
    return [key,transform(spec.values,item,decode,budget,depth+1)];
  }));
  const result: Record<string,unknown> = {};
  for (const [internal,[wire,child]] of Object.entries(spec.fields)) {
    const input=decode?wire:internal;if(!Object.hasOwn(object,input)||object[input]===undefined)continue;
    const raw=object[input];
    // These are app-owned coverage names, not reversible supplier identifiers.
    const coverage=input===(decode?"coverage":"feed")
      ? decode ? raw==="consolidated"?"sip":raw==="extended"?"boats":null
      : raw==="sip"?"consolidated":raw==="boats"?"extended":null
      : undefined;
    if(coverage===null)throw Error("market_contract_invalid");
    result[decode?internal:wire]=transform(child,coverage??raw,decode,budget,depth+1);
  }
  return result;
}
export function encodeGatewayWire(operation: GatewayOperation, value: unknown): unknown {
  return {schema:GATEWAY_WIRE_VERSION,resource:GATEWAY_WIRE_ROUTES[operation],data:transform(schemas[operation],value,false,{nodes:0})};
}
export function decodeGatewayWire(operation: GatewayOperation, value: unknown): unknown {
  if (!value || typeof value!=="object" || Array.isArray(value)) throw Error("market_contract_invalid");
  const body=value as Record<string,unknown>;
  if(body.schema!==GATEWAY_WIRE_VERSION||body.resource!==GATEWAY_WIRE_ROUTES[operation])throw Error("market_contract_invalid");
  return transform(schemas[operation],body.data,true,{nodes:0});
}

const queryNames: Record<string,string> = {purpose:"use",symbol:"ticker",symbols:"tickers",timeframe:"resolution",frame:"signalFrame",start:"from",end:"until",daily:"dayBars",dailyReplay:"dayReplay",dailyStartup:"initialDaily",overnight:"extended",sessions:"periodTotals",regularClose:"closeMinute",before:"cutoff",anchor:"reference",premarket:"beforeOpen",regular:"openMarket",postmarket:"afterClose",year:"yearNumber",adjustment:"basis",acceptedEvidence:"includeAcceptance",session:"marketSession",sessionMode:"sessionMode",sessionVwap:"includeWeightedSession",historyBars:"lookback",id:"acceptedId",dailyId:"acceptedDailyId",regularId:"acceptedRegularId",mapId:"mapId",mapRevision:"mapRevision"};
export function gatewayWireQuery(query: URLSearchParams, decode=false): URLSearchParams {
  const result=new URLSearchParams();
  for(const [from,to] of Object.entries(queryNames)){
    const key=decode?to:from;if(query.getAll(key).length>1)throw Error("market_contract_invalid");
    if(query.has(key))result.set(decode?from:to,query.get(key)!);
  }
  if([...query.keys()].some(key=>decode?!Object.values(queryNames).includes(key):!Object.hasOwn(queryNames,key)))throw Error("market_contract_invalid");
  return result;
}
export function gatewayWireUrl(base: string | URL, operation: GatewayOperation, query=new URLSearchParams()): URL {
  const value=String(base),url=new URL(gatewayWirePath(operation),value.endsWith('/')?value:value+'/');
  url.search=gatewayWireQuery(query).toString();return url;
}
export function gatewayWireSubscription(value: unknown, decode=false): Record<string,unknown> {
  if(!value||typeof value!=="object"||Array.isArray(value))throw Error("market_contract_invalid");
  const source=value as Record<string,unknown>;
  const names=decode?{tickers:"symbols",closeMinute:"regularClose"}:{symbols:"tickers",regularClose:"closeMinute"};
  return Object.fromEntries(Object.entries(names).flatMap(([from,to])=>Object.hasOwn(source,from)?[[to,source[from]]]:[]));
}
/** Incremental framing; comments/retry survive and partial JSON is never emitted. */
export class GatewayWireFrames {
  private buffer="";
  private readonly decoder=new TextDecoder();
  private readonly encoder=new TextEncoder();
  constructor(private readonly operation: GatewayOperation){}
  write(chunk: Uint8Array): Uint8Array {
    this.buffer+=this.decoder.decode(chunk,{stream:true});
    if(this.buffer.length>2_000_000)throw Error("market_contract_invalid");
    let output="",end:number;
    while((end=this.buffer.indexOf('\n\n'))>=0){
      const block=this.buffer.slice(0,end);this.buffer=this.buffer.slice(end+2);
      const lines=block.split('\n'),data=lines.filter(line=>line.startsWith('data:')).map(line=>line.slice(5).trimStart());
      if(!data.length){output+=block+'\n\n';continue;}
      const event=lines.find(line=>line.startsWith('event:'))??'event: message';
      const value=decodeGatewayWire(this.operation,JSON.parse(data.join('\n')));
      output+=`${event}\ndata: ${JSON.stringify(value)}\n\n`;
    }
    return this.encoder.encode(output);
  }
  finish():void{if(this.buffer.trim()||this.decoder.decode())throw Error("market_contract_invalid");}
}

/** Rollout gate: keep existing installations compatible until gateway-first cutover. */
export function gatewayWireEnabled(environment: Record<string,string|undefined> = process.env): boolean {
  return environment.TRADERLINK_GATEWAY_CONTRACT === GATEWAY_WIRE_VERSION;
}
