"use client";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Alert, Box, GlobalStyles, IconButton, Menu, MenuItem, Portal, Stack, useMediaQuery, useTheme } from "@mui/material";
import FullscreenRounded from "@mui/icons-material/FullscreenRounded";
import FullscreenExitRounded from "@mui/icons-material/FullscreenExitRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import type { ResolvedChartEvidence } from "@/src/modules/market-data/chart-evidence/contracts";
import { chartCount, selectedChart, singleChart, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import { MarketChart } from "./market-chart";
import { ChartMultiviewCharts } from "./chart-multiview";
import { ChartMultiviewMenu } from "./chart-multiview-menu";
import { ChartPreferencesContext, useChartPreferences } from "./use-chart-preferences";
import { useChartTabs } from "./use-chart-tabs";
import { ChartWorkspaceTabs, ChartWorkspaceViewRow } from "./chart-workspace-tabs";
import { chartTabPrefix, chartTabDisplayLabel, chartWorkspaceViews, closeSelectedChartTab, openMultiTicker, type ChartTabs } from "@/src/modules/scanner/alpaca/chart-tabs";

import { replaceWorkspaceChart } from "../screeners/workspace/workspace-chart-panels";

const CompanyDetailsDrawer = lazy(() => import("../screeners/workspace/scanner-company-drawer")
  .then(module => ({ default: module.ScannerCompanyDrawer })));

const desktopToolbar = () => document.getElementById("dashboard-chart-toolbar");
const NEW_MULTI_TICKER = ":new-multi-ticker";

export type MarketChartEvidenceHandoff = Readonly<{
  reference: string;
  timeframe: ChartTimeframe;
  evidence: ResolvedChartEvidence;
}>;

function MarketChartHandoffView({ handoff }: { handoff: MarketChartEvidenceHandoff }) {
  const [timeframe, setTimeframe] = useState(handoff.timeframe);
  return <MarketChart symbol={handoff.evidence.basis.symbol} timeframe={timeframe} onTimeframeChange={setTimeframe}
    evidence={handoff.evidence} compactMobile
    sx={{ flex: 1, height: "auto" }} />;
}

export function MarketChartWorkspace({ evidenceHandoff }: { evidenceHandoff?: MarketChartEvidenceHandoff } = {}) {
  return evidenceHandoff
    ? <MarketChartHandoffView key={evidenceHandoff.reference} handoff={evidenceHandoff} />
    : <SavedMarketChartWorkspace />;
}

function SavedMarketChartWorkspace() {
  const {book,change:changeBook,ready,message}=useChartTabs();
  const chartPreferences = useChartPreferences();
  const { preferences, ready: preferencesReady, message: preferencesMessage } = chartPreferences;
  const [pendingDefaultTimeframe, setPendingDefaultTimeframe] = useState<ChartTimeframe>();
  const defaultTimeframe = pendingDefaultTimeframe ?? preferences.timeframe;
  const chartOpeningReady = ready && (preferencesReady || Boolean(preferencesMessage));
  const tab=book.tabs.find(tab=>tab.id===book.selectedTab)!;
  const layout=tab.layout;
  const {tickers,multi,earlier}=chartWorkspaceViews(book);
  const [closedMultiId, setClosedMultiId] = useState<string | null>(null);
  const lastTickerId = useRef<string | null>(null);
  const multiTickerClosed = Boolean(multi && multi.id === closedMultiId && tab.id !== multi.id);
  const selectView = (next: ChartTabs) => {
    if (next.selectedTab === multi?.id && tickers.some(item => item.id === tab.id)) {
      lastTickerId.current = tab.id;
    }
    changeBook(next);
  };
  const closeMultiTicker = () => {
    if (!multi) return;
    const previous = tickers.find(item => item.id === lastTickerId.current) ?? tickers[0] ?? earlier[0];
    setClosedMultiId(multi.id);
    if (previous) {
      changeBook({ ...book, selectedTab: previous.id });
    } else {
      const chart = selectedChart(multi.layout)!;
      const id = crypto.randomUUID();
      changeBook({ ...book, selectedTab: id, tabs: [...book.tabs, { id, name: "", layout: singleChart(chart.group.symbol, chart.panel.timeframe) }] });
    }
  };
  const tickerOnly=Boolean(book.plain)||tickers.some(item=>item.id===tab.id);
  const change=(next:typeof layout)=>{
    const {plain,...saved}=book;
    changeBook({...saved,...(plain&&chartCount(next)===1?{plain:true as const}:{}),tabs:book.tabs.map(item=>item.id===tab.id?{...item,layout:next,...(multi?.id===item.id?{kind:"multi" as const,configured:true as const}:{})}:item)});
  };
  const earlierActive=earlier.some(item=>item.id===tab.id);
  const closeInMenu=!book.plain&&(earlierActive||(tickerOnly&&tickers.length<=1&&!multi));
  const multiTickerLauncher = useRef<{ open: (id: string) => void }>(null);
  const seedBook = !multi ? openMultiTicker(book, NEW_MULTI_TICKER, Boolean(book.plain)) : null;
  const seed = seedBook?.tabs.find(item => item.id === NEW_MULTI_TICKER)?.layout;
  const multiDraft = seed?.groups.length === 1 ? {
    ...seed,
    groups: [...seed.groups, { id: "multi-ticker-blank", symbol: "", panels: [{ id: "multi-panel-blank", timeframe: defaultTimeframe }] }],
  } : seed;
  const editableTickers = book.plain ? [tab] : tickers;
  const workspaceEditor = {
    launcher: multiTickerLauncher,
    selected: tab.id,
    reopenId: multiTickerClosed ? multi?.id : undefined,
    views: [
      ...editableTickers.map(item => ({ id: item.id, label: item.layout.groups[0].symbol, layout: item.layout, tickerOnly: true })),
      ...(earlierActive ? [{ id: tab.id, label: chartTabDisplayLabel(book, tab), layout, tickerOnly: layout.groups.length === 1 }] : []),
      ...(multi || multiDraft ? [{ id: multi?.id ?? NEW_MULTI_TICKER, label: "Multi-ticker", layout: multi?.layout ?? multiDraft!, tickerOnly: false, unsaved: !multi }] : []),
    ],
    save: (layouts: ReadonlyMap<string, ChartMultiview>, activateNewMulti: boolean, reopenId?: string) => {
      const { plain, ...saved } = book;
      const newMulti = layouts.get(NEW_MULTI_TICKER);
      const newMultiId = newMulti ? crypto.randomUUID() : null;
      const tabs = book.tabs.map(item => {
        const layout = layouts.get(item.id);
        if (!layout) return item;
        return { ...item, layout, ...(item.id === multi?.id ? { kind: "multi" as const, configured: true as const } : {}) };
      });
      if (newMulti && newMultiId) tabs.push({ id: newMultiId, name: "", kind: "multi", configured: true, layout: newMulti });
      if (reopenId) setClosedMultiId(null);
      if (activateNewMulti && newMultiId) lastTickerId.current = tab.id;
      selectView({
        ...saved,
        ...(plain && !newMulti && chartCount(tabs[0].layout) === 1 ? { plain: true as const } : {}),
        selectedTab: reopenId ?? (activateNewMulti && newMultiId ? newMultiId : book.selectedTab),
        tabs,
      });
    },
  };
  const savedViewActions = {
    workspaceEditor,
    defaultTimeframe,
    earlierViews:earlier.map(item=>({id:item.id,label:chartTabDisplayLabel(book,item)})),
    onOpenEarlierView:(id:string)=>changeBook({...book,selectedTab:id}),
    onCloseView:closeInMenu?()=>changeBook(closeSelectedChartTab(book)):undefined,
    closeViewLabel:earlierActive?"Close earlier view":"Close ticker",
  };
  const multiview = <ChartMultiviewMenu {...savedViewActions} chartTabs tickerOnly={tickerOnly} layout={layout} onChange={change} disabled={!chartOpeningReady} iconOnly />;
  const tabs=<ChartWorkspaceTabs book={book} onChange={changeBook} disabled={!chartOpeningReady} defaultTimeframe={defaultTimeframe}/>;
  const theme = useTheme(), narrow = useMediaQuery(theme.breakpoints.down("md")), landscape = useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)");
  const compact = narrow || landscape;
  const viewRow = <ChartWorkspaceViewRow inline={!compact || landscape} onStartMultiTicker={()=>multiTickerLauncher.current?.open(NEW_MULTI_TICKER)} book={book} onChange={selectView} disabled={!chartOpeningReady} multiTickerClosed={multiTickerClosed} onCloseMultiTicker={closeMultiTicker}/>;
  const [pageMenu, setPageMenu] = useState<HTMLElement | null>(null);
  const [focus, setFocus] = useState(false);
  const [companySymbol, setCompanySymbol] = useState<string | null>();
  useEffect(() => { if (!focus) return; const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setFocus(false); }; window.addEventListener("keydown", escape); return () => window.removeEventListener("keydown", escape); }, [focus]);
  const replaceChartTicker = (panelId: string, symbol: string) => {
    if (!chartOpeningReady) return "Wait for chart preferences to load.";
    const panel = layout.groups.flatMap(group => group.panels).find(item => item.id === panelId);
    if (!panel) return;
    const existingTab = tickerOnly ? tickers.find(item => item.id !== tab.id && item.layout.groups[0].symbol === symbol) : undefined;
    if (existingTab && chartCount(layout) === 1) {
      selectView({ ...book, selectedTab: existingTab.id });
      return;
    }
    if (layout.groups.some(group => group.symbol === symbol && group.panels.some(item =>
        item.id !== panelId && item.timeframe === panel.timeframe))) return `${symbol} ${panel.timeframe} is already open.`;
    const next = replaceWorkspaceChart(layout, panelId, symbol);
    if (next !== layout) change(next);
  };
  const navigation = () => { setFocus(false); requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('header button[aria-label="Open navigation"]')?.click()); };
  const headerAction = (selector: string) => { setPageMenu(null); requestAnimationFrame(() => document.querySelector<HTMLElement>(selector)?.click()); };
  return <>
    <GlobalStyles styles={compact ? { 'body:has([data-main-chart-workspace]) header:has(button[aria-label="Open navigation"])': { visibility: "hidden" } } : {}} />
    {!compact && <Portal container={desktopToolbar}>
      <Stack data-chart-desktop-toolbar direction="row" sx={{ alignItems: "center", minWidth: 0, gap: 0.5 }}>
        {tabs}
        {multiview}
        <Box sx={{ display: "flex", flex: 1, minWidth: 0 }}>{viewRow}</Box>
      </Stack>
    </Portal>}
    <Box data-main-chart-workspace data-focus-mode={compact && focus ? "true" : "false"} sx={{ color: "text.primary", bgcolor: "background.paper",
      margin: compact ? "0 !important" : undefined, position: compact ? "fixed" : "relative", top: compact ? 0 : undefined,
      left: compact ? 0 : undefined, right: compact ? 0 : undefined, bottom: compact ? 0 : undefined, zIndex: compact ? theme.zIndex.appBar + 1 : undefined,
      flex: 1, minHeight: 0, pt: compact ? "env(safe-area-inset-top, 0px)" : 0, pb: compact ? "env(safe-area-inset-bottom, 0px)" : 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {compact ? <Stack data-chart-workspace-toolbar direction="row" sx={{ display: focus ? "none" : "flex", alignItems: "center", height: 44, flexShrink: 0, px: 0.5, borderBottom: 1, borderColor: "divider", "@media (max-width: 359px)": { "& > .MuiIconButton-root": { width: 36, minWidth: 36, flexShrink: 0 } } }}>
        <IconButton aria-label="Open dashboard navigation" onClick={navigation} sx={{ width: 44, height: 44 }}><MenuRounded /></IconButton>
        {tabs}
        {multiview}
        {landscape ? <Box sx={{ flex: 1, minWidth: 0, display: "flex" }}>{viewRow}</Box> : <Box sx={{ flex: 1 }} />}
        <IconButton aria-label="Enter focus mode" onClick={() => setFocus(true)} sx={{ width: 44, height: 44 }}><FullscreenRounded /></IconButton>
        <IconButton aria-label="Dashboard options" aria-haspopup="menu" onClick={event => setPageMenu(event.currentTarget)} sx={{ width: 44, height: 44 }}><PersonRounded /></IconButton>
      </Stack> : null}
      {compact && !landscape && !focus && viewRow}
      {message ? <Box role="status" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>{message}</Box> : null}
      {message && !["View saved", "Saving view…"].includes(message) ? <Alert severity="warning">{message}</Alert> : null}
      <ChartPreferencesContext.Provider value={chartPreferences}>
        {ready && <ChartMultiviewCharts key={tab.id} viewPrefix={chartTabPrefix(tab.id)} layout={layout} onChange={change} ready={ready}
          onChartSymbolChange={replaceChartTicker} onOpenCompanyDetails={setCompanySymbol}
          onDefaultTimeframeChange={setPendingDefaultTimeframe} onOpenMultiview={() => multiTickerLauncher.current?.open(tab.id)} compactMobile workspaceRow plain={book.plain} />}
      </ChartPreferencesContext.Provider>
      {compact && focus ? <Stack direction="row" sx={{ position: "absolute", bottom: "max(4px,env(safe-area-inset-bottom,0px))", right: 4, zIndex: 3, bgcolor: "background.paper", border: 1, borderColor: "divider" }}>
        <IconButton aria-label="Open dashboard navigation" onClick={navigation} sx={{ width: 44, height: 44 }}><MenuRounded /></IconButton>
        <IconButton aria-label="Exit focus mode" onClick={() => setFocus(false)} sx={{ width: 44, height: 44 }}><FullscreenExitRounded /></IconButton>
      </Stack> : null}
    </Box>
    <Menu anchorEl={pageMenu} open={Boolean(pageMenu)} onClose={() => setPageMenu(null)}>
      <MenuItem onClick={() => headerAction('header button[aria-label*="notifications" i]')}>Notifications</MenuItem>
      <MenuItem onClick={() => headerAction('header button[aria-label="Open Account menu"]')}>Account</MenuItem>
      <MenuItem onClick={() => headerAction('header a[aria-label="Open Help Center"]')}>Help</MenuItem>
    </Menu>
    {companySymbol !== undefined && <Suspense fallback={
      <Box role="status" sx={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clipPath: "inset(50%)" }}>
        Loading company details…
      </Box>
    }>
      <CompanyDetailsDrawer symbol={companySymbol} onClose={() => setCompanySymbol(null)} />
    </Suspense>}
  </>;
}
