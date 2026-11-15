"use client";
import type {TradeEvaluationTemplate} from '@/src/modules/communities/contracts/coaching-trade-evaluation';
import {useCoachingFormReady} from '@/app/coaching-form-readiness';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
import {useCallback,useEffect,useLayoutEffect,useRef,useState,type ReactNode} from 'react';
import {useReviewAutosaveScope} from './review-autosave';
import {useRouter} from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
import type {CoachingReviewFocus} from '@/src/modules/communities/contracts/coaching-review-workspace';
import type {IndependentCoachingFeedbackAcknowledgement} from '@/src/modules/communities/contracts/independent-coaching';
import {INDEPENDENT_FEEDBACK_ACK_ERROR,isIndependentFeedbackRejection,isIndependentFeedbackIntent,validateIndependentFeedbackAcknowledgement,canonicalIndependentFeedback,independentFeedbackValue} from '@/src/modules/communities/contracts/independent-coaching-review-baseline';

async function browserFeedbackHash(content:string):Promise<string>{
 try{const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(content)));return Array.from(bytes,value=>value.toString(16).padStart(2,'0')).join('');}
 catch{throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);}
}
function formPayload(element:HTMLFormElement,hidden:Record<string,string>,intent:string):Record<string,unknown>{
 const form=new FormData(element),data:Record<string,unknown>={...hidden,intent};
 for(const key of new Set(form.keys())){const values=form.getAll(key);data[key]=values.length>1?values:values[0];}return data;
}
function ManualIndependentCoachingForm({intent,label,children,hidden={},onSaved,onFeedbackSaved,feedbackFocus=[],feedbackTemplate,disabled=false,guard=true,onPendingChange,unsavedChanges,onBodyCommitted,refreshOnSave=true,showSuccessMessage=true}:{intent:string;label:string;children?:ReactNode;hidden?:Record<string,string>;onSaved?:()=>void;onFeedbackSaved?:(ack:IndependentCoachingFeedbackAcknowledgement,submitted:Readonly<Record<string,unknown>>,unchanged:boolean)=>void;feedbackFocus?:readonly CoachingReviewFocus[];feedbackTemplate?:TradeEvaluationTemplate;disabled?:boolean;guard?:boolean;onPendingChange?:(pending:boolean)=>void;unsavedChanges?:boolean;onBodyCommitted?:()=>void;refreshOnSave?:boolean;showSuccessMessage?:boolean}){
 const requestId=useRef<string|null>(null),requestPayload=useRef<string|null>(null),hydrated=useCoachingFormReady();
 const mounted=useRef(false),busy=useRef(false),attempt=useRef(0),generation=useRef<object>({}),edits=useRef(0),latestHidden=useRef(hidden),pendingCallback=useRef(onPendingChange);
 const router=useRouter(),[dirty,setDirty]=useState(false),[pending,setPending]=useState(false),[message,setMessage]=useState('');
 const identity=`${intent}:${hidden.reviewId??''}:${hidden.roundTripId??''}`;
 const tracksBody=['answer_question','ask_question','reply_review','save_student_goals','save_student_notes'].includes(intent);
 const bodyEntity=JSON.stringify([intent,hidden.enrollmentId??'',hidden.questionId??'',hidden.reviewId??'',hidden.roundTripId??'',hidden.workId??'']);
 const bodyRecoveryKey=`independent-coaching-body:${bodyEntity}`;
 const bodyBaseline=useRef<{form:HTMLFormElement;field:HTMLTextAreaElement|null;entity:string;value:string|null}|null>(null);
 const bindBodyForm=useCallback((element:HTMLFormElement|null)=>{
  if(!element||!tracksBody)return;
  const field=element.querySelector<HTMLTextAreaElement>('textarea[name="body"]'),previous=bodyBaseline.current;
  if(previous?.form===element&&previous.field===field&&previous.entity===bodyEntity)return;
  const value=previous?.form===element?null:field?.value??null;
  if(field&&value!==null)field.value=value;
  bodyBaseline.current={form:element,field,entity:bodyEntity,value};
  if(field&&value!==null){
   try{
    const raw=sessionStorage.getItem(bodyRecoveryKey),saved=raw?JSON.parse(raw) as {baseline?:unknown;value?:unknown}:null;
    if(saved?.baseline===value&&typeof saved.value==='string'){field.value=saved.value;setDirty(saved.value!==value);}
    else if(raw)sessionStorage.removeItem(bodyRecoveryKey);
   }catch{/* Draft recovery is optional; the navigation guard still protects the form. */}
  }
 },[bodyEntity,bodyRecoveryKey,tracksBody]);
 useEffect(()=>{if(!tracksBody)return;const discard=()=>{try{sessionStorage.removeItem(bodyRecoveryKey);}catch{/* No browser storage. */}};document.addEventListener('coaching:review-discard',discard);return()=>document.removeEventListener('coaching:review-discard',discard);},[bodyRecoveryKey,tracksBody]);
 useEffect(()=>{latestHidden.current=hidden;pendingCallback.current=onPendingChange;},[hidden,onPendingChange]);
 useEffect(()=>{
  generation.current={};mounted.current=true;
  return()=>{mounted.current=false;if(busy.current){busy.current=false;pendingCallback.current?.(false);}};
 },[identity]);
 const markDirty=(element:HTMLFormElement)=>{
  edits.current++;
  const body=tracksBody?element.querySelector<HTMLTextAreaElement>('textarea[name="body"]'):null,baseline=bodyBaseline.current;
  setDirty(intent==='send_message'?new FormData(element).get('body')!=='':body&&baseline&&baseline.form===element&&baseline.field===body&&baseline.entity===bodyEntity&&baseline.value!==null?body.value!==baseline.value:true);
  if(body&&baseline?.value!==null&&baseline?.value!==undefined){try{if(body.value===baseline.value)sessionStorage.removeItem(bodyRecoveryKey);else sessionStorage.setItem(bodyRecoveryKey,JSON.stringify({baseline:baseline.value,value:body.value}));}catch{/* No browser storage. */}}
  requestId.current=null;
 };
 const form=<Box component="form" ref={bindBodyForm} method="post" data-coaching-controlled-draft data-coaching-unsaved={(unsavedChanges??dirty)?'true':'false'} data-coaching-pending={pending?'true':'false'} onClickCapture={event=>{if(event.target instanceof Element&&event.target.closest('[data-coaching-edit]'))markDirty(event.currentTarget);}} onChange={event=>markDirty(event.currentTarget)} onSubmit={async event=>{
  event.preventDefault();if(!hydrated||busy.current||disabled)return;
  busy.current=true;setPending(true);onPendingChange?.(true);setMessage('');
  const element=event.currentTarget,sequence=++attempt.current,scope=generation.current,revision=edits.current,guarded=isIndependentFeedbackIntent(intent);
  const bodyScope=bodyBaseline.current;
  const current=()=>mounted.current&&generation.current===scope&&attempt.current===sequence&&element.isConnected;
  try{
   const data=formPayload(element,hidden,intent),payload=JSON.stringify(data);
   if(requestPayload.current!==payload){requestId.current=crypto.randomUUID();requestPayload.current=payload;}else requestId.current??=crypto.randomUUID();
   const submitted=Object.freeze(JSON.parse(JSON.stringify({...data,requestId:requestId.current}))) as Readonly<Record<string,unknown>>;
   if(guarded&&!onFeedbackSaved)throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);
   const response=await fetch('/api/coaching/action',{method:'POST',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:JSON.stringify(submitted),credentials:'same-origin'});
   const result:unknown=await response.json();if(!current())return;
   const record=result&&typeof result==='object'&&!Array.isArray(result)?result as Record<string,unknown>:{};
   if(!response.ok)throw new Error(typeof record.error==='string'?record.error:'Changes could not be saved.');
   if(guarded){
    const ack=await validateIndependentFeedbackAcknowledgement(result,submitted,browserFeedbackHash,feedbackFocus,feedbackTemplate);if(!current())return;
    const unchanged=edits.current===revision&&JSON.stringify(formPayload(element,latestHidden.current,intent))===payload;
    onFeedbackSaved!(ack,submitted,unchanged);
    requestId.current=null;requestPayload.current=null;
    if(!unchanged){setDirty(true);setMessage('');return;}
   }else{
    let resetBody:HTMLTextAreaElement|null=null;
    if(tracksBody){
     if(!bodyScope){setDirty(true);return;}
     if(bodyBaseline.current!==bodyScope||bodyScope.form!==element||bodyScope.entity!==bodyEntity)return;
     const body=element.querySelector<HTMLTextAreaElement>('textarea[name="body"]');
     if(!body||bodyScope.field!==body||bodyScope.value===null||typeof submitted.body!=='string'){setDirty(true);return;}
     onBodyCommitted?.();
     const resets=intent==='ask_question'||intent==='reply_review';
     if(!resets)bodyScope.value=submitted.body;
     if(body.value!==submitted.body&&(!resets||body.value!==bodyScope.value)){
      requestId.current=null;requestPayload.current=null;setDirty(true);setMessage('');return;
     }
     if(resets)resetBody=body;
    try{sessionStorage.removeItem(bodyRecoveryKey);}catch{/* No browser storage. */}
    }
    if(['send_message','ask_question','reply_review'].includes(intent))element.reset();
    if(resetBody&&bodyScope){const value=resetBody.value;resetBody.value=value;bodyScope.value=value;}
    requestId.current=null;requestPayload.current=null;
   }
   setDirty(false);setMessage('Saved.');if(!guarded)onSaved?.();if(refreshOnSave)window.dispatchEvent(new CustomEvent('coaching-saved',{detail:{intent}}));
   if(!guarded&&typeof record.href==='string'){
    const url=new URL(record.href,window.location.origin);if(url.origin===window.location.origin)router.push(url.pathname+url.search+url.hash);else if(url.protocol==='https:'&&(url.hostname==='whop.com'||url.hostname.endsWith('.whop.com')))window.location.assign(url.href);else throw new Error('The payment destination could not be verified.');
   }else if(refreshOnSave)router.refresh();
  }catch(error){if(current()){if(guarded)setDirty(true);setMessage(error instanceof Error?error.message:'Changes could not be saved.');}}
  finally{if(current()){busy.current=false;setPending(false);onPendingChange?.(false);}}
 }}><Stack spacing={2}><Box component="fieldset" disabled={!hydrated||pending} sx={{border:0,m:0,p:0,minWidth:0}}><Stack spacing={2}>{children}</Stack></Box>{message&&(showSuccessMessage||message!=='Saved.')?<Alert severity={message==='Saved.'?'success':'error'} role="status">{message}</Alert>:null}<Box><Button type="submit" variant="contained" disabled={!hydrated||pending||disabled}>{pending?'Saving…':label}</Button></Box></Stack></Box>;
 return guard?<CoachingReviewDraftGuard title="Unsaved changes" description="Save your changes before leaving, or discard them.">{form}</CoachingReviewDraftGuard>:form;
}


type CoachingFormProps=Parameters<typeof ManualIndependentCoachingForm>[0]&{autoSave?:boolean;reviewStatusAtStart?:boolean};
export function IndependentCoachingForm(props:CoachingFormProps){
 return props.autoSave?<ReviewAutosaveForm key={`${props.intent}:${props.hidden?.reviewId??''}:${props.hidden?.roundTripId??''}`} {...props}/>:<ManualIndependentCoachingForm {...props}/>;
}

/** Review-only mode. Manual forms above retain their original pending and receipt behavior. */
function ReviewAutosaveForm(props:CoachingFormProps){
 const {children,reviewStatusAtStart=false,intent,hidden={},feedbackFocus=[],feedbackTemplate,onFeedbackSaved,onPendingChange,disabled=false}=props;
 const scope=useReviewAutosaveScope(),hydrated=useCoachingFormReady(),form=useRef<HTMLFormElement>(null);
 const identity=`${intent}:${hidden.reviewId??''}:${hidden.roundTripId??''}`;
 const keyOf=(values:Record<string,string>)=>canonicalIndependentFeedback(independentFeedbackValue(values.feedback??values.draft??'{}'));
 const contentKey=keyOf(hidden),saved=useRef(contentKey),fingerprint=useRef(hidden.expectedFingerprint??'');
 const [savedKey,setSavedKey]=useState(contentKey),[pending,setPending]=useState(false),[error,setError]=useState('');
 const latest=useRef({hidden,feedbackFocus,feedbackTemplate,onFeedbackSaved,onPendingChange,disabled,hydrated});
 const attemptGeneration=useRef(0);
 const alive=useRef(false),pendingNotified=useRef(false),busy=useRef<Promise<void>|null>(null),failure=useRef(''),uncertain=useRef<Readonly<Record<string,unknown>>|null>(null),idle=useRef<ReturnType<typeof setTimeout>|null>(null);
 const dirty=contentKey!==savedKey;
 useLayoutEffect(()=>{latest.current={hidden,feedbackFocus,feedbackTemplate,onFeedbackSaved,onPendingChange,disabled,hydrated};});
 const stopTimer=()=>{if(idle.current!==null){clearTimeout(idle.current);idle.current=null;}};
 const publish=(pendingNow:boolean,errorNow:string)=>scope?.update(identity,{dirty:keyOf(latest.current.hidden)!==saved.current,pending:pendingNow,error:errorNow});
 const committedInput=()=>new Promise<void>(resolve=>setTimeout(resolve,0));
 const saveSnapshot=()=>{
  if(busy.current)return busy.current;
  const state=latest.current,submittedGeneration=attemptGeneration.current;
  if(!alive.current||!state.hydrated||!form.current) return Promise.reject(new Error('The review editor is still loading.'));
  if(state.disabled)return Promise.reject(new Error('Finish the current image selection or check Journal access before continuing.'));
  if(!['save_review','save_review_trade'].includes(intent)||!state.onFeedbackSaved)return Promise.reject(new Error('This draft cannot be autosaved.'));
  const submitted=uncertain.current??Object.freeze(JSON.parse(JSON.stringify({...formPayload(form.current,{...state.hidden,expectedFingerprint:fingerprint.current},intent),requestId:crypto.randomUUID()}))) as Readonly<Record<string,unknown>>;
  uncertain.current=submitted;
  const submittedKey=keyOf({feedback:typeof submitted.feedback==='string'?submitted.feedback:typeof submitted.draft==='string'?submitted.draft:'{}'});
  setPending(true);setError('');failure.current='';pendingNotified.current=true;state.onPendingChange?.(true);publish(true,'');
  const operation=(async()=>{
   try{
    const submittedBody=JSON.stringify(submitted);
    const response=await fetch('/api/coaching/action',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},body:submittedBody});
    const result:unknown=await response.json();
    if(!alive.current||attemptGeneration.current!==submittedGeneration)throw new Error('The review editor closed before saving was confirmed.');
    if(!response.ok){
     if(response.status===400&&await isIndependentFeedbackRejection(result,submitted,submittedBody,browserFeedbackHash)&&alive.current&&attemptGeneration.current===submittedGeneration&&uncertain.current===submitted)uncertain.current=null;
     const record=result&&typeof result==='object'?result as Record<string,unknown>:{};throw new Error(typeof record.error==='string'?record.error:'Your feedback could not be saved.');
    }
    const ack=await validateIndependentFeedbackAcknowledgement(result,submitted,browserFeedbackHash,state.feedbackFocus,state.feedbackTemplate);
    if(!alive.current||attemptGeneration.current!==submittedGeneration)throw new Error('The review editor closed before saving was confirmed.');
    if(ack.kind!=='trade'&&ack.kind!=='review')throw new Error(INDEPENDENT_FEEDBACK_ACK_ERROR);
    const unchanged=keyOf(latest.current.hidden)===submittedKey;
    fingerprint.current=ack.fingerprint;saved.current=submittedKey;setSavedKey(submittedKey);
    latest.current.onFeedbackSaved?.(ack,submitted,unchanged);
    uncertain.current=null;failure.current='';setError('');publish(false,'');
   }catch(cause){const message=cause instanceof Error?cause.message:'Your feedback could not be saved.';failure.current=message;if(alive.current){setError(message);publish(false,message);}throw cause;}
   finally{busy.current=null;if(alive.current){setPending(false);if(pendingNotified.current){pendingNotified.current=false;latest.current.onPendingChange?.(false);}}}
  })();
  busy.current=operation;return operation;
 };
 const flush=async(retry=false)=>{
  stopTimer();await committedInput();
  if(busy.current)await busy.current;
  if(failure.current&&!retry)throw new Error(failure.current);
  while(uncertain.current||keyOf(latest.current.hidden)!==saved.current){
   await committedInput();if(!alive.current)throw new Error('The review editor closed.');
   if(failure.current&&!retry)throw new Error(failure.current);
   await saveSnapshot();retry=false;
  }
  publish(false,'');
 };
 const currentFlush=useRef(flush);useLayoutEffect(()=>{currentFlush.current=flush;});
 useEffect(()=>{const counter=attemptGeneration;alive.current=true;counter.current++;const unregister=scope?.register(identity,{flush:()=>currentFlush.current()});return()=>{alive.current=false;counter.current++;stopTimer();if(busy.current&&pendingNotified.current){pendingNotified.current=false;latest.current.onPendingChange?.(false);}unregister?.();};},[scope,identity]);
 useEffect(()=>{scope?.update(identity,{dirty,pending,error});},[scope,identity,dirty,pending,error]);
 useEffect(()=>{
  stopTimer();if(!dirty||pending||error||disabled||!hydrated)return;
  idle.current=setTimeout(()=>{void currentFlush.current().catch(()=>{});},700);
  return stopTimer;
 },[contentKey,dirty,pending,error,disabled,hydrated]);
 return <Box component="form" ref={form} data-coaching-controlled-draft data-coaching-autosave="true" data-coaching-unsaved={dirty?'true':'false'} data-coaching-pending={pending?'true':'false'} onSubmit={event=>{event.preventDefault();void flush(Boolean(error)).catch(()=>{});}} onClickCapture={event=>{if(event.target instanceof Element&&event.target.closest('[data-coaching-edit], [role="option"]'))void currentFlush.current().catch(()=>{});}} onChangeCapture={event=>{if(event.target instanceof HTMLInputElement&&['checkbox','radio','hidden'].includes(event.target.type))void currentFlush.current().catch(()=>{});}} onBlurCapture={event=>{if(event.target instanceof HTMLInputElement||event.target instanceof HTMLTextAreaElement||event.target instanceof HTMLSelectElement)void currentFlush.current().catch(()=>{});}}>
  <Stack spacing={2}>
   {reviewStatusAtStart?error?<Alert severity="error" role="status" action={<Button onClick={()=>void flush(true).catch(()=>{})} disabled={pending}>Retry</Button>}>Couldn’t save. {error} Your text is retained.</Alert>:pending||dirty?<Typography role="status" aria-live="polite" variant="body2" color="text.secondary">Saving…</Typography>:null:null}
   {children}
   {!reviewStatusAtStart?error?<Alert severity="error" role="status" action={<Button onClick={()=>void flush(true).catch(()=>{})} disabled={pending}>Retry</Button>}>Couldn’t save. {error} Your text is retained.</Alert>:<Typography role="status" aria-live="polite" variant="body2" color="text.secondary">{pending||dirty?'Saving…':'Saved'}</Typography>:null}
  </Stack>
 </Box>;
}
