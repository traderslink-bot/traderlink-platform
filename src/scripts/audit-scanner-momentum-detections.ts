import {createInterface} from "node:readline";
import {RollingActivityBook} from "../modules/scanner/live/activity";
import {MomentumEventBook} from "../modules/scanner/live/momentum-events";
import {DEFAULT_MOMENTUM_DETECTION} from "../modules/scanner/live/settings";
import type {MomentumSignal,NormalizedSnapshot,ScannerConfiguration,ScannerSession,ScreenFilters} from "../modules/scanner/live/contracts";

type Decision={symbol:string;observation:NormalizedSnapshot;float:number|null;marketCapAtCollection:number|null;spreadPercent:number|null};
type Cycle={cycleId:string;tradingDate:string;session:ScannerSession;completedAt:number;status:string;issues:string[];configuration:ScannerConfiguration;decisions:Decision[]};
type Event={method:MomentumSignal;symbol:string;session:ScannerSession;at:number;price:number;eligible:boolean;signals:MomentumSignal[];
  intervalSeconds:number|null;intervalVolume:number|null;intervalDollars:number|null;rateMultiple:number|null;episodeShares:number|null;episodeDollars:number|null;
  float:number;marketCap:number|null;spreadPercent:number|null;sessionGain:number|null;offHighPercent:number|null;relativeVolume:number|null;
  oneMinuteGain:number|null;fiveMinuteGain:number|null;oneMinuteVolume:number|null;volumeAcceleration:number|null;
  maxGain:number;minGain:number;gain30:number|null;gain60:number|null;gain300:number|null;lastElapsed:number;maxGapSeconds:number};
const METHODS:MomentumSignal[]=["volume_ignition","building_volume","price_burst","developing_activity","one_minute_momentum","five_minute_momentum"];
const requestedCutoff=process.env.SCANNER_AUDIT_CUTOFF_UTC?Date.parse(process.env.SCANNER_AUDIT_CUTOFF_UTC):Infinity;
if(!Number.isFinite(requestedCutoff))throw Error("scanner_audit_cutoff_invalid");
const activity=new RollingActivityBook(),events=new MomentumEventBook();
const active=new Map<string,boolean>(),activeStartedAt=new Map<string,number>(),pending=new Map<string,Event[]>(),lastEpisodeStart=new Map<string,number>();
const completed:Event[]=[],incomplete:Event[]=[];
const coverage={cycles:0,observations:0,firstAt:Infinity,lastAt:-Infinity,statuses:new Map<string,number>(),issues:new Map<string,number>(),sessions:new Map<string,{cycles:number;observations:number}>(),dates:new Set<string>(),symbols:new Set<string>()};
const overlaps=new Map<string,number>();
const configurations=new Map<string,{cycles:number;revision:number;session:ScannerSession;oneMinute:number;fiveMinute:number;filters:ScreenFilters}>();
const moves:{session:ScannerSession;at:number;symbol:string;captures:Partial<Record<MomentumSignal,number>>}[]=[];
const moveActive=new Map<string,boolean>();

function passes(decision:Decision,filters:ScreenFilters):boolean{
  const row=decision.observation,marketCap=decision.marketCapAtCollection,float=decision.float;
  if(!float||!marketCap||row.price<filters.minimumPrice||filters.maximumPrice!==null&&row.price>filters.maximumPrice||marketCap>filters.maximumMarketCap
    ||filters.maximumFloat!==null&&float>filters.maximumFloat||row.volume===null||row.volume<filters.minimumVolume
    ||row.dollarVolume===null||row.dollarVolume<filters.minimumDollarVolume||filters.maximumSpreadPercent!==null
      &&(decision.spreadPercent===null||decision.spreadPercent>filters.maximumSpreadPercent))return false;
  const gain=row.baseline&&row.baseline>0?(row.price/row.baseline-1)*100:null;
  return filters.minimumSessionGain===null||gain!==null&&gain>=filters.minimumSessionGain;
}
function updateOutcomes(symbol:string,at:number,price:number){
  const list=pending.get(symbol);if(!list)return;
  const keep:Event[]=[];
  for(const event of list){
    const elapsed=at-event.at;if(elapsed<=0){keep.push(event);continue;}
    if(elapsed>315_000){incomplete.push(event);continue;}
    event.maxGapSeconds=Math.max(event.maxGapSeconds,(elapsed-event.lastElapsed)/1000);
    const gain=(price/event.price-1)*100;
    if(elapsed<=300_000){event.maxGain=Math.max(event.maxGain,gain);event.minGain=Math.min(event.minGain,gain);}
    event.lastElapsed=elapsed;
    if(event.gain30===null&&elapsed>=30_000&&elapsed<=45_000)event.gain30=gain;
    if(event.gain60===null&&elapsed>=60_000&&elapsed<=75_000)event.gain60=gain;
    if(event.gain300===null&&elapsed>=300_000)event.gain300=gain;
    if(elapsed>=300_000){if(event.maxGapSeconds<=20)completed.push(event);else incomplete.push(event);}else keep.push(event);
  }
  if(keep.length)pending.set(symbol,keep);else pending.delete(symbol);
}
function number(value:number|null|undefined):number|null{return typeof value==="number"&&Number.isFinite(value)?value:null;}
function quantile(values:number[],p:number):number|null{if(!values.length)return null;const sorted=[...values].sort((a,b)=>a-b),at=(sorted.length-1)*p,left=Math.floor(at),right=Math.ceil(at);return sorted[left]+(sorted[right]-sorted[left])*(at-left);}
function rounded(value:number|null):number|null{return value===null?null:Math.round(value*100)/100;}

async function main(){
for await(const line of createInterface({input:process.stdin,crlfDelay:Infinity})){
  if(!line.trim())continue;
  const cycle=JSON.parse(line) as Cycle;if(cycle.completedAt>requestedCutoff)continue;
  coverage.cycles++;coverage.dates.add(cycle.tradingDate);coverage.firstAt=Math.min(coverage.firstAt,cycle.completedAt);coverage.lastAt=Math.max(coverage.lastAt,cycle.completedAt);
  const filter=cycle.configuration.momentum.filters[cycle.session],configurationKey=JSON.stringify({revision:cycle.configuration.revision,session:cycle.session,
    oneMinute:cycle.configuration.momentum.focus.minimumOneMinuteGain,fiveMinute:cycle.configuration.momentum.focus.minimumFiveMinuteGain,filters:filter});
  const configuration=configurations.get(configurationKey)??{cycles:0,revision:cycle.configuration.revision,session:cycle.session,
    oneMinute:cycle.configuration.momentum.focus.minimumOneMinuteGain,fiveMinute:cycle.configuration.momentum.focus.minimumFiveMinuteGain,filters:filter};
  configuration.cycles++;configurations.set(configurationKey,configuration);
  if(coverage.cycles%500===0)console.error(`audited ${coverage.cycles} cycles / ${coverage.observations} observations`);
  coverage.statuses.set(cycle.status,(coverage.statuses.get(cycle.status)??0)+1);for(const issue of cycle.issues??[])coverage.issues.set(issue,(coverage.issues.get(issue)??0)+1);
  const sessionCoverage=coverage.sessions.get(cycle.session)??{cycles:0,observations:0};sessionCoverage.cycles++;sessionCoverage.observations+=cycle.decisions.length;coverage.sessions.set(cycle.session,sessionCoverage);
  coverage.observations+=cycle.decisions.length;
  for(const decision of cycle.decisions){
    const snapshot=decision.observation;coverage.symbols.add(decision.symbol);updateOutcomes(decision.symbol,snapshot.receivedAt,snapshot.price);
    if(!activity.observe(snapshot))continue;
    const rolling=activity.metrics(decision.symbol,cycle.completedAt);let signals:MomentumSignal[]=[];
    if(decision.float&&decision.float>0){
      const result=events.evaluate(`${cycle.tradingDate}:${cycle.session}`,decision.symbol,snapshot.price,decision.float,snapshot.receivedAt,rolling,
        cycle.configuration.momentumDetection?.[cycle.session]??DEFAULT_MOMENTUM_DETECTION[cycle.session]);
      const enriched=result.activity;signals=[...result.signals];
      if(enriched.oneMinuteGain!==null&&enriched.oneMinuteGain>=cycle.configuration.momentum.focus.minimumOneMinuteGain)signals.push("one_minute_momentum");
      if(enriched.fiveMinuteGain!==null&&enriched.fiveMinuteGain>=cycle.configuration.momentum.focus.minimumFiveMinuteGain)signals.push("five_minute_momentum");
      signals=[...new Set(signals)];
      if(signals.length)overlaps.set([...signals].sort().join("+"),(overlaps.get([...signals].sort().join("+"))??0)+1);
      const eligible=passes(decision,cycle.configuration.momentum.filters[cycle.session]);
      for(const method of METHODS){
        const key=`${decision.symbol}\0${method}`,on=signals.includes(method),was=active.get(key)??false;
        if(on&&!was){
          activeStartedAt.set(key,snapshot.receivedAt);lastEpisodeStart.set(key,snapshot.receivedAt);
          const event:Event={method,symbol:decision.symbol,session:cycle.session,at:snapshot.receivedAt,price:snapshot.price,eligible,signals:[...signals],
            intervalSeconds:number(enriched.intervalSeconds),intervalVolume:number(enriched.intervalVolume),intervalDollars:number(enriched.intervalDollarVolume),
            rateMultiple:number(enriched.intervalVolumeRateMultiple),episodeShares:number(enriched.episodeShares),episodeDollars:number(enriched.episodeDollarVolume),
            float:decision.float,marketCap:decision.marketCapAtCollection,spreadPercent:decision.spreadPercent,
            sessionGain:snapshot.baseline&&snapshot.baseline>0?(snapshot.price/snapshot.baseline-1)*100:null,
            offHighPercent:snapshot.dayHigh>0?(snapshot.price/snapshot.dayHigh-1)*100:null,relativeVolume:snapshot.providerVolumeRatio,
            oneMinuteGain:enriched.oneMinuteGain,fiveMinuteGain:enriched.fiveMinuteGain,oneMinuteVolume:enriched.oneMinuteVolume,volumeAcceleration:enriched.volumeAcceleration,
            maxGain:0,minGain:0,gain30:null,gain60:null,gain300:null,lastElapsed:0,maxGapSeconds:0};
          pending.set(decision.symbol,[...(pending.get(decision.symbol)??[]),event]);
        }
        if(!on)activeStartedAt.delete(key);
        active.set(key,on);
      }
      const moveKey=`${cycle.tradingDate}\0${cycle.session}\0${decision.symbol}`,moveOn=eligible&&(enriched.fiveMinuteGain??-Infinity)>=5,moveWas=moveActive.get(moveKey)??false;
      if(moveOn&&!moveWas){
        const captures:Partial<Record<MomentumSignal,number>>={};
        for(const method of METHODS){const key=`${decision.symbol}\0${method}`,detected=activeStartedAt.get(key)??lastEpisodeStart.get(key);if(detected!==undefined&&detected>=snapshot.receivedAt-310_000)captures[method]=(detected-snapshot.receivedAt)/1000;}
        moves.push({session:cycle.session,at:snapshot.receivedAt,symbol:decision.symbol,captures});
      }
      moveActive.set(moveKey,moveOn);
    }
  }
}
const censored=[...pending.values()].flat().concat(incomplete);
function methodReport(method:MomentumSignal){
  const all=[...completed,...censored].filter(event=>event.method===method),eligible=all.filter(event=>event.eligible),outcomes=completed.filter(event=>event.method===method&&event.eligible);
  const captured=moves.filter(move=>move.captures[method]!==undefined),lead=captured.map(move=>move.captures[method]!);
  const sample=(event:Event)=>({symbol:event.symbol,session:event.session,atUtc:new Date(event.at).toISOString(),price:event.price,maxGain5m:rounded(event.maxGain),
    drawdown5m:rounded(event.minGain),gain30s:rounded(event.gain30),gain60s:rounded(event.gain60),gain5m:rounded(event.gain300),signals:event.signals});
  const outcomeSummary=(rows:Event[])=>({episodes:rows.length,medianMaximumGain5m:rounded(quantile(rows.map(event=>event.maxGain),.5)),
    medianDrawdown5m:rounded(quantile(rows.map(event=>event.minGain),.5)),medianGain5m:rounded(quantile(rows.flatMap(event=>event.gain300===null?[]:[event.gain300]),.5)),
    reached1Percent:rounded(rows.length?rows.filter(event=>event.maxGain>=1).length/rows.length*100:null),reached3Percent:rounded(rows.length?rows.filter(event=>event.maxGain>=3).length/rows.length*100:null),
    reached5Percent:rounded(rows.length?rows.filter(event=>event.maxGain>=5).length/rows.length*100:null),fell2Percent:rounded(rows.length?rows.filter(event=>event.minGain<=-2).length/rows.length*100:null)});
  return {triggerEpisodes:all.length,eligibleEpisodes:eligible.length,completedFiveMinuteOutcomes:outcomes.length,censoredAtAuditCutoff:eligible.length-outcomes.length,
    uniqueEligibleTickers:new Set(eligible.map(event=>event.symbol)).size,sessions:Object.fromEntries(["premarket","regular","after_hours"].map(session=>[session,eligible.filter(event=>event.session===session).length])),
    sessionOutcomes:Object.fromEntries(["premarket","regular","after_hours"].map(session=>[session,outcomeSummary(outcomes.filter(event=>event.session===session))])),
    detection:{medianIntervalSeconds:rounded(quantile(eligible.flatMap(event=>event.intervalSeconds===null?[]:[event.intervalSeconds]),.5)),
      medianIntervalShares:rounded(quantile(eligible.flatMap(event=>event.intervalVolume===null?[]:[event.intervalVolume]),.5)),medianIntervalDollars:rounded(quantile(eligible.flatMap(event=>event.intervalDollars===null?[]:[event.intervalDollars]),.5)),
      medianRateMultiple:rounded(quantile(eligible.flatMap(event=>event.rateMultiple===null?[]:[event.rateMultiple]),.5)),medianEpisodeShares:rounded(quantile(eligible.flatMap(event=>event.episodeShares===null?[]:[event.episodeShares]),.5)),medianEpisodeDollars:rounded(quantile(eligible.flatMap(event=>event.episodeDollars===null?[]:[event.episodeDollars]),.5))},
    forwardOutcome:{medianMaximumGain5m:rounded(quantile(outcomes.map(event=>event.maxGain),.5)),p75MaximumGain5m:rounded(quantile(outcomes.map(event=>event.maxGain),.75)),
      medianMaximumDrawdown5m:rounded(quantile(outcomes.map(event=>event.minGain),.5)),medianGain30s:rounded(quantile(outcomes.flatMap(event=>event.gain30===null?[]:[event.gain30]),.5)),
      medianGain60s:rounded(quantile(outcomes.flatMap(event=>event.gain60===null?[]:[event.gain60]),.5)),medianGain5m:rounded(quantile(outcomes.flatMap(event=>event.gain300===null?[]:[event.gain300]),.5)),
      reached1Percent:outcomes.filter(event=>event.maxGain>=1).length,reached3Percent:outcomes.filter(event=>event.maxGain>=3).length,reached5Percent:outcomes.filter(event=>event.maxGain>=5).length,
      fell2Percent:outcomes.filter(event=>event.minGain<=-2).length},referenceMoves:{total:moves.length,captured:captured.length,captureRatePercent:rounded(moves.length?captured.length/moves.length*100:null),
      medianLeadSeconds:rounded(quantile(lead,.5))},examples:{strongest:[...outcomes].sort((a,b)=>b.maxGain-a.maxGain).slice(0,10).map(sample),
      weakest:[...outcomes].sort((a,b)=>a.maxGain-b.maxGain||a.minGain-b.minGain).slice(0,10).map(sample),
      missedReferenceMoves:moves.filter(move=>move.captures[method]===undefined).slice(0,20).map(move=>({symbol:move.symbol,session:move.session,atUtc:new Date(move.at).toISOString()}))}};
}
function priceBurstStableCohort(){
  const raw=completed.filter(event=>event.method==="price_burst"&&event.eligible).sort((a,b)=>a.symbol.localeCompare(b.symbol)||a.session.localeCompare(b.session)||a.at-b.at);
  const sequences:Event[]=[];let previous:{symbol:string;session:ScannerSession;lastAt:number}|null=null;
  for(const event of raw){
    if(!previous||previous.symbol!==event.symbol||previous.session!==event.session||event.at-previous.lastAt>300_000){sequences.push(event);previous={symbol:event.symbol,session:event.session,lastAt:event.at};}
    else previous.lastAt=event.at;
  }
  const summarize=(rows:Event[])=>{const stable=rows.filter(event=>event.minGain>-2),sample=(event:Event)=>({symbol:event.symbol,session:event.session,
    atUtc:new Date(event.at).toISOString(),triggerPrice:event.price,maximumGain5m:rounded(event.maxGain),maximumDrawdown5m:rounded(event.minGain),
    gain30s:rounded(event.gain30),gain60s:rounded(event.gain60),gain5m:rounded(event.gain300),signals:event.signals,float:event.float,marketCap:event.marketCap,
    spreadPercent:rounded(event.spreadPercent),sessionGain:rounded(event.sessionGain),offHighPercent:rounded(event.offHighPercent),relativeVolume:rounded(event.relativeVolume),
    intervalShares:rounded(event.intervalVolume),intervalDollars:rounded(event.intervalDollars),volumeRateMultiple:rounded(event.rateMultiple),
    episodeShares:rounded(event.episodeShares),episodeDollars:rounded(event.episodeDollars),oneMinuteGain:rounded(event.oneMinuteGain),
    fiveMinuteGain:rounded(event.fiveMinuteGain),oneMinuteVolume:rounded(event.oneMinuteVolume),volumeAcceleration:rounded(event.volumeAcceleration)});
    const peakBuckets={noRise:0,under1:0,oneTo3:0,threeTo5:0,fiveTo10:0,tenOrMore:0};
    for(const event of stable){if(event.maxGain===0)peakBuckets.noRise++;else if(event.maxGain<1)peakBuckets.under1++;else if(event.maxGain<3)peakBuckets.oneTo3++;
      else if(event.maxGain<5)peakBuckets.threeTo5++;else if(event.maxGain<10)peakBuckets.fiveTo10++;else peakBuckets.tenOrMore++;}
    const segment=(segmentRows:Event[])=>({count:segmentRows.length,medianTriggerPrice:rounded(quantile(segmentRows.map(event=>event.price),.5)),
      medianFloat:rounded(quantile(segmentRows.map(event=>event.float),.5)),medianSpreadPercent:rounded(quantile(segmentRows.flatMap(event=>event.spreadPercent===null?[]:[event.spreadPercent]),.5)),
      medianRateMultiple:rounded(quantile(segmentRows.flatMap(event=>event.rateMultiple===null?[]:[event.rateMultiple]),.5)),
      medianEpisodeDollars:rounded(quantile(segmentRows.flatMap(event=>event.episodeDollars===null?[]:[event.episodeDollars]),.5)),
      medianOneMinuteGain:rounded(quantile(segmentRows.flatMap(event=>event.oneMinuteGain===null?[]:[event.oneMinuteGain]),.5)),
      medianOffHighPercent:rounded(quantile(segmentRows.flatMap(event=>event.offHighPercent===null?[]:[event.offHighPercent]),.5))});
    return {completeEpisodes:rows.length,fellAtLeast2Percent:rows.length-stable.length,stayedAboveMinus2Percent:stable.length,
      stayedAboveMinus2PercentRate:rounded(rows.length?stable.length/rows.length*100:null),uniqueTickers:new Set(stable.map(event=>event.symbol)).size,
      peakGainBuckets:peakBuckets,medianMaximumGain5m:rounded(quantile(stable.map(event=>event.maxGain),.5)),
      medianMaximumDrawdown5m:rounded(quantile(stable.map(event=>event.minGain),.5)),medianGain5m:rounded(quantile(stable.flatMap(event=>event.gain300===null?[]:[event.gain300]),.5)),
      segments:{under1:segment(stable.filter(event=>event.maxGain<1)),oneTo3:segment(stable.filter(event=>event.maxGain>=1&&event.maxGain<3)),
        threeTo5:segment(stable.filter(event=>event.maxGain>=3&&event.maxGain<5)),fiveTo10:segment(stable.filter(event=>event.maxGain>=5&&event.maxGain<10)),
        tenOrMore:segment(stable.filter(event=>event.maxGain>=10))},
      episodes:stable.map(sample)};};
  return {rawEpisodes:summarize(raw),deduplicatedFiveMinuteSequences:summarize(sequences)};
}
console.log(JSON.stringify({generatedAtUtc:new Date().toISOString(),coverage:{cycles:coverage.cycles,observations:coverage.observations,uniqueSymbols:coverage.symbols.size,
  dates:[...coverage.dates].sort(),firstCycleUtc:new Date(coverage.firstAt).toISOString(),lastCycleUtc:new Date(coverage.lastAt).toISOString(),statuses:Object.fromEntries(coverage.statuses),
  issues:Object.fromEntries([...coverage.issues].sort((a,b)=>b[1]-a[1])),sessions:Object.fromEntries(coverage.sessions)},referenceMoveDefinition:"first eligible observation in a contiguous period where observed five-minute gain is at least 5%",
  referenceMoves:moves.length,configurationHistory:[...configurations.values()].sort((a,b)=>a.revision-b.revision||a.session.localeCompare(b.session)),
  methods:Object.fromEntries(METHODS.map(method=>[method,methodReport(method)])),priceBurstStableCohort:priceBurstStableCohort(),
  topSignalCombinations:[...overlaps].sort((a,b)=>b[1]-a[1]).slice(0,20).map(([signals,count])=>({signals,count}))},null,2));
}

void main().catch(error=>{console.error(error);process.exitCode=1;});
