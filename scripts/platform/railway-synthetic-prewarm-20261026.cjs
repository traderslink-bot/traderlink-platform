"use strict";
// Synthetic-only follow-up after the original task has stopped. No app code changes.
const fs=require("node:fs"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const Database=require("/app/node_modules/better-sqlite3"),api=require("/app/synthetic-api.cjs");
const {installMaintenanceSqliteIoPolicy}=require("/app/maintenance-sqlite-io-policy.cjs");
assert.equal(process.env.RAILWAY_PROJECT_ID,"899ca8a4-3375-4e45-913c-0c2f505a8ebc");
assert.equal(process.env.RAILWAY_SERVICE_ID,"af6b8411-99d2-4062-baba-4cee187ad0e7");
assert.equal(process.env.RAILWAY_ENVIRONMENT_ID,"9636ddc6-4fa9-4ba7-890f-c357cac220e5");
const file="/synthetic/rehearsal-20261026-v2/source.sqlite",restoredFile="/synthetic/rehearsal-20261026-v2/restore.sqlite";
const initial=fs.lstatSync(file);assert(initial.isFile()&&!initial.isSymbolicLink());assert(initial.size>=6858096640&&initial.size<7500000000);
const emit=value=>console.log(JSON.stringify({at:new Date().toISOString(),syntheticOnly:true,...value}));
function hashSequential(target){const fd=fs.openSync(target,"r"),buffer=Buffer.alloc(1024*1024),hash=crypto.createHash("sha256");try{for(;;){const n=fs.readSync(fd,buffer,0,buffer.length,null);if(n===0)break;hash.update(buffer.subarray(0,n));}return hash.digest("hex");}finally{fs.closeSync(fd);}}
function hashes(){return Object.fromEntries([file,file+"-wal"].filter(p=>fs.existsSync(p)).map(p=>[p,hashSequential(p)]));}
function ledger(d){return d.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256,post_schema_sha256 FROM platform_schema_migrations ORDER BY execution_order").all();}
function counts(d){return Object.fromEntries(d.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(({name})=>[name,d.prepare('SELECT COUNT(*) n FROM "'+name.replaceAll('"','""')+'"').get().n]));}
const start=performance.now();emit({stage:"synthetic_prewarm",status:"started",sourceBytes:initial.size});
const beforeHashes=hashes();const sequentialMs=Math.round(performance.now()-start);emit({stage:"synthetic_prewarm",status:"completed",durationMs:sequentialMs,hashes:beforeHashes});
const uninstall=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:"synthetic_prewarmed"}],cacheKiB:262144,emit});
let db;
try {
 db=new Database(file,{readonly:true,fileMustExist:true});db.pragma("foreign_keys=ON");db.pragma("busy_timeout=5000");
 const manifest=api.platformMigrationManifest;assert.equal(manifest.length,148);
 const before=ledger(db);assert.equal(before.length,148);assert.deepEqual(before.slice(-2).map(r=>r.migration_id),["0183_platform_account_erasure_recovery","0184_platform_watchlist_usage_user_recent"]);
 const verifyStart=performance.now();const verified=api.verifyCompletedPlatformDatabase(db,manifest);const verifierMs=Math.round(performance.now()-verifyStart);
 assert.deepEqual(ledger(db),before);const sourceCounts=counts(db);
 const restored=new Database(restoredFile,{readonly:true,fileMustExist:true});try{assert.deepEqual(ledger(restored),before);assert.deepEqual(counts(restored),sourceCounts);assert.equal(ledger(restored).at(-1).post_schema_sha256,verified.finalSchemaSha256);}finally{restored.close();}
 db.close();db=null;assert.deepEqual(hashes(),beforeHashes);const after=fs.lstatSync(file);assert.equal(after.dev,initial.dev);assert.equal(after.ino,initial.ino);assert.equal(after.size,initial.size);assert.equal(after.mtimeMs,initial.mtimeMs);
 emit({stage:"synthetic_prewarm_result",status:"passed",sequentialMs,verifierMs,totalMs:Math.round(performance.now()-start),hashes:beforeHashes,exact148LedgerUnchanged:true,restoreLedgerSchemaAndCountsMatched:true,bytesUnchanged:true,noChecksSkipped:true,caveat:"One synthetic follow-up after a stopped cold-cache trial; not a controlled production forecast. No cache eviction or persistent setting change"});
}finally{
 db?.close();uninstall();
 const final=fs.lstatSync(file);assert.equal(final.ino,initial.ino);assert.equal(final.dev,initial.dev);
 for(const suffix of ["","-wal","-shm","-journal"]){const target=file+suffix;if(fs.existsSync(target)){assert(fs.lstatSync(target).isFile());fs.unlinkSync(target);}}
 emit({stage:"synthetic_prewarm_cleanup",databaseFilesAbsent:["","-wal","-shm","-journal"].every(s=>!fs.existsSync(file+s))});
}
