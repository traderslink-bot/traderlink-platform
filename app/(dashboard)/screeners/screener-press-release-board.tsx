"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardPanel } from "@/app/dashboard-template";
import type { MarketHaltDashboardReadModel } from "@/src/modules/news/contracts/market-halt-dashboard-contracts";
import type { PressReleaseArticle, PressReleaseChannel } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import type { ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { selectActiveScannerHalts } from "@/src/modules/scanner/live/active-halts";
import { markPressReleaseRead } from "../press-releases/press-release-actions";
import { PressReleaseDetailSection } from "../press-releases/press-release-detail-section";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

type Headline=Pick<PressReleaseArticle,"id"|"ticker"|"headline"|"isRead"|"marketCap"|"publishedAt">;
type HeadlineResponse=Readonly<{articles?:readonly Headline[];easternDate?:string;previousTradingDate?:string|null;status?:string}>;
type ChannelOption=Readonly<{channel:PressReleaseChannel;label:string;href:string}>;
const CHANNELS:readonly ChannelOption[]=[
  {channel:"news_filtered",label:"PR Scanner",href:"/press-releases/news-filtered"},
  {channel:"market_cap_under_30m",label:"Under $30M",href:"/press-releases/market-cap/under-30m"},
  {channel:"market_cap_30m_to_50m",label:"$30M–$50M",href:"/press-releases/market-cap/30m-50m"},
  {channel:"market_cap_50m_to_100m",label:"$50M–$100M",href:"/press-releases/market-cap/50m-100m"},
];
const number=new Intl.NumberFormat("en-US",{maximumFractionDigits:1});
const timeFormatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",hour:"numeric",minute:"2-digit"});
const dateFormatter=new Intl.DateTimeFormat("en-US",{timeZone:"America/New_York",month:"short",day:"numeric"});
const easternDateFormatter=new Intl.DateTimeFormat("en-CA",{timeZone:"America/New_York",year:"numeric",month:"2-digit",day:"2-digit"});

function easternDate(value:string):string{
  const parts=easternDateFormatter.formatToParts(new Date(value));
  const part=(type:Intl.DateTimeFormatPartTypes)=>parts.find(item=>item.type===type)?.value??"";
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function selectCompactArticles(articles:readonly Headline[],dates:{today:string;previous:string|null}):readonly Headline[]{
  const today=articles.filter(article=>easternDate(article.publishedAt)===dates.today);
  const previous=dates.previous?articles.filter(article=>easternDate(article.publishedAt)===dates.previous):[];
  return [...today,...previous].slice(0,3);
}

function floatValue(input:number|undefined):string{
  if(input===undefined)return "n/a";
  if(input>=1_000_000)return `${number.format(input/1_000_000)}M`;
  if(input>=1_000)return `${number.format(input/1_000)}K`;
  return number.format(input);
}
function shortTime(value:string|null):string{
  if(!value)return "—";
  const [hour="",minute=""]=value.split(":");
  return hour&&minute?`${hour}:${minute}`:value;
}
function ArticleView({article,onBack,onClose}:{article:PressReleaseArticle;onBack:()=>void;onClose:()=>void}){
  return <Stack sx={{height:"100dvh",minHeight:0}}>
    <Stack direction="row" sx={{alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",px:{xs:1,sm:2},py:1}}>
      <Button onClick={onBack} startIcon={<ArrowBackRoundedIcon/>}>Back to list</Button>
      <IconButton aria-label="Close PR workspace" onClick={onClose}><CloseRoundedIcon/></IconButton>
    </Stack>
    <Stack spacing={2} sx={theme=>({...scannerScrollStyles(theme),overflow:"auto",p:{xs:2,sm:3}})}>
      <Box><Typography color="warning.main" sx={{fontSize:"1.35rem",fontWeight:900}}>{article.ticker}</Typography>
        <Typography color="text.secondary" variant="caption">{dateFormatter.format(new Date(article.publishedAt))} · {timeFormatter.format(new Date(article.publishedAt))} ET{article.marketCap?` · Mkt Cap ${article.marketCap}`:""}</Typography>
      </Box>
      <Typography component="h2" variant="h2">{article.headline}</Typography>
      {article.summary?<Box><Typography component="h3" sx={{fontWeight:800}} variant="subtitle2">Summary</Typography><Typography sx={{mt:1,whiteSpace:"pre-wrap"}} variant="body2">{article.summary}</Typography></Box>:null}
      <PressReleaseDetailSection items={article.positives} title="Positives"/>
      <PressReleaseDetailSection items={article.negatives} title="Negatives"/>
      <PressReleaseDetailSection items={article.riskFlags} title="Risk flags"/>
      <PressReleaseDetailSection items={article.supportResistanceLevels} title="Support and resistance"/>
      {article.articleText?<><Divider/><Box><Typography component="h3" sx={{fontWeight:800}} variant="subtitle2">Article</Typography><Typography sx={{mt:1,whiteSpace:"pre-wrap"}} variant="body2">{article.articleText}</Typography></Box></>:null}
      <Stack direction={{xs:"column",sm:"row"}} spacing={1}>
        <Button component="a" endIcon={<LaunchRoundedIcon/>} href={article.publicPath} target="_blank" variant="contained">Open article page</Button>
        {article.sourceUrl?<Button component="a" href={article.sourceUrl} rel="noreferrer" target="_blank" variant="outlined">Open original source</Button>:null}
      </Stack>
    </Stack>
  </Stack>;
}
function CompactPrRow({article,float,older,onOpen}:{article:Headline;float:number|undefined;older:boolean;onOpen:(article:Headline)=>void}){
  return <ButtonBase aria-label={`Open ${article.ticker} article: ${article.headline}`} onClick={()=>onOpen(article)}
    sx={{borderTop:1,borderColor:"divider",display:"grid",gridTemplateColumns:"3.5rem minmax(0,1fr)",minHeight:42,px:0.5,py:0.45,textAlign:"left",width:"100%"}}>
    <Box sx={{alignSelf:"stretch",minWidth:0}}>
      <Typography noWrap sx={{color:"warning.main",fontSize:"0.78rem",fontWeight:900,lineHeight:1.2}}>{article.ticker}</Typography>
      <Typography color="text.secondary" noWrap sx={{fontSize:"0.58rem",lineHeight:1.25}}>{older?"Yesterday · ":""}{timeFormatter.format(new Date(article.publishedAt))} ET</Typography>
    </Box>
    <Box sx={{minWidth:0}}>
      <Typography color="text.secondary" noWrap sx={{fontSize:"0.6rem",fontWeight:700,lineHeight:1.15}}>{article.marketCap?`Mkt Cap ${article.marketCap}`:"Mkt Cap n/a"} · Float {floatValue(float)}</Typography>
      <Typography noWrap sx={{fontSize:"0.68rem",fontWeight:article.isRead?600:800,lineHeight:1.25}}>{article.headline}</Typography>
    </Box>
  </ButtonBase>;
}

export function ScreenerPressReleaseBoard({onOpenChart,managedActiveHalts}:{onOpenChart?:(row:{symbol:string;exchange:"NASDAQ"|"NYSE"})=>void;managedActiveHalts?:readonly ScannerActiveHalt[]}){
  const [articles,setArticles]=useState<readonly Headline[]|null>(null);
  const [dates,setDates]=useState<{today:string;previous:string|null}|null>(null);
  const [floatByTicker,setFloatByTicker]=useState<Readonly<Record<string,number>>>({});
  const [halts,setHalts]=useState<MarketHaltDashboardReadModel|null>(null);
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [channel,setChannel]=useState<PressReleaseChannel>("news_filtered");
  const [channelArticles,setChannelArticles]=useState<Partial<Record<PressReleaseChannel,readonly Headline[]>>>({});
  const [channelLoading,setChannelLoading]=useState(false);
  const [selected,setSelected]=useState<PressReleaseArticle|null>(null);
  const [opening,setOpening]=useState(false);
  const listRef=useRef<HTMLDivElement|null>(null);
  const scrollByChannel=useRef<Partial<Record<PressReleaseChannel,number>>>({});
  const requestRef=useRef<AbortController|null>(null);
  const haltsManaged=managedActiveHalts!==undefined;

  useEffect(()=>{
    let active=true,articleTimer:ReturnType<typeof setTimeout>|undefined,haltTimer:ReturnType<typeof setTimeout>|undefined;
    const loadArticles=async()=>{
      try{
        const response=await fetch("/api/platform/news/workspace-scanner?view=expanded-summary&channel=news_filtered",{cache:"no-store"});
        if(!response.ok)throw Error();
        const result=await response.json() as HeadlineResponse,next=(result.articles??[]);
        if(active){setArticles(next);setDates(result.easternDate?{today:result.easternDate,previous:result.previousTradingDate??null}:null);
          setChannelArticles(current=>({...current,news_filtered:next}));}
      }catch{/* Keep the last successful events. */}
      finally{if(active)articleTimer=setTimeout(()=>void loadArticles(),30_000);}
    };
    const loadHalts=async()=>{
      try{const response=await fetch("/api/market-halts/current",{cache:"no-store",credentials:"same-origin"});if(!response.ok)throw Error();const result=await response.json() as MarketHaltDashboardReadModel;if(active)setHalts(result);}
      catch{/* Keep the last successful halt state. */}
      finally{if(active)haltTimer=setTimeout(()=>void loadHalts(),60_000);}
    };
    void loadArticles();if(!haltsManaged)void loadHalts();
    return()=>{active=false;clearTimeout(articleTimer);clearTimeout(haltTimer);requestRef.current?.abort();};
  },[haltsManaged]);

  const compactArticles=useMemo(()=>{
    if(!articles||!dates)return [];
    return selectCompactArticles(articles,dates);
  },[articles,dates]);
  useEffect(()=>{
    const symbols=[...new Set(compactArticles.map(article=>article.ticker))];
    if(!symbols.length)return;
    const request=new AbortController();
    void fetch(`/api/admin/screeners/floats?symbols=${encodeURIComponent(symbols.join(","))}`,{cache:"no-store",signal:request.signal})
      .then(response=>response.ok?response.json():null).then((result:{floats?:Readonly<Record<string,{shares?:unknown}>>}|null)=>{
        if(!result)return;setFloatByTicker(Object.fromEntries(Object.entries(result.floats??{}).flatMap(([symbol,fact])=>Number.isSafeInteger(fact.shares)&&Number(fact.shares)>0?[[symbol,Number(fact.shares)] as const]:[])));
      }).catch(()=>{});
    return()=>request.abort();
  },[compactArticles]);

  const loadChannel=async(next:PressReleaseChannel)=>{
    setChannel(next);setSelected(null);
    if(channelArticles[next])return;
    setChannelLoading(true);
    try{const response=await fetch(`/api/platform/news/workspace-scanner?view=expanded-summary&channel=${encodeURIComponent(next)}`,{cache:"no-store"});if(!response.ok)throw Error();const result=await response.json() as HeadlineResponse;setChannelArticles(current=>({...current,[next]:result.articles??[]}));if(result.easternDate)setDates({today:result.easternDate,previous:result.previousTradingDate??null});}
    catch{setChannelArticles(current=>({...current,[next]:[]}));}
    finally{setChannelLoading(false);}
  };
  const openArticle=async(headline:Headline)=>{
    scrollByChannel.current[channel]=listRef.current?.scrollTop??0;
    requestRef.current?.abort();const request=new AbortController();requestRef.current=request;setOpening(true);
    try{const response=await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(headline.id)}`,{cache:"no-store",signal:request.signal});if(!response.ok)throw Error();const result=await response.json() as {article?:PressReleaseArticle};if(!result.article||request.signal.aborted)return;setSelected(result.article);
      if(!result.article.isRead){setArticles(current=>current?.map(item=>item.id===headline.id?{...item,isRead:true}:item)??current);setChannelArticles(current=>Object.fromEntries(Object.entries(current).map(([key,items])=>[key,items?.map(item=>item.id===headline.id?{...item,isRead:true}:item)])));void markPressReleaseRead(headline.id);}}
    catch{/* Keep list available for retry. */}finally{if(requestRef.current===request)setOpening(false);}
  };
  const back=()=>{setSelected(null);requestAnimationFrame(()=>{if(listRef.current)listRef.current.scrollTop=scrollByChannel.current[channel]??0;});};
  const active=managedActiveHalts??selectActiveScannerHalts(halts?.rows??[]),visibleChannel=(channelArticles[channel]??[]).filter(article=>!dates||easternDate(article.publishedAt)===dates.today);
  const selectedDefinition=CHANNELS.find(item=>item.channel===channel)!;

  return <><DashboardPanel hideHeader>
    <Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:0.6,minHeight:22}}>
      <Stack direction="row" sx={{alignItems:"center",gap:0.4}}><Typography component="h2" variant="h2">Market Events</Typography>
        <Tooltip title="Shows stocks currently halted today and the latest press releases. Resumed and previous-day halts are removed."><IconButton aria-label="Explain Market Events" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton></Tooltip>
      </Stack>
      <Button onClick={()=>{setDrawerOpen(true);void loadChannel("news_filtered");}} size="small">View more PRs</Button>
    </Stack>
    {active.length?<Box sx={theme=>({...scannerScrollStyles(theme),mb:0.4,maxHeight:120,overflowY:"auto"})}>{active.map(halt=><Stack direction="row" key={halt.id} sx={{alignItems:"center",borderTop:1,borderColor:"divider",gap:0.7,minHeight:30,px:0.5,py:0.35}}>
      {onOpenChart?<IconButton aria-label={`Open ${halt.ticker} chart`} onClick={()=>onOpenChart({symbol:halt.ticker,exchange:halt.market.toUpperCase().includes("NASDAQ")?"NASDAQ":"NYSE"})} size="small" sx={{bgcolor:"rgba(46,125,50,0.13)",color:"success.main",p:0.35}}><CandlestickChartRoundedIcon sx={{fontSize:"0.85rem"}}/></IconButton>:null}
      <Box sx={{minWidth:48}}><Typography sx={{color:"error.main",fontSize:"0.72rem",fontWeight:900,lineHeight:1.1}}>{halt.ticker}</Typography><Typography color="text.secondary" sx={{fontSize:"0.56rem"}}>{shortTime(halt.haltTimeEt)} ET</Typography></Box>
      <Typography noWrap sx={{fontSize:"0.65rem",fontWeight:700}}>{halt.reasonCode} · Quote {halt.quoteTimeEt?`${shortTime(halt.quoteTimeEt)} ET`:"Pending"} · Trade {halt.tradeTimeEt?`${shortTime(halt.tradeTimeEt)} ET`:"Pending"}</Typography>
    </Stack>)}</Box>:null}
    {articles===null?<Box sx={{display:"grid",minHeight:100,placeItems:"center"}}><CircularProgress aria-label="Loading market events" size={22}/></Box>
      :compactArticles.length?compactArticles.map(article=><CompactPrRow article={article} float={floatByTicker[article.ticker]} key={article.id} older={Boolean(dates&&easternDate(article.publishedAt)!==dates.today)} onOpen={item=>{setDrawerOpen(true);void openArticle(item);}}/>)
      :<Typography color="text.secondary" sx={{py:2}} variant="body2">No recent press releases.</Typography>}
    {opening?<Typography color="text.secondary" role="status" variant="caption">Opening article…</Typography>:null}
  </DashboardPanel>
  <Drawer anchor="right" open={drawerOpen} onClose={()=>setDrawerOpen(false)} slotProps={{paper:{role:"dialog","aria-label":"PR workspace",sx:{maxWidth:"100vw",width:{xs:"100vw",md:"65vw"}}}}}>
    {selected?<ArticleView article={selected} onBack={back} onClose={()=>setDrawerOpen(false)}/>:<Stack sx={{height:"100dvh",minHeight:0}}>
      <Stack direction="row" sx={{alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",px:{xs:1,sm:2},py:1}}>
        <Typography component="h2" sx={{fontWeight:850}} variant="h6">Press Releases</Typography><IconButton aria-label="Close PR workspace" onClick={()=>setDrawerOpen(false)}><CloseRoundedIcon/></IconButton>
      </Stack>
      <Tabs aria-label="PR workspace lists" onChange={(_,next:PressReleaseChannel)=>void loadChannel(next)} value={channel} variant="scrollable" scrollButtons="auto" sx={{borderBottom:1,borderColor:"divider",px:1}}>
        {CHANNELS.map(item=><Tab key={item.channel} label={item.label} value={item.channel}/>)}
      </Tabs>
      <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",px:2,py:1}}>
        <Typography color="text.secondary" variant="caption">Today’s releases</Typography><Link href={selectedDefinition.href} underline="hover">Open full page</Link>
      </Stack>
      {channelLoading?<Box sx={{display:"grid",flex:1,placeItems:"center"}}><CircularProgress size={24}/></Box>:<Box ref={listRef} aria-label={`${selectedDefinition.label} articles`} role="region" sx={theme=>({...scannerScrollStyles(theme),flex:1,overflow:"auto"})}>
        {!visibleChannel.length?<Typography color="text.secondary" sx={{p:3,textAlign:"center"}}>No releases in this list today.</Typography>:visibleChannel.map(article=><ButtonBase key={article.id} onClick={()=>void openArticle(article)}
          sx={{alignItems:{xs:"flex-start",sm:"center"},borderBottom:1,borderColor:"divider",display:"grid",gap:1,gridTemplateColumns:{xs:"4.3rem minmax(0,1fr)",sm:"5rem 4.5rem 7rem minmax(0,1fr)"},minHeight:54,px:2,py:1,textAlign:"left",width:"100%"}}>
          <Typography color="text.secondary" sx={{fontSize:"0.68rem"}}>{timeFormatter.format(new Date(article.publishedAt))} ET</Typography>
          <Typography sx={{color:"warning.main",fontSize:"0.78rem",fontWeight:900}}>{article.ticker}</Typography>
          <Typography color="text.secondary" sx={{display:{xs:"none",sm:"block"},fontSize:"0.68rem"}}>{article.marketCap??"n/a"}</Typography>
          <Typography noWrap sx={{fontSize:"0.76rem",fontWeight:article.isRead?600:800}}>{article.headline}</Typography>
        </ButtonBase>)}
      </Box>}
    </Stack>}
  </Drawer></>;
}
