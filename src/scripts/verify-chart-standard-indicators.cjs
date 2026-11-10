// Standard indicator controls: actual shared chart/editor with isolated HTTP fixtures.
const assert=require('node:assert/strict'),path=require('node:path'),esbuild=require('esbuild'),cp=require('node:child_process');
const {chromium}=require('playwright');
async function main(){
 const sourceRef=process.env.TRADERLINK_SOURCE_REF;if(sourceRef&&!/^[0-9a-f]{40}$/.test(sourceRef))throw Error('Invalid immutable source reference');
 const sourcePlugin=sourceRef?{name:'immutable-source',setup(build){build.onLoad({filter:/\.(tsx?|json)$/,namespace:'file'},args=>{const relative=path.relative(process.cwd(),args.path);if(relative.startsWith('..')||relative.startsWith('node_modules/'))return;return {contents:cp.execFileSync('git',['show',sourceRef+':'+relative],{encoding:'utf8'}),loader:relative.endsWith('.json')?'json':relative.endsWith('.tsx')?'tsx':'ts',resolveDir:path.dirname(args.path)};});}}:null;
 const chartPackage=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
 const bundle=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'tsx',contents:`import React from 'react';import{createRoot}from'react-dom/client';import{ThemeProvider,createTheme}from'@mui/material/styles';import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';import{indicatorValues}from'./src/modules/scanner/alpaca/chart-indicators';window.__calculate=(bars,indicators)=>indicators.flatMap(indicator=>indicatorValues(bars,indicator,'1m'));window.__defaults=DEFAULT_CHART_PREFERENCES;const root=createRoot(document.getElementById('root'));window.__mount=(symbol='TEST')=>root.render(<ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol={symbol}/></ThemeProvider>);window.__mount();`},bundle:true,write:false,platform:'browser',format:'iife',define:{'process.env.NODE_ENV':'"production"'},plugins:[...(sourcePlugin?[sourcePlugin]:[]),{name:'observe-public-series',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'observe',namespace:'observe'}));build.onLoad({filter:/.*/,namespace:'observe'},()=>({loader:'js',resolveDir:process.cwd(),contents:`export*from${JSON.stringify(chartPackage)};import{createChart as original}from${JSON.stringify(chartPackage)};export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}`}));}}]});
 const fixtureModule={exports:{}};new Function('module','exports',(await esbuild.build({stdin:{contents:"export{parseVwapSeedRequest,vwapSeedStart}from'./src/modules/scanner/alpaca/chart-vwap-seed';export{easternClock}from'./src/modules/scanner/live/sessions';export{vwapAnchorKey}from'./src/modules/scanner/alpaca/chart-indicators';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs',plugins:sourcePlugin?[sourcePlugin]:[]})).outputFiles[0].text)(fixtureModule,fixtureModule.exports);
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
     const bars=Array.from({length:260},(_,n)=>({time:midnight+570*60+n*60,open:10+n%17,high:13+n%17,low:7+n%17,close:10+n%17,volume:100+n}));
     const daily=Array.from({length:260},(_,n)=>({...bars[n],time:midnight-(259-n)*86400}));
     const sessions=daily.map(bar=>({date:new Date(bar.time*1000).toISOString().slice(0,10),open:'09:30',close:'16:00'}));
     return route.fulfill({json:{bars:url.searchParams.get('daily')==='1'?daily:bars,nextBefore:null,adjustment:'split',basisDate:fixtureModule.exports.easternClock(Date.now()).date,calendar:{available:true,start:date.slice(0,4)+'-01-01',end:date.slice(0,4)+'-12-31',sessions}}});
    }
    throw Error('Unexpected fixture route '+url.pathname);
   });
   await page.addInitScript(()=>{window.__sources=[];window.EventSource=class extends EventTarget{constructor(url){super();this.url=url;window.__sources.push(this);}close(){this.closed=true;}};});
   await page.goto('https://vwap-fixture.invalid/');
   await page.waitForFunction(()=>window.__charts?.some(c=>!c.removed&&c.series[0]?.data().length));
   const close=async()=>{await page.getByRole('button',{name:'Close chart preferences'}).click();await page.getByRole('button',{name:'Close chart preferences'}).waitFor({state:'hidden'});};
   const open=()=>page.getByRole('button',{name:'Indicators',exact:true}).click();
   const editLength=async(type,length)=>{const input=page.getByRole('spinbutton',{name:type+' length',exact:true});await input.fill(String(length));await input.press('Tab');};
   if(width===1200){
    await open();
    for(const [type,length]of [['EMA',9],['EMA',20],['EMA',50],['EMA',200],['SMA',20],['SMA',50]]){
     await page.getByRole('button',{name:'Add '+type,exact:true}).click();await editLength(type,length);
     await page.getByRole('button',{name:type+' '+length,exact:true}).waitFor();
    }
    await close();
   }
   const expected=[['EMA',9],['EMA',20],['EMA',50],['EMA',200],['SMA',20],['SMA',50]];
   const check=async()=>{
    await page.waitForFunction(()=>{const chart=window.__charts?.find(c=>!c.removed);return chart?.series.filter(s=>/^(EMA|SMA) /.test(s.options().title)).length===6&&chart.series.filter(s=>/^EMA /.test(s.options().title)).every(s=>s.data().length>0);});
    const actual=await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.filter(s=>/^(EMA|SMA) /.test(s.options().title)).map(s=>({title:s.options().title,visible:s.options().visible,points:s.data()})));
    assert.deepEqual(actual.map(s=>s.title),expected.map(([type,n])=>type+' '+n));
    assert(actual.every(s=>s.visible));assert(actual.slice(0,4).every(s=>s.points.length>0),'all EMA lengths have data');
    assert.deepEqual(preferences.indicators.map(i=>[i.type,i.period]),expected);
   };
   await check();
   assert.deepEqual(await page.evaluate(()=>window.__charts.find(c=>!c.removed).series.filter(s=>/^(EMA|SMA) /.test(s.options().title)).map(s=>s.data().length)),[260,260,260,260,241,211]);
   for(const frame of ['1m','5m','15m','1h','4h','1D']){
    await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();await check();
   }
   await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();
   await open();await page.getByRole('checkbox',{name:'Show EMA 20',exact:true}).uncheck();await close();
   await page.waitForFunction(()=>{const chart=window.__charts.find(c=>!c.removed);return chart&&chart.series.every(s=>s.options().title!=='EMA 20');});
   await open();await page.getByRole('checkbox',{name:'Show EMA 20',exact:true}).check();
   await page.getByRole('button',{name:'EMA 20',exact:true}).click();
   const invalid=page.getByRole('spinbutton',{name:'EMA length',exact:true});await invalid.fill('0');await invalid.press('Tab');
   assert.equal(await invalid.getAttribute('aria-invalid'),'true');assert.equal(preferences.indicators[1].period,20);
   await invalid.fill('20');await invalid.press('Tab');await close();await check();
   await page.reload();await check();
   await page.evaluate(()=>window.__mount('NEXT'));await page.getByRole('button',{name:'NEXT 1m candles',exact:true}).waitFor();await check();
   await page.evaluate(()=>window.__mount('TEST'));await page.getByRole('button',{name:'TEST 1m candles',exact:true}).waitFor();await check();
   await open();await page.getByRole('button',{name:'Add EMA',exact:true}).click();await editLength('EMA',233);await page.getByRole('button',{name:'Remove EMA 233',exact:true}).click();await close();await check();
   await open();await page.getByRole('button',{name:'Add EMA',exact:true}).click();
   const draft=page.getByRole('spinbutton',{name:'EMA length',exact:true});await draft.fill('0');await draft.press('Tab');
   await page.getByRole('button',{name:'EMA 9',exact:true}).first().click();
   assert.equal(await page.getByRole('spinbutton',{name:'EMA length',exact:true}).inputValue(),'9','switching same-period studies must discard another study draft');
   await page.getByRole('button',{name:'Remove EMA 9',exact:true}).last().click();await close();await check();
   await open();
   await page.getByRole('button',{name:'Add RSI',exact:true}).click();await editLength('RSI',6);
   for(const [label,value]of [['Upper level',80],['Lower level',20]]){const input=page.getByRole('spinbutton',{name:label,exact:true});await input.fill(String(value));await input.press('Tab');}
   await page.getByRole('button',{name:'Add MACD',exact:true}).click();
   for(const [label,value]of [['Fast length',5],['Slow length',13],['Signal length',4]]){const input=page.getByRole('spinbutton',{name:label,exact:true});await input.fill(String(value));await input.press('Tab');}
   await page.getByRole('button',{name:'Add Bollinger Bands',exact:true}).click();await editLength('Bollinger',10);
   const deviation=page.getByRole('spinbutton',{name:'Standard deviation',exact:true});await deviation.fill('1.5');await deviation.press('Tab');await close();
   const standardTitles=['RSI 6','MACD 5/13','Signal 4','BB 10, 1.5'];
   const checkStandard=async(requirePoints=false)=>{
    await page.waitForFunction(({titles,requirePoints})=>{const series=window.__charts?.find(c=>!c.removed)?.series;return series&&titles.every(title=>series.some(s=>s.options().title===title&&(!requirePoints||s.data().length)));},{titles:standardTitles,requirePoints});
    assert.equal(preferences.indicators.length,9);
    assert.equal(preferences.indicators[6].period,6);assert.equal(preferences.indicators[6].levels.upper,80);assert.equal(preferences.indicators[6].levels.lower,20);
    assert.deepEqual([preferences.indicators[7].fastLength,preferences.indicators[7].slowLength,preferences.indicators[7].signalLength],[5,13,4]);
    assert.equal(preferences.indicators[8].period,10);assert.equal(preferences.indicators[8].deviation,1.5);
   };
   for(const frame of ['1m','5m','15m','1h','4h','1D']){await page.getByRole('button',{name:`TEST ${frame} candles`,exact:true}).click();await checkStandard(frame==='1m'||frame==='1D');}
   await page.getByRole('button',{name:'TEST 1m candles',exact:true}).click();await page.reload();await checkStandard(true);
   await page.evaluate(()=>window.__mount('NEXT'));await page.getByRole('button',{name:'NEXT 1m candles',exact:true}).waitFor();await checkStandard(true);
   await page.evaluate(()=>window.__mount('TEST'));await page.getByRole('button',{name:'TEST 1m candles',exact:true}).waitFor();await checkStandard(true);
   const expectedLive=await page.evaluate(indicators=>{
    const c=window.__charts.find(c=>!c.removed),bars=c.series[0].data().map((bar,n)=>({...bar,volume:100+n})),last=bars.at(-1);
    const revised={...last,close:50,high:Math.max(last.high,50),volume:900};bars[bars.length-1]=revised;
    const expected=window.__calculate(bars,indicators).map(part=>part.points.at(-1));
    const source=window.__sources.findLast(source=>!source.closed&&source.url.endsWith('daily=0'));
    source.dispatchEvent(new MessageEvent('bar',{data:JSON.stringify({daily:false,bar:revised})}));return expected;
   },preferences.indicators);
   await page.waitForFunction(expected=>{const c=window.__charts?.find(c=>!c.removed);return c&&expected.every((point,n)=>{const actual=c.series[2+n]?.data().at(-1);return point&&actual&&actual.time===point.time&&Math.abs(actual.value-point.value)<1e-8;});},expectedLive);
   console.log('PASS immediate native current-candle update across all standard plots',width);
   await open();
   for(const title of ['RSI 6','MACD 5, 13, 4','Bollinger Bands 10, 1.5'])await page.getByRole('button',{name:'Remove '+title,exact:true}).click();
   await close();await check();
   console.log('PASS standard RSI/MACD/Bollinger controls',width,'custom settings, six timeframes, plotted data, reload, symbol change, remove');
   await open();await page.getByRole('button',{name:'EMA 9',exact:true}).click();
   for(const [label,key]of [['SMA','SMA'],['EMA','EMA'],['SMMA (RMA)','RMA'],['WMA','WMA'],['VWMA','VWMA'],['SMA + Bollinger Bands','SMA'],['None',null]]){
    await page.getByRole('combobox',{name:'Smoothing',exact:true}).click();await page.getByRole('option',{name:label,exact:true}).click();
    if(key){const input=page.getByRole('spinbutton',{name:'Smoothing length',exact:true});await input.fill('5');await input.press('Tab');}
    if(label==='SMA + Bollinger Bands'){const input=page.getByRole('spinbutton',{name:'Smoothing BB StdDev',exact:true});await input.fill('1.5');await input.press('Tab');}
    if(key)await page.waitForFunction(title=>window.__charts?.find(c=>!c.removed)?.series.some(s=>s.options().title===title&&s.data().length),key+' 5');
   }
   await page.getByRole('tab',{name:'Style',exact:true}).click();
   const color=page.getByLabel('EMA 9 color',{exact:true});await color.fill('#123456');await color.press('Tab');
   await page.getByRole('combobox',{name:'Width',exact:true}).click();await page.getByRole('option',{name:'3px',exact:true}).click();
   await page.getByRole('combobox',{name:'Line style',exact:true}).click();await page.getByRole('option',{name:'Dashed',exact:true}).click();await close();
   await page.waitForFunction(()=>{const o=window.__charts?.find(c=>!c.removed)?.series.find(s=>s.options().title==='EMA 9')?.options();return o&&o.color==='#123456'&&o.lineWidth===3&&o.lineStyle===2;});
   await page.reload();await check();
   assert.deepEqual(await page.evaluate(()=>{const o=window.__charts.find(c=>!c.removed).series.find(s=>s.options().title==='EMA 9').options();return [o.color,o.lineWidth,o.lineStyle];}),['#123456',3,2]);
   console.log('PASS offered smoothing types and saved line color/width/style',width);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true,'viewport width containment');
   console.log('PASS standard EMA/SMA actual native controls',width,'six timeframes, independent periods, hide/show, invalid input, reload, symbol change, remove');
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log('PASS standard EMA/SMA controls; isolated fixture, not provider/account integration or final full QA.');
 }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
