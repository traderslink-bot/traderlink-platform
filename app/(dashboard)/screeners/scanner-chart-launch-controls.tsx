"use client";
import { createContext, useContext } from "react";
import AddchartRoundedIcon from "@mui/icons-material/AddchartRounded";
import CandlestickChartRoundedIcon from "@mui/icons-material/CandlestickChartRounded";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import Tooltip from "@mui/material/Tooltip";

const AddChartControlsContext=createContext(false);
export const SideCardChartControls=AddChartControlsContext.Provider;
export const useSideCardChartControls=()=>useContext(AddChartControlsContext);

/** Separate replacement and additive chart launches without changing row expansion. */
export function ScannerChartLaunchControls<T extends {symbol:string}>({row,onOpenChart,expanded=false}:{row:T;onOpenChart:(row:T)=>void;expanded?:boolean}) {
  const allowAdd=useContext(AddChartControlsContext);
  return <Box component="span" sx={{display:"inline-flex",alignItems:"center",gap:0.5,flexShrink:0}}>
    {(allowAdd?[false,true]:[false]).map(add=><Tooltip key={String(add)} title={add?"Add chart alongside open tickers":"Open only this ticker and its details"}>
      <ButtonBase aria-label={add?`Add ${row.symbol} chart`:`Open ${row.symbol} chart only`} onClick={event=>{event.stopPropagation();onOpenChart({...row,addChart:add});}} onKeyDown={event=>event.stopPropagation()}
        sx={{alignItems:"center",bgcolor:"rgba(46,125,50,0.13)",borderRadius:0.75,color:"success.main",height:expanded?38:20,width:expanded?38:20,flexShrink:0,'&:hover':{bgcolor:"rgba(46,125,50,0.23)"},'&:focus-visible':{outline:"2px solid",outlineColor:"success.main",outlineOffset:1}}}>
        {add?<AddchartRoundedIcon sx={{fontSize:expanded?"1.8rem":"0.9rem"}}/>:<CandlestickChartRoundedIcon sx={{fontSize:expanded?"1.8rem":"0.9rem"}}/>}
      </ButtonBase>
    </Tooltip>)}
  </Box>;
}
