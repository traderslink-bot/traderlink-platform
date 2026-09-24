/* Focused offline checks. No provider calls, app server, production state or sends. */
const assert=require('node:assert/strict'),cp=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const ts=require('typescript');
const runtime='C:/Users/jerac/Documents/TraderLink/levels-system-post-mtf-handoff-stability';
const args=process.argv.slice(2);
const candidate=args.includes('--candidate')?require(args.includes('--general')?'../../data/extend-general-watchlist.cjs':'../../data/prepare-trader-notes.cjs'):null;
function source(lane,file){
 if(candidate)return candidate.maps[lane].get(file)??candidate.git(lane,['show',`${candidate.parents[lane]}:${file}`]);
 const ref=args[args.indexOf('--'+lane+'-ref')+1];
 if(!args.includes('--'+lane+'-ref')||!/^[a-f0-9]{40}$/.test(ref))throw Error('Pass --runtime-ref SHA --platform-ref SHA, or --candidate for local preparation.');
 return cp.execFileSync('git',lane==='runtime'?['-c',`safe.directory=${runtime}`,'-C',runtime,'show',`${ref}:${file}`]:['show',`${ref}:${file}`],{encoding:'utf8',maxBuffer:8e6});
}
const cache=new Map();
function load(lane,file){
 const key=lane+':'+file;if(cache.has(key))return cache.get(key).exports;
 const module={exports:{}};cache.set(key,module);
 const js=ts.transpileModule(source(lane,file),{fileName:file,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
 new Function('require','module','exports',js)(id=>id.startsWith('.')?load(lane,path.posix.normalize(path.posix.join(path.posix.dirname(file),id)).replace(/\.js$/,'.ts')):require(id),module,module.exports);
 return module.exports;
}
const checks=[];const ok=name=>checks.push(name);
(async()=>{
 const {WatchlistStore}=load('runtime','src/lib/monitoring/watchlist-store.ts');
 const policy=load('runtime','src/lib/ai/traderslink-ai-read-review-policy.ts');
 const {TradersLinkAiReadReviewStore}=load('runtime','src/lib/ai/traderslink-ai-read-review-store.ts');
 const store=new WatchlistStore();store.upsertManualEntry({symbol:'TEST',active:true,automaticAnalysisEnabled:false,traderNotesDraft:'Line one\n<script>not HTML</script>'});
 const restarted=new WatchlistStore();restarted.setEntries(JSON.parse(JSON.stringify(store.getEntries())));
 assert.equal(restarted.getEntry('TEST').automaticAnalysisEnabled,false);assert.equal(restarted.getEntry('TEST').traderNotesDraft,'Line one\n<script>not HTML</script>');
 restarted.upsertManualEntry({symbol:'LEGACY',active:true});assert.equal(restarted.getEntry('LEGACY').automaticAnalysisEnabled,true);ok('per-ticker choice and exact notes survive persistence; legacy defaults unchanged');
 const src=source('runtime','src/lib/monitoring/manual-watchlist-runtime-manager.ts');
 const ast=ts.createSourceFile('manager.ts',src,ts.ScriptTarget.Latest,true);
 const cls=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='ManualWatchlistRuntimeManager');assert.ok(cls);
 const methods=['captureAiReadAdmission','shouldPreparePrivateActivation','preparePrivateActivation','getTradersLinkAiReadGenerationAvailability','getTradersLinkAiReadReview','listTradersLinkAiReadReviews','buildTraderNotesCard','saveTraderNotes','publishTickerWithoutAnalysis','refreshTradersLinkAiRead','buildReviewedWebsitePatch','getTradersLinkAiReadPublicationPreview','approveTradersLinkAiReadForWebsite','moveSymbolToWatchlistGroup'];
 const bodies=methods.map(name=>{const m=cls.members.find(n=>n.name?.getText(ast)===name);assert.ok(m,name);return m.getText(ast);}).join('\n');
 const deps={normalizeSymbol:s=>s.toUpperCase(),classifyUsEquityMarketSession:()=>({session:'regular'}),requiresInitialWatchlistReview:policy.requiresInitialWatchlistReview,
 randomUUID:()=>require('node:crypto').randomUUID(),watchlistTagsForActivation:()=>['manual'],watchlistGroupForActivation:i=>i.watchlistGroup??'main',getManualWatchlistAutoReadmissionBlockedUntil:()=>null,
 buildLiveWatchlistStatusPatch:input=>({...input,updatedAt:Date.parse('2026-09-23T14:00:00Z'),cards:{}}),
 buildLiveWatchlistSnapshotPatch:payload=>({symbol:payload.symbol,updatedAt:payload.timestamp,cards:{levelMap:{title:'Levels',body:'levels',updatedAt:payload.timestamp,priceWhenPosted:1,source:'test'}}}),
 currentDiscordAudience:()=>({}),appendDiscordMentions:s=>s,buildWatchlistDiscordLinkMessage:s=>'Watchlist '+s,
 renderApprovedAnalysisDiscord:()=>['Analysis updated'],publicationPreviewHash:()=> 'test',buildTradersLinkAiReadRefreshState:read=>({generatedAt:read.generatedAt,currentPrice:read.currentPrice,needsToHold:0.9,mustClear:1.1,breakoutContinuation:1.2,momentumFailure:0.8,boundaries:[]}),
 buildTradersLinkAiReadPatch:({read})=>({symbol:read.symbol,updatedAt:read.generatedAt,tradersLinkAiReadCardVisible:true,cards:{tradersLinkAiRead:{body:JSON.stringify(read)}}}),
 approvedDiscordRetryAt:()=>null,remainingGeneratedSectionOmissions:()=>[]};
 const js=ts.transpileModule(`class Selected {${bodies}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
 const Selected=new Function(...Object.keys(deps),js+';return Selected;')(...Object.values(deps));
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'watchlist-notes-proof-'));
 try{
  let now=Date.parse('2026-09-23T14:00:00Z'),calls=0,seeded=0,sends=0;
  const {WatchlistStatePersistence}=load('runtime','src/lib/monitoring/watchlist-state-persistence.ts');
  const disk=new WatchlistStatePersistence({filePath:path.join(dir,'watchlist.json'),now:()=>now});
  restarted.patchEntry('TEST',{watchlistGroup:'general'});disk.save(restarted.getEntries());
  const fromDisk=disk.load();assert.ok(fromDisk);const diskEntry=fromDisk.find(e=>e.symbol==='TEST');
  assert.equal(diskEntry.watchlistGroup,'general');assert.equal(diskEntry.automaticAnalysisEnabled,false);assert.equal(diskEntry.traderNotesDraft,'Line one\n<script>not HTML</script>');
  const runtimeGroup=load('runtime','src/lib/monitoring/watchlist-entry-session.ts').getWatchlistEntrySessionGroup;
  const memberGroup=load('platform','src/lib/live-watchlist/live-watchlist-session-group.ts').getLiveWatchlistEntryGroup;
  assert.equal(runtimeGroup(diskEntry),'general');assert.equal(memberGroup({watchlistGroup:'general',firstPostedAt:now}),'general');
  const normalizeSrc=source('platform','src/lib/live-watchlist/live-watchlist-store.ts').match(/function normalizeWatchlistGroup\([\s\S]*?\n\}/)[0];
  const normalize=new Function(ts.transpileModule(normalizeSrc,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText+';return normalizeWatchlistGroup;')();
  assert.equal(normalize('general'),'general');assert.equal(normalize('unknown'),undefined);
  ok('actual disk writer/reader retain General, notes and AI opt-out; runtime and Platform category normalization agree');
  const reviews=new TradersLinkAiReadReviewStore(dir,()=>now);
  const m=new Selected();m.options={now:()=>now,tradersLinkAiReadReviewStore:reviews};m.watchlistStore=new WatchlistStore();m.tradersLinkAiReadGenerationSettings={enabled:true,premarketEnabled:true,regularEnabled:true,postmarketEnabled:true,automaticUpdatesEnabled:true};
  m.reviewBeforePublishingEnabled=false;m.analysisFormat='current';m.nextActivationEpoch=()=>1;m.assertActivationCurrent=()=>{};m.aiReadState=new Map();m.aiReadInitialGenerationSuppressedSymbols=new Set();m.persistWatchlist=()=>{};
  m.seedLevelsForSymbol=async()=>{seeded++};m.restartMonitoringForPreparedActivation=async()=>{};m.generateTradersLinkAiRead=async()=>{calls++;return {test:'manual'}};
  m.applyLiveTraderReadCardVisibility=p=>p;m.buildLevelSnapshotPayload=(symbol,timestamp)=>({symbol,timestamp});
  const publications=[];m.liveWatchlistPublisher={publish:async p=>{assert.equal(policy.isWatchlistPatchApproved(p,m.watchlistStore.getEntry(p.symbol).publicationReview,id=>reviews.read(id)),true);publications.push(structuredClone(p));}};
  m.publishApprovedTradersLinkAiReadToDiscord=async({cycleId})=>{const r=reviews.read(cycleId);if(r.approved.body.publication.notifyUsers!==false)sends++;return r;};
  m.isTradersLinkAiReadConfigured=()=>true;
  m.isWatchlistPublicationApproved=p=>policy.isWatchlistPatchApproved(p,m.watchlistStore.getEntry(p.symbol).publicationReview,id=>reviews.read(id));
  assert.equal(m.shouldPreparePrivateActivation({symbol:'TEST',generateAnalysis:false}),true);
  assert.equal(m.shouldPreparePrivateActivation({symbol:'OTHER',generateAnalysis:true}),false);
  await m.preparePrivateActivation({symbol:'TEST',generateAnalysis:false,traderNotes:'First\nnotes'});
  assert.equal(calls,0);assert.equal(seeded,1);assert.equal(publications.length,0);assert.equal(sends,0);
  const entry=m.watchlistStore.getEntry('TEST'),cycleId=entry.publicationReview.cycleId;
  await m.moveSymbolToWatchlistGroup('TEST','general');assert.equal(publications.length,0);assert.equal(calls,0);assert.equal(m.watchlistStore.getEntry('TEST').publicationReview.cycleId,cycleId);
  assert.equal(m.shouldPreparePrivateActivation({symbol:'TEST',generateAnalysis:false}),false);
  for(const trigger of ['activation','automatic','boundary',undefined])assert.equal(m.getTradersLinkAiReadGenerationAvailability(now,{symbol:'TEST',requestedTrigger:trigger}).allowed,false);
  assert.equal(m.getTradersLinkAiReadGenerationAvailability(now,{symbol:'TEST',requestedTrigger:'manual'}).allowed,true);
  assert.equal(policy.isWatchlistPatchApproved({symbol:'TEST',cards:{}},entry.publicationReview,id=>reviews.read(id)),false);
  ok('unchecked activation seeds data but generates/sends/publishes nothing; automatic paths suppressed; manual remains available');
  await m.saveTraderNotes({symbol:'TEST',cycleId,text:'Edited\nnotes',publish:false,actor:'owner'});assert.equal(publications.length,0);
  await assert.rejects(()=>m.saveTraderNotes({symbol:'TEST',cycleId:'wrong',text:'bad',publish:false,actor:'owner'}));
  await assert.rejects(()=>m.saveTraderNotes({symbol:'TEST',cycleId,text:'x'.repeat(12001),publish:false,actor:'owner'}));
  await assert.rejects(()=>m.saveTraderNotes({symbol:'TEST',cycleId,text:'early',publish:true,actor:'owner'}));
  let row=m.listTradersLinkAiReadReviews()[0];assert.equal(row.status,'Notes ready for review');assert.equal(row.canPublishWithoutAnalysis,true);
  await m.publishTickerWithoutAnalysis({symbol:'TEST',cycleId,expectedHead:reviews.read(cycleId).head,actor:'owner',notifyUsers:false});
  assert.equal(publications.length,1);assert.equal(publications[0].cards.traderNotes.body,'Edited\nnotes');assert.equal(publications[0].tradersLinkAiReadCardVisible,false);assert.equal('tradersLinkAiRead' in publications[0].cards,false);assert.equal(sends,0);
  row=m.listTradersLinkAiReadReviews()[0];assert.equal(row.listed,true);assert.equal(row.status,'Published without analysis');
  ok('save stays private; wrong-cycle/invalid input rejected; explicit listing freezes notes, hides analysis, respects notifications off');
  await m.saveTraderNotes({symbol:'TEST',cycleId,text:'Draft NOT public',publish:false,actor:'owner'});assert.equal(publications.length,1);
  const analysis=m.buildReviewedWebsitePatch({symbol:'TEST',generatedAt:now,currentPrice:1});assert.equal(analysis.cards.traderNotes,undefined);assert.equal(analysis.tradersLinkAiReadCardVisible,true);
  assert.deepEqual(await m.refreshTradersLinkAiRead('TEST'),{test:'manual'});assert.equal(calls,1);
  await m.saveTraderNotes({symbol:'TEST',cycleId,text:'Published update',publish:true,actor:'owner'});assert.equal(publications.at(-1).cards.traderNotes.body,'Published update');assert.equal(sends,0);
  await m.saveTraderNotes({symbol:'TEST',cycleId,text:'',publish:true,actor:'owner'});assert.equal(publications.at(-1).cards.traderNotes,null);
  ok('later manual request works; analysis cannot leak newer notes draft; explicit notes update/removal sends no alerts');
  const contract=load('platform','src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts');
  const pub=contract.publicationFromReview({cycleId,ticker:'TEST',expectedHead:1,draftRevision:0,actor:'owner'},reviews.read(cycleId),now);
  assert.ok(pub);assert.equal(pub.notifyUsers,false);
  const read={symbol:'TEST',generationId:'manual-later',generatedAt:now,currentPrice:1};
  const original=reviews.saveDraft({cycleId,expectedHead:reviews.read(cycleId).head,actor:'runtime:generator',generationId:read.generationId,payload:read});
  const unapproved=m.buildReviewedWebsitePatch(read);assert.equal(policy.isWatchlistPatchApproved(unapproved,entry.publicationReview,id=>reviews.read(id)),false);
  m.acknowledgeTradersLinkAiReadPublication=()=>{};
  await m.approveTradersLinkAiReadForWebsite({symbol:'TEST',cycleId,expectedHead:1,draftRevision:original.revision,actor:'owner',notifyUsers:true});
  assert.equal(publications.at(-1).tradersLinkAiReadCardVisible,true);assert.equal(publications.at(-1).cards.traderNotes,undefined);
  assert.equal(reviews.read(cycleId).approved.body.publication.notificationKind,'analysis');assert.equal(reviews.read(cycleId).approved.body.publication.notifyUsers,true);
  assert.equal(m.watchlistStore.getEntry('TEST').automaticAnalysisEnabled,false);
  ok('new analysis draft rejected by publication path until approved; approval reveals it, preserves notes and optional update notification intent');
  const beforeMove=m.watchlistStore.getEntry('TEST'),callCount=calls,sendCount=sends,approvedBefore=reviews.read(cycleId).approved;
  for(const group of ['main','general','postmarket','general','top_regular','general']) {
    await m.moveSymbolToWatchlistGroup('TEST',group);
    const moved=m.watchlistStore.getEntry('TEST');assert.deepEqual({...moved,watchlistGroup:beforeMove.watchlistGroup},beforeMove);
    assert.equal(publications.at(-1).watchlistGroup,group);assert.deepEqual(publications.at(-1).cards,{});
  }
  assert.equal(calls,callCount);assert.equal(sends,sendCount);assert.deepEqual(reviews.read(cycleId).approved,approvedBefore);
  ok('moving private/public tickers both directions preserves notes, analysis, review and tracking time; no AI or notifications');
  await m.preparePrivateActivation({symbol:'NEXT',generateAnalysis:false,traderNotes:'Next'});
  const next=m.watchlistStore.getEntry('NEXT');await m.publishTickerWithoutAnalysis({symbol:'NEXT',cycleId:next.publicationReview.cycleId,expectedHead:1,actor:'owner'});assert.equal(sends,1);ok('notification off survives Platform proof; initial listing defaults to notifications on');
  const api=load('runtime','src/runtime/manual-watchlist-analysis-review-api.ts');
  const input={method:'POST',pathname:'/api/watchlist/analysis-review/save-notes',searchParams:new URLSearchParams(),body:{symbol:'TEST',cycleId,text:'API draft',publish:false},actor:'platform-owner:test'};
  assert.equal((await api.dispatchAnalysisReviewRequest(input,m)).status,200);
  assert.notEqual((await api.dispatchAnalysisReviewRequest({...input,actor:undefined},m)).status,200);
  assert.notEqual((await api.dispatchAnalysisReviewRequest({...input,body:{...input.body,publish:'yes'}},m)).status,200);
  ok('notes API requires authenticated owner and valid typed payload');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 const page=load('runtime','src/runtime/manual-watchlist-page.ts').MANUAL_WATCHLIST_PAGE;
 assert.match(page,/id="generate-analysis"[^>]*checked/);assert.match(page,/id="trader-notes"/);
 assert.match(page,/<option value="general">General Watchlist<\/option>/);assert.match(page,/\["general", "General Watchlist"\]/);assert.match(page,/id="general-list"/);
 for(const script of page.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(script[1]);
 ok('rendered console has default checkbox and notes field; every generated inline script parses');
 const cardSrc=source('platform','app/watchlist/live-watchlist-client.tsx');
 assert.match(cardSrc,/ariaLabel="General Watchlist tickers"/);assert.match(cardSrc,/Stocks being watched for potential opportunities, without a specific trading session or day-trade\/swing-trade focus\./);
 const markup=cardSrc.match(/\{symbol\.cards\.traderNotes\?\.body\?\.trim\(\) \? \([\s\S]*?\) : null\}/)[0];
 const renderJs=ts.transpileModule(`export const Card=({symbol})=><>${markup}</>;`,{fileName:'card.tsx',compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.CommonJS}}).outputText;
 const mod={exports:{}};new Function('require','module','exports',renderJs)(require,mod,mod.exports);
 const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 const html=renderToStaticMarkup(React.createElement(mod.exports.Card,{symbol:{cards:{traderNotes:{body:'<script>alert(1)</script>\nhello'}}}}));
 assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(html.includes('pre-wrap'));assert.ok(html.includes('1 / -1'));
 assert.equal(renderToStaticMarkup(React.createElement(mod.exports.Card,{symbol:{cards:{traderNotes:{body:'  '}}}})),'');
 ok('member notes escape HTML, preserve lines, span card grid; blank notes omitted');
 console.log(JSON.stringify({passed:checks.length,checks},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
