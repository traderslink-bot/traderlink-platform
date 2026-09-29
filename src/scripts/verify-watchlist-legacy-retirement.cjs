const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {changes}=require('./package-watchlist-legacy-retirement.cjs');
const read=(lane,file)=>changes[lane].get(file).after;
function evaluate(s,globals={}) { const module={exports:{}};vm.runInNewContext(ts.transpileModule(s,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText,{module,exports:module.exports,require:()=>{throw Error('Unexpected dependency');},Date,URL,URLSearchParams,AbortController,Response,Request,Buffer,console,...globals});return module.exports; }
function nodes(s,predicate){const found=[];function visit(n){if(predicate(n))found.push(n);ts.forEachChild(n,visit);}visit(ts.createSourceFile('file.tsx',s,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX));return found;}
const manager=read('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts');
function managerMethods(names,globals={}) { return evaluate('export class Subject {\n'+names.map(name=>nodes(manager,n=>ts.isMethodDeclaration(n)&&n.name.getText()===name)[0].getText()).join('\n')+'\n}',{normalizeSymbol:s=>s.toUpperCase(),...globals}).Subject; }
(async()=>{
 // Every public state reducer explicitly defaults visible and preserves false on unrelated patches.
 const store=read('platform','src/lib/live-watchlist/live-watchlist-store.ts');
 const properties=nodes(store,n=>ts.isPropertyAssignment(n)&&n.name.getText()==='indicatorCardVisible');assert.equal(properties.length,3);
 for(const p of properties) { const expression=p.initializer.getText();
  const value=(vars)=>vm.runInNewContext(expression,vars);
  if(expression.includes('state.')) {assert.equal(value({state:{}}),true);assert.equal(value({state:{indicatorCardVisible:false}}),false);}
  else for(const flag of [true,false]) {assert.equal(value({patch:{indicatorCardVisible:flag},existing:{},baseExisting:{}}),flag);assert.equal(value({patch:{},existing:{indicatorCardVisible:flag},baseExisting:{indicatorCardVisible:flag}}),flag);}
 }
 // Visibility setter persists, publishes only allowed listings, never schedules AI or notification.
 const Subject=managerMethods(['setIndicatorCardVisible','refreshPullbackReadIntradayCandles','pullbackReadEnabled']);
 for(const visible of [false,true])for(const listed of [false,true]) {
  let saved=0,published=0;const subject=new Subject();subject.options={now:()=>1000};
  subject.watchlistStore={patchEntry:(symbol,patch)=>({symbol,active:true,...patch})};subject.persistWatchlist=()=>saved++;
  subject.isWatchlistPublicationApproved=()=>listed;subject.liveWatchlistPublisher={publish:async patch=>{published++;assert.equal(patch.indicatorCardVisible,visible);assert.equal(patch.symbol,'FTFT');assert.equal(Object.keys(patch.cards).length,0);}};
  assert.equal((await subject.setIndicatorCardVisible('ftft',visible)).indicatorCardVisible,visible);assert.equal(saved,1);assert.equal(published,listed?1:0);
 }
 const off=new Subject();off.options={indicatorCandleLoader:()=>{throw Error('Disabled ticker requested candles');}};off.watchlistStore={getEntry:()=>({active:true,indicatorCardVisible:false})};await off.refreshPullbackReadIntradayCandles('FTFT');assert.equal(off.pullbackReadEnabled(),false);
 // Actual persistence serialization/validation functions, with filesystem access forbidden.
 const persistence=evaluate(read('runtime','src/lib/monitoring/watchlist-state-persistence.ts')+'\nexport { validateEntry, buildPersistedState };',{process:{cwd:()=>'/offline'},require:name=>name==='node:path'?require(name):name==='node:fs'?new Proxy({},{get:()=>()=>{throw Error('Filesystem not permitted');}}):{normalizeAiReadAdmission:()=>undefined,normalizePublicationReview:()=>undefined,normalizeOvernightLevelReference:()=>undefined}});
 for(const flag of [undefined,true,false]) {
  const entry={symbol:'FTFT',active:true,priority:1,tags:[],indicatorCardVisible:flag};
  const saved=persistence.buildPersistedState([entry],1000);const restored=persistence.validateEntry(JSON.parse(JSON.stringify(saved.entries[0])));
  assert.ok(restored);assert.equal(restored.indicatorCardVisible,flag);
 }
 // Real provider function: a queued request observes Off before calling fetch, including later pages.
 const provider=evaluate(read('platform','src/lib/live-watchlist/indicators/indicator-history-provider.ts'));
 let transports=0,fetches=0;
 const result=await provider.fetchIndicatorHistory({provider:'moomoo',request:{symbol:'FTFT',timeframe:'5m',start:Date.UTC(2026,8,25,13),end:Date.UTC(2026,8,25,14)},scope:'test',consumer:'test',budget:{attemptsRemaining:2,retriesRemaining:0},requestAllowed:async()=>false,fetcher:async()=>{fetches++;throw Error('Must not fetch');},coordinator:{request:async input=>{transports++;return {kind:'completed',result:await input.execute(new AbortController().signal),transportIds:['offline-check']};}}});
 assert.equal(result.outcome,'permission');assert.equal(fetches,0);assert.equal(transports,1);
 // Execute authenticated scheduler route with disabled, visible and toggled-off-before-after states.
 const routeText=read('platform','app/api/live-watchlist/indicators/refresh/route.ts');
 for(const scenario of ['off','on','queued-off']) {
  const ticker={symbol:'FTFT',firstPostedAt:1000,status:'live',indicatorCardVisible:scenario!=='off'};let refreshed=0;const callbacks=[];
  const route=evaluate(routeText,{process:{env:{TRADERSLINK_WATCHLIST_PUBLISHER_TOKEN:'offline-test'}},require:name=>name==='node:crypto'?require(name):name==='next/server'?{after:fn=>callbacks.push(fn)}:name.includes('live-watchlist-store')?{LiveWatchlistStore:class {async getSymbol(){return ticker;}async listSymbols(){return{symbols:[ticker]};}}}:{readSharedWatchlistIndicatorCandles:()=>null,reconcileWatchlistIndicatorPopulation:()=>{},refreshWatchlistIndicators:async()=>refreshed++}});
  const response=await route.POST(new Request('https://example.invalid/api/live-watchlist/indicators/refresh',{method:'POST',headers:{authorization:'Bearer offline-test','content-type':'application/json'},body:JSON.stringify({symbol:'FTFT',activatedAt:1000})}));assert.equal(response.status,200);
  if(scenario==='queued-off')ticker.indicatorCardVisible=false;
  for(const fn of callbacks)await fn();assert.equal(refreshed,scenario==='on'?1:0);
 }
 const ui=read('runtime','src/runtime/manual-watchlist-page.ts');
 const rendered=evaluate(ui,{require:()=>({ANALYSIS_REVIEW_PANEL:'',WATCHLIST_ROW_REVIEW:'',WATCHLIST_DISCORD_MENTIONS_PANEL:''})}).MANUAL_WATCHLIST_PAGE;let scripts=0;
 for(const match of rendered.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {new vm.Script(match[1]);scripts++;}assert.ok(scripts>0);
 assert.ok(ui.includes('Show indicator card for '));assert.ok(ui.includes('"/api/watchlist/indicator-visibility"'));assert.ok(ui.includes('role", "switch"'));
 const jsx=read('platform','app/watchlist/live-watchlist-client.tsx');assert.ok(jsx.includes('symbol.indicatorCardVisible !== false ? ('));assert.ok(jsx.includes('!LEGACY_WATCHLIST_READ_ENABLED'));
 // New method must contain no AI/Discord/notification action.
 const setter=nodes(manager,n=>ts.isMethodDeclaration(n)&&n.name.getText()==='setIndicatorCardVisible')[0].getText();assert.doesNotMatch(setter,/scheduleTradersLink|notify|discord/i);
 console.log('PASS: default/on/off state, owner-control wiring, persistence round-trip, unpublished ticker gate, disabled polling, queued provider suppression, scheduler recheck, embedded Admin JavaScript and legacy display guards. No network requests or hosted writes.');
})().catch(error=>{console.error(error);process.exitCode=1;});
