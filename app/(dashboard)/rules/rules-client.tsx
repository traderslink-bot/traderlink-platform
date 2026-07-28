"use client";

import { useMemo, useState } from "react";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ArchiveRoundedIcon from "@mui/icons-material/ArchiveRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
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
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardMetricCard,
  DashboardPanel,
} from "../../dashboard-ui";
import type {
  TradingRulesDashboardView,
  TradingRulesTemplateView,
} from "@/src/lib/trader-intelligence-rules";
import type {
  ExecutionRuleDashboardCard,
  ExecutionRuleLifecycleStatus,
} from "@/src/lib/trader-intelligence-v3/analytics/rules";

type RuleEditorState = Readonly<{
  mode: "create" | "revise";
  template: TradingRulesTemplateView;
  rule: ExecutionRuleDashboardCard | null;
}>;

type MutationResponse =
  | Readonly<{ ok: true; data: TradingRulesDashboardView }>
  | Readonly<{
      ok: false;
      error: Readonly<{ code: string; message: string }>;
    }>;

const categoryLabels = {
  frequency: "Frequency",
  timing: "Timing",
  risk: "Risk",
  size: "Size",
  scope: "Trade scope",
} as const;

const scopeLabels = {
  trade: "Individual trade",
  ticker_day: "Ticker and day",
  day_session: "Day session",
  trade_sequence: "Trade sequence",
} as const;

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
): string {
  return template.parameters
    .map((parameter) => {
      const value = configuration[parameter.key] ?? "—";
      if (parameter.unit === "$") {
        return `${parameter.label}: $${value}`;
      }
      if (parameter.unit === "$ per share") {
        return `${parameter.label}: $${value} per share`;
      }
      return `${parameter.label}: ${value}${parameter.unit ? ` ${parameter.unit}` : ""}`;
    })
    .join(" · ");
}

function exampleLabel(template: TradingRulesTemplateView): string {
  const configuration = configurationLabel(
    template,
    template.exampleConfiguration,
  );
  return configuration || "After a loss, the next trade uses 50% of its normal size.";
}

function parameterHelperText(parameter: TradingRulesTemplateView["parameters"][number]): string {
  if (parameter.unit === "$") {
    return parameter.maximum
      ? `Enter a dollar amount. Maximum: ${parameter.maximum}.`
      : "Enter a dollar amount.";
  }
  if (parameter.unit === "$ per share") {
    return parameter.maximum
      ? `Enter a price in dollars per share. Maximum: ${parameter.maximum}.`
      : "Enter a price in dollars per share.";
  }
  return parameter.maximum
    ? `Unit: ${parameter.unit}. Maximum: ${parameter.maximum}.`
    : `Unit: ${parameter.unit}.`;
}

function latestResultLabel(rule: ExecutionRuleDashboardCard): string {
  return rule.latestEvaluation
    ? rule.latestEvaluation.status.replaceAll("_", " ")
    : "Ready when trade analytics are available";
}

export function RulesClient({
  initialView,
}: {
  initialView: TradingRulesDashboardView;
}) {
  const [view, setView] = useState(initialView);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editor, setEditor] = useState<RuleEditorState | null>(null);
  const [editorValues, setEditorValues] = useState<Record<string, string>>({});
  const [retireRule, setRetireRule] =
    useState<ExecutionRuleDashboardCard | null>(null);

  const activeRules = view.packet.rules.filter(
    (rule) => rule.status === "active",
  );
  const pausedRules = view.packet.rules.filter(
    (rule) => rule.status === "paused",
  );
  const retiredRules = view.packet.rules.filter(
    (rule) => rule.status === "retired",
  );
  const evaluatedCount = view.packet.rules.filter(
    (rule) => rule.latestEvaluation !== null,
  ).length;

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
        body: JSON.stringify(mutation),
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
    setEditor({ mode: "create", template, rule: null });
    setEditorValues({ ...template.exampleConfiguration });
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
            ruleInstanceId: editor.rule!.ruleInstanceId,
            configuration: editorValues,
          };
    const saved = await submitMutation(
      mutation,
      editor.rule?.ruleInstanceId ?? editor.template.templateId,
    );
    if (saved) setEditor(null);
  }

  async function transition(
    rule: ExecutionRuleDashboardCard,
    newStatus: ExecutionRuleLifecycleStatus,
  ): Promise<void> {
    await submitMutation(
      {
        action: "transition",
        expectedCurrentStatus: rule.status,
        newStatus,
        ruleInstanceId: rule.ruleInstanceId,
      },
      rule.ruleInstanceId,
    );
  }

  return (
    <Stack spacing={2.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography
            color="primary.main"
            sx={{ fontWeight: 700 }}
            variant="caption"
          >
            TRADING PLAN
          </Typography>
          <Typography component="h2" sx={{ mt: 0.25 }} variant="h1">
            Rules you chose to follow
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Start with a few rules that matter to you. Add only the ones you
            want to follow.
          </Typography>
        </Box>
        <Button
          onClick={() =>
            document
              .getElementById("rule-library")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          startIcon={<AddRoundedIcon />}
          variant="contained"
        >
          Add a rule
        </Button>
      </Stack>

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
          value={String(activeRules.length)}
        />
        <DashboardMetricCard
          caption="Available to check against your trades"
          label="Rule library"
          value={String(view.templates.length)}
        />
        <DashboardMetricCard
          caption={
            view.packet.rules.length
              ? "Updated when trade analytics are available"
              : "Add a rule to begin"
          }
          label="Latest evaluations"
          value={`${evaluatedCount}/${view.packet.rules.length}`}
        />
      </Box>

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
            <Typography variant="h3">No trading rules yet</Typography>
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
              return (
                <Card key={rule.ruleInstanceId} variant="outlined">
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
                        <Stack direction="row" spacing={0.75} sx={{ mb: 1 }}>
                          <Chip
                            color={statusColor(rule.status)}
                            label={rule.status}
                            size="small"
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
                        </Stack>
                        <Typography component="h3" variant="h3">
                          {rule.template.label}
                        </Typography>
                      </Box>
                      <Typography color="text.secondary" variant="caption">
                        v{rule.currentVersion.versionOrdinal}
                      </Typography>
                    </Stack>
                    <Typography
                      color="text.secondary"
                      sx={{ mt: 0.75 }}
                      variant="body2"
                    >
                      {rule.template.description}
                    </Typography>
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
                            )
                          : "Configured rule"}
                      </Typography>
                      <Typography
                        color="text.secondary"
                        sx={{ display: "block", mt: 0.5 }}
                        variant="caption"
                      >
                        Effective {formatDate(rule.currentVersion.effectiveFrom)}
                      </Typography>
                    </Box>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1.5}
                      sx={{
                        alignItems: { xs: "flex-start", sm: "center" },
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
                        <Skeleton height={40} width={152} />
                      ) : rule.status === "retired" ? null : (
                        <Stack direction="row" spacing={0.75}>
                          {rule.status === "active" ? (
                            <Button
                              onClick={() => openRevise(rule)}
                              size="small"
                              startIcon={<EditRoundedIcon />}
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
                            variant="outlined"
                          >
                            {rule.status === "active" ? "Pause" : "Resume"}
                          </Button>
                          <Button
                            aria-label={`Retire ${rule.template.label}`}
                            color="inherit"
                            onClick={() => setRetireRule(rule)}
                            size="small"
                          >
                            <ArchiveRoundedIcon fontSize="small" />
                          </Button>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}
      </DashboardPanel>

      <Divider />

      <Box component="section" id="rule-library" sx={{ scrollMarginTop: 88 }}>
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
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ mt: 2 }}
        >
          <TextField
            fullWidth
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search rules"
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
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="rule-category-label">Category</InputLabel>
            <Select
              label="Category"
              labelId="rule-category-label"
              onChange={(event) => setCategory(event.target.value)}
              value={category}
            >
              <MenuItem value="all">All categories</MenuItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
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
                <Stack direction="row" spacing={0.75}>
                  <Chip
                    label={categoryLabels[template.category]}
                    size="small"
                  />
                  <Chip
                    label={scopeLabels[template.scope]}
                    size="small"
                    variant="outlined"
                  />
                </Stack>
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
                  Example:{" "}
                  {exampleLabel(template)}
                </Typography>
                <Button
                  disabled={busyId === template.templateId}
                  onClick={() => openCreate(template)}
                  startIcon={<AddRoundedIcon />}
                  sx={{ alignSelf: "flex-start", mt: 1.5 }}
                  variant="outlined"
                >
                  Add rule
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Box>

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
              <Stack spacing={2} sx={{ mt: 2.5 }}>
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
                      helperText={parameterHelperText(parameter)}
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
    </Stack>
  );
}
