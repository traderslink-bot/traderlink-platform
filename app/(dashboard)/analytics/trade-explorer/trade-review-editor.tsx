"use client";

import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useRef, useState, type ElementType } from "react";

import {
  JOURNAL_TAG_PRESET_CATALOG,
  JOURNAL_TAG_PRESET_CATEGORY_LABELS,
  journalTagPresetForName,
  journalTagPresetKeyFromSelectionId,
  journalTagPresetSelectionId,
  type JournalTagPresetCategory,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

import {
  loadTradeExplorerReview,
  saveTradeExplorerReviewAction,
} from "./trade-review-actions";
import { TradeTagCreationDrawer } from "./trade-tag-creation-drawer";
import type {
  TradeExplorerCustomRuleReview,
  TradeExplorerReviewModel,
  TradeExplorerReviewTag,
  TradeExplorerReviewTarget,
} from "./trade-review-model";

type TagChoice = Readonly<{
  category: JournalTagPresetCategory | "custom";
  name: string;
  selectionId: string;
}>;

type ReviewDraft = Readonly<{
  ruleStatuses: Readonly<Record<string, TradeExplorerCustomRuleReview["status"]>>;
  selectedTagIds: readonly string[];
  tradeNote: string;
}>;

const TAG_LIMIT = 10;

function draftFromModel(model: TradeExplorerReviewModel): ReviewDraft {
  return Object.freeze({
    ruleStatuses: Object.freeze(Object.fromEntries(model.customRules.map((rule) => [
      rule.ruleId,
      rule.status,
    ]))),
    selectedTagIds: Object.freeze([...model.selectedTagIds]),
    tradeNote: model.note.tradeNote,
  });
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  if (left.length !== right.length) return false;
  const values = new Set(left);
  return right.every((value) => values.has(value));
}

function hasChanges(model: TradeExplorerReviewModel | null, draft: ReviewDraft | null): boolean {
  if (!model || !draft) return false;
  return draft.tradeNote !== model.note.tradeNote ||
    !sameSet(draft.selectedTagIds, model.selectedTagIds) ||
    model.customRules.some((rule) => draft.ruleStatuses[rule.ruleId] !== rule.status);
}

function statusLabel(status: "followed" | "broken" | "not_reviewed" | "n/a"): string {
  if (status === "followed") return "Followed";
  if (status === "broken") return "Broken";
  if (status === "n/a") return "Not available";
  return "Not reviewed";
}

function statusColor(status: "followed" | "broken" | "n/a") {
  if (status === "followed") return "success" as const;
  if (status === "broken") return "error" as const;
  return "default" as const;
}

function tagChoices(availableTags: readonly TradeExplorerReviewTag[]): readonly TagChoice[] {
  const persistedPresetKeys = new Set(availableTags.flatMap((tag) => {
    const preset = journalTagPresetForName(tag.name);
    return preset ? [preset.presetKey] : [];
  }));
  return Object.freeze([
    ...availableTags.map((tag) => Object.freeze({
      category: tag.category,
      name: tag.name,
      selectionId: tag.tagId,
    })),
    ...JOURNAL_TAG_PRESET_CATALOG
      .filter((preset) => !persistedPresetKeys.has(preset.presetKey))
      .map((preset) => Object.freeze({
        category: preset.category,
        name: preset.name,
        selectionId: journalTagPresetSelectionId(preset.presetKey),
      })),
  ].sort((left, right) =>
    JOURNAL_TAG_PRESET_CATEGORY_LABELS[left.category].localeCompare(
      JOURNAL_TAG_PRESET_CATEGORY_LABELS[right.category],
    ) || left.name.localeCompare(right.name)));
}

export function TradeExplorerReviewEditor({
  embedded = false,
  expectedAccountSelectionRef,
  onClose,
  onSelectTrade,
  open,
  selectedRoundTripId,
  showTagSelectionCount = true,
  showTradeNavigation = true,
  trades,
}: Readonly<{
  embedded?: boolean;
  expectedAccountSelectionRef: string;
  onClose: () => void;
  onSelectTrade: (roundTripId: string) => void;
  open: boolean;
  selectedRoundTripId: string | null;
  showTagSelectionCount?: boolean;
  showTradeNavigation?: boolean;
  trades: readonly TradeExplorerReviewTarget[];
}>) {
  const [model, setModel] = useState<TradeExplorerReviewModel | null>(null);
  const [draft, setDraft] = useState<ReviewDraft | null>(null);
  const [availableTags, setAvailableTags] = useState<readonly TradeExplorerReviewTag[]>(Object.freeze([]));
  const [tagCreationOpen, setTagCreationOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "ready" | "saving">("idle");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmDiscardOpen, setConfirmDiscardOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const requestRef = useRef(0);
  const savingRef = useRef(false);
  const selectedIndex = trades.findIndex((trade) => trade.roundTripId === selectedRoundTripId);
  const selectedTrade = selectedIndex >= 0 ? trades[selectedIndex]! : null;
  const reviewDirty = hasChanges(model, draft);
  const hasUnsavedWork = reviewDirty;
  const choices = useMemo(() => tagChoices(availableTags), [availableTags]);
  const selectedChoices = useMemo(() => {
    const selected = new Set(draft?.selectedTagIds ?? []);
    return choices.filter((choice) => selected.has(choice.selectionId));
  }, [choices, draft?.selectedTagIds]);

  useEffect(() => {
    if (!open || !selectedTrade) {
      requestRef.current += 1;
      setState("idle");
      setModel(null);
      setDraft(null);
      setAvailableTags(Object.freeze([]));
      setError(null);
      setSuccess(null);
      return;
    }
    const requestNumber = requestRef.current + 1;
    requestRef.current = requestNumber;
    setState("loading");
    setModel(null);
    setDraft(null);
    setAvailableTags(Object.freeze([]));
    setError(null);
    setSuccess(null);
    void loadTradeExplorerReview({
      closeLocalDate: selectedTrade.closeLocalDate,
      expectedAccountSelectionRef,
      roundTripId: selectedTrade.roundTripId,
    }).then((result) => {
      if (requestRef.current !== requestNumber) return;
      if (!result.ok) {
        if (result.refreshRequired) {
          window.location.reload();
          return;
        }
        setError(result.message);
        setState("ready");
        return;
      }
      setModel(result.data);
      setDraft(draftFromModel(result.data));
      setAvailableTags(result.data.availableTags);
      setState("ready");
    }).catch(() => {
      if (requestRef.current !== requestNumber) return;
      setError("This trade review could not be opened. Try again.");
      setState("ready");
    });
  }, [expectedAccountSelectionRef, open, selectedTrade]);

  function runAfterDiscard(action: () => void): void {
    if (state === "saving" || savingRef.current) return;
    if (!hasUnsavedWork) {
      action();
      return;
    }
    pendingActionRef.current = action;
    setConfirmDiscardOpen(true);
  }

  function moveTrade(offset: -1 | 1): void {
    const next = trades[selectedIndex + offset];
    if (!next) return;
    runAfterDiscard(() => onSelectTrade(next.roundTripId));
  }

  async function save(): Promise<void> {
    if (
      !model ||
      !draft ||
      !reviewDirty ||
      savingRef.current ||
      draft.selectedTagIds.length > TAG_LIMIT
    ) return;
    const noteChanged = draft.tradeNote !== model.note.tradeNote;
    const tagsChanged = !sameSet(draft.selectedTagIds, model.selectedTagIds);
    const ruleReviews = model.customRules.flatMap((rule) => {
      const status = draft.ruleStatuses[rule.ruleId] ?? rule.status;
      return status === rule.status ? [] : [Object.freeze({
        expectedRevision: rule.revision,
        ruleId: rule.ruleId,
        ruleVersionId: rule.ruleVersionId,
        status,
      })];
    });
    savingRef.current = true;
    setState("saving");
    setError(null);
    setSuccess(null);
    try {
      const result = await saveTradeExplorerReviewAction({
        closeLocalDate: model.trade.closeLocalDate,
        expectedAccountSelectionRef,
        expectedRoundTripVersionId: model.roundTripVersionId,
        note: noteChanged ? {
          expectedRevision: model.note.revision,
          tradeNote: draft.tradeNote,
        } : null,
        roundTripId: model.trade.roundTripId,
        ruleReviews,
        tags: tagsChanged ? {
          expectedTagIds: model.selectedTagIds,
          presetKeys: draft.selectedTagIds
            .map(journalTagPresetKeyFromSelectionId)
            .filter((value): value is string => value !== null),
          tagIds: draft.selectedTagIds.filter((tagId) =>
            journalTagPresetKeyFromSelectionId(tagId) === null),
        } : null,
      });
      if (!result.ok) {
        if (result.refreshRequired) {
          window.location.reload();
          return;
        }
        setError(result.message);
        return;
      }
      setModel(result.data);
      setDraft(draftFromModel(result.data));
      setAvailableTags(result.data.availableTags);
      setSuccess("Trade review saved.");
    } catch {
      setError("This trade review could not be saved. Try again.");
    } finally {
      savingRef.current = false;
      setState("ready");
    }
  }

  const ReviewSurface: ElementType = embedded ? Box : Drawer;
  const reviewSurfaceProps = embedded
    ? {
        sx: {
          height: "100%",
          position: "relative",
          width: "100%",
        },
      }
    : {
        anchor: "right" as const,
        onClose: () => runAfterDiscard(onClose),
        open,
        slotProps: {
          paper: {
            sx: {
              boxSizing: "border-box",
              height: "100dvh",
              maxWidth: { xs: "100vw", md: 560 },
              pt: { xs: "env(safe-area-inset-top)", md: 0 },
              width: { xs: "100vw", md: 560 },
            },
          },
        },
      };

  return (
    <>
      <ReviewSurface {...reviewSurfaceProps}>
        <Box sx={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", display: embedded ? "none" : "block", px: { xs: 2, sm: 2.5 }, py: 1.5 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">Trade review</Typography>
                {selectedTrade ? (
                  <Typography color="text.secondary" noWrap variant="body2">
                    {selectedTrade.displayedSymbol} · {selectedTrade.direction === "long" ? "Long" : "Short"} · {selectedTrade.closeLocalDate ?? "Open"}
                  </Typography>
                ) : null}
              </Box>
              <Button
                aria-label="Close trade review"
                disabled={state === "saving"}
                onClick={() => runAfterDiscard(onClose)}
                startIcon={<CloseRoundedIcon />}
                sx={{ minHeight: 44, flexShrink: 0 }}
              >
                Close
              </Button>
            </Stack>
            {showTradeNavigation ? <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr 1fr", sm: "auto minmax(0, 1fr) auto" },
                mt: 1,
              }}
            >
              <Button
                disabled={state === "saving" || selectedIndex <= 0}
                onClick={() => moveTrade(-1)}
                startIcon={<ChevronLeftRoundedIcon />}
                sx={{ minHeight: 44, minWidth: 0 }}
                variant="outlined"
              >
                Previous
              </Button>
              <Typography
                color="text.secondary"
                sx={{
                  alignSelf: "center",
                  gridColumn: { xs: "1 / -1", sm: "auto" },
                  gridRow: { xs: 2, sm: 1 },
                  justifySelf: "center",
                  whiteSpace: "nowrap",
                }}
                variant="caption"
              >
                {selectedIndex >= 0 ? `${selectedIndex + 1} of ${trades.length} on this page` : ""}
              </Typography>
              <Button
                disabled={state === "saving" || selectedIndex < 0 || selectedIndex >= trades.length - 1}
                endIcon={<ChevronRightRoundedIcon />}
                onClick={() => moveTrade(1)}
                sx={{ minHeight: 44, minWidth: 0 }}
                variant="outlined"
              >
                Next
              </Button>
            </Box> : null}
          </Box>

          <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", px: { xs: 2, sm: 2.5 }, py: 2 }}>
            {state === "loading" ? (
              <Stack spacing={1.5} sx={{ alignItems: "center", justifyContent: "center", minHeight: 240 }}>
                <CircularProgress size={30} />
                <Typography color="text.secondary">Loading trade review…</Typography>
              </Stack>
            ) : null}
            {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
            {success ? <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert> : null}
            {model && draft ? (
              <Stack spacing={3}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">Trade notes</Typography>
                  <TextField
                    fullWidth
                    label="Notes"
                    minRows={5}
                    multiline
                    onChange={(event) => {
                      setSuccess(null);
                      setDraft((current) => current
                        ? Object.freeze({ ...current, tradeNote: event.target.value })
                        : current);
                    }}
                    slotProps={{ htmlInput: { maxLength: 10000 } }}
                    value={draft.tradeNote}
                  />
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">Tags</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                    Choose up to 10 labels that you believe describe this trade.
                  </Typography>
                  <Autocomplete
                    disableCloseOnSelect
                    getOptionLabel={(option) => option.name}
                    getOptionDisabled={(option) =>
                      draft.selectedTagIds.length >= TAG_LIMIT &&
                      !draft.selectedTagIds.includes(option.selectionId)}
                    groupBy={(option) => JOURNAL_TAG_PRESET_CATEGORY_LABELS[option.category]}
                    isOptionEqualToValue={(option, value) => option.selectionId === value.selectionId}
                    multiple
                    onChange={(_event, next) => {
                      setSuccess(null);
                      setDraft((current) => current
                        ? Object.freeze({
                            ...current,
                            selectedTagIds: Object.freeze(next.map((choice) => choice.selectionId)),
                          })
                        : current);
                    }}
                    options={choices}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        error={draft.selectedTagIds.length > TAG_LIMIT}
                        helperText={showTagSelectionCount ? `${draft.selectedTagIds.length} of ${TAG_LIMIT} selected` : undefined}
                        label="Trade tags"
                        placeholder="Search tags"
                      />
                    )}
                    renderOption={(props, option, { selected }) => {
                      const { key, ...optionProps } = props;
                      return (
                        <li key={key} {...optionProps}>
                          <Checkbox checked={selected} sx={{ mr: 1 }} />
                          {option.name}
                        </li>
                      );
                    }}
                    value={selectedChoices}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    <Button
                      disabled={state === "saving"}
                      onClick={() => setTagCreationOpen(true)}
                      sx={{ minHeight: 44, whiteSpace: "nowrap" }}
                      variant="outlined"
                    >
                      Create a reusable tag
                    </Button>
                  </Stack>
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">Custom rules</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                    You decide whether each custom trade rule was followed or broken.
                  </Typography>
                  {model.customRules.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      No custom trade rules applied when this trade opened.
                    </Typography>
                  ) : (
                    <Stack spacing={1.5}>
                      {model.customRules.map((rule) => (
                        <Box
                          key={`${rule.ruleId}:${rule.ruleVersionId}`}
                          sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) 170px" } }}
                        >
                          <Box>
                            <Typography sx={{ fontWeight: 700 }} variant="body2">{rule.title}</Typography>
                            <Typography color="text.secondary" variant="caption">{rule.statement}</Typography>
                          </Box>
                          <TextField
                            label="Result"
                            onChange={(event) => {
                              setSuccess(null);
                              setDraft((current) => current
                                ? Object.freeze({
                                    ...current,
                                    ruleStatuses: Object.freeze({
                                      ...current.ruleStatuses,
                                      [rule.ruleId]: event.target.value as TradeExplorerCustomRuleReview["status"],
                                    }),
                                  })
                                : current);
                            }}
                            select
                            size="small"
                            value={draft.ruleStatuses[rule.ruleId] ?? rule.status}
                          >
                            <MenuItem value="not_reviewed">Not reviewed</MenuItem>
                            <MenuItem value="followed">Followed</MenuItem>
                            <MenuItem value="broken">Broken</MenuItem>
                          </TextField>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>

                <Divider />

                <Box>
                  <Typography sx={{ fontWeight: 800 }} variant="subtitle1">Automatic rule results</Typography>
                  <Typography color="text.secondary" sx={{ mb: 1 }} variant="body2">
                    These results come from the recorded trade facts and cannot be edited here.
                  </Typography>
                  {model.presetRules.length === 0 ? (
                    <Typography color="text.secondary" variant="body2">
                      No automatic trade rule produced a result for this trade.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {model.presetRules.map((rule) => (
                        <Box key={`${rule.ruleId}:${rule.ruleVersionId}`}>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                            <Typography sx={{ fontWeight: 700 }} variant="body2">{rule.title}</Typography>
                            <Chip color={statusColor(rule.status)} label={statusLabel(rule.status)} size="small" variant={rule.status === "n/a" ? "outlined" : "filled"} />
                          </Stack>
                          {rule.detail ? <Typography color="text.secondary" variant="caption">{rule.detail}</Typography> : null}
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Box>
              </Stack>
            ) : null}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            sx={{
              alignItems: { xs: "stretch", sm: "center" },
              borderTop: 1,
              borderColor: "divider",
              justifyContent: "space-between",
              pb: "calc(12px + env(safe-area-inset-bottom))",
              px: { xs: 2, sm: 2.5 },
              pt: 1.5,
            }}
          >
            {!embedded ? <Typography color="text.secondary" variant="body2">
              {reviewDirty ? "Unsaved changes" : "All changes saved"}
            </Typography> : <Box />}
            <Button
              disabled={
                !reviewDirty ||
                state === "saving" ||
                (draft?.selectedTagIds.length ?? 0) > TAG_LIMIT
              }
              onClick={() => void save()}
              sx={{ minHeight: 44, minWidth: 128, width: { xs: "100%", sm: "auto" } }}
              variant="contained"
            >
              {state === "saving" ? "Saving…" : "Save review"}
            </Button>
          </Stack>
        </Box>
      </ReviewSurface>

      <TradeTagCreationDrawer
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        onClose={() => setTagCreationOpen(false)}
        onCreated={(tag) => {
          setAvailableTags((current) => Object.freeze([...current, tag]));
          setDraft((current) => current ? Object.freeze({
            ...current,
            selectedTagIds: Object.freeze([...current.selectedTagIds, tag.tagId]),
          }) : current);
          setSuccess("Tag created. Save the review to add it to this trade.");
        }}
        open={tagCreationOpen}
      />

      <Dialog onClose={() => setConfirmDiscardOpen(false)} open={confirmDiscardOpen}>
        <DialogTitle>Discard unsaved changes?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Your note, tag selections, unfinished tag name or rule changes for this trade have not been saved.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDiscardOpen(false)}>Keep editing</Button>
          <Button
            color="error"
            onClick={() => {
              const action = pendingActionRef.current;
              pendingActionRef.current = null;
              setConfirmDiscardOpen(false);
              action?.();
            }}
          >
            Discard changes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
