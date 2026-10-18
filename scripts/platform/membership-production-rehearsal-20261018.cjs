const assert=require('node:assert/strict');
const cp=require('node:child_process');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const APP='b121be0ffb2ee7da92ce6caa930cb909c4729186';
const BASE='2c4621771a0d9deeaa607be0aa9654af189fa6cc';
const ALLOW=['.github/workflows/membership-production-validation-20261018.yml','scripts/platform/membership-production-rehearsal-20261018.cjs'];
const git=(...args)=>cp.execFileSync('git',args,{encoding:'utf8',maxBuffer:16*1024*1024}).trim();
assert.equal(git('rev-parse','HEAD^'),APP,'CI carrier must be a direct child of exact app candidate');
assert.deepEqual(git('diff','--name-only',APP,'HEAD').split('\n').sort(),ALLOW.slice().sort());
if(process.argv.includes('--verify-carrier-only')){console.log(JSON.stringify({carrier:git('rev-parse','HEAD'),appCandidate:APP,onlyFiles:ALLOW}));process.exit(0);}
const digest=rows=>crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex');
async function main(){
  const root=process.cwd();
  const manifestFile='src/modules/platform/server/database/platform-migration-manifest.ts';
  const generated=path.join(root,'src/modules/platform/server/database/__production_prefix_manifest_20261018.ts');
  const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'membership-production-rehearsal-'));
  const fixture=path.join(temporary,'fixture.sqlite'),backup=path.join(temporary,'restore.sqlite');
  let db,restore;
  try{
    fs.writeFileSync(generated,cp.execFileSync('git',['show',`${BASE}:${manifestFile}`]));
    const load=async file=>{const ns=await import(pathToFileURL(file).href);return ns.default&&typeof ns.default==='object'?{...ns.default,...ns}:ns;};
    const baseline=await load(generated);
    const candidate=await load(path.join(root,manifestFile));
    const contract=await load(path.join(root,'src/modules/platform/server/database/platform-migration-contract.ts'));
    const runner=await load(path.join(root,'src/modules/platform/server/database/run-platform-migrations.ts'));
    const oldManifest=baseline.platformMigrationManifest,newManifest=candidate.platformMigrationManifest;
    assert.equal(oldManifest.length,140);assert.equal(newManifest.length,144);
    const describe=m=>({migration_id:m.migrationId,execution_order:m.executionOrder,checksum_sha256:contract.calculatePlatformMigrationChecksum(m)});
    assert.deepEqual(newManifest.slice(0,140).map(describe),oldManifest.map(describe),'Exact production source prefix changed');
    for(const entry of baseline.platformMigrationFileEntries){assert.equal(git('rev-parse',`${BASE}:${entry.sourcePath}`),git('rev-parse',`${APP}:${entry.sourcePath}`),`Historical migration source changed: ${entry.sourcePath}`);}
    const Database=require('better-sqlite3');
    db=new Database(fixture);db.pragma('foreign_keys=ON');
    const initial=runner.runPlatformMigrations(db,{manifest:oldManifest});
    runner.verifyCompletedPlatformDatabase(db,oldManifest);
    const tables=db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r=>r.name);
    const before=Object.fromEntries(tables.map(n=>[n,digest(db.prepare(`SELECT * FROM "${n}"`).all())]));
    await db.backup(backup);
    restore=new Database(backup);restore.pragma('foreign_keys=ON');
    runner.verifyCompletedPlatformDatabase(restore,oldManifest);
    for(const n of tables)assert.equal(digest(restore.prepare(`SELECT * FROM "${n}"`).all()),before[n],`Restore mismatch ${n}`);
    restore.close();restore=null;
    const result=runner.runPlatformMigrations(db,{manifest:newManifest});
    assert.deepEqual(result.appliedMigrationIds,newManifest.slice(140).map(m=>m.migrationId));
    runner.verifyCompletedPlatformDatabase(db,newManifest);
    for(const n of tables.filter(n=>n!=='platform_schema_migrations'))assert.equal(digest(db.prepare(`SELECT * FROM "${n}"`).all()),before[n],`Existing fixture rows changed ${n}`);
    assert.equal(db.pragma('quick_check',{simple:true}),'ok');assert.equal(db.pragma('foreign_key_check').length,0);
    const proof={appCandidate:APP,productionSourceParent:BASE,ciCarrier:git('rev-parse','HEAD'),sourcePrefix:oldManifest.map(describe),targetTail:newManifest.slice(140).map(describe),baselineSchema:initial.finalSchemaSha256,targetSchema:result.finalSchemaSha256,restoreVerified:true,fixtureExistingRowsPreserved:true,quickCheck:'ok',foreignKeyErrors:0,proofBoundary:'Disposable source-defined schema fixture only. Does not contain current production users. Live ledger and all-current-user access comparison remain separate Coordinator gates.'};
    fs.writeFileSync(path.join(root,'membership-production-proof.json'),JSON.stringify(proof,null,2));
    console.log(JSON.stringify({...proof,sourcePrefixCount:proof.sourcePrefix.length,sourcePrefix:undefined},null,2));
  }finally{
    if(restore)restore.close();if(db)db.close();
    if(fs.existsSync(generated))fs.unlinkSync(generated);
    fs.rmSync(temporary,{recursive:true,force:true});
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
