"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import ErrorOutlineRoundedIcon from "@mui/icons-material/ErrorOutlineRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  designPreview,
  onCatalogChange,
  onTagsChange,
  roundTrip,
  sessionDate,
  tags,
}: {
  availableTags: DaySessionTradeTag[];
  designPreview: boolean;
  onCatalogChange: (tags: DaySessionTradeTag[]) => void;
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  roundTrip: DaySessionRoundTrip;
  sessionDate: string;
  tags: DaySessionTradeTag[];
}) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(tags.map((tag) => tag.tagId));
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
        onCatalogChange(
          [...availableTags, created].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        );
        setSelectedIds((current) => [...current, created.tagId]);
        setNewName("");
        return;
      }
      const created = await api<DaySessionTradeTag>("/api/intelligence/trade-tags", {
        body: JSON.stringify({ name: newName }),
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
        const saved = availableTags.filter((tag) =>
          selectedIds.includes(tag.tagId),
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
        return;
      }
      const saved = await api<DaySessionTradeTag[]>(
        `/api/intelligence/trades/${encodeURIComponent(roundTrip.roundTripKey)}/tags`,
        {
          body: JSON.stringify({ sessionDate, tagIds: selectedIds }),
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
            {availableTags.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 1 }} variant="body2">
                No tags created yet.
              </Typography>
            ) : null}
            {availableTags.map((tag) => (
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
  onChange,
  onClose,
  open,
  tags,
}: {
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
          body: JSON.stringify({ expectedRevision: tag.revision, name }),
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
        `Delete “${tag.name}” and remove it from ${tag.assignmentCount} trade${tag.assignmentCount === 1 ? "" : "s"}?`,
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
          `Delete “${tag.name}” and remove it from ${typed.assignmentCount} trade${typed.assignmentCount === 1 ? "" : "s"}?`,
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

function money(value: string, currency: string): string {
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(value);
  if (!match) return "Unavailable";
  const symbol =
    new Intl.NumberFormat("en-US", {
      currency,
      currencyDisplay: "narrowSymbol",
      style: "currency",
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;
  const sign = match[1] === "-" ? "-" : "+";
  const whole = match[2].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  const suppliedFraction = match[3] ?? "";
  const fraction =
    suppliedFraction.length >= 2
      ? suppliedFraction
      : suppliedFraction.padEnd(2, "0");
  return `${sign}${symbol}${whole}.${fraction}`;
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
  return `${value.startsWith("-") ? "" : "+"}${value}%`;
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

function pnlColor(value: string): "success.main" | "error.main" | "text.primary" {
  if (/^-/.test(value) && !/^-0(?:\.0+)?$/.test(value)) return "error.main";
  if (/^0(?:\.0+)?$/.test(value)) return "text.primary";
  return "success.main";
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
  onCatalogChange,
  onTagsChange,
  roundTrip,
  sessionDate,
  tags,
}: {
  availableTags: DaySessionTradeTag[];
  currency: string;
  designPreview: boolean;
  onCatalogChange: (tags: DaySessionTradeTag[]) => void;
  onTagsChange: (tags: DaySessionTradeTag[]) => void;
  roundTrip: DaySessionRoundTrip;
  sessionDate: string;
  tags: DaySessionTradeTag[];
}) {
  const status = statusPresentation(roundTrip.journal.ruleStatus);
  const StatusIcon = status.icon;

  return (
    <Box sx={{ px: { xs: 2, md: 2.5 }, py: 2 }}>
      <Box
        sx={{
          alignItems: { md: "center" },
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "minmax(0, 1fr) auto",
            md: "minmax(150px, 1fr) 80px 120px",
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
        <Chip
          label={roundTrip.direction === "long" ? "Long" : "Short"}
          size="small"
          variant="outlined"
        />
        <Typography
          color={pnlColor(roundTrip.netPnl)}
          sx={{
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 850,
            gridColumn: { xs: "1 / -1", md: "auto" },
            textAlign: { md: "right" },
          }}
          variant="body1"
        >
          {money(roundTrip.netPnl, currency)}
        </Typography>
        <Typography
          color={pnlColor(roundTrip.gainLossPercent ?? "0")}
          sx={{
            fontFamily: "var(--font-geist-mono)",
            fontWeight: 750,
            gridColumn: { xs: "1 / -1", md: "3" },
            textAlign: { md: "right" },
          }}
          variant="caption"
        >
          {percentage(roundTrip.gainLossPercent)}
        </Typography>
      </Box>

      <TradeTagEditor
        availableTags={availableTags}
        designPreview={designPreview}
        onCatalogChange={onCatalogChange}
        onTagsChange={onTagsChange}
        roundTrip={roundTrip}
        sessionDate={sessionDate}
        tags={tags}
      />

      <Box
        sx={{
          bgcolor: "rgba(1, 30, 86, 0.035)",
          borderRadius: 1.5,
          display: { xs: "none", md: "grid" },
          gap: 1.5,
          gridTemplateColumns: "minmax(0, 1.45fr) minmax(220px, 0.75fr)",
          mt: 1.5,
          p: 1.5,
        }}
      >
        <Box>
          <Typography color="text.secondary" variant="caption">
            Technical notes
          </Typography>
          <Typography sx={{ mt: 0.4 }} variant="body2">
            {roundTrip.journal.technicalNote}
          </Typography>
        </Box>
        <Box>
          <Typography color="text.secondary" variant="caption">
            Rule review
          </Typography>
          <Stack
            direction="row"
            spacing={0.75}
            sx={{ alignItems: "flex-start", mt: 0.5 }}
          >
            <StatusIcon
              color={status.color === "default" ? "disabled" : status.color}
              fontSize="small"
            />
            <Box>
              <Typography sx={{ fontWeight: 750 }} variant="body2">
                {status.label}
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {roundTrip.journal.ruleSummary}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>

      <Accordion
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
          <Typography color="text.secondary" variant="caption">
            Technical notes
          </Typography>
          <Typography sx={{ mt: 0.4 }} variant="body2">
            {roundTrip.journal.technicalNote}
          </Typography>
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
        </AccordionDetails>
      </Accordion>
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
        bgcolor: selected ? "rgba(1, 30, 86, 0.08)" : "background.paper",
        border: 1,
        borderColor: selected ? "primary.main" : "divider",
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
        color={selected ? "primary.main" : "text.primary"}
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
  topContent,
}: {
  data: DaySessionData;
  designPreview?: boolean;
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
  const [dailyNote, setDailyNote] = useState(data.dailyNote);
  const [notesState, setNotesState] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const tradeCount = data.tickers.reduce(
    (count, ticker) => count + ticker.roundTrips.length,
    0,
  );
  const reviewingPastDay = data.date !== data.week.currentSessionDate;

  async function saveRuleStatus(
    selectedRule: DaySessionRule,
    status: DaySessionRule["status"],
  ): Promise<void> {
    if (designPreview) {
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

  async function saveDailyNotes(): Promise<void> {
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
              bgcolor: "rgba(1, 30, 86, 0.035)",
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
            {!designPreview ? (
              <DashboardSecondaryAction onClick={() => setManageTagsOpen(true)}>
                Manage tags
              </DashboardSecondaryAction>
            ) : null}
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
            ["Tickers", String(data.tickers.length), "text.primary"],
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
                  bgcolor: "rgba(1, 30, 86, 0.035)",
                  borderBottom: { xs: 1, md: 0 },
                  borderColor: "divider",
                  borderRight: { md: 1 },
                  p: { xs: 2, md: 2.5 },
                }}
              >
                <Typography sx={{ fontWeight: 900 }} variant="h4">
                  {ticker.symbol}
                </Typography>
                <Typography
                  color={pnlColor(ticker.netPnl)}
                  sx={{
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 850,
                    mt: 1,
                  }}
                  variant="h6"
                >
                  {money(ticker.netPnl, data.currency)}
                </Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                  {ticker.roundTrips.length} trade
                  {ticker.roundTrips.length === 1 ? "" : "s"}
                </Typography>
                <Typography
                  color={pnlColor(ticker.gainLossPercent ?? "0")}
                  sx={{
                    fontFamily: "var(--font-geist-mono)",
                    fontWeight: 800,
                    mt: 0.5,
                  }}
                  variant="body2"
                >
                  {percentage(ticker.gainLossPercent)}
                </Typography>
              </Box>
              <Stack divider={<Divider flexItem />}>
                {ticker.roundTrips.map((roundTrip) => (
                  <TradeReview
                    availableTags={availableTags}
                    currency={data.currency}
                    designPreview={designPreview}
                    key={roundTrip.roundTripKey}
                    onCatalogChange={setAvailableTags}
                    onTagsChange={(tags) =>
                      setTradeTags((current) => ({
                        ...current,
                        [roundTrip.roundTripKey]: tags,
                      }))
                    }
                    roundTrip={roundTrip}
                    sessionDate={data.date}
                    tags={tradeTags[roundTrip.roundTripKey] ?? []}
                  />
                ))}
              </Stack>
            </Box>
          </Card>
        ))}
      </Stack>

      <DashboardPanel title="Rules">
        <Stack divider={<Divider flexItem />} sx={{ mt: 1 }}>
          {rules.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 1.5 }} variant="body2">
              No rule reviews recorded for this trading day.
            </Typography>
          ) : null}
          {rules.map((rule) => {
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
      </DashboardPanel>

      <DashboardPanel title="Daily Notes">
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            mt: 1.5,
          }}
        >
          <TextField
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
              disabled={notesState === "saving"}
              onClick={() => void saveDailyNotes()}
            >
              {notesState === "saving" ? "Saving Notes..." : "Save Notes"}
            </DashboardPrimaryAction>
          </Stack>
        </Box>
      </DashboardPanel>
      <ManageTagsDialog
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
