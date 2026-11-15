"use client";

import InsertChartOutlinedIcon from "@mui/icons-material/InsertChartOutlined";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { createContext, useContext, type ReactNode } from "react";

export const ScannerPageTickerSelection = createContext<{
  ticker: string | null;
  select?: (ticker: string) => void;
} | null>(null);

export function ScannerPageTicker({ symbol }: { symbol: string }): ReactNode {
  const selection = useContext(ScannerPageTickerSelection);
  const style = {color:"warning.main",font:"inherit",fontWeight:800,whiteSpace:"nowrap"};
  if (!selection?.select) return <Box component="span" sx={style}>{symbol}</Box>;
  return <ButtonBase aria-label={`Show ${symbol} in Trading Workspace chart`}
    onClick={event=>{event.stopPropagation();selection.select?.(symbol);}}
    onKeyDown={event=>event.stopPropagation()} onKeyUp={event=>event.stopPropagation()}
    sx={{...style,"&:hover":{textDecoration:"underline"},"&.Mui-focusVisible":{outline:"2px solid",outlineOffset:1}}}>
    {symbol}
  </ButtonBase>;
}

export function ScannerPageChartButton({symbol}:{symbol:string}){
  const selection=useContext(ScannerPageTickerSelection);
  const select=selection?.select;
  if(!select)return null;
  return <ButtonBase title="Show in Trading Workspace chart" aria-label={`Show ${symbol} in scanner chart`}
    aria-pressed={selection?.ticker===symbol} onClick={event=>{event.stopPropagation();select(symbol);}}
    onKeyDown={event=>event.stopPropagation()} onKeyUp={event=>event.stopPropagation()}
    sx={{display:{xs:"none",md:"inline-flex"},width:20,height:20,flexShrink:0,color:theme=>theme.palette.mode==="dark"?"#7dd3fc":"#0369a1", bgcolor:"action.hover", borderRadius:0.5,
      "&:hover":{"bgcolor":"action.selected"},"&.Mui-focusVisible":{outline:"2px solid",outlineOffset:1}}}>
    <InsertChartOutlinedIcon sx={{fontSize:"0.9rem"}}/>
  </ButtonBase>;
}
