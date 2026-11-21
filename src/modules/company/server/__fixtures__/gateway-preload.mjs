// Native HTTP fixture: deny real provider effects and bind the actual script to an ephemeral loopback port.
import http from 'node:http';
import {syncBuiltinESMExports} from 'node:module';
const original=http.createServer;
http.createServer=function(...args){const server=original.apply(this,args),listen=server.listen;server.listen=function(){return listen.call(this,0,'127.0.0.1');};server.once('listening',()=>process.send?.({type:'ready',port:server.address().port}));return server;};
syncBuiltinESMExports();
let fail=false;
process.on('message',value=>{if(value?.type==='fail'){fail=true;process.send?.({type:'failed-mode'});}});
globalThis.fetch=async input=>{
 const url=new URL(String(input));
 if(!['finnhub.io','data.sec.gov','www.sec.gov'].includes(url.hostname))throw Error('unexpected fixture destination');
 const kind=url.pathname.includes('profile2')?'profile':url.pathname.includes('/metric')?'metrics':url.pathname.includes('company_tickers')?'directory':url.pathname.includes('companyfacts')?'facts':'submissions';
 process.send?.({type:'upstream',kind});
 if(fail)return new Response(JSON.stringify({error:'finnhub upstream private metadata'}),{status:429,headers:{'Retry-After':'60','X-Debug-Provider':'finnhub'}});
 const bodies={profile:{name:'SHF Holdings',ticker:url.searchParams.get('symbol'),floatingShare:.96,marketCapitalization:1.2345,country:'US',currency:'USD',finnhubIndustry:'Financial services',logo:'https://static.finnhub.io/logo.png'},metrics:{symbol:'SHFS',metric:{beta:.9764,'52WeekHigh':25.2,'10DayAverageTradingVolume':462.4228}},directory:{'0':{cik_str:123,ticker:'SHFS',title:'SHF Holdings'}},facts:{cik:123,facts:{'us-gaap':{Assets:{units:{USD:[{val:123456789,end:'2025-12-31',filed:'2026-03-01',accn:'0000000123-26-000001',form:'10-K'}]}}}}},submissions:{name:'SHF Holdings',filings:{recent:{filingDate:['2026-11-19'],form:['8-K'],accessionNumber:['0000000123-26-000001'],primaryDocument:['release.htm']}}}};
 return Response.json(bodies[kind],{headers:{'X-Debug-Provider':'finnhub'}});
};
