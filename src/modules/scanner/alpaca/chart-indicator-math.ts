import type { Candle } from './candles';
import type { MaType, PriceSource } from './chart-preferences';

type CompensatedTotal = { sum: number; correction: number };

function addToTotal(total: CompensatedTotal, value: number): void {
 const next = total.sum + value;
 total.correction += Math.abs(total.sum) >= Math.abs(value)
  ? (total.sum - next) + value
  : (value - next) + total.sum;
 total.sum = next;
}

function volumeWeightedAverage(values: readonly number[], period: number, volumes: readonly number[]): (number | null)[] {
 const volume = { sum: 0, correction: 0 };
 const weighted = { sum: 0, correction: 0 };
 let positiveWeights = 0;
 return values.map((value, index) => {
  const expired = index - period;
  if (expired >= 0 && volumes[expired] > 0) {
   positiveWeights--;
   addToTotal(volume, -volumes[expired]);
   addToTotal(weighted, -values[expired] * volumes[expired]);
  }
  // Clear rounding residue when an old nonzero window expires.
  if (positiveWeights === 0) {
   volume.sum = volume.correction = 0;
   weighted.sum = weighted.correction = 0;
  }
  const weight = volumes[index];
  if (weight > 0) {
   positiveWeights++;
   addToTotal(volume, weight);
   addToTotal(weighted, value * weight);
  }
  if (index < period - 1 || positiveWeights === 0) return null;
  return (weighted.sum + weighted.correction) / (volume.sum + volume.correction);
 });
}

export function movingAverage(values:readonly number[],period:number,type:MaType,volumes:readonly number[]=[]):(number|null)[]{
 if(type==='VWMA')return volumeWeightedAverage(values,period,volumes);
 let sum=0,weighted=0,previous:number|null=null;
 const triangular=period*(period+1)/2;
 return values.map((value,index)=>{
  // EMA starts from the first observed source; Wilder's RMA uses an SMA seed.
  if(type==='EMA'){previous=previous===null?value:previous+(value-previous)*2/(period+1);return previous;}
  // Shift each old WMA coefficient down by one, then append the newest sample.
  // Both weighted variants stay linear in history size, even at long periods.
  if(type==='WMA')weighted+=index<period?(index+1)*value:period*value-sum;
  sum+=value;if(index>=period)sum-=values[index-period];if(index<period-1)return null;
  if(type==='SMA')return sum/period;
  if(type==='RMA'){previous=previous===null?sum/period:previous+(value-previous)/period;return previous;}
  return weighted/triangular;
 });
}
export function indicatorSource(bar:Candle,source:PriceSource):number{
 if(source==='hl2')return (bar.high+bar.low)/2;
 if(source==='hlc3')return (bar.high+bar.low+bar.close)/3;
 if(source==='ohlc4')return (bar.open+bar.high+bar.low+bar.close)/4;
 if(source==='hlcc4')return (bar.high+bar.low+2*bar.close)/4;
 return bar[source];
}
