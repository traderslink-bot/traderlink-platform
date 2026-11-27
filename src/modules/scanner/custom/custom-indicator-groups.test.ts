import { describe, expect, it, vi } from "vitest";
import { parseScannerSignalBars, readScannerSignalBars, scanVwapStart, type ScannerSignalBar, type ScannerSignalBars } from "../alpaca/scanner-signal-bars";
import { readCustomAverage, readCustomVwap } from "./custom-indicator-facts";
import { EMPTY_SCAN, parseSavedScanBook, parseScanDefinition, type ScanMarketRow } from "./definition";
import { CustomScanMarket } from "./market";
import { SharedScanEnrichment } from "./shared-scan-enrichment";

const minute=60_000;
const now=Date.parse("2026-11-16T17:10:07Z");
const bar=(at:number,price:number,vwap?:number,volume=100):ScannerSignalBar=>({
  time:at/1000,open:price,high:price,low:price,close:price,volume,vwap,
});
const packed=(bars:ScannerSignalBar[])=>new Float64Array(bars.flatMap(item=>
  [item.time,item.open,item.high,item.low,item.close,item.volume,item.vwap??NaN]));
const numeric=(metric:string,minimum:number|null,maximum:number|null)=>({metric,minimum,maximum});
const ema={metric:"customEma",frame:"5m",minimum:null,maximum:15,comparison:"crossUp",indicator:{kind:"ema",fast:8,slow:34}};
const vwap={metric:"customVwap",frame:"1m",minimum:null,maximum:25,comparison:"crossUp",indicator:{kind:"vwap"}};
const rsi={metric:"customRsi",frame:"15m",minimum:null,maximum:null,comparison:"above",indicator:{kind:"rsi",period:10,level:58.5}};
const press={id:"publication",title:"Press release",url:"https://example.com/company",at:now-10*minute};
function query(rules:unknown[],groups?:unknown[],match?:string){
  return {key:"test",page:1,definition:parseScanDefinition({rules,groups,match,sort:EMPTY_SCAN.sort})};
}
function row(symbol:string,price:number):ScanMarketRow {
  return {symbol,exchange:"NASDAQ",price,volume:null,dollarVolume:null,float:null,marketCap:null,dayChange:price-3,
    belowHigh:null,observedAt:now};
}
it("matches configurable SMA state and crossover using completed candles", () => {
  const candles = [5, 3, 1, 6].map((price, index) => bar(now + index * minute, price));
  const sma = { kind: "sma" as const, fast: 2, slow: 3 };
  expect(readCustomAverage(packed(candles.slice(0, 2)), 7, minute, sma)).toBeUndefined();
  const fact = readCustomAverage(packed(candles), 7, minute, sma);
  expect(fact?.value).toBeCloseTo(5);
  expect(fact?.crossUp).toBe(now + 4 * minute);
  expect(query([{ metric: "customSma", indicator: sma, comparison: "above", minimum: null, maximum: null }])
    .definition.rules[0].indicator).toEqual(sma);
});

it("qualifies a configurable close-to-SMA crossover without changing the legacy comparison", () => {
  const candles = [5, 3, 1, 6].map((price, index) => bar(now + index * minute, price));
  const indicator = { kind: "priceSma" as const, period: 3 };
  expect(readCustomAverage(packed(candles.slice(0, 3)), 7, minute, indicator)?.readyToCross).toBe(false);
  expect(readCustomAverage(packed(candles), 7, minute, indicator))
    .toMatchObject({comparison:6 - 10/3,crossUp:now + 4 * minute});
  const rule = {metric:"customSma",indicator,comparison:"crossUp",minimum:null,maximum:5,frame:"5m"};
  expect(query([rule]).definition.rules[0]).toEqual(rule);
  expect(() => query([{...rule,metric:"customEma"}])).toThrow("invalid_custom_indicator");
});

describe("configurable scanner indicator rules",()=>{
  it("round trips all three rule types and groups without changing legacy saved definitions",()=>{
    const schema=query([ema],[{match:"any",rules:[rsi,vwap]}],"any").definition;
    const scans=[
      {id:"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",name:"Groups",definition:schema},
      {id:"bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",name:"Legacy",definition:EMPTY_SCAN},
    ];
    expect(parseSavedScanBook(JSON.parse(JSON.stringify({revision:1,scans})))) .toEqual({revision:1,scans});
    expect(()=>query([{...ema,indicator:{...ema.indicator,fast:34}}])).toThrow("invalid_custom_indicator");
    expect(()=>query([{...ema,maximum:1.5}])).toThrow("invalid_custom_indicator_window");
    expect(()=>query([{...rsi,indicator:{...rsi.indicator,level:101}}])).toThrow("invalid_custom_indicator");
    expect(()=>query([],[{match:"any",rules:[]}])).toThrow("invalid_scan_groups");
  });

  it("finds configurable EMA and Wilder RSI state and crossover time, with no crossover during warmup",()=>{
    const sequence=[9,8,7,6,5,4,18,20,24,27].map((price,i)=>bar(now+i*minute,price));
    const fast={kind:"ema",fast:2,slow:5} as const;
    const level={kind:"rsi",period:3,level:65} as const;
    const emaFact=readCustomAverage(packed(sequence),7,minute,fast)!;
    const rsiFact=readCustomAverage(packed(sequence),7,minute,level)!;
    expect(emaFact.crossUp).toBe(now+7*minute);
    expect(rsiFact.crossUp).toBe(now+7*minute);
    expect(rsiFact.value).toBeGreaterThan(65);
    expect(readCustomAverage(packed(sequence.slice(0,5)),7,minute,fast)?.readyToCross).toBe(false);
    expect(readCustomAverage(packed(sequence.slice(0,3)),7,minute,level)).toBeUndefined();
    const flat=Array.from({length:8},(_,i)=>bar(now+i*minute,9));
    expect(readCustomAverage(packed(flat),7,minute,level)?.value).toBe(50);
  });

  it("uses the full session's traded volume, skips the forming candle, and never crosses the prior day's VWAP",()=>{
    const start=scanVwapStart(now);
    const history=[
      bar(start-10*minute,10,30),bar(start,9,10,200),bar(start+minute,13,12,100),
      bar(start+3*minute,8,9,100),bar(start+4*minute,20,50,500),
    ];
    const current=readCustomVwap(history,minute,start,start+4*minute);
    expect(current?.value).toBe(10.25);
    expect(current?.crossUp).toBe(start+2*minute);
    expect(current?.crossDown).toBe(start+4*minute);
    expect(readCustomVwap([bar(start,9,8)],minute,start,start+minute)?.readyToCross).toBe(false);
    expect(readCustomVwap([bar(start,9)],minute,start,start+minute)).toBeUndefined();
  });

  it("keeps the VWAP session through pagination when it exceeds the normal 250 bars",async()=>{
    const start=scanVwapStart(now),end=start+510*minute;
    const input=parseScannerSignalBars(new URLSearchParams({symbols:"XYZ",frame:"1m",start:String(start-60*minute),
      end:String(end),sessionVwap:"1",historyBars:"450"}),end);
    const provider=Array.from({length:511},(_,i)=>({
      t:new Date(start+(509-i)*minute).toISOString(),o:10,h:10,l:10,c:10,v:100,vw:10.001,
    }));
    const loaded=await readScannerSignalBars({get:async(_,parameters)=>parameters.has("page_token")
      ?{bars:{XYZ:provider.slice(300)}}:{bars:{XYZ:provider.slice(0,300)},next_page_token:"second"}},input);
    expect(loaded).toMatchObject({sessionVwap:true,historyBars:450});
    expect(loaded.bars.XYZ).toHaveLength(510);
    expect(loaded.bars.XYZ[0]).toMatchObject({time:start/1000,vwap:10.001});
  });

  it("shares the full two-window input for a 200-period intraday study",async()=>{
    const clock=vi.spyOn(Date,"now").mockReturnValue(now);
    try{
      const requests:ScannerSignalBars[]=[];
      const shared=new SharedScanEnrichment({bars:async request=>{
        requests.push(request);
        return {feed:"sip",adjustment:"split",basisDate:"2026-11-16",end:request.end,frame:request.frame,
          historyBars:request.historyBars,bars:{XYZ:Array.from({length:400},(_,i)=>bar(request.end-(400-i)*minute,1+i/1000))}};
      }});
      const definition=query([{metric:"bandCompression",studyFrame:"1m",period:200,minimum:0,maximum:null}]);
      const detachOne=shared.attach([definition]), detachTwo=shared.attach([definition]);
      shared.observe(["XYZ"],now);
      await vi.waitFor(()=>expect(shared.candleStudy("XYZ",now,"1m","bandCompression",200)).toBeTypeOf("number"));
      expect(requests.map(r=>r.historyBars)).toEqual([400]);
      detachOne();detachTwo();
    }finally{clock.mockRestore();}
  });

  it("backfills VWAP from session open on a warm frame and shares the request",async()=>{
    const clock=vi.spyOn(Date,"now").mockReturnValue(now);
    const requests:{start:number;sessionVwap?:true}[]=[];
    try{
      const sessionStart=scanVwapStart(now);
      const regular=query([rsi]);
      const vwQuery=query([{...vwap,frame:"15m"}]);
      const shared=new SharedScanEnrichment({bars:async request=>{
        requests.push(request);
        const {end,frame,sessionVwap}=request;
        return {feed:"sip",adjustment:"split",basisDate:"2026-11-16",end,frame,sessionVwap,
          bars:{XYZ:[bar(sessionStart,9,10),bar(end-15*minute,11,10)]}};
      }});
      const first=shared.attach([regular]);
      shared.observe(["XYZ"],now);
      await vi.waitFor(()=>expect(shared.indicator("XYZ","15m",now)).toBeDefined());
      const second=shared.attach([vwQuery]),third=shared.attach([vwQuery]);
      clock.mockReturnValue(now+7_000);
      shared.observe(["XYZ"],now+7_000);
      await vi.waitFor(()=>expect(shared.customIndicator("XYZ","15m",now+7_000,{kind:"vwap"},"vwap",250)?.value).toBe(10));
      expect(requests).toHaveLength(2);
      expect(requests[1]).toMatchObject({start:sessionStart,sessionVwap:true});
      first();second();third();
    }finally{clock.mockRestore();}
  });
});

describe("Scanner study request scope", () => {
  const tickers = (...selection: string[]) => ({ metric: "tickerList", selection });
  const fakeStudy = (read: (request: ScannerSignalBars) => void) => new SharedScanEnrichment({
    bars: async request => {
      read(request);
      const { frame, end, symbols } = request;
      return { frame, end, feed: "sip", adjustment: "split", basisDate: "2026-11-16",
        bars: Object.fromEntries(symbols.map(symbol => [symbol, [bar(end - Number.parseInt(frame, 10) * minute, 2)]])) };
    },
  });

  it("loads only the union of mandatory ticker lists for a study, and keeps the base RVOL roster", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    const read = vi.fn<(request: ScannerSignalBars) => void>();
    const enrichment = fakeStudy(read);
    const roster = ["AAA", "BBB", "CCC", ...Array.from({ length: 1_412 }, (_, index) => `T${index}`)];
    const detach = enrichment.attach([query([tickers("AAA", "BBB", "NOTINROSTER"), ema])]);
    const detachOverlap = enrichment.attach([query([tickers("BBB", "CCC")], [{ match: "any", rules: [ema, numeric("price", 1, null)] }])]);
    const detachVolume = enrichment.attach([query([numeric("sameTimeRegularVolume", 0, null)])]);
    try {
      enrichment.observe(roster, now);
      await vi.waitFor(() => {
        const requested = read.mock.calls.map(([request]) => request);
        expect(requested.filter(request => request.frame === "5m").flatMap(request => request.symbols)).toEqual(["AAA", "BBB", "CCC"]);
        expect(requested.filter(request => request.frame === "15m").flatMap(request => request.symbols)).toEqual(roster);
      });
    } finally {
      detachVolume();
      detachOverlap();
      detach();
      clock.mockRestore();
    }
  });

  it.each([
    ["an Any rule can include an unlisted ticker", query([tickers("AAA"), ema], undefined, "any")],
    ["the study contributes to coverage before a later ticker rule", query([ema, tickers("AAA")])],
  ])("keeps roster-wide data when %s", async (_reason, definition) => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    const read = vi.fn<(request: ScannerSignalBars) => void>();
    const enrichment = fakeStudy(read);
    const detach = enrichment.attach([definition]);
    try {
      enrichment.observe(["AAA", "BBB"], now);
      await vi.waitFor(() => expect(read).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ symbols: ["AAA", "BBB"] })));
    } finally {
      detach();
      clock.mockRestore();
    }
  });

  it("fills newly requested tickers in the same completed period and reuses the earlier history when widening to the full roster", async () => {
    const clock = vi.spyOn(Date, "now").mockReturnValue(now);
    const read = vi.fn<(request: ScannerSignalBars) => void>();
    const enrichment = fakeStudy(read);
    const roster = ["AAA", "BBB", "CCC"];
    const through = Math.floor((now - 6_000) / (5 * minute)) * 5 * minute;
    const first = enrichment.attach([query([tickers("AAA"), ema])]);
    try {
      enrichment.observe(roster, now);
      await vi.waitFor(() => expect(enrichment.indicator("AAA", "5m", now)).toBeDefined());
      const second = enrichment.attach([query([tickers("BBB"), ema])]);
      clock.mockReturnValue(now + 6_000);
      await vi.waitFor(() => {
        enrichment.observe(roster, now + 6_000);
        expect(enrichment.indicator("BBB", "5m", now + 6_000)).toBeDefined();
      });
      const broad = enrichment.attach([query([ema])]);
      clock.mockReturnValue(now + 12_000);
      await vi.waitFor(() => {
        enrichment.observe(roster, now + 12_000);
        expect(enrichment.indicator("CCC", "5m", now + 12_000)).toBeDefined();
      });
      expect(read.mock.calls.map(([request]) => [request.symbols, request.end])).toEqual([
        [["AAA"], through], [["BBB"], through], [["CCC"], through],
      ]);
      broad();
      second();
    } finally {
      first();
      clock.mockRestore();
    }
  });
});

it("counts covered quiet intervals and clears a canceled volume bar on overlap", async () => {
  const at = Date.parse("2026-11-16T15:00:07Z");
  const open = Date.parse("2026-11-16T14:30:00Z");
  const clock = vi.spyOn(Date, "now").mockReturnValue(at);
  const prior = ["2026-11-11", "2026-11-12", "2026-11-13"].map(date =>
    bar(Date.parse(date + "T14:30:00Z"), 1, undefined, 100));
  let round = 0;
  const enrichment = new SharedScanEnrichment({ bars: async request => {
    const { frame, end } = request;
    const bars = ++round === 1 ? [...prior, bar(open, 1, undefined, 100), bar(open + 15 * minute, 1, undefined, 50)]
      : [bar(open, 1, undefined, 100)];
    return {
      frame, end, feed: "sip", adjustment: "split", basisDate: "2026-11-16",
      bars: { COVERED: bars, UNVERIFIED: bars },
      coverage: { COVERED: { status: "complete", completedThroughMs: end } },
    };
  } });
  const detach = enrichment.attach([query([numeric("sameTimeRegularVolume", 0, null)])]);
  try {
    enrichment.observe(["COVERED", "UNVERIFIED"], at);
    await vi.waitFor(() => expect(enrichment.sameTimeVolumeRatio("COVERED", at)).toBe(1.5));
    expect(enrichment.sameTimeVolumeRatio("UNVERIFIED", at)).toBeNull();
    const next = at + 15 * minute;
    clock.mockReturnValue(next);
    enrichment.observe(["COVERED", "UNVERIFIED"], next);
    await vi.waitFor(() => expect(enrichment.sameTimeVolumeRatio("COVERED", next)).toBe(1));
    expect(enrichment.sameTimeVolumeRatio("UNVERIFIED", next)).toBeNull();
  } finally {
    detach();
    clock.mockRestore();
  }
});

describe("All and Any scanner groups",()=>{
  const before=now-12*minute;
  function testMarket(){
    const market=new CustomScanMarket({attach:()=>()=>{},observe:()=>{},pressRelease:symbol=>symbol==="B"?null:press,
      indicator:()=>undefined,customIndicator:(symbol,frame,_,config)=>{
        if(symbol==="MISSING")return undefined;
        if(frame==="5m"&&config.kind==="ema"&&symbol==="A")return {value:1,comparison:1,readyToCross:true,crossUp:before};
        if(config.kind==="rsi"&&symbol==="D")return {value:63.5,comparison:5,readyToCross:true};
        return {value:10,comparison:-1,readyToCross:true};
      }});
    market.set("open",now,"regular",[row("A",10),row("B",4),row("D",2),row("MISSING",1)]);
    return market;
  }
  it("requires the top-level release and any matching grouped rule, keeping result columns aligned",()=>{
    const result=testMarket().query(query([numeric("pressRelease",null,24)],[{match:"any",rules:[ema,rsi]}]));
    expect(result).toMatchObject({total:2,incomplete:1,rows:[
      {symbol:"A",pressRelease:press,matches:[press.at,before,null]},
      {symbol:"D",pressRelease:press,matches:[press.at,null,63.5]},
    ]});
  });
  it("includes a known Any match despite missing data and rejects a failed All despite a missing condition",()=>{
    const market=testMarket();
    expect(market.query(query([numeric("price",null,2)],[{match:"all",rules:[ema,rsi]}],"any")))
      .toMatchObject({total:2,incomplete:0,rows:[{symbol:"D",matches:[2,null,null]},{symbol:"MISSING",matches:[1,null,null]}]});
    expect(market.query(query([vwap,numeric("price",3,null)]))).toMatchObject({total:0,incomplete:0});
    expect(market.query(query([{...ema,maximum:11}]))).toMatchObject({total:0,incomplete:1});
  });
});

it("uses the active session's volume threshold and preserves unknown volume in that branch", () => {
  const gate = (session: string, metric: string, minimum: number) => ({
    match: "all", rules: [
      {metric: "tradingSession", minimum: null, maximum: null, selection: [session]},
      numeric(metric, minimum, null),
    ],
  });
  const definition = parseScanDefinition({ ...EMPTY_SCAN, match: "any", groups: [
    gate("PREMARKET", "premarketVolume", 500_000), gate("REGULAR", "regularVolume", 1_000_000),
  ]});
  const market = new CustomScanMarket();
  for (const session of ["premarket", "regular", "after_hours"] as const) {
    const lows = session === "premarket" ? 499_999 : 999_999;
    const facts = (volume: number | null) => ({
      premarketVolume: session === "premarket" ? volume : 900_000,
      regularVolume: session === "premarket" ? null : volume,
    });
    market.set("open", now, session, [lows + 1, lows, null].map((volume, index) => ({
      ...row(["AAA", "BBB", "CCC"][index], 3), session, facts: facts(volume),
    })));
    const result = market.query({key: "main", definition, page: 1});
    expect(result.rows.map(hit => hit.symbol)).toEqual(session === "after_hours" ? [] : ["AAA"]);
    expect(result.incomplete).toBe(session === "after_hours" ? 0 : 1);
    expect(result.excluded).toBe(session === "after_hours" ? 3 : 1);
  }
});

it.each(["1m", "5m"] as const)("drops a retracted %s candle only within confirmed coverage and respects an earlier read cutoff", async frame => {
  const width = parseInt(frame, 10) * minute;
  const end = Math.floor((now - 6_000) / width) * width;
  let round = 0;
  const clock = vi.spyOn(Date, "now").mockReturnValue(now);
  const enrichment = new SharedScanEnrichment({ bars: async request => {
    const common = [bar(end - 4 * width, 4.95, 4.95, 270), bar(end - 3 * width, 5.11, 5.11, 155)];
    const latest = ++round === 1
      ? [...common, bar(end - 2 * width, 5, 5, 103), bar(end - width, 5.01, 5.01, 210)]
      : [bar(end - width, 5.01, 5.01, 210), bar(end, 5.02, 5.02, 50)];
    return { frame, end: request.end, feed: "sip", adjustment: "split", basisDate: "2026-11-16",
      bars: { CLRO: latest, CONTROL: latest },
      coverage: { CLRO: { status: "complete", completedThroughMs: request.end } } };
  } });
  const detach = enrichment.attach([query([{metric:"volumeWindowSum",studyFrame:frame,period:3,minimum:0,maximum:null}])]);
  try {
    enrichment.observe(["CLRO", "CONTROL"], now);
    const sum = (ticker: string, at: number) => enrichment.candleStudy(ticker, at, frame, "volumeWindowSum", 3);
    await vi.waitFor(() => expect(sum("CLRO", now)).toBe(468));
    expect(sum("CLRO", end - 1)).toBeNull();
    clock.mockReturnValue(now + width);
    enrichment.observe(["CLRO", "CONTROL"], now + width);
    await vi.waitFor(() => expect(sum("CLRO", now + width)).toBe(415));
    expect(sum("CONTROL", now + width)).toBe(363);
    expect(sum("CLRO", now)).toBeNull();
  } finally {
    detach();
    clock.mockRestore();
  }
});

it("includes exact percentage cutoffs on CLRO, VIVS and GMM and preserves the next tighter cutoff", () => {
  const market = new CustomScanMarket();
  const setup = (symbol: string, before: number, after: number) => {
    market.set("open", now, symbol, [row(symbol, before)]);
    market.set("open", now + minute, symbol, [{...row(symbol, after), observedAt: now + minute}]);
  };
  const scan = (threshold: number) => query([{metric:"rollingMove", minutes:1, minimum:threshold, maximum:threshold}]);
  setup("CLRO", 5, 5.01);
  expect(market.query(scan(0.20))).toMatchObject({total:1,rows:[{symbol:"CLRO", matches:[0.20]}]});
  expect(market.query(scan(0.20000001)).total).toBe(0);
  setup("VIVS", 0.152, 0.1539);
  expect(market.query(scan(1.25)).total).toBe(1);
  expect(market.query(scan(1.25000001)).total).toBe(0);
  setup("GMM", 2.60, 3.38);
  expect(market.query(scan(30)).total).toBe(1);
});

it("excludes a high-volume break below the confirmed low from an upper-bound-only rebound scan", () => {
  // CLRO, November 16. The 08:06 Eastern candle closed below the verified 08:03 low.
  const start = Date.parse("2026-11-16T13:06:00Z");
  const at = start + minute + 6_100;
  let close = 4.88;
  const market = new CustomScanMarket({attach:()=>()=>{}, observe(){}, pressRelease:()=>undefined, indicator:()=>undefined,
    lastMinute:()=>({start,close,previous:4.9,relativeVolume:2.18534,lowPivot:{at:start-2*minute,price:4.9},vwapCross:undefined})});
  const scan = query([{metric:"timedRebound",minutes:5,minimum:null,maximum:1}]);
  for (const [price, matches] of [[4.88, 0], [4.90, 0], [4.91, 1]]) {
    close = price;
    market.set("open", at, "regular", [{...row("CLRO",price), observedAt:at}]);
    expect(market.query(scan)).toMatchObject({total:matches, incomplete:0});
  }
  expect(query([{metric:"reboundFromLow",studyFrame:"1m",period:20,minimum:null,maximum:-1}])
    .definition.rules[0].maximum).toBe(-1);
});
