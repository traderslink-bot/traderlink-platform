"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import type { ReactNode } from "react";
import { useState } from "react";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";

import type {
  DaySessionData,
  DaySessionDailyNote,
  DaySessionRoundTrip,
  DaySessionRule,
  DaySessionTradeTag,
  DaySessionWeekDay,
} from "./day-session-types";

type ApiResult<T> = {
  data?: T;
  error?: { assignmentCount?: number; code?: string; message?: string };
};

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
  const catalog = [...availableTags, ...previewCreatedTags].filter(
    (tag, index, tags) =>
      tags.findIndex((candidate) => candidate.tagId === tag.tagId) === index,
  );

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
      const saved = await api<DaySessionTradeTag[]>(
        `/api/intelligence/trades/${encodeURIComponent(targetKey)}/tags`,
        {
          body: JSON.stringify({
            expectedAccountSelectionRef,
            sessionDate,
            tagIds: selectedIds,
          }),
          method: "PUT",
        },
      );
      const previousIds = new Set(tags.map((tag) => tag.tagId));
      const nextIds = new Set(saved.map((tag) => tag.tagId));
      onCatalogChange(
        availableTags.map((tag) => ({
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
      <Stack direction="row" sx={{ alignItems: "center", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
        {tags.map((tag) => <Chip key={tag.tagId} label={tag.name} size="small" />)}
        <Button
          disabled={disabled}
          onClick={showEditor}
          size="small"
          variant="outlined"
        >
          {tags.length === 0 ? "Add tags" : "Edit tags"}
        </Button>
      </Stack>
      <Dialog fullWidth maxWidth="sm" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>Tags</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
            Select or create your own tags
          </Typography>
          <Stack sx={{ maxHeight: 260, overflowY: "auto" }}>
            {catalog.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1 }} variant="body2">
                No tags created yet.
              </Typography>
            ) : null}
            {catalog.map((tag) => (
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
  if (value === null) return "Unavailable";
  const normalizedValue = value.startsWith(".")
    ? `0${value}`
    : value.startsWith("-.")
      ? `-0${value.slice(1)}`
      : value;
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(normalizedValue);
  if (!match) return "Unavailable";
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
  return value === null ? "Unavailable" : money(value, currency).replace(/^\+/, "");
}

function percentage(value: string | null): string {
  if (value === null) return "Unavailable";
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
  icon: typeof CheckCircleOutlineRoundedIcon;
  label: string;
} {
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
  return {
    color: "default",
    icon: ErrorOutlineRoundedIcon,
    label: "Not reviewed",
  };
}

function TradeReview({
  availableTags,
  currency,
  designPreview,
  expectedAccountSelectionRef,
  onCatalogChange,
  onManageTags,
  onRuleStatusChange,
  onSaveNotes,
  onTagsChange,
  onTechnicalNoteChange,
  onTradeNoteChange,
  noteState,
  readOnly,
  roundTrip,
  sessionDate,
  tags,
  tradeRules,
}: {
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
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  onTechnicalNoteChange: (value: string) => void;
  onTradeNoteChange: (value: string) => void;
  noteState: "idle" | "saving" | "saved" | "error";
  readOnly: boolean;
  roundTrip: DaySessionRoundTrip;
  sessionDate: string;
  tags: DaySessionTradeTag[];
  tradeRules: DaySessionRule[];
}) {
  const presetRules = tradeRules.filter((rule) => !rule.custom);
  const [selectedPresetRuleId, setSelectedPresetRuleId] = useState(
    presetRules[0]?.ruleId ?? "",
  );
  const selectedPresetRule =
    presetRules.find((rule) => rule.ruleId === selectedPresetRuleId) ??
    presetRules[0];
  const status = statusPresentation(
    selectedPresetRule?.status ?? roundTrip.journal.ruleStatus,
  );
  const StatusIcon = status.icon;
  const customRules = tradeRules.filter((rule) => rule.custom);
  const [selectedCustomRuleId, setSelectedCustomRuleId] = useState(
    customRules[0]?.ruleId ?? "",
  );
  const selectedCustomRule =
    customRules.find((rule) => rule.ruleId === selectedCustomRuleId) ??
    customRules[0];
  const ruleControls = (
    <Box
      sx={{
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: { xs: "1fr", sm: "minmax(180px, 280px) 140px" },
      }}
    >
      <TextField
        disabled={customRules.length === 0}
        label="Custom rule"
        onChange={(event) => setSelectedCustomRuleId(event.target.value)}
        select
        size="small"
        value={selectedCustomRule?.ruleId ?? ""}
      >
        {customRules.length === 0 ? (
          <MenuItem value="">No trade rules</MenuItem>
        ) : null}
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

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box
        sx={{
          alignItems: { md: "center" },
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr)",
            md: "minmax(150px, 1fr) 132px",
          },
        }}
      >
        <Box>
          <Typography sx={{ fontWeight: 800 }} variant="body2">
            {timeLabel(roundTrip.entryAt, roundTrip.timezone)} –{" "}
            {timeLabel(roundTrip.exitAt, roundTrip.timezone)}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {price(roundTrip.entryPrice, currency)} →{" "}
            {price(roundTrip.exitPrice, currency)}
          </Typography>
        </Box>
        <Typography
          color={pnlColor(roundTrip.netPnl)}
          sx={{
            bgcolor: pnlBackground(roundTrip.netPnl),
            borderRadius: 1,
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 850,
            justifySelf: { md: "end" },
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
            fontSize: { xs: "0.8rem", md: "1rem" },
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 850,
            gridColumn: { md: "2" },
            justifySelf: { md: "end" },
            px: 1,
            py: 0.35,
            textAlign: "right",
          }}
          variant="caption"
        >
          {percentage(roundTrip.gainLossPercent)}
        </Typography>
      </Box>

      {readOnly ? (
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
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

      {readOnly ? (
        <Box
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 1.5,
            mt: 1.5,
            p: 1.5,
          }}
        >
          {tradeRules.length === 0 ? (
            <Typography color="text.secondary" variant="body2">No active trade rules.</Typography>
          ) : (
            <Stack spacing={1}>
              {tradeRules.map((rule) => (
                <Stack direction="row" key={rule.ruleId} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                  <Typography variant="body2">{rule.label}</Typography>
                  <Chip
                    color={rule.status === "followed" ? "success" : rule.status === "broken" ? "error" : "default"}
                    label={rule.status === "not-reviewed" ? "Not reviewed" : rule.status === "followed" ? "Followed" : "Broken"}
                    size="small"
                    variant={rule.status === "not-reviewed" ? "outlined" : "filled"}
                  />
                </Stack>
              ))}
            </Stack>
          )}
        </Box>
      ) : (
        <Box
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 1.5,
            display: { xs: "none", md: "grid" },
            gap: 1.5,
            gridTemplateColumns: "minmax(0, 380px) minmax(0, 430px)",
            justifyContent: "start",
            mt: 1.5,
            p: 1.5,
          }}
        >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            color="text.secondary"
            sx={{ display: "block", mb: 0.75 }}
            variant="caption"
          >
            Preset rules
          </Typography>
          {presetRules.length > 0 ? (
            <Box
              sx={{
                alignItems: "center",
                display: "grid",
                gap: 1,
                gridTemplateColumns: "minmax(0, 1fr) auto",
              }}
            >
              <TextField
                label="Preset rule"
                onChange={(event) => setSelectedPresetRuleId(event.target.value)}
                select
                size="small"
                sx={{ minWidth: 0 }}
                value={selectedPresetRule?.ruleId ?? ""}
              >
                {presetRules.map((rule) => (
                  <MenuItem key={rule.ruleId} value={rule.ruleId}>
                    {rule.label}
                  </MenuItem>
                ))}
              </TextField>
              <Chip
                color={status.color}
                icon={<StatusIcon />}
                label={status.label}
                size="small"
                variant={status.color === "default" ? "outlined" : "filled"}
              />
            </Box>
          ) : (
            <Button
              component={Link}
              disabled={readOnly}
              fullWidth
              href="/rules"
              rel="noopener noreferrer"
              size="small"
              startIcon={<OpenInNewRoundedIcon />}
              sx={{ minHeight: 40, justifyContent: "flex-start" }}
              target="_blank"
              variant="outlined"
            >
              Choose preset rules
            </Button>
          )}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            color="text.secondary"
            sx={{ display: "block", mb: 0.75 }}
            variant="caption"
          >
            Custom rules
          </Typography>
          {ruleControls}
        </Box>
        </Box>
      )}

      <Box
        sx={{
          bgcolor: "rgba(1, 30, 86, 0.035)",
          borderRadius: 1.5,
          display: { xs: "none", md: "block" },
          minHeight: 104,
          mt: 1.5,
          p: 1.5,
        }}
      >
        {readOnly ? (
          <Box>
            <Typography color="text.secondary" variant="caption">Trade notes</Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              {roundTrip.journal.tradeNote || "No trade note saved."}
            </Typography>
            <Typography color="text.secondary" sx={{ display: "block", mt: 1.25 }} variant="caption">
              Technical notes
            </Typography>
            <Typography sx={{ mt: 0.5 }} variant="body2">
              {roundTrip.journal.technicalNote || "No technical note saved."}
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1.25}>
            <TextField
              fullWidth
              label="Trade notes"
              minRows={3}
              multiline
              onChange={(event) => onTradeNoteChange(event.target.value)}
              placeholder="Write what you want to remember about this trade."
              value={roundTrip.journal.tradeNote}
            />
            <TextField
              fullWidth
              label="Technical notes"
              minRows={3}
              multiline
              onChange={(event) => onTechnicalNoteChange(event.target.value)}
              placeholder="Add setup, entry, exit, or execution observations."
              value={roundTrip.journal.technicalNote}
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

      {!readOnly ? <Accordion
        disableGutters
        elevation={0}
        sx={{
          bgcolor: "transparent",
          display: { xs: "block", md: "none" },
          mt: 1,
          "&::before": { display: "none" },
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreRoundedIcon />}
          sx={{
            borderTop: 1,
            borderColor: "divider",
            minHeight: 44,
            px: 0,
            "& .MuiAccordionSummary-content": { my: 1 },
          }}
        >
          <Typography color="primary.main" sx={{ fontWeight: 750 }} variant="body2">
            Trade notes
          </Typography>
        </AccordionSummary>
        <AccordionDetails
          sx={{
            bgcolor: "rgba(1, 30, 86, 0.035)",
            borderRadius: 1.5,
            p: 1.5,
          }}
        >
          <TextField
            fullWidth
            label="Trade notes"
            minRows={3}
            multiline
            onChange={(event) => onTradeNoteChange(event.target.value)}
            placeholder="Write what you want to remember about this trade."
            value={roundTrip.journal.tradeNote}
          />
          <TextField
            disabled={readOnly}
            fullWidth
            label="Technical notes"
            minRows={3}
            multiline
            onChange={(event) => onTechnicalNoteChange(event.target.value)}
            placeholder="Add setup, entry, exit, or execution observations."
            value={roundTrip.journal.technicalNote}
          />
          <Button disabled={noteState === "saving"} onClick={() => void onSaveNotes()} size="small" sx={{ mt: 1 }} variant="contained">
            {noteState === "saving" ? "Saving..." : "Save trade notes"}
          </Button>
          <Divider sx={{ my: 1.5 }} />
          <Typography color="text.secondary" variant="caption">
            Rule review
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "center", mt: 0.5 }}
          >
            <StatusIcon
              color={status.color === "default" ? "disabled" : status.color}
              fontSize="small"
            />
            <Typography sx={{ fontWeight: 700 }} variant="body2">
              {status.label}: {roundTrip.journal.ruleSummary}
            </Typography>
          </Stack>
          <Box sx={{ mt: 1.5 }}>{ruleControls}</Box>
        </AccordionDetails>
      </Accordion> : null}
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
  const [selectedDayPresetRuleId, setSelectedDayPresetRuleId] = useState(
    data.rules.find(
      (rule) => rule.applicability === "day" && !rule.custom,
    )?.ruleId ?? "",
  );
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
  const [openPositionPlans, setOpenPositionPlans] = useState<
    Record<string, "not-set" | "day-trade" | "swing" | "other">
  >({});
  const [openPositionTags, setOpenPositionTags] = useState<
    Record<string, DaySessionTradeTag[]>
  >({});
  const [technicalNotes, setTechnicalNotes] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        data.tickers.flatMap((ticker) =>
          ticker.roundTrips.map((roundTrip) => [
            roundTrip.roundTripKey,
            roundTrip.journal.technicalNote,
          ]),
        ),
      ),
  );
  const [tradeNotes, setTradeNotes] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        data.tickers.flatMap((ticker) =>
          ticker.roundTrips.map((roundTrip) => [
            roundTrip.roundTripKey,
            roundTrip.journal.tradeNote,
          ]),
        ),
      ),
  );
  const [tradeNoteRevisions, setTradeNoteRevisions] = useState<
    Record<string, string | null>
  >(() =>
    Object.fromEntries(
      data.tickers.flatMap((ticker) =>
        ticker.roundTrips.map((roundTrip) => [
          roundTrip.roundTripKey,
          roundTrip.journal.noteRevision,
        ]),
      ),
    ));
  const [tradeNoteStates, setTradeNoteStates] = useState<
    Record<string, "idle" | "saving" | "saved" | "error">
  >({});
  const [notesState, setNotesState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
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
  const selectedDayPresetRule =
    dayPresetRules.find((rule) => rule.ruleId === selectedDayPresetRuleId) ??
    dayPresetRules[0];
  const selectedDayCustomRule =
    dayCustomRules.find((rule) => rule.ruleId === selectedDayCustomRuleId) ??
    dayCustomRules[0];

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

  async function saveTradeNotes(roundTripKey: string): Promise<void> {
    if (readOnly) return;
    setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saving" }));
    if (designPreview || pendingExecutions) {
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "saved" }));
      return;
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
    } catch {
      setTradeNoteStates((current) => ({ ...current, [roundTripKey]: "error" }));
    }
  }

  async function saveDailyNotes(): Promise<void> {
    if (readOnly) return;
    setNotesState("saving");
    if (designPreview) {
      setNotesState("saved");
      return;
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
    } catch {
      setNotesState("error");
    }
  }

  return (
    <DashboardPage>
      {topContent}
      {readOnly ? (
        <Alert severity="info">
          This historical trading day is read-only. Its saved Journal rules, tags, and notes are shown without allowing retrospective edits.
        </Alert>
      ) : null}
      {data.needsDecisionCount > 0 ? (
        <Alert
          action={<Button color="inherit" component={Link} href="/data-decisions" size="small">Review Data Decisions</Button>}
          severity="warning"
        >
          {data.needsDecisionCount} trade chain{data.needsDecisionCount === 1 ? " needs" : "s need"} a factual trader decision. Valid unrelated trades remain visible.
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
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1 }}
          >
            {data.previousSessionDate ? (
              <DashboardSecondaryAction
                component={Link}
                href={`/trade-tracker/${data.previousSessionDate}${designPreview ? "?preview=design" : ""}`}
                startIcon={<ArrowBackRoundedIcon />}
              >
                Previous day
              </DashboardSecondaryAction>
            ) : null}
            {reviewingPastDay ? (
              <DashboardPrimaryAction
                component={Link}
                href={`/trade-tracker/${data.week.currentSessionDate}${designPreview ? "?preview=design" : ""}`}
                startIcon={<TodayRoundedIcon />}
              >
                Current day
              </DashboardPrimaryAction>
            ) : null}
            {data.nextSessionDate ? (
              <DashboardSecondaryAction
                component={Link}
                endIcon={<ArrowForwardRoundedIcon />}
                href={`/trade-tracker/${data.nextSessionDate}${designPreview ? "?preview=design" : ""}`}
              >
                Next day
              </DashboardSecondaryAction>
            ) : null}
          </Stack>
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
            ["Net P/L", money(data.netPnl, data.currency), pnlColor(data.netPnl)],
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

      {data.executionActivity.length > 0 ? (
        <DashboardPanel title="Executions on this trading day">
          <Stack divider={<Divider flexItem />}>
            {data.executionActivity.map((execution) => (
              <Box
                key={execution.executionKey}
                sx={{
                  alignItems: { sm: "center" },
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: {
                    xs: "1fr 1fr",
                    sm: "110px minmax(90px, 1fr) 90px 110px 130px auto",
                  },
                  py: 1.25,
                }}
              >
                <Typography variant="body2">{timeLabel(execution.executedAt, data.timezone)}</Typography>
                <Typography sx={{ fontWeight: 800 }}>{execution.symbol}</Typography>
                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{execution.side}</Typography>
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">{formatJournalAnalyticsDecimal(execution.quantity)} shares</Typography>
                <Typography sx={{ fontFamily: "var(--font-geist-mono)" }} variant="body2">{price(execution.price, data.currency)}</Typography>
                <Chip color={execution.needsDecision ? "warning" : "success"} label={execution.needsDecision ? "Needs decision" : "Accepted"} size="small" />
              </Box>
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      {data.positionSnapshots.length > 0 ? (
        <DashboardPanel title="Position carried through this day">
          <Stack divider={<Divider flexItem />}>
            {data.positionSnapshots.map((position) => (
              <Box
                key={position.positionKey}
                sx={{
                  alignItems: { sm: "center" },
                  display: "grid",
                  gap: 1,
                  gridTemplateColumns: { xs: "1fr 1fr", sm: "minmax(90px, 1fr) 90px 130px 130px 160px" },
                  py: 1.25,
                }}
              >
                <Typography sx={{ fontWeight: 800 }}>{position.symbol}</Typography>
                <Typography sx={{ textTransform: "capitalize" }} variant="body2">{position.direction}</Typography>
                <Typography variant="body2">Open: {formatJournalAnalyticsDecimal(position.openingQuantity)}</Typography>
                <Typography variant="body2">Close: {formatJournalAnalyticsDecimal(position.closingQuantity)}</Typography>
                <Chip label={position.state.replaceAll("_", " ")} size="small" variant="outlined" />
              </Box>
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      {data.decisionActivity.length > 0 ? (
        <DashboardPanel title="Execution activity needing a decision">
          <Stack divider={<Divider flexItem />}>
            {data.decisionActivity.map((item) => (
              <Box
                key={item.roundTripKey}
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
                  <Typography sx={{ fontWeight: 800 }}>{item.symbol}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {item.direction === "long" ? "Long" : "Short"} · {item.executionCount} execution{item.executionCount === 1 ? "" : "s"} on this day · Opened {timeLabel(item.openedAt, data.timezone)}
                  </Typography>
                </Box>
                <Chip color="warning" label={item.reasonCodes.join(", ").replaceAll("_", " ") || "Trader decision required"} size="small" />
              </Box>
            ))}
          </Stack>
        </DashboardPanel>
      ) : null}

      <Stack spacing={2}>
        {data.tickers.map((ticker) => (
          <Card key={ticker.stableInstrumentKey} variant="outlined">
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
                <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                  {ticker.roundTrips.length} trade
                  {ticker.roundTrips.length === 1 ? "" : "s"}
                </Typography>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                  {[...new Set(ticker.roundTrips.map((trade) => trade.direction))].map(
                    (direction) => (
                      <Chip
                        key={direction}
                        label={direction === "long" ? "Long" : "Short"}
                        size="small"
                        variant="outlined"
                      />
                    ),
                  )}
                </Stack>
              </Box>
              <Stack divider={<Divider flexItem />}>
                {ticker.roundTrips.map((roundTrip) => (
                  <TradeReview
                    availableTags={availableTags}
                    currency={data.currency}
                    designPreview={designPreview || pendingExecutions}
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
                    onSaveNotes={() => saveTradeNotes(roundTrip.roundTripKey)}
                    onTagsChange={(tags) =>
                      setTradeTags((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: tags,
                      }))
                    }
                    onTechnicalNoteChange={(technicalNote) =>
                      {
                        setTechnicalNotes((current) => ({
                          ...current,
                          [roundTrip.roundTripKey]: technicalNote,
                        }));
                        setTradeNoteStates((current) => ({
                          ...current,
                          [roundTrip.roundTripKey]: "idle",
                        }));
                      }
                    }
                    onTradeNoteChange={(tradeNote) => {
                      setTradeNotes((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: tradeNote,
                      }));
                      setTradeNoteStates((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: "idle",
                      }));
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
                    tags={tradeTags[roundTrip.roundTripKey] ?? []}
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
        ))}
      </Stack>

      {data.openPositions.length > 0 ? (
        <Stack spacing={2}>
          {data.openPositions.map((position) => (
            <Card
              key={position.positionKey}
              sx={{ borderColor: "warning.light" }}
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
                  <Stack
                    direction="row"
                    sx={{
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography sx={{ fontWeight: 900 }} variant="h4">
                      {position.symbol}
                    </Typography>
                    <Chip color="warning" label="Open" size="small" />
                  </Stack>
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                    variant="body2"
                  >
                    Open position
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
                  {readOnly ? (
                    <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
                      Open-position plans and tags are intentionally deferred to the dedicated swing/open-position workflow.
                    </Typography>
                  ) : (
                    <TradeTagEditor
                      availableTags={availableTags}
                      disabled={false}
                      designPreview={designPreview || pendingExecutions}
                      expectedAccountSelectionRef={data.expectedAccountSelectionRef}
                      onCatalogChange={setAvailableTags}
                      onManageTags={
                        designPreview ? undefined : () => setManageTagsOpen(true)
                      }
                      onTagsChange={(tags) =>
                        setOpenPositionTags((current) => ({
                          ...current,
                          [position.positionKey]: tags,
                        }))
                      }
                      sessionDate={data.date}
                      tags={openPositionTags[position.positionKey] ?? []}
                      targetKey={position.positionKey}
                      targetKind="open-position"
                    />
                  )}
                  <Divider sx={{ my: 2 }} />
                  {readOnly ? (
                    <Typography color="text.secondary" variant="body2">
                      Position plan: not set in this Trade Tracker slice
                    </Typography>
                  ) : (
                    <TextField
                      helperText="Select open position type"
                      label="Position plan"
                      onChange={(event) =>
                        setOpenPositionPlans((current) => ({
                          ...current,
                          [position.positionKey]: event.target.value as
                            | "not-set"
                            | "day-trade"
                            | "swing"
                            | "other",
                        }))
                      }
                      select
                      size="small"
                      sx={{ maxWidth: 320, width: "100%" }}
                      value={openPositionPlans[position.positionKey] ?? "not-set"}
                    >
                      <MenuItem value="not-set">Not set</MenuItem>
                      <MenuItem value="day-trade">Day trade</MenuItem>
                      <MenuItem value="swing">Swing</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </TextField>
                  )}
                </Box>
              </Box>
            </Card>
          ))}
        </Stack>
      ) : null}

      <DashboardPanel title="Rules">
        {readOnly ? (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            {rules.filter((rule) => rule.applicability === "day").length === 0 ? (
              <Typography color="text.secondary" variant="body2">No active day rules.</Typography>
            ) : rules.filter((rule) => rule.applicability === "day").map((rule) => (
              <Stack direction="row" key={rule.ruleId} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                <Typography variant="body2">{rule.label}</Typography>
                <Chip
                  color={rule.status === "followed" ? "success" : rule.status === "broken" ? "error" : "default"}
                  label={rule.status === "not-reviewed" ? "Not reviewed" : rule.status === "followed" ? "Followed" : "Broken"}
                  size="small"
                  variant={rule.status === "not-reviewed" ? "outlined" : "filled"}
                />
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
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <TextField
                  fullWidth
                  label="Preset day rule"
                  onChange={(event) =>
                    setSelectedDayPresetRuleId(event.target.value)
                  }
                  select
                  size="small"
                  value={selectedDayPresetRule?.ruleId ?? ""}
                >
                  {dayPresetRules.map((rule) => (
                    <MenuItem key={rule.ruleId} value={rule.ruleId}>
                      {rule.label}
                    </MenuItem>
                  ))}
                </TextField>
                <Chip
                  color={
                    selectedDayPresetRule?.status === "followed"
                      ? "success"
                      : selectedDayPresetRule?.status === "broken"
                        ? "error"
                        : "default"
                  }
                  label={
                    selectedDayPresetRule?.status === "followed"
                      ? "Followed"
                      : selectedDayPresetRule?.status === "broken"
                        ? "Broken"
                        : "Not evaluated"
                  }
                  sx={{ alignSelf: { sm: "center" }, minWidth: 118 }}
                  variant={
                    selectedDayPresetRule?.status === "not-reviewed"
                      ? "outlined"
                      : "filled"
                  }
                />
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
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <TextField
                fullWidth
                label="Custom day rule"
                onChange={(event) =>
                  setSelectedDayCustomRuleId(event.target.value)
                }
                select
                size="small"
                value={selectedDayCustomRule?.ruleId ?? ""}
              >
                {dayCustomRules.length === 0 ? (
                  <MenuItem value="">No custom day rules</MenuItem>
                ) : null}
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
            }}
            placeholder="What should you improve next time?"
            value={dailyNote.whatNeedsWork}
          />
          <TextField
            disabled={readOnly}
            label="Technical recap (optional)"
            minRows={4}
            multiline
            onChange={(event) => {
              setDailyNote((current) => ({
                ...current,
                technicalRecap: event.target.value,
              }));
              setNotesState("idle");
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
