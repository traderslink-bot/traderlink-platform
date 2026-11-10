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
 let preferences=null,revision=0,monthSeedReads=0,zeroVolume=false;const errors=[];
 try{
  for(const width of [1200,390]){
   const page=await browser.newPage({viewport:{width,height:800}});await page.clock.install({time:new Date()});page.on('pageerror',error=>errors.push(error.message));
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
     const request=fixtureModule.exports.parseVwapSeedRequest(url.searchParams),month=request.anchor==='Month';if(month)monthSeedReads++;
     const sums=Object.fromEntries(['open','high','low','close','hl2','hlc3','ohlc4','hlcc4'].map(source=>[source,month?1000:0]));
     return route.fulfill({json:{complete:true,request,basisDate:fixtureModule.exports.easternClock(Date.now()).date,anchorKey:fixtureModule.exports.vwapAnchorKey(fixtureModule.exports.easternClock(request.before*1000).date,request.anchor),start:fixtureModule.exports.vwapSeedStart(request),volume:month?100:0,sums,...(month&&monthSeedReads>1?{moments:Object.fromEntries(Object.keys(sums).map(source=>[source,{mean:10,m2:0}]))}:{})}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
     const date=new Intl.DateTimeFormat('en-CA',{timeZone:'America/New_York',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
     const midnight=Date.parse(date+'T05:00:00Z')/1000;
     const bars=[{hour:4,value:10,volume:100},{hour:9.5,value:20,volume:200},{hour:9.5+1/60,value:30,volume:0},{hour:16+1/60,value:40,volume:100}].map(row=>({time:Math.round(midnight+row.hour*3600),open:row.value,high:row.value+3,low:row.value-3,close:row.value,volume:zeroVolume?0:row.volume}));
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?[{time:midnight,open:10,high:43,low:7,close:40,volume:zeroVolume?0:400}]:bars,nextBefore:null,adjustment:'split',basisDate:fixtureModule.exports.easternClock(Date.now()).date,calendar:{available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions:[{date,open:'09:30',close:'16:00'}]}}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;this.closed=false;(window.__sources??=[]).push(this);}close(){this.closed=true;}};});
   await page.goto('https://vwap-fixture.invalid/');
   const series=title=>page.evaluate(title=>window.__charts.find(c=>!c.removed)?.series.find(s=>s.options().title===title)?.data(),title);
   const waitBand=async(mean,deviation)=>page.waitForFunction(({mean,deviation})=>{const c=window.__charts?.find(c=>!c.removed),last=title=>c?.series.find(s=>s.options().title===title)?.data().at(-1)?.value;return Math.abs((last('VWAP')??NaN)-mean)<1e-9&&Math.abs((last('Upper Band #1')??NaN)-(mean+deviation))<1e-9&&Math.abs((last('Lower Band #1')??NaN)-(mean-deviation))<1e-9;},{mean,deviation},{timeout:15000});
   const select=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
   const open=()=>page.getByRole('button',{name:'Indicators',exact:true}).click(),close=async()=>{await page.getByRole('button',{name:'Close chart preferences'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});};
   await open();if(width===1200)await page.getByRole('button',{name:'Add VWAP',exact:true}).click();
   assert.equal(await page.getByRole('spinbutton',{name:'Band multiplier #1',exact:true}).getAttribute('step'),'0.5');assert.equal(await page.getByRole('spinbutton',{name:'Band multiplier #1',exact:true}).getAttribute('max'),null);
   assert.equal(await page.getByRole('checkbox',{name:'Band #1',exact:true}).isChecked(),true);assert.equal(await page.getByRole('checkbox',{name:'Band #2',exact:true}).isChecked(),false);await close();
   const deviation=Math.sqrt(475)/2;await waitBand(22.5,deviation);
   // Output settings affect only presentation; verify native formatters and cursor values.
   await open();await page.getByRole('tab',{name:'Style',exact:true}).click();
   assert.equal(await page.getByRole('checkbox',{name:'Labels on price scale',exact:true}).isChecked(),true);
   assert.equal(await page.getByRole('checkbox',{name:'Values in status line',exact:true}).isChecked(),true);
   await close();
   for(const precision of [0,4,16]){
    await open();await page.getByRole('tab',{name:'Style',exact:true}).click();await select('Precision',String(precision));await close();await waitBand(22.5,deviation);
    const output=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),s=c.series.find(s=>s.options().title==='VWAP');return {label:s.options().lastValueVisible,value:s.priceFormatter().format(s.data().at(-1).value),legend:document.querySelector('[data-chart-indicator-legend]').textContent};});
    assert.equal(output.label,true);assert.equal(output.value,(22.5).toFixed(precision));assert.ok(output.legend.includes('VWAP '+(22.5).toFixed(precision)));
   }
   const target=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),rect=c.chart.chartElement().getBoundingClientRect(),last=c.series[0].data().at(-1).time;return {x:rect.x+c.chart.timeScale().timeToCoordinate(last-20*60),y:rect.y+70};});
   await page.mouse.move(target.x,target.y);
   await page.waitForFunction(()=>document.querySelector('[data-chart-indicator-legend]').textContent.includes('VWAP '+(50/3).toFixed(16)));
   await page.mouse.move(0,0);
   await open();await page.getByRole('tab',{name:'Style',exact:true}).click();await page.getByRole('checkbox',{name:'Labels on price scale',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Values in status line',exact:true}).uncheck();await close();await waitBand(22.5,deviation);
   assert.equal(await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='VWAP').options().lastValueVisible),false);
   assert.equal(await page.locator('[data-chart-indicator-legend]').textContent(),'');
   await page.reload();await waitBand(22.5,deviation);
   await open();await page.getByRole('tab',{name:'Style',exact:true}).click();assert.equal(await page.getByRole('checkbox',{name:'Values in status line',exact:true}).isChecked(),false);await page.getByRole('checkbox',{name:'Labels on price scale',exact:true}).check();await page.getByRole('checkbox',{name:'Values in status line',exact:true}).check();await select('Precision','Default');await close();await waitBand(22.5,deviation);
   await page.screenshot({path:`/tmp/traderlink-vwap-output-${width}.png`});
   console.log('PASS standard output precision, scale labels, cursor values and persisted controls',width);
   if(width===1200){
    for(const [frame,mean,spread]of [['1m',22.5,deviation],['5m',155/6,Math.sqrt(4075)/6],['15m',155/6,Math.sqrt(4075)/6],['1h',155/6,Math.sqrt(4075)/6],['4h',155/6,Math.sqrt(4075)/6],['1D',30,0]]){
     await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();await waitBand(mean,spread);console.log('PASS actual weighted bands',frame,mean,spread);
    }
    await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();await waitBand(22.5,deviation);
    const quiet=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),first=c.series[0].data()[0].time,time=first+6*3600;return c.series.find(s=>s.options().title==='VWAP').data().find(point=>point.time===time);});
    assert.ok(Math.abs(quiet.value-50/3)<1e-9,'A quiet minute must hold VWAP rather than imply trading volume');
    await open();await page.getByRole('tab',{name:'Style',exact:true}).click();
    await page.getByLabel('Bands Fill #1 color',{exact:true}).fill('#ff0000');await page.getByLabel('Bands Fill #1 color',{exact:true}).press('Tab');
    await page.getByRole('spinbutton',{name:'Bands Fill #1 opacity',exact:true}).fill('80');await page.getByRole('spinbutton',{name:'Bands Fill #1 opacity',exact:true}).press('Tab');await close();await waitBand(22.5,deviation);
    const pixel=()=>page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),main=c.series.find(s=>s.options().title==='VWAP'),last=c.series[0].data().at(-1).time,x=c.chart.timeScale().timeToCoordinate(last-20*60),y=main.priceToCoordinate(18.123),canvas=c.chart.takeScreenshot(true,false);return Array.from(canvas.getContext('2d').getImageData(Math.floor(x),Math.floor(y),1,1).data);});
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));const filled=await pixel();assert.ok(filled[0]>200&&filled[1]<100,`Fill uses saved red/80%: ${filled}`);
    const linePixels=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),main=c.series.find(s=>s.options().title==='VWAP'),time=c.series[0].data().at(-1).time-20*60,x=c.chart.timeScale().timeToCoordinate(time),y=main.priceToCoordinate(50/3),canvas=c.chart.takeScreenshot(true,false);return Array.from(canvas.getContext('2d').getImageData(Math.floor(x)-1,Math.floor(y)-3,3,7).data);});
    assert.ok(Array.from({length:linePixels.length/4},(_,n)=>n*4).some(index=>linePixels[index+2]>110&&linePixels[index]<205),`Default native z-order keeps the main line above fill shading: ${linePixels}`);
    await open();await page.getByRole('tab',{name:'Style',exact:true}).click();await page.getByRole('checkbox',{name:'VWAP',exact:true}).uncheck();await close();
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));assert.ok((await pixel())[1]<100,'Fill remains independent of main-line visibility');
    await open();await page.getByRole('tab',{name:'Style',exact:true}).click();await page.getByRole('checkbox',{name:'VWAP',exact:true}).check();await page.getByRole('checkbox',{name:'Bands Fill #1',exact:true}).uncheck();await close();
    await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));const clear=await pixel();assert.ok(clear[1]>180,`Fill hidden independently: ${clear}`);await waitBand(22.5,deviation);console.log('PASS native band-fill pixels and independent visibility');
    await open();await select('Bands calculation mode','Percentage');await page.getByRole('checkbox',{name:'Band #2',exact:true}).check();await page.getByRole('spinbutton',{name:'Band multiplier #2',exact:true}).fill('2.5');await page.getByRole('spinbutton',{name:'Band multiplier #2',exact:true}).press('Tab');await page.getByRole('checkbox',{name:'Band #3',exact:true}).check();await close();
    await waitBand(22.5,0.225);assert.ok(Math.abs((await series('Upper Band #2')).at(-1).value-23.0625)<1e-9);assert.ok(Math.abs((await series('Lower Band #3')).at(-1).value-21.825)<1e-9);
    assert.equal(await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='Upper Band #2').options().color),'#808000');
    assert.equal(await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='Lower Band #3').options().color),'#089981');
    await open();let multiplier=page.getByRole('spinbutton',{name:'Band multiplier #1',exact:true});await multiplier.fill('250');await multiplier.press('Tab');await close();await waitBand(22.5,56.25);
    await open();await select('Bands calculation mode','Standard deviation');multiplier=page.getByRole('spinbutton',{name:'Band multiplier #1',exact:true});await multiplier.fill('1e308');await multiplier.press('Tab');await close();
    await page.waitForFunction(()=>{const c=window.__charts.find(c=>!c.removed);return c.series.find(s=>s.options().title==='VWAP').data().at(-1)?.value===22.5&&c.series.find(s=>s.options().title==='Upper Band #1').data().length===0&&document.body.innerText.includes('VWAP band values exceed the supported numeric range.');});
    await open();multiplier=page.getByRole('spinbutton',{name:'Band multiplier #1',exact:true});await multiplier.fill('1');await multiplier.press('Tab');await close();await waitBand(22.5,deviation);
    console.log('PASS native band colors, multiplier above100, numeric overflow containment and recovery');
    await open();await select('Bands calculation mode','Standard deviation');await page.getByRole('checkbox',{name:'Band #2',exact:true}).uncheck();await page.getByRole('checkbox',{name:'Band #3',exact:true}).uncheck();await close();await waitBand(22.5,deviation);
    await open();await select('Anchor Period','Month');await close();
    await page.waitForFunction(()=>{const c=window.__charts.find(c=>!c.removed);return c.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value===20&&c.series.find(s=>s.options().title==='Upper Band #1')?.data().length===0;});
    assert.equal(monthSeedReads,1,'Missing variance must not trigger a request loop');
    await page.clock.fastForward(31000);
    await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),source=window.__sources.findLast(s=>!s.closed&&s.url.endsWith('daily=0')),time=c.series[0].data().at(-1).time;source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:false,bar:{time,open:40,high:43,low:37,close:40,volume:100}})}));});
    try{await waitBand(20,Math.sqrt(120));}catch(error){console.error('Moment recovery diagnostic',monthSeedReads,await page.evaluate(()=>({now:Date.now(),body:document.body.innerText.slice(-700),plots:window.__charts.find(c=>!c.removed).series.map(s=>({title:s.options().title,last:s.data().at(-1)}))})));throw error;}assert.equal(monthSeedReads,2);console.log('PASS complete band history recovers without hiding valid main VWAP or looping');
    await open();await select('Anchor Period','Session');await close();await waitBand(22.5,deviation);
    const activeTarget=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),rect=c.chart.chartElement().getBoundingClientRect(),time=c.series[0].data().at(-1).time;return {x:rect.x+c.chart.timeScale().timeToCoordinate(time),y:rect.y+70};});await page.mouse.move(activeTarget.x,activeTarget.y);
    await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed),source=window.__sources.findLast(s=>!s.closed&&s.url.endsWith('daily=0')),time=c.series[0].data().at(-1).time;source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:false,bar:{time,open:50,high:50,low:50,close:50,volume:200}})}));});
    await page.waitForFunction(()=>document.querySelector('[data-chart-indicator-legend]').textContent.includes('VWAP 30.00'));await page.mouse.move(0,0);
    await waitBand(30,Math.sqrt(280));console.log('PASS live native VWAP and both bands update together');
    await open();await page.getByRole('button',{name:'Reset VWAP defaults',exact:true}).click();await close();
    for(let n=0;n<150&&(preferences.indicators[0].vwapBands?.levels[0].fillOpacity!==5||preferences.indicators[0].vwapBands?.levels[1].enabled);n++)await new Promise(resolve=>setTimeout(resolve,20));
    assert.equal(preferences.indicators[0].vwapBands.levels[0].fillOpacity,5);assert.equal(preferences.indicators[0].vwapBands.levels[1].enabled,false);
   }
   if(width===390){
    zeroVolume=true;await page.reload();await page.getByText('VWAP unavailable: no volume data.',{exact:true}).waitFor();
    assert.equal(await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed);return c.series[0].data().length>0&&c.series.find(s=>s.options().title==='VWAP').data().length===0;}),true);
    zeroVolume=false;await page.reload();await waitBand(22.5,deviation);assert.equal(await page.getByText('VWAP unavailable: no volume data.',{exact:true}).count(),0);console.log('PASS native zero-volume error without hiding price candles, and recovery');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS actual VWAP bands/fill controls, six frames, live update and mobile persisted reopening. Partial indicator QA only.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
