"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { Alert, Box, Button, CircularProgress, Drawer, FormControlLabel, IconButton, Stack, Switch, Tab, Tabs } from "@mui/material";
import { useEffect, useState } from "react";

import { RuleResultsClient } from "../rules/results/rule-results-client";
import type { RuleResultsView } from "../rules/results/rule-results-data";
import { RulesClient } from "../rules/rules-client";
import type { readTradingRulesPageModel } from "../rules/rules-page-data";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type WorkspaceRulesPanelView = "custom" | "presets" | "results" | "rules";
type RulesModel = Awaited<ReturnType<typeof readTradingRulesPageModel>>;
type Preference = Readonly<{ revision: number | null; showInWorkspace: boolean }>;
type PanelModel = Readonly<{ preference: Preference; results: RuleResultsView; rules: RulesModel }>;

const panelViews: readonly Readonly<{ label: string; value: WorkspaceRulesPanelView }>[] = [
  { label: "Trading Rules", value: "rules" },
  { label: "Browse presets", value: "presets" },
  { label: "Create custom", value: "custom" },
  { label: "Rules results", value: "results" },
];

function requestHeaders(): HeadersInit {
  return { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" };
}

export function WorkspaceRulesPanel({ initialView = "rules", onClose, onPreferenceSaved }: Readonly<{
  initialView?: WorkspaceRulesPanelView;
  onClose: () => void;
  onPreferenceSaved: (preference: Preference) => void;
}>) {
  const [activeView, setActiveView] = useState<WorkspaceRulesPanelView>(initialView);
  const [error, setError] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [model, setModel] = useState<PanelModel | null>(null);
  const [savingPreference, setSavingPreference] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    void fetch("/api/platform/journal/rules/workspace-panel", { cache: "no-store", signal: controller.signal })
      .then(async (response) => response.ok ? response.json() as Promise<{ data?: PanelModel }> : Promise.reject(new Error("rules_unavailable")))
      .then((payload) => {
        if (!payload.data) throw new Error("rules_unavailable");
        setModel(payload.data);
      })
      .catch((failure: unknown) => {
        if (!(failure instanceof DOMException && failure.name === "AbortError")) setError(true);
      });
    return () => controller.abort();
  }, [loadAttempt]);

  async function savePreference(showInWorkspace: boolean): Promise<void> {
    if (!model) return;
    setSavingPreference(true);
    try {
      const response = await fetch("/api/platform/journal/rules/workspace-card-preference", {
        body: JSON.stringify({ expectedRevision: model.preference.revision, showInWorkspace }),
        credentials: "same-origin",
        headers: requestHeaders(),
        method: "PUT",
      });
      const payload = await response.json() as { preference?: Preference };
      if (!response.ok || !payload.preference) throw new Error("preference_unavailable");
      setModel((current) => current ? { ...current, preference: payload.preference! } : current);
      onPreferenceSaved(payload.preference);
    } catch {
      setError(true);
    } finally {
      setSavingPreference(false);
    }
  }

  return <Drawer
    anchor="right"
    onClose={onClose}
    open
    PaperProps={{ sx: { maxWidth: "100vw", width: { xs: "100%", md: 1040 } } }}
  >
    <Stack sx={{ height: "100%", minHeight: 0 }}>
      <Stack direction="row" sx={{ alignItems: "center", borderBottom: 1, borderColor: "divider", justifyContent: "space-between", px: { xs: 1, sm: 2 }, py: 0.75 }}>
        <Tabs
          aria-label="Rules views"
          onChange={(_, value: WorkspaceRulesPanelView) => setActiveView(value)}
          scrollButtons="auto"
          sx={{ minHeight: 44 }}
          value={activeView}
          variant="scrollable"
        >
          {panelViews.map((view) => <Tab key={view.value} label={view.label} value={view.value} />)}
        </Tabs>
        <IconButton aria-label="Close rules" onClick={onClose} sx={{ minHeight: 44, minWidth: 44 }}><CloseRoundedIcon /></IconButton>
      </Stack>
      <Box sx={{ borderBottom: 1, borderColor: "divider", px: { xs: 2, sm: 3 }, py: 0.5 }}>
        <FormControlLabel
          control={<Switch checked={model?.preference.showInWorkspace ?? false} disabled={!model || savingPreference} onChange={(event) => void savePreference(event.target.checked)} />}
          label="Show rule results in Workspace"
        />
      </Box>
      <Box sx={{ flex: 1, minHeight: 0, overflowY: "auto", p: { xs: 2, sm: 3 } }}>
        {error ? <Stack spacing={1.5}><Alert severity="error">Rules could not be loaded or updated. Try again.</Alert><Button onClick={() => { setError(false); setModel(null); setLoadAttempt((current) => current + 1); }} variant="outlined">Try again</Button></Stack> : model === null ? <Box sx={{ display: "grid", minHeight: 280, placeItems: "center" }}><CircularProgress aria-label="Loading Rules" size={28} /></Box> : activeView === "results" ? <RuleResultsClient initialView={model.results} presentation="workspace-panel" /> : <RulesClient
          initialRuleIdeas={model.rules.initialRuleIdeas}
          initialView={model.rules.initialView}
          key={activeView}
          monetaryMultiplier={model.rules.monetaryMultiplier}
          onOpenResults={() => setActiveView("results")}
          onPanelModeClose={() => setActiveView("rules")}
          onRulesChanged={() => { setModel(null); setLoadAttempt((current) => current + 1); }}
          panelMode={activeView === "presets" || activeView === "custom" ? activeView : undefined}
          presentation="workspace-panel"
          reportingCurrency={model.rules.reportingCurrency}
          sourceCurrency={model.rules.sourceCurrency}
        />}
      </Box>
    </Stack>
  </Drawer>;
}
