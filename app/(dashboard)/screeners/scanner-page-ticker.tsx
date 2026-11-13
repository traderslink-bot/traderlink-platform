"use client";

import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import { createContext, useContext, type ReactNode } from "react";

export const ScannerPageTickerSelection = createContext<{
  ticker: string | null;
  select: (ticker: string) => void;
} | null>(null);

export function ScannerPageTicker({ symbol }: { symbol: string }): ReactNode {
  const selection = useContext(ScannerPageTickerSelection);
  const style = {color:"warning.main",font:"inherit",fontWeight:800,whiteSpace:"nowrap"};
  if (!selection) return <Box component="span" sx={style}>{symbol}</Box>;
  const selected = selection.ticker === symbol;
  return <ButtonBase aria-label={`Show ${symbol} in scanner chart`} aria-pressed={selected}
    onClick={event=>{event.stopPropagation();selection.select(symbol);}}
    onKeyDown={event=>event.stopPropagation()} onKeyUp={event=>event.stopPropagation()}
    sx={{...style,textDecoration:selected?"underline":"none",textUnderlineOffset:"2px",
      "&:hover":{textDecoration:"underline"},"&.Mui-focusVisible":{outline:"2px solid",outlineOffset:1}}}>
    {symbol}
  </ButtonBase>;
}
