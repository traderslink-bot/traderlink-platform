// Isolated VWAP checkpoint: actual shared chart and editor, no server/provider/account.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild'),cp=require('node:child_process');
const {chromium}=require('playwright');
async function main(){
 const sourceRef=process.env.TRADERLINK_SOURCE_REF;if(sourceRef&&!/^[0-9a-f]{40}$/.test(sourceRef))throw Error('Invalid immutable source reference');
 const sourcePlugin=sourceRef?{name:'immutable-source',setup(build){build.onLoad({filter:/\.(tsx?|json)$/,namespace:'file'},args=>{const relative=path.relative(process.cwd(),args.path);if(relative.startsWith('..')||relative.startsWith('node_modules/'))return;return {contents:cp.execFileSync('git',['show',sourceRef+':'+relative],{encoding:'utf8'}),loader:relative.endsWith('.json')?'json':relative.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)};});}}:null;
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=()=>root.render(<ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol="TEST"/></ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[...(sourcePlugin?[sourcePlugin]:[]),{name:'observe-public-series',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);const set=series.setData.bind(series);series.setData=values=>{series.__testInput=structuredClone(values);return set(values);};entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{}};new Function('module','exports',(await esbuild.build({stdin:{contents:"export{parseVwapSeedRequest,vwapSeedStart}from'./src/modules/scanner/alpaca/chart-vwap-seed';export{easternClock}from'./src/modules/scanner/live/sessions';export{vwapAnchorKey}from'./src/modules/scanner/alpaca/chart-indicators';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',plugins:sourcePlugin?[sourcePlugin]:[]})).outputFiles[0].text)(fixtureModule,fixtureModule.exports);
 const browser=await chromium.launch({headless:true,executablePath:process.env.TRADERLINK_TEST_CHROMIUM});
 let preferences=null,revision=0,calendarReads=0;const errors=[];
 try{
  for(const width of [1200,390]){
   preferences=null;revision=0;calendarReads=0;
   const page=await browser.newPage({viewport:{width,height:800}});await page.clock.install({time:new Date('2026-12-31T23:00:00Z')});page.on('pageerror',error=>errors.push(error.message));
   await page.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.hostname!=='vwap-fixture.invalid')throw Error('Unexpected external request');
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="width:100vw;height:700px"></div><script>'+bundle.outputFiles[0].text+'</script></body></html>'});
    if(url.pathname==='/api/charts/preferences'){
     if(!preferences)preferences=await page.evaluate(()=>window.__defaults);
     if(route.request().method()==='POST'){preferences=route.request().postDataJSON().preferences;revision++;}
     return route.fulfill({json:{preferences,revision,ownerKey:'isolated-vwap'}});
    }
    if(url.pathname==='/api/charts/calendar'){
     calendarReads++;const year=Number(url.searchParams.get('year'));assert.ok([2027,2028].includes(year));
     const sessions=Array.from({length:365},(_,n)=>new Date(Date.UTC(year,0,n+1))).filter(day=>![0,6].includes(day.getUTCDay())&&day.toISOString().slice(0,10)!=='2027-01-01').map(day=>({date:day.toISOString().slice(0,10),open:'09:30',close:'16:00'}));
     return route.fulfill({json:{available:true,start:`${year}-01-01`,end:`${year}-12-31`,sessions}});
    }
    if(url.pathname==='/api/charts/vwap-seed'){
     const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams,Date.parse('2026-12-31T23:00:00Z')),year=request.anchor==='Year';
     return route.fulfill({json:{complete:true,request,basisDate:'2026-12-31',anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor),start:fixtureModule.exports.vwapSeedStart(request),volume:year?200:0,sums:year?{open:2600,high:3800,low:2200,close:3000,hl2:3000,hlc3:3000,ohlc4:2900}:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
     const date='2026-12-31';
     const midnight=Date.parse(date+'T05:00:00Z')/1000;
     const bars=[{hour:4,value:10,volume:100},{hour:9.5,value:20,volume:200},{hour:9.5+1/60,value:30,volume:0},{hour:16+1/60,value:40,volume:100}].map(row=>({time:Math.round(midnight+row.hour*3600),open:row.value,high:row.value+3,low:row.value-3,close:row.value,volume:row.volume}));
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[{time:midnight,open:10,high:43,low:7,close:40,volume:400}]:bars,nextBefore:null,adjustment:'split',basisDate:'2026-12-31',calendar:{available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions:[{date,open:'09:30',close:'16:00'}]}}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(){super();}close(){}};});
   await page.goto('https://vwap-fixture.invalid/');
   await page.getByRole('button',{name:'TEST 1D candles',exact:true}).click();
   await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('button',{name:'Add VWAP',exact:true}).click();
   for(const offset of [2,3,500]){
    const field=page.getByRole('spinbutton',{name:'Offset',exact:true});await field.fill(String(offset));await field.press('Tab');await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.waitForFunction(offset=>{const c=window.__charts.find(c=>!c.removed),points=c?.series.find(s=>s.options().title==='VWAP')?.data();return points?.length===1&&(points[0].time-c.series[0].data()[0].time)/86400>offset;},offset);
    const measured=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),scale=c.chart.timeScale(),time=c.series[0].data()[0].time,shifted=c.series.find(s=>s.options().title==='VWAP').data()[0].time;return {candleCount:c.series[0].data().length,close:c.series[0].data()[0].close,days:(shifted-time)/86400,positions:scale.coordinateToLogical(scale.timeToCoordinate(shifted))-scale.coordinateToLogical(scale.timeToCoordinate(time)),whitespace:c.series.filter(s=>s.__testInput?.length&&s.__testInput.every(point=>Object.keys(point).length===1)).map(s=>s.__testInput)};});
    assert.equal(measured.candleCount,1);assert.equal(measured.close,40);if(offset<500)assert.equal(measured.days,offset+3);else assert.ok(measured.days>500);assert.equal(calendarReads,offset<500?1:2);
    if(process.env.TRADERLINK_EXPECT_OFFSET_DEFECT==='1')assert.equal(measured.positions,1,'Captures old sparse-axis defect');
    else{assert.ok(Math.abs(measured.positions-offset)<1e-7);assert.equal(measured.whitespace[0].length,offset);}
    console.log('Native single-bar offset',width,offset,JSON.stringify({...measured,whitespace:measured.whitespace.map(points=>({count:points.length,first:points[0],last:points.at(-1)}))}));
    await page.getByRole('button',{name:'Indicators',exact:true}).click();
   }
   await page.getByRole('button',{name:'Remove VWAP',exact:true}).click();await page.getByRole('button',{name:'Close chart preferences'}).click();
   await page.waitForFunction(()=>{const c=window.__charts.find(c=>!c.removed);return !c.series.some(s=>s.options().title==='VWAP')&&!c.series.some(s=>s.__testInput?.length&&s.__testInput.every(point=>Object.keys(point).length===1));});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log(process.env.TRADERLINK_EXPECT_OFFSET_DEFECT==='1'?'PASS reproduced old sparse-offset defect.':'PASS calendar-backed year-end offsets skip verified closed dates and fetch next year once, without extra candles or volume.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
