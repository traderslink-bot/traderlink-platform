const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const assert = require('node:assert/strict');
const ts = require(process.argv[2]);
const Database = require(process.argv[3]);
const runtime = process.argv[4];
function load(file, deps = {}, globals = {}) {
  const compiled = ts.transpileModule(fs.readFileSync(file,'utf8'),{fileName:file,reportDiagnostics:true,
    compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
  assert.equal(compiled.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
  const module={exports:{}};
  vm.runInNewContext(compiled.outputText,{module,exports:module.exports,console,URL,URLSearchParams,AbortSignal,Date,
    process:{env:{}},require:n=>n.startsWith('node:')?require(n):deps[n]||{},...globals});
  return module.exports;
}
(async()=>{
  const db=new Database(':memory:');
  db.exec("CREATE TABLE platform_users(user_id TEXT PRIMARY KEY,status TEXT); CREATE TABLE platform_workspace_memberships(user_id TEXT,workspace_id TEXT,status TEXT); CREATE TABLE platform_workspaces(workspace_id TEXT,status TEXT);");
  db.exec("INSERT INTO platform_users VALUES('owner','active'); INSERT INTO platform_workspace_memberships VALUES('owner','workspace','active'); INSERT INTO platform_workspaces VALUES('workspace','active');");
  const migration=load('src/modules/platform/server/database/migrations/0146_watchlist_owner_review_notifications.ts').watchlistOwnerReviewNotificationsMigration;
  db.exec(`CREATE TABLE platform_watchlist_notification_events(event_id TEXT PRIMARY KEY,cycle_id TEXT,notification_kind TEXT,approval_revision INTEGER,notify_users INTEGER,ticker TEXT,approved_at_utc TEXT,published_at_utc TEXT,accepted_at_utc TEXT,expires_at_utc TEXT); INSERT INTO platform_watchlist_notification_events(event_id) VALUES ('historical');`);
  migration.statements.forEach(sql=>db.exec(sql));
  assert.equal(db.prepare('SELECT owner_approved FROM platform_watchlist_notification_events').get().owner_approved,0);
  let inbox=0,posts=0,replyStatus=200,enabled=true;
  const deps={
    '@/src/modules/platform/server/administration/platform-operator-repository':{PlatformOperatorRepository:class{findActive(){return enabled?{userId:'owner'}:null;}}},
    '@/src/modules/platform/server/notifications/platform-notification-repository':{PlatformNotificationRepository:class{create(){inbox++;}}},
  };
  const env={WATCHLIST_OWNER_REVIEW_DISCORD_WEBHOOK_URL:'https://discord.com/api/webhooks/123/fixture_only',WATCHLIST_OWNER_REVIEW_DISCORD_CHANNEL_ID:'456'};
  const notify=load('src/modules/watchlist/server/notifications/watchlist-automatic-notifications.ts',deps,{process:{env},fetch:async(url,options)=>{
    if(options.method==='POST'){posts++; const body=JSON.parse(options.body); assert.deepEqual(body.allowed_mentions,{parse:[]}); assert.ok(!body.content.includes('fixture_only')); return{ok:replyStatus===200,status:replyStatus,json:async()=>({retry_after:1})};}
    return{ok:true,json:async()=>({channel_id:'456'})};
  }});
  const event={kind:'review',symbol:'GYGY',cycleId:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',generationId:'generation',draftRevision:3,at:Date.now()};
  const input={settings:{ownerReviewNotificationsEnabled:true,ownerReviewDiscordEnabled:true},events:[event]};
  await notify.reconcileOwnerReviewNotifications(db,input); await notify.reconcileOwnerReviewNotifications(db,input);
  assert.equal(inbox,1); assert.equal(posts,1,'Durable duplicate suppression');
  input.events=[{...event,draftRevision:4}]; await notify.reconcileOwnerReviewNotifications(db,input);assert.equal(posts,1,'Owner edit same generation does not renotify');
  input.events=[{...event,generationId:'cooldown'}]; replyStatus=429;
  await notify.reconcileOwnerReviewNotifications(db,input);await notify.reconcileOwnerReviewNotifications(db,input);assert.equal(posts,2,'429 cooldown respected');
  input.events=[{...event,generationId:'uncertain'}];replyStatus=502;
  await notify.reconcileOwnerReviewNotifications(db,input);await notify.reconcileOwnerReviewNotifications(db,input);assert.equal(posts,3,'Uncertain delivery is not blindly repeated');
  input.events=[{...event,generationId:'disabled'}];input.settings.ownerReviewDiscordEnabled=false;input.settings.ownerReviewNotificationsEnabled=false;
  await notify.reconcileOwnerReviewNotifications(db,input);assert.equal(posts,3);assert.equal(inbox,3);
  enabled=false;input.events=[{...event,generationId:'no-owner'}];await notify.reconcileOwnerReviewNotifications(db,input);assert.equal(posts,3);
  assert.equal(notify.parseAutomaticAnalysisEvents({events:[{...event,at:Date.now()-3600001}]},Date.now()).events.length,0);
  assert.equal(notify.parseAutomaticAnalysisEvents({events:[{...event,kind:'publication',actor:'other',expectedHead:2}]},Date.now()).events.length,0);
  const managerSource=fs.readFileSync(path.join(runtime,'src/lib/monitoring/manual-watchlist-runtime-manager.ts'),'utf8');
  const ast=ts.createSourceFile('manager.ts',managerSource,ts.ScriptTarget.Latest,true);
  const cls=ast.statements.find(n=>ts.isClassDeclaration(n)&&n.name?.text==='ManualWatchlistRuntimeManager');
  const names=['getAutomaticAnalysisEvents','setAutomaticAnalysisPublicationControls','getTradersLinkAiReadReviewControls'];
  const methods=names.map(name=>cls.members.find(n=>n.name?.getText(ast)===name).getText(ast)).join('\n');
  const code=ts.transpileModule(`class Selected {${methods}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const Selected=new Function(code+';return Selected;')();const m=new Selected();
  const read={generationId:'auto',symbol:'GYGY'};const review={cycleId:event.cycleId,cancelled:false,draft:{revision:3,at:Date.now(),body:{kind:'original',payload:read}},events:[{revision:2,body:{kind:'generation',generationId:'auto',trigger:'boundary_cross'}}]};
  m.options={tradersLinkAiReadReviewStore:{read:()=>review}};m.watchlistStore={getActiveEntries:()=>[{symbol:'GYGY',publicationReview:{required:true,cycleId:event.cycleId}}]};m.tradersLinkAiReadGenerationSettings={automaticUpdatesEnabled:false};m.tradersLinkAiReadBoundaryRefreshSettings={enabled:true};
  assert.equal(m.getAutomaticAnalysisEvents().events[0].kind,'review');
  review.events[0].body.trigger='manual';assert.equal(m.getAutomaticAnalysisEvents().events.length,0);
  review.events[0].body.trigger='automatic';assert.equal(m.getAutomaticAnalysisEvents().events.length,0,'Initial/startup automatic request is not a boundary replacement');
  review.events[0].body.trigger='boundary_cross';review.approved={body:{kind:'approve',draftRevision:3}};assert.equal(m.getAutomaticAnalysisEvents().events.length,0);
  review.events.push({revision:4,actor:'runtime:automatic-boundary',at:Date.now(),body:{kind:'approve',draftRevision:3,publication:{notificationKind:'analysis',notifyUsers:true}}},
    {revision:5,actor:'runtime:publisher',at:Date.now(),body:{kind:'delivery',channel:'website',status:'acknowledged',approvalRevision:4}});
  const automatic=m.getAutomaticAnalysisEvents().events[0];assert.equal(automatic.kind,'publication');
  assert.equal(JSON.stringify(automatic).includes('payload'),false,'Projection must not expose private draft content');
  const contract=load('src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts');
  const publication=contract.publicationFromReview({ticker:'GYGY',cycleId:event.cycleId,expectedHead:automatic.expectedHead,draftRevision:3,actor:automatic.actor},automatic.review,Date.now());
  assert.equal(publication.notificationKind,'analysis');assert.equal(publication.notifyUsers,true);
  assert.equal(contract.watchlistPublicationNotificationCopy('GYGY','analysis').pushTitle,'GYGY Analysis updated');
  assert.equal(publication.ownerApproved,false);
  const ownerActor='platform-owner:aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const ownerReview=JSON.parse(JSON.stringify(automatic.review));
  ownerReview.events.find(e=>e.body.kind==='approve').actor=ownerActor;
  const owned=contract.publicationFromReview({ticker:'GYGY',cycleId:event.cycleId,expectedHead:automatic.expectedHead,draftRevision:3,actor:ownerActor},ownerReview,Date.now());
  assert.equal(owned.ownerApproved,true);
  const Store=load('src/modules/watchlist/server/notifications/watchlist-publication-notification-store.ts',{'./watchlist-publication-notification-contract':contract}).WatchlistPublicationNotificationStore;
  const queue=new Store(db);
  queue.accept({event:owned,now:new Date(),recipients:()=>[]});
  assert.equal(db.prepare("SELECT owner_approved FROM platform_watchlist_notification_events WHERE ticker='GYGY'").get().owner_approved,1);
  assert.equal(queue.accept({event:owned,now:new Date(),recipients:()=>{throw Error('must not resend');}}).duplicate,true);
  queue.accept({event:{...publication,approvalRevision:99},now:new Date(),recipients:()=>[]});
  assert.equal(db.prepare('SELECT owner_approved FROM platform_watchlist_notification_events WHERE approval_revision=99').get().owner_approved,0);
  assert.equal(contract.watchlistPublicationNotificationCopy('GYGY','analysis',owned.ownerApproved).pushTitle,'GYGY Analysis updated by "This Guy"');
  assert.equal(contract.watchlistPublicationNotificationCopy('GYGY','listing',true).emailTitle,'GYGY added to the TradersLink Watchlist by "This Guy"');
  const preview=load(path.join(runtime,'src/lib/ai/traderslink-ai-read-publication-preview.ts'));
  const original=['GYGY added to the watchlist.\n\nView GYGY: https://example.test/watchlist/GYGY\n@everyone'];
  assert.equal(preview.attributeOwnerApprovedDiscord(original,ownerActor)[0],'GYGY added to the watchlist by "This Guy".\n\nView GYGY: https://example.test/watchlist/GYGY\n@everyone');
  assert.equal(preview.attributeOwnerApprovedDiscord(['GYGY Analysis updated\n\nlinks'],ownerActor)[0],'GYGY Analysis updated by "This Guy"\n\nlinks');
  assert.equal(preview.attributeOwnerApprovedDiscord(original,'runtime:automatic-boundary')[0],original[0]);
  m.setAutomaticAnalysisPublicationControls({autoPublishBoundaryRefreshes:true});assert.equal(m.getTradersLinkAiReadReviewControls().automaticUpdatesEnabled,false);
  const api=load(path.join(runtime,'src/runtime/manual-watchlist-analysis-review-api.ts'));
  assert.equal((await api.dispatchAnalysisReviewRequest({method:'POST',pathname:'/api/watchlist/automatic-analysis-events',searchParams:new URLSearchParams()},m)).status,405);
  const panel=load(path.join(runtime,'src/runtime/manual-watchlist-analysis-review-panel.ts')).ANALYSIS_REVIEW_PANEL;
  const script=panel.match(/<script>([\s\S]*?)<\/script>/)[1];new vm.Script(script);
  assert.ok(panel.includes('Automatically publish refreshed analyses'));
  assert.ok(managerSource.includes('requestedTrigger === "automatic" && this.autoPublishBoundaryRefreshes'));
  assert.ok(managerSource.includes('autoPublishThisRequest && this.autoPublishBoundaryRefreshes && alreadyListed'));
  // Execute the exact completion/publication block without buying an AI read.
  const blockStart=managerSource.indexOf('        const saved = reviewStore.read(cycle.cycleId);');
  const blockEnd=managerSource.indexOf('        return read;',blockStart);
  assert.ok(blockStart>0&&blockEnd>blockStart);
  const block=ts.transpileModule(`async function complete(reviewStore,cycle,read,symbol,autoPublishThisRequest){${managerSource.slice(blockStart,blockEnd)}}`,{compilerOptions:{target:ts.ScriptTarget.ES2022}}).outputText;
  const complete=new Function(block+';return complete;')();
  let approvals=0;const publicationContext={autoPublishBoundaryRefreshes:true,approveTradersLinkAiRead:async input=>{approvals++;assert.equal(input.notifyUsers,true);assert.equal(input.actor,'runtime:automatic-boundary');}};
  const saved={head:3,draft:review.draft,events:[],preserveExistingPublication:true};const store={read:()=>saved};
  await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',false);assert.equal(approvals,0,'Manual request never auto approves');
  await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',true);assert.equal(approvals,1);
  publicationContext.autoPublishBoundaryRefreshes=false;await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',true);assert.equal(approvals,1,'Turning OFF during request respected');
  publicationContext.autoPublishBoundaryRefreshes=true;saved.preserveExistingPublication=false;
  await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',true);assert.equal(approvals,1,'Initial listing never auto approved');
  saved.preserveExistingPublication=true;saved.draft={...saved.draft,body:{kind:'original',payload:{generationId:'newer'}}};
  await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',true);assert.equal(approvals,1,'Do not approve superseding draft');
  saved.draft=review.draft;publicationContext.approveTradersLinkAiRead=async()=>{throw Error('fixture delivery failure');};
  await complete.call(publicationContext,store,{cycleId:event.cycleId},read,'GYGY',true);
  for(const file of ['src/lib/ai/traderslink-ai-read-settings.ts','src/lib/monitoring/manual-watchlist-runtime-manager.ts','src/runtime/manual-watchlist-server.ts']){
    const result=ts.transpileModule(fs.readFileSync(path.join(runtime,file),'utf8'),{fileName:file,reportDiagnostics:true,compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}});
    assert.equal(result.diagnostics.filter(d=>d.category===ts.DiagnosticCategory.Error).length,0,file);
  }
  db.close(); console.log('PASS owner durable dedupe, edit dedupe, cooldown, uncertain send, opt-outs, owner isolation, stale input, automatic projection/manual exclusion, control isolation, readonly endpoint, UI script syntax. No network or AI calls.');
})().catch(e=>{console.error(e);process.exitCode=1;});
