"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Button, Drawer, IconButton, Skeleton, Stack, Typography } from "@mui/material";
import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import type { CompanyTab } from "../../ticker/[symbol]/company-details";
import { ChartPreferencesContext, useChartPreferences } from "../../charts/use-chart-preferences";
import { ScannerTickerDetails } from "../scanner-ticker-details";

const Chart = lazy(() => import("../../charts/market-chart")
  .then(module => ({ default: module.MarketChart })));
const CompanyDetails = lazy(() => import("../../ticker/[symbol]/company-details")
  .then(module => ({ default: module.CompanyDetails })));

function CompanyChart({symbol,timeframe,onTimeframeChange}:{
  symbol:string;timeframe?:ChartTimeframe;onTimeframeChange:(timeframe:ChartTimeframe)=>void;
}){
  const preferences=useChartPreferences();
  return <Box sx={{height:"clamp(280px, 62dvh, 720px)",minWidth:0,border:1,borderColor:"divider"}}>
    <Suspense fallback={<Skeleton role="status" aria-label="Loading chart" variant="rectangular" height="100%"/>}>
      {/* Journal review can switch symbols. Keep it out of this single-ticker chart. */}
      <ChartPreferencesContext.Provider value={{...preferences,journalAccountRef:undefined}}>
        <Chart symbol={symbol} timeframe={timeframe} onTimeframeChange={onTimeframeChange}
          viewId="company-details" viewWorkspace="scanner" compactMobile/>
      </ChartPreferencesContext.Provider>
    </Suspense>
  </Box>;
}

function useCompanyDrawerRead<T>(symbol:string,view:"overview"|"company"|"news",loadImmediately=false){
  const [attempt,setAttempt]=useState(loadImmediately?1:0);
  const [result,setResult]=useState<{attempt:number;data:T|null;denied?:boolean}>();
  const current=result?.attempt===attempt?result:undefined;
  const data=current?.data;
  const load=()=>{if(attempt===0||data===null)setAttempt(attempt+1);};
  useEffect(()=>{
    if(attempt===0)return;
    const controller=new AbortController();
    const read=async()=>{
      try{
        const response=await fetch(`/api/company/details?symbol=${encodeURIComponent(symbol)}&view=${view}`,{signal:controller.signal});
        const data=response.ok?await response.json() as T:null;
        const denied=response.status===401||response.status===403||response.status===404;
        if(!controller.signal.aborted)setResult({attempt,data,denied});
      }catch{if(!controller.signal.aborted)setResult({attempt,data:null});}
    };
    void read();
    return ()=>controller.abort();
  },[symbol,view,attempt]);
  return {data,denied:current?.denied,load};
}

function DeferredCompanyPanel({label,failed,retry}:{label:string;failed:boolean;retry:()=>void}){
  return <Stack spacing={1} sx={{alignItems:"flex-start"}}>
    <Typography role="status">{failed?`${label} unavailable.`:`Loading ${label.toLowerCase()}…`}</Typography>
    {failed&&<Button size="small" variant="outlined" onClick={retry}>Retry</Button>}
  </Stack>;
}

function CompanyDrawerContent({symbol,broker}:{symbol:string;broker:boolean}){
  type Details=ComponentProps<typeof CompanyDetails>;
  type DetailsResponse=Pick<Details,"company"|"technicalSample">&{scannerMember:boolean};
  const overview=useCompanyDrawerRead<DetailsResponse>(symbol,"overview",true);
  const company=useCompanyDrawerRead<DetailsResponse>(symbol,"company");
  const news=useCompanyDrawerRead<Pick<Details,"news">>(symbol,"news");
  const [timeframe,setTimeframe]=useState<ChartTimeframe>();
  function openTab(tab:CompanyTab){
    if(tab==="profile"||tab==="financials"||tab==="filings")company.load();
    if(tab==="news")news.load();
    if(tab==="technicals"&&!company.data)overview.load();
  }
  const details=company.data??overview.data;
  if(overview.denied&&!details)return <Box role="status">Company details unavailable.</Box>;
  const pendingOverview=<DeferredCompanyPanel label="Company details" failed={overview.data===null} retry={overview.load}/>;
  return <Suspense fallback={<Stack spacing={1}>
    <Typography component="h1" variant="h4" color="warning.main">{symbol}</Typography>
    <Typography role="status" color="text.secondary">Loading technicals…</Typography>
  </Stack>}>
    <CompanyDetails company={details?.company??{symbol}} broker={broker} technicalSample={broker?undefined:details?.technicalSample} news={news.data?.news??[]}
      allowSupplementalReads={Boolean(details)}
      onTabChange={openTab}
      deferredCompany={!company.data?<DeferredCompanyPanel label="Company details" failed={company.data===null} retry={company.load}/>:undefined}
      deferredNews={!news.data?<DeferredCompanyPanel label="News" failed={news.data===null} retry={news.load}/>:undefined}
      levels={!broker&&details?.scannerMember?<ScannerTickerDetails symbol={symbol} stock={undefined} levelsOnly/>:undefined}
      chart={details?<CompanyChart symbol={symbol} timeframe={timeframe} onTimeframeChange={setTimeframe}/>:pendingOverview}/>
  </Suspense>;
}

export function ScannerCompanyDrawer({symbol,onClose,broker=false}:{symbol:string|null;onClose:()=>void;broker?:boolean}){
  return <Drawer anchor="right" open={Boolean(symbol)} onClose={onClose}
    slotProps={{paper:{role:"dialog","aria-modal":true,"aria-label":"Company Details",sx:{width:{xs:"100%",md:900},maxWidth:"100vw",borderRadius:0}}}}>
    {symbol&&<Box sx={{p:{xs:1.5,md:2},minWidth:0}}>
      <Stack direction="row" sx={{justifyContent:"flex-end",alignItems:"center",gap:1}}>
        <IconButton aria-label="Close Company Details" onClick={onClose}><CloseRoundedIcon/></IconButton>
      </Stack>
      <CompanyDrawerContent key={symbol} symbol={symbol} broker={broker}/>
    </Box>}
  </Drawer>;
}
