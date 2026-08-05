"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  Checkbox,
  Chip,
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
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
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
import { ManualExecutionEditDialog } from "../manual-execution-edit-dialog";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { DailyTradeAnalyzerChart } from "./daily-trade-analyzer-chart";

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
  const safeDates = dates.length > 0 ? [...dates].sort() : [date];
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
    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75 }}>
      <DashboardSecondaryAction
        aria-label="Previous trading day"
        component={Link}
        disabled={!previousDate}
        href={previousDate ? `/trade-tracker/${previousDate}${previewSuffix}` : "#"}
        sx={{ minWidth: 40, px: 1 }}
      >
        <ArrowBackRoundedIcon fontSize="small" />
      </DashboardSecondaryAction>
      <FormControl size="small" sx={{ minWidth: 68 }}>
        <InputLabel id="trade-tracker-day-label">Day</InputLabel>
        <Select label="Day" labelId="trade-tracker-day-label" onChange={(event) =>
          navigate(selectedYear, selectedMonth, event.target.value)} value={selectedDay}>
          {days.map((value) => <MenuItem key={value} value={value}>{Number(value)}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 86 }}>
        <InputLabel id="trade-tracker-month-label">Month</InputLabel>
        <Select label="Month" labelId="trade-tracker-month-label" onChange={(event) =>
          navigate(selectedYear, event.target.value, selectedDay)} value={selectedMonth}>
          {months.map((value) => <MenuItem key={value} value={value}>{monthLabel(value)}</MenuItem>)}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 86 }}>
        <InputLabel id="trade-tracker-year-label">Year</InputLabel>
        <Select label="Year" labelId="trade-tracker-year-label" onChange={(event) =>
          navigate(event.target.value, selectedMonth, selectedDay)} value={selectedYear}>
          {years.map((value) => <MenuItem key={value} value={value}>{value}</MenuItem>)}
        </Select>
      </FormControl>
      <DashboardSecondaryAction
        aria-label="Next trading day"
        component={Link}
        disabled={!nextDate}
        href={nextDate ? `/trade-tracker/${nextDate}${previewSuffix}` : "#"}
        sx={{ minWidth: 40, px: 1 }}
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
        <Button
          disabled={disabled}
          onClick={showEditor}
          size="small"
          sx={{ lineHeight: 1.2, minHeight: 26, minWidth: 0, px: 0.75, py: 0.2 }}
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
        <DialogActions>
          {onManageTags ? (
            <Button
              onClick={() => {
                setOpen(false);
                onManageTags();
              }}
            >
              Manage tags
            </Button>
          ) : null}
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={busy || selectedIds.length > 10} onClick={() => void save()} variant="contained">
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

function timeLabel(value: string, timezone: string): string {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: timezone,
  });
}

function pnlColor(value: string | null): "success.main" | "error.main" | "text.primary" {
  if (value === null) return "text.primary";
  if (/^-/.test(value) && !/^-0(?:\.0+)?$/.test(value)) return "error.main";
  if (/^0(?:\.0+)?$/.test(value)) return "text.primary";
  return "success.main";
}

function pnlBackground(value: string | null): string {
  if (value === null) return "rgba(1, 30, 86, 0.05)";
  if (/^-/.test(value) && !/^-0(?:\.0+)?$/.test(value)) {
    return "rgba(211, 47, 47, 0.10)";
  }
  if (/^0(?:\.0+)?$/.test(value)) return "rgba(1, 30, 86, 0.05)";
  return "rgba(46, 125, 50, 0.11)";
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
  return null;
}

function TradeReview({
  analyzer,
  availableTags,
  currency,
  designPreview,
  expectedAccountSelectionRef,
  onCatalogChange,
  onManageTags,
  onRuleStatusChange,
  onSaveNotes,
  onSelectForChart,
  onTagsChange,
  onTradeNoteChange,
  executions,
  noteState,
  readOnly,
  roundTrip,
  sessionDate,
  selectedForChart,
  tags,
  tradeNumber,
  tradeRules,
}: {
  analyzer: DaySessionTradeAnalyzer | null;
  availableTags: DaySessionTradeTag[];
  currency: string;
  designPreview: boolean;
  expectedAccountSelectionRef: string;
  onCatalogChange: (tags: DaySessionTradeTag[]) => void;
  onManageTags?: () => void;
  onRuleStatusChange: (
    rule: DaySessionRule,
    status: DaySessionRule["status"],
  ) => Promise<void>;
  onSaveNotes: () => Promise<void>;
  onSelectForChart?: () => void;
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  onTradeNoteChange: (value: string) => void;
  executions: readonly DaySessionExecutionActivity[];
  noteState: "idle" | "saving" | "saved" | "error";
  readOnly: boolean;
  roundTrip: DaySessionRoundTrip;
  sessionDate: string;
  selectedForChart: boolean;
  tags: DaySessionTradeTag[];
  tradeNumber: number;
  tradeRules: DaySessionRule[];
}) {
  const presetRules = tradeRules.filter((rule) => !rule.custom);
  const tradeLabelColor = pnlColor(roundTrip.netPnl) === "success.main" ? "success" : "error";
  const [mobileRulesOpen, setMobileRulesOpen] = useState(false);
  const customRules = tradeRules.filter((rule) => rule.custom);
  const [selectedCustomRuleId, setSelectedCustomRuleId] = useState(
    customRules[0]?.ruleId ?? "",
  );
  const selectedCustomRule =
    customRules.find((rule) => rule.ruleId === selectedCustomRuleId) ??
    customRules[0];
  const entry = analyzer?.events.find((event) => event.kind === "entry") ?? null;
  const finalExit = analyzer?.events.find((event) => event.kind === "final_exit") ?? null;
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
        onChange={(event) => setSelectedCustomRuleId(event.target.value)}
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
        <MenuItem value="not-reviewed">Not reviewed</MenuItem>
        <MenuItem value="followed">Followed</MenuItem>
        <MenuItem value="broken">Broken</MenuItem>
      </TextField>
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
    pendingPresetCount > 0 ? `${pendingPresetCount} not reviewed` : null,
  ].filter((item): item is string => item !== null).join(" · ") || "No preset rules selected";
  const renderRuleDetails = () => (
    <>
      <Box>
        <Typography color="text.secondary" sx={{ display: "block", mb: 0.75 }} variant="caption">
          Preset rules
        </Typography>
        {presetRules.length > 0 ? (
          <Stack divider={<Divider flexItem />} spacing={0}>
            {presetRules.map((rule) => {
              const presentation = statusPresentation(rule.status);
              return (
                <Stack
                  direction="row"
                  key={rule.ruleId}
                  spacing={1}
                  sx={{ alignItems: "center", justifyContent: "space-between", py: 0.4 }}
                >
                  <Typography sx={{ lineHeight: 1.25, pr: 0.5 }} variant="body2">
                    {rule.label}
                  </Typography>
                  {presentation ? (
                    <Chip
                      color={presentation.color}
                      icon={presentation.icon ? <presentation.icon /> : undefined}
                      label={presentation.label}
                      size="small"
                    />
                  ) : null}
                </Stack>
              );
            })}
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

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
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
          {analyzer?.status === "ready" && onSelectForChart ? (
                    <Button
                      color={tradeLabelColor}
                      onClick={onSelectForChart}
                      size="small"
                      sx={{ boxShadow: "none", fontWeight: 850, mb: 0.5, minWidth: 0, px: 0.75, py: 0.35, "&:hover": { boxShadow: "none" } }}
                      variant="contained"
                    >
                      Trade {tradeNumber}
                    </Button>
                  ) : (
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
          )}
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
              bgcolor: "rgba(1, 30, 86, 0.035)",
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
              <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 1.5, mt: 0.75, p: 1.25 }}>
                {renderRuleDetails()}
              </Box>
            ) : null}
          </Box>

      {executions.length > 0 ? (
        <Box
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 1.5,
            mt: 0.5,
            order: 3,
            p: 1.5,
          }}
        >
          <Typography color="text.secondary" sx={{ display: "block", mb: 0.5 }} variant="caption">
            Executions
          </Typography>
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
                    sm: "110px 80px minmax(88px, 1fr) 100px auto",
                  },
                  py: 0.45,
                }}
              >
                <Typography variant="body2">{timeLabel(execution.executedAt, roundTrip.timezone)}</Typography>
                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                  {formatJournalAnalyticsDecimal(execution.quantity)} shares
                </Typography>
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                  {price(execution.price, currency)}
                </Typography>
                <ManualExecutionEditDialog
                  execution={execution}
                  expectedAccountSelectionRef={expectedAccountSelectionRef}
                />
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}

        </Box>
      <Box
        sx={{
          bgcolor: "rgba(1, 30, 86, 0.035)",
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

      {analyzer ? (
        <Box
          sx={{
            bgcolor: "rgba(25, 118, 210, 0.08)",
            borderRadius: 1.5,
            mt: 1.5,
            p: 1.5,
          }}
        >
          <Typography sx={{ fontWeight: 850 }} variant="body2">Trade analysis</Typography>
          {analyzer.status === "ready" ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                {entry ? <Typography variant="caption">Entry {price(entry.price, currency)}</Typography> : null}
                {entry?.indicators ? <Typography variant="caption">VWAP {entry.indicators.vwap === null ? "N/A" : price(String(entry.indicators.vwap), currency)}</Typography> : null}
                {entry?.indicators ? <Typography variant="caption">EMA 9 {entry.indicators.ema9 === null ? "N/A" : price(String(entry.indicators.ema9), currency)}</Typography> : null}
                {finalExit ? <Typography variant="caption">Final exit {price(finalExit.price, currency)}</Typography> : null}
              </Box>
              {finalExit?.patterns.length ? (
                <Typography color="text.secondary" variant="caption">
                  {finalExit.patterns.map((pattern) => pattern.kind.replaceAll("_", " ")).join(" · ")}
                </Typography>
              ) : null}
              <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
                {analyzer.finalExitPaths.map((path) => (
                  <Typography key={path.minutesAfterExit} variant="caption">
                    {path.minutesAfterExit} min {path.favorableMove === null ? "N/A" : price(path.favorableMove, currency)}
                  </Typography>
                ))}
              </Box>
            </Stack>
          ) : (
            <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
              Analysis data is not available for this trade yet.
            </Typography>
          )}
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
  designPreview = false,
  pendingExecutions = false,
  readOnly = false,
  topContent,
}: {
  data: DaySessionData;
  designPreview?: boolean;
  pendingExecutions?: boolean;
  readOnly?: boolean;
  topContent?: ReactNode;
}) {
  const router = useRouter();
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
  const [dailyNote, setDailyNote] = useState(data.dailyNote);
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
    () =>
      Object.fromEntries(
        [
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
        ],
      ),
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
  const [selectedAnalyzerTradeKeys, setSelectedAnalyzerTradeKeys] = useState<Record<string, string>>({});
  const tradeCount = data.tickers.reduce(
    (count, ticker) => count + ticker.roundTrips.length,
    0,
  );
  const tickerCount = new Set([
    ...data.tickers.map((ticker) => ticker.stableInstrumentKey),
    ...data.openPositions.map((position) => position.stableInstrumentKey),
  ]).size;
  const reviewingPastDay = data.date !== data.week.currentSessionDate;
  const dayPresetRules = rules.filter(
    (rule) => rule.applicability === "day" && !rule.custom,
  );
  const dayCustomRules = rules.filter(
    (rule) => rule.applicability === "day" && rule.custom,
  );
  const selectedDayCustomRule =
    dayCustomRules.find((rule) => rule.ruleId === selectedDayCustomRuleId) ??
    dayCustomRules[0];

  function updateTradeNote(targetKey: string, tradeNote: string): void {
    setTradeNotes((current) => current[targetKey] === tradeNote
      ? current
      : { ...current, [targetKey]: tradeNote });
    setTradeNoteStates((current) => current[targetKey] === "idle"
      ? current
      : { ...current, [targetKey]: "idle" });
    setDirtyTradeNoteKeys((current) => current.has(targetKey)
      ? current
      : new Set(current).add(targetKey));
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
        label: created.title,
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
    if (
      designPreview ||
      (pendingExecutions && selectedRule.applicability === "trade")
    ) {
      setRules((current) =>
        current.map((rule) =>
          rule.ruleId === selectedRule.ruleId &&
          rule.targetRoundTripKey === selectedRule.targetRoundTripKey
            ? { ...rule, status }
            : rule,
        ),
      );
      return;
    }
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
        rule.targetRoundTripKey === selectedRule.targetRoundTripKey
          ? { ...rule, revision: saved.revision, status: saved.status }
          : rule,
      ),
    );
  }

  async function saveTradeNotes(roundTripKey: string): Promise<boolean> {
    if (readOnly) return false;
    setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saving" }));
    if (designPreview || pendingExecutions) {
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saved" }));
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
      setNotesState("saved");
      setDailyNotesDirty(false);
      return true;
    } catch {
      setNotesState("error");
      return false;
    }
  }

  const hasUnsavedNotes = dailyNotesDirty || dirtyTradeNoteKeys.size > 0;
  const shouldWarnBeforeLeaving = hasUnsavedNotes || dayReview.status !== "reviewed";

  useEffect(() => {
    function warnBeforeUnload(event: BeforeUnloadEvent): void {
      if (!shouldWarnBeforeLeaving) return;
      event.preventDefault();
      event.returnValue = "";
    }
    function warnBeforeNavigation(event: MouseEvent): void {
      if (!shouldWarnBeforeLeaving || event.defaultPrevented || event.button !== 0 ||
          event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const source = event.target;
      if (!(source instanceof Element)) return;
      const link = source.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin ||
          destination.pathname === window.location.pathname) return;
      if (!window.confirm(
        hasUnsavedNotes
          ? "You have notes that have not been saved. Leave this page anyway?"
          : "This day is not marked reviewed. Leave this page anyway?",
      )) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    document.addEventListener("click", warnBeforeNavigation, true);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeUnload);
      document.removeEventListener("click", warnBeforeNavigation, true);
    };
  }, [hasUnsavedNotes, shouldWarnBeforeLeaving, dayReview.status]);

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
      setDayReviewError("The day review could not be saved. Your journal entries are unchanged.");
      setDayReviewState("error");
    }
  }

  const activeSwingPositionsForDay = data.openPositions.filter((position) =>
    position.style?.openStatus === "swing" && data.executionActivity.some((execution) =>
      execution.roundTripKeys.includes(position.positionKey)));
  const dayTrackerOpenPositions = data.openPositions.filter(
    (position) => position.style?.openStatus !== "swing",
  );
  const visibleOpenPositions = [
    ...activeSwingPositionsForDay,
    ...dayTrackerOpenPositions,
  ];

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trade Tracker
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Daily Trade Tracker
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 900, mt: 1 }} variant="body2">
          The Daily Trade Tracker allows you to journal one trading day and the
          trades you took on that particular day. Add tags, notes and track rules
          for each trade. Add notes and track rules that apply to the trading day
          as a whole.
        </Typography>
      </Box>
      {topContent}
      {readOnly ? (
        <Alert severity="info">
          This historical trading day is read-only. Its saved Journal rules, tags, and notes are shown without allowing retrospective edits.
        </Alert>
      ) : null}
      <DashboardPanel title="This week">
        <Box
          sx={{
            alignItems: { md: "center" },
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
            mt: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              minWidth: 0,
              overflowX: "auto",
              pb: 0.75,
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
              md: "repeat(4, minmax(0, 1fr))",
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
              String(rules.filter((rule) => rule.status === "broken").length),
              "error.main",
            ],
          ].map(([label, value, color]) => (
            <Box
              key={label}
              sx={{
                bgcolor: "rgba(1, 30, 86, 0.035)",
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

      <Stack spacing={2}>
        {data.tickers.map((ticker) => {
          const readyTrade = ticker.roundTrips.find((roundTrip) => roundTrip.analyzer?.status === "ready") ?? null;
          const selectedTrade = ticker.roundTrips.find((roundTrip) =>
            roundTrip.roundTripKey === selectedAnalyzerTradeKeys[ticker.stableInstrumentKey],
          ) ?? readyTrade;
          return (
          <Card key={ticker.stableInstrumentKey} variant="outlined">
            {selectedTrade?.analyzer?.status === "ready" ? (
              <DailyTradeAnalyzerChart
                analysis={selectedTrade.analyzer}
                symbol={ticker.symbol}
                tradeNumber={ticker.roundTrips.findIndex((roundTrip) =>
                  roundTrip.roundTripKey === selectedTrade.roundTripKey,
                ) + 1}
              />
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
                  component={Link}
                  href={`/trades/roundtrips?currency=${encodeURIComponent(data.currency)}&instrumentId=${encodeURIComponent(ticker.stableInstrumentKey)}&date=${encodeURIComponent(data.date)}`}
                  sx={{ color: "inherit", fontWeight: 900, textDecoration: "none" }}
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
              <Stack divider={<Divider flexItem sx={{ borderBottomWidth: 2, borderColor: "rgba(1, 30, 86, 0.32)" }} />}>
                {ticker.roundTrips.map((roundTrip, index) => (
                  <TradeReview
                    analyzer={roundTrip.analyzer}
                    availableTags={availableTags}
                    currency={data.currency}
                    designPreview={designPreview || pendingExecutions}
                    executions={data.executionActivity.filter((execution) =>
                      execution.roundTripKeys.includes(roundTrip.roundTripKey),
                    )}
                    expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                    key={roundTrip.roundTripKey}
                    onCatalogChange={setAvailableTags}
                    onManageTags={
                      designPreview || readOnly
                        ? undefined
                        : () => setManageTagsOpen(true)
                    }
                    noteState={tradeNoteStates[roundTrip.roundTripKey] ?? "idle"}
                    onRuleStatusChange={saveRuleStatus}
                    onSaveNotes={async () => {
                      await saveTradeNotes(roundTrip.roundTripKey);
                    }}
                    onSelectForChart={roundTrip.analyzer?.status === "ready"
                      ? () => setSelectedAnalyzerTradeKeys((current) => ({
                          ...current,
                          [ticker.stableInstrumentKey]: roundTrip.roundTripKey,
                        }))
                      : undefined}
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
                    sessionDate={data.date}
                    selectedForChart={selectedTrade?.roundTripKey === roundTrip.roundTripKey}
                    tags={tradeTags[roundTrip.roundTripKey] ?? []}
                    tradeNumber={index + 1}
                    tradeRules={rules.filter(
                      (rule) =>
                        rule.applicability === "trade" &&
                        rule.targetRoundTripKey === roundTrip.roundTripKey,
                    )}
                  />
                ))}
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
                    bgcolor: "rgba(237, 108, 2, 0.09)",
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
                </Box>
                <Box sx={{ p: { xs: 2, md: 2.5 } }}>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(3, minmax(150px, 1fr))",
                      },
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
                    <Box>
                      <Typography color="text.secondary" variant="caption">
                        Average entry
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "var(--font-geist-mono)",
                          fontWeight: 850,
                          mt: 0.35,
                        }}
                        variant="h6"
                      >
                        {price(position.averageEntryPrice, data.currency)}
                      </Typography>
                    </Box>
                    <Box sx={{ gridColumn: { xs: "1 / -1", md: "auto" } }}>
                      <Typography color="text.secondary" variant="caption">
                        Opened
                      </Typography>
                      <Typography sx={{ fontWeight: 750, mt: 0.35 }} variant="body1">
                        {timeLabel(position.openedAt, position.timezone)}
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
                        <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 1.5, p: 1.5 }}>
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
                                <Typography variant="body2">{timeLabel(execution.executedAt, position.timezone)}</Typography>
                                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
                                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                                  {formatJournalAnalyticsDecimal(execution.quantity)} shares
                                </Typography>
                                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">
                                  {price(execution.price, data.currency)}
                                </Typography>
                                <ManualExecutionEditDialog
                                  execution={execution}
                                  expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                                />
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      ) : null}

                      {!activeSwing && position.style?.openStatus === "unplanned_hold" ? (
                        <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 1.5, p: 1.5 }}>
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
                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                          <DashboardSecondaryAction href={`/trade-tracker/swings#swing-${encodeURIComponent(position.positionRef)}`}>
                            Open Swing Tracker
                          </DashboardSecondaryAction>
                          <PositionStyleControl
                            closed={false}
                            expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                            mode="mark-failed-swing"
                            positionRef={position.positionRef}
                            sourceUi="day_trade_tracker"
                            style={position.style}
                          />
                        </Stack>
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

                    {activeSwing ? null : <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", borderRadius: 1.5, minHeight: { md: 280 }, p: 1.5 }}>
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

      <DashboardPanel title="Daily Trading Rules">
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
            <Typography
              color="text.secondary"
              sx={{ display: "block", mb: 0.75 }}
              variant="caption"
            >
              Preset day rules
            </Typography>
            {dayPresetRules.length > 0 ? (
              <Stack divider={<Divider flexItem />} spacing={0}>
                {dayPresetRules.map((rule) => {
                  const presentation = statusPresentation(rule.status);
                  return (
                    <Stack
                      direction="row"
                      key={rule.ruleId}
                      spacing={1}
                      sx={{ alignItems: "center", justifyContent: "space-between", py: 0.5 }}
                    >
                      <Typography sx={{ lineHeight: 1.25, pr: 0.5 }} variant="body2">
                        {rule.label}
                      </Typography>
                      {presentation ? (
                        <Chip
                          color={presentation.color}
                          icon={presentation.icon ? <presentation.icon /> : undefined}
                          label={presentation.label}
                          size="small"
                        />
                      ) : null}
                    </Stack>
                  );
                })}
              </Stack>
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  fullWidth
                  label="Custom day rule"
                  onChange={(event) => setSelectedDayCustomRuleId(event.target.value)}
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
                  <MenuItem value="not-reviewed">Not reviewed</MenuItem>
                  <MenuItem value="followed">Followed</MenuItem>
                  <MenuItem value="broken">Broken</MenuItem>
                </TextField>
              </Stack>
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
          {rules.filter((rule) => rule.applicability === "day").length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }} variant="body2">
              No rule reviews recorded for this trading day.
            </Typography>
          ) : null}
          {rules
            .filter((rule) => rule.applicability === "day")
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
                  <MenuItem value="not-reviewed">Not reviewed</MenuItem>
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

      <DashboardPanel title="Daily Notes">
        {readOnly ? (
          <Stack spacing={1.5} sx={{ mt: 1.5 }}>
            {[
              ["What worked", dailyNote.whatWorked],
              ["What needs work", dailyNote.whatNeedsWork],
              ["Technical recap", dailyNote.technicalRecap],
              ["Tomorrow's focus", dailyNote.tomorrowsFocus],
              ["Anything else", dailyNote.anythingElse],
            ].some(([, value]) => value.trim().length > 0) ? (
              [
                ["What worked", dailyNote.whatWorked],
                ["What needs work", dailyNote.whatNeedsWork],
                ["Technical recap", dailyNote.technicalRecap],
                ["Tomorrow's focus", dailyNote.tomorrowsFocus],
                ["Anything else", dailyNote.anythingElse],
              ].filter(([, value]) => value.trim().length > 0).map(([label, value]) => (
                <Box key={label}>
                  <Typography color="text.secondary" variant="caption">{label}</Typography>
                  <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{value}</Typography>
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" variant="body2">No daily notes saved.</Typography>
            )}
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
          <TextField
            disabled={readOnly}
            label="What worked"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                whatWorked: event.target.value,
              }));
              setNotesState("idle");
              setDailyNotesDirty(true);
            }}
            placeholder="What did you execute well today?"
            value={dailyNote.whatWorked}
          />
          <TextField
            disabled={readOnly}
            label="What needs work"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                whatNeedsWork: event.target.value,
              }));
              setNotesState("idle");
              setDailyNotesDirty(true);
            }}
            placeholder="What should you improve next time?"
            value={dailyNote.whatNeedsWork}
          />
          <TextField
            disabled={readOnly}
            label="Technical recap"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                technicalRecap: event.target.value,
              }));
              setNotesState("idle");
              setDailyNotesDirty(true);
            }}
            placeholder="Setup, stop, target, or execution observations across the day."
            value={dailyNote.technicalRecap}
          />
          <TextField
            disabled={readOnly}
            label="Tomorrow's focus"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                tomorrowsFocus: event.target.value,
              }));
              setNotesState("idle");
              setDailyNotesDirty(true);
            }}
            placeholder="What will you carry into the next trading day?"
            value={dailyNote.tomorrowsFocus}
          />
          <TextField
            disabled={readOnly}
            label="Anything else"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                anythingElse: event.target.value,
              }));
              setNotesState("idle");
              setDailyNotesDirty(true);
            }}
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
        )}
      </DashboardPanel>
      <DashboardPanel title="Day review">
        <Stack spacing={1.5} sx={{ mt: 1.5 }}>
          <Typography color="text.secondary" variant="body2">
            When you have finished journaling this trading day, choose its review
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
              {dayReviewError ?? "The day review could not be saved. Your journal entries are unchanged."}
            </Alert>
          ) : null}
          {!readOnly ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
              <DashboardPrimaryAction
                disabled={
                  dayReviewState === "saving" ||
                  dayReview.unclassifiedOpenPositionCount > 0
                }
                onClick={() => void saveDayReview("reviewed")}
              >
                {dayReviewState === "saving" ? "Saving..." : "Mark day reviewed"}
              </DashboardPrimaryAction>
            </Stack>
          ) : null}
        </Stack>
      </DashboardPanel>
      <ManageTagsDialog
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
      />
    </DashboardPage>
  );
}
