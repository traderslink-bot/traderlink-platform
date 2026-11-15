"use client";
import {useEffect,useState,useSyncExternalStore} from 'react';
import {usePathname,useRouter,useSearchParams} from 'next/navigation';
import {Alert,Avatar,Box,Button,Chip,MenuItem,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography} from '@mui/material';
import {WORK_KINDS,WORK_STATES,isRemaining,workAction,validWorkReturn,type WorkItem} from '@/src/modules/communities/contracts/coaching-work-model';

export function useWorkLocation(){
 const pathname=usePathname(),search=useSearchParams(),router=useRouter();const query=search.toString();
 useEffect(()=>{const refresh=(e:PageTransitionEvent)=>{if(e.persisted)router.refresh();};window.addEventListener('pageshow',refresh);return()=>window.removeEventListener('pageshow',refresh);},[router]);
 const change=(values:Record<string,string|null>,replace=false)=>{const next=new URLSearchParams(window.location.search);for(const [key,value]of Object.entries(values)){if(value==null||value==='')next.delete(key);else next.set(key,value);}const url=pathname+(next.size?`?${next}`:'');if(replace)window.history.replaceState(null,'',url);else window.history.pushState(null,'',url);};
 return {params:new URLSearchParams(query),pathname,href:pathname+(query?`?${query}`:''),change};
}
export function workDestination(item:WorkItem,returnTo:string){const back=new URL(returnTo,'http://local');back.searchParams.set('focusWork',item.id);const target=new URL(item.href,'http://local');target.searchParams.set('fromWork',back.pathname+back.search);return target.pathname+target.search+target.hash;}
function workDetailsDestination(item:WorkItem,returnTo:string){const target=new URL(returnTo,'http://local');target.searchParams.set('reviewDetails',item.id.replace(/^review:/,''));target.searchParams.set('studentDetails',item.relationshipId??'');target.searchParams.delete('focusWork');return target.pathname+target.search;}
export function workStamp(value:string|null,withTime=true){return value?new Intl.DateTimeFormat('en',{month:'short',day:'numeric',year:'numeric',...(withTime?{hour:'numeric',minute:'2-digit'}:{}),timeZone:'UTC'}).format(new Date(value)):'Unscheduled';}
export function WorkFilters({planOptions,params,change,hidePlan=false}:{planOptions:readonly {id:string;name:string}[];params:URLSearchParams;change:(v:Record<string,string|null>,replace?:boolean)=>void;hidePlan?:boolean}){
 const active=['plan','kind','state'].filter(k=>params.get(k)&&params.get(k)!=='all'&&(k!=='state'||params.get(k)!=='remaining'));
 return <Stack spacing={1.5}>
  <Stack direction={{xs:'column',md:'row'}} spacing={1.5} sx={{alignItems:{md:'flex-start'},flexWrap:{md:'wrap'}}}>
   {!hidePlan?<TextField sx={{minWidth:180}} size="small" label="Plan" select value={params.get('plan')??'all'} onChange={e=>change({plan:e.target.value==='all'?null:e.target.value,focusWork:null},true)}><MenuItem value="all">All plans</MenuItem>{planOptions.map(p=><MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}</TextField>:null}
   <TextField sx={{minWidth:180}} size="small" label="Work type" select value={params.get('kind')??'all'} onChange={e=>change({kind:e.target.value==='all'?null:e.target.value,focusWork:null},true)}><MenuItem value="all">All work types</MenuItem>{Object.entries(WORK_KINDS).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
   <TextField sx={{minWidth:180}} size="small" label="Work status" select value={params.get('state')??'remaining'} onChange={e=>change({state:e.target.value,focusWork:null},true)}><MenuItem value="remaining">Remaining</MenuItem><MenuItem value="all">All work</MenuItem>{Object.entries(WORK_STATES).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}</TextField>
   {active.length?<Button onClick={()=>change({plan:null,kind:null,state:null,q:null,focusWork:null},true)}>Clear filters</Button>:null}
  </Stack>
 </Stack>;
}
export function filterWork(items:readonly WorkItem[],params:URLSearchParams){const state=params.get('state')??'remaining';return items.filter(w=>(!params.get('plan')||w.planId===params.get('plan'))&&(!params.get('kind')||w.kind===params.get('kind'))&&(state==='all'||state==='remaining'?state==='all'||isRemaining(w):w.state===state));}
function WorkDescription({item}:{item:WorkItem}){return <Stack spacing={.5}><Typography sx={{fontWeight:700}}>{item.label}{item.quantity?` · ${item.quantity}`:''}</Typography>{item.blocked?<Typography variant="body2" color="text.secondary">{item.blocked}</Typography>:null}{item.title?<Typography variant="body2" color="text.secondary">{item.title}</Typography>:null}{item.accessProblem?<Typography color="warning.main" variant="body2">{item.accessProblem}</Typography>:null}{item.accessProblem&&item.accessHref?<Button size="small" href={item.accessHref} sx={{alignSelf:'flex-start'}}>View access details</Button>:null}</Stack>;}
function WorkStatus({item,now}:{item:WorkItem;now:string}){const overdue=isRemaining(item)&&Boolean(item.due&&item.due<now);return <Stack spacing={.5}>{item.state==='to_do'&&!overdue?null:<Chip size="small" sx={{alignSelf:'flex-start'}} label={overdue?'Overdue':WORK_STATES[item.state]} color={overdue?'error':item.state==='in_progress'||item.state==='follow_up'?'warning':item.state==='delivered'||item.state==='completed'?'success':'default'}/>}
{item.viewed?<Typography variant="caption">Viewed by student</Typography>:null}{item.progress?<Typography variant="body2">{item.progress}</Typography>:null}</Stack>;}
export function WorkList({items,returnTo,hidePlan=false,focusId=null,empty='No work matches your filters.',detailsInPlace=false,now=new Date().toISOString()}:{items:readonly WorkItem[];returnTo:string;hidePlan?:boolean;focusId?:string|null;empty?:string;detailsInPlace?:boolean;now?:string}){
 const [limit,setLimit]=useState(()=>Math.max(20,items.findIndex(w=>w.id===focusId)+1));
 useEffect(()=>{if(!focusId)return;const desktop=document.getElementById(`work-${focusId}`),mobile=document.getElementById(`mobile-work-${focusId}`);const element=desktop?.getBoundingClientRect().width?desktop:mobile;element?.scrollIntoView({block:'nearest'});element?.querySelector<HTMLElement>('a[href]')?.focus({preventScroll:true});},[focusId]);
 const visible=items.slice(0,limit),target=items.find(w=>w.id===focusId);
 return <Stack spacing={1.5}>
  {focusId?<Alert severity="info">{target?'Returned to your selected work.':'Work updated. It may no longer match this view.'}</Alert>:null}
  {!items.length?<Typography>{empty}</Typography>:<>
   <TableContainer sx={{display:{xs:'none',lg:'block'}}}><Table size="small"><TableHead><TableRow><TableCell>Student</TableCell>{!hidePlan?<TableCell>Plan</TableCell>:null}<TableCell>Work</TableCell><TableCell>Status</TableCell><TableCell>Due (UTC)</TableCell><TableCell>Action</TableCell></TableRow></TableHead><TableBody>{visible.map(w=><TableRow key={w.id} id={`work-${w.id}`} selected={w.id===focusId} hover><TableCell><Stack direction="row" spacing={1} sx={{alignItems:'center'}}><Avatar src={w.avatar??undefined} alt="" sx={{width:28,height:28}}>{w.student.slice(0,1)}</Avatar><Typography variant="body2">{w.student}</Typography></Stack></TableCell>{!hidePlan?<TableCell>{w.plan}</TableCell>:null}<TableCell><WorkDescription item={w}/></TableCell><TableCell><WorkStatus item={w} now={now}/></TableCell><TableCell>{workStamp(w.due)}</TableCell><TableCell><Button variant="outlined" href={detailsInPlace&&w.blocked?workDetailsDestination(w,returnTo):workDestination(w,returnTo)}>{workAction(w)}</Button></TableCell></TableRow>)}</TableBody></Table></TableContainer>
   <Stack spacing={2} sx={{display:{xs:'flex',lg:'none'}}}>{visible.map(w=><Box key={w.id} id={`mobile-work-${w.id}`} sx={{p:2,border:1,borderColor:w.id===focusId?'primary.main':'divider',borderRadius:2}}><Stack spacing={1}><Typography sx={{fontWeight:700}}>{w.student}</Typography>{!hidePlan?<Typography variant="body2">{w.plan}</Typography>:null}<WorkDescription item={w}/><WorkStatus item={w} now={now}/><Typography variant="body2">Due: {workStamp(w.due)} UTC</Typography><Button variant="outlined" href={detailsInPlace&&w.blocked?workDetailsDestination(w,returnTo):workDestination(w,returnTo)}>{workAction(w)}</Button></Stack></Box>)}</Stack>
   <Stack direction="row" sx={{alignItems:'center',gap:1}}><Typography variant="body2">{Math.min(limit,items.length)} of {items.length} assignments</Typography>{limit<items.length?<Button onClick={()=>setLimit(n=>n+20)}>Show more work</Button>:null}</Stack>
  </>}
 </Stack>;
}
export function CoachingWorkReturn({slug,fallbackHref}:{slug:string;fallbackHref?:string}){
 const params=useSearchParams(),pathname=usePathname();const direct=validWorkReturn(params.get('fromWork'),slug),key=`coaching-work-return:${pathname.replace(/\/final$/,'')}`,reviewRoute=/\/reviews\/[0-9a-f-]{36}(?:\/final)?$/.test(pathname);
 const stored=useSyncExternalStore(subscribeReturn,()=>{if(!reviewRoute)return null;try{return validWorkReturn(sessionStorage.getItem(key),slug);}catch{return null;}},()=>null);
 useEffect(()=>{try{if(direct&&reviewRoute){sessionStorage.setItem(key,direct);window.dispatchEvent(new Event('coaching-work-return'));}}catch{/* Direct URL still works without storage. */}},[key,direct,reviewRoute]);
 const href=direct??stored;if(!href)return fallbackHref?<Button variant="outlined" href={fallbackHref} sx={{alignSelf:'flex-start'}}>Return to Students</Button>:null;return <Button variant="outlined" href={href} sx={{alignSelf:'flex-start'}}>{href.includes('/calendar')?'Return to Calendar':/\/plans\//.test(href)?'Return to plan':href.includes('/students')?'Return to Students':'Return to Coaching work'}</Button>;
}

const subscribeReturn=(refresh:()=>void)=>{window.addEventListener("coaching-work-return",refresh);return()=>window.removeEventListener("coaching-work-return",refresh);};
