const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const {prepare}=require('./package-watchlist-private.cjs');
const maps=prepare();
for(const [lane,map] of Object.entries(maps))for(const [file,text] of map){
 const out=ts.transpileModule(text,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}});
 assert.equal((out.diagnostics??[]).filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,lane+':'+file);
}
function load(text,imports){const out=ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;const module={exports:{}};vm.runInNewContext(out,{exports:module.exports,module,require:name=>name==='server-only'?{}:imports[name]??require(name),Buffer});return module.exports;}
let policy={all:false,owner:false,restricted:new Set(),privateSymbols:new Set(['SECRET'])};
const p=load(maps.platform.get('src/modules/watchlist/server/access/watchlist-ticker-projection.ts'),{'./watchlist-analysis-visibility':{readWatchlistTickerPolicy:()=>policy,canViewWatchlistTicker:(_,s)=>policy&&(policy.owner||!policy.privateSymbols.has(s))&&(policy.all||!policy.restricted.has(s))}});
const payload={symbols:[{symbol:'SECRET',watchlistGroup:'private',latestPrice:123.45,companyName:'Private company'},{symbol:'PUBLIC',watchlistGroup:'main'}]};
for(const premium of [false,true]){policy.all=premium;const value=p.projectWatchlistTickersForViewer(payload,{});assert.deepEqual(Array.from(value.symbols,x=>x.symbol),['PUBLIC']);assert(!JSON.stringify(p.projectWatchlistTickerForViewer(payload.symbols[0],{})).includes('SECRET'));}
policy.owner=true;assert.equal(p.projectWatchlistTickersForViewer(payload,{}).symbols.length,2);
policy=null;assert.equal(p.projectWatchlistTickersForViewer(payload,{}).symbols.length,0);
const manager=maps.runtime.get('src/lib/monitoring/manual-watchlist-runtime-manager.ts');
const row=load(maps.runtime.get('src/runtime/manual-watchlist-row-review.ts'),{}).WATCHLIST_ROW_REVIEW;
const page=load(maps.runtime.get('src/runtime/manual-watchlist-page.ts'),{
 './manual-watchlist-row-review.js':{WATCHLIST_ROW_REVIEW:row},
 './manual-watchlist-analysis-review-panel.js':{ANALYSIS_REVIEW_PANEL:''},
 './manual-watchlist-discord-mentions-panel.js':{WATCHLIST_DISCORD_MENTIONS_PANEL:''},
}).MANUAL_WATCHLIST_PAGE;
for(const match of page.matchAll(/<script>([\s\S]*?)<\/script>/g))new vm.Script(match[1]);
assert(page.includes('<option value="private">Private</option>'));
assert(page.includes('id="private-list"'));assert(page.includes('id="remove-private-tickers-button"'));
assert(manager.includes('input.watchlistGroup === "private" || input.generateAnalysis === false'));
assert.equal(manager.split('Move this ticker out of Private before publishing.').length-1,4);
assert(manager.includes('if (entry?.watchlistGroup === "private") return false;'));
const route=maps.platform.get('app/api/admin/watchlist/runtime/[...path]/route.ts');
assert(route.includes('recordWatchlistApprovalNotificationIntent(JSON.stringify(approval),reviewActor,!hasDraft)'));
assert(route.includes('...(hasDraft?{draftRevision:review.draft.revision,previewHash:""}:{})'));
assert(route.includes('notify:false'));
// Execute the actual authorization method from the candidate manager without
// constructing live providers, timers, files, Discord or OpenAI clients.
const ast=ts.createSourceFile('manager.ts',manager,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
let gate;
for(const statement of ast.statements)if(ts.isClassDeclaration(statement))for(const member of statement.members)if(member.name?.getText(ast)==='isWatchlistPublicationApproved')gate=member.getText(ast);
assert(gate);
const Harness=load('export class Harness { '+gate+' }',{}).Harness;
// Gate references are resolved as globals by a separate isolated script.
const gateJs=ts.transpileModule('class Harness { '+gate+' }; module.exports=Harness;',{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
const mod={exports:{}};vm.runInNewContext(gateJs,{module:mod,isWatchlistRemovalPatch:()=>false,isWatchlistPatchApproved:()=>true});
const h=new mod.exports();let entry={watchlistGroup:'private',active:true};h.watchlistStore={getEntry:()=>entry};h.options={};
assert.equal(h.isWatchlistPublicationApproved({symbol:'TEST',cards:{analysis:{}}}),false);
assert.equal(h.isWatchlistPublicationApproved({symbol:'TEST',watchlistGroup:'private',cards:{}}),true);
entry={watchlistGroup:'main',active:true};assert.equal(h.isWatchlistPublicationApproved({symbol:'TEST',cards:{}}),true);
assert(maps.runtime.get('src/lib/monitoring/watchlist-state-persistence.ts').includes('value.watchlistGroup !== "private"'));
console.log('PASS: candidate TS/TSX syntax; owner/Premium/free/fail-closed list and stream projection; explicit private publication guard and normal promotion wiring assertions. No hosted calls.');
async function promotionChecks(){
 for(const hasDraft of [false,true])for(const notify of [false,true]){
  const calls=[],intents=[],module={exports:{}};
  const imports={
   '@/src/modules/watchlist/server/access/watchlist-analysis-visibility':{isPrivateWatchlistTicker:()=>true},
   '@/src/modules/watchlist/server/access/watchlist-dashboard-navigation-access':{hasWatchlistDashboardNavigationAccess:()=>true},
   '@/src/modules/platform/server/authentication/require-platform-request-scope':{requireTraderLinkPlatformRequestIdentity:()=>({})},
   '@/src/modules/platform/server/administration/platform-admin-request-security':{requireJournalAdminMutationRequest:()=>{}},
   '@/src/modules/platform/server/administration/platform-admin-authorization':{withJournalAdminDatabase:(_,fn)=>fn({}, {userId:'owner'})},
   '@/src/modules/watchlist/server/notifications/watchlist-notification-runtime':{recordWatchlistApprovalNotificationIntent:(body,actor,listing)=>intents.push({body:JSON.parse(body),actor,listing})},
   '@/src/modules/watchlist/server/runtime/watchlist-runtime-admin-client':{requestWatchlistRuntimeRaw:async input=>{calls.push(input);return {ok:true,status:200,contentType:'application/json',body:JSON.stringify(input.method==='GET'?{review:{cycleId:'cycle',head:2,cancelled:false,draft:hasDraft?{revision:2,body:{kind:'original'}}:null}}:{ok:true})};}},
  };
  vm.runInNewContext(ts.transpileModule(route,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{module,exports:module.exports,require:n=>imports[n]??{},Response,Request,URL,console});
  const response=await module.exports.POST(new Request('https://example.test/api/admin/watchlist/runtime/watchlist/analysis-review/category-move',{method:'POST',body:JSON.stringify({symbol:'TEST',to:'main',notify,id:'move'})}),{params:Promise.resolve({path:['watchlist','analysis-review','category-move']})});
  assert.equal(response.status,200);assert.equal(calls.length,3);assert.equal(JSON.parse(calls[0].body).notify,false);assert(calls[2].path.endsWith(hasDraft?'/approve':'/publish-without-analysis'));assert.equal(JSON.parse(calls[2].body).notifyUsers,notify);assert.equal(intents[0].listing,!hasDraft);assert.equal(intents[0].body.notifyUsers,notify);assert(!calls[2].body.includes('private'));assert(!calls[2].body.includes('discordText'));
 }
 console.log('PASS: actual owner proxy Private promotion uses ordinary analysis/listing approval for draft/no-draft and notify on/off; no moved-from copy or owner move caption forwarded.');
}
promotionChecks().catch(error=>{console.error(error);process.exitCode=1;});
