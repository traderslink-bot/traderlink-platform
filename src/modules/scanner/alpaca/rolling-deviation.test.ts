// @vitest-environment node
import {expect,it} from 'vitest';
import {rollingDeviation} from './rolling-deviation';
for(const period of [1,2,3,9,20,50,200])it(`matches independent exact integer variance for period ${period}`,()=>{
 const input=Array.from({length:450},(_,n)=>100000000+(n*17)%31);
 const result=rollingDeviation(input,period);
 for(let index=0;index<input.length;index++){
  if(index<period-1){expect(result[index]).toBeNull();continue;}
  let sum=BigInt(0),square=BigInt(0);
  for(const value of input.slice(index-period+1,index+1)){const integer=BigInt(value);sum+=integer;square+=integer*integer;}
  const count=BigInt(period),expected=Math.sqrt(Number(square*count-sum*sum)/Number(count*count));
  expect(Math.abs(result[index]!-expected)).toBeLessThan(0.000001);
 }
});
it('does not leave variance from an old price jump in a later flat window',()=>{
 const result=rollingDeviation([100000000,...Array<number>(20).fill(1)],9);
 expect(result.slice(9)).toEqual(Array<number>(12).fill(0));
});
it('handles the longest supported input and period with constant flat-price deviation',()=>{
 const result=rollingDeviation(Array<number>(150000).fill(100000000),10000);
 expect(result[9998]).toBeNull();expect(result[9999]).toBe(0);expect(result.at(-1)).toBe(0);
});
