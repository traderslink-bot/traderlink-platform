import { setImmediate as yieldTurn, setTimeout as wait } from "node:timers/promises";
import type { CustomIndicator, IndicatorMatch } from "./custom-indicator";
import { readCustomAverage,readCustomVwap } from "./custom-indicator-facts";
import { SCANNER_SIGNAL_BATCH_SIZE,SCANNER_SIGNAL_CONCURRENCY,MAX_SIGNAL_BARS,SIGNAL_BOOTSTRAP_DAYS,scanVwapStart,type ScannerSignalBar,type ScannerSignalBars,type ScannerSignalBarsResult } from "../alpaca/scanner-signal-bars";
import { easternClock } from "../live/sessions";
import { scanCandleCalendar, scanIndicatorFacts } from "./indicator-facts";
import { scanRules,type ScanMarketRow,type ScanQuery } from "./definition";
import type { ScanEnrichment } from "./scan-enrichment";
import { customHistorySize,isCustomIndicatorMetric,isIndicatorCross } from "./custom-indicator";
import { closedStructureSignals } from "./closed-structure-signals";
import { sameTimeSessionVolumeRatio } from "./same-time-relative-volume";
import type { ScannerSession } from "../live/contracts";
import { isScanIndicatorMetric, type ScanIndicatorFacts,type ScanPressRelease,type ScanSignalFrame,type StructureScanSignal } from "./signal-filters";

type Entry = {
  bars:Float64Array; facts?:ScanIndicatorFacts; through:number; basis:string;
  volumeCoveredFrom?: number;
  custom?:Map<string,IndicatorMatch|null>; structure?:ReturnType<typeof closedStructureSignals> | null;
  sameTimeVolume?: { through: number; ratios: Map<ScannerSession, number | null> };
  depth:number; covered?:boolean; vwap?:IndicatorMatch;
};
type Loaders = {
  releases?: (symbols:readonly string[],now:number)=>Promise<ReadonlyMap<string,ScanPressRelease>>|ReadonlyMap<string,ScanPressRelease>;
  bars?: (request:ScannerSignalBars)=>Promise<ScannerSignalBarsResult>;
};
type HistoryBatch = { start:number; symbols:string[] };
type FrameDemand = { all: number; tickers: Map<string, number>; version: number };
type HistoryPlan = {
  frame:ScanSignalFrame;
  demandVersion:number;
  through:number;
  width:number;
  depth:number;
  sessionStart:number;
  vwap:boolean;
  entries:Map<string,Entry>;
  calendar:ReturnType<typeof scanCandleCalendar>;
  batches:HistoryBatch[];
  next:number;
  failed:boolean;
};
const FIRST_BATCH_SIZE=8;
const BAR_FIELDS=7;
function packBars(bars:readonly ScannerSignalBar[]){
  const packed=new Float64Array(bars.length*BAR_FIELDS);
  bars.forEach((bar,i)=>{
    const offset=i*BAR_FIELDS;
    packed[offset]=bar.time;
    packed[offset+1]=bar.open;
    packed[offset+2]=bar.high;
    packed[offset+3]=bar.low;
    packed[offset+4]=bar.close;
    packed[offset+5]=bar.volume;
    packed[offset+6]=bar.vwap??NaN;
  });
  return packed;
}
function unpackBars(bars:Float64Array){
  const candles:ScannerSignalBar[]=[];
  for(let i=0;i<bars.length;i+=BAR_FIELDS) candles.push({
    time:bars[i],open:bars[i+1],high:bars[i+2],low:bars[i+3],close:bars[i+4],volume:bars[i+5],vwap:Number.isNaN(bars[i+6])?undefined:bars[i+6],
  });
  return candles;
}
const mergeBars=(prior:readonly ScannerSignalBar[], incoming:readonly ScannerSignalBar[], keepSince:number,depth:number,
  replaced?: { from: number; through: number })=>{
  const merged = new Map<number, ScannerSignalBar>();
  for (const bar of prior) {
    const at = bar.time * 1000;
    if (!replaced || at < replaced.from || at >= replaced.through) merged.set(bar.time, bar);
  }
  for(const bar of incoming)merged.set(bar.time,bar);
  const ordered = [...merged.values()].sort((a,b)=>a.time-b.time);
  const bars = ordered.filter((bar,index)=>index>=ordered.length-depth||bar.time*1000>=keepSince);
  return { bars, trimmed: bars.length < ordered.length };
};
function hasChanges(prior:readonly ScannerSignalBar[],incoming:readonly ScannerSignalBar[]){
  return prior.length!==incoming.length || prior.some((bar,i)=>{
    const next=incoming[i];
    return bar.time!==next.time||bar.open!==next.open||bar.high!==next.high||bar.low!==next.low||
      bar.close!==next.close||bar.volume!==next.volume||bar.vwap!==next.vwap;
  });
}

export class SharedScanEnrichment implements ScanEnrichment {
  private readonly vwapRequests=new Map<ScanSignalFrame,number>();
  private readonly capacityRequests=new Map<ScanSignalFrame,Map<number,number>>();
  private readonly lastCapacity=new Map<ScanSignalFrame,number>();
  private readonly lastVwapEnd=new Map<ScanSignalFrame,number>();
  private readonly requests = new Map<ScanSignalFrame, FrameDemand>();
  private demandVersion = 0;
  private readonly frames=new Map<ScanSignalFrame, Map<string,Entry>>();
  private readonly lastUse=new Map<ScanSignalFrame,number>();
  private readonly calendar=new Map<ScanSignalFrame,ReturnType<typeof scanCandleCalendar>>();
  private readonly nextFrameAttempt=new Map<ScanSignalFrame,number>();
  private readonly lastFrameEnd=new Map<ScanSignalFrame,number>();
  private readonly lastFrameDemand = new Map<ScanSignalFrame, number>();
  private releaseReaders=0;
  private releaseReading=false;
  private releaseAt=0;
  private releaseRetryAt=0;
  private reports:ReadonlyMap<string,ScanPressRelease>=new Map();
  private releaseCovered:ReadonlySet<string>=new Set();
  private barReading=false;
  private notifyHistory:()=>void=()=>{};
  private nextPruneAt=0;
  private date="";
  private sessionGeneration=0;
  readonly counts={barBatches:0,barFailures:0,releaseReads:0,releaseFailures:0};

  constructor(private readonly loaders:Loaders){}

  onHistoryUpdate(notify:()=>void){this.notifyHistory=notify;}

  attach(queries:readonly ScanQuery[]){
    const frameTargets = new Map<ScanSignalFrame, Set<string> | null>();
    const vwapFrames=new Set<ScanSignalFrame>();
    const capacities=new Map<ScanSignalFrame,number>();
    let release=false;
    for (const { definition } of queries) {
      // Only the first mandatory rule excludes other tickers before study readings affect coverage.
      const first = definition.rules[0];
      const tickers = definition.match !== "any" && first?.metric === "tickerList" && first.selection?.length
        ? first.selection : undefined;
      const frames = new Set<ScanSignalFrame>();
      for (const criterion of [...scanRules(definition), definition.sort]) {
        if (criterion.metric === "pressRelease") release = true;
        const frame=criterion.frame??"5m";
        if (isScanIndicatorMetric(criterion.metric) || isCustomIndicatorMetric(criterion.metric)) frames.add(frame);
        if (criterion.metric === "customVwap") vwapFrames.add(frame);
        if ("indicator" in criterion && criterion.indicator && criterion.indicator.kind !== "vwap" && criterion.comparison) {
          const { indicator } = criterion;
          const window = isIndicatorCross(criterion.comparison) ? criterion.maximum ?? 0 : 0;
          capacities.set(frame, Math.max(capacities.get(frame) ?? 0, customHistorySize(indicator, parseInt(frame, 10), window)));
        }
      }
      for (const frame of frames) {
        if (!tickers) frameTargets.set(frame, null);
        else if (frameTargets.get(frame) !== null) {
          const selected = frameTargets.get(frame) ?? new Set<string>();
          tickers.forEach(ticker => selected.add(ticker));
          frameTargets.set(frame, selected);
        }
      }
    }
    if(release)this.releaseReaders++;
    for (const [frame, tickers] of frameTargets) this.changeFrameDemand(frame, tickers, 1);
    for(const frame of vwapFrames)this.vwapRequests.set(frame,(this.vwapRequests.get(frame)??0)+1);
    for(const [frame,bars] of capacities){
      const usage=this.capacityRequests.get(frame)??new Map<number,number>();
      usage.set(bars,(usage.get(bars)??0)+1);
      this.capacityRequests.set(frame,usage);
    }
    let detached=false;
    return ()=>{
      if(detached)return;
      detached=true;
      if(release)this.releaseReaders--;
      for(const [frame,bars] of capacities){
        const usage=this.capacityRequests.get(frame);
        if(!usage)continue;
        const remaining=(usage.get(bars)??1)-1;
        if(remaining)usage.set(bars,remaining);else usage.delete(bars);
        if(!usage.size)this.capacityRequests.delete(frame);
      }
      for (const [frame, tickers] of frameTargets) this.changeFrameDemand(frame, tickers, -1);
      for (const frame of vwapFrames) {
        const remaining = (this.vwapRequests.get(frame) ?? 1) - 1;
        if (remaining) this.vwapRequests.set(frame, remaining);
        else this.vwapRequests.delete(frame);
      }
    };
  }

  private changeFrameDemand(frame: ScanSignalFrame, tickers: Set<string> | null, change: 1 | -1) {
    const prior = this.requests.get(frame);
    const demand = prior ?? { all: 0, tickers: new Map<string, number>(), version: 0 };
    const wasBroad = demand.all > 0;
    let changed = false;
    if (!tickers) demand.all += change;
    else for (const ticker of tickers) {
      const previous = demand.tickers.get(ticker) ?? 0;
      const remaining = previous + change;
      if (remaining) demand.tickers.set(ticker, remaining);
      else demand.tickers.delete(ticker);
      if (!previous || !remaining) changed = true;
    }
    const broad = demand.all > 0;
    if (!prior || broad !== wasBroad || (!broad && changed)) demand.version = ++this.demandVersion;
    if (broad || demand.tickers.size) this.requests.set(frame, demand);
    else this.requests.delete(frame);
  }

  observe(symbols:Iterable<string>, now:number, activity?:Iterable<ScanMarketRow>){
    if(!this.releaseReaders&&!this.requests.size&&!this.frames.size)return;
    if(now>=this.nextPruneAt){
      this.nextPruneAt=now+60_000;
      for(const [frame,at] of this.lastUse) {
        if(!this.requests.has(frame)&&now-at>5*60_000){
          this.frames.delete(frame);this.calendar.delete(frame);this.lastFrameEnd.delete(frame);
          this.lastFrameDemand.delete(frame);
          this.lastUse.delete(frame);this.nextFrameAttempt.delete(frame);this.lastVwapEnd.delete(frame);this.lastCapacity.delete(frame);
        }
      }
    }
    if(!this.releaseReaders&&!this.requests.size)return;
    const date=easternClock(now).date;
    this.date=date;
    const stockList = [...symbols];
    let eligible: Set<string> | undefined;
    const eligibleSymbols = () => eligible ??= new Set(stockList);
    const wantsReleases=this.releaseReaders&&this.loaders.releases&&!this.releaseReading&&now>=this.releaseRetryAt;
    const pending=this.barReading||!this.loaders.bars?[]:[...this.requests].flatMap(([frame, demand])=>{
      if (now < (this.nextFrameAttempt.get(frame) ?? 0)) return [];
      const width=parseInt(frame,10)*60_000;
      // Leave a few seconds for the provider's completed aggregate to settle.
      const through=Math.floor((now-6_000)/width)*width;
      const vwap=this.vwapRequests.has(frame);
      const depth=Math.max(MAX_SIGNAL_BARS,...(this.capacityRequests.get(frame)?.keys()??[]));
      const entries = this.frames.get(frame);
      const targets = demand.all ? stockList : [...demand.tickers.keys()].filter(symbol => eligibleSymbols().has(symbol));
      const hasUnloaded = (frame === "15m" || !demand.all) && targets.some(symbol => entries?.get(symbol)?.basis !== date);
      if (!targets.length || (!hasUnloaded && this.lastFrameDemand.get(frame) === demand.version &&
        this.lastFrameEnd.get(frame) === through && (!vwap || this.lastVwapEnd.get(frame) === through) &&
        (this.lastCapacity.get(frame) ?? 0) >= depth)) return [];
      return [{frame,width,through,vwap,depth,targets,demandVersion:demand.version}];
    });
    if(!pending.length&&!wantsReleases)return;
    if(!stockList.length)return;
    const releaseRead=wantsReleases?this.refreshReleases(stockList,now):undefined;
    if(!pending.length)return;

    this.barReading=true;
    const generation=this.sessionGeneration;
    const bootstrap=async()=>{
      const cold=pending.some(({frame})=>!this.frames.get(frame)?.size);
      if(cold&&releaseRead)await Promise.race([releaseRead,wait(40)]);
      if(this.date!==date||this.sessionGeneration!==generation)return;
      let ordered=stockList;
      if(cold&&activity){
        const liquid=[...activity].sort((a,b)=>{
          const aRecent=now-a.observedAt<=60_000,bRecent=now-b.observedAt<=60_000;
          return Number(bRecent)-Number(aRecent)||(b.dollarVolume??0)-(a.dollarVolume??0);
        }).slice(0,FIRST_BATCH_SIZE).map(row=>row.symbol);
        const headlines=[...this.reports].filter(([,report])=>report.at<=now&&now-report.at<=86_400_000)
          .sort((a,b)=>b[1].at-a[1].at).slice(0,FIRST_BATCH_SIZE/2).map(([symbol])=>symbol);
        const allowed=new Set(stockList);
        const prioritized=[...headlines,...liquid].filter(symbol=>allowed.delete(symbol));
        ordered=[...prioritized,...allowed];
      }
      const plans=pending.map(({frame,width,through,vwap,depth,targets,demandVersion})=>{
        this.lastUse.set(frame,now);
        return this.planHistory(frame, targets === stockList ? ordered : targets, eligibleSymbols(),
          through, date, width, vwap, depth, demandVersion);
      });
      await this.refreshHistory(plans,date);
    };
    void bootstrap().catch(()=>{this.counts.barFailures++;}).finally(()=>{this.barReading=false;});
  }

  closeSession(){
    this.date="";
    this.sessionGeneration++;
    this.frames.clear();
    this.calendar.clear();
    this.lastUse.clear();
    this.lastFrameEnd.clear();
    this.lastFrameDemand.clear();
    this.lastVwapEnd.clear();
    this.lastCapacity.clear();
    this.nextFrameAttempt.clear();
    this.reports=new Map();
    this.releaseCovered=new Set();
    this.releaseAt=0;
    this.releaseRetryAt=0;
  }

  private currentEntry(symbol:string,frame:ScanSignalFrame,now:number){
    const entry=this.frames.get(frame)?.get(symbol);
    const width=parseInt(frame,10)*60_000;
    return entry?.basis===this.date&&now-entry.through<=3*width ? entry : undefined;
  }
  indicator(symbol:string,frame:ScanSignalFrame,now:number){
    return this.currentEntry(symbol,frame,now)?.facts;
  }
  structureSignal(symbol:string, frame:ScanSignalFrame, now:number, signal:StructureScanSignal) {
    const entry = this.currentEntry(symbol, frame, now);
    if (!entry) return undefined;
    if (entry.structure === undefined) {
      entry.structure = closedStructureSignals(entry.bars, BAR_FIELDS, frame, symbol, entry.through) ?? null;
    }
    return entry.structure ? entry.structure[signal] ?? null : undefined;
  }
  sameTimeVolumeRatio(symbol:string, now:number, session: ScannerSession = "regular") {
    const entry = this.currentEntry(symbol, "15m", now);
    if (!entry) return null;
    if (entry.sameTimeVolume?.through !== entry.through) {
      entry.sameTimeVolume = { through: entry.through, ratios: new Map() };
    }
    const { ratios } = entry.sameTimeVolume;
    if (!ratios.has(session)) ratios.set(session,
      sameTimeSessionVolumeRatio(entry.bars, BAR_FIELDS, entry.through, entry.volumeCoveredFrom, session));
    return ratios.get(session) ?? null;
  }
  customIndicator(symbol:string,frame:ScanSignalFrame,now:number,config:CustomIndicator,key:string,depth:number){
    const entry=this.currentEntry(symbol,frame,now);
    if(!entry)return undefined;
    if(config.kind==="vwap")return entry.vwap;
    if(entry.depth<depth)return undefined;
    const cacheKey=depth===MAX_SIGNAL_BARS?key:key+":"+depth;
    const cached=entry.custom??=new Map();
    if(cached.has(cacheKey))return cached.get(cacheKey)??undefined;
    // A symbol shares values across scans with identical parameters. Old combinations are evicted.
    const result=readCustomAverage(entry.bars.subarray(Math.max(0,entry.bars.length-depth*BAR_FIELDS)),
      BAR_FIELDS,parseInt(frame,10)*60_000,config);
    if(cached.size>=24)cached.delete(cached.keys().next().value!);
    cached.set(cacheKey,result??null);
    return result;
  }
  pressRelease(symbol:string,now:number){
    if(!this.releaseCovered.has(symbol)||now<this.releaseAt||now-this.releaseAt>60_000)return undefined;
    return this.reports.get(symbol)??null;
  }

  private async refreshReleases(symbols:string[],now:number){
    this.releaseReading=true;this.releaseRetryAt=now+10_000;
    const date=this.date;
    try {
      await yieldTurn(); // Keep the read outside the price publication call stack.
      this.counts.releaseReads++;
      const reports=await this.loaders.releases!(symbols,now);
      if(this.date!==date)return;
      this.reports=reports;
      this.releaseCovered=new Set(symbols);
      this.releaseAt=now;
    } catch { this.counts.releaseFailures++; }
    finally { this.releaseReading=false; }
  }

  private planHistory(frame: ScanSignalFrame, symbols: string[], eligible: ReadonlySet<string>, through: number,
    date: string, width: number, vwap: boolean, depth: number, demandVersion: number): HistoryPlan {
    const entries=this.frames.get(frame)??new Map<string,Entry>();
    this.frames.set(frame,entries);
    const calendar=this.calendar.get(frame)??scanCandleCalendar(frame);
    this.calendar.set(frame,calendar);
    for(const [symbol,entry] of entries)if(!eligible.has(symbol)||entry.basis!==date)entries.delete(symbol);
    const byStart=new Map<number,string[]>();
    const sessionStart=vwap?scanVwapStart(through):Infinity;
    const oldest=through-SIGNAL_BOOTSTRAP_DAYS*86_400_000;
    const cold=!entries.size;
    for(const symbol of symbols){
      const entry=entries.get(symbol);
      if(entry&&entry.through>=through&&(!vwap||entry.covered)&&entry.depth>=depth)continue;
      const overlap=entry&&entry.depth>=depth?Math.max(entry.through-2*width,oldest):oldest;
      const start=vwap&&!entry?.covered?Math.min(overlap,sessionStart):overlap;
      const bucket=byStart.get(start)??[];
      bucket.push(symbol);byStart.set(start,bucket);
    }
    const batches:HistoryBatch[]=[];
    for(const [start,bucket] of byStart){
      for(let index=0;index<bucket.length;){
        const size=cold&&batches.length===0?FIRST_BATCH_SIZE:SCANNER_SIGNAL_BATCH_SIZE;
        batches.push({start,symbols:bucket.slice(index,index+size)});
        index+=size;
      }
    }
    return {frame,demandVersion,through,width,depth,vwap,sessionStart,calendar,entries,batches,next:0,failed:false};
  }

  private async refreshHistory(plans:HistoryPlan[],date:string){
    let cursor=0;
    const current=()=>this.date===date&&plans.some(plan=>this.frames.get(plan.frame)===plan.entries);
    const stillRequested = ({frame, demandVersion}: HistoryPlan) => this.requests.get(frame)?.version === demandVersion;
    const available=(plan:HistoryPlan)=>!plan.failed&&plan.next<plan.batches.length&&stillRequested(plan);
    const worker=async()=>{
      while(current()){
        const plan=plans[cursor++%plans.length];
        if(!plans.some(available))return;
        if(!available(plan))continue;
        const batch=plan.batches[plan.next++];
        try{await this.loadBatch(plan,batch,date);}
        catch{plan.failed=true;this.counts.barFailures++;}
        await yieldTurn();
      }
    };
    await Promise.all(Array.from({length:SCANNER_SIGNAL_CONCURRENCY},worker));
    if(!current())return;
    for (const plan of plans) {
      if (!stillRequested(plan)) continue;
      const {frame,through,vwap,depth,failed,demandVersion} = plan;
      this.nextFrameAttempt.set(frame,Date.now()+5_000);
      if(failed)continue;
      this.lastFrameEnd.set(frame,through);
      this.lastFrameDemand.set(frame,demandVersion);
      if(vwap)this.lastVwapEnd.set(frame,through);
      this.lastCapacity.set(frame,depth);
    }
  }

  private async loadBatch(plan:HistoryPlan,{start,symbols}:HistoryBatch,date:string){
    const {frame,through,width,depth,vwap,sessionStart,calendar,entries}=plan;
    this.counts.barBatches++;
    const result=await this.loaders.bars!({symbols,frame,start,end:through,
      ...(vwap?{sessionVwap:true}:{}),...(depth>MAX_SIGNAL_BARS?{historyBars:depth}:{})});
    if(result.feed!=="sip"||result.adjustment!=="split"||result.frame!==frame||result.basisDate!==date||result.end!==through||
      (vwap&&result.sessionVwap!==true)||(depth>MAX_SIGNAL_BARS&&result.historyBars!==depth)||symbols.some(symbol=>!Array.isArray(result.bars?.[symbol])))
      throw Error("scanner_signal_reply_invalid");
    if(this.date!==date||this.frames.get(frame)!==entries)return;
    let yielded=performance.now();
    for(const symbol of symbols){
      const former=entries.get(symbol);
      const returned = result.bars[symbol];
      const incoming=returned.filter(bar=>calendar(bar.time*1000));
      const coverage = result.coverage?.[symbol];
      // A capped response proves absence only from the first retained bar.
      const confirmedFrom = frame === "15m" && coverage?.status === "complete" && coverage.completedThroughMs === through
        ? returned.length < depth ? start : Math.max(start, returned[0].time * 1000)
        : undefined;
      const covered=vwap&&(former?.covered||start<=sessionStart);
      const prior=former?unpackBars(former.bars):[];
      const { bars, trimmed } = mergeBars(prior, incoming, sessionStart, depth,
        confirmedFrom === undefined ? undefined : { from: confirmedFrom, through });
      const previousCoverage = former?.volumeCoveredFrom;
      let volumeCoveredFrom = confirmedFrom;
      if (volumeCoveredFrom !== undefined) {
        if (former && previousCoverage !== undefined && volumeCoveredFrom <= former.through)
          volumeCoveredFrom = Math.min(previousCoverage, volumeCoveredFrom);
        if (trimmed) volumeCoveredFrom = Math.max(volumeCoveredFrom, bars[0].time * 1000);
      }
      if(former&&former.covered===covered&&former.depth===depth&&
        former.volumeCoveredFrom===volumeCoveredFrom&&!hasChanges(prior,bars)){
        if (former.through !== through) former.structure = undefined;
        former.through=through;
      }
      else entries.set(symbol,{
        bars:packBars(bars),facts:scanIndicatorFacts(bars.slice(-MAX_SIGNAL_BARS),frame,through,calendar),
        through,basis:date,covered,depth,volumeCoveredFrom,
        ...(covered?{vwap:readCustomVwap(bars,width,sessionStart,through)}:{}),
      });
      if(performance.now()-yielded>=6){await yieldTurn();yielded=performance.now();}
    }
    if(this.date===date&&this.frames.get(frame)===entries)this.notifyHistory();
  }
}
