import { expect, it } from "vitest";
import { browserChartHistory } from "./server/browser-chart-history";
const bar={time:1795098900,open:.028,high:.03,low:.027,close:.029,volume:50000};
const calendar={available:true,start:'2026-11-19',end:'2026-11-19',sessions:[{date:'2026-11-19',open:'09:30',close:'16:00'}]};
it('removes nested calendar, session and candle metadata while retaining every market fact',()=>{
 const input={symbol:'SHFS',adjustment:'split',basisDate:'2026-11-19',complete:true,bars:[{...bar,provider:'alpaca'}],calendar:{...calendar,source:'finnhub',sessions:[{...calendar.sessions[0],provider:'moomoo'}]},calendars:[{...calendar,provider:'alpaca'}]};
 const before=JSON.stringify(input),result=browserChartHistory(input);
 expect(result).toEqual({symbol:'SHFS',adjustment:'split',basisDate:'2026-11-19',complete:true,feed:'traderslink',bars:[bar],calendar,calendars:[calendar]});
 expect(JSON.stringify(result)).not.toMatch(/alpaca|moomoo|finnhub/);expect(JSON.stringify(input)).toBe(before);
});
it('does not forward malformed history values or private error payloads as numeric facts',()=>{
 for(const field of ['open','high','low','close','volume','time'])expect(()=>browserChartHistory({bars:[{...bar,[field]:{provider:'alpaca'}}]})).toThrow('invalid_chart_bar');
 expect(()=>browserChartHistory({bars:[bar],nextBefore:{provider:'alpaca'}})).toThrow('invalid_chart_history');
 expect(browserChartHistory({bars:[bar],calendar:{available:true,error:'alpaca'}}).calendar).toEqual({available:false});
});
