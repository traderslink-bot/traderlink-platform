"use client";
import NextLink from 'next/link';
import {AcceptedServiceDetails} from './accepted-service-details';
import {useEffect,useId,useRef,useState} from 'react';
import {useCoachingDraftNavigation} from '@/app/(dashboard)/communities/coaching-draft-navigation';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import {useTheme} from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import {CommunityTypography as Typography} from '@/app/(dashboard)/communities/community-typography';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import type {CoachingAgreement} from '@/src/modules/communities/contracts/coaching-agreements';
import type {IndependentCoachingReview} from '@/src/modules/communities/contracts/independent-coaching';
import {COACHING_ACCESS_LABELS,type CoachingRequiredScope} from '@/src/modules/communities/contracts/coaching-required-access';
import {periodAvailableAt} from '@/src/modules/communities/contracts/coaching-review-timing';
import {coachingReviewLabel} from '@/src/modules/communities/contracts/coaching-review-workspace';
import type {IndependentStudentContextModel} from './student-context';
import {IndependentStudentSidecards} from './student-sidecards';
import type {SidecardWork,StudentSidecardSection} from './student-sidecard-model';
import type {StudentSidecardConfirmation} from './student-sidecard-editor';
import {IndependentMessageMailbox} from './message-mailbox';

export type IndependentStudentCardModel={studentId:string;name:string;avatarUrl?:string|null;enrollments:readonly {enrollmentId:string;planId?:string;planName:string;status:string;studentContext?:IndependentStudentContextModel;agreements:readonly CoachingAgreement[];reviews:readonly IndependentCoachingReview[];missingAccess:boolean;reviewAccountMismatch?:boolean;missingScopes?:readonly CoachingRequiredScope[];accountAvailable?:boolean;taskCount?:number;messageCount?:number;unreadMessageCount?:number|null;messages:readonly {messageId:string;senderName:string;body:string;createdAtUtc:string}[];work:readonly SidecardWork[]}[]};
function reviewMatches(review:IndependentCoachingReview,filter:string,nowUtc:string):boolean{
 if(filter==='overdue')return ['ready','draft'].includes(review.status)&&Boolean(review.dueAtUtc&&review.dueAtUtc<nowUtc);
 if(filter==='ready')return ['ready','draft'].includes(review.status)&&Boolean(review.dueAtUtc&&review.dueAtUtc>=nowUtc);
 if(filter==='upcoming'){const at=periodAvailableAt(review.periodEnd);return Boolean(review.status==='awaiting_submission'&&at&&at>nowUtc&&Date.parse(at)<=Date.parse(nowUtc)+7*86400000);}
 return true;
}
type Section='plans'|'reviews'|'messages'|'tasks'|'sessions'|'lessons'|'access'|'notes';
function checkedWorkspace(value:unknown,studentId:string,planId?:string){
 const detail=value as Partial<IndependentStudentCardModel>|null;
 if(!detail||detail.studentId!==studentId||typeof detail.name!=='string'||!Array.isArray(detail.enrollments)||!detail.enrollments.length)throw new Error('Student details could not be verified.');
 const counts:Record<string,number>={},enrollmentIds=new Set<string>(),workIds=new Set<string>();
 for(const enrollment of detail.enrollments){
  if(!enrollment||typeof enrollment.enrollmentId!=='string'||!enrollment.enrollmentId.trim()||enrollmentIds.has(enrollment.enrollmentId)||typeof enrollment.planName!=='string'||typeof enrollment.status!=='string'||planId&&enrollment.planId!==planId||!Array.isArray(enrollment.work)||!Array.isArray(enrollment.reviews)||!Array.isArray(enrollment.agreements)||!Array.isArray(enrollment.messages))throw new Error('Student details could not be verified.');
  enrollmentIds.add(enrollment.enrollmentId);
  for(const work of enrollment.work){
   if(!work||typeof work.workId!=='string'||!work.workId.trim()||workIds.has(work.workId)||typeof work.kind!=='string'||typeof work.status!=='string'||!work.data||typeof work.data!=='object'||Array.isArray(work.data))throw new Error('Student details could not be verified.');
   workIds.add(work.workId);
  }
  counts[enrollment.enrollmentId]=enrollment.work.filter((work:SidecardWork)=>!['lesson','session'].includes(work.kind)&&!['completed','cancelled'].includes(work.status)).length;
 }
 return {detail:detail as IndependentStudentCardModel,counts};
}
export function IndependentStudentCards({students,nowUtc,planId}:{students:readonly IndependentStudentCardModel[];nowUtc:string;planId?:string}){
 const theme=useTheme(),drawerTextColor=theme.palette.mode==='dark'?theme.palette.text.primary:'#000000';
 const [search,setSearch]=useState(''),[view,setView]=useState<'active'|'history'>('active');
 const [workspace,setWorkspace]=useState<{result:{key:string;detail:IndependentStudentCardModel|null;error:string}|null;taskCounts:Readonly<Record<string,Readonly<Record<string,number>>>>;confirmedSequence:number}>({result:null,taskCounts:{},confirmedSequence:0});
 const operationSequence=useRef(0);
 const {result,taskCounts}=workspace;
 const [revision,setRevision]=useState(0);
 const [unread,setUnread]=useState<Readonly<Record<string,number>>>({});
 const drawerId=useId(),navigation=useCoachingDraftNavigation(drawerId,hash=>hash,true);
 const fragment=new URLSearchParams(navigation.hash.slice(1)),selectedSection=fragment.get('section');
 const reviewFilter=['overdue','ready','upcoming'].includes(fragment.get('reviewFilter')??'')?fragment.get('reviewFilter')!:'all';
 const selected=students.some(student=>student.studentId===fragment.get('student'))&&['plans','reviews','messages','tasks','sessions','lessons','access','notes'].includes(selectedSection??'')?{studentId:fragment.get('student')!,section:selectedSection as Section,reviewFilter}:null;
 const changeSelection=(next:typeof selected)=>{if(document.getElementById(drawerId)?.querySelector('[data-coaching-pending="true"]'))return;navigation.requestChange(()=>{const hash=next?`#${new URLSearchParams({student:next.studentId,section:next.section,reviewFilter:next.reviewFilter})}`:'';window.history.pushState(null,'',window.location.pathname+window.location.search+hash);});};
 const changeView=(next:'active'|'history')=>{if(document.getElementById(drawerId)?.querySelector('[data-coaching-pending="true"]'))return;navigation.requestChange(()=>setView(next));};
 useEffect(()=>{const update=(event:Event)=>{const counts=(event as CustomEvent<{counts?:readonly {enrollmentId:string;unreadMessageCount:number}[]}>).detail?.counts;if(!Array.isArray(counts))return;setUnread(current=>({...current,...Object.fromEntries(counts.filter(row=>typeof row.enrollmentId==='string'&&Number.isSafeInteger(row.unreadMessageCount)&&row.unreadMessageCount>=0).map(row=>[row.enrollmentId,row.unreadMessageCount]))}));};window.addEventListener('coaching:mailbox-unread',update);return()=>window.removeEventListener('coaching:mailbox-unread',update);},[]);
 useEffect(()=>{let frame=0;const saved=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{if(!document.getElementById(drawerId)?.querySelector('[data-coaching-unsaved="true"]'))setRevision(value=>value+1);});};window.addEventListener('coaching-saved',saved);return()=>{cancelAnimationFrame(frame);window.removeEventListener('coaching-saved',saved);};},[drawerId]);
 const selectedId=selected?.studentId,requestKey=`${planId??'all'}:${selectedId??''}:${revision}`;
 const confirmationScope=useRef({requestKey,section:selected?.section,view});
 useEffect(()=>{confirmationScope.current={requestKey,section:selected?.section,view};},[requestKey,selected?.section,view]);
 function confirmSidecard(value:StudentSidecardConfirmation){
  const inContext=()=>confirmationScope.current.requestKey===requestKey&&confirmationScope.current.section===selected?.section&&confirmationScope.current.view===view&&new URLSearchParams(window.location.hash.slice(1)).get('student')===selectedId&&new URLSearchParams(window.location.hash.slice(1)).get('section')===selected?.section;
  const taskCount=value.taskCount;
  if(!selectedId||!inContext()||typeof taskCount!=='number'||!Number.isSafeInteger(taskCount)||taskCount<0||(!value.work&&!value.notes))return;
  const confirmedSequence=++operationSequence.current;
  setWorkspace(current=>{
   const cached=current.result;
   if(!inContext()||cached?.key!==requestKey||cached.detail?.studentId!==selectedId)return current;
   const enrollment=cached.detail.enrollments.find(row=>row.enrollmentId===value.enrollmentId&&(!planId||row.planId===planId)&&(view==='active'?row.status==='active':row.status==='ended'));
   if(!enrollment||value.work&&!enrollment.work.some(row=>row.workId===value.work!.workId)||value.notes&&!enrollment.studentContext)return current;
   return {...current,confirmedSequence,result:{...cached,detail:{...cached.detail,enrollments:cached.detail.enrollments.map(row=>row.enrollmentId!==value.enrollmentId?row:{...row,taskCount,work:value.work?row.work.map(work=>work.workId===value.work!.workId?value.work!:work):row.work,studentContext:value.notes&&row.studentContext?{...row.studentContext,notes:value.notes}:row.studentContext})}},taskCounts:{...current.taskCounts,[selectedId]:{...current.taskCounts[selectedId],[value.enrollmentId]:taskCount}}};
  });
 }
 const detail=result?.key===requestKey?result.detail:null,error=result?.key===requestKey?result.error:'',loading=Boolean(selectedId&&result?.key!==requestKey);
 useEffect(()=>{
  if(!selectedId)return;const abort=new AbortController(),sequence=++operationSequence.current;
  const currentRequest=()=>!abort.signal.aborted&&confirmationScope.current.requestKey===requestKey&&new URLSearchParams(window.location.hash.slice(1)).get('student')===selectedId;
  const query=new URLSearchParams({studentId:selectedId,includeMessages:'false'});if(planId)query.set('planId',planId);
  fetch(`/api/coaching/student-workspace?${query}`, {cache:'no-store',signal:abort.signal}).then(async response=>{if(!response.ok)throw new Error('Student details could not be loaded.');return response.json();}).then(value=>{
   if(!currentRequest())return;const {detail,counts}=checkedWorkspace(value,selectedId,planId);
   setWorkspace(current=>!currentRequest()||sequence<current.confirmedSequence?current:{...current,result:{key:requestKey,detail,error:''},taskCounts:{...current.taskCounts,[selectedId]:planId?{...current.taskCounts[selectedId],...counts}:counts}});
  }).catch(error=>{
   if(!currentRequest())return;
   setWorkspace(current=>{
    if(!currentRequest()||sequence<current.confirmedSequence||current.result?.key===requestKey&&current.result.detail)return current;
    return {...current,result:{key:requestKey,detail:null,error:error instanceof Error?error.message:'Student details could not be loaded.'}};
   });
  });
  return()=>abort.abort();
 },[selectedId,requestKey,planId]);
 const scopedDetail=detail?{...detail,enrollments:detail.enrollments.filter(enrollment=>(!planId||enrollment.planId===planId)&&(view==='active'?enrollment.status==='active':enrollment.status==='ended'))}:null;
 const student=scopedDetail?.studentId===selectedId?scopedDetail:students.find(student=>student.studentId===selectedId),section=selected?.section;
 const orderedReviews=(student?.enrollments??[]).flatMap(enrollment=>enrollment.reviews.filter(review=>reviewMatches(review,reviewFilter,nowUtc)).map(review=>({enrollment,review}))).sort((a,b)=>(a.review.dueAtUtc??periodAvailableAt(a.review.periodEnd)??'9999').localeCompare(b.review.dueAtUtc??periodAvailableAt(b.review.periodEnd)??'9999'));
 const selectedWork=fragment.get('work');useEffect(()=>{if(!loading&&selectedWork)document.getElementById(`coaching-work-${selectedWork}`)?.scrollIntoView({block:'start'});},[loading,selectedWork]);
 const visibleStudents=students.map(student=>({...student,enrollments:student.enrollments.filter(e=>view==='active'?e.status==='active':e.status==='ended')})).filter(student=>student.enrollments.length&&student.name.toLowerCase().includes(search.trim().toLowerCase()));
 return <Stack spacing={2}>
 <Stack direction={{xs:'column',sm:'row'}} spacing={1} sx={{alignItems:{sm:'center'},'& .MuiButton-root':{alignSelf:'flex-start'},'& .MuiTextField-root':{width:{xs:'100%',sm:280}}}}><Button variant={view==='active'?'contained':'outlined'} onClick={()=>changeView('active')}>Active students</Button><Button variant={view==='history'?'contained':'outlined'} onClick={()=>changeView('history')}>Past students</Button><TextField label="Find a student" size="small" value={search} onChange={event=>setSearch(event.target.value)}/></Stack>
 <Grid container spacing={2}>{visibleStudents.map(student=>{
  const reviews=student.enrollments.flatMap(e=>e.reviews),overdue=reviews.filter(r=>reviewMatches(r,'overdue',nowUtc)).length,ready=reviews.filter(r=>reviewMatches(r,'ready',nowUtc)).length,upcoming=reviews.filter(r=>reviewMatches(r,'upcoming',nowUtc)).length;
  const tasks=student.enrollments.reduce((count,e)=>count+(taskCounts[student.studentId]?.[e.enrollmentId]??e.taskCount??0),0),messageCounts=student.enrollments.map(e=>unread[e.enrollmentId]??e.unreadMessageCount),messages=messageCounts.every((value):value is number=>typeof value==='number')?messageCounts.reduce((count,value)=>count+value,0):null;
  const open=(section:Section,reviewFilter='all')=>changeSelection({studentId:student.studentId,section,reviewFilter});
  const href=(section:Section,reviewFilter='all')=>`#${new URLSearchParams({student:student.studentId,section,reviewFilter})}`;
  return <Grid key={student.studentId} size={{xs:12,md:6,xl:4}}><Box data-coaching-student-card sx={{border:1,borderColor:'divider',borderRadius:2,p:2,height:'100%'}}><Stack spacing={2}>
   <Stack direction="row" spacing={1.5} sx={{alignItems:'center'}}><Avatar src={student.avatarUrl??undefined} alt={student.name}>{student.name.slice(0,1)}</Avatar><Box><Typography color="text.primary" component="h2" variant="h3">{student.name}</Typography><Typography color="text.secondary" variant="body2">{student.enrollments.length===1?student.enrollments[0].planName:`${student.enrollments.length} ${view==='active'?'active':'past'} plans`}</Typography></Box></Stack>
   {student.enrollments.some(e=>e.missingAccess)?<Box><Chip component="a" href={href('access')} onClick={event=>{event.preventDefault();open('access');}} clickable color="warning" label="Journal access: Access missing"/></Box>:null}
   <Box component="section" aria-label="Reviews" sx={{borderTop:1,borderBottom:1,borderColor:'divider',py:1.5}}><Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between',gap:1,mb:view==='active'?1:0}}><Typography color="text.primary" component="h3" variant="h3">Reviews</Typography><Button onClick={()=>open('reviews')} variant="outlined" size="small">All reviews</Button></Stack>
    {view==='active'?<Stack direction="row" sx={{columnGap:2,rowGap:.5,flexWrap:'wrap'}}>{([['Overdue',overdue,'overdue'],['Ready',ready,'ready'],['Next 7 days',upcoming,'upcoming']] as const).map(([label,count,filter])=><Link key={filter} href={href('reviews',filter)} onClick={event=>{event.preventDefault();open('reviews',filter);}} underline="always" color={filter==='overdue'&&count?'error.main':'text.primary'} sx={{fontSize:14,fontWeight:600,textUnderlineOffset:'4px',minHeight:40,display:'inline-flex',alignItems:'center',gap:.25,borderRadius:.5,px:.5,'&:hover':{bgcolor:'action.hover'},'&:focus-visible':{outline:'2px solid',outlineColor:'primary.main',outlineOffset:3}}} aria-label={`${count} ${label} reviews`}>{label} ({count})<ChevronRightIcon sx={{fontSize:16}}/></Link>)}</Stack>:null}
   </Box>
   <Box component="nav" aria-label={`${student.name} coaching resources`} sx={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',columnGap:2,rowGap:.5}}>{([['plans','Plans',AssignmentOutlinedIcon],['tasks',`Tasks (${tasks})`,ChecklistOutlinedIcon],['messages',messages===null?'Messages':`Messages (${messages})`,MailOutlinedIcon],['sessions','Sessions',EventOutlinedIcon],['lessons','Lesson access',MenuBookOutlinedIcon],['notes','Notes',EditNoteOutlinedIcon]] as const).map(([section,label,Icon])=><Link key={section} title={section==='messages'&&messages===null?'Unread count is unavailable until Mailbox is enabled.':undefined} href={href(section)} onClick={event=>{event.preventDefault();open(section);}} color="text.primary" underline="none" sx={{fontSize:14,fontWeight:600,minHeight:48,display:'flex',alignItems:'center',gap:1,px:1,borderBottom:1,borderColor:'divider',borderRadius:1,'&:hover':{bgcolor:'action.hover'},'&:focus-visible':{outline:'2px solid',outlineColor:'primary.main',outlineOffset:2,bgcolor:'action.focus'}}}><Icon aria-hidden sx={{fontSize:20,color:'text.secondary',flexShrink:0}}/><Box component="span" sx={{flex:1}}>{label}</Box><ChevronRightIcon aria-hidden sx={{fontSize:18,color:'text.secondary',flexShrink:0}}/></Link>)}</Box>
  </Stack></Box></Grid>;
 })}</Grid>{!visibleStudents.length?<Typography>{search.trim()?'No students match your search.':view==='active'?'No active students.':'No past students.'}</Typography>:null}
 <Drawer anchor="right" open={Boolean(student)} onClose={()=>changeSelection(null)} slotProps={{paper:{sx:{width:{xs:'100vw',md:760},maxWidth:'100vw'}}}}>
  <Stack direction="row" sx={{p:2,alignItems:'center',borderBottom:1,borderColor:'divider',position:'sticky',top:0,bgcolor:'background.paper',zIndex:1}}><Typography color={drawerTextColor} variant="h2" sx={{flex:1}}>{student?.name} · {section==='lessons'?'Lesson access':section?section.charAt(0).toUpperCase()+section.slice(1):''}</Typography><Button onClick={()=>changeSelection(null)}>Close</Button></Stack>
  <Stack id={drawerId} spacing={3} sx={{p:3}}>{loading?<Typography color={drawerTextColor} role="status">Loading student workspace…</Typography>:error?<Alert severity="warning" action={<Button onClick={()=>setRevision(value=>value+1)}>Retry</Button>}>{error}</Alert>:student&&section==='reviews'?<Box>{student.enrollments.length===1?<Typography color={drawerTextColor} variant="h3" sx={{mb:2}}>{student.enrollments[0].planName}</Typography>:null}<Stack spacing={2}>{orderedReviews.map(({enrollment,review})=><Box key={review.reviewId}>{student.enrollments.length>1?<Typography color={drawerTextColor} variant="body2" sx={{mb:.5}}>{enrollment.planName}</Typography>:null}<Typography color={drawerTextColor}>{coachingReviewLabel(review.kind,'Review')} · {review.status.replaceAll('_',' ')}</Typography><Typography variant="body2" color={drawerTextColor}>{review.dueAtUtc?`Due ${new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(review.dueAtUtc))} ET`:periodAvailableAt(review.periodEnd)?`Start Date: ${new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',dateStyle:'medium',timeStyle:'short'}).format(new Date(periodAvailableAt(review.periodEnd)!))} ET · Awaiting submission`:'Awaiting student submission'}</Typography><Button component={NextLink} prefetch={false} href={`/coaching/reviews/${review.reviewId}?returnTo=${encodeURIComponent(typeof window==='undefined'?'/coaching/students':window.location.pathname+window.location.search+navigation.hash)}`}>{review.status==='draft'?'Continue review':review.status==='ready'?'Start review':review.status==='awaiting_submission'&&periodAvailableAt(review.periodEnd)&&periodAvailableAt(review.periodEnd)!>nowUtc?'View schedule':'Open review'}</Button></Box>)}{!orderedReviews.length?<Typography color={drawerTextColor}>No matching reviews.</Typography>:null}</Stack></Box>:student&&section==='messages'?<IndependentMessageMailbox key={`${student.studentId}:${planId??'all'}:${view}`} scope={{studentId:student.studentId,planId,status:view==='active'?'active':'ended'}}/>:student&&section&&['tasks','sessions','lessons','notes'].includes(section)?<IndependentStudentSidecards key={`${student.studentId}:${section}:${planId??'all'}:${view}:${selectedWork??''}`} studentId={student.studentId} enrollments={student.enrollments} section={section as StudentSidecardSection} nowUtc={nowUtc} planId={planId} initialWorkId={selectedWork??undefined} onConfirmed={confirmSidecard}/>:student&&section==='access'&&!student.enrollments.some(enrollment=>enrollment.missingAccess)?<Alert severity="success">Required Journal access is available.</Alert>:student?.enrollments.filter(enrollment=>section!=='access'||enrollment.missingAccess).map(enrollment=><Box key={enrollment.enrollmentId}>
   <Typography color={drawerTextColor} variant="h3" sx={{mb:2}}>{enrollment.planName}</Typography>
   {section==='plans'?<Stack spacing={2}><Typography color={drawerTextColor}>{enrollment.status}</Typography>{enrollment.agreements.filter(a=>a.status==='accepted'||a.status==='proposed').map(a=><Box key={a.agreementId}><Typography color={drawerTextColor}>{a.status} · {new Intl.NumberFormat('en-US',{style:'currency',currency:a.terms.currency}).format(a.terms.priceAmountMinor/100)}</Typography><Box sx={{'& p.MuiTypography-root, & h4.MuiTypography-root, & dt.MuiTypography-root, & dd.MuiTypography-root':{color:drawerTextColor}}}><AcceptedServiceDetails terms={a.terms}/></Box></Box>)}<Button href={`/coaching/enrollments/${enrollment.enrollmentId}${planId?`?returnTo=${encodeURIComponent(typeof window==='undefined'?`/coaching/plans/${planId}`:window.location.pathname+window.location.search+navigation.hash)}`:''}`} variant="outlined">Open agreement</Button></Stack>:null}
   {section==='access'?<Stack spacing={2}><Alert severity={enrollment.missingAccess?'warning':'success'}>{enrollment.missingAccess?'The student must update Journal access before this plan can be reviewed.':'Required Journal access is available.'}</Alert>{enrollment.missingScopes?.length?<Typography color={drawerTextColor}>Missing access: {enrollment.missingScopes.map(scope=>COACHING_ACCESS_LABELS[scope]).join(' · ')}</Typography>:null}{enrollment.reviewAccountMismatch?<Typography color={drawerTextColor}>The shared Journal account differs from the account used for submitted review work. Ask the student to restore access to that account; saved feedback stays with its original account.</Typography>:null}{enrollment.accountAvailable===false&&enrollment.missingAccess?<Typography color={drawerTextColor}>The student needs to select an active Journal account and save the required access.</Typography>:null}</Stack>:null}
  </Box>)}</Stack>
 </Drawer>{navigation.confirmation}</Stack>;
}
