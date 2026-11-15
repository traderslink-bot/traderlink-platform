"use client";
import {useEffect,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import {IndependentCoachingForm} from './coaching-form';
import {CoachingReviewDraftGuard} from '@/app/(dashboard)/communities/coaching-review-draft-guard';
import {COACHING_DRAFT_DISCARDED} from '@/app/(dashboard)/communities/coaching-draft-navigation';
import {committedNotesRevision,easternLocalValue,easternTimeCandidates,restoredEasternTime,savedHttpsUrl,type SidecardEnrollment,type SidecardWork} from './student-sidecard-model';

type Fields={title:string;description:string;url:string;assignedTo:string;status:string;localDue:string;chosenUtc:string;body:string};
type Capture={fields:Fields;revision:number;dueAtUtc:string|null;expectedRevision:number;committedNoteRevision:number;hadEditorFocus:boolean};
export type StudentSidecardConfirmation={enrollmentId:string;work?:SidecardWork;notes?:{body:string;revision:number};taskCount?:number;unchanged?:boolean;returnFocus?:boolean};
function fieldsFor(work:SidecardWork|undefined,body:string):Fields{return {title:String(work?.data.title??''),description:String(work?.data.description??''),url:String(work?.data.url??''),assignedTo:String(work?.data.assignedTo??'student'),status:work?.status??'open',localDue:easternLocalValue(work?.dueAtUtc??null),chosenUtc:work?.dueAtUtc??'',body};}
/** Local saved-baseline confirmation; it never refreshes/remounts the whole student drawer. */
export function StudentSidecardEditor({studentId,enrollment,work,question,note=false,lessonManagement=false,canManage=enrollment.status==='active',onConfirmed,onPendingChange}:{studentId:string;enrollment:SidecardEnrollment;work?:SidecardWork;question?:{questionId:string;body:string;answer:string|null};note?:boolean;lessonManagement?:boolean;canManage?:boolean;onConfirmed?:(value:StudentSidecardConfirmation)=>void;onPendingChange?:(pending:boolean)=>void}){
 const [fields,setFields]=useState(()=>fieldsFor(work,note?enrollment.studentContext?.notes?.body??'':question?.answer??'')),[baseline,setBaseline]=useState(fields),[noteRevision,setNoteRevision]=useState(enrollment.studentContext?.notes?.revision??0),[savedWork,setSavedWork]=useState(work);
 const [mutating,setMutating]=useState(false),[confirming,setConfirming]=useState(false),[error,setError]=useState(''),[saved,setSaved]=useState(false),[unconfirmed,setUnconfirmed]=useState(false);
 useEffect(()=>{onPendingChange?.(mutating||confirming);},[onPendingChange,mutating,confirming]);
 useEffect(()=>()=>onPendingChange?.(false),[onPendingChange]);
 const fieldsRef=useRef(fields),baselineRef=useRef(fields),root=useRef<HTMLDivElement|null>(null),editRevision=useRef(0),captured=useRef<Capture|null>(null),mounted=useRef(false),readGeneration=useRef(0);
 const entity=`${enrollment.enrollmentId}:${note?'notes':question?.questionId??work?.workId??'missing'}`;
 useEffect(()=>{
  mounted.current=true;
  const discard=(event:Event)=>{const formId=(event as CustomEvent<{formId?:string}>).detail?.formId;if(formId&&!document.getElementById(formId)?.contains(root.current))return;readGeneration.current++;editRevision.current++;fieldsRef.current=baselineRef.current;setFields(baselineRef.current);captured.current=null;setUnconfirmed(false);setError('');setSaved(false);};
  document.addEventListener(COACHING_DRAFT_DISCARDED,discard);document.addEventListener('coaching:review-discard',discard);
  return()=>{mounted.current=false;document.removeEventListener(COACHING_DRAFT_DISCARDED,discard);document.removeEventListener('coaching:review-discard',discard);};
 },[]);
 function change(patch:Partial<Fields>){const next={...fieldsRef.current,...patch};fieldsRef.current=next;editRevision.current++;setFields(next);setSaved(false);}
 let dueAtUtc=baseline.chosenUtc||null,timeError='';
 try{dueAtUtc=restoredEasternTime(fields.localDue,fields.chosenUtc,baseline.chosenUtc||null);}catch(error){timeError=error instanceof Error?error.message:'Check the scheduled time.';}
 const bodyMode=note||Boolean(question),dirty=JSON.stringify(fields)!==JSON.stringify(baseline)||unconfirmed;
 const workData={title:fields.title,description:fields.description,url:fields.url,...(!lessonManagement?{assignedTo:fields.assignedTo}:{})};
 async function confirmSave(capture:Capture){
  const generation=++readGeneration.current;setConfirming(true);setError('');
  try{
   const query=lessonManagement?new URLSearchParams({planId:enrollment.planId??'',enrollmentId:enrollment.enrollmentId,workId:work?.workId??''}):new URLSearchParams({studentId,includeMessages:'false'});
   const response=await fetch(`/api/coaching/${lessonManagement?'lesson-assignment':'student-workspace'}?${query}`,{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw new Error('The save needs confirmation. Your text is kept. Retry checking the saved result.');
   const result:unknown=await response.json();if(!result||typeof result!=='object')throw new Error('The saved result could not be verified.');
   const record=result as {studentId?:string;enrollmentId?:string;work?:SidecardWork;enrollments?:readonly SidecardEnrollment[]};
   if(!lessonManagement&&record.studentId!==studentId)throw new Error('The saved student context could not be verified. Your entries are kept.');
   const confirmedEnrollment=record.enrollments?.find(row=>row.enrollmentId===enrollment.enrollmentId);
   const confirmedWork=lessonManagement&&record.enrollmentId===enrollment.enrollmentId?record.work:confirmedEnrollment?.work.find(row=>row.workId===work?.workId);
   const notes=confirmedEnrollment?.studentContext?.notes;
   let next:Fields;
   if(note){if(!notes||notes.body!==capture.fields.body.trim()||!Number.isSafeInteger(notes.revision)||notes.revision!==capture.committedNoteRevision)throw new Error('Saved notes differ from this draft or revision. Your text and original revision are kept so you can resolve the change.');next=fieldsFor(undefined,notes.body);}
   else if(question){const answer=confirmedWork?.questions?.find(row=>row.questionId===question.questionId)?.answer;if(answer!==capture.fields.body.trim())throw new Error('The saved answer differs from this draft. Your text is kept.');next=fieldsFor(confirmedWork,answer);}
   else{
    if(!confirmedWork||confirmedWork.workId!==work?.workId||confirmedWork.status!==capture.fields.status||confirmedWork.dueAtUtc!==capture.dueAtUtc||['title','description','url',...(!lessonManagement?['assignedTo']:[])].some(key=>String(confirmedWork.data[key]??(key==='assignedTo'?'student':''))!==capture.fields[key as keyof Fields]))throw new Error('Saved work differs from this draft. Your entries are kept.');
    next=fieldsFor(confirmedWork,'');
   }
   if(!mounted.current||generation!==readGeneration.current)return;
   baselineRef.current=next;setBaseline(next);if(notes&&note)setNoteRevision(notes.revision);
   const unchanged=editRevision.current===capture.revision;
   if(unchanged){fieldsRef.current=next;setFields(next);}
   if(confirmedWork)setSavedWork(confirmedWork);
   const returnFocus=Boolean(root.current?.contains(document.activeElement))||capture.hadEditorFocus&&document.activeElement===document.body;
   const taskCount=confirmedEnrollment?.work.filter(row=>!['lesson','session'].includes(row.kind)&&!['completed','cancelled'].includes(row.status)).length;
   captured.current=null;setUnconfirmed(false);setSaved(true);onConfirmed?.({enrollmentId:enrollment.enrollmentId,taskCount,...(note?{notes:notes!}:{work:confirmedWork}),unchanged,returnFocus});
  }catch(error){if(mounted.current&&generation===readGeneration.current){setUnconfirmed(true);setError(error instanceof Error?error.message:'The save could not be confirmed. Your entries are kept.');}}
  finally{if(mounted.current&&generation===readGeneration.current)setConfirming(false);}
 }
 const candidates=easternTimeCandidates(fields.localDue),foldChoice=candidates.find(row=>row.atUtc===fields.chosenUtc||Number.isFinite(Date.parse(fields.chosenUtc))&&Date.parse(row.atUtc)===Math.floor(Date.parse(fields.chosenUtc)/60000)*60000)?.atUtc??'',lessonUrl=lessonManagement?savedHttpsUrl(savedWork?.data.url):null;
 if(!canManage)return null;
 return <CoachingReviewDraftGuard title="Unsaved changes" description="Keep editing, or discard these changes before leaving."><Box ref={root} data-coaching-pending={mutating||confirming?'true':'false'} data-coaching-unsaved={dirty?'true':'false'}><Stack spacing={2}>
  {lessonUrl?<Box><Button href={lessonUrl} target="_blank" rel="noopener noreferrer" variant="outlined">Open lesson</Button></Box>:null}
  <IndependentCoachingForm key={entity} guard={false} intent={note?'save_student_notes':question?'answer_question':lessonManagement?'update_plan_lesson':'update_work'} label={note?'Save notes':question?'Save answer':work?.kind==='session'?'Save session':'Save changes'} refreshOnSave={false} showSuccessMessage={false} disabled={confirming||unconfirmed||Boolean(timeError)} unsavedChanges={dirty} onPendingChange={pending=>{
   setMutating(pending);if(pending)captured.current={fields:{...fieldsRef.current},revision:editRevision.current,dueAtUtc,expectedRevision:noteRevision,committedNoteRevision:committedNotesRevision(noteRevision,baselineRef.current.body,fieldsRef.current.body),hadEditorFocus:Boolean(root.current?.contains(document.activeElement))};
  }} onSaved={()=>{const capture=captured.current;if(capture){setUnconfirmed(true);void confirmSave(capture);}}} hidden={note?{enrollmentId:enrollment.enrollmentId,expectedRevision:String(noteRevision)}:question?{questionId:question.questionId}:{workId:work?.workId??'',...(lessonManagement?{planId:enrollment.planId??'',enrollmentId:enrollment.enrollmentId}:{})}}>
   <Box component="fieldset" disabled={mutating||confirming} sx={{border:0,m:0,p:0,minWidth:0}}><Stack spacing={2}>
    {bodyMode?<TextField name="body" label={note?'Private coach notes':'Coach answer'} helperText={note?'Only this private note is hidden from the student. Your delivered review feedback is shared.':undefined} multiline minRows={note?8:5} value={fields.body} onChange={event=>change({body:event.target.value})} fullWidth required={!note}/>:<>
     <input type="hidden" name="workData" value={JSON.stringify(workData)}/><input type="hidden" name="dueAtUtc" value={dueAtUtc??''}/>
     <TextField label={work?.kind==='lesson'?'Lesson title':work?.kind==='session'?'Session title':'Task title'} value={fields.title} onChange={event=>change({title:event.target.value})} sx={{maxWidth:500}}/>
     <TextField label="Details" multiline minRows={4} value={fields.description} onChange={event=>change({description:event.target.value})} fullWidth/>
     <TextField label={work?.kind==='lesson'?'Lesson link':work?.kind==='session'?'Meeting link':'Resource link'} type="url" value={fields.url} onChange={event=>change({url:event.target.value})} helperText="Use an HTTPS link." fullWidth/>
     <Stack direction={{xs:'column',sm:'row'}} sx={{gap:2,flexWrap:'wrap'}}><TextField select name="status" label="Status" value={fields.status} onChange={event=>change({status:event.target.value})} sx={{width:{xs:'100%',sm:180}}}>{(work?.kind==='lesson'?['open','assigned','completed','cancelled']:['open','scheduled','assigned','completed','cancelled']).map(status=><MenuItem key={status} value={status}>{status[0].toUpperCase()+status.slice(1)}</MenuItem>)}</TextField>
     {!lessonManagement&&work?.kind!=='session'?<TextField select label="Assigned to" value={fields.assignedTo} onChange={event=>change({assignedTo:event.target.value})} sx={{width:{xs:'100%',sm:180}}}><MenuItem value="coach">Coach</MenuItem><MenuItem value="student">Student</MenuItem></TextField>:null}
     <TextField label={work?.kind==='session'?'Session time (Eastern)':'Due time (Eastern)'} type="datetime-local" value={fields.localDue} onChange={event=>change({localDue:event.target.value,chosenUtc:event.target.value===baselineRef.current.localDue?baselineRef.current.chosenUtc:''})} slotProps={{inputLabel:{shrink:true}}} error={Boolean(timeError)} helperText={timeError||'Eastern Time (New York)'} sx={{width:{xs:'100%',sm:280}}}/></Stack>
     {candidates.length>1?<TextField select label="Which Eastern time?" value={foldChoice} onChange={event=>{const value=event.target.value,original=baselineRef.current.chosenUtc;change({chosenUtc:fields.localDue===baselineRef.current.localDue&&original&&Math.floor(Date.parse(original)/60000)*60000===Date.parse(value)?original:value});}} sx={{maxWidth:280}}><MenuItem value="">Choose EDT or EST</MenuItem>{candidates.map(candidate=><MenuItem key={candidate.atUtc} value={candidate.atUtc}>{candidate.label}</MenuItem>)}</TextField>:null}
    </>}
   </Stack></Box>
  </IndependentCoachingForm>
  {confirming?<Alert severity="info" role="status">Checking the saved result…</Alert>:null}
  {error?<Alert severity="warning" action={<Button disabled={confirming} onClick={()=>{const capture=captured.current;if(capture)void confirmSave(capture);}}>Retry checking</Button>}>{error}</Alert>:null}
  {saved&&!dirty?<Alert severity="success" role="status">Saved.</Alert>:null}
 </Stack></Box></CoachingReviewDraftGuard>;
}
