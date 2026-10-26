'use strict';
// Bundle with esbuild; this exact reviewed command is the only migration entry.
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),path=require('node:path');
const Database=require('better-sqlite3');
const {platformMigrationManifest}=require('../../src/modules/platform/server/database/platform-migration-manifest.ts');
const {readAppliedPlatformMigrations,listPlatformUserTableNames}=require('../../src/modules/platform/server/database/platform-migration-registry.ts');
const {runPlatformMigrations,verifyPlatformMaintenancePreflightStructure}=require('../../src/modules/platform/server/database/run-platform-migrations.ts');
const {createAndRestoreVerifyPlatformDatabaseBackup}=require('../../src/modules/platform/server/database/platform-database-backup.ts');
const {configurePlatformDatabaseConnection}=require('../../src/modules/platform/server/database/open-platform-database.ts');
const {loadAccountIdentityConfiguration}=require('../../src/modules/journal/server/accounts/journal-account-service.ts');
const {ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION}=require('../../src/modules/journal/server/accounts/journal-source-account-canonicalizers.ts');
const live='/data/traderlink-platform.sqlite',checkpoint='/data/backups/admin-erasure-production-20261026/0183-0184-checkpoint-01';
const backup=checkpoint+'/backup.sqlite',restore=checkpoint+'/restore-verification.sqlite',prefix=platformMigrationManifest.slice(0,146);
const expected=['0183_platform_account_erasure_recovery','0184_platform_watchlist_usage_user_recent'];
const open=p=>{const d=new Database(p,{fileMustExist:true});configurePlatformDatabaseConnection(d,'runtime');return d;};
const save=(name,value)=>fs.writeFileSync(path.join(checkpoint,name),JSON.stringify(value,null,2)+'\n',{mode:0o600,flag:'wx'});
function counts(d){return Object.fromEntries(listPlatformUserTableNames(d).filter(n=>n!=='platform_schema_migrations'&&!n.startsWith('platform_erasure_')).map(n=>[n,d.prepare('SELECT COUNT(*) n FROM "'+n.replaceAll('"','""')+'"').get().n]));}
function advance(p){const d=open(p);try{const before=counts(d),result=runPlatformMigrations(d,{manifest:platformMigrationManifest});assert.deepEqual([...result.appliedMigrationIds],expected);assert.deepEqual(counts(d),before);d.pragma('wal_checkpoint(TRUNCATE)');return{schema:result.finalSchemaSha256,protectedCounts:before};}finally{d.close();}}
async function main(){
 assert.equal(process.argv[2],'--apply');assert.equal(process.env.RAILWAY_PROJECT_ID,'49fc9197-07c9-45c7-b528-57d0393c2cca');assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,'666e1624-a1eb-4e94-8e16-5ed73ad4b4af');assert.equal(process.env.RAILWAY_SERVICE_ID,'fda2d2e9-d5ae-47b5-9cc1-42b371eaa4fb');assert.equal(process.env.TRADERLINK_PLATFORM_DB_PATH,live);
 assert.equal(platformMigrationManifest.length,148);assert.deepEqual(platformMigrationManifest.slice(146).map(m=>m.migrationId),expected);assert.deepEqual(platformMigrationManifest.slice(146).map(m=>m.executionOrder),[220,221]);
 const d=open(live);try{assert.equal(readAppliedPlatformMigrations(d).length,146);verifyPlatformMaintenancePreflightStructure(d,prefix);d.pragma('wal_checkpoint(TRUNCATE)');}finally{d.close();}
 assert(!fs.existsSync(checkpoint),'checkpoint exists: inspect, never replay blindly');const capacity=fs.statfsSync('/data'),size=fs.statSync(live).size,free=capacity.bavail*capacity.bsize;assert(free>size*3+2*1024**3,'insufficient backup/restore/recovery capacity');
 fs.mkdirSync(checkpoint,{recursive:true,mode:0o700});save('release-intent.json',{at:new Date().toISOString(),live,backup,restore,predecessor:146,completed:148,migrations:expected,liveBytes:size,freeBytes:free,removalCondition:'Only after healthy final or compatible recovery source/schema/volume verified, hashes recorded, no active handles; exact checkpoint files only. Managed Railway volume backups excluded.'});
 const evidence=await createAndRestoreVerifyPlatformDatabaseBackup({sourcePath:live,backupPath:backup,restoreVerificationPath:restore,verificationManifest:prefix,verifyRecoveryAuthority:r=>{const config=loadAccountIdentityConfiguration(process.env,ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS,DEFAULT_JOURNAL_SOURCE_ACCOUNT_CANONICALIZATION_VERSION);assert(r.hmacKeyVersions.every(v=>v in config.keysBase64));assert(r.sourceAccountCanonicalizationVersions.every(v=>v in ALL_JOURNAL_SOURCE_ACCOUNT_CANONICALIZERS));return{verified:true,...r};}});
 save('backup-evidence.json',evidence);console.log(JSON.stringify({stage:'backup_restore_verified',backupSha256:evidence.backup.fileSha256,restoreSha256:evidence.restored.fileSha256}));
 const rehearsed=advance(restore);save('rehearsal.json',rehearsed);console.log(JSON.stringify({stage:'restored_target_rehearsal_verified',schema:rehearsed.schema,migrationCount:148}));
 const result=advance(live);assert.equal(result.schema,rehearsed.schema);save('completed.json',{at:new Date().toISOString(),migrationCount:148,schema:result.schema,migrations:expected,backupSha256:evidence.backup.fileSha256,restoreSha256:evidence.restored.fileSha256,protectedCounts:result.protectedCounts});
 console.log(JSON.stringify({stage:'production_migrations_verified',migrationCount:148,schema:result.schema,status:'applied'}));
}
main().catch(error=>{console.error(JSON.stringify({stage:'guarded_migration_failed',code:typeof error.code==='string'?error.code:'release_guard_failed',message:String(error.message).slice(0,240)}));process.exitCode=1;});
