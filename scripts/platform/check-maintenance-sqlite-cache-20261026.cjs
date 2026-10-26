"use strict";
const fs=require('node:fs'),cp=require('node:child_process'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const repo=path.resolve(__dirname,'../..');
const Database=require(repo+'/node_modules/better-sqlite3');
const {installMaintenanceSqliteIoPolicy}=require(repo+'/scripts/platform/maintenance-sqlite-io-policy.cjs');

if(process.argv[2]==='--probe'){
  const file=process.argv[3],cacheKiB=Number(process.argv[4]),events=[];
  const restore=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:'synthetic'}],cacheKiB,emit:e=>{events.push(e);if(e.stage==='maintenance_integrity_check')process.stderr.write(JSON.stringify({probeProgress:e})+'\n');}});
  const d=new Database(file,{readonly:true,fileMustExist:true});
  try{
    d.pragma('foreign_keys=ON');
    const start=performance.now(),foreign=d.pragma('foreign_key_check'),fkMs=performance.now()-start;
    const next=performance.now(),quick=d.pragma('quick_check'),quickMs=performance.now()-next;
    assert.deepEqual(foreign,[]);assert.deepEqual(quick,[{quick_check:'ok'}]);
    assert.equal(events.filter(e=>e.stage==='maintenance_integrity_check'&&e.status==='started').length,2);
    console.log(JSON.stringify({cacheKiB:d.pragma('cache_size',{simple:true}),foreignKeyRows:foreign.length,quickCheck:'ok',foreignKeyMilliseconds:Math.round(fkMs),quickCheckMilliseconds:Math.round(quickMs),sourceRows:200000,simulation:'50us per SQLite fixture pager read, not actual Railway time'}));
  }finally{d.close();restore();}
}else{
  const root=fs.mkdtempSync('/tmp/traderlink-maintenance-cache-'),file=path.join(root,'synthetic.sqlite'),library=path.join(root,'latency.so');
  const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  let d;
  try{
    cp.execFileSync('cc',['-shared','-fPIC','-O2','-Wall','-Wextra','-Werror',path.join(__dirname,'sqlite-synthetic-read-latency-20261026.c'),'-ldl','-o',library],{timeout:20000});
    d=new Database(file);d.pragma('foreign_keys=ON');
    d.exec('CREATE TABLE parent(id TEXT PRIMARY KEY NOT NULL,value TEXT); CREATE TABLE child(id INTEGER PRIMARY KEY,parent_id TEXT NOT NULL REFERENCES parent(id),payload TEXT);');
    const key=i=>String(i).padStart(10,'0')+'-'+ 'x'.repeat(85),parents=d.prepare('INSERT INTO parent VALUES (?,?)'),children=d.prepare('INSERT INTO child VALUES (?,?,?)');
    d.transaction(()=>{for(let i=0;i<200000;i++)parents.run(key(i),'synthetic');for(let i=0;i<200000;i++)children.run(i,key((i*104729)%200000),'fixture');})();
    const defaultCache=d.pragma('cache_size',{simple:true});d.close();d=null;
    const before=sha(file),stat=fs.statSync(file),results=[];
    for(const cache of [16000,262144]){
      const r=cp.spawnSync(process.execPath,[__filename,'--probe',file,String(cache)],{encoding:'utf8',timeout:90000,maxBuffer:1024*1024,env:{PATH:process.env.PATH,LD_PRELOAD:library,TRADERLINK_SQLITE_BENCH_DEVICE:String(stat.dev),TRADERLINK_SQLITE_BENCH_INODE:String(stat.ino)}});
      assert.equal(r.status,0,r.stderr||String(r.error));
      const probe=JSON.parse(r.stdout.trim()),io=JSON.parse(r.stderr.trim().split('\n').find(l=>l.includes('simulatedFixturePagerReads')));
      assert(io.simulatedFixturePagerReads>0,'latency shim did not observe native pager reads');results.push({...probe,...io});
    }
    assert.equal(sha(file),before,'readonly policy modified fixture bytes');
    d=new Database(file);d.pragma('foreign_keys=OFF');d.prepare('INSERT INTO child VALUES (?,?,?)').run(200001,'missing-parent','negative-control');d.close();d=null;
    const invalidHash=sha(file),baseline=new Database(file,{readonly:true});const expected=baseline.pragma('foreign_key_check');assert.equal(expected.length,1);baseline.close();
    const original=Database.prototype.pragma,events=[];
    const restore=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:'synthetic-invalid'}],emit:e=>events.push(e)});
    d=new Database(file,{readonly:true});assert.deepEqual(d.pragma('foreign_key_check'),expected);assert.equal(d.pragma('cache_size',{simple:true}),-262144);d.close();d=null;restore();assert.equal(Database.prototype.pragma,original);
    assert.equal(sha(file),invalidHash);d=new Database(file,{readonly:true});assert.equal(d.pragma('cache_size',{simple:true}),defaultCache);d.close();d=null;
    const stop=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:'logger-failure'}],emit:()=>{throw Error('synthetic log failure');}});
    d=new Database(file,{readonly:true});assert.deepEqual(d.pragma('foreign_key_check'),expected);assert.throws(()=>d.pragma('missing_schema.quick_check'));d.close();d=null;stop();
    d=new Database(':memory:');const memoryDefault=d.pragma('cache_size',{simple:true});d.close();d=null;
    const unknown=installMaintenanceSqliteIoPolicy(Database,{paths:[{path:file,role:'only-owned-fixture'}]});d=new Database(':memory:');assert.equal(d.pragma('cache_size',{simple:true}),memoryDefault);d.close();d=null;unknown();
    assert.throws(()=>installMaintenanceSqliteIoPolicy(Database,{paths:[{path:'relative',role:'bad'}]}));
    assert.throws(()=>installMaintenanceSqliteIoPolicy(Database,{paths:[],cacheKiB:999999}));
    assert.equal(sha(file),invalidHash);
    console.log(JSON.stringify({contractChecks:'passed',checks:['identical FK and quick-check outcomes','bad FK remains visible','SQL errors remain errors','logging failure cannot mask checks','cache setting is connection-only','unknown connection untouched','fixture bytes unchanged','invalid policy rejected'],fixtureBytes:stat.size,results,estimatedPagerReadReductionPercent:Math.round(100*(1-results[1].simulatedFixturePagerReads/results[0].simulatedFixturePagerReads)),notProductionTiming:true}));
  }finally{
    if(d?.open)d.close();
    for(const p of [file+'-wal',file+'-shm',file+'-journal',file,library])if(fs.existsSync(p)){assert.equal(path.dirname(p),root);assert(!fs.lstatSync(p).isSymbolicLink());fs.unlinkSync(p);}
    fs.rmdirSync(root);
  }
}
