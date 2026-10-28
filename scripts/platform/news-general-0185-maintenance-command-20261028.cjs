'use strict';
// Bundle from the accepted source. Execution requires the exact future public-service plan.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const Database=require('better-sqlite3');
const {platformMigrationManifest}=require('../../src/modules/platform/server/database/platform-migration-manifest.ts');
const {readAppliedPlatformMigrations,listPlatformUserTableNames}=require('../../src/modules/platform/server/database/platform-migration-registry.ts');
const {runPlatformMigrations,verifyPlatformMaintenancePreflightStructure,PLATFORM_MIGRATION_BOUNDARY_HOOK_VERSION}=require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const {createAndRestoreVerifyPlatformDatabaseBackup}=require('../../src/modules/platform/server/database/platform-database-backup.ts');
const {configurePlatformDatabaseConnection}=require('../../src/modules/platform/server/database/open-platform-database.ts');
const {loadAccountIdentityConfiguration}=require('../../src/modules/journal/server/accounts/journal-account-service.ts');
const {ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION}=require('../../src/modules/journal/server/accounts/journal-source-account-canonicalizers.ts');
const live='/data/traderlink-platform.sqlite',checkpoint='/data/backups/news-general-production-20261028/0185-checkpoint-01';
const backup=checkpoint+'/backup.sqlite',restore=checkpoint+'/restore-verification.sqlite';
const target='0185_news_general_market_news',prefix=platformMigrationManifest.slice(0,148);
const newTables=['news_general_articles','news_general_symbols','news_general_revisions','news_general_deliveries','news_general_status'];
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const open=p=>{const d=new Database(p,{fileMustExist:true});configurePlatformDatabaseConnection(d,'runtime');return d;};
const save=(name,value)=>fs.writeFileSync(path.join(checkpoint,name),JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
const count=(d,n)=>d.prepare('SELECT COUNT(*) n FROM "'+n.replaceAll('"','""')+'"').get().n;
let windowLimits=null,liveAttempted=false,liveRunnerReturned=false;
function validateWindow(plan){
 const fields=['maintenanceStartedAtUtc','runnerStartedAtUtc','liveAdmissionDeadlineUtc','runnerDeadlineUtc','maintenanceDeadlineUtc'];
 const times=Object.fromEntries(fields.map(name=>{assert(typeof plan[name]==='string');const value=Date.parse(plan[name]);assert(Number.isFinite(value));return[name,value];}));
 assert(Number.isInteger(plan.runnerLimitSeconds)&&plan.runnerLimitSeconds>0&&plan.runnerLimitSeconds<=13800);
 assert(times.maintenanceStartedAtUtc<=times.runnerStartedAtUtc&&times.runnerStartedAtUtc<=Date.now());
 assert(Date.now()-times.runnerStartedAtUtc<30000,'stale runner start');
 assert(times.runnerStartedAtUtc<times.liveAdmissionDeadlineUtc&&times.liveAdmissionDeadlineUtc<times.runnerDeadlineUtc);
 assert.equal(times.runnerDeadlineUtc-times.runnerStartedAtUtc,plan.runnerLimitSeconds*1000);
 assert(times.maintenanceDeadlineUtc-times.runnerDeadlineUtc>=600000,'recovery reserve required');
 assert(times.maintenanceDeadlineUtc-times.maintenanceStartedAtUtc<=14400000);
 assert.equal(plan.externalWatchdog,'/usr/bin/timeout --signal=TERM --kill-after=10s');
 return times;
}
function assertBoundary(isLive,phase){
 assert(windowLimits&&Date.now()<windowLimits.runnerDeadlineUtc,'runner deadline');
 if(isLive&&phase!=='commit')assert(Date.now()<windowLimits.liveAdmissionDeadlineUtc,'live admission deadline');
}
function fileHash(file){const digest=crypto.createHash('sha256'),buffer=Buffer.alloc(1024*1024),fd=fs.openSync(file,'r');try{for(;;){const n=fs.readSync(fd,buffer,0,buffer.length,null);if(!n)break;digest.update(buffer.subarray(0,n));}return digest.digest('hex');}finally{fs.closeSync(fd);}}
function advance(file,isLive){
 const d=open(file);try{
  assert.equal(readAppliedPlatformMigrations(d).length,148);verifyPlatformMaintenancePreflightStructure(d,prefix);
  const oldTables=listPlatformUserTableNames(d).filter(n=>n!=='platform_schema_migrations');assert(newTables.every(n=>!oldTables.includes(n)));
  const counts=Object.fromEntries(oldTables.map(n=>[n,count(d,n)]));
  assertBoundary(isLive,'begin');
  const result=runPlatformMigrations(d,{manifest:platformMigrationManifest,beforeMigrationBoundary:phase=>{
   assertBoundary(isLive,phase);
   if(isLive&&phase==='statements'){liveAttempted=true;save('live-admission.json',{at:new Date().toISOString(),liveAdmissionDeadlineUtc:new Date(windowLimits.liveAdmissionDeadlineUtc).toISOString(),runnerDeadlineUtc:new Date(windowLimits.runnerDeadlineUtc).toISOString()});assertBoundary(true,phase);}
  }});
  if(isLive){liveRunnerReturned=true;save('live-runner-returned.json',{at:new Date().toISOString(),schema:result.finalSchemaSha256,appliedMigrationIds:result.appliedMigrationIds,requiresReadOnlyDispositionOnAnyLaterFailure:true});}
  assert.deepEqual([...result.appliedMigrationIds],[target]);
  assert.equal(readAppliedPlatformMigrations(d).length,149);assert.deepEqual(Object.fromEntries(oldTables.map(n=>[n,count(d,n)])),counts);
  assert(newTables.every(n=>count(d,n)===0));assert.equal(result.finalSchemaSha256,'f8ee64f9b93b595929c764128b52e9f15fda6ea58cab9ecedc3bfb8d6061d33e');
  d.pragma('wal_checkpoint(TRUNCATE)');return{schema:result.finalSchemaSha256,protectedTableCounts:counts,newTablesEmpty:true};
 }finally{d.close();}
}
async function main(){
 assert.equal(PLATFORM_MIGRATION_BOUNDARY_HOOK_VERSION,1,'reviewed sink-level migration hook required');
 assert.equal(process.argv[2],'--apply');assert.equal(process.argv[3],'--release-plan');assert.equal(process.argv[4],'/tmp/news-general-0185-public-release-plan-20261028.json');
 assert.equal(process.env.RAILWAY_PROJECT_ID,'49fc9197-07c9-45c7-b528-57d0393c2cca');assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');assert.equal(process.env.RAILWAY_SERVICE_ID,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,live);
 assert.equal(process.env.TRADERLINK_GENERAL_NEWS_MAINTENANCE_WINDOW,'news-general-0185-window-20261028-after-2000-et');assert(Date.now()>=Date.parse('2026-10-28T23:25:00Z'));
 assert(!process.env.TRADERLINK_RECOVERY_SCHEMA_PREFIX);assert.equal(platformMigrationManifest.length,149);assert.equal(platformMigrationManifest[148].migrationId,target);assert.equal(platformMigrationManifest[148].executionOrder,222);
 const plan=JSON.parse(fs.readFileSync(process.argv[4],'utf8'));assert.equal(plan.version,'news-general-0185-public-release/v1');assert.equal(plan.ownerTimingApproved,true);assert.equal(plan.expectedDowntimeApproved,true);assert.equal(plan.finalDeployment,process.env.RAILWAY_DEPLOYMENT_ID);assert.equal(plan.volume,'5784d008-9785-407c-b3b0-01c26ecec025');assert.equal(plan.checkpoint,checkpoint);
 assert(/^sha256:[a-f0-9]{64}$/.test(plan.finalImage));assert(/^sha256:[a-f0-9]{64}$/.test(plan.recoveryImage));assert(/^[a-f0-9-]{36}$/.test(plan.recoveryDeployment));assert.equal(plan.bothOriginalServiceImagesVerified,true);assert.equal(plan.finalMaintenanceHealthVerified,true);windowLimits=validateWindow(plan);assertBoundary(false,'begin');
 const marker=JSON.parse(fs.readFileSync('/app/scripts/platform/general-news-image-source-20261028.json','utf8'));assert.equal(marker.role,'final');assert.equal(marker.applicationSource,'ae0fcdc9212a2af385c6e1efa2321c06284ee2e7');assert.equal(marker.activationRoute,'original_public_service_only');
 assert.equal(fs.realpathSync(live),live);assert(!fs.existsSync(checkpoint),'checkpoint already exists: inspect, never retry blindly');
 for(const directory of ['/data','/data/backups','/data/backups/news-general-production-20261028'])if(fs.existsSync(directory))assert(fs.lstatSync(directory).isDirectory()&&!fs.lstatSync(directory).isSymbolicLink());
 const d=open(live);try{
  const rows=d.prepare('SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order').all();assert.equal(rows.length,148);assert.equal(sha(JSON.stringify(rows)),'de12fd94892dc6173136722f323f3e0e191871fbac731369fb1ee75dc84292cb');verifyPlatformMaintenancePreflightStructure(d,prefix);d.pragma('wal_checkpoint(TRUNCATE)');
 }finally{d.close();}
 const capacity=fs.statfsSync('/data'),liveBytes=fs.statSync(live).size,freeBytes=capacity.bavail*capacity.bsize;assert(freeBytes>liveBytes*3+2*1024**3);
 fs.mkdirSync(checkpoint,{recursive:true,mode:0o700});save('release-intent.json',{at:new Date().toISOString(),live,backup,restore,sidecars:[backup+'-wal',backup+'-shm',restore+'-wal',restore+'-shm'],predecessor:148,targetCount:149,migrations:[target],liveBytes,freeBytes,planSha256:sha(JSON.stringify(plan)),removalCondition:'Only after healthy final or exact compatible recovery, source/schema/volume proof, hashes retained and no active handles. Exact checkpoint files only; managed Railway backups excluded.'});
 const evidence=await createAndRestoreVerifyPlatformDatabaseBackup({sourcePath:live,backupPath:backup,restoreVerificationPath:restore,verificationManifest:prefix,verifyRecoveryAuthority:r=>{const config=loadAccountIdentityConfiguration(process.env,ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION);assert(r.hmacKeyVersions.every(v=>v in config.keysBase64));assert(r.sourceAccountCanonicalizationVersions.every(v=>v in ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS));return{verified:true,...r};}});
 save('backup-evidence.json',{phase:'verified148_before_rehearsal',evidence});console.log(JSON.stringify({stage:'backup_restore_verified',backup148Sha256:evidence.backup.fileSha256,restore148ProofSha256:evidence.restored.fileSha256}));
 assertBoundary(false,'begin');const rehearsed=advance(restore,false);const restore149RehearsalSha256=fileHash(restore);save('rehearsal.json',{...rehearsed,phase:'restored149_rehearsal',fileSha256:restore149RehearsalSha256,preMigration148ProofSha256:evidence.restored.fileSha256});console.log(JSON.stringify({stage:'restored_target_rehearsal_verified',schema:rehearsed.schema,migrationCount:149,restore149RehearsalSha256}));
 assertBoundary(true,'begin');const result=advance(live,true);assert.equal(result.schema,rehearsed.schema);const afterDeadline=Date.now()>=windowLimits.runnerDeadlineUtc;save('completed.json',{at:new Date().toISOString(),migrationCount:149,schema:result.schema,migrations:[target],backup148Sha256:evidence.backup.fileSha256,restore148ProofSha256:evidence.restored.fileSha256,restore149RehearsalSha256,protectedTableCounts:result.protectedTableCounts,newTablesEmpty:true,afterRunnerDeadline:afterDeadline,nextAction:afterDeadline?'restore_qualified149_application_immediately_no_retry':'restore_qualified149_application'});
 console.log(JSON.stringify({stage:'production_migrations_verified',migrationCount:149,schema:result.schema,status:afterDeadline?'applied_after_deadline':'applied',restoreApplicationImmediately:true}));
}
main().catch(error=>{console.error(JSON.stringify({stage:'guarded_migration_failed',code:typeof error.code==='string'&&/^[A-Z0-9_]{1,100}$/.test(error.code)?error.code:'release_guard_failed',liveAttempted,liveRunnerReturned,requiresReadOnlyLedgerProbe:liveAttempted,blindRetryOrOldDatabaseRestoreForbidden:true,nextAction:'probe_exact148_or149_and_restore_prebuilt_compatible_application'}));process.exitCode=1;});
