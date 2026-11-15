"use client";

import AddRounded from "@mui/icons-material/AddRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState, type SubmitEvent } from "react";
import { DashboardPanel, DashboardPrimaryAction, DashboardSecondaryAction } from "@/app/dashboard-template";
import {
  DEFAULT_DEFINITION, EXCHANGES, EXCHANGE_LABELS, MAX_RULES, MAX_SAVED, METRICS, METRIC_KEYS, OPENING_RANGE_MINUTES, OPERATORS, SESSIONS, UNIVERSES, VIEWS,
  parseDefinition, parseThreshold, signalChoices,
  type Candidate, type Definition, type Metric, type NewsHeadline, type RunResult, type SavedScreens, type Session, type Universe, type View,
} from "@/src/modules/stock-screeners/contracts";
import { PRESETS } from "@/src/modules/stock-screeners/presets";
import { sharedScreenPath, type SharedScreen } from "@/src/modules/stock-screeners/sharing-contracts";
import { requestStockScreeners as request } from "./stock-screener-api";
import { ColumnsDialog, FilterCatalog, FilterEditor, MarketCapControl, Picker, type DraftRule } from "./stock-screener-controls";
import { StockScreenerResults, displayTime, displayValue, exactValue, type Inspect } from "./stock-screener-results";
import { CommunityPresetsDialog, ScreenShareDialog } from "./stock-screener-sharing";

const Chart = dynamic(() => import("../charts/alpaca-lightweight-chart").then(module => module.AlpacaLightweightChart),
  { ssr: false, loading: () => <LinearProgress aria-label="Loading chart" /> });

const toDraft = (definition: Definition): DraftRule[] => definition.rules.map((rule, index) => ({
  ...rule, key: String(index), value: String(rule.value), upper: rule.upper === undefined ? "" : String(rule.upper),
}));
const equals = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
const ruleFields = ({ metric, operator, value, upper }: DraftRule) =>
  [metric, operator, parseThreshold(value, metric), operator === "between" ? parseThreshold(upper, metric) : undefined];
const parseTickers = (input: string) => [...new Set(input.toUpperCase().split(/[\s,]+/).filter(Boolean))];

function resultError(error: unknown, fallback: string) {
  switch (error instanceof Error ? error.message : "") {
    case "not_found": return "Screeners access is unavailable in this session. Reload the page and sign in if prompted.";
    case "busy": return "Too many requests. Wait a minute and try again.";
    case "run_expired": return "These results are no longer available. Run the screen again to refresh them.";
    default: return fallback;
  }
}

function rulesLabel(rules: DraftRule) {
  const choices = signalChoices(rules.metric);
  if (choices) return METRICS[rules.metric].label + " · " + (choices[Number(rules.value)] ?? "…");
  function format(value: string) {
    const parsed = parseThreshold(value, rules.metric);
    if (Number.isFinite(parsed)) {
      if (rules.metric === "cap") return displayValue("cap", parsed);
      if (rules.metric === "pressReleaseAge" || rules.metric === "relativeVolume") return exactValue(rules.metric, parsed);
    }
    return value || "…";
  }
  return METRICS[rules.metric].label + " " + OPERATORS[rules.operator].toLowerCase() + " " + format(rules.value)
    + (rules.operator === "between" ? " and " + format(rules.upper) : "");
}

export function StockScreenerWorkspace({ initialSaved, preview, sharedScreen, sharedUnavailable }: {
  initialSaved: SavedScreens; preview: boolean; sharedScreen: SharedScreen | null; sharedUnavailable: boolean;
}) {
  const initial = initialSaved.screens.find(screen => screen.id === initialSaved.defaultId);
  const [saved, setSaved] = useState(initialSaved);
  const [showSharedUnavailable, setShowSharedUnavailable] = useState(sharedUnavailable);
  const [selected, setSelected] = useState(sharedScreen ? "shared" : initial ? "saved:" + initial.id : "preset:active");
  const [draft, setDraft] = useState<Definition>(sharedScreen?.definition ?? initial?.definition ?? PRESETS.find(preset => preset.id === "active")!.definition);
  const [rules, setRules] = useState(() => toDraft(draft));
  const [tickerText, setTickerText] = useState(() => draft.tickers.join(", "));
  const [edit, setEdit] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [run, setRun] = useState<RunResult | null>(null);
  const [applied, setApplied] = useState<Definition | null>(null);
  const [appliedSelection, setAppliedSelection] = useState<string | null>(null);
  const [saveMode, setSaveMode] = useState<"save" | "copy" | "rename" | "delete" | null>(null);
  const newScreenId = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [inspected, setInspected] = useState<{
    row: Candidate; kind: "match" | "chart" | "news"; run: RunResult | null; rules: Definition["rules"];
  } | null>(null);
  const [news, setNews] = useState<NewsHeadline[] | null>(null);
  const [newsError, setNewsError] = useState(false);
  const newsRequest = useRef(0);

  const selectedScreen = saved.screens.find(screen => selected === "saved:" + screen.id);
  const selectedPreset = PRESETS.find(preset => selected === "preset:" + preset.id);
  const selectedShared = selected === "shared" ? sharedScreen : null;
  const currentDefinition = selectedScreen?.definition ?? selectedPreset?.definition ?? selectedShared?.definition ?? DEFAULT_DEFINITION;
  const singleCapRule = rules.filter(rule => rule.metric === "cap").length === 1;
  const dirty = applied !== null && (!equals(toDraft(applied).map(ruleFields), rules.map(ruleFields)) || !equals(draft.sort, applied.sort)
    || draft.universe !== applied.universe || draft.session !== applied.session || !equals(draft.exchanges, applied.exchanges)
    || (draft.universe === "list" && !equals(parseTickers(tickerText), applied.tickers)));

  function definition(overrides?: Partial<Definition>) {
    return parseDefinition({ ...draft,
      tickers: draft.universe === "list" ? parseTickers(tickerText) : [],
      rules: rules.map(rule => ({ ...rule, value: parseThreshold(rule.value, rule.metric), upper: parseThreshold(rule.upper, rule.metric) })),
      ...overrides,
    });
  }

  function load(next: Definition) {
    setDraft(next);
    setRules(toDraft(next));
    setTickerText(next.tickers.join(", "));
    setProblem("");
  }

  function select(key: string) {
    const next = saved.screens.find(screen => key === "saved:" + screen.id)?.definition
      ?? PRESETS.find(preset => key === "preset:" + preset.id)?.definition
      ?? (key === "shared" ? sharedScreen?.definition : undefined) ?? DEFAULT_DEFINITION;
    setSelected(key);
    setShowSharedUnavailable(false);
    load(next);
    setEdit(false);
  }

  function startNewScreen() {
    select("new");
    setRun(null);
    setApplied(null);
    setAppliedSelection(null);
    setSavedNotice("");
  }

  function addFilter(metric: Metric) {
    if (rules.length >= MAX_RULES) return;
    const signal = signalChoices(metric);
    setRules([...rules, {
      key: crypto.randomUUID(), metric, operator: signal ? "eq" : metric === "pressReleaseAge" ? "lte" : "gte", upper: "",
      value: signal ? "1" : metric === "pressReleaseAge" ? "24" : metric === "relativeVolume" ? "2" : "",
    }]);
    setEdit(true);
  }

  async function runScreen() {
    let selection;
    try { selection = definition(); } catch {
      setProblem("Check the ticker list and enter a valid value for every filter.");
      setEdit(true);
      return;
    }
    setBusy(true);
    setProblem("");
    try {
      const result = await request<RunResult>("", { action: "run", definition: selection });
      setRun(result);
      setApplied(selection);
      setAppliedSelection(selected);
      setShowSharedUnavailable(false);
    } catch (error) {
      setProblem(resultError(error, "Market data is unavailable. Try again shortly."));
    } finally {
      setBusy(false);
    }
  }

  async function changePage(page: number, sort = applied?.sort) {
    if (busy || !run || !applied || !sort) return;
    setBusy(true);
    setProblem("");
    try {
      const query = new URLSearchParams({ run: run.id, page: String(page), sort: sort.metric, dir: sort.dir });
      const result = await request<RunResult>("?" + query);
      setApplied({ ...applied, sort });
      if (!dirty && !equals(draft.sort, sort)) {
        setDraft(current => current.sort === draft.sort ? { ...current, sort } : current);
      }
      setRun(result);
    } catch (error) {
      setProblem(resultError(error, "Could not load these results. Try again."));
    } finally { setBusy(false); }
  }

  function changeDraftSort(sort: Definition["sort"]) {
    if (!run || dirty || (sort.metric === "pressReleaseAge" && !run.pressReleases?.available)) {
      setDraft(current => ({ ...current, sort }));
    } else void changePage(1, sort);
  }

  async function write(next: SavedScreens, message: string, confirmsChange: (latest: SavedScreens) => boolean) {
    setSaving(true);
    setProblem("");
    setSavedNotice("");
    try {
      const result = await request<SavedScreens>("", { action: "save", saved: next });
      setSaved(result);
      setSavedNotice(message);
      return true;
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "saved_conflict" || code === "request_interrupted") {
        const latest = await request<SavedScreens>("").catch(() => null);
        if (latest) {
          setSaved(latest);
          if (latest.revision > next.revision && confirmsChange(latest)) {
            setSavedNotice(message);
            return true;
          }
          setSelected(current => current.startsWith("saved:") && !latest.screens.some(screen => current === "saved:" + screen.id)
            ? "new" : current);
          if (selectedScreen && !latest.screens.some(screen => screen.id === selectedScreen.id)) {
            if (saveMode === "delete") setSaveMode(null);
            if (saveMode === "rename") setSaveMode("save");
            setProblem("This screen was deleted in another tab. You can save your filters as a new screen.");
            return false;
          }
        }
        setProblem(code === "saved_conflict" ? "Saved screens changed in another tab. Your edits are still here. Try saving again."
          : "Could not confirm the save. Your edits are still here. Try again.");
      } else setProblem("The screen could not be saved. Your edits are still here.");
      return false;
    } finally { setSaving(false); }
  }

  async function saveScreen() {
    if (!saveMode) return;
    const cleaned = name.trim();
    if (saveMode !== "delete" && !cleaned) return;
    const next: SavedScreens = { ...saved, screens: [...saved.screens] };
    let selection: string | null = null;
    let id: string;
    const existing = next.screens.findIndex(screen => screen.id === selectedScreen?.id);
    try {
      if (existing >= 0 && saveMode !== "copy") {
        const screen = next.screens[existing];
        id = screen.id;
        if (saveMode === "delete") {
          next.screens.splice(existing, 1);
          if (next.defaultId === id) next.defaultId = null;
          selection = "new";
        } else if (saveMode === "rename") {
          next.screens[existing] = { ...screen, name: cleaned };
        } else {
          next.screens[existing] = { ...screen, name: cleaned, definition: definition() };
        }
      } else {
        id = newScreenId.current ??= crypto.randomUUID();
        const index = next.screens.findIndex(screen => screen.id === id);
        if (index < 0 && next.screens.length >= MAX_SAVED) {
          setProblem("Remove a saved screen before creating another.");
          setSaveMode(null);
          return;
        }
        const screen = { id, name: cleaned, definition: definition() };
        if (index < 0) next.screens.push(screen);
        else next.screens[index] = screen;
        selection = "saved:" + id;
      }
    } catch {
      setProblem("Check the ticker list and filter values before saving.");
      setSaveMode(null);
      setEdit(true);
      return;
    }
    const expectedScreen = next.screens.find(screen => screen.id === id);
    const success = await write(next, saveMode === "delete" ? "Screen deleted." : "Screen saved.",
      latest => equals(latest.screens.find(screen => screen.id === id), expectedScreen));
    if (!success) return;
    setSaveMode(null);
    if (selection) {
      setSelected(selection);
      if (applied && !dirty) setAppliedSelection(selection);
    }
  }

  function openSave(mode: typeof saveMode) {
    const sourceName = selectedScreen?.name ?? selectedPreset?.name ?? selectedShared?.name;
    newScreenId.current = null;
    setProblem("");
    setName(mode === "copy" ? (sourceName ?? "Screen").slice(0, 65) + " copy" : sourceName ?? "");
    setSaveMode(mode);
  }

  const inspect: Inspect = (row, kind) => {
    setInspected({ row, kind, run, rules: applied?.rules ?? [] });
    setNews(null);
    setNewsError(false);
    const stamp = ++newsRequest.current;
    if (kind === "news") {
      request<{ articles: NewsHeadline[] }>("?news=" + encodeURIComponent(row.symbol))
        .then(value => { if (newsRequest.current === stamp) setNews(value.articles); })
        .catch(() => { if (newsRequest.current === stamp) setNewsError(true); });
    }
  };
  function closeDetails() {
    newsRequest.current++;
    setInspected(null);
  }
  const dismissSharedWarning = showSharedUnavailable ? () => setShowSharedUnavailable(false) : undefined;

  return <Box sx={{ "& [data-traderlink-platform-dashboard-card='panel']": { borderRadius: 0 } }}>
    <DashboardPanel title="Screeners">
      {showSharedUnavailable && <Alert severity="info" sx={{ mb: 1 }}>This shared screen is unavailable.</Alert>}
      <Box component="form" onSubmit={event => { event.preventDefault(); if (!busy) void runScreen(); }}
        sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mb: 1.2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", maxWidth: "100%" }}>
          <Picker label="Screen" width={178} value={selected} onChange={select}>
            {selected === "new" && <MenuItem value="new" disabled>Untitled screen</MenuItem>}
            {sharedScreen && <MenuItem value="shared">{sharedScreen.name} · Shared</MenuItem>}
            <ListSubheader>TraderLink presets</ListSubheader>
            {PRESETS.map(preset => <MenuItem key={preset.id} value={"preset:" + preset.id} onClick={dismissSharedWarning}>
              {preset.name}
            </MenuItem>)}
            {saved.screens.length > 0 && <ListSubheader>My screens</ListSubheader>}
            {saved.screens.map(screen => <MenuItem key={screen.id} value={"saved:" + screen.id} onClick={dismissSharedWarning}>
              {screen.name}{saved.defaultId === screen.id ? " · Default" : ""}
            </MenuItem>)}
          </Picker>
          <DashboardSecondaryAction type="button" startIcon={<AddRounded />} onClick={startNewScreen} disabled={busy || saving}>
            New screen
          </DashboardSecondaryAction>
          <DashboardSecondaryAction type="button" onClick={() => setCommunityOpen(true)} disabled={busy || saving}>
            Community presets
          </DashboardSecondaryAction>
        </Box>
        <Picker label="Universe" value={draft.universe} onChange={value => setDraft({ ...draft, universe: value as Universe })} width={219}>
          {Object.entries(UNIVERSES).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </Picker>
        <Picker label="Session" value={draft.session} onChange={value => setDraft({ ...draft, session: value as Session })} width={184}>
          {Object.entries(SESSIONS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </Picker>
        <DashboardPrimaryAction type="submit" disabled={busy}>{busy ? "Working…" : run && !dirty ? "Refresh results" : "Run screen"}</DashboardPrimaryAction>
        <DashboardSecondaryAction type="button" onClick={() => openSave(selectedShared ? "copy" : "save")} disabled={saving}>
          {selectedShared ? "Save a copy" : "Save screen"}
        </DashboardSecondaryAction>
      </Box>
      {selectedShared && <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center", mb: 1 }}>
        <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>{selectedShared.name} · Shared by {selectedShared.author}</Typography>
        <Button variant="outlined" size="small" onClick={() => {
          const link = new URL(sharedScreenPath(selectedShared.id), window.location.origin);
          window.location.href = "mailto:support@traderslink.pro?subject=Report%20a%20Screeners%20preset&body="
            + encodeURIComponent("Preset: " + link.href + "\n\nReason: ");
        }}>Report preset</Button>
      </Box>}
      {draft.universe === "list" && <TextField label="Tickers" placeholder="ABC, XYZ" helperText="Up to 100 covered U.S. tickers."
        size="small" value={tickerText} onChange={event => setTickerText(event.target.value)} sx={{ mb: 1.2, width: 330, maxWidth: "100%" }} />}
      <Box role="group" aria-label="Screen filters" sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 1 }}>
        <FilterCatalog onAdd={addFilter} disabled={rules.length >= MAX_RULES} />
        <MarketCapControl rules={rules} onRules={setRules} />
        <Picker label="Exchange" width={148} value={draft.exchanges[0] ?? "all"}
          onChange={value => setDraft({ ...draft, exchanges: value === "all" ? [] : [value as Definition["exchanges"][number]] })}>
          <MenuItem value="all">All exchanges</MenuItem>
          {EXCHANGES.map(value => <MenuItem key={value} value={value}>{EXCHANGE_LABELS[value] ?? value}</MenuItem>)}
        </Picker>
        {rules.length === MAX_RULES && !edit && <Typography variant="caption">This screen uses all {MAX_RULES} filters.</Typography>}
        {rules.filter(rule => rule.metric !== "cap" || !singleCapRule)
          .map(rule => <Chip size="small" key={rule.key} label={rulesLabel(rule)} onClick={() => setEdit(true)}
          onDelete={() => setRules(rules.filter(item => item.key !== rule.key))} />)}
        {dirty && <Typography variant="caption" color="warning.main">Unapplied changes</Typography>}
      </Box>
      {edit && <Box sx={{ mb: 1 }}>
        {rules.length > 0 && <FilterEditor rules={rules} onRules={setRules} />}
        <Box sx={{ mt: 0.8, display: "flex", gap: 0.65, flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outlined" size="small" onClick={() => {
            load(applied ? { ...applied, view: draft.view, columns: draft.columns } : currentDefinition);
            if (appliedSelection) setSelected(
              appliedSelection.startsWith("saved:") && !saved.screens.some(screen => "saved:" + screen.id === appliedSelection)
                ? "new" : appliedSelection,
            );
            setEdit(false);
          }}>Cancel changes</Button>
          <Button variant="outlined" size="small" onClick={() => load(currentDefinition)}>Reset filters</Button>
          <Button variant="outlined" size="small" onClick={() => setEdit(false)}>Done editing</Button>
        </Box>
      </Box>}
      <Box sx={{ display: "flex", gap: 0.75, alignItems: "center", flexWrap: "wrap", mb: 0.85 }}>
        <Picker label="View" value={draft.view} onChange={view => setDraft({ ...draft, view: view as View })} width={111}>
          {Object.entries(VIEWS).map(([key, label]) => <MenuItem key={key} value={key}>{label}</MenuItem>)}
        </Picker>
        <Button variant="outlined" size="small" onClick={() => setColumnsOpen(true)}>Columns</Button>
        <Picker label="Sort" value={draft.sort.metric} width={150} disabled={busy} onChange={metric => changeDraftSort({ metric: metric as Metric | "ticker", dir: metric === "ticker" || metric === "pressReleaseAge" ? "asc" : "desc" })}>
          <MenuItem value="ticker">Ticker</MenuItem>
          {METRIC_KEYS.map(metric => <MenuItem key={metric} value={metric}>{METRICS[metric].label}</MenuItem>)}
        </Picker>
        <Button variant="outlined" size="small" disabled={busy} onClick={() => changeDraftSort({ ...draft.sort, dir: draft.sort.dir === "asc" ? "desc" : "asc" })}>
          {draft.sort.dir === "asc" ? "Ascending" : "Descending"}
        </Button>
        {selectedScreen && <Box sx={{ display: "flex", gap: 0.55, flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" disabled={saving} onClick={() => openSave("rename")}>Rename</Button>
          <Button size="small" variant="outlined" disabled={saving} onClick={() => openSave("copy")}>Duplicate</Button>
          <Button size="small" variant="outlined" disabled={saving} onClick={() => setShareOpen(true)}>Share</Button>
          <Button size="small" variant="outlined" disabled={saving || saved.defaultId === selectedScreen.id}
            onClick={() => void write({ ...saved, defaultId: selectedScreen.id }, "Default screen saved.",
              latest => latest.defaultId === selectedScreen.id)}>Set as default</Button>
          <Button size="small" variant="outlined" color="error" disabled={saving} onClick={() => openSave("delete")}>Delete</Button>
        </Box>}
        <Button component={Link} href="/help/tools/stock-screeners" size="small" sx={{ ml: "auto" }}>Screeners help</Button>
      </Box>
      {problem && !saveMode && <Alert severity="error" sx={{ mb: 1 }} onClose={() => setProblem("")}>{problem}</Alert>}
      {savedNotice && <Typography role="status" variant="body2" color="success.main" sx={{ mb: 0.8 }}>{savedNotice}</Typography>}
      {busy && <LinearProgress aria-label="Loading results" />}
      {run ? <StockScreenerResults result={run} definition={{ ...draft, rules: applied?.rules ?? draft.rules, sort: applied?.sort ?? draft.sort }} busy={busy} inspect={inspect} onPage={page => void changePage(page)}
        onSort={metric => void changePage(1, { metric, dir: applied?.sort.metric === metric && applied.sort.dir === "desc" ? "asc" : "desc" })} />
        : <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>Choose a screen and run it to see matching stocks.</Typography>}
    </DashboardPanel>
    {columnsOpen && <ColumnsDialog definition={draft} onClose={() => setColumnsOpen(false)}
      onChange={columns => { setDraft({ ...draft, columns }); setColumnsOpen(false); }} />}
    {shareOpen && selectedScreen && <ScreenShareDialog key={selectedScreen.id} screen={selectedScreen} revision={saved.revision}
      onSavedRefresh={setSaved} onClose={() => setShareOpen(false)} />}
    {communityOpen && <CommunityPresetsDialog onClose={() => setCommunityOpen(false)} />}
    {saveMode && <Dialog open onClose={() => { if (!saving) setSaveMode(null); }} fullWidth maxWidth="xs" aria-labelledby="stock-screen-save-title"
      slotProps={{ paper: { component: "form", onSubmit: (event: SubmitEvent<HTMLElement>) => {
        event.preventDefault();
        if (!saving) void saveScreen();
      } } }}>
      <DialogTitle id="stock-screen-save-title">{saveMode === "delete" ? "Delete screen" : saveMode === "rename" ? "Rename screen" : saveMode === "copy" ? selectedShared ? "Save a copy" : "Duplicate screen" : "Save screen"}</DialogTitle>
      <DialogContent>
        {problem && <Alert severity="error" sx={{ mb: 1 }}>{problem}</Alert>}
        {saveMode === "delete" ? <Typography>Delete {selectedScreen?.name} from My screens?</Typography>
          : <TextField autoFocus fullWidth margin="dense" label="Screen name" value={name} onChange={event => setName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 70 } }} />}
      </DialogContent>
      <DialogActions><Button type="button" disabled={saving} onClick={() => setSaveMode(null)}>Cancel</Button>
        <Button type="submit" variant="contained" color={saveMode === "delete" ? "error" : "primary"}
          disabled={saving || (saveMode !== "delete" && !name.trim())}>{saveMode === "delete" ? "Delete screen" : "Save"}</Button>
      </DialogActions>
    </Dialog>}
    {inspected && <Dialog open onClose={closeDetails} fullWidth maxWidth={inspected.kind === "chart" ? "lg" : "sm"}
      aria-labelledby="stock-screeners-inspection">
      <DialogTitle id="stock-screeners-inspection" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {inspected.row.symbol} · {inspected.kind === "match" ? "Why it matched" : inspected.kind === "chart" ? "Chart" : "Recent News"}
        <IconButton aria-label="Close details" onClick={closeDetails}><CloseRounded /></IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {inspected.kind === "match" && <>
          {inspected.run && <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {SESSIONS[inspected.run.session]} · {displayTime(inspected.row.priceAt ?? inspected.run.asOf)} · {inspected.run.source}
          </Typography>}
          {inspected.rules.length ? inspected.rules.map((rule, index) => {
            const values = inspected.row.values;
            const period = OPENING_RANGE_MINUTES.find(minutes => rule.metric === `or${minutes}Position`);
            return <Typography key={index} variant="body2" sx={{ py: 0.6 }}>
              <strong>{METRICS[rule.metric].label} {displayValue(rule.metric, values[rule.metric])}</strong>
              {!signalChoices(rule.metric) && <>
                {" · "}{OPERATORS[rule.operator]} {exactValue(rule.metric, rule.value)}{rule.upper !== undefined ? " and " + exactValue(rule.metric, rule.upper) : ""}
              </>}
              {period !== undefined && <> {" · "}{displayValue(`or${period}Low`, values[`or${period}Low`])}–{displayValue(`or${period}High`, values[`or${period}High`])}</>}
              {(rule.metric === "vwapPosition" || rule.metric === "vwapDistance" || rule.metric === "vwapCross") && values.sessionVwap !== undefined
                && <> {" · VWAP "}{displayValue("sessionVwap", values.sessionVwap)}</>}
              {inspected.row.quoteAt && ["bid", "ask", "spread", "spreadDollar"].includes(rule.metric) ? " · Quote " + displayTime(inspected.row.quoteAt) : ""}
            </Typography>;
          }) : <Typography variant="body2">This stock is in the selected universe and has a price for this session.</Typography>}
          {inspected.row.pressRelease && <Typography variant="body2" sx={{ mt: 1, overflowWrap: "anywhere" }}>
            {displayTime(inspected.row.pressRelease.publishedAt)} · {" "}
            <Link href={inspected.row.pressRelease.url} target="_blank" rel="noreferrer">{inspected.row.pressRelease.headline}</Link>
          </Typography>}
        </>}
        {inspected.kind === "chart" && (preview
          ? <Typography variant="body2">Chart history is unavailable in this preview.</Typography>
          : <Box sx={{ height: { xs: 360, md: 520 } }}><Chart symbol={inspected.row.symbol} compactMobile viewId="screener" /></Box>)}
        {inspected.kind === "news" && (newsError ? <Alert severity="warning">Recent news is unavailable.</Alert> : news === null
          ? <LinearProgress aria-label="Loading news" /> : news.length ? <Box component="ul" sx={{ pl: 2, my: 0 }}>
            {news.map(item => <li key={item.url}><Typography variant="body2" sx={{ my: 0.85 }}>
              {displayTime(item.publishedAt)} · <Link href={item.url} target="_blank" rel="noreferrer">{item.headline}</Link>
            </Typography></li>)}
          </Box> : <Typography variant="body2">No news was found for this ticker in the last 48 hours.</Typography>)}
      </DialogContent>
    </Dialog>}
  </Box>;
}
