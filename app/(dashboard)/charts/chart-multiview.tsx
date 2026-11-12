"use client";
import { useEffect, useRef } from "react";
import { Box, IconButton, Tab, Tabs } from "@mui/material";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { phoneChartLayout, chartCount, changeChartTimeframe, removeChartPanel, selectedChart, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { AlpacaLightweightChart } from "./alpaca-lightweight-chart";
import { ChartMultiviewMenu } from "./chart-multiview-menu";

export function ChartMultiviewCharts({ layout, onChange, onSelectTicker, onOpenMultiview, onDefaultTimeframeChange, defaultTimeframe, activeSymbol, allowEmpty = false, ready = true, compactMobile = false, workspace = "main", viewPrefix = "", plain = false, workspaceRow = false }: {
  layout: ChartMultiview; onChange: (next: ChartMultiview) => void; onSelectTicker?: (symbol: string) => void; onOpenMultiview?: () => void; onDefaultTimeframeChange?: (timeframe: ChartTimeframe) => void;
  defaultTimeframe?: ChartTimeframe; activeSymbol?: string; allowEmpty?: boolean; ready?: boolean; compactMobile?: boolean; workspace?: "main" | "scanner"; viewPrefix?: string; plain?: boolean; workspaceRow?: boolean;
}) {
  const theme = useTheme(), narrow = useMediaQuery(theme.breakpoints.down("md"));
  const landscape = useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)"), mobile = narrow || landscape;
  const mode = workspaceRow ? (landscape && chartCount(layout)>1 ? "grid" : "stack") : phoneChartLayout(layout, landscape), grid = mobile && mode === "grid";
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const node = viewport.current; if (!node) return;
    const measure = () => node.style.setProperty("--mobile-chart-height", `${Math.max(180, Math.floor(node.clientHeight))}px`);
    const observer = new ResizeObserver(measure); observer.observe(node); measure();
    return () => observer.disconnect();
  }, []);
  const selected = selectedChart(layout), active = activeSymbol ?? selected?.group.symbol ?? layout.groups[0]?.symbol;
  const main = workspace === "main";
  const tabbed = mobile && mode === "tabs";
  const singleTickerTabs = main && tabbed && layout.groups.length === 1;
  const byTicker = tabbed && !main;
  const stacked = mobile && !tabbed && chartCount(layout) > 1;
  const groups = tabbed
    ? layout.groups.map(group=>({...group,panels:main?group.panels.filter(panel=>panel.id===layout.selectedPanel):group.symbol===active?group.panels:[]})).filter(group=>group.panels.length)
    : layout.groups;
  const renderedCount = groups.reduce((sum, group) => sum + group.panels.length, 0);
  const unevenFourChartGrid = !mobile && renderedCount === 4 &&
    (groups.length === 3 || groups.some(group => group.panels.length === 3));
  const select = (symbol: string, id: string) => { if (layout.selectedPanel !== id) onChange({ ...layout, selectedPanel: id }); onSelectTicker?.(symbol); };
  return <Box sx={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
    {(!compactMobile || !mobile) && byTicker && layout.groups.length > 1 ? <Tabs value={active} variant="scrollable" aria-label="Chart tickers" onChange={(_, symbol: string) => { const group = layout.groups.find(group => group.symbol === symbol)!; select(symbol, group.panels[0].id); }} sx={{ flexShrink: 0, minHeight: 36, "& .MuiTab-root": { minHeight: 36, py: 0.5 } }}>{layout.groups.map(group => <Tab key={group.id} value={group.symbol} label={group.symbol} />)}</Tabs> : null}
    <Box ref={viewport} data-multiview-charts data-mobile-layout={mode} data-chart-count={renderedCount} sx={{ flex: 1, minHeight: 0, minWidth: 0, display: "grid", overflowY: mobile ? "auto" : "hidden", gap: 0.5,
      gridTemplateColumns: (grid || (!mobile && groups.length > 1)) ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)",
      gridAutoRows: grid ? "var(--mobile-chart-height,240px)" : stacked ? "max-content" : "auto", alignContent: stacked ? "start" : "stretch",
      gridTemplateRows: mobile ? "none" : unevenFourChartGrid || groups.length > 2 ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)" }}>
      {groups.map((group, index) => <Box key={group.id} data-ticker-group={group.symbol} sx={{ display: grid || unevenFourChartGrid ? "contents" : "grid", minHeight: stacked ? "max-content" : 0, minWidth: 0, gap: 0.5,
        gridColumn: !mobile && !unevenFourChartGrid && groups.length === 3 && index === 2 ? "1 / -1" : "auto",
        gridTemplateColumns: !mobile && groups.length === 1 && group.panels.length > 1 ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)",
        gridTemplateRows: mobile ? "none" : groups.length === 1 ? group.panels.length > 2 ? "repeat(2,minmax(0,1fr))" : "minmax(0,1fr)" : `repeat(${group.panels.length},minmax(0,1fr))` }}>
        {group.panels.map((panel, panelIndex) => <Box key={panel.id} data-chart-panel={panel.id} data-workspace-chart={group.symbol} data-chart-timeframe={panel.timeframe} data-selected={layout.selectedPanel === panel.id}
          onPointerDown={() => select(group.symbol, panel.id)} onFocusCapture={() => select(group.symbol, panel.id)}
          sx={{ display: "flex", minWidth: 0, height: mobile && landscape ? "var(--mobile-chart-height,240px)" : undefined, minHeight: mobile ? landscape ? 180 : 330 : 0, border: 1, borderColor: layout.selectedPanel === panel.id ? "warning.main" : "divider", borderRadius: 0, overflow: "hidden",
            gridColumn: !mobile && groups.length === 1 && group.panels.length === 3 && panelIndex === 2 ? "1 / -1" : "auto" }}>
          <AlpacaLightweightChart viewId={viewPrefix+panel.id} viewWorkspace={workspace} compactMobile={compactMobile} compactIdentity={compactMobile && mobile && panelIndex === 0 && (main ? tabbed && layout.groups.length>1 : byTicker && layout.groups.length>1) ? <Tabs value={main?layout.selectedPanel:active} variant="scrollable" scrollButtons={false} aria-label={main?"Charts in this view":"Chart tickers"} onChange={(_, id:string)=>{
              if(main){const target=layout.groups.find(item=>item.panels.some(p=>p.id===id))!;select(target.symbol,id);}
              else {const target=layout.groups.find(item=>item.symbol===id)!;select(id,target.panels[0].id);}
            }} sx={{minHeight:44,width:"100%","& .MuiTab-root":{minHeight:44,minWidth:48,px:1,py:0.5,fontSize:12},"& .Mui-selected":{color:"warning.main",fontWeight:700},"& .MuiTabs-indicator":{bgcolor:"warning.main"}}}>
              {main?layout.groups.flatMap(item=>item.panels.map(p=><Tab key={p.id} value={p.id} label={`${item.symbol} ${p.timeframe}`}/>)):layout.groups.map(item=><Tab key={item.id} value={item.symbol} label={item.symbol}/>)}
            </Tabs>:undefined} symbol={group.symbol} timeframe={panel.timeframe} disabledTimeframes={singleTickerTabs ? [] : (layout.groups.find(item => item.id === group.id)?.panels ?? group.panels).filter(item => item.id !== panel.id).map(item => item.timeframe)}
            onTimeframeChange={timeframe => {
              const existing = singleTickerTabs ? layout.groups[0].panels.find(item=>item.timeframe===timeframe) : undefined;
              if(existing) select(group.symbol,existing.id);
              else onChange(changeChartTimeframe(layout,panel.id,timeframe));
            }}
            onOpenMultiview={onOpenMultiview}
            onDefaultTimeframeChange={onDefaultTimeframeChange}
            actions={!main && !plain ? <ChartMultiviewMenu layout={{ ...layout, selectedPanel: panel.id }} onChange={onChange} disabled={!ready} defaultTimeframe={defaultTimeframe} /> : undefined}
            closeAction={!plain && (allowEmpty || chartCount(layout) > 1) ? <IconButton size="small" aria-label={`Close ${group.symbol} ${panel.timeframe} chart`} onClick={() => onChange(removeChartPanel(layout, panel.id))} sx={{ minWidth: main && mobile ? 44 : { xs: 44, md: 28 }, minHeight: main ? (mobile ? 40 : 34) : { xs: 44, md: 28 }, p: 0.25 }}><CloseRounded sx={{ fontSize: 16 }} /></IconButton> : undefined}
            sx={{ flex: 1, height: "100%", minHeight: 0, border: 0, borderRadius: 0 }} />
        </Box>)}
      </Box>)}
    </Box>
  </Box>;
}
