import {VWAP_BAND_COLORS} from './chart-preferences';
import {addVwapMoment} from './vwap-moments';
import {rollingDeviation} from './rolling-deviation';
import type {VwapSeed} from './chart-vwap-seed';
import type {ChartSessionCalendar} from './chart-calendar';
import type {Candle,ChartTimeframe} from './candles';
import type {ChartIndicator,ChartPreferences,MaType,PriceSource} from './chart-preferences';
export type IndicatorPoint={time:number;value:number};
const sessionClock=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',hourCycle:'h23',year:'numeric',month:'2-digit',day:'2-digit'});
export function isVisibleSession(time:number,p:ChartPreferences,calendar?:ChartSessionCalendar){
 if(calendar){const day=calendar.sessionAt(time);if(!day)return false;const minute=(time-day.start)/60,close=day.closeMinute;if(minute<240||minute>=close+240)return false;return minute<570?p.premarket:minute<close?p.regular:p.postmarket;}
 const parts=Object.fromEntries(sessionClock.formatToParts(time*1000).map(part=>[part.type,part.value])),minute=+parts.hour*60+ +parts.minute;
 return minute<570?p.premarket:minute<960?p.regular:p.postmarket;
}
export function visibleSessionBars(bars:Candle[],p:ChartPreferences,calendar?:ChartSessionCalendar){return bars.filter(bar=>isVisibleSession(bar.time,p,calendar));}
export function movingAverage(values:readonly number[],period:number,type:MaType,volumes:readonly number[]=[]):(number|null)[]{
 let sum=0,weighted=0,volumeTotal=0,previous:number|null=null;
 const triangular=period*(period+1)/2;
 return values.map((value,index)=>{
  // EMA starts from the first observed source; Wilder's RMA uses an SMA seed.
  if(type==='EMA'){previous=previous===null?value:previous+(value-previous)*2/(period+1);return previous;}
  // Shift each old WMA coefficient down by one, then append the newest sample.
  // Both weighted variants stay linear in history size, even at long periods.
  if(type==='WMA')weighted+=index<period?(index+1)*value:period*value-sum;
  if(type==='VWMA'){
   weighted+=value*volumes[index];volumeTotal+=volumes[index];
   if(index>=period){weighted-=values[index-period]*volumes[index-period];volumeTotal-=volumes[index-period];}
  }
  sum+=value;if(index>=period)sum-=values[index-period];if(index<period-1)return null;
  if(type==='SMA')return sum/period;
  if(type==='RMA'){previous=previous===null?sum/period:previous+(value-previous)/period;return previous;}
  if(type==='WMA')return weighted/triangular;
  return volumeTotal?weighted/volumeTotal:null;
 });
}
export function indicatorSource(bar:Candle,source:PriceSource):number{
 if(source==='hl2')return (bar.high+bar.low)/2;
 if(source==='hlc3')return (bar.high+bar.low+bar.close)/3;
 if(source==='ohlc4')return (bar.open+bar.high+bar.low+bar.close)/4;
 if(source==='hlcc4')return (bar.high+bar.low+2*bar.close)/4;
 return bar[source];
}
export type IndicatorPlot={key:string;label:string;points:IndicatorPoint[];pane:boolean;histogram?:boolean;unavailable?:boolean;unavailableReason?:'history'|'numeric'};
type IndicatorContext={vwapSeed?:VwapSeed;calendar?:ChartSessionCalendar};
function baseIndicatorValues(bars:readonly Candle[],i:ChartIndicator,timeframe?:ChartTimeframe,context?:IndicatorContext):IndicatorPlot[]{
 const values=bars.map(bar=>indicatorSource(bar,i.source??(i.type==='VWAP'?'hlc3':'close'))),volumes=bars.map(bar=>bar.volume);
 const points=(values:readonly(number|null)[])=>values.flatMap((value,index)=>value===null?[]:[{time:bars[index].time,value}]);
 if(i.type==='EMA'||i.type==='SMA')return [{key:'main',label:`${i.type} ${i.period}`,points:points(movingAverage(values,i.period,i.type,volumes)),pane:false}];
 if(i.type==='VWAP'){
  const seed=context?.vwapSeed,source=i.source??'hlc3',bands=i.vwapBands,needDeviation=bands?.mode==='Standard deviation'&&bands.levels.some(level=>level.enabled);
  // The weighted HLCC4 sum is linear in HLC3 and close, including legacy seeds.
  let total=seed?(seed.sums[source]??(source==='hlcc4'?seed.sums.hlc3*0.75+seed.sums.close*0.25:0)):0,volume=seed?.volume??0,anchor=seed?.anchorKey??'';
  let totalCompensation=0,volumeCompensation=0,momentReady=!volume||!!seed?.moments?.[source],missingBandHistory=false;
  const moment={...(seed?.moments?.[source]??{mean:0,m2:0})};
  const invalidBandValues=[false,false,false];
  const result:IndicatorPoint[]=[],upper:IndicatorPoint[][]=[[],[],[]],lower:IndicatorPoint[][]=[[],[],[]];
  const plots=():IndicatorPlot[]=>[{key:'main',label:'VWAP',pane:false,points:result},...(bands?bands.levels.flatMap((level,n)=>[
   {key:`upper-${n+1}`,label:`Upper Band #${n+1}`,pane:false,points:invalidBandValues[n]?[]:upper[n],...(level.enabled&&(missingBandHistory||invalidBandValues[n])?{unavailable:true,unavailableReason:invalidBandValues[n]?'numeric' as const:'history' as const}:{})},
   {key:`lower-${n+1}`,label:`Lower Band #${n+1}`,pane:false,points:invalidBandValues[n]?[]:lower[n],...(level.enabled&&(missingBandHistory||invalidBandValues[n])?{unavailable:true,unavailableReason:invalidBandValues[n]?'numeric' as const:'history' as const}:{})},
  ]):[])];
  if(i.hideOnDaily&&timeframe==='1D')return plots();
  const fmt=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'});
  let lastDate='',lastKey='';
  for(let n=0;n<bars.length;n++){
   const bar=bars[n],known=context?.calendar?.sessionAt(bar.time);
   if(context?.calendar&&!known)continue;
   const date=known?.session.date??fmt.format(bar.time*1000);
   if(date!==lastDate){lastDate=date;lastKey=vwapAnchorKey(date,i.anchor??'Session',seed?.events?.dates);}
   if(!lastKey)continue;
   if(lastKey!==anchor){anchor=lastKey;total=0;volume=0;totalCompensation=0;volumeCompensation=0;moment.mean=0;moment.m2=0;momentReady=true;}
   if(needDeviation&&momentReady)addVwapMoment(moment,volume,values[n],bar.volume);
   const totalDelta=values[n]*bar.volume-totalCompensation,nextTotal=total+totalDelta;
   totalCompensation=(nextTotal-total)-totalDelta;total=nextTotal;
   const volumeDelta=bar.volume-volumeCompensation,nextVolume=volume+volumeDelta;
   volumeCompensation=(nextVolume-volume)-volumeDelta;volume=nextVolume;
   if(!volume)continue;
   const mean=total/volume;result.push({time:bar.time,value:mean});
   if(!bands)continue;
   if(bands.mode==='Standard deviation'&&!momentReady){if(bands.levels.some(level=>level.enabled))missingBandHistory=true;continue;}
   const unit=bands.mode==='Percentage'?mean*0.01:Math.sqrt(Math.max(0,moment.m2/volume));
   for(let level=0;level<3;level++)if(bands.levels[level].enabled){
    const distance=unit*bands.levels[level].multiplier;
    if(!Number.isFinite(distance)||!Number.isFinite(mean+distance)||!Number.isFinite(mean-distance)){invalidBandValues[level]=true;continue;}
    upper[level].push({time:bar.time,value:mean+distance});lower[level].push({time:bar.time,value:mean-distance});
   }
  }
  return plots();
 }
 if(i.type==='RSI'){
  let gain=0,loss=0;const result:IndicatorPoint[]=[];
  for(let n=1;n<bars.length;n++){const delta=values[n]-values[n-1];if(n<=i.period){gain+=Math.max(0,delta)/i.period;loss+=Math.max(0,-delta)/i.period;}else{gain=(gain*(i.period-1)+Math.max(0,delta))/i.period;loss=(loss*(i.period-1)+Math.max(0,-delta))/i.period;}if(n>=i.period)result.push({time:bars[n].time,value:loss===0?100:100-100/(1+gain/loss)});}
  const levels=i.levels??{upper:70,middle:50,lower:30};
  return [{key:'main',label:`RSI ${i.period}`,points:result,pane:true},...(['upper','middle','lower'] as const).map(key=>({key,label:`RSI ${key}`,points:result.length?[{time:result[0].time,value:levels[key]},{time:result.at(-1)!.time,value:levels[key]}].filter((point,index,array)=>!index||point.time!==array[0].time):[],pane:true}))];
 }
 if(i.type==='MACD'){
  const fastLength=i.fastLength??12,slowLength=i.slowLength??26,signalLength=i.signalLength??9;
  const fast=movingAverage(values,fastLength,i.oscillatorMa??'EMA'),slow=movingAverage(values,slowLength,i.oscillatorMa??'EMA');
  const line=bars.flatMap((bar,n)=>fast[n]!==null&&slow[n]!==null?[{time:bar.time,value:fast[n]!-slow[n]!}]:[]);
  const signal=movingAverage(line.map(point=>point.value),signalLength,i.signalMa??'EMA');
  return [{key:'main',label:`MACD ${fastLength}/${slowLength}`,points:line,pane:true},{key:'signal',label:`Signal ${signalLength}`,points:line.flatMap((bar,n)=>signal[n]===null?[]:[{time:bar.time,value:signal[n]!}]),pane:true},{key:'histogram',label:'Histogram',histogram:true,points:line.flatMap((bar,n)=>signal[n]===null?[]:[{time:bar.time,value:bar.value-signal[n]!}]),pane:true}];
 }
 const middle=movingAverage(values,i.period,i.basisMa??'SMA',volumes),deviation=i.deviation??2;
 const distance=rollingDeviation(values,i.period).map(value=>value===null?null:deviation*value);
 return [{key:'main',label:`BB ${i.period}, ${deviation}`,points:points(middle),pane:false},{key:'upper',label:'Upper band',points:points(middle.map((value,n)=>value===null||distance[n]===null?null:value+distance[n]!)),pane:false},{key:'lower',label:'Lower band',points:points(middle.map((value,n)=>value===null||distance[n]===null?null:value-distance[n]!)),pane:false}];
}
export function indicatorPlotStyle(indicator:ChartIndicator,key:string){
 const reference=indicator.type==='RSI'&&['upper','middle','lower'].includes(key),band=indicator.type==='VWAP'&&/^(upper|lower)-[123]$/.test(key),bandEnabled=!band||indicator.vwapBands?.levels[Number(key.at(-1))-1]?.enabled===true;
 return {visible:indicator.visible!==false&&indicator.plots?.[key]?.visible!==false&&bandEnabled,color:indicator.plots?.[key]?.color??(band?VWAP_BAND_COLORS[Number(key.at(-1))-1]:reference?'#888888':key==='signal'?'#42a5f5':indicator.color),width:indicator.plots?.[key]?.width??(reference||band?1:indicator.width),style:indicator.plots?.[key]?.style??(reference?2:0)} as const;
}
export function indicatorHistogramColor(indicator:ChartIndicator,value:number,previous:number,up:string,down:string){
 const key=value>=0?(value>=previous?'positive-rising':'positive-falling'):(value>=previous?'negative-rising':'negative-falling');
 return indicator.plots?.[key]?.color??(value>=0?up:down);
}

export function indicatorValues(bars:readonly Candle[],indicator:ChartIndicator,timeframe?:ChartTimeframe,context?:IndicatorContext):IndicatorPlot[]{
 const parts=baseIndicatorValues(bars,indicator,timeframe,context),smoothing=indicator.smoothing;
 if(!smoothing||smoothing.type==='None'||!['EMA','SMA','RSI'].includes(indicator.type))return parts;
 const primary=parts[0],values=primary.points.map(point=>point.value),volumeByTime=new Map(bars.map(bar=>[bar.time,bar.volume])),volumes=primary.points.map(point=>volumeByTime.get(point.time)??0);
 const averages=movingAverage(values,smoothing.length,smoothing.type==='SMA+BB'?'SMA':smoothing.type,volumes);
 const mapPoints=(data:readonly(number|null)[])=>data.flatMap((value,n)=>value===null?[]:[{time:primary.points[n].time,value}]);
 const pane=primary.pane;
 parts.push({key:'smoothing',label:`${smoothing.type==='SMA+BB'?'SMA':smoothing.type} ${smoothing.length}`,pane,points:mapPoints(averages)});
 if(smoothing.type==='SMA+BB'){
  const spread=rollingDeviation(values,smoothing.length).map(value=>value===null?null:smoothing.deviation*value);
  parts.push({key:'smoothing-upper',label:'Smoothing upper band',pane,points:mapPoints(averages.map((mean,n)=>mean===null?null:mean+spread[n]!))},{key:'smoothing-lower',label:'Smoothing lower band',pane,points:mapPoints(averages.map((mean,n)=>mean===null?null:mean-spread[n]!))});
 }
 return parts;
}

export function vwapAnchorKey(date:string,anchor:NonNullable<ChartIndicator['anchor']>,events?:readonly string[]):string{
 if(anchor==='Splits'||anchor==='Dividends'){if(!events)throw Error('vwap_event_facts_unavailable');let low=0,high=events.length;while(low<high){const mid=(low+high)>>>1;if(events[mid]<=date)low=mid+1;else high=mid;}return events[low-1]??'';}
 const [year,month]=date.split('-').map(Number);
 if(anchor==='Session')return date;
 if(anchor==='Week'){const day=new Date(date+'T00:00:00Z');day.setUTCDate(day.getUTCDate()-(day.getUTCDay()+6)%7);return day.toISOString().slice(0,10);}
 if(anchor==='Month')return date.slice(0,7);
 if(anchor==='Quarter')return `${year}-Q${Math.floor((month-1)/3)+1}`;
 if(anchor==='Year')return String(year);
 return String(year-year%(anchor==='Decade'?10:100));
}
