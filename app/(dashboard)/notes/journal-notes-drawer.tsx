"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Drawer, FormControlLabel, IconButton, MenuItem, Select, Stack, Switch, Tab, Tabs, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type NoteCategory = "what_worked" | "what_needs_work" | "technical_recap" | "general" | "custom";
type DrawerView = "add" | "saved" | "details" | "focuses";
export type JournalNotesDrawerInitialView = Extract<DrawerView, "add" | "focuses">;
type Launch = Readonly<{ kind: "session"; sessionDate: string }> | Readonly<{ kind: "trade"; roundTripId: string; symbol?: string }>;
type CustomType = Readonly<{ noteTypeId: string; displayName: string; revision: number }>;
type Focus = Readonly<{ focusText: string; revision: number; showInWorkspace: boolean }>;
type SavedNote = Readonly<{ category: NoteCategory; customType: CustomType | null; noteId: string; revision: number | null; text: string; updatedAtUtc?: string }>;
type SessionReview = Readonly<{
  rules: readonly Readonly<{ ruleId: string; ruleVersion: string; statement: string; title: string }>[];
  reviews: readonly Readonly<{ revision: number; ruleId: string; ruleVersion: string; status: "followed" | "broken" | "not-reviewed" }>[];
  selectedTagIds: readonly string[];
  tags: readonly Readonly<{ name: string; tagId: string }>[];
}>;
type SessionSummaryTrade = Readonly<{ direction: "long" | "short"; entryAt: string; pnl: string | null; roundTripId: string; shares: string | null; symbol: string; timezone: string }>;
type SessionSummary = Readonly<{ pnl: string | null; tradeCount: number; trades: readonly SessionSummaryTrade[] }>;

export type JournalNotesDrawerProps = Readonly<{
  expectedAccountSelectionRef: string;
  focusOnly?: boolean;
  initialView?: JournalNotesDrawerInitialView;
  launch: Launch;
  onClose: () => void;
  onFocusSaved?: (focus: Readonly<{ focusText: string; showInWorkspace: boolean }>) => void;
  open: boolean;
  renderDetails?: () => ReactNode;
}>;

const categories: readonly Readonly<{ label: string; value: Exclude<NoteCategory, "custom"> }>[] = [
  { label: "General", value: "general" },
  { label: "What worked", value: "what_worked" },
  { label: "What needs work", value: "what_needs_work" },
  { label: "Technical recap", value: "technical_recap" },
];
const views: readonly Readonly<{ label: string; value: DrawerView }>[] = [
  { label: "Add Note", value: "add" }, { label: "Saved Notes", value: "saved" }, { label: "Details", value: "details" },
];
function headers(): HeadersInit { return { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }; }
function target(launch: Launch): Record<string, string> { return launch.kind === "session" ? { targetKind: "trading_day", tradingDate: launch.sessionDate } : { targetKind: "round_trip", roundTripId: launch.roundTripId }; }
function categoryLabel(category: NoteCategory, custom: CustomType | null): string { return category === "custom" ? custom?.displayName ?? "Custom" : categories.find((item) => item.value === category)?.label ?? category; }

export function JournalNotesDrawer({ expectedAccountSelectionRef, focusOnly = false, initialView = "add", launch, onClose, onFocusSaved, open, renderDetails }: JournalNotesDrawerProps) {
  const theme = useTheme(); const mobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [view, setView] = useState<DrawerView>(focusOnly ? "focuses" : initialView); const [category, setCategory] = useState<NoteCategory>("general");
  const [customTypeId, setCustomTypeId] = useState(""); const [customTypes, setCustomTypes] = useState<readonly CustomType[]>([]);
  const [noteText, setNoteText] = useState(""); const [savedNotes, setSavedNotes] = useState<readonly SavedNote[]>([]);
  const [legacyRevisions, setLegacyRevisions] = useState<Partial<Record<Exclude<NoteCategory, "custom">, number | null>>>({});
  const [sessionReview, setSessionReview] = useState<SessionReview | null>(null);
  const [sessionSummary, setSessionSummary] = useState<SessionSummary | null>(null);
  const [sessionTagIds, setSessionTagIds] = useState<readonly string[]>([]);
  const [sessionRuleStatuses, setSessionRuleStatuses] = useState<Record<string, "followed" | "broken" | "not-reviewed">>({});
  const [sessionTagsOpen, setSessionTagsOpen] = useState(!mobile);
  const [sessionRulesOpen, setSessionRulesOpen] = useState(!mobile);
  const [newSessionTag, setNewSessionTag] = useState("");
  const [selectedSessionDate, setSelectedSessionDate] = useState(
    launch.kind === "session" ? launch.sessionDate : "",
  );
  const [focus, setFocus] = useState<Focus | null>(null); const [focusText, setFocusText] = useState(""); const [showInWorkspace, setShowInWorkspace] = useState(false);
  const [addingType, setAddingType] = useState(false); const [newTypeName, setNewTypeName] = useState(""); const [message, setMessage] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  const loadRequestRef = useRef(0);
  const selectedCustomType = customTypes.find((item) => item.noteTypeId === customTypeId) ?? null;
  const activeLaunch: Launch = launch.kind === "session"
    ? { kind: "session", sessionDate: selectedSessionDate }
    : launch;
  const sessionTagsDirty = activeLaunch.kind === "session" && sessionReview !== null
    && [...sessionTagIds].sort().join("|") !== [...sessionReview.selectedTagIds].sort().join("|");
  const sessionRulesDirty = activeLaunch.kind === "session" && sessionReview !== null
    && sessionReview.rules.some((rule) => (
      (sessionRuleStatuses[rule.ruleId] ?? "not-reviewed")
      !== (sessionReview.reviews.find((review) => review.ruleId === rule.ruleId)?.status ?? "not-reviewed")
    ));
  const dirty = noteText.length > 0
    || focusText !== (focus?.focusText ?? "")
    || showInWorkspace !== (focus?.showInWorkspace ?? false)
    || sessionTagsDirty
    || sessionRulesDirty;
  const contextLabel = activeLaunch.kind === "session" ? `Session note · ${activeLaunch.sessionDate}` : `Trade note${activeLaunch.symbol ? ` · ${activeLaunch.symbol}` : ""}`;

  async function readJson(url: string): Promise<Record<string, unknown> | null> { const response = await fetch(url, { cache: "no-store" }); return response.ok ? await response.json() as Record<string, unknown> : null; }
  async function load(): Promise<void> {
    const request = ++loadRequestRef.current;
    if (focusOnly) {
      const focusPayload = await readJson("/api/platform/notes/current-focuses");
      if (request !== loadRequestRef.current) return;
      const nextFocus = focusPayload?.focus && typeof focusPayload.focus === "object" ? focusPayload.focus as Focus : null;
      setFocus(nextFocus); setFocusText(nextFocus?.focusText ?? ""); setShowInWorkspace(nextFocus?.showInWorkspace ?? false);
      return;
    }
    const query = new URLSearchParams(target(activeLaunch));
    const sessionReviewPayload = activeLaunch.kind === "session"
      ? readJson(`/api/platform/notes/session-review/${encodeURIComponent(activeLaunch.sessionDate)}`)
      : Promise.resolve(null);
    const sessionSummaryPayload = activeLaunch.kind === "session"
      ? readJson(`/api/platform/notes/session-summary/${encodeURIComponent(activeLaunch.sessionDate)}`)
      : Promise.resolve(null);
    const [typesPayload, focusPayload, categorizedPayload, sessionPayload, summaryPayload, ...standardPayloads] = await Promise.all([
      readJson("/api/platform/notes/types"), readJson("/api/platform/notes/current-focuses"), readJson(`/api/platform/notes/categorized?${query}`),
      sessionReviewPayload,
      sessionSummaryPayload,
      ...categories.map((item) => readJson(`/api/platform/notes/standard?${new URLSearchParams({ ...target(activeLaunch), category: item.value })}`)),
    ]);
    if (request !== loadRequestRef.current) return;
    const types = Array.isArray(typesPayload?.noteTypes) ? typesPayload.noteTypes as CustomType[] : []; setCustomTypes(types);
    const nextFocus = focusPayload?.focus && typeof focusPayload.focus === "object" ? focusPayload.focus as Focus : null; setFocus(nextFocus); setFocusText(nextFocus?.focusText ?? ""); setShowInWorkspace(nextFocus?.showInWorkspace ?? false);
    const next: SavedNote[] = Array.isArray(categorizedPayload?.notes) ? categorizedPayload.notes as SavedNote[] : [];
    const revisions: Partial<Record<Exclude<NoteCategory, "custom">, number | null>> = {};
    standardPayloads.forEach((payload, index) => { const note = payload?.note as { available?: boolean; revision?: number | null; text?: string } | undefined; const key = categories[index]!.value; if (note?.available) revisions[key] = note.revision ?? null; if (note?.available && note.text?.trim()) next.push({ category: key, customType: null, noteId: `${key}-legacy`, revision: note.revision ?? null, text: note.text }); });
    setLegacyRevisions(revisions);
    setSavedNotes(next);
    const review = sessionPayload?.data as SessionReview | undefined;
    setSessionReview(review ?? null);
    setSessionSummary(summaryPayload ? Object.freeze({
      pnl: typeof (summaryPayload.summary as { pnl?: unknown } | undefined)?.pnl === "string"
        ? (summaryPayload.summary as { pnl: string }).pnl
        : null,
      tradeCount: typeof (summaryPayload.summary as { tradeCount?: unknown } | undefined)?.tradeCount === "number"
        ? (summaryPayload.summary as { tradeCount: number }).tradeCount
        : 0,
      trades: Array.isArray(summaryPayload.trades) ? summaryPayload.trades as SessionSummaryTrade[] : [],
    }) : null);
    setSessionTagIds(review?.selectedTagIds ?? []);
    setSessionRuleStatuses(Object.fromEntries((review?.rules ?? []).map((rule) => [
      rule.ruleId,
      (review?.reviews ?? []).find((item) => item.ruleId === rule.ruleId)?.status ?? "not-reviewed",
    ])));
  }
  useEffect(() => {
    if (launch.kind === "session") setSelectedSessionDate(launch.sessionDate);
  }, [launch.kind, launch.kind === "session" ? launch.sessionDate : ""]);
  useEffect(() => {
    if (!open) return;
    setMessage(null); setView(focusOnly ? "focuses" : initialView); setCategory("general"); setCustomTypeId(""); setNoteText(""); setSessionTagsOpen(!mobile); setSessionRulesOpen(!mobile);
  }, [open, focusOnly, initialView, mobile, launch.kind, launch.kind === "session" ? launch.sessionDate : launch.roundTripId]);
  useEffect(() => {
    if (open) void load();
  }, [open, focusOnly, activeLaunch.kind, activeLaunch.kind === "session" ? activeLaunch.sessionDate : activeLaunch.roundTripId]);
  function close(): void { if (dirty && !window.confirm("Discard unsaved note changes?")) return; onClose(); }
  function changeSessionDate(nextDate: string): void {
    if (!nextDate || nextDate === selectedSessionDate) return;
    if (dirty && !window.confirm("Discard unsaved changes before opening another session date?")) return;
    setMessage(null); setCategory("general"); setCustomTypeId(""); setNoteText(""); setNewSessionTag("");
    setSessionReview(null); setSessionSummary(null); setSessionTagIds([]); setSessionRuleStatuses({}); setSelectedSessionDate(nextDate);
  }
  async function saveNote(): Promise<void> {
    if (!noteText.trim()) { setMessage("Write a note before saving."); return; }
    setSaving(true); setMessage(null); try {
      const isLegacy = category !== "custom" && (activeLaunch.kind === "session" || category === "general" || category === "technical_recap");
      const url = isLegacy ? "/api/platform/notes/standard" : "/api/platform/notes/categorized";
      const existing = savedNotes.find((item) => category === "custom"
        ? item.category === "custom" && item.customType?.noteTypeId === customTypeId
        : item.category === category);
      const expectedRevision = category === "custom" ? existing?.revision ?? null : legacyRevisions[category];
      const response = await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify({ ...target(activeLaunch), category, customTypeId: category === "custom" ? customTypeId : undefined, expectedAccountSelectionRef, expectedRevision: expectedRevision ?? null, text: noteText }) });
      if (!response.ok) throw new Error(); setMessage("Note saved."); setNoteText(""); await load(); setView("saved");
    } catch { setMessage("The note could not be saved. Refresh and try again."); } finally { setSaving(false); }
  }
  async function saveSessionTags(): Promise<void> {
    if (activeLaunch.kind !== "session") return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(`/api/platform/notes/session-review/${encodeURIComponent(activeLaunch.sessionDate)}`, {
        method: "PUT", headers: headers(), body: JSON.stringify({ expectedAccountSelectionRef, tagIds: sessionTagIds }),
      });
      if (!response.ok) throw new Error();
      setMessage("Session tags saved."); await load();
    } catch { setMessage("Session tags could not be saved. Refresh and try again."); } finally { setSaving(false); }
  }
  async function createSessionTag(): Promise<void> {
    if (!newSessionTag.trim()) return;
    if (sessionTagIds.length >= 10) {
      setMessage("A session can have up to 10 tags.");
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const response = await fetch("/api/intelligence/trade-tags", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedAccountSelectionRef, name: newSessionTag }),
      });
      const payload = await response.json() as { data?: { tagId?: string } };
      if (!response.ok || !payload.data?.tagId) throw new Error();
      const nextTagIds = [...new Set([...sessionTagIds, payload.data.tagId])];
      const assignment = await fetch(`/api/platform/notes/session-review/${encodeURIComponent(activeLaunch.kind === "session" ? activeLaunch.sessionDate : "")}`, {
        method: "PUT", headers: headers(), body: JSON.stringify({ expectedAccountSelectionRef, tagIds: nextTagIds }),
      });
      if (!assignment.ok) throw new Error();
      setNewSessionTag(""); setSessionTagIds(nextTagIds); await load();
    } catch { setMessage("That tag could not be created. Use a unique name and try again."); } finally { setSaving(false); }
  }
  async function saveSessionRule(rule: SessionReview["rules"][number]): Promise<void> {
    if (activeLaunch.kind !== "session") return;
    setSaving(true); setMessage(null);
    try {
      const current = sessionReview?.reviews.find((item) => item.ruleId === rule.ruleId) ?? null;
      const response = await fetch(`/api/intelligence/day-session/${encodeURIComponent(activeLaunch.sessionDate)}/rule-reviews`, {
        method: "PUT", headers: { "content-type": "application/json" },
        body: JSON.stringify({ applicability: "day", expectedAccountSelectionRef, expectedRevision: current?.revision ?? null, ruleId: rule.ruleId, ruleVersion: rule.ruleVersion, status: sessionRuleStatuses[rule.ruleId] ?? "not-reviewed" }),
      });
      if (!response.ok) throw new Error(); setMessage("Session rule saved."); await load();
    } catch { setMessage("That session rule could not be saved. Refresh and try again."); } finally { setSaving(false); }
  }
  async function saveCustomType(): Promise<void> { setSaving(true); try { const response = await fetch("/api/platform/notes/types", { method: "POST", headers: headers(), body: JSON.stringify({ displayName: newTypeName }) }); const payload = await response.json() as { noteType?: CustomType }; if (!response.ok || !payload.noteType) throw new Error(); setCustomTypes((items) => [...items, payload.noteType!]); setCustomTypeId(payload.noteType.noteTypeId); setCategory("custom"); setNewTypeName(""); setAddingType(false); } catch { setMessage("That custom note type could not be saved."); } finally { setSaving(false); } }
  async function retire(type: CustomType): Promise<void> { if (!window.confirm(`Remove ${type.displayName} from future note choices? Existing notes will stay.`)) return; const response = await fetch(`/api/platform/notes/types/${encodeURIComponent(type.noteTypeId)}`, { method: "DELETE", headers: headers(), body: JSON.stringify({ expectedRevision: type.revision }) }); if (response.ok) { setCustomTypes((items) => items.filter((item) => item.noteTypeId !== type.noteTypeId)); if (customTypeId === type.noteTypeId) setCustomTypeId(""); } else setMessage("That custom note type could not be removed."); }
  async function saveFocus(): Promise<void> { setSaving(true); try { const response = await fetch("/api/platform/notes/current-focuses", { method: "PUT", headers: headers(), body: JSON.stringify({ expectedRevision: focus?.revision ?? null, focusText, showInWorkspace }) }); const payload = await response.json() as { focus?: Focus }; if (!response.ok || !payload.focus) throw new Error(); setFocus(payload.focus); setFocusText(payload.focus.focusText); setShowInWorkspace(payload.focus.showInWorkspace); onFocusSaved?.({ focusText: payload.focus.focusText, showInWorkspace: payload.focus.showInWorkspace }); setMessage("Current Focuses saved."); } catch { setMessage("Current Focuses could not be saved. Refresh and try again."); } finally { setSaving(false); } }
  const selectedLabel = categoryLabel(category, selectedCustomType);
  const sessionDateField = activeLaunch.kind !== "session" ? null : (
    <TextField
      label="Session date"
      onChange={(event) => changeSessionDate(event.target.value)}
      size="small"
      slotProps={{ inputLabel: { shrink: true } }}
      type="date"
      value={selectedSessionDate}
    />
  );
  const sessionReviewFields = activeLaunch.kind !== "session" ? null : <>
    <Accordion expanded={sessionTagsOpen} onChange={(_, expanded) => setSessionTagsOpen(expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography sx={{ fontWeight: 800 }}>Session tags</Typography></AccordionSummary>
      <AccordionDetails><Stack spacing={1.25}>
        <Typography color="text.secondary" variant="body2">Tags describe this full trading session, not one trade.</Typography>
        {sessionReview ? <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }} useFlexGap>{sessionReview.tags.map((tag) => <Chip color={sessionTagIds.includes(tag.tagId) ? "primary" : "default"} key={tag.tagId} label={tag.name} onClick={() => setSessionTagIds((current) => current.includes(tag.tagId) ? current.filter((id) => id !== tag.tagId) : current.length >= 10 ? current : [...current, tag.tagId])} variant={sessionTagIds.includes(tag.tagId) ? "filled" : "outlined"} />)}</Stack> : <Typography color="text.secondary" variant="body2">Loading available tags…</Typography>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={0.75}><TextField label="New session tag" onChange={(event) => setNewSessionTag(event.target.value)} size="small" value={newSessionTag} /><Button disabled={saving || !newSessionTag.trim()} onClick={() => void createSessionTag()} size="small">Add tag</Button></Stack>
        <Button disabled={saving} onClick={() => void saveSessionTags()} sx={{ alignSelf: "flex-start" }} variant="outlined">Save session tags</Button>
      </Stack></AccordionDetails>
    </Accordion>
    <Accordion expanded={sessionRulesOpen} onChange={(_, expanded) => setSessionRulesOpen(expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography sx={{ fontWeight: 800 }}>Session rules</Typography></AccordionSummary>
      <AccordionDetails><Stack spacing={1.25}>
        <Typography color="text.secondary" variant="body2">Mark only the rules that apply to this full trading session.</Typography>
        {!sessionReview ? <Typography color="text.secondary" variant="body2">Loading session rules…</Typography> : sessionReview.rules.length === 0 ? <Typography color="text.secondary" variant="body2">No active day rules are available for this session.</Typography> : sessionReview.rules.map((rule) => <Box key={rule.ruleId} sx={{ borderTop: 1, borderColor: "divider", pt: 1.25 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{rule.title}</Typography><Typography color="text.secondary" variant="body2">{rule.statement}</Typography><Stack direction={{ xs: "column", sm: "row" }} spacing={0.75} sx={{ mt: 1 }}><Select aria-label={`${rule.title} result`} onChange={(event) => setSessionRuleStatuses((current) => ({ ...current, [rule.ruleId]: event.target.value as "followed" | "broken" | "not-reviewed" }))} size="small" value={sessionRuleStatuses[rule.ruleId] ?? "not-reviewed"}><MenuItem value="not-reviewed">Not reviewed</MenuItem><MenuItem value="followed">Followed</MenuItem><MenuItem value="broken">Broken</MenuItem></Select><Button disabled={saving} onClick={() => void saveSessionRule(rule)} size="small">Save rule</Button></Stack></Box>)}
      </Stack></AccordionDetails>
    </Accordion>
  </>;
  const sessionSummaryContent = activeLaunch.kind !== "session" ? null : <Stack spacing={1.25}>
    <Typography color="text.secondary" variant="body2">Session Summary · {activeLaunch.sessionDate}</Typography>
    <Typography color="text.secondary" variant="body2">P/L includes entered fees. Trades without a recorded fee use their gross P/L.</Typography>
    {sessionSummary === null ? <Typography color="text.secondary" variant="body2">Loading session trades…</Typography> : <><Typography sx={{ fontWeight: 800 }} variant="body2">Session P/L: {sessionSummary.pnl ?? "Unavailable"} · {sessionSummary.tradeCount} completed {sessionSummary.tradeCount === 1 ? "trade" : "trades"}</Typography>{sessionSummary.trades.length === 0 ? <Typography color="text.secondary" variant="body2">No completed trades are available for this session.</Typography> : sessionSummary.trades.map((trade) => <Box component="details" key={trade.roundTripId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25 }}><Box component="summary" sx={{ cursor: "pointer", fontWeight: 800 }}>{trade.symbol} · {trade.direction === "long" ? "Long" : "Short"}</Box><Stack spacing={0.4} sx={{ mt: 1 }}><Typography variant="body2">P/L: {trade.pnl ?? "Unavailable"}</Typography><Typography variant="body2">Shares traded: {trade.shares ?? "Unavailable"}</Typography><Typography variant="body2">Entry: {new Date(trade.entryAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: trade.timezone })}</Typography></Stack></Box>)}</>}
  </Stack>;
  const content = view === "add" ? (
    <Stack spacing={2.25}>
      <Typography color="text.secondary" variant="body2">{contextLabel}</Typography>
      {sessionDateField}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Select aria-label="Note type" onChange={(event) => { const value = event.target.value; if (value.startsWith("custom:")) { setCategory("custom"); setCustomTypeId(value.slice(7)); } else setCategory(value as NoteCategory); }} size="small" sx={{ minWidth: 210 }} value={category === "custom" ? `custom:${customTypeId}` : category}>
          {categories.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          {customTypes.map((item) => <MenuItem key={item.noteTypeId} value={`custom:${item.noteTypeId}`}>{item.displayName}</MenuItem>)}
        </Select>
        {addingType ? <Stack direction="row" spacing={0.75}><TextField autoFocus onChange={(event) => setNewTypeName(event.target.value)} placeholder="Enter note name" size="small" value={newTypeName} /><Button disabled={saving || !newTypeName.trim()} onClick={() => void saveCustomType()} size="small">Save</Button></Stack> : <Button onClick={() => setAddingType(true)} size="small" startIcon={<AddRoundedIcon />}>Custom note type</Button>}
      </Stack>
      {category === "custom" && !selectedCustomType ? <Alert severity="info">Choose or create a custom note type first.</Alert> : <TextField label={selectedLabel} minRows={8} multiline onChange={(event) => setNoteText(event.target.value)} placeholder={`Write your ${selectedLabel.toLowerCase()} note…`} value={noteText} />}
      {sessionReviewFields}
      {message ? <Alert severity={message.includes("could not") ? "error" : "success"}>{message}</Alert> : null}
      <Button disabled={saving || (category === "custom" && !selectedCustomType)} onClick={() => void saveNote()} sx={{ alignSelf: "flex-start" }} variant="contained">Save Note</Button>
    </Stack>
  ) : view === "saved" ? <Stack spacing={1.25}>{savedNotes.length === 0 ? <Typography color="text.secondary">No saved notes in this view yet.</Typography> : savedNotes.map((note) => <Box key={note.noteId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{categoryLabel(note.category, note.customType)}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{note.text}</Typography></Box>)}{customTypes.length ? <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }} variant="body2">Custom note types</Typography>{customTypes.map((item) => <Stack direction="row" key={item.noteTypeId} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{item.displayName}</Typography><IconButton aria-label={`Remove ${item.displayName}`} onClick={() => void retire(item)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Stack>)}</Box> : null}</Stack> : view === "details" ? <Stack spacing={1.25}><Typography color="text.secondary" variant="body2">{launch.kind === "session" ? "Session Summary" : "Trade Details"}</Typography>{renderDetails?.() ?? <Typography color="text.secondary" variant="body2">Details are supplied by the page that opened Notes.</Typography>}</Stack> : <Stack spacing={2}><Typography color="text.secondary" variant="body2">Current Focuses are your ongoing trading goals. They are not attached to one trade or one session.</Typography><TextField label="Current Focuses" minRows={7} multiline onChange={(event) => setFocusText(event.target.value)} placeholder="For example: follow my risk rules, or improve chart reading." value={focusText} /><FormControlLabel control={<Switch checked={showInWorkspace} onChange={(event) => setShowInWorkspace(event.target.checked)} />} label="Display this on my Workspace" />{message ? <Alert severity={message.includes("could not") ? "error" : "success"}>{message}</Alert> : null}<Button disabled={saving} onClick={() => void saveFocus()} sx={{ alignSelf: "flex-start" }} variant="contained">Save Current Focuses</Button></Stack>;
  return <Drawer anchor="right" onClose={close} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 520 }, maxWidth: "100vw" } } }}><Stack sx={{ height: "100%" }}><Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{focusOnly ? "Current Focuses" : activeLaunch.kind === "session" ? "Session Review" : "Notes"}</Typography><IconButton aria-label="Close Notes" onClick={close}><CloseRoundedIcon /></IconButton></Stack>{focusOnly ? null : mobile ? <Select fullWidth onChange={(event) => setView(event.target.value as DrawerView)} size="small" sx={{ m: 1.5, width: "calc(100% - 24px)" }} value={view}>{views.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select> : <Tabs onChange={(_, value: DrawerView) => setView(value)} value={view} variant="fullWidth">{views.map((item) => <Tab key={item.value} label={item.label} value={item.value} />)}</Tabs>}<Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>{focusOnly ? content : view === "details" && activeLaunch.kind === "session" ? sessionSummaryContent : content}</Box></Stack></Drawer>;
}
