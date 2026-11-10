// @vitest-environment node
import {expect,it} from 'vitest';
import {ChartSessionCalendar} from './chart-calendar';
import {calculationInterval,futureCalculationAxis} from './chart-calculation-intervals';
const epoch=(value:string)=>Date.parse(value)/1000;
const regular={premarket:false,regular:true,postmarket:false};
function calendar(date:string,close='16:00'){
 const result=new ChartSessionCalendar();result.merge({available:true,start:date,end:date,sessions:[{date,open:'09:30',close}]});return result;
}
it('clips regular four-hour bars to actual normal and early session ends',()=>{
 expect(calculationInterval(epoch('2026-11-09T18:30:00Z'),'4h',regular,calendar('2026-11-09'))).toEqual({time:epoch('2026-11-09T18:30:00Z'),close:epoch('2026-11-09T21:00:00Z')});
 expect(calculationInterval(epoch('2026-11-27T14:30:00Z'),'4h',regular,calendar('2026-11-27','13:00'))).toEqual({time:epoch('2026-11-27T14:30:00Z'),close:epoch('2026-11-27T18:00:00Z')});
});
it('uses the same 09:30 regular anchor before and after DST',()=>{
 expect(calculationInterval(epoch('2026-10-30T13:30:00Z'),'1h',regular,calendar('2026-10-30'))).toEqual({time:epoch('2026-10-30T13:30:00Z'),close:epoch('2026-10-30T14:30:00Z')});
 expect(calculationInterval(epoch('2026-11-02T14:30:00Z'),'1h',regular,calendar('2026-11-02'))).toEqual({time:epoch('2026-11-02T14:30:00Z'),close:epoch('2026-11-02T15:30:00Z')});
});
it('clips premarket-only and shortened postmarket contexts without requiring another trade',()=>{
 expect(calculationInterval(epoch('2026-11-09T14:00:00Z'),'1h',{premarket:true,regular:false,postmarket:false},calendar('2026-11-09'))).toEqual({time:epoch('2026-11-09T14:00:00Z'),close:epoch('2026-11-09T14:30:00Z')});
 expect(calculationInterval(epoch('2026-11-27T21:00:00Z'),'4h',{premarket:true,regular:true,postmarket:true},calendar('2026-11-27','13:00'))).toEqual({time:epoch('2026-11-27T21:00:00Z'),close:epoch('2026-11-27T22:00:00Z')});
 expect(calculationInterval(epoch('2026-11-27T17:00:00Z'),'4h',{premarket:false,regular:false,postmarket:true},calendar('2026-11-27','13:00'))).toEqual({time:epoch('2026-11-27T17:00:00Z'),close:epoch('2026-11-27T21:00:00Z')});
});
it('rejects missing calendar, closed dates and out-of-session times',()=>{
 expect(()=>calculationInterval(epoch('2026-11-09T14:30:00Z'),'1m',regular,new ChartSessionCalendar())).toThrow('unavailable');
 expect(()=>calculationInterval(epoch('2026-11-09T21:00:00Z'),'1m',regular,calendar('2026-11-09'))).toThrow('outside');
 const closed=new ChartSessionCalendar();closed.merge({available:true,start:'2026-11-08',end:'2026-11-08',sessions:[]});
 expect(()=>calculationInterval(epoch('2026-11-08T15:00:00Z'),'1m',regular,closed)).toThrow('closed');
});
it('extends offset positions across a weekend and early close without creating candles',()=>{
 const known=new ChartSessionCalendar();known.merge({available:true,start:'2026-11-27',end:'2026-11-30',sessions:[{date:'2026-11-27',open:'09:30',close:'13:00'},{date:'2026-11-30',open:'09:30',close:'16:00'}]});
 const last=epoch('2026-11-27T17:59:00Z');
 expect(futureCalculationAxis([last],2,'1m',regular,known)).toEqual([last,epoch('2026-11-30T14:30:00Z'),epoch('2026-11-30T14:31:00Z')]);
 expect(futureCalculationAxis([epoch('2026-11-27T05:00:00Z')],1,'1D',regular,known)).toEqual([epoch('2026-11-27T05:00:00Z'),epoch('2026-11-30T05:00:00Z')]);
 expect(()=>futureCalculationAxis([epoch('2026-11-30T20:59:00Z')],1,'1m',regular,known)).toThrow('coverage_unavailable');
});
