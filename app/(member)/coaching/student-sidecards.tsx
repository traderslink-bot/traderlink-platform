"use client";

import {useEffect,useId,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import {useTheme} from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import {useCoachingDraftNavigation} from '@/app/(dashboard)/communities/coaching-draft-navigation';
import {lessonAccessOverview,savedHttpsUrl,sessionBucket,sidecardItems,sidecardStatus,sidecardTime,sidecardWorkCategory,sidecardWorkTitle,type SidecardEnrollment,type SidecardItem,type SidecardWork,type StudentSidecardSection} from './student-sidecard-model';
import {IndependentCoachingForm} from './coaching-form';
import {StudentSidecardEditor,type StudentSidecardConfirmation} from './student-sidecard-editor';
import {useCoachingPaneReturn} from './coaching-pane-navigation';

export function IndependentStudentSidecards({studentId,enrollments,section,nowUtc,planId,initialWorkId,onConfirmed}:{studentId:string;enrollments:readonly SidecardEnrollment[];section:StudentSidecardSection;nowUtc:string;planId?:string;initialWorkId?:string;onConfirmed?:(value:StudentSidecardConfirmation)=>void}){
 const theme=useTheme(),drawerTextColor=theme.palette.mode==='dark'?theme.palette.text.primary:'#000000';
 const id=useId();
 const [screen,setScreen]=useState<'list'|'detail'>(initialWorkId?'detail':'list');
 const [selected,setSelected]=useState(initialWorkId??''),[questionId,setQuestionId]=useState(''),[filter,setFilter]=useState('');
 const [editing,setEditing]=useState(false),[busy,setBusy]=useState(false);
 const [allowanceCheck,setAllowanceCheck]=useState<{item:SidecardItem;error:string}|null>(null),allowanceGeneration=useRef(0),allowanceMounted=useRef(false);
 useEffect(()=>{const counter=allowanceGeneration;allowanceMounted.current=true;return()=>{allowanceMounted.current=false;counter.current++;};},[]);
 const [works,setWorks]=useState<Readonly<Record<string,SidecardWork>>>({}),[notes,setNotes]=useState<Readonly<Record<string,{body:string;revision:number}>>>({});
 const navigation=useCoachingDraftNavigation(id,[section,screen,selected,questionId,filter,editing].join(':'));
 const listReturn=useCoachingPaneReturn(id,screen==='list');
 const focusAfterSave=useRef<{headingId:string;activeBefore:Element|null}|null>(null);
 useEffect(()=>{
  const request=focusAfterSave.current;if(editing||screen!=='detail'||!request)return;focusAfterSave.current=null;
  const container=document.getElementById(id),active=document.activeElement;
  if(!container||!document.hasFocus()||active&&active!==document.body&&active!==request.activeBefore)return;
  const heading=document.getElementById(request.headingId);
  const target=heading&&container.contains(heading)?document.getElementById(id+'-detail-action'):document.getElementById(id+'-back');
  if(target&&container.contains(target))target.focus({preventScroll:true});
 },[editing,works,screen,id]);
 useEffect(()=>{
  if(screen!=='detail'||!selected)return;
  document.getElementById(section==='notes'?id+'-note-title':'coaching-work-'+selected)?.focus({preventScroll:true});
 },[screen,selected,section,id]);
 useEffect(()=>{
  if(!editing)return;
  const frame=requestAnimationFrame(()=>document.getElementById(id)?.querySelector<HTMLElement>('textarea, input:not([type="hidden"]), select')?.focus({preventScroll:true}));
  return()=>cancelAnimationFrame(frame);
 },[editing,id]);
 const rows=enrollments.map(enrollment=>({...enrollment,work:enrollment.work.map(work=>works[work.workId]??work),studentContext:notes[enrollment.enrollmentId]&&enrollment.studentContext?{...enrollment.studentContext,notes:notes[enrollment.enrollmentId]}:enrollment.studentContext}));
 function change(action:()=>void){if(busy||Boolean(allowanceCheck&&!allowanceCheck.error)||document.getElementById(id)?.querySelector('[data-coaching-pending="true"]'))return;navigation.requestChange(action);}
 function backToList(){change(()=>{focusAfterSave.current=null;listReturn.restoreList();setEditing(false);setScreen('list');});}
 function finishEditing(){change(()=>{focusAfterSave.current={headingId:section==='notes'?id+'-note-title':'coaching-work-'+selected,activeBefore:document.activeElement};setEditing(false);});}
 const confirm=(enrollmentId:string)=>(value:StudentSidecardConfirmation)=>{
  if(value.enrollmentId!==enrollmentId)return;
  if(value.work)setWorks(current=>({...current,[value.work!.workId]:value.work!}));
  if(value.notes)setNotes(current=>({...current,[enrollmentId]:value.notes!}));
  onConfirmed?.(value);
  if(value.unchanged&&!value.notes){if(value.returnFocus&&value.work)focusAfterSave.current={headingId:'coaching-work-'+value.work.workId,activeBefore:document.activeElement};setEditing(false);}
 };
 async function confirmAllowance(item:SidecardItem){
  const generation=++allowanceGeneration.current;setBusy(true);setAllowanceCheck({item,error:''});
  try{
   const query=new URLSearchParams({studentId,includeMessages:'false',...(planId?{planId}:{})});
   const response=await fetch(`/api/coaching/student-workspace?${query}`,{cache:'no-store',credentials:'same-origin'});
   if(!response.ok)throw new Error('Completion needs confirmation. Retry checking; no additional change will be sent.');
   const value=await response.json() as {studentId:string;enrollments:SidecardEnrollment[]};
   const enrollment=value.studentId===studentId?value.enrollments?.find(row=>row.enrollmentId===item.enrollment.enrollmentId):undefined;
   const work=enrollment?.work.find(row=>row.workId===item.work.workId);
   if(!work||work.status!=='completed'||work.dueAtUtc!==item.work.dueAtUtc||work.data.quantity!==item.work.data.quantity||work.questions?.length!==item.work.questions?.length||work.questions?.some((question,index)=>question.questionId!==item.work.questions?.[index]?.questionId||question.answer!==item.work.questions?.[index]?.answer))throw new Error('The saved allowance could not be verified. Retry checking the result.');
   if(!allowanceMounted.current||generation!==allowanceGeneration.current)return;
   confirm(enrollment!.enrollmentId)({enrollmentId:enrollment!.enrollmentId,work,taskCount:enrollment!.work.filter(row=>!['lesson','session'].includes(row.kind)&&!['completed','cancelled'].includes(row.status)).length,unchanged:true});setAllowanceCheck(null);
  }catch(cause){if(allowanceMounted.current&&generation===allowanceGeneration.current)setAllowanceCheck({item,error:cause instanceof Error?cause.message:'Completion could not be verified.'});}
  finally{if(allowanceMounted.current&&generation===allowanceGeneration.current)setBusy(false);}
 }
 function assignmentAction(item:SidecardItem,label?:string){
  const {enrollment,work}=item;if(!enrollment.planId)return <Typography color={drawerTextColor} variant="body2">Assignment context unavailable</Typography>;
  const returnTo=(planId?'/coaching/plans/'+planId:'/coaching/students')+'#'+new URLSearchParams({student:studentId,section:'lessons'});
  const route='/coaching/plans/'+enrollment.planId+'/assignments/'+work.workId+'?'+new URLSearchParams({enrollmentId:enrollment.enrollmentId,returnTo});
  return <Button size="small" variant="outlined" href={route} onClick={event=>{if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;event.preventDefault();const url=new URL(route,window.location.origin);url.searchParams.set('returnTo',window.location.pathname+window.location.search+window.location.hash);window.location.assign(url.pathname+url.search);}}>{label??(enrollment.status==='active'?'Manage in plan':'View assignment')}</Button>;
 }
 if(section==='lessons'){
  const {available:assigned,pending,history}=lessonAccessOverview(rows);
  return <Stack id={id} spacing={2}>{assigned.length?<Box component="ul" sx={{listStyle:'none',m:0,p:0}}>{assigned.map(item=>{
   const {enrollment,work}=item,url=savedHttpsUrl(work.data.url);
   return <Box component="li" key={work.workId} sx={{py:2,borderBottom:1,borderColor:'divider',display:'grid',gridTemplateColumns:{xs:'minmax(0,1fr)',sm:'minmax(0,1fr) auto'},gap:2,alignItems:'center'}}>
    <Box sx={{minWidth:0}}><Typography color={drawerTextColor} component="h3" variant="h3" sx={{overflowWrap:'anywhere'}}>{sidecardWorkTitle(work,enrollment.planName)}</Typography><Typography variant="body2" color={drawerTextColor}>{enrollment.planName}</Typography><Chip size="small" variant="outlined" label={sidecardStatus(work.status)} sx={{mt:1}}/></Box>
    <Stack direction={{xs:'column',sm:'row'}} sx={{gap:1,alignItems:{xs:'stretch',sm:'center'}}}>{url?<Button size="small" href={url} target="_blank" rel="noopener noreferrer" variant="outlined">Open lesson</Button>:<Typography variant="body2" color={drawerTextColor}>Lesson link unavailable</Typography>}{assignmentAction(item)}</Stack>
   </Box>;
  })}</Box>:!pending.length?<Typography color={drawerTextColor}>No assigned lessons in this view.</Typography>:null}
  {pending.length?<Box component="section" aria-label="Lessons to assign"><Typography color={drawerTextColor} component="h3" variant="h3" sx={{mb:1}}>To assign</Typography>{pending.map(group=><Box key={group.enrollment.enrollmentId} sx={{borderBottom:1,borderColor:'divider',py:2}}><Typography color={drawerTextColor} sx={{fontWeight:700}}>{group.enrollment.planName}</Typography><Stack spacing={1} sx={{mt:1}}>{group.items.map(item=><Stack key={item.work.workId} direction={{xs:'column',sm:'row'}} sx={{gap:1,alignItems:{sm:'center'},justifyContent:'space-between'}}><Typography color={drawerTextColor}>{sidecardWorkTitle(item.work,item.enrollment.planName)} · Not assigned</Typography><Box>{assignmentAction(item,item.enrollment.status==='active'?'Assign lesson':'View assignment')}</Box></Stack>)}</Stack></Box>)}</Box>:null}
  {history.length?<Box component="details"><Box component="summary" sx={{cursor:'pointer',py:1}}>Earlier assignments ({history.length})</Box><Stack spacing={2} sx={{mt:1}}>{history.map(item=><Stack key={item.work.workId} direction={{xs:'column',sm:'row'}} sx={{gap:1,alignItems:{sm:'center'},justifyContent:'space-between'}}><Box><Typography color={drawerTextColor}>{sidecardWorkTitle(item.work,item.enrollment.planName)}</Typography><Typography color={drawerTextColor} variant="body2">{item.enrollment.planName} · {sidecardStatus(item.work.status)}</Typography></Box><Box>{assignmentAction(item,'View assignment')}</Box></Stack>)}</Stack></Box>:null}
  </Stack>;
 }
 if(section==='notes'){
  const enrollment=rows.find(row=>row.enrollmentId===selected);
  return <Stack id={id} data-coaching-pending={busy||Boolean(allowanceCheck&&!allowanceCheck.error)?'true':'false'} spacing={3}>{screen==='list'?<>
   <Typography color={drawerTextColor} component="h3" variant="h3" tabIndex={-1} data-coaching-list-fallback>Coaching notes by plan</Typography>
   {rows.length?<Box component="ul" sx={{listStyle:'none',m:0,p:0}}>{rows.map(row=><Box component="li" key={row.enrollmentId} sx={{borderBottom:1,borderColor:'divider'}}>
    <Button id={id+'-note-'+row.enrollmentId} aria-pressed={row.enrollmentId===selected} variant="text" onClick={()=>change(()=>{listReturn.rememberList(id+'-note-'+row.enrollmentId);setSelected(row.enrollmentId);setEditing(false);setScreen('detail');})} sx={{display:'block',textAlign:'left',width:'100%',p:2,borderRadius:0}}>
     <Typography color={drawerTextColor} component="span" sx={{display:'block',fontWeight:700,overflowWrap:'anywhere'}}>{row.planName}</Typography>
     <Typography component="span" variant="body2" color={drawerTextColor} sx={{display:'block',mt:.5,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{row.studentContext?.notes?.body||'No private note saved yet.'}</Typography>
     <Typography component="span" variant="caption" color={drawerTextColor} sx={{display:'block',mt:.5}}>{row.status==='ended'?'Past coaching · View note':'View note and student goals'}</Typography>
    </Button>
   </Box>)}</Box>:<Typography color={drawerTextColor}>No coaching plans in this view.</Typography>}
  </>:<>
   <Box><Button id={id+'-back'} disabled={busy} onClick={backToList} variant="outlined">Back to notes</Button></Box>
   {enrollment?<>
    <Box><Typography color={drawerTextColor} id={id+'-note-title'} tabIndex={-1} component="h3" variant="h3" sx={{overflowWrap:'anywhere'}}>{enrollment.planName}</Typography><Typography variant="body2" color={drawerTextColor}>Private coach note{enrollment.status==='ended'?' · Past coaching':''}</Typography></Box>
    {editing&&enrollment.status==='active'?<StudentSidecardEditor key={enrollment.enrollmentId} studentId={studentId} enrollment={enrollment} note onConfirmed={confirm(enrollment.enrollmentId)} onPendingChange={setBusy}/>:<Typography color={drawerTextColor} sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{enrollment.studentContext?.notes?.body||'No private note saved yet.'}</Typography>}
    {enrollment.status==='active'?<Box><Button id={id+'-detail-action'} disabled={busy} variant="outlined" onClick={()=>editing?finishEditing():change(()=>setEditing(true))}>{editing?'Done editing':enrollment.studentContext?.notes?.body?'Edit note':'Add note'}</Button></Box>:<Alert severity="info">Past coaching notes are read-only.</Alert>}
    <Box component="section" aria-label="Student-saved goals" sx={{borderTop:1,borderColor:'divider',pt:3}}><Typography color={drawerTextColor} component="h4" variant="h3" sx={{mb:1}}>Student goals</Typography><Typography color={drawerTextColor} sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{enrollment.studentContext?.goals.body||'The student has not saved goals for this plan.'}</Typography></Box>
   </>:<Typography color={drawerTextColor}>This note is unavailable in the selected view.</Typography>}
  </>}{navigation.confirmation}</Stack>;
 }
 const all=sidecardItems(rows,section),requested=all.find(row=>row.work.workId===selected);
 const activeFilter=filter||(section==='tasks'?(requested&&['completed','cancelled'].includes(requested.work.status)?'history':'open'):requested?sessionBucket(requested.work,nowUtc):'upcoming');
 const visible=all.filter(({work})=>section==='tasks'?(activeFilter==='history'?['completed','cancelled'].includes(work.status):!['completed','cancelled'].includes(work.status)):sessionBucket(work,nowUtc)===activeFilter);
 const item=all.find(row=>row.work.workId===selected),question=item?.work.questions?.find(row=>row.questionId===questionId)??item?.work.questions?.find(row=>!row.answer)??item?.work.questions?.[0];
 const filters=section==='tasks'?[['open','Open tasks'],['history','Task history']]:[['upcoming','Upcoming'],['unscheduled','Unscheduled'],['past','Past']];
 const resourceUrl=item?savedHttpsUrl(item.work.data.url):null;
 return <Stack id={id} spacing={3}>{screen==='list'?<>
  <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{filters.map(([value,label])=>{
   const count=all.filter(({work})=>section==='tasks'?(value==='history'?['completed','cancelled'].includes(work.status):!['completed','cancelled'].includes(work.status)):sessionBucket(work,nowUtc)===value).length;
   return <Button key={value} data-coaching-list-fallback={activeFilter===value?true:undefined} size="small" variant={activeFilter===value?'contained':'outlined'} onClick={()=>change(()=>{setFilter(value);setSelected('');setQuestionId('');})}>{label} ({count})</Button>;
  })}</Stack>
  {visible.length?<Box component="ul" sx={{listStyle:'none',m:0,p:0}}>{visible.map(({enrollment,work})=><Box component="li" key={work.workId} sx={{borderBottom:1,borderColor:'divider'}}>
   <Button id={id+'-work-'+work.workId} aria-pressed={work.workId===selected} variant="text" onClick={()=>change(()=>{listReturn.rememberList(id+'-work-'+work.workId);setFilter(activeFilter);setSelected(work.workId);setQuestionId('');setEditing(false);setScreen('detail');})} sx={{display:'block',textAlign:'left',width:'100%',p:2,borderRadius:0}}>
    <Box component="span" sx={{display:'flex',gap:1,alignItems:'center',flexWrap:'wrap',mb:1}}>{section==='tasks'?<Chip component="span" size="small" variant="outlined" color={work.data.serviceType==='questions'?'info':work.kind==='check_in'?'secondary':'default'} label={sidecardWorkCategory(work)}/>:null}<Typography color={drawerTextColor} component="span" sx={{fontWeight:700,overflowWrap:'anywhere'}}>{sidecardWorkTitle(work,enrollment.planName)}</Typography></Box>
    <Typography component="span" variant="body2" color={drawerTextColor} sx={{display:'block'}}>{enrollment.planName}</Typography>
    <Typography component="span" variant="caption" color={drawerTextColor} sx={{display:'block',mt:.5}}>{sidecardStatus(work.status)} · {sidecardTime(work.dueAtUtc)||(section==='sessions'?'Not scheduled':'No due time')}{section==='tasks'?' · '+(work.data.assignedTo==='coach'?'For coach':'For student'):''}</Typography>
   </Button>
  </Box>)}</Box>:<Typography color={drawerTextColor}>{section==='sessions'?activeFilter==='unscheduled'?'No sessions waiting to be scheduled.':'No '+activeFilter+' sessions.':activeFilter==='history'?'No task history in this view.':'No open tasks in this view.'}</Typography>}
 </>:<>
  <Box><Button id={id+'-back'} disabled={busy} onClick={backToList} variant="outlined">Back to {section==='sessions'?'sessions':'tasks'}</Button></Box>
  {item?<>
   <Box>{section==='tasks'?<Chip size="small" variant="outlined" label={sidecardWorkCategory(item.work)} sx={{mb:1}}/>:null}<Typography color={drawerTextColor} id={'coaching-work-'+item.work.workId} tabIndex={-1} component="h3" variant="h3" sx={{overflowWrap:'anywhere'}}>{sidecardWorkTitle(item.work,item.enrollment.planName)}</Typography><Typography variant="body2" color={drawerTextColor}>{item.enrollment.planName}</Typography></Box>
   {resourceUrl?<Box><Button href={resourceUrl} target="_blank" rel="noopener noreferrer" variant="outlined">{section==='sessions'?'Open meeting':'Open resource'}</Button></Box>:null}
   {item.work.data.serviceType==='questions'?<>
    {item.enrollment.status==='active'&&['open','assigned'].includes(item.work.status)&&Number.isSafeInteger(item.work.data.quantity)&&Number(item.work.data.quantity)>0&&item.work.questions&&item.work.questions.length===item.work.data.quantity&&item.work.questions.every(question=>Boolean(question.answer?.trim()))?<Box>
     <IndependentCoachingForm guard={false} intent="update_work" label="Complete allowance" disabled={busy||Boolean(allowanceCheck)} refreshOnSave={false} hidden={{workId:item.work.workId,status:'completed',workData:'{}',dueAtUtc:item.work.dueAtUtc??''}} onPendingChange={setBusy} onSaved={()=>void confirmAllowance(item)}/>
     <Typography variant="body2" color={drawerTextColor}>All agreed questions have been used and answered. Complete this allowance to move it to Task history.</Typography>
    </Box>:null}
    {allowanceCheck?.item.work.workId===item.work.workId?<Alert severity={allowanceCheck.error?'warning':'info'} action={allowanceCheck.error?<Button disabled={busy} onClick={()=>void confirmAllowance(allowanceCheck.item)}>Retry checking</Button>:undefined}>{allowanceCheck.error||'Checking saved completion…'}</Alert>:null}
    <Chip sx={{alignSelf:'flex-start'}} label={(item.work.questions?.length??0)+(Number.isSafeInteger(item.work.data.quantity)?' of '+item.work.data.quantity:'')+' questions used'}/>
    {item.work.questions?.length?<>
     <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{item.work.questions.map((row,index)=><Button key={row.questionId} disabled={busy} size="small" variant={question?.questionId===row.questionId?'contained':'outlined'} onClick={()=>change(()=>{setQuestionId(row.questionId);setEditing(false);})}>Question {index+1}{row.answer?' · Answered':''}</Button>)}</Stack>
     {question?<>
      <Typography color={drawerTextColor} component="h4" variant="h3">Student question</Typography><Typography color={drawerTextColor} sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{question.body}</Typography>
      {editing&&item.enrollment.status==='active'?<StudentSidecardEditor key={question.questionId} studentId={studentId} enrollment={item.enrollment} work={item.work} question={question} onConfirmed={confirm(item.enrollment.enrollmentId)} onPendingChange={setBusy}/>:<><Typography color={drawerTextColor} component="h4" variant="h3">Coach answer</Typography><Typography color={drawerTextColor} sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{question.answer||'No answer saved.'}</Typography></>}
      {item.enrollment.status==='active'?<Box><Button id={id+'-detail-action'} disabled={busy} variant="outlined" onClick={()=>editing?finishEditing():change(()=>setEditing(true))}>{editing?'Cancel':question.answer?'Edit answer':'Answer question'}</Button></Box>:null}
     </>:null}
    </>:<Typography color={drawerTextColor}>The student has not submitted a question in this allowance. Its agreed limit is unchanged.</Typography>}
   </>:<>
    {editing&&item.enrollment.status==='active'?<StudentSidecardEditor key={item.work.workId} studentId={studentId} enrollment={item.enrollment} work={item.work} onConfirmed={confirm(item.enrollment.enrollmentId)} onPendingChange={setBusy}/>:<>
     <Typography variant="body2" color={drawerTextColor}>{sidecardStatus(item.work.status)} · {sidecardTime(item.work.dueAtUtc)||(section==='sessions'?'Not scheduled':'No due time')}{section==='tasks'?' · '+(item.work.data.assignedTo==='coach'?'For coach':'For student'):''}</Typography>
     {typeof item.work.data.description==='string'&&item.work.data.description?<Typography color={drawerTextColor} sx={{whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{item.work.data.description}</Typography>:null}
     {Number.isFinite(item.work.data.plannedMinutes)&&Number(item.work.data.plannedMinutes)>0?<Typography color={drawerTextColor}>{String(item.work.data.plannedMinutes)} minutes</Typography>:null}
    </>}
    {item.enrollment.status==='active'?<Box><Button id={id+'-detail-action'} disabled={busy} variant="outlined" onClick={()=>editing?finishEditing():change(()=>setEditing(true))}>{editing?'Cancel':section==='sessions'?(item.work.dueAtUtc?'Edit session':'Schedule session'):'Edit task'}</Button></Box>:<Alert severity="info">Past coaching work is read-only.</Alert>}
   </>}
  </>:<Typography color={drawerTextColor}>This item is unavailable in the selected view.</Typography>}
 </>}{navigation.confirmation}</Stack>;
}
