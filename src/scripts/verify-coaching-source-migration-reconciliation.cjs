// Offline source reconciliation only. Never opens a hosted or file-backed database.
// A successful audit is not release approval; the runtime manifest is not modified.
const assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const Database = require('better-sqlite3');
const root = path.resolve(__dirname, '../..');
const manifestPath = 'src/modules/platform/server/database/platform-migration-manifest.ts';
const refs = {
 production: process.argv[2],
 staging: process.argv[3],
 candidate: process.argv[4],
};
if (process.argv.length !== 5 || Object.values(refs).some(ref => !/^[a-f0-9]{40}$/.test(ref || ''))) {
 console.error('Usage: node src/scripts/verify-coaching-source-migration-reconciliation.cjs <production SHA> <staging SHA> <candidate SHA>');
 process.exit(2);
}
function loader(ref) {
 const cache = new Map();
 function load(file) {
  if(cache.has(file)) return cache.get(file);
  const source = execFileSync('git',['show',`${ref}:${file}`],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024});
  const exports = {}; cache.set(file,exports);
  const compiled = ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  vm.runInNewContext(compiled,{exports,require(id){
   if(id === 'node:crypto') return require(id);
   if(!id.startsWith('.')&&!id.startsWith('@/')) throw new Error(`Unexpected migration dependency: ${id}`);
   const resolved=id.startsWith('@/')?id.slice(2):path.posix.normalize(path.posix.join(path.posix.dirname(file),id));
   return load(resolved.endsWith('.ts')?resolved:`${resolved}.ts`);
  }},{filename:`${ref}:${file}`});
  return exports;
 }
 return load;
}


const prodLoad=loader(refs.production),candidateLoad=loader(refs.candidate);
const productionManifest=prodLoad(manifestPath).platformMigrationManifest;
const candidateManifest=candidateLoad(manifestPath).platformMigrationManifest;
const stagingManifest=loader(refs.staging)(manifestPath).platformMigrationManifest;
const contract=prodLoad('src/modules/platform/server/database/platform-migration-contract.ts');
const registry=prodLoad('src/modules/platform/server/database/platform-migration-registry.ts');
function metadata(manifest) {
 return manifest.map(m => ({id:m.migrationId,order:m.executionOrder,checksum:contract.calculatePlatformMigrationChecksum(m)}));
}
function compare(base,target) {
 const a = new Map(metadata(base).map(m => [m.id,m]));
 const b = new Map(metadata(target).map(m => [m.id,m]));
 return {
  missingFromTarget:[...a.keys()].filter(id => !b.has(id)),
  addedInTarget:[...b.keys()].filter(id => !a.has(id)),
  orderConflicts:[...a.values()].filter(m => b.has(m.id) && b.get(m.id).order !== m.order).map(m => ({id:m.id,baseOrder:m.order,targetOrder:b.get(m.id).order})),
  checksumConflicts:[...a.values()].filter(m => b.has(m.id) && b.get(m.id).checksum !== m.checksum).map(m => m.id),
 };
}
const sourceComparison = {
 productionToCandidate:compare(productionManifest,candidateManifest),
 stagingToCandidate:compare(stagingManifest,candidateManifest),
};
assert.equal(sourceComparison.productionToCandidate.missingFromTarget.length,0,'Candidate must retain every production migration');
assert.equal(sourceComparison.productionToCandidate.checksumConflicts.length,0,'Historical production SQL must not change');
const prodIds=new Set(productionManifest.map(m=>m.migrationId)),lastOrder=Math.max(...productionManifest.map(m=>m.executionOrder));
const additions=candidateManifest.filter(m=>!prodIds.has(m.migrationId)).map((m,i)=>({...m,executionOrder:lastOrder+i+1}));
const proposed=contract.validatePlatformMigrationManifest([...productionManifest,...additions]);
const rows=productionManifest.map(m=>({migration_id:m.migrationId,module_namespace:m.moduleNamespace,execution_order:m.executionOrder,checksum_sha256:contract.calculatePlatformMigrationChecksum(m),post_schema_sha256:'a'.repeat(64),applied_at_utc:'2026-10-15T00:00:00.000Z',sqlite_version:'synthetic-source-metadata'}));
registry.validateAppliedPlatformMigrationPrefix(rows,proposed);
for(let i=0;i<productionManifest.length;i++)assert.deepEqual(proposed[i],productionManifest[i],'Production prefix must be identical');
const candidateMetadata=metadata(candidateManifest);
const rawProductionPrefixMatches=metadata(productionManifest).every((m,i)=>candidateMetadata[i]?.id===m.id&&candidateMetadata[i]?.order===m.order&&candidateMetadata[i]?.checksum===m.checksum);
let unreconciledRejected=false;try{registry.validateAppliedPlatformMigrationPrefix(rows,candidateManifest)}catch(e){assert.equal(e.code,'TRADERLINK_MIGRATION_ORDER_CONFLICT');unreconciledRejected=true;}assert.equal(unreconciledRejected,!rawProductionPrefixMatches,'Raw prefix validation must agree with complete ordered source-prefix comparison');
function apply(db,ms){for(const m of ms){const fk=m.requiresForeignKeysDisabled===true;if(fk)db.pragma('foreign_keys=OFF');try{db.transaction(()=>{for(const statement of m.statements)db.exec(statement)})()}finally{if(fk)db.pragma('foreign_keys=ON')}}}
const results=[];
for(const mode of ['upgrade','fresh']){const db=new Database(':memory:');try{db.pragma('foreign_keys=ON');if(mode==='upgrade'){apply(db,productionManifest);apply(db,additions)}else apply(db,proposed);assert.equal(db.pragma('quick_check',{simple:true}),'ok');assert.equal(db.pragma('foreign_key_check').length,0);const communitySeedCounts=Object.fromEntries(['traderlink_communities','traderlink_community_operator_grants','traderlink_community_roles','traderlink_community_discord_destinations'].map(table=>[table,db.prepare('SELECT count(*) n FROM '+table).get().n]));for(const count of Object.values(communitySeedCounts))assert.equal(count,0,'Fresh production recipe must not create pilot communities, grants, roles or destinations');results.push({mode,tables:db.prepare("SELECT count(*) n FROM sqlite_master WHERE type='table'").get().n,quickCheck:'ok',foreignKeyViolations:0,communitySeedCounts})}finally{db.close()}}
assert.equal(results[0].tables,results[1].tables);
const result={checkedAt:new Date().toISOString(),sourceOnly:true,inMemorySyntheticSQLOnly:true,hostedDatabaseOpened:false,proposalOnly:true,releaseReady:false,refs,rawProductionPrefixMatches,sourceComparison,productionPrefixPreserved:true,rawCandidateProductionPrefixRejected:unreconciledRejected,productionCount:productionManifest.length,proposedCount:proposed.length,additions:additions.map(m=>({id:m.migrationId,proposedProductionOrder:m.executionOrder,candidateOrder:candidateManifest.find(c=>c.migrationId===m.migrationId).executionOrder,existingStagingOrder:stagingManifest.find(c=>c.migrationId===m.migrationId)?.executionOrder,checksum:contract.calculatePlatformMigrationChecksum(m)})),results,limitations:['Synthetic empty-schema SQL and constructed source-metadata rows only; no applied hosted ledger was read.','Not a runtime manifest change or authorization to rewrite staging history.','Current staging retains its existing lineage; a canonical production rehearsal requires Coordinator-approved lineage and data-preservation planning.']};
console.log(JSON.stringify(result,null,2));
