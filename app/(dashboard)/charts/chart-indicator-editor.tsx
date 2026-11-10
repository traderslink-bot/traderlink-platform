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
import {defaultVwapBands,type VwapBandLevel,type VwapBands,INDICATOR_TYPES,VWAP_ANCHORS,MA_TYPES,PRICE_SOURCES,type ChartIndicator,type PlotStyle} from '@/src/modules/scanner/alpaca/chart-preferences';
import {indicatorPlotStyle,indicatorValues} from '@/src/modules/scanner/alpaca/chart-indicators';

function NumberInput({label,value,onChange,min=1,max=10000,integer=true,disabled=false,step}:{label:string;value:number;onChange:(value:number)=>void;min?:number;max?:number|null;integer?:boolean;disabled?:boolean;step?:number}){
 const [draft,setDraft]=useState(String(value)),[error,setError]=useState(false);
 return <TextField disabled={disabled} label={label} type="number" value={draft} onChange={e=>setDraft(e.target.value)} onBlur={()=>{const n=Number(draft),valid=draft.trim()!==''&&Number.isFinite(n)&&n>=min&&(max===null||n<=max)&&(!integer||Number.isInteger(n));setError(!valid);if(valid&&n!==value)onChange(n);}} onKeyDown={e=>{if(e.key==='Enter')(e.target as HTMLInputElement).blur();}} error={error} helperText={error?`Enter ${integer?'a whole number':'a number'} ${max===null?`${min} or greater`:`from ${min} to ${max}`}.`:undefined} size="small" slotProps={{htmlInput:{min,max:max??undefined,step:step??(integer?1:'any')}}} sx={{width:150}}/>;
}
function NumberSetting(props:Parameters<typeof NumberInput>[0]){return <NumberInput key={props.value} {...props}/>;}
const name=(i:ChartIndicator)=>i.type==='EMA'||i.type==='SMA'||i.type==='RSI'?`${i.type} ${i.period}`:i.type==='MACD'?`MACD ${i.fastLength??12}, ${i.slowLength??26}, ${i.signalLength??9}`:i.type==='Bollinger'?`Bollinger Bands ${i.period}, ${i.deviation??2}`:'VWAP';
const vwapDefaults=(id:string):ChartIndicator=>({id,type:'VWAP',period:20,color:'#2962ff',width:1,source:'hlc3',anchor:'Session',offset:0,waitForClose:true,hideOnDaily:false,output:{priceScaleLabels:true,statusLineValues:true},vwapBands:defaultVwapBands()});
export function ChartIndicatorEditor({indicators,onChange}:{indicators:ChartIndicator[];onChange:(value:ChartIndicator[])=>void}){
 const [search,setSearch]=useState(''),[selected,setSelected]=useState(''),[tab,setTab]=useState('inputs');
 const active=indicators.find(i=>i.id===selected)??indicators.at(-1);
 const activeTab=tab==='visibility'&&active?.type!=='VWAP'?'inputs':tab;
 const edit=(changes:Partial<ChartIndicator>)=>{if(active)onChange(indicators.map(i=>i.id===active.id?{...i,...changes}:i));};
 const add=(type:ChartIndicator['type'])=>{const id=crypto.randomUUID(),indicator:ChartIndicator=type==='VWAP'?vwapDefaults(id):{id,type,period:type==='RSI'?14:type==='EMA'||type==='SMA'?9:20,color:['#e99b32','#42a5f5','#ab47bc','#26a69a','#ef5350'][indicators.length%5],width:2};onChange([...indicators,indicator]);setSelected(id);setTab('inputs');};
 const bands=active?.vwapBands??defaultVwapBands(false);
 const band=(index:number,changes:Partial<VwapBandLevel>)=>edit({vwapBands:{...bands,levels:bands.levels.map((level,n)=>n===index?{...level,...changes}:level) as VwapBands['levels']}});
 const style=(key:string,changes:PlotStyle)=>{if(active)edit({plots:{...active.plots,[key]:{...active.plots?.[key],...changes}}});};
 const sourceLabel=(source:string)=>({open:'Open',high:'High',low:'Low',close:'Close',hl2:'HL2',hlc3:'HLC3',ohlc4:'OHLC4',hlcc4:'HLCC4'}[source]??source);
 return <>
  <TextField label="Search indicators" value={search} onChange={e=>setSearch(e.target.value)} size="small"/>
  <Stack direction="row" sx={{flexWrap:'wrap',gap:1}}>{INDICATOR_TYPES.filter(type=>(type==='Bollinger'?'Bollinger Bands':type).toLowerCase().includes(search.toLowerCase())).map(type=><Button variant="outlined" key={type} disabled={indicators.length>=20} onClick={()=>add(type)}>Add {type==='Bollinger'?'Bollinger Bands':type}</Button>)}</Stack>
  <Typography variant="body2" color="text.secondary">Add EMA or SMA more than once to show different lengths together.</Typography>
  {!indicators.length?<Typography variant="body2">Choose an indicator to add it to your chart.</Typography>:<>
   <Typography component="h3" sx={{fontWeight:700}}>On this chart</Typography>
   {indicators.map(i=><Stack key={i.id} direction="row" sx={{alignItems:'center',gap:0.5,border:1,borderColor:active?.id===i.id?'primary.main':'divider',minWidth:0}}>
    <Checkbox size="small" checked={i.visible!==false} slotProps={{input:{'aria-label':`Show ${name(i)}`}}} onChange={(_,visible)=>onChange(indicators.map(row=>row.id===i.id?{...row,visible}:row))}/>
    <Button onClick={()=>{setSelected(i.id);setTab('inputs');}} aria-pressed={active?.id===i.id} sx={{flex:1,justifyContent:'flex-start',textTransform:'none',minWidth:0}}>{name(i)}</Button>
    <IconButton aria-label={`Remove ${name(i)}`} onClick={()=>onChange(indicators.filter(row=>row.id!==i.id))}><DeleteOutline/></IconButton>
   </Stack>)}
  </>}
  {active?<Box sx={{borderTop:1,borderColor:'divider',pt:1}}>
   <Typography component="h3" sx={{fontWeight:700,mb:1}}>{name(active)}</Typography>
   <Tabs value={activeTab} onChange={(_,value)=>setTab(value)} aria-label={`${name(active)} settings`}><Tab value="inputs" label="Inputs"/><Tab value="style" label="Style"/>{active.type==='VWAP'?<Tab value="visibility" label="Visibility"/>:null}</Tabs>
   {activeTab==='inputs'?<Stack key={active.id} spacing={2} sx={{pt:2}}>
    {!['VWAP','MACD'].includes(active.type)?<NumberSetting label={`${active.type} length`} value={active.period} onChange={period=>edit({period})}/>:null}
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
    {active.type==='VWAP'?<Stack spacing={1}>
     <TextField select label="Precision" value={active.output?.precision??''} onChange={e=>edit({output:{priceScaleLabels:active.output?.priceScaleLabels??false,statusLineValues:active.output?.statusLineValues??false,...(e.target.value!==''?{precision:Number(e.target.value)}:{})}})} size="small"><MenuItem value="">Default</MenuItem>{Array.from({length:17},(_,n)=><MenuItem key={n} value={n}>{n}</MenuItem>)}</TextField>
     <FormControlLabel label="Labels on price scale" control={<Checkbox checked={active.output?.priceScaleLabels??false} onChange={(_,priceScaleLabels)=>edit({output:{...active.output,priceScaleLabels,statusLineValues:active.output?.statusLineValues??false}})}/>}/>
     <FormControlLabel label="Values in status line" control={<Checkbox checked={active.output?.statusLineValues??false} onChange={(_,statusLineValues)=>edit({output:{...active.output,statusLineValues,priceScaleLabels:active.output?.priceScaleLabels??false}})}/>}/>
    </Stack>:null}
    {active.type==='VWAP'?bands.levels.map((level,index)=>level.enabled?<Box key={`fill-${index}`} sx={{borderBottom:1,borderColor:'divider',pb:1}}><FormControlLabel label={`Bands Fill #${index+1}`} control={<Checkbox checked={level.fillVisible} onChange={(_,fillVisible)=>band(index,{fillVisible})}/>}/><Stack direction="row" sx={{gap:1,flexWrap:'wrap'}}><TextField label={`Bands Fill #${index+1} color`} type="color" key={level.fillColor} defaultValue={level.fillColor} onBlur={e=>band(index,{fillColor:e.target.value})} size="small" slotProps={{inputLabel:{shrink:true}}} sx={{width:150}}/><NumberSetting label={`Bands Fill #${index+1} opacity`} value={level.fillOpacity} min={0} max={100} integer={false} onChange={fillOpacity=>band(index,{fillOpacity})}/></Stack></Box>:null):null}
   </Stack>}
   {active.type==='VWAP'?<Button onClick={()=>onChange(indicators.map(indicator=>indicator.id===active.id?vwapDefaults(active.id):indicator))} sx={{mt:1,textTransform:'none'}}>Reset VWAP defaults</Button>:null}
  </Box>:null}
 </>;
}
