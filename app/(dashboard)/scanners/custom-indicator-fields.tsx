"use client";

import { MenuItem, TextField } from "@mui/material";
import {
  indicatorComparisons, isIndicatorCross, type CustomIndicatorMetric, type IndicatorComparison,
} from "@/src/modules/scanner/custom/custom-indicator";

export type IndicatorDraft = {
  comparison:IndicatorComparison;
  against:"average" | "close";
  fast:string;
  slow:string;
  period:string;
  level:string;
};

export function CustomIndicatorFields({metric,value,minutes,onChange,onMinutes}:{
  metric:CustomIndicatorMetric;
  value:IndicatorDraft;
  minutes:string;
  onChange:(next:IndicatorDraft)=>void;
  onMinutes:(minutes:string)=>void;
}){
  const field=(key:"fast"|"slow"|"period"|"level",label:string,width:number)=>
    <TextField size="small" label={label} value={value[key]} sx={{width}}
      onChange={event=>onChange({...value,[key]:event.target.value})}
      slotProps={{htmlInput:{inputMode:key==="level"?"decimal":"numeric",maxLength:8}}}/>;
  const labels=metric==="customVwap"
    ? {above:"Price above",below:"Price below",crossUp:"VWAP reclaimed",crossDown:"VWAP lost"}
    : indicatorComparisons;
  const average = metric === "customEma" ? "EMA" : metric === "customSma" ? "SMA" : undefined;
  return <>
    {average && <>
      <TextField select size="small" label="Compare" value={value.against} sx={{width:164}}
        onChange={event=>onChange({...value,against:event.target.value as IndicatorDraft["against"]})}>
        <MenuItem value="average">Two averages</MenuItem>
        <MenuItem value="close">Close to average</MenuItem>
      </TextField>
      {value.against==="close" ? field("period",average + " length",102)
        : <>{field("fast","Fast " + average,85)}{field("slow","Slow " + average,85)}</>}
    </>}
    {metric==="customRsi"&&<>{field("period","RSI length",92)}{field("level","RSI level",90)}</>}
    <TextField select size="small" label="Condition" value={value.comparison} sx={{width:164}}
      onChange={event=>onChange({...value,comparison:event.target.value as IndicatorComparison})}>
      {(Object.keys(labels) as IndicatorComparison[]).map(comparison=>
        <MenuItem key={comparison} value={comparison}>{labels[comparison]}</MenuItem>)}
    </TextField>
    {isIndicatorCross(value.comparison)&&
      <TextField size="small" label="Past minutes" value={minutes} sx={{width:108}}
        onChange={event=>onMinutes(event.target.value)} slotProps={{htmlInput:{inputMode:"numeric",maxLength:4}}}/>}
  </>;
}
