import {COACHING_MAILBOX_PROTOCOL,COACHING_MAILBOX_SEND_PROTOCOL,MAILBOX_SUBJECT_LIMIT,canonicalMailboxSubject,isMailboxUuid,validateMailboxSendAcknowledgement,type MailboxSendPayload} from '@/src/modules/communities/contracts/independent-coaching-messages';

export type MailboxDraft=Readonly<{body:string;subject?:string;enrollmentId:string;clientRevision:string}>;
export type MailboxSubmission=Readonly<{payload:MailboxSendPayload;bodySha256:string;subjectSha256?:string;draftSubject?:string;viewerUserId:string;contextKey:string}>;
/** No clock, UUID generator, storage or network effects: revisions are supplied by the editor. */
export function freezeMailboxSubmission(draft:MailboxDraft,input:{requestId:string;bodySha256:string;subjectSha256?:string;viewerUserId:string;contextKey:string}):MailboxSubmission{
 if(!isMailboxUuid(draft.clientRevision)||!isMailboxUuid(input.requestId)||!isMailboxUuid(draft.enrollmentId)||!draft.body.trim()||draft.body.length>20000||!/^[0-9a-f]{64}$/.test(input.bodySha256))throw new Error('Check the message before sending.');
 const fields={intent:'send_mailbox_message' as const,requestId:input.requestId,clientRevision:draft.clientRevision,enrollmentId:draft.enrollmentId,body:draft.body};
 const subject=draft.subject===undefined?undefined:canonicalMailboxSubject(draft.subject);
 if(subject!==undefined&&(!input.subjectSha256||!/^[0-9a-f]{64}$/.test(input.subjectSha256)))throw new Error('The subject could not be verified.');
 const payload:MailboxSendPayload=subject===undefined?Object.freeze({protocol:COACHING_MAILBOX_PROTOCOL,...fields}):Object.freeze({protocol:COACHING_MAILBOX_SEND_PROTOCOL,...fields,subject});
 return Object.freeze({...input,payload,draftSubject:draft.subject});
}
export function mailboxSubmissionAccepted(value:unknown,submission:MailboxSubmission):boolean{return validateMailboxSendAcknowledgement(value,submission);}
export function mailboxDraftAfterAcknowledgement(draft:MailboxDraft,submission:MailboxSubmission,value:unknown,contextKey:string):MailboxDraft{
 if(!mailboxSubmissionAccepted(value,submission)||contextKey!==submission.contextKey||draft.clientRevision!==submission.payload.clientRevision||draft.enrollmentId!==submission.payload.enrollmentId||draft.body!==submission.payload.body||draft.subject!==submission.draftSubject)return draft;
 return {...draft,body:'',...(draft.subject!==undefined?{subject:''}:{})};
}
export function mailboxDraftIsDirty(draft:Pick<MailboxDraft,'body'|'subject'>,uncertain=false){return draft.body.length>0||Boolean(draft.subject?.length)||uncertain;}

export function mailboxReplySubject(value:string|null|undefined):string{
 let base=(value??'').replace(/^(?:\s*re\s*:\s*)+/i,'').trim()||'Coaching message';
 base=base.slice(0,MAILBOX_SUBJECT_LIMIT-4);if(/[\uD800-\uDBFF]$/.test(base))base=base.slice(0,-1);
 return 'Re: '+base;
}
