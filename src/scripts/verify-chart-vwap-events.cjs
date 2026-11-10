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

 const basisDate='2026-11-10',fixtureNow=Date.parse('2026-11-10T22:00:00Z'),dates=['2026-11-06','2026-11-09','2026-11-10'],errors=[];
 const bars=dates.map((date,n)=>({time:Date.parse(date+'T14:30:00Z')/1000,open:[10,20,40][n],high:[10,20,40][n],low:[10,20,40][n],close:[10,20,40][n],volume:100}));
 const calendar={available:true,start:'2026-01-01',end:'2026-12-31',sessions:dates.map(date=>({date,open:'09:30',close:'16:00'}))};
 try{
  for(const width of [1200,390]){
   let preferences=null,revision=0,splitDates=['2026-11-09'],seedReads=0;
   const page=await browser.newPage({viewport:{width,height:800}});await page.clock.install({time:new Date(fixtureNow)});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.hostname!=='vwap-fixture.invalid')throw Error('Unexpected external request');
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="width:100vw;height:700px"></div><script>'+bundle.outputFiles[0].text+'</script></body></html>'});
    if(url.pathname==='/api/charts/preferences'){
     if(!preferences)preferences=await page.evaluate(()=>window.__defaults);
     if(route.request().method()==='POST'){preferences=route.request().postDataJSON().preferences;revision++;}
     return route.fulfill({json:{preferences,revision,ownerKey:'event-fixture'}});
    }
    if(url.pathname==='/api/charts/vwap-seed'){
     seedReads++;const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams,fixtureNow),eventDates=request.anchor==='Splits'?splitDates:request.anchor==='Dividends'?['2026-11-06','2026-11-10']:null;
     const events=eventDates?{symbol:'TEST',anchor:request.anchor,basisDate,dates:eventDates}:undefined;
     return route.fulfill({json:{complete:true,request,basisDate,anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor,eventDates),start:fixtureModule.exports.vwapSeedStart(request,events),volume:0,sums:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0},...(events?{events}:{})}});
    }
    if(url.pathname==='/api/screeners/charts/bars')return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?bars.map((bar,n)=>({...bar,time:Date.parse(dates[n]+'T05:00:00Z')/1000})):bars,nextBefore:null,adjustment:'split',basisDate,calendar,calendars:[calendar]}});
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;this.closed=false;(window.__sources??=[]).push(this);}close(){this.closed=true;}};});
   await page.goto('https://vwap-fixture.invalid/');
   const open=()=>page.getByRole('button',{name:'Indicators',exact:true}).click();
   const close=async()=>{await page.getByRole('button',{name:'Close chart preferences'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});};
   const select=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
   await open();await page.getByRole('button',{name:'Add VWAP',exact:true}).click();await close();
   for(const [anchor,expected]of [['Splits',30],['Dividends',40]]){
    await open();await select('Anchor Period',anchor);await close();
    for(const frame of ['1m','5m','15m','1h','4h','1D']){
     await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();
     await page.waitForFunction(expected=>Math.abs((window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value??NaN)-expected)<1e-9,expected);
     const points=await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').data());
     if(anchor==='Splits')assert.ok(points.every(point=>point.time>=Date.parse('2026-11-09T05:00:00Z')/1000),'No VWAP before first split');
     console.log('PASS actual event VWAP',width,anchor,frame,points.at(-1).value);
    }
    let reloadExpected=expected;
    if(anchor==='Splits'){
     const previousReads=seedReads;splitDates=['2026-11-09','2026-11-10'];await page.clock.fastForward(301000);
     await page.evaluate(()=>{const source=window.__sources.findLast(source=>!source.closed&&source.url.endsWith('daily=1'));source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:true,bar:{time:Date.parse('2026-11-10T05:00:00Z')/1000,open:40,high:40,low:40,close:40,volume:100}})}));});
     if(process.env.TRADERLINK_EXPECT_STALE_EVENTS==='1'){
      await page.waitForTimeout(500);assert.equal(seedReads,previousReads);assert.equal(await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').data().at(-1).value),30);console.log('PASS reproduced stale event seed cache',width);
     }else{
      await page.waitForFunction(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').data().at(-1)?.value===40);assert.equal(seedReads,previousReads+1);console.log('PASS event fact refresh updates an open chart',width);
     }
     reloadExpected=40;
    }
    await page.reload();await page.waitForFunction(expected=>Math.abs((window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value??NaN)-expected)<1e-9,reloadExpected);
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS native split/dividend anchors across all six frames and desktop/mobile saved reopening; partial VWAP checkpoint.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
