"use client";

import {useMemo,useState} from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import {DashboardPanel} from "@/app/dashboard-ui";
import {CommunityTypography as Typography} from "./community-typography";

type Trade=Readonly<{id:string;ticker:string;date:string;side:string;net:string;source:"coach"|"student";quantity:string;entry:string;exit:string}>;
const DEMO:readonly Trade[]=[
 {id:"10000000-0000-4000-8000-000000000050",ticker:"NVDA",date:"Sep 4",side:"Long",net:"+$186.00",source:"coach",quantity:"100",entry:"$117.20",exit:"$119.06"},
 {id:"10000000-0000-4000-8000-000000000051",ticker:"AMD",date:"Sep 4",side:"Long",net:"+$112.00",source:"student",quantity:"200",entry:"$154.10",exit:"$154.66"},
 {id:"10000000-0000-4000-8000-000000000066",ticker:"TSLA",date:"Sep 4",side:"Short",net:"-$74.50",source:"student",quantity:"50",entry:"$231.30",exit:"$232.79"},
 {id:"10000000-0000-4000-8000-000000000067",ticker:"MSFT",date:"Sep 3",side:"Long",net:"+$48.00",source:"coach",quantity:"40",entry:"$417.10",exit:"$418.30"},
 {id:"10000000-0000-4000-8000-000000000068",ticker:"META",date:"Sep 2",side:"Short",net:"-$39.00",source:"coach",quantity:"30",entry:"$512.20",exit:"$513.50"},
 {id:"10000000-0000-4000-8000-000000000069",ticker:"SPY",date:"Sep 2",side:"Long",net:"+$61.00",source:"coach",quantity:"20",entry:"$548.10",exit:"$551.15"},
];

export function CoachTradeReviewWorkspace({initialTradeIds,isReview}:{initialTradeIds:readonly string[];isReview:boolean}){
 const trades=useMemo(()=>isReview?DEMO:DEMO.filter(trade=>initialTradeIds.includes(trade.id)),[initialTradeIds,isReview]);
 const [view,setView]=useState<"find"|"queue"|"saved">("find");
 const [queued,setQueued]=useState(()=>new Set(isReview?[...initialTradeIds,...trades.filter(trade=>trade.source==="student").map(trade=>trade.id)]:initialTradeIds));
 const [saved,setSaved]=useState(()=>new Set(isReview?["10000000-0000-4000-8000-000000000069"]:[]));
 const [checked,setChecked]=useState(()=>new Set<string>());
 const [focused,setFocused]=useState(()=>isReview?"10000000-0000-4000-8000-000000000066":initialTradeIds[0]??trades[0]?.id??"");
 const [notes,setNotes]=useState<Record<string,string>>({});
 const [search,setSearch]=useState("");
 const [drawer,setDrawer]=useState<null|"details"|"chart"|"trades"|"analytics"|"notes"|"history"|"rules">(null);
 const visible=trades.filter(trade=>{const matches=!search||`${trade.ticker} ${trade.date}`.toLowerCase().includes(search.toLowerCase());if(!matches)return false;if(view==="find")return trade.source!=="student"&&!queued.has(trade.id)&&!saved.has(trade.id);if(view==="queue")return queued.has(trade.id)&&!saved.has(trade.id);return saved.has(trade.id);});
 const active=trades.find(trade=>trade.id===focused)??null;
 const setChecks=(ids:readonly string[])=>setChecked(new Set(ids));
 const addSelected=()=>{setQueued(current=>new Set([...current,...checked]));setChecks([]);setView("queue");};
 const removeSelected=()=>{setQueued(current=>new Set([...current].filter(id=>!checked.has(id))));setSaved(current=>new Set([...current].filter(id=>!checked.has(id))));setChecks([]);};
 const saveReview=()=>{if(!active)return;setSaved(current=>new Set(current).add(active.id));setQueued(current=>{const next=new Set(current);next.delete(active.id);return next;});const next=trades.find(trade=>queued.has(trade.id)&&trade.id!==active.id&&!saved.has(trade.id));setFocused(next?.id??"");setView(next?"queue":"saved");};
 return <Stack spacing={2}>
  <DashboardPanel title="Trades"><Stack spacing={2}>
   <ToggleButtonGroup exclusive fullWidth onChange={(_,next)=>{if(next){setView(next);setChecks([]);}}} size="small" value={view}><ToggleButton value="find">Find trades</ToggleButton><ToggleButton title="Trades to review" value="queue">To review {[...queued].filter(id=>!saved.has(id)).length}</ToggleButton><ToggleButton title="Saved trade reviews" value="saved">Saved {saved.size}</ToggleButton></ToggleButtonGroup>
   <Grid container spacing={1}><Grid size={{xs:12,md:5}}><TextField fullWidth label={view==="find"?"Search trades":view==="queue"?"Search trades to review":"Search saved trade reviews"} onChange={event=>setSearch(event.target.value)} value={search}/></Grid>{view==="find"?<><Grid size={{xs:12,sm:4,md:3}}><TextField defaultValue="since" fullWidth label="Date range" select><MenuItem value="since">Since last review</MenuItem><MenuItem value="custom">Custom dates</MenuItem><MenuItem value="all">All shared trades</MenuItem></TextField></Grid><Grid size={{xs:6,sm:4,md:2}}><TextField defaultValue="2026-09-01" fullWidth label="Start date" slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid><Grid size={{xs:6,sm:4,md:2}}><TextField defaultValue="2026-09-06" fullWidth label="End date" slotProps={{inputLabel:{shrink:true}}} type="date"/></Grid></>:null}</Grid>
   <TradeTable checked={checked} mode={view} onCheck={(id,on)=>setChecked(current=>{const next=new Set(current);if(on)next.add(id);else next.delete(id);return next;})} onDrawer={setDrawer} onFocus={setFocused} rows={visible}/>
   <Stack direction="row" spacing={1} sx={{justifyContent:"flex-end"}}>{view==="find"?<><Button onClick={()=>setChecks(visible.map(trade=>trade.id))}>Select all</Button><Button disabled={!checked.size} onClick={addSelected} title="Add selected to Trades to review" variant="contained">Add to review</Button></>:<><Button disabled={!checked.size} onClick={removeSelected}>Remove selected</Button><Button disabled={!visible.length} onClick={()=>{setChecks(visible.map(trade=>trade.id));setQueued(current=>new Set([...current].filter(id=>!visible.some(trade=>trade.id===id))));setSaved(current=>new Set([...current].filter(id=>!visible.some(trade=>trade.id===id))));}}>Remove all</Button></>}</Stack>
  </Stack></DashboardPanel>
  <DashboardPanel title={active?`Review ${active.ticker} · ${active.date} · Net P/L ${active.net}`:"Select a trade to review"}>{active?<Stack spacing={2}><Stack direction="row" spacing={1} sx={{justifyContent:"flex-end"}}><Button onClick={()=>setDrawer("details")}>Trade Details</Button><Button onClick={()=>setDrawer("chart")}>Chart</Button></Stack><Grid container spacing={1}>{[["Side",active.side],["Quantity",active.quantity],["Entry",active.entry],["Exit",active.exit],["Net P/L",active.net]].map(([label,value])=><Grid key={label} size={{xs:6,sm:4,lg:2.4}}><Box sx={{border:1,borderColor:"divider",borderRadius:2,p:1.25}}><Typography color="text.secondary" variant="caption">{label}</Typography><Typography fontWeight={800}>{value}</Typography></Box></Grid>)}</Grid><TextField fullWidth label="Trade review" minRows={5} multiline onChange={event=>setNotes(current=>({...current,[active.id]:event.target.value}))} value={notes[active.id]??(saved.has(active.id)?"Saved feedback for this trade.":"")}/><Stack direction="row" spacing={1} sx={{justifyContent:"flex-end"}}><Button>Add image</Button><Button>Add student action</Button><Button onClick={saveReview} variant="contained">Save trade review</Button></Stack></Stack>:null}</DashboardPanel>
  <DashboardPanel title="Student Journal"><Grid container spacing={1}>{[["All shared trades","trades"],["Analytics","analytics"],["Journal notes","notes"],["Coaching history","history"]].map(([label,target])=><Grid key={target} size={{xs:12,sm:6}}><Button fullWidth onClick={()=>setDrawer(target as typeof drawer)} sx={{justifyContent:"space-between"}} variant="outlined">{label}<span>›</span></Button></Grid>)}</Grid></DashboardPanel>
  <Drawer anchor="right" onClose={()=>setDrawer(null)} open={drawer!==null}><Box sx={{p:3,width:{xs:"90vw",sm:440}}}><Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}><Typography component="h2" variant="h2">{drawerTitle(drawer)}</Typography><Button onClick={()=>setDrawer(null)}>Close</Button></Stack><Box sx={{alignItems:"center",background:"linear-gradient(135deg, rgba(7,95,156,.14), transparent)",border:1,borderColor:"divider",borderRadius:2,display:"flex",justifyContent:"center",minHeight:280,mt:2,p:2}}><Typography color="text.secondary">{drawerTitle(drawer)}</Typography></Box></Box></Drawer>
 </Stack>;
}

function TradeTable({rows,mode,checked,onCheck,onFocus,onDrawer}:{rows:readonly Trade[];mode:"find"|"queue"|"saved";checked:Set<string>;onCheck:(id:string,on:boolean)=>void;onFocus:(id:string)=>void;onDrawer:(value:"details"|"chart")=>void}){const toggle=(id:string,on:boolean)=>onCheck(id,on);return <><TableContainer sx={{display:{xs:"none",md:"block"}}}><Table size="small" sx={{minWidth:850}}><TableHead><TableRow><TableCell>Ticker</TableCell><TableCell>Trade</TableCell><TableCell>Date</TableCell><TableCell>Net P/L</TableCell>{mode!=="find"?<TableCell>Added by</TableCell>:null}<TableCell>Actions</TableCell><TableCell align="center">{mode==="find"?"Select":"Remove"}</TableCell></TableRow></TableHead><TableBody>{rows.map(trade=><TableRow hover key={trade.id} onClick={()=>mode!=="find"&&onFocus(trade.id)} selected={false}><TableCell><strong>{trade.ticker}</strong></TableCell><TableCell>{trade.side}</TableCell><TableCell>{trade.date}</TableCell><TableCell>{trade.net}</TableCell>{mode!=="find"?<TableCell><Chip color={trade.source==="student"?"info":"warning"} label={trade.source==="student"?"Student":"Coach"} size="small"/></TableCell>:null}<TableCell><Stack direction="row" spacing={.5}>{mode==="queue"?<Button onClick={()=>onFocus(trade.id)} size="small">Review</Button>:null}{mode==="saved"?<Button onClick={()=>onFocus(trade.id)} size="small">View or edit</Button>:null}<Button onClick={()=>onDrawer("details")} size="small">Details</Button><Button onClick={()=>onDrawer("chart")} size="small">Chart</Button></Stack></TableCell><TableCell align="center"><Checkbox checked={checked.has(trade.id)} onChange={event=>toggle(trade.id,event.target.checked)} onClick={event=>event.stopPropagation()} sx={{"& .MuiSvgIcon-root":{fontSize:24}}}/></TableCell></TableRow>)}</TableBody></Table></TableContainer><Stack spacing={1} sx={{display:{xs:"flex",md:"none"}}}>{rows.map(trade=><Box key={trade.id} sx={{border:1,borderColor:"divider",borderRadius:2,p:1.5}}><Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between"}}><Box><Typography fontWeight={800}>{trade.ticker} · {trade.date}</Typography><Typography color="text.secondary" variant="body2">{trade.side} · {trade.net}</Typography></Box><Checkbox checked={checked.has(trade.id)} onChange={event=>toggle(trade.id,event.target.checked)} sx={{"& .MuiSvgIcon-root":{fontSize:24}}}/></Stack>{mode!=="find"?<Chip color={trade.source==="student"?"info":"warning"} label={trade.source==="student"?"Student":"Coach"} size="small" sx={{mt:1}}/>:null}<Stack direction="row" spacing={.5} sx={{mt:1}}>{mode!=="find"?<Button onClick={()=>onFocus(trade.id)} size="small">{mode==="saved"?"View or edit":"Review"}</Button>:null}<Button onClick={()=>onDrawer("details")} size="small">Details</Button><Button onClick={()=>onDrawer("chart")} size="small">Chart</Button></Stack></Box>)}</Stack></>}
function drawerTitle(value:null|"details"|"chart"|"trades"|"analytics"|"notes"|"history"|"rules"){return ({details:"Trade Details",chart:"Stock chart",trades:"All shared trades",analytics:"Analytics",notes:"Journal notes",history:"Coaching history",rules:"Rules"} as const)[value??"details"]}
