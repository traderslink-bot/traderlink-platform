"use client";

import { Alert, Box, Button, Divider, Drawer, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import type { WorkspaceTradeLibraryQuery } from "./workspace-trade-library";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type Preference = Readonly<{ revision: number | null; showInWorkspace: boolean }>;
type FocusPreference = Readonly<{ focusText: string; revision: number; showInWorkspace: boolean }>;

export function WorkspaceMoreFiltersDrawer({ customEndDate, customStartDate, expectedAccountSelectionRef, initialFocus, newsScannerAvailable, onClose, onPreferenceSaved, open, prScannerPreference, query, ruleResultsPreference, topTickersPreference }: Readonly<{
  customEndDate: string | null;
  customStartDate: string | null;
  expectedAccountSelectionRef: string;
  initialFocus: FocusPreference | null;
  newsScannerAvailable: boolean;
  onClose: () => void;
  onPreferenceSaved: (kind: "focuses" | "rules" | "scanner" | "tickers", show: boolean, preference?: Preference, focus?: FocusPreference) => void;
  open: boolean;
  prScannerPreference: Preference;
  query: WorkspaceTradeLibraryQuery;
  ruleResultsPreference: Preference;
  topTickersPreference: Preference;
}>) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const [draft, setDraft] = useState(() => ({
    endDate: customEndDate ?? "", filter: query.filter, group: query.group,
    searchTicker: query.searchTicker, sort: query.sort, startDate: customStartDate ?? "",
  }));
  const [preferences, setPreferences] = useState({ focuses: initialFocus?.showInWorkspace ?? false, rules: ruleResultsPreference, scanner: prScannerPreference, tickers: topTickersPreference });
  const [focusRevision, setFocusRevision] = useState<number | null>(initialFocus?.revision ?? null);
  const [focusText, setFocusText] = useState(initialFocus?.focusText ?? "");
  const [preferenceError, setPreferenceError] = useState(false);
  const [saving, setSaving] = useState<readonly string[]>([]);
  useEffect(() => {
    if (!open) return;
    setDraft({ endDate: customEndDate ?? "", filter: query.filter, group: query.group, searchTicker: query.searchTicker, sort: query.sort, startDate: customStartDate ?? "" });
  }, [customEndDate, customStartDate, open, query]);
  useEffect(() => {
    if (!open) return;
    setFocusRevision(initialFocus?.revision ?? null);
    setFocusText(initialFocus?.focusText ?? "");
    setPreferences({ focuses: initialFocus?.showInWorkspace ?? false, rules: ruleResultsPreference, scanner: prScannerPreference, tickers: topTickersPreference });
  }, [initialFocus, open, prScannerPreference, ruleResultsPreference, topTickersPreference]);
  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(() => {
      const next = new URLSearchParams(currentSearch);
      const values = Object.entries(draft);
      for (const [key, value] of values) {
        const isDefault = (key === "filter" && value === "all") || (key === "group" && value === "none") || (key === "sort" && value === "newest") || value === "";
        if (isDefault) next.delete(key); else next.set(key, value);
      }
      const nextSearch = next.toString();
      if (nextSearch !== currentSearch) router.replace(next.size === 0 ? "/workspace" : `/workspace?${nextSearch}`, { scroll: false });
    }, 250);
    return () => window.clearTimeout(handle);
  }, [currentSearch, draft, open, router]);
  const active = Number(Boolean(draft.searchTicker)) + Number(draft.filter !== "all") + Number(Boolean(draft.startDate)) + Number(Boolean(draft.endDate)) + Number(draft.sort !== "newest") + Number(draft.group !== "none");
  const clear = () => setDraft({ endDate: "", filter: "all", group: "none", searchTicker: "", sort: "newest", startDate: "" });
  const savePreference = async (kind: "focuses" | "rules" | "scanner" | "tickers", showInWorkspace: boolean) => {
    setPreferenceError(false); setSaving((current) => current.includes(kind) ? current : [...current, kind]);
    const endpoints = { focuses: "/api/platform/notes/current-focuses", rules: "/api/platform/journal/rules/workspace-card-preference", scanner: "/api/platform/news/workspace-scanner/card-preference", tickers: "/api/platform/journal/workspace-top-tickers-card-preference" } as const;
    const current = kind === "rules"
      ? preferences.rules
      : kind === "scanner"
        ? preferences.scanner
        : kind === "tickers"
          ? preferences.tickers
          : null;
    const previousShow = kind === "focuses" ? preferences.focuses : current!.showInWorkspace;
    if (kind === "focuses") setPreferences((value) => ({ ...value, focuses: showInWorkspace }));
    else setPreferences((value) => ({ ...value, [kind]: { ...current!, showInWorkspace } }));
    const body = kind === "focuses"
      ? { expectedRevision: focusRevision, focusText, showInWorkspace }
      : { expectedAccountSelectionRef, expectedRevision: current!.revision, showInWorkspace };
    try {
      const response = await fetch(endpoints[kind], { body: JSON.stringify(body), credentials: "same-origin", headers: { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, method: "PUT" });
      const payload = await response.json() as { focus?: FocusPreference; preference?: Preference };
      const saved = kind === "focuses" ? payload.focus : payload.preference;
      if (!response.ok || !saved) throw new Error("preference_unavailable");
      if (kind === "focuses") { setFocusRevision(payload.focus!.revision); setPreferences((value) => ({ ...value, focuses: showInWorkspace })); }
      else setPreferences((value) => ({ ...value, [kind]: saved }));
      onPreferenceSaved(kind, showInWorkspace, kind === "focuses" ? undefined : saved as Preference, kind === "focuses" ? payload.focus : undefined);
    } catch {
      if (kind === "focuses") setPreferences((value) => ({ ...value, focuses: previousShow }));
      else setPreferences((value) => ({ ...value, [kind]: current! }));
      setPreferenceError(true);
    } finally { setSaving((current) => current.filter((value) => value !== kind)); }
  };
  return <Drawer anchor="right" onClose={onClose} open={open} slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 400 } } } }}>
    <Stack spacing={1.25} sx={{ p: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}><Typography component="h2" variant="h6">Workspace display</Typography><Button onClick={onClose}>Close</Button></Stack>
      {preferenceError ? <Alert severity="error">The Workspace display setting could not be saved. Try again.</Alert> : null}
      <FormControlLabel control={<Switch checked={preferences.focuses} disabled={!focusText.trim() || saving.includes("focuses")} onChange={(event) => void savePreference("focuses", event.target.checked)} />} label="Current Focuses" />
      <FormControlLabel control={<Switch checked={preferences.rules.showInWorkspace} disabled={saving.includes("rules")} onChange={(event) => void savePreference("rules", event.target.checked)} />} label="Rules Broken" />
      {newsScannerAvailable ? <FormControlLabel control={<Switch checked={preferences.scanner.showInWorkspace} disabled={saving.includes("scanner")} onChange={(event) => void savePreference("scanner", event.target.checked)} />} label="PR Scanner" /> : null}
      <FormControlLabel control={<Switch checked={preferences.tickers.showInWorkspace} disabled={saving.includes("tickers")} onChange={(event) => void savePreference("tickers", event.target.checked)} />} label="Top Tickers" />
      <Box sx={{ display: { md: "none" } }}><Divider sx={{ my: 1.5 }} /><Stack spacing={1.25}>
      <TextField label="Search ticker" onChange={(event) => setDraft((value) => ({ ...value, searchTicker: event.target.value.toUpperCase() }))} size="small" value={draft.searchTicker} />
      <TextField label="Filter" onChange={(event) => setDraft((value) => ({ ...value, filter: event.target.value as typeof value.filter }))} select size="small" value={draft.filter}><MenuItem value="all">All</MenuItem><MenuItem value="open">Open</MenuItem><MenuItem value="swing">Swing</MenuItem><MenuItem value="closed">Closed</MenuItem><MenuItem value="fees_not_entered">Fees not entered</MenuItem></TextField>
      <TextField label="From" onChange={(event) => setDraft((value) => ({ ...value, startDate: event.target.value }))} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.startDate} />
      <TextField label="To" onChange={(event) => setDraft((value) => ({ ...value, endDate: event.target.value }))} size="small" slotProps={{ inputLabel: { shrink: true } }} type="date" value={draft.endDate} />
      <TextField label="Sort" onChange={(event) => setDraft((value) => ({ ...value, sort: event.target.value as typeof value.sort }))} select size="small" value={draft.sort}>
        <MenuItem value="newest">Date: newest</MenuItem><MenuItem value="oldest">Date: oldest</MenuItem><MenuItem value="ticker_asc">Ticker: A-Z</MenuItem><MenuItem value="ticker_desc">Ticker: Z-A</MenuItem><MenuItem value="direction_asc">Side: A-Z</MenuItem><MenuItem value="direction_desc">Side: Z-A</MenuItem><MenuItem value="status_asc">Status: A-Z</MenuItem><MenuItem value="status_desc">Status: Z-A</MenuItem><MenuItem value="buy_quantity">Shares: high to low</MenuItem><MenuItem value="buy_quantity_asc">Shares: low to high</MenuItem><MenuItem value="position">POS: high to low</MenuItem><MenuItem value="position_asc">POS: low to high</MenuItem><MenuItem value="entry">Entry: high to low</MenuItem><MenuItem value="entry_asc">Entry: low to high</MenuItem><MenuItem value="exit">Exit: high to low</MenuItem><MenuItem value="exit_asc">Exit: low to high</MenuItem><MenuItem value="entry_value">Entry value: high to low</MenuItem><MenuItem value="entry_value_asc">Entry value: low to high</MenuItem><MenuItem value="hold">Hold: longest</MenuItem><MenuItem value="hold_asc">Hold: shortest</MenuItem><MenuItem value="pnl_high">Gain/Loss: high to low</MenuItem><MenuItem value="pnl_low">Gain/Loss: low to high</MenuItem>
      </TextField>
      <TextField label="Group" onChange={(event) => setDraft((value) => ({ ...value, group: event.target.value as typeof value.group }))} select size="small" value={draft.group}><MenuItem value="none">None</MenuItem><MenuItem value="day">Day</MenuItem><MenuItem value="ticker">Ticker</MenuItem></TextField>
      <Typography color="text.secondary" variant="body2">{active} active filter{active === 1 ? "" : "s"}</Typography>
      <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}><Button onClick={clear}>Clear filters</Button><Button disabled={draft.sort === "newest"} onClick={() => setDraft((value) => ({ ...value, sort: "newest" }))}>Return to newest</Button></Stack>
      </Stack></Box>
    </Stack>
  </Drawer>;
}
