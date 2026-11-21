"use client";

import { createContext, useContext, type ReactNode } from "react";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
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
  const selectedLabel=label && label !== scannerTitles[choice.scanner] ? label : undefined;
  return <Select value={choice.scanner} variant="standard" disableUnderline autoWidth
    renderValue={()=>selectedLabel ?? scannerTitles[choice.scanner]}
    inputProps={{"aria-label":`Scanner for ${scannerTitles[choice.slot]} card`}}
    onChange={event=>{if(isScannerCard(event.target.value))choice.onChange(event.target.value);}}
    sx={{minWidth:0,width:"fit-content",maxWidth:"100%",fontSize:"0.9rem",fontWeight:850,
      "& .MuiSelect-select":{py:0,pl:0,pr:"24px !important",minWidth:"0 !important",textOverflow:"ellipsis"},
      "& .MuiSelect-icon":{fontSize:20,right:0}}}>
    {/* The trigger fits the current title; the menu fits its full, unwrapped choices. */}
    {Object.entries(scannerTitles).map(([key,label])=><MenuItem key={key} value={key}
      sx={{whiteSpace:"nowrap"}}>{label}</MenuItem>)}
  </Select>;
}
