"use client";
import {chartLogarithmic,setChartLogarithmic} from '@/src/modules/scanner/alpaca/chart-preferences';

import BusinessOutlined from "@mui/icons-material/BusinessOutlined";
import { ChartTickerField } from "./chart-ticker-field";
import { applyChartCorrection, parseChartCorrection, type ChartCorrection, type PremarketTradeTotals } from "@/src/modules/scanner/alpaca/chart-correction";
import { createChartPriceStyle } from "./chart-price-style";
import { useChartMarketData } from "./use-chart-market-data";
import { ChartIndicatorLegend } from "./chart-indicator-legend";
import { ChartVolumeProfiles, type VolumeProfileSnapshot } from "./chart-volume-profile";
import { chartPageCoverageStart, completedSwingBars, pivotHistoryStart, profileWindowsWithinCoverage, sessionProfileWindows, standardPivotLevels, visibleProfileWindow } from "@/src/modules/scanner/alpaca/chart-advanced-context";
import { observeIndicatorPaneLegends } from "./chart-indicator-pane-layout";
import { ChartDrawings } from "./chart-drawings";
import { ChartEvidenceZones } from "./chart-evidence-zones";
import { projectChartOverlay, type ChartOverlay } from "@/src/modules/market-data/chart-evidence/overlay";
import type { ChartEvidenceEvent, ResolvedChartEvidence } from "@/src/modules/market-data/chart-evidence/contracts";
import { candleIndexAtOrAfter } from "./chart-drawing-volume";
import { useDrawingControls } from "./chart-drawing-controls";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import useMediaQuery from "@mui/material/useMediaQuery";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import MenuBookOutlined from "@mui/icons-material/MenuBookOutlined";
import SettingsOutlined from "@mui/icons-material/SettingsOutlined";
import KeyboardArrowDown from "@mui/icons-material/KeyboardArrowDown";
import NetworkCheck from "@mui/icons-material/NetworkCheck";
import {useChartPreferences} from "./use-chart-preferences";
import {localVwapSeed,parseVwapSeedRequest,validVwapSeed,type VwapSeed} from "@/src/modules/scanner/alpaca/chart-vwap-seed";
import {easternClock} from "@/src/modules/scanner/live/sessions";
import { chartVwapCache } from "./chart-vwap-cache";
import {ChartBandFill} from "@/src/modules/scanner/alpaca/chart-band-fill";
import {calculationDemand} from "@/src/modules/scanner/alpaca/chart-calculation-demand";
import {ChartCalculationHistory,type CalculationHistory} from "@/src/modules/scanner/alpaca/chart-calculation-history";
import {calculationInterval,futureCalculationAxis} from "@/src/modules/scanner/alpaca/chart-calculation-intervals";
import {carryVwapPoints,offsetVwap,projectVwap,indicatorReadoutIndex,sampleCalendarVwap} from "@/src/modules/scanner/alpaca/chart-vwap-projection";
import {readChartCalendarYear} from "@/src/modules/scanner/alpaca/chart-calendar-request";
import {ChartSessionCalendar} from "@/src/modules/scanner/alpaca/chart-calendar";
import { chartArchiveWindow, mergeChartArchivePages, type ChartArchivePage } from "@/src/modules/scanner/alpaca/chart-archive-history";
import { chartOvernightTradingDate, chartShowsOvernight } from "@/src/modules/scanner/alpaca/chart-overnight-session";
import {type IndicatorPlot,vwapAnchorKey,indicatorOverlayWidth,indicatorPlotStyle,indicatorHistogramColor,indicatorValues,isVisibleSession,visibleSessionBars} from "@/src/modules/scanner/alpaca/chart-indicators";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme, type SxProps, type Theme } from "@mui/material/styles";
import { lazy, Suspense, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { EXCHANGE_CHART_TIME_ZONE, resolveChartTimeZone } from "@/src/modules/scanner/alpaca/chart-time-zone";
import { createChartTickFormatter, firstVisibleChartTime, isChartDateStart } from "@/src/modules/scanner/alpaca/chart-axis";
import type { ISeriesApi, ISeriesMarkersPluginApi, Time } from "lightweight-charts";
import { aggregateCandles, candleBucket, displayCandles, easternDayStart, isCalendarChartTimeframe, nextChartCalendarPeriod, usesDailyCandles, CHART_FRAME_SECONDS, CHART_TIMEFRAMES, type ChartCalculationTimeframe, type Candle, type DisplayCandle, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";


import { chartIndicatorCatalog, isVolumeProfile } from "@/src/modules/scanner/alpaca/chart-indicator-catalog";
import { indicatorNumberFormat } from "@/src/modules/scanner/alpaca/chart-indicator-number-format";
import { defaultChartView } from "@/src/modules/scanner/alpaca/chart-default-view";
import { canRestoreChartPrice, chartIndicatorDefinitions, chartViews, defaultIndicatorDisplay, restoreChartRange, type ChartIndicatorOverrides } from "./chart-view-memory";
import { DEFAULT_CHART_CROSSHAIR_MODE, INDICATOR_TYPES, changeIndicatorDisplayChoice, indicatorDisplayChoice, indicatorPriceScaleLabels, withoutOverlayWidthOverrides, type ChartIndicator, type ChartPreferences, type IndicatorDisplayAction, type IndicatorDisplayChoices, type IndicatorLineWidth, type IndicatorType } from "@/src/modules/scanner/alpaca/chart-preferences";
import { chartSplitLabel, parseChartSplits, projectChartSplits, type ChartSplit } from "@/src/modules/scanner/alpaca/chart-splits";
import { readChartCandleHistory, readCompletedChartHistory, readChartVwapSeed, sharedChartFetch, sharedChartStream, type ChartStreamHandle } from "./shared-chart-data";

import { makeJournalMarkers, chartJournalDayAt, chartJournalFocusBounds } from "./chart-journal-model";
import { useChartJournalDisplay } from "./chart-journal-display";
import { useChartJournalBridge } from "./chart-journal-bridge";
import type { MarketTradeContext, MarketTradeMark } from "./chart-trade-context";

const BarReplayChart = lazy(() => import("./bar-replay-chart"));
const PriceMovementChart = lazy(() => import("./price-movement-chart"));
const ChartJournalPanel = lazy(() => import("./chart-journal-panel"));
const ChartPreferencesPanel = lazy(() => import("./chart-preferences-panel").then(module => ({ default: module.ChartPreferencesPanel })));

type ChartCandleSnapshot = {
  basisDate: string;
  bars: Candle[];
  overnightBars?: Candle[];
  nextBefore: number | null;
  profileCoverageStart: number;
  calendar: ChartSessionCalendar;
  savedAt: number;
};
const recentChartCandles = new Map<string, ChartCandleSnapshot>();
const candleSnapshotLifetime = 5 * 60_000;

const evidenceEventLabels: Record<ChartEvidenceEvent["kind"], string> = {
  swing: "Swing",
  "swing-break": "Swing break",
  "structure-break": "Structure break",
  "change-of-character": "Change of character",
  "level-break": "Level break",
  failure: "Failed break",
};
const evidencePrice = new Intl.NumberFormat("en-US", { maximumFractionDigits: 4 });
const subDollarEvidencePrice = new Intl.NumberFormat("en-US", { minimumFractionDigits: 4, maximumFractionDigits: 4 });
const evidenceTime = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short" });
const formatEvidencePrice = (value: number) => `$${(value < 1 ? subDollarEvidencePrice : evidencePrice).format(value)}`;

export function MarketChart({ symbol, sx, timeframe: controlledTimeframe, onTimeframeChange, disabledTimeframes = [], actions, closeAction, onOpenMultiview, onDefaultTimeframeChange, onSymbolChange, onOpenCompanyDetails, compactMobile = false, compactToolbar = false, compactToolbarHeight = 32, compactIdentity, viewId, viewWorkspace = "main", tradeContext, tradeFocusRevision, onTradeMarkClick, evidence }: {
  onSymbolChange?: (symbol: string) => string | undefined;
  onOpenCompanyDetails?: (symbol: string) => void;
  tradeContext?: MarketTradeContext; tradeFocusRevision?: number; onTradeMarkClick?: (marks: readonly MarketTradeMark[]) => void;
  evidence?: ResolvedChartEvidence;
  symbol: string; sx?: SxProps<Theme>; timeframe?: ChartTimeframe; onTimeframeChange?: (timeframe: ChartTimeframe) => void;
  viewId?: string; viewWorkspace?: "main" | "scanner" | "workspace"; compactIdentity?: import("react").ReactNode; compactMobile?: boolean; compactToolbar?: boolean; compactToolbarHeight?: number; disabledTimeframes?: readonly ChartTimeframe[]; actions?: import("react").ReactNode; closeAction?: import("react").ReactNode; onOpenMultiview?: () => void; onDefaultTimeframeChange?: (timeframe: ChartTimeframe) => void;
}) {
  const baseTicker = symbol.split(":").at(-1)!.toUpperCase();
  const marketData = useChartMarketData();
  const { broker, endpoints } = marketData;
  const providerKey = marketData.generation;
  const providerQuery = `generation=${marketData.generation}`;
  const {preferences:accountPreferences,ready,message,change,ownerKey,journalAccountRef,reviewChartStyles}=useChartPreferences();
  const chartJournalAccountRef = evidence ? undefined : journalAccountRef;
  const journalDisplay = useChartJournalDisplay(chartJournalAccountRef);
  const journal = useChartJournalBridge(chartJournalAccountRef, baseTicker);
  const { engineBridge: journalEngineBridge, scope: journalScope } = journal;
  const ticker = journal.current?.reviewSymbol ?? baseTicker;
  const activeTradeContext = ticker === baseTicker ? tradeContext : undefined;
  const focusScope = journalScope || (activeTradeContext ? `trade-context:${baseTicker}` : "");
  const tradeMarksById = useMemo(() => new Map(activeTradeContext?.marks.map(mark => [mark.id, mark])), [activeTradeContext]);
  const chartIdentity = ticker === baseTicker ? compactIdentity : null;
  const theme = useTheme();
  const narrow = useMediaQuery(theme.breakpoints.down("md")), landscape = useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)");
  const compact = compactToolbar || (compactMobile && (narrow || landscape));
  const [frameAnchor, setFrameAnchor] = useState<HTMLElement | null>(null);
  // Toolbar visibility must not restart candles or subscriptions.
  const alwaysShowDrawingToolbar=accountPreferences.alwaysShowDrawingToolbar??false;
  const displayKey=JSON.stringify([ownerKey,viewWorkspace,viewId,ticker]);
  const [localDisplay,setLocalDisplay]=useState<{key:string;value:IndicatorDisplayChoices}>();
  const [localDefinitions,setLocalDefinitions]=useState<{key:string;value:ChartIndicatorOverrides}>();
  if(localDisplay&&localDisplay.key!==displayKey)setLocalDisplay(undefined);
  if(localDefinitions&&localDefinitions.key!==displayKey)setLocalDefinitions(undefined);
  const indicatorDisplay=localDisplay?.key===displayKey?localDisplay.value:
    ownerKey&&viewId?chartViews.readIndicatorDisplay(ownerKey,viewWorkspace,viewId,ticker):defaultIndicatorDisplay;
  const overrides=localDefinitions?.key===displayKey?localDefinitions.value:
    ownerKey&&viewId?chartViews.readIndicatorOverrides(ownerKey,viewWorkspace,viewId,ticker):undefined;
  const accountIndicatorDisplay=accountPreferences.indicatorDisplay;
  const definitionRevisions=accountPreferences.indicatorDefinitionRevisions;
  const accountIndicators=accountPreferences.indicators;
  const chartIndicators=useMemo(()=>
    overrides ? chartIndicatorDefinitions(accountIndicators,definitionRevisions,overrides) : accountIndicators,
  [accountIndicators,definitionRevisions,overrides]);
  const saveIndicatorDisplay=(next:IndicatorDisplayChoices)=>{
    setLocalDisplay({key:displayKey,value:next});
    if(ownerKey&&viewId)chartViews.writeIndicatorDisplay(ownerKey,viewWorkspace,viewId,ticker,next);
  };
  const changeIndicatorDisplay=(type:IndicatorType,action:IndicatorDisplayAction,value:boolean)=>{
    const revision=accountIndicatorDisplay?.[type]?.[action]?.revision??0;
    saveIndicatorDisplay(changeIndicatorDisplayChoice(indicatorDisplay,type,action,value,revision));
  };
  const changeChartIndicators=(type:IndicatorType,indicators:ChartIndicator[])=>{
    const rows=indicators.filter(indicator=>indicator.type===type);
    const next={...overrides,[type]:{revision:definitionRevisions?.[type]??0,indicators:rows}};
    setLocalDefinitions({key:displayKey,value:next});
    if(ownerKey&&viewId)chartViews.writeIndicatorOverrides(ownerKey,viewWorkspace,viewId,ticker,next);
    if(rows.length&&!chartIndicators.some(indicator=>indicator.type===type)){
      const shown=changeIndicatorDisplayChoice(indicatorDisplay,type,"enabled",true,accountIndicatorDisplay?.[type]?.enabled?.revision??0);
      saveIndicatorDisplay(changeIndicatorDisplayChoice(shown,type,"hidden",false,accountIndicatorDisplay?.[type]?.hidden?.revision??0));
    }
  };
  const chartOptionsKey=useMemo(()=>JSON.stringify({
    ...accountPreferences,alwaysShowDrawingToolbar:undefined,autosaveDrawings:undefined,savedIndicatorPresets:undefined,favoriteIndicators:undefined,
    indicatorDisplay:undefined,indicatorDefinitionRevisions:undefined,indicatorOverlayLineWidth:undefined,indicators:chartIndicators.map(withoutOverlayWidthOverrides),
  }),[accountPreferences,chartIndicators]);
  const overlayAppearance=useRef({width:1 as IndicatorLineWidth,indicators:new Map<string,ChartIndicator>()});
  const overlaySeries=useRef<{series:ISeriesApi<"Line">;id:string;key:string}[]>([]);
  useEffect(()=>{
    const indicators=new Map(chartIndicators.map(indicator=>[indicator.id,indicator]));
    const width=accountPreferences.indicatorOverlayLineWidth??1;
    overlayAppearance.current={width,indicators};
    for(const {series,id,key} of overlaySeries.current){
      const indicator=indicators.get(id);
      if(!indicator)continue;
      const lineWidth=indicatorOverlayWidth(indicator,key,width);
      if(series.options().lineWidth!==lineWidth)series.applyOptions({lineWidth});
    }
  },[chartIndicators,accountPreferences.indicatorOverlayLineWidth]);
  const regularEvidence = evidence?.basis.sessionMode === "regular" &&
    evidence.basis.symbol === ticker && evidence.chartGeneration === providerKey;
  const preferences=useMemo(()=>{
    const saved = JSON.parse(chartOptionsKey) as ChartPreferences;
    return regularEvidence ? { ...saved, premarket: false, regular: true, postmarket: false, overnight: false } : saved;
  },[chartOptionsKey,regularEvidence]);
  const requestedMovement = preferences.kind === "renko" || preferences.kind === "range" ? preferences.kind : null;
  const movementKind = broker || evidence || activeTradeContext || journal.current?.open ? null : requestedMovement;
  const priceAdjustment = evidence ? "split" : preferences.priceAdjustment ?? "split";
  const unadjusted = priceAdjustment === "raw";
  const [drawingEngine,setDrawingEngine]=useState<ChartDrawings|null>(null);
  const {toolbar:drawingToolbar,leftToolbar:drawingLeftToolbar,overlay:drawingOverlay,saveError:drawingSaveError}=useDrawingControls(
    unadjusted ? null : drawingEngine,ownerKey,ticker,compact,alwaysShowDrawingToolbar,accountPreferences.autosaveDrawings??true,
  );
  const dark = preferences.theme === "dark" || preferences.theme === "auto" && theme.palette.mode === "dark";
  const [replaying, setReplaying] = useState(false);
  const replayActive = replaying && !movementKind && !evidence && !activeTradeContext && !journal.current?.open;
  const [panel,setPanel]=useState<"indicators"|"settings"|null>(null);
  const [preferencesOpened,setPreferencesOpened]=useState(false);
  const openPreferences=(next: "indicators"|"settings")=>{
    setPreferencesOpened(true);
    setPanel(next);
  };
  const [initialIndicator,setInitialIndicator]=useState<IndicatorType>();
  const [indicatorMenu,setIndicatorMenu]=useState<{anchor:HTMLElement;type:IndicatorType}|null>(null);
  const openIndicatorPane=indicatorMenu?.anchor.closest<HTMLElement>("[data-chart-indicator-legend]")?.dataset.chartIndicatorPane;
  const openIndicators=(type?:IndicatorType)=>{setInitialIndicator(type);openPreferences("indicators");};

  const marketCalendar=useRef(new ChartSessionCalendar());
  const [sessionMessage,setSessionMessage]=useState("");

  const container = useRef<HTMLDivElement>(null);
  const journalPortal = useCallback(() => container.current?.closest<HTMLElement>("[data-journal-chart-drawer]") ?? null, []);
  const dateAxis = useRef<HTMLDivElement>(null);
  const indicatorLegend = useRef<HTMLDivElement>(null);
  const [selectedSplits, setSelectedSplits] = useState<readonly ChartSplit[]>([]);
  const [historyMessage,setHistoryMessage] = useState("");
  const [partialHistory, setPartialHistory] = useState(false);
  const crosshairDetails = useRef<HTMLDivElement>(null);
  const [activeTimeframe,setActiveTimeframe]=useState<ChartTimeframe|null>(null);
  const timeframe=controlledTimeframe??activeTimeframe??preferences.timeframe;
  const logarithmic = chartLogarithmic(preferences,timeframe);
  const daily = usesDailyCandles(timeframe);
  const calendarFrame = isCalendarChartTimeframe(timeframe) ? timeframe : null;
  const vwapDisplayFrame = calendarFrame ? "1D" : timeframe as ChartCalculationTimeframe;
  const enabledOverridesKey=JSON.stringify(Object.fromEntries(INDICATOR_TYPES.map(type=>
    [type,indicatorDisplayChoice(accountIndicatorDisplay,indicatorDisplay,type,"enabled")])));
  const hiddenIndicatorValues=new Set(INDICATOR_TYPES.filter(type=>
    indicatorDisplayChoice(accountIndicatorDisplay,indicatorDisplay,type,"hidden")===true));
  const hiddenProfileLabels = JSON.stringify([...hiddenIndicatorValues].filter(isVolumeProfile));
  const profileLegend = useRef<{ hidden: ReadonlySet<IndicatorType>; refresh?: () => void }>({ hidden: new Set() });
  useEffect(()=>{
    profileLegend.current.hidden=new Set(JSON.parse(hiddenProfileLabels) as IndicatorType[]);
    profileLegend.current.refresh?.();
  },[hiddenProfileLabels]);
  const activeIndicators=useMemo(()=>{
    const enabledOverrides=JSON.parse(enabledOverridesKey) as Partial<Record<IndicatorType,boolean>>;
    const visibleTypes=new Set(preferences.indicators.filter(indicator=>indicator.visible!==false).map(indicator=>indicator.type));
    return preferences.indicators.flatMap(indicator=>{
      const enabled=enabledOverrides[indicator.type];
      if(enabled===false||indicator.type==="VWAP"&&(calendarFrame&&indicator.hideOnDaily||indicator.timeframes&&!indicator.timeframes.includes(timeframe)))return [];
      if(indicator.visible!==false)return [indicator];
      return enabled===true&&!visibleTypes.has(indicator.type)?[{...indicator,visible:true}]:[];
    });
  },[preferences.indicators,enabledOverridesKey,timeframe,calendarFrame]);
  const indicatorPlots=useMemo(()=>activeIndicators.map(indicator=>({
    indicator, parts:indicatorValues([],indicator,timeframe),
  })),[activeIndicators,timeframe]);
  const crosshairLines=useMemo(()=>indicatorPlots.flatMap(({indicator,parts})=>parts
    .filter(plot=>!plot.pane&&!plot.histogram&&indicatorPlotStyle(indicator,plot.key).visible)
    .map(plot=>({value:`indicator:${indicator.id}:${plot.key}` as const,label:plot.label}))),[indicatorPlots]);
  const crosshairTarget=preferences.crosshairMode??DEFAULT_CHART_CROSSHAIR_MODE;
  const priceReadoutTypes=[...new Set(indicatorPlots.filter(({parts})=>!parts[0]?.pane).map(({indicator})=>indicator.type))];
  const lowerReadouts=indicatorPlots.filter(({parts})=>parts[0]?.pane).map(({indicator})=>indicator);
  const showOvernight = !broker && !daily && chartShowsOvernight(preferences);
  const regularOnly = preferences.regular && !preferences.premarket && !preferences.postmarket && !showOvernight;
  if(ready&&controlledTimeframe===undefined&&activeTimeframe===null)setActiveTimeframe(preferences.timeframe);
  const changePreferences = (next: ChartPreferences) => {
    if (next.kind === "renko" || next.kind === "range") setReplaying(false);
    change(next.logarithmic!==logarithmic?setChartLogarithmic(next,timeframe,next.logarithmic):next);
    if (next.timeframe !== preferences.timeframe) onDefaultTimeframeChange?.(next.timeframe);
  };
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Loading candles…");
  const [error, setError] = useState<string | null>(null);
  const [structureVisible, setStructureVisible] = useState(true);
  const [levelsVisible, setLevelsVisible] = useState(true);
  const [showCurrentEvidence, setShowCurrentEvidence] = useState(false);
  const evidenceContext: "current" | "match" = evidence?.match && !showCurrentEvidence ? "match" : "current";
  const [readout, setReadout] = useState<{ overlay: ChartOverlay; evidence: ResolvedChartEvidence; context: typeof evidenceContext; frame: ChartTimeframe }>();
  const evidenceInput = useRef<{ evidence?: ResolvedChartEvidence; evidenceContext: "current" | "match"; structureVisible: boolean; levelsVisible: boolean }>({
    evidence, evidenceContext, structureVisible, levelsVisible,
  });
  const evidenceRender = useRef<(() => void) | undefined>(undefined);
  useLayoutEffect(() => {
    evidenceInput.current = { evidence, evidenceContext, structureVisible, levelsVisible };
    evidenceRender.current?.();
  }, [evidence, evidenceContext, structureVisible, levelsVisible]);

  const archiveDailyStartup = !broker && timeframe === "1D" && !unadjusted && !activeTradeContext && !evidence;

  useEffect(() => {
    const element = container.current;
    if (!element || !ready || !marketData.ready || movementKind || replayActive) return;
    const sipSessions = [preferences.premarket, preferences.regular, preferences.postmarket];
    const priceBasisKey = unadjusted ? providerKey + ":raw" : providerKey;
    const sipSessionKey = JSON.stringify([...sipSessions, priceBasisKey]);
    const sessionKey = showOvernight ? JSON.stringify([...sipSessions, true, priceBasisKey]) : sipSessionKey;
    const basis = easternClock(Date.now()).date;
    const cacheKey = ownerKey && viewId && viewWorkspace === "main"
      ? JSON.stringify([ownerKey, viewId, ticker, timeframe, sessionKey])
      : null;
    const snapshot = cacheKey ? recentChartCandles.get(cacheKey) : undefined;
    const cached = snapshot && snapshot.basisDate === basis && Date.now() - snapshot.savedAt < candleSnapshotLifetime ? snapshot : undefined;
    const savedView = ownerKey && viewId ? chartViews.read(ownerKey, viewWorkspace, viewId, ticker, timeframe, sessionKey)
      ?? (showOvernight ? chartViews.read(ownerKey, viewWorkspace, viewId, ticker, timeframe, sipSessionKey) : null) : null;
    const restorePrice=canRestoreChartPrice(savedView,{autoScale:preferences.autoScale,logarithmic},basis);
    const restore=savedView?{...savedView,priceRange:restorePrice?savedView.priceRange:null}:null;
    marketCalendar.current = cached?.calendar ?? new ChartSessionCalendar();
    const displayZone = resolveChartTimeZone(preferences.timezone);
    const zoneSuffix = displayZone === EXCHANGE_CHART_TIME_ZONE ? " ET" : displayZone === "UTC" ? " UTC" : "";
    const displayTime = new Intl.DateTimeFormat("en-US", {
      timeZone: displayZone, month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
      timeZoneName: zoneSuffix ? undefined : "short",
    });
    const tickLabel = createChartTickFormatter(timeframe, displayZone);
    const formatChartTime = (time: number) => calendarFrame
      ? tickLabel(time, true)
      : displayTime.format(time * 1000) + zoneSuffix;
    let disposed = false, auxiliarySource: ChartStreamHandle | undefined, source: ChartStreamHandle | undefined, removeChart: (() => void) | undefined;
    const abort = new AbortController();
    setStatus("Loading candles…"); setError(null); setHistoryMessage(""); setPartialHistory(false); setSessionMessage(""); setSelectedSplits([]);
    if (crosshairDetails.current) crosshairDetails.current.textContent = "";
    dateAxis.current?.replaceChildren();
    const useRecentHistory = !activeTradeContext && timeframe !== "4h" && !daily;
    const now = Date.now();
    const lastCached = cached ? [...cached.bars, ...(cached.overnightBars ?? [])].reduce((last, bar) => Math.max(last, bar.time), 0) : 0;
    const overlapStart = (lastCached - 300) * 1000;
    const catchUpFrom = !daily && lastCached && now - overlapStart < 20 * 60_000 &&
      overlapStart < Math.floor(now / 60_000) * 60_000 - 1 ? overlapStart : null;
    const latestHistoryBar = Math.floor(now / 60_000) * 60_000 - 1;
    const tradeThrough = activeTradeContext
      ? daily
        ? nextChartCalendarPeriod(activeTradeContext.to, "1Y") * 1000 - 1
        : Math.floor(activeTradeContext.to * 1000) + 5 * 86_400_000
      : null;
    let contextThrough = tradeThrough === null ? null : Math.min(latestHistoryBar, tradeThrough);
    const overnightHistoryRequests = new Set<string>();
    let readOvernightHistory = (query: string) => { overnightHistoryRequests.add(query); };
    let historyHasGaps = false;
    const readHistory = (query: URLSearchParams, reuseDaily = true) => {
      if (unadjusted) query.set("adjustment", "raw");
      const history = readChartCandleHistory(
        `${endpoints.bars}?${query}&${providerQuery}`, abort.signal,
        daily && ownerKey ? { owner: `${ownerKey}:${providerKey}`, basisDate: easternClock(Date.now()).date, reuse: reuseDaily } : undefined,
      ).then(page => {
        if (!disposed && page.complete === false) {
          historyHasGaps = true;
          setPartialHistory(true);
        }
        return page;
      });
      if (showOvernight) void history.then(() => {
        if (disposed) return;
        const from = Number(query.get("catchUpFrom"));
        if (from && !chartOvernightTradingDate(from) && !chartOvernightTradingDate(Date.now())) return;
        readOvernightHistory(String(query));
      }, () => {});
      return history;
    };
    const requestHistory = (recent = false, from: number | null = null, reuseDaily = false) => {
      const query = new URLSearchParams({ history: "1", symbol: ticker, daily: daily ? "1" : "0" });
      if (recent) query.set("recent", "1");
      if (from !== null) query.set("catchUpFrom", String(from));
      if (contextThrough !== null && (!daily || contextThrough < latestHistoryBar)) query.set("before", String(contextThrough));
      if (archiveDailyStartup && !journalEngineBridge.getFocus() && !query.has("before")) query.set("dailyStartup", "1");
      return readHistory(query, reuseDaily);
    };
    const initialHistory = requestHistory(useRecentHistory && !cached, catchUpFrom, attempt === 0);
    // The request may settle before the lazy chart library finishes loading.
    void initialHistory.catch(() => {});
    async function start() {
      const library = await import("lightweight-charts");
      const { createChart, createSeriesMarkers, HistogramSeries, LineSeries, ColorType, TickMarkType, PriceScaleMode, CrosshairMode, LineType } = library;
      if (disposed) return;
      let displayPoints: DisplayCandle[] = [];
      const dateKey = new Intl.DateTimeFormat("en-CA", { timeZone: displayZone, year: "numeric", month: "numeric", day: "numeric" });
      const dayKey = (time: number) => dateKey.format(time * 1000);
      const chart = createChart(element!, {
        autoSize: true,
        rightPriceScale: { entireTextOnly: true },
        crosshair: { mode: crosshairTarget==="nearest"?CrosshairMode.Magnet:CrosshairMode.Normal },
        layout: { background: { type: ColorType.Solid, color: dark ? "#101722" : "#ffffff" }, textColor: dark ? "#c7d2df" : "#354358", fontSize: 11, attributionLogo: false },
        grid: { vertLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" }, horzLines: { visible:preferences.grid,color: dark ? "#1d2939" : "#eef1f5" } },
        timeScale: { minBarSpacing: 0.001, timeVisible: !daily, secondsVisible: false, rightOffset: 4, tickMarkFormatter: (time: Time, tickMarkType: number) => tickLabel(time, tickMarkType <= TickMarkType.DayOfMonth &&
          (typeof time !== "number" || isChartDateStart(displayPoints, time, dayKey))) },
        localization: { timeFormatter: (time: Time) => typeof time === "number" ? formatChartTime(time) : String(time) },
      });
      removeChart = () => { overlaySeries.current=[]; chart.remove(); };
      chart.priceScale("right").applyOptions({autoScale:restorePrice?savedView!.autoScale:preferences.autoScale,mode:logarithmic?PriceScaleMode.Logarithmic:PriceScaleMode.Normal});
      const priceStyle = createChartPriceStyle(chart, library, preferences, () => displayPoints, logarithmic);
      const candles = priceStyle.series;
      const heikinAshi = preferences.kind === "heikinAshi";
      const removePriceChart = removeChart;
      removeChart = () => { priceStyle.dispose(); removePriceChart(); };
      const drawingInterval=CHART_FRAME_SECONDS[vwapDisplayFrame];
      let drawingVolumeBars:Candle[]|undefined;
      let drawingVolumeHistory: CalculationHistory | undefined;
      let drawingVolumeFrom = Infinity, drawingVolumeRetryAt = 0, drawingVolumePending = false;
      const drawings=new ChartDrawings(y=>candles.coordinateToPrice(y),price=>candles.priceToCoordinate(price),
        dark,()=>displayPoints,drawingInterval,()=>{
          if(!drawingVolumeBars){
            const volumeSource = new Map(drawingVolumeHistory?.bars.map(bar => [bar.time, bar]));
            for (const bar of bars.values()) volumeSource.set(bar.time, bar);
            const input = [...volumeSource.values()];
            const visible = daily ? input : visibleSessionBars(input, preferences,
              drawingVolumeHistory?.calendar ?? (calendarReady ? marketCalendar.current : undefined));
            visible.sort((a,b)=>a.time-b.time);
            drawingVolumeBars = timeframe === "1m" || timeframe === "1D"
              ? mergeChartArchivePages(visible, archivePages) : visible;
          }
          return drawingVolumeBars;
        },calendarFrame,(start,end)=>{
          if (timeframe === "1m" || timeframe === "1D" || drawingVolumeFrom <= start ||
              !archivePages.some(page => page.start < end && start < page.end)) return true;
          if (!disposed && !drawingVolumePending && Date.now() >= drawingVolumeRetryAt) {
            drawingVolumePending = true;
            void calculationHistory.read("1m",start).then(value=>{
              if (disposed || value.basisDate !== historyBasisDate) return;
              drawingVolumeHistory = value;
              drawingVolumeFrom = start;
              writeAll(false,false,true);
            }).catch(()=>{ drawingVolumeRetryAt = Date.now()+30_000; })
              .finally(()=>{ drawingVolumePending = false; });
          }
          return false;
        });
      if (!unadjusted) chart.panes()[0].attachPrimitive(drawings);
      let splitMarkers: ISeriesMarkersPluginApi<Time> | undefined;
      let splits: ChartSplit[] = [];
      let splitsDate = "";
      let splitsPending = false;
      let splitRetryAt = 0;
      let splitMarkerKey = "";
      let splitByMarker = new Map<string, ChartSplit>();
      let splitsByCandle = new Map<number, ChartSplit[]>();
      chart.subscribeClick(({ point, time, paneIndex, hoveredObjectId }) => {
        if (!point || paneIndex !== 0) return;
        const split = typeof hoveredObjectId === "string" ? splitByMarker.get(hoveredObjectId) : undefined;
        // Touch taps can report the candle time without a hovered marker.
        const touched = typeof time === "number" && window.matchMedia("(pointer: coarse)").matches
          ? splitsByCandle.get(time) : undefined;
        setSelectedSplits(split ? [split] : touched ?? []);
        if (split) return;
        const listener = journalEngineBridge.getInteraction();
        if (typeof hoveredObjectId === "string") {
          const marker = journalMarkerBuckets.get(hoveredObjectId);
          if (marker) {
            const tradeMarks = marker.ids.flatMap(id => {
              const mark = tradeMarksById.get(id);
              return mark ? [mark] : [];
            });
            if (tradeMarks.length && onTradeMarkClick) {
              onTradeMarkClick(tradeMarks);
              return;
            }
            if (listener && marker.kind !== "pattern" && marker.kind !== "rule" &&
              listener({ kind: "marker", ids: marker.ids, type: marker.kind })) return;
          }
        }
        if (listener && typeof time === "number") {
          const bar = displayed.get(time);
          if (bar && listener({ kind: "candle", candle: { time, price: bar.close, estimated: bar.carried === true } })) return;
        }
        drawings.togglePin(point);
      });
      setDrawingEngine(unadjusted ? null : drawings);
      const volume = preferences.volume?chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceLineVisible: false, lastValueVisible: false }, 1):undefined;
      chart.panes()[0].setStretchFactor(100-preferences.volumeHeight);if(volume)chart.panes()[1].setStretchFactor(preferences.volumeHeight);
      let nextPane=volume?2:1;
      const paneReadouts: { id: string; pane: number }[] = [];
      const candlePrecision=()=>{
        const format=candles.options().priceFormat;
        return "precision" in format?format.precision:2;
      };
      let appliedCandlePrecision=candlePrecision();
      const studies=indicatorPlots.flatMap(({indicator,parts})=>{
        const pane=parts[0]?.pane?nextPane++:0;
        if(pane) paneReadouts.push({id:indicator.id,pane});
        return parts.map((part,index)=>{const style=indicatorPlotStyle(indicator,part.key);
          const lastValueVisible=indicatorPriceScaleLabels(preferences,indicator);
          const numberFormat=indicatorNumberFormat(indicator,appliedCandlePrecision);
          const labelOptions={title:lastValueVisible?part.label:"",lastValueVisible,priceFormat:numberFormat.axis};
          const study={indicator,index,pane,key:part.key,label:part.label,histogram:part.histogram,step:part.step,numberFormat};
          if(part.histogram)return {...study,series:chart.addSeries(HistogramSeries,{visible:style.visible,...labelOptions,priceLineVisible:false},pane)};
          const {indicators,width}=overlayAppearance.current;
          const lineWidth=pane===0?indicatorOverlayWidth(indicators.get(indicator.id)??indicator,part.key,width):style.width;
          const series=chart.addSeries(LineSeries,{visible:style.visible,color:style.color,lineWidth,lineStyle:style.style,...(part.step?{lineType:LineType.WithSteps}:{}),...(part.dots?{pointMarkersVisible:true,pointMarkersRadius:2,lineVisible:false}:{}),...labelOptions,priceLineVisible:false,...((preferences.scalePriceOnly&&pane===0||indicator.type==="StandardPivots"||indicator.type==="RegressionChannel")?{autoscaleInfoProvider:()=>null}:{}),...(indicator.type==="RSI"?{autoscaleInfoProvider:()=>({priceRange:{minValue:0,maxValue:100}})}:{})},pane);
          if(pane===0)overlaySeries.current.push({series,id:indicator.id,key:part.key});
          return {...study,series};
        });
      });
      const snapSeries=crosshairTarget.startsWith("indicator:")?studies.find(study=>
        `indicator:${study.indicator.id}:${study.key}`===crosshairTarget&&study.series.options().visible)?.series:undefined;
      // Calculate each multi-line study once per candle snapshot.
      const calculationStudies = new Map(studies.filter(({indicator})=>indicator.type!=="VWAP"&&indicator.type!=="RangeVWAP")
        .map(({indicator})=>[indicator.id,indicator]));
      const pivotEnabled=[...calculationStudies.values()].some(indicator=>indicator.type==="StandardPivots");
      const profileStudies=indicatorPlots.flatMap(({indicator})=>{
        if(!isVolumeProfile(indicator.type))return [];
        const profile=new ChartVolumeProfiles(price=>candles.priceToCoordinate(price),indicator.type);
        chart.panes()[0].attachPrimitive(profile);
        return [{indicator,profile,type:indicator.type}];
      });
      type StudyHistory={before:number;basis:string;loading:boolean;data?:CalculationHistory;retryAt?:number};
      const advancedHistory=new Map<"1m"|"1D",StudyHistory>();
      function supplementalStudyHistory(frame:"1m"|"1D",before:number) {
        if(!Number.isFinite(before)||before<=0||!historyBasisDate)return;
        const cached=advancedHistory.get(frame);
        const existing=cached?.basis===historyBasisDate?cached:undefined;
        if(existing&&(existing.loading||existing.retryAt!==undefined&&existing.retryAt>Date.now()||
          existing.retryAt===undefined&&existing.before<=before))return existing.data;
        const state:StudyHistory={before,basis:historyBasisDate,loading:true,data:existing?.data};
        advancedHistory.set(frame,state);
        void calculationHistory.read(frame,before,contextThrough===null?undefined:Math.floor(contextThrough/1000),'covered')
          .then(value=>{
            if(disposed||advancedHistory.get(frame)!==state||value.basisDate!==state.basis)return;
            state.data=value;
            state.loading=false;
            writeAll(false,false,true);
          }).catch(()=>{
            if(advancedHistory.get(frame)===state){state.loading=false;state.retryAt=Date.now()+30_000;}
          });
        return state.data;
      }
      const projectionYears=new Set<number>();
      function requestProjectionYear(lastTime:number) {
        const axisYear=Number(easternClock(lastTime*1000).date.slice(0,4));
        const year=[axisYear,axisYear+1].find(value=>!projectionYears.has(value));
        if(!year||year>9999)return;
        projectionYears.add(year);
        void sharedChartFetch('/api/charts/calendar?year='+year+'&'+providerQuery,{credentials:'same-origin',signal:abort.signal,cache:'no-store'})
          .then(async response=>{
            if(!response.ok)throw Error('calendar_year_unavailable');
            const calendar=readChartCalendarYear(await response.json(),year);
            if(!disposed){marketCalendar.current.merge(calendar);writeAll(false,false,true);}
          }).catch(()=>{});
      }
      function studyParts(actual:readonly Candle[],axis:readonly DisplayCandle[]) {
        let pivotLevels:ReturnType<typeof standardPivotLevels>|undefined;
        if(pivotEnabled&&axis.length){
          const calendar=marketCalendar.current;
          const history=daily?undefined:supplementalStudyHistory("1D",pivotHistoryStart(axis[0].time,timeframe,calendar));
          const input=daily?[...bars.values()].sort((a,b)=>a.time-b.time):history?.bars??[];
          pivotLevels=standardPivotLevels(axis,input,timeframe,history?.calendar??calendar);
        }
        const output=new Map<string,IndicatorPlot[]>(Array.from(calculationStudies.values(),indicator=>{
          const input=indicator.type==="ZigZag"?
            completedSwingBars(actual,timeframe,preferences,marketCalendar.current,Date.now()/1000):actual;
          return [indicator.id,indicatorValues(input,indicator,timeframe,{pivotLevels})];
        }));
        const shifted=[...output.values()].flat().filter(part=>part.offset&&part.points.length);
        if(!shifted.length||!axis.length)return output;
        const times=axis.map(bar=>bar.time);
        const indexes=new Map(times.map((time,index)=>[time,index]));
        const needed=Math.max(0,...shifted.map(part=>(indexes.get(part.points.at(-1)!.time)??0)+part.offset!-times.length+1));
        const positions=futureCalculationAxis(times,needed,timeframe,preferences,marketCalendar.current,true);
        for(const time of positions.slice(times.length))futureIndicatorTimes.add(time);
        if(positions.length<times.length+needed)requestProjectionYear(times.at(-1)!);
        for(const part of shifted)part.points=offsetVwap(part.points,positions,part.offset!);
        return output;
      }
      const indicatorAxis=indicatorPlots.some(({indicator,parts})=>indicator.type==='VWAP'&&(indicator.offset??0)>0||parts.some(part=>(part.offset??0)>0))?chart.addSeries(LineSeries,{visible:false,priceLineVisible:false,lastValueVisible:false},0):undefined;
      let activeCrosshair: { time: Time; point: { x: number } } | undefined;
      const studyPoints=new Map<typeof studies[number],readonly {time:number;value:number}[]>();
      const rangeVwapStudies=studies.filter(study=>study.indicator.type==="RangeVWAP");
      let rangeVwapBars:readonly Candle[]=[];
      let rangeVwapStart:number|undefined;
      let rangeVwapFrame=0;
      let profileSource:readonly Candle[]=[];
      // Page coverage is independent of the first reported trade and of the UI's capped pagination cursor.
      let profileCoverageStart=cached?.profileCoverageStart??Infinity;
      let profileWindowKey="";
      let latestProfileCandle: number | undefined;
      function refreshProfiles(force=false) {
        if(!profileStudies.length)return;
        const range=chart.timeScale().getVisibleLogicalRange();
        const view=visibleProfileWindow(displayPoints,range,timeframe);
        const key=view?view.start+":"+view.end:"";
        if(!force&&key===profileWindowKey)return;
        profileWindowKey=key;
        latestProfileCandle=view?.lastTime;
        const calendar=marketCalendar.current;
        const sessions=view&&profileStudies.some(study=>study.type==="SessionVolumeProfile")?sessionProfileWindows(displayPoints,view,timeframe,preferences,calendar):[];
        const wanted=view&&indicatorsReady?Math.min(view.start,sessions[0]?.start??Infinity):Infinity;
        const sourceFrame=daily?"1D":"1m";
        const supplemental=wanted<profileCoverageStart?supplementalStudyHistory(sourceFrame,wanted):undefined;
        let input=profileSource;
        if(supplemental){
          const earlier=daily?supplemental.bars:visibleSessionBars(supplemental.bars,preferences,supplemental.calendar);
          const combined=new Map(earlier.map(bar=>[bar.time,bar]));
          for(const bar of profileSource)combined.set(bar.time,bar);
          input=[...combined.values()].sort((a,b)=>a.time-b.time);
        }
        const coveredFrom=Math.min(profileCoverageStart,supplemental?.coveredFrom??Infinity);
        for(const {indicator,profile,type} of profileStudies){
          const windows=type==="VisibleVolumeProfile"&&view?[view]:type==="SessionVolumeProfile"?sessions:[];
          const covered=profileWindowsWithinCoverage(windows,coveredFrom);
          profile.update(covered,input,{rows:indicator.period,valueAreaPercent:indicator.deviation??70,
            color:indicator.color,showLabels:!profileLegend.current.hidden.has(type)});
        }
        updateProfileLegend();
      }
      function refreshProfileSource() {
        if(!profileStudies.length)return;
        const input=[...bars.values()];
        profileSource=(indicatorsReady?(daily?input:visibleSessionBars(input,preferences,calendarReady?marketCalendar.current:undefined)):[])
          .sort((a,b)=>a.time-b.time);
        refreshProfiles(true);
      }
      const refreshProfileLabels=()=>{
        for(const {profile,type} of profileStudies)profile.setShowLabels(!profileLegend.current.hidden.has(type));
        updateProfileLegend();
      };
      function refreshRangeVwap() {
        if(!rangeVwapStudies.length)return;
        const start=firstVisibleChartTime(displayPoints,chart.timeScale().getVisibleLogicalRange());
        rangeVwapStart=start;
        const first=start===undefined?rangeVwapBars.length:candleIndexAtOrAfter(rangeVwapBars,start);
        const input=rangeVwapBars.slice(first);
        for(const study of rangeVwapStudies){
          const {points}=indicatorValues(input,study.indicator,timeframe)[study.index];
          studyPoints.set(study,points);
          study.series.setData(points.map(point=>({...point,time:point.time as Stamp})));
        }
        updateIndicatorLegend();
      }
      function scheduleRangeVwap() {
        if((!rangeVwapStudies.length&&!profileStudies.length)||rangeVwapFrame)return;
        rangeVwapFrame=requestAnimationFrame(()=>{
          rangeVwapFrame=0;
          if(disposed)return;
          if(rangeVwapStart!==firstVisibleChartTime(displayPoints,chart.timeScale().getVisibleLogicalRange())) refreshRangeVwap();
          refreshProfiles();
        });
      }
      const bandOrder:Readonly<Record<string,number>>={upper:0,main:1,lower:2};
      const legendStudies=[...studies].sort((a,b)=>a.indicator.id===b.indicator.id&&a.indicator.type==="Bollinger"
        ? (bandOrder[a.key]??3)-(bandOrder[b.key]??3) : 0);
      const legendValues=new Map<typeof studies[number],HTMLSpanElement>();
      const cacheOwner=`${ownerKey??""}:${priceBasisKey}`;
      let premarketTradeTotals: PremarketTradeTotals | undefined;
      const vwapReadoutKeys=new Map(studies.filter(study=>study.indicator.type==="VWAP").map(study=>
        [study,JSON.stringify([ticker,timeframe,sessionKey,study.indicator,study.key])]));
      const flushVwap=()=>chartVwapCache.flush(cacheOwner);
      window.addEventListener("pagehide",flushVwap);
      const legendSlots=Array.from(indicatorLegend.current?.querySelectorAll<HTMLElement>("[data-indicator-readout]")??[],slot=>{
        const paneId=slot.closest<HTMLElement>("[data-chart-indicator-legend]")?.dataset.chartIndicatorPane;
        const matching=legendStudies.filter(study=>(study.pane?study.indicator.id:undefined)===paneId&&
          study.indicator.type===slot.dataset.indicatorReadout&&study.indicator.output?.statusLineValues!==false);
        return {slot,matching};
      });
      type ProfileLegendReadout = {
        slot: HTMLElement;
        study: (typeof profileStudies)[number];
        span?: HTMLSpanElement;
        snapshot?: VolumeProfileSnapshot;
        precision?: number;
      };
      const profileReadouts = legendSlots.flatMap<ProfileLegendReadout>(({slot})=>{
        const study=profileStudies.find(profile=>profile.type===slot.dataset.indicatorReadout);
        return study&&study.indicator.output?.statusLineValues!==false?[{slot,study}]:[];
      });
      function updateProfileLegend() {
        if(!profileReadouts.length)return;
        const hoverTime=activeCrosshair?.time;
        const time=activeCrosshair
          ? typeof hoverTime==="number"&&displayed.has(hoverTime)?hoverTime:undefined
          : latestProfileCandle;
        const precision=candlePrecision();
        for(const readout of profileReadouts){
          const {study}=readout;
          const snapshot=profileLegend.current.hidden.has(study.type)?undefined:study.profile.profileAt(time);
          if(!snapshot){
            if(readout.span?.textContent)readout.span.textContent="";
            readout.snapshot=undefined;
            continue;
          }
          const former=readout.snapshot;
          if(former&&readout.precision===precision&&former.poc===snapshot.poc&&former.vah===snapshot.vah&&former.val===snapshot.val)continue;
          readout.snapshot=snapshot;
          readout.precision=precision;
          if(!readout.span){
            const span=document.createElement("span");
            span.dataset.indicatorValue=study.indicator.id+":main";
            span.style.color=study.indicator.color;
            readout.slot.append(span);
            readout.span=span;
          }
          const {readout:format}=indicatorNumberFormat(study.indicator,precision);
          const labels=[`POC ${format(snapshot.poc)}`, `VAH ${format(snapshot.vah)}`, `VAL ${format(snapshot.val)}`];
          if(readout.span.textContent!==labels.join(" · ")){
            const phrases=labels.map(label=>{
              const phrase=document.createElement("span");
              phrase.textContent=label;
              return phrase;
            });
            readout.span.replaceChildren(phrases[0], " · ", phrases[1], " · ", phrases[2]);
          }
        }
      }
      if(profileStudies.length)profileLegend.current.refresh=refreshProfileLabels;
      const updateIndicatorLegend=()=>{
        updateProfileLegend();
        const readoutBasis=vwapReadoutKeys.size?easternClock(Date.now()).date:"";
        for(const {slot,matching} of legendSlots){
          if (slot.dataset.indicatorReadout === "VWAP" && !daily && preferences.premarket && premarketTradeTotals &&
              matching.some(study => study.indicator.type === "VWAP" && (study.indicator.anchor ?? "Session") === "Session" &&
                study.indicator.output?.statusLineValues !== false && study.series.options().visible)) {
            const readout = slot.querySelector<HTMLElement>("[data-premarket-trade-vwap]") ?? document.createElement("span");
            const value = premarketTradeTotals.dollarVolume / premarketTradeTotals.volume;
            const through = String(premarketTradeTotals.through);
            if (readout.dataset.premarketTradeVwap !== String(value) || readout.dataset.premarketThrough !== through) {
              readout.dataset.premarketTradeVwap = String(value);
              readout.dataset.premarketThrough = through;
              readout.textContent = `Premarket trade VWAP ${value.toFixed(4)}`;
              readout.title = `Eligible trades through ${new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "2-digit" }).format(premarketTradeTotals.through * 1000)} ET`;
            }
            if (!readout.isConnected) slot.append(readout);
          }
          for(const study of matching){
            if(!study.series.options().visible)continue;
            const points=studyPoints.get(study)??[],time=activeCrosshair?.time;
            const isVwap=study.indicator.type==="VWAP";
            const carried=isVwap&&typeof time==="number"&&displayed.get(time)?.carried===true;
            // A prior positive pivot can still be in the series after the current
            // period lost its level. The resting legend belongs to the current candle.
            const readoutTime=time??(study.step?displayPoints.at(-1)?.time:undefined);
            const index=indicatorReadoutIndex(points,readoutTime,carried);
            const newest=points.at(-1);
            const readoutId=vwapReadoutKeys.get(study);
            const readoutKey=readoutId?readoutBasis+tradeCorrectionRevision+readoutId:undefined;
            if(readoutKey&&newest&&historyBasisDate===readoutBasis)chartVwapCache.writeReadout(cacheOwner,readoutKey,{...newest,precision:study.numberFormat.precision});
            const saved=readoutKey&&(!loaded||chartHalted||seedLoading||seedError)?chartVwapCache.readReadout(cacheOwner,readoutKey):undefined;
            const savedMatchesSlot=carried&&saved&&typeof time==="number"&&saved.time<=time
              &&easternClock(saved.time*1000).date===easternClock(time*1000).date;
            const fallback=saved&&(time===undefined||savedMatchesSlot)?saved.value:undefined;
            const pointValue=points[index]?.value;
            const value=pointValue??fallback;
            const {type,period}=study.indicator;
            const label=study.key==="main"&&(type==="EMA"||type==="SMA")?String(period):
              type==="Bollinger"&&study.key==="main"?"Middle":
              type==="Bollinger"&&study.key==="upper"?"Upper":
              type==="Bollinger"&&study.key==="lower"?"Lower":
              study.key==="main"&&(type==="VWAP"||study.label===chartIndicatorCatalog[type].short)?"":study.label;
            let span=legendValues.get(study);
            if(!span){
              span=document.createElement("span");
              span.dataset.indicatorValue=study.indicator.id+":"+study.key;
              legendValues.set(study,span);
              slot.append(span);
            }
            let valueText="—";
            if(typeof value==="number"&&Number.isFinite(value)){
              valueText=pointValue===undefined&&saved
                ?indicatorNumberFormat(study.indicator,saved.precision).readout(value):study.numberFormat.readout(value);
            }
            const text=(label?label+": ":"")+valueText;
            if(span.textContent!==text)span.textContent=text;
            span.style.color=study.histogram&&value!==undefined
              ?indicatorHistogramColor(study.indicator,value,points[Math.max(0,index-1)]?.value??value,preferences.upColor,preferences.downColor)
              :indicatorPlotStyle(study.indicator,study.key).color;
          }
        }
      };
      const updateStudyFormats=()=>{
        const precision=candlePrecision();
        if(precision===appliedCandlePrecision)return;
        appliedCandlePrecision=precision;
        for(const study of studies){
          const format=indicatorNumberFormat(study.indicator,precision);
          if(format.precision===study.numberFormat.precision)continue;
          study.series.applyOptions({priceFormat:format.axis});
          study.numberFormat=format;
        }
      };
      const futureIndicatorTimes=new Set<number>();
      const bandFills=studies.filter(study=>study.indicator.type==='VWAP'&&study.index===0&&study.indicator.vwapBands).flatMap(study=>study.indicator.vwapBands!.levels.map((level,index)=>{
        const primitive=new ChartBandFill(value=>study.series.priceToCoordinate(value));chart.panes()[0].attachPrimitive(primitive);
        return {indicator:study.indicator,level,index,primitive};
      }));
      const vwapFrameCache=new Map<string,IndicatorPlot[]>();
      const clouds=indicatorPlots.flatMap(({indicator})=>{
        if(indicator.type!=="Ichimoku")return [];
        const spanA=studies.find(study=>study.indicator.id===indicator.id&&study.key==="span-a");
        const spanB=studies.find(study=>study.indicator.id===indicator.id&&study.key==="span-b");
        if(!spanA||!spanB)return [];
        const fill=new ChartBandFill(value=>candles.priceToCoordinate(value));
        chart.panes()[0].attachPrimitive(fill);
        return [{spanA,spanB,fill}];
      });
      const updateBandFills=()=>{for(const fill of bandFills){const parts=vwapFrameCache.get(fill.indicator.id);fill.primitive.update(parts?.find(part=>part.key===`upper-${fill.index+1}`)?.points??[],parts?.find(part=>part.key===`lower-${fill.index+1}`)?.points??[],fill.level.fillColor,fill.level.fillOpacity,fill.level.enabled&&fill.level.fillVisible);}};
      const refreshClouds=()=>{
        for(const {spanA,spanB,fill} of clouds){
          fill.update(studyPoints.get(spanA)??[],studyPoints.get(spanB)??[],preferences.upColor,15,
            spanA.series.options().visible&&spanB.series.options().visible,preferences.downColor);
        }
      };
      const validStudyPoints=(study:typeof studies[number],points:IndicatorPlot["points"])=>{
        if(study.step)return points.filter(point=>point.value>0);
        if(logarithmic&&study.indicator.type==="RegressionChannel"&&points.some(point=>point.value<=0))return [];
        return points;
      };
      const labeledPivots=studies.filter(study=>study.step&&indicatorPriceScaleLabels(preferences,study.indicator));
      const refreshPivotLabels=()=>{
        if(!labeledPivots.length)return;
        const range=chart.timeScale().getVisibleRange();
        const last=displayPoints.at(-1)?.time;
        const time=last!==undefined&&typeof range?.from==="number"&&typeof range.to==="number"&&range.from<=last
          ?Math.min(range.to,last):undefined;
        for(const study of labeledPivots){
          // Lightweight Charts uses the nearest earlier point for axis labels.
          // A pivot level is valid only in the period on the right of the view.
          const visible=time!==undefined&&indicatorReadoutIndex(studyPoints.get(study)??[],time,false)>=0;
          if(study.series.options().lastValueVisible!==visible){
            study.series.applyOptions({lastValueVisible:visible,title:visible?study.label:""});
          }
        }
      };
      const setStudyData=(study:typeof studies[number],points:readonly {time:number;value:number}[], axis:readonly DisplayCandle[])=>{
        if(study.step){
          const levels=new Map(points.map(point=>[point.time,point.value]));
          study.series.setData(axis.map(({time})=>{
            const value=levels.get(time);
            return value!==undefined&&value>0?{time:time as Stamp,value}:{time:time as Stamp};
          }));
          return;
        }
        study.series.setData(points.map((point,index)=>({...point,time:point.time as Stamp,...(study.histogram?
          {color:indicatorHistogramColor(study.indicator,point.value,points[Math.max(0,index-1)].value,preferences.upColor,preferences.downColor)}:{})})));
      };
      const lowerPanes=chart.panes().slice(volume?2:1),lowerSpace=Math.min(50,lowerPanes.length*20);
      chart.panes()[0].setStretchFactor(100-(volume?preferences.volumeHeight:0)-lowerSpace);
      for(const pane of lowerPanes)pane.setStretchFactor(lowerSpace/lowerPanes.length);
      if(indicatorLegend.current){
        const stopLayout=observeIndicatorPaneLegends(indicatorLegend.current,chart.panes(),paneReadouts);
        const remove=removeChart;
        removeChart=()=>{stopLayout();remove?.();};
      }
      let livePrice:ReturnType<typeof candles.createPriceLine>|undefined,livePriceAt=0;
      let chartHalted=false,haltStatusAt=0,lastGuidePrice:number|null=null;
      const bars = new Map<number, Candle>(cached?.bars.map(bar=>[bar.time,bar]));
      const queued = new Map<number, Candle>();
      const archivePages: ChartArchivePage[] = [];
      const tradeCorrections = new Map<number, ChartCorrection>();
      let tradeCorrectionRevision = 0;
      const calculationHistory=new ChartCalculationHistory(ticker,abort.signal,()=>easternClock(Date.now()).date,
        (url,init)=>sharedChartFetch(`${url.replace('/api/screeners/charts/bars', endpoints.bars)}&${providerQuery}`,init),priceAdjustment);
      const calculationContexts=new Map<string,CalculationHistory&{daily:boolean;through?:number}>(),contextCoverage=new Map<string,number>(),contextPending=new Set<string>(),contextFailures=new Map<string,number>();
      let calculationView:{from:number;to:number}|null=null,calculationViewKey="",calculationViewTimer:ReturnType<typeof setTimeout>|undefined;
      const seconds=CHART_FRAME_SECONDS;
      let vwapProblem="";
      let vwapRetryAt = Infinity;
      let vwapRetryTimer: ReturnType<typeof setTimeout> | undefined;
      const waitForVwapRetry = (failedAt: number | undefined) => {
        if (failedAt === undefined || failedAt + 30_000 <= Date.now()) return false;
        vwapRetryAt = Math.min(vwapRetryAt, failedAt + 30_000);
        return true;
      };
      let calendarReady=false,calendarRetryAt=0,historyBasisDate="";
      let seedLoading=false,seedError=false;
      const pendingCalendarYears=new Set<number>(),calendarYearFailures=new Map<number,number>();
      const requestFutureCalendar=(calendar:ChartSessionCalendar,lastTime:number)=>{
        const axisYear=Number(easternClock(lastTime*1000).date.slice(0,4));let year=axisYear+1;
        while(year<=axisYear+3&&calendar.covers(Date.parse(`${year}-07-01T12:00:00Z`)/1000))year++;
        if(year>axisYear+3||year>9999||Date.now()-(calendarYearFailures.get(year)??0)<30_000)return false;
        seedLoading=true;if(pendingCalendarYears.has(year))return true;pendingCalendarYears.add(year);
        void sharedChartFetch(endpoints.calendar+'?year='+year+'&'+providerQuery,{credentials:'same-origin',signal:abort.signal,cache:'no-store'}).then(async response=>{
          if(!response.ok)throw Error('calendar_year_unavailable');const value=readChartCalendarYear(await response.json(),year);
          calendar.merge(value);marketCalendar.current.merge(value);for(const context of calculationContexts.values())context.calendar.merge(value);
        }).catch(()=>{if(!abort.signal.aborted){calendarYearFailures.set(year,Date.now());while(calendarYearFailures.size>8)calendarYearFailures.delete(calendarYearFailures.keys().next().value!);}}).finally(()=>{pendingCalendarYears.delete(year);if(!disposed)writeAll(false);});
        return true;
      };
      const pendingSeeds=new Set<string>(),seedFailures=new Map<string,number>(),seedMomentAttempts=new Map<string,number>();
      let initialViewReady = false, viewSaveTimer: ReturnType<typeof setTimeout> | undefined;
      let indicatorsReady = !useRecentHistory || !indicatorPlots.length;
      let warmupTimer: ReturnType<typeof setTimeout> | undefined;
      let loaded = false, loading = false, reloadAfter = false, connected = false, loadingOlder = false;
      const overnightBars = new Map<number, Candle>();
      const overnightLiveRevisions = new Map<number, number>();
      let overnightRevision = 0;
      const overnightBuckets = new Set<number>();
      const recordOvernight = (bar: Candle) => {
        overnightBars.set(bar.time, bar);
        overnightBuckets.add(candleBucket(bar.time, timeframe, regularOnly));
      };
      if (showOvernight) for (const bar of cached?.overnightBars ?? []) recordOvernight(bar);
      let overnightBasis = cached?.overnightBars?.length ? cached.basisDate : null;
      let overnightUnavailable = false;
      const visibleChartBars = () => [
        ...visibleSessionBars([...bars.values()], preferences, calendarReady ? marketCalendar.current : undefined),
        ...overnightBars.values(),
      ];
      let nextBefore: number | null = cached?.nextBefore??null, userPanned = false;
      const scheduleView = () => { clearTimeout(viewSaveTimer); viewSaveTimer=setTimeout(saveView,250); };
      const markPan = () => {userPanned=true;scheduleView();};
      element!.addEventListener("wheel",markPan,{passive:true});element!.addEventListener("pointerdown",markPan);element!.addEventListener("pointerup",scheduleView);
      window.addEventListener("pagehide",saveView);
      type Stamp = import("lightweight-charts").UTCTimestamp;
      const volumePoint = (bar: DisplayCandle) => bar.carried ? { time: bar.time as Stamp } : ({ time: bar.time as Stamp, value: bar.volume, color: bar.close >= bar.open ? preferences.upColor+"80" : preferences.downColor+"80" });
      let displayed = new Map<number, DisplayCandle>();
      const captionMeasure=document.createElement('canvas').getContext('2d');
      const updateDateVisibility=()=>{
        const axis=dateAxis.current;if(!axis)return;const labels=Array.from(axis.children) as HTMLElement[];
        let from=-Infinity,to=-Infinity;
        if(activeCrosshair){
          const layout=chart.options().layout;if(captionMeasure)captionMeasure.font=`${layout.fontSize}px ${layout.fontFamily}`;
          const text=chart.options().localization.timeFormatter?.(activeCrosshair.time)??'';
          const width=Math.min(chart.timeScale().width(),(captionMeasure?.measureText(String(text)).width??String(text).length*layout.fontSize)+20);
          from=Math.max(0,Math.min(activeCrosshair.point.x-width/2,chart.timeScale().width()-width));to=from+width;
        }
        const bounds=labels.map(label=>({label,left:Number.parseFloat(label.style.left),width:label.getBoundingClientRect().width}));
        for(const {label,left,width}of bounds)label.style.visibility=left<to&&left+width>from?'hidden':'visible';
      };
      const updateHover = () => {
        updateIndicatorLegend();
        updateDateVisibility();
        const time = activeCrosshair?.time;
        if (!crosshairDetails.current) return;
        const bar = typeof time === "number" ? displayed.get(time) : undefined;
        const priceFormatter = candles.priceFormatter();
        const timePrefix = bar && element!.clientWidth >= 520 ? `${formatChartTime(bar.time)} · ` : "";
        crosshairDetails.current.textContent = bar ? `${timePrefix}${bar.carried ? `Carried-forward price $${priceFormatter.format(bar.close)} · No candle returned` : `O ${priceFormatter.format(bar.open)} H ${priceFormatter.format(bar.high)} L ${priceFormatter.format(bar.low)} C ${priceFormatter.format(bar.close)} · Vol ${bar.volume.toLocaleString()}`}` : "";
      };
      chart.subscribeCrosshairMove(event => {
        if(event.point&&event.time!==undefined&&event.paneIndex===0&&crosshairTarget!=="normal"&&crosshairTarget!=="nearest"){
          const indicator=snapSeries?event.seriesData.get(snapSeries):undefined;
          const candle=event.seriesData.get(candles);
          const price=indicator&&"value" in indicator?indicator.value:
            candle&&"close" in candle?candle.close:candle&&"value" in candle?candle.value:undefined;
          if(typeof price==="number"&&Number.isFinite(price))chart.setCrosshairPosition(price,event.time,candles);
        }
        activeCrosshair = event.point && event.time !== undefined ? { point: event.point, time: event.time } : undefined;
        updateHover();
      });
      const dateFormat = new Intl.DateTimeFormat("en-US",{timeZone:displayZone,month:"short",day:"numeric"});
      const updateDates = () => {
        const axis=dateAxis.current,range=chart.timeScale().getVisibleLogicalRange();
        const right=Math.max(0,element!.clientWidth-chart.timeScale().width());
        if(axis)axis.style.right=`${right}px`;indicatorLegend.current?.style.setProperty("--chart-indicator-right",`${right}px`);
        const firstTime = daily ? undefined : firstVisibleChartTime(displayPoints, range);
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
        if(!heikinAshi&&!chartHalted&&lastGuidePrice===null){if(livePrice)candles.removePriceLine(livePrice);livePrice=undefined;return;}
        const price=lastGuidePrice??displayPoints.at(-1)?.close;
        if(!Number.isFinite(price)||!price||price<=0)return;
        const options={price,color:chartHalted?"#d32f2f":"#f39c12",title:chartHalted?"HALTED":"",axisLabelColor:chartHalted?"#d32f2f":"",axisLabelTextColor:chartHalted?"#ffffff":""};
        if(livePrice)livePrice.applyOptions(options);
        else livePrice=candles.createPriceLine({...options,lineWidth:1,lineStyle:2,axisLabelVisible:true});
      };
      const seedFor=(indicator:typeof preferences.indicators[number],actual:Candle[],calculationFrame:ChartCalculationTimeframe):VwapSeed|undefined=>{
        if(!actual.length||calculationFrame==='1D'&&indicator.hideOnDaily)return undefined;
        const basisDate=easternClock(Date.now()).date;
        if(historyBasisDate!==basisDate){seedError=true;return undefined;}
        const query=new URLSearchParams({symbol:ticker,timeframe:calculationFrame,anchor:indicator.anchor??'Session',before:String(actual[0].time),premarket:preferences.premarket?'1':'0',regular:preferences.regular?'1':'0',postmarket:preferences.postmarket?'1':'0'});
        if (unadjusted) query.set("adjustment", "raw");
        const request=parseVwapSeedRequest(query);
        const localSeed=localVwapSeed(request,basisDate);
        if(localSeed)return localSeed;
        const key=basisDate+tradeCorrectionRevision+query.toString();
        const cachedEntry=chartVwapCache.readSeed(cacheOwner,key),cached=cachedEntry?.value,validCached=cached&&validVwapSeed(cached,request,basisDate)?cached:undefined;
        const expired=validCached&&cachedEntry&&Date.now()-cachedEntry.at>=300_000;
        const needsMoments=indicator.vwapBands?.mode==='Standard deviation'&&indicator.vwapBands.levels.some(level=>level.enabled);
        const missingMoments=validCached&&validCached.volume>0&&needsMoments&&!validCached.moments;
        if(validCached&&!expired&&(!missingMoments||Date.now()-(seedMomentAttempts.get(key)??0)<30_000))return validCached;
        if(waitForVwapRetry(seedFailures.get(key))){if(!validCached)seedError=true;return validCached;}
        if(!validCached)seedLoading=true;
        if(!pendingSeeds.has(key)){
          if(missingMoments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
          pendingSeeds.add(key);
          void readChartVwapSeed(endpoints.vwapSeed+'?'+query.toString()+'&'+providerQuery,abort.signal,async response=>{
            if(!response.ok)throw Error();const value=await response.json();if(!validVwapSeed(value,request,basisDate))throw Error();
            if(needsMoments&&value.volume>0&&!value.moments){seedMomentAttempts.set(key,Date.now());while(seedMomentAttempts.size>64)seedMomentAttempts.delete(seedMomentAttempts.keys().next().value!);}
            chartVwapCache.writeSeed(cacheOwner,key,value);
          }).catch(()=>{if(!abort.signal.aborted)seedFailures.set(key,Date.now());}).finally(()=>{pendingSeeds.delete(key);if(!disposed)writeAll(false);});
        }
        return validCached;
      };
      const vwapParts=(indicator:typeof preferences.indicators[number],actual:Candle[],axis:DisplayCandle[]):IndicatorPlot[]=>{
        const frame=calendarFrame ? "1D" : indicator.calculationTimeframe ?? vwapDisplayFrame;
        if(indicator.hideOnDaily&&frame==='1D'||!actual.length)return [];
        // Session VWAP and supplementary-session prices use separate volume.
        if (overnightBars.size) axis = axis.filter(bar => !overnightBuckets.has(bar.time));
        if (!axis.length) return [];
        const vwapRegularOnly = preferences.regular && !preferences.premarket && !preferences.postmarket;
        let input=[...bars.values()],calendar=marketCalendar.current,projectionAxis=axis;
        if((frame==='1D')!==daily){
          const demand=calculationDemand(axis,calculationView);if(!demand)return [];
          const {before,through}=demand,daily=frame==='1D',key=`${historyBasisDate}:${daily}:${through??'live'}`,cached=calculationContexts.get(key);
          if(!cached||cached.basisDate!==historyBasisDate||(contextCoverage.get(key)??Infinity)>before){
            if(waitForVwapRetry(contextFailures.get(key))){seedError=true;return [];}
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
        const calculation=aggregateCandles(frame==='1D'?input:visibleSessionBars(input,preferences,calendar),frame,vwapRegularOnly);
        const seed=seedFor(indicator,calculation,frame);if(!seed)return [];
        if(seed.volume===0&&calculation.every(bar=>bar.volume===0))vwapProblem='VWAP unavailable: no volume data.';
        else if(seed.events&&!seed.events.dates.length)vwapProblem=`VWAP: no ${seed.events.anchor==='Splits'?'split':'dividend'} events in available data.`;
        try{
          const parts=indicatorValues(calculation,indicator,frame,{vwapSeed:seed,calendar});
          if(parts.some(part=>part.unavailable))vwapProblem=parts.some(part=>part.unavailableReason==='numeric')?'VWAP band values exceed the supported numeric range.':'Some VWAP band history could not load.';
          const interval=(time:number,tf:ChartCalculationTimeframe)=>{
            if(tf!=='1D')return calculationInterval(time,tf,preferences,calendar);
            const row=calendar.sessionAt(time);if(!row)throw Error('daily_session_unavailable');
            return {time,close:row.start+row.closeMinute*60};
          };
          const chartIntervals=calendarFrame||frame===vwapDisplayFrame?[]:projectionAxis.map(bar=>interval(bar.time,vwapDisplayFrame));
          const offset=indicator.offset??0,axisTimes=axis.map(bar=>bar.time),axisPositions=new Map(axisTimes.map((time,index)=>[time,index]));
          const positionsCache=new Map<number,{times:number[];available:Set<number>}>();
          const anchorCache=new Map<string,string>();
          const anchorFor=(time:number)=>{const date=calendar.sessionAt(time)?.session.date;if(!date)return undefined;let key=anchorCache.get(date);if(key===undefined){key=vwapAnchorKey(date,indicator.anchor??'Session',seed.events?.dates);anchorCache.set(date,key);}return key;};
          return parts.map(part=>{
            const values=part.points;
            const projected=calendarFrame?sampleCalendarVwap(values,calendarFrame):frame===timeframe?carryVwapPoints(values,axis,(a,b)=>{const key=anchorFor(a);return key!==undefined&&key===anchorFor(b);}):projectVwap(chartIntervals,values.map(point=>({...interval(point.time,frame),value:point.value})),{higherTimeframe:seconds[frame]>seconds[vwapDisplayFrame],waitForClose:indicator.waitForClose??true,now:Date.now()/1000});
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
      const writeAll = (initial: boolean, prepend = false, keepView = false) => {
        drawingVolumeBars=undefined;
        seedLoading=false;seedError=false;vwapProblem="";vwapRetryAt=Infinity;vwapFrameCache.clear();futureIndicatorTimes.clear();
        calendarReady=daily||[...bars.values()].every(bar=>marketCalendar.current.covers(bar.time));
        setSessionMessage(studies.some(study=>study.indicator.type==="VWAP")&&!calendarReady?"VWAP unavailable: trading-session data could not load.":"");
        const actual = mergeChartArchivePages(
          aggregateCandles(daily ? bars.values() : visibleChartBars(), timeframe, regularOnly),
          archivePages,
        );
        const data = displayCandles(actual, timeframe, connected ? candleBucket(Math.floor(Date.now() / 1000) - 60, timeframe,regularOnly) : undefined).filter(bar=>daily||!bar.carried||isVisibleSession(bar.time,preferences,calendarReady?marketCalendar.current:undefined));
        const oldFirst = displayPoints[0]?.time;
        const range = chart.timeScale().getVisibleLogicalRange();
        const oldIndex = range ? Math.max(0, Math.floor(range.from)) : 0;
        const anchor = keepView ? displayPoints[oldIndex]?.time : undefined;
        displayPoints = data;
        displayed = new Map(data.map(bar => [bar.time, bar]));
        const defaultView = defaultChartView(timeframe, chart.timeScale().width(), data.length);
        const previousCount = candles.data().length;
        calculationView=initial?null:range;
        priceStyle.set(data);
        renderPriceGuide();
        if(initial&&!(restorePrice?savedView!.autoScale:preferences.autoScale)&&data.length){const recent=data.slice(-defaultView.visibleBars),low=Math.min(...recent.map(b=>b.low)),high=Math.max(...recent.map(b=>b.high)),margin=Math.max((high-low)*0.05,high*0.01,0.0001);chart.priceScale("right").setVisibleRange(restore?.priceRange??{from:Math.max(0.0001,low-margin),to:high+margin});}
        volume?.setData(data.map(volumePoint));
        const calculated = indicatorsReady ? studyParts(actual,displayPoints) : undefined;
        for(const study of indicatorsReady ? studies : []){
          if(study.indicator.type==="RangeVWAP")continue;
          const part=study.indicator.type==='VWAP'?{points:[]}:calculated!.get(study.indicator.id)![study.index];
          const points=study.indicator.type==='VWAP'?vwapPoints(study.indicator,actual,data,study.index):
            validStudyPoints(study,part.points);
          studyPoints.set(study,points);
          setStudyData(study,points,data);
        }
        indicatorAxis?.setData([...futureIndicatorTimes].sort((a,b)=>a-b).map(time=>({time:time as Stamp})));
        updateStudyFormats();refreshPivotLabels();updateIndicatorLegend();
        updateBandFills();refreshClouds();
        const hasVwapSnapshot=[...vwapReadoutKeys.values()].some(key=>chartVwapCache.readReadout(cacheOwner,historyBasisDate+key));
        if(calendarReady)setSessionMessage(vwapProblem ||
          (!hasVwapSnapshot && (seedLoading || seedError) ? "Calculating VWAP…" : ""));
        clearTimeout(vwapRetryTimer);
        if (Number.isFinite(vwapRetryAt)) {
          vwapRetryTimer = setTimeout(() => { if (!disposed) writeAll(false, false, true); },
            Math.max(0, vwapRetryAt - Date.now()));
        }
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
          const newIndex = anchor === undefined ? -1 : candleIndexAtOrAfter(data, anchor);
          const added = prepend && oldFirst !== undefined ? Math.max(0,data.findIndex(bar=>bar.time===oldFirst))
            : range.to >= previousCount - 1 ? data.length - previousCount
            : newIndex >= 0 && newIndex < data.length ? newIndex - oldIndex : 0;
          chart.timeScale().setVisibleLogicalRange({from:range.from + added,to:range.to + added});
        }
        if(rangeVwapStudies.length){
          rangeVwapBars=indicatorsReady?actual:[];
          refreshRangeVwap();
        }
        refreshProfileSource();
        updateDates();
        renderJournalOverlay();
        renderEvidence();
        renderSplitMarkers();
      };
      function renderSplitMarkers() {
        if (!splits.length && !splitMarkers) return;
        const observed = daily ? [...bars.values()] : visibleChartBars();
        for (const page of archivePages) observed.push(...page.bars);
        const projected = projectChartSplits(splits, observed, timeframe, regularOnly,
          nextBefore === null ? undefined : Math.ceil(nextBefore / 1000))
          .filter(marker => displayed.has(marker.time));
        const key = JSON.stringify(projected);
        if (key === splitMarkerKey) return;
        splitMarkerKey = key;
        splitByMarker = new Map(projected.map(({ split }) => [`split:${split.id}`, split]));
        splitsByCandle = new Map();
        for (const { time, split } of projected) {
          const events = splitsByCandle.get(time);
          if (events) events.push(split);
          else splitsByCandle.set(time, [split]);
        }
        const markers = projected.map(({ split, time }) => ({
          id: `split:${split.id}`, time: time as Stamp, position: "aboveBar" as const, shape: "square" as const,
          text: "Split", color: dark ? "#c4b5fd" : "#6941c6",
        }));
        if (splitMarkers) splitMarkers.setMarkers(markers);
        else if (markers.length) splitMarkers = createSeriesMarkers(candles, markers, { autoScale: false });
      }

      function loadSplitMarkers() {
        const date = easternClock(Date.now()).date;
        if (splitsDate === date || splitsPending || Date.now() < splitRetryAt) return;
        splitsPending = true;
        const query = new URLSearchParams({ symbol: ticker, generation: providerKey });
        void sharedChartFetch(`${endpoints.splits}?${query}`, { cache: "no-store", signal: abort.signal })
          .then(async response => {
            if (!response.ok) throw Error("split_history_unavailable");
            const result = await response.json();
            if (disposed || result.symbol !== ticker || result.basisDate !== date ||
              date !== easternClock(Date.now()).date) return;
            splits = parseChartSplits(result.splits);
            if (result.coverageStart === null) splitRetryAt = Date.now() + 60_000;
            else splitsDate = date;
            renderSplitMarkers();
          }).catch(() => { splitRetryAt = Date.now() + 30_000; })
          .finally(() => { splitsPending = false; });
      }

      let evidenceMarkers: ISeriesMarkersPluginApi<Time> | undefined;
      let evidenceZones: ChartEvidenceZones | undefined;
      let previousEvidenceKey = "";
      let previousEvidence: ResolvedChartEvidence | undefined;

      function renderEvidence(changedTime?: number) {
        const input = evidenceInput.current;
        const nextEvidence = input.evidence;
        if (!nextEvidence && !previousEvidence) return;
        if (changedTime !== undefined && nextEvidence === previousEvidence && nextEvidence) {
          const layer = nextEvidence[input.evidenceContext]?.events;
          if (layer?.state !== "ready" || !layer.facts.some(event => event.trigger.plotTime === changedTime)) return;
        }
        const overlay = nextEvidence && projectChartOverlay({
          evidence: nextEvidence,
          context: input.evidenceContext,
          generation: providerKey,
          symbol: ticker,
          frame: timeframe,
          sessionMode: showOvernight ? "overnight" : regularOnly ? "regular" : "extended",
          candleAt: time => displayed.get(time),
        });
        const key = JSON.stringify([input.evidenceContext, input.structureVisible, input.levelsVisible, overlay]);
        if (key === previousEvidenceKey && nextEvidence === previousEvidence) return;
        previousEvidenceKey = key;
        previousEvidence = nextEvidence;
        setReadout(overlay && nextEvidence ? { overlay, evidence: nextEvidence, context: input.evidenceContext, frame: timeframe } : undefined);
        const events = input.structureVisible ? overlay?.events ?? [] : [];
        const markers = events.map(event => ({
          id: `evidence:${event.id}`,
          time: event.trigger.plotTime as Stamp,
          position: (event.kind === "swing" ? event.direction === "up" : event.direction === "down") ? "aboveBar" as const : "belowBar" as const,
          shape: event.kind === "swing" ? "circle" as const : event.direction === "up" ? "arrowUp" as const : "arrowDown" as const,
          color: event.direction === "up" ? preferences.upColor : preferences.downColor,
        })).sort((left, right) => left.time - right.time);
        if (markers.length) {
          if (evidenceMarkers) evidenceMarkers.setMarkers(markers);
          else evidenceMarkers = createSeriesMarkers(candles, markers, { autoScale: false });
        } else if (evidenceMarkers) {
          evidenceMarkers.detach();
          evidenceMarkers = undefined;
        }
        const zones = input.levelsVisible ? overlay?.zones ?? [] : [];
        if (zones.length) {
          if (!evidenceZones) {
            evidenceZones = new ChartEvidenceZones(price => candles.priceToCoordinate(price), {
              support: preferences.upColor, resistance: preferences.downColor, text: dark ? "#c7d2df" : "#354358",
            });
            chart.panes()[0].attachPrimitive(evidenceZones);
          }
          evidenceZones.update(zones);
        } else if (evidenceZones) {
          chart.panes()[0].detachPrimitive(evidenceZones);
          evidenceZones = undefined;
        }
      }
      let journalMarkers: ISeriesMarkersPluginApi<Time> | undefined;
      let journalMarkerBuckets: ReturnType<typeof makeJournalMarkers>["buckets"] = new Map();

      function renderJournalOverlay() {
        const overlay = journalEngineBridge.getOverlay();
        const journalMarks = overlay?.scope === journalScope && overlay.symbol === ticker ? overlay.items : [];
        // The selected trade already supplies its executions. Keep personal note pins alongside the analysis.
        const items = activeTradeContext
          ? [...activeTradeContext.marks, ...journalMarks.filter(item => item.kind === "note")]
          : journalMarks;
        if (!items.length) {
          if (journalMarkers) {
            journalMarkers.detach();
            journalMarkers = undefined;
            journalMarkerBuckets.clear();
          }
          return;
        }
        const result = makeJournalMarkers(items, {
          timeframe, regularOnly, sortedCandles: displayPoints, hasCandle: (time) => displayed.has(time),
        }, (time) => daily || isVisibleSession(time, preferences,
            calendarReady ? marketCalendar.current : undefined));
        journalMarkerBuckets = result.buckets;
        if (journalMarkers) journalMarkers.setMarkers(result.markers);
        else if (result.markers.length) journalMarkers = createSeriesMarkers(candles, result.markers, { autoScale: false });
      }

      let focusingJournal = false;
      function moveToJournalCandles(from: number, to: number) {
        const { first: firstBucket, last: lastBucket } = chartJournalFocusBounds(from, to, timeframe, regularOnly);
        const firstIndex = candleIndexAtOrAfter(displayPoints, firstBucket);
        const first = displayPoints[firstIndex];
        if (!first) return false;
        if (first.time > lastBucket) return false;
        // A partial bar on either side keeps the plotted fills visible with context.
        let lastIndex = firstIndex;
        while (lastIndex + 1 < displayPoints.length && displayPoints[lastIndex + 1].time <= lastBucket) lastIndex++;
        const surrounding = activeTradeContext ? Math.max(12, Math.ceil((lastIndex - firstIndex) * 0.25)) : 5;
        chart.timeScale().setVisibleLogicalRange({
          from: Math.max(0, firstIndex - surrounding), to: Math.min(displayPoints.length + 2, lastIndex + surrounding),
        });
        return true;
      }

      async function focusJournal() {
        const target = journalEngineBridge.getFocus();
        if (!target || target.scope !== focusScope || target.symbol !== ticker || !loaded || loading || focusingJournal || disposed) return;
        focusingJournal = true;
        try {
          if (!moveToJournalCandles(target.from, target.to)) {
            const midnightTomorrow = easternDayStart(Date.parse(`${chartJournalDayAt(target.to)}T12:00:00Z`) / 1000 + 86400);
            const through = calendarFrame ? nextChartCalendarPeriod(target.to, calendarFrame) : midnightTomorrow;
            const before = Math.min(Date.now(), through * 1000) - 1;
            const query = new URLSearchParams({ history: "1", symbol: ticker, daily: daily ? "1" : "0", before: String(before) });
            const result = await readHistory(query);
            if (disposed || journalEngineBridge.getFocus() !== target) return;
            if (result.basisDate !== historyBasisDate || !Array.isArray(result.bars)) throw Error();
            marketCalendar.current.merge(result.calendar);
            result.calendars?.forEach((value) => marketCalendar.current.merge(value));
            const combined = new Map(bars);
            for (const bar of result.bars) if (!combined.has(bar.time)) combined.set(bar.time, bar);
            if (displayCandles(aggregateCandles(combined.values(), timeframe, regularOnly), timeframe).length <= 80_000) {
              for (const [time, bar] of combined) bars.set(time, bar);
              writeAll(false, true);
            }
            if (!moveToJournalCandles(target.from, target.to)) throw Error();
          }
          if (journalEngineBridge.getFocus() === target) journalEngineBridge.setStatus("");
        } catch {
          if (!disposed && journalEngineBridge.getFocus() === target) {
            journalEngineBridge.setStatus("Candles for this trade could not be shown in the selected timeframe and sessions.");
          }
        } finally {
          focusingJournal = false;
          if (journalEngineBridge.getFocus() === target && !disposed) journalEngineBridge.clearFocus(target);
          else if (!disposed) void focusJournal();
        }
      }
      const journalEngine = { symbol: ticker, renderOverlay: renderJournalOverlay, focus: focusJournal };
      const detachJournalEngine = focusScope ? journalEngineBridge.registerEngine(journalEngine) : undefined;
      const idleStatus=()=>!bars.size?"No candles for this symbol.":!displayPoints.length?"No candles in selected sessions.":"";
      let recentHistory = useRecentHistory && !cached;
      let catchingUp = Boolean(cached);
      const loadHistory = async (initialRequest?: ReturnType<typeof requestHistory>) => {
        if (loading) { reloadAfter = true; return; }
        loading = true;
        // Every refresh after the first paint must finish any outstanding warm-up.
        const warmup = loaded && !indicatorsReady;
        try {
          let recent = !warmup && recentHistory && (!loaded || historyBasisDate === easternClock(Date.now()).date);
          const deltaRequested = Boolean(initialRequest && catchUpFrom !== null);
          let data = { ...await (initialRequest ?? requestHistory(recent)).catch(error => {
            if (!deltaRequested || abort.signal.aborted) throw error;
            return requestHistory();
          }) };
          if (disposed) return;
          const delta = deltaRequested && data.catchUpFrom === catchUpFrom && data.basisDate === cached?.basisDate &&
            data.basisDate === easternClock(Date.now()).date;
          if (deltaRequested && !delta && data.catchUpFrom !== undefined) {
            data = { ...await requestHistory() };
            if (disposed) return;
          }
          if (recent && !visibleSessionBars(data.bars, preferences).length) {
            recentHistory = false;
            recent = false;
            data = { ...await requestHistory() };
            if (disposed) return;
          }
          let pageCoverageStart=data.complete===false?Infinity:chartPageCoverageStart(data.nextBefore);
          if(data.complete!==false&&!delta&&(!loaded||catchingUp)&&savedView&&data.bars.length&&savedView.anchor.time<candleBucket(data.bars[0].time,timeframe,regularOnly)){
            const history=await calculationHistory.read(timeframe,savedView.anchor.time);
            if(disposed)return;
            recent = false;
            data.bars=history.bars;data.basisDate=history.basisDate;marketCalendar.current=history.calendar;
            pageCoverageStart=history.coveredFrom;
            data.nextBefore=history.bars.length?history.bars[0].time*1000-1:data.nextBefore;
          }
          const basisDate=easternClock(Date.now()).date;
          if(data.basisDate!==basisDate)throw Error("Candle history could not load on the selected price basis. Try again.");
          const newBasis=historyBasisDate!==basisDate;historyBasisDate=basisDate;
          if (newBasis) {
            if (splitsDate !== basisDate) {
              splits = [];
              setSelectedSplits([]);
            }
            archivePages.length = 0;
            drawingVolumeHistory = undefined;
            drawingVolumeFrom = Infinity;
          }
          marketCalendar.current.merge(data.calendar);if(Array.isArray(data.calendars))for(const value of data.calendars)marketCalendar.current.merge(value);
          const initial = !loaded;
          if (!recent) indicatorsReady = true;
          if (warmup) recentHistory = false;
          if (delta) {
            for (const time of bars.keys()) if (time * 1000 >= catchUpFrom!) bars.delete(time);
          } else {
            if(initial || catchingUp || newBasis){bars.clear();profileCoverageStart=pageCoverageStart;}
            else profileCoverageStart=Math.min(profileCoverageStart,pageCoverageStart);
            if(warmup || initial || catchingUp || newBasis){nextBefore=data.nextBefore??null;}
          }
          catchingUp = false;
          for (const bar of data.bars as Candle[]) bars.set(bar.time, bar);
          for (const bar of queued.values()) bars.set(bar.time, bar);
          if (!daily) for (const correction of tradeCorrections.values()) applyChartCorrection(bars, correction);
          queued.clear(); loaded = true;
          writeAll(initial, warmup); initialViewReady=true; setError(null);
          if (initial && !indicatorsReady) {
            // Yield to the browser before starting the full indicator history request.
            warmupTimer = setTimeout(() => { if (!disposed && !loading && !indicatorsReady) void loadHistory(); }, 0);
          }
          setStatus(idleStatus());
          loadSplitMarkers();
        } catch (failure) {
          if (!disposed && warmup) setSessionMessage("Indicator history could not load. Retrying shortly.");
          else if (!disposed && catchingUp) setStatus("Catching up…");
          else if (!disposed) setError(failure instanceof Error ? failure.message : "Candles unavailable.");
          if (!disposed && !loaded && journalEngineBridge.getFocus()?.symbol === ticker) {
            journalEngineBridge.setStatus("Candles for this trade could not load.");
          }
        }
        finally {
          loading = false;
          if (reloadAfter && !disposed) { reloadAfter = false; void loadHistory(); }
          else if (!disposed) void focusJournal();
        }
      };
      const olderHistoryMargin = 40;
      const emptyOlderHistoryNotice = "No candles in that period. Pan left again to continue.";
      const loadOlder = async () => {
        if(disposed||loading||loadingOlder||!indicatorsReady||nextBefore===null)return;
        loadingOlder=true;userPanned=false;setHistoryMessage("Loading older candles…");
        try {
          const before = nextBefore;
          // Journal focus and VWAP still need the legacy minute and calendar inputs.
          const journalNeedsBaseHistory = () => Boolean(activeTradeContext || focusingJournal || journalEngineBridge.getFocus());
          const archiveWindow = !broker && !unadjusted && !showOvernight && !journalNeedsBaseHistory() &&
            !studies.some(study => study.indicator.type === "VWAP")
            ? chartArchiveWindow(before, timeframe, preferences) : null;
          if (archiveWindow) {
            const completed = await readCompletedChartHistory(ticker, archiveWindow, providerQuery, abort.signal);
            if (disposed) return;
            if (completed?.basisDate === historyBasisDate && historyBasisDate === easternClock(Date.now()).date &&
                !journalNeedsBaseHistory()) {
              const merged = mergeChartArchivePages(displayPoints.filter(bar => !bar.carried), [completed]);
              if (displayCandles(merged, timeframe).length > 80_000) {
                nextBefore = null;
                setHistoryMessage("Chart history limit reached. Use a larger timeframe for older dates.");
              } else {
                archivePages.push(completed);
                nextBefore = completed.start * 1000 - 1;
                setHistoryMessage(completed.bars.length ? "" : emptyOlderHistoryNotice);
                writeAll(false, true);
              }
              return;
            }
          }
          const query = new URLSearchParams({ history: "1", symbol: ticker, daily: daily ? "1" : "0", before: String(before) });
          const page=await readHistory(query).catch(() => { throw Error("Older candles could not load. Pan left again to retry."); });if(disposed)return;if(page.basisDate!==historyBasisDate||historyBasisDate!==easternClock(Date.now()).date)throw Error("Price adjustments changed. Reload the chart.");marketCalendar.current.merge(page.calendar);if(Array.isArray(page.calendars))for(const value of page.calendars)marketCalendar.current.merge(value);
          const combined=new Map(bars);for(const bar of page.bars as Candle[])if(!combined.has(bar.time))combined.set(bar.time,bar);
          const projected=displayCandles(mergeChartArchivePages(
            aggregateCandles(combined.values(), timeframe, regularOnly), archivePages,
          ), timeframe);
          if(projected.length>80_000){nextBefore=null;setHistoryMessage("Chart history limit reached. Use a larger timeframe for older dates.");}
          else {
            setHistoryMessage("");
            bars.clear();
            for (const [time, bar] of combined) bars.set(time, bar);
            if((before+1)/1000>=profileCoverageStart){
              profileCoverageStart=Math.min(profileCoverageStart,chartPageCoverageStart(page.nextBefore));
            }
            nextBefore = page.nextBefore ?? null;
            writeAll(false, true);
            const range = chart.timeScale().getVisibleLogicalRange();
            if (!page.bars.length && range && range.from < olderHistoryMargin) {
              setHistoryMessage(emptyOlderHistoryNotice);
            }
          }

        }catch(failure){if(!disposed)setHistoryMessage(failure instanceof Error?failure.message:"Older candles could not load.");}
        finally{loadingOlder=false;}
      };
      async function loadLater() {
        if (disposed || loading || loadingOlder || contextThrough === null || contextThrough >= latestHistoryBar) return;
        const through = contextThrough;
        const next = Math.min(latestHistoryBar, daily
          ? nextChartCalendarPeriod((through + 1) / 1000, "1Y") * 1000 - 1
          : through + 20 * 86_400_000);
        const query = new URLSearchParams({ history: "1", symbol: ticker, daily: daily ? "1" : "0", before: String(next) });
        loadingOlder = true;
        userPanned = false;
        setHistoryMessage("Loading later candles…");
        try {
          const page = await readHistory(query).catch(() => { throw Error("Later candles could not load. Pan right to retry."); });
          if (disposed) return;
          if (page.basisDate !== historyBasisDate || historyBasisDate !== easternClock(Date.now()).date) throw Error("Price adjustments changed. Reload the chart.");
          const combined = new Map(bars);
          const newBars = (page.bars as Candle[]).filter(bar => bar.time * 1000 > through);
          for (const bar of newBars) combined.set(bar.time, bar);
          if (displayCandles(aggregateCandles(combined.values(), timeframe, regularOnly), timeframe).length > 80_000) {
            contextThrough = latestHistoryBar;
            setHistoryMessage("Chart history limit reached. Use a larger timeframe.");
            return;
          }
          contextThrough = next;
          marketCalendar.current.merge(page.calendar);
          if (Array.isArray(page.calendars)) for (const value of page.calendars) marketCalendar.current.merge(value);
          for (const bar of newBars) bars.set(bar.time, bar);
          writeAll(false, true);
          setHistoryMessage(newBars.length || next === latestHistoryBar ? "" : "No candles in that period. Pan right to continue.");
        } catch (failure) {
          if (!disposed) setHistoryMessage(failure instanceof Error ? failure.message : "Later candles could not load.");
        } finally {
          loadingOlder = false;
        }
      }
      function saveView(){
        if(!loaded||!initialViewReady||!ownerKey||!viewId||!displayPoints.length)return;
        const logicalRange=chart.timeScale().getVisibleLogicalRange(),range=chart.timeScale().getVisibleRange();
        if(!logicalRange||!range||typeof range.from!=="number"||typeof range.to!=="number")return;
        const index=Math.max(0,Math.min(displayPoints.length-1,Math.floor(logicalRange.from)));
        chartViews.write(ownerKey,viewWorkspace,viewId,{symbol:ticker,timeframe,sessions:sessionKey,basisDate:historyBasisDate,
          range:{from:range.from,to:range.to},logicalRange:{from:logicalRange.from,to:logicalRange.to},
          axis:{first:displayPoints[0].time,last:displayPoints.at(-1)!.time,count:displayPoints.length,sessions:sessionKey},
          anchor:{time:displayPoints[index].time,offset:logicalRange.from-index},priceRange:chart.priceScale("right").getVisibleRange(),
          autoScale:chart.priceScale("right").options().autoScale,preferenceAutoScale:preferences.autoScale,priceScalePolicy:1,logarithmic});
      }
      let previousVisibleTo = 0;
      let wasNearOlderHistory = false;
      chart.timeScale().subscribeVisibleLogicalRangeChange(range=>{
        priceStyle.scheduleReference();
        scheduleRangeVwap();
        refreshPivotLabels();
        const movedRight = Boolean(range && range.to > previousVisibleTo);
        if (range) previousVisibleTo = range.to;
        const nearOlderHistory = Boolean(range && range.from < olderHistoryMargin);
        if (range && wasNearOlderHistory && !nearOlderHistory) {
          setHistoryMessage(message => message === emptyOlderHistoryNotice ? "" : message);
        }
        wasNearOlderHistory = nearOlderHistory;
        updateDates();
        if (range && userPanned && !loadingOlder) {
          if (activeTradeContext && movedRight && range.to > displayPoints.length - 30) void loadLater();
          else if (nearOlderHistory) void loadOlder();
        }
        if(range&&loaded&&!calendarFrame&&studies.some(study=>study.indicator.type==='VWAP'&&((study.indicator.calculationTimeframe??vwapDisplayFrame)==='1D')!==daily)){
          const key=range.from.toFixed(2)+':'+range.to.toFixed(2);
          if(key!==calculationViewKey){calculationViewKey=key;clearTimeout(calculationViewTimer);calculationViewTimer=setTimeout(()=>{if(!disposed&&loaded)writeAll(false);},50);}
        }
      });
      let lastBarReceivedAt = Date.now(), lastRecoveryAt = 0;
      let streamHasConnected = false;
      const recentOvernight = String(new URLSearchParams({ history: "1", symbol: ticker, daily: "0", recent: "1" }));
      const overnightPending = new Set<string>();
      function selectOvernightBasis(date: string) {
        if (overnightBasis === date) return;
        if (overnightBasis !== null) {
          overnightBars.clear();
          overnightLiveRevisions.clear();
          overnightBuckets.clear();
        }
        overnightBasis = date;
      }
      readOvernightHistory = query => {
        if (disposed || overnightUnavailable || overnightPending.size >= 4 || overnightPending.has(query)) return;
        const params = new URLSearchParams(query);
        params.set("overnight", "1");
        if (unadjusted) params.set("adjustment", "raw");
        params.set("generation", providerKey);
        overnightPending.add(query);
        const requestedAt = overnightRevision;
        void sharedChartFetch(`${endpoints.bars}?${params}`, { signal: abort.signal, credentials: "same-origin" })
          .then(async response => {
            if (response.status === 404) { overnightUnavailable = true; return; }
            if (!response.ok || disposed) return;
            const result = await response.json() as { bars: Candle[]; basisDate: string; adjustment?: "raw" | "split" };
            if (disposed || !Array.isArray(result.bars) || (result.adjustment ?? "split") !== priceAdjustment ||
              result.basisDate !== easternClock(Date.now()).date) return;
            selectOvernightBasis(result.basisDate);
            for (const bar of result.bars) {
              if ((overnightLiveRevisions.get(bar.time) ?? 0) <= requestedAt && (overnightBars.has(bar.time) || overnightBars.size < 80_000)) {
                recordOvernight(bar);
              }
            }
            if (loaded && overnightBars.size) writeAll(false, false, true);
          }).catch(() => { /* Ordinary session candles are already available. */ })
          .finally(() => overnightPending.delete(query));
      };
      for (const query of overnightHistoryRequests) readOvernightHistory(query);
      overnightHistoryRequests.clear();

      let overnightState: string | undefined;
      const overnightActive = () => Boolean(overnightState && overnightState !== "closed" && chartOvernightTradingDate(Date.now()));
      const receivePrice = (event: Event, overnight: boolean) => {
        if (disposed || overnightActive() !== overnight) return;
        const message = JSON.parse((event as MessageEvent).data) as {price:number;time:string};
        const at = Date.parse(message.time);
        if (!Number.isFinite(message.price) || message.price <= 0 || !Number.isFinite(at) || at < livePriceAt) return;
        livePriceAt = at;
        lastGuidePrice = message.price;
        renderPriceGuide();
      };

      const receiveBar = (event: Event, overnight: boolean) => {
        if (disposed) return;
        const message = JSON.parse((event as MessageEvent).data) as { bar: Candle; daily: boolean };
        if (message.daily !== daily) return;
        const bar = message.bar;
        if (unadjusted && easternClock(bar.time * 1000).date !== easternClock(Date.now()).date) return;
        if (overnight) {
          if (!chartOvernightTradingDate(bar.time * 1000)) return;
          selectOvernightBasis(easternClock(Date.now()).date);
          recordOvernight(bar);
          overnightLiveRevisions.set(bar.time, ++overnightRevision);
          if (!loaded) return;
        } else {
          if (!daily && tradeCorrections.has(bar.time)) return;
          lastBarReceivedAt = Date.now();
          if (!loaded || loading || catchingUp) queued.set(bar.time, bar);
          if (historyBasisDate && historyBasisDate !== easternClock(Date.now()).date) {
            queued.set(bar.time, bar);
            if (!loading) void loadHistory();
            return;
          }
          if (!loaded) return;
          bars.set(bar.time, bar);
          calculationHistory.acceptLive(bar, message.daily);
        }
        if(studies.some(study=>study.indicator.type==='VWAP'&&(study.indicator.offset||!calendarFrame&&study.indicator.calculationTimeframe&&study.indicator.calculationTimeframe!==timeframe))){writeAll(false);return;}
        if(!overnight&&!daily&&!marketCalendar.current.covers(bar.time)&&Date.now()>=calendarRetryAt){calendarRetryAt=Date.now()+60_000;void loadHistory();}

        const bucket = candleBucket(bar.time, timeframe,regularOnly);
        const last = displayPoints.at(-1);
        if (last && bucket === last.time) {
          // The active candle moves with trades; avoid replacing the full chart per tick.
          const inputs = daily ? [...bars.values()] : visibleChartBars();
          const periodEnd = calendarFrame ? nextChartCalendarPeriod(bucket, calendarFrame) : 0;
          const current = timeframe === "1D" ? bar : aggregateCandles(
            inputs.filter(value => calendarFrame
              ? value.time >= bucket && value.time < periodEnd
              : candleBucket(value.time, timeframe, regularOnly) === bucket),
            timeframe, regularOnly,
          ).at(-1);
          if (current) {
            const updated = { ...current, carried: false };
            displayPoints[displayPoints.length - 1] = updated; displayed.set(bucket, updated);
            if(drawingVolumeBars&&(overnight||daily||isVisibleSession(bar.time,preferences,
              calendarReady?marketCalendar.current:undefined))){
              const index=candleIndexAtOrAfter(drawingVolumeBars,bar.time);
              if(index<drawingVolumeBars.length-1||index===drawingVolumeBars.length-1&&drawingVolumeBars[index].time!==bar.time){
                drawingVolumeBars=undefined;
              }else drawingVolumeBars[index]=bar;
            }
            priceStyle.update(updated, displayPoints.at(-2)); volume?.update(volumePoint(updated));
            if(heikinAshi)renderPriceGuide();
            renderEvidence(bucket);
            const actual = studies.length ? displayPoints.filter(value => !value.carried) : [];
            vwapFrameCache.clear();
            const calculated = indicatorsReady ? studyParts(actual,displayPoints) : undefined;
            for (const study of indicatorsReady ? studies : []) {
              if(study.indicator.type==="RangeVWAP"||study.indicator.type==="VWAP"&&!calendarReady)continue;
              const part = study.indicator.type==='VWAP'?{points:vwapPoints(study.indicator,actual,displayPoints,study.index)}:calculated!.get(study.indicator.id)![study.index];
              if(study.step||study.indicator.type==="ZigZag"||study.indicator.type==="RegressionChannel"||
                study.indicator.type==="Alligator"||study.indicator.type==="Ichimoku"){
                const points=validStudyPoints(study,part.points);
                studyPoints.set(study,points);
                setStudyData(study,points,displayPoints);
                continue;
              }
              const latest = part.points.at(-1);
              const previous = studyPoints.get(study)?.at(-1);
              studyPoints.set(study,part.points);
              if (previous && (latest === undefined || latest.time < previous.time)) {
                study.series.pop(1);
              } else if (latest) study.series.update({ ...latest, time: latest.time as Stamp, ...(study.histogram ? {color:indicatorHistogramColor(study.indicator,latest.value,part.points.at(-2)?.value??latest.value,preferences.upColor,preferences.downColor)} : {}) });
            }
            if(rangeVwapStudies.length){
              rangeVwapBars=indicatorsReady?actual:[];
              refreshRangeVwap();
            }
            refreshProfileSource();
            updateStudyFormats();refreshPivotLabels();updateIndicatorLegend();
            updateBandFills();refreshClouds();
          }
        } else {
          // New buckets and corrected old bars must also reconcile carried positions.
          writeAll(false);
        }
      };
      if (!activeTradeContext) {
      source = sharedChartStream(`${endpoints.stream}?symbol=${encodeURIComponent(ticker)}&daily=${daily ? "1" : "0"}&${providerQuery}${showOvernight ? "&overnight=1" : ""}${broker && unadjusted ? "&adjustment=raw" : ""}`, daily);
      source.addEventListener("status", event => {
        if (disposed) return;
        const state = JSON.parse((event as MessageEvent).data).state;
        if (state !== "connected" && !chartHalted && livePrice && !overnightActive()) {
          candles.removePriceLine(livePrice);
          livePrice = undefined;
          lastGuidePrice = null;
          if(heikinAshi)renderPriceGuide();
        }
        const wasConnected = connected;
        connected = state === "connected";
        if (connected && !wasConnected) {
          const reconnecting = streamHasConnected;
          streamHasConnected = true;
          if (loaded && (reconnecting || !daily && !catchingUp)) {
            if (!loading) void loadHistory();
            else reloadAfter = true;
          }
        }
        if (loaded && !catchingUp) setStatus(connected ? idleStatus() : state === "unavailable" ? "Feed unavailable." : "Connecting…");
      });
      source.addEventListener("price", event => receivePrice(event, false));
      source.addEventListener("trading-status", event => {
        if (disposed) return;
        const message = JSON.parse((event as MessageEvent).data) as {symbol:string;available:boolean;status?:{symbol:string;halted:boolean;observedAt:string}|null};
        if (!message.available || message.symbol !== ticker || message.status?.symbol !== ticker || typeof message.status.halted !== "boolean") return;
        const at=Date.parse(message.status.observedAt);
        if (!Number.isFinite(at)||at<haltStatusAt) return;
        haltStatusAt=at;chartHalted=message.status.halted;renderPriceGuide();updateIndicatorLegend();
      });
      source.addEventListener("bar", event => receiveBar(event, false));
      source.addEventListener("chart-correction", event => {
        let correction: ChartCorrection;
        try { correction = parseChartCorrection(JSON.parse((event as MessageEvent).data)); }
        catch { return; }
        if (disposed || correction.symbol !== ticker ||
            easternClock(correction.minute * 1000).date !== easternClock(Date.now()).date ||
            JSON.stringify(tradeCorrections.get(correction.minute)) === JSON.stringify(correction)) return;
        tradeCorrections.set(correction.minute, correction);
        if (correction.premarket && (!premarketTradeTotals || correction.premarket.through >= premarketTradeTotals.through)) {
          premarketTradeTotals = correction.premarket;
        }
        tradeCorrectionRevision++;
        calculationHistory.invalidate();
        calculationContexts.clear(); contextCoverage.clear(); contextFailures.clear();
        if (!daily) {
          applyChartCorrection(bars, correction);
          queued.delete(correction.minute);
          const affected = candleBucket(correction.minute, timeframe, regularOnly);
          for (let index = archivePages.length - 1; index >= 0; index--) {
            const page = archivePages[index];
            if (page.start <= affected && affected < page.end) archivePages.splice(index, 1);
          }
        }
        if (loaded) writeAll(false, false, true);
      });
      if (showOvernight) {
        source.addEventListener("overnight-price", event => receivePrice(event, true));
        source.addEventListener("overnight-bar", event => receiveBar(event, true));
        source.addEventListener("overnight-status", event => {
          const state = JSON.parse((event as MessageEvent).data).state;
          if (state === "connected" && overnightState !== "connected") readOvernightHistory(recentOvernight);
          overnightState = state;
        });
      }
      if(!calendarFrame&&studies.some(study=>study.indicator.type==='VWAP'&&((study.indicator.calculationTimeframe??vwapDisplayFrame)==='1D')!==daily)){
        const daily=!usesDailyCandles(timeframe);
        auxiliarySource=sharedChartStream(`${endpoints.stream}?symbol=${encodeURIComponent(ticker)}&daily=${daily?'1':'0'}&${providerQuery}`, daily);
        auxiliarySource.addEventListener('bar',event=>{
          if(disposed)return;
          const message=JSON.parse((event as MessageEvent).data) as {bar:Candle;daily:boolean};
          if(message.daily!==daily || unadjusted && easternClock(message.bar.time * 1000).date !== easternClock(Date.now()).date)return;
          calculationHistory.acceptLive(message.bar,daily);
          for(const cached of calculationContexts.values())if(cached.daily===daily&&cached.through===undefined&&cached.basisDate===easternClock(Date.now()).date){const combined=new Map(cached.bars.map(bar=>[bar.time,bar]));combined.set(message.bar.time,message.bar);cached.bars=[...combined.values()].sort((a,b)=>a.time-b.time);}
          if(loaded)writeAll(false);
        });
        auxiliarySource.addEventListener('status',event=>{if(!disposed&&JSON.parse((event as MessageEvent).data).state==='connected'){calculationHistory.invalidate();advancedHistory.clear();calculationContexts.clear();contextCoverage.clear();if(loaded)writeAll(false);}});
      }
      source.onerror = () => {
        if(disposed)return;
        connected=false;
        overnightState=undefined;
        if(livePrice&&!chartHalted){candles.removePriceLine(livePrice);livePrice=undefined;lastGuidePrice=null;if(heikinAshi)renderPriceGuide();}
        if(loaded && !catchingUp)setStatus("Reconnecting…");
      };
      }
      let confirmationMinute=Math.floor(Date.now()/60_000);
      const confirmationTimer=setInterval(()=>{const minute=Math.floor(Date.now()/60_000);if(minute!==confirmationMinute){confirmationMinute=minute;if(!disposed&&loaded&&!calendarFrame&&studies.some(study=>study.indicator.type==='VWAP'&&study.indicator.calculationTimeframe&&study.indicator.calculationTimeframe!==timeframe))writeAll(false);}},1000);
      const recoverHistory = () => {
        if(disposed||document.hidden||activeTradeContext)return;
        source?.reconnectIfClosed();
        auxiliarySource?.reconnectIfClosed();
        const now=Date.now(), clock=easternClock(now);
        const day=new Date(clock.date+"T12:00:00Z").getUTCDay();
        const tradingHours=day!==0&&day!==6&&clock.minute>=240&&clock.minute<1200;
        const needsHistory=catchingUp||!loaded||historyBasisDate!==clock.date||
          tradingHours&&!chartHalted&&(!connected||now-lastBarReceivedAt>=120_000);
        if((needsHistory || !indicatorsReady)&&!loading&&now-lastRecoveryAt>=60_000){
          lastRecoveryAt=now;
          void loadHistory();
        }
      };
      const gapTimer=setInterval(()=>{
        recoverHistory();
        if(!disposed&&loaded&&connected&&!loading&&!daily&&historyBasisDate===easternClock(Date.now()).date)writeAll(false);
      },60_000);
      document.addEventListener("visibilitychange",recoverHistory);
      window.addEventListener("online",recoverHistory);
      window.addEventListener("pageshow",recoverHistory);
      const remove = removeChart;
      removeChart = () => {
        detachJournalEngine?.();
        journalMarkers?.detach();
        if(profileLegend.current.refresh===refreshProfileLabels)profileLegend.current.refresh=undefined;
        evidenceMarkers?.detach();
        splitMarkers?.detach();
        if (evidenceZones) chart.panes()[0].detachPrimitive(evidenceZones);
        if (evidenceRender.current === renderEvidence) evidenceRender.current = undefined;
 document.removeEventListener("visibilitychange",recoverHistory);window.removeEventListener("online",recoverHistory);window.removeEventListener("pageshow",recoverHistory);saveView();flushVwap();window.removeEventListener("pagehide",flushVwap);clearTimeout(viewSaveTimer);window.removeEventListener("pagehide",saveView);element!.removeEventListener("pointerup",scheduleView);clearInterval(gapTimer);clearInterval(confirmationTimer);clearTimeout(calculationViewTimer);cancelAnimationFrame(rangeVwapFrame);clearTimeout(warmupTimer);clearTimeout(vwapRetryTimer);if(cacheKey && !historyHasGaps && loaded && !catchingUp && indicatorsReady && !archivePages.length && bars.size && bars.size+overnightBars.size<=20_000){
        recentChartCandles.delete(cacheKey);
        recentChartCandles.set(cacheKey,{basisDate:historyBasisDate,bars:[...bars.values()],
          ...(overnightBars.size && overnightBasis === historyBasisDate ? {overnightBars:[...overnightBars.values()]} : {}),
          nextBefore,profileCoverageStart,calendar:marketCalendar.current,savedAt:Date.now()});
        while(recentChartCandles.size>4)recentChartCandles.delete(recentChartCandles.keys().next().value!);
      } element!.removeEventListener("wheel",markPan);element!.removeEventListener("pointerdown",markPan);dateAxis.current?.replaceChildren();for(const {slot} of legendSlots)slot.replaceChildren();remove?.(); };
      evidenceRender.current = renderEvidence;
      if (cached) {
        historyBasisDate = cached.basisDate;
        loaded = true;
        indicatorsReady = !indicatorPlots.length;
        writeAll(true);
        initialViewReady = true;
        setStatus("Catching up…");
      }
      updateIndicatorLegend();
      await loadHistory(initialHistory);
    }
    void start().catch(() => { abort.abort(); if (!disposed) setError("Chart could not load. Try again."); });
    return () => { disposed = true; abort.abort(); source?.close(); auxiliarySource?.close(); removeChart?.(); };
  }, [replayActive,movementKind,logarithmic,ticker, timeframe, daily, calendarFrame, vwapDisplayFrame, regularOnly, attempt, dark, preferences, ready, ownerKey, viewId, viewWorkspace, showOvernight, indicatorPlots, crosshairTarget, journalEngineBridge, journalScope, focusScope, activeTradeContext, tradeMarksById, onTradeMarkClick, providerKey, providerQuery, marketData.ready, broker, endpoints, priceAdjustment, unadjusted, archiveDailyStartup]);

  useEffect(() => {
    if (!activeTradeContext || !ready) return;
    const target = { symbol: ticker, from: activeTradeContext.from, to: activeTradeContext.to, scope: focusScope };
    return journalEngineBridge.startFocus(target);
  }, [activeTradeContext, focusScope, journalEngineBridge, ready, ticker, timeframe, tradeFocusRevision]);

  const mainToolbar = viewWorkspace === "main";
  const preferenceButtonHeight = compact ? compactToolbarHeight : mainToolbar ? 34 : 44;
  const preferencesButtons = <>
    <IconButton size="small" aria-label="Chart settings" title="Chart settings" aria-haspopup="dialog"
      disabled={!ready} onClick={() => openPreferences("settings")}
      sx={{ width: 44, height: preferenceButtonHeight, flexShrink: 0 }}>
      <SettingsOutlined fontSize="small" />
    </IconButton>
    {!movementKind && !replayActive && <IconButton size="small" aria-label="Indicators" title="Indicators" aria-haspopup="dialog"
      disabled={!ready} onClick={() => openIndicators()}
      sx={{ width: compact || !mainToolbar ? 44 : 34, height: preferenceButtonHeight, flexShrink: 0 }}>
      <NetworkCheck fontSize="small" />
    </IconButton>}
  </>;
  const multiviewButton = onOpenMultiview && (
    <IconButton size="small" aria-label="Open Multiview for this chart view" title="Multiview" aria-haspopup="dialog" disabled={!ready}
      onClick={onOpenMultiview} sx={{ width: compact ? 44 : 34, height: compact ? compactToolbarHeight : 34, flexShrink: 0 }}>
      <GridViewOutlined fontSize="small" />
    </IconButton>
  );
  const journalButton = journalScope ? <IconButton size="small" title="Journal" aria-label={`Journal for ${ticker}`}
    aria-expanded={Boolean(journal.current?.open)} aria-controls={journal.panelId}
    onClick={journal.open} sx={{ width: compact ? 36 : 34, height: compact ? compactToolbarHeight : 34, flexShrink: 0 }}>
    <MenuBookOutlined fontSize="small" />
  </IconButton> : null;
  const evidenceButtonSize = {
    minWidth: 44, px: compact ? 0.625 : 0.75, flexShrink: 0, whiteSpace: "nowrap",
    minHeight: compact ? compactToolbarHeight : { xs: 44, md: 27 },
    fontSize: compact ? 12 : undefined, textTransform: compact ? "none" : undefined,
  };
  const evidenceButtons = evidence && <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexShrink: 0 }}>
    <Button size="small" aria-pressed={structureVisible} onClick={() => setStructureVisible(value => !value)}
      sx={{ ...evidenceButtonSize, bgcolor: structureVisible ? "action.selected" : undefined }}>Structure</Button>
    <Button size="small" aria-pressed={levelsVisible} onClick={() => setLevelsVisible(value => !value)}
      sx={{ ...evidenceButtonSize, bgcolor: levelsVisible ? "action.selected" : undefined }}>Levels</Button>
  </Box>;
  const tickerField = onSymbolChange && ticker === baseTicker
    ? <ChartTickerField key={ticker} symbol={ticker} timeframe={timeframe} onSubmit={onSymbolChange} disabled={!ready}/>
    : null;
  const companyButton = onOpenCompanyDetails && <IconButton size="small" title="Company details"
    aria-label={`Company details for ${ticker}`} aria-haspopup="dialog"
    onClick={() => onOpenCompanyDetails(ticker)}
    sx={{ ml: 0.5, width: compactToolbarHeight, height: compactToolbarHeight, flexShrink: 0 }}>
    <BusinessOutlined sx={{ fontSize: 17 }} />
  </IconButton>;
  const timeframeControl = replayActive
    ? <Typography variant="caption" color="text.secondary" noWrap>Bar Replay</Typography>
    : movementKind
    ? <Typography variant="caption" noWrap>{movementKind === "renko" ? "Renko" : "Range Bars"} · ${preferences.movementStep ?? 0.01}</Typography>
    : <Button size="small" variant="outlined" color="inherit"
      aria-label={`${ticker} timeframe ${timeframe}`} aria-haspopup="menu" aria-expanded={Boolean(frameAnchor)}
      onClick={event => setFrameAnchor(event.currentTarget)} disabled={!ready}
      sx={{ minWidth: 0, minHeight: 0, height: 24, px: 0.5, py: 0, flexShrink: 0, textTransform: "none",
        color: "text.primary", borderColor: "divider", fontSize: 12, lineHeight: 1, gap: 0.25 }}>
      {timeframe}
      <KeyboardArrowDown sx={{ fontSize: 14 }} />
    </Button>;
  const crosshairReadout = <Box ref={crosshairDetails} data-chart-crosshair-details sx={{
    flex: 1, minWidth: 0, minHeight: 16,
    zIndex: 2, pointerEvents: "none", px: 0.5, fontSize: 10, color: "text.secondary",
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
    "&:not(:empty) + [data-chart-inline-status]": { display: "none" },
  }} />;
  const overlayReadout = evidence?.chartGeneration === providerKey &&
    readout?.evidence === evidence && readout?.context === evidenceContext && readout?.frame === timeframe
    ? readout.overlay : undefined;
  return <Box data-traderslink-chart={ticker} data-chart-price-adjustment={priceAdjustment} sx={[{ borderRadius: 0, height: "100%", position: "relative", minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }, ...(Array.isArray(sx) ? sx : [sx])]}>
    {compact ? <Stack data-chart-compact-toolbar direction="row" sx={{
      alignItems: "center", px: 0.375, pt: "2px", height: compactToolbarHeight + 2, boxSizing: "border-box", flexShrink: 0, gap: 0.25,
      overflowX: "auto", overflowY: "hidden", scrollbarWidth: "none",
      "& > *": { flexShrink: 0 },
      "& > .MuiIconButton-root": { minHeight: 0, maxHeight: compactToolbarHeight, minWidth: 0, maxWidth: compactToolbarHeight, p: 0.5 },
    }}>
      <Box data-chart-identity sx={{ display: "flex", alignItems: "center", gap: 0.5, flex: tickerField ? "0 0 auto" : "1 1 auto",
        minWidth: chartIdentity && !tickerField ? 64 : 32, "& .MuiTabs-root, & .MuiTab-root": { minHeight: compactToolbarHeight, py: 0 } }}>
        {tickerField ?? chartIdentity ?? <Typography noWrap sx={{ color: dark ? "warning.main" : "#354358", fontSize: 12, fontWeight: 700, flexShrink: 0, maxWidth: "100%" }}>{ticker}</Typography>}
      </Box>
      {companyButton}
      {tickerField && chartIdentity && <Box sx={{ minWidth: 54, maxWidth: 130, flex: "1 0 54px", "& .MuiTabs-root, & .MuiTab-root": {
        minHeight: compactToolbarHeight, py: 0,
      } }}>{chartIdentity}</Box>}
      <Box sx={{ display: "flex", alignItems: "center", ml: "auto" }}>{timeframeControl}</Box>
      {preferencesButtons}
      {evidenceButtons}
      {!movementKind && !replayActive && drawingToolbar}
      {journalButton}
      {multiviewButton}
      {actions}
      {closeAction}
    </Stack> : <>    <Stack direction="row" sx={{ alignItems: "center", gap: 0.25, px: 0.5, minHeight: 27, flexWrap: "wrap" }}>
      <Typography sx={{ color:dark?"warning.main":"#354358",fontSize: 11, fontWeight: 700, mr: 0.5 }}>{ticker}</Typography>
      {timeframeControl}
      {preferencesButtons}
      {evidenceButtons}
      {!movementKind && !replayActive && drawingToolbar}
      {journalButton}
      {multiviewButton}
      {actions}
      {!mainToolbar && closeAction}
      {!movementKind&&!replayActive&&status?<Typography role="status" sx={{ ml: "auto", fontSize: 10, color: "text.secondary" }}>{status}</Typography>:null}
      {mainToolbar && closeAction && <Box sx={{ ml: "auto" }}>{closeAction}</Box>}
    </Stack>
</>}
    <Menu anchorEl={frameAnchor} open={Boolean(frameAnchor)} onClose={() => setFrameAnchor(null)}
      slotProps={{ list: { dense: true, sx: { py: 0.5, "& .MuiMenuItem-root": { minHeight: 32, px: 1.25 } } } }}>
      {CHART_TIMEFRAMES.map(value => <MenuItem key={value} selected={timeframe === value} disabled={!ready || disabledTimeframes.includes(value)} onClick={() => { if (onTimeframeChange) onTimeframeChange(value); else setActiveTimeframe(value); setFrameAnchor(null); }}>{value}</MenuItem>)}
    </Menu>
    {marketData.message && <Typography role="status" sx={{ px: 1, fontSize: 11 }}>{marketData.message}</Typography>}
    {!movementKind&&!replayActive&&drawingSaveError&&<Typography role="alert" sx={{px:1,fontSize:11}}>{drawingSaveError}</Typography>}
    {!ready&&message?<Typography role="alert" sx={{px:1,fontSize:12}}>{message}</Typography>:null}
    {activeTradeContext && journal.status && !journal.current?.open && <Typography role="status" sx={{ fontSize: 11, px: 0.5 }}>{journal.status}</Typography>}
    {!movementKind && !replayActive && partialHistory && <Typography role="status" sx={{ fontSize: 11, px: 0.5 }}>Some candles could not be loaded from the data provider.</Typography>}
    {!movementKind&&!replayActive&&historyMessage?<Typography role="status" sx={{fontSize:11,px:0.5}}>{historyMessage}</Typography>:null}
    {!movementKind && unadjusted && <Typography variant="caption" sx={{ px: 0.5 }}>Unadjusted prices</Typography>}
    {evidence && preferences.priceAdjustment === "raw" && <Typography variant="caption" sx={{ px: 0.5 }}>
      Matched evidence uses split-adjusted prices
    </Typography>}
    {!movementKind&&selectedSplits.map(split => <Typography key={split.id} role="status" sx={{ fontSize: 11, px: 0.5 }}>
      {chartSplitLabel(split)} · Effective {split.date}
    </Typography>)}
    {evidence && <Box component="details" data-chart-evidence={evidenceContext} sx={{ px: 0.75, fontSize: 11 }}>
      <Box component="summary" sx={{ cursor: "pointer" }}>{evidenceContext === "match" ? "Matched evidence" : "Chart evidence"}</Box>
      {evidence.match && <Button size="small" onClick={() => setShowCurrentEvidence(value => !value)}>
        {evidenceContext === "match" ? "Show current evidence" : "Show matched evidence"}
      </Button>}
      <Box sx={{ maxHeight: 80, overflow: "auto" }}>
        {marketData.ready && evidence.chartGeneration !== providerKey && <Typography variant="caption" component="div">
          Evidence unavailable for this data connection
        </Typography>}
        {overlayReadout?.missingEvent && structureVisible && <Typography variant="caption" component="div">
          {evidenceContext === "match"
            ? overlayReadout.missingCandle ? "Original candle unavailable" : "Original structure unavailable"
            : overlayReadout.missingCandle ? "Evidence candle unavailable" : "Structure unavailable"}
        </Typography>}
        {overlayReadout?.missingZone && levelsVisible && <Typography variant="caption" component="div">
          {evidenceContext === "match" ? "Original Levels unavailable" : "Levels unavailable"}
        </Typography>}
        {structureVisible && overlayReadout?.events.slice(-8).map(event => <Typography key={event.id} variant="caption" component="div"
          data-chart-event={event.id} data-candle-revision={event.trigger.revision} data-candle-time={event.trigger.plotTime}>
          {event.trigger.frame.toUpperCase()} {event.direction === "up" ? "↑" : "↓"} {evidenceEventLabels[event.kind]} · {evidenceTime.format(event.knownAt * 1000)}
        </Typography>)}
        {levelsVisible && overlayReadout?.zones.map(zone => <Typography key={JSON.stringify([zone.mapId, zone.mapRevision, zone.zoneId])}
          variant="caption" component="div" data-chart-zone={zone.zoneId} data-map-revision={zone.mapRevision}
          data-zone-frame={zone.sourceFrame} data-zone-lower={zone.lower} data-zone-upper={zone.upper}>
          {zone.sourceFrame === "1D" ? "Daily" : zone.sourceFrame.toUpperCase()} {zone.side} {formatEvidencePrice(zone.lower)}–{formatEvidencePrice(zone.upper)}
          {zone.freshness === "stale" ? " · Historical" : ""}
        </Typography>)}
      </Box>
    </Box>}
    {!movementKind&&!replayActive&&error ? <Stack role="alert" direction="row" sx={{ alignItems: "center", px: 1, gap: 1 }}><Typography sx={{ fontSize: 12 }}>{error}</Typography><Button size="small" onClick={() => setAttempt(value => value + 1)}>Retry</Button></Stack> : null}
    {replayActive ? <Suspense fallback={<Typography role="status" variant="caption">Loading replay…</Typography>}>
      <BarReplayChart key={JSON.stringify([ticker, providerKey, preferences.priceAdjustment, preferences.premarket, preferences.regular, preferences.postmarket])}
        symbol={ticker} generation={providerKey} initialTimeframe={timeframe}
        preferences={preferences} dark={dark} barsEndpoint={endpoints.bars} onClose={()=>setReplaying(false)}/>
    </Suspense> : movementKind ? marketData.ready && <Suspense fallback={<Typography role="status" variant="caption">Loading trade chart…</Typography>}>
      <PriceMovementChart key={`${ticker}:${movementKind}:${providerKey}`} kind={movementKind} symbol={ticker} generation={providerKey}
        step={preferences.movementStep??0.01} dark={dark} style={preferences}/>
    </Suspense> : <Box sx={{display:"flex",flex:1,minHeight:0,minWidth:0}}>
    {drawingLeftToolbar}
    <Box ref={indicatorLegend} sx={{flex:1,minHeight:0,minWidth:0,position:"relative",isolation:"isolate"}}>
    <Box ref={container} sx={{position:"absolute",inset:0,zIndex:0}}/>
    <Box sx={{ position: "absolute", top: 2, left: 8, right: "var(--chart-indicator-right, 65px)", zIndex: 2,
      display: "flex", alignItems: "baseline", pointerEvents: "none" }}>
      {crosshairReadout}
      {compact && status && <Typography role="status" data-chart-inline-status noWrap sx={chartIdentity
        ? { position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }
        : { fontSize: 10, color: "text.secondary", maxWidth: "50%", pr: 0.5 }}>{status}</Typography>}
    </Box>
    <ChartIndicatorLegend types={priceReadoutTypes} hidden={hiddenIndicatorValues}
      dark={dark} openType={openIndicatorPane===undefined?indicatorMenu?.type:undefined}
      onOpenOptions={(type,anchor)=>setIndicatorMenu({anchor,type})}/>
    {lowerReadouts.map(indicator=><ChartIndicatorLegend key={indicator.id} paneId={indicator.id} types={[indicator.type]}
      hidden={hiddenIndicatorValues} dark={dark}
      openType={openIndicatorPane===indicator.id?indicatorMenu?.type:undefined}
      onOpenOptions={(type,anchor)=>setIndicatorMenu({anchor,type})}/>)}
    <Box ref={dateAxis} data-chart-date-axis sx={{position:"absolute",zIndex:2,bottom:0,left:0,right:65,height:26,pointerEvents:"none",overflow:"hidden"}}/>{drawingOverlay}</Box>
    </Box>}
    {!movementKind&&!replayActive&&sessionMessage && <Typography role="status" data-chart-vwap-status
      sx={{ flexShrink: 0, fontSize: 11, px: 0.75, color: "text.secondary" }}>{sessionMessage}</Typography>}
    <Menu anchorEl={indicatorMenu?.anchor} open={Boolean(indicatorMenu)} onClose={()=>setIndicatorMenu(null)}>
      {indicatorMenu?[
        <MenuItem key="settings" onClick={()=>{openIndicators(indicatorMenu.type);setIndicatorMenu(null);}}>Settings</MenuItem>,
        <MenuItem key="hide" onClick={()=>{changeIndicatorDisplay(indicatorMenu.type,"hidden",true);setIndicatorMenu(null);}}>Hide details</MenuItem>,
        <MenuItem key="off" onClick={()=>{changeIndicatorDisplay(indicatorMenu.type,"enabled",false);setIndicatorMenu(null);}}>Turn off</MenuItem>,
      ]:null}
    </Menu>
    {journalAccountRef && (journal.current || journalDisplay.active && (journalDisplay.showFills || journalDisplay.showNotes)) && <Suspense fallback={null}>
      <ChartJournalPanel key={journal.scope} accountRef={journalAccountRef} symbol={ticker}
        drawingOwner={ownerKey} tradeContextActive={Boolean(activeTradeContext)} allowAnalyzer={!tradeContext} open={Boolean(journal.current?.open)} display={journalDisplay} portalContainer={journalPortal} onClose={journal.close} onOpen={journal.open}
        onReview={journal.review} focusStatus={journal.status} register={journal.register}
        setOverlay={journal.setOverlay} panelId={journal.panelId} />
    </Suspense>}
    {preferencesOpened ? <Suspense fallback={null}><ChartPreferencesPanel onBarReplay={marketData.ready&&!movementKind&&!evidence&&!activeTradeContext&&!journal.current?.open&&!replayActive?()=>{setPanel(null);setReplaying(true);}:undefined} reviewChartStyles={reviewChartStyles} ticker={ticker} timeframe={timeframe} panel={panel} onClose={()=>setPanel(null)} preferences={{...accountPreferences,logarithmic}} crosshairLines={crosshairLines} onChange={changePreferences} message={message} initialIndicator={initialIndicator} chartIndicators={chartIndicators} onChartIndicatorsChange={changeChartIndicators} indicatorDisplay={indicatorDisplay} onIndicatorDisplayChange={changeIndicatorDisplay}/></Suspense> : null}
  </Box>;
}
