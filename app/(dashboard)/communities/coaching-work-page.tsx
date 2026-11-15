"use client";
import {Button,MenuItem,Stack,TextField,Typography} from '@mui/material';
import {DashboardPanel} from '@/app/dashboard-ui';
import type {TraderLinkCommunityCoachingSnapshot as Snapshot} from '@/src/modules/communities/server/traderlink-community-platform-repository';
import {addWorkDays,coachPlanRows,coachingWorkItems,isRemaining,utcDay,validWorkDate} from '@/src/modules/communities/contracts/coaching-work-model';
import {filterWork,useWorkLocation,WorkFilters,WorkList} from './coaching-work-ui';
import {CoachStudentContent} from './coaching-student-content';

export function CoachingWorkPage({snapshot}:{snapshot:Snapshot}){
 const {params,href,change}=useWorkLocation();const now=snapshot.generatedAtUtc??new Date().toISOString(),today=utcDay(now);
 const all=coachingWorkItems(snapshot),plans=coachPlanRows(snapshot,all);
 const dateFiltered=['custom','upcoming'].includes(params.get('range')??'');
 const days=Math.min(365,Math.max(1,Number(params.get('days'))||5)),custom=params.get('range')==='custom';
 const from=custom?(params.get('from')??today):today,through=custom?(params.get('through')??today):addWorkDays(today,days-1);
 const valid=validWorkDate(from)&&validWorkDate(through)&&from<=through;
 const scope=params.get('scope')??'all';
 const queueParams=new URLSearchParams(params);queueParams.set('state','remaining');const queueWork=filterWork(all,queueParams);
 const overdue=queueWork.filter(w=>isRemaining(w)&&w.due&&w.due<now),unscheduled=queueWork.filter(w=>isRemaining(w)&&!w.due);
 const work=filterWork(all,params).filter(w=>scope==='overdue'?isRemaining(w)&&w.due&&w.due<now:scope==='unscheduled'?!w.due:!dateFiltered||(valid&&w.due&&utcDay(w.due)>=from&&utcDay(w.due)<=through)).sort((a,b)=>{const priority=(item:typeof a)=>item.due&&item.due<now?0:item.blocked?.startsWith('Available to start')?2:1;return priority(a)-priority(b);});
 const detailReview=params.get('reviewDetails'),detailRelationship=params.get('studentDetails');
 const detailItem=detailReview&&detailRelationship?all.find(item=>item.id===`review:${detailReview}`&&item.relationshipId===detailRelationship):null;
 const closeDetails=new URL(href,'http://local');closeDetails.searchParams.delete('reviewDetails');closeDetails.searchParams.delete('studentDetails');closeDetails.searchParams.set('focusWork',detailItem?.id??'');
 return <Stack spacing={2}>
  <Typography component="h1" variant="h1">Coaching work</Typography>
  <DashboardPanel><Stack spacing={2}><details><summary style={{cursor:"pointer"}}>Filters</summary><Stack spacing={2} sx={{pt:2}}>
   <Stack direction={{xs:'column',sm:'row'}} spacing={1.5}><TextField size="small" label="Period" select value={dateFiltered?(custom?'custom':'upcoming'):'all'} onChange={e=>change({range:e.target.value==='all'?null:e.target.value,focusWork:null},true)}><MenuItem value="all">All dates</MenuItem><MenuItem value="upcoming">Next days</MenuItem><MenuItem value="custom">Custom dates</MenuItem></TextField>{custom?<><TextField size="small" label="From" type="date" value={from} slotProps={{inputLabel:{shrink:true}}} onChange={e=>change({from:e.target.value,focusWork:null},true)}/><TextField size="small" label="Through" type="date" value={through} slotProps={{inputLabel:{shrink:true}}} onChange={e=>change({through:e.target.value,focusWork:null},true)}/></>:dateFiltered?<TextField size="small" label="Number of days" type="number" value={days} slotProps={{htmlInput:{min:1,max:365}}} onChange={e=>change({days:e.target.value,focusWork:null},true)}/>:null}</Stack>
   <WorkFilters planOptions={plans} params={params} change={change}/>
  </Stack></details>
   <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant={scope!=='overdue'&&scope!=='unscheduled'?'contained':'outlined'} onClick={()=>change({scope:null,focusWork:null})}>Show all work</Button><Button variant={scope==='overdue'?'contained':'outlined'} onClick={()=>change({scope:'overdue',state:'remaining',focusWork:null})}>Overdue ({overdue.length})</Button><Button variant={scope==='unscheduled'?'contained':'outlined'} onClick={()=>change({scope:'unscheduled',state:'remaining',focusWork:null})}>Unscheduled ({unscheduled.length})</Button></Stack>
  </Stack></DashboardPanel>
  <DashboardPanel title={scope==='overdue'?'Overdue work':scope==='unscheduled'?'Unscheduled work':'Next work'}>{!valid&&dateFiltered&&scope!=='overdue'&&scope!=='unscheduled'?<Stack spacing={1}><Typography color="error.main" role="alert">Choose valid dates; Through must be on or after From.</Typography><Button onClick={()=>change({range:null,from:null,through:null},true)}>Reset period</Button></Stack>:<WorkList key={params.toString()} items={work} now={now} returnTo={href} focusId={params.get('focusWork')} detailsInPlace empty={all.length?'No work matches this view. Adjust the period or clear filters.':'No coaching work yet. Your accepted plans and student requests will create work here.'}/>}</DashboardPanel>
  {detailItem&&detailRelationship?<CoachStudentContent snapshot={snapshot} relationshipId={detailRelationship} query={{section:'reviews',plan:detailRelationship,filter:'all'}} directory closeHref={closeDetails.pathname+closeDetails.search}/>:null}
 </Stack>;
}
