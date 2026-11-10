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

   const expected={'1m':22.5,'5m':155/6,'15m':155/6,'1h':155/6,'4h':155/6,'1D':30},frames=Object.keys(expected);
   const open=()=>page.getByRole('button',{name:'Indicators',exact:true}).click();
   const close=async()=>{await page.getByRole('button',{name:'Close chart preferences'}).click();await page.getByRole('dialog').waitFor({state:'hidden'});};
   const select=async(label,value)=>{await page.getByRole('combobox',{name:label,exact:true}).click();await page.getByRole('option',{name:value,exact:true}).click();};
   const wait=frame=>page.waitForFunction(expected=>Math.abs((window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='VWAP')?.data().at(-1)?.value??NaN)-expected)<1e-9,expected[frame]);
   await open();if(width===1200)await page.getByRole('button',{name:'Add VWAP',exact:true}).click();await close();await wait('1m');
   for(const theme of ['Light','Dark']){
    await page.getByRole('button',{name:'Chart settings',exact:true}).click();await select('Chart theme',theme);await close();
    for(const frame of frames){await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();await wait(frame);const actual=await page.evaluate(()=>{const c=window.__charts.find(c=>!c.removed);return {background:c.chart.options().layout.background.color,text:c.chart.options().layout.textColor};});assert.deepEqual(actual,theme==='Dark'?{background:'#101722',text:'#c7d2df'}:{background:'#ffffff',text:'#354358'});}
    await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();await wait('1m');await page.screenshot({path:`/tmp/traderlink-vwap-visibility-${width}-${theme}.png`});console.log('PASS native theme/calculation invariance',width,theme,'all6frames');
   }
   await open();await page.getByRole('tab',{name:'Visibility',exact:true}).click();
   for(const frame of frames)await page.getByRole('checkbox',{name:frame,exact:true}).uncheck();await close();
   for(const enabled of frames){
    await open();await page.getByRole('tab',{name:'Visibility',exact:true}).click();
    for(const frame of frames)await page.getByRole('checkbox',{name:frame,exact:true}).setChecked(frame===enabled);await close();
    for(const frame of frames){
     await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();
     if(frame===enabled)await wait(frame);else await page.waitForFunction(()=>{const c=window.__charts?.find(c=>!c.removed);return c?.series[0].data().length>0&&!c.series.some(s=>s.options().title==='VWAP'||s.options().title?.startsWith('Upper Band')||s.options().title?.startsWith('Lower Band'));});
    }
    console.log('PASS one allowed visibility frame',width,enabled,'all6displayframes');
   }
   await open();await page.getByRole('tab',{name:'Visibility',exact:true}).click();for(const frame of frames)await page.getByRole('checkbox',{name:frame,exact:true}).check();await close();
   await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();await wait('1m');
   for(let n=0;n<200&&(preferences.theme!=='dark'||preferences.timeframe!=='1m'||preferences.indicators[0].timeframes?.length!==6);n++)await new Promise(resolve=>setTimeout(resolve,20));
   assert.equal(preferences.theme,'dark');assert.equal(preferences.timeframe,'1m');assert.equal(preferences.indicators[0].timeframes.length,6);
   await page.reload();await wait('1m');await open();await page.getByRole('tab',{name:'Visibility',exact:true}).click();for(const frame of frames)assert.equal(await page.getByRole('checkbox',{name:frame,exact:true}).isChecked(),true);await close();
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS native light/dark values, all per-timeframe visibility combinations and saved reopening on desktop/mobile. Partial VWAP qualification only.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
