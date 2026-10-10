// Read immutable Git sources; execute only migration SQL in disposable in-memory SQLite.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../..');
const manifestPath = 'src/modules/platform/server/database/platform-migration-manifest.ts';
const production = process.argv[2] || 'ba5e4a3b54520908d1ea6c33f0c667f904fd4c13';
const staging = process.argv[3] || 'd4cc8b7ed6f60609b4fafbbfcb1fa82f8fb214d6';
const candidate = process.argv[4] || 'e84318dd6';
for (const ref of [production,staging,candidate]) assert.match(ref,/^[a-f0-9]{7,40}$/);
function loader(ref) {
 const cache = new Map();
 function load(file) {
  if(cache.has(file)) return cache.get(file);
  const source = execFileSync('git',['show',`${ref}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
  const exports = {}; cache.set(file,exports);
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(compiled,{exports,require(id){
   if(id.startsWith('node:')) return require(id);
   if(!id.startsWith('.')&&!id.startsWith('@/')) throw new Error(`Unexpected migration dependency: ${id}`);
   const resolved=id.startsWith('@/')?id.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),id));
   return load(resolved.endsWith('.ts')?resolved:`${resolved}.ts`);
  }},{filename:`${ref}:${file}`});
  return exports;
 }
 return load;
}
const sources=[production,staging,candidate].map(ref=>({ref,load:loader(ref)}));
const manifests=sources.map(source=>source.load(manifestPath).platformMigrationManifest);
const contract=sources[0].load('src/modules/platform/server/database/platform-migration-contract.ts');
const byId=new Map(), orderConflicts=[];
for(const [sourceIndex,manifest] of manifests.entries()) for(const migration of manifest){
 // The feature checkout intentionally predates later production ordering.
 // Never replace integrated history with its old manifest; append reserved additions only.
 if(sourceIndex===2&&!/^016[012]_|^0159_/.test(migration.migrationId))continue;
 const prior=byId.get(migration.migrationId);
 if(prior){
  assert.equal(contract.calculatePlatformMigrationChecksum(prior),contract.calculatePlatformMigrationChecksum(migration),`Changed historical migration ${migration.migrationId}`);
  if(prior.executionOrder!==migration.executionOrder)orderConflicts.push({id:migration.migrationId,productionOrder:prior.executionOrder,stagingOrder:migration.executionOrder});
  // Staging SQL checks preserve the staging lineage. Conflicts remain explicit failures
  // for production-ledger compatibility, never silently rewritten history.
  if(sourceIndex===1)byId.set(migration.migrationId,migration);
 } else byId.set(migration.migrationId,migration);
}
const integrated=[...byId.values()].sort((a,b)=>a.executionOrder-b.executionOrder);
contract.validatePlatformMigrationManifest(integrated);
function apply(db,migrations){for(const migration of migrations)db.transaction(()=>{for(const statement of migration.statements)db.exec(statement);})()}
const results=[];
for(let index=0;index<2;index++){
 const db=new Database(':memory:');db.pragma('foreign_keys=ON');
 try{
  apply(db,manifests[index]);
  const applied=new Set(manifests[index].map(item=>item.migrationId));
  apply(db,integrated.filter(item=>!applied.has(item.migrationId)));
  assert.equal(db.pragma('quick_check',{simple:true}),'ok');assert.equal(db.pragma('foreign_key_check').length,0);
  results.push({base:sources[index].ref,baseCount:applied.size,finalCount:integrated.length,tables:db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get().n});
 }finally{db.close()}
}
const fresh=new Database(':memory:');try{fresh.pragma('foreign_keys=ON');apply(fresh,integrated);assert.equal(fresh.pragma('quick_check',{simple:true}),'ok');assert.equal(fresh.pragma('foreign_key_check').length,0)}finally{fresh.close()}
console.log(JSON.stringify({ok:orderConflicts.length===0,candidate,immutableSql:true,orderConflicts,emptySchemaSqlUpgrade:results,freshSqlInitialization:true,limitations:['SQL compatibility does not prove applied migration-ledger compatibility.','Synthetic empty schemas only; representative rows and hosted backup/restore remain separate gates.']}));
if(orderConflicts.length)process.exitCode=1;
