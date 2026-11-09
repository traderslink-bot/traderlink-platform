// Synthetic engine + full durable-audit throughput. Isolated temporary database; no providers.
const assert=require('node:assert/strict');
const {mkdtemp,rm}=require('node:fs/promises');
const {tmpdir}=require('node:os');
const {join,relative}=require('node:path');
const {execFileSync}=require('node:child_process');
const esbuild=require('esbuild');
async function main(){
 const base=process.env.TRADERLINK_CAPACITY_BASE||'08214bf084e53c9d59e2e975892c7f64a9a90b87';
 const build=await esbuild.build({stdin:{contents:"export{LiveScannerEngine}from'./src/modules/scanner/live/engine';export{initialConfiguration}from'./src/modules/scanner/live/settings';export{ScannerAuditStore}from'./src/modules/scanner/live/audit/server/audit-store';export{scannerConfigurationHash}from'./src/modules/scanner/live/audit/decision-trace';",loader:'ts',resolveDir:process.cwd()},bundle:true,write:false,platform:'node',format:'cjs',packages:'external',plugins:[{name:'live-high-drops-baseline',setup(build){
  build.onResolve({filter:/^server-only$/},()=>({path:'empty',namespace:'empty'}));build.onLoad({filter:/.*/,namespace:'empty'},()=>({contents:'',loader:'js'}));
  build.onLoad({filter:/\/(engine|premarket-pullbacks)\.ts$/},args=>{
   const name=relative(process.cwd(),args.path);if(!name.startsWith('src/modules/scanner/live/'))return;
   let contents=execFileSync('git',['show',base+':'+name],{encoding:'utf8'});
   if(name.endsWith('/engine.ts'))contents=contents.replace('const dayGainers = rows.filter(row => matches','const dayGainers = rows.filter(row => row.sessionGain !== null && matches').replace('(input.session !== "after_hours" || row.sessionGain !== null)','row.sessionGain !== null');
   return{contents,loader:'ts',resolveDir:join(process.cwd(),'src/modules/scanner/live')};
  });
 }}]});
 const moduleValue={exports:{}};new Function('require','module','exports',build.outputFiles[0].text)(require,moduleValue,moduleValue.exports);
 const {LiveScannerEngine,initialConfiguration,ScannerAuditStore,scannerConfigurationHash}=moduleValue.exports;
 const directory=await mkdtemp(join(tmpdir(),'tl-scanner-capacity-'));const store=await ScannerAuditStore.create(directory);
 try{
  const start=Date.parse('2026-11-09T15:00:00Z'),configuration={...initialConfiguration(),enabled:true};
  const universe={version:1,tradingDate:'2026-11-09',acceptedAtUtc:new Date(start).toISOString(),lastCollectionAtUtc:new Date(start).toISOString(),latestUploadCount:4000,sourceHashes:['synthetic'],stocks:Array.from({length:4000},(_,i)=>({symbol:'S'+i,exchange:'NASDAQ',marketCapAtCollection:10000000}))};
  const floats=new Map(universe.stocks.map(({symbol})=>[symbol,{shares:1000000,retrievedAtUtc:new Date(start).toISOString()}]));
  const input=second=>({universe,tradingDate:universe.tradingDate,session:'regular',floats,news:new Map(),configuration,now:start+second*1000,snapshots:universe.stocks.map(({symbol},i)=>{const price=2+i%100*.01+second*.00001,volume=1000000+second*100+i*10;return{symbol,company:symbol,provider:'alpaca',session:'regular',tradingDate:universe.tradingDate,priceTimeBasis:'session_observation',providerAt:start+second*1000,receivedAt:start+second*1000,price,baseline:1,volume,dollarVolume:price*volume,bid:price-.005,ask:price+.005,marketCap:null,dayHigh:4,dayLow:1,providerVolumeRatio:null};})});
  const engine=new LiveScannerEngine(true);for(const second of [0,60,300,600])engine.evaluate(input(second));
  const timings=[],writes=[];let rawBytes=0;
  for(let i=0;i<20;i++){
   const data=input(601+i),began=performance.now(),result=engine.evaluate(data);assert.equal(result.audit.length,4000);
   const cycle={timingMode:'alpaca_events_1s',schemaVersion:1,cycleId:'synthetic-'+i,runtimeInstanceId:'isolated-capacity',tradingDate:universe.tradingDate,session:'regular',scheduledAt:data.now,completedAt:data.now,universeSourceDate:universe.tradingDate,universeCount:4000,universeHash:'b'.repeat(64),configuration,configurationHash:scannerConfigurationHash(configuration),status:'ready',issues:[],missingSymbols:[],batches:[],decisions:result.audit,declines:result.declines,premarketPullbacks:result.premarketPullbacks};
   rawBytes=Math.max(rawBytes,Buffer.byteLength(JSON.stringify(cycle)));writes.push(await store.record(cycle));timings.push(performance.now()-began);
  }
  const health=store.health({queueDepth:0,droppedCycles:0,lastError:null,expectedActive:false,now:start+620000});
  assert.equal(health.cyclesToday,20);assert.equal(health.observationsToday,80000);
  timings.sort((a,b)=>a-b);writes.sort((a,b)=>a-b);
  const report={kind:'synthetic_4000_engine_and_full_audit',base,cycles:20,observations:80000,medianTotalMs:Math.round(timings[10]),p95TotalMs:Math.round(timings[18]),maxTotalMs:Math.round(timings[19]),p95AuditWriteMs:writes[18],largestRawCycleBytes:rawBytes,storedEvidenceBytes:health.evidenceBytesToday,controlDatabaseBytes:health.controlDatabaseBytes,heapMiB:Math.round(process.memoryUsage().heapUsed/1048576),note:'Sequential throughput with real compression/fsync/SQLite; excludes provider/network/concurrent browser load. No sampling or omitted decisions.'};
  console.log(JSON.stringify(report));assert.ok(timings[18]<1000,'P95 engine+full audit must fit the one-second cadence');
 }finally{store.close();await rm(directory,{recursive:true,force:true});}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
