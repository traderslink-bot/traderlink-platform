// Isolated VWAP checkpoint: actual shared chart and editor, no server/provider/account.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild'),cp=require('node:child_process');
const {chromium}=require('playwright');
async function main(){
 const sourceRef=process.env.TRADERLINK_SOURCE_REF;if(sourceRef&&!/^[0-9a-f]{40}$/.test(sourceRef))throw Error('Invalid immutable source reference');
 const sourcePlugin=sourceRef?{name:'immutable-source',setup(build){build.onLoad({filter:/\.(tsx?|json)$/,namespace:'file'},args=>{const relative=path.relative(process.cwd(),args.path);if(relative.startsWith('..')||relative.startsWith('node_modules/'))return;return {contents:cp.execFileSync('git',['show',sourceRef+':'+relative],{encoding:'utf8'}),loader:relative.endsWith('.json')?'json':relative.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)};});}}:null;
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{MarketChartWorkspace}from'./app/(dashboard)/charts/market-chart-workspace';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=()=>root.render(<ThemeProvider theme={createTheme()}>{location.search.includes('main')?<MarketChartWorkspace/>:<AlpacaLightweightChart symbol="TEST"/>}</ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[...(sourcePlugin?[sourcePlugin]:[]),{name:'observe-public-series',setup(build){build.onResolve({filter:/^@\/app\/dashboard-template$/},()=>({path:'primary-action',namespace:'fixture-action'}));build.onLoad({filter:/.*/,namespace:'fixture-action'},()=>({loader:'js',resolveDir:process.cwd(),contents:"import React from 'react';export const DashboardPrimaryAction=props=>React.createElement('button',props);"}));build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};chart.subscribeCrosshairMove(event=>{window.__crosshair={time:event.time,point:event.point,text:typeof event.time==='number'?chart.options().localization.timeFormatter(event.time):null};});const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{easternClock:now=>({date:new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(now)})}};
 const browser=await chromium.launch({headless:true,executablePath:process.env.TRADERLINK_TEST_CHROMIUM});
 let preferences=null,revision=0;const errors=[];
 try{
  for(const width of [1200,390])for(const surface of ['main','scanner']){
   preferences=null;revision=0;
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
     const request={symbol:url.searchParams.get('symbol'),timeframe:url.searchParams.get('timeframe'),anchor:url.searchParams.get('anchor'),before:Number(url.searchParams.get('before')),premarket:url.searchParams.get('premarket')==='1',regular:url.searchParams.get('regular')==='1',postmarket:url.searchParams.get('postmarket')==='1'};
     const date=fixtureModule.exports.easternClock(request.before*1000).date;
     return route.fulfill({json:{complete:true,request,basisDate:fixtureModule.exports.easternClock(Date.now()).date,anchorKey:date,start:Date.parse(date+'T05:00:00Z')/1000,volume:0,sums:{open:0,high:0,low:0,close:0,hl2:0,hlc3:0,ohlc4:0}}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
     const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     const midnight=Date.parse(date+'T05:00:00Z')/1000;
     const bars=Array.from({length:390},(_,n)=>{const value=n<150?1:4;return {time:midnight+570*60+n*60,open:value,high:value+0.05,low:value-0.05,close:value,volume:1};});
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[{time:midnight,open:10,high:43,low:7,close:40,volume:400}]:bars,nextBefore:null,adjustment:'split',basisDate:fixtureModule.exports.easternClock(Date.now()).date,calendar:{available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions:[{date,open:'09:30',close:'16:00'}]}}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(){super();}close(){}};});
   await page.goto('https://vwap-fixture.invalid/?'+surface);
   await page.waitForFunction(()=>window.__charts?.find(c=>!c.removed)?.series[0].data().length===390);
   const measure=async()=>{await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));return page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),primary=c.series[0],study=c.series.find(s=>s.options().title?.startsWith('VWAP'));return {price:c.chart.priceScale('right').getVisibleRange(),logical:c.chart.timeScale().getVisibleLogicalRange(),pane:c.chart.panes()[0].getHeight(),candlePixels:Math.abs(primary.priceToCoordinate(4.05)-primary.priceToCoordinate(3.95)),lastCandle:primary.data().at(-1),lastVwap:study?.data().at(-1),vwapRange:study?.data().reduce((range,p)=>[Math.min(range[0],p.value),Math.max(range[1],p.value)],[Infinity,-Infinity])};});};
   const before=await measure();
   await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('button',{name:'Add VWAP',exact:true}).click();await page.getByRole('button',{name:'Close chart preferences'}).click();
   await page.waitForFunction(()=>window.__charts?.find(c=>!c.removed)?.series.some(s=>s.options().title?.startsWith('VWAP')&&s.data().length));
   const after=await measure();
   assert.deepEqual(before.lastCandle,after.lastCandle,'Adding indicator must not mutate candles');
   assert.equal(before.pane,after.pane,'Indicator must not steal price-pane height');
   assert.ok(Math.abs(before.logical.from-after.logical.from)<2,'Horizontal range retained');
   assert.ok(Math.abs(after.lastVwap.value-37/13)<1e-10,'Independent cumulative VWAP fixture');
   assert.ok(after.candlePixels<before.candlePixels/5,'Reproduces owner-reported compression with valid VWAP');
   console.log(JSON.stringify({source:sourceRef??'working',surface,width,before,after}));
   if(process.env.TRADERLINK_EXPECT_PRICE_ONLY==='1'){
    await page.getByRole('button',{name:'Chart settings',exact:true}).click();await page.getByRole('checkbox',{name:'Scale price chart only',exact:true}).check();await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.waitForFunction(()=>{const c=window.__charts.find(c=>!c.removed),range=c.chart.priceScale('right').getVisibleRange();return range&&Math.abs(range.from-3.95)<1e-9&&Math.abs(range.to-4.05)<1e-9;});
    const fixed=await measure();assert.deepEqual(fixed.lastVwap,after.lastVwap);assert.deepEqual(fixed.price,before.price);assert.ok(fixed.candlePixels>before.candlePixels*0.98);
    for(let n=0;n<100&&preferences.scalePriceOnly!==true;n++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(preferences.scalePriceOnly,true);console.log('PASS saved price-only scaling, unchanged VWAP',surface,width,fixed.candlePixels);
   }


   if(process.env.TRADERLINK_CHECK_CROSSHAIR==='1'){
    const samples=[];
    for(const index of [250,350]){
     const target=await page.evaluate(index=>{const c=window.__charts.find(c=>!c.removed),rect=c.chart.chartElement().getBoundingClientRect(),time=c.series[0].data()[index].time;return {x:rect.left+c.chart.timeScale().timeToCoordinate(time),y:rect.top+c.series[0].priceToCoordinate(4),time};},index);
     await page.mouse.move(target.x,target.y);await page.waitForFunction(time=>window.__crosshair?.time===time,target.time);
     const sample=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),canvas=c.chart.takeScreenshot(true,true),crop=document.createElement('canvas');crop.width=canvas.width;crop.height=26;crop.getContext('2d').drawImage(canvas,0,canvas.height-26,canvas.width,26,0,0,canvas.width,26);return {time:window.__crosshair.time,text:window.__crosshair.text,x:window.__crosshair.point.x,labelVisible:c.chart.options().crosshair.vertLine.labelVisible,dates:document.querySelector('[data-chart-date-axis]').innerText,details:document.querySelector('[data-chart-crosshair-details]').innerText,axisPixels:crop.toDataURL()};});
     assert.equal(sample.labelVisible,true);assert.equal(sample.time,target.time);assert.match(sample.text,/Nov 9/);assert.match(sample.details,/Nov 9/);samples.push(sample);
    }
    assert.notEqual(samples[0].x,samples[1].x);assert.notEqual(samples[0].text,samples[1].text);assert.notEqual(samples[0].axisPixels,samples[1].axisPixels,'Bottom time-axis crosshair layer changes as pointer moves');
    await page.screenshot({path:`/tmp/traderlink-chart-crosshair-${surface}-${width}.png`});
    console.log('PASS actual moving bottom crosshair label',surface,width,samples.map(({text,dates})=>({text,dates})));
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS measured reproduction; not a finding that VWAP arithmetic is wrong.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
