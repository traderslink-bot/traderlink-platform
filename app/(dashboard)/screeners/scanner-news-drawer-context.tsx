"use client";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import { createContext, useContext, useMemo, useSyncExternalStore, type MouseEvent, type ReactNode } from "react";

import type { ScannerNewsItem } from "@/src/modules/scanner/live/contracts";
import { recentScannerTradingDates, scannerNewsEasternDate } from "@/src/modules/news/contracts/scanner-news-trading-dates";

const ScannerNewsDrawerContext=createContext<((item:ScannerNewsItem)=>void)|null>(null);
const ScannerNewsTradingDatesContext = createContext<readonly string[]>([]);

function currentNewsDay(): string {
  return scannerNewsEasternDate(new Date());
}

function subscribeToNewsDay(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  document.addEventListener("visibilitychange", onChange);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener("visibilitychange", onChange);
  };
}

const serverNewsDay = () => null;

export function ScannerNewsDrawerProvider({children,onOpen}:{children:ReactNode;onOpen:(item:ScannerNewsItem)=>void}){
  const day = useSyncExternalStore<string | null>(subscribeToNewsDay, currentNewsDay, serverNewsDay);
  const tradingDates = useMemo(() => {
    if (!day) return [];
    const window = recentScannerTradingDates(day);
    return window.holidaysCovered ? window.dates : [];
  }, [day]);
  return <ScannerNewsDrawerContext.Provider value={onOpen}>
    <ScannerNewsTradingDatesContext.Provider value={tradingDates}>{children}</ScannerNewsTradingDatesContext.Provider>
  </ScannerNewsDrawerContext.Provider>;
}

export function ScannerNewsLink({item,label,description}:{item:ScannerNewsItem;label:ReactNode;description?:string}){
  const open=useContext(ScannerNewsDrawerContext);
  const activate=(event:MouseEvent<HTMLButtonElement>)=>{event.stopPropagation();open?.(item);};
  return <Link aria-label={`Open ${item.typeLabel}: ${item.headline}`} aria-description={description} component="button" onClick={activate}
    onKeyDown={event=>event.stopPropagation()} sx={{fontSize:"0.68rem",fontWeight:800,lineHeight:1.2}} title={item.headline} type="button">{label}</Link>;
}


export function ScannerRowNews({news}:{news:readonly ScannerNewsItem[]}) {
  const tradingDates = useContext(ScannerNewsTradingDatesContext);
  let item = news[0];
  let latest = -Infinity;
  for (const release of news) {
    if (!release.publishedAt) continue;
    const published = Date.parse(release.publishedAt);
    if (published > latest) {
      item = release;
      latest = published;
    }
  }
  const publishedDate = Number.isFinite(latest) ? scannerNewsEasternDate(new Date(latest)) : null;
  const marketDay = publishedDate ? tradingDates.indexOf(publishedDate) + 1 : 0;
  const description = marketDay > 0
    ? `Latest news published ${publishedDate} Eastern time, market day ${marketDay} of 5`
    : undefined;
  return <Box data-scanner-row-news sx={{display:"flex",alignItems:"center",justifyContent:"center",width:20,height:20,flexShrink:0,
    "& button":{fontSize:"1.05rem",lineHeight:1,textDecoration:"none"}}}>
    {item?<ScannerNewsLink item={item} description={description} label={
      <Box component="span" aria-hidden="true" sx={{position:"relative",display:"inline-flex"}}>
        🗞️
        {marketDay > 0 && <Box component="span" data-scanner-news-age sx={{
          position:"absolute",top:-1,left:-1,width:10,height:10,borderRadius:"50%",
          display:"grid",placeItems:"center",fontSize:8,fontWeight:900,lineHeight:1,
          bgcolor:"#ffbf47",color:"#241700",pointerEvents:"none",
        }}>{marketDay}</Box>}
      </Box>
    }/>:null}
  </Box>;
}
