// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES,type Candle} from './candles';
import type {ChartIndicator} from './chart-preferences';
import {indicatorValues} from './chart-indicators';
const bars=(values:number[],step:number):Candle[]=>values.map((close,n)=>({time:1700000000+n*step,open:close,high:close,low:close,close,volume:100}));
const study=(type:ChartIndicator['type'],options:Partial<ChartIndicator>={}):ChartIndicator=>({id:'test',type,period:3,color:'#2962ff',width:2,...options});
for(const frame of CHART_TIMEFRAMES){
 const step={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400}[frame];
 it(`uses Wilder RSI changes and conventional zero-loss handling on ${frame}`,()=>{
  const values=indicatorValues(bars([1,2,1,3,2,5],step),study('RSI'),frame)[0].points.map(point=>point.value);
  expect(values[0]).toBeCloseTo(75,12);expect(values[1]).toBeCloseTo(600/11,12);expect(values[2]).toBeCloseTo(3900/49,12);
  for(const [input,expected]of [[[1,2,3,4],100],[[4,3,2,1],0],[[2,2,2,2],100]] as const)expect(indicatorValues(bars([...input],step),study('RSI'),frame)[0].points[0].value).toBe(expected);
 });
 it(`calculates MACD line, signal and unscaled histogram on ${frame}`,()=>{
  const parts=indicatorValues(bars([1,2,4],step),study('MACD',{fastLength:2,slowLength:3,signalLength:2}),frame);
  expect(parts.every(part=>part.points.length===3)).toBe(true);
  for(const [index,expected]of [[0,[0,1/6,17/36]],[1,[0,1/9,19/54]],[2,[0,1/18,13/108]]] as const)for(let n=0;n<3;n++)expect(parts[index].points[n].value).toBeCloseTo(expected[n],12);
 });
 it(`calculates standard Bollinger SMA basis and population bands on ${frame}`,()=>{
  const parts=indicatorValues(bars([1,2,4],step),study('Bollinger',{deviation:2}),frame);
  expect(parts[0].points[0].value).toBeCloseTo(7/3,12);
  expect(parts[1].points[0].value).toBeCloseTo(7/3+2*Math.sqrt(14/9),12);
  expect(parts[2].points[0].value).toBeCloseTo(7/3-2*Math.sqrt(14/9),12);
 });
}
