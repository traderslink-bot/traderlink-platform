"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import RemoveRoundedIcon from "@mui/icons-material/RemoveRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import dynamic from "next/dynamic";
import { alpha, type Theme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { FeatureHelpLink } from "../../feature-help-link";
import { HorizontalScrollHint } from "../../horizontal-scroll-region";
import { openTraderLinkAiChat } from "@/app/ai-chat-drawer-events";
import { MoomooMarketDataConnectionPrompt } from "../../moomoo-market-data-connection-prompt";
import { candlePatternName } from "@/src/lib/trade-candle-analysis/pattern-presentation";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  JOURNAL_TAG_PRESET_CATALOG,
  JOURNAL_TAG_PRESET_CATEGORY_LABELS,
  journalTagPresetForName,
  journalTagPresetKeyFromSelectionId,
  journalTagPresetSelectionId,
  type JournalTagPresetCategory,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

import type {
  DaySessionData,
  DaySessionExecutionActivity,
  DaySessionDailyNote,
  DaySessionRoundTrip,
  DaySessionRule,
  DaySessionTradeAnalyzer,
  DaySessionTradeTag,
  DaySessionWeekDay,
} from "./day-session-types";
import { PositionStyleControl } from "../position-style-control";
import { SwingPositionPlanEditor } from "../swing-position-plan-editor";
import { ManualExecutionEditDialog } from "../manual-execution-edit-dialog";
import {
  useTradeTrackerHasUnsavedChangesExcept,
  useTradeTrackerNavigationGuard,
  useTradeTrackerUnsavedChanges,
} from "../trade-tracker-unsaved-changes";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type {
  ChartRuleEvidence,
  DailyTradeChartInterval,
} from "./daily-trade-analyzer-chart";
import {
  DailyTrackerOfflineSavedViewCapture,
  type DailyTrackerOfflineCaptureMetadata,
} from "./daily-tracker-offline-saved-view-capture";

const DailyTradeAnalyzerChart = dynamic(
  () => import("./daily-trade-analyzer-chart").then((module) => module.DailyTradeAnalyzerChart),
  { ssr: false },
);

const EMPTY_CHART_RULE_EVIDENCE: readonly ChartRuleEvidence[] = Object.freeze([]);
const DAY_REVIEW_AUTOSAVED_UNSAVED_SOURCES = Object.freeze([
  "daily-trade-tracker:day-session-notes",
]);

type DailyNoteTextField = Exclude<keyof DaySessionDailyNote, "revision">;

function dailyNoteTextMatches(
  left: DaySessionDailyNote,
  right: DaySessionDailyNote,
): boolean {
  return left.anythingElse === right.anythingElse &&
    left.technicalRecap === right.technicalRecap &&
    left.tomorrowsFocus === right.tomorrowsFocus &&
    left.whatNeedsWork === right.whatNeedsWork &&
    left.whatWorked === right.whatWorked;
}

function initialTradeNotes(data: DaySessionData): Record<string, string> {
  return Object.fromEntries([
    ...data.tickers.flatMap((ticker) =>
      ticker.roundTrips.map((roundTrip) => [
        roundTrip.roundTripKey,
        roundTrip.journal.tradeNote,
      ]),
    ),
    ...data.openPositions.map((position) => [
      position.positionKey,
      position.journal.tradeNote,
    ]),
  ]);
}

type ApiResult<T> = {
  data?: T;
  error?: { assignmentCount?: number; code?: string; message?: string };
};

function TradeTrackerDateNavigation({
  date,
  dates,
  designPreview,
  nextDate,
  previousDate,
}: Readonly<{
  date: string;
  dates: readonly string[];
  designPreview: boolean;
  nextDate: string | null;
  previousDate: string | null;
}>) {
  const router = useRouter();
  const confirmNavigation = useTradeTrackerNavigationGuard();
  const safeDates = [...new Set([...dates, date])].sort();
  const [selectedYear, selectedMonth, selectedDay] = date.split("-");
  const years = [...new Set(safeDates.map((value) => value.slice(0, 4)))].sort();
  const months = [...new Set(safeDates
    .filter((value) => value.startsWith(`${selectedYear}-`))
    .map((value) => value.slice(5, 7)))].sort();
  const days = safeDates
    .filter((value) => value.startsWith(`${selectedYear}-${selectedMonth}-`))
    .map((value) => value.slice(8, 10));
  const previewSuffix = designPreview ? "?preview=design" : "";
  const navigate = (year: string, month: string, day: string) => {
    if (!confirmNavigation()) return;
    const direct = `${year}-${month}-${day}`;
    const fallback = safeDates.find((value) => value.startsWith(`${year}-${month}-`)) ??
      safeDates.find((value) => value.startsWith(`${year}-`)) ?? safeDates.at(-1) ?? date;
    router.push(`/trade-tracker/${safeDates.includes(direct) ? direct : fallback}${previewSuffix}`);
  };
  const monthLabel = (value: string) => new Intl.DateTimeFormat("en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`2000-${value}-01T12:00:00.000Z`));

  return (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{
        alignItems: "center",
        flexWrap: "nowrap",
        width: "100%",
        "@media (max-width: 340px)": {
          display: "grid",
          gridTemplateColumns: "44px 1fr 44px",
          gridTemplateRows: "auto 44px",
        },
      }}
    >
      <DashboardSecondaryAction
        aria-label="Previous trading day"
        component={Link}
        disabled={!previousDate}
        href={previousDate ? `/trade-tracker/${previousDate}${previewSuffix}` : "#"}
        sx={{ height: 44, minWidth: 44, px: 1, "@media (max-width: 340px)": { gridColumn: 1, gridRow: 2 } }}
      >
        <ArrowBackRoundedIcon fontSize="small" />
      </DashboardSecondaryAction>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          alignItems: "center",
          minWidth: 0,
          "@media (max-width: 340px)": {
            gridColumn: "1 / -1",
            gridRow: 1,
            justifyContent: "space-between",
          },
        }}
      >
        <FormControl size="small" sx={{ minWidth: 60, "& .MuiInputBase-root": { minHeight: 44 }, "& .MuiSelect-select": { paddingLeft: "10px", paddingRight: "26px !important" } }}>
          <InputLabel id="trade-tracker-day-label">Day</InputLabel>
          <Select label="Day" labelId="trade-tracker-day-label" onChange={(event) =>
            navigate(selectedYear, selectedMonth, event.target.value)} value={selectedDay}>
            {days.map((value) => <MenuItem key={value} value={value}>{Number(value)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 68, "& .MuiInputBase-root": { minHeight: 44 }, "& .MuiSelect-select": { paddingLeft: "10px", paddingRight: "26px !important" } }}>
          <InputLabel id="trade-tracker-month-label">Month</InputLabel>
          <Select label="Month" labelId="trade-tracker-month-label" onChange={(event) =>
            navigate(selectedYear, event.target.value, selectedDay)} value={selectedMonth}>
            {months.map((value) => <MenuItem key={value} value={value}>{monthLabel(value)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 76, "& .MuiInputBase-root": { minHeight: 44 }, "& .MuiSelect-select": { paddingLeft: "8px", paddingRight: "26px !important" } }}>
          <InputLabel id="trade-tracker-year-label">Year</InputLabel>
          <Select label="Year" labelId="trade-tracker-year-label" onChange={(event) =>
            navigate(event.target.value, selectedMonth, selectedDay)} value={selectedYear}>
            {years.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
          </Select>
        </FormControl>
      </Stack>
      <DashboardSecondaryAction
        aria-label="Next trading day"
        component={Link}
        disabled={!nextDate}
        href={nextDate ? `/trade-tracker/${nextDate}${previewSuffix}` : "#"}
        sx={{ height: 44, minWidth: 44, px: 1, "@media (max-width: 340px)": { gridColumn: 3, gridRow: 2 } }}
      >
        <ArrowForwardRoundedIcon fontSize="small" />
      </DashboardSecondaryAction>
    </Stack>
  );
}

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  const result = (await response.json()) as ApiResult<T>;
  if (!response.ok || result.data === undefined) {
    const error = new Error(result.error?.message ?? "The tag change failed.") as
      Error & { assignmentCount?: number; status?: number };
    error.assignmentCount = result.error?.assignmentCount;
    error.status = response.status;
    throw error;
  }
  return result.data;
}

function ruleSaveErrorKey(rule: DaySessionRule): string {
  return rule.applicability === "day"
    ? "day"
    : `trade:${rule.targetRoundTripKey ?? "unknown"}`;
}

function ruleSaveFailure(error: unknown): string {
  const typed = error as Error & { status?: number };
  if (typeof typed.status === "number" && typed.message) return typed.message;
  return "The rule change could not be saved. Check your connection and try again.";
}

const TAG_CATEGORY_ORDER: readonly (JournalTagPresetCategory | "custom")[] =
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

function tagCategory(tag: DaySessionTradeTag): JournalTagPresetCategory | "custom" {
  return tag.category ?? journalTagPresetForName(tag.name)?.category ?? "custom";
}

function TradeTagEditor({
  availableTags,
  disabled,
  designPreview,
  expectedAccountSelectionRef,
  onCatalogChange,
  onManageTags,
  onTagsChange,
  sessionDate,
  tags,
  targetKey,
  targetKind,
}: {
  availableTags: DaySessionTradeTag[];
  disabled: boolean;
  designPreview: boolean;
  expectedAccountSelectionRef: string;
  onCatalogChange: (tags: DaySessionTradeTag[]) => void;
  onManageTags?: () => void;
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  sessionDate: string;
  tags: DaySessionTradeTag[];
  targetKey: string;
  targetKind: "round-trip" | "open-position";
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(tags.map((tag) => tag.tagId));
  const [newName, setNewName] = useState("");
  const [previewCreatedTags, setPreviewCreatedTags] = useState<
    DaySessionTradeTag[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const savedTagSelection = tags.map((tag) => tag.tagId).sort().join("|");
  const draftTagSelection = [...selectedIds].sort().join("|");
  useTradeTrackerUnsavedChanges(
    `daily-trade-tracker:tags:${targetKind}:${targetKey}`,
    open && (
      newName.trim().length > 0 ||
      draftTagSelection !== savedTagSelection
    ),
  );
  const persistedPresetKeys = new Set([...availableTags, ...previewCreatedTags]
    .map((tag) => journalTagPresetForName(tag.name)?.presetKey)
    .filter((value): value is string => Boolean(value)));
  const presetChoices: DaySessionTradeTag[] = JOURNAL_TAG_PRESET_CATALOG
    .filter((preset) => !persistedPresetKeys.has(preset.presetKey))
    .map((preset) => ({
      assignmentCount: 0,
      category: preset.category,
      name: preset.name,
      presetKey: preset.presetKey,
      revision: "preset-v1",
      tagId: journalTagPresetSelectionId(preset.presetKey),
    }));
  const catalog = [...availableTags, ...previewCreatedTags, ...presetChoices].filter(
    (tag, index, tags) =>
      tags.findIndex((candidate) => candidate.tagId === tag.tagId) === index,
  );
  const groupedCatalog = TAG_CATEGORY_ORDER.map((category) => ({
    category,
    tags: catalog
      .filter((tag) => tagCategory(tag) === category)
      .sort((left, right) => left.name.localeCompare(right.name)),
  })).filter((group) => group.tags.length > 0);

  function showEditor(): void {
    setSelectedIds(tags.map((tag) => tag.tagId));
    setError("");
    setOpen(true);
  }

  async function createTag(): Promise<void> {
    if (!newName.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (designPreview) {
        const normalizedName = newName.trim();
        const created: DaySessionTradeTag = {
          assignmentCount: 0,
          category: "custom",
          name: normalizedName,
          revision: "design-preview",
          tagId: `design-${normalizedName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`,
        };
        setPreviewCreatedTags((current) => [...current, created]);
        onCatalogChange(
          [...catalog, created].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        setSelectedIds((current) => [...current, created.tagId]);
        setNewName("");
        return;
      }
      const created = await api<DaySessionTradeTag>("/api/intelligence/trade-tags", {
        body: JSON.stringify({
          expectedAccountSelectionRef,
          name: newName,
        }),
        method: "POST",
      });
      onCatalogChange([...availableTags, created].sort((a, b) => a.name.localeCompare(b.name)));
      setSelectedIds((current) => [...current, created.tagId]);
      setNewName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The tag could not be created.");
    } finally {
      setBusy(false);
    }
  }

  async function save(): Promise<void> {
    setBusy(true);
    setError("");
    try {
      if (designPreview) {
        const saved = catalog.filter((tag) =>
          selectedIds.includes(tag.tagId),
        );
        const previousIds = new Set(tags.map((tag) => tag.tagId));
        const nextIds = new Set(saved.map((tag) => tag.tagId));
        onCatalogChange(
          catalog.map((tag) => ({
            ...tag,
            assignmentCount:
              tag.assignmentCount +
              (nextIds.has(tag.tagId) && !previousIds.has(tag.tagId) ? 1 : 0) -
              (previousIds.has(tag.tagId) && !nextIds.has(tag.tagId) ? 1 : 0),
          })),
        );
        onTagsChange(saved);
        setOpen(false);
        return;
      }
      if (targetKind === "open-position") {
        throw new Error("Open-position tag persistence is not connected yet.");
      }
      const presetKeys = selectedIds
        .map(journalTagPresetKeyFromSelectionId)
        .filter((value): value is string => value !== null);
      const saved = await api<DaySessionTradeTag[]>(
        `/api/intelligence/trades/${encodeURIComponent(targetKey)}/tags`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            presetKeys,
            sessionDate,
            tagIds: selectedIds.filter((tagId) =>
              journalTagPresetKeyFromSelectionId(tagId) === null),
          }),
          method: "PUT",
        },
      );
      const previousIds = new Set(tags.map((tag) => tag.tagId));
      const nextIds = new Set(saved.map((tag) => tag.tagId));
      const expandedCatalog = [...availableTags, ...saved].filter(
        (tag, index, tags) =>
          tags.findIndex((candidate) => candidate.tagId === tag.tagId) === index,
      );
      onCatalogChange(
        expandedCatalog.map((tag) => ({
          ...tag,
          assignmentCount:
            tag.assignmentCount +
            (nextIds.has(tag.tagId) && !previousIds.has(tag.tagId) ? 1 : 0) -
            (previousIds.has(tag.tagId) && !nextIds.has(tag.tagId) ? 1 : 0),
        })),
      );
      onTagsChange(saved);
      setOpen(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The tags could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 0.5 }}>
        {tags.map((tag) => <Chip key={tag.tagId} label={tag.name} size="small" />)}
        <FeatureHelpLink href="/help/trade-tags/add-edit-tags#open-tag-editor" label="trade tags" />
        <Button
          disabled={disabled}
          onClick={showEditor}
          size="small"
          sx={{ lineHeight: 1.2, minHeight: { xs: 44, sm: 36 }, minWidth: 64, px: 1, py: 0.5 }}
          variant="outlined"
        >
          {tags.length === 0 ? "Add tags" : "Edit tags"}
        </Button>
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
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
                          onChange={(_, checked) =>
                            setSelectedIds((current) =>
                              checked
                                ? [...current, tag.tagId]
                                : current.filter((tagId) => tagId !== tag.tagId),
                            )
                          }
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
          <Divider sx={{ my: 2 }} />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <TextField
              fullWidth
              label="Create tag"
              onChange={(event) => setNewName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  void createTag();
                }
              }}
              size="small"
              value={newName}
            />
            <Button disabled={busy || !newName.trim()} onClick={() => void createTag()} variant="outlined">
              Create
            </Button>
          </Stack>
          {error ? <Typography color="error" sx={{ mt: 1.5 }} variant="body2">{error}</Typography> : null}
        </DialogContent>
        <DialogActions
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 0 },
            "& > :not(style) ~ :not(style)": { ml: { xs: 0, sm: 1 } },
          }}
        >
          {onManageTags ? (
            <Button
              onClick={() => {
                setOpen(false);
                onManageTags();
              }}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Manage tags
            </Button>
          ) : null}
          <Box sx={{ display: { xs: "none", sm: "block" }, flex: 1 }} />
          <Button onClick={() => setOpen(false)} sx={{ width: { xs: "100%", sm: "auto" } }}>Cancel</Button>
          <Button
            disabled={busy || selectedIds.length > 10}
            onClick={() => void save()}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            variant="contained"
          >
            Save tags
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function ManageTagsDialog({
  expectedAccountSelectionRef,
  onChange,
  onClose,
  open,
  tags,
}: {
  expectedAccountSelectionRef: string;
  onChange: (tags: DaySessionTradeTag[]) => void;
  onClose: () => void;
  open: boolean;
  tags: DaySessionTradeTag[];
}) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  useTradeTrackerUnsavedChanges(
    "daily-trade-tracker:manage-tags",
    open && tags.some((tag) => (names[tag.tagId] ?? tag.name) !== tag.name),
  );

  async function rename(tag: DaySessionTradeTag): Promise<void> {
    const name = names[tag.tagId] ?? tag.name;
    setBusyId(tag.tagId);
    setError("");
    try {
      const revised = await api<DaySessionTradeTag>(
        `/api/intelligence/trade-tags/${encodeURIComponent(tag.tagId)}`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            expectedRevision: tag.revision,
            name,
          }),
          method: "PATCH",
        },
      );
      onChange(tags.map((candidate) => candidate.tagId === tag.tagId ? revised : candidate));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The tag could not be renamed.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(tag: DaySessionTradeTag, confirmed = false): Promise<void> {
    if (
      !confirmed &&
      tag.assignmentCount > 0 &&
      window.confirm(
        `Retire “${tag.name}” and hide it from ${tag.assignmentCount} current trade${tag.assignmentCount === 1 ? "" : "s"}? Its history will be preserved.`,
      )
    ) {
      await remove(tag, true);
      return;
    }
    if (!confirmed && tag.assignmentCount > 0) return;
    setBusyId(tag.tagId);
    setError("");
    try {
      await api<{ removedAssignmentCount: number }>(
        `/api/intelligence/trade-tags/${encodeURIComponent(tag.tagId)}`,
        {
          body: JSON.stringify({
            confirmAssignedDeletion: confirmed,
            expectedAccountSelectionRef,
            expectedRevision: tag.revision,
          }),
          method: "DELETE",
        },
      );
      onChange(tags.filter((candidate) => candidate.tagId !== tag.tagId));
    } catch (caught) {
      const typed = caught as Error & { assignmentCount?: number; status?: number };
      if (
        !confirmed &&
        typed.status === 409 &&
        typed.assignmentCount &&
        window.confirm(
          `Retire “${tag.name}” and hide it from ${typed.assignmentCount} current trade${typed.assignmentCount === 1 ? "" : "s"}? Its history will be preserved.`,
        )
      ) {
        setBusyId(null);
        await remove(tag, true);
        return;
      }
      setError(typed.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Manage tags</DialogTitle>
      <DialogContent>
        <Stack divider={<Divider flexItem />} spacing={0}>
          {tags.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 2 }} variant="body2">
              Create your first tag from an individual trade.
            </Typography>
          ) : null}
          {tags.map((tag) => (
            <Stack
              direction={{ xs: "column", sm: "row" }}
              key={tag.tagId}
              spacing={1}
              sx={{ alignItems: { sm: "center" }, py: 1.25 }}
            >
              <TextField
                fullWidth
                onChange={(event) =>
                  setNames((current) => ({ ...current, [tag.tagId]: event.target.value }))
                }
                size="small"
                value={names[tag.tagId] ?? tag.name}
              />
              <Typography color="text.secondary" sx={{ minWidth: 70 }} variant="caption">
                {tag.assignmentCount} trade{tag.assignmentCount === 1 ? "" : "s"}
              </Typography>
              <Button disabled={busyId === tag.tagId} onClick={() => void rename(tag)} size="small">
                Save
              </Button>
              <Button color="error" disabled={busyId === tag.tagId} onClick={() => void remove(tag)} size="small">
                Delete
              </Button>
            </Stack>
          ))}
        </Stack>
        {error ? <Typography color="error" sx={{ mt: 1.5 }} variant="body2">{error}</Typography> : null}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

function money(value: string | null, currency: string): string {
  if (value === null) return "N/A";
  const normalizedValue = value.startsWith(".")
    ? `0${value}`
    : value.startsWith("-.")
      ? `-0${value.slice(1)}`
      : value;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalizedValue);
  if (!match) return "N/A";
  const symbol =
    new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  const formatted = formatJournalAnalyticsDecimal(normalizedValue);
  const negative = formatted.startsWith("-");
  return `${negative ? "-" : "+"}${symbol}${negative ? formatted.slice(1) : formatted}`;
}

function dateLabel(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    weekday: "long",
    year: "numeric",
  });
}

function price(value: string | null, currency: string): string {
  if (value === null) return "N/A";
  const formatted = money(value, currency).replace(/^\+/, "");
  const match = /^(-?[^.]+)(?:\.(\d+))?$/.exec(formatted);
  if (!match) return formatted;
  return `${match[1]}.${(match[2] ?? "").padEnd(2, "0")}`;
}

function percentage(value: string | null): string {
  if (value === null) return "N/A";
  const formatted = formatJournalAnalyticsDecimal(value);
  return `${formatted.startsWith("-") ? "" : "+"}${formatted}%`;
}

function shortDayLabel(date: string): string {
  return new Date(`${date}T12:00:00.000Z`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    weekday: "short",
  });
}

function timeLabel(value: string, timezone: string, includeSeconds = false): string {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    ...(includeSeconds ? { second: "2-digit" as const } : {}),
    timeZone: timezone,
  });
}

function savedViewTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}
function analyzerPatternName(kind: string): string {
  const name = candlePatternName(kind);
  return `${/^[AEIOU]/u.test(name) ? "an" : "a"} ${name}`;
}

type TradeAnalysisSection = Readonly<{
  lines: readonly string[];
  title: string;
}>;

type TradeAnalysisTimeframe = "1m" | "5m";

type AnalyzerPattern = DaySessionTradeAnalyzer["events"][number]["patterns"][number];

function sentenceCase(value: string): string {
  return value.length === 0 ? value : `${value[0]!.toUpperCase()}${value.slice(1)}`;
}

function executionPatternText(
  pattern: AnalyzerPattern,
  eventKind: DaySessionTradeAnalyzer["events"][number]["kind"],
  timezone: string,
): string {
  const executionName = eventKind === "entry" || eventKind === "add" ? "entry" : "exit";
  const patternName = sentenceCase(analyzerPatternName(pattern.kind));
  const candleLabel = pattern.candlesBeforeExecution === 0
    ? `the same ${pattern.timeframe} candle as this ${executionName}`
    : `${pattern.candlesBeforeExecution === 1 ? "one" : "two"} candle${pattern.candlesBeforeExecution === 1 ? "" : "s"} before this ${executionName}`;
  const timestamp = timeLabel(new Date(pattern.time * 1000).toISOString(), timezone);
  if (pattern.availableAtExecution) {
    return `${patternName} appeared on the ${timestamp} ${pattern.timeframe} candle, ${candleLabel}. It was complete before the fill.`;
  }
  if (pattern.candlesBeforeExecution === 0) {
    return `${patternName} formed on the ${timestamp} ${pattern.timeframe} candle, ${candleLabel}. That candle was still forming at the fill, so this is retrospective context.`;
  }
  return `${patternName} appeared on the ${timestamp} ${pattern.timeframe} candle, ${candleLabel}, but its required following-candle confirmation was not complete at the fill.`;
}

function closestPatternLine(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  timeframe: AnalyzerPattern["timeframe"],
  timezone: string,
  prefix: string,
): string | null {
  const candidates = events.flatMap((event) => event.patterns
    .filter((pattern) => pattern.timeframe === timeframe)
    .map((pattern) => ({ event, pattern })))
    .sort((left, right) =>
      Number(right.pattern.availableAtExecution) - Number(left.pattern.availableAtExecution) ||
      right.pattern.score - left.pattern.score ||
      left.event.sequence - right.event.sequence);
  const selected = candidates[0];
  return selected
    ? `${prefix}: ${executionPatternText(selected.pattern, selected.event.kind, timezone)}`
    : null;
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 1, notation: "compact" }).format(value);
}

function weightedAverage(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  value: (event: DaySessionTradeAnalyzer["events"][number]) => number | null,
): number | null {
  const valid = events.flatMap((event) => {
    const candidate = value(event);
    const quantity = Number(event.quantity);
    return candidate !== null && Number.isFinite(candidate) && Number.isFinite(quantity) && quantity > 0
      ? [{ candidate, quantity }]
      : [];
  });
  const quantity = valid.reduce((total, item) => total + item.quantity, 0);
  return quantity > 0
    ? valid.reduce((total, item) => total + item.candidate * item.quantity, 0) / quantity
    : null;
}

function eventSpanMinutes(events: readonly DaySessionTradeAnalyzer["events"][number][]): number {
  const first = events[0];
  const last = events.at(-1);
  if (!first || !last) return 0;
  return Math.max(0, Math.round((Date.parse(last.executedAt) - Date.parse(first.executedAt)) / 60_000));
}

function weightedReferenceText(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  reference: "ema9Distance" | "vwapDistance",
  label: string,
  currency: string,
): string | null {
  const distance = weightedAverage(events, (event) => {
    const candidate = event.metrics[reference];
    return candidate ? Number(candidate.signedDistance) : null;
  });
  const percent = weightedAverage(events, (event) => event.metrics[reference]?.signedDistancePercent ?? null);
  if (distance === null || percent === null) return null;
  const relation = distance > 0 ? "above" : distance < 0 ? "below" : "at";
  return relation === "at"
    ? `at ${label}`
    : `${price(String(Math.abs(distance)), currency)} (${Math.abs(percent).toFixed(2)}%) ${relation} ${label}`;
}

function weightedFiveMinuteEmaText(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  currency: string,
): string | null {
  const distance = weightedAverage(events, (event) => {
    const candidate = event.fiveMinuteContext.completedBeforeExecution?.ema9Distance;
    return candidate ? Number(candidate.signedDistance) : null;
  });
  const percent = weightedAverage(events, (event) =>
    event.fiveMinuteContext.completedBeforeExecution?.ema9Distance?.signedDistancePercent ?? null);
  if (distance === null || percent === null) return null;
  const relation = distance > 0 ? "above" : distance < 0 ? "below" : "at";
  return relation === "at"
    ? "at the 5-minute EMA 9 from the last completed candle"
    : `${price(String(Math.abs(distance)), currency)} (${Math.abs(percent).toFixed(2)}%) ${relation} the 5-minute EMA 9 from the last completed candle`;
}

function weightedFiveMinuteRelativeVolumeText(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  label: string,
): string | null {
  const relativeVolume = weightedAverage(events, (event) =>
    event.fiveMinuteContext.completedBeforeExecution?.relativeVolume ?? null);
  return relativeVolume === null
    ? null
    : `Before the ${label.toLowerCase()} fills, the last completed 5-minute candle averaged ${relativeVolume.toFixed(2)}× recent 5-minute volume, weighted by fill size.`;
}

function combinedActivityText(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  label: string,
  currency: string,
): string | null {
  const byCandle = new Map<number, DaySessionTradeAnalyzer["events"][number]>();
  for (const event of events) {
    if (event.candleTime !== null && event.metrics.available) byCandle.set(event.candleTime, event);
  }
  const unique = [...byCandle.values()];
  if (unique.length === 0) return null;
  const volume = unique.reduce((total, event) => total + Number(event.metrics.candleVolume ?? 0), 0);
  const turnoverAvailable = unique.every((event) => event.metrics.candleTurnover !== null);
  const turnover = unique.reduce((total, event) => total + Number(event.metrics.candleTurnover ?? 0), 0);
  return `${label} candle activity: ${compactNumber(volume)} shares${turnoverAvailable ? ` and ${price(String(turnover), currency)} turnover` : ""}${unique.length < events.length ? "; fills in the same minute are counted once" : ""}.`;
}

function combinedFiveMinuteActivityText(
  events: readonly DaySessionTradeAnalyzer["events"][number][],
  label: string,
  currency: string,
): string | null {
  const byCandle = new Map<number, DaySessionTradeAnalyzer["events"][number]>();
  for (const event of events) {
    const candle = event.fiveMinuteContext.containingCandle;
    if (candle) byCandle.set(candle.candleTime, event);
  }
  const unique = [...byCandle.values()];
  if (unique.length === 0) return null;
  const volume = unique.reduce((total, event) =>
    total + Number(event.fiveMinuteContext.containingCandle?.volume ?? 0), 0);
  const turnoverAvailable = unique.every((event) =>
    event.fiveMinuteContext.containingCandle?.turnover !== null);
  const turnover = unique.reduce((total, event) =>
    total + Number(event.fiveMinuteContext.containingCandle?.turnover ?? 0), 0);
  return `After the containing 5-minute candle${unique.length === 1 ? "" : "s"} closed, ${label.toLowerCase()} activity totaled ${compactNumber(volume)} shares${turnoverAvailable ? ` and ${price(String(turnover), currency)} turnover` : ""}${unique.length < events.length ? "; fills in the same 5-minute candle are counted once" : ""}. This is retrospective context.`;
}

function combinedTradeAnalysisSections(
  roundTrip: DaySessionRoundTrip,
  analyzer: DaySessionTradeAnalyzer,
  currency: string,
  timeframe: TradeAnalysisTimeframe,
): TradeAnalysisSection[] {
  const entries = analyzer.events.filter((event) => event.kind === "entry" || event.kind === "add");
  const exits = analyzer.events.filter((event) => event.kind === "partial_exit" || event.kind === "final_exit");
  if (entries.length === 0) return [];
  const entryQuantity = entries.reduce((total, event) => total + Number(event.quantity), 0);
  const exitQuantity = exits.reduce((total, event) => total + Number(event.quantity), 0);
  const averageEntry = weightedAverage(entries, (event) => Number(event.price));
  const averageExit = weightedAverage(exits, (event) => Number(event.price));
  const entryReferences = [
    weightedReferenceText(entries, "vwapDistance", "session VWAP through each execution minute", currency),
    timeframe === "5m"
      ? weightedFiveMinuteEmaText(entries, currency)
      : weightedReferenceText(entries, "ema9Distance", "1-minute EMA 9", currency),
  ].filter((line): line is string => line !== null);
  const exitReferences = [
    weightedReferenceText(exits, "vwapDistance", "session VWAP through each execution minute", currency),
    timeframe === "5m"
      ? weightedFiveMinuteEmaText(exits, currency)
      : weightedReferenceText(exits, "ema9Distance", "1-minute EMA 9", currency),
  ].filter((line): line is string => line !== null);
  const entryEdge = weightedAverage(entries, (event) => {
    const candidate = timeframe === "5m"
      ? event.fiveMinuteContext.containingCandle?.executionEdgeDistance ?? null
      : event.metrics.executionEdgeDistance;
    return candidate === null ? null : Number(candidate);
  });
  const exitGiveback = weightedAverage(exits, (event) => event.metrics.givebackFromPriorFavorableExtreme === null
    ? null
    : Number(event.metrics.givebackFromPriorFavorableExtreme));
  const exitEdge = weightedAverage(exits, (event) => {
    const candidate = timeframe === "5m"
      ? event.fiveMinuteContext.containingCandle?.executionEdgeDistance ?? null
      : event.metrics.executionEdgeDistance;
    return candidate === null ? null : Number(candidate);
  });
  const firstEntry = entries[0]!;
  const tradeExcursion = firstEntry.metrics.excursionUntilFlat;
  const entryLines = [
    averageEntry === null
      ? `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares.`
      : `${entries.length} opening execution${entries.length === 1 ? "" : "s"} established ${compactNumber(entryQuantity)} shares at a quantity-weighted average of ${price(String(averageEntry), currency)}${eventSpanMinutes(entries) > 0 ? ` over ${eventSpanMinutes(entries)} minutes` : ""}.`,
    entryReferences.length > 0 ? `Across the entry fills, the quantity-weighted execution was ${entryReferences.join(" and ")}.` : null,
    timeframe === "5m" ? weightedFiveMinuteRelativeVolumeText(entries, "Entry") : null,
    entryEdge === null
      ? null
      : timeframe === "5m"
        ? `After each containing 5-minute candle closed, the quantity-weighted execution was ${price(String(entryEdge), currency)} from its favorable edge. This is retrospective candle location, not information available at the fill.`
        : `Average entry precision was ${price(String(entryEdge), currency)} from each fill's favorable edge inside its own 1-minute candle.`,
    timeframe === "5m"
      ? combinedFiveMinuteActivityText(entries, "Entry", currency)
      : combinedActivityText(entries, "Entry", currency),
  ].filter((line): line is string => line !== null);
  const exitLines = [
    exits.length === 0
      ? "No reducing execution is available."
      : `${exits.length} exit execution${exits.length === 1 ? "" : "s"} closed ${compactNumber(exitQuantity)} shares${averageExit === null ? "" : ` at a quantity-weighted average of ${price(String(averageExit), currency)}`}${eventSpanMinutes(exits) > 0 ? ` over ${eventSpanMinutes(exits)} minutes` : ""}.`,
    exitReferences.length > 0 ? `Across the exit fills, the quantity-weighted execution was ${exitReferences.join(" and ")}.` : null,
    timeframe === "5m" ? weightedFiveMinuteRelativeVolumeText(exits, "Exit") : null,
    exitGiveback === null ? null : `Across the exits, the average giveback was ${price(String(exitGiveback), currency)} per share from the most favorable earlier completed 1-minute candle price. Larger exit fills carry more weight in this average.`,
    exitEdge === null
      ? null
      : timeframe === "5m"
        ? `After each containing 5-minute candle closed, the quantity-weighted exit was ${price(String(exitEdge), currency)} from its favorable edge. This is retrospective candle location, not information available at the fill.`
        : `Average exit precision was ${price(String(exitEdge), currency)} from each fill's favorable edge inside its own 1-minute candle.`,
    timeframe === "5m"
      ? combinedFiveMinuteActivityText(exits, "Exit", currency)
      : combinedActivityText(exits, "Exit", currency),
  ].filter((line): line is string => line !== null);
  const outcomeLines = [
    `Trade result: ${money(roundTrip.netPnl, currency)}${roundTrip.gainLossPercent === null ? "" : ` (${percentage(roundTrip.gainLossPercent)})`}.`,
    tradeExcursion
      ? `From the first entry until the position was flat (${tradeExcursion.minutesUntilFlat} minutes), price moved as much as ${price(tradeExcursion.favorableMove, currency)} in the trade's favor and ${price(tradeExcursion.adverseMove, currency)} against it.`
      : null,
  ].filter((line): line is string => line !== null);
  const oneMinuteLines = [
    closestPatternLine(entries, "1m", roundTrip.timezone, "Entry"),
    closestPatternLine(exits, "1m", roundTrip.timezone, "Exit"),
  ].filter((line): line is string => line !== null);
  const fiveMinuteLines = [
    closestPatternLine(entries, "5m", roundTrip.timezone, "Entry"),
    closestPatternLine(exits, "5m", roundTrip.timezone, "Exit"),
  ].filter((line): line is string => line !== null);
  return [
    { lines: entryLines, title: "Combined entry" },
    { lines: exitLines, title: "Combined exit" },
    { lines: timeframe === "5m" ? fiveMinuteLines : oneMinuteLines, title: `${timeframe === "5m" ? "5-minute" : "1-minute"} candle patterns` },
    { lines: outcomeLines, title: "Trade outcome" },
  ].filter((section) => section.lines.length > 0);
}

function TradeAnalysisSectionBlock({ section }: { section: TradeAnalysisSection }) {
  return (
    <Box>
      <Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">
        {section.title}
      </Typography>
      <AnalysisBulletList lines={section.lines} />
    </Box>
  );
}

function softNavySurface(lightValue: string): (theme: Theme) => string {
  return (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : lightValue;
}

function informationSurface(lightValue: string): (theme: Theme) => string {
  return (theme) => theme.palette.mode === "dark" ? alpha(theme.palette.info.main, 0.18) : lightValue;
}

function warningSurface(lightValue: string): (theme: Theme) => string {
  return (theme) => theme.palette.mode === "dark" ? alpha(theme.palette.warning.main, 0.18) : lightValue;
}

function AnalysisBulletList({
  color,
  lines,
  variant = "body2",
}: {
  color?: string;
  lines: readonly string[];
  variant?: "body2" | "caption";
}) {
  return (
    <Box
      component="ul"
      sx={{
        display: "grid",
        gap: 0.6,
        listStyleType: "disc",
        m: 0,
        pl: 2.5,
        "& li::marker": { color: "text.primary", fontSize: "0.9em" },
      }}
    >
      {lines.map((line, index) => (
        <Box component="li" key={`${index}-${line}`} sx={{ pl: 0.25 }}>
          <Typography color={color} variant={variant}>{line}</Typography>
        </Box>
      ))}
    </Box>
  );
}

function analysisTimestamp(seconds: number | null, timezone: string): string | null {
  return seconds === null
    ? null
    : timeLabel(new Date(seconds * 1000).toISOString(), timezone);
}

function greenToRedLabel(
  status: DaySessionTradeAnalyzer["greenToRed"]["status"],
): string {
  if (status === "never_green") return "Never green";
  if (status === "green_no_red") return "Stayed green";
  if (status === "green_to_red_ended_red") return "Green → red, ended red";
  if (status === "green_to_red_recovered") return "Green → red, recovered";
  if (status === "green_to_red_ended_flat") return "Green → red, ended flat";
  return "Unavailable";
}

const UNAVAILABLE_GREEN_TO_RED_ANALYSIS: DaySessionTradeAnalyzer["greenToRed"] = Object.freeze({
  addedAfterPeakCount: 0,
  bestProfitOpportunityIndex: null,
  completedClosePeakAtUtcSeconds: null,
  completedClosePeakPnlDecimal: null,
  feesComplete: false,
  finalPnlDecimal: null,
  firstGreenAtUtcSeconds: null,
  firstRedAtUtcSeconds: null,
  firstRedPnlDecimal: null,
  firstRecoveryAtUtcSeconds: null,
  minutesFromPeakToRed: null,
  partialExitBeforeRedCount: 0,
  peakAtUtcSeconds: null,
  peakPnlDecimal: null,
  peakToFinalReversalDecimal: null,
  peakToRedReversalDecimal: null,
  positionQuantityAtPeakDecimal: null,
  positionQuantityAtRedDecimal: null,
  profitOpportunities: Object.freeze([]),
  profitOpportunityThresholdDecimal: null,
  status: "unavailable",
  strongOpportunityThresholdDecimal: null,
});

function ProfitOpportunityPeriodSummary({
  currency,
  label,
  opportunity,
  timezone,
}: {
  currency: string;
  label: string;
  opportunity: DaySessionTradeAnalyzer["greenToRed"]["profitOpportunities"][number];
  timezone: string;
}) {
  const startedAt = analysisTimestamp(opportunity.startedAtUtcSeconds, timezone);
  const endedAt = analysisTimestamp(opportunity.endedAtUtcSeconds, timezone);
  const peakAt = analysisTimestamp(opportunity.peakAtUtcSeconds, timezone);
  const closeLabel = `${opportunity.completedCloseCount} completed close${opportunity.completedCloseCount === 1 ? "" : "s"}`;
  const durationLabel = opportunity.durationMinutes === 0
    ? `This period contains one completed close${startedAt ? ` at ${startedAt}` : ""}.`
    : `This period ran from ${startedAt ?? "an unavailable start time"} to ${endedAt ?? "an unavailable end time"} and covered ${opportunity.durationMinutes} minute${opportunity.durationMinutes === 1 ? "" : "s"} (${closeLabel}).`;

  return (
    <Box>
      <Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">
        {label}
      </Typography>
      <AnalysisBulletList
        lines={[
          durationLabel,
          opportunity.completedCloseCount === 1
            ? `Calculated P/L at that completed close was ${money(opportunity.peakPnlDecimal, currency)}.`
            : `During this period, calculated P/L stayed between ${money(opportunity.lowestPnlDecimal, currency)} and ${money(opportunity.peakPnlDecimal, currency)}${peakAt ? `, reaching its highest level at ${peakAt}` : ""}.`,
          `From the highest calculated P/L in this period to the final calculated result, ${price(opportunity.peakToFinalReversalDecimal, currency)} was given back.`,
        ]}
      />
    </Box>
  );
}

function GreenToRedAnalysis({
  actualNetPnl,
  analysis,
  currency,
  timezone,
}: {
  actualNetPnl: string | null;
  analysis: DaySessionTradeAnalyzer["greenToRed"];
  currency: string;
  timezone: string;
}) {
  const [showOtherOpportunities, setShowOtherOpportunities] = useState(false);
  const firstGreenAt = analysisTimestamp(analysis.firstGreenAtUtcSeconds, timezone);
  const peakAt = analysisTimestamp(analysis.peakAtUtcSeconds, timezone);
  const firstRedAt = analysisTimestamp(analysis.firstRedAtUtcSeconds, timezone);
  const firstRecoveryAt = analysisTimestamp(analysis.firstRecoveryAtUtcSeconds, timezone);
  const transitionDetected = analysis.firstRedAtUtcSeconds !== null;
  const chipColor = analysis.status === "green_to_red_ended_red"
    ? "error"
    : analysis.status === "green_no_red" || analysis.status === "green_to_red_recovered"
      ? "success"
      : "default";
  const actionFacts = [
    analysis.addedAfterPeakCount > 0
      ? `${analysis.addedAfterPeakCount} add${analysis.addedAfterPeakCount === 1 ? "" : "s"} occurred after the peak.`
      : null,
    analysis.partialExitBeforeRedCount > 0
      ? `${analysis.partialExitBeforeRedCount} partial exit${analysis.partialExitBeforeRedCount === 1 ? "" : "s"} occurred between the peak and the move below breakeven.`
      : null,
  ].filter((line): line is string => line !== null);
  const bestOpportunity = analysis.bestProfitOpportunityIndex === null
    ? null
    : analysis.profitOpportunities[analysis.bestProfitOpportunityIndex] ?? null;
  const otherOpportunities = analysis.profitOpportunities.filter((_, index) =>
    index !== analysis.bestProfitOpportunityIndex);

  return (
    <Box
      sx={{
        borderColor: "divider",
        borderLeft: { xs: 0, md: 1 },
        borderTop: { xs: 1, md: 0 },
        minWidth: 0,
        pl: { xs: 0, md: 2 },
        pt: { xs: 2, md: 0 },
      }}
    >
      <Stack spacing={1.1}>
        <Typography sx={{ fontWeight: 900 }} variant="body1">
          Green-to-red analysis
        </Typography>
        <Chip
          color={chipColor}
          label={greenToRedLabel(analysis.status)}
          size="small"
          sx={{ alignSelf: "flex-start", fontWeight: 800 }}
        />
        {analysis.status === "unavailable" ? (
          <AnalysisBulletList lines={["The complete saved candle and execution path needed for this analysis is unavailable."]} />
        ) : analysis.status === "never_green" ? (
          <AnalysisBulletList lines={["No completed one-minute candle close or exact execution showed a positive trade P/L before the position became flat."]} />
        ) : (
          <>
            <Box>
              <Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">
                Profitable phase
              </Typography>
              <AnalysisBulletList
                lines={[
                  `The trade first moved into profit${firstGreenAt ? ` at ${firstGreenAt}` : ""}${analysis.peakPnlDecimal !== null ? ` and reached a peak calculated P/L of ${money(analysis.peakPnlDecimal, currency)}` : ""}${peakAt ? ` at ${peakAt}` : ""}.`,
                ]}
              />
            </Box>
            {bestOpportunity ? (
              <Box>
                <ProfitOpportunityPeriodSummary
                  currency={currency}
                  label="Best sustained profit opportunity"
                  opportunity={bestOpportunity}
                  timezone={timezone}
                />
                {otherOpportunities.length > 0 ? (
                  <>
                    <Button
                      aria-expanded={showOtherOpportunities}
                      onClick={() => setShowOtherOpportunities((current) => !current)}
                      size="small"
                      sx={{ alignSelf: "flex-start", mt: 0.55, px: 0, textTransform: "none" }}
                      variant="text"
                    >
                      {showOtherOpportunities
                        ? "Hide other profit opportunities"
                        : `View other profit opportunities (${otherOpportunities.length})`}
                    </Button>
                    <Collapse in={showOtherOpportunities} timeout="auto" unmountOnExit>
                      <Stack spacing={1.25} sx={{ borderLeft: 2, borderColor: "divider", mt: 0.5, pl: 1.25 }}>
                        {otherOpportunities.map((opportunity, index) => (
                          <ProfitOpportunityPeriodSummary
                            currency={currency}
                            key={`${opportunity.startedAtUtcSeconds}-${opportunity.endedAtUtcSeconds}`}
                            label={`Other opportunity ${index + 1}`}
                            opportunity={opportunity}
                            timezone={timezone}
                          />
                        ))}
                      </Stack>
                    </Collapse>
                  </>
                ) : null}
              </Box>
            ) : null}
            <Box>
              <Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">
                {transitionDetected ? "Move below breakeven" : "Price path result"}
              </Typography>
              {transitionDetected ? (
                <AnalysisBulletList
                  lines={[
                    `The trade moved below breakeven${firstRedAt ? ` at ${firstRedAt}` : ""}${analysis.firstRedPnlDecimal !== null ? ` with a calculated P/L of ${money(analysis.firstRedPnlDecimal, currency)}` : ""}.`,
                    ...(analysis.peakToRedReversalDecimal !== null
                      ? [`From the peak to that red point, ${price(analysis.peakToRedReversalDecimal, currency)} reversed${analysis.minutesFromPeakToRed === null ? "" : ` over ${analysis.minutesFromPeakToRed} minute${analysis.minutesFromPeakToRed === 1 ? "" : "s"}`}.`]
                      : []),
                    ...(analysis.status === "green_to_red_recovered" && firstRecoveryAt
                      ? [`The trade returned above breakeven at ${firstRecoveryAt}.`]
                      : analysis.status === "green_to_red_ended_flat"
                        ? ["The calculated price path finished flat."]
                        : analysis.status === "green_to_red_ended_red"
                          ? ["The calculated price path finished below breakeven."]
                          : []),
                  ]}
                />
              ) : (
                <AnalysisBulletList lines={["After becoming profitable, the calculated trade path did not later move below breakeven before the final exit."]} />
              )}
            </Box>
            {transitionDetected && analysis.positionQuantityAtPeakDecimal !== null &&
                analysis.positionQuantityAtRedDecimal !== null ? (
              <Box>
                <Typography sx={{ fontWeight: 850, mb: 0.4 }} variant="body2">
                  Position changes
                </Typography>
                <AnalysisBulletList
                  lines={[
                    `Position size was ${compactNumber(Number(analysis.positionQuantityAtPeakDecimal))} shares at the peak and ${compactNumber(Number(analysis.positionQuantityAtRedDecimal))} shares when the trade moved below breakeven.`,
                    ...actionFacts,
                  ]}
                />
              </Box>
            ) : null}
          </>
        )}
        {analysis.finalPnlDecimal !== null ? (
          <AnalysisBulletList
            color="text.secondary"
            lines={[`Calculated final path P/L: ${money(analysis.finalPnlDecimal, currency)}.`]}
            variant="caption"
          />
        ) : null}
        {actualNetPnl !== null ? (
          <Box sx={{ fontWeight: 800 }}>
            <AnalysisBulletList
              lines={[Number(actualNetPnl) > 0
                ? `Actual net profit: ${money(actualNetPnl, currency)}.`
                : Number(actualNetPnl) < 0
                  ? `Actual net loss: ${money(actualNetPnl, currency)}.`
                  : `Actual net result: ${money(actualNetPnl, currency)}.`]}
            />
          </Box>
        ) : null}
        <Typography color="text.secondary" variant="caption">
          {analysis.feesComplete
            ? "The calculated path includes all reported execution fees."
            : "Unreported execution fees are unavailable and are not included in this calculated price path."}
          {" "}Transitions use completed one-minute closes and exact fills, not unknowable intraminute high/low order.
        </Typography>
      </Stack>
    </Box>
  );
}


function hasVisibleAnalysis(analyzer: DaySessionTradeAnalyzer): boolean {
  return analyzer.candles.length > 0 &&
    (analyzer.status === "pending" || analyzer.status === "ready" || analyzer.status === "provider_unavailable");
}

function postExitMinutesAvailable(analyzer: DaySessionTradeAnalyzer): number | null {
  const finalExit = [...analyzer.events].reverse().find((event) => event.kind === "final_exit");
  const lastCandle = analyzer.candles.at(-1);
  const exitedAt = finalExit ? Date.parse(finalExit.executedAt) / 1000 : Number.NaN;
  if (!lastCandle || !Number.isFinite(exitedAt)) return null;
  return Math.max(0, Math.min(30, Math.floor((lastCandle.time - exitedAt) / 60)));
}

function firstAnalyzerResultAtMilliseconds(finalExitAtUtc: string): number | null {
  const finalExitMilliseconds = Date.parse(finalExitAtUtc);
  return Number.isFinite(finalExitMilliseconds)
    ? Math.floor(finalExitMilliseconds / 60_000) * 60_000 + 30 * 60_000
    : null;
}

function pnlColor(value: string | null): "success.main" | "error.main" | "text.primary" {
  if (value === null) return "text.primary";
  if (/^-/.test(value) && !/^-0(?:\.0+)?$/.test(value)) return "error.main";
  if (/^0(?:\.0+)?$/.test(value)) return "text.primary";
  return "success.main";
}

function pnlBackground(value: string | null): (theme: Theme) => string {
  if (value === null) return softNavySurface("rgba(1, 30, 86, 0.05)");
  if (/^-/.test(value) && !/^-0(?:\.0+)?$/.test(value)) {
    return (theme) => theme.palette.mode === "dark" ? alpha(theme.palette.error.main, 0.18) : "rgba(211, 47, 47, 0.10)";
  }
  if (/^0(?:\.0+)?$/.test(value)) return softNavySurface("rgba(1, 30, 86, 0.05)");
  return (theme) => theme.palette.mode === "dark" ? alpha(theme.palette.success.main, 0.18) : "rgba(46, 125, 50, 0.11)";
}

function statusPresentation(
  status: DaySessionRule["status"],
): {
  color: "success" | "error" | "default";
  icon: typeof CheckCircleOutlineRoundedIcon | typeof ErrorOutlineRoundedIcon | null;
  label: string;
} | null {
  if (status === "followed") {
    return {
      color: "success",
      icon: CheckCircleOutlineRoundedIcon,
      label: "Followed",
    };
  }
  if (status === "broken") {
    return {
      color: "error",
      icon: ErrorOutlineRoundedIcon,
      label: "Broken",
    };
  }
  if (status === "n/a") {
    return {
      color: "default",
      icon: null,
      label: "N/A",
    };
  }
  return { color: "default", icon: null, label: "Not selected" };
}

function ruleEventLabel(
  event: NonNullable<DaySessionRule["evidence"]>["violations"][number],
  currency: string,
  timezone: string,
): string {
  const at = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone: timezone,
  }).format(new Date(event.occurredAt));
  const pnl = event.netPnl === null
    ? "P/L unavailable"
    : `${formatJournalAnalyticsMoney(event.netPnl, currency)} P/L`;
  return `${at} · ${pnl}`;
}

function PresetRuleRow({
  currency,
  rule,
  timezone,
}: {
  currency: string;
  rule: DaySessionRule;
  timezone: string;
}) {
  const [open, setOpen] = useState(false);
  const presentation = statusPresentation(rule.status);
  const canOpen = rule.status === "broken" || rule.status === "n/a";
  return (
    <Box sx={{ py: 0.65 }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ lineHeight: 1.25, pr: 0.5 }} variant="body2">{rule.label}</Typography>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexShrink: 0 }}>
          {canOpen ? (
            <Button aria-expanded={open} onClick={() => setOpen((value) => !value)} size="small">
              {rule.status === "n/a" ? "Why N/A" : "Details"}
            </Button>
          ) : null}
          {presentation ? <Chip color={presentation.color} icon={presentation.icon ? <presentation.icon /> : undefined} label={presentation.label} size="small" /> : null}
        </Stack>
      </Stack>
      <Collapse in={open}>
        <Box sx={{ bgcolor: warningSurface("rgba(154, 103, 0, 0.06)"), borderLeft: (theme) => `3px solid ${theme.palette.mode === "dark" ? theme.palette.warning.main : "#9A6700"}`, mt: 0.75, p: 1.25 }}>
          <Typography color="text.secondary" sx={{ display: "block", mb: 0.75 }} variant="caption">
            Fee coverage: {rule.evidence?.feeCoverage ?? "unavailable"}
          </Typography>
          {rule.evidence?.limitation ? <Typography variant="body2">{rule.evidence.limitation}</Typography> : null}
          {rule.evidence?.trigger ? (
            <Box>
              <Typography color="text.secondary" variant="caption">Trigger</Typography>
              <Typography variant="body2">{ruleEventLabel(rule.evidence.trigger, currency, timezone)}</Typography>
              {rule.evidence.trigger.valueBefore !== null || rule.evidence.trigger.valueAfter !== null ? (
                <Typography color="text.secondary" variant="caption">
                  {rule.evidence.trigger.valueBefore ?? "Unavailable"} → {rule.evidence.trigger.valueAfter ?? "Unavailable"}
                </Typography>
              ) : null}
            </Box>
          ) : null}
          {(rule.evidence?.violations.length ?? 0) > 0 ? (
            <Stack spacing={0.5} sx={{ mt: rule.evidence?.trigger ? 1 : 0 }}>
              <Typography color="text.secondary" variant="caption">Violating trade{rule.evidence!.violations.length === 1 ? "" : "s"}</Typography>
              {rule.evidence!.violations.map((item) => <Typography key={`${item.roundTripKey}:${item.occurredAt}`} variant="body2">{ruleEventLabel(item, currency, timezone)}</Typography>)}
            </Stack>
          ) : null}
        </Box>
      </Collapse>
    </Box>
  );
}

function TradeReview({
  analyzer,
  analyzerDetailState,
  analysisInterval,
  availableTags,
  canHide,
  currency,
  designPreview,
  expanded,
  expectedAccountSelectionRef,
  onCatalogChange,
  onHide,
  onManageTags,
  onOpen,
  onRuleStatusChange,
  onRuleNoteSave,
  onSaveNotes,
  onSelectAnalysisEvent,
  onTagsChange,
  onTradeNoteChange,
  executions,
  noteState,
  readOnly,
  roundTrip,
  ruleSaveError,
  sessionDate,
  selectedAnalysisEventId,
  showMoomooConnectionGuidance,
  tags,
  tradeNumber,
  tradeRules,
}: {
  analyzer: DaySessionTradeAnalyzer | null;
  analyzerDetailState: "idle" | "loading" | "error";
  analysisInterval: DailyTradeChartInterval;
  availableTags: DaySessionTradeTag[];
  canHide: boolean;
  currency: string;
  designPreview: boolean;
  expanded: boolean;
  expectedAccountSelectionRef: string;
  onCatalogChange: (tags: DaySessionTradeTag[]) => void;
  onHide: () => void;
  onManageTags?: () => void;
  onOpen: () => void;
  onRuleStatusChange: (
    rule: DaySessionRule,
    status: DaySessionRule["status"],
  ) => Promise<void>;
  onRuleNoteSave: (rule: DaySessionRule, note: string) => Promise<void>;
  onSaveNotes: () => Promise<void>;
  onSelectAnalysisEvent: (eventId: string | null) => void;
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  onTradeNoteChange: (value: string) => void;
  executions: readonly DaySessionExecutionActivity[];
  noteState: "idle" | "saving" | "saved" | "error";
  readOnly: boolean;
  roundTrip: DaySessionRoundTrip;
  ruleSaveError: string | null;
  sessionDate: string;
  selectedAnalysisEventId: string | null;
  showMoomooConnectionGuidance: boolean;
  tags: DaySessionTradeTag[];
  tradeNumber: number;
  tradeRules: DaySessionRule[];
}) {
  const presetRules = tradeRules.filter((rule) => !rule.custom);
  const tradeLabelColor = pnlColor(roundTrip.netPnl) === "success.main" ? "success" : "error";
  const [mobileRulesOpen, setMobileRulesOpen] = useState(true);
  const [mobileExecutionsOpen, setMobileExecutionsOpen] = useState(false);
  const [mismatchConfirmationState, setMismatchConfirmationState] = useState<
    "idle" | "saving" | "confirmed" | "error"
  >(analyzer?.mismatchBrokerConfirmed ? "confirmed" : "idle");
  const customRules = tradeRules.filter((rule) => rule.custom);
  const [selectedCustomRuleId, setSelectedCustomRuleId] = useState(
    customRules[0]?.ruleId ?? "",
  );
  const selectedCustomRule =
    customRules.find((rule) => rule.ruleId === selectedCustomRuleId) ??
    customRules[0];
  const [customRuleNote, setCustomRuleNote] = useState(selectedCustomRule?.note ?? "");
  useTradeTrackerUnsavedChanges(
    `daily-trade-tracker:rule-note:${roundTrip.roundTripKey}`,
    customRuleNote !== (selectedCustomRule?.note ?? ""),
  );
  const finalExit = { patterns: analyzer?.events.find((event) => event.kind === "final_exit")?.patterns ?? [] };
  const analysisTimeframe = analysisInterval === "5m" ? "5m" : "1m";
  const analysisSections = analyzer
    ? combinedTradeAnalysisSections(roundTrip, analyzer, currency, analysisTimeframe)
    : [];
  const analysisBaseTitle = analyzer?.status === "pending"
    ? "Live trade analysis"
    : analyzer?.status === "ready"
      ? "Trade analysis"
      : "Partial trade analysis";
  const currentPolicyReadyAt = firstAnalyzerResultAtMilliseconds(roundTrip.exitAt);
  const analysisWindowShortenedAtMarketClose = analyzer?.status === "pending" &&
    analyzer.availableAtUtc !== null && analyzer.availableAtUtc !== undefined &&
    currentPolicyReadyAt !== null && Date.parse(analyzer.availableAtUtc) < currentPolicyReadyAt;
  const collapsedPendingAnalysisNotice = analyzer?.status === "pending" ? (
    <Box
      aria-live="polite"
      role="status"
      sx={{
        alignItems: "center",
        bgcolor: informationSurface("rgba(25, 118, 210, 0.07)"),
        borderLeft: 3,
        borderColor: "info.main",
        display: "flex",
        gap: 0.75,
        mx: 1,
        px: 1,
        py: 0.55,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{ bgcolor: "info.main", borderRadius: "50%", flex: "0 0 auto", height: 7, width: 7 }}
      />
      <Typography color="info.dark" sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.info.main : undefined, fontWeight: 750 }} variant="caption">
        Trade Analyzer is analyzing this trade.
      </Typography>
    </Box>
  ) : null;
  const ruleControls = customRules.length === 0 ? (
    <Typography color="text.secondary" variant="body2">
      You have no custom rules set up.
    </Typography>
  ) : (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: { xs: "1fr", sm: "minmax(180px, 280px) 140px" },
      }}
    >
      <TextField
        label="Custom rule"
        onChange={(event) => {
          setSelectedCustomRuleId(event.target.value);
          setCustomRuleNote(customRules.find((rule) => rule.ruleId === event.target.value)?.note ?? "");
        }}
        select
        size="small"
        value={selectedCustomRule?.ruleId ?? ""}
      >
        {customRules.map((rule) => (
          <MenuItem key={rule.ruleId} value={rule.ruleId}>
            {rule.label}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        disabled={readOnly || !selectedCustomRule}
        label="Result"
        onChange={(event) => {
          if (selectedCustomRule) {
            void onRuleStatusChange(
              selectedCustomRule,
              event.target.value as DaySessionRule["status"],
            );
          }
        }}
        select
        size="small"
        value={selectedCustomRule?.status ?? "not-reviewed"}
      >
        <MenuItem value="not-reviewed">Not selected</MenuItem>
        <MenuItem value="followed">Followed</MenuItem>
        <MenuItem value="broken">Broken</MenuItem>
      </TextField>
      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
        <TextField
          fullWidth
          label="Rule note (optional)"
          minRows={2}
          multiline
          onChange={(event) => setCustomRuleNote(event.target.value)}
          value={customRuleNote}
        />
        <Button disabled={readOnly || !selectedCustomRule} onClick={() => selectedCustomRule ? void onRuleNoteSave(selectedCustomRule, customRuleNote) : undefined} size="small" sx={{ mt: 0.5 }}>
          {selectedCustomRule?.note ? "Update note" : "Add note"}
        </Button>
      </Box>
      {ruleSaveError ? (
        <Alert severity="error" sx={{ gridColumn: { sm: "1 / -1" } }}>
          {ruleSaveError}
        </Alert>
      ) : null}
    </Box>
  );
  const followedPresetCount = presetRules.filter((rule) => rule.status === "followed").length;
  const brokenPresetCount = presetRules.filter((rule) => rule.status === "broken").length;
  const unavailablePresetCount = presetRules.filter((rule) => rule.status === "n/a").length;
  const pendingPresetCount = presetRules.filter((rule) => rule.status === "not-reviewed").length;
  const mobileRuleSummary = [
    followedPresetCount > 0 ? `${followedPresetCount} followed` : null,
    brokenPresetCount > 0 ? `${brokenPresetCount} broken` : null,
    unavailablePresetCount > 0 ? `${unavailablePresetCount} N/A` : null,
    pendingPresetCount > 0 ? `${pendingPresetCount} not selected` : null,
  ].filter((item): item is string => item !== null).join(" · ") || "No preset rules selected";
  const renderRuleDetails = () => (
    <>
      <Box>
        <Typography color="text.secondary" sx={{ display: "block", mb: 0.75 }} variant="caption">
          Preset rules
        </Typography>
        {presetRules.length > 0 ? (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {presetRules.map((rule) => <PresetRuleRow currency={currency} key={`${rule.ruleId}:${rule.ruleVersion}`} rule={rule} timezone={roundTrip.timezone} />)}
          </Stack>
        ) : (
          <Button
            component={Link}
            fullWidth
            href="/rules"
            rel="noopener noreferrer"
            size="small"
            startIcon={<OpenInNewRoundedIcon />}
            sx={{ minHeight: 36, justifyContent: "flex-start" }}
            target="_blank"
            variant="outlined"
          >
            Choose preset rules
          </Button>
        )}
      </Box>
      <Box sx={{ mt: 1.5 }}>
        <Typography color="text.secondary" sx={{ display: "block", mb: 0.75 }} variant="caption">
          Custom rules
        </Typography>
        {readOnly ? (
          customRules.length === 0 ? (
            <Typography color="text.secondary" variant="body2">You have no custom rules set up.</Typography>
          ) : (
            <Stack divider={<Divider flexItem />} spacing={0}>
              {customRules.map((rule) => {
                const presentation = statusPresentation(rule.status);
                return (
                  <Stack direction="row" key={rule.ruleId} sx={{ alignItems: "center", justifyContent: "space-between", py: 0.4 }}>
                    <Typography variant="body2">{rule.label}</Typography>
                    {presentation ? <Chip color={presentation.color} label={presentation.label} size="small" /> : null}
                  </Stack>
                );
              })}
            </Stack>
          )
        ) : ruleControls}
      </Box>
    </>
  );
  const renderExecutionDetails = () => (
    <Stack divider={<Divider flexItem />}>
      {executions.map((execution) => (
        <Box
          key={execution.executionKey}
          sx={{
            alignItems: { sm: "center" },
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: "110px 80px minmax(88px, 1fr) 100px auto auto",
            },
            py: 0.45,
          }}
        >
          <Typography variant="body2">{timeLabel(execution.executedAt, roundTrip.timezone, true)}</Typography>
          <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
          <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
            {formatJournalAnalyticsDecimal(execution.quantity)} shares
          </Typography>
          <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
            {price(execution.price, currency)}
          </Typography>
          {(() => {
            const analysisEvent = analyzer?.events.find((event) => event.eventId === execution.analysisEventKey) ?? null;
            return analysisEvent ? (
              <Button
                onClick={() => onSelectAnalysisEvent(analysisEvent.eventId)}
                size="small"
                sx={{ lineHeight: 1.2, minHeight: { xs: 44, sm: 36 }, minWidth: 96, px: 1, py: 0.5 }}
                variant={selectedAnalysisEventId === analysisEvent.eventId ? "contained" : "outlined"}
              >
                Show on chart
              </Button>
            ) : null;
          })()}
          {readOnly ? null : (
            <ManualExecutionEditDialog
              execution={execution}
              expectedAccountSelectionRef={expectedAccountSelectionRef}
            />
          )}
        </Box>
      ))}
    </Stack>
  );

  async function confirmBrokerMismatch(): Promise<void> {
    if (!analyzer?.executionMismatchSetId || readOnly || mismatchConfirmationState === "saving") return;
    setMismatchConfirmationState("saving");
    try {
      await api<{ status: "confirmed" }>(
        `/api/platform/daily-trade-analyzer/execution-mismatches/${analyzer.executionMismatchSetId}/confirm`,
        {
          body: JSON.stringify({ expectedAccountSelectionRef }),
          headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
          method: "POST",
        },
      );
      setMismatchConfirmationState("confirmed");
    } catch {
      setMismatchConfirmationState("error");
    }
  }

  return (
    <Box id={`trade-${roundTrip.roundTripKey}`} sx={{ scrollMarginTop: 16 }}>
      <Box
        sx={{
          bgcolor: softNavySurface("rgba(1, 30, 86, 0.02)"),
          display: expanded ? "none" : "block",
          px: { xs: 1, md: 1.5 },
          py: 0.75,
        }}
      >
        <Box
          sx={{
            alignItems: "center",
            display: { xs: "grid", md: "none" },
            gap: 1,
            gridTemplateColumns: "auto minmax(0, 1fr) auto",
            minHeight: 54,
            px: 1,
          }}
        >
          <Typography
            component="span"
            sx={{
              bgcolor: tradeLabelColor === "success" ? "success.main" : "error.main",
              borderRadius: 1,
              color: tradeLabelColor === "success" ? "success.contrastText" : "error.contrastText",
              fontWeight: 850,
              px: 0.75,
              py: 0.35,
            }}
            variant="body2"
          >
            Trade {tradeNumber}
          </Typography>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color={pnlColor(roundTrip.netPnl)}
              sx={{ display: "block", fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}
              variant="body2"
            >
              {money(roundTrip.netPnl, currency)} · {percentage(roundTrip.gainLossPercent)}
            </Typography>
            <Typography color="text.secondary" sx={{ display: "block", mt: 0.15 }} variant="caption">
              {timeLabel(roundTrip.entryAt, roundTrip.timezone)} – {timeLabel(roundTrip.exitAt, roundTrip.timezone)}
            </Typography>
          </Box>
          <Button aria-expanded={false} onClick={onOpen} size="small" variant="outlined">
            Review trade
          </Button>
        </Box>
        <Box
          sx={{
            display: { xs: "none", md: "grid" },
            gap: 1,
            gridTemplateColumns: "auto minmax(0, 1fr) auto auto",
            justifyContent: "stretch",
            minHeight: 54,
            px: 1,
            textAlign: "left",
            width: "100%",
          }}
        >
          <Typography
            component="span"
            sx={{
              bgcolor: tradeLabelColor === "success" ? "success.main" : "error.main",
              borderRadius: 1,
              color: tradeLabelColor === "success" ? "success.contrastText" : "error.contrastText",
              fontWeight: 850,
              px: 0.75,
              py: 0.35,
            }}
            variant="body2"
          >
            Trade {tradeNumber}
          </Typography>
          <Box component="span" sx={{ minWidth: 0 }}>
            <Typography component="span" sx={{ display: "block", fontWeight: 800 }} variant="body2">
              {timeLabel(roundTrip.entryAt, roundTrip.timezone)} – {timeLabel(roundTrip.exitAt, roundTrip.timezone)}
            </Typography>
            <Typography color="text.secondary" component="span" sx={{ display: "block" }} variant="caption">
              {roundTrip.direction === "long" ? "Long" : "Short"} · {executions.length} execution{executions.length === 1 ? "" : "s"}
            </Typography>
          </Box>
          <Box component="span" sx={{ textAlign: "right" }}>
            <Typography
              color={pnlColor(roundTrip.netPnl)}
              component="span"
              sx={{ display: "block", fontFamily: "var(--font-geist-mono)", fontWeight: 850 }}
              variant="body2"
            >
              {money(roundTrip.netPnl, currency)}
            </Typography>
            <Typography
              color={pnlColor(roundTrip.gainLossPercent ?? "0")}
              component="span"
              sx={{ display: "block", fontFamily: "var(--font-geist-mono)", fontWeight: 800 }}
              variant="caption"
            >
              {percentage(roundTrip.gainLossPercent)}
            </Typography>
          </Box>
          <Button aria-expanded={false} onClick={onOpen} size="small" variant="outlined">
            Review trade
          </Button>
        </Box>
        {collapsedPendingAnalysisNotice}
      </Box>
      {expanded ? (
      <Box
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 2,
        }}
      >
      <Box
        sx={{
          display: { md: "grid" },
          gap: { xs: 1.5, md: 2 },
          gridTemplateColumns: { md: "minmax(0, 1fr) minmax(290px, 0.52fr)" },
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column" }}>
          <Box
            sx={{
              display: { md: "grid" },
              flex: 1,
              gap: { xs: 1.5, md: 2 },
              gridTemplateColumns: { md: "minmax(180px, 0.85fr) minmax(230px, 1.15fr)" },
            }}
          >
          <Box sx={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          columnGap: 1,
          gridTemplateColumns: "minmax(0, 1fr) auto",
          rowGap: 0.25,
        }}
      >
        <Box>
          <Typography
            sx={{
              bgcolor: tradeLabelColor === "success" ? "success.main" : "error.main",
              borderRadius: 1,
              color: tradeLabelColor === "success" ? "success.contrastText" : "error.contrastText",
              display: "inline-flex",
              fontWeight: 850,
              mb: 0.5,
              px: 0.75,
              py: 0.35,
            }}
            variant="body2"
          >
            Trade {tradeNumber}
          </Typography>
          <Typography sx={{ fontWeight: 800 }} variant="body2">
            {timeLabel(roundTrip.entryAt, roundTrip.timezone)} –{" "}
            {timeLabel(roundTrip.exitAt, roundTrip.timezone)}
          </Typography>
          <Typography color="text.secondary" sx={{ display: "block", fontWeight: 800 }} variant="body2">
            {price(roundTrip.entryPrice, currency)} →{" "}
            {price(roundTrip.exitPrice, currency)}
          </Typography>
          <Chip
            label={roundTrip.direction === "long" ? "Long" : "Short"}
            size="small"
            sx={{ mt: 0.5 }}
            variant="outlined"
          />
        </Box>
        <Stack
          spacing={0.25}
          sx={{ alignItems: "flex-end", gridColumn: "2", gridRow: "1", justifySelf: "end" }}
        >
          <Typography
            color={pnlColor(roundTrip.netPnl)}
            sx={{
              bgcolor: pnlBackground(roundTrip.netPnl),
              borderRadius: 1,
              fontFamily: "var(--font-geist-mono)",
              fontWeight: 850,
              px: 1,
              py: 0.4,
              textAlign: "right",
            }}
            variant="body1"
          >
            {money(roundTrip.netPnl, currency)}
          </Typography>
          <Typography
            color={pnlColor(roundTrip.gainLossPercent ?? "0")}
            sx={{
              bgcolor: pnlBackground(roundTrip.gainLossPercent ?? "0"),
              borderRadius: 1,
              fontFamily: "var(--font-geist-mono)",
              fontSize: "0.8rem",
              fontWeight: 850,
              px: 1,
              py: 0.35,
              textAlign: "right",
            }}
            variant="caption"
          >
            {percentage(roundTrip.gainLossPercent)}
          </Typography>
        </Stack>
      </Box>

          <Box sx={{ mt: "auto", pt: 2.5 }}>
            {readOnly ? (
              <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                {tags.length > 0 ? (
                  tags.map((tag) => <Chip key={tag.tagId} label={tag.name} size="small" />)
                ) : (
                  <Typography color="text.secondary" variant="caption">
                    No trade tags saved.
                  </Typography>
                )}
              </Stack>
            ) : (
              <TradeTagEditor
                availableTags={availableTags}
                disabled={false}
                designPreview={designPreview}
                expectedAccountSelectionRef={expectedAccountSelectionRef}
                onCatalogChange={onCatalogChange}
                onManageTags={onManageTags}
                onTagsChange={onTagsChange}
                sessionDate={sessionDate}
                tags={tags}
                targetKey={roundTrip.roundTripKey}
                targetKind="round-trip"
              />
            )}
          </Box>

          </Box>
          <Box
            sx={{
              alignSelf: "start",
              bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"),
              borderRadius: 1.5,
              display: { xs: "none", md: "block" },
              p: 1.25,
            }}
          >
            {renderRuleDetails()}
          </Box>
          </Box>
          <Box sx={{ display: { xs: "block", md: "none" }, mt: 1.5 }}>
            <Button
              aria-expanded={mobileRulesOpen}
              fullWidth
              onClick={() => setMobileRulesOpen((current) => !current)}
              sx={{
                borderColor: brokenPresetCount > 0 ? "error.main" : undefined,
                justifyContent: "space-between",
                textTransform: "none",
              }}
              variant="outlined"
            >
              <Typography component="span" sx={{ fontWeight: 800 }} variant="body2">Rules</Typography>
              <Typography color={brokenPresetCount > 0 ? "error.main" : "text.secondary"} component="span" variant="caption">
                {mobileRuleSummary}
              </Typography>
            </Button>
            {mobileRulesOpen ? (
              <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, mt: 0.75, p: 1.25 }}>
                {renderRuleDetails()}
              </Box>
            ) : null}
          </Box>

      {executions.length > 0 ? (
        <>
          <Box
            sx={{
              bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"),
              borderRadius: 1.5,
              display: { xs: "none", md: "block" },
              mt: 0.5,
              order: 3,
              p: 1.5,
            }}
          >
            <Typography color="text.secondary" sx={{ display: "block", mb: 0.5 }} variant="caption">
              Executions
            </Typography>
            {renderExecutionDetails()}
          </Box>
          <Box sx={{ display: { xs: "block", md: "none" }, mt: 0.5, order: 3 }}>
            <Button
              aria-expanded={mobileExecutionsOpen}
              endIcon={mobileExecutionsOpen ? <RemoveRoundedIcon /> : <AddRoundedIcon />}
              fullWidth
              onClick={() => setMobileExecutionsOpen((current) => !current)}
              sx={{ justifyContent: "space-between", textTransform: "none" }}
              variant="outlined"
            >
              Executions ({executions.length})
            </Button>
            {mobileExecutionsOpen ? (
              <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, mt: 0.75, p: 1.5 }}>
                {renderExecutionDetails()}
              </Box>
            ) : null}
          </Box>
        </>
      ) : null}

        </Box>
      <Box
        sx={{
          bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"),
          borderRadius: 1.5,
          minHeight: { md: 330 },
          p: 1.5,
        }}
      >
        {readOnly ? (
          <Box>
            <Typography color="text.secondary" variant="caption">Trade notes</Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              {roundTrip.journal.tradeNote || "No trade note saved."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            <TextField
              fullWidth
              label="Trade notes"
              minRows={8}
              multiline
              onChange={(event) => onTradeNoteChange(event.target.value)}
              placeholder="Write what you want to remember about this trade."
              value={roundTrip.journal.tradeNote}
            />
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
              {noteState === "saved" ? <Typography color="success.main" variant="caption">Trade notes saved</Typography> : null}
              {noteState === "error" ? <Typography color="error.main" variant="caption">Trade notes could not be saved</Typography> : null}
              <Button disabled={noteState === "saving"} onClick={() => void onSaveNotes()} size="small" variant="contained">
                {noteState === "saving" ? "Saving..." : "Save trade notes"}
              </Button>
            </Stack>
          </Stack>
        )}
      </Box>
      </Box>

      {analyzer?.status === "execution_mismatch" ? (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          <Stack spacing={1}>
            <Typography sx={{ fontWeight: 850 }} variant="body2">
              Execution did not match market data, so this trade could not be analyzed.
            </Typography>
            {analyzer.executionMismatches.map((mismatch) => {
              const execution = executions.find((candidate) =>
                candidate.analysisEventKey === mismatch.executionId);
              return (
              <Box key={mismatch.executionId}>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 850 }}>Check this execution:</Box>{" "}
                  {mismatch.side === "buy" ? "Buy" : "Sell"}{" "}
                  {formatJournalAnalyticsDecimal(mismatch.quantity)}{" "}
                  {execution?.symbol ?? "shares"}{" "}
                  at {timeLabel(mismatch.executedAt, roundTrip.timezone)}, entered at {price(mismatch.enteredPrice, currency)}.
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {mismatch.kind === "execution_price_outside_candle" && mismatch.candleLow !== null && mismatch.candleHigh !== null
                    ? `Market data for the ${timeLabel(mismatch.executedAt, roundTrip.timezone)} candle ranged from ${price(mismatch.candleLow, currency)} to ${price(mismatch.candleHigh, currency)}.`
                    : `Market data did not contain the ${timeLabel(mismatch.executedAt, roundTrip.timezone)} candle.`}
                </Typography>
                {!readOnly && execution?.manualEdit ? (
                  <Box sx={{ mt: 0.5 }}>
                    <ManualExecutionEditDialog
                      execution={execution}
                      expectedAccountSelectionRef={expectedAccountSelectionRef}
                    />
                  </Box>
                ) : null}
              </Box>
              );
            })}
            <Typography variant="body2">
              Check the execution time and price, then edit and resubmit the trade.
            </Typography>
            {readOnly ? null : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
                <Button
                  disabled={mismatchConfirmationState === "saving" || mismatchConfirmationState === "confirmed"}
                  onClick={() => void confirmBrokerMismatch()}
                  size="small"
                  variant="outlined"
                >
                  {mismatchConfirmationState === "saving"
                    ? "Saving..."
                    : mismatchConfirmationState === "confirmed"
                      ? "Broker record confirmed"
                      : "My broker record is correct"}
                </Button>
                {mismatchConfirmationState === "confirmed" ? (
                  <Typography color="text.secondary" variant="caption">
                    TradersLink has been notified to review the market data.
                  </Typography>
                ) : mismatchConfirmationState === "error" ? (
                  <Typography color="error.main" variant="caption">
                    The confirmation could not be saved. Try again.
                  </Typography>
                ) : null}
              </Stack>
            )}
          </Stack>
        </Alert>
      ) : analyzer?.detailLoaded === false ? (
        <Box
          aria-live="polite"
          role="status"
          sx={{
            bgcolor: informationSurface("rgba(25, 118, 210, 0.06)"),
            borderLeft: 3,
            borderColor: analyzerDetailState === "error" ? "error.main" : "info.main",
            mt: 1.5,
            px: 1.25,
            py: 1,
          }}
        >
          <Typography
            color={analyzerDetailState === "error" ? "error.main" : "info.dark"}
            variant="caption"
          >
            {analyzerDetailState === "error"
              ? "Trade Analyzer details could not be loaded. Hide and review the trade again."
              : "Loading Trade Analyzer details…"}
          </Typography>
        </Box>
      ) : analyzer ? (
        <Box
          sx={{
            bgcolor: informationSurface("rgba(25, 118, 210, 0.08)"),
            borderRadius: 1.5,
            mt: 1.5,
            p: 1.5,
          }}
        >
          {hasVisibleAnalysis(analyzer) ? (
            <Stack spacing={1}>
              {analyzer.status === "pending" ? (
                <Typography color="info.dark" sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.info.main : undefined, fontWeight: 800 }} variant="body2">
                  Trade Analyzer is analyzing this trade.
                </Typography>
              ) : null}
              {showMoomooConnectionGuidance ? (
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                  <MoomooMarketDataConnectionPrompt compact surface="entry-exit" />
                  <MoomooMarketDataConnectionPrompt compact surface="green-to-red" />
                </Box>
              ) : null}
              {analyzer.status === "pending" ? (
                <Typography color="text.secondary" variant="caption">
                  {analysisWindowShortenedAtMarketClose
                    ? `${postExitMinutesAvailable(analyzer) ?? 0} post-exit minutes are available. The first completed update is added when the extended-hours market-data window closes.`
                    : `${postExitMinutesAvailable(analyzer) ?? 0} of 30 post-exit minutes are available. The first completed update is added once 30 minutes have formed.`}
                </Typography>
              ) : null}
              {analyzer.status === "provider_unavailable" ? (
                <Typography color="text.secondary" variant="caption">
                  The candles available so far are shown. The final post-exit update could not be retrieved.
                </Typography>
              ) : null}
              {selectedAnalysisEventId ? (
                <Typography color="text.secondary" variant="caption">
                  The selected execution is highlighted on the complete trade chart.
                </Typography>
              ) : null}
              <Box
                sx={{
                  display: "grid",
                  gap: { xs: 2, md: 0 },
                  gridTemplateColumns: { xs: "minmax(0, 1fr)", md: "repeat(2, minmax(0, 1fr))" },
                }}
              >
                  <Stack spacing={1.25} sx={{ minWidth: 0, pr: { xs: 0, md: 2 } }}>
                    <Typography sx={{ fontWeight: 900 }} variant="body1">
                      {analysisBaseTitle} ({analysisTimeframe === "5m" ? "5-minute" : "1-minute"})
                    </Typography>
                    {analysisSections.map((section) => (
                      <TradeAnalysisSectionBlock
                        key={section.title}
                        section={section}
                      />
                    ))}
                  </Stack>
                  <GreenToRedAnalysis
                    actualNetPnl={roundTrip.netPnl}
                    analysis={analyzer.greenToRed ?? UNAVAILABLE_GREEN_TO_RED_ANALYSIS}
                    currency={currency}
                    timezone={roundTrip.timezone}
                  />
              </Box>
              {finalExit && false ? (
                <Typography color="text.secondary" variant="caption">
                  {finalExit.patterns.map((pattern) => pattern.kind.replaceAll("_", " ")).join(" · ")}
                </Typography>
              ) : null}
              <Box sx={{ display: "none" }}>
                {analyzer.finalExitPaths.map((path) => (
                  <Typography key={path.minutesAfterExit} variant="caption">
                    {path.minutesAfterExit} min {path.favorableMove === null ? "N/A" : price(path.favorableMove, currency)}
                  </Typography>
                ))}
              </Box>
            </Stack>
          ) : (
            <Stack spacing={0.75}>
              {showMoomooConnectionGuidance ? (
                <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                  <MoomooMarketDataConnectionPrompt compact surface="entry-exit" />
                  <MoomooMarketDataConnectionPrompt compact surface="green-to-red" />
                </Box>
              ) : <>
                <Typography sx={{ fontWeight: 900 }} variant="body1">
                  {analysisBaseTitle} ({analysisTimeframe === "5m" ? "5-minute" : "1-minute"})
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {analyzer.status === "pending"
                    ? "Trade Analyzer is collecting market data."
                    : "Trade Analyzer could not collect the market data needed for this trade."}
                </Typography>
              </>}
            </Stack>
          )}
        </Box>
      ) : showMoomooConnectionGuidance ? (
        <Box
          sx={{
            alignItems: { xs: "flex-start", sm: "center" },
            bgcolor: informationSurface("rgba(25, 118, 210, 0.06)"),
            borderRadius: 1.5,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1,
            justifyContent: "space-between",
            mt: 1.5,
            p: 1.5,
          }}
        >
          <Typography color="info.dark" sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.info.main : undefined, fontWeight: 750 }} variant="body2">
            Connect Moomoo to analyze this trade.
          </Typography>
          <DashboardSecondaryAction href="/account/trading" size="small">
            Connect Moomoo
          </DashboardSecondaryAction>
        </Box>
      ) : null}

      {canHide ? (
        <Box sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, mt: 2 }}>
          <Button onClick={onHide} size="small" variant="outlined">
            Hide trade
          </Button>
        </Box>
      ) : null}

      </Box>
      ) : null}
    </Box>
  );
}

function WeekDayCard({
  currency,
  day,
  designPreview,
  selected,
}: {
  currency: string;
  day: DaySessionWeekDay;
  designPreview: boolean;
  selected: boolean;
}) {
  return (
    <Box
      aria-current={selected ? "date" : undefined}
      component={Link}
      href={`/trade-tracker/${day.date}${designPreview ? "?preview=design" : ""}`}
      sx={{
        bgcolor: pnlBackground(day.netPnl),
        border: 1,
        borderColor: selected ? pnlColor(day.netPnl) : "divider",
        borderRadius: 1.5,
        color: "inherit",
        flex: "0 0 154px",
        p: 1.5,
        textDecoration: "none",
        "&:hover": {
          borderColor: "primary.main",
        },
      }}
    >
      <Typography
        color="text.primary"
        sx={{ fontWeight: 850 }}
        variant="body2"
      >
        {shortDayLabel(day.date)}
      </Typography>
      <Typography
        color={pnlColor(day.netPnl)}
        sx={{
          fontFamily: "var(--font-geist-mono)",
          fontWeight: 850,
          mt: 0.75,
        }}
        variant="body1"
      >
        {money(day.netPnl, currency)}
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.25 }} variant="caption">
        {day.tradeCount} trade{day.tradeCount === 1 ? "" : "s"} ·{" "}
        {day.tickerCount} ticker{day.tickerCount === 1 ? "" : "s"}
      </Typography>
    </Box>
  );
}

export function DaySessionView({
  data,
  demoAccount = false,
  designPreview = false,
  initialAnalyzerFocus = null,
  offlineCapture,
  offlineSavedAtUtc,
  pendingExecutions = false,
  readOnly = false,
  showMoomooConnectionGuidance = false,
  topContent,
}: {
  data: DaySessionData;
  demoAccount?: boolean;
  designPreview?: boolean;
  initialAnalyzerFocus?: Readonly<{
    eventId: string | null;
    interval: DailyTradeChartInterval;
    roundTripId: string;
  }> | null;
  offlineCapture?: DailyTrackerOfflineCaptureMetadata;
  offlineSavedAtUtc?: string;
  pendingExecutions?: boolean;
  readOnly?: boolean;
  showMoomooConnectionGuidance?: boolean;
  topContent?: ReactNode;
}) {
  const router = useRouter();
  const showDemoMarketDataConnectionNotice = demoAccount &&
    (data.date === "2026-08-24" || data.date === "2026-08-25");
  const initialFocusTarget = useMemo(() => initialAnalyzerFocus
    ? data.tickers.flatMap((ticker) => ticker.roundTrips.map((roundTrip) => ({
        roundTrip,
        stableInstrumentKey: ticker.stableInstrumentKey,
      }))).find(({ roundTrip }) => roundTrip.roundTripKey === initialAnalyzerFocus.roundTripId) ?? null
    : null, [data.tickers, initialAnalyzerFocus]);
  const initialFocusTradeKey = initialFocusTarget?.roundTrip.roundTripKey ?? null;
  const [availableTags, setAvailableTags] = useState<DaySessionTradeTag[]>(data.availableTags);
  const [tradeTags, setTradeTags] = useState<Record<string, DaySessionTradeTag[]>>(
    () =>
      Object.fromEntries(
        data.tickers.flatMap((ticker) =>
          ticker.roundTrips.map((roundTrip) => [
            roundTrip.roundTripKey,
            roundTrip.journal.tags,
          ]),
        ),
      ),
  );
  const [manageTagsOpen, setManageTagsOpen] = useState(false);
  const [rules, setRules] = useState(data.rules);
  const [selectedDayCustomRuleId, setSelectedDayCustomRuleId] = useState(
    data.rules.find(
      (rule) => rule.applicability === "day" && rule.custom,
    )?.ruleId ?? "",
  );
  const [customDayRuleOpen, setCustomDayRuleOpen] = useState(false);
  const [customDayRuleName, setCustomDayRuleName] = useState("");
  const [customDayRuleStatement, setCustomDayRuleStatement] = useState("");
  const [customDayRuleState, setCustomDayRuleState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [ruleSaveErrors, setRuleSaveErrors] = useState<Record<string, string>>({});
  const [dailyNote, setDailyNote] = useState(data.dailyNote);
  const [savedDailyNote, setSavedDailyNote] = useState(data.dailyNote);
  const [openPositionTags, setOpenPositionTags] = useState<
    Record<string, DaySessionTradeTag[]>
  >(() => Object.fromEntries(data.openPositions.map((position) => [
    position.positionKey,
    position.journal.tags,
  ])));
  const [technicalNotes, setTechnicalNotes] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        [
          ...data.tickers.flatMap((ticker) =>
            ticker.roundTrips.map((roundTrip) => [
              roundTrip.roundTripKey,
              roundTrip.journal.technicalNote,
            ]),
          ),
          ...data.openPositions.map((position) => [position.positionKey, ""]),
        ],
      ),
  );
  const [tradeNotes, setTradeNotes] = useState<Record<string, string>>(
    () => initialTradeNotes(data),
  );
  const [savedTradeNotes, setSavedTradeNotes] = useState<Record<string, string>>(
    () => initialTradeNotes(data),
  );
  const [tradeNoteRevisions, setTradeNoteRevisions] = useState<
    Record<string, string | null>
  >(() =>
    Object.fromEntries(
        [
          ...data.tickers.flatMap((ticker) =>
            ticker.roundTrips.map((roundTrip) => [
              roundTrip.roundTripKey,
              roundTrip.journal.noteRevision,
            ]),
          ),
          ...data.openPositions.map((position) => [
            position.positionKey,
            position.journal.noteRevision,
          ]),
        ],
    ));
  const [tradeNoteStates, setTradeNoteStates] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [notesState, setNotesState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [dailyNotesDirty, setDailyNotesDirty] = useState(false);
  const [dirtyTradeNoteKeys, setDirtyTradeNoteKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const [dayReview, setDayReview] = useState(data.review);
  const [dayReviewState, setDayReviewState] = useState<
    "idle" | "saving" | "error"
  >("idle");
  const [dayReviewError, setDayReviewError] = useState<string | null>(null);
  const [reviewWithOtherDraftsOpen, setReviewWithOtherDraftsOpen] = useState(false);
  const hasOtherUnsavedChanges = useTradeTrackerHasUnsavedChangesExcept(
    DAY_REVIEW_AUTOSAVED_UNSAVED_SOURCES,
  );
  const firstRenderedTradeKey = initialFocusTradeKey ??
    data.tickers[0]?.roundTrips[0]?.roundTripKey ?? null;
  const [expandedTradeKey, setExpandedTradeKey] = useState<string | null>(
    () => firstRenderedTradeKey,
  );
  const [selectedAnalysisEventIds, setSelectedAnalysisEventIds] = useState<Record<string, string | null>>(() =>
    initialFocusTarget ? { [initialFocusTarget.roundTrip.roundTripKey]: initialAnalyzerFocus?.eventId ?? null } : {});
  const [selectedAnalyzerIntervals, setSelectedAnalyzerIntervals] = useState<
    Record<string, DailyTradeChartInterval>
  >(() => initialFocusTarget && initialAnalyzerFocus
    ? { [initialFocusTarget.stableInstrumentKey]: initialAnalyzerFocus.interval }
    : {});
  const [analyzerDetails, setAnalyzerDetails] = useState<
    Record<string, DaySessionTradeAnalyzer>
  >({});
  const [analyzerDetailStates, setAnalyzerDetailStates] = useState<
    Record<string, "idle" | "loading" | "error">
  >({});
  const analyzerDetailRequests = useRef(new Set<string>());
  const loadAnalyzerDetail = useCallback(async (roundTrip: DaySessionRoundTrip) => {
    const analyzer = roundTrip.analyzer;
    const versionRef = analyzer?.detailVersionRef;
    if (
      analyzer?.detailLoaded !== false ||
      !versionRef ||
      analyzerDetails[roundTrip.roundTripKey] ||
      analyzerDetailRequests.current.has(roundTrip.roundTripKey)
    ) return;
    analyzerDetailRequests.current.add(roundTrip.roundTripKey);
    setAnalyzerDetailStates((current) => ({
      ...current,
      [roundTrip.roundTripKey]: "loading",
    }));
    try {
      const query = new URLSearchParams({
        direction: roundTrip.direction,
        expectedAccountSelectionRef: data.expectedAccountSelectionRef,
        roundTripId: roundTrip.roundTripKey,
        roundTripVersionId: versionRef,
      });
      const response = await fetch(`/api/platform/trade-analyzer/trade?${query}`, {
        cache: "no-store",
      });
      const payload = await response.json() as Readonly<{
        analysis?: DaySessionTradeAnalyzer;
        status?: string;
      }>;
      if (
        !response.ok ||
        payload.status !== "ready" ||
        !payload.analysis ||
        payload.analysis.detailVersionRef !== versionRef
      ) throw new Error("analyzer_detail_unavailable");
      setAnalyzerDetails((current) => ({
        ...current,
        [roundTrip.roundTripKey]: payload.analysis!,
      }));
      setAnalyzerDetailStates((current) => ({
        ...current,
        [roundTrip.roundTripKey]: "idle",
      }));
    } catch {
      setAnalyzerDetailStates((current) => ({
        ...current,
        [roundTrip.roundTripKey]: "error",
      }));
    } finally {
      analyzerDetailRequests.current.delete(roundTrip.roundTripKey);
    }
  }, [analyzerDetails, data.expectedAccountSelectionRef]);
  useEffect(() => {
    const initiallyExpandedTrade = data.tickers
      .flatMap((ticker) => ticker.roundTrips)
      .find((roundTrip) => roundTrip.roundTripKey === firstRenderedTradeKey);
    if (initiallyExpandedTrade) void loadAnalyzerDetail(initiallyExpandedTrade);
  }, [data.tickers, firstRenderedTradeKey, loadAnalyzerDetail]);
  useEffect(() => {
    if (!initialFocusTradeKey) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`trade-${initialFocusTradeKey}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [initialFocusTradeKey]);
  const tradeCount = data.tickers.reduce(
    (count, ticker) => count + ticker.roundTrips.length,
    0,
  );
  const pendingAnalysisRoundTrips = data.tickers
    .flatMap((ticker) => ticker.roundTrips)
    .filter((roundTrip) => roundTrip.analyzer?.status === "pending");
  const pendingAnalysisCount = pendingAnalysisRoundTrips.length;
  const pendingAnalysisTiming = pendingAnalysisRoundTrips
    .map((roundTrip) => {
      const storedReadyAt = roundTrip.analyzer?.availableAtUtc
        ? Date.parse(roundTrip.analyzer.availableAtUtc)
        : Number.NaN;
      const currentPolicyReadyAt = firstAnalyzerResultAtMilliseconds(roundTrip.exitAt);
      if (!Number.isFinite(storedReadyAt)) {
        return currentPolicyReadyAt !== null
          ? Object.freeze({
              availableAtUtc: new Date(currentPolicyReadyAt).toISOString(),
              marketCloseShortenedWindow: false,
            })
          : null;
      }
      // Older queued jobs can retain a one-hour target. The worker honors the
      // current 30-minute policy, so the page must show the same honest time.
      return Object.freeze({
        availableAtUtc: currentPolicyReadyAt !== null
          ? new Date(Math.min(storedReadyAt, currentPolicyReadyAt)).toISOString()
          : new Date(storedReadyAt).toISOString(),
        marketCloseShortenedWindow: currentPolicyReadyAt !== null &&
          storedReadyAt < currentPolicyReadyAt,
      });
    })
    .filter((timing): timing is Readonly<{
      availableAtUtc: string;
      marketCloseShortenedWindow: boolean;
    }> => timing !== null)
    .reduce<Readonly<{
      availableAtUtc: string | null;
      marketCloseShortenedWindow: boolean;
    }>>((summary, timing) => Object.freeze({
      availableAtUtc: summary.availableAtUtc === null ||
        Date.parse(timing.availableAtUtc) > Date.parse(summary.availableAtUtc)
        ? timing.availableAtUtc
        : summary.availableAtUtc,
      marketCloseShortenedWindow: summary.marketCloseShortenedWindow ||
        timing.marketCloseShortenedWindow,
    }), Object.freeze({ availableAtUtc: null, marketCloseShortenedWindow: false }));
  const analyzerFailureCount = data.tickers
    .flatMap((ticker) => ticker.roundTrips.map((roundTrip) => roundTrip.analyzer))
    .filter((analyzer) => analyzer !== null &&
      analyzer.status !== "ready" && analyzer.status !== "pending" &&
      analyzer.status !== "execution_mismatch")
    .length;
  const tickerCount = data.tickers.length;
  const brokenRules = rules.filter((rule) => rule.status === "broken");
  const brokenRuleCount = new Set(brokenRules.map((rule) => `${rule.ruleId}:${rule.ruleVersion}`)).size;
  const brokenEventCount = brokenRules.reduce((count, rule) =>
    count + (rule.custom ? 1 : Math.max(1, rule.evidence?.violations.length ?? 0)), 0);
  const chartRuleEvidenceByRoundTrip = useMemo(() => {
    const byRoundTrip: Record<string, ChartRuleEvidence[]> = {};
    for (const rule of rules.filter((candidate) => candidate.status === "broken" && !candidate.custom)) {
      for (const violation of rule.evidence?.violations ?? []) {
        byRoundTrip[violation.roundTripKey] = [
          ...(byRoundTrip[violation.roundTripKey] ?? []),
          {
            label: rule.label,
            netPnl: violation.netPnl,
            occurredAt: violation.occurredAt,
            ruleId: rule.ruleId,
            triggerAt: rule.evidence?.trigger?.occurredAt ?? null,
          },
        ];
      }
    }
    return byRoundTrip;
  }, [rules]);
  const dayPresetRules = rules.filter(
    (rule) => rule.applicability === "day" && !rule.custom,
  );
  const hasDayPresetRuleResult = dayPresetRules.some(
    (rule) => rule.status === "followed" || rule.status === "broken",
  );
  const dayCustomRules = rules.filter(
    (rule) => rule.applicability === "day" && rule.custom,
  );
  const selectedDayCustomRule =
    dayCustomRules.find((rule) => rule.ruleId === selectedDayCustomRuleId) ??
    dayCustomRules[0];
  const [dailyRuleNote, setDailyRuleNote] = useState(selectedDayCustomRule?.note ?? "");
  const dayRuleTimeline = dayPresetRules.flatMap((rule) => [
    ...(rule.evidence?.trigger ? [{ at: rule.evidence.trigger.occurredAt, kind: "Trigger", rule }] : []),
    ...(rule.evidence?.violations ?? []).map((violation) => ({ at: violation.occurredAt, kind: "Broken event", rule })),
  ]).sort((left, right) => left.at.localeCompare(right.at));

  function updateTradeNote(targetKey: string, tradeNote: string): void {
    setTradeNotes((current) => current[targetKey] === tradeNote
      ? current
      : { ...current, [targetKey]: tradeNote });
    setTradeNoteStates((current) => current[targetKey] === "idle"
      ? current
      : { ...current, [targetKey]: "idle" });
    setDirtyTradeNoteKeys((current) => {
      const next = new Set(current);
      if (tradeNote === (savedTradeNotes[targetKey] ?? "")) next.delete(targetKey);
      else next.add(targetKey);
      return next;
    });
  }

  function updateDailyNote(field: DailyNoteTextField, value: string): void {
    const next = { ...dailyNote, [field]: value };
    setDailyNote(next);
    setNotesState("idle");
    setDailyNotesDirty(!dailyNoteTextMatches(next, savedDailyNote));
  }

  function clearRuleSaveError(rule: DaySessionRule): void {
    const key = ruleSaveErrorKey(rule);
    setRuleSaveErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  function showRuleSaveError(rule: DaySessionRule, error: unknown): void {
    const key = ruleSaveErrorKey(rule);
    setRuleSaveErrors((current) => ({
      ...current,
      [key]: ruleSaveFailure(error),
    }));
  }

  async function createCustomDayRule(): Promise<void> {
    if (readOnly) return;
    if (!customDayRuleName.trim() || !customDayRuleStatement.trim()) return;
    setCustomDayRuleState("saving");
    try {
      const dashboard = await api<{
        manualRules: Array<{
          reviewScope: "day_session" | "trade" | "both";
          ruleId: string;
          ruleVersionId: string;
          status: "active" | "paused" | "retired";
          title: string;
          versionOrdinal: string;
        }>;
      }>("/api/intelligence/rules", {
        body: JSON.stringify({
          action: "create_manual",
          category: "process",
          expectedAccountSelectionRef: data.expectedAccountSelectionRef,
          isFocus: true,
          reviewScope: "day_session",
          statement: customDayRuleStatement.trim(),
          title: customDayRuleName.trim(),
        }),
        method: "POST",
      });
      const created = [...dashboard.manualRules]
        .reverse()
        .find(
          (rule) =>
            rule.status === "active" &&
            rule.reviewScope === "day_session" &&
            rule.title === customDayRuleName.trim(),
        );
      if (!created) throw new Error("The custom day rule was not returned.");
      const dayRule: DaySessionRule = {
        applicability: "day",
        custom: true,
        evidence: null,
        label: created.title,
        note: "",
        revision: null,
        ruleId: created.ruleId,
        ruleVersion: created.ruleVersionId,
        status: "not-reviewed",
        targetLabel: null,
        targetRoundTripKey: null,
      };
      setRules((current) => [...current, dayRule]);
      setSelectedDayCustomRuleId(dayRule.ruleId);
      setCustomDayRuleName("");
      setCustomDayRuleStatement("");
      setCustomDayRuleState("idle");
      setCustomDayRuleOpen(false);
    } catch {
      setCustomDayRuleState("error");
    }
  }

  async function saveRuleStatus(
    selectedRule: DaySessionRule,
    status: DaySessionRule["status"],
  ): Promise<void> {
    if (readOnly) return;
    clearRuleSaveError(selectedRule);
    if (
      designPreview ||
      (pendingExecutions && selectedRule.applicability === "trade")
    ) {
      setRules((current) =>
        current.map((rule) =>
          rule.ruleId === selectedRule.ruleId &&
          rule.ruleVersion === selectedRule.ruleVersion &&
          rule.targetRoundTripKey === selectedRule.targetRoundTripKey
            ? { ...rule, status }
            : rule,
        ),
      );
      return;
    }
    try {
      const saved = await api<{
        revision: string;
        status: DaySessionRule["status"];
      }>(
        `/api/intelligence/day-session/${encodeURIComponent(data.date)}/rule-reviews`,
        {
          body: JSON.stringify({
            applicability: selectedRule.applicability,
            expectedAccountSelectionRef: data.expectedAccountSelectionRef,
            expectedRevision: selectedRule.revision,
            ruleId: selectedRule.ruleId,
            ruleVersion: selectedRule.ruleVersion,
            status,
            targetRoundTripKey: selectedRule.targetRoundTripKey,
          }),
          method: "PUT",
        },
      );
      setRules((current) =>
        current.map((rule) =>
          rule.ruleId === selectedRule.ruleId &&
          rule.ruleVersion === selectedRule.ruleVersion &&
          rule.targetRoundTripKey === selectedRule.targetRoundTripKey
            ? { ...rule, revision: saved.revision, status: saved.status }
            : rule,
        ),
      );
    } catch (error) {
      showRuleSaveError(selectedRule, error);
    }
  }

  async function saveRuleNote(selectedRule: DaySessionRule, note: string): Promise<void> {
    if (readOnly) return;
    clearRuleSaveError(selectedRule);
    if (designPreview || (pendingExecutions && selectedRule.applicability === "trade")) {
      setRules((current) => current.map((rule) =>
        rule.ruleId === selectedRule.ruleId && rule.ruleVersion === selectedRule.ruleVersion && rule.targetRoundTripKey === selectedRule.targetRoundTripKey
          ? { ...rule, note }
          : rule));
      return;
    }
    try {
      const saved = await api<{ note: string; revision: string; status: DaySessionRule["status"] }>(
        `/api/intelligence/day-session/${encodeURIComponent(data.date)}/rule-reviews`,
        {
          method: "PUT",
          body: JSON.stringify({
            applicability: selectedRule.applicability,
            expectedAccountSelectionRef: data.expectedAccountSelectionRef,
            expectedRevision: selectedRule.revision,
            note,
            ruleId: selectedRule.ruleId,
            ruleVersion: selectedRule.ruleVersion,
            status: selectedRule.status,
            targetRoundTripKey: selectedRule.targetRoundTripKey,
          }),
        },
      );
      setRules((current) => current.map((rule) =>
        rule.ruleId === selectedRule.ruleId && rule.ruleVersion === selectedRule.ruleVersion && rule.targetRoundTripKey === selectedRule.targetRoundTripKey
          ? { ...rule, note: saved.note, revision: saved.revision, status: saved.status }
          : rule));
    } catch (error) {
      showRuleSaveError(selectedRule, error);
    }
  }

  async function saveTradeNotes(roundTripKey: string): Promise<boolean> {
    if (readOnly) return false;
    setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saving" }));
    if (designPreview || pendingExecutions) {
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saved" }));
      setSavedTradeNotes((current) => ({
        ...current,
        [roundTripKey]: tradeNotes[roundTripKey] ?? "",
      }));
      setDirtyTradeNoteKeys((current) => {
        const next = new Set(current);
        next.delete(roundTripKey);
        return next;
      });
      return true;
    }
    try {
      const saved = await api<{
        revision: string;
        technicalNote: string;
        tradeNote: string;
      }>(`/api/intelligence/trades/${encodeURIComponent(roundTripKey)}/notes`, {
        body: JSON.stringify({
          expectedAccountSelectionRef: data.expectedAccountSelectionRef,
          expectedRevision: tradeNoteRevisions[roundTripKey] ?? null,
          technicalNote: technicalNotes[roundTripKey] ?? "",
          tradeNote: tradeNotes[roundTripKey] ?? "",
        }),
        method: "PUT",
      });
      setTechnicalNotes((current) => ({
        ...current,
        [roundTripKey]: saved.technicalNote,
      }));
      setTradeNotes((current) => ({
        ...current,
        [roundTripKey]: saved.tradeNote,
      }));
      setSavedTradeNotes((current) => ({
        ...current,
        [roundTripKey]: saved.tradeNote,
      }));
      setTradeNoteRevisions((current) => ({
        ...current,
        [roundTripKey]: saved.revision,
      }));
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saved" }));
      setDirtyTradeNoteKeys((current) => {
        const next = new Set(current);
        next.delete(roundTripKey);
        return next;
      });
      return true;
    } catch {
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "error" }));
      return false;
    }
  }

  async function saveDailyNotes(): Promise<boolean> {
    if (readOnly) return false;
    setNotesState("saving");
    if (designPreview) {
      setNotesState("saved");
      setSavedDailyNote(dailyNote);
      setDailyNotesDirty(false);
      return true;
    }
    try {
      const saved = await api<DaySessionDailyNote>(
        `/api/intelligence/day-session/${encodeURIComponent(data.date)}/notes`,
        {
          body: JSON.stringify({
            ...dailyNote,
            expectedAccountSelectionRef: data.expectedAccountSelectionRef,
            expectedRevision: dailyNote.revision,
          }),
          method: "PUT",
        },
      );
      setDailyNote(saved);
      setSavedDailyNote(saved);
      setNotesState("saved");
      setDailyNotesDirty(false);
      return true;
    } catch {
      setNotesState("error");
      return false;
    }
  }

  const hasUnsavedNotes = dailyNotesDirty || dirtyTradeNoteKeys.size > 0;
  const hasUnsavedDayRuleNote = dailyRuleNote !== (selectedDayCustomRule?.note ?? "");
  const hasUnsavedCustomDayRule = customDayRuleOpen && (
    customDayRuleName.trim().length > 0 || customDayRuleStatement.trim().length > 0
  );
  useTradeTrackerUnsavedChanges(
    "daily-trade-tracker:day-session-notes",
    hasUnsavedNotes,
  );
  useTradeTrackerUnsavedChanges(
    "daily-trade-tracker:day-rule-note",
    hasUnsavedDayRuleNote,
  );
  useTradeTrackerUnsavedChanges(
    "daily-trade-tracker:custom-day-rule",
    hasUnsavedCustomDayRule,
  );

  async function savePendingNotes(): Promise<boolean> {
    const saves: Array<Promise<boolean>> = [];
    if (dailyNotesDirty) saves.push(saveDailyNotes());
    for (const roundTripKey of dirtyTradeNoteKeys) {
      saves.push(saveTradeNotes(roundTripKey));
    }
    return (await Promise.all(saves)).every(Boolean);
  }

  async function saveDayReview(status: "reviewed" | "incomplete"): Promise<void> {
    if (readOnly || dayReviewState === "saving") return;
    if (status === "reviewed" && dayReview.unclassifiedOpenPositionCount > 0) {
      setDayReviewError("Choose a type for each open position before marking this day reviewed.");
      setDayReviewState("error");
      return;
    }
    setDayReviewState("saving");
    setDayReviewError(null);
    try {
      if (!(await savePendingNotes())) {
        setDayReviewError("Your notes could not all be saved. Your day was not marked reviewed.");
        setDayReviewState("error");
        return;
      }
      const response = await fetch(
        `/api/platform/journal/trading-days/${encodeURIComponent(data.date)}/review`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef: data.expectedAccountSelectionRef,
            expectedRevision: dayReview.revision,
            idempotencyKey: crypto.randomUUID(),
            status,
          }),
          headers: {
            "Content-Type": "application/json",
            [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
          },
          method: "PUT",
        },
      );
      const body = await response.json() as {
        code?: string;
        result?: {
          revision: number;
          status: "reviewed" | "incomplete";
          updatedAtUtc: string;
        };
        status?: string;
      };
      if (!response.ok || body.status !== "ready" || !body.result) {
        throw new Error(body.code ?? "save_failed");
      }
      setDayReview((current) => ({
        ...current,
        revision: body.result!.revision,
        status: body.result!.status,
        updatedAtUtc: body.result!.updatedAtUtc,
      }));
      setDayReviewState("idle");
      setDayReviewError(null);
      router.refresh();
    } catch {
      setDayReviewError("The day review could not be saved. Your Trade Tracker entries are unchanged.");
      setDayReviewState("error");
    }
  }

  function requestReviewedStatus(): void {
    if (hasOtherUnsavedChanges) {
      setReviewWithOtherDraftsOpen(true);
      return;
    }
    void saveDayReview("reviewed");
  }

  const visibleOpenPositions = data.openPositions.filter((position) =>
    data.executionActivity.some((execution) =>
      execution.roundTripKeys.includes(position.positionKey)));

  return (
    <DashboardPage>
      {offlineCapture ? (
        <DailyTrackerOfflineSavedViewCapture
          data={data}
          metadata={offlineCapture}
        />
      ) : null}
      <Box
        sx={{
          alignItems: { md: "flex-start" },
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
        }}
      >
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            Trade Tracker
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            Daily Trade Tracker
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 900, mt: 1 }} variant="body2">
            The Daily Trade Tracker helps you review one trading day and the
            trades you took on that particular day. Add tags, notes and track rules
            for each trade. Add notes and track rules that apply to the trading day
            as a whole.
          </Typography>
          <Typography color="error.main" sx={{ fontWeight: 700, maxWidth: 900, mt: 1 }} variant="body2">
            Notes, rules, tags and trade information will appear below after you submit your executions.
          </Typography>
        </Box>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifySelf: { md: "end" } }}>
          <FeatureHelpLink href="/help/daily-trade-tracker" label="Daily Trade Tracker" size="medium" />
          <Button
            disabled={Boolean(offlineSavedAtUtc)}
            onClick={() => openTraderLinkAiChat({
              dailyContext: Object.freeze({
                kind: "daily_review",
                tradingDate: data.date,
                currency: data.currency,
              }),
            })}
            startIcon={<ChatBubbleOutlineRoundedIcon />}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
            variant="outlined"
          >
            Ask about this day
          </Button>
        </Stack>
      </Box>
      {offlineSavedAtUtc ? (
        <Chip
          color="primary"
          label={`Offline · Last updated ${savedViewTime(offlineSavedAtUtc)}`}
          size="small"
          sx={{ alignSelf: "flex-start" }}
          variant="outlined"
        />
      ) : null}
      {pendingAnalysisCount > 0 ? (
        <Box
          aria-live="polite"
          role="status"
          sx={{
            bgcolor: informationSurface("rgba(25, 118, 210, 0.12)"),
            border: 1,
            borderColor: "info.main",
            borderRadius: 1.5,
            px: { xs: 1.5, sm: 2 },
            py: 1.5,
          }}
        >
          <Typography color="info.dark" sx={{ color: (theme) => theme.palette.mode === "dark" ? theme.palette.info.main : undefined, fontWeight: 850 }} variant="body2">
            Trade Analyzer is analyzing your submitted {pendingAnalysisCount === 1 ? "trade" : "trades"}.
          </Typography>
          <Typography color="text.secondary" sx={{ display: "block", mt: 0.4 }} variant="caption">
            You can keep working here or leave the page. A notification will be sent when the analysis is ready.
          </Typography>
          {pendingAnalysisTiming.availableAtUtc ? (
            <Typography color="text.secondary" sx={{ display: "block", mt: 0.35 }} variant="caption">
              Analysis will begin after {timeLabel(pendingAnalysisTiming.availableAtUtc, "America/New_York")} Eastern Time, when the {pendingAnalysisTiming.marketCloseShortenedWindow
                ? "available post-exit market-data window"
                : "30-minute post-exit market-data window"} is complete.
            </Typography>
          ) : null}
        </Box>
      ) : null}
      {analyzerFailureCount > 0 ? (
        <Alert severity="error">
          Trade Analyzer could not collect the market data needed for {analyzerFailureCount === 1 ? "one trade" : `${analyzerFailureCount} trades`}. We have notified the TradersLink team.
        </Alert>
      ) : null}
      {topContent}
      {readOnly ? (
        <Alert severity="info">
          {offlineSavedAtUtc
            ? "Offline trade entry is available. Reconnect to change saved notes, rules, tags, reviews or executions, and to load Trade Analyzer market data."
            : "This historical trading day is read-only. Its saved Trade Tracker rules, tags, and notes are shown without allowing retrospective edits."}
        </Alert>
      ) : null}
      <DashboardPanel action={<FeatureHelpLink href="/help/daily-trade-tracker/getting-started#open-and-navigate" label="week navigation" />} title="This week">
        <Box
          sx={{
            alignItems: { md: "center" },
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
            mt: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <HorizontalScrollHint label="Swipe sideways to see the full week" />
            <Stack
              direction="row"
              spacing={1}
              sx={{
                WebkitOverflowScrolling: "touch",
                "&::-webkit-scrollbar": { display: "none" },
                minWidth: 0,
                overflowX: "auto",
                overscrollBehaviorX: "contain",
                pb: 0.75,
                scrollbarWidth: "none",
              }}
            >
              {data.week.days.map((day) => (
                <WeekDayCard
                  currency={data.currency}
                  day={day}
                  designPreview={designPreview}
                  key={day.date}
                  selected={day.date === data.date}
                />
              ))}
            </Stack>
          </Box>
          <Box
            sx={{
              bgcolor: pnlBackground(data.week.netPnl),
              borderRadius: 1.5,
              minWidth: { md: 220 },
              p: 1.75,
            }}
          >
            <Typography color="text.secondary" variant="caption">
              Week total
            </Typography>
            <Typography
              color={pnlColor(data.week.netPnl)}
              sx={{
                fontFamily: "var(--font-geist-mono)",
                fontWeight: 900,
                mt: 0.25,
              }}
              variant="h5"
            >
              {money(data.week.netPnl, data.currency)}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.35 }} variant="caption">
              {data.week.tradeCount} trades · {data.week.tickerCount} tickers ·{" "}
              {data.week.days.length} traded days
            </Typography>
          </Box>
        </Box>
      </DashboardPanel>

      <DashboardPanel
        action={
          <TradeTrackerDateNavigation
            date={data.date}
            dates={data.availableSessionDates}
            designPreview={designPreview}
            nextDate={data.nextSessionDate}
            previousDate={data.previousSessionDate}
          />
        }
        eyebrow="Trading day"
        title={dateLabel(data.date)}
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(5, minmax(0, 1fr))",
            },
            mt: 2.5,
          }}
        >
          {[
            ["P/L", money(data.netPnl, data.currency), pnlColor(data.netPnl)],
            ["Trades", String(tradeCount), "text.primary"],
            ["Tickers", String(tickerCount), "text.primary"],
            [
              "Rules broken",
              String(brokenRuleCount),
              "error.main",
            ],
            ["Broken events", String(brokenEventCount), "error.main"],
          ].map(([label, value, color]) => (
            <Box
              key={label}
              sx={{
                bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"),
                borderRadius: 1.5,
                p: 2,
              }}
            >
              <Typography color="text.secondary" variant="caption">
                {label}
              </Typography>
              <Typography
                color={color}
                sx={{ fontWeight: 850, mt: 0.35 }}
                variant="h5"
              >
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DashboardPanel>

      <Stack spacing={3}>
        {data.tickers.map((ticker) => {
          const readyTrade = ticker.roundTrips.find((roundTrip) =>
            roundTrip.analyzer?.status === "ready" ||
            roundTrip.analyzer?.status === "provider_unavailable",
          ) ?? null;
          const showDemoCandleDataInsufficientNotice = demoAccount &&
            ["FABC", "FAMI", "GCTK"].includes(ticker.symbol) && !readyTrade;
          const openTradeSource = ticker.roundTrips.find((roundTrip) =>
            roundTrip.roundTripKey === expandedTradeKey,
          ) ?? null;
          const openTrade = openTradeSource
            ? {
                ...openTradeSource,
                analyzer: analyzerDetails[openTradeSource.roundTripKey] ??
                  openTradeSource.analyzer,
              }
            : null;
          const selectedInterval = selectedAnalyzerIntervals[ticker.stableInstrumentKey] ?? "1m";
          const reviewTrade = (roundTripKey: string) => {
            const roundTrip = ticker.roundTrips.find((candidate) =>
              candidate.roundTripKey === roundTripKey);
            if (roundTrip) void loadAnalyzerDetail(roundTrip);
            setExpandedTradeKey(roundTripKey);
          };
          const hideTrade = () => {
            setExpandedTradeKey(null);
          };
          return (
          <Card
            key={ticker.stableInstrumentKey}
            sx={{ border: (theme) => `2px solid ${theme.palette.mode === "dark" ? theme.palette.divider : "#000"}`, overflow: "hidden" }}
            variant="outlined"
          >
            {showDemoMarketDataConnectionNotice && !readyTrade ? (
              <Box sx={{ borderBottom: 1, borderColor: "divider", p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" variant="body2">
                  If your account isn&apos;t connected to market data trades are not analyzed and the chart will not appear. You can still review its executions, profit or loss, notes, tags, rules, and daily performance. The Daily Trade Tracker remains useful for finding patterns in how you planned, managed, and reviewed your trades.
                </Typography>
              </Box>
            ) : null}
            {showDemoCandleDataInsufficientNotice ? (
              <Box sx={{ borderBottom: 1, borderColor: "divider", p: { xs: 1.5, sm: 2 } }}>
                <Typography color="text.secondary" variant="body2">
                  Candle data was insufficient for this ticker. No trades were analyzed.
                </Typography>
              </Box>
            ) : null}
            {openTrade?.analyzer && hasVisibleAnalysis(openTrade.analyzer) ? (
              <DailyTradeAnalyzerChart
                analysis={openTrade.analyzer}
                currency={data.currency}
                direction={openTrade.direction}
                interval={selectedInterval}
                onIntervalChange={(interval) => {
                  setSelectedAnalyzerIntervals((current) => ({
                    ...current,
                    [ticker.stableInstrumentKey]: interval,
                  }));
                }}
                ruleEvidence={chartRuleEvidenceByRoundTrip[openTrade.roundTripKey] ?? EMPTY_CHART_RULE_EVIDENCE}
                selectedEventId={selectedAnalysisEventIds[openTrade.roundTripKey] ?? null}
                symbol={ticker.symbol}
                tradeLabelColor={pnlColor(openTrade.netPnl) === "success.main" ? "success" : "error"}
                tradeNumber={ticker.roundTrips.findIndex((roundTrip) =>
                  roundTrip.roundTripKey === openTrade.roundTripKey,
                ) + 1}
              />
            ) : null}
            {showMoomooConnectionGuidance ? (
              <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                <MoomooMarketDataConnectionPrompt surface="chart" />
              </Box>
            ) : null}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "240px minmax(0, 1fr)" },
              }}
            >
              <Box
                sx={{
                  bgcolor: pnlBackground(ticker.netPnl),
                  borderBottom: { xs: 1, md: 0 },
                  borderColor: "divider",
                  borderRight: { md: 1 },
                  p: { xs: 2, md: 2.5 },
                }}
              >
                <Typography
                  color="text.secondary"
                  sx={{ display: "block", fontWeight: 850, mb: 0.5 }}
                  variant="overline"
                >
                  {ticker.roundTrips.length} trade
                  {ticker.roundTrips.length === 1 ? "" : "s"}
                </Typography>
                <Typography
                  sx={{ color: "inherit", fontWeight: 900 }}
                  variant="h4"
                >
                  {ticker.symbol}
                </Typography>
                <Typography
                  color={pnlColor(ticker.netPnl)}
                  sx={{
                    bgcolor: pnlBackground(ticker.netPnl),
                    borderRadius: 1,
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 850,
                    px: 1,
                    py: 0.4,
                    width: "fit-content",
                    mt: 1,
                  }}
                  variant="h6"
                >
                  {money(ticker.netPnl, data.currency)}
                </Typography>
                <Typography
                  color={pnlColor(ticker.gainLossPercent ?? "0")}
                  sx={{
                    bgcolor: pnlBackground(ticker.gainLossPercent ?? "0"),
                    borderRadius: 1,
                    fontSize: { xs: "0.875rem", md: "1.15rem" },
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 900,
                    mt: 0.5,
                    px: 1,
                    py: 0.35,
                    width: "fit-content",
                  }}
                  variant="body2"
                >
                  {percentage(ticker.gainLossPercent)}
                </Typography>
              </Box>
              <Stack divider={<Divider flexItem sx={{ borderBottomWidth: 2, borderColor: (theme) => theme.palette.mode === "dark" ? theme.palette.divider : "rgba(1, 30, 86, 0.32)" }} />}>
                {ticker.roundTrips.map((roundTrip, index) => {
                  const analyzer = analyzerDetails[roundTrip.roundTripKey] ?? roundTrip.analyzer;
                  return (
                  <TradeReview
                    analyzer={analyzer}
                    analyzerDetailState={analyzerDetailStates[roundTrip.roundTripKey] ?? "idle"}
                    analysisInterval={openTrade?.roundTripKey === roundTrip.roundTripKey
                      ? selectedInterval
                      : "1m"}
                    availableTags={availableTags}
                    canHide={roundTrip.roundTripKey === expandedTradeKey}
                    currency={data.currency}
                    designPreview={designPreview || pendingExecutions}
                    expanded={roundTrip.roundTripKey === expandedTradeKey}
                    executions={data.executionActivity.filter((execution) =>
                      execution.roundTripKeys.includes(roundTrip.roundTripKey),
                    )}
                    expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                    key={roundTrip.roundTripKey}
                    onCatalogChange={setAvailableTags}
                    onHide={hideTrade}
                    onManageTags={
                      designPreview || readOnly
                        ? undefined
                        : () => setManageTagsOpen(true)
                    }
                    noteState={tradeNoteStates[roundTrip.roundTripKey] ?? "idle"}
                    onOpen={() => reviewTrade(roundTrip.roundTripKey)}
                    onRuleStatusChange={saveRuleStatus}
                    onRuleNoteSave={saveRuleNote}
                    onSaveNotes={async () => {
                      await saveTradeNotes(roundTrip.roundTripKey);
                    }}
                    onSelectAnalysisEvent={(eventId) => {
                      reviewTrade(roundTrip.roundTripKey);
                      setSelectedAnalysisEventIds((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: eventId,
                      }));
                    }}
                    onTagsChange={(tags) =>
                      setTradeTags((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: tags,
                      }))
                    }
                    onTradeNoteChange={(tradeNote) => {
                      updateTradeNote(roundTrip.roundTripKey, tradeNote);
                    }}
                    readOnly={readOnly}
                    roundTrip={{
                      ...roundTrip,
                      journal: {
                        ...roundTrip.journal,
                        noteRevision:
                          tradeNoteRevisions[roundTrip.roundTripKey] ?? null,
                        technicalNote:
                          technicalNotes[roundTrip.roundTripKey] ?? "",
                        tradeNote: tradeNotes[roundTrip.roundTripKey] ?? "",
                      },
                    }}
                    ruleSaveError={ruleSaveErrors[`trade:${roundTrip.roundTripKey}`] ?? null}
                    sessionDate={data.date}
                    selectedAnalysisEventId={selectedAnalysisEventIds[roundTrip.roundTripKey] ?? null}
                    showMoomooConnectionGuidance={showMoomooConnectionGuidance}
                    tags={tradeTags[roundTrip.roundTripKey] ?? []}
                    tradeNumber={index + 1}
                    tradeRules={rules.filter(
                      (rule) =>
                        rule.applicability === "trade" &&
                        rule.targetRoundTripKey === roundTrip.roundTripKey,
                    )}
                  />
                  );
                })}
              </Stack>
            </Box>
          </Card>
          );
        })}
      </Stack>

      {visibleOpenPositions.length > 0 ? (
        <Stack spacing={2}>
          {visibleOpenPositions.map((position) => {
            const activeSwing = position.style?.openStatus === "swing";
            return (
            <Card
              key={position.positionKey}
              sx={{ borderColor: activeSwing ? "primary.light" : "warning.light" }}
              variant="outlined"
            >
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "240px minmax(0, 1fr)",
                  },
                }}
              >
                <Box
                  sx={{
                    bgcolor: warningSurface("rgba(237, 108, 2, 0.09)"),
                    borderBottom: { xs: 1, md: 0 },
                    borderColor: "divider",
                    borderRight: { md: 1 },
                    p: { xs: 2, md: 2.5 },
                  }}
                >
                  <Chip
                    color={activeSwing ? "primary" : "warning"}
                    label={activeSwing ? "Active swing" : "Open position"}
                    size="small"
                    sx={{ fontWeight: 800 }}
                  />
                  <Typography sx={{ fontWeight: 900, mt: 1 }} variant="h4">
                    {position.symbol}
                  </Typography>
                  <Chip
                    label={position.direction === "long" ? "Long" : "Short"}
                    size="small"
                    sx={{ mt: 1.25 }}
                    variant="outlined"
                  />
                  <Typography color="text.secondary" sx={{ mt: 2 }} variant="caption">
                    Average entry
                  </Typography>
                  <Typography sx={{ fontFamily: "var(--font-geist-mono)", fontWeight: 850, mt: 0.25 }} variant="body1">
                    {price(position.averageEntryPrice, data.currency)}
                  </Typography>
                  <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="caption">
                    Opened
                  </Typography>
                  <Typography sx={{ fontWeight: 750, mt: 0.25 }} variant="body2">
                    {timeLabel(position.openedAt, position.timezone)}
                  </Typography>
                </Box>
                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                        gridTemplateColumns: "minmax(0, 1fr)",
                    }}
                  >
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Remaining quantity
                      </Typography>
                      <Typography sx={{ fontWeight: 850, mt: 0.35 }} variant="h6">
                        {formatJournalAnalyticsDecimal(position.remainingQuantity)} shares
                      </Typography>
                    </Box>
                  </Box>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.4fr) minmax(260px, 0.8fr)" },
                      mt: 2,
                    }}
                  >
                    <Stack spacing={1.5}>
                      {activeSwing ? null : readOnly ? (
                        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                          {position.journal.tags.length > 0 ? position.journal.tags.map((tag) => (
                            <Chip key={tag.tagId} label={tag.name} size="small" />
                          )) : <Typography color="text.secondary" variant="body2">No trade tags saved.</Typography>}
                        </Stack>
                      ) : (
                        <TradeTagEditor
                          availableTags={availableTags}
                          disabled={false}
                          designPreview={designPreview || pendingExecutions}
                          expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                          onCatalogChange={setAvailableTags}
                          onManageTags={designPreview ? undefined : () => setManageTagsOpen(true)}
                          onTagsChange={(tags) => setOpenPositionTags((current) => ({
                            ...current,
                            [position.positionKey]: tags,
                          }))}
                          sessionDate={data.date}
                          tags={openPositionTags[position.positionKey] ?? position.journal.tags}
                          targetKey={position.positionKey}
                          targetKind="round-trip"
                        />
                      )}

                      {position.executions.length > 0 ? (
                        <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, p: 1.5 }}>
                          <Typography color="text.secondary" sx={{ display: "block", mb: 0.5 }} variant="caption">
                            Executions
                          </Typography>
                          <Stack divider={<Divider flexItem />}>
                            {position.executions.map((execution) => (
                              <Box
                                key={execution.executionKey}
                                sx={{
                                  alignItems: { sm: "center" },
                                  display: "grid",
                                  gap: 0.75,
                                  gridTemplateColumns: { xs: "1fr 1fr", sm: "110px 80px minmax(88px, 1fr) 100px auto" },
                                  py: 0.9,
                                }}
                              >
                                <Typography variant="body2">{timeLabel(execution.executedAt, position.timezone, true)}</Typography>
                                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
                                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                                  {formatJournalAnalyticsDecimal(execution.quantity)} shares
                                </Typography>
                                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                                  {price(execution.price, data.currency)}
                                </Typography>
                                {readOnly ? null : (
                                  <ManualExecutionEditDialog
                                    execution={execution}
                                    expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                                  />
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ) : null}

                      {!activeSwing && position.style?.openStatus === "unplanned_hold" ? (
                        <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, p: 1.5 }}>
                          <Typography color="text.secondary" variant="caption">Trade rules</Typography>
                          {rules.filter((rule) => rule.applicability === "trade" && rule.targetRoundTripKey === position.positionKey).length === 0 ? (
                            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">No active trade rules.</Typography>
                          ) : (
                            <Stack spacing={0.75} sx={{ mt: 1 }}>
                              {rules.filter((rule) => rule.applicability === "trade" && rule.targetRoundTripKey === position.positionKey).map((rule) => (
                                <Typography key={rule.ruleId} variant="body2">{rule.label}</Typography>
                              ))}
                            </Stack>
                          )}
                        </Box>
                      ) : null}

                      {activeSwing && position.positionRef ? (
                        <PositionStyleControl
                            closed={false}
                            expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                            mode="mark-failed-swing"
                            positionRef={position.positionRef}
                            sourceUi="day_trade_tracker"
                            style={position.style}
                        />
                      ) : readOnly ? (
                        <Typography color="text.secondary" variant="body2">Position type changes are unavailable in the design preview.</Typography>
                      ) : position.positionRef ? (
                        <PositionStyleControl
                          closed={false}
                          expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                          positionRef={position.positionRef}
                          sourceUi="day_trade_tracker"
                          style={position.style}
                        />
                      ) : (
                        <Alert severity="warning">This position cannot be classified until its current trade record is available.</Alert>
                      )}
                    </Stack>

                    {activeSwing && position.positionRef && position.style ? (
                      <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, minHeight: { md: 280 }, p: 1.5 }}>
                        <Typography color="text.secondary" variant="caption">Swing plan</Typography>
                        <Box sx={{ mt: 0.75 }}>
                          <SwingPositionPlanEditor
                            expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                            plan={position.style.swingPlan}
                            positionRef={position.positionRef}
                            revision={position.style.revision}
                            sourceUi="day_trade_tracker"
                          />
                        </Box>
                      </Box>
                    ) : <Box sx={{ bgcolor: softNavySurface("rgba(1, 30, 86, 0.035)"), borderRadius: 1.5, minHeight: { md: 280 }, p: 1.5 }}>
                      <Typography color="text.secondary" variant="caption">Trade notes</Typography>
                      {readOnly ? (
                        <Typography sx={{ mt: 0.5, whiteSpace: "pre-wrap" }} variant="body2">
                          {position.journal.tradeNote || "No trade note saved."}
                        </Typography>
                      ) : (
                        <Stack spacing={1.25} sx={{ mt: 0.75 }}>
                          <TextField
                            fullWidth
                            label="Trade notes"
                            minRows={8}
                            multiline
                            onChange={(event) => updateTradeNote(position.positionKey, event.target.value)}
                            placeholder="Write what you want to remember about this trade."
                            value={tradeNotes[position.positionKey] ?? ""}
                          />
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
                            {tradeNoteStates[position.positionKey] === "saved" ? <Typography color="success.main" variant="caption">Trade notes saved</Typography> : null}
                            {tradeNoteStates[position.positionKey] === "error" ? <Typography color="error.main" variant="caption">Trade notes could not be saved</Typography> : null}
                            <Button
                              disabled={tradeNoteStates[position.positionKey] === "saving"}
                              onClick={() => void saveTradeNotes(position.positionKey)}
                              size="small"
                              variant="contained"
                            >
                              {tradeNoteStates[position.positionKey] === "saving" ? "Saving..." : "Save trade notes"}
                            </Button>
                          </Stack>
                        </Stack>
                      )}
                    </Box>
                    }
                  </Box>
                </Box>
              </Box>
            </Card>
            );
          })}
        </Stack>
      ) : null}

      <Box sx={{ mt: { xs: 4, md: 0 } }}>
      <DashboardPanel title="Daily Trading Rules">
        <Typography color="text.secondary" sx={{ display: "block", mt: 1.25 }} variant="body2">
          Track rules that apply to your day here. Track rules that apply to your trades in the ticker cards.
        </Typography>
        {readOnly ? (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {rules.filter((rule) => rule.applicability === "day").length === 0 ? (
              <Typography color="text.secondary" variant="body2">No active day rules.</Typography>
            ) : rules.filter((rule) => rule.applicability === "day").map((rule) => (
              <Stack direction="row" key={rule.ruleId} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">{rule.label}</Typography>
                {(() => {
                  const presentation = statusPresentation(rule.status);
                  return presentation ? (
                    <Chip
                      color={presentation.color}
                      icon={presentation.icon ? <presentation.icon /> : undefined}
                      label={presentation.label}
                      size="small"
                    />
                  ) : null;
                })()}
              </Stack>
            ))}
          </Stack>
        ) : (
          <>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            mt: 1.5,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            {hasDayPresetRuleResult ? (
              <>
                <Typography
                  color="text.secondary"
                  sx={{ display: "block", mb: 0.75 }}
                  variant="caption"
                >
                  Preset day rules
                </Typography>
                <Stack divider={<Divider flexItem />} spacing={0}>
                  {dayPresetRules.map((rule) => <PresetRuleRow currency={data.currency} key={`${rule.ruleId}:${rule.ruleVersion}`} rule={rule} timezone={data.timezone} />)}
                </Stack>
              </>
            ) : dayPresetRules.length > 0 ? (
              <Typography color="text.secondary" variant="body2">
                {data.executionActivity.length === 0
                  ? "No trades were entered for this day, so there are no daily rule results to show yet."
                  : "No preset daily rules were recorded as followed or broken for this day."}
              </Typography>
            ) : (
              <Button
                component={Link}
                fullWidth
                href="/rules"
                rel="noopener noreferrer"
                sx={{ justifyContent: "flex-start", minHeight: 40 }}
                target="_blank"
                variant="outlined"
              >
                Choose preset day rules
              </Button>
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              color="text.secondary"
              sx={{ display: "block", mb: 0.75 }}
              variant="caption"
            >
              Custom day rules
            </Typography>
            {dayCustomRules.length === 0 ? (
              <Typography color="text.secondary" variant="body2">
                You have no custom rules set up.
              </Typography>
            ) : (
              <>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  fullWidth
                  label="Custom day rule"
                  onChange={(event) => {
                    setSelectedDayCustomRuleId(event.target.value);
                    setDailyRuleNote(dayCustomRules.find((rule) => rule.ruleId === event.target.value)?.note ?? "");
                  }}
                  select
                  size="small"
                  value={selectedDayCustomRule?.ruleId ?? ""}
                >
                  {dayCustomRules.map((rule) => (
                    <MenuItem key={rule.ruleId} value={rule.ruleId}>
                      {rule.label}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  disabled={readOnly || !selectedDayCustomRule}
                  label="Result"
                  onChange={(event) => {
                    if (selectedDayCustomRule) {
                      void saveRuleStatus(
                        selectedDayCustomRule,
                        event.target.value as DaySessionRule["status"],
                      );
                    }
                  }}
                  select
                  size="small"
                  sx={{ minWidth: 145 }}
                  value={selectedDayCustomRule?.status ?? "not-reviewed"}
                >
                  <MenuItem value="not-reviewed">Not selected</MenuItem>
                  <MenuItem value="followed">Followed</MenuItem>
                  <MenuItem value="broken">Broken</MenuItem>
                </TextField>
              </Stack>
              <TextField
                fullWidth
                label="Rule note (optional)"
                minRows={2}
                multiline
                onChange={(event) => setDailyRuleNote(event.target.value)}
                sx={{ mt: 1 }}
                value={dailyRuleNote}
              />
              <Button disabled={readOnly || !selectedDayCustomRule} onClick={() => selectedDayCustomRule ? void saveRuleNote(selectedDayCustomRule, dailyRuleNote) : undefined} size="small" sx={{ mt: 0.5 }}>
                {selectedDayCustomRule?.note ? "Update note" : "Add note"}
              </Button>
              {ruleSaveErrors.day ? (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {ruleSaveErrors.day}
                </Alert>
              ) : null}
              </>
            )}
            <Button
              disabled={readOnly}
              onClick={() => {
                setCustomDayRuleState("idle");
                setCustomDayRuleOpen(true);
              }}
              size="small"
              sx={{ mt: 1 }}
            >
              Add custom day rule
            </Button>
          </Box>
        </Box>
        <Box sx={{ borderTop: 1, borderColor: "divider", mt: 2, pt: 2 }}>
          <Typography sx={{ fontWeight: 750 }} variant="body2">Daily rules timeline</Typography>
          {dayRuleTimeline.length === 0 ? (
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">No preset rule trigger or violation was recorded for this day.</Typography>
          ) : (
            <Stack divider={<Divider flexItem />} sx={{ mt: 0.75 }}>
              {dayRuleTimeline.map(({ rule, at, kind }, index) => (
                <Stack direction={{ xs: "column", sm: "row" }} key={`${rule.ruleId}:${at}:${kind}:${index}`} sx={{ gap: { xs: 0.25, sm: 1.5 }, py: 0.75 }}>
                  <Typography color="text.secondary" sx={{ minWidth: 92 }} variant="caption">
                    {new Intl.DateTimeFormat("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                      second: "2-digit",
                      timeZone: data.timezone,
                    }).format(new Date(at))}
                  </Typography>
                  <Typography variant="body2">{rule.label} · {kind}</Typography>
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
        <Dialog
          fullWidth
          maxWidth="sm"
          onClose={() => setCustomDayRuleOpen(false)}
          open={customDayRuleOpen}
        >
          <DialogTitle>Add custom day rule</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                fullWidth
                label="Rule name"
                onChange={(event) => setCustomDayRuleName(event.target.value)}
                value={customDayRuleName}
              />
              <TextField
                fullWidth
                label="Rule in your own words"
                minRows={4}
                multiline
                onChange={(event) =>
                  setCustomDayRuleStatement(event.target.value)
                }
                value={customDayRuleStatement}
              />
              {customDayRuleState === "error" ? (
                <Typography color="error.main" variant="body2">
                  The custom day rule could not be saved.
                </Typography>
              ) : null}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCustomDayRuleOpen(false)}>Cancel</Button>
            <Button
              disabled={
                customDayRuleState === "saving" ||
                !customDayRuleName.trim() ||
                !customDayRuleStatement.trim()
              }
              onClick={() => void createCustomDayRule()}
              variant="contained"
            >
              {customDayRuleState === "saving" ? "Saving..." : "Save rule"}
            </Button>
          </DialogActions>
        </Dialog>
        <Stack divider={<Divider flexItem />} sx={{ display: "none" }}>
          {rules.filter((rule) => rule.applicability === "day" && rule.custom).length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }} variant="body2">
              No rule reviews recorded for this trading day.
            </Typography>
          ) : null}
          {rules
            .filter((rule) => rule.applicability === "day" && rule.custom)
            .map((rule) => {
            return (
              <Box
                key={`${rule.ruleId}:${rule.targetRoundTripKey ?? "day"}`}
                sx={{
                  alignItems: { sm: "center" },
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 1,
                  justifyContent: "space-between",
                  py: 1.5,
                }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 750 }} variant="body2">
                    {rule.label}
                  </Typography>
                  <Typography color="text.secondary" variant="caption">
                    {rule.custom ? "Custom" : "Preset"} ·{" "}
                    {rule.applicability === "day" ? "Day rule" : "Trade rule"}
                    {rule.targetLabel ? ` · ${rule.targetLabel}` : ""}
                  </Typography>
                </Box>
                <TextField
                  aria-label={`Review ${rule.label}`}
                  onChange={(event) =>
                    void saveRuleStatus(
                      rule,
                      event.target.value as DaySessionRule["status"],
                    )
                  }
                  select
                  size="small"
                  sx={{ minWidth: 145 }}
                  value={rule.status}
                >
                  <MenuItem value="not-reviewed">Not selected</MenuItem>
                  <MenuItem value="followed">Followed</MenuItem>
                  <MenuItem value="broken">Broken</MenuItem>
                </TextField>
              </Box>
            );
            })}
        </Stack>
          </>
        )}
      </DashboardPanel>
      </Box>

      <DashboardPanel title="Daily Notes">
        <>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            mt: 1.5,
          }}
        >
          <TextField
            disabled={readOnly}
            label="What worked"
            minRows={4}
            multiline
            onChange={(event) => updateDailyNote("whatWorked", event.target.value)}
            placeholder="What did you execute well today?"
            value={dailyNote.whatWorked}
          />
          <TextField
            disabled={readOnly}
            label="What needs work"
            minRows={4}
            multiline
            onChange={(event) => updateDailyNote("whatNeedsWork", event.target.value)}
            placeholder="What should you improve next time?"
            value={dailyNote.whatNeedsWork}
          />
          <TextField
            disabled={readOnly}
            label="Technical recap"
            minRows={4}
            multiline
            onChange={(event) => updateDailyNote("technicalRecap", event.target.value)}
            placeholder="Setup, stop, target, or execution observations across the day."
            value={dailyNote.technicalRecap}
          />
          <TextField
            disabled={readOnly}
            label="Current Focuses"
            minRows={4}
            multiline
            onChange={(event) => updateDailyNote("tomorrowsFocus", event.target.value)}
            placeholder="Keep the trading focuses you want to carry forward."
            value={dailyNote.tomorrowsFocus}
          />
          <TextField
            disabled={readOnly}
            label="Anything else"
            minRows={4}
            multiline
            onChange={(event) => updateDailyNote("anythingElse", event.target.value)}
            placeholder="Write anything else you want to remember."
            sx={{ gridColumn: { md: "1 / -1" } }}
            value={dailyNote.anythingElse}
          />
        </Box>
        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
          <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
            {notesState === "saved" ? (
              <Typography color="success.main" variant="body2">
                Notes saved
              </Typography>
            ) : null}
            {notesState === "error" ? (
              <Typography color="error.main" variant="body2">
                Notes could not be saved
              </Typography>
            ) : null}
            <DashboardPrimaryAction
              disabled={readOnly || notesState === "saving"}
              onClick={() => void saveDailyNotes()}
            >
              {notesState === "saving" ? "Saving Notes..." : "Save Notes"}
            </DashboardPrimaryAction>
          </Stack>
        </Box>
        </>
      </DashboardPanel>
      <DashboardPanel title="Day review">
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Typography color="text.secondary" variant="body2">
            When you have finished reviewing this trading day, choose its review
            status. You can still edit your executions, tags, and notes later.
          </Typography>
          {dayReview.unclassifiedOpenPositionCount > 0 ? (
            <Alert severity="info">
              Choose a type for each open position before marking this day reviewed.
            </Alert>
          ) : null}
          {dayReview.status ? (
            <Chip
              color={dayReview.status === "reviewed" ? "success" : "default"}
              label={dayReview.status === "reviewed" ? "Reviewed" : "Not reviewed"}
              size="small"
              sx={{ alignSelf: "flex-start" }}
            />
          ) : null}
          {dayReviewState === "error" ? (
            <Alert severity="error">
              {dayReviewError ?? "The day review could not be saved. Your Trade Tracker entries are unchanged."}
            </Alert>
          ) : null}
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <DashboardPrimaryAction
              disabled={
                readOnly ||
                dayReviewState === "saving" ||
                dayReview.unclassifiedOpenPositionCount > 0
              }
              onClick={requestReviewedStatus}
            >
              {dayReviewState === "saving" ? "Saving..." : "Mark day reviewed"}
            </DashboardPrimaryAction>
          </Stack>
        </Stack>
      </DashboardPanel>
      {readOnly ? null : <ManageTagsDialog
        expectedAccountSelectionRef={data.expectedAccountSelectionRef}
        onChange={(tags) => {
          const validIds = new Set(tags.map((tag) => tag.tagId));
          setAvailableTags(tags);
          setTradeTags((current) =>
            Object.fromEntries(
              Object.entries(current).map(([key, values]) => [
                key,
                values
                  .filter((tag) => validIds.has(tag.tagId))
                  .map((tag) => tags.find((candidate) => candidate.tagId === tag.tagId) ?? tag),
              ]),
            ),
          );
        }}
        onClose={() => setManageTagsOpen(false)}
        open={manageTagsOpen}
        tags={availableTags}
      />}
      {readOnly ? null : <Dialog
        aria-labelledby="review-with-unsaved-changes-title"
        fullWidth
        maxWidth="sm"
        onClose={() => setReviewWithOtherDraftsOpen(false)}
        open={reviewWithOtherDraftsOpen}
      >
        <DialogTitle id="review-with-unsaved-changes-title">
          Unsaved changes
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            You still have changes that are not saved. Marking this day reviewed
            will save pending Daily Notes and trade notes, but it will not save
            your other changes. You can keep reviewing or mark the day reviewed
            now and decide what to do with those changes later.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ flexDirection: { xs: "column-reverse", sm: "row" }, p: 2 }}>
          <DashboardSecondaryAction
            onClick={() => setReviewWithOtherDraftsOpen(false)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Keep reviewing
          </DashboardSecondaryAction>
          <DashboardPrimaryAction
            onClick={() => {
              setReviewWithOtherDraftsOpen(false);
              void saveDayReview("reviewed");
            }}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Mark reviewed anyway
          </DashboardPrimaryAction>
        </DialogActions>
      </Dialog>}
    </DashboardPage>
  );
}
