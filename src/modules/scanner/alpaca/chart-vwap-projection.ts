import type {IndicatorPoint} from './chart-indicators';

/** Quiet display slots do not add volume or interpolate a fictitious VWAP move. */
export function carryVwapPoints(points:readonly IndicatorPoint[],axis:readonly {time:number;carried?:boolean}[],sameAnchor:(previous:number,current:number)=>boolean):IndicatorPoint[]{
 const result:IndicatorPoint[]=[];let index=-1;
 for(const slot of axis){
  while(index+1<points.length&&points[index+1].time<=slot.time)index++;
  const point=points[index];if(!point)continue;
  if(point.time===slot.time)result.push(point);
  else if(slot.carried&&sameAnchor(point.time,slot.time))result.push({time:slot.time,value:point.value});
 }
 return result;
}

/** Real chart-axis positions, including verified future positions when supplied. */
export function offsetVwap(points:readonly IndicatorPoint[],axis:readonly number[],offset:number):IndicatorPoint[]{
 if(!Number.isSafeInteger(offset))throw Error('invalid_vwap_offset');
 for(let n=0;n<axis.length;n++)if(!Number.isFinite(axis[n])||n>0&&axis[n]<=axis[n-1])throw Error('invalid_vwap_axis');
 const positions=new Map(axis.map((time,index)=>[time,index]));
 return points.flatMap(point=>{
  const position=positions.get(point.time);
  if(position===undefined)throw Error('vwap_point_outside_axis');
  const target=position+offset;
  return target<0||target>=axis.length?[]:[{time:axis[target],value:point.value}];
 });
}

export type VwapChartSlot={time:number;close:number};
export type VwapCalculationPoint=VwapChartSlot&{value:number};

/**
 * Project independently calculated values without leaking a completed higher
 * candle into earlier chart bars. Close timestamps must come from session facts,
 * not the next observed trade (sparse stocks can have large trading gaps).
 * Offsets are applied to the projected chart axis afterwards.
 */
export function projectVwap(
 chart:readonly VwapChartSlot[],calculation:readonly VwapCalculationPoint[],
 options:{higherTimeframe:boolean;waitForClose:boolean;now:number},
):IndicatorPoint[]{
 const validate=(slots:readonly VwapChartSlot[])=>{
  for(let n=0;n<slots.length;n++){
   const slot=slots[n];
   if(!Number.isFinite(slot.time)||!Number.isFinite(slot.close)||slot.close<=slot.time||n>0&&(slots[n-1].time>=slot.time||slots[n-1].close>slot.time))throw Error('invalid_vwap_intervals');
  }
 };
 validate(chart);validate(calculation);
 if(!Number.isFinite(options.now)||calculation.some(point=>!Number.isFinite(point.value)))throw Error('invalid_vwap_projection');
 const result:IndicatorPoint[]=[];
 let confirmed=-1,developing=0;
 for(const slot of chart){
  if(slot.time>options.now)break;
  const previous=confirmed,through=Math.min(slot.close,options.now);
  while(confirmed+1<calculation.length&&calculation[confirmed+1].close<=through)confirmed++;
  const active=slot.time<=options.now&&options.now<slot.close;
  while(developing+1<calculation.length&&calculation[developing+1].time<=(active?options.now:slot.time))developing++;
  const current=calculation[developing];
  const canDevelop=(!options.higherTimeframe||!options.waitForClose)&&active&&current&&current.time<=(options.higherTimeframe?slot.time:options.now)&&current.close>options.now;
  if(canDevelop)result.push({time:slot.time,value:current.value});
  else if(confirmed>=0&&(!options.higherTimeframe||!options.waitForClose||confirmed!==previous&&calculation[confirmed].close>slot.time))result.push({time:slot.time,value:calculation[confirmed].value});
 }
 return result;
}
