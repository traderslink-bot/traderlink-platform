"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Drawer, Stack, TextField, Typography } from "@mui/material";
import { DashboardPanel } from "@/app/dashboard-template";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { customIndicatorTitle } from "@/src/modules/scanner/custom/custom-indicator";
import { EMPTY_SCAN, SCAN_METRICS, type ScanRule } from "@/src/modules/scanner/custom/definition";
import { SHARED_SCAN_PATH, type SharedScanView } from "@/src/modules/scanner/custom/sharing";
import { CustomScanResults } from "../../custom-scan-results";
import { useCustomScanResults } from "../../use-custom-scans";

const MarketChart = dynamic(() => import("../../../charts/market-chart").then(module => module.MarketChart),
  { ssr: false, loading: () => <Typography>Loading chart…</Typography> });

function ruleSummary(rule: ScanRule) {
  return [
    SCAN_METRICS[rule.metric].label,
    rule.selection?.join(", "),
    rule.indicator && customIndicatorTitle(rule.indicator),
    rule.comparison,
    rule.signal,
    rule.minimum != null ? "Min " + rule.minimum : "",
    rule.maximum != null ? "Max " + rule.maximum : "",
    rule.minutes ? rule.minutes + " min" : "",
    rule.frame,
    rule.direction,
    rule.includeUnknown ? "Include unknown" : "",
    rule.absence ? "Absence" : "",
  ].filter(Boolean).join(" · ");
}

export function SharedScanResults({ share }: { share: SharedScanView }) {
  const [page, setPage] = useState(1);
  const [chart, setChart] = useState<string>();
  const [copyOpen, setCopyOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [copyError, setCopyError] = useState("");
  const definition = share.definition ?? EMPTY_SCAN;
  const results = useCustomScanResults([{ key: "shared", definition, page }], 0, share.id);
  const displayedPage = results.queries[0]?.page ?? page;

  async function copyScan() {
    if (!name.trim() || pending || !share.definition) return;
    setPending(true);
    setCopyError("");
    try {
      const response = await fetch(SHARED_SCAN_PATH, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ id: share.id, name }),
      });
      if (response.status === 409) {
        setCopyError("That name is in use or the saved list changed. Try a different name.");
        return;
      }
      if (!response.ok) throw Error();
      window.location.assign("/scanners/build");
    } catch {
      setCopyError("This scan could not be copied. Check that sharing is still active.");
    } finally {
      setPending(false);
    }
  }

  return <DashboardPanel title={share.name} action={share.definition ? <Button size="small" variant="outlined" onClick={() => {
    setName(share.name); setCopyError(""); setCopyOpen(true);
  }}>Save a copy</Button> : undefined}>
    <Stack spacing={1.5}>
      {share.definition ? <details>
        <summary>Shared filters</summary>
        <Typography variant="body2">
          {definition.match === "any" ? "Match any" : "Match all"} · Sort by {SCAN_METRICS[definition.sort.metric].label} ({definition.sort.direction})
        </Typography>
        <ul>{definition.rules.map((rule, index) => <li key={index}>{ruleSummary(rule)}</li>)}</ul>
        {definition.groups?.map((group, index) => <div key={index}>
          {group.match === "any" ? "Match any in group" : "Match all in group"}
          <ul>{group.rules.map((rule, ruleIndex) => <li key={ruleIndex}>{ruleSummary(rule)}</li>)}</ul>
        </div>)}
      </details> : <Typography variant="body2" color="text.secondary">These tickers matched the shared scan. The creator keeps the filters private.</Typography>}
      <CustomScanResults definition={definition} result={results.values.shared} error={results.error}
        page={displayedPage} onPage={results.showPrevious ? undefined : setPage}
        onChart={target => setChart(target.symbol)} />
    </Stack>
    <Drawer anchor="right" open={!!chart} onClose={() => setChart(undefined)}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: "min(720px, 90vw)" } } } }}>
      <Stack spacing={1} sx={{ p: 1 }}>
        <Button size="small" sx={{ alignSelf: "end" }} onClick={() => setChart(undefined)}>Close chart</Button>
        {chart ? <MarketChart key={chart} symbol={chart} viewWorkspace="scanner" viewId="shared-scan"
          compactMobile sx={{ height: { xs: 380, md: 520 } }} /> : null}
      </Stack>
    </Drawer>
    <Dialog open={copyOpen} onClose={() => { if (!pending) setCopyOpen(false); }} fullWidth maxWidth="xs">
      <DialogTitle>Save a copy</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ pt: 1 }}>
          <TextField autoFocus label="Scan name" value={name} onChange={event => setName(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 70 } }} />
          {copyError ? <Alert severity="error">{copyError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={pending} onClick={() => setCopyOpen(false)}>Cancel</Button>
        <Button variant="contained" disabled={pending || !name.trim()} onClick={() => void copyScan()}>Save scan</Button>
      </DialogActions>
    </Dialog>
  </DashboardPanel>;
}
