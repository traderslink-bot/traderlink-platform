"use client";
import {useId,useState} from 'react';
import {useCoachingDraftNavigation} from '@/app/(dashboard)/communities/coaching-draft-navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import {IndependentCoachingForm} from './coaching-form';
import {sidecardWorkTitle,sidecardStatus,sidecardTime} from './student-sidecard-model';

type Work={questionSubmissionKey?:string;questions?:readonly {questionId:string;body:string;answer:string|null}[];workId:string;kind:string;status:string;dueAtUtc:string|null;data:Record<string,unknown>};
export function IndependentIncludedWork({work,isCoach,planName}:{work:Work;isCoach:boolean;planName?:string}){
 const [questionSequence,setQuestionSequence]=useState(0),[questionReset,setQuestionReset]=useState(0);
 const [editing,setEditing]=useState(false),[description,setDescription]=useState(String(work.data.description??'')),[url,setUrl]=useState(String(work.data.url??'')),[due,setDue]=useState(work.dueAtUtc?.slice(0,16)??''),[status,setStatus]=useState(work.status);
 const [baseline,setBaseline]=useState({description:String(work.data.description??''),url:String(work.data.url??''),due:work.dueAtUtc?.slice(0,16)??'',status:work.status});
 const editorId=useId(),navigation=useCoachingDraftNavigation(editorId,`${work.workId}:${editing}`);
 const toggleEditor=()=>{if(document.getElementById(editorId)?.querySelector('[data-coaching-pending="true"]'))return;navigation.requestChange(()=>{if(editing){const reset={description:String(work.data.description??''),url:String(work.data.url??''),due:work.dueAtUtc?.slice(0,16)??'',status:work.status};setDescription(reset.description);setUrl(reset.url);setDue(reset.due);setStatus(reset.status);setBaseline(reset);}setEditing(!editing);});};
 const label=work.kind==='lesson'?'Included lesson':work.kind==='session'?'Session':work.data.serviceType==='questions'?'Questions':work.kind.replaceAll('_',' ');
 const canComplete=!isCoach&&work.status!=='completed'&&(work.kind==='lesson'?work.status==='assigned':['task','check_in'].includes(work.kind)&&work.data.assignedTo!=='coach');
 return <Box id={editorId} sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}><Stack spacing={2}>
  <Typography variant="h3">{sidecardWorkTitle(work,planName)}</Typography><Typography color="text.secondary">{sidecardStatus(work.status)}{work.dueAtUtc?` · ${sidecardTime(work.dueAtUtc)}`:''}</Typography>
  {description?<Typography sx={{whiteSpace:'pre-wrap'}}>{description}</Typography>:null}
  {url?<Box><Button href={url} target="_blank" rel="noopener noreferrer" variant="outlined">Open {label.toLowerCase()}</Button></Box>:null}
  {isCoach?<Box><Button onClick={toggleEditor}>{editing?'Close editor':`Edit ${label.toLowerCase()}`}</Button></Box>:null}
  {isCoach&&editing?<IndependentCoachingForm intent="update_work" label="Save work" hidden={{workId:work.workId}} unsavedChanges={description!==baseline.description||url!==baseline.url||due!==baseline.due||status!==baseline.status} onSaved={()=>{setBaseline({description,url,due,status});setEditing(false);}}>
   <input type="hidden" name="workData" value={JSON.stringify({description,url})}/><input type="hidden" name="dueAtUtc" value={due?`${due}:00.000Z`:''}/>
   <TextField label="Details" multiline minRows={4} value={description} onChange={event=>setDescription(event.target.value)}/>
   <TextField label={work.kind==='lesson'?'Lesson link':'Meeting or resource link'} type="url" value={url} onChange={event=>setUrl(event.target.value)}/>
   <Stack direction={{xs:'column',sm:'row'}} spacing={2}><TextField label="Status" name="status" select value={status} onChange={event=>setStatus(event.target.value)} sx={{minWidth:180}}>{['open','scheduled','assigned','completed','cancelled'].map(value=><MenuItem key={value} value={value}>{value.slice(0,1).toUpperCase()+value.slice(1)}</MenuItem>)}</TextField><TextField label="Scheduled / due time (UTC)" type="datetime-local" value={due} onChange={event=>setDue(event.target.value)} slotProps={{inputLabel:{shrink:true}}}/></Stack>
  </IndependentCoachingForm>:null}
  {work.data.serviceType==='questions'?<Stack spacing={2}><Typography>{work.questions?.length??0} of {String(work.data.quantity)} questions used</Typography>{work.questions?.map(question=><Box key={question.questionId}><Typography variant="subtitle2">Student question</Typography><Typography sx={{whiteSpace:'pre-wrap',mb:1}}>{question.body}</Typography>{question.answer?<><Typography variant="subtitle2">Coach answer</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{question.answer}</Typography></>:null}{isCoach?<IndependentCoachingForm intent="answer_question" label={question.answer?'Save updated answer':'Send answer'} hidden={{questionId:question.questionId}}><TextField name="body" label="Answer" multiline minRows={4} defaultValue={question.answer??''} required/></IndependentCoachingForm>:null}</Box>)}{!isCoach&&work.questionSubmissionKey&&(work.questions?.length??0)<Number(work.data.quantity)?<IndependentCoachingForm key={questionReset} intent="ask_question" label="Send question" hidden={{workId:work.workId,submissionKey:`${work.questionSubmissionKey}:${questionSequence}`}} onBodyCommitted={()=>setQuestionSequence(old=>old+1)} onSaved={()=>setQuestionReset(old=>old+1)}><TextField name="body" label="Question" multiline minRows={4} required/></IndependentCoachingForm>:null}</Stack>:null}
  {canComplete?<IndependentCoachingForm intent="update_work" label="Mark complete" hidden={{workId:work.workId,status:'completed',workData:'{}'}}/>:null}
 </Stack>{navigation.confirmation}</Box>;
}
