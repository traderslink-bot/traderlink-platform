export const COACHING_MAILBOX_PROTOCOL = 'traderlink.coaching.mailbox.v1' as const;
export const COACHING_MAILBOX_SEND_PROTOCOL = 'traderlink.coaching.mailbox.send.v2' as const;
export const MAILBOX_SUBJECT_LIMIT = 160;
export const MAILBOX_PAGE_SIZE = 50;
export type MailboxFolder = 'unread' | 'read' | 'sent';
export type MailboxScope = Readonly<{studentId?:string;planId?:string;enrollmentId?:string;status:'active'|'ended'}>;
export type MailboxEnrollment = Readonly<{enrollmentId:string;planId:string;planName:string;status:'active'|'ended'}>;
export type MailboxMessage = Readonly<{messageId:string;enrollmentId:string;senderUserId:string;senderName:string;createdAtUtc:string;preview:string;subject?:string|null;state:'unread'|'read'|'sent'|'earlier'}>;
export type MailboxBody = MailboxMessage & Readonly<{body:string}>;
export type MailboxPage = Readonly<{
 available:true;subjectsAvailable?:boolean;viewerUserId:string;enrollments:readonly MailboxEnrollment[];
 counts:Readonly<Record<MailboxFolder|'earlier',number>>;
 unreadByEnrollment:readonly Readonly<{enrollmentId:string;unreadMessageCount:number}>[];
 items:readonly MailboxMessage[];nextCursor:string|null;textBytes:number|null;
}>;
type MailboxSendFields={intent:'send_mailbox_message';requestId:string;clientRevision:string;enrollmentId:string;body:string};
export type MailboxSendPayload = Readonly<MailboxSendFields&({protocol:typeof COACHING_MAILBOX_PROTOCOL}|{protocol:typeof COACHING_MAILBOX_SEND_PROTOCOL;subject:string})>;
export type MailboxOpenPayload = Readonly<{intent:'open_mailbox_message';protocol:typeof COACHING_MAILBOX_PROTOCOL;requestId:string;enrollmentId:string;messageId:string}>;
export type MailboxSendAcknowledgement = Readonly<{
 protocol:typeof COACHING_MAILBOX_PROTOCOL|typeof COACHING_MAILBOX_SEND_PROTOCOL;kind:'send';requestId:string;
 snapshot:Readonly<{enrollmentId:string;clientRevision:string;bodySha256:string;subjectSha256?:string}>;
 message:Readonly<{messageId:string;enrollmentId:string;senderUserId:string;createdAtUtc:string}>;
}>;
export type MailboxOpenAcknowledgement = Readonly<{
 protocol:typeof COACHING_MAILBOX_PROTOCOL;kind:'open';requestId:string;
 snapshot:Readonly<{enrollmentId:string;messageId:string}>;readAtUtc:string;
}>;
export type MailboxAcknowledgement = MailboxSendAcknowledgement | MailboxOpenAcknowledgement;
export function isMailboxUuid(value:unknown):value is string{return typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);}
export function isMailboxTimestamp(value:unknown):value is string{return typeof value==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;}
export function isMailboxIntent(value:unknown){return value==='send_mailbox_message'||value==='open_mailbox_message';}
export function requireMailboxEnvelope(raw:Record<string,unknown>){
 if((raw.protocol!==COACHING_MAILBOX_PROTOCOL&&(raw.intent!=='send_mailbox_message'||raw.protocol!==COACHING_MAILBOX_SEND_PROTOCOL))||!isMailboxUuid(raw.requestId))throw new Error('Reload Messages before submitting.');
}
export function canonicalMailboxSubject(value:unknown):string{
 if(typeof value!=='string'||/[\r\n\u0000]/.test(value))throw new Error('Enter a subject on one line.');
 const subject=value.trim();if(!subject||subject.length>MAILBOX_SUBJECT_LIMIT)throw new Error('Enter a subject of 1–160 characters.');return subject;
}
function record(value:unknown):value is Record<string,unknown>{return Boolean(value)&&typeof value==='object'&&!Array.isArray(value);}
export function validateMailboxSendAcknowledgement(value:unknown,expected:{payload:MailboxSendPayload;bodySha256:string;subjectSha256?:string;viewerUserId:string}):value is MailboxSendAcknowledgement{
 if(!record(value)||value.protocol!==expected.payload.protocol||value.kind!=='send'||value.requestId!==expected.payload.requestId||!isMailboxUuid(value.requestId)||!record(value.snapshot)||!record(value.message))return false;
 const {snapshot,message}=value,payload=expected.payload;
 if(payload.protocol===COACHING_MAILBOX_SEND_PROTOCOL){if(!expected.subjectSha256||!/^[0-9a-f]{64}$/.test(expected.subjectSha256)||snapshot.subjectSha256!==expected.subjectSha256)return false;}else if(snapshot.subjectSha256!==undefined)return false;
 return isMailboxUuid(payload.clientRevision)&&snapshot.clientRevision===payload.clientRevision&&snapshot.enrollmentId===payload.enrollmentId&&snapshot.bodySha256===expected.bodySha256&&/^[0-9a-f]{64}$/.test(expected.bodySha256)&&isMailboxUuid(message.messageId)&&message.enrollmentId===payload.enrollmentId&&message.senderUserId===expected.viewerUserId&&isMailboxTimestamp(message.createdAtUtc);
}
export function validateMailboxOpenAcknowledgement(value:unknown,expected:MailboxOpenPayload):value is MailboxOpenAcknowledgement{
 return record(value)&&value.protocol===COACHING_MAILBOX_PROTOCOL&&value.kind==='open'&&isMailboxUuid(value.requestId)&&value.requestId===expected.requestId&&record(value.snapshot)&&value.snapshot.enrollmentId===expected.enrollmentId&&value.snapshot.messageId===expected.messageId&&isMailboxTimestamp(value.readAtUtc);
}
