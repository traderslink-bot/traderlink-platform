"use client";
import {useState} from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import IconButton from '@mui/material/IconButton';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import DeleteOutline from '@mui/icons-material/DeleteForeverOutlined';
import {CHART_TIMEFRAMES} from '@/src/modules/scanner/alpaca/candles';
import {defaultVwapBands,type VwapBandLevel,type VwapBands,INDICATOR_TYPES,VWAP_ANCHORS,MA_TYPES,PRICE_SOURCES,MAX_SAVED_INDICATOR_PRESETS,MAX_SAVED_INDICATOR_PRESET_BYTES,MAX_INDICATOR_PRESET_NAME_LENGTH,type ChartIndicator,type PlotStyle,type SavedIndicatorPreset} from '@/src/modules/scanner/alpaca/chart-preferences';
import {indicatorPresets, indicatorPresetRows, nextMovingAverageLine} from '@/src/modules/scanner/alpaca/chart-indicator-presets';
import {indicatorPlotStyle,indicatorValues} from '@/src/modules/scanner/alpaca/chart-indicators';

function NumberInput({label,value,onChange,min=1,max=10000,integer=true,disabled=false,step}:{label:string;value:number;onChange:(value:number)=>void;min?:number;max?:number|null;integer?:boolean;disabled?:boolean;step?:number}){
 const [draft,setDraft]=useState(String(value)),[error,setError]=useState(false);
 return <TextField disabled={disabled} label={label} type="number" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>{const n=Number(draft),valid=draft.trim()!==''&&Number.isFinite(n)&&n>=min&&(max===null||n<=max)&&(!integer||Number.isInteger(n));setError(!valid);if(valid&&n!==value)onChange(n);}} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur();}} error={error} helperText={error?`Enter ${integer?'a whole number':'a number'} ${max===null?`${min} or greater`:`from ${min} to ${max}`}.`:undefined} size="small" slotProps={{htmlInput:{min,max:max??undefined,step:step??(integer?1:'any')}}} sx={{width:150}}/>;
}
function NumberSetting(props:Parameters<typeof NumberInput>[0]){return <NumberInput key={props.value} {...props}/>;}
const name=(i:ChartIndicator)=>i.type==='EMA'||i.type==='SMA'||i.type==='RSI'?`${i.type} ${i.period}`:i.type==='MACD'?`MACD ${i.fastLength??12}, ${i.slowLength??26}, ${i.signalLength??9}`:i.type==='Bollinger'?`Bollinger Bands ${i.period}, ${i.deviation??2}`:'VWAP';
const typeName = (type: ChartIndicator['type']) => type === 'Bollinger' ? 'Bollinger Bands' : type;
export function ChartIndicatorEditor({indicators,onChange,savedPresets,onPresetsChange,initialType,defaultPriceScaleLabels,display,onDisplayChange}:{
 indicators:ChartIndicator[];
 onChange:(value:ChartIndicator[])=>void;
 savedPresets:SavedIndicatorPreset[];
 initialType?: ChartIndicator['type'];
 defaultPriceScaleLabels: boolean;
 display: import('./chart-view-memory').ChartIndicatorDisplay;
 onDisplayChange: (type: ChartIndicator['type'], action: 'hidden' | 'enabled', value: boolean) => void;
 onPresetsChange:(presets:SavedIndicatorPreset[])=>void;
}){
 const [search,setSearch]=useState(''),[selected,setSelected]=useState(()=>indicators.find(indicator=>indicator.type===initialType)?.id??''),[tab,setTab]=useState('inputs');
 const [presetName,setPresetName]=useState(''),[presetError,setPresetError]=useState('');
 const active=indicators.find(i=>i.id===selected)??indicators.at(-1);
 const activeTab=tab==='visibility'&&active?.type!=='VWAP'?'inputs':tab;
 const edit=(changes:Partial<ChartIndicator>)=>{if(active)onChange(indicators.map(i=>i.id===active.id?{...i,...changes}:i));};
 const lines = active ? indicators.filter(indicator => indicator.type === active.type) : [];
 const movingAverage = active?.type === 'EMA' || active?.type === 'SMA';
 const choose = (id: string) => { setSelected(id); setTab('inputs'); setPresetName(''); setPresetError(''); };
 const add = (type: ChartIndicator['type']) => {
  const existing = indicators.find(indicator => indicator.type === type);
  if (existing) { choose(existing.id); return; }
  const rows = indicatorPresetRows(type, 0, () => crypto.randomUUID());
  onChange([...indicators, ...rows]);
  choose(rows[0].id);
 };
 const applyPreset = (type: ChartIndicator['type'], rows: ChartIndicator[]) => {
  const first = indicators.findIndex(indicator => indicator.type === type);
  onChange([...indicators.slice(0, first), ...rows, ...indicators.slice(first).filter(indicator => indicator.type !== type)]);
  choose(rows[0].id);
 };
 const savePreset = () => {
  if (!active) return;
  const name = presetName.trim();
  if (!name || /[\u0000-\u001f\u007f]/u.test(name)) { setPresetError('Enter a preset name.'); return; }
  if (savedPresets.some(preset => preset.type === active.type && preset.name.toLowerCase() === name.toLowerCase())) {
   setPresetError('A preset with this name already exists for this indicator.');
   return;
  }
  const next = [...savedPresets, { id: crypto.randomUUID(), name, type: active.type, indicators: lines }];
  if (new TextEncoder().encode(JSON.stringify(next)).length > MAX_SAVED_INDICATOR_PRESET_BYTES) {
   setPresetError('Preset storage is full. Remove a saved preset to make room.');
   return;
  }
  onPresetsChange(next);
  setPresetName('');
  setPresetError('');
 };
 const editLine = (id: string, changes: Partial<ChartIndicator>) =>
  onChange(indicators.map(indicator => indicator.id === id ? { ...indicator, ...changes } : indicator));
 const bands=active?.vwapBands??defaultVwapBands(false);
 const band=(index:number,changes:Partial<VwapBandLevel>)=>edit({vwapBands:{...bands,levels:bands.levels.map((level,n)=>n===index?{...level,...changes}:level) as VwapBands['levels']}});
 const style=(key:string,changes:PlotStyle)=>{if(active)edit({plots:{...active.plots,[key]:{...active.plots?.[key],...changes}}});};
 const sourceLabel=(source:string)=>({open:'Open',high:'High',low:'Low',close:'Close',hl2:'HL2',hlc3:'HLC3',ohlc4:'OHLC4',hlcc4:'HLCC4'}[source]??source);
 return <>
  <Typography component="h3" sx={{fontWeight:700}}>Chart defaults</Typography>
  <Typography variant="body2" color="text.secondary">Indicators you add here are saved to your account for Charts and Scanners.</Typography>
  <TextField label="Search indicators" value={search} onChange={e=>setSearch(e.target.value)} size="small"/>
  <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1 }}>
   {INDICATOR_TYPES.filter(type => typeName(type).toLowerCase().includes(search.toLowerCase())).map(type => {
    const added = indicators.some(indicator => indicator.type === type);
    return <Button variant="outlined" key={type} disabled={!added && indicators.length + indicatorPresets[type][0].settings.length > 20} onClick={() => add(type)}>{added ? `Edit ${typeName(type)}` : `Add ${typeName(type)}`}</Button>;
   })}
  </Stack>
  {indicators.length ? <>
   <Typography component="h3" sx={{ fontWeight: 700 }}>This chart</Typography>
   {Array.from(new Set(indicators.map(indicator => indicator.type))).map(type => {
    const group = indicators.filter(indicator => indicator.type === type);
    const enabled = display.enabled[type] ?? group.some(indicator => indicator.visible !== false);
    const hidden = display.hidden.has(type);
    return <Stack key={type} direction="row" sx={{ alignItems: 'center', gap: 0.5, border: 1, borderColor: active?.type === type ? 'primary.main' : 'divider', minWidth: 0 }}>
     <Button onClick={() => choose(group[0].id)} aria-pressed={active?.type === type} sx={{ flex: 1, justifyContent: 'flex-start', textTransform: 'none', minWidth: 0 }}>{typeName(type)}</Button>
      <Button size="small" aria-label={`${hidden?'Show':'Hide'} ${typeName(type)} details`} onClick={() => onDisplayChange(type,'hidden',!hidden)} sx={{textTransform:'none',lineHeight:1.2}}>{hidden?'Show details':'Hide details'}</Button>
      <Button size="small" aria-label={`Turn ${enabled?'off':'on'} ${typeName(type)}`} onClick={() => onDisplayChange(type,'enabled',!enabled)} sx={{textTransform:'none',lineHeight:1.2}}>{enabled?'Turn off':'Turn on'}</Button>
    </Stack>;
   })}
  </> : <Typography variant="body2">Choose an indicator to add it to your chart defaults.</Typography>}
  {active?<Box sx={{borderTop:1,borderColor:'divider',pt:1}}>
   <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:1,mb:1}}>
    <Typography component="h3" sx={{fontWeight:700}}>{typeName(active.type)} defaults</Typography>
    <Button size="small" onClick={()=>onChange(indicators.filter(indicator=>indicator.type!==active.type))}
      sx={{textTransform:"none"}}>Remove from chart defaults</Button>
   </Stack>
   <Box component="details" sx={{ mb: 1 }}>
    <Typography component="summary" variant="body2" sx={{ cursor: 'pointer' }}>TraderLink presets</Typography>
    <Stack spacing={1} sx={{ py: 1 }}>
     <Typography variant="caption" color="text.secondary">Loading a preset replaces this indicator’s current settings.</Typography>
     {indicatorPresets[active.type].map((preset, index) => <Box key={preset.title} sx={{ border: 1, borderColor: 'divider', p: 1 }}>
      <Typography variant="subtitle2">{preset.title}{index === 0 ? ' · Default' : ''}</Typography>
      <Typography variant="body2" color="text.secondary">{preset.description}</Typography>
      <Button size="small" disabled={indicators.length - lines.length + preset.settings.length > 20} onClick={() => applyPreset(active.type, indicatorPresetRows(active.type, index, () => crypto.randomUUID()))} aria-label={`Load ${preset.title}`}>Load preset</Button>
     </Box>)}
    </Stack>
   </Box>
   <Box component="details" sx={{ mb: 1 }}>
    <Typography component="summary" variant="body2" sx={{ cursor: 'pointer' }}>My presets</Typography>
    <Stack spacing={1} sx={{ py: 1 }}>
     <Stack component="form" direction="row" useFlexGap sx={{ gap: 1, flexWrap: 'wrap' }} onSubmit={event => { event.preventDefault(); savePreset(); }}>
      <TextField size="small" label="Preset name" value={presetName} error={Boolean(presetError)} helperText={presetError || undefined}
       onChange={event => { setPresetName(event.target.value); setPresetError(''); }}
       slotProps={{ htmlInput: { maxLength: MAX_INDICATOR_PRESET_NAME_LENGTH } }} sx={{ flex: 1, minWidth: 140 }} />
      <Button type="submit" size="small" disabled={!presetName.trim() || savedPresets.length >= MAX_SAVED_INDICATOR_PRESETS}>Save current setup</Button>
     </Stack>
     {savedPresets.length >= MAX_SAVED_INDICATOR_PRESETS && <Typography variant="caption">Remove a saved preset to make room.</Typography>}
     {savedPresets.filter(preset => preset.type === active.type).map(preset => <Stack direction="row" key={preset.id} sx={{ alignItems: 'center', gap: 0.5 }}>
      <Typography variant="body2" sx={{ flex: 1, minWidth: 0, overflowWrap: 'anywhere' }}>{preset.name}</Typography>
      <Button size="small" aria-label={`Load ${preset.name}`} disabled={indicators.length - lines.length + preset.indicators.length > 20}
       onClick={() => applyPreset(active.type, preset.indicators.map(indicator => ({ ...indicator, id: crypto.randomUUID() })))}>Load</Button>
      <IconButton size="small" aria-label={`Delete preset ${preset.name}`} onClick={() => onPresetsChange(savedPresets.filter(item => item.id !== preset.id))}><DeleteOutline fontSize="small" /></IconButton>
     </Stack>)}
    </Stack>
   </Box>
   {movingAverage && <Stack spacing={1} sx={{ mb: 1 }}>
    {lines.map(line => {
     const label = name(line);
     const options = indicatorPlotStyle(line, 'main');
     return <Stack key={line.id} direction="row" useFlexGap sx={{ gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
      <Checkbox size="small" checked={line.visible !== false && options.visible} slotProps={{ input: { 'aria-label': `Show ${label} line` } }} onChange={(_, visible) => editLine(line.id, { visible, plots: { ...line.plots, main: { ...line.plots?.main, visible } } })} />
      <NumberSetting label={`${label} length`} value={line.period} onChange={period => editLine(line.id, { period })} />
      <TextField key={options.color} type="color" label={`${label} color`} defaultValue={options.color} onBlur={event => {
       if (event.target.value !== options.color) editLine(line.id, { plots: { ...line.plots, main: { ...line.plots?.main, color: event.target.value } } });
      }} size="small" slotProps={{ inputLabel: { shrink: true } }} sx={{ width: 88 }} />
      <Button size="small" aria-pressed={active.id === line.id} aria-label={`Edit ${label} line settings`} onClick={() => choose(line.id)}>Settings</Button>
      {lines.length > 1 && <IconButton size="small" aria-label={`Remove ${label} line`} onClick={() => {
       if (active.id === line.id) choose(lines.find(item => item.id !== line.id)!.id);
       onChange(indicators.filter(item => item.id !== line.id));
      }}><DeleteOutline fontSize="small" /></IconButton>}
     </Stack>;
    })}
    <Button size="small" disabled={indicators.length >= 20} sx={{ alignSelf: 'flex-start' }} onClick={() => {
     if (active.type !== 'EMA' && active.type !== 'SMA') return;
     const line = nextMovingAverageLine(active.type, indicators, crypto.randomUUID());
     onChange([...indicators, line]);
     choose(line.id);
    }}>Add {active.type} line</Button>
   </Stack>}
   {!movingAverage && lines.length > 1 && <TextField select size="small" fullWidth label="Saved configuration" value={active.id} onChange={event => choose(event.target.value)}>
    {lines.map((line, index) => <MenuItem key={line.id} value={line.id}>{name(line)} ({index + 1})</MenuItem>)}
   </TextField>}
   {movingAverage && <Typography variant="body2" sx={{ fontWeight: 700 }}>{name(active)} line settings</Typography>}
   <Tabs value={activeTab} onChange={(_,value)=>setTab(value)} aria-label={`${name(active)} settings`}><Tab value="inputs" label="Inputs"/><Tab value="style" label="Style"/>{active.type==='VWAP'?<Tab value="visibility" label="Visibility"/>:null}</Tabs>
   {activeTab==='inputs'?<Stack key={active.id} spacing={2} sx={{pt:2}}>
    {!movingAverage&&!['VWAP','MACD'].includes(active.type)?<NumberSetting label={`${active.type} length`} value={active.period} onChange={period=>edit({period})}/>:null}
    <TextField select label="Source" value={active.source??(active.type==='VWAP'?'hlc3':'close')} onChange={e=>edit({source:e.target.value as ChartIndicator['source']})} size="small">{PRICE_SOURCES.map(value=><MenuItem key={value} value={value}>{sourceLabel(value)}</MenuItem>)}</TextField>
    {active.type==='VWAP'?<>
     <TextField select label="Anchor Period" value={active.anchor??'Session'} onChange={e=>edit({anchor:e.target.value as ChartIndicator['anchor']})} size="small">{VWAP_ANCHORS.map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>
     <TextField select label="Bands calculation mode" value={bands.mode} onChange={e=>edit({vwapBands:{...bands,mode:e.target.value as VwapBands['mode']}})} size="small">{['Standard deviation','Percentage'].map(mode=><MenuItem key={mode} value={mode}>{mode}</MenuItem>)}</TextField>
     {bands.levels.map((level,index)=><Stack key={index} direction="row" sx={{gap:1,alignItems:'center',flexWrap:'wrap'}}><FormControlLabel label={`Band #${index+1}`} control={<Checkbox checked={level.enabled} onChange={(_,enabled)=>band(index,{enabled})}/>}/><NumberSetting label={`Band multiplier #${index+1}`} value={level.multiplier} min={0} max={null} step={0.5} integer={false} disabled={!level.enabled} onChange={multiplier=>band(index,{multiplier})}/></Stack>)}
     <NumberSetting label="Offset" value={active.offset??0} min={-500} max={500} onChange={offset=>edit({offset})}/>
     <TextField select label="Calculation timeframe" value={active.calculationTimeframe??''} onChange={e=>edit({calculationTimeframe:e.target.value?e.target.value as ChartIndicator['calculationTimeframe']:undefined})} size="small"><MenuItem value="">Chart</MenuItem>{CHART_TIMEFRAMES.map(frame=><MenuItem key={frame} value={frame}>{frame}</MenuItem>)}</TextField>
     <FormControlLabel label="Wait for timeframe closes" control={<Checkbox checked={active.waitForClose??true} onChange={(_,waitForClose)=>edit({waitForClose})}/>}/>
     <FormControlLabel label="Hide VWAP on 1D or above" control={<Checkbox checked={active.hideOnDaily??false} onChange={(_,hideOnDaily)=>edit({hideOnDaily})}/>}/>
    </>:null}
    {['EMA','SMA','RSI'].includes(active.type)?<>
     <TextField select label="Smoothing" value={active.smoothing?.type??'None'} onChange={e=>edit({smoothing:{type:e.target.value as NonNullable<ChartIndicator['smoothing']>['type'],length:active.smoothing?.length??14,deviation:active.smoothing?.deviation??2}})} size="small">{['None',...MA_TYPES,'SMA+BB'].map(value=><MenuItem key={value} value={value}>{value==='SMA+BB'?'SMA + Bollinger Bands':value==='RMA'?'SMMA (RMA)':value}</MenuItem>)}</TextField>
     {active.smoothing&&active.smoothing.type!=='None'?<NumberSetting label="Smoothing length" value={active.smoothing.length} onChange={length=>edit({smoothing:{...active.smoothing!,length}})}/>:null}
     {active.smoothing?.type==='SMA+BB'?<NumberSetting label="Smoothing BB StdDev" value={active.smoothing.deviation} min={0.01} max={100} integer={false} onChange={deviation=>edit({smoothing:{...active.smoothing!,deviation}})}/>:null}
    </>:null}
    {active.type==='MACD'?<>
     <Stack direction="row" sx={{flexWrap:'wrap',gap:1}}>{(['fastLength','slowLength','signalLength'] as const).map((key,index)=><NumberSetting key={key} label={['Fast length','Slow length','Signal length'][index]} value={active[key]??[12,26,9][index]} onChange={value=>edit({[key]:value})}/>)}</Stack>
     {(['oscillatorMa','signalMa'] as const).map(key=><TextField key={key} select label={key==='oscillatorMa'?'Oscillator MA type':'Signal MA type'} value={active[key]??'EMA'} onChange={e=>edit({[key]:e.target.value})} size="small">{['EMA','SMA'].map(value=><MenuItem key={value} value={value}>{value}</MenuItem>)}</TextField>)}
    </>:null}
    {active.type==='Bollinger'?<>
     <TextField select label="Basis MA type" value={active.basisMa??'SMA'} onChange={e=>edit({basisMa:e.target.value as ChartIndicator['basisMa']})} size="small">{MA_TYPES.map(value=><MenuItem key={value} value={value}>{value==='RMA'?'SMMA (RMA)':value}</MenuItem>)}</TextField>
     <NumberSetting label="Standard deviation" value={active.deviation??2} min={0.01} max={100} integer={false} onChange={deviation=>edit({deviation})}/>
    </>:null}
    {active.type==='RSI'?<Stack spacing={1}>{(['upper','middle','lower'] as const).map((key,index)=>{const levels=active.levels??{upper:70,middle:50,lower:30};return <NumberSetting key={key} label={['Upper level','Middle level','Lower level'][index]} value={levels[key]} min={key==='lower'?0:levels[key==='middle'?'lower':'middle']+0.01} max={key==='upper'?100:levels[key==='middle'?'upper':'middle']-0.01} integer={false} onChange={value=>edit({levels:{...levels,[key]:value}})}/>;})}</Stack>:null}
   </Stack>:activeTab==='visibility'?<Stack sx={{pt:1}}>{CHART_TIMEFRAMES.map(frame=><FormControlLabel key={frame} label={frame} control={<Checkbox checked={(active.timeframes??[...CHART_TIMEFRAMES]).includes(frame)} onChange={(_,checked)=>edit({timeframes:CHART_TIMEFRAMES.filter(value=>value===frame?checked:(active.timeframes??[...CHART_TIMEFRAMES]).includes(value))})}/>}/>)}</Stack>:<Stack spacing={2} sx={{pt:2}}>
    {indicatorValues([],active).filter(plot=>active.type!=='VWAP'||plot.key==='main'||bands.levels[Number(plot.key.at(-1))-1]?.enabled).map(plot=>{const options=indicatorPlotStyle(active,plot.key);return <Box key={plot.key} sx={{borderBottom:1,borderColor:'divider',pb:1}}>
     <FormControlLabel label={plot.label} control={<Checkbox checked={options.visible} onChange={(_,visible)=>style(plot.key,{visible})}/>}/>
     {!plot.histogram?<Stack direction="row" sx={{flexWrap:'wrap',gap:1}}>
      <TextField label={`${plot.label} color`} type="color" key={options.color} defaultValue={options.color} onBlur={e=>style(plot.key,{color:e.target.value})} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:130}}/>
      <TextField select label="Width" value={options.width} onChange={e=>style(plot.key,{width:Number(e.target.value) as PlotStyle['width']})} size="small" sx={{width:95}}>{[1,2,3,4].map(value=><MenuItem key={value} value={value}>{value}px</MenuItem>)}</TextField>
      <TextField select label="Line style" value={options.style} onChange={e=>style(plot.key,{style:Number(e.target.value) as PlotStyle['style']})} size="small" sx={{width:120}}>{['Solid','Dotted','Dashed'].map((label,value)=><MenuItem key={value} value={value}>{label}</MenuItem>)}</TextField>
     </Stack>:<Stack spacing={1}>{['positive-rising','positive-falling','negative-rising','negative-falling'].map(key=><TextField key={`${key}-${active.plots?.[key]?.color}`} label={key.replace('-',' ')} type="color" defaultValue={active.plots?.[key]?.color??(key.startsWith('positive')?'#16a085':'#e45757')} onBlur={e=>style(key,{color:e.target.value})} size="small" slotProps={{inputLabel:{shrink:true}}}/>)}</Stack>}
    </Box>;})}
     <FormControlLabel label="Labels on price scale" control={<Checkbox checked={active.output?.priceScaleLabels??defaultPriceScaleLabels} onChange={(_,priceScaleLabels)=>edit({output:{...active.output,priceScaleLabels,statusLineValues:active.output?.statusLineValues??true}})}/>}/>
    {active.type==='VWAP'?<Stack spacing={1}>
     <TextField select label="Precision" value={active.output?.precision??''} onChange={e=>edit({output:{...active.output,statusLineValues:active.output?.statusLineValues??true,precision:e.target.value!==''?Number(e.target.value):undefined}})} size="small"><MenuItem value="">Default</MenuItem>{Array.from({length:17},(_,n)=><MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField>
     <FormControlLabel label="Values in status line" control={<Checkbox checked={active.output?.statusLineValues??true} onChange={(_,statusLineValues)=>edit({output:{...active.output,statusLineValues}})}/>}/>
    </Stack>:null}
    {active.type==='VWAP'?bands.levels.map((level,index)=>level.enabled?<Box key={`fill-${index}`} sx={{borderBottom:1,borderColor:'divider',pb:1}}><FormControlLabel label={`Bands Fill #${index+1}`} control={<Checkbox checked={level.fillVisible} onChange={(_,fillVisible)=>band(index,{fillVisible})}/>}/><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><TextField label={`Bands Fill #${index+1} color`} type="color" key={level.fillColor} defaultValue={level.fillColor} onBlur={e=>band(index,{fillColor:e.target.value})} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:150}}/><NumberSetting label={`Bands Fill #${index+1} opacity`} value={level.fillOpacity} min={0} max={100} integer={false} onChange={fillOpacity=>band(index,{fillOpacity})}/></Stack></Box>:null):null}
   </Stack>}
  </Box>:null}
 </>;
}
