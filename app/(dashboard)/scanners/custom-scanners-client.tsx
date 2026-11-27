"use client";

import { scanPatterns, type ScanPattern } from "@/src/modules/scanner/custom/candle-patterns";
import { crossReferences, type CrossReference, eventFilters, needsBarVwap, isBenchmarkStudy, isCandleStudy, isReaction, studyFrames, studyPeriods, zoneStates, type StudyFrame } from "@/src/modules/scanner/custom/audited-filters";
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, FormControlLabel, IconButton, ListSubheader, MenuItem, Stack, Switch, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import CandlestickChartOutlined from "@mui/icons-material/CandlestickChartOutlined";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import SaveOutlined from "@mui/icons-material/SaveOutlined";
import {
  EMPTY_SCAN, isDirectionalPriceMove, isEventScanMetric, isOpeningRangeMetric, isRollingScanMetric, scanMetricUsesMinutes, isScanSelectionMetric, SCAN_EXCHANGE_CHOICES, SCAN_SESSION_LABELS, MAX_INTRADAY_MINUTES, MAX_LEVEL_BREAK_HOURS, parseScanDefinition, requiresScannerLevelRead, SAVED_SCAN_ID, SCAN_CATEGORIES, SCAN_METRICS,
  type SavedScan, type ScanDefinition, type ScanMatch, type ScanMetric, type ScanRule,
} from "@/src/modules/scanner/custom/definition";
import { customIndicatorTitle, indicatorComparisons, isCustomIndicatorMetric, isIndicatorCross, MAX_CUSTOM_PERIOD,
  type CustomIndicator } from "@/src/modules/scanner/custom/custom-indicator";
import { CustomIndicatorFields, type IndicatorDraft } from "./custom-indicator-fields";
import { isSameTimeVolumeMetric, isScanIndicatorMetric, scanSignalFrames, scanSignalGroups, scanSignalLabels,
  RELEASE_LOOKBACK_HOURS, SIGNAL_LOOKBACK_MINUTES } from "@/src/modules/scanner/custom/signal-filters";
import { builtInScanChoices, builtInScanForChoice, livePresetChoices, originalBuiltInScan } from "@/src/modules/scanner/custom/built-in-scans";
import { scannerSetupStudies } from "@/src/modules/scanner/custom/setup-details";
import { DashboardPanel } from "@/app/dashboard-template";
import type { PressReleaseArticle } from "@/src/modules/news/contracts/press-release-dashboard-contracts";
import { SCANNER_SECTORS } from "@/src/modules/scanner/live/sectors";
import { SCANNER_SECURITY_TYPES, scannerSecurityType } from "@/src/modules/scanner/live/security-types";
import { SCANNER_OPENING_RANGE_MINUTES } from "@/src/modules/scanner/live/contracts";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { MarketChart } from "../charts/market-chart";
import { ScannerNewsDrawerProvider } from "../screeners/scanner-news-drawer-context";
import { CustomScanResults } from "./custom-scan-results";
import { ShareSavedScan } from "./share-saved-scan";
import { ScannerInlineMatch, ScannerStudyReadings } from "./scanner-match-chart";
import { useCustomScanResults, useSavedCustomScans } from "./use-custom-scans";
import { ScannerFilterPicker } from "./scanner-filter-picker";
import {
  ScannerQuickFilters, quickRelativeVolumeMetrics, quickVolumeMetrics,
  type QuickNumericFilter, type QuickRange, type QuickRvolMetric, type QuickVolumeMetric,
} from "./scanner-quick-filters";

const OriginalScannerResults = dynamic(() =>
  import("../screeners/live-screeners-client").then(module => module.LiveScreenersClient),
  { ssr:false, loading:()=> <Alert severity="info">Loading scanner results…</Alert> },
);
const PressReleaseArticleDrawer = dynamic(() =>
  import("../press-releases/press-release-article-drawer").then(module => module.PressReleaseArticleDrawer),
);

type Draft = Omit<ScanRule, "minimum" | "maximum" | "minutes" | "indicator" | "comparison" | "selection"> & {
 id:string; minimum:string; maximum:string; minutes:string; selection?:string; releaseUnit?:ReleaseUnit; releaseHours?:number; custom?:IndicatorDraft;
};
type ReleaseUnit = "Minutes" | "Hours" | "Days";
const releaseUnits: readonly ReleaseUnit[] = ["Minutes", "Hours", "Days"];
function inReleaseHours(amount: number, unit: ReleaseUnit) {
  return unit === "Minutes" ? amount / 60 : unit === "Days" ? amount * 24 : amount;
}
function displayReleaseHours(hours: number, unit: ReleaseUnit) {
  if (unit === "Days") return String(hours / 24);
  if (unit === "Hours") return String(hours);
  const minutes = Math.round(hours * 60);
  return String(minutes / 60 === hours || minutes * (1 / 60) === hours ? minutes : hours * 60);
}
// Retain the stored hours when another unit displays a repeating fraction.
function savedReleaseWindow(hours: number) {
  const minutes = displayReleaseHours(hours, "Minutes");
  const useMinutes = hours < 1 || (!Number.isInteger(hours) && Number.isInteger(Number(minutes)));
  const releaseUnit: ReleaseUnit = useMinutes ? "Minutes" : "Hours";
  return { releaseUnit, releaseHours: hours, maximum: useMinutes ? minutes : String(hours) };
}

const releaseAbbreviation = {Minutes:"m",Hours:"h",Days:"d"} as const;
type DraftGroup = { id:string; match:ScanMatch; rules:Draft[] };
type DraftState = { cadence?: ScanDefinition["cadence"]; rules:Draft[]; match:ScanMatch; groups:DraftGroup[]; sort:ScanDefinition["sort"] };
type FilterLayout = "side" | "top";
const defaultIndicator:IndicatorDraft={comparison:"crossUp",against:"average",fast:"9",slow:"20",period:"14",level:"50"};
const metrics = Object.keys(SCAN_METRICS) as ScanMetric[];
const metricOptions = SCAN_CATEGORIES.map(category => ({
  category,
  metrics: metrics.filter(metric => metric !== "volume" && SCAN_METRICS[metric].category === category),
}));
const volumeScopes = quickVolumeMetrics.filter(metric => metric !== "volume");
const desktopQuickMetrics = new Set<ScanMetric>([
  "price", "float", "dayChange", "tradingSession", ...quickRelativeVolumeMetrics, ...quickVolumeMetrics,
]);
const draftValue = (value: number | null) => value === null ? "" : String(value);
function toDraft(definition:ScanDefinition): DraftState {
  const rulesToDraft=(rules:readonly ScanRule[])=>rules.map(rule=>{
    const {indicator,comparison,selection,...base}=rule;
    const maximum=rule.maximum;
    const custom=indicator&&comparison?{
      ...defaultIndicator,comparison,
      ...((indicator.kind==="ema"||indicator.kind==="sma")?{fast:String(indicator.fast),slow:String(indicator.slow)}:{}),
      ...((indicator.kind==="priceEma"||indicator.kind==="priceSma")?{against:"close" as const,period:String(indicator.period)}:{}),
      ...(indicator.kind==="rsi"?{period:String(indicator.period),level:String(indicator.level)}:{}),
    }:undefined;
    return { ...base,id:crypto.randomUUID(),custom, ...(selection ? {selection:selection.join((rule.metric === "listingIndustry" || rule.metric === "prHeadline" || rule.metric === "recentFiling") ? "; " : ", ")} : {}), minimum:draftValue(rule.minimum),minutes:String(rule.minutes??5),
      ...(rule.metric==="pressRelease"&&maximum!==null
        ? savedReleaseWindow(maximum)
        : {maximum:draftValue(maximum)})};
  });
  return {cadence:definition.cadence,sort:definition.sort,match:definition.match??"all",rules:rulesToDraft(definition.rules),
    groups:(definition.groups??[]).map(group=>({id:crypto.randomUUID(),match:group.match,rules:rulesToDraft(group.rules)}))};
}
function customConfig(metric:ScanMetric, custom:IndicatorDraft):CustomIndicator{
  if ((metric==="customEma"||metric==="customSma") && custom.against==="close")
    return {kind:metric==="customEma"?"priceEma":"priceSma",period:Number(custom.period)};
  if(metric==="customEma"||metric==="customSma")return {kind:metric==="customEma"?"ema":"sma",fast:Number(custom.fast),slow:Number(custom.slow)};
  if(metric==="customRsi")return {kind:"rsi",period:Number(custom.period),level:custom.level.trim()?Number(custom.level):NaN};
  return {kind:"vwap"};
}
function starterDefinition(choice: string) {
  const starter = originalBuiltInScan(choice)?.templateChoice ?? choice;
  return builtInScanForChoice(starter)?.definition;
}
function newFilterRule(metric: ScanMetric): Draft {
  const custom = isCustomIndicatorMetric(metric);
  return {
    id: crypto.randomUUID(), metric, minimum: (metric === "activeHalt" || metric === "floatMissing" || metric==="candlePattern") ? "1" : "",
    maximum: metric === "pressRelease" || metric === "confirmed4hBreak" ? "24" :
      isReaction(metric) ? "5" : Object.hasOwn(eventFilters,metric) ? "1" : metric === "tradeResumed" ? "60" : metric === "indicatorSignal" || custom ? "15" : "",
    minutes: "5",
    ...((isScanIndicatorMetric(metric) || custom) && { frame: isSameTimeVolumeMetric(metric) ? "15m" : "5m" }),
    ...(isCandleStudy(metric) && {studyFrame:isBenchmarkStudy(metric)?"1D" as const:"5m" as const,period:metric==="macdHistogram"?26:20}),
    ...(metric==="candlePattern" && {pattern:"doubleBottom" as const}),
    ...(metric==="crossReference" && {reference:"previousDayHigh" as const,direction:"up" as const}),
    ...(metric==="macdHistogram" && {fastPeriod:12,signalPeriod:9}),
    ...(metric==="zoneState" && {selection:"IN_RETEST_AREA"}),
    ...(custom && { custom: defaultIndicator }),
    ...(metric === "listingExchange" && { selection: "NASDAQ" }),
    ...(metric === "indicatorSignal" && { signal: "emaBullishCross" }),
    ...(metric === "confirmed4hBreak" && { direction: "either" }),
    ...(metric === "pressRelease" && { releaseUnit: "Hours" }),
    ...(isDirectionalPriceMove(metric) && { direction: "up" }),
  };
}
const ruleActive=(rule:Draft)=>Boolean(rule.custom||isScanSelectionMetric(rule.metric)||isEventScanMetric(rule.metric)||rule.minimum.trim()||rule.maximum.trim());

function summarizeRule(rule: Draft) {
  if (rule.metric === "tradingSession") {
    return (rule.selection ?? "").split(",")
      .map(value => SCAN_SESSION_LABELS[value.trim() as keyof typeof SCAN_SESSION_LABELS])
      .filter(Boolean).join(", ") || "Trading session · Select sessions";
  }
  if (isScanSelectionMetric(rule.metric)) {
    return SCAN_METRICS[rule.metric].label + " · " + (rule.selection?.trim() || "Set value");
  }
  if(rule.metric==="crossReference" && rule.reference)return "1m close crosses "+(rule.direction==="down"?"below ":"above ")+crossReferences[rule.reference];
  if(rule.metric==="candlePattern" && rule.pattern)return [rule.studyFrame,scanPatterns[rule.pattern],rule.period+" bars"].join(" · ");
  if (isReaction(rule.metric)) return SCAN_METRICS[rule.metric].label+" within "+rule.maximum+"m";
  if (Object.hasOwn(eventFilters,rule.metric) || rule.metric==="floatMissing") return SCAN_METRICS[rule.metric].label;
  return rule.custom?[
      rule.frame,customIndicatorTitle(customConfig(rule.metric,rule.custom)),indicatorComparisons[rule.custom.comparison],
      isIndicatorCross(rule.custom.comparison)?rule.maximum+"m":"",
    ].filter(Boolean).join(" "):rule.metric==="pressRelease"
      ? `${rule.absence?"No visible press release":"Press release"} within ${rule.maximum}${releaseAbbreviation[rule.releaseUnit??"Hours"]}`
      : rule.metric==="indicatorSignal"&&rule.signal
        ? `${rule.frame??"5m"} ${scanSignalLabels[rule.signal]} · ${rule.maximum}m`
        : rule.metric==="confirmed4hBreak"
        ? `4H level break · ${rule.direction} · ${rule.maximum}h`
        : rule.metric==="tradeResumed" ? "Trading resumed · past " + rule.maximum + "m"
        : rule.metric==="activeHalt" ? "Trading halt"
        : [rule.studyFrame ?? rule.frame, rule.period ? rule.period+" bars" : "", SCAN_METRICS[rule.metric].label, rule.minimum && (rule.maximum?rule.minimum + "–" + rule.maximum : "≥ " + rule.minimum),
      !rule.minimum && rule.maximum && "≤ " + rule.maximum, scanMetricUsesMinutes(rule.metric) && rule.minutes + "m"].filter(Boolean).join(" ");
}

function number(value: string) {
  const input = value.trim().replace(/^[$]/,"").replace(/%$/,"").replace(/,/g,"");
  if (!input) return null;
  const match = /^(-?(?:\d+(?:\.\d*)?|\.\d+))([KMB])?$/i.exec(input);
  if (!match) throw Error("Enter a number such as 3.5, 250K, or 15M.");
  return Number(match[1]) * ({ K:1e3, M:1e6, B:1e9 }[match[2]?.toUpperCase() as "K" | "M" | "B"] ?? 1);
}
function parseDraft(draft:DraftState) {
  try {
    const parseRules=(rules:Draft[])=>rules.flatMap<ScanRule>(({ minimum, maximum, minutes, releaseUnit, releaseHours, custom, selection, ...rule }) => {
      if (isScanSelectionMetric(rule.metric)) {
        const separator = (rule.metric === "listingIndustry" || rule.metric==="prHeadline" || rule.metric==="recentFiling") ? /[;\n]+/
          : rule.metric === "listingSector" ? /[,\n]+/ : /[ ,\n]+/;
        return [{ ...rule, minimum: null, maximum: null, selection: (selection ?? "").split(separator).filter(Boolean) }];
      }
      if(custom){
        return [{...rule,indicator:customConfig(rule.metric,custom),comparison:custom.comparison,
          minimum:null,maximum:isIndicatorCross(custom.comparison)?number(maximum):null}];
      }
      if(isEventScanMetric(rule.metric)){
        const amount=number(maximum);
        return [{...rule,minimum:null,maximum:amount===null||rule.metric!=="pressRelease"
          ? amount:releaseHours ?? inReleaseHours(amount, releaseUnit ?? "Hours"),minutes:undefined}];
      }
      const min = number(minimum), max = number(maximum);
      if (min === null && max === null) throw Error("Enter a minimum or maximum for " + SCAN_METRICS[rule.metric].label + ".");
      return [{ ...rule, minimum:min, maximum:max, minutes:Number(minutes) }];
    });
    const rules=parseRules(draft.rules);
    const groups=draft.groups.map(group=>{
      if (!group.rules.length) throw Error("Enter a filter in each group or remove the empty group.");
      return {match:group.match,rules:parseRules(group.rules)};
    });
    return { definition:parseScanDefinition({cadence:draft.cadence,sort:draft.sort,match:draft.match,rules,groups}), error:"" };
  } catch (error) {
    if(error instanceof Error && error.message==="invalid_scan_selection")
      return {definition:null,error:"Enter valid ticker symbols, country codes, or industry names, or choose a listing exchange, sector, security type, or trading session."};
    if(error instanceof Error && error.message==="invalid_press_release_window")
      return {definition:null,error:`Enter a press release window from 1 minute to ${RELEASE_LOOKBACK_HOURS/24} days.`};
    if(error instanceof Error && error.message==="invalid_custom_indicator")
      return {definition:null,error:`Enter lengths from 2 to ${MAX_CUSTOM_PERIOD}. For moving averages, use a shorter fast length. RSI levels can be 0 to 100.`};
    if(error instanceof Error && error.message==="invalid_custom_indicator_window")
      return {definition:null,error:`Enter a crossover window from 1 to ${SIGNAL_LOOKBACK_MINUTES} whole minutes.`};
    if(error instanceof Error && error.message==="invalid_scan")
      return {definition:null,error:"Use up to 128 filters in a scan."};
    if(error instanceof Error && error.message==="invalid_indicator_signal")
      return {definition:null,error:`Select a signal and a window from 1 to ${SIGNAL_LOOKBACK_MINUTES} minutes.`};
    if (error instanceof Error && error.message === "invalid_level_break")
      return {definition:null,error:`Select a direction and enter 1–${MAX_LEVEL_BREAK_HOURS} whole hours.`};
    return { definition:null, error:error instanceof Error && error.message.startsWith("Enter") ? error.message :
      "Check the filter values. Min must be at most Max, and intraday windows need whole minutes from 1 to " + MAX_INTRADAY_MINUTES + "." };
  }
}

const returnMaxAgeMs = 30 * 60_000;

function takeReturnState(key: string) {
  try {
    const saved = sessionStorage.getItem(key);
    sessionStorage.removeItem(key);
    if (!saved || saved.length > 128 * 1024) return;
    const state = JSON.parse(saved);
    const age = Date.now() - state.storedAt;
    if (!Number.isSafeInteger(state.storedAt) || age < 0 || age > returnMaxAgeMs ||
      (typeof state.choice !== "string" || (state.choice !== "blank" && !SAVED_SCAN_ID.test(state.choice) && !builtInScanForChoice(state.choice))) ||
      !Number.isSafeInteger(state.page) || state.page < 1 || state.page > 10_000 ||
      typeof state.reference !== "string" || !SAVED_SCAN_ID.test(state.reference)) return;
    return {
      applied: parseScanDefinition(state.applied),
      draft: state.draft === undefined ? undefined : parseScanDefinition(state.draft),
      choice: state.choice as string,
      page: state.page as number,
      reference: state.reference as string,
    };
  } catch {
    return;
  }
}

export function CustomScannersClient({ returnScope, addToWatchlist, verifiedLevels, initialChoice = "blank" }: {
  returnScope: string;
  initialChoice?: string;
  verifiedLevels?: boolean;
  addToWatchlist?: (form: FormData) => Promise<{ error: string | null; success: string | null }>;
}) {
  const [draft,setDraft] = useState<DraftState>({ rules:[], match:"all", groups:[], sort:EMPTY_SCAN.sort });
  const [choice,setChoice] = useState(initialChoice);
  const [inlineSymbol,setInlineSymbol] = useState<string>();
  const [ticker,setTicker] = useState<string>();
  const [resultView, setResultView] = useState<"table" | "cards" | "two-rows">();
  const [pageChartTimeframe, setPageChartTimeframe] = useState<ChartTimeframe>();
  const [chartDrawer, setChartDrawer] = useState<{ symbol: string; timeframe?: ChartTimeframe }>();
  const [chartDrawerOpen, setChartDrawerOpen] = useState(false);
  const [newsArticle, setNewsArticle] = useState<PressReleaseArticle | null>(null);
  const [newsError, setNewsError] = useState(false);
  const newsRequest = useRef<AbortController | null>(null);
  const [matchReference,setMatchReference] = useState<string>();
  const [ready,setReady] = useState(false);
  const [deleteOpen,setDeleteOpen] = useState(false);
  const [applied,setApplied] = useState(EMPTY_SCAN);
  const [runRevision,setRunRevision] = useState(0);
  const [page,setPage] = useState(1);
  const [openFilterPanel, setOpenFilterPanel] = useState<FilterLayout | undefined>("top");
  const [filterLayout, setFilterLayout] = useState<FilterLayout>("top");
  const [editingRules, setEditingRules] = useState<string[]>([]);
  const [rvolDefault, setRvolDefault] = useState<QuickRvolMetric>("sameTimeRegularVolume");
  const [volumeDefault, setVolumeDefault] = useState<QuickVolumeMetric>("dayVolume");
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down("md"));
  const effectiveFilterLayout = compact ? "side" : filterLayout;
  const filters = openFilterPanel === effectiveFilterLayout;
  const topControl = useRef<HTMLButtonElement>(null);
  const filterContent = useRef<HTMLDivElement>(null);
  const layoutControl = useRef<HTMLSelectElement>(null);
  const restoreLayoutFocus = useRef(false);
  const pendingFilterFocus = useRef<string | null>(null);
  const [saveMode,setSaveMode] = useState<"new" | "update" | "rename">();
  const [confirmationRevision,setConfirmationRevision] = useState<number>();
  const [name,setName] = useState("");
  const [saving,setSaving] = useState(false);
  const [saveError,setSaveError] = useState("");
  const { book,error:bookError,reload,save } = useSavedCustomScans();
  const selected = book?.scans.find(scan=>scan.id===choice);
  const original = originalBuiltInScan(choice);
  const results = useCustomScanResults(ready && !original ? [{ key:"main",definition:applied,page }] : [], runRevision);
  const shown = results.queries[0];
  const shownDefinition = shown?.definition ?? applied;
  const returnKey = "traderlink:scanner-chart-return:" + returnScope;
  const filterLayoutKey = "traderlink:scanner-filter-layout:v2:" + returnScope;
  useEffect(() => () => newsRequest.current?.abort(), []);
  useEffect(() => {
    const id = pendingFilterFocus.current;
    if (!id) return;
    const rule = filterContent.current?.querySelector<HTMLElement>(`[data-scan-rule="${id}"]`);
    pendingFilterFocus.current = null;
    if (!rule) return;
    rule.focus({ preventScroll: true });
    rule.scrollIntoView({ block: "start" });
  }, [draft]);
  useEffect(() => {
    if (!restoreLayoutFocus.current) return;
    restoreLayoutFocus.current = false;
    const control = effectiveFilterLayout === "top" ? topControl : layoutControl;
    control.current?.focus({ preventScroll: true });
  }, [effectiveFilterLayout]);
  async function openNews(articleId: string) {
    newsRequest.current?.abort();
    const request = new AbortController();
    newsRequest.current = request;
    setNewsError(false);
    try {
      const query = new URLSearchParams({ articleId });
      const response = await fetch("/api/platform/news/workspace-scanner?" + query, { cache: "no-store", signal: request.signal });
      if (!response.ok) throw Error();
      const { article } = await response.json() as { article?: PressReleaseArticle };
      if (!article) throw Error();
      if (!request.signal.aborted) setNewsArticle(article);
    } catch {
      if (!request.signal.aborted) setNewsError(true);
    }
  }
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const state = takeReturnState(returnKey);
      if (state) {
        setApplied(state.applied);
        setDraft(toDraft(state.draft ?? state.applied));
        setChoice(state.choice);
        setPage(state.page);
        setMatchReference(state.reference);
      } else {
        const template = starterDefinition(initialChoice);
        if (template) {
          setDraft(toDraft(template));
          if (!originalBuiltInScan(initialChoice)) setApplied(template);
        }
      }
      try {
        if (localStorage.getItem(filterLayoutKey) === "side") {
          setFilterLayout("side");
          setOpenFilterPanel(undefined);
        }
      } catch { /* Browser storage can be unavailable. */ }
      setReady(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [returnKey, filterLayoutKey, initialChoice]);
  const { definition,error } = useMemo(()=>parseDraft(draft),[draft]);
  const actualSort = draft.sort;
  const view = resultView ?? (compact ? "cards" : "table");
  const openFilters = () => setOpenFilterPanel(effectiveFilterLayout);
  const resetFilters = (keepOpen: boolean) => {
    setDraft(toDraft(original ? starterDefinition(choice) ?? EMPTY_SCAN : applied));
    setEditingRules([]);
    setOpenFilterPanel(keepOpen ? effectiveFilterLayout : undefined);
  };
  const closeFilters = () => {
    resetFilters(false);
    if (effectiveFilterLayout === "top") topControl.current?.focus();
  };
  const changeFilterLayout = (layout: FilterLayout) => {
    restoreLayoutFocus.current = filterLayout !== layout;
    setFilterLayout(layout);
    setOpenFilterPanel(layout);
    try { localStorage.setItem(filterLayoutKey, layout); }
    catch { /* The layout still changes for this visit. */ }
  };
  const applyFilters = () => {
    if (!ready || !definition) return;
    if (original) setChoice(original.templateChoice);
    setApplied(definition);
    setRunRevision(current => current + 1);
    setPage(1);
    setEditingRules([]);
    setOpenFilterPanel(effectiveFilterLayout === "top" ? "top" : undefined);
  };

  const rememberForCharts = (reference: string) => {
    try {
      sessionStorage.setItem(returnKey, JSON.stringify({
        storedAt: Date.now(), applied: shownDefinition, choice: results.showPrevious ? "blank" : choice,
        page: shown?.page ?? page, reference,
        ...(results.showPrevious && definition ? { draft: definition } : {}),
      }));
    } catch { /* The chart handoff remains available when browser storage is disabled. */ }
  };

  const select = (value:string) => {
    setChoice(value);
    setInlineSymbol(undefined);
    const definition = starterDefinition(value) ?? book?.scans.find(scan=>scan.id===value)?.definition ?? EMPTY_SCAN;
    setTicker(undefined);
    setMatchReference(undefined);
    setDraft(toDraft(definition));
    setEditingRules([]);
    setApplied(originalBuiltInScan(value) ? EMPTY_SCAN : definition);
    setPage(1);
  };
  const editRules=(update:(rules:Draft[])=>Draft[])=>setDraft(current=>({
    ...current,rules:update(current.rules),groups:current.groups.map(group=>({...group,rules:update(group.rules)})),
  }));
  const changeRule = (id:string, changes:Partial<Draft>) =>
    editRules(rules=>rules.map(rule=>rule.id===id?{...rule,...changes}:rule));
  const addRules = (metrics: readonly ScanMetric[], groupId?: string) => {
    const selected = metrics.map(metric => {
      const existing = !groupId && desktopQuickMetrics.has(metric)
        ? draft.rules.find(rule => rule.metric === metric) : undefined;
      return { rule: existing ?? newFilterRule(metric), added: !existing };
    });
    const rules = selected.filter(item => item.added).map(item => item.rule);
    pendingFilterFocus.current = selected[0]?.rule.id ?? null;
    setEditingRules(selected.map(item => item.rule.id));
    setDraft(current=>groupId?{...current,groups:current.groups.map(group=>group.id===groupId
      ?{...group,rules:[...group.rules,...rules]}:group)}:{...current,rules:[...current.rules,...rules]});
  };
  const removeRule = (id:string) => {
    editRules(rules=>rules.filter(rule=>rule.id!==id));
    setEditingRules(current => current.filter(item => item !== id));
  };
  const addGroup=()=>{
    const id=crypto.randomUUID();
    setDraft(current=>({...current,groups:[...current.groups,{id,match:"any",rules:[]}]}));
  };
  const removeGroup=(id:string)=>{
    setDraft(current=>({...current,groups:current.groups.filter(group=>group.id!==id)}));
    const group = draft.groups.find(item => item.id === id);
    setEditingRules(current => current.filter(ruleId => !group?.rules.some(rule => rule.id === ruleId)));
  };
  const quickRules = {
    price: draft.rules.find(rule => rule.metric === "price"),
    float: draft.rules.find(rule => rule.metric === "float"),
    rvol: draft.rules.find(rule => quickRelativeVolumeMetrics.some(metric => metric === rule.metric)),
    volume: draft.rules.find(rule => quickVolumeMetrics.some(metric => metric === rule.metric)),
    dayChange: draft.rules.find(rule => rule.metric === "dayChange"),
  };
  const quickSession = draft.rules.find(rule => rule.metric === "tradingSession");
  const rvolMetric = (quickRules.rvol?.metric as QuickRvolMetric | undefined) ?? rvolDefault;
  const volumeMetric = (quickRules.volume?.metric as QuickVolumeMetric | undefined) ?? volumeDefault;
  const changeQuickRule = (rule: Draft | undefined, metric: ScanMetric, changes: Partial<Draft>) => {
    if (rule) {
      if (ruleActive({ ...rule, ...changes }) && (metric !== "tradingSession" || changes.selection))
        changeRule(rule.id, changes);
      else removeRule(rule.id);
      return;
    }
    if (!Object.values(changes).some(value => typeof value === "string" && value.trim())) return;
    const added = { ...newFilterRule(metric), ...changes };
    setDraft(current => ({ ...current, rules: [...current.rules, added] }));
  };
  const changeQuickRange = (filter: QuickNumericFilter, bound: keyof QuickRange, value: string) => {
    const metric = filter === "rvol" ? rvolMetric : filter === "volume" ? volumeMetric : filter;
    changeQuickRule(quickRules[filter], metric, { [bound]: value });
  };
  const changeQuickRvolMetric = (metric: QuickRvolMetric) => {
    setRvolDefault(metric);
    if (quickRules.rvol) changeRule(quickRules.rvol.id, {
      metric, frame: isSameTimeVolumeMetric(metric) ? "15m" : undefined,
    });
  };
  const changeQuickVolumeMetric = (metric: QuickVolumeMetric) => {
    setVolumeDefault(metric);
    if (quickRules.volume) changeRule(quickRules.volume.id, { metric });
  };
  const beginSave = (mode:"new"|"update"|"rename") => {
    if (!book) return;
    setConfirmationRevision(book.revision);
    setSaveMode(mode);
    setName(mode !== "new" ? selected?.name ?? "" : builtInScanForChoice(choice)?.label ?? "");
    setSaveError("");
  };
  const saveScan = async () => {
    const definitionToSave = saveMode === "rename" ? selected?.definition : definition;
    if (!book || !definitionToSave || !name.trim() || saving || !saveMode) return;
    if (confirmationRevision !== book.revision || (saveMode !== "new" && !selected)) {
      setSaveError("Saved scans changed. Close this dialog and review the latest list before saving.");
      return;
    }
    const entry:SavedScan = { id:saveMode !== "new" && selected ? selected.id : crypto.randomUUID(),
      name:name.trim(), definition:definitionToSave };
    if (book.scans.some(scan=>scan.id!==entry.id&&scan.name.toLowerCase()===entry.name.toLowerCase())) {
      setSaveError("A scan with this name already exists.");
      return;
    }
    setSaving(true);
    try {
      const scans = saveMode === "new"
        ? [...book.scans, entry]
        : book.scans.map(scan => scan.id === entry.id ? entry : scan);
      await save({ revision:confirmationRevision, scans });
      if (saveMode !== "rename") {
        setChoice(entry.id);
        setApplied(entry.definition);
        setPage(1);
      }
      setSaveMode(undefined);
    } catch (cause) { setSaveError(cause instanceof Error?cause.message:"Could not save the scan."); }
    finally { setSaving(false); }
  };
  const deleteScan = async () => {
    if (!book || saving) return;
    if (confirmationRevision !== book.revision || !selected) {
      setSaveError("Saved scans changed. Close this dialog and review the latest list before deleting.");
      return;
    }
    setSaving(true);
    try {
      await save({ revision:confirmationRevision, scans:book.scans.filter(scan => scan.id !== selected.id) });
      select("blank");
      setDeleteOpen(false);
    } catch (cause) { setSaveError(cause instanceof Error ? cause.message : "Could not delete the scan."); }
    finally { setSaving(false); }
  };

  const sortOptions:Pick<ScanDefinition["sort"],"metric"|"minutes"|"frame">[] = [
    ...metrics.filter(metric=>metric!=="activeHalt"&&metric!=="floatMissing"&&!isCandleStudy(metric)&&!isScanSelectionMetric(metric)&&!requiresScannerLevelRead(metric)&&!scanMetricUsesMinutes(metric)&&!isScanIndicatorMetric(metric)&&!isEventScanMetric(metric)&&!isCustomIndicatorMetric(metric)).map(metric=>({metric})),
    ...[...draft.rules,...draft.groups.flatMap(group=>group.rules)].flatMap<Pick<ScanDefinition["sort"],"metric"|"minutes"|"frame">>(rule=>{
      if(isEventScanMetric(rule.metric)||rule.custom)return [];
      if(isScanIndicatorMetric(rule.metric))return [{metric:rule.metric,frame:rule.frame??"5m"}];
      const minutes=Number(rule.minutes);
      return scanMetricUsesMinutes(rule.metric)&&Number.isSafeInteger(minutes)&&minutes>0&&minutes<=MAX_INTRADAY_MINUTES
        ? [{metric:rule.metric,minutes}] : [];
    }),
  ];
  const sortKey = (sort:Pick<ScanDefinition["sort"],"metric"|"minutes"|"frame">) =>
    [sort.metric,sort.minutes??"",sort.frame??""].join(":");
  const sortLabel = ({metric,minutes,frame}:Pick<ScanDefinition["sort"],"metric"|"minutes"|"frame">) =>
    (frame ? frame+" " : minutes?minutes+"m ":"") + SCAN_METRICS[metric].label;
  const sortWidth = Math.max(182, sortLabel(actualSort).length * 8 + 44);
  const availableSorts = [...new Map([...sortOptions,actualSort].map(option=>[sortKey(option),option])).values()];
  const filterSummary = useMemo(() => toDraft(shownDefinition), [shownDefinition]);
  const activeRules = filterSummary.rules.filter(ruleActive);
  const activeGroups = filterSummary.groups;
  const filterCount=activeRules.length+activeGroups.reduce((sum,group)=>sum+group.rules.length,0);
  const matchControl=(label:string,match:ScanMatch,onChange:(value:ScanMatch)=>void)=>
    <TextField select size="small" label={label} value={match} onChange={event=>onChange(event.target.value as ScanMatch)}
      sx={{width:150}}>
      <MenuItem value="all">All</MenuItem><MenuItem value="any">Any</MenuItem>
    </TextField>;
  const renderRuleEditor=(rule:Draft)=>
    <Box key={rule.id} data-scan-rule={rule.id} role="group" id={"scanner-rule-" + rule.id} aria-label={SCAN_METRICS[rule.metric].label + " filter"}
      tabIndex={-1} sx={{ p: 1, border: 1, borderColor: "divider", scrollMarginBlock: 8,
        "&:focus": { outline: "2px solid", outlineColor: "primary.main", outlineOffset: 2 } }}>
          <Stack direction="row" sx={{alignItems:"center",justifyContent:"space-between",gap:0.5}}>
            <Typography variant="subtitle2">{SCAN_METRICS[rule.metric].label}</Typography>
            <IconButton size="small" aria-label={"Remove " + SCAN_METRICS[rule.metric].label + " filter"} onClick={()=>removeRule(rule.id)}><CloseRounded fontSize="small"/></IconButton>
          </Stack>
          <Stack direction="row" sx={{gap:1,flexWrap:"wrap",pt:0.75}}>
            {(rule.metric === "volume" || volumeScopes.some(metric => metric === rule.metric)) &&
              <TextField select size="small" label="Volume basis" value={rule.metric} sx={{width:224,maxWidth:"100%"}}
                onChange={event=>changeRule(rule.id,{metric:event.target.value as ScanMetric})}>
                {rule.metric === "volume" && <MenuItem value="volume">Session volume</MenuItem>}
                {volumeScopes.map(metric=><MenuItem key={metric} value={metric}>{SCAN_METRICS[metric].label}</MenuItem>)}
              </TextField>}
            {!rule.custom&&rule.metric!=="activeHalt"&&rule.metric!=="floatMissing"&&rule.metric!=="candlePattern"&&!isScanSelectionMetric(rule.metric)&&!isEventScanMetric(rule.metric)&&(["minimum","maximum"] as const).map(key=><TextField key={key} size="small" label={key==="minimum"?"Min":"Max"}
              value={rule[key]} onChange={event=>changeRule(rule.id,{[key]:event.target.value})} sx={{width:105}}
              slotProps={{htmlInput:{"aria-label":SCAN_METRICS[rule.metric].label + " " + key,maxLength:16,inputMode:"text"}}}/>)}
            {isCandleStudy(rule.metric) && <>
              <TextField select size="small" label="Study timeframe" value={rule.studyFrame??"5m"} onChange={e=>changeRule(rule.id,{studyFrame:e.target.value as StudyFrame})}>
                {studyFrames.filter(frame=>(!needsBarVwap(rule.metric)||["1m","5m","15m"].includes(frame)) && (!isBenchmarkStudy(rule.metric) || frame==="1D" || frame==="1W")).map(frame=><MenuItem key={frame} value={frame}>{frame}</MenuItem>)}
              </TextField>
              {rule.metric==="candlePattern" && <TextField select size="small" label="Pattern" value={rule.pattern??"doubleBottom"}
                onChange={e=>changeRule(rule.id,{pattern:e.target.value as ScanPattern})}>
                {Object.entries(scanPatterns).map(([id,label])=><MenuItem key={id} value={id}>{label}</MenuItem>)}
              </TextField>}
              {rule.metric==="macdHistogram" && (["fastPeriod","signalPeriod"] as const).map(key=><TextField key={key} type="number" size="small"
                label={key==="fastPeriod"?"Fast EMA":"Signal EMA"} value={rule[key]??""} onChange={e=>changeRule(rule.id,{[key]:Number(e.target.value)})} sx={{width:95}}/>)}
              {rule.metric!=="smaAlignment" && <TextField select size="small" label="Lookback bars" value={rule.period??20} onChange={e=>changeRule(rule.id,{period:Number(e.target.value)})}>
                {studyPeriods.filter(period=>rule.metric!=="candlePattern" || period>=9).map(period=><MenuItem key={period} value={period}>{period}</MenuItem>)}
              </TextField>}
            </>}
            {rule.metric==="zoneState" && <TextField select size="small" label="Setup state" value={rule.selection??""}
              onChange={e=>changeRule(rule.id,{selection:e.target.value})}>
              {Object.entries(zoneStates).map(([id,label])=><MenuItem key={id} value={id}>{label}</MenuItem>)}
            </TextField>}
            {(rule.metric==="prHeadline" || rule.metric==="haltCode" || rule.metric==="recentFiling") && <TextField size="small"
              label={rule.metric==="prHeadline"?"Headline words or phrases":rule.metric==="recentFiling"?"SEC form types":"Halt codes"} value={rule.selection??""}
              helperText={rule.metric!=="haltCode"?"Separate alternatives with semicolons.":"Separate codes with commas."}
              onChange={e=>changeRule(rule.id,{selection:e.target.value})}/>}
            {rule.metric==="listingExchange" && <TextField select size="small" label="Exchanges"
              value={(rule.selection??"").split(",").map(value=>value.trim()).filter(Boolean)}
              slotProps={{select:{multiple:true}}} sx={{width:182}}
              onChange={event=>changeRule(rule.id,{selection:Array.isArray(event.target.value) ? event.target.value.join(", ") : event.target.value})}>
              {SCAN_EXCHANGE_CHOICES.map(exchange=><MenuItem key={exchange} value={exchange}>{exchange}</MenuItem>)}
            </TextField>}
            {rule.metric==="tradingSession" && <TextField select size="small" label="Trading sessions"
              value={(rule.selection??"").split(",").map(value=>value.trim()).filter(Boolean)}
              slotProps={{select:{multiple:true}}} sx={{width:182}}
              onChange={event=>changeRule(rule.id,{selection:Array.isArray(event.target.value) ? event.target.value.join(", ") : event.target.value})}>
              {Object.entries(SCAN_SESSION_LABELS).map(([session,label])=><MenuItem key={session} value={session}>{label}</MenuItem>)}
            </TextField>}
            {rule.metric==="listingSector" && <TextField select size="small" label="Nasdaq sectors"
              value={(rule.selection??"").split(",").map(value=>value.trim()).filter(Boolean)}
              slotProps={{select:{multiple:true}}} sx={{width:215,maxWidth:"100%"}}
              onChange={event=>changeRule(rule.id,{selection:Array.isArray(event.target.value) ? event.target.value.join(", ") : event.target.value})}>
              {SCANNER_SECTORS.map(sector=><MenuItem key={sector} value={sector.toUpperCase()}>{sector}</MenuItem>)}
            </TextField>}
            {rule.metric==="listingSecurityType" && <TextField select size="small" label="Security types"
              value={(rule.selection??"").split(",").map(value=>value.trim()).filter(Boolean)}
              slotProps={{select:{multiple:true, renderValue: selected => Array.isArray(selected) && selected.map(key => {
                const type = scannerSecurityType(key);
                return type ? SCANNER_SECURITY_TYPES[type] : key;
              }).join(", ")}}} sx={{width:230,maxWidth:"100%"}}
              helperText="Uses types identified in the Nasdaq listing directory."
              onChange={event=>changeRule(rule.id,{selection:Array.isArray(event.target.value) ? event.target.value.join(", ") : event.target.value})}>
              {Object.entries(SCANNER_SECURITY_TYPES).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>}
            {rule.metric==="listingIndustry" && <TextField size="small" label="Industries"
              value={rule.selection??""} onChange={event=>changeRule(rule.id,{selection:event.target.value})}
              placeholder="Technology; Biotechnology" sx={{width:230,maxWidth:"100%"}}
              slotProps={{htmlInput:{maxLength:1800}}}/>}
            {(rule.metric==="tickerList" || rule.metric==="listingCountry") && <TextField size="small"
              label={rule.metric==="tickerList"?"Ticker symbols":"Country codes"}
              value={rule.selection??""} onChange={event=>changeRule(rule.id,{selection:event.target.value})}
              placeholder={rule.metric==="tickerList"?"ABCD, EFGH":"US, CA"} sx={{width:230,maxWidth:"100%"}}
              slotProps={{htmlInput:{maxLength:1800}}}/>}
            {rule.metric==="pressRelease" && <TextField select size="small" label="Match" value={rule.absence?"without":"with"} sx={{width:176}}
              onChange={event=>changeRule(rule.id,{absence:event.target.value==="without"})}>
              <MenuItem value="with">Published within</MenuItem><MenuItem value="without">None visible within</MenuItem>
            </TextField>}
            {rule.metric==="indicatorSignal" && <TextField select size="small" label="Signal" value={rule.signal??"emaBullishCross"}
              sx={{width:310,maxWidth:"100%"}} onChange={event=>changeRule(rule.id,{signal:event.target.value as Draft["signal"]})}>
              {scanSignalGroups.flatMap(([group,kinds])=>[
                <ListSubheader key={group}>{group}</ListSubheader>,
                ...kinds.map(kind=><MenuItem key={kind} value={kind} sx={{whiteSpace:"normal",maxWidth:350}}>{scanSignalLabels[kind]}</MenuItem>),
              ])}
            </TextField>}
            {rule.custom&&isCustomIndicatorMetric(rule.metric)&&<CustomIndicatorFields metric={rule.metric} value={rule.custom}
              minutes={rule.maximum} onChange={custom=>changeRule(rule.id,{custom})} onMinutes={maximum=>changeRule(rule.id,{maximum})}/>}
            {(isScanIndicatorMetric(rule.metric)||rule.custom) && !isSameTimeVolumeMetric(rule.metric) && <TextField select size="small" label="Timeframe" value={rule.frame??"5m"} sx={{width:105}}
              onChange={event=>changeRule(rule.id,{frame:event.target.value as Draft["frame"]})}>
              {scanSignalFrames.map(frame=><MenuItem key={frame} value={frame}>{frame}</MenuItem>)}
            </TextField>}
            {rule.metric==="pressRelease" && <TextField select size="small" label="Time unit" value={rule.releaseUnit??"Hours"}
              sx={{width:105}} onChange={event=>{
                const next=event.target.value as ReleaseUnit;
                let hours = rule.releaseHours;
                if (hours === undefined) {
                  try {
                    const amount = number(rule.maximum);
                    if (amount !== null) hours = inReleaseHours(amount, rule.releaseUnit ?? "Hours");
                  } catch {
                    // Keep invalid input editable in its original unit.
                    return;
                  }
                }
                changeRule(rule.id, { releaseUnit: next, releaseHours: hours,
                  maximum: hours === undefined ? rule.maximum : displayReleaseHours(hours, next) });
              }}>
              {releaseUnits.map(unit=><MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
            </TextField>}
            {isEventScanMetric(rule.metric) && (!Object.hasOwn(eventFilters,rule.metric) || isReaction(rule.metric)) && <TextField size="small" label={isReaction(rule.metric)?"Reaction within minutes":rule.metric==="pressRelease"?"Past":rule.metric==="confirmed4hBreak"?"Past hours":"Past minutes"}
              value={rule.maximum} onChange={event=>changeRule(rule.id,{maximum:event.target.value, releaseHours:undefined})} sx={{width:108}}
              slotProps={{htmlInput:{inputMode:rule.metric==="pressRelease"?"decimal":"numeric",maxLength:rule.metric==="pressRelease"?24:8}}}/>}
            {isOpeningRangeMetric(rule.metric) && <TextField select size="small" label="Opening range"
              value={rule.minutes} onChange={event=>changeRule(rule.id,{minutes:event.target.value})} sx={{width:140}}>
              {SCANNER_OPENING_RANGE_MINUTES.map(minutes=><MenuItem key={minutes} value={String(minutes)}>{minutes}m</MenuItem>)}
            </TextField>}
            {(isRollingScanMetric(rule.metric) || rule.metric==="timedRebound") && <TextField size="small" label="Minutes" value={rule.minutes}
              slotProps={{htmlInput:{"aria-label":SCAN_METRICS[rule.metric].label + " minutes",inputMode:"numeric",maxLength:4}}}
              onChange={event=>changeRule(rule.id,{minutes:event.target.value})} sx={{width:83}}/>}
            {rule.metric==="crossReference" && <TextField select size="small" label="Reference level" value={rule.reference}
              onChange={e=>changeRule(rule.id,{reference:e.target.value as CrossReference})}>
              {Object.entries(crossReferences).map(([key,label])=><MenuItem key={key} value={key}>{label}</MenuItem>)}
            </TextField>}
            {(isDirectionalPriceMove(rule.metric) || rule.metric==="crossReference" || rule.metric==="confirmed4hBreak") && <TextField select size="small" label="Direction" value={rule.direction??"up"} sx={{width:128}}
              onChange={event=>changeRule(rule.id,{direction:event.target.value as Draft["direction"]})}>
              <MenuItem value="up">Up</MenuItem><MenuItem value="down">Down</MenuItem>{rule.metric!=="crossReference" && <MenuItem value="either">Either</MenuItem>}
            </TextField>}
          </Stack>
          {(rule.metric==="distanceToVerifiedZone" || rule.metric==="roomToNextVerifiedZone") &&
            <Typography variant="caption" color="text.secondary">Uses a current price and an eligible saved setup.</Typography>}
          {isReaction(rule.metric) && <Typography variant="caption">{rule.metric==="prThenVwap"
            ? "The latest completed 1m candle crosses above day VWAP after a visible issuer release."
            : "The latest completed 1m candle starts at or after trading resumes and reaches at least 2× its volume baseline."}</Typography>}
          {rule.metric==="confirmed4hBreak" && <Typography variant="caption" color="text.secondary">
            Uses verified closed candles and eligible saved Levels. Tickers without this evidence need more data.
          </Typography>}
          {isSameTimeVolumeMetric(rule.metric) && <Typography variant="caption" color="text.secondary" sx={{display:"block",mt:0.5}}>
            Compares cumulative volume through the last completed 15-minute interval with the same point in the previous three comparable sessions.
          </Typography>}
          {rule.metric==="volumePace" && <Typography variant="caption" color="text.secondary" sx={{display:"block",mt:0.5}}>
            Compares the latest window with the preceding window of the same length.
          </Typography>}
          {rule.metric==="float" && <FormControlLabel label="Include unknown float" control={<Switch size="small" checked={Boolean(rule.includeUnknown)}
            onChange={(_,checked)=>changeRule(rule.id,{includeUnknown:checked})}/>}/>}
        </Box>;
  const ruleControl = (rule: Draft) =>
    <Button variant="outlined" color="inherit" size="small" endIcon={<ExpandMoreRounded />}
      aria-expanded={editingRules.includes(rule.id)}
      aria-controls={editingRules.includes(rule.id) ? "scanner-rule-" + rule.id : undefined}
      onClick={() => setEditingRules(current => current.includes(rule.id)
        ? current.filter(id => id !== rule.id) : [...current, rule.id])}
      sx={{
        justifyContent: "space-between", textAlign: "left", minHeight: { xs: 44, md: 34 }, maxWidth: "100%",
        ...(editingRules.includes(rule.id) && { borderColor: "primary.main", bgcolor: "action.selected" }),
      }}>
      <Box component="span" sx={{ overflowWrap: "anywhere" }}>
        {ruleActive(rule) ? summarizeRule(rule) : SCAN_METRICS[rule.metric].label + " · Set value"}
      </Box>
    </Button>;
  const ruleControls = (rules: Draft[]) => {
    if (!rules.length) return null;
    if (effectiveFilterLayout === "side") return <Stack spacing={0.75}>
      {rules.map(rule => <Stack key={rule.id} spacing={0.5}>{ruleControl(rule)}
        {editingRules.includes(rule.id) && renderRuleEditor(rule)}
      </Stack>)}
    </Stack>;
    return <Stack spacing={0.75}>
      <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
        {rules.map(rule => <Box key={rule.id} sx={{ maxWidth: "100%" }}>{ruleControl(rule)}</Box>)}
      </Stack>
      {rules.filter(rule => editingRules.includes(rule.id)).map(renderRuleEditor)}
    </Stack>;
  };
  const toolbar = <Stack direction="row" sx={{gap:0.75,alignItems:"center",flexWrap:"wrap"}}>
    <TextField select size="small" label="Scan" value={selected?.id ?? (original || builtInScanForChoice(choice) ? choice : "blank")} onChange={event=>select(event.target.value)} sx={{width:175}}>
      <MenuItem value="blank">Blank scan</MenuItem>
      <ListSubheader>Presets</ListSubheader>
      {livePresetChoices.map(({id,label})=><MenuItem key={id} value={id}>{label}</MenuItem>)}
      <ListSubheader>Starter templates</ListSubheader>
      {builtInScanChoices.map(({value,label})=><MenuItem key={value} value={value}>{label} starter</MenuItem>)}
      {!book && !bookError && <MenuItem disabled>Loading saved scans…</MenuItem>}
      {!!book?.scans.length && <ListSubheader>Saved scans</ListSubheader>}
      {(book?.scans??[]).map(scan=><MenuItem key={scan.id} value={scan.id}>{scan.name}</MenuItem>)}
    </TextField>
    {compact ? <Button variant="outlined" color="inherit" size="small" aria-expanded={filters}
      sx={{ minHeight: 44 }} onClick={openFilters}>Filters{filterCount > 0 ? ` (${filterCount})` : ""}</Button>
    : <Stack direction="row" role="group" aria-label="Filter layout" sx={{ gap: 0.5 }}>
      <Button ref={topControl} variant={filters && filterLayout === "top" ? "contained" : "outlined"} color="inherit" size="small"
        aria-expanded={filters && filterLayout === "top"} onClick={() => changeFilterLayout("top")}>Top controls</Button>
      <Button variant={filters && filterLayout === "side" ? "contained" : "outlined"} color="inherit" size="small"
        aria-expanded={filters && filterLayout === "side"} onClick={() => changeFilterLayout("side")}>Side card</Button>
    </Stack>}
    {!original && <>
    <TextField select size="small" label="View" value={view}
      onChange={event => setResultView(event.target.value as typeof view)} sx={{ width: 110 }}>
      <MenuItem value="table">Table</MenuItem>
      <MenuItem value="cards">Cards</MenuItem>
      <MenuItem value="two-rows">Two rows</MenuItem>
    </TextField>
    {chartDrawer && !chartDrawerOpen && <IconButton title="Reopen chart drawer" aria-label="Reopen chart drawer"
      onClick={() => { setMatchReference(undefined); setChartDrawerOpen(true); }}>
      <CandlestickChartOutlined fontSize="small" />
    </IconButton>}
      <Button variant="outlined" color="inherit" size="small" startIcon={<SaveOutlined/>} disabled={!book || !definition}
        onClick={()=>beginSave(selected?"update":"new")}>{selected?"Save changes":"Save scan"}</Button>
      {selected && <Button variant="outlined" color="inherit" size="small" onClick={()=>beginSave("new")} disabled={!definition}>Save as new</Button>}
      {selected && book && <>
        <Button variant="outlined" color="inherit" size="small" onClick={()=>beginSave("rename")}>Rename scan</Button>
        <ShareSavedScan key={selected.id} scan={selected} revision={book.revision} />
        <Button variant="outlined" color="error" size="small"
          onClick={() => { setConfirmationRevision(book.revision); setSaveError(""); setDeleteOpen(true); }}>Delete scan</Button>
      </>}
    </>}
  </Stack>;
  const filterPanel = filters && <>
      <Stack direction="row" sx={{ px: 1.5, py: 0.75, alignItems: "center", gap: 1, borderBottom: 1, borderColor: "divider" }}>
        <Typography component="h2" variant="subtitle1" sx={{ flex: 1 }}>Filters</Typography>
        {filterLayout === "side" && !compact && <TextField select size="small" label="Filter layout" value={filterLayout} inputRef={layoutControl}
          slotProps={{ select: { native: true } }} sx={{ width: 142 }}
          onChange={event => changeFilterLayout(event.target.value as FilterLayout)}>
          <option value="side">Side card</option>
          <option value="top">Top controls</option>
        </TextField>}
        <IconButton aria-label="Close filters" onClick={closeFilters} sx={{ minHeight: 44, minWidth: 44 }}><CloseRounded /></IconButton>
      </Stack>
      <Stack ref={filterContent} spacing={1.25} sx={{ p: effectiveFilterLayout === "top" ? 1.25 : 2, overflowY: effectiveFilterLayout === "side" ? "auto" : undefined, minHeight: 0 }}>
        {original && <Typography variant="body2" color="text.secondary">{original.label} starter template</Typography>}
        {effectiveFilterLayout === "top" && <ScannerQuickFilters ranges={quickRules} rvolMetric={rvolMetric}
          volumeMetric={volumeMetric} sessions={(quickSession?.selection ?? "").split(",").map(value => value.trim()).filter(Boolean)}
          onRange={changeQuickRange} onRvolMetric={changeQuickRvolMetric} onVolumeMetric={changeQuickVolumeMetric}
          onSessions={sessions => changeQuickRule(quickSession, "tradingSession", { selection: sessions.join(", ") })} />}
        {error && <Alert severity="warning">{error}</Alert>}
        <Stack direction="row" sx={{alignItems:"center",gap:0.75,flexWrap:"wrap"}}>
          <ScannerFilterPicker label="Add filter" categories={metricOptions} onAdd={addRules} />
          {effectiveFilterLayout === "top" && metricOptions.map(group =>
            <ScannerFilterPicker key={group.category} label={group.category} categories={[group]} onAdd={addRules} />)}
        </Stack>
        <Stack direction="row" sx={{alignItems:"center",gap:0.75,flexWrap:"wrap"}}>
          {matchControl("Match filters",draft.match,match=>setDraft(current=>({...current,match})))}
          <Button size="small" variant="outlined" color="inherit" onClick={addGroup}>Add group</Button>
        </Stack>
        {ruleControls(draft.rules)}
        {draft.groups.map((group,index)=><Stack key={group.id} role="group" aria-label={`Filter group ${index+1}`}
          spacing={1} sx={{p:1.25,borderLeft:2,borderColor:"divider",bgcolor:"action.hover"}}>
          <Stack direction="row" sx={{alignItems:"center",gap:1,flexWrap:"wrap"}}>
            {matchControl(`Group ${index+1} matches`,group.match,match=>setDraft(current=>({...current,
              groups:current.groups.map(item=>item.id===group.id?{...item,match}:item)})))}
            <IconButton size="small" sx={{ml:"auto"}} aria-label={`Remove group ${index+1}`} onClick={()=>removeGroup(group.id)}>
              <CloseRounded fontSize="small"/>
            </IconButton>
          </Stack>
          <Box sx={{ alignSelf: "flex-start" }}><ScannerFilterPicker label={`Add filter to group ${index + 1}`}
            categories={metricOptions} onAdd={metrics => addRules(metrics, group.id)} /></Box>
          {ruleControls(group.rules)}
        </Stack>)}
        <Stack direction="row" sx={{alignItems:"center",gap:0.75,flexWrap:"wrap"}}>
          <TextField select size="small" label="Sort by" value={sortKey(actualSort)} sx={{width:sortWidth,maxWidth:"100%"}}
            onChange={event=>{const next=availableSorts.find(sort=>sortKey(sort)===event.target.value);if(next)setDraft(current=>({...current,sort:{...next,direction:current.sort.direction}}));}}>
            {availableSorts.map(sort=><MenuItem key={sortKey(sort)} value={sortKey(sort)}>{sortLabel(sort)}</MenuItem>)}
          </TextField>
          <TextField select size="small" label="Order" value={actualSort.direction} sx={{width:138}}
            onChange={event=>setDraft(current=>({...current,sort:{...current.sort,direction:event.target.value==="asc"?"asc":"desc"}}))}>
            <MenuItem value="desc">Highest first</MenuItem><MenuItem value="asc">Lowest first</MenuItem>
          </TextField>
          <TextField select size="small" label="Detection" value={draft.cadence ?? "live"} sx={{ width: 200 }}
            onChange={event => setDraft(current => ({ ...current, cadence: event.target.value === "swing" ? "swing" : undefined }))}>
            <MenuItem value="live">Live</MenuItem>
            <MenuItem value="swing">Swing · every 5 min</MenuItem>
          </TextField>
        </Stack>
      </Stack>
      <Stack direction="row" spacing={1} sx={{ px: 1.5, py: 1, borderTop: 1, borderColor: "divider", justifyContent: "flex-end" }}>
        <Button color="inherit" onClick={() => resetFilters(effectiveFilterLayout === "top")}>Cancel</Button>
        <Button variant="contained" disabled={!ready || !definition} onClick={applyFilters}>Apply</Button>
      </Stack>
  </>;
  return <>
    <DashboardPanel action={toolbar} title="Scanner">
      <Stack spacing={1}>
        {filters && effectiveFilterLayout === "top" && <Box component="section" aria-label="Scan filters"
          sx={{ display: { xs: "none", md: "block" }, border: 1, borderColor: "divider" }}>
          {filterPanel}
        </Box>}
        {original ? <OriginalScannerResults key={original.widget} singleScanner={original.widget} verifiedLevels={verifiedLevels} /> : <>
        {!filters && error && <Alert severity="warning">{error}</Alert>}
        {newsError && <Alert severity="warning" onClose={() => setNewsError(false)}>This press release is unavailable.</Alert>}
        {bookError && <Alert severity="warning" action={
          <Button color="inherit" size="small" onClick={() => void reload()}>Refresh list</Button>
        }>{bookError}</Alert>}
        {filterCount>0 && !(filters && effectiveFilterLayout === "top") && <Stack direction="row" sx={{gap:0.5,overflowX:"auto",pb:0.25}}>
          {filterSummary.match==="any"&&filterCount>1&&<Chip size="small" label="Match any" onClick={openFilters}/>}
          {activeRules.map(rule=><Chip size="small" key={rule.id} onClick={openFilters}
            label={summarizeRule(rule)}/>)}
          {activeGroups.map(group=><Chip size="small" key={group.id} onClick={openFilters}
            label={`${group.match==="all"?"All":"Any"} of ${group.rules.length} ${group.rules.length===1?"filter":"filters"}`}/>)}
        </Stack>}
        {results.showPrevious && <Alert severity={results.error ? "warning" : "info"}>
          {results.error ? results.error + " " : "Waiting for the new scan. "}Showing the previous results.
        </Alert>}
        <ScannerNewsDrawerProvider onOpen={item => void openNews(item.id)}>
          <CustomScanResults definition={shownDefinition} result={results.values.main} error={results.showPrevious ? "" : results.error}
            mode={view}
            page={shown?.page ?? page} onPage={results.showPrevious ? undefined : setPage}
            onChart={target => {
              setMatchReference(undefined);
              setChartDrawer(previous => previous?.symbol === target.symbol ? previous : { symbol: target.symbol });
              setChartDrawerOpen(true);
            }}
            onTicker={symbol => {
              setMatchReference(undefined);
              if (symbol !== ticker) setPageChartTimeframe(undefined);
              setTicker(symbol);
            }}
            addToWatchlist={addToWatchlist}
            onEditFilters={openFilters}
            inlineChart={{
              symbol: inlineSymbol,
              onToggle: symbol => {
                setMatchReference(undefined);
                setInlineSymbol(current => current === symbol ? undefined : symbol);
              },
              content: row => <>
                <ScannerStudyReadings readings={scannerSetupStudies(shownDefinition, row)} />
                <MarketChart key={row.symbol} symbol={row.symbol} viewWorkspace="scanner"
                  viewId="builder-inline" compactMobile sx={{height:{xs:340,md:440},minHeight:280}} />
              </>,
            }}
            match={{
              reference: matchReference,
              onOpen: reference => {
                setInlineSymbol(undefined);
                setTicker(undefined);
                setMatchReference(current => current === reference ? undefined : reference);
              },
              content: (row, reference) => {
                const matchedRule = row.matchedLevelEvidence && Object.values(row.matchedLevelEvidence).includes(reference);
                return <ScannerInlineMatch key={reference} reference={reference} symbol={row.symbol}
                  momentumReadings={matchedRule ? row.momentumReadings : undefined}
                  studyReadings={matchedRule ? scannerSetupStudies(shownDefinition, row) : undefined}
                  priceSnapshot={row.priceObservedAt === undefined ? undefined : {
                    price: row.price, observedAt: row.priceObservedAt, sourceAt: row.priceSourceAt,
                    asOf: Math.max(results.values.main?.updatedAt ?? 0, row.priceObservedAt),
                    halted: row.halted, session: row.session,
                  }}
                  onClose={() => setMatchReference(undefined)} onOpenCharts={() => rememberForCharts(reference)} />;
              },
            }} />
        </ScannerNewsDrawerProvider>
        </>}
      </Stack>
    </DashboardPanel>
    {newsArticle && <PressReleaseArticleDrawer article={newsArticle} onClose={() => setNewsArticle(null)} />}
    {ticker && !chartDrawerOpen && <DashboardPanel title={ticker + " chart"}
      action={<IconButton aria-label="Close chart" onClick={() => setTicker(undefined)}><CloseRounded /></IconButton>}>
      <MarketChart key={ticker} symbol={ticker} timeframe={pageChartTimeframe} onTimeframeChange={setPageChartTimeframe}
        viewWorkspace="scanner" viewId="builder-page" compactMobile sx={{height:{xs:360,md:480}}} />
    </DashboardPanel>}
    {chartDrawer && <Drawer anchor="right" open={chartDrawerOpen} onClose={() => setChartDrawerOpen(false)} slotProps={{ paper: {
      role: "dialog", "aria-label": chartDrawer.symbol + " chart drawer",
      sx: { width: { xs: "100vw", md: "78vw", xl: 1180 }, maxWidth: "100vw", borderRadius: 0 },
    } }}>
      <MarketChart key={chartDrawer.symbol} symbol={chartDrawer.symbol} timeframe={chartDrawer.timeframe}
        onTimeframeChange={timeframe => setChartDrawer({ symbol: chartDrawer.symbol, timeframe })}
        viewWorkspace="scanner" viewId="builder-drawer" compactMobile sx={{ height: "100dvh" }}
        closeAction={<IconButton aria-label="Close chart drawer" onClick={() => setChartDrawerOpen(false)}
          sx={{ width: 44, height: 44 }}><CloseRounded fontSize="small" /></IconButton>} />
    </Drawer>}
    <Drawer open={filters && effectiveFilterLayout === "side"} onClose={closeFilters} anchor={compact?"bottom":"right"}
      disableRestoreFocus={effectiveFilterLayout === "top"}
      transitionDuration={{enter:theme.transitions.duration.enteringScreen,exit:0}} slotProps={{paper:{
      role:"dialog","aria-label":"Scan filters",sx:{width:compact?"100%":420,maxHeight:compact?"82dvh":undefined,display:"flex",flexDirection:"column"},
    }}}>
      {filters && effectiveFilterLayout === "side" && filterPanel}
    </Drawer>
    <Dialog open={deleteOpen} onClose={() => { if (!saving) setDeleteOpen(false); }} aria-labelledby="delete-scan-title">
      <DialogTitle id="delete-scan-title">Delete {selected?.name}?</DialogTitle>
      {saveError && <DialogContent><Alert severity="warning">{saveError}</Alert></DialogContent>}
      <DialogActions>
        <Button color="inherit" disabled={saving} onClick={() => setDeleteOpen(false)}>Cancel</Button>
        <Button color="error" variant="outlined" disabled={saving} onClick={() => void deleteScan()}>Delete</Button>
      </DialogActions>
    </Dialog>
    <Dialog open={Boolean(saveMode)} aria-labelledby="save-scan-title" onClose={()=>{if(!saving)setSaveMode(undefined);}} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={event=>{event.preventDefault();void saveScan();}}>
        <DialogTitle id="save-scan-title">{saveMode==="rename"?"Rename scan":saveMode==="update"?"Save changes":"Save scan"}</DialogTitle>
        <DialogContent sx={{pt:"12px !important"}}>
          <TextField label="Scan name" size="small" value={name} onChange={event=>setName(event.target.value)}
            autoFocus slotProps={{htmlInput:{maxLength:70}}} sx={{maxWidth:"100%",width:250}}/>
          {saveError && <Alert severity="warning" sx={{mt:1}}>{saveError}</Alert>}
        </DialogContent>
        <DialogActions><Button color="inherit" disabled={saving} onClick={()=>setSaveMode(undefined)}>Cancel</Button>
          <Button variant="contained" type="submit" disabled={saving||!name.trim()||(saveMode==="rename"?!selected:!definition)}>Save</Button></DialogActions>
      </Box>
    </Dialog>
  </>;
}
