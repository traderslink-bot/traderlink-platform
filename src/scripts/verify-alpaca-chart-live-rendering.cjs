// Isolated browser qualification of the real shared renderer. No server, credentials or provider calls.
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const { chromium } = require('playwright');
async function main() {
  const packagePath=path.resolve('node_modules/lightweight-charts/dist/lightweight-charts.production.mjs');
  const build=await esbuild.build({stdin:{contents:`
    import React,{useState} from 'react';import{createRoot}from'react-dom/client';
    import{ThemeProvider,createTheme}from'@mui/material/styles';
    import{AlpacaLightweightChart}from'./app/(dashboard)/charts/alpaca-lightweight-chart';
    import{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';
    import{easternDayStart}from'./src/modules/scanner/alpaca/candles';
    window.__defaults=DEFAULT_CHART_PREFERENCES;window.__dayStart=easternDayStart;
    function Fixture(){const[symbol,setSymbol]=useState('AAA');window.__setSymbol=setSymbol;return <ThemeProvider theme={createTheme()}><AlpacaLightweightChart symbol={symbol}/></ThemeProvider>}
    const root=createRoot(document.getElementById('root'));root.render(<Fixture/>);window.__unmount=()=>root.unmount();
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,format:'iife',platform:'browser',define:{'process.env.NODE_ENV':'"production"'},plugins:[{name:'public-chart-observation',setup(build){build.onResolve({filter:/^lightweight-charts$/},()=>({path:'chart-observation',namespace:'chart-observation'}));build.onLoad({filter:/.*/,namespace:'chart-observation'},()=>({loader:'js',resolveDir:process.cwd(),contents:`
    export*from${JSON.stringify(packagePath)};import{createChart as original}from${JSON.stringify(packagePath)};
    export function createChart(...args){const chart=original(...args),entry={chart,series:[],removed:false};(window.__charts??=[]).push(entry);const add=chart.addSeries.bind(chart);chart.addSeries=(...values)=>{const series=add(...values);entry.series.push(series);return series;};const remove=chart.remove.bind(chart);chart.remove=()=>{entry.removed=true;remove();};return chart;}
  `}));}}]});
  const fixtureModule={exports:{}};
  const fixtureSource=esbuild.buildSync({stdin:{contents:"export{DEFAULT_CHART_PREFERENCES}from'./src/modules/scanner/alpaca/chart-preferences';export{easternDayStart}from'./src/modules/scanner/alpaca/candles';",resolveDir:process.cwd(),loader:'ts'},bundle:true,write:false,platform:'node',format:'cjs'}).outputFiles[0].text;
  new Function('module','exports',fixtureSource)(fixtureModule,fixtureModule.exports);
  const browser=await chromium.launch({headless:true,executablePath:process.env.TRADERLINK_TEST_CHROMIUM});
  const page=await browser.newPage({viewport:{width:1000,height:700}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  let preferences=null,revision=0;const requests=[];
  await page.addInitScript(()=>{
    window.__sources=[];
    class Source extends EventTarget{constructor(url){super();this.url=url;this.closed=false;window.__sources.push(this);queueMicrotask(()=>this.emit('status',{state:'connected'}));}close(){this.closed=true;}emit(type,data){if(!this.closed)this.dispatchEvent(new MessageEvent(type,{data:JSON.stringify(data)}));}}
    window.EventSource=Source;
  });
  await page.route('**/*',async route=>{
    const url=new URL(route.request().url());requests.push(url.pathname);
    if(url.pathname==='/')return route.fulfill({contentType:'text/html',body:'<html><body style="margin:0"><div id="root" style="height:700px;width:1000px"></div><script src="/fixture.js"></script></body></html>'});
    if(url.pathname==='/fixture.js')return route.fulfill({contentType:'text/javascript',body:Buffer.from(build.outputFiles[0].contents)});
    if(url.pathname==='/api/charts/preferences'){
      preferences??=fixtureModule.exports.DEFAULT_CHART_PREFERENCES;
      if(route.request().method()==='POST'){const body=route.request().postDataJSON();preferences=body.preferences;revision++;}
      return route.fulfill({json:{preferences,revision,ownerKey:'isolated-fixture'}});
    }
    if(url.pathname==='/api/screeners/charts/bars'){
      const current=Math.floor(Date.now()/60000)*60;
      const daily=url.searchParams.get('daily')==='1';
      const day=daily?fixtureModule.exports.easternDayStart(current):0;
      const bars=Array.from({length:30},(_,i)=>({time:daily?day-(29-i)*86400:current-(30-i)*60,open:2,high:2.02,low:1.98,close:2,volume:1000}));
      return route.fulfill({json:{bars,nextBefore:null,adjustment:'split'}});
    }
    throw Error('Unexpected isolated browser request: '+url.pathname);
  });
  try{
    await page.goto('https://chart-fixture.invalid/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.__charts?.some(c=>!c.removed&&c.series[0]?.data().length));
    for(const frame of ['1m','5m','15m','1h','4h','1D']){
      await page.getByRole('button',{name:`AAA ${frame} candles`,exact:true}).click();
      await page.waitForFunction(()=>window.__charts.filter(c=>!c.removed).length===1&&window.__charts.filter(c=>!c.removed)[0].series[0]?.data().length);
      const result=await page.evaluate(frame=>{
        const source=window.__sources.filter(s=>!s.closed).at(-1),current=Math.floor(Date.now()/60000)*60,time=frame==='1D'?window.__dayStart(current):current;
        source.emit('bar',{bar:{time,open:2,high:2.15,low:1.98,close:2.12,volume:1300},daily:frame==='1D',provisional:true});
        const chart=window.__charts.filter(c=>!c.removed)[0];return{daily:new URL(source.url,location.origin).searchParams.get('daily'),candle:chart.series[0].data().at(-1),volume:chart.series[1].data().at(-1),canvases:document.querySelectorAll('canvas').length};
      },frame);
      assert.equal(result.candle.close,2.12,frame+' close');assert.ok(result.volume.value>=1300,frame+' volume');assert.equal(result.daily,frame==='1D'?'1':'0');assert.ok(result.canvases>0);
    }
    await page.getByRole('button',{name:'Indicators',exact:true}).click();await page.getByRole('button',{name:'Add EMA',exact:true}).click();await page.getByRole('button',{name:'Close chart preferences'}).click();
    await page.waitForFunction(()=>window.__charts.filter(c=>!c.removed)[0]?.series.length===3);
    await page.evaluate(()=>window.__setSymbol('BBB'));await page.waitForFunction(()=>document.querySelector('[data-alpaca-chart="BBB"]')&&window.__charts.filter(c=>!c.removed)[0]?.series[0]?.data().length);
    assert.equal(preferences.indicators[0].type,'EMA');assert.equal(preferences.timeframe,'1D');
    await page.evaluate(()=>window.__unmount());assert.equal(await page.evaluate(()=>window.__sources.filter(s=>!s.closed).length),0);assert.equal(await page.evaluate(()=>window.__charts.filter(c=>!c.removed).length),0);
    assert.deepEqual(errors,[]);console.log('PASS real shared renderer: six timeframes, trade candle/volume, daily stream selection, indicator persistence, symbol switch, cleanup; no server/provider calls.');
  }finally{await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
