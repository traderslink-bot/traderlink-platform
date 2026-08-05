"use client";

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import {
  JOURNAL_TAG_PRESET_CATALOG,
  JOURNAL_TAG_PRESET_CATEGORY_LABELS,
  journalTagPresetForName,
  journalTagPresetKeyFromSelectionId,
  journalTagPresetSelectionId,
  type JournalTagPresetCategory,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type {
  DaySessionRule,
  DaySessionTradeTag,
} from "../[sessionDate]/day-session-types";

type ApiResult<T> = Readonly<{
  data?: T;
  error?: Readonly<{ message?: string }>;
}>;

const CATEGORY_ORDER: readonly (JournalTagPresetCategory | "custom")[] =
  Object.freeze([
    "setup",
    "entry_execution",
    "exit",
    "mistake",
    "emotion",
    "market_context",
    "risk_process",
    "custom",
  ]);

function category(tag: DaySessionTradeTag): JournalTagPresetCategory | "custom" {
  return tag.category ?? journalTagPresetForName(tag.name)?.category ?? "custom";
}

async function request<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
      ...init.headers,
    },
  });
  const packet = await response.json() as ApiResult<T>;
  if (!response.ok || packet.data === undefined) {
    throw new Error(packet.error?.message ?? "The change could not be saved.");
  }
  return packet.data;
}

export function SwingAnnotationEditor({
  availableTags: initialAvailableTags,
  expectedAccountSelectionRef,
  positionRef,
  rules: initialRules,
  showRules = true,
  tags: initialTags,
}: {
  availableTags: readonly DaySessionTradeTag[];
  expectedAccountSelectionRef: string;
  positionRef: string;
  rules: readonly DaySessionRule[];
  showRules?: boolean;
  tags: readonly DaySessionTradeTag[];
}) {
  const [availableTags, setAvailableTags] = useState([...initialAvailableTags]);
  const [tags, setTags] = useState([...initialTags]);
  const [rules, setRules] = useState([...initialRules]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialTags.map((tag) => tag.tagId));
  const [newTagName, setNewTagName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const persistedPresetKeys = new Set(availableTags
    .map((tag) => journalTagPresetForName(tag.name)?.presetKey)
    .filter((value): value is string => Boolean(value)));
  const catalog = [
    ...availableTags,
    ...JOURNAL_TAG_PRESET_CATALOG
      .filter((preset) => !persistedPresetKeys.has(preset.presetKey))
      .map((preset): DaySessionTradeTag => ({
        assignmentCount: 0,
        category: preset.category,
        name: preset.name,
        presetKey: preset.presetKey,
        revision: "preset-v1",
        tagId: journalTagPresetSelectionId(preset.presetKey),
      })),
  ];
  const groupedCatalog = CATEGORY_ORDER.map((groupCategory) => ({
    category: groupCategory,
    tags: catalog
      .filter((tag) => category(tag) === groupCategory)
      .sort((left, right) => left.name.localeCompare(right.name)),
  })).filter((group) => group.tags.length > 0);

  function openTags() {
    setSelectedIds(tags.map((tag) => tag.tagId));
    setError(null);
    setTagDialogOpen(true);
  }

  async function createTag() {
    if (!newTagName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const created = await request<DaySessionTradeTag>(
        "/api/intelligence/trade-tags",
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            name: newTagName,
          }),
          method: "POST",
        },
      );
      setAvailableTags((current) => [...current, created]
        .sort((left, right) => left.name.localeCompare(right.name)));
      setSelectedIds((current) => [...current, created.tagId]);
      setNewTagName("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The tag could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTags() {
    setBusy(true);
    setError(null);
    try {
      const saved = await request<DaySessionTradeTag[]>(
        `/api/platform/journal/swings/${encodeURIComponent(positionRef)}/tags`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            presetKeys: selectedIds
              .map(journalTagPresetKeyFromSelectionId)
              .filter((value): value is string => value !== null),
            tagIds: selectedIds.filter((tagId) =>
              journalTagPresetKeyFromSelectionId(tagId) === null),
          }),
          method: "PUT",
        },
      );
      setTags(saved);
      setAvailableTags((current) => [...current, ...saved].filter(
        (tag, index, values) =>
          values.findIndex((candidate) => candidate.tagId === tag.tagId) === index,
      ));
      setTagDialogOpen(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The tags could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function saveRule(rule: DaySessionRule, status: DaySessionRule["status"]) {
    setBusy(true);
    setError(null);
    try {
      const saved = await request<Pick<DaySessionRule, "revision" | "status">>(
        `/api/platform/journal/swings/${encodeURIComponent(positionRef)}/rule-reviews`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            expectedRevision: rule.revision,
            ruleId: rule.ruleId,
            ruleVersion: rule.ruleVersion,
            status,
          }),
          method: "PUT",
        },
      );
      setRules((current) => current.map((candidate) =>
        candidate.ruleId === rule.ruleId
          ? { ...candidate, ...saved }
          : candidate));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The rule review could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Trade tags</Typography>
        <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 1 }}>
          {tags.map((tag) => <Chip key={tag.tagId} label={tag.name} size="small" />)}
          <Button onClick={openTags} size="small" variant="outlined">
            {tags.length === 0 ? "Add tags" : "Edit tags"}
          </Button>
        </Stack>
      </Box>

      {showRules ? (
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle2">Trade rule review</Typography>
          {rules.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
              No active trade rules apply to this Swing.
            </Typography>
          ) : (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {rules.map((rule) => (
                <Box
                  key={rule.ruleId}
                  sx={{ alignItems: "center", display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 160px" } }}
                >
                  <Typography variant="body2">{rule.label}</Typography>
                  <TextField
                    disabled={busy}
                    onChange={(event) => void saveRule(rule, event.target.value as DaySessionRule["status"])}
                    select
                    size="small"
                    value={rule.status}
                  >
                    <MenuItem value="not-reviewed">Not reviewed</MenuItem>
                    <MenuItem value="followed">Followed</MenuItem>
                    <MenuItem value="broken">Broken</MenuItem>
                  </TextField>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      ) : null}

      {error ? <Alert severity="error">{error}</Alert> : null}

      <Dialog fullWidth maxWidth="sm" onClose={() => setTagDialogOpen(false)} open={tagDialogOpen}>
        <DialogTitle>Tags</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
            Choose useful presets or create your own tags.
          </Typography>
          <Stack spacing={1.5} sx={{ maxHeight: 360, overflowY: "auto" }}>
            {groupedCatalog.map((group) => (
              <Box key={group.category}>
                <Typography color="text.secondary" sx={{ fontWeight: 800 }} variant="caption">
                  {JOURNAL_TAG_PRESET_CATEGORY_LABELS[group.category]}
                </Typography>
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" } }}>
                  {group.tags.map((tag) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={selectedIds.includes(tag.tagId)}
                          onChange={(_, checked) => setSelectedIds((current) =>
                            checked
                              ? [...current, tag.tagId]
                              : current.filter((tagId) => tagId !== tag.tagId))}
                        />
                      }
                      key={tag.tagId}
                      label={tag.name}
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Stack>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Create tag"
              onChange={(event) => setNewTagName(event.target.value)}
              size="small"
              value={newTagName}
            />
            <Button disabled={busy || !newTagName.trim()} onClick={() => void createTag()} variant="outlined">
              Create
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert> : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialogOpen(false)}>Cancel</Button>
          <Button disabled={busy || selectedIds.length > 10} onClick={() => void saveTags()} variant="contained">
            {busy ? "Saving..." : "Save tags"}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
