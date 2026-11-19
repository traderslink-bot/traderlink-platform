'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),ts=require('typescript'),Database=require('better-sqlite3');
const PAGE='app/(dashboard)/communities/[communitySlug]/server-watchlists/[watchlistId]/page.tsx',ID='11111111-1111-4111-8111-111111111111';
const NF=Symbol('notFound');
function transpile(file,req){const m={exports:{}};new Function('exports','require',ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText)(m.exports,req);return m.exports;}
const parser=transpile('src/modules/communities/contracts/community-watchlist-research.ts',require);
function setup({user='owner',allowed=true,publisher=true,author='owner',review=false}={}){
 const db=new Database(':memory:');db.exec('CREATE TABLE traderlink_community_server_watchlists(community_id TEXT,watchlist_id TEXT,ticker_research_json TEXT)');
 db.prepare('INSERT INTO traderlink_community_server_watchlists VALUES(?,?,?)').run('community',ID,JSON.stringify({TEST:{notes:'Saved notes',research:'Saved research',sources:['https://example.com/evidence'],priceTarget:'10.125'}}));
 let loaded=0,reads=0;
 const watchlist={sourceKind:'server',watchlistId:ID,authorUserId:author,title:'Persisted title',description:'Persisted body',symbols:['TEST'],status:'published',publishingMode:'tracked_page',authorName:'Owner'};
 const snapshot={community:{communityId:'community'},viewer:{userId:user,capabilities:publisher?['community.watchlists.publish_staff']:[]},watchlists:allowed?[watchlist]:[]};
 const mod=transpile(PAGE,s=>{
  if(s==='react/jsx-runtime')return require(s);
  if(s==='next/navigation')return {notFound:()=>{throw NF;}};
  if(s.includes('community-publication-dashboard-loader'))return {loadCommunityPublishingDashboard:async(slug,path)=>{loaded++;assert.equal(slug,'harbor');assert.equal(path,'/communities/harbor/server-watchlists/'+ID);if(user==='google')throw NF;return {snapshot,isReview:review};}};
  if(s.includes('open-readonly-platform-database'))return {withReadonlyPlatformDatabase:(_,fn)=>{reads++;return fn(db);}};
  if(s.includes('community-watchlist-research'))return parser;
  if(s.includes('dashboard-ui'))return {DashboardPage:'DashboardPage',DashboardPanel:'DashboardPanel'};
  const names={'community-watchlist-editor':'CommunityWatchlistEditor','community-navigation':'CommunityNavigation','community-publication-history':'CommunityPublicationHistory','community-stats-visit-recorder':'CommunityStatsVisitRecorder'};
  for(const [key,name] of Object.entries(names))if(s.includes(key))return {[name]:name};
  return {__esModule:true,default:s};
 });
 return {db,snapshot,watchlist,render:()=>mod.default({params:Promise.resolve({communitySlug:'harbor',watchlistId:ID})}),invalid:()=>mod.default({params:Promise.resolve({communitySlug:'harbor',watchlistId:'bad'})}),counts:()=>({loaded,reads})};
}
function nodes(tree){if(Array.isArray(tree))return tree.flatMap(nodes);if(!tree||typeof tree!=='object')return [];return [tree,...nodes(tree.props?.children)];}
let passed=0;
async function test(name,options,fn){const x=setup(options);try{await fn(x);passed++;}catch(e){console.error(name,e);process.exitCode=1;}finally{x.db.close();}}
(async()=>{
 await test('owner exact body and persisted research',{},async x=>{const n=nodes(await x.render()),text=JSON.stringify(n);for(const value of ['Persisted title','Persisted body','Saved research','Saved notes','10.125'])assert(text.includes(value));assert.equal(n.filter(n=>n.type==='CommunityWatchlistEditor').length,1);assert.deepEqual(x.counts(),{loaded:1,reads:1});});
 await test('allowed ordinary reader has no editor',{user:'member',publisher:false},async x=>{const n=nodes(await x.render());assert.equal(n.filter(n=>n.type==='CommunityWatchlistEditor').length,0);assert(JSON.stringify(n).includes('Persisted body'));});
 await test('another publisher cannot edit author content',{user:'other'},async x=>assert.equal(nodes(await x.render()).filter(n=>n.type==='CommunityWatchlistEditor').length,0));
 await test('denied member has no additional body read',{user:'member',allowed:false,publisher:false},async x=>{await assert.rejects(x.render(),e=>e===NF);assert.equal(x.counts().reads,0);});
 await test('Google access denial propagated',{user:'google'},async x=>{await assert.rejects(x.render(),e=>e===NF);assert.equal(x.counts().reads,0);});
 await test('different object cannot reuse permitted snapshot',{},async x=>{x.watchlist.watchlistId='22222222-2222-4222-8222-222222222222';await assert.rejects(x.render(),e=>e===NF);assert.equal(x.counts().reads,0);});
 await test('member placement cannot bypass server detail',{},async x=>{x.watchlist.sourceKind='member';await assert.rejects(x.render(),e=>e===NF);assert.equal(x.counts().reads,0);});
 await test('invalid ID rejects before loader',{},async x=>{await assert.rejects(x.invalid(),e=>e===NF);assert.equal(x.counts().loaded,0);});
 await test('source persistence survives separate render',{},async x=>{await x.render();x.db.prepare('UPDATE traderlink_community_server_watchlists SET ticker_research_json=?').run(JSON.stringify({TEST:{notes:'Updated notes',research:'Updated research',sources:[]}}));assert(JSON.stringify(nodes(await x.render())).includes('Updated research'));});
 console.log(passed+' route rendering scenarios passed: real page/research parser/disposable SQLite; authorization loader mocked. Actual native role and installed browser acceptance remain separate.');
})();
