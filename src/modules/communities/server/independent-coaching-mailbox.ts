import {createHash,randomUUID} from 'node:crypto';
import type Database from 'better-sqlite3';
import {requireCoachCommercialAccess} from './coaching-commercial-access';
import {COACHING_MAILBOX_PROTOCOL,COACHING_MAILBOX_SEND_PROTOCOL,canonicalMailboxSubject,MAILBOX_PAGE_SIZE,isMailboxTimestamp,isMailboxUuid,requireMailboxEnvelope,type MailboxBody,type MailboxEnrollment,type MailboxFolder,type MailboxMessage,type MailboxOpenAcknowledgement,type MailboxPage,type MailboxScope,type MailboxSendAcknowledgement} from '../contracts/independent-coaching-messages';

export class CoachingMailboxUnavailable extends Error{constructor(){super('Messages are not enabled here yet. Existing message history is preserved.');}}
type Participant={enrollmentId:string;planId:string;studentUserId:string;coachUserId:string;status:string;planName:string};
type MessageRow={messageId:string;enrollmentId:string;senderUserId:string;senderName:string;createdAtUtc:string;preview:string;subject:string|null;body?:string;readAtUtc:string|null;legacyId:string|null};
const participantsSql=`SELECT e.enrollment_id enrollmentId,e.plan_id planId,e.student_user_id studentUserId,c.coach_user_id coachUserId,e.status,
 COALESCE((SELECT json_extract(a.terms_json,'$.planName') FROM traderlink_coaching_accepted_terms a WHERE a.enrollment_id=e.enrollment_id AND a.status='accepted' LIMIT 1),
 (SELECT json_extract(v.terms_json,'$.planName') FROM traderlink_coaching_plan_versions v WHERE v.plan_id=e.plan_id ORDER BY v.revision DESC LIMIT 1),'Coaching plan') planName
 FROM traderlink_coaching_enrollments e JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id`;
export function independentCoachingMailboxReady(database:Database.Database):boolean{
 return (database.prepare("SELECT count(*) total FROM sqlite_schema WHERE type='table' AND name IN ('traderlink_coaching_message_legacy','traderlink_coaching_message_read_receipts')").get() as {total:number}).total===2;
}
function ready(database:Database.Database){if(!independentCoachingMailboxReady(database))throw new CoachingMailboxUnavailable();}
function subjectsReady(database:Database.Database):boolean{return Boolean(database.prepare("SELECT 1 FROM sqlite_schema WHERE type='table' AND name='traderlink_coaching_message_subjects'").get());}
function uuid(value:unknown,label:string):string{if(!isMailboxUuid(value))throw new Error(`Choose a valid ${label}.`);return value;}
function participant(database:Database.Database,enrollmentId:string,actor:string,atUtc:string,checkCommercial=true):Participant{
 uuid(enrollmentId,'coaching plan');const row=database.prepare(`${participantsSql} WHERE e.enrollment_id=? AND (e.student_user_id=? OR c.coach_user_id=?)`).get(enrollmentId,actor,actor) as Participant|undefined;
 if(!row)throw new Error('This coaching conversation is unavailable.');
 if(checkCommercial&&row.coachUserId===actor)requireCoachCommercialAccess(database,{coachUserId:actor,scope:'platform',atUtc});
 return row;
}
function scopeRows(database:Database.Database,actor:string,scope:MailboxScope,atUtc:string):Participant[]{
 if(scope.status!=='active'&&scope.status!=='ended')throw new Error('Choose Active or Past coaching.');
 if(Boolean(scope.enrollmentId)===Boolean(scope.studentId)||scope.enrollmentId&&scope.planId)throw new Error('Choose one coaching conversation context.');
 if(scope.enrollmentId){const row=participant(database,scope.enrollmentId,actor,atUtc);if(!['active','ended'].includes(row.status))throw new Error('Messages are available after your coaching agreement is active.');if(row.status!==scope.status)throw new Error('This coaching plan changed. Reopen Messages.');return [row];}
 uuid(scope.studentId,'student');if(scope.planId)uuid(scope.planId,'plan');
 const rows=database.prepare(`${participantsSql} WHERE c.coach_user_id=? AND e.student_user_id=? AND e.status=?${scope.planId?' AND e.plan_id=?':''} ORDER BY e.enrollment_id`).all(...[actor,scope.studentId!,scope.status,...(scope.planId?[scope.planId]:[])]) as Participant[];
 if(!rows.length)throw new Error('This student is not in your coaching workspace.');
 requireCoachCommercialAccess(database,{coachUserId:actor,scope:'platform',atUtc});return rows;
}
function queryParts(rows:readonly Participant[],actor:string){
 const ids=rows.map(row=>row.enrollmentId),slots=ids.map(()=>'?').join(',');
 return {joins:`FROM traderlink_coaching_messages m JOIN traderlink_coaching_enrollments e ON e.enrollment_id=m.enrollment_id JOIN traderlink_coaching_contexts c ON c.context_id=e.context_id
 JOIN platform_users u ON u.user_id=m.sender_user_id LEFT JOIN traderlink_coaching_message_legacy l ON l.message_id=m.message_id
 LEFT JOIN traderlink_coaching_message_read_receipts r ON r.message_id=m.message_id AND r.recipient_user_id=?`,
 where:`m.enrollment_id IN (${slots}) AND m.sender_user_id IN (e.student_user_id,c.coach_user_id)`,bindings:[actor,...ids]};
}
function state(row:MessageRow,actor:string):MailboxMessage['state']{return row.senderUserId===actor?'sent':row.readAtUtc!==null?'read':row.legacyId?'earlier':'unread';}
function publicMessage(row:MessageRow,actor:string):MailboxMessage{return {messageId:row.messageId,enrollmentId:row.enrollmentId,senderUserId:row.senderUserId,senderName:row.senderName,createdAtUtc:row.createdAtUtc,preview:row.preview,subject:row.subject??null,state:state(row,actor)};}
function projection(body=false,withSubjects=false){return 'm.message_id messageId,m.enrollment_id enrollmentId,m.sender_user_id senderUserId,u.display_name senderName,m.created_at_utc createdAtUtc,substr(m.body,1,160) preview,'+(withSubjects?'(SELECT s.subject FROM traderlink_coaching_message_subjects s WHERE s.message_id=m.message_id)':'NULL')+' subject,r.read_at_utc readAtUtc,l.message_id legacyId'+(body?',m.body body':'');}
/** Original total remains a total. Unmigrated schema has UNKNOWN unread, never a fabricated zero. */
export function independentCoachingMessageCounts(database:Database.Database,enrollmentId:string,actor:string,atUtc=new Date().toISOString()):{messageCount:number;unreadMessageCount:number|null}{
 // Page snapshots calculate metadata before their existing commercial-signup gate.
 // All mailbox list/body endpoints independently enforce that gate in scopeRows.
 const row=participant(database,enrollmentId,actor,atUtc,false);
 const messageCount=(database.prepare('SELECT count(*) total FROM traderlink_coaching_messages WHERE enrollment_id=?').get(row.enrollmentId) as {total:number}).total;
 if(!independentCoachingMailboxReady(database))return {messageCount,unreadMessageCount:null};
 const p=queryParts([row],actor),unreadMessageCount=(database.prepare(`SELECT count(*) total ${p.joins} WHERE ${p.where} AND m.sender_user_id!=? AND r.message_id IS NULL AND l.message_id IS NULL`).get(...p.bindings,actor) as {total:number}).total;
 return {messageCount,unreadMessageCount};
}
export function readIndependentCoachingMailbox(database:Database.Database,input:{actorUserId:string;scope:MailboxScope;folder:MailboxFolder;earlier?:boolean;cursor?:string;atUtc:string}):MailboxPage{
 const {actorUserId:actor,folder}=input,rows=scopeRows(database,actor,input.scope,input.atUtc);ready(database);
 if(!['unread','read','sent'].includes(folder)||input.earlier&&folder!=='read')throw new Error('Choose a message folder.');
 const p=queryParts(rows,actor),counts=database.prepare(`SELECT
 coalesce(sum(CASE WHEN m.sender_user_id!=? AND r.message_id IS NULL AND l.message_id IS NULL THEN 1 ELSE 0 END),0) unread,
 coalesce(sum(CASE WHEN m.sender_user_id!=? AND r.message_id IS NOT NULL THEN 1 ELSE 0 END),0) read,
 coalesce(sum(CASE WHEN m.sender_user_id=? THEN 1 ELSE 0 END),0) sent,
 coalesce(sum(CASE WHEN m.sender_user_id!=? AND r.message_id IS NULL AND l.message_id IS NOT NULL THEN 1 ELSE 0 END),0) earlier
 ${p.joins} WHERE ${p.where}`).get(actor,actor,actor,actor,...p.bindings) as MailboxPage['counts'];
 const unreadByEnrollment=rows.map(row=>({enrollmentId:row.enrollmentId,unreadMessageCount:independentCoachingMessageCounts(database,row.enrollmentId,actor,input.atUtc).unreadMessageCount!}));
 const scopeHash=createHash('sha256').update(JSON.stringify([actor,input.scope.status,input.scope.studentId??null,input.scope.planId??null,input.scope.enrollmentId??null,rows.map(r=>r.enrollmentId).sort(),folder,Boolean(input.earlier)])).digest('hex');
 let boundary:{at:string;id:string}|undefined;
 if(input.cursor){
  try{if(input.cursor.length>2048)throw new Error();const parsed=JSON.parse(Buffer.from(input.cursor,'base64url').toString('utf8'));
   if(parsed.version!==1||parsed.scope!==scopeHash||!isMailboxTimestamp(parsed.at)||!isMailboxUuid(parsed.id))throw new Error();boundary={at:parsed.at,id:parsed.id};
  }catch{throw new Error('This message page changed. Refresh the message list.');}
 }
 const filter=folder==='sent'?'m.sender_user_id=?':`m.sender_user_id!=? AND ${folder==='read'?(input.earlier?'r.message_id IS NULL AND l.message_id IS NOT NULL':'r.message_id IS NOT NULL'):'r.message_id IS NULL AND l.message_id IS NULL'}`;
 const result=database.prepare(`SELECT ${projection(false,subjectsReady(database))} ${p.joins} WHERE ${p.where} AND ${filter}${boundary?' AND (m.created_at_utc<? OR (m.created_at_utc=? AND m.message_id<?))':''} ORDER BY m.created_at_utc DESC,m.message_id DESC LIMIT ?`).all(...p.bindings,actor,...(boundary?[boundary.at,boundary.at,boundary.id]:[]),MAILBOX_PAGE_SIZE+1) as MessageRow[];
 const items=result.slice(0,MAILBOX_PAGE_SIZE),last=items.at(-1);
 return {available:true,subjectsAvailable:subjectsReady(database),viewerUserId:actor,enrollments:rows.map(row=>({enrollmentId:row.enrollmentId,planId:row.planId,planName:row.planName,status:row.status as MailboxEnrollment['status']})),counts:{unread:counts.unread,read:counts.read,sent:counts.sent,earlier:counts.earlier},unreadByEnrollment,items:items.map(row=>publicMessage(row,actor)),nextCursor:result.length>MAILBOX_PAGE_SIZE&&last?Buffer.from(JSON.stringify({version:1,scope:scopeHash,at:last.createdAtUtc,id:last.messageId})).toString('base64url'):null,textBytes:null};
}
export function readIndependentCoachingMessage(database:Database.Database,input:{actorUserId:string;scope:MailboxScope;messageId:string;atUtc:string}):MailboxBody{
 const rows=scopeRows(database,input.actorUserId,input.scope,input.atUtc);ready(database);uuid(input.messageId,'message');
 const p=queryParts(rows,input.actorUserId),row=database.prepare(`SELECT ${projection(true,subjectsReady(database))} ${p.joins} WHERE ${p.where} AND m.message_id=?`).get(...p.bindings,input.messageId) as MessageRow|undefined;
 if(!row)throw new Error('This message is unavailable.');return {...publicMessage(row,input.actorUserId),body:row.body!};
}
/** These writes run inside the action/receipt immediate transaction. */
export function sendIndependentCoachingMailboxMessage(database:Database.Database,input:{actorUserId:string;atUtc:string;data:Record<string,unknown>}):MailboxSendAcknowledgement{
 const raw=input.data;requireMailboxEnvelope(raw);uuid(raw.clientRevision,'message draft');
 if(raw.protocol!==COACHING_MAILBOX_SEND_PROTOCOL)throw new Error('Reload Messages and add a subject before sending a new message.');
 const subject=canonicalMailboxSubject(raw.subject);
 if(!isMailboxTimestamp(input.atUtc))throw new Error('Reload Messages before submitting.');
 const row=participant(database,uuid(raw.enrollmentId,'plan'),input.actorUserId,input.atUtc);ready(database);
 if(row.status!=='active')throw new Error('New messages require an active coaching plan. Earlier messages remain available.');
 if(!subjectsReady(database))throw new CoachingMailboxUnavailable();
 if(typeof raw.body!=='string'||!raw.body.trim()||raw.body.length>20000)throw new Error('Write a message of up to 20,000 characters.');
 const messageId=randomUUID();database.prepare('INSERT INTO traderlink_coaching_messages VALUES(?,?,?,?,?)').run(messageId,row.enrollmentId,input.actorUserId,raw.body,input.atUtc);
 database.prepare('INSERT INTO traderlink_coaching_message_subjects(message_id,subject) VALUES(?,?)').run(messageId,subject);
 return {protocol:COACHING_MAILBOX_SEND_PROTOCOL,kind:'send',requestId:raw.requestId as string,snapshot:{enrollmentId:row.enrollmentId,clientRevision:raw.clientRevision as string,subjectSha256:createHash('sha256').update(subject,'utf8').digest('hex'),bodySha256:createHash('sha256').update(raw.body,'utf8').digest('hex')},message:{messageId,enrollmentId:row.enrollmentId,senderUserId:input.actorUserId,createdAtUtc:input.atUtc}};
}
export function openIndependentCoachingMailboxMessage(database:Database.Database,input:{actorUserId:string;atUtc:string;data:Record<string,unknown>}):MailboxOpenAcknowledgement{
 const raw=input.data;requireMailboxEnvelope(raw);if(!isMailboxTimestamp(input.atUtc))throw new Error('Reload Messages before opening this message.');
 const row=participant(database,uuid(raw.enrollmentId,'plan'),input.actorUserId,input.atUtc);ready(database);
 if(!['active','ended'].includes(row.status))throw new Error('This coaching conversation is unavailable.');
 const messageId=uuid(raw.messageId,'message'),message=database.prepare('SELECT sender_user_id sender FROM traderlink_coaching_messages WHERE enrollment_id=? AND message_id=?').get(row.enrollmentId,messageId) as {sender:string}|undefined;
 const other=row.coachUserId===input.actorUserId?row.studentUserId:row.coachUserId;
 if(!message||message.sender!==other||message.sender===input.actorUserId)throw new Error('Only a received message can be marked read.');
 database.prepare('INSERT INTO traderlink_coaching_message_read_receipts(message_id,recipient_user_id,read_at_utc) VALUES(?,?,?) ON CONFLICT(message_id,recipient_user_id) DO NOTHING').run(messageId,input.actorUserId,input.atUtc);
 const receipt=database.prepare('SELECT read_at_utc atUtc FROM traderlink_coaching_message_read_receipts WHERE message_id=? AND recipient_user_id=?').get(messageId,input.actorUserId) as {atUtc:string};
 return {protocol:COACHING_MAILBOX_PROTOCOL,kind:'open',requestId:raw.requestId as string,snapshot:{enrollmentId:row.enrollmentId,messageId},readAtUtc:receipt.atUtc};
}
