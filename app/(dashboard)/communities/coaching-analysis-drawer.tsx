"use client";
import {useState,useTransition} from "react";
import {useRouter} from "next/navigation";
import {Box,Button,Checkbox,Chip,Drawer,Grid,MenuItem,Stack,Table,TableBody,TableCell,TableContainer,TableHead,TableRow,TextField,Typography} from "@mui/material";
import type {AnalyticsLabPlatformPageModel,AnalyticsLabPlatformPreview,AnalyticsLabPlatformQuery} from "../analytics/lab/analytics-lab-platform-types";
import {formatJournalAnalyticsMetric as metricValue} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type {DaySessionTradeAnalyzer} from "../trade-tracker/[sessionDate]/day-session-types";
import {loadCoachingAnalysisAction,loadCoachingAnalyzerAction} from "./coaching-analysis-actions";
import {selectCommunityReviewTradesAction} from "./community-actions";

const number=(value:string|number|null|undefined)=>value==null?"—":Number(value).toLocaleString("en-US",{maximumFractionDigits:2});

export function CoachingAnalysisDrawer({communitySlug,relationshipId,reviewId,disabled,readOnly}:{communitySlug:string;relationshipId:string;reviewId:string;disabled:boolean;readOnly:boolean}){
 const router=useRouter();const [open,setOpen]=useState(false),[pending,startTransition]=useTransition(),[error,setError]=useState("");
 const [query,setQuery]=useState<AnalyticsLabPlatformQuery|null>(null),[preview,setPreview]=useState<AnalyticsLabPlatformPreview|null>(null);
 const [currencies,setCurrencies]=useState<readonly string[]>([]),[symbols,setSymbols]=useState<readonly string[]>([]),[checked,setChecked]=useState<string[]>([]);
 const [options,setOptions]=useState<Pick<AnalyticsLabPlatformPageModel,"metrics"|"groupings">>({metrics:[],groupings:[]});
 const [analyzer,setAnalyzer]=useState<DaySessionTradeAnalyzer|null>(null),[analyzerTitle,setAnalyzerTitle]=useState("");
 const request=(next?:AnalyticsLabPlatformQuery,cursor?:string|null)=>startTransition(async()=>{
  setError("");const result=await loadCoachingAnalysisAction(relationshipId,next,cursor);
  if(!result.ok){setError(result.message);return;}
  setPreview(result.preview);setChecked([]);if(result.model){setQuery(result.model.initialQuery);setCurrencies(result.model.currencies);setSymbols(result.model.symbols);setOptions({metrics:result.model.metrics,groupings:result.model.groupings});}
 });
 const patch=(change:Partial<AnalyticsLabPlatformQuery>)=>setQuery(value=>value?{...value,...change}:value);
 const rows=preview?.evidence?.rows??[];
 return <><Button disabled={disabled} onClick={()=>{setOpen(true);if(!preview)request();}} variant="outlined">Analysis tools</Button>
  <Drawer anchor="right" open={open} onClose={()=>setOpen(false)} slotProps={{paper:{sx:{width:{xs:"100%",md:"min(1100px,95vw)"},p:{xs:2,sm:3}}}}}>
   <Stack spacing={2}><Stack direction="row" sx={{justifyContent:"space-between",alignItems:"center"}}><Typography variant="h2">Student analysis</Typography><Button onClick={()=>setOpen(false)}>Close</Button></Stack>
    {error?<Typography role="alert" color="error">{error}</Typography>:null}
    {query?<Box component="form" onSubmit={event=>{event.preventDefault();request(query);}}><Grid container spacing={1.5}>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="From" type="date" value={query.startDate} onChange={event=>patch({startDate:event.target.value})} slotProps={{inputLabel:{shrink:true}}}/></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="To" type="date" value={query.endDate} onChange={event=>patch({endDate:event.target.value})} slotProps={{inputLabel:{shrink:true}}}/></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Currency" select value={query.currency??""} onChange={event=>patch({currency:event.target.value||null})}><MenuItem value="">All currencies</MenuItem>{currencies.map(currency=><MenuItem key={currency} value={currency}>{currency}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Ticker" select value={query.symbol??""} onChange={event=>patch({symbol:event.target.value||null})}><MenuItem value="">All tickers</MenuItem>{symbols.map(symbol=><MenuItem key={symbol} value={symbol}>{symbol}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Group by" select value={query.grouping} onChange={event=>patch({grouping:event.target.value as AnalyticsLabPlatformQuery["grouping"]})}>{options.groupings.map(({value,label})=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Result" select value={query.outcome??""} onChange={event=>patch({outcome:(event.target.value||null) as AnalyticsLabPlatformQuery["outcome"]})}>{Object.entries({"":"All results",win:"Winning",loss:"Losing",flat:"Flat"}).map(([value,label])=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="P/L basis" select value={query.moneyBasis} onChange={event=>patch({moneyBasis:event.target.value as AnalyticsLabPlatformQuery["moneyBasis"]})}><MenuItem value="net">Net</MenuItem><MenuItem value="gross">Gross</MenuItem></TextField></Grid>
     <Grid size={{xs:12,md:6}}><TextField fullWidth label="Statistic" select value={query.metricId} onChange={event=>patch({metricId:event.target.value})}>{options.metrics.map(metric=><MenuItem key={metric.metricId} value={metric.metricId}>{metric.title}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Direction" select value={query.direction??""} onChange={event=>patch({direction:(event.target.value||null) as AnalyticsLabPlatformQuery["direction"]})}><MenuItem value="">Both</MenuItem><MenuItem value="long">Long</MenuItem><MenuItem value="short">Short</MenuItem></TextField></Grid>
     <Grid size={{xs:6,md:3}}><TextField fullWidth label="Trades per page" select value={query.evidenceRows} onChange={event=>patch({evidenceRows:Number(event.target.value) as AnalyticsLabPlatformQuery["evidenceRows"]})}>{[12,24,50,100].map(count=><MenuItem key={count} value={count}>{count}</MenuItem>)}</TextField></Grid>
     <Grid size={{xs:6,md:3}}><Button fullWidth type="submit" disabled={pending} variant="contained" sx={{height:56}}>Apply</Button></Grid>
    </Grid></Box>:null}
    {pending?<Typography role="status">Loading…</Typography>:null}
    {preview?.response.partitions.map(partition=><Box key={partition.currency??"all"}><Typography variant="h3">Analytics report · {partition.currency??"Trades"}</Typography>
     <Stack direction="row" sx={{gap:1,flexWrap:"wrap",my:1}}><Chip label={`${partition.coverage.includedCount} included`} color="info"/><Chip label={`${partition.coverage.needsDecisionCount} need decisions`} color="warning"/><Chip label={`${partition.coverage.feeIncompleteCount} missing fees`} color="warning"/></Stack>
     <Grid container spacing={1}>{partition.metrics.map(metric=><Grid key={metric.metricId} size={{xs:6,md:3}}><Box sx={{p:1.5,border:1,borderColor:"divider",borderRadius:2}}><Typography variant="body2">{metric.title}</Typography><Typography sx={{fontWeight:800}}>{metricValue(metric)}</Typography>{metric.state!=="complete"?<Chip size="small" label={metric.state==="partial"?"Partial data":metric.state==="empty"?"No matching data":"Unavailable"}/>:null}</Box></Grid>)}</Grid>
     {partition.groups.length?<TableContainer><Table size="small"><TableHead><TableRow><TableCell>Group</TableCell>{partition.groups[0].metrics.map(metric=><TableCell key={metric.metricId}>{metric.title}</TableCell>)}</TableRow></TableHead><TableBody>{partition.groups.map(group=><TableRow key={group.groupKey}><TableCell>{group.label}</TableCell>{group.metrics.map(metric=><TableCell key={metric.metricId}>{metricValue(metric)}</TableCell>)}</TableRow>)}</TableBody></Table></TableContainer>:null}
    </Box>)}
    <Typography variant="h3">Trade Explorer</Typography>
    {preview?.evidenceUnavailableReason?<Typography>{preview.evidenceUnavailableReason}</Typography>:null}
    <TableContainer><Table size="small"><TableHead><TableRow><TableCell>Ticker</TableCell><TableCell>Date</TableCell><TableCell>Direction</TableCell><TableCell>P/L</TableCell><TableCell>Analyzer</TableCell><TableCell>Select</TableCell></TableRow></TableHead><TableBody>{rows.map(row=><TableRow key={row.roundTripId}><TableCell>{row.displayedSymbol}</TableCell><TableCell>{row.closeLocalDate}</TableCell><TableCell>{row.direction==="long"?"Long":"Short"}</TableCell><TableCell>{number(row.selectedPnlDecimal)}</TableCell><TableCell><Button disabled={pending} onClick={()=>startTransition(async()=>{setAnalyzer(null);setAnalyzerTitle(`${row.displayedSymbol} · ${row.closeLocalDate}`);const result=await loadCoachingAnalyzerAction(relationshipId,row.roundTripId);if(result.ok)setAnalyzer(result.analyzer);else setError(result.message);})}>View analysis</Button></TableCell><TableCell><Checkbox disabled={readOnly} checked={checked.includes(row.roundTripId)} slotProps={{input:{"aria-label":`Select ${row.displayedSymbol} ${row.closeLocalDate}`}}} onChange={event=>setChecked(current=>event.target.checked?[...current,row.roundTripId]:current.filter(id=>id!==row.roundTripId))}/></TableCell></TableRow>)}</TableBody></Table></TableContainer>
    <Stack direction="row" sx={{justifyContent:"flex-end",gap:1}}>{preview?.evidence?.continuationCursor?<Button disabled={pending} onClick={()=>query&&request(query,preview.evidence?.continuationCursor)}>Next trades</Button>:null}<Button disabled={pending||readOnly||!rows.length} onClick={()=>setChecked(rows.map(row=>row.roundTripId))}>Select all</Button><Button disabled={pending||readOnly||!checked.length} variant="contained" onClick={()=>startTransition(async()=>{const data=new FormData();data.set("communitySlug",communitySlug);data.set("relationshipId",relationshipId);data.set("reviewId",reviewId);checked.forEach(id=>data.append("roundTripId",id));try{await selectCommunityReviewTradesAction(data);setChecked([]);router.refresh();}catch{setError("The selected trades could not be added. Refresh and try again.");}})}>Add trades</Button></Stack>
    {analyzerTitle?<Box><Typography variant="h3">Trade Analyzer · {analyzerTitle}</Typography>{!analyzer&&!pending?<Typography>No saved analysis</Typography>:null}{analyzer?<><Typography>{analyzer.status.replaceAll("_"," ")}</Typography><TableContainer><Table size="small"><TableHead><TableRow><TableCell>Execution (UTC)</TableCell><TableCell>Price</TableCell><TableCell>VWAP distance</TableCell><TableCell>EMA 9 distance</TableCell><TableCell>Favorable move</TableCell><TableCell>Adverse move</TableCell></TableRow></TableHead><TableBody>{analyzer.events.map(event=><TableRow key={event.eventId}><TableCell>{event.executedAt.replace("T"," ").slice(0,19)}</TableCell><TableCell>{number(event.price)}</TableCell><TableCell>{number(event.metrics.vwapDistance?.signedDistance)}</TableCell><TableCell>{number(event.metrics.ema9Distance?.signedDistance)}</TableCell><TableCell>{number(event.metrics.excursionUntilFlat?.favorableMove)}</TableCell><TableCell>{number(event.metrics.excursionUntilFlat?.adverseMove)}</TableCell></TableRow>)}</TableBody></Table></TableContainer></>:null}</Box>:null}
   </Stack>
  </Drawer>
 </>;
}
