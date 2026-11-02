"use client";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect,useRef,useState } from "react";
import { DashboardPanel,DashboardPrimaryAction } from "@/app/dashboard-template";
import type { ScannerAuditDailyReview,ScannerAuditHealth,ScannerAuditRejection,ScannerAuditTimelinePoint } from "@/src/modules/scanner/live/audit/contracts";

const compact=new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:1});
const label=(value:string)=>value.replaceAll("_"," ");
const byteNumber=new Intl.NumberFormat("en-US",{maximumFractionDigits:1});
function formatBytes(value:number):string{
  const units=["B","KB","MB","GB","TB"];let amount=value,index=0;
  while(amount>=1000&&index<units.length-1){amount/=1000;index++;}
  return `${byteNumber.format(amount)} ${units[index]}`;
}
type AuditRow=Readonly<{key:string;time:string;symbol:string;price:number;score:number|null;rank:number|null;reason:string}>;

export function ScannerAuditClient(){
  const [health,setHealth]=useState<ScannerAuditHealth|null>(null),[healthError,setHealthError]=useState(false);
  const [date,setDate]=useState(()=>new Date().toISOString().slice(0,10)),[symbol,setSymbol]=useState("");
  const [points,setPoints]=useState<readonly ScannerAuditTimelinePoint[]>([]),[nextBefore,setNextBefore]=useState<string|null>(null);
  const [timelineError,setTimelineError]=useState(false),[timelineLoading,setTimelineLoading]=useState(false);
  const [review,setReview]=useState<ScannerAuditDailyReview|null>(null),[reviewError,setReviewError]=useState(false),[reviewLoading,setReviewLoading]=useState(false);
  const [scanner,setScanner]=useState<"gainers"|"momentum">("momentum"),[session,setSession]=useState(""),[reason,setReason]=useState("");
  const [rejections,setRejections]=useState<readonly ScannerAuditRejection[]>([]),[rejectionCursor,setRejectionCursor]=useState<string|null>(null);
  const [rejectionError,setRejectionError]=useState(false),[rejectionLoading,setRejectionLoading]=useState(false),[rejectionLoaded,setRejectionLoaded]=useState(false);
  const requestSequence=useRef({review:0,timeline:0,rejections:0});
  const queryState=useRef({date,symbol,scanner,session,reason});

  useEffect(()=>{let timer:ReturnType<typeof setTimeout>|undefined;const controller=new AbortController();const load=async()=>{try{const response=await fetch("/api/admin/screeners/audit/health",{cache:"no-store",credentials:"same-origin",signal:controller.signal});if(!response.ok)throw Error();setHealth((await response.json()).health);setHealthError(false);}catch{if(!controller.signal.aborted)setHealthError(true);}finally{if(!controller.signal.aborted)timer=setTimeout(()=>void load(),5000);}};void load();return()=>{controller.abort();if(timer)clearTimeout(timer);};},[]);

  const clearReview=()=>{requestSequence.current.review++;setReview(null);setReviewError(false);setReviewLoading(false);};
  const clearTimeline=()=>{requestSequence.current.timeline++;setPoints([]);setNextBefore(null);setTimelineError(false);setTimelineLoading(false);};
  const clearRejections=()=>{requestSequence.current.rejections++;setRejections([]);setRejectionCursor(null);setRejectionError(false);setRejectionLoading(false);setRejectionLoaded(false);};
  const changeDate=(value:string)=>{queryState.current={...queryState.current,date:value};setDate(value);clearReview();clearTimeline();clearRejections();};
  const changeSymbol=(value:string)=>{const next=value.toUpperCase();queryState.current={...queryState.current,symbol:next};setSymbol(next);clearTimeline();clearRejections();};
  const changeScanner=(value:"gainers"|"momentum")=>{queryState.current={...queryState.current,scanner:value};setScanner(value);clearRejections();};
  const changeSession=(value:string)=>{queryState.current={...queryState.current,session:value};setSession(value);clearRejections();};
  const changeReason=(value:string)=>{const next=value.toLowerCase();queryState.current={...queryState.current,reason:next};setReason(next);clearRejections();};

  const loadReview=async()=>{const key=date,sequence=++requestSequence.current.review;setReviewLoading(true);setReviewError(false);try{const response=await fetch(`/api/admin/screeners/audit/daily?date=${encodeURIComponent(date)}`,{cache:"no-store",credentials:"same-origin"});const body=await response.json();if(!response.ok)throw Error();if(sequence===requestSequence.current.review&&key===queryState.current.date)setReview(body.review);}catch{if(sequence===requestSequence.current.review&&key===queryState.current.date)setReviewError(true);}finally{if(sequence===requestSequence.current.review&&key===queryState.current.date)setReviewLoading(false);}};
  const loadTimeline=async(before?:string)=>{const key=`${date}\u0000${symbol.trim()}`,sequence=++requestSequence.current.timeline;setTimelineLoading(true);setTimelineError(false);try{const query=new URLSearchParams({date,symbol});if(before)query.set("before",before);const response=await fetch(`/api/admin/screeners/audit/timeline?${query}`,{cache:"no-store",credentials:"same-origin"});const body=await response.json();if(!response.ok)throw Error();const current=`${queryState.current.date}\u0000${queryState.current.symbol.trim()}`;if(sequence!==requestSequence.current.timeline||key!==current)return;setPoints(value=>before?[...body.points,...value]:body.points);setNextBefore(body.nextBeforeUtc);}catch{const current=`${queryState.current.date}\u0000${queryState.current.symbol.trim()}`;if(sequence===requestSequence.current.timeline&&key===current)setTimelineError(true);}finally{const current=`${queryState.current.date}\u0000${queryState.current.symbol.trim()}`;if(sequence===requestSequence.current.timeline&&key===current)setTimelineLoading(false);}};
  const loadRejections=async(cursor?:string)=>{const key=`${date}\u0000${scanner}\u0000${session}\u0000${reason.trim()}\u0000${symbol.trim()}`,sequence=++requestSequence.current.rejections;setRejectionLoading(true);setRejectionError(false);try{const query=new URLSearchParams({date,scanner});if(session)query.set("session",session);if(reason.trim())query.set("reason",reason.trim());if(symbol.trim())query.set("symbol",symbol.trim());if(cursor)query.set("cursor",cursor);const response=await fetch(`/api/admin/screeners/audit/rejections?${query}`,{cache:"no-store",credentials:"same-origin"});const body=await response.json();if(!response.ok)throw Error();const current=`${queryState.current.date}\u0000${queryState.current.scanner}\u0000${queryState.current.session}\u0000${queryState.current.reason.trim()}\u0000${queryState.current.symbol.trim()}`;if(sequence!==requestSequence.current.rejections||key!==current)return;setRejections(value=>cursor?[...value,...body.rows]:body.rows);setRejectionCursor(body.nextCursor);setRejectionLoaded(true);}catch{const current=`${queryState.current.date}\u0000${queryState.current.scanner}\u0000${queryState.current.session}\u0000${queryState.current.reason.trim()}\u0000${queryState.current.symbol.trim()}`;if(sequence===requestSequence.current.rejections&&key===current)setRejectionError(true);}finally{const current=`${queryState.current.date}\u0000${queryState.current.scanner}\u0000${queryState.current.session}\u0000${queryState.current.reason.trim()}\u0000${queryState.current.symbol.trim()}`;if(sequence===requestSequence.current.rejections&&key===current)setRejectionLoading(false);}};

  const stateColor=health?.state==="complete"?"success":health?.state==="partial"?"warning":"error";
  const metrics:readonly [string,string][]=health?[["Last cycle",health.lastCycleAtUtc?new Date(health.lastCycleAtUtc).toLocaleTimeString():"n/a"],["Cycles today",String(health.cyclesToday)],["Observations",compact.format(health.observationsToday)],["Evidence",formatBytes(health.evidenceBytesToday)],["Control database",formatBytes(health.controlDatabaseBytes)],["Bytes / observation",health.bytesPerObservation===null?"n/a":health.bytesPerObservation.toFixed(1)],["20-day projection",health.projectedTwentyDayBytes===null?"n/a":formatBytes(health.projectedTwentyDayBytes)],["Queue",String(health.queueDepth)],["Dropped",String(health.droppedCycles)],["Write time",health.lastWriteDurationMs===null?"n/a":`${health.lastWriteDurationMs} ms`],["Session",health.session??"closed"]]:[];
  return <Stack spacing={2.5}>
    <DashboardPanel title="Audit health" action={health?<Chip color={stateColor} label={health.state} size="small"/>:undefined}>
      {healthError?<Alert severity="error">Scanner audit health could not be loaded.</Alert>:health?<Box sx={{display:"grid",gap:2,gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",md:"repeat(4,minmax(0,1fr))"}}}>{metrics.map(([name,value])=><Box key={name}><Typography color="text.secondary" variant="caption">{name}</Typography><Typography sx={{fontWeight:800}}>{value}</Typography></Box>)}</Box>:<Typography color="text.secondary">Waiting for audit status.</Typography>}
      {health?.lastError?<Alert severity="error" sx={{mt:2}}>{label(health.lastError)}</Alert>:null}
    </DashboardPanel>

    <DashboardPanel title="Daily review" action={<DashboardPrimaryAction disabled={reviewLoading} onClick={()=>void loadReview()}>{reviewLoading?"Loading...":"Load review"}</DashboardPrimaryAction>}>
      <TextField label="Trading date" onChange={event=>changeDate(event.target.value)} size="small" slotProps={{inputLabel:{shrink:true}}} type="date" value={date}/>
      {reviewError?<Alert severity="error" sx={{mt:2}}>The daily review could not be loaded.</Alert>:review?<Stack spacing={2} sx={{mt:2}}>
        {review.sessions.length?<Box sx={{display:"grid",gap:1.5,gridTemplateColumns:{xs:"1fr",md:"repeat(3,1fr)"}}}>{review.sessions.map(item=><Box key={item.session} sx={{border:"1px solid",borderColor:"divider",borderRadius:2,p:1.5}}><Typography sx={{fontWeight:800,textTransform:"capitalize"}}>{label(item.session)}</Typography><Typography variant="body2">{item.cycles} cycles - {compact.format(item.observations)} observations</Typography><Typography variant="body2">Gainers: {compact.format(item.gainerQualified)} qualified - {compact.format(item.gainerDisplayed)} shown</Typography><Typography variant="body2">Momentum: {compact.format(item.momentumQualified)} qualified - {compact.format(item.momentumDisplayed)} shown</Typography>{item.partialCycles?<Typography color="warning.main" variant="body2">{item.partialCycles} partial cycles</Typography>:null}</Box>)}</Box>:<Alert severity="info">No audit cycles were recorded for this date.</Alert>}
        {review.rejectionReasons.length?<Box><Typography sx={{fontWeight:800,mb:1}}>Most common rejection reasons</Typography><Box sx={{display:"flex",flexWrap:"wrap",gap:1}}>{review.rejectionReasons.slice(0,12).map(item=><Chip key={`${item.scanner}-${item.reason}`} label={`${item.scanner}: ${label(item.reason)} - ${compact.format(item.count)}`} size="small"/>)}</Box></Box>:null}
      </Stack>:null}
    </DashboardPanel>

    <DashboardPanel title="Ticker timeline" action={<DashboardPrimaryAction disabled={timelineLoading||!symbol.trim()} onClick={()=>void loadTimeline()}>{timelineLoading?"Loading...":"Load timeline"}</DashboardPrimaryAction>}>
      <TextField label="Ticker" onChange={event=>changeSymbol(event.target.value)} size="small" slotProps={{htmlInput:{maxLength:15}}} value={symbol}/>
      {timelineError?<Alert severity="error" sx={{mt:2}}>The ticker timeline could not be loaded.</Alert>:<Stack spacing={1.5} sx={{mt:2}}>{nextBefore?<DashboardPrimaryAction disabled={timelineLoading} onClick={()=>void loadTimeline(nextBefore)}>Load earlier observations</DashboardPrimaryAction>:null}{points.length?<AuditTable rows={points.map(point=>({key:point.cycleId,time:point.atUtc,symbol:point.decision.symbol,price:point.decision.observation.price,score:point.decision.momentumScore?.total??null,rank:point.decision.momentumRank,reason:point.decision.momentumFailures[0]??"qualified"}))}/>:<Typography color="text.secondary">Enter a ticker to inspect its recorded observations, scores, ranks and rejection reasons.</Typography>}</Stack>}
    </DashboardPanel>

    <DashboardPanel title="Rejection explorer" action={<DashboardPrimaryAction disabled={rejectionLoading} onClick={()=>void loadRejections()}>{rejectionLoading?"Loading...":"Find rejections"}</DashboardPrimaryAction>}>
      <Stack direction={{xs:"column",md:"row"}} spacing={1.5}><TextField sx={{minWidth:{xs:0,md:140}}} label="Scanner" onChange={event=>changeScanner(event.target.value as "gainers"|"momentum")} select size="small" value={scanner}><MenuItem value="momentum">Momentum</MenuItem><MenuItem value="gainers">Top Gainers</MenuItem></TextField><TextField sx={{minWidth:{xs:0,md:160}}} label="Session" onChange={event=>changeSession(event.target.value)} select size="small" value={session}><MenuItem value="">All sessions</MenuItem><MenuItem value="premarket">Premarket</MenuItem><MenuItem value="regular">Regular</MenuItem><MenuItem value="after_hours">After-hours</MenuItem></TextField><TextField sx={{minWidth:{xs:0,md:200},flex:1}} label="Reason code" onChange={event=>changeReason(event.target.value)} size="small" value={reason}/></Stack>
      {rejectionError?<Alert severity="error" sx={{mt:2}}>Rejections could not be loaded.</Alert>:rejections.length?<Stack spacing={1.5} sx={{mt:2}}><AuditTable rows={rejections.map(item=>({key:item.cycleId+item.decision.symbol,time:item.atUtc,symbol:item.decision.symbol,price:item.decision.observation.price,score:item.decision.momentumScore?.total??null,rank:item.scanner==="momentum"?item.decision.momentumRank:item.decision.gainerRank,reason:item.reason}))}/>{rejectionCursor?<DashboardPrimaryAction disabled={rejectionLoading} onClick={()=>void loadRejections(rejectionCursor)}>Load more rejections</DashboardPrimaryAction>:null}</Stack>:rejectionLoaded?<Alert severity="info" sx={{mt:2}}>No recorded ticker matches these rejection filters.</Alert>:<Typography color="text.secondary" sx={{mt:2}}>Inspect the latest rejected ticker state by scanner, session, reason or ticker.</Typography>}
    </DashboardPanel>
  </Stack>;
}

function AuditTable({rows}:{rows:readonly AuditRow[]}){
  return <Box sx={{overflowX:"auto"}}><Table size="small" sx={{minWidth:680,"& .MuiTableCell-root":{whiteSpace:"nowrap"}}}><TableHead><TableRow>{["Time","Ticker","Price","Score","Rank","Decision"].map(value=><TableCell key={value}>{value}</TableCell>)}</TableRow></TableHead><TableBody>{rows.map(row=><TableRow key={row.key}><TableCell>{new Date(row.time).toLocaleTimeString()}</TableCell><TableCell>{row.symbol}</TableCell><TableCell>${row.price.toFixed(4)}</TableCell><TableCell>{row.score?.toFixed(1)??"n/a"}</TableCell><TableCell>{row.rank??"-"}</TableCell><TableCell>{label(row.reason)}</TableCell></TableRow>)}</TableBody></Table></Box>;
}
