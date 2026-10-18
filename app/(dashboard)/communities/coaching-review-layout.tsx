"use client";
import {useEffect,useRef,useState,type ReactNode} from "react";
import {Alert,Box,Button,CircularProgress,Collapse,Drawer,Grid,Stack,Typography,useMediaQuery,useTheme} from "@mui/material";
import {TradeDetailsDrawer} from "../trades/trade-details-drawer";
import {loadCoachingAnalyzerAction} from "./coaching-analysis-actions";
import {DashboardPanel} from "@/app/dashboard-ui";
import {COACHING_RESOURCES,COACHING_RESOURCE_GROUPS,coachingResource,type CoachingResourceId} from "@/src/modules/communities/contracts/coaching-review-resources";
import {CoachingReviewProgressContext,type CoachingTradeProgress,CoachingResourceContext} from "./coaching-resource-context";
import {loadCoachingReviewResource,readCoachingAnalyzerEvidence} from "./coaching-review-resource-actions";

type Destination={id:CoachingResourceId;parameters:Record<string,string>};
export function CoachingReviewLayout({children,requirements,communitySlug,relationshipId,reviewId,availableResources,resourceProblem,period}:{children:ReactNode;requirements:ReactNode;communitySlug:string;relationshipId:string;reviewId:string;availableResources:readonly string[];resourceProblem:string|null;period:{start:string;end:string}|null}){
 const theme=useTheme(),desktop=useMediaQuery(theme.breakpoints.up("lg"));
 const sidebar=useRef<HTMLDivElement|null>(null);
 const [progress,setProgress]=useState<CoachingTradeProgress|null>(null);
 const [detailTrade,setDetailTrade]=useState<string|null>(null);
 const [sheet,setSheet]=useState<'requirements'|'resources'|null>(null);
 const [expanded,setExpanded]=useState<string[]>([]),[destinations,setDestinations]=useState<Destination[]>([]);
 const [content,setContent]=useState<ReactNode>(null),[loading,setLoading]=useState(false),[error,setError]=useState<string|null>(null),[fullscreen,setFullscreen]=useState(false);
 const request=useRef(0),renderedKey=useRef(""),trigger=useRef<HTMLElement|null>(null),historyDepth=useRef(0),closing=useRef(false),resourcesScroll=useRef(0),menuRef=useRef<HTMLDivElement|null>(null);
 const destination=destinations.at(-1),resource=destination?coachingResource(destination.id):null;
 async function renderPage(next:Destination){renderedKey.current=JSON.stringify(next);const token=++request.current;setContent(null);setLoading(true);setError(null);try{const result=await loadCoachingReviewResource(communitySlug,reviewId,next.id,next.parameters);if(request.current!==token)return;setContent(result.content);setError(result.error);}catch{if(request.current===token)setError('Could not load this resource. Try again.');}finally{if(request.current===token)setLoading(false);}}
 function open(next:Destination,drilldown=false){if(!destinations.length&&document.activeElement instanceof HTMLElement)trigger.current=document.activeElement;resourcesScroll.current=menuRef.current?.scrollTop??resourcesScroll.current;const stack=drilldown?[...destinations,next]:[next];setDestinations(stack);setSheet(null);historyDepth.current++;window.history.pushState({...window.history.state,coachingResource:{reviewId,stack,depth:historyDepth.current}},'',window.location.href);void renderPage(next);}
 function openSheet(next:'requirements'|'resources'){setSheet(next);historyDepth.current++;window.history.pushState({...window.history.state,coachingResource:{reviewId,stack:[],sheet:next,depth:historyDepth.current}},'',window.location.href);}
 function openTrade(id:string){setDetailTrade(id);historyDepth.current++;window.history.pushState({...window.history.state,coachingResource:{reviewId,stack:destinations,detailTrade:id,depth:historyDepth.current}},'',window.location.href);}
 function closeTrade(){if(window.history.state?.coachingResource?.detailTrade)window.history.back();else setDetailTrade(null);}
 function close(){renderedKey.current="";setDetailTrade(null);request.current++;setDestinations([]);setContent(null);setSheet(null);setLoading(false);if(historyDepth.current){const depth=historyDepth.current;historyDepth.current=0;closing.current=true;window.history.go(-depth);}}
 function back(){if(historyDepth.current)window.history.back();else{setDestinations([]);setContent(null);setSheet('resources');}}
 useEffect(()=>{const pop=(event:PopStateEvent)=>{if(closing.current){closing.current=false;return;}const state=event.state?.coachingResource;historyDepth.current=state?.reviewId===reviewId?state.depth??0:0;const stack:Destination[]=state?.reviewId===reviewId?state.stack:[];setDetailTrade(state?.reviewId===reviewId?state.detailTrade??null:null);setDestinations(stack);if(stack.length){setSheet(null);if(renderedKey.current!==JSON.stringify(stack.at(-1)!))void renderPage(stack.at(-1)!);}else{renderedKey.current="";request.current++;setContent(null);setLoading(false);setSheet(state?.reviewId===reviewId?state.sheet??null:null);}};window.addEventListener('popstate',pop);return()=>{request.current++;window.removeEventListener('popstate',pop);};},[communitySlug,reviewId]);
 useEffect(()=>{if(sheet==='resources'&&menuRef.current)menuRef.current.scrollTop=resourcesScroll.current;},[sheet]);
 // One editor stays mounted across breakpoints. Mobile presentation traps focus locally
 // so the draft guard can still inspect its fields without a portal or duplicate form.
 useEffect(()=>{
  if(desktop||!sheet)return;
  const previous=document.activeElement instanceof HTMLElement?document.activeElement:null;
  const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  const panel=sidebar.current;
  const focusable=()=>Array.from(panel?.querySelectorAll<HTMLElement>('button,input,select,textarea,a[href],[tabindex="0"]')??[]).filter(element=>element.getClientRects().length&&!element.hasAttribute('disabled'));
  (focusable()[0]??panel)?.focus();
  const anotherDialog=()=>Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"][aria-modal="true"]')).some(element=>element!==panel&&!panel?.contains(element)&&element.getClientRects().length>0);
  const keyboard=(event:KeyboardEvent)=>{if(anotherDialog())return;if(event.key==='Escape'){event.preventDefault();close();}if(event.key==='Tab'){const items=focusable(),first=items[0],last=items.at(-1);if(!first){event.preventDefault();panel?.focus();}else if(event.shiftKey&&(document.activeElement===first||!panel?.contains(document.activeElement))){event.preventDefault();last?.focus();}else if(!event.shiftKey&&(document.activeElement===last||!panel?.contains(document.activeElement))){event.preventDefault();first.focus();}}};
  const focus=(event:FocusEvent)=>{if(anotherDialog())return;if(!panel?.contains(event.target as Node))(focusable()[0]??panel)?.focus();};
  document.addEventListener('keydown',keyboard);document.addEventListener('focusin',focus);
  return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard);document.removeEventListener('focusin',focus);if(previous?.isConnected)previous.focus();};
 },[desktop,sheet]);
 function navigate(href:string){const url=new URL(href,window.location.origin);if(url.pathname.startsWith('/trade-tracker/')&&url.searchParams.get('trade')){openTrade(url.searchParams.get('trade')!);return;}const target=COACHING_RESOURCES.find(item=>item.path===url.pathname);if(!target||!availableResources.includes(target.id)){setError('This link is unavailable in this read-only review. Use Resources or Back.');return;}open({id:target.id,parameters:Object.fromEntries(url.searchParams)},target.id!==destination?.id);}
 const menu=<Stack spacing={1} ref={menuRef} onScroll={event=>{resourcesScroll.current=event.currentTarget.scrollTop;}} sx={{overflowY:'auto'}}>{resourceProblem?<Alert severity="info">{resourceProblem}</Alert>:null}{period?<Typography color="text.secondary" variant="body2">{period.start} – {period.end}</Typography>:null}{COACHING_RESOURCE_GROUPS.map(group=>{const items=group.items.filter(item=>availableResources.includes(item.id));if(!items.length)return null;return items.length===1?<Button key={group.label} onClick={()=>open({id:items[0].id,parameters:{}})} sx={{justifyContent:'space-between',minHeight:44}} variant="outlined">{items[0].label}<span>›</span></Button>:<Box key={group.label}><Button fullWidth aria-expanded={expanded.includes(group.label)} onClick={()=>setExpanded(current=>current.includes(group.label)?current.filter(value=>value!==group.label):[...current,group.label])} sx={{justifyContent:'space-between',minHeight:44}} variant="outlined">{group.label}<span>{expanded.includes(group.label)?'⌃':'⌄'}</span></Button><Collapse in={expanded.includes(group.label)}><Stack sx={{pl:1,pt:1}}>{items.map(item=><Button key={item.id} onClick={()=>open({id:item.id,parameters:{}})} sx={{justifyContent:'flex-start',minHeight:44}}>{item.label}</Button>)}</Stack></Collapse></Box>;})}</Stack>;
 return <CoachingReviewProgressContext.Provider value={{progress,setProgress}}>
 <TradeDetailsDrawer analyzer={null} detailsUrl={detailTrade?`/api/communities/${communitySlug}/coaching/reviews/${reviewId}/trades/${detailTrade}?view=card`:undefined} loadSavedAnalysis={async()=>{if(!detailTrade)return null;const result=await loadCoachingAnalyzerAction(communitySlug,reviewId,detailTrade);return result.ok?result.analyzer:null;}} open={Boolean(detailTrade)} roundTripId={detailTrade} onClose={closeTrade}/>
 <Stack direction="row" spacing={1} sx={{display:{xs:'flex',lg:'none'},mb:2}}><Button fullWidth variant="outlined" onClick={()=>openSheet('requirements')}>Requirements & progress</Button><Button fullWidth variant="outlined" id={`review-resources-${reviewId}`} onClick={()=>openSheet('resources')}>Resources</Button></Stack>
 <Grid container spacing={2}><Grid size={{xs:12,lg:8}}>{children}</Grid>
 <Grid size={{xs:12,lg:4}} sx={{display:{xs:sheet?'block':'none',lg:'block'}}}>
 {sheet?<Box onClick={close} aria-hidden="true" sx={{display:{xs:'block',lg:'none'},position:'fixed',inset:0,bgcolor:'action.disabledBackground',zIndex:theme.zIndex.modal-1}}/>:null}
 <Box ref={sidebar} tabIndex={-1} role={!desktop&&sheet?'dialog':undefined} aria-modal={!desktop&&sheet?true:undefined} aria-label={!desktop&&sheet?(sheet==='requirements'?'Requirements & progress':'Resources'):undefined} sx={{position:{xs:'fixed',lg:'static'},inset:{xs:0,lg:'auto'},zIndex:{xs:theme.zIndex.modal,lg:'auto'},height:{xs:'100dvh',lg:'auto'},overflowY:{xs:'auto',lg:'visible'},bgcolor:'background.paper',p:{xs:2,lg:0}}}>
 <Stack spacing={2}><Stack direction="row" sx={{display:{xs:'flex',lg:'none'},justifyContent:'space-between',alignItems:'center'}}><Typography component="h2" variant="h2">{sheet==='requirements'?'Requirements & progress':'Resources'}</Typography><Button onClick={close}>Close</Button></Stack>
 <Box sx={{display:{xs:sheet==='requirements'?'block':'none',lg:'block'}}}>{requirements}</Box>
 <Box sx={{display:{xs:sheet==='resources'?'block':'none',lg:'block'}}}><DashboardPanel title="Resources">{menu}</DashboardPanel></Box>
 </Stack></Box></Grid></Grid>
 <Drawer anchor="right" open={Boolean(destination)} onClose={close} slotProps={{transition:{onExited:()=>{if(!sheet){if(trigger.current?.isConnected&&trigger.current.offsetParent!==null)trigger.current.focus();else document.getElementById(`review-resources-${reviewId}`)?.focus();}}},paper:{sx:{width:fullscreen?'100vw':{xs:'100vw',lg:'calc(100vw - 96px)'},maxWidth:'100vw',height:'100dvh'}}}}>
 <Stack direction="row" spacing={1} sx={{p:2,alignItems:'center',borderBottom:1,borderColor:'divider',position:'sticky',top:0,bgcolor:'background.paper',zIndex:1}}><Button onClick={back}>Back</Button><Typography component="h2" variant="h2" sx={{flex:1}}>{resource?.label}</Typography><Button sx={{display:{xs:'none',lg:'inline-flex'}}} onClick={()=>setFullscreen(value=>!value)}>{fullscreen?'Restore':'Full screen'}</Button><Button onClick={close}>Close</Button></Stack>
 <Box data-coaching-resource-view sx={{p:{xs:1,sm:3},overflow:'auto'}} onClickCapture={event=>{const target=event.target instanceof Element?event.target.closest('a[href]'):null;if(target instanceof HTMLAnchorElement){event.preventDefault();event.stopPropagation();navigate(target.href);}}}>
 {loading?<Stack spacing={2} sx={{alignItems:'center',p:4}} role="status"><CircularProgress/><Typography>Loading {resource?.label}</Typography></Stack>:null}
 {error?<Alert severity="warning" action={destination?<Button onClick={()=>void renderPage(destination)}>Retry</Button>:null}>{error}</Alert>:null}
 {destination&&resource?<CoachingResourceContext.Provider value={{pathname:resource.path,parameters:{...destination.parameters,range:'custom',start:period?.start??'',end:period?.end??''},openTrade,fetchRead:async(path)=>{const result=await readCoachingAnalyzerEvidence(communitySlug,reviewId,path);return new Response(result.body,{status:result.status,headers:{'content-type':'application/json'}});},navigate}}>{content}</CoachingResourceContext.Provider>:null}
 </Box></Drawer>
 </CoachingReviewProgressContext.Provider>;
}
