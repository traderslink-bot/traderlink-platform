"use client";
import Checkbox from '@mui/material/Checkbox';
import Drawer from '@mui/material/Drawer';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import useMediaQuery from '@mui/material/useMediaQuery';
import CloseRounded from '@mui/icons-material/CloseRounded';
import {useTheme} from '@mui/material/styles';
import {ChartIndicatorEditor} from './chart-indicator-editor';
import {CHART_TIMEFRAMES} from '@/src/modules/scanner/alpaca/candles';
import type { ChartIndicatorDisplay } from './chart-view-memory';
import {setAllIndicatorPriceScaleLabels,type ChartPreferences,type IndicatorType} from '@/src/modules/scanner/alpaca/chart-preferences';
export function ChartPreferencesPanel({panel,onClose,preferences:p,crosshairLines,onChange,message,initialIndicator,indicatorDisplay,onIndicatorDisplayChange}:{panel:'indicators'|'settings'|null;onClose:()=>void;preferences:ChartPreferences;crosshairLines:readonly {value:`indicator:${string}:${string}`;label:string}[];onChange:(p:ChartPreferences)=>void;message:string;initialIndicator?:IndicatorType;indicatorDisplay:ChartIndicatorDisplay;onIndicatorDisplayChange:(type:IndicatorType,action:'hidden'|'enabled',value:boolean)=>void}){
 const theme=useTheme(),mobile=useMediaQuery(theme.breakpoints.down('md'));
 const set=<K extends keyof ChartPreferences>(key:K,value:ChartPreferences[K])=>onChange({...p,[key]:value});
 const color=(label:string,value:string,change:(v:string)=>void)=><TextField label={label} type="color" defaultValue={value} key={value} onBlur={e=>{if(e.target.value!==value)change(e.target.value);}} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:120}}/>;
 return <Drawer anchor={mobile?'bottom':'right'} open={panel!==null} onClose={onClose} slotProps={{paper:{role:'dialog','aria-modal':true,'aria-label':panel==='indicators'?'Chart indicators':'Chart settings',sx:{width:mobile?'100%':400,maxHeight:mobile?'78dvh':'100dvh',borderRadius:0,display:'flex',flexDirection:'column'}}}}>
  <Stack direction="row" sx={{px:2,py:1,alignItems:'center',justifyContent:'space-between',borderBottom:1,borderColor:'divider',flexShrink:0}}><Typography component="h2" sx={{fontSize:18,fontWeight:700}}>{panel==='indicators'?'Indicators':'Chart settings'}</Typography><IconButton aria-label="Close chart preferences" onClick={onClose} sx={{minWidth:44,minHeight:44}}><CloseRounded/></IconButton></Stack>
  <Stack spacing={2} sx={{p:2,overflowY:'auto',minHeight:0}}>
  {panel==='indicators'?<ChartIndicatorEditor key={initialIndicator??"list"} initialType={initialIndicator} defaultPriceScaleLabels={p.indicatorPriceScaleLabels??false} display={indicatorDisplay} onDisplayChange={onIndicatorDisplayChange} indicators={p.indicators} savedPresets={p.savedIndicatorPresets ?? []} onChange={indicators=>set('indicators',indicators)} onPresetsChange={presets=>set('savedIndicatorPresets',presets)}/>:<>
   <TextField select label="Chart type" value={p.kind} onChange={e=>set('kind',e.target.value as ChartPreferences['kind'])} size="small">{[['candles','Candlesticks'],['bars','OHLC bars'],['line','Line']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   <TextField select label="Chart theme" value={p.theme} onChange={e=>set('theme',e.target.value as ChartPreferences['theme'])} size="small">{[['auto','Follow app theme'],['light','Light'],['dark','Dark']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   <Stack direction="row" spacing={1}>{color('Up color',p.upColor,v=>set('upColor',v))}{color('Down color',p.downColor,v=>set('downColor',v))}</Stack>
   <TextField select label="Crosshair" size="small" value={p.crosshairTarget??"price"}
     onChange={event=>set("crosshairTarget",event.target.value as ChartPreferences["crosshairTarget"])}>
     <MenuItem value="price">Snap to price</MenuItem>
     <MenuItem value="normal">Normal</MenuItem>
     <MenuItem value="nearest">Snap to nearest line</MenuItem>
     {p.crosshairTarget?.startsWith("indicator:")&&!crosshairLines.some(line=>line.value===p.crosshairTarget)
       ? <MenuItem value={p.crosshairTarget} disabled>Saved line unavailable · snapping to price</MenuItem> : null}
     {crosshairLines.map(line=><MenuItem value={line.value} key={line.value}>Snap to {line.label}</MenuItem>)}
   </TextField>
   <TextField select label="Default timeframe" value={p.timeframe} onChange={e=>set('timeframe',e.target.value as ChartPreferences['timeframe'])} size="small">{CHART_TIMEFRAMES.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
   <TextField select label="Timezone" value={p.timezone} onChange={e=>set('timezone',e.target.value as ChartPreferences['timezone'])} size="small">{[['America/New_York','Eastern'],['America/Toronto','Toronto'],['UTC','UTC']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   {(['grid','volume','autoScale','logarithmic'] as const).map(key=><FormControlLabel key={key} label={{grid:'Show grid',volume:'Show volume',autoScale:'Automatic price scale',logarithmic:'Logarithmic price scale'}[key]} control={<Checkbox checked={p[key]} onChange={(_,v)=>set(key,v)}/>}/>)}
   <FormControlLabel label="Indicator labels on price scale" control={<Checkbox checked={p.indicatorPriceScaleLabels??false} onChange={(_,visible)=>onChange(setAllIndicatorPriceScaleLabels(p,visible))}/>}/>
   <Typography variant="caption" color="text.secondary">Sets labels for all indicators. Adjust individual indicators in Style.</Typography>
   <FormControlLabel label="Scale price chart only" control={<Checkbox checked={p.scalePriceOnly??false} onChange={(_,value)=>set('scalePriceOnly',value)}/>}/>
   {p.volume?<TextField select label="Volume pane height" value={p.volumeHeight} onChange={e=>set('volumeHeight',Number(e.target.value))} size="small">{[10,15,20,25,30,40].map(v=><MenuItem key={v} value={v}>{v}%</MenuItem>)}</TextField>:null}
   <Typography component="h3" sx={{fontWeight:700}}>Trading sessions</Typography><Typography variant="caption">Session filters apply to intraday candles.</Typography>
   {(['premarket','regular','postmarket'] as const).map(key=><FormControlLabel key={key} label={{premarket:'Premarket · 4:00–9:30 ET',regular:'Regular · 9:30–16:00 ET',postmarket:'Postmarket · 16:00–20:00 ET'}[key]} control={<Checkbox checked={p[key]} disabled={p[key]&&[p.premarket,p.regular,p.postmarket].filter(Boolean).length===1} onChange={(_,v)=>set(key,v)}/>}/>)}
  </>}
  </Stack><Typography role="status" sx={{px:2,py:1,fontSize:12,borderTop:1,borderColor:'divider',flexShrink:0}}>{message||'Changes save automatically to your account.'}</Typography>
 </Drawer>;
}
