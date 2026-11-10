// Isolated VWAP checkpoint: actual shared chart and editor, no server/provider/account.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild');
const {chromium}=require('playwright');
async function main(){
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=()=>root.render(<ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol="TEST"/></ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'observe-public-series',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{}};new Function('module','exports',esbuild.buildSync({stdin:{contents:"export{parseVwapSeedRequest,vwapSeedStart}from'./src/modules/scanner/alpaca/chart-vwap-seed';export{easternClock}from'./src/modules/scanner/live/sessions';export{vwapAnchorKey}from'./src/modules/scanner/alpaca/chart-indicators';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text)(fixtureModule,fixtureModule.exports);
 const browser=await chromium.launch({headless:true,executablePath:process.env.TRADERLINK_TEST_CHROMIUM});
 let preferences=null,revision=0;const errors=[];
 try{
  for(const width of [1200,390]){
   const page=await browser.newPage({viewport:{width,height:800}});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='vwap-fixture.invalid')throw Error('Unexpected external request');
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="width:100vw;height:700px"></div><script>'+bundle.outputFiles[0].text+'</script></body></html>'});
    if(url.pathname==='/api/charts/preferences'){
     if(!preferences)preferences=await page.evaluate(()=>window.__defaults);
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
     const bars=[{hour:4,value:10,volume:100},{hour:9.5,value:20,volume:200},{hour:9.5+1/60,value:30,volume:0},{hour:16+1/60,value:40,volume:100}].map(row=>({time:Math.round(midnight+row.hour*3600),open:row.value,high:row.value+3,low:row.value-3,close:row.value,volume:row.volume}));
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[{time:midnight,open:10,high:43,low:7,close:40,volume:400}]:bars,nextBefore:null,adjustment:'split',basisDate:fixtureModule.exports.easternClock(Date.now()).date,calendar:{available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions:[{date,open:'09:30',close:'16:00'}]}}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(){super();}close(){}};});
   await page.goto('https://vwap-fixture.invalid/');
   await page.getByRole('button',{name:'Indicators',exact:true}).click();
   if(width===1200){await page.getByRole('button',{name:'Add VWAP',exact:true}).click();}
   assert.equal(await page.getByText(/Eastern day|Resets each Eastern/).count(),0);
   await page.getByRole('button',{name:'Close chart preferences'}).click();
   await page.waitForFunction(()=>window.__charts?.find(c=>!c.removed)?.series.some(s=>s.options().title==='VWAP'&&s.data().length));
   let actual=await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').data().at(-1).value);
   assert.equal(actual,width===1200?22.5:25.5,'cumulative weighted VWAP/source persistence');
   if(width===1200){
    for(const [frame,expected]of [['1m',22.5],['5m',155/6],['15m',155/6],['1h',155/6],['4h',155/6],['1D',30]]){
     await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();
     await page.waitForFunction(expected=>{const value=window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value;return typeof value==='number'&&Math.abs(value-expected)<1e-9;},expected);
     console.log('VWAP timeframe',frame,'PASS',expected);
    }
    await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();
    await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('combobox',{name:'Anchor Period',exact:true}).click();await page.getByRole('option',{name:'Year',exact:true}).click();await page.getByRole('button',{name:'Close chart preferences'}).click();
    for(const [frame,expected]of [['1m',20],['5m',200/9],['15m',200/9],['1h',200/9],['4h',200/9],['1D',25]]){
     await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();
     await page.waitForFunction(expected=>{const value=window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value;return typeof value==='number'&&Math.abs(value-expected)<1e-9;},expected);console.log('VWAP full Year prefix',frame,'PASS',expected);
    }
    await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('combobox',{name:'Anchor Period',exact:true}).click();await page.getByRole('option',{name:'Session',exact:true}).click();await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('combobox',{name:'Source',exact:true}).click();await page.getByRole('option',{name:'High',exact:true}).click();
    await page.getByRole('tab',{name:'Style',exact:true}).click();
    await page.getByRole('checkbox',{name:'VWAP',exact:true}).uncheck();
    await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.waitForFunction(()=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.options().visible===false);
    assert.equal(preferences.indicators[0].source,'high');assert.equal(preferences.indicators[0].plots.main.visible,false);
    await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('tab',{name:'Style',exact:true}).click();await page.getByRole('checkbox',{name:'VWAP',exact:true}).check();await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.waitForFunction(()=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.options().visible===true);
    actual=await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').data().at(-1).value);assert.equal(actual,25.5);
    await page.getByRole('button',{name:'Indicators',exact:true}).click();
    await page.getByRole('checkbox',{name:'Hide VWAP on 1D or above',exact:true}).check();
    await page.getByRole('combobox',{name:'Anchor Period',exact:true}).click();await page.getByRole('option',{name:'Week',exact:true}).click();
    await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.getByRole('button',{name:'TEST 1D candles',exact:true}).click();
    await page.waitForFunction(()=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().length===0);
    assert.equal(preferences.indicators[0].hideOnDaily,true);assert.equal(preferences.indicators[0].anchor,'Week');
    await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();
    await page.waitForFunction(()=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value===25.5);

   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'viewport width containment');
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS isolated actual VWAP renderer/editor: HLC3 cumulative volume, source edit, plot visibility, persisted mobile reopen, no ET/reset notice, no viewport overflow. Not full TradingView feature parity.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
