"use client";

import {useCallback,useEffect,useId,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
import {COACHING_DRAFT_DISCARDED,useCoachingDraftNavigation} from '@/app/(dashboard)/communities/coaching-draft-navigation';
import {useCoachingFormReady} from '@/app/coaching-form-readiness';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
import {COACHING_MAILBOX_PROTOCOL,MAILBOX_SUBJECT_LIMIT,canonicalMailboxSubject,isMailboxTimestamp,isMailboxUuid,validateMailboxOpenAcknowledgement,type MailboxBody,type MailboxFolder,type MailboxMessage,type MailboxOpenPayload,type MailboxPage,type MailboxScope} from '@/src/modules/communities/contracts/independent-coaching-messages';
import {freezeMailboxSubmission,mailboxDraftAfterAcknowledgement,mailboxDraftIsDirty,mailboxSubmissionAccepted,mailboxReplySubject,type MailboxDraft,type MailboxSubmission} from './message-mailbox-state';

import {useCoachingPaneReturn} from './coaching-pane-navigation';

type Reader={generation:number;row:MailboxMessage;body:MailboxBody|null;loading:boolean;error:string;readError:string;readSaved:boolean};
function queryFor(scope:MailboxScope){const query=new URLSearchParams({status:scope.status});if(scope.studentId)query.set('studentId',scope.studentId);if(scope.planId)query.set('planId',scope.planId);if(scope.enrollmentId)query.set('enrollmentId',scope.enrollmentId);return query.toString();}
function dateLabel(value:string){return isMailboxTimestamp(value)?`${new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(value))} ET`:value;}
function errorText(value:unknown,fallback:string){return value&&typeof value==='object'&&'error' in value&&typeof value.error==='string'?value.error:fallback;}
async function responseJson(response:Response,fallback:string):Promise<unknown>{
 try{return await response.json();}catch{throw new Error(fallback);}
}
function validSubject(value:unknown){return value===undefined||value===null||typeof value==='string'&&value.length>0&&value.length<=MAILBOX_SUBJECT_LIMIT&&value===value.trim()&&!/[\r\n\u0000]/.test(value);}
function validPage(value:unknown):value is MailboxPage{
 if(!value||typeof value!=='object')return false;
 const p=value as Partial<MailboxPage>;
 return p.available===true&&(p.subjectsAvailable===undefined||typeof p.subjectsAvailable==='boolean')&&isMailboxUuid(p.viewerUserId)&&Array.isArray(p.enrollments)&&p.enrollments.every(e=>isMailboxUuid(e.enrollmentId)&&isMailboxUuid(e.planId)&&typeof e.planName==='string'&&['active','ended'].includes(e.status))&&Array.isArray(p.items)&&p.items.every(m=>isMailboxUuid(m.messageId)&&isMailboxUuid(m.enrollmentId)&&isMailboxUuid(m.senderUserId)&&typeof m.senderName==='string'&&typeof m.preview==='string'&&validSubject(m.subject)&&isMailboxTimestamp(m.createdAtUtc)&&['unread','read','sent','earlier'].includes(m.state))&&Boolean(p.counts)&&['unread','read','sent','earlier'].every(k=>Number.isSafeInteger(p.counts?.[k as keyof MailboxPage['counts']])&&p.counts![k as keyof MailboxPage['counts']]>=0)&&Array.isArray(p.unreadByEnrollment)&&p.unreadByEnrollment.every(e=>isMailboxUuid(e.enrollmentId)&&Number.isSafeInteger(e.unreadMessageCount)&&e.unreadMessageCount>=0)&&(p.nextCursor===null||typeof p.nextCursor==='string')&&p.textBytes===null;
}
async function bodyHash(body:string){const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));return Array.from(new Uint8Array(digest),byte=>byte.toString(16).padStart(2,'0')).join('');}
async function mutate(payload:unknown){return fetch('/api/coaching/action',{method:'POST',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},credentials:'same-origin',body:JSON.stringify(payload)});}

/** One mailbox instance and one draft. No router refresh or generic-form reset can erase it. */
export function IndependentMessageMailbox({scope}:{scope:MailboxScope}){
 const ready=useCoachingFormReady(),id=useId(),scopeQuery=queryFor(scope),contextKey=scopeQuery;
 const recoveryKey=`independent-coaching-mailbox:${contextKey}`;
 const [screen,setScreen]=useState<'list'|'reader'|'compose'>('list'),[composeReturn,setComposeReturn]=useState<'list'|'reader'>('list');
 const [folder,setFolder]=useState<MailboxFolder>('unread'),[earlier,setEarlier]=useState(false),[refresh,setRefresh]=useState(0);
 const [page,setPage]=useState<MailboxPage|null>(null),[list,setList]=useState<{key:string;items:readonly MailboxMessage[];cursor:string|null;error:string}>({key:'',items:[],cursor:null,error:''});
 const [more,setMore]=useState<string|null>(null),[moreError,setMoreError]=useState('');
 const [reader,setReader]=useState<Reader|null>(null),[readAttempt,setReadAttempt]=useState(0),[replyNotice,setReplyNotice]=useState('');
 const [draft,setDraft]=useState<MailboxDraft>({body:'',subject:'',enrollmentId:'',clientRevision:''}),[pending,setPending]=useState(false),[notice,setNotice]=useState<{error:boolean;text:string}|null>(null),[uncertain,setUncertain]=useState(false);
 const draftRef=useRef(draft),submission=useRef<MailboxSubmission|null>(null),busy=useRef(false),mounted=useRef(false),selection=useRef(0),bodyRequest=useRef<AbortController|null>(null),openRequests=useRef(new Map<string,MailboxOpenPayload>()),confirmedReads=useRef(new Set<string>()),listGeneration=useRef(0);
 const listKey=JSON.stringify([scopeQuery,folder,earlier,refresh]),loading=list.key!==listKey;
 const navigation=useCoachingDraftNavigation(id,contextKey+':'+screen),listReturn=useCoachingPaneReturn(id,screen==='list'&&!loading);
 const activePlans=page?.enrollments.filter(e=>e.status==='active')??[],selectedPlan=draft.enrollmentId||(activePlans.length===1?activePlans[0].enrollmentId:'');
 const subject=draft.subject??'',subjectValid=Boolean(subject.trim())&&subject.trim().length<=MAILBOX_SUBJECT_LIMIT&&!/[\r\n\u0000]/.test(subject),subjectsAvailable=page?.subjectsAvailable===true;
 const setCurrentDraft=useCallback((next:MailboxDraft)=>{draftRef.current=next;setDraft(next);try{if(mailboxDraftIsDirty(next))sessionStorage.setItem(recoveryKey,JSON.stringify(next));else sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}},[recoveryKey]);
 useEffect(()=>{try{const raw=sessionStorage.getItem(recoveryKey),saved=raw?JSON.parse(raw) as Partial<MailboxDraft>:null;if(saved&&typeof saved.body==='string'&&typeof saved.subject==='string'&&typeof saved.enrollmentId==='string'&&typeof saved.clientRevision==='string')setCurrentDraft(saved as MailboxDraft);else if(raw)sessionStorage.removeItem(recoveryKey);}catch{/* No browser storage. */}},[recoveryKey,setCurrentDraft]);
 useEffect(()=>{
  mounted.current=true;
  const discard=()=>{if(busy.current)return;submission.current=null;setUncertain(false);setNotice(null);setReplyNotice('');setCurrentDraft({body:'',subject:'',enrollmentId:'',clientRevision:''});};
  document.addEventListener(COACHING_DRAFT_DISCARDED,discard);document.addEventListener('coaching:review-discard',discard);
  return()=>{mounted.current=false;bodyRequest.current?.abort();document.removeEventListener(COACHING_DRAFT_DISCARDED,discard);document.removeEventListener('coaching:review-discard',discard);};
 },[setCurrentDraft]);
 useEffect(()=>{
  const controller=new AbortController(),generation=++listGeneration.current,query=new URLSearchParams(scopeQuery);query.set('folder',folder);if(earlier)query.set('earlier','true');
  fetch(`/api/coaching/messages?${query}`,{cache:'no-store',credentials:'same-origin',signal:controller.signal}).then(async response=>{
   const value=await responseJson(response,'Messages could not be loaded. Please retry.');if(!response.ok)throw new Error(errorText(value,'Messages could not be loaded.'));if(!validPage(value))throw new Error('Messages could not be verified. Please retry.');return value;
  }).then(value=>{if(!controller.signal.aborted&&generation===listGeneration.current){setPage(value);setMoreError('');setList({key:listKey,items:value.items,cursor:value.nextCursor,error:''});window.dispatchEvent(new CustomEvent('coaching:mailbox-unread',{detail:{counts:value.unreadByEnrollment}}));}}).catch(error=>{if(!controller.signal.aborted&&generation===listGeneration.current)setList({key:listKey,items:[],cursor:null,error:error instanceof Error?error.message:'Messages could not be loaded.'});});
  return()=>controller.abort();
 },[scopeQuery,folder,earlier,listKey]);
 async function loadMore(){
  if(more===listKey||!list.cursor||loading)return;const generation=listGeneration.current,cursor=list.cursor,key=listKey,query=new URLSearchParams(scopeQuery);query.set('folder',folder);query.set('cursor',cursor);if(earlier)query.set('earlier','true');setMore(key);setMoreError('');
  try{const response=await fetch(`/api/coaching/messages?${query}`,{cache:'no-store',credentials:'same-origin'}),value=await responseJson(response,'More messages could not be loaded. Please retry.');if(!response.ok||!validPage(value))throw new Error(errorText(value,'More messages could not be loaded.'));if(mounted.current&&generation===listGeneration.current)setList(current=>{const seen=new Set(current.items.map(m=>m.messageId));return {...current,items:[...current.items,...value.items.filter(m=>!seen.has(m.messageId))],cursor:value.nextCursor};});}
  catch(error){if(mounted.current&&generation===listGeneration.current)setMoreError(error instanceof Error?error.message:'More messages could not be loaded.');}
  finally{if(mounted.current)setMore(current=>current===key?null:current);}
 }
 function chooseFolder(next:MailboxFolder,history=false){setScreen('list');setFolder(next);setEarlier(history);selection.current++;bodyRequest.current?.abort();setReader(null);setReplyNotice('');}
 async function openMessage(row:MailboxMessage){
  setScreen('reader');
  const generation=++selection.current;bodyRequest.current?.abort();const controller=new AbortController();bodyRequest.current=controller;
  setReplyNotice('');
  setReader({generation,row,body:null,loading:true,error:'',readError:'',readSaved:false});
  const query=new URLSearchParams(scopeQuery);query.set('messageId',row.messageId);
  try{const response=await fetch(`/api/coaching/messages?${query}`,{cache:'no-store',credentials:'same-origin',signal:controller.signal}),value=await responseJson(response,'This message could not be opened. Please retry.');
   if(!response.ok)throw new Error(errorText(value,'This message could not be opened.'));const body=value as MailboxBody;
   if(!body||body.messageId!==row.messageId||body.enrollmentId!==row.enrollmentId||body.senderUserId!==row.senderUserId||typeof body.body!=='string'||!validSubject(body.subject)||!isMailboxTimestamp(body.createdAtUtc))throw new Error('This message could not be verified.');
   if(mounted.current&&!controller.signal.aborted&&generation===selection.current)setReader(current=>current?.generation===generation?{...current,body,loading:false}:current);
  }catch(error){if(mounted.current&&!controller.signal.aborted&&generation===selection.current)setReader(current=>current?.generation===generation?{...current,loading:false,error:error instanceof Error?error.message:'This message could not be opened.'}:current);}
 }
 const displayedId=reader?.body?.messageId,displayedEnrollment=reader?.body?.enrollmentId,displayedState=reader?.body?.state,displayedGeneration=reader?.generation;
 useEffect(()=>{if(screen==='reader'&&displayedGeneration!==undefined)document.getElementById(`${id}-reader-title`)?.focus({preventScroll:true});},[displayedGeneration,id,screen]);
 useEffect(()=>{
  // This effect runs after the intentionally selected body has committed to the reader.
  if(screen!=='reader'||!displayedId||!displayedEnrollment||displayedState==='sent'||displayedState==='read'||confirmedReads.current.has(displayedId)||displayedGeneration!==selection.current)return;
  const messageId=displayedId,generation=displayedGeneration;
  let live=true,payload=openRequests.current.get(messageId);
  if(!payload){payload=Object.freeze({intent:'open_mailbox_message',protocol:COACHING_MAILBOX_PROTOCOL,requestId:crypto.randomUUID(),enrollmentId:displayedEnrollment,messageId});openRequests.current.set(messageId,payload);}
  const submitted=payload;
  void (async()=>{
   try{if(selection.current!==generation)return;const response=await mutate(submitted),value:unknown=await response.json();if(!response.ok||!validateMailboxOpenAcknowledgement(value,submitted))throw new Error('Read status was not saved.');
    if(mounted.current){confirmedReads.current.add(messageId);setRefresh(v=>v+1);if(live&&selection.current===generation)setReader(current=>current?.generation===generation?{...current,readSaved:true,readError:''}:current);}
   }catch{if(live&&mounted.current&&selection.current===generation)setReader(current=>current?.generation===generation?{...current,readError:'Read status was not saved. Your message is still open.'}:current);}
  })();
  return()=>{live=false;};
 },[displayedId,displayedEnrollment,displayedState,displayedGeneration,readAttempt,screen]);
 async function send(){
  if(!ready||busy.current)return;
  const viewer=page?.viewerUserId;if(!submission.current&&(!viewer||!selectedPlan||!draftRef.current.body.trim()||!subjectsAvailable||!subjectValid))return;
  busy.current=true;setPending(true);setNotice(null);let frozen=submission.current;
  try{
   if(!frozen){const captured={...draftRef.current,enrollmentId:selectedPlan,clientRevision:draftRef.current.clientRevision||crypto.randomUUID()};setCurrentDraft(captured);const [digest,subjectDigest]=await Promise.all([bodyHash(captured.body),bodyHash(canonicalMailboxSubject(captured.subject))]);if(!mounted.current)return;frozen=freezeMailboxSubmission(captured,{requestId:crypto.randomUUID(),bodySha256:digest,subjectSha256:subjectDigest,viewerUserId:viewer!,contextKey});submission.current=frozen;}
   const response=await mutate(frozen.payload);let result:unknown;try{result=await response.json();}catch{throw new Error('Sending could not be confirmed. Retry the previous send to check it safely.');}
   if(!mounted.current)return;
   if(!response.ok)throw new Error(errorText(result,'Sending could not be confirmed. Retry the previous send.'));
   if(!mailboxSubmissionAccepted(result,frozen))throw new Error('Sending could not be confirmed. Retry the previous send to check it safely.');
   const remainingDraft=mailboxDraftAfterAcknowledgement(draftRef.current,frozen,result,contextKey);setCurrentDraft(remainingDraft);submission.current=null;setUncertain(false);setNotice({error:false,text:remainingDraft.body||remainingDraft.subject?'Your previous message was sent. Your current draft has not been sent.':'Message sent. It is available in Sent.'});setRefresh(v=>v+1);
  }catch(error){if(mounted.current){setUncertain(Boolean(submission.current));setNotice({error:true,text:error instanceof Error?error.message:'The message could not be sent. Your draft is kept.'});}}
  finally{busy.current=false;if(mounted.current)setPending(false);}
 }
 const planName=(enrollmentId:string)=>page?.enrollments.find(e=>e.enrollmentId===enrollmentId)?.planName??'Coaching plan';
 function focusComposer(){setScreen('compose');}
 function change(action:()=>void){if(busy.current)return;navigation.requestChange(action);}
 function backToList(){change(()=>{selection.current++;bodyRequest.current?.abort();listReturn.restoreList();setScreen('list');});}
 useEffect(()=>{if(screen!=='compose')return;const frame=requestAnimationFrame(()=>document.getElementById(id+'-message-subject')?.focus({preventScroll:true}));return()=>cancelAnimationFrame(frame);},[screen,id]);
 function replyTo(row:MailboxMessage){
  setComposeReturn('reader');
  const original=page?.enrollments.find(e=>e.enrollmentId===row.enrollmentId);
  if(!original||original.status!=='active'){setReplyNotice('This plan is no longer active. Its history is read-only; no reply was moved to another plan.');return;}
  if(busy.current||submission.current||uncertain){setReplyNotice('Resolve the previous send before replying. Its request and your current draft are kept.');focusComposer();return;}
  const current=draftRef.current,currentPlan=current.enrollmentId||selectedPlan;
  if(mailboxDraftIsDirty(current)&&currentPlan!==row.enrollmentId){setReplyNotice(`Your draft is for ${planName(currentPlan)}. Finish or explicitly discard it before replying in ${original.planName}. Your text and selected plan are unchanged.`);focusComposer();return;}
  setCurrentDraft({...current,enrollmentId:row.enrollmentId,subject:current.body.length||current.subject?.length?current.subject:mailboxReplySubject(row.subject),clientRevision:crypto.randomUUID()});
  setReplyNotice(`Replying in ${original.planName}.`);focusComposer();
 }
 return <CoachingReviewDraftGuard title="Unsaved message" description={uncertain?'The previous send is unconfirmed. Discarding leaves its result unverified and removes the local draft.':'Your draft has not been sent. Keep editing, or discard it before leaving.'}>
  <Stack id={id} spacing={3} data-coaching-unsaved={mailboxDraftIsDirty(draft,uncertain)?'true':'false'} data-coaching-pending={pending?'true':'false'}>
   {screen==='list'?<>
    <Stack direction="row" sx={{gap:1,justifyContent:'flex-end',alignItems:'center',flexWrap:'wrap'}}>
     <Button id={id+'-new-message'} variant="contained" disabled={!ready||pending||!page||!activePlans.length||!subjectsAvailable} onClick={()=>change(()=>{listReturn.rememberList(id+'-new-message');setComposeReturn('list');setReplyNotice('');setScreen('compose');})}>New message</Button>
    </Stack>
    {scope.planId&&scope.studentId?<Box><Button size="small" href={'/coaching/students#'+new URLSearchParams({student:scope.studentId,section:'messages'})}>All plans for this student</Button></Box>:null}
    <Tabs value={folder} onChange={(_,value:MailboxFolder)=>change(()=>chooseFolder(value))} aria-label="Message folders" variant="fullWidth">{(['unread','read','sent'] as const).map(value=><Tab key={value} id={id+'-'+value} data-coaching-list-fallback={folder===value?true:undefined} aria-controls={id+'-folder'} value={value} label={value[0].toUpperCase()+value.slice(1)+(page?' ('+page.counts[value]+')':'')}/>)}</Tabs>
    {folder==='read'&&page?<Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button size="small" variant={!earlier?'contained':'outlined'} onClick={()=>change(()=>chooseFolder('read'))}>Read messages</Button><Button size="small" variant={earlier?'contained':'outlined'} onClick={()=>change(()=>chooseFolder('read',true))}>Earlier messages ({page.counts.earlier})</Button></Stack>:null}
    {earlier?<Alert severity="info">Read status was not tracked for these earlier messages. Opening one now saves its first actual read time.</Alert>:null}
    {page&&!activePlans.length?<Typography variant="body2" color="text.secondary">Past coaching is read-only. You can open existing messages.</Typography>:null}
    {page&&activePlans.length>0&&!subjectsAvailable?<Alert severity="info">New messages are temporarily unavailable. Existing messages are still readable.</Alert>:null}
    <Box role="tabpanel" id={id+'-folder'} aria-labelledby={id+'-'+folder}>
     {loading?<Typography role="status">Loading messages…</Typography>:list.error?<Alert severity="warning" action={<Button onClick={()=>setRefresh(v=>v+1)}>Retry</Button>}>{list.error}</Alert>:<>
      <Box component="ul" sx={{listStyle:'none',m:0,p:0}}>{list.items.map(row=><Box component="li" key={row.messageId} sx={{borderBottom:1,borderColor:'divider'}}>
       <Button id={id+'-message-'+row.messageId} aria-pressed={reader?.row.messageId===row.messageId} variant="text" onClick={()=>change(()=>{listReturn.rememberList(id+'-message-'+row.messageId);void openMessage(row);})} sx={{display:'block',width:'100%',textAlign:'left',py:2,px:1,borderRadius:0,bgcolor:reader?.row.messageId===row.messageId?'action.selected':'transparent'}}>
        <Box component="span" sx={{display:'flex',justifyContent:'space-between',gap:1,flexWrap:'wrap'}}>
         <Typography component="span" sx={{fontWeight:row.state==='unread'?700:500,overflowWrap:'anywhere'}}>{row.subject||'No subject'}</Typography>
         <Typography component="span" variant="caption" color="text.secondary">{dateLabel(row.createdAtUtc)}</Typography>
        </Box>
        <Typography component="span" variant="body2" color="text.primary" sx={{display:'block',mt:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontWeight:row.state==='unread'?700:400}}>{row.preview||'Open message'}</Typography>
        <Typography component="span" variant="caption" color="text.secondary" sx={{display:'block',mt:.5}}>{planName(row.enrollmentId)} · {row.state==='unread'?'Unread':row.state==='sent'?'Sent':row.state==='earlier'?'Earlier message':'Read'}</Typography>
       </Button>
      </Box>)}</Box>
      {!list.items.length?<Typography color="text.secondary">{earlier?'No earlier messages.':folder==='unread'?'No unread messages. Choose Read or Sent to see other messages.':folder==='read'?'No messages marked read yet.':'No sent messages yet.'}</Typography>:null}
      {list.cursor?<Box sx={{mt:2}}><Button onClick={()=>void loadMore()} disabled={more===listKey}>{more===listKey?'Loading…':'Load more messages'}</Button></Box>:null}
      {moreError?<Alert severity="warning">{moreError}</Alert>:null}
     </>}
    </Box>
   </>:screen==='reader'?<>
    <Box><Button disabled={pending} onClick={backToList} variant="outlined">Back to messages</Button></Box>
    {reader?<Box component="article" aria-label="Message detail"><Stack spacing={3}>
     <Box><Typography id={id+'-reader-title'} tabIndex={-1} component="h3" variant="h3" sx={{overflowWrap:'anywhere'}}>{reader.row.subject||'No subject'}</Typography><Typography variant="body2" color="text.secondary">{planName(reader.row.enrollmentId)} · {reader.row.state==='sent'?'Sent message':'Received message'} · {dateLabel(reader.row.createdAtUtc)}</Typography></Box>
     {reader.loading?<Typography role="status">Opening message…</Typography>:reader.error?<Alert severity="warning" action={<Button onClick={()=>void openMessage(reader.row)}>Retry</Button>}>{reader.error}</Alert>:reader.body?<>
      <Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{reader.body.body}</Typography>
      {page&&reader.row.senderUserId!==page.viewerUserId?<Box><Button variant="outlined" onClick={()=>replyTo(reader.row)} disabled={pending||!subjectsAvailable||!page.enrollments.some(e=>e.enrollmentId===reader.row.enrollmentId&&e.status==='active')}>Reply</Button>{!page.enrollments.some(e=>e.enrollmentId===reader.row.enrollmentId&&e.status==='active')?<Typography variant="body2" color="text.secondary" sx={{mt:1}}>This plan is no longer active. Its history is read-only.</Typography>:null}</Box>:null}
      {reader.readSaved?<Typography variant="caption">Read</Typography>:null}
      {reader.readError?<Alert severity="warning" action={<Button onClick={()=>setReadAttempt(v=>v+1)}>Retry</Button>}>{reader.readError}</Alert>:null}
      {replyNotice?<Alert severity="info">{replyNotice}</Alert>:null}
     </>:null}
    </Stack></Box>:<Typography>This message is unavailable.</Typography>}
   </>:<>
    <Box><Button disabled={pending} variant="outlined" onClick={()=>composeReturn==='reader'&&reader?change(()=>setScreen('reader')):backToList()}>{composeReturn==='reader'&&reader?'Back to message':'Back to messages'}</Button></Box>
    <Typography component="h3" variant="h3">{composeReturn==='reader'?'Reply':'New message'}</Typography>
    <Box component="form" data-coaching-controlled-draft data-coaching-unsaved={mailboxDraftIsDirty(draft,uncertain)?'true':'false'} data-coaching-pending={pending?'true':'false'} onSubmit={event=>{event.preventDefault();void send();}}>
     <Stack spacing={2}>
      {replyNotice?<Alert severity="info" role="status">{replyNotice}</Alert>:null}
      {page&&!activePlans.length?<Alert severity="info">This is earlier coaching history. New messages require an active plan.</Alert>:null}
      <TextField select label="Plan" size="small" value={selectedPlan} disabled={pending||!page||!activePlans.length||composeReturn==='reader'} onChange={event=>setCurrentDraft({...draftRef.current,enrollmentId:event.target.value,clientRevision:crypto.randomUUID()})} sx={{width:'100%',maxWidth:440}}><MenuItem value="">Choose a plan</MenuItem>{activePlans.map(e=><MenuItem key={e.enrollmentId} value={e.enrollmentId}>{e.planName}</MenuItem>)}</TextField>
      <TextField id={id+'-message-subject'} label="Subject" required value={subject} disabled={pending||!page||!activePlans.length||!subjectsAvailable} onChange={event=>setCurrentDraft({...draftRef.current,enrollmentId:selectedPlan,subject:event.target.value,clientRevision:crypto.randomUUID()})} helperText={subject.length+' / '+MAILBOX_SUBJECT_LIMIT+' characters'} error={subject.length>0&&!subjectValid} slotProps={{htmlInput:{maxLength:MAILBOX_SUBJECT_LIMIT}}} fullWidth/>
      <TextField id={id+'-message-body'} label="Message" multiline minRows={10} maxRows={24} value={draft.body} disabled={pending||!page||!activePlans.length||!subjectsAvailable} onChange={event=>setCurrentDraft({...draftRef.current,enrollmentId:selectedPlan,body:event.target.value,clientRevision:crypto.randomUUID()})} helperText={draft.body.length.toLocaleString()+' / 20,000 characters'} error={draft.body.length>20000} fullWidth/>
      {uncertain?<Alert severity="warning">The previous send is unconfirmed. Retry checks that exact message without sending it twice. Newer text stays in this composer.</Alert>:null}
      {notice?<Alert severity={notice.error?'error':'success'} role="status">{notice.text}</Alert>:null}
      <Box><Button type="submit" variant="contained" disabled={!ready||pending||(!uncertain&&(!page||!selectedPlan||!draft.body.trim()||draft.body.length>20000||!subjectsAvailable||!subjectValid))}>{pending?'Sending…':uncertain?'Retry previous send':'Send message'}</Button></Box>
     </Stack>
    </Box>
   </>}
   {navigation.confirmation}
  </Stack>
 </CoachingReviewDraftGuard>;
}
