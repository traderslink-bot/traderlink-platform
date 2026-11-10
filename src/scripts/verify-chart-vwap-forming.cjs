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

 const errors=[];
 const date='2026-11-09',midnight=Date.parse(date+'T05:00:00Z')/1000,previous=midnight-3*86400;
 const minute=(hour,min)=>midnight+hour*3600+min*60;
 const flat=(time,value,volume=1)=>({time,open:value,high:value,low:value,close:value,volume});
 const cases=[['1m','5m',9,32,9,35],['5m','15m',9,36,9,45],['15m','1h',9,46,10,30],['1h','4h',10,0,13,30],['4h','1D',10,0,16,0],['1D','1m',9,45,9,46]];
 try{
  for(const [chartFrame,calculationFrame,hour,min,closeHour,closeMin]of cases){
   let preferences=null,revision=0;
   const now=minute(hour,min),boundary=minute(closeHour,closeMin),currentDaily={time:midnight,open:10,high:30,low:10,close:20,volume:100};
   const history=[flat(previous+959*60,5,100),...Array.from({length:(now-minute(9,30))/60},(_,n)=>flat(minute(9,30)+n*60,10))];
   const calendar={available:true,start:'2026-01-01',end:'2026-12-31',sessions:[{date:'2026-11-06',open:'09:30',close:'16:00'},{date,open:'09:30',close:'16:00'}]};
   const page=await browser.newPage({viewport:{width:1200,height:800}});await page.clock.install({time:new Date(now*1000)});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());if(url.hostname!=='vwap-fixture.invalid')throw Error('Unexpected external request');
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="width:100vw;height:700px"></div><script>'+bundle.outputFiles[0].text+'</script></body></html>'});
    if(url.pathname==='/api/charts/preferences'){
     if(!preferences)preferences=await page.evaluate(({chartFrame,calculationFrame})=>({...window.__defaults,timeframe:chartFrame,premarket:false,postmarket:false,indicators:[{id:'forming',type:'VWAP',period:20,color:'#2962ff',width:1,source:'hlc3',anchor:'Session',calculationTimeframe:calculationFrame,waitForClose:true}]}),{chartFrame,calculationFrame});
     if(route.request().method()==='POST'){preferences=route.request().postDataJSON().preferences;revision++;}
     return route.fulfill({json:{preferences,revision,ownerKey:'forming-fixture'}});
    }
    if(url.pathname==='/api/charts/vwap-seed'){
     const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams);
     return route.fulfill({json:{complete:true,request,basisDate:date,anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor),start:fixtureModule.exports.vwapSeedStart(request),volume:0,sums:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}}});
    }
    if(url.pathname==='/api/screeners/charts/bars')return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[flat(previous,5,100),currentDaily]:history,nextBefore:null,adjustment:'split',basisDate:date,calendar,calendars:[calendar]}});
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;this.closed=false;(window.__sources??=[]).push(this);queueMicrotask(()=>this.dispatchEvent(new MessageEvent('status',{data:JSON.stringify({state:'connected'})})));}close(){this.closed=true;}};});
   await page.goto('https://vwap-fixture.invalid/');
   const last=()=>page.evaluate(()=>window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1));
   const wait=expected=>page.waitForFunction(expected=>{const value=window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value;return Math.abs((value??NaN)-expected)<1e-8;},expected,{timeout:15000});
   const emit=()=>page.evaluate(({now,currentDaily})=>{for(const source of window.__sources.filter(s=>!s.closed)){const daily=source.url.endsWith('daily=1'),bar=daily?currentDaily:{time:now,open:20,high:20,low:20,close:20,volume:1};source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily,bar})}));}},{now,currentDaily});
   const toggle=async value=>{await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('checkbox',{name:'Wait for timeframe closes',exact:true}).setChecked(value);await page.getByRole('button',{name:'Close chart preferences'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});};
   const lower=chartFrame==='1D',developing=lower?10.625:calculationFrame==='1D'?20:50/3;
   await wait(lower?10:5);await emit();await wait(lower?developing:5);
   await toggle(false);await emit();await wait(developing);
   await toggle(true);await emit();await wait(lower?developing:5);
   const before=await last();
   const clock=await page.evaluate(()=>Date.now());await page.clock.fastForward(boundary*1000-clock+1100);
   await wait(developing);
   const after=await last();assert.ok(after.time>=before.time);
   console.log('PASS native forming/close',chartFrame,calculationFrame,JSON.stringify({developing,before,after}));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS higher-frame confirmation boundaries and immediate lower-minute updates on daily chart; partial VWAP checkpoint.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
