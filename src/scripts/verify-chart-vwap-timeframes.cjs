// Isolated VWAP checkpoint: actual shared chart and editor, no server/provider/account.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild'),cp=require('node:child_process');
const {chromium}=require('playwright');
async function main(){
 const sourceRef=process.env.TRADERLINK_SOURCE_REF;if(sourceRef&&!/^[0-9a-f]{40}$/.test(sourceRef))throw Error('Invalid immutable source reference');
 const sourcePlugin=sourceRef?{name:'immutable-source',setup(build){build.onLoad({filter:/\.(tsx?|json)$/,namespace:'file'},args=>{const relative=path.relative(process.cwd(),args.path);if(relative.startsWith('..')||relative.startsWith('node_modules/'))return;return {contents:cp.execFileSync('git',['show',sourceRef+':'+relative],{encoding:'utf8'}),loader:relative.endsWith('.json')?'json':relative.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)};});}}:null;
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=()=>root.render(<ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol="TEST"/></ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[...(sourcePlugin?[sourcePlugin]:[]),{name:'observe-public-series',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{}};new Function('module','exports',(await esbuild.build({stdin:{contents:"export{parseVwapSeedRequest,vwapSeedStart}from'./src/modules/scanner/alpaca/chart-vwap-seed';export{easternClock}from'./src/modules/scanner/live/sessions';export{vwapAnchorKey}from'./src/modules/scanner/alpaca/chart-indicators';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',plugins:sourcePlugin?[sourcePlugin]:[]})).outputFiles[0].text)(fixtureModule,fixtureModule.exports);
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
     if(!preferences)preferences=await page.evaluate(()=>({...window.__defaults,premarket:false,postmarket:false}));
     if(route.request().method()==='POST'){preferences=route.request().postDataJSON().preferences;revision++;}
     return route.fulfill({json:{preferences,revision,ownerKey:'isolated-vwap'}});
    }
    if(url.pathname==='/api/charts/vwap-seed'){
     const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams),year=request.anchor==='Year';
     return route.fulfill({json:{complete:true,request,basisDate:fixtureModule.exports.easternClock(Date.now()).date,anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor),start:fixtureModule.exports.vwapSeedStart(request),volume:year?200:0,sums:year?{open:2600,high:3800,low:2200,close:3000,hl2:3000,hlc3:3000,ohlc4:2900}:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
     const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     const midnight=Date.parse(date+'T05:00:00Z')/1000;
     const bars=Array.from({length:390},(_,n)=>{const value=n<195?10:20;return {time:midnight+570*60+n*60,open:value,high:value,low:value,close:value,volume:1};});
     const sessions=[-3,0,1,2,3,4].map(n=>({date:new Date(Date.parse(date+'T12:00:00Z')+n*86400000).toISOString().slice(0,10),open:'09:30',close:'16:00'}));
     const calendar={available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions};
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[{time:midnight-3*86400,open:20,high:20,low:20,close:20,volume:390},{time:midnight,open:20,high:20,low:20,close:20,volume:390}]:bars,nextBefore:null,adjustment:'split',basisDate:fixtureModule.exports.easternClock(Date.now()).date,calendar,calendars:[calendar]}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;this.closed=false;(window.__sources??=[]).push(this);}close(){this.closed=true;}};});
   await page.goto('https://vwap-fixture.invalid/');
   await page.getByRole('button',{name:'Indicators',exact:true}).click();
   await page.getByRole('button',{name:'Add VWAP',exact:true}).click();
   await page.getByRole('button',{name:'Close chart preferences'}).click();
   const expected={'1m':15,'5m':15,'15m':15,'1h':580/39,'4h':700/39,'1D':20};
   const select=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
   const waitSaved=async test=>{for(let n=0;n<250;n++){if(test())return;await new Promise(resolve=>setTimeout(resolve,20));}throw Error('Saved preferences did not settle');};
   const waitValue=async value=>page.waitForFunction(value=>{const points=window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data();return points?.length&&Math.abs(points.at(-1).value-value)<1e-9;},value,{timeout:15000});
   for(const chartFrame of Object.keys(expected)){
    await page.getByRole('button',{name:`TEST ${chartFrame} candles`,exact:true}).click();
    for(const calculationFrame of Object.keys(expected))for(const wait of [true,false]){
     await page.getByRole('button',{name:'Indicators',exact:true}).click();
     await select('Calculation timeframe',calculationFrame);
     await page.getByRole('checkbox',{name:'Wait for timeframe closes',exact:true}).setChecked(wait);
     await page.getByRole('button',{name:'Close chart preferences'}).click();
     console.log("CHECK",chartFrame,calculationFrame,wait);
     try{await waitValue(expected[calculationFrame]);}catch(error){console.error(await page.evaluate(()=>({text:document.body.innerText.slice(-1800),series:window.__charts?.find(c=>!c.removed)?.series.map(s=>({title:s.options().title,last:s.data().at(-1),length:s.data().length}))})));throw error;}
     await waitSaved(()=>preferences.indicators[0].calculationTimeframe===calculationFrame&&(preferences.indicators[0].waitForClose??true)===wait);
     assert.equal(preferences.indicators[0].calculationTimeframe,calculationFrame);
     assert.equal(preferences.indicators[0].waitForClose??true,wait);
    }
    console.log('PASS actual shared renderer',chartFrame,'all six calculation frames / wait true+false');
    await page.getByRole('button',{name:'Indicators',exact:true}).click();await select('Calculation timeframe',chartFrame);
    for(const offset of [2,-1,0]){
     const input=page.getByRole('spinbutton',{name:'Offset',exact:true});await input.fill(String(offset));await input.press('Tab');
     await page.getByRole('button',{name:'Close chart preferences'}).click();await waitValue(expected[chartFrame]);
     const rendered=await page.evaluate(()=>{const entry=window.__charts.find(c=>!c.removed);const scale=entry.chart.timeScale(),last=entry.series.find(s=>s.options().title==='VWAP').data().at(-1).time,lastCandle=entry.series[0].data().at(-1).time;return {last,lastCandle,logicalDistance:scale.coordinateToLogical(scale.timeToCoordinate(last))-scale.coordinateToLogical(scale.timeToCoordinate(lastCandle))};});
     assert.equal(Math.sign(rendered.last-rendered.lastCandle),Math.sign(offset),`${chartFrame} signed offset`);
     assert.ok(Math.abs(rendered.logicalDistance-offset)<1e-7,`${chartFrame} exact offset positions: ${rendered.logicalDistance}`);
     await waitSaved(()=>(preferences.indicators[0].offset??0)===offset);
     assert.equal(preferences.indicators[0].offset??0,offset);
     await page.getByRole('button',{name:'Indicators',exact:true}).click();
    }
    await page.getByRole('button',{name:'Close chart preferences'}).click();
   }
   await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();
   await page.getByRole('button',{name:'Indicators',exact:true}).click();await select('Calculation timeframe','1D');
   await page.getByRole('checkbox',{name:'Wait for timeframe closes',exact:true}).uncheck();await page.getByRole('button',{name:'Close chart preferences'}).click();await waitValue(20);
   await page.evaluate(()=>{const source=window.__sources.findLast(s=>!s.closed&&s.url.endsWith('daily=1'));if(!source)throw Error('Missing daily calculation stream');const chart=window.__charts.find(c=>!c.removed),time=chart.series[0].data()[0].time;const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(time*1000);source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:true,bar:{time:Date.parse(date+'T05:00:00Z')/1000,open:30,high:30,low:30,close:30,volume:390}})}));});
   await waitValue(30);console.log('PASS authoritative daily live event updates minute-chart VWAP');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS VWAP renderer timeframe/offset integration checkpoint. Partial catalog/settings QA, not any final pass.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
