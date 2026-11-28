import "server-only";
import { readCompanyData } from "@/src/lib/news/company-data-gateway";
import type { UniverseStock } from "@/src/modules/scanner/live/contracts";
import { scannerUniverseStore,readLiveScannerRuntime } from "@/src/modules/scanner/live/server/runtime";
import { scannerVolumeBreakdown } from "@/src/modules/scanner/live/volume";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { scannerIndicatorResults } from "@/src/modules/scanner/live/scanner-indicator-calculation";
import { easternDayStart } from "@/src/modules/scanner/alpaca/candles";
import { readAlpacaHistory,readAlpacaTradeRevisions,requestAlpacaGateway } from "@/src/modules/scanner/alpaca/client";
import { readChartCalendarYear } from "@/src/modules/scanner/alpaca/chart-calendar-request";
import type { TradeRevision } from "@/src/modules/scanner/alpaca/trade-revisions";
import type { AlpacaQuoteReply } from "@/src/modules/scanner/alpaca/scanner-snapshots";
import { companySessionRanges, type CompanyTechnicals } from "../company-technicals";

export async function companyUniverseEntry(symbol:string){
  const universe=await scannerUniverseStore().readLatestOnOrBefore(easternClock(Date.now()).date);
  return universe?.stocks.find(stock=>stock.symbol===symbol);
}

export async function hasCompanyMarketSymbol(symbol:string){
  const quotes=await requestAlpacaGateway("quotes",new URLSearchParams({symbols:symbol}),process.env,AbortSignal.timeout(5000)) as AlpacaQuoteReply|null;
  const snapshot=quotes?.snapshots?.[symbol];
  return quotes?.feed==="sip"&&Boolean(snapshot?.dailyBar||snapshot?.prevDailyBar||snapshot?.latestQuote);
}

type MarketRanges=Pick<CompanyTechnicals,"days"|"bid"|"ask"|"dollarVolume"|"dayVolume"|"sessionVolume"|"sessionVwap"|"candleActivity"|"relativeVolume"|"revisedRangeDates">;
type RangeCacheEntry={expires:number;revision?:TradeRevision;read:Promise<MarketRanges>};
const ranges=new Map<string,RangeCacheEntry>();
const revisionReads=new Map<string,{expires:number;read:Promise<TradeRevision|undefined>}>();
const maximumRevisionWindow=7*86_400_000;
const noTradeRevision:TradeRevision={revision:null,pending:false,minutes:[]};
const calendars=new Map<number,ReturnType<typeof fetchCalendar>>();
function fetchCalendar(year:number){
  return requestAlpacaGateway("calendar",new URLSearchParams({year:String(year)}),process.env,AbortSignal.timeout(8000))
    .then(result=>readChartCalendarYear(result,year));
}
function calendar(year:number){
  const cached=calendars.get(year);
  if(cached)return cached;
  const read=fetchCalendar(year);
  calendars.set(year,read);
  void read.catch(()=>{if(calendars.get(year)===read)calendars.delete(year);});
  return read;
}
async function rangeSessions(today:string){
  const year=Number(today.slice(0,4));
  const current=await calendar(year);
  if(!current.available)return [];
  let sessions=current.sessions.filter(session=>session.date<=today).slice(-2);
  if(sessions.length<2){
    const previous=await calendar(year-1);
    if(previous.available)sessions=[...previous.sessions.slice(-2),...sessions].slice(-2);
  }
  return sessions;
}

function recentRevision(symbol:string,start:number,now:number){
  start=Math.max(start,now-maximumRevisionWindow);
  const key=symbol+":"+easternClock(now).date;
  const cached=revisionReads.get(key);
  if(cached&&cached.expires>now)return cached.read;
  const read=readAlpacaTradeRevisions({symbols:[symbol],start,end:now},process.env,AbortSignal.timeout(2500))
    .then(result=>result.symbols[symbol]??noTradeRevision)
    .catch(()=>undefined);
  revisionReads.set(key,{expires:now+5_000,read});
  if(revisionReads.size>256)revisionReads.delete(revisionReads.keys().next().value!);
  return read;
}

async function fetchRanges(symbol:string, now:number, sessions:Awaited<ReturnType<typeof rangeSessions>>,
  start:number,revisedRangeDates:string[],pending:boolean):Promise<MarketRanges>{
  const today=easternClock(now).date;
  const close=sessions.at(-1)?.close==="13:00"?780:960;
  const todayStart=easternDayStart(Date.parse(today+"T12:00:00Z")/1000)*1000;
  const [history,quotes,daily]=await Promise.all([
    readAlpacaHistory({symbol,timeframe:"1Min",start,end:now},process.env,AbortSignal.timeout(9000)),
    requestAlpacaGateway("quotes",new URLSearchParams({symbols:symbol,sessions:"1",regularClose:String(close)}),process.env,AbortSignal.timeout(5000))
      .catch(()=>null) as Promise<AlpacaQuoteReply|null>,
    readAlpacaHistory({symbol,timeframe:"1Day",start:todayStart-35*86_400_000,end:todayStart-1},process.env,AbortSignal.timeout(7000)).catch(()=>null),
  ]);
  const quote=quotes?.feed==="sip"?quotes.snapshots[symbol]?.latestQuote:undefined;
  const quoteTime=Date.parse(quote?.t??"");
  const usable=quote&&quote.bp>0&&quote.ap>=quote.bp&&quoteTime<=now&&now-quoteTime<=60_000;
  // The split-adjusted history overlays repairs only on its matching basis
  // date. A pending disposition can affect any of the current day's minutes.
  const unverifiedDates=new Set(revisedRangeDates.filter(date=>date!==history.basisDate || (pending&&date===today)));
  const rangeBars=unverifiedDates.size?history.bars.filter(bar=>!unverifiedDates.has(easternClock(bar.time*1000).date)):history.bars;
  const days=companySessionRanges(rangeBars,sessions).reverse();
  const regularVolume=days.find(day=>day.date===today)?.ranges[1]?.volume;
  const baseline=daily?.bars.slice(-20)??[];
  const baselineVolume=baseline.reduce((sum,bar)=>sum+bar.volume,0)/20;
  const relativeVolume=regularVolume!=null&&baseline.length===20&&baselineVolume>0?regularVolume/baselineVolume:undefined;
  const totals=quotes?.feed==="sip"?quotes.sessionTotals?.[symbol]:null;
  const todayRevised=revisedRangeDates.includes(today);
  const stamp=totals&&"correctionRevision" in totals?totals.correctionRevision:undefined;
  const usableTotals=totals?.complete&&totals.date===today&&sessions.at(-1)?.date===today&&
    (!todayRevised||(!pending&&typeof stamp==="number"&&Number.isSafeInteger(stamp)&&stamp>0))?totals:undefined;
  const clock=easternClock(now);
  const session=clock.minute<570?"premarket":clock.minute<close?"regular":"after_hours";
  const sessionTotal=usableTotals?.sessions[session];
  const dollarVolume=usableTotals
    ? todayRevised?sessionTotal?.dollarVolume:Object.values(usableTotals.sessions).reduce((sum,total)=>sum+total.dollarVolume,0)
    : undefined;
  const dayVolume=usableTotals?scannerVolumeBreakdown({
    session,
    premarketVolume:usableTotals.sessions.premarket.volume,
    regularVolume:usableTotals.sessions.regular.volume,
  }).dayVolume:undefined;
  const through=Math.floor(now/60_000)*60_000;
  const completed=rangeBars.filter(bar=>(bar.time+60)*1000<=through);
  const {vwap}=scannerIndicatorResults(completed,"5m",through);
  const recent=completed.filter(bar=>{
    const time=easternClock(bar.time*1000);
    return time.date===today&&time.minute>=240&&time.minute<(close===780?1020:1200)
      && (time.minute<570?0:time.minute<close?1:2)===(clock.minute<570?0:clock.minute<close?1:2);
  });
  const last=recent.at(-1);
  const at=(minutes:number)=>recent.find(bar=>bar.time===through/1000-(minutes+1)*60);
  const windowVolume=(from:number,to:number)=>recent.filter(bar=>bar.time>=through/1000-from*60&&bar.time<through/1000-to*60)
    .reduce((sum,bar)=>sum+bar.volume,0);
  const one=at(1), five=at(5), ten=at(10), six=at(6);
  const previousFive=ten?windowVolume(10,5):0;
  const preceding= six?windowVolume(6,1):0;
  const candleActivity=last?.time===through/1000-60?{
    oneMinuteGain:one?(last.close/one.close-1)*100:undefined,
    fiveMinuteGain:five?(last.close/five.close-1)*100:undefined,
    oneMinuteVolume:last.volume, fiveMinuteVolume:five?windowVolume(5,0):undefined,
    fiveMinuteVolumeSpike:five&&previousFive>0?windowVolume(5,0)/previousFive:undefined,
    volumeAcceleration:preceding>0?last.volume/(preceding/5):undefined, intervalVolumeRate:last.volume/60,
  }:undefined;
  return {days,relativeVolume,dollarVolume,dayVolume,sessionVolume:sessionTotal?.volume,sessionVwap:vwap?.value??undefined,candleActivity,
    ...(usable?{bid:quote.bp,ask:quote.ap}:{})};
}
async function readRanges(symbol:string){
  const now=Date.now();
  const today=easternClock(now).date;
  const key=symbol+":"+today;
  const sessions=await rangeSessions(today).catch(()=>[]);
  if(!sessions.length)return {days:[]};
  const start=easternDayStart(Date.parse(sessions[0].date+"T12:00:00Z")/1000)*1000;
  const observed=await recentRevision(symbol,start,now);
  const cached=ranges.get(key);
  const revision=observed??cached?.revision;
  if(cached&&cached.expires>now&&cached.revision?.revision===revision?.revision&&cached.revision?.pending===revision?.pending)return cached.read;

  const revisedRangeDates=[...new Set([
    ...(revision?.minutes.map(minute=>easternClock(minute*1000).date)??[]),
    ...(revision?.pending?[today]:[]),
  ])];
  const entry:RangeCacheEntry={expires:now+60_000,revision,read:fetchRanges(symbol,now,sessions,start,revisedRangeDates,Boolean(revision?.pending))
    .then(result=>revisedRangeDates.length?{...result,revisedRangeDates}:result)
    .catch(()=>{
      if(revisedRangeDates.length){
        entry.expires=Date.now()+5_000;
        return {days:[],revisedRangeDates};
      }
      return {days:[]};
    })};
  ranges.set(key,entry);
  if(ranges.size>256)ranges.delete(ranges.keys().next().value!);
  return entry.read;
}
const yearRanges=new Map<string,{retryAt:number;read:Promise<CompanyTechnicals["yearRange"]>}>();

async function readYearRange(symbol:string,now:number,adjusted:boolean):Promise<CompanyTechnicals["yearRange"]>{
  const {date,minute}=easternClock(now);
  const yearCalendar=await calendar(Number(date.slice(0,4)));
  if(!yearCalendar.available)return undefined;
  const session=yearCalendar.sessions.find(item=>item.date===date);
  const close=session?.close==="13:00"?780:960;
  const includeToday=Boolean(session)&&minute>=close+5;
  const key=`${symbol}:${date}:${includeToday}:${adjusted}`;
  const cached=yearRanges.get(key);
  if(cached&&cached.retryAt>now)return cached.read;
  const cutoff=Date.parse(date+"T12:00:00Z")-364*86_400_000;
  const start=easternDayStart(cutoff/1000)*1000;
  const dayStart=easternDayStart(Date.parse(date+"T12:00:00Z")/1000)*1000;
  const end=includeToday?dayStart+close*60_000:dayStart-1;
  const entry:{retryAt:number;read:Promise<CompanyTechnicals["yearRange"]>}={retryAt:Infinity,read:readAlpacaHistory({symbol,timeframe:"1Day",start,end,...(!adjusted?{adjustment:"raw" as const}:{})},process.env,AbortSignal.timeout(9000))
    .then(({bars})=>{
      const eligible=bars.filter(bar=>bar.high>=bar.low&&bar.low>0&&Number.isFinite(bar.high));
      if(!eligible.length)return undefined;
      const high=eligible.reduce((best,bar)=>bar.high>=best.high?bar:best);
      const low=eligible.reduce((best,bar)=>bar.low<=best.low?bar:best);
      return {high:high.high,low:low.low,highDate:easternClock(high.time*1000).date,lowDate:easternClock(low.time*1000).date};
    }).catch(()=>{
      const failed=yearRanges.get(key);
      if(failed===entry)failed.retryAt=Date.now()+60_000;
      return undefined;
    })};
  yearRanges.set(key,entry);
  if(yearRanges.size>512)yearRanges.delete(yearRanges.keys().next().value!);
  return entry.read;
}

export async function readCompanyTechnicals(symbol:string, entry?:UniverseStock):Promise<CompanyTechnicals>{
  const model=entry?readLiveScannerRuntime():undefined;
  const day=model?.dayGainers?.rows.find(row=>row.symbol===symbol);
  const gain=model?.gainers.rows.find(row=>row.symbol===symbol);
  const momentum=model?.momentum.rows.find(row=>row.symbol===symbol);
  const row=gain??momentum??day??null;
  const scannerSignals=[
    ...(gain||day?["Top Gainers"]:[]),...(momentum?["Momentum",...momentum.reasons]:[]),
    ...(model?.declines?.losers.some(row=>row.symbol===symbol)?["Top Losers"]:[]),
    ...(model?.premarketPullbacks?.rows.some(row=>row.symbol===symbol)?["HOD Drops"]:[]),
  ];
  const [market, profile] = await Promise.all([
    readRanges(symbol),
    row?.float == null ? readCompanyData<{ticker?:string;floatingShare?:number;marketCapitalization?:number}>("profile",symbol) : null,
  ]);
  const listing = profile?.ticker === symbol ? profile : undefined;
  const float = positiveMillions(listing?.floatingShare);
  const marketCap = entry?.marketCapAtCollection ?? positiveMillions(listing?.marketCapitalization);
  const { candleActivity, relativeVolume, ...marketStats } = market;
  return {row,scannerSignals,scannerMember:Boolean(entry),...marketStats,listedMarketCap:marketCap,listedFloat:float,
    ...(entry?{candleActivity,relativeVolume}:{})};
}

function positiveMillions(value:number|undefined){
  return typeof value==="number"&&Number.isFinite(value)&&value>0?value*1_000_000:undefined;
}

export function readCompanyYearRange(symbol:string,adjusted:boolean){
  return readYearRange(symbol,Date.now(),adjusted).catch(()=>undefined);
}
