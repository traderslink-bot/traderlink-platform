"use client";
import { useId, useImperativeHandle, useState, type Ref } from "react";
import { Alert, Badge, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, MenuItem, Select, Stack, Tab, Tabs, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import useMediaQuery from "@mui/material/useMediaQuery";
import GridViewOutlined from "@mui/icons-material/GridViewOutlined";
import CloseRounded from "@mui/icons-material/CloseRounded";
import { CHART_TIMEFRAMES, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { chartCount, parseChartMultiview, type ChartMultiview, type ChartTickerGroup } from "@/src/modules/scanner/alpaca/chart-multiview";

type EditorView = { id: string; label: string; layout: ChartMultiview; tickerOnly: boolean; unsaved?: boolean };
type WorkspaceEditor = {
  views: EditorView[];
  selected: string;
  reopenId?: string;
  save: (layouts: ReadonlyMap<string, ChartMultiview>, activateNewMulti: boolean, reopenId?: string) => void;
  launcher: Ref<{ open: (id: string) => void }>;
};
const newId = () => crypto.randomUUID();
export function ChartMultiviewMenu({ layout, onChange, disabled = false, iconOnly = false, chartTabs = false, tickerOnly: singleTicker = false, earlierViews, onOpenEarlierView, onCloseView, closeViewLabel, workspaceEditor, defaultTimeframe = "1m" }: { layout: ChartMultiview; onChange: (next: ChartMultiview) => void; disabled?: boolean; iconOnly?: boolean; chartTabs?: boolean; tickerOnly?: boolean; earlierViews?: {id:string;label:string}[]; onOpenEarlierView?: (id:string)=>void; onCloseView?:()=>void; closeViewLabel?:string; workspaceEditor?: WorkspaceEditor; defaultTimeframe?: ChartTimeframe }) {
  const titleId = useId();
  const landscape = useMediaQuery("(orientation: landscape) and (max-height: 600px) and (max-width: 1200px)");
  const [open, setOpen] = useState(false), [draft, setDraft] = useState(layout), [target, setTarget] = useState(1), [error, setError] = useState("");
  const updateGroup = (id: string, next: ChartTickerGroup) => { setDraft(old => ({ ...old, groups: old.groups.map(group => group.id === id ? next : group) })); setError(""); };
  const menuLabel = chartTabs ? "Multiview" : "Layout";
  const [editorId, setEditorId] = useState("");
  const [pending, setPending] = useState(() => new Map<string, ChartMultiview>());
  const [sessionViews, setSessionViews] = useState<EditorView[]>([]);
  const [activateNewMulti, setActivateNewMulti] = useState(false);
  const view = sessionViews.find(item => item.id === editorId);
  const tickerOnly = view?.tickerOnly ?? singleTicker;
  const defaultMode = chartTabs ? "stack" : "tabs";
  const addFrame = (id: string) => setDraft(old => ({ ...old, groups: old.groups.map(group => {
    const frame = CHART_TIMEFRAMES.find(frame => !group.panels.some(panel => panel.timeframe === frame));
    return group.id === id && frame && chartCount(old) < 4 ? { ...group, panels: [...group.panels, { id: newId(), timeframe: frame }] } : group;
  }) }));
  const chooseCount = (count: number) => {
    setTarget(count); setError(""); let next = draft;
    if (chartCount(next) > count) { setError("Choose which timeframe or ticker to remove below."); return; }
    while (chartCount(next) < count && next.groups.length) {
      const group = [...next.groups].sort((a, b) => a.panels.length - b.panels.length)[0];
      const frame = CHART_TIMEFRAMES.find(frame => !group.panels.some(panel => panel.timeframe === frame))!;
      next = { ...next, groups: next.groups.map(item => item.id === group.id ? { ...item, panels: [...item.panels, { id: newId(), timeframe: frame }] } : item) };
    }
    setDraft(next);
  };
  const openEditor = (id = workspaceEditor?.selected) => {
    const initial = workspaceEditor?.views.find(item => item.id === id);
    setSessionViews(workspaceEditor?.views ?? []);
    setActivateNewMulti(Boolean(initial?.unsaved));
    setEditorId(initial?.id ?? "");
    setPending(new Map());
    setDraft(initial?.layout ?? layout);
    setTarget(Math.max(1, chartCount(layout)));
    setError("");
    setOpen(true);
  };
  useImperativeHandle(workspaceEditor?.launcher, () => ({ open: openEditor }));
  const collectDrafts = () => {
    const next = new Map(pending);
    if (view && draft !== view.layout) next.set(view.id, draft);
    return next;
  };
  const selectEditorView = (id: string) => {
    const next = sessionViews.find(item => item.id === id);
    if (!next) return;
    setPending(collectDrafts());
    setEditorId(id);
    setDraft(pending.get(id) ?? next.layout);
    setError("");
  };
  const validate = (candidate: ChartMultiview) => {
    if (!candidate.groups.length) throw Error();
    const selectionExists = candidate.groups.some(group => group.panels.some(panel => panel.id === candidate.selectedPanel));
    const { mobileLayout, landscapeLayout, ...settings } = candidate;
    void mobileLayout;
    void landscapeLayout;
    return parseChartMultiview({
      ...(chartTabs ? settings : candidate),
      selectedPanel: selectionExists ? candidate.selectedPanel : candidate.groups[0].panels[0].id,
    });
  };
  const apply = (reopenId?: string) => {
    let invalidView = "";
    try {
      if (workspaceEditor) {
        const changes = collectDrafts();
        if (view?.unsaved) changes.set(view.id, draft);
        const validated = new Map<string, ChartMultiview>();
        for (const [id, candidate] of changes) {
          invalidView = id;
          validated.set(id, validate(candidate));
        }
        if (validated.size || reopenId) workspaceEditor.save(validated, activateNewMulti, reopenId);
      } else {
        const result = validate(draft);
        if (!chartTabs && chartCount(result) !== target) {
          setError(`Choose ${target} charts, or change the chart count above.`);
          return;
        }
        onChange(result);
      }
      setOpen(false);
    } catch {
      if (invalidView && invalidView !== editorId) selectEditorView(invalidView);
      setError("Enter a valid symbol for each ticker and use different timeframes for each ticker.");
    }
  };
  return <>
    {iconOnly ? <IconButton disabled={disabled} aria-label={menuLabel} title={menuLabel} aria-haspopup="dialog" onClick={() => openEditor()} sx={{ width: 44, height: 44 }}>{chartTabs ? <GridViewOutlined fontSize="small" /> : <Badge badgeContent={chartCount(layout)} color="primary"><GridViewOutlined fontSize="small" /></Badge>}</IconButton> : <Button size="small" disabled={disabled} aria-haspopup="dialog" onClick={() => openEditor()} sx={{ minHeight: { xs: 44, md: 30 }, px: 0.75, textTransform: "none", fontSize: 12 }}>{menuLabel}</Button>}
    <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth aria-labelledby={titleId}>
      <DialogTitle id={`${titleId}-heading`} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1 }}><span id={titleId}>{menuLabel}</span> <IconButton aria-label={`Close ${menuLabel.toLowerCase()} settings`} onClick={() => setOpen(false)}><CloseRounded /></IconButton></DialogTitle>
      {workspaceEditor && view && <Tabs
        value={editorId}
        onChange={(_, id: string) => selectEditorView(id)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        aria-label="Multiview settings"
        sx={{ px: 1, "& .MuiTab-root": { minWidth: 0, px: 1.25, textTransform: "none" } }}
      >
        {sessionViews.map(item => <Tab key={item.id} value={item.id} label={item.label} />)}
      </Tabs>}
      <DialogContent dividers sx={{ px: { xs: 1.5, sm: 2 } }}>
        {!chartTabs &&
        <Stack spacing={0.75} sx={{ display: { xs: "flex", md: landscape ? "flex" : "none" }, mb: 2 }}>
          <Typography variant="caption">Portrait layout</Typography>
          <ToggleButtonGroup exclusive size="small" value={draft.mobileLayout ?? defaultMode} aria-label="Mobile chart layout" onChange={(_, value: "tabs" | "stack" | null) => { if (value) setDraft(old => ({ ...old, mobileLayout: value })); }}>
            <ToggleButton value="tabs" sx={{ flex: 1, minHeight: 44, textTransform: "none" }}>{chartTabs ? "Tabs" : "By ticker"}</ToggleButton>
            <ToggleButton value="stack" sx={{ flex: 1, minHeight: 44, textTransform: "none" }}>{chartTabs ? "Scroll" : "Stack"}</ToggleButton>
          </ToggleButtonGroup>
          <Typography variant="caption" color="text.secondary">{chartTabs ? "Tabs and Scroll display the same saved charts." : "By ticker shows all charts for the selected ticker."}</Typography>
          <Typography variant="caption">Landscape layout</Typography>
          <ToggleButtonGroup exclusive size="small" value={draft.landscapeLayout ?? draft.mobileLayout ?? defaultMode} aria-label="Landscape chart layout" onChange={(_, value: "tabs" | "stack" | "grid" | null) => { if (value) setDraft(old => ({ ...old, landscapeLayout: value })); }}>
            <ToggleButton value="tabs" sx={{ flex: 1, minHeight: 44, textTransform: "none" }}>{chartTabs ? "Tabs" : "By ticker"}</ToggleButton>
            <ToggleButton value="stack" sx={{ flex: 1, minHeight: 44, textTransform: "none" }}>{chartTabs ? "Scroll" : "Stack"}</ToggleButton>
            <ToggleButton value="grid" sx={{ flex: 1, minHeight: 44, textTransform: "none" }}>Grid</ToggleButton>
          </ToggleButtonGroup>
        </Stack>}
        {!chartTabs && <Stack direction="row" spacing={0.5} sx={{ mb: 2, alignItems: "center" }}>
          {[1, 2, 3, 4].map(count => <Button key={count} aria-pressed={target === count} variant={target === count ? "contained" : "outlined"} onClick={() => chooseCount(count)} sx={{ minWidth: 44, borderRadius: 0 }}>{count}</Button>)}
          <Typography variant="caption" sx={{ ml: "auto !important" }}>{chartCount(draft)} / 4 charts</Typography>
        </Stack>}
        {chartTabs && !tickerOnly && <Typography variant="body2" color="text.secondary" sx={{mb:1.5}}>
          {view?.unsaved ? "Choose the charts for Multi-ticker. " : ""}Edit a ticker symbol to replace it, or use + Add ticker to add another.
        </Typography>}
        <Stack spacing={2}>
          {draft.groups.map((group, i) => <Box key={group.id} sx={{ borderBottom: 1, borderColor: "divider", pb: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
              <TextField label={`Ticker ${i + 1}`} size="small" value={group.symbol} onChange={event => updateGroup(group.id, { ...group, symbol: event.target.value.toUpperCase() })} slotProps={{ htmlInput: { maxLength: 15, readOnly: tickerOnly, autoCapitalize: "characters", spellCheck: false } }} sx={{ width: 145 }} />
              {!tickerOnly && <Button size="small" onClick={() => { if(target===chartCount(draft))setTarget(Math.max(1,target-group.panels.length));setDraft(old => ({ ...old, groups: old.groups.filter(item => item.id !== group.id) })); setError(""); }} sx={{ textTransform: "none", ml: "auto !important" }}>Remove ticker</Button>}
            </Stack>
            <Stack direction="row" spacing={0.75} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
              {group.panels.map((panel, j) => <Stack key={panel.id} direction="row" sx={{ alignItems: "center", border: 1, borderColor: "divider" }}>
                <Select size="small" value={panel.timeframe} inputProps={{ "aria-label": `${group.symbol || `Ticker ${i + 1}`} timeframe ${j + 1}` }} onChange={event => updateGroup(group.id, { ...group, panels: group.panels.map(item => item.id === panel.id ? { ...item, timeframe: event.target.value } : item) })} sx={{ fontSize: 13, "& fieldset": { border: 0 } }}>
                  {CHART_TIMEFRAMES.map(frame => <MenuItem key={frame} value={frame} disabled={group.panels.some(item => item.id !== panel.id && item.timeframe === frame)}>{frame}</MenuItem>)}
                </Select>
                {group.panels.length > 1 ? <IconButton size="small" aria-label={`Remove ${group.symbol} ${panel.timeframe} chart`} onClick={() => {if(target===chartCount(draft))setTarget(Math.max(1,target-1));updateGroup(group.id, { ...group, panels: group.panels.filter(item => item.id !== panel.id) });}}><CloseRounded fontSize="small" /></IconButton> : null}
              </Stack>)}
              <Button disabled={chartCount(draft) >= 4} size="small" onClick={() => { addFrame(group.id); setTarget(Math.min(4, chartCount(draft) + 1)); }} sx={{ textTransform: "none" }}>+ Timeframe</Button>
            </Stack>
          </Box>)}
          {!tickerOnly && <Button variant="outlined" disabled={chartCount(draft) >= 4} onClick={() => {
            const panel = { id: newId(), timeframe: defaultTimeframe };
            setDraft(old => ({ ...old, groups: [...old.groups, { id: newId(), symbol: "", panels: [panel] }], selectedPanel: old.selectedPanel ?? panel.id }));
            setTarget(Math.min(4, chartCount(draft) + 1)); setError("");
          }} sx={{ alignSelf: "flex-start", textTransform: "none" }}>+ Add ticker</Button>}
        </Stack>
        {chartCount(draft) === 4 ? <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>{tickerOnly ? "Up to four timeframes can be used in multiview." : "All four charts are in use. Remove a timeframe or ticker to make room."}</Typography> : null}
        {workspaceEditor?.reopenId && view?.id === workspaceEditor.reopenId && (
          <Button variant="outlined" disabled={draft.groups.some(group => !group.symbol.trim())} onClick={() => apply(view.id)} sx={{ mt: 2, textTransform: "none" }}>
            Open Multi-ticker
          </Button>
        )}
        {earlierViews?.length ? <TextField select fullWidth size="small" label="Earlier saved views" value="" onChange={event=>{onOpenEarlierView?.(event.target.value);setOpen(false);}} sx={{mt:2}}>
          {earlierViews.map(view=><MenuItem key={view.id} value={view.id}>{view.label}</MenuItem>)}
        </TextField> : null}
        {error ? <Alert severity="info" sx={{ mt: 1.5 }}>{error}</Alert> : null}
      </DialogContent>
      <DialogActions>{(!view || view.id === workspaceEditor?.selected) && onCloseView&&<Button color="error" sx={{mr:"auto"}} onClick={()=>{setOpen(false);onCloseView();}}>{closeViewLabel}</Button>}<Button onClick={() => setOpen(false)}>Cancel</Button><Button variant="contained" disabled={chartTabs&&draft.groups.some(group=>!group.symbol.trim())} onClick={() => apply()}>Apply</Button></DialogActions>
    </Dialog>
  </>;
}
