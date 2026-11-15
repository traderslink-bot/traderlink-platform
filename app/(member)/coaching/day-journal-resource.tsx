"use client";
import {useEffect,useRef,useState} from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import type {IndependentCoachingJournalReadService} from '@/src/modules/communities/server/independent-coaching-journal-read';

import {useIndependentResourceLocation} from './resource-location';

type Day=ReturnType<IndependentCoachingJournalReadService['dayContext']>[number];
const labels={whatWorked:'What worked',whatNeedsWork:'What needs work',technicalRecap:'Technical recap',tomorrowsFocus:'Current Focuses',anythingElse:'Other notes'};
export function IndependentDayJournalResource({reviewId}:{reviewId:string}){
 const location=useIndependentResourceLocation(),open=location.parameters.get('dayJournal')==='1',selectedDate=location.parameters.get('dayJournalDate');
 const [retry,setRetry]=useState(0);
 const [days,setDays]=useState<Day[]|null>(null),[error,setError]=useState('');
 const visibleDays=(days??[]).filter(day=>!selectedDate||day.date===selectedDate);
 const controller=useRef<AbortController|null>(null);
 useEffect(()=>()=>controller.current?.abort(),[]);
 function show(){location.change({dayJournal:'1',dayJournalDate:null,report:null,reportParams:null,trade:null});}
 useEffect(()=>{if(!open)return;
  controller.current?.abort();const abort=new AbortController();controller.current=abort;setDays(null);setError('');
  async function load(){
  try{const response=await fetch(`/api/coaching/review-resource?reviewId=${encodeURIComponent(reviewId)}&resource=day-context`,{cache:'no-store',signal:abort.signal});if(!response.ok)throw new Error('Trading-day Journal information is unavailable. Check current access.');const result=await response.json();if(!abort.signal.aborted)setDays(result);}catch(error){if(!abort.signal.aborted)setError(error instanceof Error?error.message:'Could not load trading-day Journal.');}
  }
  void load();return()=>abort.abort();
 },[open,reviewId,retry]);
 function close(){controller.current?.abort();location.change({dayJournal:null,dayJournalDate:null},true);}
 return <><Button variant="outlined" onClick={()=>void show()}>Trading-day Journal</Button><Drawer anchor="right" open={open} onClose={close} slotProps={{paper:{sx:{width:{xs:'100vw',lg:900},maxWidth:'100vw',height:'100dvh'}}}}>
  <Stack direction="row" sx={{p:2,alignItems:'center',borderBottom:1,borderColor:'divider'}}><Typography variant="h2" sx={{flex:1}}>Trading-day Journal</Typography><Button onClick={close}>Close</Button></Stack>
  <Stack spacing={3} sx={{p:3}}>{error?<Alert severity="warning" action={<Button onClick={()=>setRetry(value=>value+1)}>Retry</Button>}>{error}</Alert>:days===null?<Typography role="status">Loading trading-day Journal…</Typography>:!visibleDays.length?<Typography>No shared trading-day notes or rules in this review period.</Typography>:visibleDays.map(day=><Box key={day.date}><Typography variant="h3" sx={{mb:2}}>{day.date}</Typography><Stack spacing={2}>{day.notes?Object.entries(day.notes).filter(([,value])=>value).map(([key,value])=><Box key={key}><Typography variant="subtitle2">{labels[key as keyof typeof labels]}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{value}</Typography></Box>):null}{day.rules.map((rule,index)=><Box key={`${rule.title}:${index}`}><Typography variant="subtitle2">{rule.title} · {rule.status.replaceAll('_',' ')}</Typography><Typography sx={{whiteSpace:'pre-wrap'}}>{rule.note}</Typography></Box>)}</Stack></Box>)}</Stack>
 </Drawer></>;
}
