import {createHash} from 'node:crypto';
import Database from 'better-sqlite3';
import type {TestProject} from 'vitest/node';
import {runPlatformMigrations,verifyCompletedPlatformDatabase} from '@/src/modules/platform/server/database/run-platform-migrations';
import {platformTestDescriptorSha256,type PristinePlatformSnapshot} from './pristine-platform-snapshot';

/** No disk artifact or hosted connection: bytes die with the Vitest process,
 * including cancellation/failure. Every consumer gets an independent clone. */
export default function setup(project:TestProject):void{
 const db=new Database(':memory:');
 try{
  db.pragma('foreign_keys=ON');
  const result=runPlatformMigrations(db);
  const proof=verifyCompletedPlatformDatabase(db);
  if(result.finalSchemaSha256!==proof.finalSchemaSha256)throw new Error('Test snapshot schema mismatch');
  const buffer=db.serialize();
  const snapshot:PristinePlatformSnapshot={base64:buffer.toString('base64'),sha256:createHash('sha256').update(buffer).digest('hex'),
   schemaSha256:proof.finalSchemaSha256,descriptorSha256:platformTestDescriptorSha256(),
   sqliteVersion:(db.prepare('SELECT sqlite_version() version').get() as {version:string}).version};
  project.provide('pristinePlatformSnapshot',snapshot);
 }finally{db.close();}
}
