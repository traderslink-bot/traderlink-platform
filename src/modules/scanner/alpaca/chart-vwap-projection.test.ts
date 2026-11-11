import { indicatorReadoutIndex } from "./chart-vwap-projection";
// @vitest-environment node
import {expect,it} from 'vitest';
import {CHART_TIMEFRAMES} from './candles';
import {carryVwapPoints,offsetVwap,projectVwap} from './chart-vwap-projection';

it('holds the last computed value through quiet slots without changing a reset or a higher-frame gap',()=>{
 const points=[{time:100,value:10},{time:280,value:20}];
 const axis=[{time:40,carried:true},{time:100},{time:160,carried:true},{time:220,carried:true},{time:280},{time:340,carried:true},{time:400}];
 expect(carryVwapPoints(points,axis,(_previous,current)=>current<340)).toEqual([{time:100,value:10},{time:160,value:10},{time:220,value:10},{time:280,value:20}]);
 expect(points).toEqual([{time:100,value:10},{time:280,value:20}]);
 expect(carryVwapPoints([],axis,()=>true)).toEqual([]);
});

it('offsets by chart positions, preserving missing-volume slots and weekend jumps',()=>{
 const axis=[100,160,220,300000,300060];
 const points=[{time:100,value:10},{time:220,value:20},{time:300000,value:30}];
 expect(offsetVwap(points,axis,0)).toEqual(points);
 expect(offsetVwap(points,axis,1)).toEqual([{time:160,value:10},{time:300000,value:20},{time:300060,value:30}]);
 expect(offsetVwap(points,axis,-1)).toEqual([{time:160,value:20},{time:220,value:30}]);
 expect(offsetVwap(points,axis,9)).toEqual([]);
 expect(()=>offsetVwap(points,[100,100],1)).toThrow();
 expect(()=>offsetVwap(points,axis,0.5)).toThrow();
});

it('waits for a higher candle close and never backfills its final value into earlier slots',()=>{
 const chart=Array.from({length:10},(_,n)=>({time:n*60,close:(n+1)*60}));
 const values=[{time:0,close:300,value:10},{time:300,close:600,value:20}];
 expect(projectVwap(chart,values,{higherTimeframe:true,waitForClose:true,now:599})).toEqual([{time:240,value:10}]);
 expect(projectVwap(chart,values,{higherTimeframe:true,waitForClose:true,now:600})).toEqual([{time:240,value:10},{time:540,value:20}]);
 expect(projectVwap(chart,values,{higherTimeframe:true,waitForClose:false,now:599})).toEqual([
  {time:240,value:10},{time:300,value:10},{time:360,value:10},{time:420,value:10},{time:480,value:10},{time:540,value:20},
 ]);
});

it('clips confirmation to the supplied early-close boundary instead of a nominal four hours',()=>{
 const chart=[{time:0,close:3600},{time:3600,close:7200},{time:7200,close:12600}];
 const values=[{time:0,close:12600,value:17}];
 expect(projectVwap(chart,values,{higherTimeframe:true,waitForClose:true,now:12599})).toEqual([]);
 expect(projectVwap(chart,values,{higherTimeframe:true,waitForClose:true,now:12600})).toEqual([{time:7200,value:17}]);
});
it('uses the developing lower-frame value on an open daily candle regardless of wait-for-close',()=>{
 const chart=[{time:0,close:86400}],values=[{time:600,close:660,value:10},{time:660,close:720,value:20}];
 for(const waitForClose of [true,false])expect(projectVwap(chart,values,{higherTimeframe:false,waitForClose,now:690})).toEqual([{time:0,value:20}]);
});

for(const chartFrame of CHART_TIMEFRAMES)for(const calculationFrame of CHART_TIMEFRAMES){
 it(`projects ${calculationFrame} calculations on ${chartFrame} without lookahead`,()=>{
  const seconds={'1m':60,'5m':300,'15m':900,'1h':3600,'4h':14400,'1D':86400};
  const step=seconds[chartFrame],size=seconds[calculationFrame],end=Math.max(step,size)*2;
  const chart=Array.from({length:end/step},(_,n)=>({time:n*step,close:(n+1)*step}));
  const values=Array.from({length:end/size},(_,n)=>({time:n*size,close:(n+1)*size,value:n+1}));
  for(const waitForClose of [true,false]){
   const result=projectVwap(chart,values,{higherTimeframe:size>step,waitForClose,now:end});
   for(const point of result){
    const slot=chart.find(row=>row.time===point.time)!;
    const expected=Math.floor(slot.close/size);
    expect(point.value).toBe(expected);
    if(size>step&&waitForClose)expect(slot.close%size).toBe(0);
   }
   expect(result.at(-1)?.value).toBe(end/size);
  }
 });
}

it("keeps the VWAP readout on carried halt candles, then uses the resumed value",()=>{
  const halt=Date.parse("2026-11-11T16:15:00Z")/1000;
  const points=[{time:halt-60,value:0.94},{time:halt+300,value:0.99}];
  expect(indicatorReadoutIndex(points,halt,true)).toBe(0);
  expect(indicatorReadoutIndex(points,halt+240,true)).toBe(0);
  expect(indicatorReadoutIndex(points,halt+300,false)).toBe(1);
  expect(indicatorReadoutIndex(points,undefined,false)).toBe(1);
  expect(indicatorReadoutIndex(points,halt,false)).toBe(-1);
  expect(indicatorReadoutIndex(points,halt+86400,true)).toBe(-1);
});
