"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Drawer, IconButton, Skeleton, Stack } from "@mui/material";
import { lazy, Suspense, useEffect, useState, type ComponentProps } from "react";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { CompanyDetails } from "../../ticker/[symbol]/company-details";
import { ChartPreferencesContext, useChartPreferences } from "../../charts/use-chart-preferences";
import { ScannerTickerDetails } from "../scanner-ticker-details";

const Chart = lazy(() => import("../../charts/market-chart")
  .then(module => ({ default: module.MarketChart })));

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

function CompanyDrawerContent({symbol}:{symbol:string}){
  const [details,setDetails]=useState<ComponentProps<typeof CompanyDetails>>();
  const [failed,setFailed]=useState(false);
  const [timeframe,setTimeframe]=useState<ChartTimeframe>();
  useEffect(()=>{
    const controller=new AbortController();
    void fetch(`/api/company/details?symbol=${encodeURIComponent(symbol)}`,{signal:controller.signal})
      .then(response=>{if(!response.ok)throw Error();return response.json();})
      .then(data=>{if(!controller.signal.aborted)setDetails(data);})
      .catch(()=>{if(!controller.signal.aborted)setFailed(true);});
    return ()=>controller.abort();
  },[symbol]);
  if(!details)return <Box role="status">{failed?"Company details unavailable.":"Loading…"}</Box>;
  return <CompanyDetails {...details} levels={<ScannerTickerDetails symbol={symbol} stock={undefined} levelsOnly/>}
    chart={<CompanyChart symbol={symbol} timeframe={timeframe} onTimeframeChange={setTimeframe}/>}/>;
}

export function ScannerCompanyDrawer({symbol,onClose}:{symbol:string|null;onClose:()=>void}){
  return <Drawer anchor="right" open={Boolean(symbol)} onClose={onClose}
    slotProps={{paper:{role:"dialog","aria-modal":true,"aria-label":"Company Details",sx:{width:{xs:"100%",md:900},maxWidth:"100vw",borderRadius:0}}}}>
    {symbol&&<Box sx={{p:{xs:1.5,md:2},minWidth:0}}>
      <Stack direction="row" sx={{justifyContent:"flex-end",alignItems:"center",gap:1}}>
        <IconButton aria-label="Close Company Details" onClick={onClose}><CloseRoundedIcon/></IconButton>
      </Stack>
      <CompanyDrawerContent key={symbol} symbol={symbol}/>
    </Box>}
  </Drawer>;
}
