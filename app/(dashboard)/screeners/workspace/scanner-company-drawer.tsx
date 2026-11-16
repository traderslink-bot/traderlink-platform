"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Box, Drawer, IconButton, Stack } from "@mui/material";
import { useEffect, useState, type ComponentProps } from "react";
import { CompanyDetails } from "../../ticker/[symbol]/company-details";
import { ScannerTickerDetails } from "../scanner-ticker-details";

function CompanyDrawerContent({symbol}:{symbol:string}){
  const [details,setDetails]=useState<ComponentProps<typeof CompanyDetails>>();
  const [failed,setFailed]=useState(false);
  useEffect(()=>{
    const controller=new AbortController();
    void fetch(`/api/company/details?symbol=${encodeURIComponent(symbol)}`,{signal:controller.signal})
      .then(response=>{if(!response.ok)throw Error();return response.json();})
      .then(data=>{if(!controller.signal.aborted)setDetails(data);})
      .catch(()=>{if(!controller.signal.aborted)setFailed(true);});
    return ()=>controller.abort();
  },[symbol]);
  if(!details)return <Box role="status">{failed?"Company details unavailable.":"Loading…"}</Box>;
  return <CompanyDetails {...details} levels={<ScannerTickerDetails symbol={symbol} stock={undefined} levelsOnly/>}/>;
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
