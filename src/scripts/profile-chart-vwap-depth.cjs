// Synthetic source-stage depth profile; no provider, credentials or server.
const esbuild=require('esbuild');
(async()=>{
 const result=await esbuild.build({stdin:{resolveDir:process.cwd(),loader:'ts',contents:"export {ChartSessionCalendar} from './src/modules/scanner/alpaca/chart-calendar';export {visibleSessionBars,indicatorValues} from './src/modules/scanner/alpaca/chart-indicators';export {calculationInterval} from './src/modules/scanner/alpaca/chart-calculation-intervals';export {DEFAULT_CHART_PREFERENCES} from './src/modules/scanner/alpaca/chart-preferences';"},bundle:true,write:false,platform:'node',format:'cjs'});
 const module={exports:{}};new Function('module','exports',result.outputFiles[0].text)(module,module.exports);
 const {ChartSessionCalendar,visibleSessionBars,indicatorValues,calculationInterval,DEFAULT_CHART_PREFERENCES}=module.exports,sessions=[],bars=[];
 for(let n=0;sessions.length<100;n++){
  const d=new Date(Date.UTC(2026,4,1+n));if([0,6].includes(d.getUTCDay()))continue;
  const date=d.toISOString().slice(0,10);sessions.push({date,open:'09:30',close:'16:00'});
  const midnight=Date.parse(date+'T04:00:00Z')/1000;
  for(let m=240;m<1200;m++)bars.push({time:midnight+m*60,open:10,high:10,low:10,close:10,volume:1});
 }
 const calendar=new ChartSessionCalendar();calendar.merge({available:true,start:'2026-01-01',end:'2026-12-31',sessions});
 const t=performance.now(),visible=visibleSessionBars(bars,DEFAULT_CHART_PREFERENCES,calendar),a=performance.now(),points=indicatorValues(visible,{id:'vwap',type:'VWAP',period:20,color:'#123456',width:2},'1m',{calendar})[0].points,b=performance.now();
 for(const point of points)calculationInterval(point.time,'1m',DEFAULT_CHART_PREFERENCES,calendar);
 const c=performance.now();if(points.length!==96000||points.at(-1).value!==10)throw Error('Profile changed numeric output');
 console.log(JSON.stringify({bars:bars.length,sessionFilterMs:a-t,vwapMs:b-a,intervalsMs:c-b,totalMs:c-t}));
})().catch(e=>{console.error(e);process.exitCode=1;});
