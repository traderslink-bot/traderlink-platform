"use client";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { Accordion, AccordionDetails, AccordionSummary, Alert, Box, Button, Chip, Drawer, FormControlLabel, IconButton, MenuItem, Select, Stack, Switch, Tab, Tabs, TextField, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { JOURNAL_TAG_PRESET_CATALOG, journalTagPresetForName, journalTagPresetKeyFromSelectionId, journalTagPresetSelectionId } from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
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
  tags: readonly Readonly<{ assignmentCount: number; name: string; revision: string; tagId: string }>[];
}>;
type SessionReviewHistoryItem = Readonly<{ noteCount: number; ruleCount: number; sessionDate: string; tagCount: number; updatedAtUtc: string }>;
type SessionSummaryTrade = Readonly<{ direction: "long" | "short"; entryAt: string; pnl: string | null; roundTripId: string; shares: string | null; symbol: string; timezone: string }>;
type SessionPresetRule = Readonly<{ ruleId: string; ruleVersion: string; status: "followed" | "broken" | "not-reviewed" | "n/a"; title: string }>;
type SessionSummary = Readonly<{ pnl: string | null; presetRules: readonly SessionPresetRule[]; tradeCount: number; trades: readonly SessionSummaryTrade[] }>;

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
  { label: "Review", value: "add" }, { label: "Details", value: "details" }, { label: "Saved sessions", value: "saved" },
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
  const [sessionReviewHistory, setSessionReviewHistory] = useState<readonly SessionReviewHistoryItem[]>([]);
  const [historyFrom, setHistoryFrom] = useState(""); const [historyTo, setHistoryTo] = useState(""); const [historyQuery, setHistoryQuery] = useState("");
  const [historyNextCursor, setHistoryNextCursor] = useState<string | null>(null); const [historyLoading, setHistoryLoading] = useState(false);
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
  const persistedPresetKeys = new Set((sessionReview?.tags ?? [])
    .map((tag) => journalTagPresetForName(tag.name)?.presetKey)
    .filter((presetKey): presetKey is string => Boolean(presetKey)));
  const sessionTagChoices = [
    ...(sessionReview?.tags ?? []),
    ...JOURNAL_TAG_PRESET_CATALOG
      .filter((preset) => !persistedPresetKeys.has(preset.presetKey))
      .map((preset) => ({ name: preset.name, tagId: journalTagPresetSelectionId(preset.presetKey) })),
  ];
  const selectedSessionTags = sessionTagChoices.filter((tag) => sessionTagIds.includes(tag.tagId));
  const drawerViews = activeLaunch.kind === "session"
    ? views
    : views.map((item) => item.value === "saved" ? { ...item, label: "Saved Notes" } : item);

  async function readJson(url: string): Promise<Record<string, unknown> | null> { const response = await fetch(url, { cache: "no-store" }); return response.ok ? await response.json() as Record<string, unknown> : null; }
  async function loadSessionReviewHistory(cursor: string | null = null, append = false): Promise<void> {
    if (activeLaunch.kind !== "session") return;
    const query = new URLSearchParams({ limit: "20" });
    if (cursor) query.set("cursor", cursor); if (historyFrom) query.set("from", historyFrom); if (historyTo) query.set("to", historyTo); if (historyQuery.trim()) query.set("q", historyQuery.trim());
    setHistoryLoading(true);
    try {
      const payload = await readJson(`/api/platform/notes/session-reviews?${query}`);
      const next = Array.isArray(payload?.sessionReviews) ? payload.sessionReviews as SessionReviewHistoryItem[] : [];
      setSessionReviewHistory((current) => append ? [...current, ...next] : next);
      setHistoryNextCursor(typeof payload?.nextCursor === "string" ? payload.nextCursor : null);
    } finally { setHistoryLoading(false); }
  }
  async function load(): Promise<void> {
    const request = ++loadRequestRef.current;
    if (focusOnly) {
      const focusPayload = await readJson("/api/platform/notes/current-focuses");
      if (request !== loadRequestRef.current) return;
      const nextFocus = focusPayload?.focus && typeof focusPayload.focus === "object" ? focusPayload.focus as Focus : null;
      setFocus(nextFocus); setFocusText(nextFocus?.focusText ?? ""); setShowInWorkspace(nextFocus?.showInWorkspace ?? false);
      return;
    }
    const sessionDate = activeLaunch.kind === "session" ? activeLaunch.sessionDate : null;
    if (sessionDate) {
      const payload = await readJson(`/api/platform/notes/session-review/${encodeURIComponent(sessionDate)}`);
      if (request !== loadRequestRef.current) return;
      const review = payload?.data as SessionReview | undefined;
      setSessionReview(review ?? null);
      void loadSessionReviewHistory();
      setSessionTagIds(review?.selectedTagIds ?? []);
      setSessionRuleStatuses(Object.fromEntries((review?.rules ?? []).map((rule) => [
        rule.ruleId,
        (review?.reviews ?? []).find((item) => item.ruleId === rule.ruleId)?.status ?? "not-reviewed",
      ])));
      void readJson(`/api/platform/notes/session-summary/${encodeURIComponent(sessionDate)}`).then((payload) => {
        if (request !== loadRequestRef.current) return;
        setSessionSummary(payload ? Object.freeze({
          pnl: typeof (payload.summary as { pnl?: unknown } | undefined)?.pnl === "string"
            ? (payload.summary as { pnl: string }).pnl
            : null,
          presetRules: Array.isArray((payload.summary as { presetRules?: unknown } | undefined)?.presetRules)
            ? (payload.summary as { presetRules: SessionPresetRule[] }).presetRules
            : [],
          tradeCount: typeof (payload.summary as { tradeCount?: unknown } | undefined)?.tradeCount === "number"
            ? (payload.summary as { tradeCount: number }).tradeCount
            : 0,
          trades: Array.isArray(payload.trades) ? payload.trades as SessionSummaryTrade[] : [],
        }) : null);
      });
    }
    const query = new URLSearchParams(target(activeLaunch));
    const [typesPayload, focusPayload, categorizedPayload, ...standardPayloads] = await Promise.all([
      readJson("/api/platform/notes/types"), readJson("/api/platform/notes/current-focuses"), readJson(`/api/platform/notes/categorized?${query}`),
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
  }
  useEffect(() => {
    if (launch.kind === "session") setSelectedSessionDate(launch.sessionDate);
  }, [launch.kind, launch.kind === "session" ? launch.sessionDate : ""]);
  useEffect(() => {
    if (!open) return;
    setMessage(null); setView(focusOnly ? "focuses" : initialView); setCategory("general"); setCustomTypeId(""); setNoteText(""); setSessionTagsOpen(!mobile); setSessionRulesOpen(!mobile); setHistoryFrom(""); setHistoryTo(""); setHistoryQuery(""); setHistoryNextCursor(null);
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
      const isLegacy = activeLaunch.kind === "session"
        ? category !== "custom"
        : category === "general" || category === "technical_recap";
      const url = isLegacy ? "/api/platform/notes/standard" : "/api/platform/notes/categorized";
      const existing = savedNotes.find((item) => category === "custom"
        ? item.category === "custom" && item.customType?.noteTypeId === customTypeId
        : item.category === category);
      const expectedRevision = category === "custom" ? existing?.revision ?? null : legacyRevisions[category];
      const response = await fetch(url, { method: "PUT", headers: headers(), body: JSON.stringify({ ...target(activeLaunch), category, customTypeId: category === "custom" ? customTypeId : undefined, expectedAccountSelectionRef, expectedRevision: expectedRevision ?? null, text: noteText }) });
      if (!response.ok) throw new Error(); setMessage("Note saved."); setNoteText(""); await load();
    } catch { setMessage("The note could not be saved. Refresh and try again."); } finally { setSaving(false); }
  }
  async function saveSessionReview(): Promise<void> {
    if (activeLaunch.kind !== "session") return;
    if (!sessionTagsDirty && !sessionRulesDirty) {
      setMessage("Choose a session tag or change a custom rule result before saving.");
      return;
    }
    setSaving(true); setMessage(null);
    try {
      const ruleReviews = sessionReview?.rules.flatMap((rule) => {
          const current = sessionReview.reviews.find((item) => item.ruleId === rule.ruleId) ?? null;
          const status = sessionRuleStatuses[rule.ruleId] ?? "not-reviewed";
          return status === (current?.status ?? "not-reviewed") ? [] : [{
            expectedRevision: current?.revision ?? null,
            ruleId: rule.ruleId,
            ruleVersion: rule.ruleVersion,
            status,
          }];
      }) ?? [];
      const response = await fetch(`/api/platform/notes/session-review/${encodeURIComponent(activeLaunch.sessionDate)}`, {
        method: "PUT", headers: headers(), body: JSON.stringify({
          expectedAccountSelectionRef,
          presetKeys: sessionTagIds.map(journalTagPresetKeyFromSelectionId).filter((value): value is string => value !== null),
          ruleReviews,
          tagIds: sessionTagIds.filter((tagId) => journalTagPresetKeyFromSelectionId(tagId) === null),
        }),
      });
      if (!response.ok) throw new Error("review");
      setMessage("Session Review saved."); await load();
    } catch { setMessage("The Session Review could not be saved. Refresh and try again."); } finally { setSaving(false); }
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
      const payload = await response.json() as { data?: { assignmentCount?: number; revision?: string; tagId?: string } };
      const tagId = payload.data?.tagId;
      if (!response.ok || !tagId) throw new Error();
      const createdTag = { assignmentCount: payload.data?.assignmentCount ?? 0, name: newSessionTag.trim(), revision: payload.data?.revision ?? "1", tagId };
      const nextTagIds = [...new Set([...sessionTagIds, tagId])];
      setNewSessionTag(""); setSessionTagIds(nextTagIds);
      setSessionReview((current) => current ? {
        ...current,
        tags: [...current.tags, createdTag],
      } : current);
      setMessage("Tag added. Save Session Review to apply it to this session.");
    } catch { setMessage("That tag could not be created. Use a unique name and try again."); } finally { setSaving(false); }
  }
  async function retireSessionTag(tag: SessionReview["tags"][number], confirmAssignedDeletion = false): Promise<void> {
    if (!confirmAssignedDeletion && !window.confirm(`Remove ${tag.name} from future tag choices? Existing saved history will stay.`)) return;
    setSaving(true); setMessage(null);
    try {
      const response = await fetch(`/api/intelligence/trade-tags/${encodeURIComponent(tag.tagId)}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmAssignedDeletion, expectedAccountSelectionRef, expectedRevision: tag.revision }),
      });
      const payload = await response.json() as { error?: { assignmentCount?: number; code?: string } };
      if (response.status === 409 && payload.error?.code === "TRADERLINK_JOURNAL_TAG_RETIRE_CONFIRMATION_REQUIRED") {
        const count = payload.error.assignmentCount ?? tag.assignmentCount;
        if (window.confirm(`This tag is used by ${count} saved ${count === 1 ? "item" : "items"}. Remove it from future choices while preserving that history?`)) {
          await retireSessionTag(tag, true);
        }
        return;
      }
      if (!response.ok) throw new Error();
      setSessionTagIds((current) => current.filter((tagId) => tagId !== tag.tagId));
      setSessionReview((current) => current ? { ...current, tags: current.tags.filter((item) => item.tagId !== tag.tagId) } : current);
      setMessage(`${tag.name} was removed from future tag choices. Save this Session Review to remove it from this date too.`);
    } catch { setMessage("That tag could not be removed. Refresh and try again."); } finally { setSaving(false); }
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
        <Typography color="text.secondary" variant="body2">Choose useful presets or create a tag for this full trading session.</Typography>
        {sessionReview ? <>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", maxHeight: 130, overflowY: "auto", pr: 0.5 }} useFlexGap>{sessionTagChoices.map((tag) => {
            const selected = sessionTagIds.includes(tag.tagId);
            return <Chip color={selected ? "primary" : "default"} icon={selected ? <CheckCircleRoundedIcon /> : undefined} key={tag.tagId} label={tag.name} onClick={() => setSessionTagIds((current) => current.includes(tag.tagId) ? current.filter((id) => id !== tag.tagId) : current.length >= 10 ? current : [...current, tag.tagId])} sx={selected ? { fontWeight: 800 } : undefined} variant={selected ? "filled" : "outlined"} />;
          })}</Stack>
          <Box>{selectedSessionTags.length === 0 ? <Typography color="text.secondary" variant="caption">No session tags selected.</Typography> : <><Typography color="text.secondary" variant="caption">Selected for this session</Typography><Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 0.5 }} useFlexGap>{selectedSessionTags.map((tag) => <Chip color="primary" icon={<CheckCircleRoundedIcon />} key={tag.tagId} label={tag.name} onDelete={() => setSessionTagIds((current) => current.filter((tagId) => tagId !== tag.tagId))} size="small" />)}</Stack></>}</Box>
        </> : <Typography color="text.secondary" variant="body2">Loading available tags…</Typography>}
        <Box component="details"><Box component="summary" sx={{ color: "primary.main", cursor: "pointer", fontSize: "0.875rem", fontWeight: 800 }}>Manage saved tags</Box><Stack spacing={1} sx={{ mt: 1 }}><Stack direction={{ xs: "column", sm: "row" }} spacing={0.75}><TextField label="New personal tag" onChange={(event) => setNewSessionTag(event.target.value)} size="small" value={newSessionTag} /><Button disabled={saving || !newSessionTag.trim()} onClick={() => void createSessionTag()} size="small">Add tag</Button></Stack>{sessionReview?.tags.length ? <Stack spacing={0.5} sx={{ maxHeight: 160, overflowY: "auto", pr: 0.5 }}>{sessionReview.tags.map((tag) => <Stack direction="row" key={tag.tagId} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{tag.name}</Typography><IconButton aria-label={`Remove ${tag.name}`} disabled={saving} onClick={() => void retireSessionTag(tag)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Stack>)}</Stack> : <Typography color="text.secondary" variant="body2">No personal tags have been saved yet.</Typography>}</Stack></Box>
      </Stack></AccordionDetails>
    </Accordion>
    <Accordion expanded={sessionRulesOpen} onChange={(_, expanded) => setSessionRulesOpen(expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}><Typography sx={{ fontWeight: 800 }}>Session rules</Typography></AccordionSummary>
      <AccordionDetails><Stack spacing={1.25}>
        <Typography color="text.secondary" variant="body2">Mark only the rules that apply to this full trading session.</Typography>
        {sessionSummary === null ? <Typography color="text.secondary" variant="body2">Loading preset rules…</Typography> : sessionSummary.presetRules.length === 0 ? <Typography color="text.secondary" variant="body2">No preset day rules apply to this session.</Typography> : <><Typography color="text.secondary" variant="body2">Preset rules are evaluated from the recorded session.</Typography>{sessionSummary.presetRules.map((rule) => <Stack direction="row" key={`${rule.ruleId}:${rule.ruleVersion}`} spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{rule.title}</Typography><Chip color={rule.status === "broken" ? "error" : rule.status === "followed" ? "success" : "default"} label={rule.status === "n/a" ? "Not available" : rule.status === "not-reviewed" ? "Not reviewed" : rule.status === "broken" ? "Broken" : "Followed"} size="small" /></Stack>)}</>}
        {!sessionReview ? <Typography color="text.secondary" variant="body2">Loading custom rules…</Typography> : sessionReview.rules.length === 0 ? <Typography color="text.secondary" variant="body2">No custom day rules are available for this session.</Typography> : <><Typography color="text.secondary" variant="body2">Custom rules</Typography>{sessionReview.rules.map((rule) => <Box key={rule.ruleId} sx={{ borderTop: 1, borderColor: "divider", pt: 1.25 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{rule.title}</Typography><Typography color="text.secondary" variant="body2">{rule.statement}</Typography><Select aria-label={`${rule.title} result`} onChange={(event) => setSessionRuleStatuses((current) => ({ ...current, [rule.ruleId]: event.target.value as "followed" | "broken" | "not-reviewed" }))} size="small" sx={{ mt: 1 }} value={sessionRuleStatuses[rule.ruleId] ?? "not-reviewed"}><MenuItem value="not-reviewed">Not reviewed</MenuItem><MenuItem value="followed">Followed</MenuItem><MenuItem value="broken">Broken</MenuItem></Select></Box>)}</>}
      </Stack></AccordionDetails>
    </Accordion>
  </>;
  const sessionSummaryContent = activeLaunch.kind !== "session" ? null : <Stack spacing={1.25}>
    {sessionSummary === null ? <Typography color="text.secondary" variant="body2">Loading session trades…</Typography> : sessionSummary.trades.length === 0 ? <Typography color="text.secondary" variant="body2">No trades have been recorded for {activeLaunch.sessionDate}.</Typography> : <><Typography color="text.secondary" variant="body2">Session Summary · {activeLaunch.sessionDate}</Typography><Typography sx={{ fontWeight: 800 }} variant="body2">Session P/L: {sessionSummary.pnl ?? "Unavailable"} · {sessionSummary.tradeCount} completed {sessionSummary.tradeCount === 1 ? "trade" : "trades"}</Typography>{sessionSummary.trades.map((trade) => <Box component="details" key={trade.roundTripId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25 }}><Box component="summary" sx={{ cursor: "pointer", fontWeight: 800 }}>{trade.symbol} · {trade.direction === "long" ? "Long" : "Short"}</Box><Stack spacing={0.4} sx={{ mt: 1 }}><Typography variant="body2">P/L: {trade.pnl ?? "Unavailable"}</Typography><Typography variant="body2">Shares traded: {trade.shares ?? "Unavailable"}</Typography><Typography variant="body2">Entry: {new Date(trade.entryAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: trade.timezone })}</Typography></Stack></Box>)}</>}
  </Stack>;
  const sessionReviewHistoryByMonth = sessionReviewHistory.reduce<Record<string, SessionReviewHistoryItem[]>>((groups, review) => { const month = review.sessionDate.slice(0, 7); (groups[month] ??= []).push(review); return groups; }, {});
  const savedSessionReviewContent = activeLaunch.kind !== "session" ? null : <Stack spacing={1.5}>
    <Typography color="text.secondary" variant="body2">Find a complete saved Session Review by date, note text, or saved tag.</Typography>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField label="From" onChange={(event) => setHistoryFrom(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={historyFrom} /><TextField label="To" onChange={(event) => setHistoryTo(event.target.value)} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={historyTo} /></Stack>
    <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><TextField fullWidth label="Search notes or tags" onChange={(event) => setHistoryQuery(event.target.value)} size="small" value={historyQuery} /><Button disabled={historyLoading} onClick={() => void loadSessionReviewHistory()} variant="outlined">Search</Button></Stack>
    {historyLoading && sessionReviewHistory.length === 0 ? <Typography color="text.secondary">Loading saved sessions…</Typography> : null}
    {sessionReviewHistory.length === 0 && !historyLoading ? <Typography color="text.secondary">No saved Session Reviews match these filters.</Typography> : Object.entries(sessionReviewHistoryByMonth).map(([month, reviews]) => <Stack key={month} spacing={0.75}><Typography sx={{ fontWeight: 800 }} variant="body2">{new Date(`${month}-01T12:00:00Z`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</Typography>{reviews.map((review) => <Box key={review.sessionDate} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25 }}><Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography sx={{ fontWeight: 800 }} variant="body2">{review.sessionDate}</Typography><Button onClick={() => changeSessionDate(review.sessionDate)} size="small" variant="outlined">Open Review</Button></Stack><Typography color="text.secondary" variant="caption">{review.noteCount} saved note{review.noteCount === 1 ? "" : "s"} · {review.tagCount} tag{review.tagCount === 1 ? "" : "s"} · {review.ruleCount} rule result{review.ruleCount === 1 ? "" : "s"}</Typography></Box>)}</Stack>)}
    {historyNextCursor ? <Button disabled={historyLoading} onClick={() => void loadSessionReviewHistory(historyNextCursor, true)} sx={{ alignSelf: "flex-start" }} variant="outlined">Load more</Button> : null}
    <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">Session Review · {activeLaunch.sessionDate}</Typography>
        <Button onClick={() => setView("add")} size="small">Add to review</Button>
      </Stack>
      {sessionReview === null ? <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">Loading saved Session Review…</Typography> : <Stack spacing={1.25} sx={{ mt: 1.25 }}>
        <Box>{selectedSessionTags.length === 0 ? <Typography color="text.secondary" variant="body2">No session tags were saved.</Typography> : <><Typography color="text.secondary" variant="caption">Session tags</Typography><Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", mt: 0.5 }} useFlexGap>{selectedSessionTags.map((tag) => <Chip color="primary" icon={<CheckCircleRoundedIcon />} key={tag.tagId} label={tag.name} size="small" />)}</Stack></>}</Box>
        <Box>{savedNotes.length === 0 ? <Typography color="text.secondary" variant="body2">No session notes were saved.</Typography> : savedNotes.map((note) => <Box key={note.noteId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.25 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{categoryLabel(note.category, note.customType)}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{note.text}</Typography></Box>)}</Box>
        {sessionReview.rules.some((rule) => (sessionRuleStatuses[rule.ruleId] ?? "not-reviewed") !== "not-reviewed") ? <Box><Typography color="text.secondary" variant="caption">Saved custom rule results</Typography><Stack spacing={0.75} sx={{ mt: 0.5 }}>{sessionReview.rules.filter((rule) => (sessionRuleStatuses[rule.ruleId] ?? "not-reviewed") !== "not-reviewed").map((rule) => { const status = sessionRuleStatuses[rule.ruleId] ?? "not-reviewed"; return <Stack direction="row" key={rule.ruleId} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{rule.title}</Typography><Chip color={status === "broken" ? "error" : "success"} label={status === "broken" ? "Broken" : "Followed"} size="small" /></Stack>; })}</Stack></Box> : null}
      </Stack>}
    </Box>
  </Stack>;
  const savedNotesContent = <Stack spacing={1.25}>{savedNotes.length === 0 ? <Typography color="text.secondary">No saved notes in this view yet.</Typography> : savedNotes.map((note) => <Box key={note.noteId} sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 1.5 }}><Typography sx={{ fontWeight: 800 }} variant="body2">{categoryLabel(note.category, note.customType)}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{note.text}</Typography></Box>)}{customTypes.length ? <Box><Typography sx={{ fontWeight: 800, mb: 0.75 }} variant="body2">Custom note types</Typography>{customTypes.map((item) => <Stack direction="row" key={item.noteTypeId} sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography variant="body2">{item.displayName}</Typography><IconButton aria-label={`Remove ${item.displayName}`} onClick={() => void retire(item)} size="small"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton></Stack>)}</Box> : null}</Stack>;
  const savedContent = activeLaunch.kind === "session" ? savedSessionReviewContent : savedNotesContent;
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <Button disabled={saving || (category === "custom" && !selectedCustomType)} onClick={() => void saveNote()} sx={{ alignSelf: "flex-start" }} variant="contained">Save note</Button>
        {activeLaunch.kind === "session" ? <Button disabled={saving || (!sessionTagsDirty && !sessionRulesDirty)} onClick={() => void saveSessionReview()} sx={{ alignSelf: "flex-start" }} variant="outlined">Save Session Review</Button> : null}
      </Stack>
    </Stack>
  ) : view === "saved" ? savedContent : view === "details" ? <Stack spacing={1.25}><Typography color="text.secondary" variant="body2">{launch.kind === "session" ? "Session Summary" : "Trade Details"}</Typography>{renderDetails?.() ?? <Typography color="text.secondary" variant="body2">Details are supplied by the page that opened Notes.</Typography>}</Stack> : <Stack spacing={2}><Typography color="text.secondary" variant="body2">Current Focuses are your ongoing trading goals. They are not attached to one trade or one session.</Typography><TextField label="Current Focuses" minRows={7} multiline onChange={(event) => setFocusText(event.target.value)} placeholder="For example: follow my risk rules, or improve chart reading." value={focusText} /><FormControlLabel control={<Switch checked={showInWorkspace} onChange={(event) => setShowInWorkspace(event.target.checked)} />} label="Display this on my Workspace" />{message ? <Alert severity={message.includes("could not") ? "error" : "success"}>{message}</Alert> : null}<Button disabled={saving} onClick={() => void saveFocus()} sx={{ alignSelf: "flex-start" }} variant="contained">Save Current Focuses</Button></Stack>;
  return <Drawer anchor="right" onClose={close} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 520 }, maxWidth: "100vw" } } }}><Stack sx={{ height: "100%" }}><Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", p: 2 }}><Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">{focusOnly ? "Current Focuses" : activeLaunch.kind === "session" ? "Session Review" : "Notes"}</Typography><IconButton aria-label="Close Notes" onClick={close}><CloseRoundedIcon /></IconButton></Stack>{focusOnly ? null : mobile ? <Select fullWidth onChange={(event) => setView(event.target.value as DrawerView)} size="small" sx={{ m: 1.5, width: "calc(100% - 24px)" }} value={view}>{drawerViews.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}</Select> : <Tabs onChange={(_, value: DrawerView) => setView(value)} value={view} variant="fullWidth">{drawerViews.map((item) => <Tab key={item.value} label={item.label} value={item.value} />)}</Tabs>}<Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>{focusOnly ? content : view === "details" && activeLaunch.kind === "session" ? sessionSummaryContent : content}</Box></Stack></Drawer>;
}
