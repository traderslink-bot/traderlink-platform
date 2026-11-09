"use client";
import {useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
import DeleteOutline from '@mui/icons-material/DeleteForeverOutlined';
import {useTheme} from '@mui/material/styles';
import {CHART_TIMEFRAMES} from '@/src/modules/scanner/alpaca/candles';
import {INDICATOR_TYPES,type ChartPreferences,type ChartIndicator} from '@/src/modules/scanner/alpaca/chart-preferences';
export function ChartPreferencesPanel({panel,onClose,preferences:p,onChange,message}:{panel:'indicators'|'settings'|null;onClose:()=>void;preferences:ChartPreferences;onChange:(p:ChartPreferences)=>void;message:string}){
 const theme=useTheme(),mobile=useMediaQuery(theme.breakpoints.down('md')),[search,setSearch]=useState('');
 const set=<K extends keyof ChartPreferences>(key:K,value:ChartPreferences[K])=>onChange({...p,[key]:value});
 const edit=(id:string,changes:Partial<ChartIndicator>)=>set('indicators',p.indicators.map(i=>i.id===id?{...i,...changes}:i));
 const color=(label:string,value:string,change:(v:string)=>void)=><TextField label={label} type="color" defaultValue={value} key={value} onBlur={e=>{if(e.target.value!==value)change(e.target.value);}} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:120}}/>;
 return <Drawer anchor={mobile?'bottom':'right'} open={panel!==null} onClose={onClose} slotProps={{paper:{role:'dialog','aria-modal':true,'aria-label':panel==='indicators'?'Chart indicators':'Chart settings',sx:{width:mobile?'100%':400,maxHeight:mobile?'78dvh':'100dvh',borderRadius:0,display:'flex',flexDirection:'column'}}}}>
  <Stack direction="row" sx={{px:2,py:1,alignItems:'center',justifyContent:'space-between',borderBottom:1,borderColor:'divider',flexShrink:0}}><Typography component="h2" sx={{fontSize:18,fontWeight:700}}>{panel==='indicators'?'Indicators':'Chart settings'}</Typography><IconButton aria-label="Close chart preferences" onClick={onClose} sx={{minWidth:44,minHeight:44}}><CloseRounded/></IconButton></Stack>
  <Stack spacing={2} sx={{p:2,overflowY:'auto',minHeight:0}}>
  {panel==='indicators'?<>
   <TextField label="Search indicators" value={search} onChange={e=>setSearch(e.target.value)} size="small"/>
   <Stack direction="row" sx={{flexWrap:'wrap',gap:1}}>{INDICATOR_TYPES.filter(t=>t.toLowerCase().includes(search.toLowerCase())).map(type=><Button variant="outlined" key={type} disabled={p.indicators.length>=20} onClick={()=>set('indicators',[...p.indicators,{id:crypto.randomUUID(),type,period:type==='RSI'?14:type==='EMA'?9:20,color:['#e99b32','#42a5f5','#ab47bc','#26a69a','#ef5350'][p.indicators.length%5],width:2}])}>Add {type}</Button>)}</Stack>
   {!INDICATOR_TYPES.some(t=>t.toLowerCase().includes(search.toLowerCase()))?<Typography variant="body2" color="text.secondary">No matching indicators.</Typography>:null}
   {p.indicators.length?<Typography component="h3" sx={{fontWeight:700}}>On this chart</Typography>:null}
   {!p.indicators.length?<Typography color="text.secondary" variant="body2">Choose an indicator to add it to your chart.</Typography>:null}
   {p.indicators.map(i=><Box key={i.id} sx={{borderTop:1,borderColor:'divider',pt:1}}><Stack direction="row" sx={{alignItems:'center',justifyContent:'space-between'}}><Typography sx={{fontWeight:700}}>{i.type}</Typography><IconButton aria-label={`Remove ${i.type} indicator`} onClick={()=>set('indicators',p.indicators.filter(x=>x.id!==i.id))}><DeleteOutline/></IconButton></Stack><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}>{!['VWAP','MACD'].includes(i.type)?<TextField label={`${i.type} period`} type="number" key={`${i.id}-${i.period}`} defaultValue={i.period} onBlur={e=>{const n=Number(e.target.value);if(Number.isInteger(n)&&n>=2&&n<=500&&n!==i.period)edit(i.id,{period:n});else e.target.value=String(i.period);}} size="small" sx={{width:100}}/>:null}{color(`${i.type} color`,i.color,v=>edit(i.id,{color:v}))}<TextField select size="small" label="Line width" value={i.width} onChange={e=>edit(i.id,{width:Number(e.target.value) as 1|2|3})} sx={{width:110}}>{[1,2,3].map(v=><MenuItem key={v} value={v}>{v}px</MenuItem>)}</TextField></Stack>{i.type==='VWAP'?<Typography variant="caption">Resets each Eastern calendar day; includes your visible sessions.</Typography>:i.type==='MACD'?<Typography variant="caption">12 / 26 EMA · 9 signal</Typography>:i.type==='Bollinger'?<Typography variant="caption">2 standard deviations</Typography>:null}</Box>)}
  </>:<>
   <TextField select label="Chart type" value={p.kind} onChange={e=>set('kind',e.target.value as ChartPreferences['kind'])} size="small">{[['candles','Candlesticks'],['bars','OHLC bars'],['line','Line']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   <TextField select label="Chart theme" value={p.theme} onChange={e=>set('theme',e.target.value as ChartPreferences['theme'])} size="small">{[['auto','Follow app theme'],['light','Light'],['dark','Dark']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   <Stack direction="row" spacing={1}>{color('Up color',p.upColor,v=>set('upColor',v))}{color('Down color',p.downColor,v=>set('downColor',v))}</Stack>
   <TextField select label="Default timeframe" value={p.timeframe} onChange={e=>set('timeframe',e.target.value as ChartPreferences['timeframe'])} size="small">{CHART_TIMEFRAMES.map(v=><MenuItem key={v} value={v}>{v}</MenuItem>)}</TextField>
   <TextField select label="Timezone" value={p.timezone} onChange={e=>set('timezone',e.target.value as ChartPreferences['timezone'])} size="small">{[['America/New_York','Eastern'],['America/Toronto','Toronto'],['UTC','UTC']].map(([v,label])=><MenuItem key={v} value={v}>{label}</MenuItem>)}</TextField>
   {(['grid','volume','autoScale','logarithmic'] as const).map(key=><FormControlLabel key={key} label={{grid:'Show grid',volume:'Show volume',autoScale:'Automatic price scale',logarithmic:'Logarithmic price scale'}[key]} control={<Checkbox checked={p[key]} onChange={(_,v)=>set(key,v)}/>}/>)}
   {p.volume?<TextField select label="Volume pane height" value={p.volumeHeight} onChange={e=>set('volumeHeight',Number(e.target.value))} size="small">{[10,15,20,25,30,40].map(v=><MenuItem key={v} value={v}>{v}%</MenuItem>)}</TextField>:null}
   <Typography component="h3" sx={{fontWeight:700}}>Trading sessions</Typography><Typography variant="caption">Session filters apply to intraday candles.</Typography>
   {(['premarket','regular','postmarket'] as const).map(key=><FormControlLabel key={key} label={{premarket:'Premarket · 4:00–9:30 ET',regular:'Regular · 9:30–16:00 ET',postmarket:'Postmarket · 16:00–20:00 ET'}[key]} control={<Checkbox checked={p[key]} disabled={p[key]&&[p.premarket,p.regular,p.postmarket].filter(Boolean).length===1} onChange={(_,v)=>set(key,v)}/>}/>)}
  </>}
  </Stack><Typography role="status" sx={{px:2,py:1,fontSize:12,borderTop:1,borderColor:'divider',flexShrink:0}}>{message||'Changes save automatically to your account.'}</Typography>
 </Drawer>;
}
