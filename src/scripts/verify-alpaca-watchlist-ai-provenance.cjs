// Offline exact-runtime-source contract verification. No runtime checkout writes or network.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const runtime = '/home/traderlink/projects/watchlist-gain-runtime';
const parent = '14748d4fd18a55623ad6cbe9c378afeee3ba5139';
const loaderPath = 'src/lib/market-data/platform-moomoo-ai-read-candle-loader.ts';
const servicePath = 'src/lib/market-data/selectable-same-day-candle-service.ts';
const managerPath = 'src/lib/monitoring/manual-watchlist-runtime-manager.ts';
const originals = new Map([loaderPath, servicePath, managerPath].map(file => [file,
  cp.execFileSync('git', ['-C', runtime, 'show', `${parent}:${file}`], {encoding:'utf8'})]));
const patched = new Map(originals);
const patch = fs.readFileSync(path.join(root, 'docs/migration/alpaca-watchlist-ai-provenance-runtime.patch'), 'utf8');

// Apply only exact matching unified hunks in memory; stale parent bytes fail closed.
for (const section of patch.split(/(?=^--- a\/)/m).filter(Boolean)) {
  const lines = section.split('\n');
  const file = lines[0].slice('--- a/'.length);
  assert.ok(originals.has(file), `Unexpected runtime patch path ${file}`);
  assert.equal(lines[1], `+++ b/${file}`);
  const input = originals.get(file).split('\n');
  const output = []; let cursor = 0;
  for (let index = 2; index < lines.length;) {
    if (!lines[index]) { index++; continue; }
    const hunk = /^@@ -(\d+)(?:,\d+)? \+\d+(?:,\d+)? @@/.exec(lines[index++]);
    assert.ok(hunk, 'Expected unified hunk');
    const start = Number(hunk[1]) - 1;
    output.push(...input.slice(cursor, start)); cursor = start;
    while (index < lines.length && !lines[index].startsWith('@@')) {
      const line = lines[index++];
      if (!line && index === lines.length) break;
      const prefix = line[0], value = line.slice(1);
      if (prefix === ' ' || prefix === '-') assert.equal(input[cursor++], value, `${file}: stale patch`);
      if (prefix === ' ' || prefix === '+') output.push(value);
      assert.ok([' ', '-', '+'].includes(prefix), 'Unexpected patch line');
    }
  }
  output.push(...input.slice(cursor)); patched.set(file, output.join('\n'));
}

function moduleFrom(source, dependencies) {
  const js = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
  const evaluatedModule = {exports:{}};
  new Function('require', 'module', 'exports', js)(name => {
    assert.ok(Object.hasOwn(dependencies, name), `Unapproved dependency ${name}`);
    return dependencies[name];
  }, evaluatedModule, evaluatedModule.exports);
  return evaluatedModule.exports;
}
const loadModule = source => moduleFrom(source, {'../ai/traderslink-ai-read-market-context.js':{
  closedMarketAnalysisWindow:() => null,
}});
const now = Date.parse('2026-11-06T15:00:00Z');
const bars = Array.from({length:30}, (_, index) => ({timestamp:now-1_800_000+index*60_000,
  open:'2.4',high:'2.5',low:'2.3',close:'2.45',volume:'100'}));
const environment = {TRADERSLINK_WATCHLIST_INGEST_URL:'https://fixture.invalid/api/live-watchlist/ingest',
  TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN:'offline-fixture'};
let payload = {status:'ready',provider:'alpaca',candles:bars}, status=200, assertions=0;
const equal = (actual, expected) => { assert.deepEqual(actual,expected); assertions++; };
const previousFetch = global.fetch;
global.fetch = async (url, options) => {
  equal(new URL(url).origin,'https://fixture.invalid');
  equal(options.headers.Authorization,'Bearer offline-fixture');
  return Response.json(payload,{status});
};

function managerClass(source) {
  const ast=ts.createSourceFile('manager.ts',source,ts.ScriptTarget.Latest,true);
  const declaration=ast.statements.find(node=>ts.isClassDeclaration(node)&&node.name?.text==='ManualWatchlistRuntimeManager');
  const method=declaration.members.find(node=>node.name?.getText(ast)==='buildTradersLinkAiReadPriceActionContext');
  assert.ok(method, 'Exact manager context method missing');
  const js=ts.transpileModule(`class Harness { ${method.getText(ast)} }; return Harness;`,{
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS},
  }).outputText;
  return new Function('normalizeSymbol','normalizePullbackCandles',
    'resolveTradersLinkAiReadHistoricalCoverageRequirement','datedPreviousRegularSession',
    'closedMarketAnalysisWindow','buildTradersLinkAiCompletedSessionWindow','mergeTradersLinkAiIntradayCandles', js)(
    value=>value.toUpperCase(),value=>value,()=>({requestedDailyBars:20}),()=>({close:null}),
    ()=>null,()=>({fromTimeMs:now-86_400_000,toTimeMs:now-60_000}),(current,older)=>[...older,...current]);
}
function manager(source, loader) {
  const Harness=managerClass(source), value=new Harness();
  value.chartThesisSeriesMapBySymbol=new Map();
  value.technicalContextCandleStore={getCandles:()=>[]};
  value.technicalContextProviderBySymbol=new Map();
  value.options={levelStore:{getLevels:()=>null},now:()=>now,tradersLinkAiReadMoomooCandleLoader:loader};
  return value;
}

(async()=>{
  const original=loadModule(originals.get(loaderPath));
  await assert.rejects(original.createPlatformMoomooAiReadCandleLoader(environment)({symbol:'NWGL',asOfTimeMs:now}),
    error=>error.failure==='bridge_unavailable'); assertions++;
  const changed=loadModule(patched.get(loaderPath));
  const loader=changed.createPlatformMoomooAiReadCandleLoader(environment);
  equal(changed.createPlatformMoomooAiReadCandleLoader({}),null);
  const alpaca=await loader({symbol:'NWGL',asOfTimeMs:now});
  equal(alpaca.provider,'alpaca');equal(alpaca.oneMinuteCandles.length,30);equal(alpaca.fiveMinuteCandles.length,6);
  equal(alpaca.oneMinuteCandles[0].timestamp,bars[0].timestamp);
  equal(alpaca.fiveMinuteCandles[0].volume,500);
  const before=await manager(originals.get(managerPath),async()=>alpaca).buildTradersLinkAiReadPriceActionContext('NWGL',now);
  equal(before.source,'Moomoo Open API current-session OHLCV');
  const after=await manager(patched.get(managerPath),async()=>alpaca).buildTradersLinkAiReadPriceActionContext('NWGL',now);
  equal(after.source,'Alpaca current-session OHLCV');equal(after.oneMinuteCandles,alpaca.oneMinuteCandles);
  equal(after.intradayCandles,alpaca.fiveMinuteCandles);
  const early=await manager(patched.get(managerPath),async()=>({...alpaca,fiveMinuteCandles:[]}))
    .buildTradersLinkAiReadPriceActionContext('NWGL',now);
  equal(early.source,'Alpaca current-session OHLCV');equal(early.intradayCandles,[]);
  const historical=manager(patched.get(managerPath),async()=>alpaca);
  historical.options.tradersLinkAiReadHistoricalCandleLoader=async input=>({series:[{
    timeframe:input.timeframes[0],provider:'alpaca',candles:[alpaca.fiveMinuteCandles[0]],
  }]});
  const combined=await historical.buildTradersLinkAiReadPriceActionContext('NWGL',now);
  equal(combined.source,'Alpaca current-session + alpaca completed-session OHLCV');
  equal(combined.dailyCandles.length,1);equal(combined.fourHourCandles.length,1);
  payload={...payload,provider:'moomoo_open_api'};
  const moomoo=await loader({symbol:'NWGL',asOfTimeMs:now});equal(moomoo.provider,'moomoo');
  equal((await manager(patched.get(managerPath),async()=>moomoo).buildTradersLinkAiReadPriceActionContext('NWGL',now)).source,
    'Moomoo Open API current-session OHLCV');
  const {provider:ignored,...legacy}=moomoo; void ignored;
  equal((await manager(patched.get(managerPath),async()=>legacy).buildTradersLinkAiReadPriceActionContext('NWGL',now)).source,
    'Moomoo Open API current-session OHLCV');
  for(const provider of ['yahoo','unknown',undefined]) {
    payload={status:'ready',provider,candles:bars};
    await assert.rejects(loader({symbol:'NWGL',asOfTimeMs:now}),error=>error.failure==='bridge_unavailable');assertions++;
  }
  for(const candles of [[{...bars[0],high:'1'}],[{...bars[0],timestamp:now+60_000}],
    [bars[0],{...bars[0],close:'2.46'}],[]]) {
    payload={status:'ready',provider:'alpaca',candles};
    await assert.rejects(loader({symbol:'NWGL',asOfTimeMs:now}));assertions++;
  }
  status=503;payload={status:'unavailable',code:'coverage_unavailable'};
  await assert.rejects(loader({symbol:'NWGL',asOfTimeMs:now}),error=>error.failure==='coverage_unavailable');assertions++;
  // Use the actual selected-source service; unrelated transports are inert test doubles.
  const service=moduleFrom(patched.get(servicePath),{
    './alpaca-runtime-providers.js':{AlpacaRuntimeHistoricalProvider:class{}},
    './candle-fetch-service.js':{CandleFetchService:class{}},
    './candle-quality.js':{finalizeCandleProviderResponse:input=>({...input,actualBarsReturned:input.candles.length,
      completenessStatus:'complete',validationIssues:[]})},
    './platform-moomoo-ai-read-candle-loader.js':changed,
  });
  let fallbackCalls=0;
  const yahoo={getProviderName:()=> 'yahoo',fetchCandles:async()=>{fallbackCalls++;return {
    provider:'yahoo',actualBarsReturned:1,completenessStatus:'complete',validationIssues:[]};}};
  const request={symbol:'NWGL',timeframe:'5m',lookbackBars:6,endTimeMs:now};
  const mismatch=new service.SelectableSameDayCandleService('moomoo',yahoo,async()=>alpaca,()=>now);
  equal((await mismatch.fetchCandles(request)).provider,'yahoo');equal(fallbackCalls,1);
  equal(mismatch.getDiagnostics().activeProvider,'yahoo');equal(mismatch.getDiagnostics().fallbackActive,true);
  const matching=new service.SelectableSameDayCandleService('moomoo',yahoo,async()=>moomoo,()=>now);
  equal((await matching.fetchCandles(request)).provider,'moomoo');equal(fallbackCalls,1);
  equal(matching.getDiagnostics().activeProvider,'moomoo');
  console.log(`PASS: ${assertions} offline exact-parent loader, AI context provenance and strict Moomoo/fallback assertions.`);
  console.log('Original runtime defects reproduced; patched contracts pass. No network, AI, notifications, runtime writes or hosted actions.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(()=>{global.fetch=previousFetch;});
