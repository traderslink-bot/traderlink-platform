// @vitest-environment node
import {expect,it} from 'vitest';
import {addVwapMoment} from './vwap-moments';
it('calculates weighted population variance instead of sample or cumulative-line variance',()=>{
 const moment={mean:0,m2:0};addVwapMoment(moment,0,10,100);addVwapMoment(moment,100,20,200);
 expect(moment.mean).toBeCloseTo(50/3,12);
 expect(moment.m2/300).toBeCloseTo(200/9,12);
});
it('preserves small spreads around a large split-adjusted historical price',()=>{
 const moment={mean:0,m2:0};addVwapMoment(moment,0,100000000-1,1);addVwapMoment(moment,1,100000000+1,1);
 expect(moment.mean).toBe(100000000);expect(moment.m2/2).toBe(1);
});
it('ignores zero volume and rejects invalid state rather than inventing a deviation',()=>{
 const moment={mean:10,m2:2};addVwapMoment(moment,100,900,0);expect(moment).toEqual({mean:10,m2:2});
 expect(()=>addVwapMoment(moment,100,20,-1)).toThrow();
 expect(()=>addVwapMoment({mean:NaN,m2:0},1,20,1)).toThrow();
});
