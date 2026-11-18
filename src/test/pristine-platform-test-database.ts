import assert from 'node:assert/strict';
import {closeSync,constants,fstatSync,lstatSync,mkdirSync,openSync,realpathSync,unlinkSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname,resolve,sep} from 'node:path';
import Database from 'better-sqlite3';
import {inject} from 'vitest';
import {openPlatformDatabase} from '@/src/modules/platform/server/database/open-platform-database';
import {createCanonicalUtcTimestamp} from '@/src/modules/platform/server/database/platform-migration-contract';
import {verifyCompletedPlatformDatabase} from '@/src/modules/platform/server/database/run-platform-migrations';
import {decodePlatformTestSnapshot,type PristinePlatformSnapshot} from './pristine-platform-snapshot';

declare module 'vitest' {interface ProvidedContext {pristinePlatformSnapshot:PristinePlatformSnapshot}}
let pristine:Buffer|undefined;
let snapshot:PristinePlatformSnapshot|undefined;
function bytes():Buffer{
 if(pristine)return pristine;
 snapshot=inject('pristinePlatformSnapshot');
 assert(snapshot,'Pristine platform global setup is required');
 const value=decodePlatformTestSnapshot(snapshot);
 pristine=value;
 return value;
}
type Options=Partial<Parameters<typeof openPlatformDatabase>[0]>;
/** Only ordinary test setup may use this. Migration/upgrade fidelity tests must
 * invoke the real runner, not this fully initialized fixture. */
export function openPristinePlatformTestDatabase(options:Options={}):Database.Database{
 const buffer=bytes();
 assert(!options.mode||options.mode==='initializer','Fixture cannot replace a runtime open');
 let db:Database.Database;
 if(!options.databasePath){
  db=new Database(Buffer.from(buffer));
  db.pragma('foreign_keys=ON');
 }else{
  const file=resolve(options.databasePath),parent=dirname(file),temporary=realpathSync(tmpdir());
  assert(file.startsWith(`${temporary}${sep}`),'Fixture database must be in isolated temporary storage');
  const relative=parent.slice(temporary.length+1);
  let current=temporary;
  for(const part of relative.split(sep).filter(Boolean)){
   current=resolve(current,part);
   try{mkdirSync(current,{mode:0o700});}catch(error){if((error as NodeJS.ErrnoException).code!=='EEXIST')throw error;}
   const entry=lstatSync(current);
   assert(entry.isDirectory()&&!entry.isSymbolicLink(),'Fixture parent must not be a symlink');
  }
  assert.equal(realpathSync(parent),parent,'Fixture parent must not be a symlink');
  const fd=openSync(file,constants.O_WRONLY|constants.O_CREAT|constants.O_EXCL|constants.O_NOFOLLOW,0o600);
  const owned=fstatSync(fd);
  try{writeFileSync(fd,buffer);}catch(error){
   const current=lstatSync(file);
   if(current.dev===owned.dev&&current.ino===owned.ino)unlinkSync(file);
   throw error;
  }finally{closeSync(fd);}
  // Preserve normal path validation, WAL, FK and initializer connection checks.
  db=openPlatformDatabase({...options,mode:'initializer',databasePath:file});
 }
 try{
  assert.equal((db.prepare('SELECT sqlite_version() version').get() as {version:string}).version,snapshot!.sqliteVersion,'Native SQLite changed');
  assert.equal(verifyCompletedPlatformDatabase(db).finalSchemaSha256,snapshot!.schemaSha256,'Cloned fixture schema mismatch');
  return db;
 }catch(error){db.close();throw error;}
}

/** Explicit requested migration-time metadata belongs to ordinary fixture setup,
 * not the snapshot's build time. Keep this call at the original setup position. */
export function setPlatformTestFixtureMigrationTime(db:Database.Database,now:()=>Date):void{
 db.prepare('UPDATE platform_schema_migrations SET applied_at_utc=?').run(createCanonicalUtcTimestamp(now()));
}

let pristineUserBaseline:Record<string,unknown>[]|undefined;
/** Counts only additions to the actual pristine user population. The reserved
 * disabled erasure principal must remain byte-for-field identical and unlinked;
 * any other user (including unknown erasure identities) still counts. */
export function countCreatedPlatformTestUsers(db:Database.Database,column:'n'|'count'):{[key:string]:number}{
 if(!pristineUserBaseline){
  const baseline=new Database(Buffer.from(bytes()));
  try{pristineUserBaseline=baseline.prepare('SELECT * FROM platform_users ORDER BY user_id').all() as Record<string,unknown>[];}
  finally{baseline.close();}
  assert(pristineUserBaseline.length===1,'Review changed pristine user population explicitly');
  assert(pristineUserBaseline[0].user_id==='00000000-0000-4000-8000-000000000195'
   &&pristineUserBaseline[0].auth_provider==='erasure'
   &&pristineUserBaseline[0].auth_subject==='paid-partner-retained-principal-v1'
   &&pristineUserBaseline[0].status==='disabled','Unexpected reserved principal');
 }
 for(const user of pristineUserBaseline){
  assert.deepEqual(db.prepare('SELECT * FROM platform_users WHERE user_id=?').get(user.user_id),user,'Reserved principal changed');
  assert.equal((db.prepare('SELECT count(*) n FROM platform_auth_identities WHERE user_id=?').get(user.user_id) as {n:number}).n,0,'Reserved principal identities changed');
  assert.equal((db.prepare('SELECT count(*) n FROM platform_workspace_memberships WHERE user_id=?').get(user.user_id) as {n:number}).n,0,'Reserved principal workspace links changed');
 }
 const total=(db.prepare('SELECT count(*) n FROM platform_users').get() as {n:number}).n;
 return {[column]:total-pristineUserBaseline.length};
}
