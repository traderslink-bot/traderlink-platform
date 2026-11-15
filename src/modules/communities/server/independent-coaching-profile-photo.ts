import {createHash} from 'node:crypto';
import type Database from 'better-sqlite3';
import {readCoachCommercialAccess} from './coaching-commercial-access';

const TABLE='traderlink_coaching_profile_photos';
export type IndependentCoachProfilePhotoMetadata=Readonly<{available:boolean;updatedAtUtc:string|null}>;

/** Mirrors the public coach directory/detail contract: qualified coach plus at least one published plan. */
export function independentCoachPublicProfileAvailable(db:Database.Database,contextId:string,coachUserId:string,atUtc:string):boolean{
 return readCoachCommercialAccess(db,{coachUserId,scope:'platform',atUtc}).allowed&&Boolean(db.prepare("SELECT 1 FROM traderlink_coaching_plans WHERE context_id=? AND status='active' LIMIT 1").get(contextId));
}

export class IndependentCoachingProfilePhoto{
 constructor(private readonly db:Database.Database){}
 storageReady():boolean{return Boolean(this.db.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name=?").get(TABLE));}
 metadata(contextId:string,actorUserId:string,atUtc:string):IndependentCoachProfilePhotoMetadata{
  if(!this.storageReady())return {available:false,updatedAtUtc:null};
  this.readAccess(contextId,actorUserId,atUtc);
  const row=this.db.prepare(`SELECT updated_at_utc FROM ${TABLE} WHERE context_id=?`).get(contextId) as {updated_at_utc:string}|undefined;
  return {available:Boolean(row),updatedAtUtc:row?.updated_at_utc??null};
 }
 private readAccess(contextId:string,actorUserId:string,atUtc:string):{coachUserId:string;owner:boolean}{
  const row=this.db.prepare('SELECT coach_user_id FROM traderlink_coaching_contexts WHERE context_id=?').get(contextId) as {coach_user_id:string}|undefined;
  if(!row)throw new Error('This coach photo is unavailable.');
  const owner=row.coach_user_id===actorUserId;
  if(!owner&&!independentCoachPublicProfileAvailable(this.db,contextId,row.coach_user_id,atUtc))throw new Error('This coach photo is unavailable.');
  return {coachUserId:row.coach_user_id,owner};
 }
 private ownedContext(actorUserId:string):string{
  const row=this.db.prepare('SELECT context_id FROM traderlink_coaching_contexts WHERE coach_user_id=?').get(actorUserId) as {context_id:string}|undefined;
  if(!row)throw new Error('Save your coach profile first.');return row.context_id;
 }
 save(input:{actorUserId:string;filename:string;mediaType:string;content:Buffer;atUtc:string}):IndependentCoachProfilePhotoMetadata{
  if(!this.storageReady())throw new Error('Profile photo storage is not ready.');
  if(!Number.isFinite(Date.parse(input.atUtc))||new Date(input.atUtc).toISOString()!==input.atUtc||!Buffer.isBuffer(input.content)||input.content.length<1||input.content.length>8388608)throw new Error('Select an image of 8 MB or smaller.');
  const valid:{[key:string]:boolean}={'image/png':input.content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'image/jpeg':input.content[0]===255&&input.content[1]===216,'image/webp':input.content.subarray(0,4).toString()==='RIFF'&&input.content.subarray(8,12).toString()==='WEBP'};
  if(!valid[input.mediaType])throw new Error('Use a PNG, JPEG or WebP image.');
  const filename=input.filename.replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(!filename||filename.length>180)throw new Error('Choose an image with a valid filename.');
  const contextId=this.ownedContext(input.actorUserId),sha=createHash('sha256').update(input.content).digest('hex');
  this.db.transaction(()=>this.db.prepare(`INSERT INTO ${TABLE}(context_id,filename,media_type,byte_length,sha256,content,created_at_utc,updated_at_utc) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(context_id) DO UPDATE SET filename=excluded.filename,media_type=excluded.media_type,byte_length=excluded.byte_length,sha256=excluded.sha256,content=excluded.content,updated_at_utc=excluded.updated_at_utc`).run(contextId,filename,input.mediaType,input.content.length,sha,input.content,input.atUtc,input.atUtc)).immediate();
  return {available:true,updatedAtUtc:input.atUtc};
 }
 remove(actorUserId:string):void{if(!this.storageReady())throw new Error('Profile photo storage is not ready.');const contextId=this.ownedContext(actorUserId);this.db.prepare(`DELETE FROM ${TABLE} WHERE context_id=?`).run(contextId);}
 read(contextId:string,actorUserId:string,atUtc:string):Readonly<{content:Buffer;mediaType:string;sha256:string}>{
  if(!this.storageReady())throw new Error('This coach photo is unavailable.');this.readAccess(contextId,actorUserId,atUtc);
  const row=this.db.prepare(`SELECT content,media_type,sha256 FROM ${TABLE} WHERE context_id=?`).get(contextId) as {content:Buffer;media_type:string;sha256:string}|undefined;
  if(!row)throw new Error('This coach photo is unavailable.');return {content:row.content,mediaType:row.media_type,sha256:row.sha256};
 }
}
