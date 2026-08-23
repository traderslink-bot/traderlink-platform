"use client";

import { useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ExpandLessRoundedIcon from "@mui/icons-material/ExpandLessRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import PauseRoundedIcon from "@mui/icons-material/PauseRounded";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import Link from "next/link";
import Decimal from "decimal.js";

import { OfflineSavedViewStatus } from "@/app/pwa/offline-saved-view-status";
import {
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
} from "../../dashboard-template";
import { FeatureHelpLink } from "../feature-help-link";
import type {
  TradingRulesDashboardView,
  TradingRulesTemplateView,
  ManualCustomRuleRecord,
  ManualCustomRuleStatus,
  ExecutionRuleDashboardCard,
  ExecutionRuleLifecycleStatus,
} from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import {
  formatJournalAnalyticsMoney,
  journalAnalyticsCurrencySymbol,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { JournalRuleIdeaRecord } from
  "@/src/modules/journal/contracts/journal-rule-idea-contracts";

type RuleEditorState = Readonly<{
  mode: "create" | "revise";
  template: TradingRulesTemplateView;
  rule: ExecutionRuleDashboardCard | null;
}>;

type ManualRuleEditorState = Readonly<{
  mode: "create" | "revise";
  rule: ManualCustomRuleRecord | null;
}>;

type ManualRuleValues = Readonly<{
  title: string;
  statement: string;
  category: ManualCustomRuleRecord["category"];
  reviewScope: ManualCustomRuleRecord["reviewScope"];
  isFocus: boolean;
}>;

type MutationResponse =
  | Readonly<{ ok: true; data: TradingRulesDashboardView }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: string; message: string }>;
    }>;

const categoryLabels = {
  trade: "Trade rules",
  trade_day: "Trade + day rules",
  day: "Day rules",
} as const;

const scopeLabels = {
  trade: "Individual trade",
  ticker_day: "Ticker and day",
  day_session: "Day session",
  trade_sequence: "Trade sequence",
} as const;

const manualCategoryLabels = {
  process: "Process",
  setup: "Setup",
  mindset: "Mindset",
  review: "Review",
} as const;

const manualReviewScopeLabels = {
  day_session: "Day session",
  trade: "Individual trade",
  both: "Day session and trade",
} as const;

const defaultManualRuleValues: ManualRuleValues = {
  title: "",
  statement: "",
  category: "process",
  reviewScope: "day_session",
  isFocus: true,
};

function formatDate(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function statusColor(
  status: ExecutionRuleLifecycleStatus,
): "success" | "warning" | "default" {
  if (status === "active") return "success";
  if (status === "paused") return "warning";
  return "default";
}

function configurationLabel(
  template: TradingRulesTemplateView,
  configuration: Readonly<Record<string, string>>,
  reportingCurrency: string,
  monetaryMultiplier: string,
): string {
  return template.parameters
    .map((parameter) => {
      const value = configuration[parameter.key] ?? "—";
      const convertedValue = /^-?(?:\d+|\d*\.\d+)$/u.test(value.trim())
        ? new Decimal(value).times(monetaryMultiplier).toString()
        : null;
      if (parameter.unit === "$") {
        return `${parameter.label}: ${convertedValue === null
          ? value
          : formatJournalAnalyticsMoney(convertedValue, reportingCurrency)}`;
      }
      if (parameter.unit === "$ per share") {
        return `${parameter.label}: ${convertedValue === null
          ? value
          : formatJournalAnalyticsMoney(convertedValue, reportingCurrency)} per share`;
      }
      return `${parameter.label}: ${value}${parameter.unit ? ` ${parameter.unit}` : ""}`;
    })
    .join(" · ");
}

function exampleLabel(
  template: TradingRulesTemplateView,
  reportingCurrency: string,
  monetaryMultiplier: string,
): string {
  if (Object.values(template.exampleConfiguration).some((value) => value.trim().length === 0)) {
    return "Choose your wait time when you add this rule.";
  }
  const configuration = configurationLabel(
    template,
    template.exampleConfiguration,
    reportingCurrency,
    monetaryMultiplier,
  );
  return configuration || "This rule has no additional settings.";
}

function parameterHelperText(
  parameter: TradingRulesTemplateView["parameters"][number],
  sourceCurrency: string,
): string {
  const symbol = journalAnalyticsCurrencySymbol(sourceCurrency) ?? "";
  if (parameter.unit === "$") {
    return parameter.maximum
      ? `Enter the account-currency amount. Maximum: ${symbol}${parameter.maximum}.`
      : "Enter the account-currency amount.";
  }
  if (parameter.unit === "$ per share") {
    return parameter.maximum
      ? `Enter the account-currency price per share. Maximum: ${symbol}${parameter.maximum}.`
      : "Enter the account-currency price per share.";
  }
  return parameter.maximum
    ? `Unit: ${parameter.unit}. Maximum: ${parameter.maximum}.`
    : `Unit: ${parameter.unit}.`;
}

function latestResultLabel(rule: ExecutionRuleDashboardCard): string {
  void rule;
  return "Calculated automatically in Daily Trade Tracker";
}

export function RulesClient({
  initialView,
  initialRuleIdeas,
  monetaryMultiplier,
  offlineSavedAtUtc,
  reportingCurrency,
  sourceCurrency,
}: {
  initialView: TradingRulesDashboardView;
  initialRuleIdeas: readonly JournalRuleIdeaRecord[];
  monetaryMultiplier: string;
  offlineSavedAtUtc?: string;
  reportingCurrency: string;
  sourceCurrency: string;
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [view, setView] = useState(initialView);
  const [ruleIdeas, setRuleIdeas] = useState(initialRuleIdeas);
  const [ruleIdeaBusy, setRuleIdeaBusy] = useState(false);
  const [ruleIdeaCheckComplete, setRuleIdeaCheckComplete] = useState(false);
  const [ruleIdeaCycleComplete, setRuleIdeaCycleComplete] = useState(false);
  const [addingIdeaId, setAddingIdeaId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<RuleEditorState | null>(null);
  const [editorValues, setEditorValues] = useState<Record<string, string>>({});
  const [retireRule, setRetireRule] =
    useState<ExecutionRuleDashboardCard | null>(null);
  const [manualEditor, setManualEditor] =
    useState<ManualRuleEditorState | null>(null);
  const [manualValues, setManualValues] =
    useState<ManualRuleValues>(defaultManualRuleValues);
  const [retireManualRule, setRetireManualRule] =
    useState<ManualCustomRuleRecord | null>(null);
  const [presetLibraryOpen, setPresetLibraryOpen] = useState(false);
  const [customRulesOpen, setCustomRulesOpen] = useState(false);
  const [expandedRuleIds, setExpandedRuleIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [expandedManualRuleIds, setExpandedManualRuleIds] = useState<
    ReadonlySet<string>
  >(() => new Set());

  const activeRules = view.packet.rules.filter(
    (rule) => rule.status === "active",
  );
  const pausedRules = view.packet.rules.filter(
    (rule) => rule.status === "paused",
  );
  const retiredRules = view.packet.rules.filter(
    (rule) => rule.status === "retired",
  );
  const activeManualRules = view.manualRules.filter(
    (rule) => rule.status === "active",
  );
  const pausedManualRules = view.manualRules.filter(
    (rule) => rule.status === "paused",
  );
  const retiredManualRules = view.manualRules.filter(
    (rule) => rule.status === "retired",
  );

  const filteredTemplates = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    return view.templates.filter((template) => {
      const matchesCategory =
        category === "all" || template.category === category;
      const matchesSearch =
        !needle ||
        `${template.label} ${template.description}`
          .toLocaleLowerCase()
          .includes(needle);
      return matchesCategory && matchesSearch;
    });
  }, [category, search, view.templates]);

  async function submitMutation(
    mutation: Record<string, unknown>,
    operationId: string,
  ): Promise<boolean> {
    setBusyId(operationId);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/rules", {
        body: JSON.stringify({
          ...mutation,
          expectedAccountSelectionRef: view.expectedAccountSelectionRef,
        }),
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const result = (await response.json()) as MutationResponse;
      if (!response.ok || !result.ok) {
        setError(
          result.ok
            ? "The rule change was not accepted."
            : result.error.message,
        );
        return false;
      }
      setView(result.data);
      return true;
    } catch {
      setError("The rule change could not reach the local dashboard server.");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  function openCreate(template: TradingRulesTemplateView): void {
    setAddingIdeaId(null);
    setPresetLibraryOpen(false);
    setEditor({ mode: "create", template, rule: null });
    setEditorValues({ ...template.exampleConfiguration });
  }

  async function mutateRuleIdea(
    action: "check" | "save_for_later" | "not_for_me" | "not_for_me_and_next" | "added",
    idea: JournalRuleIdeaRecord | null = null,
  ): Promise<boolean> {
    setRuleIdeaBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/intelligence/rule-ideas", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          expectedAccountSelectionRef: view.expectedAccountSelectionRef,
          ideaId: idea?.ideaId,
          expectedRevision: idea?.revision,
        }),
      });
      const result = await response.json() as
        | Readonly<{ ok: true; ideas: readonly JournalRuleIdeaRecord[] }>
        | Readonly<{ ok: false; error: Readonly<{ message: string }> }>;
      if (!response.ok || !result.ok) {
        setError(result.ok ? "The Rule idea was not updated." : result.error.message);
        return false;
      }
      setRuleIdeas(result.ideas);
      const hasCurrentIdea = result.ideas.some((candidate) =>
        candidate.disposition === "available" || candidate.disposition === "saved_for_later");
      setRuleIdeaCheckComplete(action === "check" && !hasCurrentIdea);
      setRuleIdeaCycleComplete(action === "not_for_me_and_next" && !hasCurrentIdea);
      return true;
    } catch {
      setError("The Rule idea could not reach the local dashboard server.");
      return false;
    } finally {
      setRuleIdeaBusy(false);
    }
  }

  function openRuleIdea(idea: JournalRuleIdeaRecord): void {
    const template = view.templates.find((candidate) =>
      candidate.templateId === idea.evidence.templateId);
    if (!template) return;
    setAddingIdeaId(idea.ideaId);
    setEditor({ mode: "create", template, rule: null });
    setEditorValues({ ...idea.evidence.configuration });
  }

  function toggleExpandedRule(ruleInstanceId: string): void {
    setExpandedRuleIds((current) => {
      const next = new Set(current);
      if (next.has(ruleInstanceId)) next.delete(ruleInstanceId);
      else next.add(ruleInstanceId);
      return next;
    });
  }

  function toggleExpandedManualRule(ruleId: string): void {
    setExpandedManualRuleIds((current) => {
      const next = new Set(current);
      if (next.has(ruleId)) next.delete(ruleId);
      else next.add(ruleId);
      return next;
    });
  }

  function openRevise(rule: ExecutionRuleDashboardCard): void {
    const template = view.templates.find(
      (candidate) => candidate.templateId === rule.template.templateId,
    );
    if (!template) return;
    setEditor({ mode: "revise", template, rule });
    setEditorValues({ ...rule.currentVersion.configuration });
  }

  async function saveEditor(): Promise<void> {
    if (!editor) return;
    const mutation =
      editor.mode === "create"
        ? {
            action: "create",
            templateId: editor.template.templateId,
            configuration: editorValues,
          }
        : {
            action: "revise",
            expectedRevision: editor.rule!.revision,
            ruleInstanceId: editor.rule!.ruleInstanceId,
            configuration: editorValues,
          };
    const saved = await submitMutation(
      mutation,
      editor.rule?.ruleInstanceId ?? editor.template.templateId,
    );
    if (saved) {
      if (addingIdeaId) {
        const idea = ruleIdeas.find((candidate) => candidate.ideaId === addingIdeaId);
        if (idea) await mutateRuleIdea("added", idea);
      }
      setAddingIdeaId(null);
      setEditor(null);
    }
  }

  async function transition(
    rule: ExecutionRuleDashboardCard,
    newStatus: ExecutionRuleLifecycleStatus,
  ): Promise<void> {
    await submitMutation(
      {
        action: "transition",
        expectedRevision: rule.revision,
        expectedCurrentStatus: rule.status,
        newStatus,
        ruleInstanceId: rule.ruleInstanceId,
      },
      rule.ruleInstanceId,
    );
  }

  function openCreateManual(): void {
    setManualValues(defaultManualRuleValues);
    setManualEditor({ mode: "create", rule: null });
  }

  function openReviseManual(rule: ManualCustomRuleRecord): void {
    setManualValues({
      title: rule.title,
      statement: rule.statement,
      category: rule.category,
      reviewScope: rule.reviewScope,
      isFocus: rule.isFocus,
    });
    setManualEditor({ mode: "revise", rule });
  }

  async function saveManualEditor(): Promise<void> {
    if (!manualEditor) return;
    const mutation =
      manualEditor.mode === "create"
        ? { action: "create_manual", ...manualValues }
        : {
            action: "revise_manual",
            ...manualValues,
            ruleId: manualEditor.rule!.ruleId,
            expectedRevision: manualEditor.rule!.revision,
          };
    const saved = await submitMutation(
      mutation,
      manualEditor.rule ? `manual-${manualEditor.rule.ruleId}` : "create-manual",
    );
    if (saved) setManualEditor(null);
  }

  async function transitionManual(
    rule: ManualCustomRuleRecord,
    newStatus: ManualCustomRuleStatus,
  ): Promise<void> {
    await submitMutation(
      {
        action: "transition_manual",
        expectedRevision: rule.revision,
        expectedCurrentStatus: rule.status,
        newStatus,
        ruleId: rule.ruleId,
      },
      `manual-${rule.ruleId}`,
    );
  }

  const presetLibrary = (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 2 }}
      >
        <TextField
          fullWidth
          label="Search preset rules"
          onChange={(event) => setSearch(event.target.value)}
          size="small"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchRoundedIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          value={search}
        />
        <FormControl
          size="small"
          sx={{
            minWidth: { xs: 0, sm: 190 },
            width: { xs: "100%", sm: "auto" },
          }}
        >
          <InputLabel id="rule-category-label">Category</InputLabel>
          <Select
            label="Category"
            labelId="rule-category-label"
            onChange={(event) => setCategory(event.target.value)}
            value={category}
          >
            <MenuItem value="all">All rule groups</MenuItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
      {filteredTemplates.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No preset rules match that search and category.
        </Alert>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            mt: 1.5,
          }}
        >
          {filteredTemplates.map((template) => (
            <Card key={template.templateId} variant="outlined">
              <CardContent
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  p: 2,
                  "&:last-child": { pb: 2 },
                }}
              >
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                  <Chip
                    label={categoryLabels[template.category]}
                    size="small"
                  />
                  <Chip
                    label={scopeLabels[template.scope]}
                    size="small"
                    variant="outlined"
                  />
                </Box>
                <Typography sx={{ mt: 1.25 }} variant="h3">
                  {template.label}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ flexGrow: 1, mt: 0.5 }}
                  variant="body2"
                >
                  {template.description}
                </Typography>
                <Typography
                  color="text.secondary"
                  sx={{ mt: 1.25 }}
                  variant="caption"
                >
                  Example: {exampleLabel(template, reportingCurrency, monetaryMultiplier)}
                </Typography>
                <Button
                  disabled={busyId === template.templateId}
                  onClick={() => openCreate(template)}
                  startIcon={<AddRoundedIcon />}
                  sx={{ alignSelf: "flex-start", minHeight: 44, mt: 1.5 }}
                  variant="outlined"
                >
                  Add rule
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </>
  );

  const currentRuleIdea = ruleIdeas.find((idea) =>
    idea.disposition === "available" || idea.disposition === "saved_for_later") ?? null;
  const currentRuleIdeaTemplate = currentRuleIdea
    ? view.templates.find((template) => template.templateId === currentRuleIdea.evidence.templateId) ?? null
    : null;

  return (
    <Box component="fieldset" disabled={Boolean(offlineSavedAtUtc)} sx={{ border: 0, m: 0, minWidth: 0, p: 0 }}>
    <DashboardPage>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Typography component="h1" variant="h1">
            Trading Rules
          </Typography>
          <FeatureHelpLink href="/help/trading-rules" label="Trading Rules" size="medium" />
        </Stack>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            gap: 1,
            width: { xs: "100%", sm: "auto" },
            "& .MuiButton-root": {
              minHeight: 44,
              width: { xs: "100%", sm: "auto" },
            },
          }}
        >
          <Button component={Link} href="/rules/results" variant="outlined">
            Rule Results
          </Button>
          <Button
            onClick={() => {
              if (isMobile) {
                setPresetLibraryOpen(true);
                return;
              }
              document
                .getElementById("rule-library")
                ?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            variant="outlined"
          >
            Browse presets
          </Button>
          <Button
            onClick={openCreateManual}
            startIcon={<AddRoundedIcon />}
            variant="contained"
          >
            Create custom rule
          </Button>
        </Stack>
      </Stack>
      {offlineSavedAtUtc ? <OfflineSavedViewStatus savedAtUtc={offlineSavedAtUtc} /> : null}

      {error ? (
        <Alert onClose={() => setError(null)} severity="error">
          {error}
        </Alert>
      ) : null}

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(3, minmax(0, 1fr))",
          },
        }}
      >
        <DashboardMetricCard
          caption="Currently in force"
          label="Active rules"
          value={String(activeRules.length + activeManualRules.length)}
        />
        <DashboardMetricCard
          caption="Available to check against your trades"
          label="Rule library"
          value={String(view.templates.length)}
        />
        <DashboardMetricCard
          caption="Shown with each eligible Day trade"
          label="Preset checks"
          value="Automatic"
        />
      </Box>

      <DashboardPanel
        action={currentRuleIdea?.disposition === "saved_for_later"
          ? <Chip label="Saved for later" size="small" variant="outlined" />
          : undefined}
        title="Rule idea"
      >
        {currentRuleIdea && currentRuleIdeaTemplate ? (
          <Stack spacing={2}>
            <Box>
              <Typography component="h3" variant="h3">
                {currentRuleIdeaTemplate.label}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {configurationLabel(
                  currentRuleIdeaTemplate,
                  currentRuleIdea.evidence.configuration,
                  currentRuleIdea.evidence.currency,
                  "1",
                )}
              </Typography>
            </Box>
            <Typography>
              Across {currentRuleIdea.evidence.triggerDays} trading days, {currentRuleIdea.evidence.affectedTradeCount} later trades had a combined result of {formatJournalAnalyticsMoney(currentRuleIdea.evidence.affectedPnlDecimal, currentRuleIdea.evidence.currency)}. Their average was {formatJournalAnalyticsMoney(currentRuleIdea.evidence.affectedAveragePnlDecimal, currentRuleIdea.evidence.currency)} per trade.
            </Typography>
            <Typography color="text.secondary">
              The {currentRuleIdea.evidence.comparisonTradeCount} other trades on those days had a combined result of {formatJournalAnalyticsMoney(currentRuleIdea.evidence.comparisonPnlDecimal, currentRuleIdea.evidence.currency)} and averaged {formatJournalAnalyticsMoney(currentRuleIdea.evidence.comparisonAveragePnlDecimal, currentRuleIdea.evidence.currency)} per trade. After removing the single worst affected trade, the remaining affected result was still {formatJournalAnalyticsMoney(currentRuleIdea.evidence.affectedPnlWithoutWorstTradeDecimal, currentRuleIdea.evidence.currency)}.
            </Typography>
            <Typography color="text.secondary">
              Ideas are shown one at a time based on how broadly the pattern appears in your completed trades. This is not a claim that it is your single best rule.
            </Typography>
            <Alert severity="info">
              This is a factual pattern in completed trades, not proof that the rule caused the difference or will improve future results.
            </Alert>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                disabled={ruleIdeaBusy}
                onClick={() => openRuleIdea(currentRuleIdea)}
                variant="contained"
              >
                Add rule
              </Button>
              {currentRuleIdea.disposition === "available" ? (
                <Button
                  disabled={ruleIdeaBusy}
                  onClick={() => void mutateRuleIdea("save_for_later", currentRuleIdea)}
                  variant="outlined"
                >
                  Save for later
                </Button>
              ) : null}
              <Button
                disabled={ruleIdeaBusy}
                onClick={() => void mutateRuleIdea("not_for_me_and_next", currentRuleIdea)}
              >
                Not for me — show another
              </Button>
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1.5} sx={{ alignItems: "flex-start" }}>
            {ruleIdeaCycleComplete ? (
              <Alert severity="info">
                You have gone through every other currently supported Rule idea. The one you dismissed will not appear again for 90 days.
              </Alert>
            ) : ruleIdeaCheckComplete ? (
              <Alert severity="info">
                I checked your completed Day trades, but none currently meet all the evidence checks for a Rule idea. Nothing was changed.
              </Alert>
            ) : (
              <Typography color="text.secondary">
                Check your completed Day trades for a repeated, well-supported pattern that matches an available preset rule.
              </Typography>
            )}
            <Button
              disabled={ruleIdeaBusy}
              onClick={() => void mutateRuleIdea("check")}
              variant="outlined"
            >
              {ruleIdeaBusy ? "Checking…" : ruleIdeaCheckComplete ? "Check again" : "Check my trades"}
            </Button>
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel
        action={
          pausedRules.length ? (
            <Chip
              label={`${pausedRules.length} paused`}
              size="small"
              variant="outlined"
            />
          ) : undefined
        }
        eyebrow="CURRENT COMMITMENTS"
        title="Your trading rules"
      >
        <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
          Active rules apply prospectively. Paused intervals are excluded from
          adherence, and retired rules keep their history.
        </Typography>
        <Typography component="h3" sx={{ mb: 1.25 }} variant="h3">
          Preset rules
        </Typography>
        {view.packet.rules.length === 0 ? (
          <Box
            sx={{
              bgcolor: "background.default",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h3">No preset rules yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Pick one or two presets from the library below. Rules are
              commitments you choose, not requirements imposed by the app.
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {[...activeRules, ...pausedRules, ...retiredRules].map((rule) => {
              const template = view.templates.find(
                (candidate) =>
                  candidate.templateId === rule.template.templateId,
              );
              const expanded = expandedRuleIds.has(rule.ruleInstanceId);
              const detailsId = `rule-details-${rule.ruleInstanceId}`;
              return (
                <Card key={rule.ruleInstanceId} sx={{ border: "2px solid #000" }} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                          <Chip
                            color={statusColor(rule.status)}
                            label={rule.status}
                            size="small"
                          />
                          <Chip label="Preset" size="small" variant="outlined" />
                          <Chip
                            label={categoryLabels[rule.template.category]}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={
                              scopeLabels[
                                rule.template
                                  .scope as keyof typeof scopeLabels
                              ] ?? rule.template.scope
                            }
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                        <Typography component="h3" variant="h3">
                          {rule.template.label}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box
                      sx={{
                        bgcolor: "background.default",
                        borderRadius: 1.5,
                        mt: 1.5,
                        p: 1.5,
                      }}
                    >
                      <Typography sx={{ fontWeight: 650 }} variant="body2">
                        {template
                          ? configurationLabel(
                              template,
                              rule.currentVersion.configuration,
                              reportingCurrency,
                              monetaryMultiplier,
                            )
                          : "Configured rule"}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ display: { xs: expanded ? "block" : "none", md: "block" }, mt: 0.5 }}
                        variant="caption"
                      >
                        Effective {formatDate(rule.currentVersion.effectiveFrom)}
                      </Typography>
                    </Box>
                    <Button
                      aria-controls={detailsId}
                      aria-expanded={expanded}
                      endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                      fullWidth
                      onClick={() => toggleExpandedRule(rule.ruleInstanceId)}
                      sx={{ display: { xs: "flex", md: "none" }, justifyContent: "space-between", minHeight: 44, mt: 1 }}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </Button>
                    <Box
                      id={detailsId}
                      sx={{ display: { xs: expanded ? "block" : "none", md: "block" } }}
                    >
                      <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">
                        {rule.template.description}
                      </Typography>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{
                          alignItems: { xs: "stretch", sm: "center" },
                          justifyContent: "space-between",
                          mt: 1.5,
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" variant="caption">
                            Latest result
                          </Typography>
                          <Typography
                            sx={{ fontWeight: 650, textTransform: "capitalize" }}
                            variant="body2"
                          >
                            {latestResultLabel(rule)}
                          </Typography>
                        </Box>
                        {busyId === rule.ruleInstanceId ? (
                          <Skeleton height={44} width={152} />
                        ) : rule.status === "retired" ? null : (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {rule.status === "active" ? (
                              <Button
                                onClick={() => openRevise(rule)}
                                size="small"
                                startIcon={<EditRoundedIcon />}
                                sx={{ minHeight: 44 }}
                              >
                                Adjust
                              </Button>
                            ) : null}
                            <Button
                              onClick={() =>
                                void transition(
                                  rule,
                                  rule.status === "active" ? "paused" : "active",
                                )
                              }
                              size="small"
                              startIcon={
                                rule.status === "active" ? (
                                  <PauseRoundedIcon />
                                ) : (
                                  <PlayArrowRoundedIcon />
                                )
                              }
                              sx={{ minHeight: 44 }}
                              variant="outlined"
                            >
                              {rule.status === "active" ? "Pause" : "Resume"}
                            </Button>
                            <IconButton
                              aria-label={`Retire ${rule.template.label}`}
                              color="inherit"
                              onClick={() => setRetireRule(rule)}
                              sx={{ minHeight: 44, minWidth: 44 }}
                            >
                              <ArchiveRoundedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
        <Divider sx={{ my: 2.5 }} />
        <Typography component="h3" variant="h3">
          Custom rules
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2, mt: 0.75 }} variant="body2">
          Use this for a rule that matters to you but cannot be confirmed from
          trade data alone.
        </Typography>
        <Button
          aria-controls="custom-rules-list"
          aria-expanded={customRulesOpen}
          endIcon={customRulesOpen ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
          fullWidth
          onClick={() => setCustomRulesOpen((current) => !current)}
          sx={{ display: { xs: "flex", md: "none" }, justifyContent: "space-between", mb: customRulesOpen ? 1.5 : 0, minHeight: 44 }}
          variant="outlined"
        >
          {customRulesOpen
            ? "Hide custom rules"
            : `Show custom rules (${view.manualRules.length})`}
        </Button>
        <Box
          id="custom-rules-list"
          sx={{ display: { xs: customRulesOpen ? "block" : "none", md: "block" } }}
        >
        {view.manualRules.length === 0 ? (
          <Box
            sx={{
              bgcolor: "background.default",
              border: 1,
              borderColor: "divider",
              borderRadius: 2,
              p: { xs: 2, sm: 3 },
            }}
          >
            <Typography variant="h3">No custom rules yet</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Write a commitment in your own words, such as “Wait for
              confirmation before entering.”
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(2, minmax(0, 1fr))",
              },
            }}
          >
            {[...activeManualRules, ...pausedManualRules, ...retiredManualRules].map(
              (rule) => {
                const expanded = expandedManualRuleIds.has(rule.ruleId);
                const detailsId = `manual-rule-details-${rule.ruleId}`;
                return (
                <Card key={rule.ruleId} sx={{ border: "2px solid #000" }} variant="outlined">
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack
                      direction="row"
                      spacing={2}
                      sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1 }}>
                          <Chip
                            color={statusColor(rule.status)}
                            label={rule.status}
                            size="small"
                          />
                          <Chip label="Custom" size="small" variant="outlined" />
                          {rule.isFocus ? <Chip color="primary" label="Focus" size="small" /> : null}
                        </Box>
                        <Typography component="h3" variant="h3">
                          {rule.title}
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mt: 1.5 }}>
                      <Chip label={manualCategoryLabels[rule.category]} size="small" />
                      <Chip label={manualReviewScopeLabels[rule.reviewScope]} size="small" variant="outlined" />
                    </Box>
                    <Button
                      aria-controls={detailsId}
                      aria-expanded={expanded}
                      endIcon={expanded ? <ExpandLessRoundedIcon /> : <ExpandMoreRoundedIcon />}
                      fullWidth
                      onClick={() => toggleExpandedManualRule(rule.ruleId)}
                      sx={{ display: { xs: "flex", md: "none" }, justifyContent: "space-between", minHeight: 44, mt: 1 }}
                    >
                      {expanded ? "Hide details" : "View details"}
                    </Button>
                    <Box
                      id={detailsId}
                      sx={{ display: { xs: expanded ? "block" : "none", md: "block" } }}
                    >
                      <Typography color="text.secondary" sx={{ mt: 1.25 }} variant="body2">
                        {rule.statement}
                      </Typography>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1.5}
                        sx={{
                          alignItems: { xs: "stretch", sm: "center" },
                          justifyContent: "space-between",
                          mt: 1.5,
                        }}
                      >
                        <Box>
                          <Typography color="text.secondary" variant="caption">
                            Check-ins
                          </Typography>
                          <Typography sx={{ fontWeight: 650 }} variant="body2">
                            Available with the future Day Session review
                          </Typography>
                        </Box>
                        {busyId === `manual-${rule.ruleId}` ? (
                          <Skeleton height={44} width={152} />
                        ) : rule.status === "retired" ? null : (
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75 }}>
                            {rule.status === "active" ? (
                              <Button
                                onClick={() => openReviseManual(rule)}
                                size="small"
                                startIcon={<EditRoundedIcon />}
                                sx={{ minHeight: 44 }}
                              >
                                Edit
                              </Button>
                            ) : null}
                            <Button
                              onClick={() =>
                                void transitionManual(
                                  rule,
                                  rule.status === "active" ? "paused" : "active",
                                )
                              }
                              size="small"
                              startIcon={
                                rule.status === "active" ? (
                                  <PauseRoundedIcon />
                                ) : (
                                  <PlayArrowRoundedIcon />
                                )
                              }
                              sx={{ minHeight: 44 }}
                              variant="outlined"
                            >
                              {rule.status === "active" ? "Pause" : "Resume"}
                            </Button>
                            <IconButton
                              aria-label={`Retire ${rule.title}`}
                              color="inherit"
                              onClick={() => setRetireManualRule(rule)}
                              sx={{ minHeight: 44, minWidth: 44 }}
                            >
                              <ArchiveRoundedIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </Card>
                );
              },
            )}
          </Box>
        )}
        </Box>
      </DashboardPanel>

      <Divider sx={{ display: { xs: "none", md: "block" } }} />

      {!isMobile ? <Box component="section" id="rule-library" sx={{ scrollMarginTop: 88 }}>
        <Typography
          color="primary.main"
          sx={{ fontWeight: 700 }}
          variant="caption"
        >
          PRESET LIBRARY
        </Typography>
        <Typography component="h2" sx={{ mt: 0.25 }} variant="h2">
          Rules that can be checked against your trades
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
          Each preset connects to a specific part of your trade data, such as
          an individual trade, a ticker, or a day session. Browse the library,
          then turn on only the rules you want to follow.
        </Typography>
        {presetLibrary}
      </Box> : null}

      <Dialog
        aria-labelledby="mobile-preset-library-title"
        fullScreen
        onClose={() => setPresetLibraryOpen(false)}
        open={isMobile && presetLibraryOpen}
      >
        <DialogTitle
          id="mobile-preset-library-title"
          sx={{
            alignItems: "center",
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
            display: "flex",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            zIndex: 2,
          }}
        >
          Browse preset rules
          <IconButton
            aria-label="Close preset rules"
            onClick={() => setPresetLibraryOpen(false)}
            sx={{ minHeight: 44, minWidth: 44 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 2 }}>
          <Typography color="text.secondary" variant="body2">
            Search the rules the app can check automatically, then add only the ones you want to follow.
          </Typography>
          {presetLibrary}
        </DialogContent>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setEditor(null)}
        open={editor !== null}
      >
        {editor ? (
          <>
            <DialogTitle>
              {editor.mode === "create"
                ? "Add trading rule"
                : "Adjust trading rule"}
            </DialogTitle>
            <DialogContent>
              <Typography variant="h2">{editor.template.label}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {editor.template.description}
              </Typography>
              {editor.template.parameters.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2.5 }}>
                  No extra settings are needed. This rule is already set to use
                  half your usual size after a loss.
                </Alert>
              ) : null}
              <Stack
                spacing={2}
                sx={{ mt: editor.template.parameters.length === 0 ? 0 : 2.5 }}
              >
                {editor.template.parameters.map((parameter) =>
                  parameter.kind === "enum" ? (
                    <FormControl fullWidth key={parameter.key}>
                      <InputLabel id={`${parameter.key}-label`}>
                        {parameter.label}
                      </InputLabel>
                      <Select
                        label={parameter.label}
                        labelId={`${parameter.key}-label`}
                        onChange={(event) =>
                          setEditorValues((current) => ({
                            ...current,
                            [parameter.key]: event.target.value,
                          }))
                        }
                        value={editorValues[parameter.key] ?? ""}
                      >
                        {parameter.options.map((option) => (
                          <MenuItem key={option} value={option}>
                            {option.replaceAll("_", " ")}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ) : (
                    <TextField
                      fullWidth
                      helperText={parameterHelperText(parameter, sourceCurrency)}
                      key={parameter.key}
                      label={parameter.label}
                      onChange={(event) =>
                        setEditorValues((current) => ({
                          ...current,
                          [parameter.key]: event.target.value,
                        }))
                      }
                      slotProps={
                        parameter.kind === "wall_clock_time"
                          ? { inputLabel: { shrink: true } }
                          : undefined
                      }
                      type={
                        parameter.kind === "wall_clock_time"
                          ? "time"
                          : "number"
                      }
                      value={editorValues[parameter.key] ?? ""}
                    />
                  ),
                )}
              </Stack>
              <Alert severity="warning" sx={{ mt: 2.5 }}>
                {editor.mode === "create"
                  ? "This rule becomes active now and applies prospectively."
                  : "Saving creates a new immutable version. Earlier results stay attached to the earlier definition."}
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setEditor(null)}>Cancel</Button>
              <Button
                disabled={
                  busyId !== null ||
                  editor.template.parameters.some(
                    (parameter) => !editorValues[parameter.key]?.trim(),
                  )
                }
                onClick={() => void saveEditor()}
                variant="contained"
              >
                {editor.mode === "create"
                  ? "Activate rule"
                  : "Save new version"}
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={() => setManualEditor(null)}
        open={manualEditor !== null}
      >
        {manualEditor ? (
          <>
            <DialogTitle>
              {manualEditor.mode === "create"
                ? "Create custom rule"
                : "Edit custom rule"}
            </DialogTitle>
            <DialogContent>
              <Typography color="text.secondary">
                Create your own rule and track it in your day sessions.
              </Typography>
              <Stack spacing={2} sx={{ mt: 2.5 }}>
                <TextField
                  autoFocus
                  fullWidth
                  label="Rule name"
                  onChange={(event) =>
                    setManualValues((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Wait for confirmation"
                  slotProps={{ htmlInput: { maxLength: 100 } }}
                  value={manualValues.title}
                />
                <TextField
                  fullWidth
                  label="Rule in your own words"
                  minRows={4}
                  multiline
                  onChange={(event) =>
                    setManualValues((current) => ({
                      ...current,
                      statement: event.target.value,
                    }))
                  }
                  placeholder="I wait for my confirmation before entering a trade."
                  slotProps={{ htmlInput: { maxLength: 1000 } }}
                  value={manualValues.statement}
                />
                <FormControl fullWidth>
                  <InputLabel id="manual-rule-category-label">Category</InputLabel>
                  <Select
                    label="Category"
                    labelId="manual-rule-category-label"
                    onChange={(event) =>
                      setManualValues((current) => ({
                        ...current,
                        category: event.target.value as ManualRuleValues["category"],
                      }))
                    }
                    value={manualValues.category}
                  >
                    {Object.entries(manualCategoryLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel id="manual-rule-scope-label">Review it with</InputLabel>
                  <Select
                    label="Review it with"
                    labelId="manual-rule-scope-label"
                    onChange={(event) =>
                      setManualValues((current) => ({
                        ...current,
                        reviewScope: event.target.value as ManualRuleValues["reviewScope"],
                      }))
                    }
                    value={manualValues.reviewScope}
                  >
                    {Object.entries(manualReviewScopeLabels).map(([value, label]) => (
                      <MenuItem key={value} value={value}>{label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControlLabel
                  control={
                    <Switch
                      checked={manualValues.isFocus}
                      onChange={(event) =>
                        setManualValues((current) => ({
                          ...current,
                          isFocus: event.target.checked,
                        }))
                      }
                    />
                  }
                  label="Make this a Focus Rule"
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManualEditor(null)}>Cancel</Button>
              <Button
                disabled={
                  busyId !== null ||
                  !manualValues.title.trim() ||
                  !manualValues.statement.trim()
                }
                onClick={() => void saveManualEditor()}
                variant="contained"
              >
                {manualEditor.mode === "create"
                  ? "Save custom rule"
                  : "Save new version"}
              </Button>
            </DialogActions>
          </>
        ) : null}
      </Dialog>

      <Dialog
        onClose={() => setRetireRule(null)}
        open={retireRule !== null}
      >
        <DialogTitle>Retire this rule?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Retirement is permanent. The rule history remains available, but
            the rule cannot be resumed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetireRule(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (!retireRule) return;
              void transition(retireRule, "retired").then(() =>
                setRetireRule(null),
              );
            }}
            variant="contained"
          >
            Retire rule
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        onClose={() => setRetireManualRule(null)}
        open={retireManualRule !== null}
      >
        <DialogTitle>Retire this custom rule?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            Retirement is permanent. The rule history remains available, but
            this custom rule cannot be resumed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRetireManualRule(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (!retireManualRule) return;
              void transitionManual(retireManualRule, "retired").then(() =>
                setRetireManualRule(null),
              );
            }}
            variant="contained"
          >
            Retire custom rule
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
    </Box>
  );
}
