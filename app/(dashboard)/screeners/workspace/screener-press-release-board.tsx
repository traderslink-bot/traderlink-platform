"use client";

import { WorkspaceScannerTitle } from "./workspace-scanner-title";
import { ScannerPageChartButton, ScannerPageTicker } from "./scanner-page-ticker";

import type { ScannerChartTarget } from "../scanner-chart-workspace";
import { ScannerChartLaunchControls } from "../scanner-chart-launch-controls";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { DashboardPanel } from "@/app/dashboard-template";
import { PressReleaseArticleContent, PressReleaseDrawer } from "@/app/(dashboard)/press-releases/press-release-article-drawer";
import type { MarketHaltDashboardReadModel } from "@/src/modules/news/contracts/market-halt-dashboard-contracts";
import type { PressReleaseArticle, PressReleaseChannel } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import type { ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";
import { selectActiveScannerHalts } from "@/src/modules/scanner/live/active-halts";
import { selectMarketEventsHalts } from "@/src/modules/scanner/live/market-events-halts";
import { markPressReleaseRead } from "../../press-releases/press-release-actions";
import { scannerScrollStyles } from "@/src/modules/scanner/live/scroll-styles";

type Headline=Pick<PressReleaseArticle,"id"|"ticker"|"headline"|"isRead"|"marketCap"|"publishedAt">;
type NewsCursor={publishedAt:string;id:string};
type RecentNewsPage={articles:readonly Headline[];next:NewsCursor|null;since:string};
type HeadlineResponse=Readonly<{articles?:readonly Headline[];easternDate?:string;previousTradingDate?:string|null;compactArticleIds?:readonly string[];status?:string}>;
type ChannelOption=Readonly<{channel:PressReleaseChannel;label:string;href:string;subLabel?:string}>;
const CHANNELS:readonly ChannelOption[]=[
  {channel:"news_filtered",label:"PR Scanner",href:"/press-releases/news-filtered"},
  {channel:"market_cap_under_30m",label:"Under $30M",subLabel:"Market Cap",href:"/press-releases/market-cap/under-30m"},
  {channel:"market_cap_30m_to_50m",label:"$30M–$50M",subLabel:"Market Cap",href:"/press-releases/market-cap/30m-50m"},
  {channel:"market_cap_50m_to_100m",label:"$50M–$100M",subLabel:"Market Cap",href:"/press-releases/market-cap/50m-100m"},
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
export function selectCompactArticles(articles:readonly Headline[],dates:{today:string;previous:string|null},compactArticleIds:readonly string[]):readonly Headline[]{
  const eligibleIds=new Set(compactArticleIds);
  const eligible=articles.filter(article=>eligibleIds.has(article.id));
  const today=eligible.filter(article=>easternDate(article.publishedAt)===dates.today);
  const previous=dates.previous?eligible.filter(article=>easternDate(article.publishedAt)===dates.previous):[];
  return [...today,...previous].slice(0,10);
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
function CompactPrRow({article,exchange,float,older,onOpen,onOpenChart}:{article:Headline;exchange:"NASDAQ"|"NYSE"|"AMEX"|undefined;float:number|undefined;older:boolean;onOpen:(article:Headline)=>void;onOpenChart?:(row:ScannerChartTarget)=>void}){
  return <Box sx={{borderTop:1,borderColor:"divider",display:"grid",gridTemplateColumns:"auto max-content minmax(0,1fr)",
    alignItems:"center",columnGap:0.5,minHeight:42,px:0.5}}>
    <Stack direction="row" sx={{alignItems:"center",gap:0.7}}>
      {onOpenChart?<ScannerChartLaunchControls row={{symbol:article.ticker,exchange}} onOpenChart={onOpenChart}/>:null}
      <ScannerPageChartButton symbol={article.ticker} showOnMobile/>
    </Stack>
    <Box sx={{fontSize:"0.78rem",lineHeight:1.2}}>
      <ScannerPageTicker symbol={article.ticker}/>
      {older?<Typography color="text.secondary" sx={{fontSize:"0.58rem",lineHeight:1.25}}>Yesterday</Typography>:null}
      <Typography color="text.secondary" noWrap sx={{fontSize:"0.58rem",lineHeight:1.25}}>{timeFormatter.format(new Date(article.publishedAt))}</Typography>
    </Box>
    <ButtonBase aria-label={`Open ${article.ticker} article: ${article.headline}`} onClick={()=>onOpen(article)}
      sx={{display:"flex",flexDirection:"column",alignItems:"stretch",minWidth:0,minHeight:42,py:0.45,textAlign:"left"}}>
      <Typography color="text.secondary" noWrap sx={{fontSize:"0.6rem",fontWeight:700,lineHeight:1.15}}>{article.marketCap?`Market cap ${article.marketCap}`:"Market cap n/a"} · Float {floatValue(float)}</Typography>
      <Typography sx={{fontSize:"0.68rem",fontWeight:article.isRead?600:800,lineHeight:1.25,overflow:"hidden",
        display:"-webkit-box",WebkitBoxOrient:"vertical",WebkitLineClamp:{xs:2,md:1}}}>{article.headline}</Typography>
    </ButtonBase>
  </Box>;
}

export function useMarketEventsData(haltsManaged=true, enabled=true) {
  const [articles,setArticles]=useState<readonly Headline[]|null>(null);
  const [headlineStatus,setHeadlineStatus]=useState<"loading"|"ready"|"unavailable"|"denied">("loading");
  const [dates,setDates]=useState<{today:string;previous:string|null}|null>(null);
  const [compactArticleIds,setCompactArticleIds]=useState<readonly string[]>([]);
  const [floatByTicker,setFloatByTicker]=useState<Readonly<Record<string,number>>>({});
  const [exchangeByTicker,setExchangeByTicker]=useState<Readonly<Record<string,"NASDAQ"|"NYSE"|"AMEX">>>({});
  const [halts,setHalts]=useState<MarketHaltDashboardReadModel|null>(null);
  useEffect(()=>{
    if(!enabled)return;
    const controller=new AbortController();
    let active=true,articleTimer:ReturnType<typeof setTimeout>|undefined,haltTimer:ReturnType<typeof setTimeout>|undefined;
    const loadArticles=async()=>{
      try{
        const response=await fetch("/api/platform/news/workspace-scanner?view=expanded-summary&channel=news_filtered",{cache:"no-store",signal:controller.signal});
        if(!active)return;
        if(response.status===401||response.status===403){
          setArticles(null);
          setDates(null);
          setCompactArticleIds([]);
          setFloatByTicker({});
          setExchangeByTicker({});
          setHeadlineStatus("denied");
          return;
        }
        if(!response.ok)throw Error();
        const result=await response.json() as HeadlineResponse,next=(result.articles??[]);
        if(active){
          setArticles(next);
          setDates(result.easternDate?{today:result.easternDate,previous:result.previousTradingDate??null}:null);
          setCompactArticleIds(result.compactArticleIds??[]);
          setHeadlineStatus("ready");
        }
      }catch{
        if(active)setHeadlineStatus(current=>current==="denied"?"denied":"unavailable");
      }
      finally{if(active)articleTimer=setTimeout(()=>void loadArticles(),30_000);}
    };
    const loadHalts=async()=>{
      try{const response=await fetch("/api/market-halts/current",{cache:"no-store",credentials:"same-origin",signal:controller.signal});if(!response.ok)throw Error();const result=await response.json() as MarketHaltDashboardReadModel;if(active)setHalts(result);}
      catch{/* Keep the last successful halt state. */}
      finally{if(active)haltTimer=setTimeout(()=>void loadHalts(),60_000);}
    };
    void loadArticles();if(!haltsManaged)void loadHalts();
    return()=>{active=false;clearTimeout(articleTimer);clearTimeout(haltTimer);controller.abort();};
  },[enabled,haltsManaged]);
  const compactArticles=useMemo(()=>{
    if(!articles||!dates)return [];
    return selectCompactArticles(articles,dates,compactArticleIds);
  },[articles,dates,compactArticleIds]);
  useEffect(()=>{
    const symbols=[...new Set(compactArticles.map(article=>article.ticker))];
    if(!symbols.length)return;
    const request=new AbortController();
    void fetch(`/api/platform/news/workspace-floats?symbols=${encodeURIComponent(symbols.join(","))}`,{cache:"no-store",signal:request.signal})
      .then(response=>response.ok?response.json():null).then((result:{exchanges?:Readonly<Record<string,"NASDAQ"|"NYSE"|"AMEX">>;floats?:Readonly<Record<string,{shares?:unknown}>>}|null)=>{
        if(!result||request.signal.aborted)return;setExchangeByTicker(result.exchanges??{});setFloatByTicker(Object.fromEntries(Object.entries(result.floats??{}).flatMap(([symbol,fact])=>Number.isSafeInteger(fact.shares)&&Number(fact.shares)>0?[[symbol,Number(fact.shares)] as const]:[])));
      }).catch(()=>{});
    return()=>request.abort();
  },[compactArticles]);

  return {articles,headlineStatus,setArticles,dates,setDates,floatByTicker,exchangeByTicker,halts,compactArticles};
}

export function ScreenerPressReleaseBoard({onOpenChart,managedActiveHalts,haltWindow,haltSourceUnavailable,data,compact=false}:{onOpenChart?:(row:ScannerChartTarget)=>void;managedActiveHalts?:readonly ScannerActiveHalt[];haltWindow?:Readonly<{date:string;closed:boolean;checkedAt:number}>;haltSourceUnavailable?:boolean;data:ReturnType<typeof useMarketEventsData>;compact?:boolean}){
  const [drawerOpen,setDrawerOpen]=useState(false);
  const [channel,setChannel]=useState<PressReleaseChannel>("news_filtered");
  const [channelLoading,setChannelLoading]=useState(false);
  const [selected,setSelected]=useState<PressReleaseArticle|null>(null);
  const [opening,setOpening]=useState(false);
  const listRef=useRef<HTMLDivElement|null>(null);
  const scrollByChannel=useRef<Partial<Record<PressReleaseChannel,number>>>({});
  const requestRef=useRef<AbortController|null>(null);


  const {articles,headlineStatus,setArticles,dates,floatByTicker,exchangeByTicker,halts,compactArticles}=data;
  const headlinesDenied=headlineStatus==="denied";
  const [page,setPage]=useState<RecentNewsPage|null>(null);
  const [newsError,setNewsError]=useState(false);
  const newsRequest=useRef<AbortController|null>(null);
  useEffect(()=>()=>{requestRef.current?.abort();newsRequest.current?.abort();},[]);
  const fetchNews=async(next:PressReleaseChannel,mode:"initial"|"more"|"refresh",cursor?:NewsCursor)=>{
    if(mode!=="initial"&&newsRequest.current)return;
    newsRequest.current?.abort();
    const request=new AbortController();
    newsRequest.current=request;
    if(mode!=="refresh"){setChannelLoading(true);setNewsError(false);}
    try{
      const params=new URLSearchParams({view:"recent",channel:next});
      if(cursor){params.set("before",cursor.publishedAt);params.set("beforeId",cursor.id);}
      const response=await fetch(`/api/platform/news/workspace-scanner?${params}`,{cache:"no-store",signal:request.signal});
      if(!response.ok)throw Error();
      const result=await response.json() as RecentNewsPage;
      if(request.signal.aborted)return;
      setPage(current=>{
        if(mode==="initial"||!current)return result;
        const rows=mode==="refresh"?[...result.articles,...current.articles]:[...current.articles,...result.articles];
        const seen=new Set<string>();
        const since=Date.parse(result.since);
        return {...result,next:mode==="refresh"?current.next??(current.articles.length===0?result.next:null):result.next,
          articles:rows.filter(row=>{
            if(Date.parse(row.publishedAt)<since||seen.has(row.id))return false;
            seen.add(row.id);return true;
          }).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt)||a.id.localeCompare(b.id))};
      });
    }catch{if(!request.signal.aborted&&mode!=="refresh")setNewsError(true);}
    finally{if(newsRequest.current===request){newsRequest.current=null;setChannelLoading(false);}}
  };
  const loadChannel=(next:PressReleaseChannel)=>{
    setChannel(next);setSelected(null);setPage(null);
    if(listRef.current)listRef.current.scrollTop=0;
    void fetchNews(next,"initial");
  };
  const closeDrawer=()=>{
    setDrawerOpen(false);setSelected(null);
    requestRef.current?.abort();newsRequest.current?.abort();newsRequest.current=null;
  };
  const clearDeniedNews=useEffectEvent(()=>{
    closeDrawer();
    setPage(null);
    setNewsError(false);
    setChannelLoading(false);
    setOpening(false);
  });
  useEffect(()=>{if(headlinesDenied)clearDeniedNews();},[headlinesDenied]);
  const refreshNews=useEffectEvent(()=>{if(page&&!newsError)void fetchNews(channel,"refresh");});
  useEffect(()=>{
    if(!drawerOpen||selected)return;
    const timer=setInterval(refreshNews,30_000);
    return()=>clearInterval(timer);
  },[drawerOpen,selected]);
  const openArticle=async(headline:Headline)=>{
    scrollByChannel.current[channel]=listRef.current?.scrollTop??0;
    requestRef.current?.abort();const request=new AbortController();requestRef.current=request;setOpening(true);
    try{const response=await fetch(`/api/platform/news/workspace-scanner?articleId=${encodeURIComponent(headline.id)}`,{cache:"no-store",signal:request.signal});if(!response.ok)throw Error();const result=await response.json() as {article?:PressReleaseArticle};if(!result.article||request.signal.aborted)return;setSelected(result.article);
      if(!result.article.isRead){setArticles(current=>current?.map(item=>item.id===headline.id?{...item,isRead:true}:item)??current);setPage(current=>current&&({...current,articles:current.articles.map(item=>item.id===headline.id?{...item,isRead:true}:item)}));void markPressReleaseRead(headline.id);}}
    catch{/* Keep list available for retry. */}finally{if(requestRef.current===request)setOpening(false);}
  };
  const back=()=>{setSelected(null);requestAnimationFrame(()=>{if(listRef.current)listRef.current.scrollTop=scrollByChannel.current[channel]??0;});};
  const [haltClock,setHaltClock]=useState(()=>Date.now());
  const now=Math.max(haltClock,haltWindow?.checkedAt??0);
  const haltCandidates=managedActiveHalts??(halts?.rows.length?selectActiveScannerHalts(halts.rows,new Date(now)):[]);
  const {rows:active,nextExpiryAt}=selectMarketEventsHalts(haltCandidates,haltWindow?.date??halts?.tradingDate,now,haltWindow?.closed);
  useEffect(()=>{
    if(nextExpiryAt===null)return;
    const update=()=>setHaltClock(Date.now());
    const timer=setTimeout(update,Math.max(0,nextExpiryAt-Date.now()));
    document.addEventListener("visibilitychange",update);
    return()=>{clearTimeout(timer);document.removeEventListener("visibilitychange",update);};
  },[nextExpiryAt]);
  const visibleChannel=page?.articles??[];
  const selectedDefinition=CHANNELS.find(item=>item.channel===channel)!;

  return <><Box data-market-events-fill-card sx={{height:compact?"100%":{xs:"auto",md:"100%"},minHeight:0,overflow:{md:"hidden"},'& > [data-traderlink-platform-dashboard-card="panel"]':{height:compact?"100%":{xs:"auto",md:"100%"}},'& > [data-traderlink-platform-dashboard-card="panel"] > .MuiCardContent-root':{display:"flex",flexDirection:"column",height:compact?"100%":{xs:"auto",md:"100%"},minHeight:0,boxSizing:"border-box",
      "& > .MuiBox-root:last-child":{display:"flex",flexDirection:"column",flex:"1 1 auto",minHeight:0,overflow:{md:"hidden"}}}}}><DashboardPanel hideHeader>
    <Stack direction="row" sx={{alignItems:"flex-start",justifyContent:"space-between",mb:0.6,minHeight:22}}>
      <Stack direction="row" sx={{alignItems:"center",gap:0.4}}><WorkspaceScannerTitle><Typography component="h2" variant="h2">Market Events</Typography></WorkspaceScannerTitle>
        <Tooltip title="Halt alerts clear at the trade resume time, after one hour, or at post-market close, whichever comes first."><IconButton aria-label="Explain Market Events" size="small" sx={{p:0.2}}><InfoOutlinedIcon sx={{fontSize:15}}/></IconButton></Tooltip>
      </Stack>

    </Stack>
    {haltSourceUnavailable && <Typography role="status" color="text.secondary" sx={{fontSize:"0.65rem",mb:0.5}}>Halt status unavailable</Typography>}
    {active.length?<Box aria-label="Current halts" role="region" sx={theme=>({...scannerScrollStyles(theme),mb:1.25,maxHeight:90,flexShrink:0,overflow:"auto"})}>{active.map(halt=><Stack direction="row" key={halt.id} sx={{alignItems:"center",borderTop:1,borderColor:"divider",gap:0.7,minHeight:30,px:0.5,py:0.35}}>
      {onOpenChart?<ScannerChartLaunchControls row={{symbol:halt.ticker,exchange:halt.chartExchange??undefined}} onOpenChart={onOpenChart}/>:null}
      <ScannerPageChartButton symbol={halt.ticker} showOnMobile/>
      <Box sx={{minWidth:48,fontSize:"0.72rem",lineHeight:1.1}}><ScannerPageTicker symbol={halt.ticker}/><Typography color="text.secondary" sx={{fontSize:"0.56rem"}}>{shortTime(halt.haltTimeEt)} ET</Typography></Box>
      <Typography noWrap sx={{fontSize:"0.65rem",fontWeight:700}}><Box component="span" sx={{color:"error.main",fontWeight:900}}>HALT</Box> · {halt.reasonCode} · Quote {halt.quoteTimeScheduled ? "sched. " : ""}{halt.quoteTimeEt?`${shortTime(halt.quoteTimeEt)} ET`:"Pending"} · <Box component="span" sx={{color:halt.tradeTimeEt?"error.main":"text.secondary"}}>Trade {halt.tradeTimeScheduled ? "sched. " : ""}{halt.tradeTimeEt?`${shortTime(halt.tradeTimeEt)} ET`:"Pending"}</Box></Typography>
    </Stack>)}</Box>:null}
    {articles===null?(headlineStatus==="loading"
      ?<Box sx={{display:"grid",minHeight:100,placeItems:"center"}}><CircularProgress aria-label="Loading market events" size={22}/></Box>
      :<Typography role="status" color="text.secondary" sx={{p:1}} variant="body2">Press releases unavailable.</Typography>)
      :<Box aria-label="Latest PR Scanner releases" role="region" sx={theme=>({...scannerScrollStyles(theme),flex:{xs:"0 0 auto",md:"1 1 0"},maxHeight:{xs:126,md:"none"},minHeight:0,overflowX:"auto",overflowY:"auto"})}>{!compactArticles.length&&<Typography color="text.secondary" sx={{p:1}} variant="body2">No recent press releases.</Typography>}{compactArticles.map(article=><CompactPrRow article={article} exchange={exchangeByTicker[article.ticker]} float={floatByTicker[article.ticker]} key={article.id} older={Boolean(dates&&easternDate(article.publishedAt)!==dates.today)} onOpen={item=>{setDrawerOpen(true);loadChannel("news_filtered");void openArticle(item);}} onOpenChart={onOpenChart}/>)}
        <Box sx={{borderTop:1,borderColor:"divider",px:0.75,py:0.55}}><Link component="button" onClick={()=>{setDrawerOpen(true);void loadChannel("news_filtered");}} sx={{fontSize:"0.7rem"}} type="button" underline="hover">More news</Link></Box></Box>}
    {opening&&!headlinesDenied?<Typography color="text.secondary" role="status" variant="caption">Opening article…</Typography>:null}
  </DashboardPanel></Box>
  <PressReleaseDrawer open={drawerOpen&&!headlinesDenied} onClose={closeDrawer} label={selected?"Press release article":"Recent News"}>
    {headlinesDenied?null:selected?<PressReleaseArticleContent article={selected} onBack={back} onClose={closeDrawer}/>:<Stack sx={{height:"100dvh",minHeight:0}}>
      <Stack direction="row" sx={{alignItems:"center",borderBottom:1,borderColor:"divider",justifyContent:"space-between",px:{xs:1,sm:2},py:1}}>
        <Typography component="h2" sx={{fontWeight:850}} variant="h6">Recent News</Typography><IconButton aria-label="Close Recent News" onClick={closeDrawer}><CloseRoundedIcon/></IconButton>
      </Stack>
      <Tabs aria-label="Recent News lists" onChange={(_,next:PressReleaseChannel)=>void loadChannel(next)} value={channel} variant="scrollable" scrollButtons="auto" sx={{borderBottom:1,borderColor:"divider",px:1}}>
        {CHANNELS.map(item=><Tab aria-label={item.subLabel?`${item.label} ${item.subLabel}`:item.label} key={item.channel} label={item.subLabel?<Stack sx={{alignItems:"center",lineHeight:1}}><Box component="span">{item.label}</Box><Box component="span" sx={{fontSize:"0.56rem",fontWeight:600,mt:0.35,textTransform:"none"}}>{item.subLabel}</Box></Stack>:item.label} value={item.channel}/>)}
      </Tabs>
      <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",px:2,py:1}}>
        <Typography color="text.secondary" variant="caption">Last 48 hours</Typography><Link href={selectedDefinition.href} underline="hover">Open full news page</Link>
      </Stack>
      {channelLoading&&!page?<Box sx={{display:"grid",flex:1,placeItems:"center"}}><CircularProgress size={24}/></Box>:<Box ref={listRef} aria-label={`${selectedDefinition.label} articles`} role="region" sx={theme=>({...scannerScrollStyles(theme),flex:1,minHeight:0,overflow:"auto"})}>
        {!visibleChannel.length&&!newsError?<Typography color="text.secondary" sx={{p:3,textAlign:"center"}}>No releases in the last 48 hours.</Typography>:visibleChannel.map(article=><ButtonBase key={article.id} onClick={()=>void openArticle(article)}
          sx={{alignItems:{xs:"flex-start",sm:"center"},borderBottom:1,borderColor:"divider",display:"grid",gap:1,gridTemplateColumns:{xs:"5rem minmax(0,1fr)",sm:"7.5rem 4.5rem 7rem minmax(0,1fr)"},minHeight:54,px:2,py:1,textAlign:"left",width:"100%"}}>
          <Typography color="text.secondary" sx={{fontSize:"0.68rem"}}>{dateFormatter.format(new Date(article.publishedAt))} · {timeFormatter.format(new Date(article.publishedAt))} ET</Typography>
          <Typography sx={{color:"warning.main",fontSize:"0.78rem",fontWeight:900}}>{article.ticker}</Typography>
          <Typography color="text.secondary" sx={{display:{xs:"none",sm:"block"},fontSize:"0.68rem"}}>{article.marketCap ? `Market cap ${article.marketCap}` : "Market cap n/a"}</Typography>
          <Typography sx={{fontSize:"0.76rem",fontWeight:article.isRead?600:800,overflowWrap:"anywhere"}}>{article.headline}</Typography>
        </ButtonBase>)}
        {(page?.next||newsError)&&<Box sx={{p:1.5,textAlign:"center"}}>
          {newsError&&<Typography role="status" variant="body2">Recent news could not load.</Typography>}
          <Button size="small" disabled={channelLoading} onClick={()=>void fetchNews(channel,page?.next?"more":"initial",page?.next??undefined)}>
            {channelLoading?"Loading…":newsError?"Retry":"Load more"}
          </Button>
        </Box>}
      </Box>}
    </Stack>}
  </PressReleaseDrawer></>;
}
