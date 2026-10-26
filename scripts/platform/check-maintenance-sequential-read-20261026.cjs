"use strict";
const fs=require("node:fs"),path=require("node:path"),os=require("node:os"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const D=require("better-sqlite3"),{installMaintenanceSqliteIoPolicy}=require("./maintenance-sqlite-io-policy.cjs");
const root=fs.mkdtempSync(path.join(os.tmpdir(),"traderlink-sequential-contract-")),file=path.join(root,"fixture.sqlite"),renamed=path.join(root,"renamed.sqlite");
let d,uninstall;const digest=()=>crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
try{
 d=new D(file);d.exec("CREATE TABLE parent(id INTEGER PRIMARY KEY); CREATE TABLE child(id INTEGER REFERENCES parent(id)); INSERT INTO parent VALUES(1); INSERT INTO child VALUES(1);");d.close();d=null;
 const hash=digest(),events=[];
 uninstall=installMaintenanceSqliteIoPolicy(D,{paths:[{path:file,role:"fixture"}],prewarm:true,emit:v=>events.push(v)});
 d=new D(file,{readonly:true});assert.deepEqual(d.pragma("foreign_key_check"),[]);assert.deepEqual(d.pragma("quick_check"),[{quick_check:"ok"}]);assert.equal(events.filter(e=>e.stage==="maintenance_sequential_read"&&e.status==="completed").length,1);assert.equal(events.find(e=>e.stage==="maintenance_sequential_read"&&e.status==="completed").bytes,fs.statSync(file).size);d.close();d=null;uninstall();uninstall=null;assert.equal(digest(),hash);
 const failures=[];uninstall=installMaintenanceSqliteIoPolicy(D,{paths:[{path:file,role:"fixture"}],prewarm:true,emit:v=>failures.push(v)});d=new D(file,{readonly:true});fs.renameSync(file,renamed);assert.deepEqual(d.pragma("foreign_key_check"),[]);assert(failures.some(e=>e.stage==="maintenance_sequential_read"&&e.status==="failed"));d.close();d=null;uninstall();uninstall=null;fs.renameSync(renamed,file);assert.equal(digest(),hash);
 uninstall=installMaintenanceSqliteIoPolicy(D,{paths:[{path:file,role:"fixture"}],prewarm:true,emit:()=>{throw Error("logger_failure");}});d=new D(file,{readonly:true});assert.deepEqual(d.pragma("quick_check"),[{quick_check:"ok"}]);d.close();d=null;uninstall();uninstall=null;assert.equal(digest(),hash);
 d=new D(file);d.pragma("foreign_keys=OFF");d.exec("INSERT INTO child VALUES(2)");d.close();d=null;
 uninstall=installMaintenanceSqliteIoPolicy(D,{paths:[{path:file,role:"fixture"}],prewarm:true});d=new D(file,{readonly:true});assert.equal(d.pragma("foreign_key_check").length,1);d.close();d=null;uninstall();uninstall=null;
 console.log(JSON.stringify({status:"passed",prewarmOncePerConnection:true,exactBytesRead:true,bytesUnchanged:true,advisoryReadFailureDoesNotSkipNativeCheck:true,loggerFailureHarmless:true,invalidForeignKeyPreserved:true}));
}finally{d?.close();uninstall?.();for(const p of [file,renamed])if(fs.existsSync(p))fs.unlinkSync(p);fs.rmdirSync(root);}
