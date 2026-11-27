import { expect, it, vi } from "vitest";
vi.mock("./server/moomoo-bridge", () => ({ requestMoomooMarketData: vi.fn(), moomooDate: (value: number) => new Intl.DateTimeFormat("en-CA", { timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit" }).format(value) }));
import { adjustMoomooBars, moomooChartBar, moomooSplits, MoomooChartHistory } from "./server/moomoo-chart-history";
import { moomooCalendarSessions } from "./moomoo-calendar";
import type { MoomooDataRequest } from "./server/moomoo-bridge";
const at = (value: string) => Date.parse(value);
const candle = { time_key: at("2026-11-17T14:31:00Z"),open:1,high:1.2,low:0.9,close:1.1,volume:1000 };

it("converts native end labels and daily trading dates without moving fills across a day boundary", () => {
  expect(moomooChartBar(candle, false)?.time).toBe(at("2026-11-17T14:30:00Z")/1000);
  const daily = moomooChartBar({ ...candle, time_key: at("2026-11-17T00:00:00Z"), date:20261117 }, true)!;
  expect(new Date(daily.time*1000).toISOString()).toBe("2026-11-17T05:00:00.000Z");
  expect(moomooChartBar({time_key:Date.now()+60000},false)).toBeNull();
  expect(()=>moomooChartBar({...candle,low:2},false)).toThrow("invalid_moomoo_candle");
});
it("adjusts prices and shares for splits and reverse splits while excluding cash dividends", () => {
  const splits=moomooSplits({data:{rehabs:[{ex_div_date:"2026-11-17",action_types:["JOIN"],split_ratio:10},{ex_div_date:"2026-11-16",action_types:["DIVIDEND"],split_ratio:1}]}});
  expect(splits).toEqual([{date:"2026-11-17",ratio:10}]);
  const raw=moomooChartBar({...candle,time_key:at("2026-11-16T14:31:00Z")},false)!;
  expect(adjustMoomooBars([raw],splits,"2026-11-17")[0]).toMatchObject({open:10,close:11,volume:100});
  expect(adjustMoomooBars([raw],[{date:"2026-11-17",ratio:0.5}],"2026-11-17")[0]).toMatchObject({open:0.5,volume:2000});
  expect(adjustMoomooBars([raw],[{date:"2026-11-18",ratio:10}],"2026-11-17")[0]).toEqual(raw);
});
it("keeps token pagination parameters, coalesces viewers, and stops repeated cursors", async () => {
  const requests:MoomooDataRequest[]=[];const token="a".repeat(48);
  const loader=vi.fn(async(input:MoomooDataRequest)=>{
    requests.push(input);
    if(input.operation==="rehab")return {ret_code:0,data:{rehabs:[]}};
    if(input.operation!=="history")throw Error();
    return input.pageToken?{ret_code:0,data:{kline_list:[{...candle,time_key:at("2026-11-17T14:30:00Z")}]},pagination:{has_more:false}}:
      {ret_code:0,data:{kline_list:[candle],next_time:at("2026-11-17T14:30:00Z")},pagination:{has_more:true,next_page_token:token}};
  });
  const history=new MoomooChartHistory(loader,()=>at("2026-11-17T15:00:00Z"));
  const input={symbol:"AAA",timeframe:"1Min" as const,start:at("2026-11-17T14:00:00Z"),end:at("2026-11-17T14:59:59Z")};
  const [first,second]=await Promise.all([history.history(input),history.history(input)]);
  expect(first).toBe(second);expect(first.feed).toBe("moomoo");expect(first.bars).toHaveLength(2);
  expect(requests.filter(row=>row.operation==="history")).toHaveLength(2);
  expect(requests[1]).toMatchObject({...input,pageToken:token,nextTime:at("2026-11-17T14:30:00Z")});
  const repeated=new MoomooChartHistory(async()=>({ret_code:0,data:{kline_list:[candle],next_time:at("2026-11-17T14:30:00Z")},pagination:{has_more:true}}));
  await expect(repeated.history(input)).rejects.toThrow("repeated_moomoo_cursor");
});
it("uses actual calendar sessions and half-day close times, rejecting unknown or duplicate days",()=>{
  const payload={data:{trading_days:[{time:"2026-11-27",trade_date_type:"MORNING",trade_second:12600},{time:"2026-11-25",trade_date_type:"WHOLE",trade_second:23400}]}};
  expect(moomooCalendarSessions(payload,"2026-11-01","2026-11-30")).toEqual([{date:"2026-11-25",open:"09:30",close:"16:00"},{date:"2026-11-27",open:"09:30",close:"13:00"}]);
  expect(()=>moomooCalendarSessions({data:{trading_days:[{time:"2026-11-25",trade_date_type:"UNKNOWN"}]}},"2026-11-01","2026-11-30")).toThrow();
  expect(()=>moomooCalendarSessions({data:{trading_days:[payload.data.trading_days[0],payload.data.trading_days[0]]}},"2026-11-01","2026-11-30")).toThrow();
});

it("does not apply duplicate split rows twice or accept impossible/conflicting dates",()=>{
 const event={ex_div_date:"2026-11-17",action_types:["JOIN"],split_ratio:10};
 expect(moomooSplits({data:{rehabs:[event,event]}})).toEqual([{date:"2026-11-17",ratio:10}]);
 expect(()=>moomooSplits({data:{rehabs:[{...event,ex_div_date:"2026-02-31"}]}})).toThrow("invalid_moomoo_split");
 expect(()=>moomooSplits({data:{rehabs:[event,{...event,split_ratio:2}]}})).toThrow("conflicting_moomoo_split");
});

it("accepts a 1,000-row provider page and filters it to the requested range", async () => {
  const start = at("2026-11-17T14:30:00Z");
  const page = Array.from({ length: 1000 }, (_, index) => ({
    ...candle, time_key: start + (index - 3) * 60_000,
  }));
  const input = { symbol: "SPY", timeframe: "1Min" as const, start, end: start + 120_000, adjustment: "raw" as const };
  const load = vi.fn(async () => ({ ret_code: 0, data: { kline_list: page }, pagination: { has_more: false } }));
  const history = new MoomooChartHistory(load, () => at("2026-11-18T01:00:00Z"));

  const result = await history.history(input);
  expect(result.complete).toBe(true);
  expect(result.bars.map(bar => bar.time)).toEqual([start / 1000, start / 1000 + 60, start / 1000 + 120]);
  expect(load).toHaveBeenCalledOnce();

  const oversize = new MoomooChartHistory(async () => ({ data: { kline_list: [...page, candle] } }));
  await expect(oversize.history(input)).rejects.toThrow("invalid_moomoo_history");
});
