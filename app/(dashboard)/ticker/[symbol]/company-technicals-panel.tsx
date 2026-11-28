"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Accordion, AccordionSummary, AccordionDetails, Box, IconButton, MenuItem, Stack, Tab, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Tabs, TextField, Tooltip, Typography, useMediaQuery, useTheme } from "@mui/material";
import { scannerVolumeBreakdown, SCANNER_VOLUME_LABELS } from "@/src/modules/scanner/live/volume";
import type { BrokerReadings } from "@/src/modules/market-data/workspace-broker-rows";
import type { ScannerSession } from "@/src/modules/scanner/live/contracts";
import type { CompanyTechnicals } from "@/src/modules/company/company-technicals";
import { easternClock } from "@/src/modules/scanner/live/sessions";
import { DashboardPanel } from "@/app/dashboard-ui";
import { sessionNames } from "@/src/modules/company/company-technicals";
import { indicatorDisplayRows, type IndicatorDisplayRow } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import indicatorStyles from "@/app/watchlist/watchlist-indicators-card.module.css";
import { sharedChartStream, type ChartStreamHandle } from "../../charts/shared-chart-data";

type IndicatorRead = {frame:string;vwap:number|null;readings:IndicatorDisplayRow[];days?:CompanyTechnicals["days"]};
const technicalSections = [
  ["stats", "Stats"], ["indicators", "Indicators"], ["sessions", "Sessions"],
] as const;
type TechnicalSection = typeof technicalSections[number][0];
const indicatorNames = [
  ["Trend","Trend"],["Moving averages","EMA"],["RSI","RSI"],["Momentum","RSI momentum"],
  ["VWAP","VWAP"],["Volume","Volume"],["ATR","ATR"],
] as const;

const subDollar=new Intl.NumberFormat("en-US",{minimumFractionDigits:4,maximumFractionDigits:4});
const prices=new Intl.NumberFormat("en-US",{minimumFractionDigits:2,maximumFractionDigits:4});
const numbers=new Intl.NumberFormat("en-US",{maximumFractionDigits:2});
const price=(n:number|null|undefined)=>n==null?"—":`$${(Math.abs(n)<1?subDollar:prices).format(n)}`;
const compactNumbers = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });
const compact = (n:number) => Math.abs(n)>=1000 ? compactNumbers.format(n) : numbers.format(n);
const value=(n:number,suffix="")=>numbers.format(n)+suffix;
const signedPercent=(n:number)=>`${n>0?"+":""}${value(n,"%")}`;
const changeColor=(n:number|null)=>n==null||n===0?undefined:n>0?"success.main":"error.main";
const changeLabels=new Set(["Gap","Distance from high","After-hours change","1m change","5m change"]);
const scannerMetricLabels=new Set([
  "Float turnover", "Relative Vol", "1m change", "5m change", "1m Vol", "5m Vol", "1min dollar vol", "5min Vol spike",
]);
const frames=["1m","5m","15m"] as const;
type Frame=typeof frames[number];
const rangeBases = [["raw", "As traded"], ["split", "Split-adjusted"]] as const;
const rangeDate = new Intl.DateTimeFormat("en-US", { month:"short",day:"numeric",year:"numeric",timeZone:"UTC" });
const sessionDate = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const stickySession = { position: "sticky", left: 0, zIndex: 1, whiteSpace: "nowrap" } as const;
const dateHelp = "Shows the current trading day and the previous trading day.";
const eventTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
});
type CompanyIndicatorReading = Omit<IndicatorDisplayRow,"signals"> & {signals?:readonly {text:string;at:number}[]};
function sampleReads(frame:Frame): CompanyIndicatorReading[] {
  const minutes = Number.parseInt(frame, 10);
  const signal = (text:string, minutesBack:number) => ({
    text, at: Date.parse("2026-11-13T15:30:00Z") - minutesBack * 60_000,
  });
  const fiveMinute = frame === "5m";
  return [
    {label:"Trend",state:fiveMinute?"Mixed trend":"Uptrend",value:"",tone:fiveMinute?"neutral":"bullish",
      explanation:fiveMinute?"The averages and price do not agree on one direction.":"Both moving averages are rising and price remains above EMA20.",
      signals:[signal(fiveMinute?"Uptrend weakened":"Uptrend established",minutes)]},
    {label:"Moving averages",state:"Bullish alignment",value:"EMA9 $0.0302 · EMA20 $0.0290",tone:"bullish",
      explanation:"EMA9 is above EMA20, suggesting short-term price strength.",signals:[signal("EMA 9 crossed above EMA 20",minutes*2)]},
    {label:"RSI",state:fiveMinute?"Bearish momentum":"Bullish momentum",value:fiveMinute?"49.8":"71.2",
      tone:fiveMinute?"bearish":"bullish",conditionState:fiveMinute?undefined:"Overbought",
      explanation:fiveMinute?"Downward price movement has the advantage.":"Upward price movement has the advantage. Strong buying pressure can leave price stretched.",
      signals:fiveMinute?[signal("RSI crossed below 50",minutes),signal("RSI exited overbought",minutes*4)]:[signal("RSI entered overbought",minutes)]},
    {label:"Momentum",state:"Little momentum change",value:"",tone:"neutral",
      explanation:`RSI rose 0.8 points over three completed candles and is currently ${fiveMinute?"below":"above"} 50.`,
      signals:[signal("Downside momentum easing",minutes)]},
    {label:"VWAP",state:"Bullish · Price above VWAP",value:"$0.0289",tone:"bullish",
      explanation:"Intraday VWAP including extended hours.",signals:[signal("Price reclaimed VWAP",minutes*3)]},
    {label:"Volume",state:"Quiet activity",value:"39.4K · 0.74× baseline",tone:"neutral",
      explanation:"Fewer shares are changing hands than recently, so participation is lighter.",signals:[signal("Volume fading",minutes)]},
    {label:"ATR",state:"Narrowing swings",value:"$0.0021 · 7.0%",tone:"neutral",
      explanation:"Recent price swings are getting smaller. ATR measures the size of those swings.",signals:[signal("Volatility contracting",minutes*2)]},
  ];
}

type BrokerTechnicals = BrokerReadings & { session: ScannerSession | null; asOf: number };

export function CompanyTechnicalsPanel({symbol,sample,active,inDrawer,header,children,averageVolumes,broker=false,brokerProfileFacts,allowSupplementalReads=true}:{
  symbol:string;sample?:CompanyTechnicals;active:boolean;inDrawer:boolean;broker?:boolean;
  header:(latestPrice:string|null, change:number|null)=>ReactNode;
  children?:ReactNode;
  brokerProfileFacts?:{float:number|null;marketCap:number|null};
  averageVolumes:readonly (number|null)[];allowSupplementalReads?:boolean;
}){
  const indicatorId=useId();
  const theme=useTheme();
  const narrow=useMediaQuery(theme.breakpoints.down("md"));
  const phoneLandscape=useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px) and (pointer: coarse)");
  const sectionTabs=inDrawer&&(narrow||phoneLandscape);
  const [section,setSection]=useState<TechnicalSection>("stats");
  const statsActive=active&&(!sectionTabs||section==="stats");
  const indicatorsActive=active&&(!sectionTabs||section==="indicators");
  const snapshotActive=!inDrawer||active&&(!sectionTabs||section!=="indicators");
  const brokerHistoryActive=allowSupplementalReads&&broker&&active;
  const technicalsPath=broker?"/api/trading-workspace/broker/company-technicals":"/api/company/technicals";
  const sectionProps=(id:TechnicalSection)=>sectionTabs?{
    id:`${indicatorId}-${id}-panel`, role:"tabpanel",
    "aria-labelledby":`${indicatorId}-${id}-tab`, hidden:section!==id,
  }:{};
  const [dateHelpOpen,setDateHelpOpen]=useState(false);
  const [marketClock,setMarketClock]=useState<ReturnType<typeof easternClock>>();
  const [ranges,setRanges]=useState<Partial<Record<"raw"|"split",CompanyTechnicals["yearRange"]>>>({});
  const displayedRanges=sample?{raw:sample.yearRange,split:sample.splitAdjustedYearRange}:ranges;
  const [liveSnapshot,setSnapshot]=useState<CompanyTechnicals|null>(null);
  const snapshot=sample??liveSnapshot;
  const snapshotDate=useRef<string>(undefined);
  const [livePrice,setLivePrice]=useState<{price:number;time:number}>();
  const [frame,setFrame]=useState<Frame>("5m");
  const [reads,setReads]=useState<IndicatorRead|null>(null);
  const [brokerTechnicals,setBrokerTechnicals]=useState<BrokerTechnicals|null>(null);
  useEffect(()=>{
    if(!brokerHistoryActive)return;
    let source:EventSource|undefined;
    const open=()=>{
      source?.close();
      if(document.hidden){setBrokerTechnicals(null);return;}
      const connection=new EventSource(`/api/trading-workspace/broker/company-technicals?symbol=${encodeURIComponent(symbol)}`);
      source=connection;
      connection.onmessage=event=>{
        if(source!==connection)return;
        try{setBrokerTechnicals(JSON.parse(event.data) as BrokerTechnicals);}
        catch{setBrokerTechnicals(null);}
      };
      connection.onerror=()=>{
        if(source!==connection)return;
        setBrokerTechnicals(null);
        setRanges({});
        setReads(null);
      };
    };
    open();
    document.addEventListener("visibilitychange",open);
    return ()=>{
      source?.close();
      source=undefined;
      document.removeEventListener("visibilitychange",open);
    };
  },[symbol,brokerHistoryActive]);
  useEffect(()=>{
    if(sample||!statsActive)return;
    const controller=new AbortController();
    const load=async()=>{
      if(document.hidden)return;
      await Promise.all(rangeBases.map(async ([basis])=>{
        try{
          const response=await fetch(`${technicalsPath}?symbol=${encodeURIComponent(symbol)}&range=52w&adjustment=${basis}`,{signal:controller.signal});
          if(!response.ok){
            if(broker&&!controller.signal.aborted)setRanges(current=>({...current,[basis]:undefined}));
            return;
          }
          const {yearRange}=await response.json() as Pick<CompanyTechnicals,"yearRange">;
          if((yearRange||broker)&&!controller.signal.aborted)setRanges(current=>({...current,[basis]:yearRange}));
        }catch{
          if(broker&&!controller.signal.aborted)setRanges(current=>({...current,[basis]:undefined}));
        }
      }));
    };
    void load();
    const timer=setInterval(()=>void load(),15*60_000);
    return ()=>{controller.abort();clearInterval(timer);};
  },[symbol,sample,statsActive,broker,technicalsPath]);

  useEffect(()=>{
    if(broker||sample)return;
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    const read=async()=>{
      const clock=easternClock(Date.now());
      // Other tabs only need a fresh baseline when the Eastern date changes.
      if(!document.hidden&&(snapshotActive||snapshotDate.current!==clock.date)){
        setMarketClock(clock);
        try{
          const r=await fetch(`/api/company/technicals?symbol=${encodeURIComponent(symbol)}`,{signal:controller.signal});
          if(r.ok&&!controller.signal.aborted){
            const next=await r.json() as CompanyTechnicals;
            if(!controller.signal.aborted){
              snapshotDate.current=clock.date;
              setSnapshot(current=>({...next,days:next.days.length?next.days:
                current?.days.filter(day=>!next.revisedRangeDates?.includes(day.date))??[]}));
            }
          }else if(!controller.signal.aborted)setSnapshot(current=>current??{days:[],row:null,scannerSignals:[]});
        }catch{if(!controller.signal.aborted)setSnapshot(current=>current??{days:[],row:null,scannerSignals:[]});}
      }
      if(!controller.signal.aborted)timer=setTimeout(read,snapshotActive?5000:60_000);
    };
    void read();
    return ()=>{controller.abort();clearTimeout(timer);};
  },[symbol,sample,snapshotActive,broker]);

  useEffect(()=>{
    if(broker||sample||!allowSupplementalReads)return;
    let stream:ChartStreamHandle|undefined;
    const open=()=>{
      stream?.close();stream=undefined;
      if(document.hidden)return;
      stream=sharedChartStream(`/api/screeners/charts/stream?symbol=${encodeURIComponent(symbol)}&daily=0`);
      stream.addEventListener("price",event=>{
        if(!(event instanceof MessageEvent)||typeof event.data!=="string")return;
        try{
          const {price,time}=JSON.parse(event.data);
          const at=Date.parse(time);
          if(Number.isFinite(price)&&price>0&&Number.isFinite(at))setLivePrice(current=>!current||at>=current.time?{price,time:at}:current);
        }catch{/* Wait for the next valid tick. */}
      });
    };
    const retry=setInterval(()=>{if(!document.hidden)stream?.reconnectIfClosed();},15_000);
    open();document.addEventListener("visibilitychange",open);
    return ()=>{stream?.close();clearInterval(retry);document.removeEventListener("visibilitychange",open);};
  },[symbol,sample,broker,allowSupplementalReads]);

  useEffect(()=>{
    if(sample||!allowSupplementalReads||(!indicatorsActive&&!brokerHistoryActive))return;
    const controller=new AbortController();
    let timer:ReturnType<typeof setTimeout>;
    const load=async()=>{
      if(!document.hidden){
        try{
          const params = `symbol=${encodeURIComponent(symbol)}&frame=${frame}`;
          const url = broker ? `${technicalsPath}?${params}` : `/api/screeners/charts/bars?scannerIndicators=1&details=1&${params}`;
          const response=await fetch(url,{signal:controller.signal});
          if(response.ok){const payload=await response.json() as IndicatorRead;if(!controller.signal.aborted)setReads(payload);}
          else if(broker&&!controller.signal.aborted)setReads(null);
        }catch{if(broker&&!controller.signal.aborted)setReads(null);}
      }
      const period=Number.parseInt(frame,10)*60_000;
      if(!controller.signal.aborted)timer=setTimeout(load,period-Date.now()%period+1500);
    };
    void load();
    return ()=>{controller.abort();clearTimeout(timer);};
  },[symbol,frame,sample,indicatorsActive,broker,brokerHistoryActive,technicalsPath,allowSupplementalReads]);

  const row=snapshot?.row;
  const days=(broker?reads?.days:snapshot?.days)??[];
  const brokerQuote=brokerTechnicals?.quote;
  const brokerBook=brokerTechnicals?.book;
  const brokerSession=brokerTechnicals?.session;
  const brokerVolumes=brokerSession&&brokerQuote?scannerVolumeBreakdown({session:brokerSession,...brokerQuote}):null;
  const current=broker?brokerQuote?.price:livePrice&&(livePrice.time>=Date.parse(row?.providerAtUtc??"")||!row)?livePrice.price:row?.price??days[0]?.ranges.findLast(Boolean)?.close;
  const readings=sample?sampleReads(frame):reads?.frame===frame?reads.readings??[]:[];
  const indicatorRows=indicatorNames.flatMap<CompanyIndicatorReading & {name:string}>(([label,name])=>{
    const read=readings.find(item=>item.label===label);
    if(!read)return [];
    if(label==="VWAP"&&!sample){
      const live=indicatorDisplayRows({timeframe:frame,livePrice:current??null,vwap:reads?.vwap??null}).find(item=>item.label==="VWAP");
      if(live)return [{...read,...live,signals:read.signals,name}];
    }
    return [{...read,name}];
  });
  const candleActivity=snapshot?.candleActivity;
  const brokerClock = brokerTechnicals?.asOf == null ? undefined : easternClock(brokerTechnicals.asOf);
  const currentDate=(broker?brokerClock:marketClock)?.date??"";
  const rangesRevised=!broker&&snapshot?.revisedRangeDates?.includes(currentDate);
  const activity=broker?brokerTechnicals?.activity:rangesRevised?undefined:row?.activity;
  const minute=marketClock?.minute??-1;
  const activeSession=broker?(brokerSession==="premarket"?0:brokerSession==="regular"?1:brokerSession==="after_hours"?2:-1):sample?1:minute>=240&&minute<1200 ? minute<570?0:minute<960?1:2 : -1;
  const todayRanges=sample?days[0]?.ranges:days.find(day=>day.date===currentDate)?.ranges;
  const regularClose=broker?brokerQuote?.previousClose??days.find(day=>day.date<currentDate)?.ranges[1]?.close:sample?days[1]?.ranges[1]?.close:days.find(day=>day.date<currentDate)?.ranges[1]?.close;
  const regularOpen=todayRanges?.[1]?.open;
  const basis=row?.comparisonPrice??regularClose;
  const headerBasis=row?.gainBasis==="previous_regular_close"?basis:regularClose;
  const dayChange=headerBasis&&current!=null?(current/headerBasis-1)*100:null;
  const gap=regularClose&&regularOpen?(regularOpen/regularClose-1)*100:null;
  const sessionRanges=todayRanges?.filter(range=>range!==null)??[];
  const dayVolume=broker?brokerVolumes?.dayVolume:rangesRevised?snapshot?.dayVolume:row?.dayVolume??snapshot?.dayVolume;
  const volume=broker?(brokerSession==="premarket"?brokerVolumes?.premarketVolume:brokerSession==="regular"?brokerVolumes?.regularVolume:brokerVolumes?.postMarketVolume):rangesRevised?snapshot?.sessionVolume:row?.volume??(sessionRanges.length?sessionRanges.reduce((sum,range)=>sum+range.volume,0):null);
  const float=broker?brokerProfileFacts?.float:row?.float??snapshot?.listedFloat;
  const brokerRelativeVolume = brokerTechnicals?.relativeVolume ?? null;
  const turnover=float&&volume!=null?volume/float*100:null;
  const rangeHigh=sessionRanges.length?Math.max(...sessionRanges.map(range=>range.high)):null;
  const rangeLow=sessionRanges.length?Math.min(...sessionRanges.map(range=>range.low)):null;
  const high=broker?brokerQuote?.dayHigh:(rangesRevised?null:row?.dayHigh)??rangeHigh;
  const low=broker?brokerQuote?.dayLow:(rangesRevised?null:row?.dayLow)??rangeLow;
  const offHigh=high&&current!=null?(current/high-1)*100:rangesRevised?null:row?.offHighPercent;
  const post=todayRanges?.[2];
  const todayClose=todayRanges?.[1]?.close;
  const afterHours=broker?(brokerSession==="after_hours"&&brokerQuote?.regularClose?(brokerQuote.price/brokerQuote.regularClose-1)*100:null):(rangesRevised?null:row?.postMarketGain)??(post&&todayClose?(post.close/todayClose-1)*100:null);
  const bid=broker?brokerBook?.bid:snapshot?.bid;
  const ask=broker?brokerBook?.ask:snapshot?.ask;
  const showScannerMetrics=Boolean(sample||snapshot?.scannerMember);
  const displayed=[
    ["Price",current,"$"],["Day change",dayChange,"%"],["Prev regular close",regularClose??basis,"$"],["Regular open",regularOpen,"$"],
    ["Gap",gap,"%"],
    [SCANNER_VOLUME_LABELS.dayVolume,dayVolume,"shares"],
    ...(broker?([
      [SCANNER_VOLUME_LABELS.premarketVolume,brokerVolumes?.premarketVolume,"shares"],
      [SCANNER_VOLUME_LABELS.regularVolume,brokerVolumes?.regularVolume,"shares"],
      [SCANNER_VOLUME_LABELS.postMarketVolume,brokerVolumes?.postMarketVolume,"shares"],
    ] as const):[]),
    ["Dollar Vol",broker?brokerQuote?.sessionTurnover:rangesRevised?snapshot?.dollarVolume:row?.dollarVolume??snapshot?.dollarVolume,"$compact"],["Float",float,""],
    ["Float turnover",turnover,"%"],["Relative Vol",broker?brokerRelativeVolume:rangesRevised?snapshot?.relativeVolume:row?.relativeVolume??snapshot?.relativeVolume,"×"],["Market cap",broker?brokerProfileFacts?.marketCap:row?.marketCap??snapshot?.listedMarketCap,"$compact"],
    ["Distance from high",offHigh,"%"],["After-hours change",afterHours,"%"],["Day high",high,"$"],["Day low",low,"$"],
    ["10d avg vol",broker?null:averageVolumes[0],""],["3mth avg vol",broker?null:averageVolumes[1],""],
    ["Bid",bid,"$"],["Ask",ask,"$"],["Spread",bid&&ask?(ask-bid)/((ask+bid)/2)*100:row?.spreadPercent,"%"],["VWAP",rangesRevised?snapshot?.sessionVwap:(reads?.frame===frame?reads.vwap:null)??snapshot?.sessionVwap,"$"],
    ["1m change",activity?.oneMinuteGain??candleActivity?.oneMinuteGain,"%"],["5m change",activity?.fiveMinuteGain??candleActivity?.fiveMinuteGain,"%"],["1m Vol",activity?.oneMinuteVolume??candleActivity?.oneMinuteVolume,""],
    ["5m Vol",activity?.fiveMinuteVolume??candleActivity?.fiveMinuteVolume,""],["1min dollar vol",activity?.oneMinuteDollarVolume,"$compact"],["5min Vol spike",activity?.fiveMinuteVolumeSpike??candleActivity?.fiveMinuteVolumeSpike,"×"],
  ] as const;
  const visibleMetrics=displayed.filter(([label,n])=>showScannerMetrics||!scannerMetricLabels.has(label)||
    (broker&&n!=null&&Number.isFinite(n)));
  const snapshotLabels=new Set([...Object.values(SCANNER_VOLUME_LABELS),"Float","Float turnover","Relative Vol","Market cap","Distance from high","Prev regular close","Regular open","Gap","Day high","Day low","10d avg vol","3mth avg vol"]);
  const metrics=(entries:readonly (readonly [string,number|null|undefined,string])[])=>(
    <Box component="dl" sx={{m:0,display:"grid",gridTemplateColumns:{xs:"repeat(2,minmax(0,1fr))",sm:"repeat(4,minmax(0,1fr))"},columnGap:1,rowGap:1.5}}>
      {entries.map(([label,n,unit])=><Box key={label} sx={{minWidth:0}}>
        <Typography component="dt" variant="caption" sx={theme=>({fontWeight:600,color:"#4f6075",...theme.applyStyles("dark",{color:"#a6b6cc"})})}>{label}</Typography>
        <Typography component="dd" variant="body2" sx={{m:0,fontSize:"0.9375rem",lineHeight:1.35,color:changeLabels.has(label)?changeColor(n??null):undefined}}>
          {n==null||!Number.isFinite(n)?"—":unit==="$"?price(n):unit==="$compact"?`$${compact(n)}`:changeLabels.has(label)?signedPercent(n):unit==="shares"?n.toLocaleString("en-US"):unit===""?compact(n):value(n,unit)}
        </Typography></Box>)}
    </Box>
  );
  return <>
    {header(current==null?null:price(current),dayChange)}
    <div role="tabpanel" id="company-technicals-panel" aria-labelledby="company-technicals-tab" hidden={!active}>
      <Stack spacing={2}>
        {sectionTabs&&<Tabs value={section} onChange={(_,value:TechnicalSection)=>setSection(value)}
          aria-label="Technical sections" sx={{minHeight:40,"& .MuiTab-root":{minHeight:40,minWidth:0,px:1.5,textTransform:"none"}}}>
          {technicalSections.map(([id,label])=><Tab key={id} value={id} label={label}
            id={`${indicatorId}-${id}-tab`} aria-controls={`${indicatorId}-${id}-panel`}/>)}
        </Tabs>}
        <Box sx={{display:"grid",gridTemplateColumns:{xs:"minmax(0,1fr)",lg:inDrawer?"minmax(0,1fr)":"minmax(0,3fr) minmax(0,2fr)"},gap:sectionTabs?0:2,alignItems:"start"}}>
        <Box {...sectionProps("stats")}>
        <DashboardPanel hideHeader>
          <Stack spacing={1.25}>
            {sample&&<Typography variant="caption" color="text.secondary">Sample market data</Typography>}
            {broker&&(brokerQuote
              ? <Typography variant="caption" color="text.secondary">Moomoo quote · {eventTime.format(brokerQuote.observedAt)}</Typography>
              : <Typography variant="caption" color="text.secondary">Moomoo quote unavailable.</Typography>)}
            {metrics(visibleMetrics.filter(([label])=>snapshotLabels.has(label)))}
            <Box sx={{pt:1}}>
              <Typography variant="body2" sx={theme=>theme.applyStyles("dark",{color:"#a6b6cc",fontWeight:600})}>52-week range</Typography>
              <Box sx={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:1,mt:0.5}}>
                {rangeBases.map(([basis,label])=>{
                  const range=displayedRanges[basis];
                  return <Box key={basis}>
                    <Typography variant="caption" color="text.secondary">{label}</Typography>
                    <Box component="dl" sx={{display:"flex",flexWrap:"wrap",columnGap:1.5,rowGap:0.5,m:0}}>
                      {(["high","low"] as const).map(extreme=>{
                        const date=range?.[extreme==="high"?"highDate":"lowDate"];
                        return <Box key={extreme}>
                          <Typography component="dt" variant="caption">{extreme==="high"?"High":"Low"}</Typography>
                          <Box component="dd" sx={{m:0}}>
                            <Typography variant="body2">{price(range?.[extreme])}</Typography>
                            {date&&<Typography component="time" dateTime={date} variant="caption" color="text.secondary">
                              {rangeDate.format(new Date(date))}
                            </Typography>}
                          </Box>
                        </Box>;
                      })}
                    </Box>
                  </Box>;
                })}
              </Box>
            </Box>
            {showScannerMetrics&&!!snapshot?.scannerSignals.length&&<Typography variant="body2">{[...new Set(snapshot.scannerSignals)].join(" · ")}</Typography>}
            <Stack spacing={1.25} sx={{pt:1.25,borderTop:1,borderColor:"divider"}}>
              {metrics(visibleMetrics.filter(([label])=>!snapshotLabels.has(label)&&label!=="Price"&&label!=="Day change"))}
              {children&&<Accordion disableGutters square elevation={0} sx={{"&::before":{display:"none"}}}>
                <AccordionSummary id={`${indicatorId}-history`} aria-controls={`${indicatorId}-history-content`}
                  expandIcon={<ArrowDropDownIcon fontSize="small"/>}
                  sx={{
                    px:0,justifyContent:"flex-end",flexDirection:"row-reverse",gap:0.5,
                    "& .MuiAccordionSummary-content":{flexGrow:0},
                    "& .MuiAccordionSummary-expandIconWrapper":{transform:"rotate(-90deg)"},
                    "& .MuiAccordionSummary-expandIconWrapper.Mui-expanded":{transform:"rotate(0deg)"},
                  }}>
                  <Typography variant="subtitle2">Historical stats</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{px:0,pt:0}}>{children}</AccordionDetails>
              </Accordion>}
            </Stack>
          </Stack>
        </DashboardPanel>
        </Box>
        <Box {...sectionProps("indicators")}>
          <DashboardPanel hideHeader>
            <Stack spacing={1} sx={{minWidth:0}}>
      <Stack direction="row" sx={{alignItems:"center",gap:1.5}}>
        <Typography component="h3" variant="subtitle2" sx={theme=>theme.applyStyles("dark",{color:"#fff"})}>Indicator reads</Typography>
        <TextField select size="small" label="Timeframe" value={frame} onChange={e=>setFrame(e.target.value as Frame)} sx={{width:100}}>
          {frames.map(item=><MenuItem key={item} value={item}>{item}</MenuItem>)}
        </TextField>
      </Stack>
      {indicatorRows.length?<Stack spacing={0.5}>{indicatorRows.map(read=><Accordion key={read.name} disableGutters square slotProps={{transition:{unmountOnExit:true}}}
        sx={{boxShadow:"none",border:1,borderColor:"divider","&::before":{display:"none"}}}>
        <AccordionSummary id={`${indicatorId}-${read.name}-summary`} aria-controls={`${indicatorId}-${read.name}-details`} expandIcon={<ExpandMoreIcon fontSize="small"/>}
          sx={{minHeight:40,"& .MuiAccordionSummary-content":{my:0.75,justifyContent:"space-between",gap:1,pr:1}}}>
          <Typography component="span" variant="body2" sx={{fontWeight:700}}>{read.name}</Typography>
          <Box component="span" sx={{display:"flex",flexWrap:"wrap",justifyContent:"flex-end",gap:0.5,textAlign:"right",
            "& > span":{whiteSpace:"nowrap"}}}>
            {read.state&&<span className={indicatorStyles.state} data-tone={read.tone} style={{marginBottom:0}}>{read.state}</span>}
            {read.conditionState&&<span className={indicatorStyles.state} data-tone="neutral" style={{marginBottom:0}}>{read.conditionState}</span>}
            {!read.state&&!read.conditionState&&<Typography component="span" variant="caption" color="text.secondary">{read.value==="Unavailable"?"—":read.value}</Typography>}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{pt:0}}>
          {read.value&&<Typography variant="body2">{read.label==="RSI"&&read.value!=="—"?`RSI ${read.value}`:read.value==="Unavailable"?"—":read.value}</Typography>}
          {read.explanation&&<Typography variant="body2" color="text.secondary">{read.explanation}</Typography>}
          {read.signals?.filter(signal=>signal.text&&Number.isFinite(signal.at)).map(signal=><Typography
            key={`${signal.text}-${signal.at}`} variant="caption" sx={{display:"block",mt:0.5}}>
            {signal.text} · <time dateTime={new Date(signal.at).toISOString()}>{eventTime.format(signal.at)} ET</time>
          </Typography>)}
        </AccordionDetails>
      </Accordion>)}</Stack>:<Typography variant="body2" color="text.secondary">—</Typography>}
          </Stack>
          </DashboardPanel>
        </Box>
        </Box>
        <Box {...sectionProps("sessions")}>
          <Stack spacing={1} sx={{minWidth:0}}>
      <Typography component="h3" variant="subtitle2" sx={theme=>theme.applyStyles("dark",{color:"#fff"})}>Session levels</Typography>
      <TableContainer role="region" aria-label="Session levels table" tabIndex={0} sx={{maxWidth:"100%",overflowX:"auto",bgcolor:"background.default"}}><Table size="small" aria-label="Trading session highs and lows">
        <TableHead><TableRow>
          <TableCell sx={{whiteSpace:"nowrap"}}>
            DATE
            <Tooltip title={dateHelp} describeChild arrow open={dateHelpOpen} onOpen={()=>setDateHelpOpen(true)} onClose={()=>setDateHelpOpen(false)}>
              <IconButton size="small" aria-label="About the date range" onClick={()=>setDateHelpOpen(true)} sx={{ml:0.5}}>
                <InfoOutlinedIcon fontSize="inherit"/>
              </IconButton>
            </Tooltip>
          </TableCell>
          <TableCell sx={stickySession}>SESSION</TableCell>
          {["Open","High","Low","Volume","From high","From low"].map(text=><TableCell key={text} sx={{whiteSpace:"nowrap"}}>{text}</TableCell>)}
        </TableRow></TableHead>
        <TableBody>{days.flatMap(day=>sessionNames.map((_,i)=>i)
          .sort((a,b)=>(sample?day===days[0]:day.date===currentDate)?Number(b===activeSession)-Number(a===activeSession):0)
          .map(i=>{
          const name=sessionNames[i];
          const range=day.ranges[i];
          const fromHigh=range&&current!=null?(current/range.high-1)*100:null;
          const fromLow=range&&current!=null?(current/range.low-1)*100:null;
          return <TableRow key={day.date+name}><TableCell sx={{whiteSpace:"nowrap"}}><time dateTime={day.date}>{sessionDate.format(new Date(day.date))}</time></TableCell><TableCell sx={{...stickySession,bgcolor:"background.default"}}>{name}</TableCell>
            <TableCell>{price(range?.open)}</TableCell><TableCell>{price(range?.high)}</TableCell><TableCell>{price(range?.low)}</TableCell>
            <TableCell>{range?compact(range.volume):"—"}</TableCell>
            <TableCell sx={{color:changeColor(fromHigh)}}>{fromHigh==null?"—":signedPercent(fromHigh)}</TableCell>
            <TableCell sx={{color:changeColor(fromLow)}}>{fromLow==null?"—":signedPercent(fromLow)}</TableCell></TableRow>;
        }))}</TableBody>
      </Table></TableContainer>
      {!days.length&&<Typography variant="body2" color="text.secondary">—</Typography>}
          </Stack>
        </Box>
      </Stack>
    </div>
  </>;
}
