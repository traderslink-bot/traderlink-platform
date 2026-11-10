import {calendarDate} from './chart-calendar';
import type {VwapCorporateEvents} from './chart-vwap-events';
import {chartSymbol,chartTimeframe,easternDayStart,type ChartTimeframe} from './candles';
import {VWAP_ANCHORS,PRICE_SOURCES,type ChartIndicator,type PriceSource} from './chart-preferences';
import {vwapAnchorKey} from './chart-indicators';
import {easternClock} from '../live/sessions';
import {CHART_HISTORY_FLOOR} from './chart-history';
import type {VwapMoment} from './vwap-moments';
export type VwapSeedRequest={symbol:string;timeframe:ChartTimeframe;anchor:NonNullable<ChartIndicator['anchor']>;before:number;premarket:boolean;regular:boolean;postmarket:boolean};
export type VwapSeed={events?:VwapCorporateEvents;complete:true;request:VwapSeedRequest;basisDate:string;anchorKey:string;start:number;volume:number;sums:Record<Exclude<PriceSource,'hlcc4'>,number>&{hlcc4?:number};moments?:Record<PriceSource,VwapMoment>};
export function parseVwapSeedRequest(query:URLSearchParams,now=Date.now()):VwapSeedRequest{
 const symbol=chartSymbol(query.get('symbol')??''),timeframe=chartTimeframe(query.get('timeframe')??''),anchor=query.get('anchor') as VwapSeedRequest['anchor'],before=Number(query.get('before'));
 if(!VWAP_ANCHORS.includes(anchor)||!Number.isSafeInteger(before)||before<CHART_HISTORY_FLOOR/1000||before*1000>now+60_000)throw Error('invalid_vwap_seed');
 const flags=['premarket','regular','postmarket'].map(key=>{const value=query.get(key);if(value!=='0'&&value!=='1')throw Error('invalid_vwap_seed');return value==='1';});
 if(!flags.some(Boolean))throw Error('invalid_vwap_seed');return {symbol,timeframe,anchor,before,premarket:flags[0],regular:flags[1],postmarket:flags[2]};
}
export function vwapSeedStart(request:VwapSeedRequest,events?:VwapCorporateEvents):number{
 const date=easternClock(request.before*1000).date,key=vwapAnchorKey(date,request.anchor,events?.dates);
 if(request.anchor==='Splits'||request.anchor==='Dividends')return key?Math.max(CHART_HISTORY_FLOOR/1000,easternDayStart(Date.parse(key+'T12:00:00Z')/1000)):request.before;
 const start=request.anchor==='Session'||request.anchor==='Week'?key:request.anchor==='Month'?key+'-01':request.anchor==='Quarter'?`${key.slice(0,4)}-${String((Number(key.at(-1))-1)*3+1).padStart(2,'0')}-01`:key+'-01-01';
 return Math.max(CHART_HISTORY_FLOOR/1000,easternDayStart(Date.parse(start+'T12:00:00Z')/1000));
}
export function validVwapSeed(value:unknown,request:VwapSeedRequest,basisDate:string):value is VwapSeed{
 if(!value||typeof value!=='object'||Array.isArray(value))return false;
 const seed=value as VwapSeed;
 const eventAnchor=request.anchor==='Splits'||request.anchor==='Dividends';
 if(eventAnchor){const facts=seed.events;if(!facts||facts.symbol!==request.symbol||facts.anchor!==request.anchor||facts.basisDate!==basisDate||!Array.isArray(facts.dates)||facts.dates.length>32000||facts.dates.some((date,n)=>!calendarDate(date)||date>basisDate||n>0&&facts.dates[n-1]>=date))return false;}
 else if(seed.events!==undefined)return false;

 if(seed.complete!==true||!seed.request||!(Object.keys(request) as (keyof VwapSeedRequest)[]).every(key=>seed.request[key]===request[key])||seed.basisDate!==basisDate||seed.start!==vwapSeedStart(request,seed.events)||seed.anchorKey!==vwapAnchorKey(easternClock(request.before*1000).date,request.anchor,seed.events?.dates)||!Number.isFinite(seed.volume)||seed.volume<0||seed.start===request.before&&seed.volume!==0||!seed.sums)return false;
 if(!PRICE_SOURCES.every(source=>{
  const sum=seed.sums[source];
  if(source==='hlcc4'&&sum===undefined)return true;
  return typeof sum==='number'&&Number.isFinite(sum)&&(seed.volume===0?sum===0:sum>0);
 }))return false;
 if(seed.moments!==undefined){
  if(!seed.moments||typeof seed.moments!=='object'||Array.isArray(seed.moments))return false;
  for(const source of PRICE_SOURCES){
   const moment=seed.moments[source];
   if(!moment||!Number.isFinite(moment.mean)||moment.mean<0||!Number.isFinite(moment.m2)||moment.m2<0)return false;
   if(!seed.volume){if(moment.mean!==0||moment.m2!==0)return false;continue;}
   const sum=seed.sums[source]??(seed.sums.hlc3*0.75+seed.sums.close*0.25),expected=sum/seed.volume;
   if(Math.abs(moment.mean-expected)>Math.max(1,Math.abs(expected))*1e-9)return false;
  }
 }
 return true;
}
