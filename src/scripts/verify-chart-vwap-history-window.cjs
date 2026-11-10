// Isolated VWAP checkpoint: actual shared chart and editor, no server/provider/account.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild'),cp=require('node:child_process');
const {chromium}=require('playwright');
async function main(){
 const sourceRef=process.env.TRADERLINK_SOURCE_REF;if(sourceRef&&!/^[0-9a-f]{40}$/.test(sourceRef))throw Error('Invalid immutable source reference');
 const sourcePlugin=sourceRef?{name:'immutable-source',setup(build){build.onLoad({filter:/\.(tsx?|json)$/,namespace:'file'},args=>{const relative=path.relative(process.cwd(),args.path);if(relative.startsWith('..')||relative.startsWith('node_modules/'))return;return {contents:cp.execFileSync('git',['show',sourceRef+':'+relative],{encoding:'utf8'}),loader:relative.endsWith('.json')?'json':relative.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)};});}}:null;
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=()=>root.render(<ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol="TEST"/></ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[...(sourcePlugin?[sourcePlugin]:[]),{name:'observe-public-series',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{}};new Function('module','exports',(await esbuild.build({stdin:{contents:"export{parseVwapSeedRequest,vwapSeedStart}from'./src/modules/scanner/alpaca/chart-vwap-seed';export{easternClock}from'./src/modules/scanner/live/sessions';export{vwapAnchorKey}from'./src/modules/scanner/alpaca/chart-indicators';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',plugins:sourcePlugin?[sourcePlugin]:[]})).outputFiles[0].text)(fixtureModule,fixtureModule.exports);
 const dateNow=fixtureModule.exports.easternClock(Date.now()).date;
 const midnightFor=date=>{const noon=Date.parse(date+'T12:00:00Z'),hour=Number(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',hourCycle:'h23'}).format(noon));return noon/1000-hour*3600;};
 const sessions=[];for(let n=0;sessions.length<2500;n++){const day=new Date(Date.parse(dateNow+'T12:00:00Z')-n*86400000);if([0,6].includes(day.getUTCDay()))continue;const date=day.toISOString().slice(0,10);sessions.push({date,open:'09:30',close:'16:00',time:midnightFor(date)});}sessions.reverse();
 const calendars=Object.entries(Object.groupBy(sessions,row=>row.date.slice(0,4))).map(([year,rows])=>({available:true,start:year+'-01-01',end:year+'-12-31',sessions:rows.map(({date,open,close})=>({date,open,close}))}));
 const dailyBars=sessions.map(row=>({time:row.time,open:10,high:10,low:10,close:10,volume:960})),minuteRequests=[];
 const browser=await chromium.launch({headless:true,executablePath:process.env.TRADERLINK_TEST_CHROMIUM});
 let preferences=null,revision=0;const errors=[];
 try{
  for(const width of [1200]){
   const page=await browser.newPage({viewport:{width,height:800}});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='vwap-fixture.invalid')throw Error('Unexpected external request');
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="width:100vw;height:700px"></div><script>'+bundle.outputFiles[0].text+'</script></body></html>'});
    if(url.pathname==='/api/charts/preferences'){
     if(!preferences)preferences=await page.evaluate(()=>({...window.__defaults,timeframe:'1D',indicators:[{id:'depth-vwap',type:'VWAP',period:20,color:'#2962ff',width:1,calculationTimeframe:'1m',waitForClose:false}]}));
     if(route.request().method()==='POST'){preferences=route.request().postDataJSON().preferences;revision++;}
     return route.fulfill({json:{preferences,revision,ownerKey:'isolated-vwap'}});
    }
    if(url.pathname==='/api/charts/vwap-seed'){
     const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams),year=request.anchor==='Year';
     return route.fulfill({json:{complete:true,request,basisDate:fixtureModule.exports.easternClock(Date.now()).date,anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor),start:fixtureModule.exports.vwapSeedStart(request),volume:year?200:0,sums:year?{open:2600,high:3800,low:2200,close:3000,hl2:3000,hlc3:3000,ohlc4:2900}:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
     if(url.searchParams.get('daily')==='1')return route.fulfill({json:{bars:dailyBars,nextBefore:null,basisDate:dateNow,calendars}});
     const cursor=url.searchParams.has('before')?Number(url.searchParams.get('before')):Date.now();minuteRequests.push(cursor);
     const end=sessions.findLastIndex(row=>row.time*1000<=cursor),rows=[];
     for(let n=Math.max(0,end-22);n<=end;n++)for(let minute=240;minute<1200;minute++){
      const time=sessions[n].time+minute*60;if(time*1000<=cursor)rows.push({time,open:10,high:10,low:10,close:10,volume:1});
     }
     const retained=rows.slice(-(url.searchParams.has('before')?14400:9600));
     const years=new Set(retained.map(row=>fixtureModule.exports.easternClock(row.time*1000).date.slice(0,4)));
     return route.fulfill({json:{bars:retained,nextBefore:retained[0]?.time>sessions[0].time+240*60?retained[0].time*1000-1:null,basisDate:dateNow,calendars:calendars.filter(row=>years.has(row.start.slice(0,4)))}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;this.closed=false;(window.__sources??=[]).push(this);}close(){this.closed=true;}};});
   const started=Date.now();await page.goto('https://vwap-fixture.invalid/');
   const snapshot=()=>page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),points=c.series.find(s=>s.options().title==='VWAP')?.data()??[];return {points:points.length,first:points[0]?.time,last:points.at(-1)?.time,value:points.at(-1)?.value};});
   await page.waitForFunction(time=>{const c=window.__charts?.find(c=>!c.removed),p=c?.series.find(s=>s.options().title==='VWAP')?.data();return p?.length&&p.at(-1).time===time;},sessions.at(-1).time,{timeout:45000});
   const current=await snapshot();assert.ok(current.points>=95&&current.points<=105);assert.equal(current.value,10);assert.ok(minuteRequests.length<=12);
   assert.ok(Math.min(...minuteRequests)>=sessions[2380].time*1000,'Only a visible window plus bounded page overfetch, not all loaded daily years');
   console.log('PASS 2500-day chart / visible minute VWAP',JSON.stringify({elapsedMs:Date.now()-started,current,requests:minuteRequests.length}));
   const earlierStart=minuteRequests.length;
   await page.evaluate(()=>window.__charts.find(c=>!c.removed).chart.timeScale().setVisibleLogicalRange({from:1000,to:1100}));
   await page.waitForFunction(time=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.time===time,sessions[1101].time,{timeout:45000});
   const older=await snapshot();assert.equal(older.value,10);assert.ok(older.points<=105);assert.ok(minuteRequests[earlierStart]<sessions[1103].time*1000,'Old viewport request starts at its own end');
   console.log('PASS historical panning requests its own period',JSON.stringify({older,newRequests:minuteRequests.length-earlierStart}));
   const last=sessions.at(-1),lastMinute=Math.min(last.time+959*60,Math.floor(Date.now()/60000)*60),dayVolume=Math.floor((lastMinute-last.time)/60)-240+1;
   await page.evaluate(bar=>{const source=window.__sources.findLast(s=>!s.closed&&s.url.endsWith('daily=0'));source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:false,bar})}));},{time:lastMinute,open:11,high:11,low:11,close:11,volume:1});
   await page.waitForTimeout(100);assert.deepEqual(await snapshot(),older,'Current live corrections cannot move an older viewport to today');
   const updated=Date.now();await page.evaluate(()=>window.__charts.find(c=>!c.removed).chart.timeScale().setVisibleLogicalRange({from:2400,to:2504}));
   await page.waitForFunction(expected=>{const p=window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1);return p&&Math.abs(p.value-expected)<1e-9;},10+1/dayVolume,{timeout:15000});
   console.log('PASS returning to current period retains live correction',JSON.stringify({elapsedMs:Date.now()-updated,current:await snapshot()}));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS realistic history-window integration; not final indicator QA.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
