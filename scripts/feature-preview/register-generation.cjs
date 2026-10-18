// NEW synthetic database only. No production reads, external logins or provider calls.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const Module=require('node:module'),load=Module._load;Module._load=function(id,...args){return id==='server-only'?{}:load.call(this,id,...args)};
require('tsx/cjs');
const root=process.cwd(),port=3038,name=process.argv[2]||'generation-3038-r1',head=cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
if(!/^[a-z0-9-]+$/.test(name))throw Error('Invalid profile name');
const profileFile=`/workspaces/traderslink-coordinator/codex-setup/preview-profiles/${name}.json`;
if(fs.existsSync(profileFile))throw Error('Choose new profile identity');
const dir=fs.mkdtempSync('/workspaces/private-data/feature-preview-');fs.chmodSync(dir,0o700);
for(const sub of ['vault','uploads','protected'])fs.mkdirSync(path.join(dir,sub));
const key=crypto.randomBytes(32).toString('base64');
const env={TRADERLINK_PLATFORM_STORAGE_BACKEND:'sqlite_single_node',TRADERLINK_PLATFORM_DB_PATH:path.join(dir,'qa.sqlite'),TRADERLINK_LOGIN_RATE_LIMIT_SECRET:crypto.randomBytes(48).toString('base64url'),TRADERLINK_PLATFORM_JOURNAL_EVIDENCE_VAULT_ROOT:path.join(dir,'vault'),TRADERLINK_PLATFORM_JOURNAL_UPLOAD_STAGING_ROOT:path.join(dir,'uploads'),TRADERLINK_PLATFORM_JOURNAL_PROTECTED_STORAGE_ROOTS_JSON:JSON.stringify([path.join(dir,'protected')]),TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_ACTIVE_KEY_VERSION:'qa',TRADERLINK_PLATFORM_ACCOUNT_IDENTITY_HMAC_KEYS_JSON:JSON.stringify({qa:key}),TRADERLINK_PLATFORM_JOURNAL_HMAC_ACTIVE_KEY_VERSION:'qa',TRADERLINK_PLATFORM_JOURNAL_HMAC_KEYS_JSON:JSON.stringify({qa:key})};
Object.assign(process.env,env,{NODE_ENV:'development'});
const {openPlatformDatabase}=require('../../src/modules/platform/server/database/open-platform-database.ts');
const {runPlatformMigrations}=require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const {PlatformLoginService}=require('../../src/modules/platform/server/authentication/platform-login-service.ts');
const {PlatformMembershipRepository}=require('../../src/modules/platform/server/membership/platform-membership-repository.ts');
const {JournalAccountService}=require('../../src/modules/journal/server/accounts/journal-account-service.ts');
const {JournalAccountRepository}=require('../../src/modules/journal/server/accounts/journal-account-repository.ts');
const {deriveJournalAccountSelectionRef}=require('../../src/modules/platform/contracts/journal-account-selection.ts');
const {createJournalIntegrityRuntime}=require('../../src/modules/journal/server/journal-integrity-runtime.ts');
const db=openPlatformDatabase({mode:'initializer',databasePath:env.TRADERLINK_PLATFORM_DB_PATH,forbiddenRepositoryRoots:[]});runPlatformMigrations(db);
const login=new PlatformLoginService(db),memberships=new PlatformMembershipRepository(db),now=new Date(),at=now.toISOString(),sessions={};
for(const role of ['excluded','zero','limited','unlimited','expired','combined','other']){const s=login.signInOAuth({provider:'google',subject:'synthetic-generation-'+role,displayName:'QA '+role});sessions[role]={token:s.token,userId:s.session.userId,accounts:[]};}
const actor=sessions.excluded.userId;memberships.synchronizeBuiltInFeatures(actor,at);
for(const [role,member] of Object.entries(sessions)){
 const limit={zero:0,limited:2,unlimited:null,expired:2,combined:5,other:2}[role];
 const plan=memberships.createPlan({actorUserId:actor,planKey:'generation-'+role,name:'QA '+role,visibility:'unlisted',atUtc:at,features:[{featureKey:'journal.access',limitValue:null},...(role==='excluded'?[]:[{featureKey:'trade_analyzer.analyses',limitValue:limit,resetDays:5}])]});
 memberships.publishPlanVersion({actorUserId:actor,planVersionId:plan.planVersionId,atUtc:at});member.planVersionId=plan.planVersionId;
 memberships.grantEntitlement({actorUserId:actor,userId:member.userId,planVersionId:plan.planVersionId,sourceType:'free_plan',sourceRef:'qa-'+role,startsAtUtc:role==='expired'?new Date(now.getTime()-86400000).toISOString():at,endsAtUtc:role==='expired'?new Date(now.getTime()-1000).toISOString():null,atUtc:at});
 const workspace=db.prepare('SELECT workspace_id FROM journal_accounts WHERE created_by_user_id=? LIMIT 1').get(member.userId).workspace_id;
 const initial=db.prepare('SELECT account_id FROM journal_accounts WHERE created_by_user_id=? LIMIT 1').get(member.userId).account_id;
 // Model a member who already completed first-visit Demo onboarding.
 new (require('../../src/modules/journal/server/demo/journal-demo-account-repository.ts').JournalDemoAccountRepository)(db).recordClearedLifecycle({userId:member.userId,workspaceId:workspace,clearedDemoAccountId:crypto.randomUUID(),clearedAtUtc:at});
 const accounts=new JournalAccountService(new JournalAccountRepository(db));
 const second=accounts.createAccount({userId:member.userId,workspaceId:workspace,workspaceRole:'owner',allowedAccountIds:[initial],activeAccountId:initial},{workspaceId:workspace,displayName:'QA second',baseCurrency:'USD',tradingTimezone:'America/New_York'}).accountId;
 for(const accountId of [initial,second]){
  const scope={userId:member.userId,workspaceId:workspace,workspaceRole:'owner',allowedAccountIds:[initial,second],activeAccountId:accountId};
  const selectionRef=deriveJournalAccountSelectionRef(workspace,accountId),journal=createJournalIntegrityRuntime(db);
  for(const symbol of ['QAA','QAB','QAC','QAD']){
   const entries=['buy','sell'].map((side,n)=>({clientRowRef:crypto.randomUUID(),localDate:'2026-10-14',localTime:n?'10:15:00':'09:30:00',sourceTimezone:'America/New_York',normalizedSymbol:symbol,tradeCurrency:'USD',side,quantityDecimal:'10',priceDecimal:n?'5.5':'5.25',feesDecimal:null}));
   const preview=journal.manualTradePreviews.preview(scope,{accountSelectionRef:selectionRef,tracker:'day',entries});
   journal.manualTrades.commit(scope,selectionRef,{tracker:'day',entries,previewRef:preview.previewRef,expectedAccountSelectionRef:selectionRef,idempotencyKey:crypto.randomUUID(),confirmations:preview.groups.map(g=>({groupRef:g.groupRef,relationship:'start_new_trade',style:'day_trade',existingPositionRef:null,completeExecutionSetConfirmed:true}))},now);
  }
  const trades=db.prepare('SELECT round_trip_id FROM journal_round_trips WHERE workspace_id=? AND account_id=? ORDER BY round_trip_id').all(workspace,accountId).map(r=>r.round_trip_id);
  member.accounts.push({scope,selectionRef,trades});
 }
 // Keep Journal for expired members, matching the real downgrade requirement.
 if(role==='expired'){
  const p=memberships.createPlan({actorUserId:actor,planKey:'generation-expired-journal',name:'QA expired Journal',visibility:'unlisted',atUtc:at,features:[{featureKey:'journal.access',limitValue:null}]});memberships.publishPlanVersion({actorUserId:actor,planVersionId:p.planVersionId,atUtc:at});memberships.grantEntitlement({actorUserId:actor,userId:member.userId,planVersionId:p.planVersionId,sourceType:'free_plan',sourceRef:'qa-expired-journal',startsAtUtc:at,endsAtUtc:null,atUtc:at});
 }
}
const ledger=db.prepare('SELECT migration_id,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();db.close();
fs.writeFileSync(path.join(dir,'generation-sessions.json'),JSON.stringify(sessions),{mode:0o600});
const fixture=path.join(dir,'fixture.json');fs.writeFileSync(fixture,JSON.stringify({kind:'traderlink_disposable_feature_preview_v1',dir,env,ledger}),{mode:0o600});
fs.writeFileSync(profileFile,JSON.stringify({version:1,mode:'membership-generation',root,head,port,fixture,entry:'scripts/feature-preview/generation-server.cjs',readyPath:'/__generation-qa',distDir:`.next-feature-previews/${port}`,tsconfig:`.next-feature-previews/tsconfig-${port}.json`,origin:`https://${process.env.CODESPACE_NAME}-${port}.app.github.dev`,maxOldSpaceMb:1536},null,2),{flag:'wx'});
console.log('REGISTERED '+name+'; seven synthetic signed members, two accounts each; no providers');
