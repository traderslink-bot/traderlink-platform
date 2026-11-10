"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {ChartPreferencesPanel} from "./chart-preferences-panel";
import {useChartPreferences} from "./use-chart-preferences";
import {parseVwapSeedRequest,validVwapSeed,type VwapSeed} from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import {easternClock} from "@/src/modules/scanner/live/sessions";
import {ChartBandFill} from "@/src/modules/scanner/alpaca/chart-band-fill";
import {calculationDemand} from "@/src/modules/scanner/alpaca/chart-calculation-demand";
import {ChartCalculationHistory,type CalculationHistory} from "@/src/modules/scanner/alpaca/chart-calculation-history";
import {calculationInterval,futureCalculationAxis} from "@/src/modules/scanner/alpaca/chart-calculation-intervals";
import {carryVwapPoints,offsetVwap,projectVwap} from "@/src/modules/scanner/alpaca/chart-vwap-projection";
import {readChartCalendarYear} from "@/src/modules/scanner/alpaca/chart-calendar-request";
import {ChartSessionCalendar} from "@/src/modules/scanner/alpaca/chart-calendar";
import {type IndicatorPlot,vwapAnchorKey,indicatorPlotStyle,indicatorHistogramColor,indicatorValues,isVisibleSession,visibleSessionBars} from "@/src/modules/scanner/alpaca/chart-indicators";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { useEffect, useRef, useState } from "react";
import { chartTickLabel, visibleChartDates } from "@/src/modules/scanner/alpaca/chart-axis";
import type { Time } from "lightweight-charts";
import { aggregateCandles, candleBucket, displayCandles, CHART_TIMEFRAMES, type Candle, type DisplayCandle, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";


export function AlpacaLightweightChart({ symbol, sx }: { symbol: string; sx?: SxProps<Theme> }) {
  const ticker = symbol.split(":").at(-1)!;
  const theme = useTheme();
  const {preferences,ready,message,change}=useChartPreferences();
  const dark = preferences.theme === "dark" || preferences.theme === "auto" && theme.palette.mode === "dark";
  const [panel,setPanel]=useState<"indicators"|"settings"|null>(null);
  const vwapSeedCache=useRef(new Map<string,{value:VwapSeed;at:number}>());
  const marketCalendar=useRef(new ChartSessionCalendar());
  const [sessionMessage,setSessionMessage]=useState("");
  const memory=useRef<{key:string;bars:Candle[];nextBefore:number|null;range:import("lightweight-charts").IRange<Time>|null;logicalRange:{from:number;to:number}|null;axis:{first:number|undefined;last:number|undefined;count:number;sessions:string};priceRange:import("lightweight-charts").IRange<number>|null}|null>(null);
  const container = useRef<HTMLDivElement>(null);
  const dateAxis = useRef<HTMLDivElement>(null);
  const indicatorLegend = useRef<HTMLDivElement>(null);
  const [historyMessage,setHistoryMessage] = useState("");
  const crosshairDetails = useRef<HTMLDivElement>(null);
  const [activeTimeframe,setActiveTimeframe]=useState<ChartTimeframe|null>(null);
  const timeframe=activeTimeframe??preferences.timeframe;
  const regularOnly=preferences.regular&&!preferences.premarket&&!preferences.postmarket;
  if(ready&&activeTimeframe===null)setActiveTimeframe(preferences.timeframe);
  const changePreferences=(next:typeof preferences)=>{if(next.timeframe!==preferences.timeframe)setActiveTimeframe(next.timeframe);change(next);};
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading candles…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !ready) return;
    const sessionKey=JSON.stringify([preferences.premarket,preferences.regular,preferences.postmarket]);
    const cacheKey=ticker+":"+timeframe,restore=memory.current?.key===ticker+":"+timeframe?memory.current:null;
    const displayTime=new Intl.DateTimeFormat("en-US",{timeZone:preferences.timezone,month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    const zoneLabel=preferences.timezone==="UTC"?"UTC":"ET";
    let disposed = false, auxiliarySource: EventSource | undefined, source: EventSource | undefined, removeChart: (() => void) | undefined;
    const abort = new AbortController();
    setStatus("Loading candles…"); setError(null); setHistoryMessage("");
    if (crosshairDetails.current) crosshairDetails.current.textContent = "";
    dateAxis.current?.replaceChildren();
    async function start() {
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, BarSeries, ColorType, TickMarkType, PriceScaleMode } = await import("lightweight-charts");
      if (disposed) return;
      const chart = createChart(element!, {
        autoSize: true,
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11, attributionLogo: true },
        grid: { vertLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" }, horzLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" } },
        timeScale: { minBarSpacing: 0.001, timeVisible: timeframe !== "1D" && timeframe !== "4h", secondsVisible: false, rightOffset: 4, tickMarkFormatter: (time: Time, tickMarkType: number) => chartTickLabel(time,timeframe,tickMarkType <= TickMarkType.DayOfMonth,preferences.timezone) },
        localization: { timeFormatter: (time: Time) => typeof time === "number" ? displayTime.format(new Date(time * 1000)) + " "+zoneLabel : String(time) },
      });
      removeChart = () => chart.remove();
      chart.priceScale("right").applyOptions({autoScale:preferences.autoScale,mode:preferences.logarithmic?PriceScaleMode.Logarithmic:PriceScaleMode.Normal});
      const candles = preferences.kind==="line" ? chart.addSeries(LineSeries,{color:preferences.upColor}) : preferences.kind==="bars" ? chart.addSeries(BarSeries,{upColor:preferences.upColor,downColor:preferences.downColor}) : chart.addSeries(CandlestickSeries, { upColor: preferences.upColor, downColor: preferences.downColor, borderVisible: false, wickUpColor: preferences.upColor, wickDownColor: preferences.downColor, priceFormat: { type: "price", precision: 4, minMove: 0.0001 } });
      const volume = preferences.volume?chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1):undefined;
      chart.panes()[0].setStretchFactor(100-preferences.volumeHeight);if(volume)chart.panes()[1].setStretchFactor(preferences.volumeHeight);
      let nextPane=volume?2:1;
      const studies=preferences.indicators.filter(indicator=>indicator.visible!==false&&(indicator.type!=='VWAP'||!indicator.timeframes||indicator.timeframes.includes(timeframe))).flatMap(indicator=>{
        const parts=indicatorValues([],indicator,timeframe),pane=parts[0]?.pane?nextPane++:0;
        return parts.map((part,index)=>{const style=indicatorPlotStyle(indicator,part.key);return {indicator,index,key:part.key,histogram:part.histogram,series:part.histogram
          ?chart.addSeries(HistogramSeries,{visible:style.visible,priceLineVisible:false,lastValueVisible:false},pane)
          :chart.addSeries(LineSeries,{visible:style.visible,color:style.color,lineWidth:style.width,lineStyle:style.style,title:part.label,priceLineVisible:false,lastValueVisible:indicator.output?.priceScaleLabels??false,...(preferences.scalePriceOnly&&pane===0?{autoscaleInfoProvider:()=>null}:{}),...(indicator.type==="RSI"?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})},pane)};});
      });
      const indicatorAxis=studies.some(study=>study.indicator.type==='VWAP'&&(study.indicator.offset??0)>0)?chart.addSeries(LineSeries,{visible:false,priceLineVisible:false,lastValueVisible:false},0):undefined;
      let activeCrosshair:import("lightweight-charts").MouseEventParams<Time>|undefined;
      const studyPoints=new Map<typeof studies[number],readonly {time:number;value:number}[]>();
      const appliedPrecisions=new Map<typeof studies[number],number>();
      const studyPrecision=(study:typeof studies[number])=>{const format=candles.options().priceFormat;return study.indicator.output?.precision??('precision' in format?format.precision:2);};
      const updateIndicatorLegend=()=>{
        const element=indicatorLegend.current;if(!element)return;
        const nodes=studies.filter(study=>study.indicator.output?.statusLineValues&&study.series.options().visible).map(study=>{
          const points=studyPoints.get(study)??[],time=activeCrosshair?.time;let value:number|undefined;
          if(typeof time==='number'){let lo=0,hi=points.length;while(lo<hi){const mid=(lo+hi)>>>1;if(points[mid].time<time)lo=mid+1;else hi=mid;}if(points[lo]?.time===time)value=points[lo].value;}else if(time===undefined)value=points.at(-1)?.value;
          const span=document.createElement('span');span.dataset.indicatorValue=study.indicator.id+':'+study.key;
          span.textContent=study.series.options().title+' '+(typeof value==='number'&&Number.isFinite(value)?value.toFixed(studyPrecision(study)):'—');
          Object.assign(span.style,{color:indicatorPlotStyle(study.indicator,study.key).color,whiteSpace:'nowrap'});return span;
        });element.replaceChildren(...nodes);
      };
      const updateStudyFormats=()=>{for(const study of studies){if(study.indicator.output){const precision=studyPrecision(study);if(appliedPrecisions.get(study)!==precision){study.series.applyOptions({priceFormat:{type:'custom',formatter:(value:number)=>value.toFixed(precision),minMove:10**-precision}});appliedPrecisions.set(study,precision);}}}};
      const futureIndicatorTimes=new Set<number>();
      const bandFills=studies.filter(study=>study.indicator.type==='VWAP'&&study.index===0&&study.indicator.vwapBands).flatMap(study=>study.indicator.vwapBands!.levels.map((level,index)=>{
        const primitive=new ChartBandFill(value=>study.series.priceToCoordinate(value));chart.panes()[0].attachPrimitive(primitive);
        return {indicator:study.indicator,level,index,primitive};
      }));
      const vwapFrameCache=new Map<string,IndicatorPlot[]>();
      const updateBandFills=()=>{for(const fill of bandFills){const parts=vwapFrameCache.get(fill.indicator.id);fill.primitive.update(parts?.find(part=>part.key===`upper-${fill.index+1}`)?.points??[],parts?.find(part=>part.key===`lower-${fill.index+1}`)?.points??[],fill.level.fillColor,fill.level.fillOpacity,fill.level.enabled&&fill.level.fillVisible);}};
      const lowerPanes=chart.panes().slice(volume?2:1),lowerSpace=Math.min(50,lowerPanes.length*20);
      chart.panes()[0].setStretchFactor(100-(volume?preferences.volumeHeight:0)-lowerSpace);
      for(const pane of lowerPanes)pane.setStretchFactor(lowerSpace/lowerPanes.length);
      let livePrice:ReturnType<typeof candles.createPriceLine>|undefined,livePriceAt=0;
      const bars = new Map<number, Candle>(restore?.bars.map(bar=>[bar.time,bar]));
      const queued = new Map<number, Candle>();
      const calculationHistory=new ChartCalculationHistory(ticker,abort.signal,()=>easternClock(Date.now()).date);
      const calculationContexts=new Map<string,CalculationHistory&{daily:boolean;through?:number}>(),contextCoverage=new Map<string,number>(),contextPending=new Set<string>(),contextFailures=new Map<string,number>();
      let calculationView:{from:number;to:number}|null=null,calculationViewKey="",calculationViewTimer:ReturnType<typeof setTimeout>|undefined;
      const seconds={"1m":60,"5m":300,"15m":900,"1h":3600,"4h":14400,"1D":86400};
      let vwapProblem="";
      let calendarReady=false,calendarRetryAt=0,historyBasisDate="";
      let seedLoading=false,seedError=false;
      const pendingCalendarYears=new Set<number>(),calendarYearFailures=new Map<number,number>();
      const requestFutureCalendar=(calendar:ChartSessionCalendar,lastTime:number)=>{
        const axisYear=Number(easternClock(lastTime*1000).date.slice(0,4));let year=axisYear+1;
        while(year<=axisYear+3&&calendar.covers(Date.parse(`${year}-07-01T12:00:00Z`)/1000))year++;
        if(year>axisYear+3||year>9999||Date.now()-(calendarYearFailures.get(year)??0)<30_000)return false;
        seedLoading=true;if(pendingCalendarYears.has(year))return true;pendingCalendarYears.add(year);
        void fetch('/api/charts/calendar?year='+year,{credentials:'same-origin',signal:abort.signal,cache:'no-store'}).then(async response=>{
          if(!response.ok)throw Error('calendar_year_unavailable');const value=readChartCalendarYear(await response.json(),year);
          calendar.merge(value);marketCalendar.current.merge(value);for(const context of calculationContexts.values())context.calendar.merge(value);
        }).catch(()=>{if(!abort.signal.aborted){calendarYearFailures.set(year,Date.now());while(calendarYearFailures.size>8)calendarYearFailures.delete(calendarYearFailures.keys().next().value!);}}).finally(()=>{pendingCalendarYears.delete(year);if(!disposed)writeAll(false);});
        return true;
      };
      const pendingSeeds=new Set<string>(),seedFailures=new Map<string,number>(),seedMomentAttempts=new Map<string,number>();
      let loaded = false, loading = false, reloadAfter = false, connected = false, loadingOlder = false;
      let nextBefore: number | null = restore?.nextBefore??null, userPanned = false;
      const markPan = () => {userPanned=true;};
      element!.addEventListener("wheel",markPan,{passive:true});element!.addEventListener("pointerdown",markPan);
      type Stamp = import("lightweight-charts").UTCTimestamp;
      const point = (bar: DisplayCandle) => ({ ...bar, value:bar.close,time: bar.time as Stamp });
      const volumePoint = (bar: DisplayCandle) => bar.carried ? { time: bar.time as Stamp } : ({ time: bar.time as Stamp, value: bar.volume, color: bar.close >= bar.open ? preferences.upColor+"80" : preferences.downColor+"80" });
      let displayed = new Map<number, DisplayCandle>();
      const captionMeasure=document.createElement('canvas').getContext('2d');
      const updateDateVisibility=()=>{
        const axis=dateAxis.current;if(!axis)return;const labels=Array.from(axis.children) as HTMLElement[];
        let from=-Infinity,to=-Infinity;
        if(activeCrosshair?.point&&activeCrosshair.time!==undefined){
          const layout=chart.options().layout;if(captionMeasure)captionMeasure.font=`${layout.fontSize}px ${layout.fontFamily}`;
          const text=chart.options().localization.timeFormatter?.(activeCrosshair.time)??'';
          const width=Math.min(chart.timeScale().width(),(captionMeasure?.measureText(String(text)).width??String(text).length*layout.fontSize)+20);
          from=Math.max(0,Math.min(activeCrosshair.point.x-width/2,chart.timeScale().width()-width));to=from+width;
        }
        const bounds=labels.map(label=>({label,left:Number.parseFloat(label.style.left),width:label.getBoundingClientRect().width}));
        for(const {label,left,width}of bounds)label.style.visibility=left<to&&left+width>from?'hidden':'visible';
      };
      chart.subscribeCrosshairMove(event => {
        activeCrosshair=event.point&&event.time!==undefined?event:undefined;updateIndicatorLegend();updateDateVisibility();
        if (!crosshairDetails.current) return;
        const bar = typeof event.time === "number" ? displayed.get(event.time) : undefined;
        crosshairDetails.current.textContent = bar ? `${displayTime.format(new Date(bar.time * 1000))} ${zoneLabel} · ${bar.carried ? `Carried-forward price $${bar.close.toFixed(bar.close < 1 ? 4 : 2)} · No candle returned` : `O ${bar.open} H ${bar.high} L ${bar.low} C ${bar.close} · Vol ${bar.volume.toLocaleString()}`}` : "";
      });
      let displayPoints: DisplayCandle[] = [];
      const dateFormat = new Intl.DateTimeFormat("en-US",{timeZone:preferences.timezone,month:"short",day:"numeric"});
      const dateKey = new Intl.DateTimeFormat("en-CA",{timeZone:preferences.timezone,year:"numeric",month:"2-digit",day:"2-digit"});
      let dayStarts: {index:number;key:string}[] = [];
      const updateDates = () => {
        const axis=dateAxis.current,range=chart.timeScale().getVisibleLogicalRange();
        const right=Math.max(0,element!.clientWidth-chart.timeScale().width());
        if(axis)axis.style.right=`${right}px`;if(indicatorLegend.current)indicatorLegend.current.style.right=`${right}px`;
        if(!axis||!range||!displayPoints.length||timeframe==="1D"){axis?.replaceChildren();return;}
        const entries=visibleChartDates(displayPoints,range,dayStarts,index=>chart.timeScale().logicalToCoordinate(index as import("lightweight-charts").Logical));
        const nodes=entries.map(entry=>{const label=document.createElement("span");label.textContent=dateFormat.format(entry.time*1000);label.dataset.chartDate="";Object.assign(label.style,{position:"absolute",left:`${entry.left}px`,top:"2px",padding:"0 5px",background:dark?"#101722":"#fff",whiteSpace:"nowrap",fontSize:"11px",color:dark?"#c7d2df":"#354358"});return label;});
        axis.replaceChildren(...nodes);updateDateVisibility();
      };
      const seedFor=(indicator:typeof preferences.indicators[number],actual:Candle[],calculationFrame:ChartTimeframe=timeframe):VwapSeed|undefined=>{
        if(!actual.length||calculationFrame==='1D'&&indicator.hideOnDaily)return undefined;
        const basisDate=easternClock(Date.now()).date;
        if(historyBasisDate!==basisDate){seedError=true;return undefined;}
        const query=new URLSearchParams({symbol:ticker,timeframe:calculationFrame,anchor:indicator.anchor??'Session',before:String(actual[0].time),premarket:preferences.premarket?'1':'0',regular:preferences.regular?'1':'0',postmarket:preferences.postmarket?'1':'0'}),request=parseVwapSeedRequest(query),key=basisDate+query.toString();
        const cachedEntry=vwapSeedCache.current.get(key),cached=cachedEntry?.value,validCached=cached&&validVwapSeed(cached,request,basisDate)?cached:undefined;
        const expired=validCached&&cachedEntry&&Date.now()-cachedEntry.at>=300_000;
        const needsMoments=indicator.vwapBands?.mode==='Standard deviation'&&indicator.vwapBands.levels.some(level=>level.enabled);
        const missingMoments=validCached&&validCached.volume>0&&needsMoments&&!validCached.moments;
        if(validCached&&!expired&&(!missingMoments||Date.now()-(seedMomentAttempts.get(key)??0)<30_000))return validCached;
        if(Date.now()-(seedFailures.get(key)??0)<30_000){if(!validCached||expired)seedError=true;return validCached;}
        seedLoading=true;if(!pendingSeeds.has(key)){
          if(missingMoments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
          pendingSeeds.add(key);
          void fetch('/api/charts/vwap-seed?'+query.toString(),{credentials:'same-origin',signal:abort.signal,cache:'no-store'}).then(async response=>{
            if(!response.ok)throw Error();const value=await response.json();if(!validVwapSeed(value,request,basisDate))throw Error();
            if(needsMoments&&value.volume>0&&!value.moments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
            vwapSeedCache.current.set(key,{value,at:Date.now()});while(vwapSeedCache.current.size>64)vwapSeedCache.current.delete(vwapSeedCache.current.keys().next().value!);
          }).catch(()=>{if(!abort.signal.aborted)seedFailures.set(key,Date.now());}).finally(()=>{pendingSeeds.delete(key);if(!disposed)writeAll(false);});
        }
        return validCached;
      };
      const vwapParts=(indicator:typeof preferences.indicators[number],actual:Candle[],axis:DisplayCandle[]):IndicatorPlot[]=>{
        const frame=indicator.calculationTimeframe??timeframe;
        if(indicator.hideOnDaily&&frame==='1D'||!actual.length)return [];
        let input=[...bars.values()],calendar=marketCalendar.current,projectionAxis=axis;
        if((frame==='1D')!==(timeframe==='1D')){
          const demand=calculationDemand(axis,calculationView);if(!demand)return [];
          const {before,through}=demand,daily=frame==='1D',key=`${historyBasisDate}:${daily}:${through??'live'}`,cached=calculationContexts.get(key);
          if(!cached||cached.basisDate!==historyBasisDate||(contextCoverage.get(key)??Infinity)>before){
            if(Date.now()-(contextFailures.get(key)??0)<30_000){seedError=true;return [];}
            seedLoading=true;
            if(!contextPending.has(key)){
              contextPending.add(key);
              void calculationHistory.read(frame,before,through).then(value=>{
                if(!disposed){calculationContexts.set(key,{...value,daily,through});contextCoverage.set(key,before);while(calculationContexts.size>4){const oldest=calculationContexts.keys().next().value!;calculationContexts.delete(oldest);contextCoverage.delete(oldest);}}
              }).catch(error=>{if(!disposed&&!(error instanceof Error&&error.message==='calculation_history_invalidated')){contextFailures.set(key,Date.now());while(contextFailures.size>32)contextFailures.delete(contextFailures.keys().next().value!);}}).finally(()=>{contextPending.delete(key);if(!disposed)writeAll(false);});
            }
            return [];
          }
          input=cached.bars.filter(bar=>bar.time>=before&&(through===undefined||bar.time<=through));calendar=cached.calendar;
          if(daily){const previous=cached.bars.findLast(bar=>bar.time<before);if(previous)input.unshift(previous);}
          projectionAxis=axis.filter(bar=>bar.time>=before&&(through===undefined||bar.time<=through));
        }
        if(input.some(bar=>!calendar.covers(bar.time)||!calendar.sessionAt(bar.time))){vwapProblem='VWAP unavailable: trading-session data could not load.';return [];}
        const calculation=aggregateCandles(frame==='1D'?input:visibleSessionBars(input,preferences,calendar),frame,regularOnly);
        const seed=seedFor(indicator,calculation,frame);if(!seed)return [];
        if(seed.volume===0&&calculation.every(bar=>bar.volume===0))vwapProblem='VWAP unavailable: no volume data.';
        else if(seed.events&&!seed.events.dates.length)vwapProblem=`VWAP: no ${seed.events.anchor==='Splits'?'split':'dividend'} events in available data.`;
        try{
          const parts=indicatorValues(calculation,indicator,frame,{vwapSeed:seed,calendar});
          if(parts.some(part=>part.unavailable))vwapProblem=parts.some(part=>part.unavailableReason==='numeric')?'VWAP band values exceed the supported numeric range.':'Some VWAP band history could not load.';
          const interval=(time:number,tf:ChartTimeframe)=>{
            if(tf!=='1D')return calculationInterval(time,tf,preferences,calendar);
            const row=calendar.sessionAt(time);if(!row)throw Error('daily_session_unavailable');
            return {time,close:row.start+row.closeMinute*60};
          };
          const chartIntervals=frame===timeframe?[]:projectionAxis.map(bar=>interval(bar.time,timeframe));
          const offset=indicator.offset??0,axisTimes=axis.map(bar=>bar.time),axisPositions=new Map(axisTimes.map((time,index)=>[time,index]));
          const positionsCache=new Map<number,{times:number[];available:Set<number>}>();
          const anchorCache=new Map<string,string>();
          const anchorFor=(time:number)=>{const date=calendar.sessionAt(time)?.session.date;if(!date)return undefined;let key=anchorCache.get(date);if(key===undefined){key=vwapAnchorKey(date,indicator.anchor??'Session',seed.events?.dates);anchorCache.set(date,key);}return key;};
          return parts.map(part=>{
            const values=part.points;
            const projected=frame===timeframe?carryVwapPoints(values,axis,(a,b)=>{const key=anchorFor(a);return key!==undefined&&key===anchorFor(b);}):projectVwap(chartIntervals,values.map(point=>({...interval(point.time,frame),value:point.value})),{higherTimeframe:seconds[frame]>seconds[timeframe],waitForClose:indicator.waitForClose??true,now:Date.now()/1000});
            const lastPoint=projected.at(-1),neededFuture=lastPoint?Math.max(0,(axisPositions.get(lastPoint.time)??0)+offset-axis.length+1):0;
            let positions=positionsCache.get(neededFuture);
            if(!positions){let times:number[];try{times=futureCalculationAxis(axisTimes,neededFuture,timeframe,preferences,calendar);}catch(error){if(neededFuture&&requestFutureCalendar(calendar,axisTimes.at(-1)!))return {...part,points:[]};throw error;}for(const time of times.slice(axisTimes.length))futureIndicatorTimes.add(time);positions={times,available:new Set(times)};positionsCache.set(neededFuture,positions);}
            return {...part,points:offsetVwap(projected.filter(point=>positions!.available.has(point.time)),positions.times,offset)};
          });
        }catch{vwapProblem='VWAP unavailable: trading-session positions could not load.';return [];}
      };
      const vwapPoints=(indicator:typeof preferences.indicators[number],actual:Candle[],axis:DisplayCandle[],index:number)=>{
        let parts=vwapFrameCache.get(indicator.id);if(!parts){parts=vwapParts(indicator,actual,axis);vwapFrameCache.set(indicator.id,parts);}
        return parts[index]?.points??[];
      };
      const writeAll = (initial: boolean, prepend = false) => {
        seedLoading=false;seedError=false;vwapProblem="";vwapFrameCache.clear();futureIndicatorTimes.clear();
        calendarReady=timeframe==="1D"||[...bars.values()].every(bar=>marketCalendar.current.covers(bar.time));
        setSessionMessage(studies.some(study=>study.indicator.type==="VWAP")&&!calendarReady?"VWAP unavailable: trading-session data could not load.":"");
        const actual = aggregateCandles(timeframe==="1D"?bars.values():visibleSessionBars([...bars.values()],preferences,calendarReady?marketCalendar.current:undefined), timeframe,regularOnly);
        const data = displayCandles(actual, timeframe, connected ? candleBucket(Math.floor(Date.now() / 1000) - 60, timeframe,regularOnly) : undefined).filter(bar=>timeframe==="1D"||!bar.carried||isVisibleSession(bar.time,preferences,calendarReady?marketCalendar.current:undefined));
        const oldFirst = displayPoints[0]?.time;
        displayPoints = data;
        dayStarts=[];let previousDate="";
        for(let index=0;index<data.length;index++){const key=dateKey.format(data[index].time*1000);if(key!==previousDate){dayStarts.push({index,key});previousDate=key;}}
        displayed = new Map(data.map(bar => [bar.time, bar]));
        const previousCount = candles.data().length;
        const range = chart.timeScale().getVisibleLogicalRange();
        calculationView=initial?null:range;
        candles.setData(data.map(point));
        if(initial&&!preferences.autoScale&&data.length){const recent=data.slice(-(timeframe==="1m"?240:100)),low=Math.min(...recent.map(b=>b.low)),high=Math.max(...recent.map(b=>b.high)),margin=Math.max((high-low)*0.05,high*0.01,0.0001);chart.priceScale("right").setVisibleRange(restore?.priceRange??{from:Math.max(0.0001,low-margin),to:high+margin});}
        volume?.setData(data.map(volumePoint));
        for(const study of studies){
          const part=study.indicator.type==='VWAP'?{points:[]}:indicatorValues(actual,study.indicator,timeframe)[study.index];
          const points=study.indicator.type==='VWAP'?vwapPoints(study.indicator,actual,data,study.index):part.points;
          studyPoints.set(study,points);
          study.series.setData(points.map((point,index)=>({...point,time:point.time as Stamp,...(study.histogram?{color:indicatorHistogramColor(study.indicator,point.value,part.points[Math.max(0,index-1)].value,preferences.upColor,preferences.downColor)}:{})})));
        }
        indicatorAxis?.setData([...futureIndicatorTimes].sort((a,b)=>a-b).map(time=>({time:time as Stamp})));
        updateStudyFormats();updateIndicatorLegend();
        updateBandFills();
        if(calendarReady)setSessionMessage(vwapProblem|| (seedError?'VWAP history could not load. Retrying shortly.':seedLoading?'Loading VWAP history…':''));
        if(initial){
          const from=typeof restore?.range?.from==="number"&&data.length?Math.max(restore.range.from,data[0].time):null;
          const to=typeof restore?.range?.to==="number"&&data.length?Math.min(restore.range.to,data[data.length-1].time):null;
          if(restore?.logicalRange&&restore.axis.sessions===sessionKey&&restore.axis.first===data[0]?.time&&restore.axis.last===data.at(-1)?.time&&restore.axis.count===data.length)chart.timeScale().setVisibleLogicalRange(restore.logicalRange);
          else if(from!==null&&to!==null&&from<to)chart.timeScale().setVisibleRange({from:from as Stamp,to:to as Stamp});
          else chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, data.length - (timeframe === "1m" ? 240 : 100)), to: data.length + 4 });
        }
        else if (range) {
          const added = prepend && oldFirst !== undefined ? Math.max(0,data.findIndex(bar=>bar.time===oldFirst)) : range.to >= previousCount - 1 ? data.length - previousCount : 0;
          chart.timeScale().setVisibleLogicalRange({from:range.from + added,to:range.to + added});
        }
        updateDates();
      };
      const idleStatus=()=>!bars.size?"No candles for this symbol.":timeframe!=="1D"&&!visibleSessionBars([...bars.values()],preferences).length?"No candles in selected sessions.":"";
      const loadHistory = async () => {
        if (loading) { reloadAfter = true; return; }
        loading = true;
        try {
          const response = await fetch(`/api/screeners/charts/bars?history=1&symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}`, { signal: abort.signal, credentials: "same-origin" });
          if (!response.ok) throw Error(response.status === 429 ? "Chart requests are busy. Try again shortly." : "Candles unavailable. Try again.");
          const data = await response.json();
          if (disposed) return;
          const basisDate=easternClock(Date.now()).date;
          if(data.basisDate!==basisDate)throw Error("Adjusted candle history could not load. Try again.");
          const newBasis=historyBasisDate!==basisDate;historyBasisDate=basisDate;
          marketCalendar.current.merge(data.calendar);if(Array.isArray(data.calendars))for(const value of data.calendars)marketCalendar.current.merge(value);
          const initial = !loaded;
          if(initial&&!restore||newBasis&&!initial)bars.clear();
          if(initial&&!restore||newBasis&&!initial){nextBefore=data.nextBefore??null;}
          for (const bar of data.bars as Candle[]) bars.set(bar.time, bar);
          for (const bar of queued.values()) bars.set(bar.time, bar);
          queued.clear(); loaded = true;
          const latest = [...bars.values()].reduce<Candle|undefined>((last,bar)=>!last||bar.time>last.time?bar:last,undefined);
          candles.applyOptions({ priceFormat: { type: "price", precision: latest && latest.close < 1 ? 4 : 2, minMove: latest && latest.close < 1 ? 0.0001 : 0.01 } });
          writeAll(initial); setError(null);
          setStatus(idleStatus());
        } catch (failure) { if (!disposed) setError(failure instanceof Error ? failure.message : "Candles unavailable."); }
        finally { loading = false; if (reloadAfter && !disposed) { reloadAfter = false; void loadHistory(); } }
      };
      const loadOlder = async () => {
        if(disposed||loading||loadingOlder||nextBefore===null)return;
        loadingOlder=true;userPanned=false;setHistoryMessage("Loading older candles…");
        try {
          const response=await fetch(`/api/screeners/charts/bars?history=1&symbol=${encodeURIComponent(ticker)}&daily=${timeframe==="1D"?"1":"0"}&before=${nextBefore}`,{signal:abort.signal,credentials:"same-origin"});
          if(!response.ok)throw Error("Older candles could not load. Pan left again to retry.");
          const page=await response.json();if(disposed)return;if(page.basisDate!==historyBasisDate||historyBasisDate!==easternClock(Date.now()).date)throw Error("Price adjustments changed. Reload the chart.");marketCalendar.current.merge(page.calendar);if(Array.isArray(page.calendars))for(const value of page.calendars)marketCalendar.current.merge(value);
          const combined=new Map(bars);for(const bar of page.bars as Candle[])if(!combined.has(bar.time))combined.set(bar.time,bar);
          const projected=displayCandles(aggregateCandles(combined.values(),timeframe,regularOnly),timeframe);
          if(projected.length>80_000){nextBefore=null;setHistoryMessage("Chart history limit reached. Use a larger timeframe for older dates.");}
          else {setHistoryMessage("");bars.clear();for(const [time,bar] of combined)bars.set(time,bar);nextBefore=page.nextBefore??null;writeAll(false,true);if(!page.bars.length)setHistoryMessage("No candles in that period. Pan left again to continue.");}

        }catch(failure){if(!disposed)setHistoryMessage(failure instanceof Error?failure.message:"Older candles could not load.");}
        finally{loadingOlder=false;}
      };
      chart.timeScale().subscribeVisibleLogicalRangeChange(range=>{
        updateDates();if(range&&range.from<40&&userPanned&&!loadingOlder)void loadOlder();
        if(range&&loaded&&studies.some(study=>study.indicator.type==='VWAP'&&((study.indicator.calculationTimeframe??timeframe)==='1D')!==(timeframe==='1D'))){
          const key=range.from.toFixed(2)+':'+range.to.toFixed(2);
          if(key!==calculationViewKey){calculationViewKey=key;clearTimeout(calculationViewTimer);calculationViewTimer=setTimeout(()=>{if(!disposed&&loaded)writeAll(false);},50);}
        }
      });
      source = new EventSource(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}`);
      source.addEventListener("status", event => {
        if (disposed) return;
        const state = JSON.parse((event as MessageEvent).data).state;
        if(state!=="connected"&&livePrice){candles.removePriceLine(livePrice);livePrice=undefined;}
        const wasConnected = connected; connected = state === "connected";
        if (connected && !wasConnected && loaded){calculationHistory.invalidate();calculationContexts.clear();contextCoverage.clear();void loadHistory();}
        if (loaded) setStatus(connected ? idleStatus() : state === "unavailable" ? "Feed unavailable." : "Connecting…");
      });
      source.addEventListener("price",event=>{
        if(disposed)return;
        const message=JSON.parse((event as MessageEvent).data) as {price:number;time:string};
        const at=Date.parse(message.time);
        if(!Number.isFinite(message.price)||message.price<=0||!Number.isFinite(at)||at<livePriceAt)return;
        livePriceAt=at;
        if(livePrice)livePrice.applyOptions({price:message.price});
        else livePrice=candles.createPriceLine({price:message.price,color:"#f39c12",lineWidth:1,lineStyle:2,axisLabelVisible:true,title:"Live"});
      });
      source.addEventListener("bar", event => {
        if (disposed) return;
        const message = JSON.parse((event as MessageEvent).data) as { bar: Candle; daily: boolean };
        if (message.daily !== (timeframe === "1D")) return;
        const bar = message.bar;
        if (!loaded || loading) queued.set(bar.time, bar);
        if(historyBasisDate&&historyBasisDate!==easternClock(Date.now()).date){queued.set(bar.time,bar);if(!loading)void loadHistory();return;}
        if (!loaded) return;
        bars.set(bar.time, bar);
        calculationHistory.acceptLive(bar,message.daily);
        if(studies.some(study=>study.indicator.type==='VWAP'&&(study.indicator.offset||study.indicator.calculationTimeframe&&study.indicator.calculationTimeframe!==timeframe))){writeAll(false);return;}
        if(timeframe!=="1D"&&!marketCalendar.current.covers(bar.time)&&Date.now()>=calendarRetryAt){calendarRetryAt=Date.now()+60_000;void loadHistory();}

        const bucket = candleBucket(bar.time, timeframe,regularOnly);
        const last = displayPoints.at(-1);
        if (last && bucket === last.time) {
          // The active candle moves with trades; avoid replacing the full chart per tick.
          const inputs = timeframe === "1D" ? [...bars.values()] : visibleSessionBars([...bars.values()], preferences,calendarReady?marketCalendar.current:undefined);
          const current = aggregateCandles(inputs.filter(value => candleBucket(value.time, timeframe,regularOnly) === bucket), timeframe,regularOnly).at(-1);
          if (current) {
            const updated = { ...current, carried: false };
            displayPoints[displayPoints.length - 1] = updated; displayed.set(bucket, updated);
            candles.update(point(updated)); volume?.update(volumePoint(updated));
            const actual = studies.length ? aggregateCandles(inputs, timeframe,regularOnly) : [];
            vwapFrameCache.clear();
            for (const study of studies) {
              if(study.indicator.type==="VWAP"&&!calendarReady)continue;
              const part = study.indicator.type==='VWAP'?{points:vwapPoints(study.indicator,actual,displayPoints,study.index)}:indicatorValues(actual, study.indicator,timeframe)[study.index];
              const latest = part.points.at(-1);
              studyPoints.set(study,part.points);
              if (latest) study.series.update({ ...latest, time: latest.time as Stamp, ...(study.histogram ? {color:indicatorHistogramColor(study.indicator,latest.value,part.points.at(-2)?.value??latest.value,preferences.upColor,preferences.downColor)} : {}) });
            }
            updateStudyFormats();updateIndicatorLegend();
        updateBandFills();
          }
        } else {
          // New buckets and corrected old bars must also reconcile carried positions.
          writeAll(false);
        }
      });
      if(studies.some(study=>study.indicator.type==='VWAP'&&((study.indicator.calculationTimeframe??timeframe)==='1D')!==(timeframe==='1D'))){
        const daily=timeframe!=='1D';
        auxiliarySource=new EventSource(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}&daily=${daily?'1':'0'}`);
        auxiliarySource.addEventListener('bar',event=>{
          if(disposed)return;
          const message=JSON.parse((event as MessageEvent).data) as {bar:Candle;daily:boolean};
          if(message.daily!==daily)return;
          calculationHistory.acceptLive(message.bar,daily);
          for(const cached of calculationContexts.values())if(cached.daily===daily&&cached.through===undefined&&cached.basisDate===easternClock(Date.now()).date){const combined=new Map(cached.bars.map(bar=>[bar.time,bar]));combined.set(message.bar.time,message.bar);cached.bars=[...combined.values()].sort((a,b)=>a.time-b.time);}
          if(loaded)writeAll(false);
        });
        auxiliarySource.addEventListener('status',event=>{if(!disposed&&JSON.parse((event as MessageEvent).data).state==='connected'){calculationHistory.invalidate();calculationContexts.clear();contextCoverage.clear();if(loaded)writeAll(false);}});
      }
      source.onerror = () => { if(livePrice){candles.removePriceLine(livePrice);livePrice=undefined;} if (!disposed && loaded) setStatus("Reconnecting…"); };
      let confirmationMinute=Math.floor(Date.now()/60_000);
      const confirmationTimer=setInterval(()=>{const minute=Math.floor(Date.now()/60_000);if(minute!==confirmationMinute){confirmationMinute=minute;if(!disposed&&loaded&&studies.some(study=>study.indicator.type==='VWAP'&&study.indicator.calculationTimeframe&&study.indicator.calculationTimeframe!==timeframe))writeAll(false);}},1000);
      const gapTimer = setInterval(() => { if (!disposed && loaded && connected){if(historyBasisDate!==easternClock(Date.now()).date)void loadHistory();else if(timeframe!=="1D")writeAll(false);} }, 60_000);
      const remove = removeChart;
      removeChart = () => { clearInterval(gapTimer);clearInterval(confirmationTimer);clearTimeout(calculationViewTimer);if(loaded)memory.current={key:cacheKey,bars:[...bars.values()],nextBefore,range:chart.timeScale().getVisibleRange(),logicalRange:chart.timeScale().getVisibleLogicalRange(),axis:{first:displayPoints[0]?.time,last:displayPoints.at(-1)?.time,count:displayPoints.length,sessions:sessionKey},priceRange:chart.priceScale("right").getVisibleRange()}; element!.removeEventListener("wheel",markPan);element!.removeEventListener("pointerdown",markPan);dateAxis.current?.replaceChildren();indicatorLegend.current?.replaceChildren();remove?.(); };
      await loadHistory();
    }
    void start().catch(() => { if (!disposed) setError("Chart could not load. Try again."); });
    return () => { disposed = true; abort.abort(); source?.close(); auxiliarySource?.close(); removeChart?.(); };
  }, [ticker, timeframe, regularOnly, attempt, dark, preferences, ready]);

  return <Box data-alpaca-chart={ticker} sx={[{ borderRadius: 0, height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25, px: 0.5, minHeight: 27, flexWrap: "wrap" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, mr: 0.5 }}>{ticker}</Typography>
      {CHART_TIMEFRAMES.map(value => <Button key={value} size="small" aria-label={`${ticker} ${value} candles`} aria-pressed={timeframe === value} disabled={!ready} onClick={() => {setActiveTimeframe(value);changePreferences({...preferences,timeframe:value});}} sx={{ minWidth: {xs:40,md:26}, minHeight:{xs:44,md:27}, p: {xs:"4px 6px",md:"2px 4px"}, fontSize: {xs:14,md:10}, bgcolor: timeframe === value ? "action.selected" : undefined }}>{value}</Button>)}
      <Button size="small" disabled={!ready} onClick={()=>setPanel("indicators")} sx={{minHeight:44,minWidth:0,px:0.75,textTransform:"none"}}>Indicators</Button>
      <IconButton size="small" disabled={!ready} aria-label="Chart settings" onClick={()=>setPanel("settings")} sx={{minWidth:44,minHeight:44}}><SettingsOutlined fontSize="small"/></IconButton>
      {status?<Typography role="status" sx={{ ml: "auto", fontSize: 10, color: "text.secondary" }}>{status}</Typography>:null}
    </Stack>
    {!ready&&message?<Typography role="alert" sx={{px:1,fontSize:12}}>{message}</Typography>:null}
    {sessionMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{sessionMessage}</Typography>:null}
    {historyMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{historyMessage}</Typography>:null}
    {error ? <Stack role="alert" direction="row" sx={{ alignItems: "center", px: 1, gap: 1 }}><Typography sx={{ fontSize: 12 }}>{error}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>Retry</Button></Stack> : null}
    <Box ref={crosshairDetails} data-chart-crosshair-details sx={{minHeight:16,px:0.5,fontSize:10,color:"text.secondary",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} />
    <Box sx={{flex:1,minHeight:0,minWidth:0,position:"relative",isolation:"isolate"}}><Box ref={container} sx={{position:"absolute",inset:0,zIndex:0}}/><Box ref={indicatorLegend} data-chart-indicator-legend sx={{position:"absolute",zIndex:1,top:4,left:8,right:65,display:"flex",flexWrap:"wrap",columnGap:1,rowGap:0.25,fontSize:11,pointerEvents:"none",maxHeight:"40%",overflow:"hidden"}}/><Box ref={dateAxis} data-chart-date-axis sx={{position:"absolute",zIndex:2,bottom:0,left:0,right:65,height:26,pointerEvents:"none",overflow:"hidden"}}/></Box>
    <ChartPreferencesPanel panel={panel} onClose={()=>setPanel(null)} preferences={preferences} onChange={changePreferences} message={message}/>
  </Box>;
}
