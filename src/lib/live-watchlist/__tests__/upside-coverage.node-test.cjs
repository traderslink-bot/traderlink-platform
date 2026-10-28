const assert=require('node:assert/strict'),{test}=require('node:test'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),ts=require('typescript');
const root=path.resolve(__dirname,'../../../..');
function load(file,ports={}){const exports={};const out=ts.transpileModule(fs.readFileSync(path.join(root,file),'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}});assert.equal(out.diagnostics.length,0);vm.runInNewContext(out.outputText,{exports,structuredClone,Date,process:{env:{NODE_ENV:'test'}},require:n=>ports[n]??require(n)});return exports;}
const c=load('src/lib/live-watchlist/watchlist-upside-coverage.ts'),at=Date.UTC(2026,9,28,19);
const b=(t)=>({timestamp:t,open:16,high:18,low:15,close:17});
const coverage=c.evaluateUpsideCoverage({symbol:'SAMPLE',currentPrice:25,dataAsOf:at,priceAction:{recentDailyBars:[b(at-3*86400000),b(at-86400000)],recentFiveMinuteBars:[b(at-900000),b(at-600000)]}});
const read=()=>({symbol:'SAMPLE',analysisFormat:'simple',version:3,currentPrice:20,generatedAt:at-60000,dataAsOf:at-60000,simpleAnalysis:{setup:'Setup',pullbacks:[],upside:[{low:21,high:21,explanation:'Original'}],invalidation:null},targets:[{price:21,condition:'Original'}]});
const context=()=>({analysisGeneratedAt:at-60000,analysisReferencePrice:20,targetPrices:[21],coverage});
test('optional coverage metadata and generation-scoped live context preserve usable targets',()=>{
  assert.equal(c.upsidePresentation({...read(),upsideCoverage:{version:999}}).message,null);
  assert.equal(c.upsidePresentation(read(),context()).message,c.NO_HIGHER_TARGETS);
  assert.equal(c.upsidePresentation(read(),{...context(),analysisGeneratedAt:1}).message,null);
});
test('owner editor preview keeps code message for text-only edits and immediately shows owner-added prices',()=>{
  const order=load('src/lib/live-watchlist/pullback-price-order.ts');
  const edit=load('src/lib/live-watchlist/analysis-inline-edit.ts',{'./pullback-price-order':order,'./watchlist-upside-coverage':c});
  const original={...read(),upsideCoverage:coverage,simpleAnalysis:{...read().simpleAnalysis,upside:[]}};
  const patch=edit.makeAnalysisEdit(original);patch.simpleAnalysis.setup='My explanation';
  assert.equal(c.upsidePresentation(edit.mergeAnalysisEdit(original,patch)).message,c.NO_HIGHER_TARGETS);
  patch.simpleAnalysis.upside=[{low:30,high:30,explanation:'My target'}];
  const result=edit.mergeAnalysisEdit(original,patch);assert.equal(result.upsideCoverage.provenance,'owner');assert.equal(c.upsidePresentation(result).message,null);
  assert.equal(original.simpleAnalysis.upside.length,0);
});
test('Premium/plan denied projection strips live analysis context; level-only restriction does not hide eligible analysis',()=>{
  const project=load('src/lib/live-watchlist/watchlist-member-projection.ts',{'./premium-analysis-preview':{buildPremiumAnalysisPreview:()=>({fixture:true})},'./traderslink-ai-read':{parseTradersLinkAiRead:JSON.parse}}).watchlistDetailProjection;
  const state={symbol:'SAMPLE',cards:{tradersLinkAiRead:{body:JSON.stringify(read())}},analysisUpsideContext:context()};
  assert.equal(project(state,false).analysisUpsideContext,undefined);
  assert.equal(project(state,true,false).analysisUpsideContext,undefined);
  assert.ok(project(state,true,true,false).analysisUpsideContext);
  assert.ok(state.analysisUpsideContext);
});
test('live quote context is generation/identity bound and preserves original card body and publication time in SQLite',async t=>{
  const Database=require('better-sqlite3'),db=new Database(':memory:');t.after(()=>db.close());
  const migration=load('src/modules/watchlist/server/database/migrations/0014_watchlist_storage.ts').watchlistStorageMigration;for(const sql of migration.statements)db.exec(sql);
  const evidence=load('src/lib/live-watchlist/resistance-evidence.ts'),view=load('src/lib/live-watchlist/historical-resistance-view.ts',{'./resistance-evidence':evidence});
  const ports={'./watchlist-upside-coverage':c,'./historical-resistance-view':view,'./gain-starting-point':{prepareGain:v=>v,observeGain:()=>({potentialGain:null})},'./top-watches-group':{isTopWatchesGroup:()=>false},'@neondatabase/serverless':{},'@/src/modules/platform/server/database/open-platform-database':{openPlatformDatabase:()=>db},'@/src/modules/platform/server/database/platform-migration-contract':{platformFailure:()=>{throw Error('unexpected')}},'@/src/modules/platform/server/database/platform-storage-backend':{requirePlatformSingleNodeSqliteStorage(){}},'@/src/modules/watchlist/server/database/migrations/0014_watchlist_storage':{watchlistStorageMigration:migration}};
  const {LiveWatchlistStore}=load('src/lib/live-watchlist/live-watchlist-store.ts',ports),store=new LiveWatchlistStore();
  const body=JSON.stringify(read()),state={symbol:'SAMPLE',status:'live',updatedAt:at-60000,firstPostedAt:at-60000,latestPrice:25,cards:{tradersLinkAiRead:{body,source:'ai_read',updatedAt:at-60000,priceWhenPosted:20}}};
  db.prepare("INSERT INTO live_watchlist_symbols(symbol,status,updated_at,state_json) VALUES('SAMPLE','live',?,?)").run(state.updatedAt,JSON.stringify(state));
  const patch={type:'tickerData',symbol:'SAMPLE',updatedAt:at,latestPrice:25,nearestSupport:null,nearestResistance:null,analysisUpsideContext:context()};
  await store.upsertTickerData(patch);let result=await store.getSymbol('SAMPLE');assert.equal(result.analysisUpsideContext.coverage.status,coverage.status);assert.equal(result.cards.tradersLinkAiRead.body,body);assert.equal(result.firstPostedAt,state.firstPostedAt);
  await store.upsertTickerData({...patch,updatedAt:at+1,analysisUpsideContext:{...context(),analysisGeneratedAt:1}});result=await store.getSymbol('SAMPLE');assert.equal(result.analysisUpsideContext.analysisGeneratedAt,context().analysisGeneratedAt);assert.equal(result.cards.tradersLinkAiRead.body,body);
});

test('compact browser reconciliation keeps matching context and drops previous activation/generation context',()=>{
  const reconcile=load('src/lib/live-watchlist/live-watchlist-reconciliation.ts',{'./watchlist-upside-coverage':c}).reconcileLiveWatchlistSymbolState;
  const state={symbol:'SAMPLE',updatedAt:at,indicatorPublicationIdentity:'activation-one',cards:{tradersLinkAiRead:{body:JSON.stringify(read()),updatedAt:at}},
    analysisUpsideContext:{...context(),publicationIdentity:'activation-one'}};
  const compact={...state,updatedAt:at+1,analysisUpsideContext:undefined};
  assert.ok(reconcile(state,compact).analysisUpsideContext);
  assert.equal(reconcile(state,{...compact,indicatorPublicationIdentity:'activation-two'}).analysisUpsideContext,undefined);
  assert.equal(reconcile(state,{...compact,cards:{tradersLinkAiRead:{body:JSON.stringify({...read(),generatedAt:at+1}),updatedAt:at+1}}}).analysisUpsideContext,undefined);
});
