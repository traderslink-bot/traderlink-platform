"use client";
import {useEffect,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import type {AssignedLessonContext} from '@/src/modules/communities/server/independent-coaching-lesson-management';
import {StudentSidecardEditor} from './student-sidecard-editor';
import {savedHttpsUrl,sidecardStatus,sidecardTime,sidecardWorkTitle,type SidecardEnrollment} from './student-sidecard-model';

/** One accepted lesson, with the same acknowledged editor used by coach drawers. */
export function IndependentLessonAssignment({assignment,returnHref}:{assignment:AssignedLessonContext;returnHref:string}){
 const [work,setWork]=useState(assignment.work);
 const editor=useRef<HTMLDivElement>(null),restoreSaveFocus=useRef(false);
 useEffect(()=>{
  if(!restoreSaveFocus.current)return;
  restoreSaveFocus.current=false;
  const frame=requestAnimationFrame(()=>{
   if(!document.hasFocus()||document.activeElement!==document.body)return;
   const submit=editor.current?.querySelector<HTMLButtonElement>('button[type="submit"]');
   if(submit&&!submit.disabled)submit.focus({preventScroll:true});
  });
  return()=>cancelAnimationFrame(frame);
 },[work]);
 const enrollment:SidecardEnrollment={enrollmentId:assignment.enrollmentId,planId:assignment.planId,planName:assignment.planName,status:assignment.enrollmentStatus,agreements:[],work:[work]};
 const url=savedHttpsUrl(work.data.url);
 return <Stack spacing={3}>
  <Box><Button href={returnHref} variant="outlined">Back to lesson access</Button></Box>
  <Stack direction={{xs:'column',sm:'row'}} sx={{gap:1.5,justifyContent:'space-between',alignItems:{sm:'center'}}}>
   <Typography component="h1" variant="h1">Lesson assignment</Typography>
   <Chip variant="outlined" label={sidecardStatus(work.status)}/>
  </Stack>
  <DashboardPanel title={sidecardWorkTitle(work,assignment.planName)}>
   <Stack spacing={3}>
    <Box><Typography sx={{fontWeight:700}}>{assignment.studentName}</Typography><Typography color="text.secondary">{assignment.planName}</Typography></Box>
    {assignment.canManage?<Box ref={editor}><StudentSidecardEditor studentId={assignment.studentId} enrollment={enrollment} work={work} lessonManagement onConfirmed={result=>{if(result.work?.workId===work.workId){restoreSaveFocus.current=Boolean(result.returnFocus);setWork(result.work);}}}/></Box>:<>
     <Alert severity="info">This lesson assignment is read-only. Its saved details remain available.</Alert>
     {typeof work.data.description==='string'&&work.data.description?<Typography sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{work.data.description}</Typography>:null}
     {work.dueAtUtc?<Typography>{sidecardTime(work.dueAtUtc)}</Typography>:null}
     {url?<Box><Button href={url} target="_blank" rel="noopener noreferrer" variant="outlined">Open lesson</Button></Box>:null}
    </>}
   </Stack>
  </DashboardPanel>
 </Stack>;
}
