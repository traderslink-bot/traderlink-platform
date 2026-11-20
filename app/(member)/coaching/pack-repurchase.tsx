'use client';

import {useCallback,useEffect,useRef,useState,type FormEvent} from 'react';
import {useRouter} from 'next/navigation';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {PACK_REPURCHASE_PROTOCOL,isPackFingerprint,validatePackAcknowledgement,validatePackRejection,requirePackEnvelope,packProposalExpectation,packAcceptanceExpectation,type PackStatus} from '@/src/modules/communities/contracts/coaching-pack-repurchase';
import {PLATFORM_MUTATION_REQUEST_HEADER} from '@/src/modules/platform/contracts/platform-request-security';
import {coachingRequiredAccess,COACHING_ACCESS_LABELS} from '@/src/modules/communities/contracts/coaching-required-access';
import {AcceptedServiceDetails} from './accepted-service-details';
import {CoachingStudentReviewPreferences} from '@/app/coaching-student-review-preferences';

type Operation={body:Readonly<Record<string,unknown>>;expected:Parameters<typeof validatePackAcknowledgement>[1]};
function recoveredOperation(raw:string,enrollmentId:string,isCoach:boolean):Operation{
 const stored=JSON.parse(raw) as Partial<Operation>|null,body=stored?.body,expected=stored?.expected;
 if(!body||typeof body!=='object'||Array.isArray(body)||!expected||typeof expected!=='object'||Array.isArray(expected))throw new Error('Unreadable confirmation.');
 requirePackEnvelope(body);
 const kind=body.intent==='propose_pack_repurchase'?'proposed':body.intent==='accept_pack_repurchase'?'accepted':body.intent==='withdraw_pack_repurchase_proposal'?'withdrawn':null;
 if(!kind||expected.kind!==kind||body.enrollmentId!==enrollmentId||expected.enrollmentId!==enrollmentId||expected.requestId!==body.requestId||(isCoach?kind==='accepted':kind!=='accepted'))throw new Error('Unexpected confirmation.');
 if(kind==='proposed')packProposalExpectation(body);else packAcceptanceExpectation(body);
 for(const [left,right] of [['predecessorAgreementId','expectedPredecessorAgreementId'],['predecessorRevision','expectedPredecessorRevision'],['planId','expectedPlanId'],['planRevision','expectedPlanRevision'],['quoteFingerprint','expectedQuoteFingerprint'],['serviceId','serviceId']] as const){if(expected[left]!==body[right])throw new Error('Confirmation binding differs.');}
 if([expected.rootAgreementId,expected.rootServiceId].some(value=>typeof value!=='string'||!value||value.length>200))throw new Error('Missing confirmation history.');
 if(kind!=='proposed'&&(expected.agreementId!==body.agreementId||expected.revision!==body.expectedProposalRevision||expected.proposalFingerprint!==body.expectedProposalFingerprint))throw new Error('Proposal binding differs.');
 return {body,expected};
}
function validStatus(value:unknown,enrollmentId:string,isCoach:boolean):value is PackStatus{
 if(!value||typeof value!=='object')return false;const v=value as Partial<PackStatus>;
 return v.protocol===PACK_REPURCHASE_PROTOCOL&&v.enrollmentId===enrollmentId&&v.isCoach===isCoach&&v.isStudent===!isCoach
  &&(v.quote===null||Boolean(v.quote&&v.quote.expectation.enrollmentId===enrollmentId&&isPackFingerprint(v.quote.expectation.expectedQuoteFingerprint)&&Number.isSafeInteger(v.quote.terms.priceAmountMinor)))
  &&(v.pending===null||Boolean(v.pending&&v.pending.expectation.enrollmentId===enrollmentId&&isPackFingerprint(v.pending.fingerprint)&&v.pending.agreementId===v.pending.expectation.agreementId));
}

/** New-pack controls only. No proposal, checkout, sharing or send occurs on render/GET. */
export function PackRepurchaseCard({enrollmentId,isCoach,viewerUserId}:{enrollmentId:string;isCoach:boolean;viewerUserId:string}){
 const router=useRouter(),[status,setStatus]=useState<PackStatus|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const [quotedPrice,setQuotedPrice]=useState(''),[quoteChanged,setQuoteChanged]=useState(false),[confirmed,setConfirmed]=useState(false),[busy,setBusy]=useState(false),[uncertain,setUncertain]=useState(false),[recoveryError,setRecoveryError]=useState('');
 const mounted=useRef(false),generation=useRef(0),editGeneration=useRef(0),locked=useRef(false),operation=useRef<Operation|null>(null),noticeRef=useRef<HTMLDivElement>(null);
 const recoveryKey=`coaching-pack-confirmation:${viewerUserId}:${enrollmentId}`;
 const retainedRecord=useRef<string|null>(null),dispatched=useRef(false),recoveryBlocked=useRef(true),recoveryUnresolved=useRef(false),recoveryContext=useRef(recoveryKey);
 const checkRecovery=useCallback(()=>{
  try{
   const raw=sessionStorage.getItem(recoveryKey);
   if(raw===null){
    if(operation.current||recoveryUnresolved.current)throw new Error('The original recovery copy is missing.');
    recoveryBlocked.current=false;setRecoveryError('');setUncertain(false);return;
   }
   const stored=recoveredOperation(raw,enrollmentId,isCoach);
   if(dispatched.current&&retainedRecord.current!==null&&raw!==retainedRecord.current)throw new Error('A different confirmation was found.');
   operation.current=stored;retainedRecord.current=raw;dispatched.current=true;recoveryUnresolved.current=true;
   recoveryBlocked.current=false;setRecoveryError('');setUncertain(true);
  }catch{
   recoveryBlocked.current=true;recoveryUnresolved.current=true;setUncertain(true);
   setRecoveryError('The saved confirmation could not be read or verified. New confirmations are paused. Keep this tab open, restore the saved data in this browser, then check saved status again.');
  }
 },[recoveryKey,enrollmentId,isCoach]);
 const load=useCallback(async(price?:string,signal?:AbortSignal)=>{
  const version=++generation.current,editVersion=editGeneration.current;setLoading(true);
  try{
   const q=new URLSearchParams({enrollmentId});if(price)q.set('quotedPrice',price);
   const response=await fetch('/api/coaching/pack-repurchase?'+q,{cache:'no-store',credentials:'same-origin',signal});
   const value=await response.json();if(!response.ok||!validStatus(value,enrollmentId,isCoach))throw new Error(typeof value?.error==='string'?value.error:'The pack terms could not be verified.');
   if(mounted.current&&version===generation.current&&editVersion===editGeneration.current){setStatus(value);setQuoteChanged(false);setConfirmed(false);setError('');}
  }catch(cause){if(mounted.current&&version===generation.current&&!signal?.aborted)setError(cause instanceof Error?cause.message:'Pack details are unavailable.');}
  finally{if(mounted.current&&version===generation.current)setLoading(false);}
 },[enrollmentId,isCoach]);
 useEffect(()=>{
  mounted.current=true;const controller=new AbortController(),counter=generation;
  if(recoveryContext.current!==recoveryKey){operation.current=null;retainedRecord.current=null;dispatched.current=false;recoveryUnresolved.current=false;recoveryContext.current=recoveryKey;}
  checkRecovery();
  void load(undefined,controller.signal);return()=>{mounted.current=false;counter.current++;controller.abort();};
 },[load,checkRecovery,recoveryKey]);
 useEffect(()=>{if(error||notice||recoveryError)noticeRef.current?.focus({preventScroll:true});},[error,notice,recoveryError]);
 async function send(op:Operation){
  if(locked.current)return;locked.current=true;operation.current=op;setBusy(true);setError('');let rejected=false;
  const saved=retainedRecord.current??JSON.stringify(op);retainedRecord.current=saved;
  try{
   const prior=sessionStorage.getItem(recoveryKey);
   if(prior!==null&&prior!==saved)throw new Error('A different recovery copy already exists.');
   if(prior===null)sessionStorage.setItem(recoveryKey,saved);
   if(sessionStorage.getItem(recoveryKey)!==saved)throw new Error('The recovery copy could not be read back.');
   recoveryBlocked.current=false;recoveryUnresolved.current=true;setRecoveryError('');
  }catch{
   recoveryBlocked.current=true;recoveryUnresolved.current=true;setUncertain(true);
   setRecoveryError('No request was sent by this attempt because its saved recovery copy could not be verified. New confirmations are paused. Keep this tab open, restore browser storage, then retry only this same confirmation.');
   locked.current=false;setBusy(false);return;
  }
  try{
   const body=JSON.stringify(op.body);
   dispatched.current=true;
   const response=await fetch('/api/coaching/action',{method:'POST',headers:{'Content-Type':'application/json',[PLATFORM_MUTATION_REQUEST_HEADER]:'1'},credentials:'same-origin',body});
   const value=await response.json();
   if(!response.ok){
    if(response.status===400&&value?.kind==='rejected_pack'){
     const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body));
     const hash=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
     rejected=validatePackRejection(value,op.body,hash);
    }
    throw new Error(typeof value?.error==='string'?value.error:'The pack change could not be confirmed.');
   }
   if(!validatePackAcknowledgement(value,op.expected))throw new Error('The saved confirmation did not match this pack.');
   if(mounted.current){operation.current=null;retainedRecord.current=null;dispatched.current=false;recoveryUnresolved.current=false;try{sessionStorage.removeItem(recoveryKey);}catch{}setUncertain(false);setNotice(value.kind==='proposed'?'The new pack agreement is ready for the student to review.':value.kind==='accepted'?'You accepted this pack. Any service payment is a separate step.':'This unaccepted proposal was withdrawn. Review a fresh quote before preparing another.');await load(quotedPrice||undefined);router.refresh();}
  }catch(cause){if(mounted.current){
   if(rejected){operation.current=null;retainedRecord.current=null;dispatched.current=false;recoveryUnresolved.current=false;try{sessionStorage.removeItem(recoveryKey);}catch{}setConfirmed(false);setUncertain(false);await load(quotedPrice||undefined);}
   else setUncertain(true);
   setError((cause instanceof Error?cause.message:'The save could not be confirmed.')+(rejected?' Review the current terms before a new confirmation.':' Check the saved status or retry this same confirmation; no new request will be created.'));
  }}
  finally{locked.current=false;if(mounted.current)setBusy(false);}
 }
 function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();if(!status||busy||uncertain||loading||!confirmed||recoveryBlocked.current)return;
  const data=new FormData(event.currentTarget),requestId=crypto.randomUUID(),kind=status.pending?(isCoach?'withdrawn':'accepted'):'proposed';
  const p=status.pending,q=status.quote;
  if(kind==='proposed'&&(!q||quoteChanged)||kind!=='proposed'&&!p)return;
  const binding=p?.expectation??q!.expectation,link=p?.terms.packRepurchase;
  const expected:Operation['expected']={requestId,kind,enrollmentId,predecessorAgreementId:binding.expectedPredecessorAgreementId,predecessorRevision:binding.expectedPredecessorRevision,planId:binding.expectedPlanId,planRevision:binding.expectedPlanRevision,quoteFingerprint:binding.expectedQuoteFingerprint,serviceId:binding.serviceId,rootAgreementId:link?.rootAgreementId??q!.rootAgreementId,rootServiceId:link?.rootServiceId??q!.rootServiceId,...(p?{agreementId:p.agreementId,revision:p.revision,proposalFingerprint:p.fingerprint}:{})};
  const intent=kind==='proposed'?'propose_pack_repurchase':kind==='accepted'?'accept_pack_repurchase':'withdraw_pack_repurchase_proposal';
  const body=Object.freeze({protocol:PACK_REPURCHASE_PROTOCOL,requestId,intent,...binding,...(kind==='accepted'?{olderTrades:String(data.get('olderTrades')??'student_only'),...(data.get('earliestTradeDate')?{earliestTradeDate:String(data.get('earliestTradeDate'))}:{})}:{})});
  void send({body,expected});
 }
 const shown=status?.pending?.terms??status?.quote?.terms;
 return <Box component="section" aria-label="Another Trade Review Pack" sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}><Stack spacing={2}>
  <Typography component="h3" variant="h3">Another Trade Review Pack</Typography>
  <Box ref={noticeRef} tabIndex={-1}>{recoveryError||error?<Alert severity="warning">{recoveryError||error}</Alert>:notice?<Alert severity="success">{notice}</Alert>:null}</Box>
  {loading?<Typography role="status">Checking the current pack terms…</Typography>:null}
  {uncertain?<Stack direction={{xs:'column',sm:'row'}} spacing={1}><Button disabled={busy||loading} onClick={()=>{checkRecovery();void load(quotedPrice||undefined);}}>Check saved status</Button><Button disabled={busy||!operation.current} onClick={()=>operation.current&&void send(operation.current)}>Retry same confirmation</Button></Stack>:null}
  {!loading&&!status?<Button onClick={()=>void load()}>Retry loading pack details</Button>:null}
  {status&&!status.isCoach&&!status.pending?<><Typography>Your existing reviews keep their original terms. Ask your coach to prepare a separate pack when you want more reviews.</Typography><Button href="#coaching-pack-message" variant="outlined">Ask your coach in Messages</Button></>:null}
  {status?.isCoach&&status.quoteRequired&&!status.pending?<Stack direction={{xs:'column',sm:'row'}} spacing={1}><TextField label="New pack quoted price" type="number" value={quotedPrice} disabled={busy||uncertain||loading} onChange={e=>{editGeneration.current++;setQuotedPrice(e.target.value);setQuoteChanged(true);setConfirmed(false);}} slotProps={{htmlInput:{min:0,step:'0.01'}}}/><Button disabled={busy||loading||uncertain||!quotedPrice} onClick={()=>void load(quotedPrice)}>Review this quote</Button></Stack>:null}
  {status?.quoteError&&!status.pending?<Typography color="text.secondary">{status.quoteError}</Typography>:null}
  {shown&&(isCoach||status?.pending)?<>
   <Typography>{status?.pending?'Unaccepted proposal':'Current new-pack quote'} · {new Intl.NumberFormat('en-US',{style:'currency',currency:shown.currency}).format(shown.priceAmountMinor/100)}</Typography>
   <AcceptedServiceDetails terms={shown}/>
   <Typography>Journal access needed: {coachingRequiredAccess(shown.items,shown.builderConfig).map(scope=>COACHING_ACCESS_LABELS[scope]).join(' · ')||'No Journal data required'}. Your existing sharing choices are unchanged.</Typography>
   <Typography variant="body2" color="text.secondary">Each pack has its own total reviews. The same daily submission limit applies across these packs. Buying another pack does not reset that daily limit or allow a trade to be reviewed twice.</Typography>
   <Box component="form" onSubmit={submit} data-coaching-pending={busy?'true':'false'}><Box component="fieldset" disabled={busy||uncertain||loading} sx={{border:0,p:0,m:0,minWidth:0}}><Stack spacing={2}>
    {status?.pending&&!isCoach?<CoachingStudentReviewPreferences/>:null}
    <FormControlLabel control={<Checkbox checked={confirmed} disabled={busy||uncertain||loading||quoteChanged} onChange={(_,on)=>setConfirmed(on)} required/>} label={status?.pending?(isCoach?'Withdraw only this exact unaccepted proposal. Existing accepted work and payments stay intact.':'I have reviewed this new pack agreement. Service payment and Journal sharing remain separate.'):'I have reviewed this new pack quote.'}/>
    <Button type="submit" variant="outlined" disabled={!confirmed||busy||uncertain||loading||quoteChanged}>{busy?'Saving…':status?.pending?(isCoach?'Withdraw this proposal':'Accept this new pack'):'Send new pack agreement'}</Button>
   </Stack></Box></Box>
  </>:null}
 </Stack></Box>;
}
