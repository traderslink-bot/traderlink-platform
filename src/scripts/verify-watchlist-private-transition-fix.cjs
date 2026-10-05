const assert=require('node:assert/strict'),vm=require('node:vm');
const ts=require('C:/Users/jerac/Documents/TraderLink/traderlink-platform/node_modules/typescript');
const source=require('./package-watchlist-private-transition-fix.cjs').prepare();
const ast=ts.createSourceFile('manager.ts',source,99,true),members=[];
for(const c of ast.statements)if(ts.isClassDeclaration(c))for(const m of c.members)if(['privateTransitionMarkers','moveSymbolToWatchlistGroup','queueActivation','isWatchlistPublicationApproved'].includes(m.name?.getText(ast)))members.push(m.getText(ast));
assert.equal(members.length,4);
const out=ts.transpileModule('class Harness{'+members.join('\n')+'};module.exports=Harness;',{reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022}});
assert.equal(out.diagnostics.filter(x=>x.category===ts.DiagnosticCategory.Error).length,0);
const mod={exports:{}};
vm.runInNewContext(out.outputText,{module:mod,normalizeSymbol:x=>x,randomUUID:()=> 'fresh-cycle',Date,Map,Set,
 watchlistGroupForActivation:x=>x.watchlistGroup,getWatchlistEntrySessionGroup:x=>x.watchlistGroup,
 shouldReuseSameDayActivationContext:()=>false,buildLiveWatchlistStatusPatch:x=>({...x,cards:{}}),
 isWatchlistRemovalPatch:()=>false,isWatchlistPatchApproved:(_,review)=>review?.cycleId==='old-cycle'});
function setup(fail=false){
 const h=new mod.exports(),events=[];let entry={symbol:'TEST',active:true,lifecycle:'active',watchlistGroup:'main',tags:[],publicationReview:{cycleId:'old-cycle'}};
 h.watchlistStore={getEntry:()=>entry,patchEntry:(_,patch)=>entry={...entry,...patch}};
 h.options={tradersLinkAiReadReviewStore:{begin:()=>events.push('begin'),read:()=>({head:1}),saveDraft:()=>events.push('draft')}};
 h.getTradersLinkAiReadReview=()=>({cycleId:'old-cycle',draft:{body:{kind:'edit',payload:{}}}});
 h.persistWatchlist=()=>events.push('persist');
 h.shouldPreparePrivateActivation=()=>false;h.captureAiReadAdmission=()=>({});h.pendingActivations=new Map();
 let marker;
 h.liveWatchlistPublisher={publish:async patch=>{
   marker=patch;assert.equal(entry.watchlistGroup,'main');assert.equal(entry.publicationReview.cycleId,'old-cycle');assert.equal(events.length,0);
   assert(h.isWatchlistPublicationApproved(patch));assert(!h.isWatchlistPublicationApproved({...patch}));
   assert(!h.isWatchlistPublicationApproved({symbol:'TEST',cards:{}}));
   events.push('website');if(fail)throw Error('website unavailable');
 }};
 return {h,events,entry:()=>entry,marker:()=>marker};
}
(async()=>{
 for(const queued of [false,true])for(const fail of [false,true]){
   const x=setup(fail),run=()=>queued?x.h.queueActivation({symbol:'TEST',watchlistGroup:'private',source:'manual'}):x.h.moveSymbolToWatchlistGroup('TEST','private');
   if(fail){await assert.rejects(run,/website unavailable/);assert.equal(x.entry().watchlistGroup,'main');assert.equal(x.entry().publicationReview.cycleId,'old-cycle');assert.deepEqual(x.events,['website']);assert(!x.h.isWatchlistPublicationApproved(x.marker()));assert(!x.h.isWatchlistPublicationApproved(JSON.parse(JSON.stringify(x.marker()))));}
   else {await run();assert.deepEqual(x.events,['website','begin','draft','persist']);assert.equal(x.entry().watchlistGroup,'private');assert.equal(x.entry().publicationReview.cycleId,'fresh-cycle');assert.equal(x.entry().discordThreadId,null);await x.h.moveSymbolToWatchlistGroup('TEST','private');assert.equal(x.events.length,4);
     await x.h.queueActivation({symbol:'TEST',watchlistGroup:'main',source:'manual'});assert.equal(x.entry().watchlistGroup,'main');assert.equal(x.entry().publicationReview.cycleId,'fresh-cycle');assert.equal(x.events.filter(e=>e==='website').length,1);assert(!x.h.isWatchlistPublicationApproved(x.marker()));
   }
 }
 const concurrent=setup();let finish;
 concurrent.h.liveWatchlistPublisher={publish:()=>new Promise(resolve=>finish=resolve)};
 const pending=concurrent.h.moveSymbolToWatchlistGroup('TEST','private');
 await assert.rejects(()=>concurrent.h.moveSymbolToWatchlistGroup('TEST','general'),/already in progress/);
 finish();await pending;
 console.log('PASS actual move and existing-active activation: website failure preserves category/cycle; confirmed concealment precedes fresh review; draft retained; repeat Private no-op; stale markers denied; public promotion remains unapproved; concurrent move blocked. No hosted calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
