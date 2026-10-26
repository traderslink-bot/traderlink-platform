"use strict";
// Isolated synthetic Railway task only. Never invoke from the application.
const fs = require("node:fs"), path = require("node:path"), assert = require("node:assert/strict");
const crypto = require("node:crypto"), cp = require("node:child_process");
const Database = require("better-sqlite3");
const api = require("./synthetic-api.cjs");
const { installMaintenanceSqliteIoPolicy } = require("./maintenance-sqlite-io-policy.cjs");
const root = process.env.SYNTHETIC_SMOKE_ROOT || "/synthetic/rehearsal-20261026-v2";
const smoke = Boolean(process.env.SYNTHETIC_SMOKE_ROOT);
const paths = {source:path.join(root,"source.sqlite"),backup:path.join(root,"backup.sqlite"),restore:path.join(root,"restore.sqlite")};
const prefix = api.platformMigrationManifest.slice(0,146);
const started = Date.now();
const emit = value => console.log(JSON.stringify({at:new Date().toISOString(),syntheticOnly:true,...value}));
const bytes = () => Object.values(paths).flatMap(p=>[p,p+"-wal",p+"-shm"]).reduce((n,p)=>n+(fs.existsSync(p)?fs.statSync(p).size:0),0);
function guard() {
  assert(root.startsWith(smoke?"/tmp/traderlink-synthetic-smoke-":"/synthetic/rehearsal-"));
  assert(!fs.lstatSync(root).isSymbolicLink());
  assert(bytes()<32_000_000_000,"synthetic_storage_budget");
  assert(Date.now()-started<4_200_000,"synthetic_time_budget");
}
function open(p) { const d=new Database(p); api.configurePlatformDatabaseConnection(d,"initializer"); return d; }
function ledger(d) { return d.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order").all(); }
function removeFixtures() {
  for(const p of Object.values(paths)) for(const suffix of ["","-wal","-shm"]) {
    const f=p+suffix;
    if(fs.existsSync(f)) { assert.equal(path.dirname(f),root); assert(fs.lstatSync(f).isFile()); fs.unlinkSync(f); }
  }
  emit({stage:"synthetic_cleanup",databaseFilesAbsent:Object.values(paths).every(p=>["","-wal","-shm"].every(s=>!fs.existsSync(p+s))),retained:"small JSON log only"});
}
function seed() {
  const d=open(paths.source);
  try {
    api.runPlatformMigrations(d,{manifest:prefix});
    d.pragma("max_page_count = 1800000");
    const now=new Date().toISOString(),ids=Array.from({length:smoke?10:200000},()=>crypto.randomUUID());
    // Bulk synthetic fixture generation, not an account-registration load test.
    // Avoid the interactive repository's repeated all-member naming lookup.
    const user=d.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'development_local',?,?,'active',?,?)");
    const userBatch=d.transaction(offset=>{for(let i=offset;i<Math.min(offset+10000,ids.length);i++)user.run(ids[i],"synthetic-"+i,"Synthetic member "+i,now,now);});
    for(let i=0;i<ids.length;i+=10000){userBatch(i);emit({stage:"fixture_users",created:Math.min(i+10000,ids.length)});}
    const event=d.prepare("INSERT INTO platform_watchlist_usage_events VALUES(?,?,?,?)");
    const batchEvents=d.transaction(offset=>{for(let i=offset;i<offset+(smoke?100:10000);i++)event.run(crypto.randomUUID(),ids[(i*7919)%ids.length],1793000000000-i,"2026-10-26");});
    for(let i=0;i<(smoke?100:1000000);i+=(smoke?100:10000))batchEvents(i);
    const article=d.prepare(`INSERT INTO news_articles(id,ticker,slug,headline,article_text,published_at,created_at,updated_at,metadata_json,positives_json,negatives_json,risk_flags_json,diagnostics_json,raw_payload_json,revision,content_sha256) VALUES(?,'SYNTH',?,'Synthetic test article',?,?,?,?, '{}','[]','[]','[]','{}','{}',1,?)`);
    const version=d.prepare(`INSERT INTO news_article_versions(version_id,article_id,revision,ticker,slug,headline,article_text,published_at,created_at,changed_at,metadata_json,positives_json,negatives_json,risk_flags_json,diagnostics_json,raw_payload_json,content_sha256,change_source) VALUES(?,?,1,'SYNTH',?,'Synthetic test article',?,?,?,?, '{}','[]','[]','[]','{}','{}',?,'synthetic_test')`);
    const content="SYNTHETIC DATA ONLY. ".repeat(300),hash=crypto.createHash("sha256").update(content).digest("hex");
    let rows=0;
    const batch=d.transaction(()=>{for(let i=0;i<(smoke?10:1000);i++,rows++){const id="synthetic-article-"+rows;article.run(id,id,content,now,now,now,hash);version.run(crypto.createHash("sha256").update(id).digest("hex"),id,id,content,now,now,now,hash);}});
    const target=smoke?8_000_000:6_850_000_000;
    while(d.pragma("page_count",{simple:true})*4096<target) {
      batch(); d.pragma("wal_checkpoint(TRUNCATE)"); guard();
      if(rows%25000===0)emit({stage:"fixture_progress",articlePairs:rows,bytes:d.pragma("page_count",{simple:true})*4096});
    }
    d.pragma("wal_checkpoint(TRUNCATE)");
    assert.equal(ledger(d).length,146);
    emit({stage:"fixture_ready",users:ids.length,visits:smoke?100:1000000,articlePairs:rows,sourceBytes:fs.statSync(paths.source).size,pageCount:d.pragma("page_count",{simple:true}),geometryOnly:true,productionDistributionNotReplicated:true});
  } finally {d.close();}
}
async function phase(kind) {
  const uninstall=installMaintenanceSqliteIoPolicy(Database,{paths:Object.entries(paths).map(([role,path])=>({role,path})),cacheKiB:kind==="baseline"?16000:262144,emit});
  try {
    if(kind==="baseline") {
      const d=new Database(paths.source,{readonly:true,fileMustExist:true});
      try {d.pragma("foreign_keys=ON");api.verifyCompletedPlatformDatabase(d,prefix);assert.equal(ledger(d).length,146);} finally {d.close();}
      emit({stage:"baseline_result",status:"passed",scope:"one complete source verifier, no copies or migrations"});
    } else {
      guard();
      const space=fs.statfsSync(root);assert(space.bavail*space.bsize>2*fs.statSync(paths.source).size+2_000_000_000,"synthetic_backup_headroom");
      const b=await api.createAndRestoreVerifyPlatformDatabaseBackup({sourcePath:paths.source,backupPath:paths.backup,restoreVerificationPath:paths.restore,verificationManifest:prefix});
      guard();
      const restored=open(paths.restore);let rehearsal;
      try {rehearsal=api.runPlatformMigrations(restored,{manifest:api.platformMigrationManifest});api.verifyCompletedPlatformDatabase(restored);}finally{restored.close();}
      const d=open(paths.source);let applied;
      try {assert.equal(ledger(d).length,146);applied=api.runPlatformMigrations(d,{manifest:api.platformMigrationManifest});assert.equal(ledger(d).length,148);assert.equal(applied.finalSchemaSha256,rehearsal.finalSchemaSha256);d.pragma("wal_checkpoint(TRUNCATE)");}finally{d.close();}
      emit({stage:"tuned_result",status:"passed",backupSha256:b.backup.fileSha256,restoreSha256:b.restored.fileSha256,exactRegistryMatch:b.exactRegistryMatch,exactTableCountsMatch:b.exactTableCountsMatch,backupRestoreFileIdentityMatch:b.backupRestoreFileIdentityMatch,sourceBytes:b.source.fileSizeBytes,predecessor:146,completed:148,applied:applied.appliedMigrationIds,restoreAndSourceSchemaEqual:true,peakRecordedBytes:bytes(),cacheKiB:262144,comparisonCaveat:"baseline first; OS cache is not forcibly evicted; synthetic distribution is not production"});
    }
  } finally {uninstall();}
}
function child(kind,timeout) {
  return new Promise((resolve,reject)=>{
    const t=Date.now();const p=cp.spawn(process.execPath,[__filename,kind],{stdio:["ignore","pipe","pipe"],env:{...process.env,NODE_OPTIONS:"--max-old-space-size=2048"}});
    p.stdout.on("data",b=>process.stdout.write(b));p.stderr.on("data",b=>process.stderr.write(b));
    let timedOut=false;const timer=setTimeout(()=>{timedOut=true;p.kill("SIGKILL");},timeout);
    p.on("error",reject);p.on("close",(code,signal)=>{clearTimeout(timer);emit({stage:"phase_exit",phase:kind,code,signal,timedOut,durationMs:Date.now()-t});if(code===0||kind==="baseline"&&timedOut)resolve();else reject(new Error("synthetic_"+kind+"_failed"));});
  });
}
async function main() {
  assert.equal(api.platformMigrationManifest.length,148);
  assert.deepEqual(api.platformMigrationManifest.slice(146).map(x=>[x.migrationId,x.executionOrder,api.calculatePlatformMigrationChecksum(x)]),[["0183_platform_account_erasure_recovery",220,"4970c600cb3be750271786ac6b1c5b9980aa66b89267eddb02d06bb2481a2337"],["0184_platform_watchlist_usage_user_recent",221,"75be416e265842e61f4ba4a9fb07874a5653f88c8b0263665e98c0e401647f7a"]]);
  if(process.argv[2]) {guard();return phase(process.argv[2]);}
  assert(!fs.existsSync(root),"synthetic_root_already_exists_no_replay");fs.mkdirSync(root,{recursive:true,mode:0o700});
  try {seed();await child("baseline",600000);await child("tuned",3000000);emit({stage:"synthetic_result",status:"passed",durationMs:Date.now()-started,noProductionOrStagingAccess:true});}
  finally {removeFixtures();}
}
main().catch(e=>{emit({stage:"synthetic_result",status:"failed",error:e.message});process.exitCode=1;});
