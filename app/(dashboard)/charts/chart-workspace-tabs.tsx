"use client";
import { useLayoutEffect, useRef, useState } from "react";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Tab, Tabs, TextField, Typography } from "@mui/material";
import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { chartSymbol, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { singleChart } from "@/src/modules/scanner/alpaca/chart-multiview";
import { chartTabDescription, chartWorkspaceViews, closeSelectedChartTab, openMultiTicker, tickerPortraitSetting, MAX_CHART_TABS, type ChartTabs } from "@/src/modules/scanner/alpaca/chart-tabs";

type Props = { book:ChartTabs; onChange:(book:ChartTabs)=>void; disabled:boolean };

export function ChartWorkspaceViewRow({book,onChange,disabled,onStartMultiTicker,onCloseMultiTicker,multiTickerClosed,inline=false}:Props & {onStartMultiTicker:()=>void;onCloseMultiTicker:()=>void;multiTickerClosed:boolean;inline?:boolean}){
  const {tickers,multi}=chartWorkspaceViews(book);
  const showMultiTicker=!multiTickerClosed;
  const showRow=!book.plain&&(tickers.length>1||(showMultiTicker&&Boolean(multi)));
  const multiValue=":multi-chart";
  const selected=book.selectedTab===multi?.id?multiValue:tickers.some(tab=>tab.id===book.selectedTab)?book.selectedTab:false;
  const scrollRef=useRef<HTMLDivElement>(null);
  const rowRef=useRef<HTMLDivElement>(null);
  const activeTicker=tickers.find(tab=>tab.id===selected);
  const closeLabel=selected===multiValue?"Close Multi-ticker view":activeTicker?`Close ${activeTicker.layout.groups[0].symbol} ticker view`:null;
  useLayoutEffect(()=>{
    const row=rowRef.current;
    if(!row||!showRow||!closeLabel)return;
    const tab=row.querySelector('[role="tab"][aria-selected="true"]');
    if(!tab)return;
    const align=()=>row.style.setProperty("--view-close-right",`${row.getBoundingClientRect().right-tab.getBoundingClientRect().right}px`);
    const observer=new ResizeObserver(align);
    observer.observe(row);observer.observe(tab);align();
    const scroller=scrollRef.current;
    if(scroller){
      const bounds=scroller.getBoundingClientRect(), activeBounds=tab.getBoundingClientRect();
      if(activeBounds.left<bounds.left)scroller.scrollLeft+=activeBounds.left-bounds.left;
      else if(activeBounds.right>bounds.right)scroller.scrollLeft+=activeBounds.right-bounds.right;
    }
    return()=>observer.disconnect();
  },[selected,showRow,closeLabel,tickers.length,showMultiTicker,inline]);
  if(!showRow)return null;
  const choose=(value:string)=>{
    if(value!==multiValue){onChange({...book,selectedTab:value});return;}
    if(multi)onChange(openMultiTicker(book,crypto.randomUUID()));
    else onStartMultiTicker();
  };
  const row=<Box ref={rowRef} sx={{position:"relative",flexShrink:0,minWidth:"max-content"}}>
  <Tabs data-chart-view-row value={selected} onChange={(_,id:string)=>choose(id)} variant="fullWidth" aria-label="Chart views"
    sx={{flexShrink:0,minHeight:44,borderBottom:inline?0:1,borderColor:"divider","& .MuiTab-root":{minHeight:44,minWidth:48,maxWidth:"none",px:inline?1:0.5,whiteSpace:"nowrap",textTransform:"none",fontSize:12},"& .MuiTab-root.Mui-selected":{color:"warning.main",fontWeight:700},"& .MuiTabs-indicator":{bgcolor:"warning.main"}}}>
    {tickers.map(tab=><Tab key={tab.id} value={tab.id} disabled={disabled} title={chartTabDescription(tab)} sx={tab.id===selected?{flexBasis:"32px",pr:"32px",minWidth:"64px !important"}:undefined} label={<Box component="span" sx={{maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>{tab.layout.groups[0].symbol}</Box>}/>)}
    {showMultiTicker && <Tab value={multiValue} label="Multi-ticker" disabled={disabled||!multi&&(!tickers.length||book.tabs.length>=MAX_CHART_TABS)} sx={{flex:"0 0 auto",minWidth:selected===multiValue?"116px !important":"88px !important",pr:selected===multiValue?"32px":undefined}}/>}
  </Tabs>
  {closeLabel && <IconButton aria-label={closeLabel} title={closeLabel} disabled={disabled} onClick={()=>selected===multiValue?onCloseMultiTicker():onChange(closeSelectedChartTab(book))}
    sx={{position:"absolute",top:0,right:"var(--view-close-right)",width:32,height:44,p:0,borderRadius:0,"&&":{minWidth:32}}}>
    <CloseRounded sx={{fontSize:17}}/>
  </IconButton>}
  </Box>;
  return <Box ref={scrollRef} sx={{flex:inline?1:undefined,flexShrink:0,minWidth:0,overflowX:"auto",scrollbarWidth:"none"}}>{row}</Box>;
}

export function ChartWorkspaceTabs({book,onChange,disabled,defaultTimeframe}:Props & {defaultTimeframe:ChartTimeframe}){
  const [open,setOpen]=useState(false),[symbol,setSymbol]=useState(""),[error,setError]=useState("");
  const {tickers}=chartWorkspaceViews(book);
  const full=book.tabs.length>=MAX_CHART_TABS;
  const add=()=>{
    try{
      const ticker=chartSymbol(symbol),existing=(book.plain?book.tabs:tickers).find(tab=>tab.layout.groups[0].symbol===ticker);
      if(existing){onChange({...book,selectedTab:existing.id});setOpen(false);return;}
      if(full)return;
      const id=crypto.randomUUID();
      onChange({version:1,...tickerPortraitSetting(book),tabs:[...book.tabs,{id,name:"",layout:singleChart(ticker, defaultTimeframe)}],selectedTab:id});
      setOpen(false);
    }catch{setError("Enter a valid stock symbol.");}
  };
  return <Stack direction="row" sx={{flexShrink:0,height:44,alignItems:"center"}}>
    <IconButton aria-label="Add ticker view" title={full?"Saved chart tab limit reached":"Add ticker view"} aria-haspopup="dialog" disabled={disabled||full} onClick={()=>{setSymbol("");setError("");setOpen(true);}} sx={{width:44,height:44,p:0.5}}><AddRounded fontSize="small"/></IconButton>
    <Dialog open={open} onClose={()=>setOpen(false)} fullWidth maxWidth="xs" aria-labelledby="add-chart-tab-title">
      <DialogTitle id="add-chart-tab-title">Add ticker view</DialogTitle>
      <Box component="form" onSubmit={e=>{e.preventDefault();add();}}>
        <DialogContent><Stack spacing={1.5} sx={{pt:1}}>
          <TextField autoFocus label="Ticker" value={symbol} onChange={e=>{setSymbol(e.target.value);setError("");}} size="small" slotProps={{htmlInput:{maxLength:15,autoCapitalize:"characters",autoCorrect:"off",spellCheck:false}}}/>
          {error?<Alert severity="error">{error}</Alert>:null}
          <Typography variant="caption" color="text.secondary">Use Multiview to add timeframes to a ticker view.</Typography>
        </Stack></DialogContent>
        <DialogActions><Button onClick={()=>setOpen(false)}>Cancel</Button><Button type="submit" disabled={!symbol.trim()||full}>Add ticker</Button></DialogActions>
      </Box>
    </Dialog>
  </Stack>;
}
