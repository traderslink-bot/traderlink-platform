"use client";

import Link from "@mui/material/Link";
import { createContext, useContext, type MouseEvent, type ReactNode } from "react";

import type { ScannerNewsItem } from "@/src/modules/scanner/live/contracts";

const ScannerNewsDrawerContext=createContext<((item:ScannerNewsItem)=>void)|null>(null);

export function ScannerNewsDrawerProvider({children,onOpen}:{children:ReactNode;onOpen:(item:ScannerNewsItem)=>void}){
  return <ScannerNewsDrawerContext.Provider value={onOpen}>{children}</ScannerNewsDrawerContext.Provider>;
}

export function ScannerNewsLink({item,label}:{item:ScannerNewsItem;label:string}){
  const open=useContext(ScannerNewsDrawerContext);
  const activate=(event:MouseEvent<HTMLButtonElement>)=>{event.stopPropagation();open?.(item);};
  return <Link aria-label={`Open ${item.typeLabel}: ${item.headline}`} component="button" onClick={activate}
    onKeyDown={event=>event.stopPropagation()} sx={{fontSize:"0.68rem",fontWeight:800,lineHeight:1.2}} title={item.headline} type="button">{label}</Link>;
}
