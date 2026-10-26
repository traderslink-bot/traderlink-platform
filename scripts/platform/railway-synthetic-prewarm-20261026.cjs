"use strict";
// Synthetic-only follow-up. Reuses the already-verified backup inode; no app code changes.
const fs=require("node:fs"),crypto=require("node:crypto"),assert=require("node:assert/strict");
const Database=require("/app/node_modules/better-sqlite3"),api=require("/app/synthetic-api.cjs");
const {installMaintenanceSqliteIoPolicy}=require("/app/maintenance-sqlite-io-policy.cjs");
assert.equal(process.env.RAILWAY_PROJECT_ID,"899ca8a4-3375-4e45-913c-0c2f505a8ebc");
assert.equal(process.env.RAILWAY_SERVICE_ID,"af6b8411-99d2-4062-baba-4cee187ad0e7");
const file="/synthetic/rehearsal-20261026-v2/prewarm-source.sqlite";
assert.equal(process.argv[2]?.length,64,"expected_verified_backup_sha_required");
const expected=process.argv[2],initial=fs.lstatSync(file);assert(initial.isFile()&&!initial.isSymbolicLink());assert.equal(initial.size,6858096640);
const emit=value=>console.log(JSON.stringify({at:new Date().toISOString(),syntheticOnly:true,...value}));
function hashSequential(){const fd=fs.openSync(file,"r"),buffer=Buffer.alloc(1024*1024),hash=crypto.createHash("sha256");try{for(;;){const n=fs.readSync(fd,buffer,0,buffer.length,null);if(n===0)break;hash.update(buffer.subarray(0,n));}return hash.digest("hex");}finally{fs.closeSync(fd);}}
const start=performance.now();emit({stage:"synthetic_prewarm",status:"started",sourceBytes:initial.size});
const hash=hashSequential();assert.equal(hash,expected);const sequentialMs=Math.round(performance.now()-start);emit({stage:"synthetic_prewarm",status:"completed",durationMs:sequentialMs,fileSha256:hash});
const uninstall=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:"synthetic_prewarmed"}],cacheKiB:262144,emit});
let db;
try {
 db=new Database(file,{readonly:true,fileMustExist:true});db.pragma("foreign_keys=ON");db.pragma("busy_timeout=5000");
 const manifest=api.platformMigrationManifest.slice(0,146);
 const before=db.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order").all();assert.equal(before.length,146);
 const verifyStart=performance.now();api.verifyCompletedPlatformDatabase(db,manifest);const verifierMs=Math.round(performance.now()-verifyStart);
 assert.deepEqual(db.prepare("SELECT migration_id,module_namespace,execution_order,checksum_sha256 FROM platform_schema_migrations ORDER BY execution_order").all(),before);
 db.close();db=null;assert.equal(hashSequential(),expected);const after=fs.lstatSync(file);assert.equal(after.dev,initial.dev);assert.equal(after.ino,initial.ino);assert.equal(after.size,initial.size);assert.equal(after.mtimeMs,initial.mtimeMs);
 emit({stage:"synthetic_prewarm_result",status:"passed",sequentialMs,verifierMs,totalMs:Math.round(performance.now()-start),fileSha256:expected,exact146LedgerUnchanged:true,bytesUnchanged:true,noChecksSkipped:true,caveat:"Already-used synthetic backup, not cold-cache controlled production timing; no cache eviction or persistent setting change"});
}finally{
 db?.close();uninstall();
 const final=fs.lstatSync(file);assert.equal(final.ino,initial.ino);assert.equal(final.dev,initial.dev);
 for(const suffix of ["","-wal","-shm","-journal"]){const target=file+suffix;if(fs.existsSync(target)){assert(fs.lstatSync(target).isFile());fs.unlinkSync(target);}}
 emit({stage:"synthetic_prewarm_cleanup",databaseFilesAbsent:["","-wal","-shm","-journal"].every(s=>!fs.existsSync(file+s))});
}
