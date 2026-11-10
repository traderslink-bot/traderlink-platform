import type {AlpacaVwapCorporateEvents} from './chart-vwap-events';
import {setImmediate as yieldToFeed} from 'node:timers/promises';
import {aggregateCandles,easternDayStart,type Candle} from './candles';
import type {AlpacaRestData} from './rest-data';
import {AlpacaChartCalendar} from './chart-calendar-provider';
import {ChartSessionCalendar} from './chart-calendar';
import {PRICE_SOURCES,type PriceSource,DEFAULT_CHART_PREFERENCES} from './chart-preferences';
import {indicatorSource,visibleSessionBars,vwapAnchorKey} from './chart-indicators';
import {easternClock} from '../live/sessions';
import {vwapSeedStart,type VwapSeed,type VwapSeedRequest} from './chart-vwap-seed';
import {addVwapMoment,type VwapMoment} from './vwap-moments';
/** Bounded prefix calculation; history is never relabelled as visible or live candles. */
export class AlpacaVwapHistory{
 private cache=new Map<string,{at:number;seed:VwapSeed}>();
 private pending=new Map<string,Promise<VwapSeed>>();
 constructor(private readonly rest:Pick<AlpacaRestData,'history'>,private readonly calendar:Pick<AlpacaChartCalendar,'forBars'>,private readonly now:()=>number=Date.now,private readonly events?:Pick<AlpacaVwapCorporateEvents,'read'>){}
 async read(request:VwapSeedRequest):Promise<VwapSeed>{
  const basisDate=easternClock(this.now()).date,key=JSON.stringify([basisDate,request]),cached=this.cache.get(key);
  if(cached&&this.now()-cached.at<300_000)return cached.seed;
  const existing=this.pending.get(key);if(existing)return existing;if(this.pending.size>=2)throw Error('busy');
  const operation=this.load(request,basisDate).then(seed=>{this.cache.set(key,{at:this.now(),seed});while(this.cache.size>512)this.cache.delete(this.cache.keys().next().value!);return seed;}).finally(()=>this.pending.delete(key));this.pending.set(key,operation);return operation;
 }
 private async load(request:VwapSeedRequest,basisDate:string):Promise<VwapSeed>{
  const began=this.now(),eventAnchor=request.anchor==='Splits'||request.anchor==='Dividends';
  const events=eventAnchor?await this.events?.read(request.symbol,request.anchor as 'Splits'|'Dividends'):undefined;
  if(eventAnchor&&(!events||events.basisDate!==basisDate||events.symbol!==request.symbol||events.anchor!==request.anchor))throw Error('vwap_events_unavailable');
  const start=vwapSeedStart(request,events),anchorKey=vwapAnchorKey(easternClock(request.before*1000).date,request.anchor,events?.dates),sums=Object.fromEntries(PRICE_SOURCES.map(key=>[key,0])) as Record<PriceSource,number>,compensation={...sums};let volume=0,volumeCompensation=0;
  const moments=Object.fromEntries(PRICE_SOURCES.map(source=>[source,{mean:0,m2:0}])) as Record<PriceSource,VwapMoment>;
  const preferences={...DEFAULT_CHART_PREFERENCES,premarket:request.premarket,regular:request.regular,postmarket:request.postmarket},regularOnly=request.regular&&!request.premarket&&!request.postmarket;
  for(let cursor=start;cursor<request.before;){
   if(this.now()-began>90_000||easternClock(this.now()).date!==basisDate)throw Error('vwap_history_unavailable');
   const next=Math.min(request.before,easternDayStart(cursor+(request.timeframe==='1D'?3650:30)*86400));if(next<=cursor)throw Error('vwap_history_unavailable');
   const history=await this.rest.history({symbol:request.symbol,timeframe:request.timeframe==='1D'?'1Day':'1Min',start:cursor*1000,end:next*1000-1});
   if(history.basisDate!==basisDate||!history.complete||history.adjustment!=='split'||history.feed!=='sip'||history.symbol!==request.symbol)throw Error('vwap_history_unavailable');
   const inputs:Candle[]=history.bars;let sessionCalendar:ChartSessionCalendar|undefined;
   if(request.timeframe!=='1D'&&inputs.length){const facts=await this.calendar.forBars(inputs);if(!facts.available)throw Error('vwap_calendar_unavailable');const calendar=new ChartSessionCalendar();calendar.merge(facts);if(!inputs.every(bar=>calendar.covers(bar.time)))throw Error('vwap_calendar_unavailable');sessionCalendar=calendar;}
   const buckets=new Map<number,Candle>();
   for(let offset=0;offset<inputs.length;offset+=512){
    await yieldToFeed();const slice=inputs.slice(offset,offset+512),selected=request.timeframe==='1D'?slice:visibleSessionBars(slice,preferences,sessionCalendar);
    for(const bar of aggregateCandles(selected,request.timeframe,regularOnly)){const previous=buckets.get(bar.time);buckets.set(bar.time,previous?{...previous,high:Math.max(previous.high,bar.high),low:Math.min(previous.low,bar.low),close:bar.close,volume:previous.volume+bar.volume}:bar);}
   }
   const bars=[...buckets.values()];
   for(let index=0;index<bars.length;index++){
    if(index%512===0)await yieldToFeed();const bar=bars[index];
    if(bar.time>=request.before||vwapAnchorKey(easternClock(bar.time*1000).date,request.anchor,events?.dates)!==anchorKey)continue;
    const previousVolume=volume,volumeDelta=bar.volume-volumeCompensation,totalVolume=volume+volumeDelta;volumeCompensation=(totalVolume-volume)-volumeDelta;volume=totalVolume;
    for(const source of PRICE_SOURCES){const value=indicatorSource(bar,source);if(!Number.isFinite(value)||value<=0&&bar.volume>0)throw Error('vwap_history_unavailable');addVwapMoment(moments[source],previousVolume,value,bar.volume);const delta=value*bar.volume-compensation[source],total=sums[source]+delta;compensation[source]=(total-sums[source])-delta;sums[source]=total;}
   }
   cursor=next;
  }
  if(easternClock(this.now()).date!==basisDate)throw Error('vwap_history_unavailable');
  if(!Number.isFinite(volume)||!PRICE_SOURCES.every(source=>Number.isFinite(sums[source])))throw Error('vwap_history_unavailable');
  return {complete:true,request,basisDate,anchorKey,start,volume,sums,moments,...(events?{events}:{})};
 }
}
