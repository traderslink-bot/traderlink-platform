// @vitest-environment node
import {expect,it} from 'vitest';
import {calculationDemand} from './chart-calculation-demand';
const t=(date:string)=>Date.parse(date)/1000;
it('requests the visible daily window rather than all loaded years',()=>{
 const axis=Array.from({length:2000},(_,n)=>({time:t('2020-01-01T12:00:00Z')+n*86400}));
 const demand=calculationDemand(axis,null,t('2026-11-09T22:00:00Z'))!;
 expect(demand.before).toBeGreaterThan(axis[1898].time);
 expect(demand.before).toBeLessThan(axis[1899].time);
 expect(demand.through).toBeGreaterThan(axis.at(-1)!.time);
 expect(demand.through!-demand.before).toBeLessThan(103*86400);
});
it('bounds older panning at its own last day, with neighbouring line positions',()=>{
 const axis=['2026-11-09T05:00:00Z','2026-11-10T05:00:00Z','2026-11-11T05:00:00Z','2026-11-12T05:00:00Z'].map(time=>({time:t(time)}));
 expect(calculationDemand(axis,{from:1,to:1},t('2026-11-20T22:00:00Z'))).toEqual({before:t('2026-11-09T05:00:00Z'),through:t('2026-11-12T05:00:00Z')-1});
 expect(calculationDemand(axis,{from:2,to:20},t('2026-11-12T22:00:00Z'))).toEqual({before:t('2026-11-10T05:00:00Z')});
});
it('uses the real next midnight across DST rather than adding a fixed 24 hours',()=>{
 const axis=[{time:t('2026-11-01T04:00:00Z')}];
 expect(calculationDemand(axis,null,t('2026-11-09T22:00:00Z'))).toEqual({before:t('2026-11-01T04:00:00Z'),through:t('2026-11-02T05:00:00Z')-1});
 expect(calculationDemand([],null)).toBeNull();
 expect(()=>calculationDemand(axis,{from:2,to:1})).toThrow();
});
