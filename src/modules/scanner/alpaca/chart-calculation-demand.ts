import {easternDayStart} from './candles';

/** A visible chart window, with one neighbouring slot for line continuity. */
export function calculationDemand(axis:readonly {time:number}[],range:{from:number;to:number}|null,now=Date.now()/1000):{before:number;through?:number}|null{
 if(!axis.length)return null;
 if(range&&(!Number.isFinite(range.from)||!Number.isFinite(range.to)||range.from>range.to))throw Error('invalid_calculation_view');
 const first=Math.max(0,Math.min(axis.length-1,Math.floor(range?.from??Math.max(0,axis.length-100))-1));
 const last=Math.max(first,Math.min(axis.length-1,Math.ceil(range?.to??axis.length-1)+1));
 const before=easternDayStart(axis[first].time),lastDay=easternDayStart(axis[last].time);
 // An older viewport starts its request at that period, not at today's date.
 const through=lastDay<easternDayStart(now)?easternDayStart(lastDay+36*3600)-1:undefined;
 return {before,...(through!==undefined?{through}:{})};
}
