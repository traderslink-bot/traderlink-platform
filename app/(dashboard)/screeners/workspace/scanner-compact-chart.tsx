"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import InputBase from "@mui/material/InputBase";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Skeleton from "@mui/material/Skeleton";
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import { chartSymbol, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { changeChartTimeframe, parseChartMultiview, singleChart, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import { ChartMultiviewMenu } from "../../charts/chart-multiview-menu";
import { ChartPreferencesContext } from "../../charts/use-chart-preferences";
import { DashboardPanel } from "@/app/dashboard-template";
import type { ScannerWorkspaceSlotId } from "../scanner-workspace-layout";
import { ScannerWorkspaceCard } from "../scanner-workspace-card";

import {workspaceChartHasVisibleArea} from './workspace-chart-visibility';

const Chart = lazy(() => import("../../charts/alpaca-lightweight-chart").then(module => ({default:module.AlpacaLightweightChart})));

const Covered = createContext(false);
export const ScannerCompactChartCovered = Covered.Provider;

function TickerSearch({ symbol, timeframe, onSubmit }: {
  symbol: string;
  timeframe: ChartTimeframe;
  onSubmit: (symbol: string) => string | undefined;
}) {
  const [value, setValue] = useState(symbol);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("symbol") as HTMLInputElement;
    let message: string | undefined;
    try {
      message = onSubmit(chartSymbol(value));
    } catch {
      message = "Enter a valid ticker symbol.";
    }
    input.setCustomValidity(message ?? "");
    if (message) input.reportValidity();
    else input.blur();
  };

  return <Box component="form" onSubmit={submit} sx={{ minWidth: 0 }}>
    <InputBase name="symbol" value={value} title="Search ticker" placeholder="Ticker"
      startAdornment={<SearchOutlined aria-hidden sx={{ fontSize: 14, ml: 0.5, color: "text.secondary" }}/>}
      inputProps={{ "aria-label": `Ticker for ${symbol} ${timeframe} chart`, maxLength: 15, enterKeyHint: "search", autoCapitalize: "characters", spellCheck: false }}
      onFocus={event=>event.target.select()}
      onChange={event=>{event.target.setCustomValidity("");setValue(event.target.value.toUpperCase());}}
      sx={{ width: 92, maxWidth: "100%", height: 24, fontSize: 12, fontWeight: 700, color:"text.primary",
        border: 1, borderColor: "divider", borderRadius: 0.5,
        "& input":{ px:0.5, py:0, minWidth:0 }, "&:hover":{borderColor:"text.secondary"},
        "&:focus-within":{borderColor:"primary.main",outline:"1px solid",outlineColor:"primary.main"} }}/>
  </Box>;
}

export function ScannerCompactChart({ symbol, layout, onLayoutChange, defaultTimeframe, slot, keepMounted = false, fillMobile = false }: {
  symbol: string | null;
  layout: ChartMultiview | null;
  onLayoutChange: Dispatch<SetStateAction<ChartMultiview|null>>;
  defaultTimeframe: ChartTimeframe;
  slot: ScannerWorkspaceSlotId;
  keepMounted?: boolean;fillMobile?:boolean;
}) {
  const covered = useContext(Covered);
  const accountPreferences = useContext(ChartPreferencesContext);
  const viewport = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasShown,setHasShown]=useState(false);
  const panelArea = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = panelArea.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setRoom(previous => previous.width === width && previous.height === height ? previous : { width, height });
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    // Observer deliveries can describe a layout that has already changed.
    // Reconcile current geometry so startup/selection cannot strand the placeholder.
    let frame=0,disposed=false;
    const measure=()=>{
      frame=0;if(disposed)return;
      const next=workspaceChartHasVisibleArea(node);
      setVisible(next);
      if(next&&layout)setHasShown(true);
    };
    const schedule=()=>{if(!disposed&&!frame)frame=requestAnimationFrame(measure);};
    const observer=typeof IntersectionObserver==='undefined'?null:new IntersectionObserver(schedule);
    const resize=typeof ResizeObserver==='undefined'?null:new ResizeObserver(schedule);
    observer?.observe(node);resize?.observe(node);
    window.addEventListener('resize',schedule,{passive:true});
    const onScroll=(event:Event)=>{const target=event.target;if(target===document||target===window||target instanceof Element&&target.contains(node))schedule();};
    window.addEventListener('scroll',onScroll,{capture:true,passive:true});
    schedule();
    return()=>{disposed=true;cancelAnimationFrame(frame);observer?.disconnect();resize?.disconnect();window.removeEventListener('resize',schedule);window.removeEventListener('scroll',onScroll,true);};
  }, [layout,covered,symbol]);

  useEffect(() => {
    if (!symbol || covered || !visible || layout) return;
    // Allow the committed scanner rows to paint before mounting the chart.
    let next = 0;
    const frame = requestAnimationFrame(() => {
      next = requestAnimationFrame(() => {
        onLayoutChange(current=>current??singleChart(symbol, defaultTimeframe));
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(next);
    };
  }, [symbol, covered, visible, layout, defaultTimeframe, onLayoutChange]);

  const panels = layout?.groups.flatMap(group => group.panels.map(panel => ({group, panel}))) ?? [];
  const columns = panels.length > 1 && room.width >= 566 ? 2 : 1;
  const rows = Math.ceil(panels.length / columns);
  const tabs = panels.length > 1 && room.height < rows * 176 + (rows - 1) * 6;
  const fallback = accountPreferences && !accountPreferences.ready && accountPreferences.message
    ? <Box role="alert" sx={{minWidth:0,p:1.5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
        <Typography color="text.primary" variant="body2">Chart settings could not load.</Typography>
        <Button variant="outlined" color="inherit" size="small" onClick={()=>window.location.reload()} sx={{minHeight:36,textTransform:"none"}}>Reload page</Button>
      </Box>
    : <Skeleton animation={false} variant="rectangular" sx={{height:"100%"}}/>;
  const selected = panels.find(({panel}) => panel.id === layout?.selectedPanel) ?? panels[0];
  const shown = tabs && selected ? [selected] : panels;

  const replaceTicker = (panelId: string, timeframe: ChartTimeframe, symbol: string) => {
    if (!layout) return;
    const source = layout.groups.find(group => group.panels.some(panel => panel.id === panelId));
    if (!source || source.symbol === symbol) return;
    const destination = layout.groups.find(group => group.symbol === symbol);
    if (destination?.panels.some(panel => panel.timeframe === timeframe)) {
      return `${symbol} ${timeframe} is already open.`;
    }
    const panel = { id: panelId, timeframe };
    const groups = layout.groups.flatMap(group => {
      if (group === destination) return [{ ...group, panels: [...group.panels, panel] }];
      if (group !== source) return [group];
      if (group.panels.length === 1) return destination ? [] : [{ ...group, symbol }];
      const remaining = { ...group, panels: group.panels.filter(item => item.id !== panelId) };
      return destination ? [remaining] : [remaining, { id: crypto.randomUUID(), symbol, panels: [panel] }];
    });
    onLayoutChange(parseChartMultiview({ ...layout, groups, selectedPanel:panelId }));
  };

  return <ScannerWorkspaceCard slot={slot} widget="ticker-workspace">
    <DashboardPanel hideHeader>
      <Box ref={viewport} aria-label="Workspace charts" sx={{height:fillMobile?"100%":{xs:320,md:"100%"},flex:1,minHeight:0,display:"flex",flexDirection:"column"}}>
        {layout && tabs && <Tabs aria-label="Workspace chart panels" value={selected?.panel.id ?? false} variant="scrollable"
            onChange={(_, id:string)=>onLayoutChange({...layout,selectedPanel:id})}
            sx={{mr:"auto",minWidth:0,minHeight:30,"& .MuiTab-root":{minHeight:30,minWidth:0,px:0.75,py:0,fontSize:11,textTransform:"none"}}}>
            {panels.map(({group,panel})=><Tab key={panel.id} value={panel.id} label={`${group.symbol} ${panel.timeframe}`}/>)}
          </Tabs>}
        <Box ref={panelArea} sx={{flex:1,minHeight:0,minWidth:0,display:"grid",gap:"6px",
          gridTemplateColumns:`repeat(${tabs?1:columns}, minmax(0,1fr))`,gridAutoRows:"minmax(0,1fr)"}}>
          {layout && (visible || keepMounted && hasShown) && !covered ? shown.map(({group,panel},index)=>
            <Box key={panel.id} data-workspace-chart-panel={panel.id} sx={{minWidth:0,minHeight:0,overflow:"hidden"}}>
              <Suspense fallback={fallback}>
                <Chart symbol={group.symbol} timeframe={panel.timeframe} disabledTimeframes={group.panels.filter(other=>other.id!==panel.id).map(other=>other.timeframe)}
                  onTimeframeChange={timeframe=>onLayoutChange(changeChartTimeframe(layout,panel.id,timeframe))}
                  compactIdentity={<TickerSearch key={group.symbol} symbol={group.symbol} timeframe={panel.timeframe}
                    onSubmit={symbol=>replaceTicker(panel.id,panel.timeframe,symbol)}/>}
                  actions={index===0&&<ChartMultiviewMenu layout={layout} defaultTimeframe={defaultTimeframe}
                    onChange={onLayoutChange} chartTabs iconOnly/>}
                  viewId={`workspace-card-${panel.id}`} viewWorkspace="workspace" compactMobile compactToolbar
                  compactToolbarHeight={28} sx={{"& [data-chart-compact-toolbar]":{px:0, "& > .MuiIconButton-root":{width:30,height:28}}}}/>
              </Suspense>
            </Box>
          ) : fallback}
        </Box>
      </Box>
    </DashboardPanel>
  </ScannerWorkspaceCard>;
}
