"use client";

import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import type { ScannerActiveHalt } from "@/src/modules/scanner/live/contracts";

const shortTime=(value:string|null)=>value?value.slice(0,5):"Pending";

export function ScreenerHaltIndicator({halt}:{halt:ScannerActiveHalt|undefined}){
  if(!halt)return null;
  const details=`${halt.reasonCode} · Halted ${shortTime(halt.haltTimeEt)} ET · Quote ${shortTime(halt.quoteTimeEt)} ET · Trade ${shortTime(halt.tradeTimeEt)} ET`;
  return <Tooltip arrow title={<Box><Typography sx={{fontSize:"0.72rem",fontWeight:800}}>{halt.reasonCode} · {halt.reason}</Typography><Typography sx={{fontSize:"0.68rem",mt:0.25}}>Halted {shortTime(halt.haltTimeEt)} ET · Quote {shortTime(halt.quoteTimeEt)} ET · Trade {shortTime(halt.tradeTimeEt)} ET</Typography></Box>}>
    <Box aria-label={`${halt.ticker} halted: ${details}`} component="span" data-halt-indicator={halt.ticker} onClick={event=>event.stopPropagation()} onKeyDown={event=>event.stopPropagation()}
      role="img" sx={{alignItems:"center",color:"error.main",display:"inline-flex",flex:"0 0 auto"}}>
      <PauseRoundedIcon sx={{fontSize:"0.82rem"}}/>
    </Box>
  </Tooltip>;
}
