import { expect, it, vi } from "vitest";
import { MoomooChartHistory } from "./server/moomoo-chart-history";
import type { DurableTradeCorrections, TradeCorrectionRange } from "../scanner/alpaca/durable-trade-corrections";

const start=Date.parse("2026-11-27T12:02:00Z"), minute=start/1000;
const old={time:minute,open:3.21,high:38,low:3.21,close:12.85,volume:696132};
const corrected={time:minute,open:3.21,high:3.8399,low:3.21,close:3.82,volume:390678};
const native={time:minute+60,open:3.5,high:31,low:3.5,close:3.6,volume:7000};

it("reprojects old raw POM data on warm and cold reads while keeping incompatible native rows",async()=>{
  const loader=vi.fn(async request=>{
    if(request.operation==="rehab") return {data:{rehabs:[{action_types:["JOIN"],ex_div_date:"2026-12-01",split_ratio:2}]}};
    return {data:{kline_list:[old,native].map(bar=>({...bar,time_key:(bar.time+60)*1000})),next_time:null}};
  });
  const evidence:DurableTradeCorrections={symbol:"POM",feed:"sip",adjustment:"raw",generation:0,rows:[]};
  const read=vi.fn<(range:TradeCorrectionRange)=>Promise<DurableTradeCorrections>>().mockResolvedValue(evidence);
  const now=()=>Date.parse("2026-12-07T14:00:00Z");
  const query={symbol:"POM",timeframe:"1Min" as const,start,end:start+119_000};
  const adapter=new MoomooChartHistory(loader,now,read);
  expect((await adapter.history({...query,adjustment:"raw"})).bars).toEqual([old,native]);
  const revision=start+60_000;
  evidence.generation=revision;
  evidence.rows=[{symbol:"POM",minute,bar:corrected,before:old,correctionRevision:revision}];
  expect((await adapter.history({...query,adjustment:"raw"})).bars).toEqual([corrected,native]);
  expect((await adapter.rawHistory(query)).bars).toEqual([old,native]);
  const split=await adapter.history(query);
  expect(split.bars[0]).toEqual({time:minute,open:6.42,high:7.6798,low:6.42,close:7.64,volume:195339});
  expect(loader.mock.calls.filter(([request])=>request.operation==="history")).toHaveLength(1);
  expect(read.mock.calls.at(-1)?.[0]).toEqual({symbol:"POM",start,end:start+119_001});
  const reopened=new MoomooChartHistory(loader,now,read);
  expect((await reopened.history({...query,adjustment:"raw"})).bars).toEqual([corrected,native]);
  evidence.generation=revision+1;
  evidence.rows.push({symbol:"POM",minute,bar:null,correctionRevision:revision+1});
  expect((await reopened.history({...query,adjustment:"raw"})).bars).toEqual([native]);
});

it("repairs a complete native 15-minute interval and a separately witnessed Daily row",async()=>{
  const start = Date.parse("2026-11-27T12:00:00Z"), time=start/1000;
  const after={time:minute+60,open:4,high:4,low:4,close:4,volume:5};
  const fifteen={...old,time,high:38,close:4,volume:olderVolume()}, dailyStart=Date.parse("2026-11-27T05:00:00Z")/1000;
  const daily={time:dailyStart,open:4,high:5,low:4,close:4.5,volume:5000000};
  const fixedDaily={...daily,volume:4694546};
  function olderVolume(){return old.volume+after.volume;}
  const evidence:DurableTradeCorrections={symbol:"POM",feed:"sip",adjustment:"raw",generation:start+900_000,
    nativeDays:[{day:daily.time,before:daily,bar:fixedDaily}],
    rows:[{symbol:"POM",minute,bar:corrected,before:old,correctionRevision:start+900_000}]};
  const loader=vi.fn(async request=>{
    const row=(value:typeof daily, seconds:number)=>({...value,time_key:(value.time+seconds)*1000});
    return {data:{kline_list:request.timeframe==="1Min"?[row(old,60),row(after,60)]:
      request.timeframe==="15Min"?[row(fifteen,900)]:[row(daily,0)],next_time:null}};
  });
  const adapter=new MoomooChartHistory(loader,()=>Date.parse("2026-12-07T14:00:00Z"),async()=>evidence);
  expect((await adapter.history({symbol:"POM",timeframe:"15Min",start,end:start+899_000,adjustment:"raw"})).bars)
    .toEqual([{...fifteen,high:4,volume:corrected.volume+after.volume}]);
  expect((await adapter.history({symbol:"POM",timeframe:"1Day",start:dailyStart*1000,end:start+86_400_000,adjustment:"raw"})).bars)
    .toEqual([fixedDaily]);
});
