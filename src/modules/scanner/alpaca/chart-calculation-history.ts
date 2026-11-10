import type {Candle,ChartTimeframe} from './candles';
import {ChartSessionCalendar} from './chart-calendar';

type HistoryPage={bars:Candle[];basisDate:string;nextBefore:number|null;calendar?:unknown;calendars?:unknown[]};
export type CalculationHistory={bars:Candle[];basisDate:string;calendar:ChartSessionCalendar};
type State={bars:Map<number,Candle>;live:Map<number,Candle>;loaded:boolean;basisDate:string;through?:number;nextBefore:number|null;calendar:ChartSessionCalendar;abort:AbortController;pending?:Promise<void>};
export const CALCULATION_HISTORY_LIMIT=150000;
const firstTime=(bars:Map<number,Candle>)=>{let first=Infinity;for(const time of bars.keys())first=Math.min(first,time);return first;};
function validBar(bar:Candle):boolean{
 return !!bar&&[bar.time,bar.open,bar.high,bar.low,bar.close,bar.volume].every(Number.isFinite)&&bar.time>0&&bar.volume>=0&&bar.low>=0&&bar.low<=Math.min(bar.open,bar.close)&&bar.high>=Math.max(bar.open,bar.close);
}

/** Per-chart, abortable contexts. Daily SIP bars stay separate from minute bars. */
export class ChartCalculationHistory{
 private states=new Map<boolean,State>();
 constructor(private readonly symbol:string,private readonly signal:AbortSignal,private readonly basis:()=>string,private readonly fetchPage:(url:string,init:RequestInit)=>Promise<Response>=(url,init)=>fetch(url,init)){}

 /** Reconnects require fresh authoritative history; old requests cannot rejoin. */
 invalidate():void{for(const state of this.states.values())state.abort.abort();this.states.clear();}

 acceptLive(bar:Candle,daily:boolean):void{
  if(this.signal.aborted||!validBar(bar))return;
  const state=this.states.get(daily)??this.state(daily);
  if(state.basisDate!==this.basis())return;
  if(state.through!==undefined&&bar.time>state.through)return;
  if(!state.bars.has(bar.time)&&state.bars.size>=CALCULATION_HISTORY_LIMIT)return;
  state.bars.set(bar.time,bar);state.live.set(bar.time,bar);
 }

 private state(daily:boolean,through?:number):State{
  let state=this.states.get(daily);
  if(!state||state.basisDate!==this.basis()||state.through!==through){
   state?.abort.abort();
   state={bars:new Map(),live:new Map(),loaded:false,basisDate:this.basis(),through,nextBefore:null,calendar:new ChartSessionCalendar(),abort:new AbortController()};
   this.states.set(daily,state);
  }
  return state;
 }

 async read(timeframe:ChartTimeframe,before:number,through?:number):Promise<CalculationHistory>{
  if(!Number.isFinite(before)||before<=0||through!==undefined&&(!Number.isSafeInteger(through)||through<before))throw Error('invalid_calculation_history_range');
  const daily=timeframe==='1D',state=this.state(daily,through);
  while(state.pending)await state.pending;
  if(!state.loaded||firstTime(state.bars)>before&&state.nextBefore!==null){
   const job=this.load(state,daily,before);state.pending=job;
   try{await job;}finally{if(state.pending===job)state.pending=undefined;}
  }
  if(this.signal.aborted)throw Error('calculation_history_aborted');
  if(this.states.get(daily)!==state)throw Error('calculation_history_invalidated');
  if(state.basisDate!==this.basis())throw Error('calculation_history_basis_changed');
  return {bars:[...state.bars.values()].sort((a,b)=>a.time-b.time),basisDate:state.basisDate,calendar:state.calendar};
 }

 private async load(state:State,daily:boolean,before:number):Promise<void>{
  let initial=!state.loaded;
  for(let pageCount=0;pageCount<64;pageCount++){
   if(this.signal.aborted)throw Error('calculation_history_aborted');
   const query=new URLSearchParams({history:'1',symbol:this.symbol,daily:daily?'1':'0'});
   if(initial&&state.through!==undefined)query.set('before',String(state.through*1000));
   if(!initial&&state.nextBefore!==null)query.set('before',String(state.nextBefore));
   let response:Response;
   try{response=await this.fetchPage('/api/screeners/charts/bars?'+query,{signal:AbortSignal.any([this.signal,state.abort.signal,AbortSignal.timeout(20_000)]),credentials:'same-origin',cache:'no-store'});}
   catch(error){if(state.abort.signal.aborted)throw Error('calculation_history_invalidated');throw error;}
   if(!response.ok)throw Error('calculation_history_unavailable');
   const page=await response.json() as HistoryPage;
   if(this.signal.aborted)throw Error('calculation_history_aborted');
   if(this.states.get(daily)!==state)throw Error('calculation_history_invalidated');
   if(state.basisDate!==this.basis()||page.basisDate!==state.basisDate)throw Error('calculation_history_basis_changed');
   if(!Array.isArray(page.bars)||page.bars.length>CALCULATION_HISTORY_LIMIT||!page.bars.every(bar=>validBar(bar)&&(state.through===undefined||bar.time<=state.through))||page.nextBefore!==null&&(!Number.isFinite(page.nextBefore)||page.nextBefore<=0))throw Error('invalid_calculation_history');
   if(!initial&&page.nextBefore!==null&&page.nextBefore>=state.nextBefore!)throw Error('calculation_history_cursor_stalled');
   const combined=new Map(state.bars);
   for(const bar of page.bars)if(!state.live.has(bar.time))combined.set(bar.time,bar);
   if(combined.size>CALCULATION_HISTORY_LIMIT)throw Error('calculation_history_limit');
   state.bars=combined;state.nextBefore=page.nextBefore;state.calendar.merge(page.calendar);
   if(Array.isArray(page.calendars)&&page.calendars.length<=11)for(const calendar of page.calendars)state.calendar.merge(calendar);
   state.loaded=true;initial=false;
   if(page.nextBefore===null||firstTime(state.bars)<=before)return;
  }
  throw Error('calculation_history_page_limit');
 }
}
