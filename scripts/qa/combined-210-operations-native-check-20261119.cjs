'use strict';
// NEW operations entry compile + native backup/data-preservation contract checks.
// No existing acceptance suites, hosted targets, real sessions or trust keys.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const a=require('node:assert/strict'),{createRequire,Module}=require('node:module'),crypto=require('node:crypto');
const own=path.resolve(__dirname,'../..'),source='/home/traderlink/projects/community-tonight-combined-20261119';
const ref='79d49fced8a82a1e072bffddc106199c6b616c9a',tree='5d3a7d0681cb6fb8034ed610b68ec8466d8f0e47';
const donor='/home/traderlink/projects/community-combined-production-review-20261117',use=createRequire(donor+'/package.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
async function main(){a(!process.env.TRADERLINK_PLATFORM_DB_PATH&&!process.env.NODE_OPTIONS&&!process.env.NODE_PATH);
  a.equal(use('better-sqlite3/package.json').version,'12.9.0');
  const git=args=>cp.execFileSync('/usr/bin/git',['-C',source,...args],{timeout:15000,maxBuffer:16000000});
  a.equal(git(['rev-parse',ref+'^{tree}']).toString().trim(),tree);
  const names=new Set(git(['ls-tree','-r','--name-only',ref]).toString().trim().split('\n')),pins=new Map(),ops=new Map();
  const control=own+'/scripts/platform/combined-210-control-20261119.cjs';
  const esbuild=use('esbuild');
  const built=await esbuild.build({stdin:{contents:`exports.verification=require('${own}/scripts/platform/combined-210-native-verification-20261119.cjs');
    exports.readonly=require('${own}/scripts/platform/combined-210-readonly-verifier-20261119.cjs');
    exports.offline=require('${own}/scripts/platform/combined-210-offline-runner-20261119.cjs');
    exports.setup=require('${own}/scripts/platform/combined-210-native-profile-setup-20261119.cjs');
    exports.backup=require('./src/modules/platform/server/database/platform-database-backup.ts');`,resolveDir:source,loader:'js',sourcefile:'new210-ops-check.cjs'},
    absWorkingDir:source,bundle:true,write:false,platform:'node',format:'cjs',target:'node24',conditions:['react-server'],external:['better-sqlite3'],
    nodePaths:[donor+'/node_modules'],logLevel:'silent',metafile:true,
    define:{'import.meta.url':'__new210_config_url'},banner:{js:'const __new210_config_url=require("node:url").pathToFileURL("/app/src/modules/platform/server/database/platform-database-config.ts").href;'},
    plugins:[{name:'exact-current210-plus-owned-operations',setup(build){
      build.onResolve({filter:/combined-210-control-20261119\.cjs$/},()=>({path:control,external:true}));
      build.onResolve({filter:/^server-only$/},()=>({path:require.resolve('next/dist/compiled/server-only/empty.js')}));
      build.onResolve({filter:/^@\/|^\./},args=>{
        if(args.resolveDir.includes('/node_modules/'))return;
        let stem=args.path.startsWith('@/')?args.path.slice(2):path.relative(source,path.resolve(args.resolveDir,args.path));
        if(args.importer.startsWith(own+'/scripts/platform/')&&args.path.startsWith('../../src/'))stem=args.path.slice(6);
        for(const ext of ['','.ts','.tsx','.js','.cjs','.json','/index.ts'])if(names.has(stem+ext))return {path:path.join(source,stem+ext)};
      });
      build.onLoad({filter:/\.[cm]?[jt]sx?$|\.json$/},args=>{if(args.path.includes('/node_modules/'))return;
        if(args.path.startsWith(own+'/scripts/platform/')){const raw=fs.readFileSync(args.path);ops.set(args.path,hash(raw));return{contents:raw.toString(),loader:'js'};}
        a(args.path.startsWith(source+'/'));const rel=path.relative(source,args.path);a(names.has(rel));const raw=git(['cat-file','blob',ref+':'+rel]);pins.set(rel,hash(raw));
        return {contents:raw.toString(),loader:rel.endsWith('.json')?'json':rel.endsWith('.tsx')?'tsx':rel.endsWith('.ts')?'ts':'js'};
      });
    }}]});
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'tl210-ops-native-'));fs.chmodSync(temp,0o700);
  const m=new Module(own+'/scripts/platform/__ops210check.cjs');m.filename=own+'/scripts/platform/__ops210check.cjs';m.paths=[donor+'/node_modules',...Module._nodeModulePaths(own)];
  m._compile(built.outputFiles[0].text,m.filename);const api=m.exports,v=api.verification,x=v.api();
  const cases=[];let db=null;
  try{
    for(const name of ['verifyStructure','verifyRuntimePolicyArtifacts','qualifyRuntimePolicyAfterSetup'])a.equal(typeof api.readonly[name],'function');
    for(const name of ['prepareOfflineTarget','verifyInstalledTarget','verifyRecoveredOriginal'])a.equal(typeof api.offline[name],'function');
    a.equal(typeof api.setup.runNativeProfileSetup,'function');cases.push('all exact-current210 native operations entries compile and export actual required functions');
    db=new x.Database(temp+'/source.sqlite');x.configurePlatformDatabaseConnection(db,'initializer');
    x.runPlatformMigrations(db,{manifest:x.platformMigrationManifest.slice(0,182)});
    const native=db.prepare('SELECT sqlite_version() version,sqlite_source_id() sourceId').get();a.equal(native.version,'3.53.0');
    const baseline=v.dataSnapshot(db);const ledger=x.readAppliedPlatformMigrations(db);db.pragma('wal_checkpoint(TRUNCATE)');db.close();db=null;
    const backup=await api.backup.createAndRestoreVerifyPlatformDatabaseBackup({sourcePath:temp+'/source.sqlite',backupPath:temp+'/original.sqlite',
      restoreVerificationPath:temp+'/offline.sqlite',verificationManifest:x.platformMigrationManifest.slice(0,182)});
    a(backup.exactRegistryMatch&&backup.backupRestoreFileIdentityMatch);
    for(const file of ['source','original','offline'])v.verifyFullFile({databasePath:temp+'/'+file+'.sqlite',count:182,
      expectedSchemaSha256:'9de32e9030284aeeafc2d8a10dcecfff3d800dabdfecef02fa8598d33113dda9',originalLedger:ledger,originalData:baseline});
    cases.push('actual canonical native full original backup and full restored copy independently preserve182 ledger and typed original data');
    db=v.open(temp+'/offline.sqlite',false);db.pragma('journal_mode=DELETE');db.pragma('temp_store=FILE');db.pragma('cache_spill=ON');
    db.pragma('cache_size=-32768');db.pragma('max_page_count=100000');const phase=[];
    const result=x.runPlatformMigrations(db,{beforeMigrationBoundary:p=>phase.push(p)});a.equal(result.appliedMigrationIds.length,28);
    a.equal(result.finalSchemaSha256,'9124f4989232f8b9a6a2dcf393fb9adde7a480023f0de5097545aa553e80ab89');
    a.equal(phase.length,84);a.equal(db.pragma('foreign_keys',{simple:true}),1);a.deepEqual(v.dataSnapshot(db,baseline),baseline);
    a.deepEqual(x.readAppliedPlatformMigrations(db).slice(0,182),ledger);db.close();db=null;
    db=v.open(temp+'/offline.sqlite',false);db.pragma('max_page_count=100000');db.pragma('journal_mode=WAL');db.pragma('wal_checkpoint(TRUNCATE)');db.close();db=null;
    const proof=v.verifyFullFile({databasePath:temp+'/offline.sqlite',count:210,expectedSchemaSha256:result.finalSchemaSha256,originalLedger:ledger,originalData:baseline});
    a.equal(api.readonly.verifyStructure({databasePath:temp+'/offline.sqlite',expectedSchemaSha256:result.finalSchemaSha256}).count,210);
    a.equal(proof.foreignKeys,'ok');a.equal(proof.quickCheck,'ok');
    cases.push('actual default28 per-migration offline path honors FK toggle, full210schema and original typed data with only declared disabled-principal addition');
    a.throws(()=>api.readonly.verifyRuntimePolicyArtifacts({databasePath:temp+'/offline.sqlite',schemaSha256:result.finalSchemaSha256}));
    a.throws(()=>api.setup.runNativeProfileSetup({protocolRoot:temp,runId:'fixture',request:new Request('https://fixture.invalid',{method:'POST'})}));
    cases.push('missing genuine private runtime receipt and missing write barrier refuse native qualification/setup without granting approval');
    const output={kind:'NEW210_OPERATIONS_ENTRY_NATIVE_PRIMITIVES_NOT_PRODUCTION_ORCHESTRATOR_EXECUTION',source:ref,tree,native,cases,
      sourcePins:[...pins].sort().map(([path,sha256])=>({path,sha256})),operationPins:[...ops].sort().map(([path,sha256])=>({path,sha256})),
      bundleSha256:hash(built.outputFiles[0].contents),hostedOrProductionSecretsOrEffects:false,allNativeHandlesClosed:true};
    const outputPath=process.argv[2];a(outputPath);fs.writeFileSync(outputPath,JSON.stringify(output,null,2)+'\n',{flag:'wx',mode:0o600});
    process.stdout.write(JSON.stringify({cases:cases.length,native,sourceInputs:pins.size,operationInputs:ops.size,evidenceSha256:hash(fs.readFileSync(outputPath))})+'\n');
  }finally{db?.close();esbuild.stop();fs.rmSync(temp,{recursive:true,force:false});}
}
if(require.main===module)main().catch(error=>{process.stderr.write(error.stack+'\n');process.exitCode=1;});
module.exports={main};
