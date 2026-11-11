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
  useLayoutEffect(()=>{
    const tab=rowRef.current?.querySelector('[role="tab"][aria-selected="true"]');
    const scroller=scrollRef.current;
    if(!showRow||!tab||!scroller)return;
    const bounds=scroller.getBoundingClientRect(), activeBounds=tab.getBoundingClientRect();
    if(activeBounds.left<bounds.left)scroller.scrollLeft+=activeBounds.left-bounds.left;
    else if(activeBounds.right>bounds.right)scroller.scrollLeft+=activeBounds.right-bounds.right;
  },[selected,showRow,tickers.length,showMultiTicker,inline]);
  if(!showRow)return null;
  const choose=(value:string)=>{
    if(value!==multiValue){onChange({...book,selectedTab:value});return;}
    if(multi)onChange(openMultiTicker(book,crypto.randomUUID()));
    else onStartMultiTicker();
  };
  const closeTicker=(id:string)=>{
    if(id===book.selectedTab){onChange(closeSelectedChartTab(book));return;}
    onChange({...book,tabs:book.tabs.filter(tab=>tab.id!==id)});
  };
  const tickerWidth=112,multiWidth=116,gap=4,closeWidth=36;
  const closeButton=(label:string,left:number,close:()=>void)=><IconButton aria-label={label} title={label} disabled={disabled} onClick={close}
    sx={{position:"absolute",top:3,left,width:closeWidth,height:38,p:0,borderRadius:0}}>
    <CloseRounded sx={{fontSize:17}}/>
  </IconButton>;
  return <Box ref={scrollRef} sx={{flex:inline?1:undefined,flexShrink:0,minWidth:0,overflowX:"auto",scrollbarWidth:"none"}}>
    <Box ref={rowRef} sx={{position:"relative",width:"max-content",pl:`${gap}px`,pr:`${gap}px`}}>
      <Tabs data-chart-view-row value={selected} onChange={(_,id:string)=>choose(id)} aria-label="Chart views"
        sx={{minHeight:44,"& .MuiTabs-list":{gap:`${gap}px`,justifyContent:"flex-start"},
          "& .MuiTabs-indicator":{display:"none"},
          "& .MuiTab-root":{flex:"0 0 auto",minHeight:38,height:38,my:"3px",px:1.25,py:0,minWidth:0,maxWidth:"none",
            alignItems:"flex-start",border:1,borderColor:"divider",borderRadius:0,whiteSpace:"nowrap",textTransform:"none",fontSize:12},
          "& .MuiTab-root.Mui-selected":{color:"warning.main",borderColor:"warning.main",fontWeight:700},
          "& .MuiTab-root.Mui-focusVisible":{outline:"2px solid",outlineColor:"warning.main",outlineOffset:-3}}}>
        {tickers.map(tab=><Tab key={tab.id} value={tab.id} disabled={disabled} title={chartTabDescription(tab)}
          sx={{width:tickerWidth,pr:`${closeWidth}px !important`}} label={<Box component="span" sx={{maxWidth:"100%",overflow:"hidden",textOverflow:"ellipsis"}}>{tab.layout.groups[0].symbol}</Box>}/>)}
        {showMultiTicker && <Tab value={multiValue} label="Multi-ticker" disabled={disabled||!multi&&(!tickers.length||book.tabs.length>=MAX_CHART_TABS)}
          sx={{width:multiWidth,pr:selected===multiValue?`${closeWidth}px !important`:undefined}}/>}
      </Tabs>
      {tickers.map((tab,index)=><Box key={tab.id}>{closeButton(`Close ${tab.layout.groups[0].symbol} ticker view`,
        gap+index*(tickerWidth+gap)+tickerWidth-closeWidth-1,()=>closeTicker(tab.id))}</Box>)}
      {selected===multiValue&&closeButton("Close Multi-ticker view",gap+tickers.length*(tickerWidth+gap)+multiWidth-closeWidth-1,onCloseMultiTicker)}
    </Box>
  </Box>;

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
