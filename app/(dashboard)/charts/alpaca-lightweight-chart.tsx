"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import {ChartPreferencesPanel} from "./chart-preferences-panel";
import {useChartPreferences} from "./use-chart-preferences";
import {indicatorValues,isVisibleSession,visibleSessionBars} from "@/src/modules/scanner/alpaca/chart-indicators";
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
  const memory=useRef<{key:string;bars:Candle[];nextBefore:number|null;range:import("lightweight-charts").IRange<Time>|null;priceRange:import("lightweight-charts").IRange<number>|null}|null>(null);
  const container = useRef<HTMLDivElement>(null);
  const dateAxis = useRef<HTMLDivElement>(null);
  const [historyMessage,setHistoryMessage] = useState("");
  const crosshairDetails = useRef<HTMLDivElement>(null);
  const [activeTimeframe,setActiveTimeframe]=useState<ChartTimeframe|null>(null);
  const timeframe=activeTimeframe??preferences.timeframe;
  if(ready&&activeTimeframe===null)setActiveTimeframe(preferences.timeframe);
  const changePreferences=(next:typeof preferences)=>{if(next.timeframe!==preferences.timeframe)setActiveTimeframe(next.timeframe);change(next);};
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading candles…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const element = container.current;
    if (!element || !ready) return;
    const cacheKey=ticker+":"+timeframe,restore=memory.current?.key===ticker+":"+timeframe?memory.current:null;
    const displayTime=new Intl.DateTimeFormat("en-US",{timeZone:preferences.timezone,month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});
    const zoneLabel=preferences.timezone==="UTC"?"UTC":"ET";
    let disposed = false, source: EventSource | undefined, removeChart: (() => void) | undefined;
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
      const studies=preferences.indicators.flatMap(indicator=>{const parts=indicatorValues([],indicator),pane=parts[0]?.pane?nextPane++:0;return parts.map((part,index)=>({indicator,index,histogram:part.histogram,series:part.histogram?chart.addSeries(HistogramSeries,{priceLineVisible:false,lastValueVisible:false},pane):chart.addSeries(LineSeries,{color:index===1?"#42a5f5":indicator.color,lineWidth:indicator.width,title:part.label,priceLineVisible:false,lastValueVisible:false,...(indicator.type==="RSI"?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})},pane)}));});
      const lowerPanes=chart.panes().slice(volume?2:1),lowerSpace=Math.min(50,lowerPanes.length*20);
      chart.panes()[0].setStretchFactor(100-(volume?preferences.volumeHeight:0)-lowerSpace);
      for(const pane of lowerPanes)pane.setStretchFactor(lowerSpace/lowerPanes.length);
      let livePrice:ReturnType<typeof candles.createPriceLine>|undefined,livePriceAt=0;
      const bars = new Map<number, Candle>(restore?.bars.map(bar=>[bar.time,bar]));
      const queued = new Map<number, Candle>();
      let loaded = false, loading = false, reloadAfter = false, connected = false, loadingOlder = false;
      let nextBefore: number | null = restore?.nextBefore??null, userPanned = false;
      const markPan = () => {userPanned=true;};
      element!.addEventListener("wheel",markPan,{passive:true});element!.addEventListener("pointerdown",markPan);
      type Stamp = import("lightweight-charts").UTCTimestamp;
      const point = (bar: DisplayCandle) => ({ ...bar, value:bar.close,time: bar.time as Stamp });
      const volumePoint = (bar: DisplayCandle) => bar.carried ? { time: bar.time as Stamp } : ({ time: bar.time as Stamp, value: bar.volume, color: bar.close >= bar.open ? preferences.upColor+"80" : preferences.downColor+"80" });
      let displayed = new Map<number, DisplayCandle>();
      chart.subscribeCrosshairMove(event => {
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
        if(!axis||!range||!displayPoints.length||timeframe==="1D"){axis?.replaceChildren();return;}
        const entries=visibleChartDates(displayPoints,range,dayStarts,index=>chart.timeScale().logicalToCoordinate(index as import("lightweight-charts").Logical));
        const nodes=entries.map(entry=>{const label=document.createElement("span");label.textContent=dateFormat.format(entry.time*1000);label.dataset.chartDate="";Object.assign(label.style,{position:"absolute",left:`${entry.left}px`,top:"2px",padding:"0 5px",background:dark?"#101722":"#fff",whiteSpace:"nowrap",fontSize:"11px",color:dark?"#c7d2df":"#354358"});return label;});
        axis.replaceChildren(...nodes);
      };
      const writeAll = (initial: boolean, prepend = false) => {
        const actual = aggregateCandles(timeframe==="1D"?bars.values():visibleSessionBars([...bars.values()],preferences), timeframe);
        const data = displayCandles(actual, timeframe, connected ? candleBucket(Math.floor(Date.now() / 1000) - 60, timeframe) : undefined).filter(bar=>timeframe==="1D"||!bar.carried||isVisibleSession(bar.time,preferences));
        const oldFirst = displayPoints[0]?.time;
        displayPoints = data;
        dayStarts=[];let previousDate="";
        for(let index=0;index<data.length;index++){const key=dateKey.format(data[index].time*1000);if(key!==previousDate){dayStarts.push({index,key});previousDate=key;}}
        displayed = new Map(data.map(bar => [bar.time, bar]));
        const previousCount = candles.data().length;
        const range = chart.timeScale().getVisibleLogicalRange();
        candles.setData(data.map(point));
        if(initial&&!preferences.autoScale&&data.length){const recent=data.slice(-(timeframe==="1m"?240:100)),low=Math.min(...recent.map(b=>b.low)),high=Math.max(...recent.map(b=>b.high)),margin=Math.max((high-low)*0.05,high*0.01,0.0001);chart.priceScale("right").setVisibleRange(restore?.priceRange??{from:Math.max(0.0001,low-margin),to:high+margin});}
        volume?.setData(data.map(volumePoint));
        for(const study of studies){const part=indicatorValues(actual,study.indicator)[study.index];study.series.setData(part.points.map(point=>({...point,time:point.time as Stamp,...(study.histogram?{color:point.value>=0?preferences.upColor:preferences.downColor}:{})})));}
        if(initial){
          const from=typeof restore?.range?.from==="number"&&data.length?Math.max(restore.range.from,data[0].time):null;
          const to=typeof restore?.range?.to==="number"&&data.length?Math.min(restore.range.to,data[data.length-1].time):null;
          if(from!==null&&to!==null&&from<to)chart.timeScale().setVisibleRange({from:from as Stamp,to:to as Stamp});
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
          const initial = !loaded;
          if(initial&&!restore)bars.clear();
          if(initial&&!restore){nextBefore=data.nextBefore??null;}
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
          const page=await response.json();if(disposed)return;
          const combined=new Map(bars);for(const bar of page.bars as Candle[])if(!combined.has(bar.time))combined.set(bar.time,bar);
          const projected=displayCandles(aggregateCandles(combined.values(),timeframe),timeframe);
          if(projected.length>80_000){nextBefore=null;setHistoryMessage("Chart history limit reached. Use a larger timeframe for older dates.");}
          else {setHistoryMessage("");bars.clear();for(const [time,bar] of combined)bars.set(time,bar);nextBefore=page.nextBefore??null;writeAll(false,true);if(!page.bars.length)setHistoryMessage("No candles in that period. Pan left again to continue.");}

        }catch(failure){if(!disposed)setHistoryMessage(failure instanceof Error?failure.message:"Older candles could not load.");}
        finally{loadingOlder=false;}
      };
      chart.timeScale().subscribeVisibleLogicalRangeChange(range=>{updateDates();if(range&&range.from<40&&userPanned&&!loadingOlder)void loadOlder();});
      source = new EventSource(`/api/screeners/charts/stream?symbol=${encodeURIComponent(ticker)}&daily=${timeframe === "1D" ? "1" : "0"}`);
      source.addEventListener("status", event => {
        if (disposed) return;
        const state = JSON.parse((event as MessageEvent).data).state;
        if(state!=="connected"&&livePrice){candles.removePriceLine(livePrice);livePrice=undefined;}
        const wasConnected = connected; connected = state === "connected";
        if (connected && !wasConnected && loaded) void loadHistory();
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
        if (!loaded) return;
        bars.set(bar.time, bar);

        const bucket = candleBucket(bar.time, timeframe);
        const last = displayPoints.at(-1);
        if (last && bucket === last.time) {
          // The active candle moves with trades; avoid replacing the full chart per tick.
          const inputs = timeframe === "1D" ? [...bars.values()] : visibleSessionBars([...bars.values()], preferences);
          const current = aggregateCandles(inputs.filter(value => candleBucket(value.time, timeframe) === bucket), timeframe).at(-1);
          if (current) {
            const updated = { ...current, carried: false };
            displayPoints[displayPoints.length - 1] = updated; displayed.set(bucket, updated);
            candles.update(point(updated)); volume?.update(volumePoint(updated));
            const actual = studies.length ? aggregateCandles(inputs, timeframe) : [];
            for (const study of studies) {
              const part = indicatorValues(actual, study.indicator)[study.index];
              const latest = part.points.at(-1);
              if (latest) study.series.update({ ...latest, time: latest.time as Stamp, ...(study.histogram ? {color:latest.value>=0?preferences.upColor:preferences.downColor} : {}) });
            }
          }
        } else {
          // New buckets and corrected old bars must also reconcile carried positions.
          writeAll(false);
        }
      });
      source.onerror = () => { if(livePrice){candles.removePriceLine(livePrice);livePrice=undefined;} if (!disposed && loaded) setStatus("Reconnecting…"); };
      const gapTimer = setInterval(() => { if (!disposed && loaded && connected && timeframe !== "1D") writeAll(false); }, 60_000);
      const remove = removeChart;
      removeChart = () => { clearInterval(gapTimer);if(loaded)memory.current={key:cacheKey,bars:[...bars.values()],nextBefore,range:chart.timeScale().getVisibleRange(),priceRange:chart.priceScale("right").getVisibleRange()}; element!.removeEventListener("wheel",markPan);element!.removeEventListener("pointerdown",markPan);dateAxis.current?.replaceChildren();remove?.(); };
      await loadHistory();
    }
    void start().catch(() => { if (!disposed) setError("Chart could not load. Try again."); });
    return () => { disposed = true; abort.abort(); source?.close(); removeChart?.(); };
  }, [ticker, timeframe, attempt, dark, preferences, ready]);

  return <Box data-alpaca-chart={ticker} sx={[{ borderRadius: 0, height: "100%", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}>
    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25, px: 0.5, minHeight: 27, flexWrap: "wrap" }}>
      <Typography sx={{ fontSize: 11, fontWeight: 700, mr: 0.5 }}>{ticker}</Typography>
      {CHART_TIMEFRAMES.map(value => <Button key={value} size="small" aria-label={`${ticker} ${value} candles`} aria-pressed={timeframe === value} disabled={!ready} onClick={() => {setActiveTimeframe(value);changePreferences({...preferences,timeframe:value});}} sx={{ minWidth: {xs:40,md:26}, minHeight:{xs:44,md:27}, p: {xs:"4px 6px",md:"2px 4px"}, fontSize: {xs:14,md:10}, bgcolor: timeframe === value ? "action.selected" : undefined }}>{value}</Button>)}
      <Button size="small" disabled={!ready} onClick={()=>setPanel("indicators")} sx={{minHeight:44,minWidth:0,px:0.75,textTransform:"none"}}>Indicators</Button>
      <IconButton size="small" disabled={!ready} aria-label="Chart settings" onClick={()=>setPanel("settings")} sx={{minWidth:44,minHeight:44}}><SettingsOutlined fontSize="small"/></IconButton>
      {status?<Typography role="status" sx={{ ml: "auto", fontSize: 10, color: "text.secondary" }}>{status}</Typography>:null}
    </Stack>
    {!ready&&message?<Typography role="alert" sx={{px:1,fontSize:12}}>{message}</Typography>:null}
    {historyMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{historyMessage}</Typography>:null}
    {error ? <Stack role="alert" direction="row" sx={{ alignItems: "center", px: 1, gap: 1 }}><Typography sx={{ fontSize: 12 }}>{error}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>Retry</Button></Stack> : null}
    <Box ref={crosshairDetails} data-chart-crosshair-details sx={{minHeight:16,px:0.5,fontSize:10,color:"text.secondary",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}} />
    <Box sx={{flex:1,minHeight:0,minWidth:0,position:"relative",isolation:"isolate"}}><Box ref={container} sx={{position:"absolute",inset:0,zIndex:0}}/><Box ref={dateAxis} data-chart-date-axis sx={{position:"absolute",zIndex:2,bottom:0,left:0,right:65,height:26,pointerEvents:"none",overflow:"hidden"}}/></Box>
    <ChartPreferencesPanel panel={panel} onClose={()=>setPanel(null)} preferences={preferences} onChange={changePreferences} message={message}/>
  </Box>;
}
