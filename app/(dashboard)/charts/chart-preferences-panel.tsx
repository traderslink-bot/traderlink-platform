"use client";
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Button from "@mui/material/Button";

import { CHART_OVERNIGHT_ENABLED, chartShowsOvernight } from "@/src/modules/scanner/alpaca/chart-overnight-session";
import Checkbox from '@mui/material/Checkbox';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {useTheme} from '@mui/material/styles';
import {ChartIndicatorEditor} from './chart-indicator-editor';
import {CHART_TIMEFRAMES,type ChartTimeframe} from '@/src/modules/scanner/alpaca/candles';
import {CHART_PRICE_STYLES,isReviewChartStyle,DEFAULT_CHART_CROSSHAIR_MODE,changeIndicatorDisplayChoice,INDICATOR_TYPES,setAllIndicatorOverlayWidths,setAllIndicatorPriceScaleLabels,type ChartPreferences,type IndicatorDisplayAction,type IndicatorDisplayChoices,type IndicatorType} from '@/src/modules/scanner/alpaca/chart-preferences';
import {chartTimeZoneLabel,chartTimeZoneOptions,chartTimeZoneSearchText} from '@/src/modules/scanner/alpaca/chart-time-zone';

const timeZones = chartTimeZoneOptions();
const filterTimeZones = createFilterOptions<string>({ stringify: chartTimeZoneSearchText, limit: 75 });

export function ChartPreferencesPanel({ticker,timeframe,panel,onClose,preferences:p,crosshairLines,onChange,message,initialIndicator,indicatorDisplay,onIndicatorDisplayChange,onBarReplay,reviewChartStyles=false}:{ticker:string;timeframe:ChartTimeframe;panel:'indicators'|'settings'|null;onClose:()=>void;preferences:ChartPreferences;crosshairLines:readonly {value:`indicator:${string}:${string}`;label:string}[];onChange:(p:ChartPreferences)=>void;message:string;initialIndicator?:IndicatorType;indicatorDisplay:IndicatorDisplayChoices;reviewChartStyles?:boolean;onBarReplay?:()=>void;onIndicatorDisplayChange:(type:IndicatorType,action:IndicatorDisplayAction,value:boolean)=>void}){
 const theme=useTheme(),mobile=useMediaQuery(theme.breakpoints.down('md'));
 const set=<K extends keyof ChartPreferences>(key:K,value:ChartPreferences[K])=>onChange({...p,[key]:value});
 const changeAllCharts=(type:IndicatorType,action:IndicatorDisplayAction,value:boolean)=>{
  const revision=(p.indicatorDisplay?.[type]?.[action]?.revision??0)+1;
  set('indicatorDisplay',changeIndicatorDisplayChoice(p.indicatorDisplay,type,action,value,revision));
 };
 const changeIndicators=(indicators:ChartPreferences['indicators'])=>{
  let indicatorDisplay=p.indicatorDisplay;
  for(const type of INDICATOR_TYPES){
   if(!p.indicators.some(indicator=>indicator.type===type)||indicators.some(indicator=>indicator.type===type))continue;
   indicatorDisplay=changeIndicatorDisplayChoice(indicatorDisplay,type,'enabled',true,(indicatorDisplay?.[type]?.enabled?.revision??0)+1);
   indicatorDisplay=changeIndicatorDisplayChoice(indicatorDisplay,type,'hidden',false,(indicatorDisplay[type]?.hidden?.revision??0)+1);
  }
  onChange({...p,indicators,indicatorDisplay});
 };
 const color=(label:string,value:string,change:(v:string)=>void)=><TextField label={label} type="color" defaultValue={value} key={value} onBlur={e=>{if(e.target.value!==value)change(e.target.value);}} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:120}}/>;
 return <Drawer anchor={mobile?'bottom':'right'} open={panel!==null} onClose={onClose} slotProps={{paper:{role:'dialog','aria-modal':true,'aria-label':panel==='indicators'?'Chart indicators':'Chart settings',sx:{width:mobile?'100%':400,maxHeight:mobile?'78dvh':'100dvh',borderRadius:0,display:'flex',flexDirection:'column'}}}}>
  <Stack direction="row" sx={{px:2,py:1,alignItems:'center',justifyContent:'space-between',borderBottom:1,borderColor:'divider',flexShrink:0}}><Typography component="h2" sx={{fontSize:18,fontWeight:700}}>{panel==='indicators'?'Indicators':'Chart settings'}</Typography><IconButton aria-label="Close chart preferences" onClick={onClose} sx={{minWidth:44,minHeight:44}}><CloseRounded/></IconButton></Stack>
  <Stack spacing={2} sx={{p:2,overflowY:'auto',minHeight:0}}>
  {panel==='indicators'?<ChartIndicatorEditor ticker={ticker} key={`${ticker}:${initialIndicator??"list"}`} initialType={initialIndicator} overlayLineWidth={p.indicatorOverlayLineWidth??1} onOverlayLineWidthChange={width=>onChange(setAllIndicatorOverlayWidths(p,width))} defaultPriceScaleLabels={p.indicatorPriceScaleLabels??false} display={indicatorDisplay} accountDisplay={p.indicatorDisplay} onDisplayChange={onIndicatorDisplayChange} onAccountDisplayChange={changeAllCharts} indicators={p.indicators} savedPresets={p.savedIndicatorPresets ?? []} onChange={changeIndicators} onPresetsChange={presets=>set('savedIndicatorPresets',presets)}/>:<>
   {onBarReplay && <Button size="small" variant="outlined" onClick={onBarReplay} sx={{alignSelf:"flex-start",textTransform:"none"}}>Bar Replay</Button>}
   <TextField select label="Chart type" value={p.kind}
     helperText={p.kind==="heikinAshi"?"Smoothed candles. The price marker and crosshair readout show market prices.":undefined}
     onChange={e=>set('kind',e.target.value as ChartPreferences['kind'])} size="small">{Object.entries(CHART_PRICE_STYLES).filter(([kind])=>reviewChartStyles||!isReviewChartStyle(kind)).map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   {(p.kind==="renko"||p.kind==="range")&&<TextField key={p.movementStep??0.01} label={p.kind==="renko"?"Brick size ($)":"Range size ($)"}
     type="number" size="small" defaultValue={p.movementStep??0.01}
     onChange={event=>event.target.setCustomValidity("")}
     onBlur={event=>{
       const value=Number(event.target.value);
       if(!event.target.value||!event.target.checkValidity()){
         event.target.value=String(p.movementStep??0.01);
         return;
       }
       if(value!==(p.movementStep??0.01))set("movementStep",value);
     }}
     slotProps={{htmlInput:{min:0.0001,max:100,step:0.0001}}}
     helperText="Regular-session trades" sx={{width:165}}/>}
   <TextField select label="Chart theme" value={p.theme} onChange={e=>set('theme',e.target.value as ChartPreferences['theme'])} size="small">{[['auto','Follow app theme'],['light','Light'],['dark','Dark']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   <Stack direction="row" spacing={1}>{color('Up color',p.upColor,v=>set('upColor',v))}{color('Down color',p.downColor,v=>set('downColor',v))}</Stack>
   <TextField select label="Crosshair" size="small" value={p.crosshairMode??DEFAULT_CHART_CROSSHAIR_MODE}
     onChange={event=>set("crosshairMode",event.target.value as ChartPreferences["crosshairMode"])}>
     <MenuItem value="normal">Free movement</MenuItem>
     <MenuItem value="price">Snap to price</MenuItem>
     <MenuItem value="nearest">Snap to nearest line</MenuItem>
     {p.crosshairMode?.startsWith("indicator:")&&!crosshairLines.some(line=>line.value===p.crosshairMode)
       ? <MenuItem value={p.crosshairMode} disabled>Saved line unavailable · snapping to price</MenuItem> : null}
     {crosshairLines.map(line=><MenuItem value={line.value} key={line.value}>Snap to {line.label}</MenuItem>)}
   </TextField>
   <TextField select label="Default timeframe" value={p.timeframe} onChange={e=>set('timeframe',e.target.value as ChartPreferences['timeframe'])} size="small">{CHART_TIMEFRAMES.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
   <TextField select label="Historical prices" size="small" value={p.priceAdjustment??"split"}
     onChange={event=>set("priceAdjustment",event.target.value as ChartPreferences["priceAdjustment"])}>
     <MenuItem value="split">Split-adjusted</MenuItem>
     <MenuItem value="raw">Unadjusted (prices as traded)</MenuItem>
   </TextField>
   <Autocomplete size="small" disableClearable autoHighlight openOnFocus
     value={p.timezone} options={timeZones.includes(p.timezone) ? timeZones : [...timeZones, p.timezone]}
     getOptionLabel={chartTimeZoneLabel} getOptionKey={zone=>zone} filterOptions={filterTimeZones}
     onChange={(_,zone)=>set('timezone',zone)}
     noOptionsText="No matching time zones"
     slotProps={{listbox:{sx:{maxHeight:'min(40dvh, 280px)',boxSizing:'border-box'}}}}
     renderInput={params=><TextField {...params} label="Time zone" placeholder="Search cities" />}/>
   {(['grid','volume','autoScale','logarithmic'] as const).map(key=><FormControlLabel key={key} label={{grid:'Show grid',volume:'Show volume',autoScale:'Automatic price scale',logarithmic:`Logarithmic price scale · ${timeframe}`}[key]} control={<Checkbox checked={p[key]} onChange={(_,v)=>set(key,v)}/>}/>)}
   <FormControlLabel label="Indicator labels on price scale" control={<Checkbox checked={p.indicatorPriceScaleLabels??false} onChange={(_,visible)=>onChange(setAllIndicatorPriceScaleLabels(p,visible))}/>}/>
   <Typography variant="caption" color="text.secondary">Sets labels for all indicators. Adjust individual indicators in Style.</Typography>

   <FormControlLabel label="Scale price chart only" control={<Checkbox checked={p.scalePriceOnly??false} onChange={(_,value)=>set('scalePriceOnly',value)}/>}/>
   {p.volume?<TextField select label="Volume pane height" value={p.volumeHeight} onChange={e=>set('volumeHeight',Number(e.target.value))} size="small">{[10,15,20,25,30,40].map(v=><MenuItem key={v} value={v}>{v}%</MenuItem>)}</TextField>:null}
   <Stack spacing={0.25}>
    <Typography component="h3" sx={{fontWeight:700}}>Drawing tools</Typography>
    <FormControlLabel label="Show left drawing toolbar by default"
      control={<Switch checked={p.alwaysShowDrawingToolbar??false} onChange={(_,visible)=>set('alwaysShowDrawingToolbar',visible)}/>}/>
    <FormControlLabel label="Autosave drawings"
      control={<Switch checked={p.autosaveDrawings??true} onChange={(_,enabled)=>set('autosaveDrawings',enabled)}/>}/>
    {p.autosaveDrawings===false&&<Typography variant="caption" color="text.secondary">Use Save drawings in the Drawing Tools menu to keep changes after a refresh.</Typography>}
   </Stack>
   <Typography component="h3" sx={{fontWeight:700}}>Trading sessions</Typography><Typography variant="caption">Session filters apply to intraday candles.</Typography>
   {(['premarket','regular','postmarket'] as const).map(key=><FormControlLabel key={key} label={{premarket:'Premarket · 4:00–9:30 ET',regular:'Regular · 9:30–16:00 ET',postmarket:'Postmarket · 16:00–20:00 ET'}[key]} control={<Checkbox checked={p[key]} disabled={p[key]&&[p.premarket,p.regular,p.postmarket].filter(Boolean).length===1} onChange={(_,v)=>set(key,v)}/>}/>)}
   {CHART_OVERNIGHT_ENABLED&&<FormControlLabel label="Overnight · 20:00–4:00 ET"
     control={<Checkbox checked={chartShowsOvernight(p)} onChange={(_,visible)=>set('overnight',visible)}/>}/>}
  </>}
  </Stack><Typography role="status" sx={{px:2,py:1,fontSize:12,borderTop:1,borderColor:'divider',flexShrink:0}}>
   {message||(panel==='indicators'
    ? 'Visibility changes for this chart stay with the open chart on this device. Changes for all charts save to your account.'
    : 'Changes save automatically to your account.')}
  </Typography>
 </Drawer>;
}
