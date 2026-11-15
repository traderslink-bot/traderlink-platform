import {independentActiveSelectionSql} from './independent-coaching-selection-lifecycle-storage';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {createHash,randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {IndependentCoachingRepository} from './independent-coaching-repository';
export class IndependentCoachingReviewImages{
 constructor(private readonly db:Database.Database){}
 private access(reviewId:string,actorUserId:string,write=false){
  const repo=new IndependentCoachingRepository(this.db),review=repo.review(reviewId,actorUserId),enrollment=repo.enrollment(review.enrollmentId,actorUserId);
  const coach=enrollment.coach_user_id===actorUserId;
  if(write){requireCoachCommercialAccess(this.db,{coachUserId:actorUserId,scope:'platform',atUtc:new Date().toISOString()});const access=repo.journalAccess(review.enrollmentId,actorUserId,review.agreementId,review.planItemId);
   if(!coach||enrollment.status!=='active'||!['ready','draft'].includes(review.status)||access.missing.length||review.journalAccountId!==access.accountId)throw new Error('This review cannot accept images.');
  }else if(!coach&&review.status!=='delivered')throw new Error('Images are available after the coach delivers this review.');
  return review;
 }
 list(reviewId:string,actorUserId:string):readonly {imageId:string;roundTripId:string;filename:string}[]{
  this.access(reviewId,actorUserId);return this.db.prepare(`SELECT image_id imageId,round_trip_id roundTripId,filename FROM traderlink_coaching_review_images WHERE review_id=? AND (round_trip_id='' OR EXISTS(SELECT 1 FROM traderlink_coaching_review_trades t WHERE t.review_id=traderlink_coaching_review_images.review_id AND t.round_trip_id=traderlink_coaching_review_images.round_trip_id AND ${independentActiveSelectionSql(this.db,'t')})) ORDER BY created_at_utc,image_id`).all(reviewId) as {imageId:string;roundTripId:string;filename:string}[];
 }
 add(input:{reviewId:string;actorUserId:string;roundTripId?:string;filename:string;mediaType:string;content:Buffer;atUtc:string}):string{
  if(!Number.isFinite(Date.parse(input.atUtc))||new Date(input.atUtc).toISOString()!==input.atUtc||!Buffer.isBuffer(input.content)||input.content.length<1||input.content.length>8388608)throw new Error('Select an image of 8 MB or smaller.');
  const signatures:{[key:string]:boolean}={'image/png':input.content.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'image/jpeg':input.content[0]===255&&input.content[1]===216,'image/webp':input.content.subarray(0,4).toString()==='RIFF'&&input.content.subarray(8,12).toString()==='WEBP'};
  if(!signatures[input.mediaType])throw new Error('Use a PNG, JPEG or WebP image.');
  const filename=input.filename.replace(/[\u0000-\u001f\u007f]/g,' ').trim();if(!filename||filename.length>180)throw new Error('Choose an image with a valid filename.');
  return this.db.transaction(()=>{
   const review=this.access(input.reviewId,input.actorUserId,true);const trade=input.roundTripId??'';
   if(trade&&!this.db.prepare(`SELECT 1 FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.db)}`).get(input.reviewId,trade))throw new Error('Select a trade in this review before adding its image.');
   const digest=createHash('sha256').update(input.content).digest('hex'),prior=this.db.prepare('SELECT image_id FROM traderlink_coaching_review_images WHERE review_id=? AND round_trip_id=? AND sha256=?').get(input.reviewId,trade,digest) as {image_id:string}|undefined;if(prior)return prior.image_id;
   const total=this.db.prepare('SELECT coalesce(sum(length(content)),0) bytes FROM traderlink_coaching_review_images WHERE review_id=?').get(input.reviewId) as {bytes:number};if(total.bytes+input.content.length>67108864)throw new Error('This review has reached its image storage limit.');
   const id=randomUUID();this.db.prepare('INSERT INTO traderlink_coaching_review_images VALUES(?,?,?,?,?,?,?,?)').run(id,input.reviewId,trade,filename,input.mediaType,digest,input.content,input.atUtc);if(trade)this.db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)').run(randomUUID(),review.enrollmentId,input.actorUserId,'review_trade_feedback_saved',`${input.reviewId}:${trade}`,input.atUtc);return id;
  }).immediate();
 }
 remove(imageId:string,actorUserId:string):void{
  this.db.transaction(()=>{const row=this.db.prepare('SELECT review_id,round_trip_id FROM traderlink_coaching_review_images WHERE image_id=?').get(imageId) as {review_id:string;round_trip_id:string}|undefined;if(!row)throw new Error('This review image is unavailable.');const review=this.access(row.review_id,actorUserId,true);if(row.round_trip_id&&!this.db.prepare(`SELECT 1 FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.db)}`).get(row.review_id,row.round_trip_id))throw new Error('Restore this removed draft before changing its images.');if(row.round_trip_id)this.db.prepare('INSERT INTO traderlink_coaching_events VALUES(?,?,?,?,?,?)').run(randomUUID(),review.enrollmentId,actorUserId,'review_trade_feedback_saved',`${row.review_id}:${row.round_trip_id}`,new Date().toISOString());this.db.prepare('DELETE FROM traderlink_coaching_review_images WHERE image_id=?').run(imageId);}).immediate();
 }
 read(imageId:string,actorUserId:string){
  const row=this.db.prepare('SELECT review_id,round_trip_id,image_id,content,media_type FROM traderlink_coaching_review_images WHERE image_id=?').get(imageId) as {review_id:string;round_trip_id:string;image_id:string;content:Buffer;media_type:string}|undefined;
  if(!row)throw new Error('This review image is unavailable.');this.access(row.review_id,actorUserId);if(row.round_trip_id&&!this.db.prepare(`SELECT 1 FROM traderlink_coaching_review_trades WHERE review_id=? AND round_trip_id=? AND ${independentActiveSelectionSql(this.db)}`).get(row.review_id,row.round_trip_id))throw new Error('This image is not attached to a selected review trade.');return {content:row.content,mediaType:row.media_type};
 }
}
