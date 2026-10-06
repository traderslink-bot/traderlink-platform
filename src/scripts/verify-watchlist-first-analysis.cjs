const assert=require('node:assert/strict'),vm=require('node:vm'),path=require('node:path');
const {createRequire}=require('node:module');const deps=createRequire('C:/Users/jerac/Documents/TraderLink/traderlink-platform/package.json'),ts=deps('typescript');
const {prepare,root,runtime,platformParent,runtimeParent,base}=require('./package-watchlist-first-analysis.cjs');const {changes,platform}=prepare();
process.env.TRADERSLINK_WATCHLIST_PUBLIC_URL='https://app.traderslink.pro/watchlist';
function loader(cwd,parent,map){const cache=new Map();return function load(file){if(cache.has(file))return cache.get(file);const s=map.get(file)??base(cwd,parent,file),r=ts.transpileModule(s,{fileName:file,reportDiagnostics:true,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}});assert.equal(r.diagnostics.length,0,file);const m={exports:{}};cache.set(file,m.exports);vm.runInNewContext(r.outputText,{module:m,exports:m.exports,process,URL,Buffer,require:id=>id.startsWith('.')?load(path.posix.normalize(path.posix.join(path.posix.dirname(file),id.replace(/\.js$/,'')+'.ts'))):deps(id)});return m.exports;};}
const r=loader(runtime,runtimeParent,changes),p=loader(root,platformParent,platform),prefix='src/modules/watchlist/server/notifications/';
const rh=r('src/lib/ai/watchlist-analysis-update-context.ts'),ph=p(prefix+'watchlist-analysis-update-copy.ts'),renderer=r('src/lib/ai/traderslink-ai-read-publication-preview.ts'),contract=p(prefix+'watchlist-publication-notification-contract.ts');
const approval=(revision,draftRevision,body,context)=>({revision,actor:'platform-owner:10000000-0000-4000-8000-000000000001',body:{kind:'approve',draftRevision,publication:{analysisUpdateContext:context,website:{cards:body?{tradersLinkAiRead:{body:JSON.stringify(body)}}:{}}}}});
const delivered=n=>({body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:n}});
const listing=approval(1,0,null),first=approval(3,2,{currentPrice:4}),second=approval(6,5,{currentPrice:5});
const firstContext=rh.analysisUpdateContextForDraft({events:[listing,delivered(1)]},4);
assert.equal(firstContext.hasPreviousAnalysis,false);
const owner='platform-owner:10000000-0000-4000-8000-000000000001';
const discord=renderer.attributeOwnerApprovedDiscord(renderer.renderApprovedAnalysisDiscord({symbol:'TEST'},true,{everyone:true,roles:[]},firstContext),owner)[0];
assert.match(discord,/TEST Analysis published by "This Guy"/);assert.doesNotMatch(discord,/follow-up|Originally analyzed|Analysis updated/);assert.match(discord,/@everyone/);assert.match(discord,/watchlist\/TEST/);
const copy=contract.watchlistPublicationNotificationCopy('TEST','analysis',true,firstContext);assert.equal(copy.pushTitle,'TEST Analysis published by "This Guy"');assert.doesNotMatch(copy.emailBody,/follow-up|Originally analyzed/);
for(const h of [rh,ph]){
 assert.equal(h.parseAnalysisUpdateContext(firstContext).hasPreviousAnalysis,false);
 assert.equal(h.analysisUpdateContextFromReview({events:[listing,delivered(1),first,delivered(3)]},3).hasPreviousAnalysis,false);
 assert.equal(h.analysisUpdateContextFromReview({events:[listing,delivered(1),first,delivered(3),second,delivered(6)]},6).hasPreviousAnalysis,true);
 assert.equal(h.analysisUpdateContextFromReview({events:[first,second,delivered(6)]},6).hasPreviousAnalysis,false,'Unpublished approval is not a previous public read');
 const missingPrice=approval(1,1,{generationId:'saved-read'});
 assert.equal(h.analysisUpdateContextFromReview({events:[missingPrice,delivered(1),second,delivered(6)]},6).hasPreviousAnalysis,true,'History is not inferred solely from price');
 const oldFrozen={automatic:false,firstAnalysisPrice:null,updatedAnalysisPrice:4};
 assert.equal(h.analysisUpdateContextFromReview({events:[listing,delivered(1),approval(3,2,{currentPrice:4},oldFrozen),delivered(3)]},3).hasPreviousAnalysis,false);
}
const update=rh.analysisUpdateContextForDraft({events:[listing,delivered(1),first,delivered(3)]},5);assert.equal(update.hasPreviousAnalysis,true);
const updated=renderer.attributeOwnerApprovedDiscord(renderer.renderApprovedAnalysisDiscord({symbol:'TEST'},true,undefined,update),'runtime:automatic-boundary')[0];assert.match(updated,/Analysis updated — Auto updated by AI/);assert.match(updated,/follow-up/);assert.match(updated,/Originally analyzed at \$4.00/);
assert.match(contract.watchlistPublicationNotificationCopy('TEST','analysis',false,{...update,automatic:true}).pushTitle,/Auto updated by AI/);
const oldr=loader(runtime,runtimeParent,new Map())('src/lib/ai/traderslink-ai-read-publication-preview.ts');assert.equal(JSON.stringify(renderer.renderApprovedAnalysisDiscord({symbol:'TEST'},false)),JSON.stringify(oldr.renderApprovedAnalysisDiscord({symbol:'TEST'},false)));
assert.equal(rh.analysisUpdateContextForDraft({events:[first]},5).hasPreviousAnalysis,false);
const now=Date.parse('2026-10-05T16:00:00.000Z');
const event=contract.parseWatchlistPublicationNotificationEvent({version:2,cycleId:'30000000-0000-4000-8000-000000000003',ticker:'TEST',approvedAtUtc:new Date(now).toISOString(),publishedAtUtc:new Date(now).toISOString(),notificationKind:'analysis',approvalRevision:3,notifyUsers:true,ownerApproved:true,analysisUpdateContext:firstContext},now);
assert.equal(event.analysisUpdateContext.hasPreviousAnalysis,false,'Boundary parser preserves first-analysis context');
const frozenFirst=approval(3,2,{currentPrice:4},firstContext);
assert.equal(ph.analysisUpdateContextFromReview({events:[listing,delivered(1),frozenFirst,delivered(3),second,delivered(6)]},3).hasPreviousAnalysis,false,'Later approvals cannot reclassify the frozen first notification');
console.log('PASS: listing-only then first analysis, subsequent analysis, unpublished approvals, missing-price history, legacy context, Discord attribution/mentions/links, push/email copy and unchanged initial-listing renderer.');
