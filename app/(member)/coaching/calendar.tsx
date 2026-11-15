"use client";
import {useRef} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonBase from '@mui/material/ButtonBase';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {DashboardPanel} from '@/app/dashboard-template';
import {coachingDate} from '@/src/modules/communities/contracts/coaching-agreements';
import {coachingCalendarDays,coachingCalendarWorkGroups,coachingEasternDay,shiftCoachingCalendar} from '@/src/modules/communities/contracts/independent-coaching-calendar';
import type {IndependentCoachWorkRow} from '@/src/modules/communities/server/independent-coaching-work-read';
import {IndependentCoachingWorkList} from './work-list';

function validDate(raw:string|null,fallback:string):string{try{return raw?coachingDate(raw):fallback;}catch{return fallback;}}
export function IndependentCoachingCalendar({work,nowUtc}:{work:readonly IndependentCoachWorkRow[];nowUtc:string}){
 const router=useRouter(),params=useSearchParams(),openedHere=useRef(false),today=coachingEasternDay(nowUtc);
 const view=params.get('view')==='week'?'week':'month',anchor=validDate(params.get('anchor'),today),selected=validDate(params.get('day'),'');
 const dates=coachingCalendarDays(anchor,view),url=(changes:Record<string,string|null>)=>{const next=new URLSearchParams(params);for(const [key,value] of Object.entries(changes)){if(value===null)next.delete(key);else next.set(key,value);}return `/coaching/calendar?${next}`;};
 function choose(day:string){openedHere.current=true;router.push(url({day}));}
 function close(){if(openedHere.current){openedHere.current=false;router.back();}else router.replace(url({day:null}));}
 const dayWork=work.filter(row=>coachingEasternDay(row.dueAtUtc)===selected);
 return <DashboardPanel title="Calendar"><Stack spacing={2}>
  <Stack direction="row" sx={{alignItems:'center',gap:1,flexWrap:'wrap'}}><Button variant="outlined" onClick={()=>router.replace(url({anchor:shiftCoachingCalendar(anchor,view,-1),day:null}))}>Previous</Button><Typography sx={{flex:1,minWidth:160,fontWeight:600}}>{view==='week'?`${dates[0]} – ${dates.at(-1)}`:new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(`${anchor}T12:00:00Z`))}</Typography><Button variant="outlined" onClick={()=>router.replace(url({anchor:shiftCoachingCalendar(anchor,view,1),day:null}))}>Next</Button><Button onClick={()=>router.replace(url({anchor:today,day:null}))}>Today</Button><Button aria-pressed={view==='week'} variant={view==='week'?'contained':'outlined'} onClick={()=>router.replace(url({view:'week',day:null}))}>Week</Button><Button aria-pressed={view==='month'} variant={view==='month'?'contained':'outlined'} onClick={()=>router.replace(url({view:'month',day:null}))}>Month</Button></Stack>
  <Typography variant="body2" color="text.secondary">Work deadlines in Eastern Time. Select a date to open its submitted work.</Typography>
  <Box sx={{display:'grid',gridTemplateColumns:'repeat(7,minmax(0,1fr))',gap:{xs:0.5,md:1}}}>{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><Typography key={day} sx={{textAlign:"center"}} variant="subtitle2">{day}</Typography>)}{dates.map(day=>{
   const rows=work.filter(row=>coachingEasternDay(row.dueAtUtc)===day),groups=coachingCalendarWorkGroups(rows);
   if(rows.length)return <ButtonBase key={day} type="button" onClick={()=>choose(day)} aria-label={`Open work for ${day}: ${rows.length} due`} aria-expanded={selected===day} sx={{display:'block',textAlign:'left',width:'100%',border:1,borderColor:day===today?'primary.main':'divider',borderRadius:1,p:{xs:0.5,md:1},minHeight:{xs:90,md:130},bgcolor:day===today?'action.hover':'background.paper',opacity:view==='month'&&day.slice(0,7)!==anchor.slice(0,7)?0.6:1,'&:hover':{bgcolor:'action.hover'},'&.Mui-focusVisible':{outline:'2px solid',outlineColor:'traderLink.linkText',outlineOffset:2}}}>
    <Box component="span" sx={{display:'inline-flex',alignItems:'center',minHeight:40,p:0.5,fontSize:14,fontWeight:700,color:'traderLink.linkText'}}>{Number(day.slice(-2))}</Box>
    <Typography component="span" variant="caption" sx={{display:{xs:'block',md:'none'}}}>{rows.length} due</Typography>
    <Stack component="span" spacing={0.5} sx={{display:{xs:'none',md:'flex'}}}>{groups.map(group=><Box component="span" key={group.label} sx={{display:'flex',alignItems:'center',minHeight:40,color:'traderLink.linkText',fontWeight:700,fontSize:{xs:10,md:12},lineHeight:1.3}}>{group.label} ({group.count})</Box>)}</Stack>
   </ButtonBase>;
   return <Box key={day} sx={{border:1,borderColor:day===today?'primary.main':'divider',borderRadius:1,p:{xs:0.5,md:1},minHeight:{xs:90,md:130},bgcolor:day===today?'action.hover':'background.paper',opacity:view==='month'&&day.slice(0,7)!==anchor.slice(0,7)?0.6:1}}><Button onClick={()=>choose(day)} aria-label={`Open work for ${day}`} sx={{minWidth:0,p:0.5}}>{Number(day.slice(-2))}</Button><Typography variant="caption" sx={{display:{xs:"block",md:"none"}}}>{rows.length?`${rows.length} due`:""}</Typography><Stack spacing={0.5} sx={{display:{xs:"none",md:"flex"}}}>{groups.map(group=><Button key={group.label} size="small" onClick={()=>choose(day)} sx={{minWidth:0,p:0,textAlign:'left',justifyContent:'flex-start',fontSize:{xs:10,md:12},lineHeight:1.3}}>{group.label} ({group.count})</Button>)}</Stack></Box>;
  })}</Box>
 </Stack><Drawer anchor="right" open={Boolean(selected)} onClose={close} slotProps={{paper:{sx:{width:{xs:'100vw',lg:1100},maxWidth:'100vw',height:'100dvh'}}}}><Stack direction="row" sx={{p:2,alignItems:'center',borderBottom:1,borderColor:'divider'}}><Typography variant="h2" sx={{flex:1}}>{selected} · Work due</Typography><Button onClick={close}>Close</Button></Stack><Box sx={{p:{xs:2,md:3}}}><IndependentCoachingWorkList work={dayWork} nowUtc={nowUtc} returnTo={`/coaching/calendar?${params}`}/></Box></Drawer></DashboardPanel>;
}
