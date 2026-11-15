"use client";
import {useEffect} from "react";
import {Box,Button,Drawer,Stack,Typography} from '@mui/material';
import {DashboardPanel} from '@/app/dashboard-ui';
import type {TraderLinkCommunityCoachingSnapshot as Snapshot} from "@/src/modules/communities/server/traderlink-community-platform-repository";
import {addWorkDays,coachPlanRows,coachingWorkItems,isRemaining,utcDay,validWorkDate,workWeek,WORK_KINDS} from '@/src/modules/communities/contracts/coaching-work-model';
import {filterWork,useWorkLocation,WorkFilters,WorkList} from './coaching-work-ui';

export function CoachingCalendarPage({snapshot}:{snapshot:Snapshot}){
 const {params,href,change}=useWorkLocation(),today=utcDay(snapshot.generatedAtUtc??new Date().toISOString());
 const all=coachingWorkItems(snapshot),plans=coachPlanRows(snapshot,all);
 const view=params.get('view')==='week'?'week':'month',anchor=validWorkDate(params.get('anchor'))?params.get('anchor')!:today;
 const selected=validWorkDate(params.get('day'))?params.get('day'):null,queue=['overdue','unscheduled'].includes(params.get('queue')??'')?params.get('queue'):null;
 const first=view==='month'?anchor.slice(0,7)+'-01':workWeek(anchor),nextMonth=new Date(`${first.slice(0,7)}-01T12:00:00Z`);nextMonth.setUTCMonth(nextMonth.getUTCMonth()+1);const end=view==='month'?utcDay(nextMonth.toISOString()):addWorkDays(first,7);
 const dates:string[]=[];const gridStart=workWeek(first),gridEnd=view==='week'?end:workWeek(addWorkDays(end,6));for(let d=gridStart;d<gridEnd;d=addWorkDays(d,1))dates.push(d);
 const filtered=filterWork(all,params),dayKind=params.get('dayKind'),now=snapshot.generatedAtUtc??new Date().toISOString();
 const dayBaseItems=filtered.filter(w=>queue==='overdue'?isRemaining(w)&&w.due&&w.due<now:queue==='unscheduled'?!w.due:selected&&w.due&&utcDay(w.due)===selected);
 const dayItems=dayBaseItems.filter(w=>!dayKind||w.kind===dayKind);
 const dayCounts=Object.entries(WORK_KINDS).map(([kind,label])=>({kind,label,count:dayBaseItems.filter(w=>w.kind===kind).length})).filter(g=>g.count);
 const queueParams=new URLSearchParams(params);queueParams.set('state','remaining');const queueWork=filterWork(all,queueParams);
 const overdue=queueWork.filter(w=>isRemaining(w)&&w.due&&w.due<now).length,unscheduled=queueWork.filter(w=>isRemaining(w)&&!w.due).length;
 const labelDate=(d:string)=>new Intl.DateTimeFormat('en',{weekday:'long',month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(`${d}T12:00:00Z`));
 const shift=(step:number)=>{if(view==='week')change({anchor:addWorkDays(first,step*7),day:null,queue:null,focusWork:null});else{const date=new Date(`${first}T12:00:00Z`);date.setUTCMonth(date.getUTCMonth()+step);change({anchor:utcDay(date.toISOString()),day:null,queue:null,focusWork:null});}};
 const choose=(d:string,kind?:string)=>change({day:d,anchor:d,queue:null,dayKind:kind??null,focusWork:null});
 const open=Boolean(selected||queue);const scope=params.get('state')??'remaining';
 useEffect(()=>{if(!open)return;const escape=(event:KeyboardEvent)=>{if(event.key!=='Escape')return;event.preventDefault();event.stopPropagation();change({day:null,queue:null,dayKind:null,focusWork:null});};document.addEventListener('keydown',escape,true);return()=>document.removeEventListener('keydown',escape,true);},[open,change]);
 return <Stack spacing={2}>
  <Typography component="h1" variant="h1">Calendar</Typography>
  <DashboardPanel title="Calendar controls"><Stack spacing={2}>
   <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><Button variant={view==='week'?'contained':'outlined'} onClick={()=>change({view:'week'})}>Week</Button><Button variant={view==='month'?'contained':'outlined'} onClick={()=>change({view:'month'})}>Month</Button><Button onClick={()=>change({anchor:today,day:open?today:null,queue:null,focusWork:null})}>Today</Button><Button onClick={()=>change({queue:'overdue',day:null,dayKind:null,state:'remaining',focusWork:null})}>Overdue ({overdue})</Button><Button onClick={()=>change({queue:'unscheduled',day:null,dayKind:null,state:'remaining',focusWork:null})}>Unscheduled ({unscheduled} remaining)</Button></Stack>
   <WorkFilters planOptions={plans} params={params} change={change}/><Typography variant="body2">{scope==='remaining'?'Remaining work':scope==='all'?'All work':scope.replaceAll('_',' ')} · Times shown in UTC</Typography>
  </Stack></DashboardPanel>
  <DashboardPanel title={view==='month'?new Intl.DateTimeFormat('en',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${first}T12:00:00Z`)):`Week of ${first}`}>
   <Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between',mb:2}}><Button onClick={()=>shift(-1)}>Previous {view}</Button><Button onClick={()=>shift(1)}>Next {view}</Button></Stack>
   <Box sx={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:{xs:.25,md:1}}}>
    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=><Typography key={d} align="center" variant="body2" sx={{fontWeight:700}}>{d}</Typography>)}
    {dates.map(date=>{const work=filtered.filter(w=>w.due&&utcDay(w.due)===date),groups=Object.entries(WORK_KINDS).map(([kind,label])=>({kind,label,count:work.filter(w=>w.kind===kind).length})).filter(g=>g.count);return <Box key={date} sx={{border:(date===selected||(!selected&&!queue&&params.has('anchor')&&date===anchor))?2:1,borderColor:(date===selected||(!selected&&!queue&&params.has('anchor')&&date===anchor))?'primary.main':'divider',borderRadius:1,minWidth:0,p:{xs:.25,md:.75},minHeight:{xs:70,md:view==='month'?108:132},opacity:(date<first||date>=end)?0.55:1,bgcolor:date===today?'action.hover':'background.paper'}}>
     <Button aria-label={`${labelDate(date)}: ${work.length} ${scope==='remaining'?'remaining ':''}assignments`} id={`calendar-date-${date}`} aria-pressed={date===selected||(!selected&&!queue&&params.has("anchor")&&date===anchor)} onClick={()=>choose(date)} sx={{minWidth:0,width:'100%',p:.5,justifyContent:'flex-start',fontWeight:700}}>{Number(date.slice(-2))}{date===today?<Box component="span" sx={{display:{xs:'none',md:'inline'},ml:.5}}>Today</Box>:null}</Button>
     <Button onClick={()=>choose(date)} sx={{display:{xs:'block',md:'none'},minWidth:0,width:'100%',fontSize:11,p:.25}} aria-label={`Open ${labelDate(date)} with ${work.length} assignments`}>{work.length} {scope==='remaining'?'due':'items'}</Button>
     <Stack spacing={.25} sx={{display:{xs:'none',md:'flex'}}}>{groups.slice(0,3).map(g=><Button key={g.kind} size="small" onClick={()=>choose(date,g.kind)} sx={{minWidth:0,p:.25,textAlign:'left',justifyContent:'flex-start',lineHeight:1.3}}>{g.label} {g.count}</Button>)}{groups.length>3?<Button size="small" onClick={()=>choose(date)}>{work.length} total · +{groups.length-3} types</Button>:null}</Stack>
    </Box>})}
   </Box>
  </DashboardPanel>
  <Drawer anchor="right" open={open} onClose={()=>change({day:null,queue:null,dayKind:null,focusWork:null})} slotProps={{transition:{onExited:()=>document.getElementById(`calendar-date-${anchor}`)?.focus()},paper:{role:'dialog','aria-labelledby':'coaching-day-title',sx:{pt:'env(safe-area-inset-top)',pb:'env(safe-area-inset-bottom)',boxSizing:'border-box',width:{xs:'100%',md:'min(980px, 88vw)'},height:'100dvh',bgcolor:'background.default'}}}}>
   <Stack sx={{height:'100%',minHeight:0}}>
    <Box sx={{p:2,borderBottom:1,borderColor:'divider',bgcolor:'background.paper'}}><Stack spacing={1}>
     <Stack direction="row" sx={{justifyContent:'space-between',gap:1}}><Typography component="h2" variant="h2" id="coaching-day-title">{queue==='overdue'?'Overdue work':queue==='unscheduled'?'Unscheduled work':selected?labelDate(selected):''}</Typography><Button id="coaching-day-close" autoFocus onClick={()=>change({day:null,queue:null,dayKind:null,focusWork:null})}>Close</Button></Stack>
     <Typography variant="body2">{dayItems.length} {dayItems.length===1?'assignment':'assignments'} · {scope==='remaining'?'Remaining work':scope==='all'?'All work':scope.replaceAll('_',' ')} · UTC{dayKind?` · ${WORK_KINDS[dayKind]??dayKind}`:''}</Typography>{params.get('plan')?<Typography variant="body2">Plan: {plans.find(p=>p.id===params.get('plan'))?.name??'Unavailable plan'}</Typography>:null}{params.get('kind')?<Typography variant="body2">Work type: {WORK_KINDS[params.get('kind')!]??'Unknown'}</Typography>:null}{params.get('q')?<Typography variant="body2">Search: {params.get('q')}</Typography>:null}
     {dayCounts.length?<Stack direction="row" aria-label="Work type totals" sx={{gap:1,flexWrap:'wrap',maxHeight:140,overflowY:'auto'}}>{dayCounts.map(g=><Button key={g.kind} size="small" variant={dayKind===g.kind?'contained':'outlined'} onClick={()=>change({dayKind:g.kind,focusWork:null},true)}>{g.label} {g.count}</Button>)}</Stack>:null}
     <Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{selected&&!queue?<><Button variant={view==='week'?'contained':'outlined'} onClick={()=>change({view:'week'})}>Week</Button><Button variant={view==='month'?'contained':'outlined'} onClick={()=>change({view:'month'})}>Month</Button><Button onClick={()=>choose(addWorkDays(selected,-1),dayKind??undefined)}>Previous day</Button><Button onClick={()=>choose(addWorkDays(selected,1),dayKind??undefined)}>Next day</Button></>:null}{dayKind||params.get('kind')?<Button onClick={()=>{change({dayKind:null,kind:null,focusWork:null},true);document.getElementById('coaching-day-close')?.focus();}}>Show all work types</Button>:null}{queue!=='overdue'?<Button onClick={()=>change({state:scope==='all'?'remaining':'all',focusWork:null},true)}>{scope==='all'?'Show remaining':'Show all work and history'}</Button>:null}{params.get('plan')||params.get('q')?<Button onClick={()=>{change({plan:null,q:null,kind:null,dayKind:null,focusWork:null},true);document.getElementById('coaching-day-close')?.focus();}}>Clear filters</Button>:null}</Stack>
    </Stack></Box>
    <Box role="region" aria-labelledby="coaching-day-title" sx={{p:{xs:1.5,md:2},overflowY:'auto',minHeight:0,flex:1}}><WorkList key={`${selected}:${queue}:${params.toString()}`} items={dayItems} returnTo={href} focusId={params.get('focusWork')} empty={params.get('q')||params.get('plan')||params.get('kind')||dayKind?'No work matches your filters. Clear filters to check the full day.':'No work due in this view. Show all work and history to check delivered or completed assignments.'}/></Box>
   </Stack>
  </Drawer>
 </Stack>;
}
