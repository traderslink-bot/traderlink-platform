"use client";

import { createContext, useContext, type ReactNode } from "react";
import NativeSelect from "@mui/material/NativeSelect";
import { GAINER_CARD_LABELS } from "@/src/modules/scanner/live/gainer-card-policy";

export const scannerCardSlots = {
  gainers: "Top Gainers",
  momentum: "Momentum",
  "top-losers": "Top Losers",
  "high-drops": "HOD Drops",
  breakouts: "Breakouts",
};
export const scannerTitles = {
  ...GAINER_CARD_LABELS,
  momentum: scannerCardSlots.momentum,
  "top-losers": scannerCardSlots["top-losers"],
  "high-drops": scannerCardSlots["high-drops"],
  breakouts: scannerCardSlots.breakouts,
};
export type ScannerCardSlot = keyof typeof scannerCardSlots;
export type ScannerCardKind = keyof typeof scannerTitles;
export type CardScanners = Partial<Record<ScannerCardSlot, ScannerCardKind>>;
export const isScannerCardSlot = (value: string): value is ScannerCardSlot => Object.hasOwn(scannerCardSlots, value);
export const isScannerCard = (value: string): value is ScannerCardKind => Object.hasOwn(scannerTitles,value);
export function readCardScanners(value: unknown): CardScanners {
  if(!value||typeof value!=="object")return {};
  return Object.fromEntries(Object.entries(value).filter(([slot,scanner])=>
    isScannerCardSlot(slot)&&typeof scanner==="string"&&isScannerCard(scanner)));
}

export const WorkspaceScannerTitleContext = createContext<{
  slot: ScannerCardSlot; scanner: ScannerCardKind; onChange:(scanner:ScannerCardKind)=>void;
}|null>(null);

export function WorkspaceScannerTitle({ children, label }: { children?:ReactNode; label?:string }) {
  const choice=useContext(WorkspaceScannerTitleContext);
  if(!choice)return children;
  const selectedLabel=label;
  return <NativeSelect value={choice.scanner} disableUnderline
    inputProps={{"aria-label":`Scanner for ${scannerTitles[choice.slot]} card`}}
    onChange={event=>{if(isScannerCard(event.target.value))choice.onChange(event.target.value);}}
    sx={{minWidth:0,maxWidth:"100%",fontSize:"0.9rem",fontWeight:850,
      "& .MuiNativeSelect-select":{py:0,pl:0,pr:"19px !important",textOverflow:"ellipsis"},
      "& .MuiNativeSelect-icon":{fontSize:17}}}>
    {Object.entries(scannerTitles).map(([key,label])=><option key={key} value={key}>{key===choice.scanner&&selectedLabel?selectedLabel:label}</option>)}
  </NativeSelect>;
}
