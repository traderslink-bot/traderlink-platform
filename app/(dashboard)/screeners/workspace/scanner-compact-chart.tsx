"use client";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import SearchOutlined from "@mui/icons-material/SearchOutlined";
import InputBase from "@mui/material/InputBase";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import Skeleton from "@mui/material/Skeleton";
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState, type FormEvent, type Dispatch, type SetStateAction } from "react";
import { chartSymbol, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { changeChartTimeframe, singleChart } from "@/src/modules/scanner/alpaca/chart-multiview";
import { ChartMultiviewMenu } from "../../charts/chart-multiview-menu";
import { ChartPreferencesContext } from "../../charts/use-chart-preferences";
import { DashboardPanel } from "@/app/dashboard-template";
import type { ScannerWorkspaceSlotId } from "../scanner-workspace-layout";
import { ScannerWorkspaceCard } from "../scanner-workspace-card";
import { swapWorkspaceCharts, workspaceChartArrangement, workspaceChartTrackSizes, type WorkspaceChartArrangement, type WorkspaceChartLayout } from "./workspace-chart-arrangement";
import { WorkspaceChartArrangeControls, workspaceChartGridTracks } from "./workspace-chart-arrange-controls";

import {closeWorkspaceChart,replaceWorkspaceChart,singleWorkspaceChart} from './workspace-chart-panels';
import {workspaceChartHasVisibleArea} from './workspace-chart-visibility';

const Chart = lazy(() => import("../../charts/market-chart").then(module => ({default:module.MarketChart})));

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

export function ScannerCompactChart({ symbol, layout, onLayoutChange, defaultTimeframe, slot, keepMounted = false, fillMobile = false, arrange = false, onEndArrange, singlePanel = false }: {
  symbol: string | null;
  layout: WorkspaceChartLayout | null;
  onLayoutChange: Dispatch<SetStateAction<WorkspaceChartLayout|null>>;
  defaultTimeframe: ChartTimeframe;
  slot: ScannerWorkspaceSlotId;
  keepMounted?: boolean;fillMobile?:boolean;
  arrange?: boolean;singlePanel?:boolean;
  onEndArrange?: () => void;
}) {
  const covered = useContext(Covered);
  const accountPreferences = useContext(ChartPreferencesContext);
  const viewport = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasShown,setHasShown]=useState(false);
  const panelArea = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState({ width: 0, height: 0 });
  const [arrangementDraft, setArrangementDraft] = useState<{ layout: WorkspaceChartLayout; arrangement: WorkspaceChartArrangement } | null>(null);
  const arrangeHeading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (!arrange) return;
    const frame = requestAnimationFrame(() => arrangeHeading.current?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(frame);
  }, [arrange]);

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

  const savedArrangement = layout ? workspaceChartArrangement(layout, layout.arrangement) : null;
  const arranging = arrange && layout !== null;
  const arrangement = arranging && arrangementDraft?.layout === layout ? arrangementDraft.arrangement : savedArrangement;
  const panelsById = new Map(layout?.groups.flatMap(group => group.panels.map(panel => [panel.id, {group, panel}] as const)));
  const panels = arrangement?.order.map(id => panelsById.get(id)!) ?? [];
  const multiview = panels.length > 1;
  const columns = multiview && room.width >= 566 ? 2 : 1;
  const rows = Math.max(1, Math.ceil(panels.length / columns));
  const gap = 6;
  const tabs = multiview && room.height < rows * 176 + (rows - 1) * gap;
  const columnSpace = room.width - (columns - 1) * gap;
  const rowSpace = room.height - (rows - 1) * gap;
  const columnMinimum = columns > 1 ? 220 / Math.max(1, columnSpace) : 0;
  const rowMinimum = rows > 1 ? 128 / Math.max(1, rowSpace) : 0;
  const columnSizes = workspaceChartTrackSizes(columns, arrangement?.columnSizes, columnMinimum);
  const rowSizes = workspaceChartTrackSizes(rows, arrangement?.rowSizes, rowMinimum);
  const fallback = accountPreferences && !accountPreferences.ready && accountPreferences.message
    ? <Box role="alert" sx={{minWidth:0,p:1.5,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:1}}>
        <Typography color="text.primary" variant="body2">Chart settings could not load.</Typography>
        <Button variant="outlined" color="inherit" size="small" onClick={()=>window.location.reload()} sx={{minHeight:36,textTransform:"none"}}>Reload page</Button>
      </Box>
    : <Skeleton animation={false} variant="rectangular" sx={{height:"100%"}}/>;
  const selected = panels.find(({panel}) => panel.id === layout?.selectedPanel) ?? panels[0];
  const shown = tabs && selected ? [selected] : panels;
  const editArrangement = (next: WorkspaceChartArrangement) => {
    if (layout) setArrangementDraft({ layout, arrangement: next });
  };
  const finishArrangement = (save: boolean) => {
    if (save && arrangementDraft?.layout === layout) {
      onLayoutChange(current => current === layout && current ? { ...current, arrangement: arrangementDraft.arrangement } : current);
    }
    setArrangementDraft(null);
    onEndArrange?.();
  };
  const replaceTicker = (panelId: string, timeframe: ChartTimeframe, symbol: string) => {
    if (!layout) return;
    const next = replaceWorkspaceChart(layout, panelId, symbol, timeframe);
    if (next === layout) {
      if (panels.some(({group,panel})=>group.symbol===symbol&&panel.timeframe===timeframe&&panel.id!==panelId)) {
        return `${symbol} ${timeframe} is already open.`;
      }
      return;
    }
    onLayoutChange(next);
  };

  const selectPanel = (id: string) => onLayoutChange(current => {
    if (!current || current.selectedPanel === id || !current.groups.some(group => group.panels.some(panel => panel.id === id))) return current;
    return { ...current, selectedPanel: id };
  });

  return <ScannerWorkspaceCard slot={slot} widget="ticker-workspace" contentPaddingTop={multiview ? 0 : undefined}>
    <DashboardPanel hideHeader>
      <Box ref={viewport} aria-label="Workspace charts"
        onKeyDown={event=>{if(arranging&&event.key==="Escape"){event.stopPropagation();finishArrangement(false);}}}
        sx={{height:fillMobile?"100%":{xs:320,md:"100%"},flex:1,minHeight:0,display:"flex",flexDirection:"column"}}>
        {arranging && <Stack direction="row" sx={{alignItems:"center",gap:0.5,flexWrap:"wrap",px:0.5,py:0.25}}>
          <Typography ref={arrangeHeading} component="h2" tabIndex={-1} variant="subtitle2" sx={{mr:"auto"}}>Arrange charts</Typography>
          <Button size="small" variant="outlined" color="inherit" onClick={()=>finishArrangement(false)}>Cancel</Button>
          <Button size="small" variant="contained" onClick={()=>finishArrangement(true)}>Done</Button>
          <Typography variant="caption" color="text.secondary" sx={{width:"100%"}}>
            {tabs ? "Drag or select two charts to swap their tabs." : "Drag or select two charts to swap them. Drag a divider to resize."}
          </Typography>
        </Stack>}
        {layout && tabs && !arranging && <Tabs aria-label="Workspace chart panels" value={selected?.panel.id ?? false} variant="scrollable"
            onChange={(_, id:string)=>selectPanel(id)}
            sx={{mr:"auto",minWidth:0,minHeight:30,"& .MuiTab-root":{minHeight:30,minWidth:0,px:0.75,py:0,fontSize:11,textTransform:"none"}}}>
            {panels.map(({group,panel})=><Tab key={panel.id} value={panel.id} label={`${group.symbol} ${panel.timeframe}`}/>)}
          </Tabs>}
        <Box ref={panelArea} sx={{position:"relative",flex:1,minHeight:0,minWidth:0,display:"grid",gap:`${gap}px`,
          gridTemplateColumns:tabs?"minmax(0,1fr)":workspaceChartGridTracks(columnSizes),
          gridTemplateRows:tabs?"minmax(0,1fr)":workspaceChartGridTracks(rowSizes)}}>
          {layout && (visible || keepMounted && hasShown) && !covered ? shown.map(({group,panel})=>{
            const active=layout.selectedPanel===panel.id;
            const selectable=!arranging&&!tabs&&panels.length>1;
            return <Box key={panel.id} data-workspace-chart-panel={panel.id} data-selected={active||undefined} inert={arranging}
              role="group" aria-label={`${group.symbol} ${panel.timeframe} chart${active&&selectable?" (selected)":""}`}
              onPointerDownCapture={event=>{if(selectable&&event.target instanceof Element&&event.currentTarget.contains(event.target)&&!event.target.closest("[data-workspace-chart-close]"))selectPanel(panel.id);}}
              onFocusCapture={event=>{if(selectable&&event.target instanceof Element&&event.currentTarget.contains(event.target)&&!event.target.closest("[data-workspace-chart-close]"))selectPanel(panel.id);}}
              sx={{minWidth:0,minHeight:0,overflow:"hidden",
                outline:selectable&&active?"1px solid":"none",outlineColor:"warning.main",outlineOffset:-1}}>

              <Suspense fallback={fallback}>
                <Chart symbol={group.symbol} timeframe={panel.timeframe} disabledTimeframes={group.panels.filter(other=>other.id!==panel.id).map(other=>other.timeframe)}
                  onTimeframeChange={timeframe=>{
                    const {arrangement,...chartLayout}=layout;
                    onLayoutChange({...changeChartTimeframe(chartLayout,panel.id,timeframe),arrangement});
                  }}
                  compactIdentity={<TickerSearch key={group.symbol} symbol={group.symbol} timeframe={panel.timeframe}
                    onSubmit={symbol=>replaceTicker(panel.id,panel.timeframe,symbol)}/>}
                  actions={!singlePanel&&!multiview&&<ChartMultiviewMenu layout={layout} openingPanelId={layout.selectedPanel??undefined} defaultTimeframe={defaultTimeframe}
                    onChange={onLayoutChange} resolveEmptyLayout={draft=>singleWorkspaceChart(draft,symbol,defaultTimeframe)}
                    chartTabs iconOnly workspaceFullGrid/>}
                  closeAction={multiview&&<IconButton data-workspace-chart-close aria-label={`Close ${group.symbol} ${panel.timeframe} chart`}
                    title={`Close ${group.symbol} ${panel.timeframe} chart`} size="small"
                    onClick={()=>onLayoutChange(current=>current?closeWorkspaceChart(current,panel.id):null)}>
                    <CloseRounded fontSize="small"/>
                  </IconButton>}
                  viewId={`workspace-card-${panel.id}`} viewWorkspace="workspace" compactMobile compactToolbar
                  compactToolbarHeight={28} sx={{"& [data-chart-compact-toolbar]":{
                    px:0,
                    ...(multiview && {height:{xs:28,md:27},boxSizing:"border-box",pb:{md:"1px"}}),
                    "& > .MuiIconButton-root":{
                      width:30,height:multiview ? {xs:28,md:26} : 28,
                    },
                    "& > [data-workspace-chart-close]":{
                      position:"sticky",right:0,ml:"auto",flexShrink:0,zIndex:1,bgcolor:"background.paper",
                    },
                  }}}/>
              </Suspense>
            </Box>;
          }) : fallback}
          {arranging && arrangement && <WorkspaceChartArrangeControls
            panels={panels.map(({group,panel})=>({id:panel.id,label:`${group.symbol} ${panel.timeframe}`}))}
            columns={{sizes:columnSizes,space:columnSpace,minimum:columnMinimum}}
            rows={{sizes:rowSizes,space:rowSpace,minimum:rowMinimum}}
            gap={gap} tabs={tabs}
            onSwap={(source,target)=>editArrangement({...arrangement,order:swapWorkspaceCharts(arrangement.order,source,target)})}
            onResize={(axis,sizes)=>editArrangement({...arrangement,[axis==="row"?"rowSizes":"columnSizes"]:sizes})}
          />}
        </Box>
      </Box>
    </DashboardPanel>
  </ScannerWorkspaceCard>;
}
