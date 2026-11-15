"use client";
import {useState} from 'react';
import {Box,Button,Chip,Stack,Typography} from '@mui/material';
import {DashboardPanel} from '@/app/dashboard-ui';
import type {TraderLinkCommunityCoachingSnapshot as Snapshot} from '@/src/modules/communities/server/traderlink-community-platform-repository';
import {coachPlanRows,coachingWorkItems,isRemaining} from '@/src/modules/communities/contracts/coaching-work-model';
import {coachingPlanPriceLabel} from '@/src/modules/communities/contracts/coaching-plan-presentation';
import {updateCommunityCoachingPlanStatusAction} from './community-actions';

export function CoachingPlansPage({snapshot,isReview,ready}:{snapshot:Snapshot;isReview:boolean;ready:boolean}){
 const [limit,setLimit]=useState(20);
 const base=`/communities/${snapshot.community.slug}/workspace`,now=snapshot.generatedAtUtc??new Date().toISOString();

 const rows=coachPlanRows(snapshot,coachingWorkItems(snapshot)),filtered=rows;
 const profile=snapshot.coaches.some(coach=>coach.userId===snapshot.viewer.userId);
 return <DashboardPanel title="Coaching plans"><Stack spacing={2}>
  <Stack direction={{xs:'column',sm:'row'}} spacing={1} sx={{justifyContent:'space-between'}}><Button variant="outlined" href={`${base}/setup${profile?'/plans':''}`}>{profile?'Create a plan':'Set up coach profile'}</Button></Stack>
  <Stack component="ul" spacing={0} sx={{m:0,p:0,listStyle:'none'}}>{filtered.slice(0,limit).map(row=>{
   const remaining=row.work.filter(isRemaining),due=remaining.filter(work=>work.due),overdue=due.filter(work=>work.due!<now);
   const destination=`${base}/plans/${row.id}?back=${encodeURIComponent(`${base}/plans`)}`;
   return <Box component="li" key={row.id} data-coaching-plan-row sx={{py:2,borderBottom:1,borderColor:'divider'}}><Stack direction={{xs:'column',lg:'row'}} spacing={2} sx={{alignItems:{lg:'center'},justifyContent:'space-between'}}>
    <Box sx={{flex:1,minWidth:0}}><Stack direction="row" sx={{gap:1,flexWrap:'wrap',alignItems:'center'}}><Typography component="h2" variant="h3">{row.name}</Typography><Chip size="small" label={row.status==='active'?'Published':row.status==='historical'?'Historical':row.status[0].toUpperCase()+row.status.slice(1)}/></Stack>{row.plan?<Typography variant="body2" color="text.secondary">{coachingPlanPriceLabel(row.plan)} · Capacity: {row.plan.studentCapacity} students</Typography>:<Typography variant="body2" color="text.secondary">Accepted plans and history remain available.</Typography>}</Box>
    <Stack direction="row" sx={{gap:1,flexWrap:'wrap',alignItems:'center'}}><Button href={destination}>Active {row.students===1?'Student':'Students'} ({row.students})</Button><Button href={`${destination}&tab=work&state=remaining`}>Needs Attention ({remaining.length})</Button>{overdue.length?<Button color="error" href={`${destination}&tab=work&scope=overdue&state=remaining`}>Overdue ({overdue.length})</Button>:null}<Button variant="contained" href={destination}>Open plan</Button></Stack>
   </Stack>{row.plan?<Box component="details" sx={{mt:1}}><Box component="summary" sx={{cursor:'pointer',fontWeight:700,fontSize:'0.875rem'}}>Offer settings</Box><Stack direction="row" sx={{gap:1,flexWrap:'wrap',alignItems:'center',mt:1}}><Button href={`${base}/setup/plans?planId=${row.id}`} disabled={!ready} variant="outlined">Edit offer</Button><Box component="form" action={isReview?undefined:updateCommunityCoachingPlanStatusAction}><input type="hidden" name="communitySlug" value={snapshot.community.slug}/><input type="hidden" name="planId" value={row.id}/><Button disabled={isReview||!ready} name="status" type="submit" value={row.status==='active'?'paused':'active'}>{row.status==='active'?'Pause':'Publish'}</Button>{row.status!=='archived'?<Button color="error" disabled={isReview||!ready} name="status" type="submit" value="archived">Archive</Button>:null}</Box></Stack></Box>:null}</Box>;
  })}</Stack>
  {!filtered.length?<Typography>{profile?'No coaching plans yet. Create a plan to get started.':'Save your coach profile to start creating plans.'}</Typography>:null}
  {filtered.length?<Typography variant="caption">{Math.min(limit,filtered.length)} of {filtered.length} plans</Typography>:null}{filtered.length>limit?<Button onClick={()=>setLimit(value=>value+20)}>Show more plans</Button>:null}
 </Stack></DashboardPanel>;
}
