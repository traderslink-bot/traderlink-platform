const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare}=require('./package-watchlist-premium-analysis.cjs');
const files=prepare();
function load(file,requireModule=()=>({})){
 const out=ts.transpileModule(files.get(file),{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(out.diagnostics.length,0,file);const m={exports:{}};
 vm.runInNewContext(out.outputText,{module:m,exports:m.exports,require:requireModule,Date,Error});return m.exports;
}
for(const [file,text] of files)if(/\.tsx?$/.test(file)){
 const result=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal(result.diagnostics.length,0,file);
}
const preview=load('src/lib/live-watchlist/premium-analysis-preview.ts');
const read={version:3,ownerHiddenSections:['cautionBelow'],currentRead:'Hold $4.52, then 5.32; 12% upside.',
 needsToHold:{price:4.52,rationale:'Above 4.52'},cautionBelow:{price:3.99,rationale:'secret hidden section'},
 momentumFailure:{price:3.25,rationale:'Below $3.25'},mustClear:{price:null,rationale:''},breakoutContinuation:{price:5.32,rationale:'Clear 5.32'},
 targets:[{price:7.15,condition:'7.15 next'}],pullbackPlans:{shallow:null,deep:{rationale:'Wait near 3.42',confirmation:'Reclaim 3.89',firstObjectivePrice:null}},
 failureRecovery:null,catalystRealityCheck:{summary:'New product',dayTradeRelevance:'Attention'},riskSummary:['Risk below 3.25'],
 usage:{private:12345},sources:[{url:'https://private.example/4.52'}]};
const safe=preview.buildPremiumAnalysisPreview(read);const serialized=JSON.stringify(safe);
for(const secret of ['4.52','5.32','7.15','3.42','3.89','12%','secret hidden section','private.example','12345'])assert(!serialized.includes(secret),secret);
assert(safe.sections.some(s=>s.title==='Deeper pullback'));
const project=load('src/lib/live-watchlist/watchlist-member-projection.ts',name=>name.includes('premium-analysis-preview')?preview:{parseTradersLinkAiRead:()=>read}).watchlistDetailProjection;
const state={symbol:'TEST',cards:{tradersLinkAiRead:{body:'secret raw'},liveTraderRead:{body:'other secret'},companyInfo:{body:'keep'}},latestTraderReadHeadline:'5.32'};
const restricted=project(state,true,false);
assert(!restricted.cards.tradersLinkAiRead);assert(!restricted.cards.liveTraderRead);assert(restricted.premiumAnalysisPreview);assert.equal(restricted.cards.companyInfo.body,'keep');assert.equal(restricted.latestTraderReadHeadline,null);
assert(project(state,true,true).cards.tradersLinkAiRead);
assert.equal(project(state,false,false).premiumAnalysisPreview,null);
assert(!project(restricted,true).cards.tradersLinkAiRead);
const control=load('src/modules/watchlist/server/runtime/watchlist-premium-control.ts').WATCHLIST_PREMIUM_CONTROL;
new vm.Script(control.match(/<script>([\s\S]*)<\/script>/)[1]);
const migration=load('src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_analysis_access.ts').platformWatchlistPremiumAnalysisAccessMigration;
const Sqlite=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/better-sqlite3');
const db=new Sqlite(':memory:');db.exec('CREATE TABLE platform_users(user_id TEXT PRIMARY KEY); INSERT INTO platform_users VALUES (\'owner\')');migration.statements.forEach(sql=>db.exec(sql));
const service=load('src/modules/watchlist/server/access/watchlist-analysis-visibility.ts');
assert.equal(service.readAnalysisPremiumOnly(db,'TEST'),false);
service.saveAnalysisPremiumOnly(db,{symbol:'TEST',premiumOnly:true,actorUserId:'owner'});assert.equal(service.readAnalysisPremiumOnly(db,'TEST'),true);
service.saveAnalysisPremiumOnly(db,{symbol:'TEST',premiumOnly:false,actorUserId:'owner'});assert.equal(service.readAnalysisPremiumOnly(db,'TEST'),false);
assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_analysis_visibility_audit').get().n,2);db.close();
let owner=false,premium=false,premiumOnly=true,unavailable=false;
const access=load('src/modules/watchlist/server/access/watchlist-analysis-visibility.ts',name=>{
 if(name==='server-only')return {};
 if(name.includes('require-platform-request-scope'))return {requireTraderLinkPlatformRequestIdentity:()=>({discord:{}}),requireTraderLinkPlatformDiscordMemberRequestIdentity:()=>({discord:{}})};
 if(name.includes('navigation-access'))return {hasWatchlistDashboardNavigationAccess:()=>owner};
 if(name.includes('entitlement'))return {hasPlatformDiscordPremiumAccess:()=>premium};
 if(name.includes('open-readonly'))return {withReadonlyPlatformDatabase:(_options,fn)=>{if(unavailable)throw Error('offline');return fn({prepare:()=>({get:()=>({premium_only:Number(premiumOnly)})})});}};
 return {};
});
assert.equal(access.canViewWatchlistAnalysisPrices({},'TEST'),false);
premium=true;assert.equal(access.canViewWatchlistAnalysisPrices({},'TEST'),true);
premium=false;premiumOnly=false;assert.equal(access.canViewWatchlistAnalysisPrices({},'TEST'),true);
unavailable=true;assert.equal(access.canViewWatchlistAnalysisPrices({},'TEST'),false);
owner=true;assert.equal(access.canViewWatchlistAnalysisPrices({},'TEST'),true);
console.log('PASS: focused preview/projection, in-memory settings/audit, TypeScript syntax and embedded control syntax. No network or production writes.');
