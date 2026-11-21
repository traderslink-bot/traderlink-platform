import { expect, it } from "vitest";
import { BrowserChartFrames, browserChartEvent } from "./server/browser-chart-events";

it("projects live price, bar and halt events without changing facts or forwarding routing/error fields", () => {
  const clock="2026-11-19T14:35:00.000Z", bar={time:1795098900,open:.0288,high:.0291,low:.0287,close:.029,volume:50000};
  expect(browserChartEvent("price",{price:.029,time:clock,provider:"alpaca",sourceUrl:"https://private.invalid"})).toEqual({type:"price",data:{price:.029,time:clock}});
  expect(browserChartEvent("bar",{bar:{...bar,provider:"alpaca"},daily:false,provisional:true})).toEqual({type:"bar",data:{bar,daily:false,provisional:true}});
  const status={symbol:"SHFS",halted:true,haltedAt:clock,observedAt:clock,reasonCode:"LUDP",reason:"Volatility trading pause",quoteResumedAt:clock,tradeResumedAt:null};
  expect(browserChartEvent("trading-status",{symbol:"SHFS",available:true,status:{...status,provider:"alpaca"}})).toEqual({type:"trading-status",data:{symbol:"SHFS",available:true,status}});
  expect(browserChartEvent("overnight-status",{state:"closed",provider:"boats"})).toEqual({type:"overnight-status",data:{state:"closed"}});
});

it("handles fragmented UTF-8/CRLF SSE, strips upstream errors, and bounds an unfinished frame", () => {
  const frames=new BrowserChartFrames(),encoder=new TextEncoder(),decoder=new TextDecoder();
  expect(frames.write(encoder.encode('event: price\r\ndata: {"price":0.029,"time":"2026-11-19T14:35:00Z","provider":"alpaca"}\r'))).toHaveLength(0);
  const output=decoder.decode(frames.write(encoder.encode('\n\r\nevent: error\ndata: {"message":"moomoo token=private-value","url":"https://api.finnhub.io"}\n\n: alpaca heartbeat\n\n')));
  expect(output).toContain('"price":0.029');expect(output).toContain('"state":"unavailable"');expect(output).toContain(': heartbeat');
  expect(output).not.toMatch(/alpaca|moomoo|finnhub|private-value/);
  expect(()=>frames.write(encoder.encode('x'.repeat(128001)))).toThrow('chart_frame_too_large');
});

it("keeps recovery adjustment/date fields and converts unknown connection errors to the fixed state", () => {
  expect(browserChartEvent('status',{state:'connected',adjustment:'split',basisDate:'2026-11-19',error:'alpaca_private'})).toEqual({type:'status',data:{state:'connected',adjustment:'split',basisDate:'2026-11-19'}});
  expect(browserChartEvent('status',{state:'alpaca_auth_failed'})).toEqual({type:'status',data:{state:'unavailable'}});
});


it("contains malformed objects placed inside otherwise known event fields", () => {
  const failures = [browserChartEvent('price',{price:{provider:'finnhub'},time:'2026-11-19T14:35:00Z'}),
    browserChartEvent('bar',{daily:false,bar:{time:1795098900,open:.028,high:.03,low:.027,close:{provider:'alpaca'},volume:100}}),
    browserChartEvent('trading-status',{symbol:'SHFS',available:true,status:{symbol:'SHFS',halted:true,observedAt:'2026-11-19T14:35:00Z',reason:{provider:'alpaca'}}})];
  for (const failure of failures) expect(failure).toEqual({type:'status',data:{state:'unavailable'}});
  expect(browserChartEvent('status',{state:'connected',basisDate:{provider:'alpaca'},adjustment:{provider:'moomoo'}})).toEqual({type:'status',data:{state:'connected'}});
});
