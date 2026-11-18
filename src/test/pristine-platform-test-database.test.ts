// @vitest-environment node
import {createHash} from 'node:crypto';
import {mkdtempSync,rmSync,statSync,symlinkSync,existsSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {afterEach,describe,expect,inject,it} from 'vitest';
import {countCreatedPlatformTestUsers,openPristinePlatformTestDatabase,setPlatformTestFixtureMigrationTime} from './pristine-platform-test-database';
import {decodePlatformTestSnapshot} from './pristine-platform-snapshot';
import {verifyCompletedPlatformDatabase} from '@/src/modules/platform/server/database/run-platform-migrations';
const roots:string[]=[];
afterEach(()=>{for(const root of roots.splice(0))rmSync(root,{recursive:true,force:true});});
function root(){const value=mkdtempSync(join(tmpdir(),'traderlink-pristine-fixture-test-'));roots.push(value);return value;}
describe('validated pristine Platform test fixtures',()=>{
 it('isolates data and schema changes between independent writable memory clones',()=>{
  const first=openPristinePlatformTestDatabase(),second=openPristinePlatformTestDatabase();
  try{
   const before=second.prepare('SELECT user_id FROM platform_users ORDER BY user_id').all();
   first.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'test','isolated-fixture','Fixture','active',?,?)")
    .run('00000000-0000-4000-8000-000000000001','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z');
   first.exec('CREATE TABLE test_fixture_mutation(value TEXT)');
   first.prepare("UPDATE platform_schema_migrations SET checksum_sha256=?").run('0'.repeat(64));
   expect(second.prepare('SELECT user_id FROM platform_users ORDER BY user_id').all()).toEqual(before);
   expect(second.prepare("SELECT 1 FROM sqlite_schema WHERE name='test_fixture_mutation'").get()).toBeUndefined();
   expect(verifyCompletedPlatformDatabase(second).finalSchemaSha256).toBe(inject('pristinePlatformSnapshot').schemaSha256);
   const third=openPristinePlatformTestDatabase();
   try{expect(third.prepare('SELECT user_id FROM platform_users ORDER BY user_id').all()).toEqual(before);}
   finally{third.close();}
  }finally{first.close();second.close();}
 });
 it('retains explicit fixture time without changing schema or other clones',()=>{
  const db=openPristinePlatformTestDatabase();
  try{
   const now='2026-08-01T12:00:00.000Z';
   setPlatformTestFixtureMigrationTime(db,()=>new Date(now));
   expect(db.prepare('SELECT DISTINCT applied_at_utc FROM platform_schema_migrations').all()).toEqual([{applied_at_utc:now}]);
   expect(verifyCompletedPlatformDatabase(db).finalSchemaSha256).toBe(inject('pristinePlatformSnapshot').schemaSha256);
  }finally{db.close();}
 });
 it('uses normal disk initializer WAL/FK checks and never overwrites an existing fixture',()=>{
  const file=join(root(),'fixture.sqlite');
  const db=openPristinePlatformTestDatabase({mode:'initializer',databasePath:file,forbiddenRepositoryRoots:[]});
  try{
   expect(db.pragma('journal_mode',{simple:true})).toBe('wal');
   expect(db.pragma('foreign_keys',{simple:true})).toBe(1);
   expect(statSync(file).mode&0o777).toBe(0o600);
   const digest=()=>createHash('sha256').update(readFileSync(file)).digest('hex');
   const before=digest();
   expect(()=>openPristinePlatformTestDatabase({databasePath:file})).toThrow();
   expect(digest()).toBe(before);
  }finally{db.close();}
 });
 it('refuses an unrelated hosted path before creating a file',()=>{
  expect(()=>openPristinePlatformTestDatabase({databasePath:'/data/traderlink-platform.sqlite'})).toThrow('isolated temporary storage');
 });
 it('refuses a symlinked parent without writing into its target',()=>{
  const parent=root(),target=root(),link=join(parent,'linked');symlinkSync(target,link,'dir');
  expect(()=>openPristinePlatformTestDatabase({databasePath:join(link,'fixture.sqlite')})).toThrow('symlink');
  expect(existsSync(join(target,'fixture.sqlite'))).toBe(false);
 });
 it('cannot replace a runtime open',()=>{
  expect(()=>openPristinePlatformTestDatabase({mode:'runtime'})).toThrow('runtime open');
 });
 it('rejects changed serialized bytes or a changed manifest descriptor',()=>{
  const snapshot=inject('pristinePlatformSnapshot');
  expect(()=>decodePlatformTestSnapshot({...snapshot,sha256:'0'.repeat(64)})).toThrow('bytes changed');
  expect(()=>decodePlatformTestSnapshot({...snapshot,descriptorSha256:'0'.repeat(64)})).toThrow('manifest changed');
 });
 it('preserves the reserved principal while counting every new identity',()=>{
  const db=openPristinePlatformTestDatabase();
  try{
   expect(countCreatedPlatformTestUsers(db,'n')).toEqual({n:0});
   db.prepare("INSERT INTO platform_users(user_id,auth_provider,auth_subject,display_name,status,created_at_utc,updated_at_utc) VALUES(?,'erasure','unknown-extra-principal','Extra','disabled',?,?)")
    .run('00000000-0000-4000-8000-000000000001','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z');
   expect(countCreatedPlatformTestUsers(db,'n')).toEqual({n:1});
   db.prepare("UPDATE platform_users SET display_name='Changed' WHERE user_id='00000000-0000-4000-8000-000000000195'").run();
   expect(()=>countCreatedPlatformTestUsers(db,'n')).toThrow('Reserved principal changed');
  }finally{db.close();}
 });
 it('refuses an authentication link added to the reserved principal',()=>{
  const db=openPristinePlatformTestDatabase();
  try{
   db.prepare("INSERT INTO platform_auth_identities(user_id,auth_provider,auth_subject,status,linked_by_user_id,created_at_utc,updated_at_utc,last_authenticated_at_utc) VALUES(?,'google','unexpected-login','active',?,?,?,NULL)")
    .run('00000000-0000-4000-8000-000000000195','00000000-0000-4000-8000-000000000195','2026-11-17T00:00:00.000Z','2026-11-17T00:00:00.000Z');
   expect(()=>countCreatedPlatformTestUsers(db,'count')).toThrow('Reserved principal identities changed');
  }finally{db.close();}
 });

});
