"use client";

import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {useChartPreferences} from "./use-chart-preferences";
import {parseVwapSeedRequest,validVwapSeed,type VwapSeed} from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import {easternClock} from "@/src/modules/scanner/live/sessions";
import { chartVwapCache } from "./chart-vwap-cache";
import {ChartBandFill} from "@/src/modules/scanner/alpaca/chart-band-fill";
import {calculationDemand} from "@/src/modules/scanner/alpaca/chart-calculation-demand";
import {ChartCalculationHistory,type CalculationHistory} from "@/src/modules/scanner/alpaca/chart-calculation-history";
import {calculationInterval,futureCalculationAxis} from "@/src/modules/scanner/alpaca/chart-calculation-intervals";
import {carryVwapPoints,offsetVwap,projectVwap,indicatorReadoutIndex} from "@/src/modules/scanner/alpaca/chart-vwap-projection";
import {readChartCalendarYear} from "@/src/modules/scanner/alpaca/chart-calendar-request";
import {ChartSessionCalendar} from "@/src/modules/scanner/alpaca/chart-calendar";
import {type IndicatorPlot,vwapAnchorKey,indicatorPlotStyle,indicatorHistogramColor,indicatorValues,isVisibleSession,visibleSessionBars} from "@/src/modules/scanner/alpaca/chart-indicators";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { chartTickLabel, firstVisibleChartTime, isChartDateStart } from "@/src/modules/scanner/alpaca/chart-axis";
import type { Time } from "lightweight-charts";
import { aggregateCandles, candleBucket, displayCandles, CHART_TIMEFRAMES, type Candle, type DisplayCandle, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";


import { defaultChartView } from "@/src/modules/scanner/alpaca/chart-default-view";
import { canRestoreChartPrice, chartViews, defaultIndicatorDisplay, restoreChartRange, type ChartIndicatorDisplay } from "./chart-view-memory";
import { indicatorPriceScaleLabels, type IndicatorType } from "@/src/modules/scanner/alpaca/chart-preferences";
import { readChartVwapSeed, sharedChartFetch, sharedChartStream, type ChartStreamHandle } from "./shared-chart-data";

const ChartPreferencesPanel = lazy(() => import("./chart-preferences-panel").then(module => ({ default: module.ChartPreferencesPanel })));

const indicatorName = (type: IndicatorType) => type === "Bollinger" ? "BOLL" : type;

export function AlpacaLightweightChart({ symbol, sx, timeframe: controlledTimeframe, onTimeframeChange, disabledTimeframes = [], actions, closeAction, onOpenMultiview, onDefaultTimeframeChange, compactMobile = false, compactIdentity, viewId, viewWorkspace = "main" }: {
  symbol: string; sx?: SxProps<Theme>; timeframe?: ChartTimeframe; onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  viewId?: string; viewWorkspace?: "main" | "scanner"; compactIdentity?: import("react").ReactNode; compactMobile?: boolean; disabledTimeframes?: readonly ChartTimeframe[]; actions?: import("react").ReactNode; closeAction?: import("react").ReactNode; onOpenMultiview?: () => void; onDefaultTimeframeChange?: (timeframe: ChartTimeframe) => void;
}) {
  const ticker = symbol.split(":").at(-1)!;
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down("md")), landscape = useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)");
  const compact = compactMobile && (narrow || landscape);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null), [frameAnchor, setFrameAnchor] = useState<HTMLElement | null>(null);
  const {preferences,ready,message,change,ownerKey}=useChartPreferences();
  const dark = preferences.theme === "dark" || preferences.theme === "auto" && theme.palette.mode === "dark";
  const [panel,setPanel]=useState<"indicators"|"settings"|null>(null);
  const [preferencesOpened,setPreferencesOpened]=useState(false);
  const openPreferences=(next: "indicators"|"settings")=>{
    setPreferencesOpened(true);
    setPanel(next);
  };
  const [initialIndicator,setInitialIndicator]=useState<IndicatorType>();
  const [indicatorMenu,setIndicatorMenu]=useState<{anchor:HTMLElement;type:IndicatorType}|null>(null);
  const displayKey=JSON.stringify([ownerKey,viewWorkspace,viewId,ticker]);
  const [localDisplay,setLocalDisplay]=useState<{key:string;value:ChartIndicatorDisplay}>();
  if(localDisplay&&localDisplay.key!==displayKey)setLocalDisplay(undefined);
  const indicatorDisplay=localDisplay?.key===displayKey?localDisplay.value:
    ownerKey&&viewId?chartViews.readIndicatorDisplay(ownerKey,viewWorkspace,viewId,ticker):defaultIndicatorDisplay;
  const changeIndicatorDisplay=(type:IndicatorType,action:"hidden"|"enabled",value:boolean)=>{
    const next=action==="enabled"?{...indicatorDisplay,enabled:{...indicatorDisplay.enabled,[type]:value}}:
      {...indicatorDisplay,hidden:new Set(value?[...indicatorDisplay.hidden,type]:[...indicatorDisplay.hidden].filter(item=>item!==type))};
    setLocalDisplay({key:displayKey,value:next});
    if(ownerKey&&viewId)chartViews.writeIndicatorDisplay(ownerKey,viewWorkspace,viewId,ticker,next);
  };
  const openIndicators=(type?:IndicatorType)=>{setInitialIndicator(type);openPreferences("indicators");};

  const marketCalendar=useRef(new ChartSessionCalendar());
  const [sessionMessage,setSessionMessage]=useState("");
  const memory=useRef<{key:string;basisDate:string;bars:Candle[];nextBefore:number|null;range:import("lightweight-charts").IRange<Time>|null;logicalRange:{from:number;to:number}|null;axis:{first:number|undefined;last:number|undefined;count:number;sessions:string};priceRange:import("lightweight-charts").IRange<number>|null}|null>(null);
  const container = useRef<HTMLDivElement>(null);
  const dateAxis = useRef<HTMLDivElement>(null);
  const indicatorLegend = useRef<HTMLDivElement>(null);
  const [historyMessage,setHistoryMessage] = useState("");
  const crosshairDetails = useRef<HTMLDivElement>(null);
  const [activeTimeframe,setActiveTimeframe]=useState<ChartTimeframe|null>(null);
  const timeframe=controlledTimeframe??activeTimeframe??preferences.timeframe;
  const enabledOverrides=indicatorDisplay.enabled;
  const activeIndicators=useMemo(()=>{
    const visibleTypes=new Set(preferences.indicators.filter(indicator=>indicator.visible!==false).map(indicator=>indicator.type));
    return preferences.indicators.flatMap(indicator=>{
      const enabled=enabledOverrides[indicator.type];
      if(enabled===false||indicator.type==="VWAP"&&indicator.timeframes&&!indicator.timeframes.includes(timeframe))return [];
      if(indicator.visible!==false)return [indicator];
      return enabled===true&&!visibleTypes.has(indicator.type)?[{...indicator,visible:true}]:[];
    });
  },[preferences.indicators,enabledOverrides,timeframe]);
  const crosshairLines=useMemo(()=>activeIndicators.flatMap(indicator=>indicatorValues([],indicator,timeframe)
    .filter(plot=>!plot.pane&&!plot.histogram&&indicatorPlotStyle(indicator,plot.key).visible)
    .map(plot=>({value:`indicator:${indicator.id}:${plot.key}` as const,label:plot.label}))),[activeIndicators,timeframe]);
  const crosshairTarget=preferences.crosshairTarget??"price";
  const readoutTypes=[...new Set(activeIndicators.map(indicator=>indicator.type))];
  const regularOnly=preferences.regular&&!preferences.premarket&&!preferences.postmarket;
  if(ready&&controlledTimeframe===undefined&&activeTimeframe===null)setActiveTimeframe(preferences.timeframe);
  const changePreferences = (next: typeof preferences) => {
    change(next);
    if (next.timeframe !== preferences.timeframe) onDefaultTimeframeChange?.(next.timeframe);
  };
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading candles…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !ready) return;
    const sessionKey=JSON.stringify([preferences.premarket,preferences.regular,preferences.postmarket]);
    const cacheKey=ticker+":"+timeframe;
    const savedView=ownerKey&&viewId?chartViews.read(ownerKey,viewWorkspace,viewId,ticker,timeframe,sessionKey):null;
    const restorePrice=canRestoreChartPrice(savedView,preferences,easternClock(Date.now()).date);
    const restore=memory.current?.key===cacheKey&&memory.current.basisDate===easternClock(Date.now()).date?memory.current:savedView?{...savedView,key:cacheKey,bars:[] as Candle[],nextBefore:null,priceRange:restorePrice?savedView.priceRange:null}:null;
    const displayTime=new Intl.DateTimeFormat("en-US",{timeZone:preferences.timezone,month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    const zoneLabel=preferences.timezone==="UTC"?"UTC":"ET";
    let disposed = false, auxiliarySource: ChartStreamHandle | undefined, source: ChartStreamHandle | undefined, removeChart: (() => void) | undefined;
    const abort = new AbortController();
    setStatus("Loading candles…"); setError(null); setHistoryMessage("");
    if (crosshairDetails.current) crosshairDetails.current.textContent = "";
    dateAxis.current?.replaceChildren();
    const useRecentHistory = timeframe !== "4h" && timeframe !== "1D";
    const requestHistory = (recent = false) => sharedChartFetch(
      `/api/screeners/charts/bars?history=1&symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}${recent ? "&recent=1" : ""}`,
      { signal: abort.signal, credentials: "same-origin" },
    );
    const initialHistory = requestHistory(useRecentHistory);
    // The request may settle before the lazy chart library finishes loading.
    void initialHistory.catch(() => {});
    async function start() {
      const { createChart, CandlestickSeries, HistogramSeries, LineSeries, BarSeries, ColorType, TickMarkType, PriceScaleMode, CrosshairMode } = await import("lightweight-charts");
      if (disposed) return;
      let displayPoints: DisplayCandle[] = [];
      const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: preferences.timezone, year: "numeric", month: "numeric", day: "numeric" });
      const dayKey = (time: number) => dateKey.format(time * 1000);
      const chart = createChart(element!, {
        autoSize: true,
        crosshair: { mode: crosshairTarget==="nearest"?CrosshairMode.Magnet:CrosshairMode.Normal },
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11, attributionLogo: false },
        grid: { vertLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" }, horzLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" } },
        timeScale: { minBarSpacing: 0.001, timeVisible: timeframe !== "1D", secondsVisible: false, rightOffset: 4, tickMarkFormatter: (time: Time, tickMarkType: number) => chartTickLabel(time, timeframe, tickMarkType <= TickMarkType.DayOfMonth &&
          (typeof time !== "number" || isChartDateStart(displayPoints, time, dayKey)), preferences.timezone) },
        localization: { timeFormatter: (time: Time) => typeof time === "number" ? displayTime.format(new Date(time * 1000)) + " "+zoneLabel : String(time) },
      });
      removeChart = () => chart.remove();
      chart.priceScale("right").applyOptions({autoScale:restorePrice?savedView!.autoScale:preferences.autoScale,mode:preferences.logarithmic?PriceScaleMode.Logarithmic:PriceScaleMode.Normal});
      const candles = preferences.kind==="line" ? chart.addSeries(LineSeries,{color:preferences.upColor}) : preferences.kind==="bars" ? chart.addSeries(BarSeries,{upColor:preferences.upColor,downColor:preferences.downColor}) : chart.addSeries(CandlestickSeries, { upColor: preferences.upColor, downColor: preferences.downColor, borderVisible: false, wickUpColor: preferences.upColor, wickDownColor: preferences.downColor, priceFormat: { type: "price", precision: 4, minMove: 0.0001 } });
      const volume = preferences.volume?chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1):undefined;
      chart.panes()[0].setStretchFactor(100-preferences.volumeHeight);if(volume)chart.panes()[1].setStretchFactor(preferences.volumeHeight);
      let nextPane=volume?2:1;
      const studies=activeIndicators.flatMap(indicator=>{
        const parts=indicatorValues([],indicator,timeframe),pane=parts[0]?.pane?nextPane++:0;
        return parts.map((part,index)=>{const style=indicatorPlotStyle(indicator,part.key);
          const lastValueVisible=indicatorPriceScaleLabels(preferences,indicator);
          const labelOptions={title:lastValueVisible?part.label:"",lastValueVisible};
          return {indicator,index,key:part.key,label:part.label,histogram:part.histogram,series:part.histogram
          ?chart.addSeries(HistogramSeries,{visible:style.visible,...labelOptions,priceLineVisible:false},pane)
          :chart.addSeries(LineSeries,{visible:style.visible,color:style.color,lineWidth:style.width,lineStyle:style.style,...labelOptions,priceLineVisible:false,...(preferences.scalePriceOnly&&pane===0?{autoscaleInfoProvider:()=>null}:{}),...(indicator.type==="RSI"?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})},pane)};});
      });
      const snapSeries=crosshairTarget.startsWith("indicator:")?studies.find(study=>
        `indicator:${study.indicator.id}:${study.key}`===crosshairTarget&&study.series.options().visible)?.series:undefined;
      const indicatorAxis=studies.some(study=>study.indicator.type==='VWAP'&&(study.indicator.offset??0)>0)?chart.addSeries(LineSeries,{visible:false,priceLineVisible:false,lastValueVisible:false},0):undefined;
      let activeCrosshair:import("lightweight-charts").MouseEventParams<Time>|undefined;
      const studyPoints=new Map<typeof studies[number],readonly {time:number;value:number}[]>();
      const appliedPrecisions=new Map<typeof studies[number],number>();
      const studyPrecision=(study:typeof studies[number])=>{const format=candles.options().priceFormat;return study.indicator.output?.precision??('precision' in format?format.precision:2);};
      const bandOrder:Readonly<Record<string,number>>={upper:0,main:1,lower:2};
      const legendStudies=[...studies].sort((a,b)=>a.indicator.id===b.indicator.id&&a.indicator.type==="Bollinger"
        ? (bandOrder[a.key]??3)-(bandOrder[b.key]??3) : 0);
      const legendValues=new Map<typeof studies[number],HTMLSpanElement>();
      const cacheOwner=ownerKey??"";
      const vwapReadoutKeys=new Map(studies.filter(study=>study.indicator.type==="VWAP").map(study=>
        [study,JSON.stringify([ticker,timeframe,sessionKey,study.indicator,study.key])]));
      const flushVwap=()=>chartVwapCache.flush(cacheOwner);
      window.addEventListener("pagehide",flushVwap);
      const updateIndicatorLegend=()=>{
        const legend=indicatorLegend.current;if(!legend)return;
        const readoutBasis=vwapReadoutKeys.size?easternClock(Date.now()).date:"";
        for(const slot of legend.querySelectorAll<HTMLElement>("[data-indicator-readout]")){
          for(const study of legendStudies){
            if(study.indicator.type!==slot.dataset.indicatorReadout||study.indicator.output?.statusLineValues===false||!study.series.options().visible)continue;
            const points=studyPoints.get(study)??[],time=activeCrosshair?.time;
            const isVwap=study.indicator.type==="VWAP";
            const carried=isVwap&&typeof time==="number"&&displayed.get(time)?.carried===true;
            const index=indicatorReadoutIndex(points,time,carried);
            const newest=points.at(-1);
            const readoutId=vwapReadoutKeys.get(study);
            const readoutKey=readoutId?readoutBasis+readoutId:undefined;
            if(readoutKey&&newest&&historyBasisDate===readoutBasis)chartVwapCache.writeReadout(cacheOwner,readoutKey,{...newest,precision:studyPrecision(study)});
            const saved=readoutKey&&(!loaded||chartHalted||seedLoading||seedError)?chartVwapCache.readReadout(cacheOwner,readoutKey):undefined;
            const savedMatchesSlot=carried&&saved&&typeof time==="number"&&saved.time<=time
              &&easternClock(saved.time*1000).date===easternClock(time*1000).date;
            const fallback=saved&&(time===undefined||savedMatchesSlot)?saved.value:undefined;
            const pointValue=points[index]?.value;
            const value=pointValue??fallback;
            const precision=pointValue===undefined&&fallback!==undefined&&saved?saved.precision:studyPrecision(study);
            const {type,period}=study.indicator;
            const label=study.key==="main"&&(type==="EMA"||type==="SMA")?String(period):
              type==="Bollinger"&&study.key==="main"?"Middle":
              type==="Bollinger"&&study.key==="upper"?"Upper":
              type==="Bollinger"&&study.key==="lower"?"Lower":
              type==="VWAP"&&study.key==="main"?"":study.label;
            let span=legendValues.get(study);
            if(!span){
              span=document.createElement("span");
              span.dataset.indicatorValue=study.indicator.id+":"+study.key;
              legendValues.set(study,span);
              slot.append(span);
            }
            const text=(label?label+": ":"")+(typeof value==="number"&&Number.isFinite(value)?value.toFixed(precision):"—");
            if(span.textContent!==text)span.textContent=text;
            span.style.color=study.histogram&&value!==undefined
              ?indicatorHistogramColor(study.indicator,value,points[Math.max(0,index-1)]?.value??value,preferences.upColor,preferences.downColor)
              :indicatorPlotStyle(study.indicator,study.key).color;
          }
        }
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
      let chartHalted=false,haltStatusAt=0,lastGuidePrice:number|null=null;
      const bars = new Map<number, Candle>(restore?.bars.map(bar=>[bar.time,bar]));
      const queued = new Map<number, Candle>();
      const calculationHistory=new ChartCalculationHistory(ticker,abort.signal,()=>easternClock(Date.now()).date,sharedChartFetch);
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
        void sharedChartFetch('/api/charts/calendar?year='+year,{credentials:'same-origin',signal:abort.signal,cache:'no-store'}).then(async response=>{
          if(!response.ok)throw Error('calendar_year_unavailable');const value=readChartCalendarYear(await response.json(),year);
          calendar.merge(value);marketCalendar.current.merge(value);for(const context of calculationContexts.values())context.calendar.merge(value);
        }).catch(()=>{if(!abort.signal.aborted){calendarYearFailures.set(year,Date.now());while(calendarYearFailures.size>8)calendarYearFailures.delete(calendarYearFailures.keys().next().value!);}}).finally(()=>{pendingCalendarYears.delete(year);if(!disposed)writeAll(false);});
        return true;
      };
      const pendingSeeds=new Set<string>(),seedFailures=new Map<string,number>(),seedMomentAttempts=new Map<string,number>();
      let initialViewReady = false, viewSaveTimer: ReturnType<typeof setTimeout> | undefined;
      let indicatorsReady = !useRecentHistory || !studies.length;
      let warmupTimer: ReturnType<typeof setTimeout> | undefined;
      let loaded = false, loading = false, reloadAfter = false, connected = false, loadingOlder = false;
      let nextBefore: number | null = restore?.nextBefore??null, userPanned = false;
      const scheduleView = () => { clearTimeout(viewSaveTimer); viewSaveTimer=setTimeout(saveView,250); };
      const markPan = () => {userPanned=true;scheduleView();};
      element!.addEventListener("wheel",markPan,{passive:true});element!.addEventListener("pointerdown",markPan);element!.addEventListener("pointerup",scheduleView);
      window.addEventListener("pagehide",saveView);
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
        if(event.point&&event.time!==undefined&&event.paneIndex===0&&crosshairTarget!=="normal"&&crosshairTarget!=="nearest"){
          const indicator=snapSeries?event.seriesData.get(snapSeries):undefined;
          const candle=event.seriesData.get(candles);
          const price=indicator&&"value" in indicator?indicator.value:
            candle&&"close" in candle?candle.close:candle&&"value" in candle?candle.value:undefined;
          if(typeof price==="number"&&Number.isFinite(price))chart.setCrosshairPosition(price,event.time,candles);
        }
        activeCrosshair=event.point&&event.time!==undefined?event:undefined;updateIndicatorLegend();updateDateVisibility();
        if (!crosshairDetails.current) return;
        const bar = typeof event.time === "number" ? displayed.get(event.time) : undefined;
        crosshairDetails.current.textContent = bar ? `${displayTime.format(new Date(bar.time * 1000))} ${zoneLabel} · ${bar.carried ? `Carried-forward price $${bar.close.toFixed(bar.close < 1 ? 4 : 2)} · No candle returned` : `O ${bar.open} H ${bar.high} L ${bar.low} C ${bar.close} · Vol ${bar.volume.toLocaleString()}`}` : "";
      });
      const dateFormat = new Intl.DateTimeFormat("en-US",{timeZone:preferences.timezone,month:"short",day:"numeric"});
      const updateDates = () => {
        const axis=dateAxis.current,range=chart.timeScale().getVisibleLogicalRange();
        const right=Math.max(0,element!.clientWidth-chart.timeScale().width());
        if(axis)axis.style.right=`${right}px`;if(indicatorLegend.current)indicatorLegend.current.style.right=`${right}px`;
        const firstTime = timeframe === "1D" ? undefined : firstVisibleChartTime(displayPoints, range);
        if (!axis || firstTime === undefined) { axis?.replaceChildren(); return; }
        const label = document.createElement("span");
        label.textContent = dateFormat.format(firstTime * 1000);
        label.dataset.chartDate = "";
        Object.assign(label.style, { position: "absolute", left: "0px", top: "2px", padding: "0 5px",
          background: dark ? "#101722" : "#fff", whiteSpace: "nowrap", fontSize: "11px", color: dark ? "#c7d2df" : "#354358" });
        axis.replaceChildren(label);
        updateDateVisibility();
      };
      const renderPriceGuide=()=>{
        if(!chartHalted&&lastGuidePrice===null){if(livePrice)candles.removePriceLine(livePrice);livePrice=undefined;return;}
        const price=lastGuidePrice??displayPoints.at(-1)?.close;
        if(!Number.isFinite(price)||!price||price<=0)return;
        const options={price,color:chartHalted?"#d32f2f":"#f39c12",title:chartHalted?"HALTED":"",axisLabelColor:chartHalted?"#d32f2f":"",axisLabelTextColor:chartHalted?"#ffffff":""};
        if(livePrice)livePrice.applyOptions(options);
        else livePrice=candles.createPriceLine({...options,lineWidth:1,lineStyle:2,axisLabelVisible:true});
      };
      const seedFor=(indicator:typeof preferences.indicators[number],actual:Candle[],calculationFrame:ChartTimeframe=timeframe):VwapSeed|undefined=>{
        if(!actual.length||calculationFrame==='1D'&&indicator.hideOnDaily)return undefined;
        const basisDate=easternClock(Date.now()).date;
        if(historyBasisDate!==basisDate){seedError=true;return undefined;}
        const query=new URLSearchParams({symbol:ticker,timeframe:calculationFrame,anchor:indicator.anchor??'Session',before:String(actual[0].time),premarket:preferences.premarket?'1':'0',regular:preferences.regular?'1':'0',postmarket:preferences.postmarket?'1':'0'}),request=parseVwapSeedRequest(query),key=basisDate+query.toString();
        const cachedEntry=chartVwapCache.readSeed(cacheOwner,key),cached=cachedEntry?.value,validCached=cached&&validVwapSeed(cached,request,basisDate)?cached:undefined;
        const expired=validCached&&cachedEntry&&Date.now()-cachedEntry.at>=300_000;
        const needsMoments=indicator.vwapBands?.mode==='Standard deviation'&&indicator.vwapBands.levels.some(level=>level.enabled);
        const missingMoments=validCached&&validCached.volume>0&&needsMoments&&!validCached.moments;
        if(validCached&&!expired&&(!missingMoments||Date.now()-(seedMomentAttempts.get(key)??0)<30_000))return validCached;
        if(Date.now()-(seedFailures.get(key)??0)<30_000){if(!validCached)seedError=true;return validCached;}
        if(!validCached)seedLoading=true;
        if(!pendingSeeds.has(key)){
          if(missingMoments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
          pendingSeeds.add(key);
          void readChartVwapSeed('/api/charts/vwap-seed?'+query.toString(),abort.signal,async response=>{
            if(!response.ok)throw Error();const value=await response.json();if(!validVwapSeed(value,request,basisDate))throw Error();
            if(needsMoments&&value.volume>0&&!value.moments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
            chartVwapCache.writeSeed(cacheOwner,key,value);
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
        displayed = new Map(data.map(bar => [bar.time, bar]));
        const defaultView = defaultChartView(timeframe, chart.timeScale().width(), data.length);
        const previousCount = candles.data().length;
        const range = chart.timeScale().getVisibleLogicalRange();
        calculationView=initial?null:range;
        candles.setData(data.map(point));
        renderPriceGuide();
        if(initial&&!(restorePrice?savedView!.autoScale:preferences.autoScale)&&data.length){const recent=data.slice(-defaultView.visibleBars),low=Math.min(...recent.map(b=>b.low)),high=Math.max(...recent.map(b=>b.high)),margin=Math.max((high-low)*0.05,high*0.01,0.0001);chart.priceScale("right").setVisibleRange(restore?.priceRange??{from:Math.max(0.0001,low-margin),to:high+margin});}
        volume?.setData(data.map(volumePoint));
        for(const study of indicatorsReady ? studies : []){
          const part=study.indicator.type==='VWAP'?{points:[]}:indicatorValues(actual,study.indicator,timeframe)[study.index];
          const points=study.indicator.type==='VWAP'?vwapPoints(study.indicator,actual,data,study.index):part.points;
          studyPoints.set(study,points);
          study.series.setData(points.map((point,index)=>({...point,time:point.time as Stamp,...(study.histogram?{color:indicatorHistogramColor(study.indicator,point.value,part.points[Math.max(0,index-1)].value,preferences.upColor,preferences.downColor)}:{})})));
        }
        indicatorAxis?.setData([...futureIndicatorTimes].sort((a,b)=>a-b).map(time=>({time:time as Stamp})));
        updateStudyFormats();updateIndicatorLegend();
        updateBandFills();
        const hasVwapSnapshot=[...vwapReadoutKeys.values()].some(key=>chartVwapCache.readReadout(cacheOwner,historyBasisDate+key));
        if(calendarReady)setSessionMessage(vwapProblem|| (seedError&&!hasVwapSnapshot?'VWAP history could not load. Retrying shortly.':seedLoading&&!hasVwapSnapshot?'Loading VWAP history…':''));
        if(initial){
          const from=typeof restore?.range?.from==="number"&&data.length?Math.max(restore.range.from,data[0].time):null;
          const to=typeof restore?.range?.to==="number"&&data.length?Math.min(restore.range.to,data[data.length-1].time):null;
          const remembered=savedView?restoreChartRange(savedView,data.map(bar=>bar.time)):null;
          if(remembered)chart.timeScale().setVisibleLogicalRange(remembered);
          else if(restore?.logicalRange&&restore.axis.sessions===sessionKey&&restore.axis.first===data[0]?.time&&restore.axis.last===data.at(-1)?.time&&restore.axis.count===data.length)chart.timeScale().setVisibleLogicalRange(restore.logicalRange);
          else if(from!==null&&to!==null&&from<to)chart.timeScale().setVisibleRange({from:from as Stamp,to:to as Stamp});
          else chart.timeScale().setVisibleLogicalRange(defaultView.range);
        }
        else if (range) {
          const added = prepend && oldFirst !== undefined ? Math.max(0,data.findIndex(bar=>bar.time===oldFirst)) : range.to >= previousCount - 1 ? data.length - previousCount : 0;
          chart.timeScale().setVisibleLogicalRange({from:range.from + added,to:range.to + added});
        }
        updateDates();
      };
      const idleStatus=()=>!bars.size?"No candles for this symbol.":!displayPoints.length?"No candles in selected sessions.":"";
      let recentHistory = useRecentHistory;
      const loadHistory = async (initialRequest?: Promise<Response>) => {
        if (loading) { reloadAfter = true; return; }
        loading = true;
        // Every refresh after the first paint must finish any outstanding warm-up.
        const warmup = loaded && !indicatorsReady;
        try {
          let recent = !warmup && recentHistory && (!loaded || historyBasisDate === easternClock(Date.now()).date);
          const response = await (initialRequest ?? requestHistory(recent));
          if (!response.ok) throw Error(response.status === 429 ? "Chart requests are busy. Try again shortly." : "Candles unavailable. Try again.");
          let data = await response.json();
          if (disposed) return;
          if (recent && !visibleSessionBars(data.bars, preferences).length) {
            recentHistory = false;
            recent = false;
            const full = await requestHistory();
            if (!full.ok) throw Error("Candles unavailable. Try again.");
            data = await full.json();
            if (disposed) return;
          }
          if(!loaded&&savedView&&data.bars.length&&savedView.anchor.time<data.bars[0].time){
            const history=await calculationHistory.read(timeframe,savedView.anchor.time);
            if(disposed)return;
            recent = false;
            data.bars=history.bars;data.basisDate=history.basisDate;marketCalendar.current=history.calendar;
            data.nextBefore=history.bars.length?history.bars[0].time*1000-1:data.nextBefore;
          }
          const basisDate=easternClock(Date.now()).date;
          if(data.basisDate!==basisDate)throw Error("Adjusted candle history could not load. Try again.");
          const newBasis=historyBasisDate!==basisDate;historyBasisDate=basisDate;
          marketCalendar.current.merge(data.calendar);if(Array.isArray(data.calendars))for(const value of data.calendars)marketCalendar.current.merge(value);
          const initial = !loaded;
          if (!recent) indicatorsReady = true;
          if (warmup) recentHistory = false;
          if(initial&&(!restore||!restore.bars.length)||newBasis&&!initial)bars.clear();
          if(warmup||initial&&(!restore||!restore.bars.length)||newBasis&&!initial){nextBefore=data.nextBefore??null;}
          for (const bar of data.bars as Candle[]) bars.set(bar.time, bar);
          for (const bar of queued.values()) bars.set(bar.time, bar);
          queued.clear(); loaded = true;
          const latest = [...bars.values()].reduce<Candle|undefined>((last,bar)=>!last||bar.time>last.time?bar:last,undefined);
          candles.applyOptions({ priceFormat: { type: "price", precision: latest && latest.close < 1 ? 4 : 2, minMove: latest && latest.close < 1 ? 0.0001 : 0.01 } });
          writeAll(initial, warmup); initialViewReady=true; setError(null);
          if (initial && !indicatorsReady) {
            // Yield to the browser before starting the full indicator history request.
            warmupTimer = setTimeout(() => { if (!disposed && !loading && !indicatorsReady) void loadHistory(); }, 0);
          }
          setStatus(idleStatus());
        } catch (failure) {
          if (!disposed && warmup) setSessionMessage("Indicator history could not load. Retrying shortly.");
          else if (!disposed) setError(failure instanceof Error ? failure.message : "Candles unavailable.");
        }
        finally { loading = false; if (reloadAfter && !disposed) { reloadAfter = false; void loadHistory(); } }
      };
      const loadOlder = async () => {
        if(disposed||loading||loadingOlder||!indicatorsReady||nextBefore===null)return;
        loadingOlder=true;userPanned=false;setHistoryMessage("Loading older candles…");
        try {
          const response=await sharedChartFetch(`/api/screeners/charts/bars?history=1&symbol=${encodeURIComponent(ticker)}&daily=${timeframe==="1D"?"1":"0"}&before=${nextBefore}`,{signal:abort.signal,credentials:"same-origin"});
          if(!response.ok)throw Error("Older candles could not load. Pan left again to retry.");
          const page=await response.json();if(disposed)return;if(page.basisDate!==historyBasisDate||historyBasisDate!==easternClock(Date.now()).date)throw Error("Price adjustments changed. Reload the chart.");marketCalendar.current.merge(page.calendar);if(Array.isArray(page.calendars))for(const value of page.calendars)marketCalendar.current.merge(value);
          const combined=new Map(bars);for(const bar of page.bars as Candle[])if(!combined.has(bar.time))combined.set(bar.time,bar);
          const projected=displayCandles(aggregateCandles(combined.values(),timeframe,regularOnly),timeframe);
          if(projected.length>80_000){nextBefore=null;setHistoryMessage("Chart history limit reached. Use a larger timeframe for older dates.");}
          else {setHistoryMessage("");bars.clear();for(const [time,bar] of combined)bars.set(time,bar);nextBefore=page.nextBefore??null;writeAll(false,true);if(!page.bars.length)setHistoryMessage("No candles in that period. Pan left again to continue.");}

        }catch(failure){if(!disposed)setHistoryMessage(failure instanceof Error?failure.message:"Older candles could not load.");}
        finally{loadingOlder=false;}
      };
      function saveView(){
        if(!loaded||!initialViewReady||!ownerKey||!viewId||!displayPoints.length)return;
        const logicalRange=chart.timeScale().getVisibleLogicalRange(),range=chart.timeScale().getVisibleRange();
        if(!logicalRange||!range||typeof range.from!=="number"||typeof range.to!=="number")return;
        const index=Math.max(0,Math.min(displayPoints.length-1,Math.floor(logicalRange.from)));
        chartViews.write(ownerKey,viewWorkspace,viewId,{symbol:ticker,timeframe,sessions:sessionKey,basisDate:historyBasisDate,
          range:{from:range.from,to:range.to},logicalRange:{from:logicalRange.from,to:logicalRange.to},
          axis:{first:displayPoints[0].time,last:displayPoints.at(-1)!.time,count:displayPoints.length,sessions:sessionKey},
          anchor:{time:displayPoints[index].time,offset:logicalRange.from-index},priceRange:chart.priceScale("right").getVisibleRange(),
          autoScale:chart.priceScale("right").options().autoScale,preferenceAutoScale:preferences.autoScale,logarithmic:preferences.logarithmic});
      }
      chart.timeScale().subscribeVisibleLogicalRangeChange(range=>{
        updateDates();if(range&&range.from<40&&userPanned&&!loadingOlder)void loadOlder();
        if(range&&loaded&&studies.some(study=>study.indicator.type==='VWAP'&&((study.indicator.calculationTimeframe??timeframe)==='1D')!==(timeframe==='1D'))){
          const key=range.from.toFixed(2)+':'+range.to.toFixed(2);
          if(key!==calculationViewKey){calculationViewKey=key;clearTimeout(calculationViewTimer);calculationViewTimer=setTimeout(()=>{if(!disposed&&loaded)writeAll(false);},50);}
        }
      });
      let lastBarReceivedAt = Date.now(), lastRecoveryAt = 0;
      source = sharedChartStream(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}`);
      source.addEventListener("status", event => {
        if (disposed) return;
        const state = JSON.parse((event as MessageEvent).data).state;
        if(state!=="connected"&&!chartHalted&&livePrice){candles.removePriceLine(livePrice);livePrice=undefined;lastGuidePrice=null;}
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
        lastGuidePrice=message.price;renderPriceGuide();
      });
      source.addEventListener("trading-status",event=>{
        if(disposed)return;
        const message=JSON.parse((event as MessageEvent).data) as {symbol:string;available:boolean;status?:{symbol:string;halted:boolean;observedAt:string}|null};
        if(!message.available||message.symbol!==ticker||message.status?.symbol!==ticker||typeof message.status.halted!=="boolean")return;
        const at=Date.parse(message.status.observedAt);
        if(!Number.isFinite(at)||at<haltStatusAt)return;
        haltStatusAt=at;chartHalted=message.status.halted;renderPriceGuide();updateIndicatorLegend();
      });
      source.addEventListener("bar", event => {
        if (disposed) return;
        const message = JSON.parse((event as MessageEvent).data) as { bar: Candle; daily: boolean };
        if (message.daily !== (timeframe === "1D")) return;
        const bar = message.bar;
        lastBarReceivedAt = Date.now();
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
            for (const study of indicatorsReady ? studies : []) {
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
        auxiliarySource=sharedChartStream(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}&daily=${daily?'1':'0'}`);
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
      source.onerror = () => {
        if(disposed)return;
        connected=false;
        if(livePrice&&!chartHalted){candles.removePriceLine(livePrice);livePrice=undefined;lastGuidePrice=null;}
        if(loaded)setStatus("Reconnecting…");
      };
      let confirmationMinute=Math.floor(Date.now()/60_000);
      const confirmationTimer=setInterval(()=>{const minute=Math.floor(Date.now()/60_000);if(minute!==confirmationMinute){confirmationMinute=minute;if(!disposed&&loaded&&studies.some(study=>study.indicator.type==='VWAP'&&study.indicator.calculationTimeframe&&study.indicator.calculationTimeframe!==timeframe))writeAll(false);}},1000);
      const recoverHistory = () => {
        if(disposed||document.hidden)return;
        source?.reconnectIfClosed();
        auxiliarySource?.reconnectIfClosed();
        const now=Date.now(), clock=easternClock(now);
        const day=new Date(clock.date+"T12:00:00Z").getUTCDay();
        const tradingHours=day!==0&&day!==6&&clock.minute>=240&&clock.minute<1200;
        const needsHistory=!loaded||historyBasisDate!==clock.date||
          tradingHours&&!chartHalted&&(!connected||now-lastBarReceivedAt>=120_000);
        if((needsHistory || !indicatorsReady)&&!loading&&now-lastRecoveryAt>=60_000){
          lastRecoveryAt=now;
          void loadHistory();
        }
      };
      const gapTimer=setInterval(()=>{
        recoverHistory();
        if(!disposed&&loaded&&connected&&!loading&&timeframe!=="1D"&&historyBasisDate===easternClock(Date.now()).date)writeAll(false);
      },60_000);
      document.addEventListener("visibilitychange",recoverHistory);
      window.addEventListener("online",recoverHistory);
      window.addEventListener("pageshow",recoverHistory);
      const remove = removeChart;
      removeChart = () => { document.removeEventListener("visibilitychange",recoverHistory);window.removeEventListener("online",recoverHistory);window.removeEventListener("pageshow",recoverHistory);saveView();flushVwap();window.removeEventListener("pagehide",flushVwap);clearTimeout(viewSaveTimer);window.removeEventListener("pagehide",saveView);element!.removeEventListener("pointerup",scheduleView);clearInterval(gapTimer);clearInterval(confirmationTimer);clearTimeout(calculationViewTimer);clearTimeout(warmupTimer);if(loaded)memory.current={key:cacheKey,basisDate:historyBasisDate,bars:[...bars.values()],nextBefore,range:chart.timeScale().getVisibleRange(),logicalRange:chart.timeScale().getVisibleLogicalRange(),axis:{first:displayPoints[0]?.time,last:displayPoints.at(-1)?.time,count:displayPoints.length,sessions:sessionKey},priceRange:chart.priceScale("right").getVisibleRange()}; element!.removeEventListener("wheel",markPan);element!.removeEventListener("pointerdown",markPan);dateAxis.current?.replaceChildren();indicatorLegend.current?.querySelectorAll("[data-indicator-readout]").forEach(slot=>slot.replaceChildren());remove?.(); };
      updateIndicatorLegend();
      await loadHistory(initialHistory);
    }
    void start().catch(() => { abort.abort(); if (!disposed) setError("Chart could not load. Try again."); });
    return () => { disposed = true; abort.abort(); source?.close(); auxiliarySource?.close(); removeChart?.(); };
  }, [ticker, timeframe, regularOnly, attempt, dark, preferences, ready, ownerKey, viewId, viewWorkspace, activeIndicators, crosshairTarget]);

  const compactToolbarHeight = 40;
  const mainToolbar = viewWorkspace === "main";
  const multiviewButton = onOpenMultiview && (
    <IconButton size="small" aria-label="Open Multiview for this chart view" title="Multiview" aria-haspopup="dialog" disabled={!ready}
      onClick={onOpenMultiview} sx={{ width: compact ? 44 : 34, height: compact ? compactToolbarHeight : 34, flexShrink: 0 }}>
      <GridViewOutlined fontSize="small" />
    </IconButton>
  );
  return <Box data-alpaca-chart={ticker} sx={[{ borderRadius: 0, height: "100%", position: "relative", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {compact ? <Stack data-chart-compact-toolbar direction="row" sx={{ alignItems: "center", px: 0.5, height: compactToolbarHeight, flexShrink: 0, gap: 0.5 }}>
      <Box data-chart-identity sx={{ flex: 1, minWidth: 0 }}>{compactIdentity ?? <Typography sx={{ color: dark ? "warning.main" : "#354358", fontSize: 12, fontWeight: 700 }}>{ticker}</Typography>}</Box>
      {status ? <Typography role="status" sx={compactIdentity ? { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" } : { fontSize: 10, color: "text.secondary", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: 100 }}>{status}</Typography> : null}
      <Button aria-label={`${ticker} timeframe ${timeframe}`} aria-haspopup="menu" onClick={event => setFrameAnchor(event.currentTarget)} disabled={!ready} sx={{ minWidth: 44, height: compactToolbarHeight, px: 0.5 }}>{timeframe}</Button>
      <IconButton aria-label={`${ticker} chart options`} aria-haspopup="menu" onClick={event => setMenuAnchor(event.currentTarget)} sx={{ width: 44, height: compactToolbarHeight }}><SettingsOutlined fontSize="small" /></IconButton>
      {multiviewButton}
      {closeAction}
    </Stack> : <>    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25, px: 0.5, minHeight: 27, flexWrap: "wrap" }}>
      <Typography sx={{ color:dark?"warning.main":"#354358",fontSize: 11, fontWeight: 700, mr: 0.5 }}>{ticker}</Typography>
      {CHART_TIMEFRAMES.map(value => <Button key={value} size="small" aria-label={`${ticker} ${value} candles`} aria-pressed={timeframe === value} disabled={!ready || disabledTimeframes.includes(value)} onClick={() => {if(onTimeframeChange)onTimeframeChange(value);else setActiveTimeframe(value);}} sx={{ minWidth: {xs:40,md:26}, minHeight:{xs:44,md:27}, p: {xs:"4px 6px",md:"2px 4px"}, fontSize: {xs:14,md:10}, bgcolor: timeframe === value ? "action.selected" : undefined }}>{value}</Button>)}
      <Button size="small" disabled={!ready} onClick={()=>openIndicators()} sx={{minHeight:mainToolbar?34:44,minWidth:0,px:0.75,textTransform:"none"}}>Indicators</Button>
      <IconButton size="small" disabled={!ready} aria-label="Chart settings" onClick={()=>openPreferences("settings")} sx={{minWidth:44,minHeight:mainToolbar?34:44}}><SettingsOutlined fontSize="small"/></IconButton>
      {multiviewButton}
      {actions}
      {!mainToolbar && closeAction}
      {status?<Typography role="status" sx={{ ml: "auto", fontSize: 10, color: "text.secondary" }}>{status}</Typography>:null}
      {mainToolbar && closeAction && <Box sx={{ ml: "auto" }}>{closeAction}</Box>}
    </Stack>
</>}
    {compact ? <><Menu anchorEl={frameAnchor} open={Boolean(frameAnchor)} onClose={() => setFrameAnchor(null)}>
      {CHART_TIMEFRAMES.map(value => <MenuItem key={value} selected={timeframe === value} disabled={!ready || disabledTimeframes.includes(value)} onClick={() => { if (onTimeframeChange) onTimeframeChange(value); else setActiveTimeframe(value); setFrameAnchor(null); }}>{value}</MenuItem>)}
    </Menu>
    <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
      <MenuItem disabled={!ready} onClick={() => { setFrameAnchor(menuAnchor); setMenuAnchor(null); }}>Timeframe</MenuItem>
      <MenuItem disabled={!ready} onClick={() => { openIndicators(); setMenuAnchor(null); }}>Indicators</MenuItem>
      <MenuItem disabled={!ready} onClick={() => { openPreferences("settings"); setMenuAnchor(null); }}>Appearance</MenuItem>
    </Menu>
    </> : null}
    {!ready&&message?<Typography role="alert" sx={{px:1,fontSize:12}}>{message}</Typography>:null}
    {sessionMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{sessionMessage}</Typography>:null}
    {historyMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{historyMessage}</Typography>:null}
    {error ? <Stack role="alert" direction="row" sx={{ alignItems: "center", px: 1, gap: 1 }}><Typography sx={{ fontSize: 12 }}>{error}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>Retry</Button></Stack> : null}
    <Box ref={crosshairDetails} data-chart-crosshair-details sx={{position:compact?"absolute":"static",top:compact?compactToolbarHeight:undefined,left:0,right:0,zIndex:2,pointerEvents:"none",minHeight:compact?0:16,px:0.5,fontSize:10,color:"text.secondary",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} />
    <Box sx={{flex:1,minHeight:0,minWidth:0,position:"relative",isolation:"isolate"}}><Box ref={container} sx={{position:"absolute",inset:0,zIndex:0}}/><Box ref={indicatorLegend} data-chart-indicator-legend sx={{position:"absolute",zIndex:1,top:4,left:8,right:65,pointerEvents:"none",fontSize:11}}>
      {readoutTypes.map(type=><Box key={type} sx={{display:indicatorDisplay.hidden.has(type)?"none":"flex",alignItems:"center",gap:0.6,minWidth:0}}>
        <Button size="small" aria-haspopup="menu" aria-expanded={indicatorMenu?.type===type} aria-label={`${indicatorName(type)} options`}
          onClick={event=>setIndicatorMenu({anchor:event.currentTarget,type})}
          sx={{pointerEvents:"auto",color:dark?"#e3e8ef":"#243246",minWidth:0,minHeight:compact?28:20,px:0.4,py:0,fontSize:11,lineHeight:1.25,fontWeight:700}}>
          {indicatorName(type)}
        </Button>
        <Box data-indicator-readout={type} sx={{display:"flex",gap:0.75,flexWrap:"wrap",minWidth:0,fontVariantNumeric:"tabular-nums","& span":{whiteSpace:"nowrap"}}}/>
      </Box>)}
    </Box><Box ref={dateAxis} data-chart-date-axis sx={{position:"absolute",zIndex:2,bottom:0,left:0,right:65,height:26,pointerEvents:"none",overflow:"hidden"}}/></Box>
    <Menu anchorEl={indicatorMenu?.anchor} open={Boolean(indicatorMenu)} onClose={()=>setIndicatorMenu(null)}>
      {indicatorMenu?[
        <MenuItem key="settings" onClick={()=>{openIndicators(indicatorMenu.type);setIndicatorMenu(null);}}>Settings</MenuItem>,
        <MenuItem key="hide" onClick={()=>{changeIndicatorDisplay(indicatorMenu.type,"hidden",true);setIndicatorMenu(null);}}>Hide details</MenuItem>,
        <MenuItem key="off" onClick={()=>{changeIndicatorDisplay(indicatorMenu.type,"enabled",false);setIndicatorMenu(null);}}>Turn off</MenuItem>,
      ]:null}
    </Menu>
    {preferencesOpened ? <Suspense fallback={null}><ChartPreferencesPanel panel={panel} onClose={()=>setPanel(null)} preferences={preferences} crosshairLines={crosshairLines} onChange={changePreferences} message={message} initialIndicator={initialIndicator} indicatorDisplay={indicatorDisplay} onIndicatorDisplayChange={changeIndicatorDisplay}/></Suspense> : null}
  </Box>;
}
