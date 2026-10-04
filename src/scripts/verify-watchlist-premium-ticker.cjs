const {prepare,source}=require('./package-watchlist-premium-ticker.cjs');
const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const files=prepare();
function load(file,requires=()=>({})){const result=ts.transpileModule(files.get(file)??source(file),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}});assert.equal(result.diagnostics.length,0,file);const m={exports:{}};vm.runInNewContext(result.outputText,{module:m,exports:m.exports,require:requires,Date,Error,TextEncoder,ReadableStream});return m.exports;}
for(const [file,text] of files){if(!/\.tsx?$/.test(file))continue;const r=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}});assert.equal(r.diagnostics.length,0,file);}
const migration=load('src/modules/platform/server/database/migrations/0155_platform_watchlist_premium_access_controls.ts').platformWatchlistPremiumAccessControlsMigration;
const Sqlite=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/better-sqlite3');
const db=new Sqlite(':memory:');db.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY);INSERT INTO platform_users VALUES('owner')");migration.statements.forEach(sql=>db.exec(sql));
let isOwner=false,isPremium=false,failed=false;
const access=load('src/modules/watchlist/server/access/watchlist-analysis-visibility.ts',name=>{
 if(name.includes('require-platform-request-scope'))return {requireTraderLinkPlatformRequestIdentity:()=>({discord:{}}),requireTraderLinkPlatformDiscordMemberRequestIdentity:()=>({discord:{}})};
 if(name.includes('navigation-access'))return {hasWatchlistDashboardNavigationAccess:()=>isOwner};
 if(name.includes('entitlement'))return {hasPlatformDiscordPremiumAccess:()=>isPremium};
 if(name.includes('open-readonly'))return {withReadonlyPlatformDatabase:(_options,fn)=>{if(failed)throw Error('offline');return fn(db);}};
 return {};
});
assert.equal(access.readTickerPremiumOnly(db,'SECRET'),false);assert.equal(access.readAnalysisPremiumOnly(db,'SECRET'),false);
access.saveAnalysisPremiumOnly(db,{symbol:'SECRET',premiumOnly:true,actorUserId:'owner'});
access.saveTickerPremiumOnly(db,{symbol:'SECRET',premiumOnly:true,actorUserId:'owner'});
assert.equal(access.canViewWatchlistTicker({},'SECRET'),false);assert.equal(access.canViewWatchlistAnalysisPrices({},'SECRET'),false);
isPremium=true;assert.equal(access.canViewWatchlistTicker({},'SECRET'),true);isPremium=false;
isOwner=true;assert.equal(access.canViewWatchlistTicker({},'SECRET'),true);isOwner=false;
access.saveTickerPremiumOnly(db,{symbol:'SECRET',premiumOnly:false,actorUserId:'owner'});
assert.equal(access.canViewWatchlistTicker({},'SECRET'),true);assert.equal(access.readAnalysisPremiumOnly(db,'SECRET'),true);
access.saveTickerPremiumOnly(db,{symbol:'SECRET',premiumOnly:true,actorUserId:'owner'});
access.saveAnalysisPremiumOnly(db,{symbol:'SECRET',premiumOnly:false,actorUserId:'owner'});
assert.equal(access.canViewWatchlistTicker({},'SECRET'),false);assert.equal(access.readAnalysisPremiumOnly(db,'SECRET'),false);
failed=true;assert.equal(access.canViewWatchlistTicker({},'OTHER'),false);failed=false;
assert.equal(db.prepare('SELECT count(*) n FROM platform_watchlist_analysis_visibility_audit').get().n,5);
assert.equal(db.prepare("SELECT count(*) n FROM platform_watchlist_analysis_visibility_audit WHERE control='ticker'").get().n,3);
const projection=load('src/modules/watchlist/server/access/watchlist-ticker-projection.ts',name=>name==='node:crypto'?require(name):name.includes('visibility')?access:{});
const original={symbol:'SECRET',companyInfo:{country:'US',name:'Private company'},latestPrice:12.34,firstPostedAt:100,updatedAt:120,status:'live',watchlistGroup:'swings',cards:{hidden:'private'},watchlistLifecycle:{secret:'SECRET'}};
const masked=projection.projectWatchlistTickerForViewer(original,{}),serialized=JSON.stringify(masked);
for(const secret of ['SECRET','Private company','12.34','US','private'])assert(!serialized.includes(secret),secret);
assert(masked.premiumTickerHidden);assert.equal(masked.watchlistGroup,'swings');assert.equal(masked.symbol,projection.projectWatchlistTickerForViewer(original,{}).symbol);
isPremium=true;assert.equal(projection.projectWatchlistTickerForViewer(original,{}).symbol,'SECRET');isPremium=false;
const control=load('src/modules/watchlist/server/runtime/watchlist-premium-control.ts').WATCHLIST_PREMIUM_CONTROL;new vm.Script(control.match(/<script>([\s\S]*)<\/script>/)[1]);
const eventModule=load('src/lib/live-watchlist/live-watchlist-events.ts',()=>({projectLiveWatchlistListSymbol:x=>x}));
async function streamCheck(){const stream=eventModule.createLiveWatchlistStream(item=>projection.projectWatchlistTickerForViewer(item,{}));const reader=stream.getReader();await reader.read();eventModule.broadcastLiveWatchlistUpdate(original);const result=await reader.read();const text=new TextDecoder().decode(result.value);assert(!text.includes('SECRET'));assert(text.includes('premiumTickerHidden'));await reader.cancel();db.close();console.log('PASS: independent toggles, defaults, audit, owner/Premium/free/failure access, opaque list and SSE projection, TS/TSX and embedded-control syntax. No network or hosted writes.');}
streamCheck().catch(error=>{console.error(error);process.exitCode=1;});
