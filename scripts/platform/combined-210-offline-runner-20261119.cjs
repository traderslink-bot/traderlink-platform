'use strict';
// Explicit Root invocation only. Full original /data backup -> full /tmp restore
// -> canonical DEFAULT per-migration/FK-aware offline migration. No live install,
// Auth/profile/normal worker startup, provider calls, cleanup or blind retry.
const fs=require('node:fs'),path=require('node:path'),a=require('node:assert/strict');
const c=require('./combined-210-control-20261119.cjs'),v=require('./combined-210-native-verification-20261119.cjs');
const TARGET='e2b148f268e6ca409263612d1bc3b3457955db2e6ef07c390c3ba8a45e063016';
const OLD='9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89';
const decimal=n=>{a(typeof n==='string'&&/^\d+$/.test(n));return BigInt(n);};
function save(root,name,value){a(!name.includes('/'));const raw=Buffer.from(JSON.stringify(value)+'\n');a(raw.length<=4*1024*1024,'bounded_offline_evidence');
  const fd=fs.openSync(path.join(root,name),fs.constants.O_WRONLY|fs.constants.O_CREAT|fs.constants.O_EXCL|fs.constants.O_NOFOLLOW,0o600);
  try{fs.writeFileSync(fd,raw);fs.fsyncSync(fd);}finally{fs.closeSync(fd);}const dir=fs.openSync(root,fs.constants.O_RDONLY|fs.constants.O_DIRECTORY|fs.constants.O_NOFOLLOW);
  try{fs.fsyncSync(dir);}finally{fs.closeSync(dir);}return v.sha(raw);}
function syncFile(file){const fd=fs.openSync(file,fs.constants.O_RDONLY|fs.constants.O_NOFOLLOW);try{fs.fsyncSync(fd);}finally{fs.closeSync(fd);}}
function noPayloadSidecars(file){for(const suffix of ['-wal','-journal']){const p=file+suffix;
  if(fs.existsSync(p)){const s=v.noLinks(p);a.equal(s.size,0n,'nonempty_database_sidecar');}}}
function targetEnvironment(input){a.equal(input.databasePath,'/data/traderlink-platform.sqlite');
  for(const [k,value]of Object.entries({NODE_ENV:'production',RAILWAY_PROJECT_ID:'49fc9197-07c9-45c7-b528-57d0393c2cca',
    RAILWAY_ENVIRONMENT_ID:'666e1624-a1eb-4e94-8e16-5ed73ad4b4af',RAILWAY_SERVICE_ID:'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb',
    RAILWAY_DEPLOYMENT_ID:input.deployment,RAILWAY_GIT_COMMIT_SHA:input.source,TRADERLINK_PLATFORM_DB_PATH:input.databasePath}))a.equal(process.env[k],value);
  a.match(input.source,/^[a-f0-9]{40}$/);a.match(input.deployment,/^[a-f0-9-]{36}$/);a.equal(input.schemaSha256,TARGET);
  a.equal(input.originalCount,210);a.equal(input.originalSchemaSha256,OLD);
  a.equal(input.ownerWindowEndUtc,'2026-11-24T10:00:00.000Z');
  const pre=input.admission;a.equal(pre.kind,'ROOT_REVIEWED211_MAINTENANCE_PREPARATION');
  for(const k of ['actualInstalledImageVerified','singleWriterAndAllForeignHandlesClosed','originalRecoveryPrepared','namespaceAndMountCoverageComplete'])a.equal(pre[k],true);
  for(const k of ['imageReviewSha256','custodyReviewSha256','recoveryReviewSha256'])a.match(pre[k],/^[a-f0-9]{64}$/);}
function capacity(input,stage){const receipt=JSON.parse(fs.readFileSync(input.capacityReceiptPath));
  a.equal(receipt.kind,'ROOT_STORAGE_REVIEWED211_COMPLETE_CAPACITY');a.equal(receipt.runId,input.runId);a.equal(receipt.deployment,input.deployment);a.equal(receipt.stage,stage);
  a.match(receipt.reviewSha256,/^[a-f0-9]{64}$/);a.equal(receipt.unknownOrOpaquePaths,0);
  for(const k of ['coverageComplete','allJournalStatementSortRebuildAndDeletedOpenGenerationsCovered','sparseFillAndCopybackCovered','memoryAndLargestRowCovered'])a.equal(receipt[k],true);
  const age=Date.now()-Date.parse(receipt.observedAtUtc);a(age>=0&&age<=60000,'capacity_receipt_stale');
  const quota=decimal(receipt.quotaBytes);a.equal(quota,100000000000n);
  a(decimal(receipt.usedUpperBoundBytes)+decimal(receipt.tmpAdditionalPeakBytes)<=quota,'container_quota_bound');
  const tmp=fs.statfsSync('/tmp',{bigint:true}),data=fs.statfsSync('/data',{bigint:true});
  a(![0x01021994n,0x858458f6n].includes(tmp.type),'tmp_must_be_disk_backed');
  a.notEqual(fs.statSync('/tmp').dev,fs.statSync('/data').dev);
  a(tmp.bavail*tmp.bsize>=decimal(receipt.tmpAdditionalPeakBytes));a(data.bavail*data.bsize>=decimal(receipt.dataAdditionalPeakBytes));
  a(decimal(receipt.maxOfflineMainBytes)>0n);a(decimal(receipt.offlineScratchAndJournalsPeakBytes)>0n);
  a.equal(receipt.ownedAccountingMethod,'subtract_only_exact_allocations_already_in_used');return receipt;}
async function prepareOfflineTarget(input){targetEnvironment(input);return c.lockedAsync(input.root,input.runId,async lease=>{
  const state=c.readState(input.root,input.runId);a.equal(state.phase,'MAINTENANCE_HOLD');a(!fs.existsSync(input.root+'/TARGET_WRITES_ADMITTED.json'));
  const deadline=Date.parse(input.ownerWindowEndUtc),guard=()=>{c.assertLease(lease,input.root,input.runId);a(Date.now()<deadline,'owner_window_reached');};guard();
  const reviewed=capacity(input,'before_backup');
  a(input.backupPath.startsWith(input.root+'/')&&input.backupPath.endsWith('.sqlite'));a(input.offlinePath.startsWith('/tmp/')&&input.offlinePath.endsWith('.sqlite'));
  for(const file of [input.backupPath,input.offlinePath]){v.noLinks(path.dirname(file),true);a(!fs.existsSync(file),'new_artifact_already_exists');}
  a.notEqual(input.backupPath,input.offlinePath);a.notEqual(input.backupPath,input.databasePath);a.notEqual(input.offlinePath,input.databasePath);
  noPayloadSidecars(input.databasePath);const initialIdentity=v.identity(input.databasePath);
  const x=v.api();a.equal(x.platformMigrationManifest.length,211);
  const source=v.verifyFullFile({databasePath:input.databasePath,count:210,expectedSchemaSha256:OLD,guard});
  a.deepEqual(source.identity,initialIdentity);guard();
  const intentSha=save(input.root,'offline-intent.json',{kind:'EXACT211_OFFLINE_PREPARATION_INTENT',runId:input.runId,source:input.source,
    deployment:input.deployment,initialIdentity,sourceSha256:source.fileSha256,originalLedger:source.ledger,originalData:source.data,
    backupPath:input.backupPath,offlinePath:input.offlinePath,capacityReviewSha256:reviewed.reviewSha256,originalRecoveryOnlyBeforeTargetWrites:true});
  c.write(input.root,'state.json',{...state,phase:'PREPARING_BACKUP',sequence:state.sequence+1,intentSha256:intentSha},true);
  const {createAndRestoreVerifyPlatformDatabaseBackup}=require('../../src/modules/platform/server/database/platform-database-backup.ts');
  const evidence=await createAndRestoreVerifyPlatformDatabaseBackup({sourcePath:input.databasePath,backupPath:input.backupPath,
    restoreVerificationPath:input.offlinePath,verificationManifest:x.platformMigrationManifest.slice(0,210),
    verifyRecoveryAuthority(requirements){const {loadAccountIdentityConfiguration}=require('../../src/modules/journal/server/accounts/journal-account-service.ts');
      const canon=require('../../src/modules/journal/server/accounts/journal-source-account-canonicalizers.ts');
      const keys=loadAccountIdentityConfiguration(process.env,canon.ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,canon.DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION);
      a(requirements.hmacKeyVersions.every(k=>Object.hasOwn(keys.keysBase64,k)));a(requirements.sourceAccountCanonicalizationVersions.every(k=>Object.hasOwn(canon.ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,k)));
      return {verified:true,...requirements};}});
  guard();syncFile(input.backupPath);syncFile(input.offlinePath);save(input.root,'full-backup-restore-evidence.json',evidence);
  for(const file of [input.databasePath,input.backupPath,input.offlinePath]){
    const proof=v.verifyFullFile({databasePath:file,count:210,expectedSchemaSha256:OLD,originalLedger:source.ledger,originalData:source.data,guard});
    if(file===input.databasePath)a.equal(proof.fileSha256,source.fileSha256);noPayloadSidecars(file);
  }
  a.equal(v.hashFile(input.backupPath,guard),evidence.backup.fileSha256);
  a.equal(v.hashFile(input.offlinePath,guard),evidence.backup.fileSha256);
  const saved=c.readState(input.root,input.runId);c.write(input.root,'state.json',{...saved,phase:'ORIGINAL_VERIFIED',sequence:saved.sequence+1,
    originalLiveIdentity:initialIdentity,originalLiveSha256:source.fileSha256,originalBackupIdentity:v.identity(input.backupPath),
    originalBackupSha256:evidence.backup.fileSha256,originalBackupPath:input.backupPath,offlinePath:input.offlinePath},true);
  // Root's independently reviewed envelope covers ALL generations and memory,
  // not the additive188 metadata-only journal estimate. This default framework
  // honors each descriptor's requiresForeignKeysDisabled and commits serially.
  guard();const db=v.open(input.offlinePath,false);let result;
  try{db.pragma('journal_mode=DELETE');db.pragma('synchronous=FULL');db.pragma('temp_store=FILE');db.pragma('cache_spill=ON');
    db.pragma('cache_size=-32768');const page=db.pragma('page_size',{simple:true});
    const maxPages=decimal(reviewed.maxOfflineMainBytes)/BigInt(page);a(maxPages>0n&&maxPages<=4294967294n);
    a.equal(BigInt(db.pragma('max_page_count='+maxPages,{simple:true})),maxPages);
    const phase=c.readState(input.root,input.runId);c.write(input.root,'state.json',{...phase,phase:'OFFLINE_MIGRATING',sequence:phase.sequence+1},true);
    const migration=x.platformMigrationManifest[210];
    a.equal(migration.moduleNamespace,'news');a.equal(migration.executionOrder,306);
    a.equal(migration.migrationId,'0227_news_article_ingestion_memberships');
    a(!migration.requiresForeignKeysDisabled);
    result=x.runPlatformMigrations(db,{atomicSuffix:true,beforeMigrationBoundary:guard,
      verifyAtomicSuffix:result=>{
        a.deepEqual(result.appliedMigrationIds,[migration.migrationId]);
        a.equal(result.finalSchemaSha256,TARGET);
        const applied=x.readAppliedPlatformMigrations(db);
        a.equal(applied.length,211);
        a.deepEqual(applied.slice(0,210),source.ledger);
        a.equal(applied[210].checksum_sha256,'0fc66a860e938c4b3c9d5a583459ca6c9fa4c78644c2e84868ed29bddaec4c6b');
      }});
    a.equal(result.finalSchemaSha256,TARGET);x.verifyCompletedPlatformDatabase(db);
    a.deepEqual(x.readAppliedPlatformMigrations(db).slice(0,210),source.ledger);
    a.deepEqual(v.dataSnapshot(db,source.data,guard),source.data);
    a.equal(db.pragma('foreign_keys',{simple:true}),1);
  }finally{db.close();}
  // Close the DDL/verification connection and ALL its statements before the
  // separate persistence-mode/checkpoint connection; retained TEMP schema/read
  // statements otherwise make SQLite reject wal_checkpoint with SQLITE_LOCKED.
  const finalizer=v.open(input.offlinePath,false);try{
    const page=finalizer.pragma('page_size',{simple:true});
    finalizer.pragma('max_page_count='+(decimal(reviewed.maxOfflineMainBytes)/BigInt(page)));
    a.equal(finalizer.pragma('journal_mode=WAL',{simple:true}),'wal');
    const cp=finalizer.pragma('wal_checkpoint(TRUNCATE)')[0];a.equal(cp.busy,0);
  }finally{finalizer.close();}
  guard();noPayloadSidecars(input.offlinePath);syncFile(input.offlinePath);
  const target=v.verifyFullFile({databasePath:input.offlinePath,count:211,expectedSchemaSha256:TARGET,originalLedger:source.ledger,originalData:source.data,guard});
  const targetSha=save(input.root,'offline-target-verification.json',target);
  a.deepEqual(v.identity(input.databasePath),initialIdentity);a.equal(v.hashFile(input.databasePath,guard),source.fileSha256);
  const current=c.readState(input.root,input.runId);c.write(input.root,'state.json',{...current,phase:'OFFLINE_TARGET_VERIFIED',sequence:current.sequence+1,
    offlineTargetIdentity:target.identity,offlineTargetSha256:target.fileSha256,offlineTargetVerificationSha256:targetSha,
    targetSource:input.source,targetSchemaSha256:TARGET},true);
  return {kind:'EXACT211_OFFLINE_TARGET_VERIFIED_NOT_LIVE_INSTALL',runId:input.runId,source:input.source,
    originalBackupSha256:evidence.backup.fileSha256,offlineTargetSha256:target.fileSha256,verificationReceiptSha256:targetSha,
    targetCount:211,liveSqlWrites:0,allOwnedDatabaseHandlesClosed:true};
});}
function verifyInstalledTarget(input){return c.locked(input.root,input.runId,controlLease=>{
  const state=c.readState(input.root,input.runId);a.equal(state.phase,'INSTALL_HASH_VERIFIED');
  const raw=fs.readFileSync(input.root+'/offline-intent.json');a.equal(v.sha(raw),state.intentSha256);const original=JSON.parse(raw);
  noPayloadSidecars(input.databasePath);
  const proof=v.verifyFullFile({databasePath:input.databasePath,count:211,expectedSchemaSha256:TARGET,originalLedger:original.originalLedger,originalData:original.originalData});
  a.equal(proof.fileSha256,state.offlineTargetSha256);
  const receipt={kind:'EXACT211_INSTALLED_READONLY_VERIFICATION',runId:input.runId,source:state.targetSource,schemaSha256:TARGET,count:211,nativeTargetContract:c.nativeTargetContract,
    liveIdentity:proof.identity,fileSha256:proof.fileSha256,fullLedgerOriginalPrefixAndDataPreserved:true,foreignKeys:'ok',quickCheck:'ok',applicationOrAuthOrProviderWrites:0};
  const receiptSha=save(input.root,'installed-full-verification.json',{...receipt,fullProof:proof});
  c.markTargetVerified({root:input.root,runId:input.runId,controlLease,source:state.targetSource,schemaSha256:TARGET,
    readOnlyVerification:receipt,verificationReceiptSha256:receiptSha});return {receipt,sha256:receiptSha};
});}
function verifyRecoveredOriginal(input){return c.locked(input.root,input.runId,()=>{
  const state=c.readState(input.root,input.runId);a.equal(state.phase,'ORIGINAL_HASH_VERIFIED');
  a(!fs.existsSync(input.root+'/TARGET_WRITES_ADMITTED.json'),'post_write_original_recovery_forbidden');
  const raw=fs.readFileSync(input.root+'/offline-intent.json');a.equal(v.sha(raw),state.intentSha256);const original=JSON.parse(raw);
  noPayloadSidecars(input.databasePath);
  const proof=v.verifyFullFile({databasePath:input.databasePath,count:210,expectedSchemaSha256:OLD,originalLedger:original.originalLedger,originalData:original.originalData});
  a.equal(proof.fileSha256,state.originalBackupSha256);a.equal(proof.identity.device,state.originalLiveIdentity.device);a.equal(proof.identity.inode,state.originalLiveIdentity.inode);
  const receiptSha=save(input.root,'recovered-original-full-verification.json',proof);
  c.write(input.root,'state.json',{...state,phase:'ORIGINAL_VERIFIED',sequence:state.sequence+1,recoveredOriginalReceiptSha256:receiptSha,
    compatibleOriginalApplicationNotStarted:true},true);
  return {kind:'ORIGINAL210_FULLY_RECOVERED_NOT_APPLICATION_STARTED',sha256:receiptSha,oldApplicationRestartOwnedByRoot:true};
});}
module.exports={prepareOfflineTarget,verifyInstalledTarget,verifyRecoveredOriginal,targetEnvironment,capacity};
