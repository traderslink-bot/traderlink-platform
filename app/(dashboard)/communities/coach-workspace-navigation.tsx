"use client";
import type {TraderLinkCommunityCoachingSnapshot as TraderLinkCommunityDashboardSnapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";

import Link from "next/link";
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import ChecklistOutlinedIcon from '@mui/icons-material/ChecklistOutlined';
import MailOutlinedIcon from '@mui/icons-material/MailOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import EditNoteOutlinedIcon from '@mui/icons-material/EditNoteOutlined';
import {useState} from "react";
import {Avatar,Box,Button,Chip,Grid,Stack,TextField,Link as TextLink} from "@mui/material";
import {DashboardPanel} from "@/app/dashboard-ui";

import {coachStudentGroups,coachJournalAccess,coachStudentWork} from "@/src/modules/communities/contracts/coaching-student-directory";
import {CoachingEmptyState} from "./coaching-empty-state";
import {CoachingEnrollmentTerms} from "./coaching-enrollment-terms";
import {setCoachingRelationshipStatusAction} from "./community-actions";
import {CommunityTypography as Typography} from "./community-typography";
export {CoachingWorkPage} from "./coaching-work-page";


export function StudentsPage({snapshot,initialView='active',initialQuery=''}:{snapshot:TraderLinkCommunityDashboardSnapshot;initialView?:'active'|'history';initialQuery?:string}){
 const [view,setView]=useState<'active'|'history'>(initialView);
 const [query,setQuery]=useState(initialQuery);
 const groups=coachStudentGroups(snapshot).filter(group=>group.relationships.some(r=>view==='active'?r.status==='active'&&!r.archivedAtUtc:r.status==='ended'||Boolean(r.archivedAtUtc))).filter(group=>group.relationships[0].studentDisplayName.toLowerCase().includes(query.trim().toLowerCase()));
 const base=`/communities/${snapshot.community.slug}/workspace`;
 return <DashboardPanel title="Students"><Stack spacing={2}>
  <Stack direction={{xs:'column',sm:'row'}} spacing={1} sx={{alignItems:{sm:'center'},'& .MuiButton-root':{alignSelf:'flex-start'},'& .MuiTextField-root':{width:{xs:'100%',sm:280}}}}><Button variant={view==='active'?'contained':'outlined'} onClick={()=>setView('active')}>Active students</Button><Button variant={view==='history'?'contained':'outlined'} onClick={()=>setView('history')}>Past students</Button><TextField size="small" label="Find a student" value={query} onChange={e=>setQuery(e.target.value)}/></Stack>
  <Grid container spacing={2}>{groups.map(group=>{
   const relations=group.relationships.filter(r=>view==='active'?r.status==='active'&&!r.archivedAtUtc:r.status==='ended'||Boolean(r.archivedAtUtc));
   const first=relations[0],work=coachStudentWork(snapshot,relations),access=relations.map(r=>coachJournalAccess(snapshot,r));
   const missing=[...new Set(access.flatMap(a=>a.missing))];const accessLabel=access.some(a=>a.paused)?'Access paused':missing.length?'Access missing':access.some(a=>a.label==='Agreement needed')?'Agreement needed':access.every(a=>!a.required.length)?'Not required':'Ready';
   const href=`${base}/students?${new URLSearchParams({student:first.relationshipId,...(query?{q:query}:{}),...(view==='history'?{view}: {})})}`;
   const taskPlan=relations.find(r=>snapshot.coachingTasks.some(task=>task.relationshipId===r.relationshipId&&task.status==='open'))??first;
   const latestMessage=snapshot.coachingMessages.filter(message=>relations.some(r=>r.relationshipId===message.relationshipId)).sort((a,b)=>b.createdAtUtc.localeCompare(a.createdAtUtc))[0];
   const messagePlan=relations.find(r=>r.relationshipId===latestMessage?.relationshipId)??first;
   return <Grid size={{xs:12,md:6,xl:4}} key={group.studentUserId}><Box data-coaching-student-card sx={{border:1,borderColor:'divider',borderRadius:2,p:2,height:'100%'}}><Stack spacing={2}>
    <Stack direction="row" spacing={1.5} sx={{alignItems:'center'}}><Avatar src={first.studentAvatarUrl??undefined} alt={first.studentDisplayName}>{first.studentDisplayName.slice(0,1)}</Avatar><Box><Typography component="h2" variant="h3">{first.studentDisplayName}</Typography><Typography color="text.secondary" variant="body2">{relations.length===1?first.planName:`${relations.length} ${view==='active'?'active':'past'} plans`}</Typography></Box></Stack>
    {(missing.length||access.some(a=>a.paused))?<Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Chip id={`student-section-${first.studentUserId}-access`} component={Link} href={`${href}&section=access`} clickable color="warning" label={`Journal access: ${accessLabel}`}/></Stack>:null}
    <Box component="section" aria-label="Reviews" sx={{borderTop:1,borderBottom:1,borderColor:'divider',py:1.5}}><Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between',gap:1,mb:view==='active'?1:0}}><Typography component="h3" variant="h3">Reviews</Typography><Button id={`student-section-${first.studentUserId}-reviews`} component={Link} href={`${href}&section=reviews&filter=all`} variant="outlined" size="small">All reviews</Button></Stack>
    {view==='active'?<Stack direction="row" sx={{columnGap:2,rowGap:.5,flexWrap:'wrap'}}>{[['Overdue',work.overdue,'overdue'],['Ready',work.ready,'ready'],['Next 7 days',work.upcoming,'upcoming']].map(([label,items,filter])=><TextLink key={filter as string} component={Link} underline="always" color={filter==='overdue'&&(items as typeof work.ready).length?'error.main':'text.primary'} sx={{fontSize:14,fontWeight:600,textUnderlineOffset:'4px',minHeight:40,display:'inline-flex',alignItems:'center',gap:.25,borderRadius:.5,px:.5,'&:hover':{bgcolor:'action.hover'},'&:focus-visible':{outline:'2px solid',outlineColor:'primary.main',outlineOffset:3,borderRadius:.5}}} href={`${href}&section=reviews&filter=${filter}`} aria-label={`${(items as typeof work.ready).length} ${label} reviews`}>{label as string} ({(items as typeof work.ready).length})<ChevronRightIcon sx={{fontSize:16}}/></TextLink>)}</Stack>:null}</Box>
    <Box component="nav" aria-label={`${first.studentDisplayName} coaching resources`} sx={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',columnGap:2,rowGap:.5}}>{([['plans','Plans',AssignmentOutlinedIcon],['tasks',`Tasks (${work.tasks.length})`,ChecklistOutlinedIcon],['messages',`Messages (${work.messages})`,MailOutlinedIcon],['sessions','Sessions',EventOutlinedIcon],['lessons','Included lessons',MenuBookOutlinedIcon],['history','Notes',EditNoteOutlinedIcon]] as const).map(([section,label,Icon])=><TextLink id={`student-section-${first.studentUserId}-${section}`} component={Link} key={section as string} color="text.primary" href={`${href}&section=${section}${section==='tasks'?`&plan=${taskPlan.relationshipId}`:section==='messages'?`&plan=${messagePlan.relationshipId}`:''}`} underline="none" sx={{fontSize:14,fontWeight:600,minHeight:48,display:'flex',alignItems:'center',gap:1,px:1,borderBottom:1,borderColor:'divider',borderRadius:1,'&:hover':{bgcolor:'action.hover'},'&:focus-visible':{outline:'2px solid',outlineColor:'primary.main',outlineOffset:2,bgcolor:'action.focus'}}}><Icon aria-hidden sx={{fontSize:20,color:'text.secondary',flexShrink:0}}/><Box component="span" sx={{flex:1}}>{label}</Box><ChevronRightIcon aria-hidden sx={{fontSize:18,color:'text.secondary',flexShrink:0}}/></TextLink>)}</Box>
   </Stack></Box></Grid>;
  })}</Grid>
  {!groups.length?(query?<Typography>No students match your search.</Typography>:view==='active'?<CoachingEmptyState snapshot={snapshot} title="No active students"/>:<Typography>No past students.</Typography>):null}
 </Stack></DashboardPanel>;
}

export function EnrollmentRequestsPage({snapshot,isReview=false}:{snapshot:TraderLinkCommunityDashboardSnapshot;isReview?:boolean}){
 const requests=snapshot.relationships.filter(r=>r.coachUserId===snapshot.viewer.userId&&r.status==='pending');
 return <DashboardPanel title="Enrollment requests"><Stack spacing={2}>{!requests.length?<Typography>No enrollment requests yet.</Typography>:null}{requests.map(r=><Box key={r.relationshipId} sx={{border:1,borderColor:'divider',borderRadius:2,p:2}}><Stack spacing={1}>
  <Stack direction="row" spacing={1} sx={{alignItems:'center'}}><Avatar src={r.studentAvatarUrl??undefined} alt={r.studentDisplayName}>{r.studentDisplayName.slice(0,1)}</Avatar><Typography sx={{fontWeight:800}}>{r.studentDisplayName}</Typography></Stack><Typography>{r.planName}</Typography>
  <CoachingEnrollmentTerms plan={snapshot.plans.find(p=>p.planId===r.planId)??null} agreement={snapshot.coachingAgreements?.find(a=>a.relationshipId===r.relationshipId&&a.status==='proposed')}/>
  <Stack direction="row" spacing={1}>{(['active','declined'] as const).map(status=><Box key={status} component="form" action={isReview?undefined:setCoachingRelationshipStatusAction}><input type="hidden" name="relationshipId" value={r.relationshipId}/><input type="hidden" name="status" value={status}/><Button disabled={isReview} type="submit" variant={status==='active'?'contained':'outlined'}>{status==='active'?'Accept enrollment':'Decline'}</Button></Box>)}</Stack>
 </Stack></Box>)}</Stack></DashboardPanel>;
}
