// Runs only in disposable, network-disabled CI container; never production.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const {createRequire}=require('node:module');
const crypto=require('node:crypto');
const Database=createRequire('/app/server.js')('better-sqlite3');
const source=fs.readFileSync('/tmp/integrity-source.ts','utf8');
const marker='const PLATFORM_RUNTIME_QUICK_CHECK_WORKER_SOURCE = String.raw`';
const start=source.indexOf(marker);assert(start>=0);
const end=source.indexOf('\n`;',start+marker.length);assert(end>start);
const childSource=source.slice(start+marker.length,end);
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'integrity-native-'));
async function scan(name,broken,includeQuickCheck){
 const file=path.join(dir,name+'.sqlite');const db=new Database(file);
 db.pragma('journal_mode=WAL');
 db.exec('CREATE TABLE p(id INTEGER PRIMARY KEY); CREATE TABLE c(pid INTEGER REFERENCES p(id)); INSERT INTO p VALUES(1)');
 if(broken){db.pragma('foreign_keys=OFF');db.exec('INSERT INTO c VALUES(2)');}
 else db.exec('INSERT INTO c VALUES(1)');
 db.close();
 if(broken==='corrupt')fs.writeFileSync(file,Buffer.alloc(8192,65));
 const digest=()=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
 const before=digest();
 const messages=[];
 await new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['-e',childSource],{cwd:'/app',env:{...process.env,NODE_OPTIONS:''},stdio:['ignore','ignore','pipe','ipc']});
  const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('child smoke timeout'));},10000);
  child.on('message',m=>messages.push(m));child.on('error',reject);
  child.on('exit',(code,signal)=>{clearTimeout(timer);try{assert.equal(code,0);assert.equal(signal,null);resolve();}catch(e){reject(e);}});
  child.send({databasePath:file,dataGeneration:1,generation:1,includeQuickCheck});
 });
 const result=messages.find(m=>m.kind==='result');assert(result);
 assert.equal(result.status,broken==='corrupt'?'integrity_failed':broken?'foreign_key_failed':'ok');
 assert.equal(messages.filter(m=>m.kind==='foreign_key_complete').length,!broken&&includeQuickCheck?1:0);
 assert.equal(digest(),before);
 if(broken!=='corrupt'){const verify=new Database(file,{readonly:true});assert.equal(verify.prepare('SELECT COUNT(*) n FROM c').get().n,1);verify.close();}
 console.log(JSON.stringify({case:name,status:result.status,actualExit:true}));
}
async function termination(stopped){await new Promise((resolve,reject)=>{
 const child=spawn(process.execPath,['-e',childSource],{cwd:'/app',stdio:['ignore','ignore','ignore','ipc']});
 const timer=setTimeout(()=>{child.kill('SIGKILL');reject(new Error('termination timeout'));},5000);
 child.once('spawn',()=>{if(stopped)child.kill('SIGSTOP');child.kill('SIGTERM');if(stopped)setTimeout(()=>child.kill('SIGKILL'),100);});
 child.once('error',reject);child.once('exit',(code,signal)=>{clearTimeout(timer);try{assert.equal(code,null);assert(['SIGTERM','SIGKILL'].includes(signal));resolve();}catch(e){reject(e);}});
 });console.log(JSON.stringify({termination:stopped?'escalated':'normal',actualExit:true}));}
(async()=>{try{await scan('combined',false,true);await scan('fk-only',false,false);await scan('fk-invalid',true,true);await scan('corrupt', 'corrupt',true);await termination(false);await termination(true);console.log('NATIVE_CHILD_SMOKE_PASS');}finally{fs.rmSync(dir,{recursive:true,force:true});}})().catch(e=>{console.error(e);process.exitCode=1;});
